#!/usr/bin/env bash
# /home/ubuntu/zavis-deploy/rollback.sh
#
# Instant blue-green rollback with bounded overlap.
#
# Implements the rollback flow from docs/ops/blue-green-deploy-oom-runbook.md
# section 10. Same overlap budget as deploy — never allows
# "2 broken + 2 restored" = 4 workers.
#
#   Steady (pre):      curr=2, prev=0
#   Start prev:        curr=2, prev=1    (ZAVIS_PM2_INSTANCES=1 override)
#   Direct health:     curr=2, prev=1
#   Swap:              curr=2, prev=1    (Nginx upstream + symlink)
#   Edge health:       curr=2, prev=1    (Host: www.zavis.ai)
#   Write active:      curr=2, prev=1    (ONLY after edge health passes)
#   Drain:             curr=0, prev=1    (broken curr slot stopped)
#   Ramp:              curr=0, prev=2    (pm2 scale prev 2)
#   Save:              curr=0, prev=2
#
# Peak overlap is "2 curr + 1 prev" = 3 workers.

set -euo pipefail

# ───── Configuration ────────────────────────────────────────────────────
STATE_DIR="/home/ubuntu/zavis-deploy"
ACTIVE_FILE="$STATE_DIR/active-slot"
SYMLINK="/home/ubuntu/zavis-landing-active"
UPSTREAM_CONF="/etc/nginx/conf.d/zavis-upstream.conf"
ROLLBACK_LOG="/home/ubuntu/logs/rollback.log"
MEMORY_FLOOR_MB=8192

mkdir -p /home/ubuntu/logs

log() {
  local ts
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$ts] $*" | tee -a "$ROLLBACK_LOG"
}

fail() {
  log "FATAL: $*"
  exit 1
}

count_online() {
  local name="$1"
  pm2 jlist 2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(sum(1 for p in d if p['name']=='$name' and p['pm2_env']['status']=='online'))
"
}

mem_available_mb() {
  awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo
}

# ───── Determine slots ──────────────────────────────────────────────────
ACTIVE_SLOT=$(cat "$ACTIVE_FILE" 2>/dev/null || echo "blue")
if [ "$ACTIVE_SLOT" = "blue" ]; then
  PREV_SLOT="green"; PREV_PORT=3201; PREV_PM2="zavis-green"
  PREV_DIR="/home/ubuntu/zavis-landing-green"
  CURR_PM2="zavis-blue"; CURR_DIR="/home/ubuntu/zavis-landing-blue"; CURR_PORT=3200
else
  PREV_SLOT="blue"; PREV_PORT=3200; PREV_PM2="zavis-blue"
  PREV_DIR="/home/ubuntu/zavis-landing-blue"
  CURR_PM2="zavis-green"; CURR_DIR="/home/ubuntu/zavis-landing-green"; CURR_PORT=3201
fi

log "===== ROLLBACK (bounded overlap) ====="
log "current_active=$ACTIVE_SLOT rolling_to=$PREV_SLOT (port $PREV_PORT)"

# ───── Preflight ────────────────────────────────────────────────────────
# 1. Previous slot has a usable build on disk
if [ ! -f "$PREV_DIR/.next/prerender-manifest.json" ]; then
  fail "preflight: $PREV_SLOT has no valid build at $PREV_DIR/.next; cannot rollback"
fi

# 2. Memory floor (same as deploy)
mem_preflight=$(mem_available_mb)
log "preflight: MemAvailable=${mem_preflight}MB"
if [ "$mem_preflight" -lt "$MEMORY_FLOOR_MB" ]; then
  fail "preflight: insufficient memory for rollback (${mem_preflight}MB < ${MEMORY_FLOOR_MB}MB)"
fi

# 3. Previous slot should not already be running
prev_online=$(count_online "$PREV_PM2")
if [ "$prev_online" != "0" ]; then
  log "preflight: $PREV_PM2 has $prev_online workers online; stopping"
  pm2 stop "$PREV_PM2" 2>&1 | tail -3 | tee -a "$ROLLBACK_LOG" || true
  sleep 2
fi

log "preflight OK"

# ───── Start phase: previous slot at 1 worker ──────────────────────────
# Delete existing entries so pm2 start creates fresh ones with env override.
pm2 delete "$PREV_PM2" 2>&1 | tail -3 | tee -a "$ROLLBACK_LOG" || true

log "--- start: $PREV_PM2 with ZAVIS_PM2_INSTANCES=1 ---"
ZAVIS_PM2_INSTANCES=1 pm2 start "$STATE_DIR/ecosystem.config.cjs" --only "$PREV_PM2" 2>&1 | tail -5 | tee -a "$ROLLBACK_LOG"
sleep 3

prev_workers=$(count_online "$PREV_PM2")
if [ "$prev_workers" != "1" ]; then
  log "start: CRITICAL expected 1 worker, got $prev_workers"
  pm2 stop "$PREV_PM2" 2>/dev/null || true
  pm2 delete "$PREV_PM2" 2>/dev/null || true
  fail "start: worker count mismatch (expected 1, got $prev_workers)"
