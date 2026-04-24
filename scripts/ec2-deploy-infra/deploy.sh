#!/usr/bin/env bash
# /home/ubuntu/zavis-deploy/deploy.sh
#
# Blue-green deploy with bounded-overlap transition.
#
# Implements the state machine from docs/ops/blue-green-deploy-oom-runbook.md
# section 6:
#
#   Steady (pre):   live=2, idle=0
#   Build:          live=2, idle=0      (idle PM2 stopped during build)
#   Start new:      live=2, new=1       (ZAVIS_PM2_INSTANCES=1 override)
#   Swap:           live=2, new=1       (Nginx upstream + symlink)
#   Edge health:    live=2, new=1       (with Host: www.zavis.ai)
#   Write active:   live=2, new=1       (ONLY after edge health passes)
#   Drain:          live=0, new=1       (old slot stopped)
#   Ramp:           live=0, new=2       (pm2 scale new 2)
#   Save:           live=0, new=2
#   Sitemap hook:   live=0, new=2       (non-blocking post-success)
#
# Peak overlap is "2 old + 1 new" = 3 workers, never "2 + 2" = 4.
#
# Co-operates with the static provider sitemap generator at
# /home/ubuntu/zavis-deploy/sitemap-gen/generate-provider-sitemaps.mjs —
# a successful deploy re-runs the generator so any changes to gating
# logic or URL shape land in the static artifacts. The call is wrapped
# in flock -n and uses || true so a sitemap failure cannot fail the
# deploy.

set -euo pipefail

# ───── Configuration ────────────────────────────────────────────────────
LOCK_FILE="/tmp/zavis-deploy.lock"
STATE_DIR="/home/ubuntu/zavis-deploy"
SHARED_DIR="/home/ubuntu/zavis-shared"
BLUE_DIR="/home/ubuntu/zavis-landing-blue"
GREEN_DIR="/home/ubuntu/zavis-landing-green"
ACTIVE_FILE="$STATE_DIR/active-slot"
SYMLINK="/home/ubuntu/zavis-landing-active"
UPSTREAM_CONF="/etc/nginx/conf.d/zavis-upstream.conf"
DEPLOY_LOG="/home/ubuntu/logs/deploy.log"
BUILD_LOG="/tmp/zavis-build.log"
SITEMAP_LOCK="/tmp/zavis-sitemap-gen.lock"
SITEMAP_GEN="/home/ubuntu/zavis-deploy/sitemap-gen/generate-provider-sitemaps.mjs"
SITEMAP_LOG="/home/ubuntu/logs/sitemap-generation.log"
MEMORY_FLOOR_MB=2048    # Lightsail box has 7.6 GB total; floor = 2 GB free pre-build
SWAP_USED_CEILING_MB=3000  # abort if swap heavily committed

mkdir -p /home/ubuntu/logs

# ───── Logging helpers ──────────────────────────────────────────────────
log() {
  local ts
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$ts] $*" | tee -a "$DEPLOY_LOG"
}

fail() {
  log "FATAL: $*"
  exit 1
}

# ───── Concurrency lock (rejects overlapping deploys) ──────────────────
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  log "ERROR: another deploy is already running; exiting"
  exit 1
fi

# Helper: count online PM2 workers for a given app name
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

swap_used_mb() {
  awk '/SwapTotal/{t=$2} /SwapFree/{f=$2} END{if(t>0) printf "%d", (t-f)/1024; else printf "0"}' /proc/meminfo
}

# Helper: kill orphaned next-build jest-worker children (PPID=1)
# Returns number killed.
kill_orphan_build_workers() {
  local orphans
  orphans=$(ps -eo pid,ppid,cmd 2>/dev/null | awk '$2==1 && /next.dist.compiled.jest-worker/' | wc -l)
  if [ "$orphans" -gt 0 ]; then
    log "preflight: killing $orphans orphan jest-worker children"
    pkill -9 -f 'next/dist/compiled/jest-worker' 2>/dev/null || true
    sleep 2
  fi
  # Report remaining after kill
  ps -eo pid,ppid,cmd 2>/dev/null | awk '$2==1 && /next.dist.compiled.jest-worker/' | wc -l
}

# ───── Determine slots ──────────────────────────────────────────────────
ACTIVE_SLOT=$(cat "$ACTIVE_FILE" 2>/dev/null || echo "blue")
if [ "$ACTIVE_SLOT" = "blue" ]; then
  LIVE_DIR="$BLUE_DIR"; LIVE_PORT=3200; LIVE_PM2="zavis-blue"
  TARGET_DIR="$GREEN_DIR"; TARGET_PORT=3201; TARGET_PM2="zavis-green"; TARGET_SLOT="green"
