#!/usr/bin/env bash
# /home/ubuntu/zavis-deploy/promote-staged.sh
#
# Promote the slot prepared by stage.sh. This is the explicit approval gate:
# stage.sh builds/starts/reviews; this script swaps production only after QA.

set -euo pipefail

LOCK_FILE="/tmp/zavis-promote.lock"
STATE_DIR="/home/ubuntu/zavis-deploy"
SHARED_DIR="/home/ubuntu/zavis-shared"
ACTIVE_FILE="$STATE_DIR/active-slot"
STAGED_FILE="$STATE_DIR/staged-slot"
SYMLINK="/home/ubuntu/zavis-landing-active"
UPSTREAM_CONF="/etc/nginx/conf.d/zavis-upstream.conf"
DEPLOY_LOG="/home/ubuntu/logs/promote-staged.log"
SITEMAP_LOCK="/tmp/zavis-sitemap-gen.lock"
SITEMAP_GEN="/home/ubuntu/zavis-deploy/sitemap-gen/generate-provider-sitemaps.mjs"
SITEMAP_LOG="/home/ubuntu/logs/sitemap-generation.log"
TUNNEL_PM2="zavis-stage-tunnel"
VERIFICATION_MIGRATION="scripts/db/migrations/2026-04-30-provider-verification-badges.sql"

mkdir -p /home/ubuntu/logs

log() {
  local ts
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$ts] $*" | tee -a "$DEPLOY_LOG"
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

apply_sql_migration() {
  local app_dir="$1"
  local migration="$app_dir/$VERIFICATION_MIGRATION"
  if [ ! -f "$migration" ]; then
    log "migration: $VERIFICATION_MIGRATION not present; skipping"
    return
  fi

  log "migration: applying $VERIFICATION_MIGRATION"
  ENV_FILE="$SHARED_DIR/.env.local" MIGRATION_FILE="$migration" node <<'NODE'
const fs = require("fs");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({ path: process.env.ENV_FILE });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = fs.readFileSync(process.env.MIGRATION_FILE, "utf8");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
NODE
  log "migration: complete"
}

exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  log "ERROR: another promotion is already running; exiting"
  exit 1
fi

if [ ! -f "$STAGED_FILE" ]; then
  fail "no staged slot file found at $STAGED_FILE; run stage.sh first"
fi

# shellcheck disable=SC1090
source "$STAGED_FILE"

ACTIVE_SLOT=$(cat "$ACTIVE_FILE" 2>/dev/null || echo "blue")
if [ "$ACTIVE_SLOT" != "$previous_slot" ]; then
  fail "active slot changed since staging (expected $previous_slot, got $ACTIVE_SLOT); restage before promoting"
fi

log "===== PROMOTE STAGED SLOT ====="
log "promoting slot=$slot port=$port commit=$commit previous_slot=$previous_slot"

target_workers=$(count_online "$pm2")
if [ "$target_workers" != "1" ]; then
  fail "staged target $pm2 must have exactly 1 online worker before promotion; found $target_workers"
fi

HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$port/" || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  fail "staged target health failed on port $port (HTTP $HTTP_CODE)"
fi

apply_sql_migration "$dir"

# Clear any stage-only verification overrides now that the DB migration is applied.
log "target: restarting $pm2 without stage-only verification overrides"
ZAVIS_VERIFIED_PROVIDER_IDS="" pm2 restart "$pm2" --update-env 2>&1 | tail -5 | tee -a "$DEPLOY_LOG"
sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$port/" || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  fail "target health failed after env cleanup on port $port (HTTP $HTTP_CODE)"
fi

log "--- swap: Nginx upstream to $slot (port $port) ---"
cat > /tmp/zavis-upstream.conf <<UPSTREAM
upstream zavis_backend {
    server 127.0.0.1:$port;
}
UPSTREAM
sudo cp /tmp/zavis-upstream.conf "$UPSTREAM_CONF"
ln -sfn "$dir" "$SYMLINK"

if ! sudo nginx -t 2>&1 | tee -a "$DEPLOY_LOG"; then
  log "swap: nginx -t FAILED; reverting to $previous_slot"
  cat > /tmp/zavis-upstream.conf <<UPSTREAM
upstream zavis_backend {
    server 127.0.0.1:$previous_port;
}
UPSTREAM
  sudo cp /tmp/zavis-upstream.conf "$UPSTREAM_CONF"
  ln -sfn "$previous_dir" "$SYMLINK"
  fail "swap: nginx config rejected"
fi

sudo systemctl reload nginx 2>&1 | tee -a "$DEPLOY_LOG"
log "swap: nginx reloaded"

sleep 2
FINAL_HTTP=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: www.zavis.ai' 'http://localhost/' || echo "000")
if [ "$FINAL_HTTP" != "200" ]; then
  log "post-swap: edge health FAILED (HTTP $FINAL_HTTP); reverting"
  cat > /tmp/zavis-upstream.conf <<UPSTREAM
upstream zavis_backend {
    server 127.0.0.1:$previous_port;
}
UPSTREAM
  sudo cp /tmp/zavis-upstream.conf "$UPSTREAM_CONF"
  ln -sfn "$previous_dir" "$SYMLINK"
  sudo systemctl reload nginx 2>&1 | tee -a "$DEPLOY_LOG"
  fail "post-swap: edge health check failed"
fi
log "post-swap: edge health OK (HTTP $FINAL_HTTP)"

echo "$slot" > "$ACTIVE_FILE"
log "active-slot: updated to $slot"

log "--- drain: stopping old live $previous_pm2 ---"
pm2 stop "$previous_pm2" 2>&1 | tail -3 | tee -a "$DEPLOY_LOG" || true
sleep 2

old_workers=$(count_online "$previous_pm2")
if [ "$old_workers" != "0" ]; then
  fail "drain: $previous_pm2 still has $old_workers workers online after stop"
fi
log "drain: $previous_pm2 has 0 workers online"

log "--- ramp: scale $pm2 to 2 ---"
pm2 scale "$pm2" 2 2>&1 | tail -5 | tee -a "$DEPLOY_LOG"
sleep 3

new_workers=$(count_online "$pm2")
if [ "$new_workers" != "2" ]; then
  fail "ramp: expected 2 workers for $pm2, got $new_workers"
fi
log "ramp: $pm2 has $new_workers workers online"

post_ramp_health=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: www.zavis.ai' 'http://localhost/' || echo "000")
log "post-ramp edge health: HTTP $post_ramp_health"

pm2 delete "$TUNNEL_PM2" 2>&1 | tail -3 | tee -a "$DEPLOY_LOG" || true
pm2 save 2>&1 | tail -3 | tee -a "$DEPLOY_LOG"
rm -f "$STAGED_FILE"

log "--- sitemap: regenerating static provider sitemaps ---"
if flock -n "$SITEMAP_LOCK" /usr/bin/node "$SITEMAP_GEN" >> "$SITEMAP_LOG" 2>&1; then
  log "sitemap: regeneration completed"
else
  log "sitemap: regeneration skipped or failed (non-blocking)"
fi

log "===== PROMOTION COMPLETE: active=$slot commit=$commit workers_old=$old_workers workers_new=$new_workers ====="