fi
log "start: OK (1 worker online)"

# Direct-port health check on previous slot
log "--- health check: direct port $PREV_PORT ---"
HEALTHY=false
for i in $(seq 1 15); do
  sleep 2
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PREV_PORT/" || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    HEALTHY=true
    log "health: $PREV_PM2 healthy after $((i*2))s (HTTP $HTTP_CODE)"
    break
  fi
done

if [ "$HEALTHY" != "true" ]; then
  pm2 stop "$PREV_PM2" 2>/dev/null || true
  pm2 delete "$PREV_PM2" 2>/dev/null || true
  fail "health: $PREV_PM2 failed direct health check after 30s"
fi

# ───── Swap phase ───────────────────────────────────────────────────────
# active-slot file is NOT updated here. It stays at the current (broken)
# slot until the edge health check passes below.
log "--- swap: nginx upstream to $PREV_SLOT ---"
cat > /tmp/zavis-upstream.conf <<UPSTREAM
upstream zavis_backend {
    server 127.0.0.1:$PREV_PORT;
}
UPSTREAM
sudo cp /tmp/zavis-upstream.conf "$UPSTREAM_CONF"
ln -sfn "$PREV_DIR" "$SYMLINK"

if ! sudo nginx -t 2>&1 | tee -a "$ROLLBACK_LOG"; then
  log "swap: nginx -t failed — reverting"
  cat > /tmp/zavis-upstream.conf <<UPSTREAM
upstream zavis_backend {
    server 127.0.0.1:$CURR_PORT;
}
UPSTREAM
  sudo cp /tmp/zavis-upstream.conf "$UPSTREAM_CONF"
  ln -sfn "$CURR_DIR" "$SYMLINK"
  pm2 stop "$PREV_PM2" 2>/dev/null || true
  pm2 delete "$PREV_PM2" 2>/dev/null || true
  fail "swap: nginx config rejected"
fi

sudo systemctl reload nginx 2>&1 | tee -a "$ROLLBACK_LOG"
log "swap: nginx reloaded"

# Post-swap edge health check with Host header
sleep 2
FINAL_HTTP=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: www.zavis.ai' 'http://localhost/' || echo "000")
if [ "$FINAL_HTTP" != "200" ]; then
  log "post-swap: edge health FAILED (HTTP $FINAL_HTTP) — reverting"
  cat > /tmp/zavis-upstream.conf <<UPSTREAM
upstream zavis_backend {
    server 127.0.0.1:$CURR_PORT;
}
UPSTREAM
  sudo cp /tmp/zavis-upstream.conf "$UPSTREAM_CONF"
  ln -sfn "$CURR_DIR" "$SYMLINK"
  sudo systemctl reload nginx 2>&1 | tee -a "$ROLLBACK_LOG"
  pm2 stop "$PREV_PM2" 2>/dev/null || true
  pm2 delete "$PREV_PM2" 2>/dev/null || true
  fail "post-swap: edge health check failed — rollback aborted"
fi
log "post-swap: edge health OK (HTTP $FINAL_HTTP)"

# ───── NOW update active-slot file (ONLY after edge health passes) ──────
echo "$PREV_SLOT" > "$ACTIVE_FILE"
log "active-slot: updated to $PREV_SLOT"

# ───── Drain phase: stop currently-broken slot ──────────────────────────
log "--- drain: stopping broken current slot $CURR_PM2 ---"
pm2 stop "$CURR_PM2" 2>&1 | tail -3 | tee -a "$ROLLBACK_LOG" || true
sleep 2

curr_workers=$(count_online "$CURR_PM2")
if [ "$curr_workers" != "0" ]; then
  fail "drain: $CURR_PM2 still has $curr_workers workers online — bounded-overlap violated"
fi
log "drain: $CURR_PM2 has 0 workers online"

# ───── Ramp phase: scale previous from 1 to 2 ──────────────────────────
log "--- ramp: scale $PREV_PM2 to 2 ---"
pm2 scale "$PREV_PM2" 2 2>&1 | tail -5 | tee -a "$ROLLBACK_LOG"
sleep 3

new_workers=$(count_online "$PREV_PM2")
if [ "$new_workers" != "2" ]; then
  log "ramp: CRITICAL expected 2 workers, got $new_workers"
  fail "ramp: scale to 2 did not produce 2 online workers"
fi
log "ramp: $PREV_PM2 has $new_workers workers online"

mem_after=$(mem_available_mb)
log "memory after ramp: ${mem_after}MB"

# ───── Save ─────────────────────────────────────────────────────────────
pm2 save 2>&1 | tail -3 | tee -a "$ROLLBACK_LOG"

log "===== ROLLBACK COMPLETE ====="
log "signals: active=$PREV_SLOT port=$PREV_PORT mem_preflight=${mem_preflight}MB mem_after=${mem_after}MB"