else
  LIVE_DIR="$GREEN_DIR"; LIVE_PORT=3201; LIVE_PM2="zavis-green"
  TARGET_DIR="$BLUE_DIR"; TARGET_PORT=3200; TARGET_PM2="zavis-blue"; TARGET_SLOT="blue"
fi

log "===== BLUE-GREEN DEPLOY (bounded overlap) ====="
log "start_time=$(date -u)"
log "active_slot=$ACTIVE_SLOT live_pm2=$LIVE_PM2 target_pm2=$TARGET_PM2 target_slot=$TARGET_SLOT"

# ───── PREFLIGHT CHECKS (runbook §7) ────────────────────────────────────
log "--- preflight ---"

# 1. active-slot sanity
if [ "$ACTIVE_SLOT" != "blue" ] && [ "$ACTIVE_SLOT" != "green" ]; then
  fail "preflight: active-slot has unexpected value: '$ACTIVE_SLOT'"
fi

# 2. idle slot stopped (if not, stop it — but don't delete yet)
idle_online=$(count_online "$TARGET_PM2")
if [ "$idle_online" != "0" ]; then
  log "preflight: idle slot $TARGET_PM2 has $idle_online online workers; stopping"
  pm2 stop "$TARGET_PM2" 2>&1 | tail -3 | tee -a "$DEPLOY_LOG" || true
  sleep 2
  idle_online=$(count_online "$TARGET_PM2")
  if [ "$idle_online" != "0" ]; then
    fail "preflight: idle slot refused to stop ($idle_online workers still online)"
  fi
fi

# 3. orphan next-build workers
remaining_orphans=$(kill_orphan_build_workers)
if [ "$remaining_orphans" -gt 0 ]; then
  fail "preflight: $remaining_orphans orphan jest-worker children still alive after SIGKILL"
fi

# 4. MemAvailable floor
mem_preflight=$(mem_available_mb)
log "preflight: MemAvailable=${mem_preflight}MB (floor=${MEMORY_FLOOR_MB}MB)"
if [ "$mem_preflight" -lt "$MEMORY_FLOOR_MB" ]; then
  fail "preflight: insufficient memory (${mem_preflight}MB < ${MEMORY_FLOOR_MB}MB)"
fi

# 5. swap not critically committed
swap_used=$(swap_used_mb)
log "preflight: swap_used=${swap_used}MB (ceiling=${SWAP_USED_CEILING_MB}MB)"
if [ "$swap_used" -gt "$SWAP_USED_CEILING_MB" ]; then
  fail "preflight: swap over-committed (${swap_used}MB > ${SWAP_USED_CEILING_MB}MB); investigate before retry"
fi

# 6. current live slot actually serving
live_health=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$LIVE_PORT/" || echo "000")
log "preflight: live slot direct health = HTTP $live_health"
# Not fatal — deploy can still proceed if live is unhealthy (we're replacing it)

log "preflight OK"

# ───── Build phase ──────────────────────────────────────────────────────
# We delete existing target PM2 entries so the subsequent `pm2 start` with
# ZAVIS_PM2_INSTANCES=1 creates fresh entries at the correct count. On PM2
# v6.0.14, reusing stopped entries ignores the env-var override and
# recreates whatever instance count was saved. Deleting forces a fresh
# read of the ecosystem file with the current env.
log "--- build phase ---"
pm2 delete "$TARGET_PM2" 2>&1 | tail -3 | tee -a "$DEPLOY_LOG" || true

log "build: git pull origin live into $TARGET_DIR"
cd "$TARGET_DIR"
git checkout -- .
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "live" ]; then
  git fetch origin live
  git clean -fd .vscode/ 2>/dev/null || true
  git checkout live
  git branch --set-upstream-to=origin/live live
fi
git pull origin live
TARGET_COMMIT=$(git rev-parse --short HEAD)
log "build: at commit $TARGET_COMMIT"

log "build: npm install"
npm install 2>&1 | tail -5 | tee -a "$DEPLOY_LOG"

# Shared-resource symlinks
rm -f "$TARGET_DIR/.env.local"
ln -sfn "$SHARED_DIR/.env.local" "$TARGET_DIR/.env.local"
rm -rf "$TARGET_DIR/data"
ln -sfn "$SHARED_DIR/data" "$TARGET_DIR/data"
rm -rf "$TARGET_DIR/public/reports"
ln -sfn "$SHARED_DIR/reports" "$TARGET_DIR/public/reports"
"$STATE_DIR/sync-report-images.sh" 2>&1 | tail -3 | tee -a "$DEPLOY_LOG" || true

log "build: next build (~4-5 min) — output in $BUILD_LOG"
rm -rf "$TARGET_DIR/.next"
mkdir -p "$TARGET_DIR/logs"
BUILD_WORKER_COUNT="${NEXT_PRIVATE_BUILD_WORKER_COUNT:-1}"
log "build: NEXT_PRIVATE_BUILD_WORKER_COUNT=$BUILD_WORKER_COUNT"
if NODE_OPTIONS="--max-old-space-size=4096" NEXT_PRIVATE_BUILD_WORKER_COUNT="$BUILD_WORKER_COUNT" npm run build > "$BUILD_LOG" 2>&1; then
  BUILD_ID=$(cat .next/BUILD_ID)
  log "build: SUCCESS (BUILD_ID=$BUILD_ID)"
else
  tail -20 "$BUILD_LOG" | tee -a "$DEPLOY_LOG"
  fail "build: FAILED — live site unaffected (see $BUILD_LOG for details)"
fi

# Post-build orphan sweep (zombie jest-workers after a completed build)
remaining_orphans=$(kill_orphan_build_workers)
if [ "$remaining_orphans" -gt 0 ]; then
  fail "post-build: $remaining_orphans orphan jest-worker children still alive after cleanup"
fi

# Memory check before bringing target up
mem_before_start=$(mem_available_mb)
log "memory before target start: ${mem_before_start}MB"
if [ "$mem_before_start" -lt "$MEMORY_FLOOR_MB" ]; then
  fail "memory: insufficient headroom before target start (${mem_before_start}MB)"
fi

# ───── Start phase: target at 1 worker ─────────────────────────────────
log "--- start phase: $TARGET_PM2 with ZAVIS_PM2_INSTANCES=1 ---"
ZAVIS_PM2_INSTANCES=1 pm2 start "$STATE_DIR/ecosystem.config.cjs" --only "$TARGET_PM2" 2>&1 | tail -6 | tee -a "$DEPLOY_LOG"
sleep 3

target_workers=$(count_online "$TARGET_PM2")
if [ "$target_workers" != "1" ]; then
  log "start: CRITICAL expected 1 worker, got $target_workers — cleaning up and aborting"
  pm2 stop "$TARGET_PM2" 2>/dev/null || true
  pm2 delete "$TARGET_PM2" 2>/dev/null || true
  fail "start: worker count mismatch (expected 1, got $target_workers)"
fi
log "start: OK ($target_workers worker online)"

# Direct-port health check on new slot
log "--- health check: direct port $TARGET_PORT ---"
HEALTHY=false
for i in $(seq 1 30); do
  sleep 2
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$TARGET_PORT/" || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    HEALTHY=true
    log "health: target healthy after $((i*2))s (HTTP $HTTP_CODE)"
    break
  fi
done

if [ "$HEALTHY" != "true" ]; then
  log "health: target failed direct health check after 60s"
  pm2 stop "$TARGET_PM2" 2>/dev/null || true
  pm2 delete "$TARGET_PM2" 2>/dev/null || true
  fail "health: target not healthy on port $TARGET_PORT"
fi

# Memory measurement at peak overlap
mem_peak=$(mem_available_mb)
log "memory at peak overlap (2 live + 1 new = 3 workers): ${mem_peak}MB"
if [ "$mem_peak" -lt 4096 ]; then
  log "memory: WARN peak is below 4GB — deploy will continue but flag for investigation"
fi

# ───── Swap phase: Nginx upstream + symlink ─────────────────────────────
# NOTE: active-slot file is NOT updated here. It stays at the OLD slot
# until the edge health check passes below. If the edge health check
# fails, rollback can read active-slot and believe the old slot is still
# live (which is true — Nginx and active-slot are both pointing back to
# it via the revert path below).
log "--- swap phase: Nginx upstream to $TARGET_SLOT (port $TARGET_PORT) ---"
cat > /tmp/zavis-upstream.conf <<UPSTREAM
upstream zavis_backend {
    server 127.0.0.1:$TARGET_PORT;
}
UPSTREAM
sudo cp /tmp/zavis-upstream.conf "$UPSTREAM_CONF"
ln -sfn "$TARGET_DIR" "$SYMLINK"

if ! sudo nginx -t 2>&1 | tee -a "$DEPLOY_LOG"; then
  log "swap: nginx -t FAILED — reverting"
  cat > /tmp/zavis-upstream.conf <<UPSTREAM
upstream zavis_backend {
    server 127.0.0.1:$LIVE_PORT;
}
UPSTREAM
  sudo cp /tmp/zavis-upstream.conf "$UPSTREAM_CONF"
  ln -sfn "$LIVE_DIR" "$SYMLINK"
  pm2 stop "$TARGET_PM2" 2>/dev/null || true
  pm2 delete "$TARGET_PM2" 2>/dev/null || true
  fail "swap: nginx config rejected"
fi

sudo systemctl reload nginx 2>&1 | tee -a "$DEPLOY_LOG"
log "swap: nginx reloaded"

# Post-swap edge health check with Host header
log "--- post-swap: edge health check ---"
sleep 2
FINAL_HTTP=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: www.zavis.ai' 'http://localhost/' || echo "000")
if [ "$FINAL_HTTP" != "200" ]; then
  log "post-swap: edge health FAILED (HTTP $FINAL_HTTP) — reverting nginx + symlink"
  cat > /tmp/zavis-upstream.conf <<UPSTREAM
upstream zavis_backend {
    server 127.0.0.1:$LIVE_PORT;
}
UPSTREAM
  sudo cp /tmp/zavis-upstream.conf "$UPSTREAM_CONF"
  ln -sfn "$LIVE_DIR" "$SYMLINK"
  sudo systemctl reload nginx 2>&1 | tee -a "$DEPLOY_LOG"
  pm2 stop "$TARGET_PM2" 2>/dev/null || true
  pm2 delete "$TARGET_PM2" 2>/dev/null || true
  fail "post-swap: edge health check failed"
fi
log "post-swap: edge health OK (HTTP $FINAL_HTTP)"

# ───── NOW update active-slot file (ONLY after edge health passes) ──────
echo "$TARGET_SLOT" > "$ACTIVE_FILE"
log "active-slot: updated to $TARGET_SLOT"

# ───── Drain phase: stop old live slot ──────────────────────────────────
log "--- drain: stopping old live $LIVE_PM2 ---"
pm2 stop "$LIVE_PM2" 2>&1 | tail -3 | tee -a "$DEPLOY_LOG" || true
sleep 2

old_workers=$(count_online "$LIVE_PM2")
if [ "$old_workers" != "0" ]; then
  # Per runbook §11.2 this is a required failure condition
  fail "drain: $LIVE_PM2 still has $old_workers workers online after stop — bounded-overlap violated"
fi
log "drain: $LIVE_PM2 has 0 workers online"

# ───── Ramp phase: scale new live from 1 to 2 ───────────────────────────
log "--- ramp: scale $TARGET_PM2 to 2 ---"
pm2 scale "$TARGET_PM2" 2 2>&1 | tail -5 | tee -a "$DEPLOY_LOG"
sleep 3

new_workers=$(count_online "$TARGET_PM2")
if [ "$new_workers" != "2" ]; then
  # Per runbook §11.2: "new live slot fails to scale to expected count"
  # Fail loudly — site is still serving from the 1 worker but steady state
  # is not reached.
  log "ramp: CRITICAL expected 2 workers, got $new_workers"
  fail "ramp: scale to 2 did not produce 2 online workers"
fi
log "ramp: $TARGET_PM2 has $new_workers workers online"

# Post-ramp edge health
post_ramp_health=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: www.zavis.ai' 'http://localhost/' || echo "000")
log "post-ramp edge health: HTTP $post_ramp_health"

mem_after=$(mem_available_mb)
log "memory after ramp: ${mem_after}MB"

# ───── Save PM2 state ───────────────────────────────────────────────────
pm2 save 2>&1 | tail -3 | tee -a "$DEPLOY_LOG"

# ───── Sitemap hook (non-blocking, post-success) ────────────────────────
# Per docs/seo/static-provider-sitemap-architecture-spec.md §10.1:
# "post-deploy invocation after a successful blue-green swap is mandatory".
# flock -n prevents racing the hourly cron. || true means sitemap failure
# never fails the deploy.
log "--- sitemap: regenerating static provider sitemaps ---"
if flock -n "$SITEMAP_LOCK" /usr/bin/node "$SITEMAP_GEN" >> "$SITEMAP_LOG" 2>&1; then
  log "sitemap: regeneration completed"
else
  log "sitemap: regeneration skipped or failed (non-blocking)"
fi

# ───── Done ─────────────────────────────────────────────────────────────
log "===== DEPLOY COMPLETE ====="
log "signals: active=$TARGET_SLOT port=$TARGET_PORT commit=$TARGET_COMMIT workers_old=$old_workers workers_new=$new_workers mem_preflight=${mem_preflight}MB mem_peak=${mem_peak}MB mem_after=${mem_after}MB"
