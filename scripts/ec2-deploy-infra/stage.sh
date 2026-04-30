#!/usr/bin/env bash
# /home/ubuntu/zavis-deploy/stage.sh
#
# Build and start the inactive blue-green slot without swapping production.
# If cloudflared is installed, this also opens a temporary review URL for
# team QA. Promotion is intentionally separate: run promote-staged.sh only
# after approval.

set -euo pipefail

LOCK_FILE="/tmp/zavis-stage.lock"
STATE_DIR="/home/ubuntu/zavis-deploy"
SHARED_DIR="/home/ubuntu/zavis-shared"
BLUE_DIR="/home/ubuntu/zavis-landing-blue"
GREEN_DIR="/home/ubuntu/zavis-landing-green"
ACTIVE_FILE="$STATE_DIR/active-slot"
STAGED_FILE="$STATE_DIR/staged-slot"
DEPLOY_LOG="/home/ubuntu/logs/stage.log"
BUILD_LOG="/tmp/zavis-stage-build.log"
TUNNEL_PM2="zavis-stage-tunnel"
MEMORY_FLOOR_MB=2048
SWAP_USED_CEILING_MB=3000

DEPLOY_REF="${DEPLOY_REF:-live}"
VERIFIED_OVERRIDES="${ZAVIS_VERIFIED_PROVIDER_IDS:-dha_01117,dha_03002,bella-rose-medical-center-l-l-c-dubai,kids-neuro-clinic-and-rehab-center-fz-llc-dubai}"

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

mem_available_mb() {
  awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo
}

swap_used_mb() {
  awk '/SwapTotal/{t=$2} /SwapFree/{f=$2} END{if(t>0) printf "%d", (t-f)/1024; else printf "0"}' /proc/meminfo
}

kill_orphan_build_workers() {
  local orphans
  orphans=$(ps -eo pid,ppid,cmd 2>/dev/null | awk '$2==1 && /next.dist.compiled.jest-worker/' | wc -l)
  if [ "$orphans" -gt 0 ]; then
    log "preflight: killing $orphans orphan jest-worker children" >&2
    pkill -9 -f 'next/dist/compiled/jest-worker' 2>/dev/null || true
    sleep 2
  fi
  ps -eo pid,ppid,cmd 2>/dev/null | awk '$2==1 && /next.dist.compiled.jest-worker/' | wc -l
}

checkout_ref() {
  local ref="$1"
  git fetch origin "+refs/heads/$ref:refs/remotes/origin/$ref" 2>/dev/null || git fetch origin
  if git rev-parse --verify --quiet "origin/$ref" >/dev/null; then
    git checkout -B "$ref" "origin/$ref"
  else
    git checkout "$ref"
  fi
}

get_cloudflared_bin() {
  if command -v cloudflared >/dev/null 2>&1; then
    command -v cloudflared
    return
  fi

  local bin_dir="$STATE_DIR/bin"
  local bin="$bin_dir/cloudflared"
  if [ -x "$bin" ]; then
    echo "$bin"
    return
  fi

  local arch
  arch=$(uname -m)
  case "$arch" in
    x86_64|amd64) arch="amd64" ;;
    aarch64|arm64) arch="arm64" ;;
    *) return 1 ;;
  esac

  mkdir -p "$bin_dir"
  log "cloudflared: installing user-local binary for linux-$arch"
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$arch" -o "$bin"
  chmod +x "$bin"
  echo "$bin"
}

exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  log "ERROR: another staging deploy is already running; exiting"
  exit 1
fi

ACTIVE_SLOT=$(cat "$ACTIVE_FILE" 2>/dev/null || echo "blue")
if [ "$ACTIVE_SLOT" = "blue" ]; then
  LIVE_DIR="$BLUE_DIR"; LIVE_PORT=3200; LIVE_PM2="zavis-blue"
  TARGET_DIR="$GREEN_DIR"; TARGET_PORT=3201; TARGET_PM2="zavis-green"; TARGET_SLOT="green"
elif [ "$ACTIVE_SLOT" = "green" ]; then
  LIVE_DIR="$GREEN_DIR"; LIVE_PORT=3201; LIVE_PM2="zavis-green"
  TARGET_DIR="$BLUE_DIR"; TARGET_PORT=3200; TARGET_PM2="zavis-blue"; TARGET_SLOT="blue"
else
  fail "active-slot has unexpected value: '$ACTIVE_SLOT'"
fi

log "===== STAGE-ONLY DEPLOY ====="
log "active_slot=$ACTIVE_SLOT target_slot=$TARGET_SLOT target_pm2=$TARGET_PM2 ref=$DEPLOY_REF"

idle_online=$(count_online "$TARGET_PM2")
if [ "$idle_online" != "0" ]; then
  log "preflight: stopping existing idle/staged slot $TARGET_PM2 ($idle_online workers online)"
  pm2 stop "$TARGET_PM2" 2>&1 | tail -3 | tee -a "$DEPLOY_LOG" || true
  sleep 2
fi
pm2 delete "$TARGET_PM2" 2>&1 | tail -3 | tee -a "$DEPLOY_LOG" || true

remaining_orphans=$(kill_orphan_build_workers)
if [ "$remaining_orphans" -gt 0 ]; then
  fail "preflight: $remaining_orphans orphan jest-worker children still alive after SIGKILL"
fi

mem_preflight=$(mem_available_mb)
log "preflight: MemAvailable=${mem_preflight}MB (floor=${MEMORY_FLOOR_MB}MB)"
if [ "$mem_preflight" -lt "$MEMORY_FLOOR_MB" ]; then
  fail "preflight: insufficient memory (${mem_preflight}MB < ${MEMORY_FLOOR_MB}MB)"
fi

swap_used=$(swap_used_mb)
log "preflight: swap_used=${swap_used}MB (ceiling=${SWAP_USED_CEILING_MB}MB)"
if [ "$swap_used" -gt "$SWAP_USED_CEILING_MB" ]; then
  fail "preflight: swap over-committed (${swap_used}MB > ${SWAP_USED_CEILING_MB})"
fi

live_health=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$LIVE_PORT/" || echo "000")
log "preflight: live slot direct health = HTTP $live_health"

log "--- build target $TARGET_SLOT ---"
cd "$TARGET_DIR"
git checkout -- .
git clean -fd -e node_modules -e .next
checkout_ref "$DEPLOY_REF"
TARGET_COMMIT=$(git rev-parse --short HEAD)
log "build: at commit $TARGET_COMMIT"

log "build: npm install"
npm install 2>&1 | tail -5 | tee -a "$DEPLOY_LOG"

rm -f "$TARGET_DIR/.env.local"
ln -sfn "$SHARED_DIR/.env.local" "$TARGET_DIR/.env.local"
rm -rf "$TARGET_DIR/data"
ln -sfn "$SHARED_DIR/data" "$TARGET_DIR/data"
rm -rf "$TARGET_DIR/public/reports"
ln -sfn "$SHARED_DIR/reports" "$TARGET_DIR/public/reports"
"$STATE_DIR/sync-report-images.sh" 2>&1 | tail -3 | tee -a "$DEPLOY_LOG" || true

log "build: next build with staged verification overrides"
rm -rf "$TARGET_DIR/.next"
mkdir -p "$TARGET_DIR/logs"
if ZAVIS_VERIFIED_PROVIDER_IDS="$VERIFIED_OVERRIDES" NODE_OPTIONS="--max-old-space-size=4096" npm run build > "$BUILD_LOG" 2>&1; then
  BUILD_ID=$(cat .next/BUILD_ID)
  log "build: SUCCESS (BUILD_ID=$BUILD_ID)"
else
  tail -20 "$BUILD_LOG" | tee -a "$DEPLOY_LOG"
  fail "build: FAILED — production slot untouched (see $BUILD_LOG)"
fi

remaining_orphans=$(kill_orphan_build_workers)
if [ "$remaining_orphans" -gt 0 ]; then
  fail "post-build: $remaining_orphans orphan jest-worker children still alive after cleanup"
fi

log "--- start staged target $TARGET_PM2 on port $TARGET_PORT ---"
ZAVIS_PM2_INSTANCES=1 ZAVIS_VERIFIED_PROVIDER_IDS="$VERIFIED_OVERRIDES" \
  pm2 start "$STATE_DIR/ecosystem.config.cjs" --only "$TARGET_PM2" 2>&1 | tail -6 | tee -a "$DEPLOY_LOG"
sleep 3

target_workers=$(count_online "$TARGET_PM2")
if [ "$target_workers" != "1" ]; then
  pm2 stop "$TARGET_PM2" 2>/dev/null || true
  pm2 delete "$TARGET_PM2" 2>/dev/null || true
  fail "start: worker count mismatch (expected 1, got $target_workers)"
fi
log "start: OK ($target_workers worker online)"

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
  pm2 stop "$TARGET_PM2" 2>/dev/null || true
  pm2 delete "$TARGET_PM2" 2>/dev/null || true
  fail "health: target not healthy on port $TARGET_PORT"
fi

cat > "$STAGED_FILE" <<STATE
slot=$TARGET_SLOT
port=$TARGET_PORT
pm2=$TARGET_PM2
dir=$TARGET_DIR
previous_slot=$ACTIVE_SLOT
previous_port=$LIVE_PORT
previous_pm2=$LIVE_PM2
previous_dir=$LIVE_DIR
commit=$TARGET_COMMIT
ref=$DEPLOY_REF
verified_overrides=$VERIFIED_OVERRIDES
STATE

log "staged-slot: wrote $STAGED_FILE"

CLOUDFLARED_BIN=$(get_cloudflared_bin || true)
if [ -n "$CLOUDFLARED_BIN" ]; then
  log "--- review tunnel: starting cloudflared quick tunnel ---"
  pm2 delete "$TUNNEL_PM2" 2>&1 | tail -3 | tee -a "$DEPLOY_LOG" || true
  pm2 start "$CLOUDFLARED_BIN" --name "$TUNNEL_PM2" -- \
    tunnel --url "http://127.0.0.1:$TARGET_PORT" --no-autoupdate 2>&1 | tail -8 | tee -a "$DEPLOY_LOG"
  sleep 8
  STAGING_URL=$(pm2 logs "$TUNNEL_PM2" --nostream --lines 120 2>/dev/null | grep -Eo 'https://[-a-zA-Z0-9.]+trycloudflare.com' | tail -1 || true)
  if [ -n "$STAGING_URL" ]; then
    log "STAGING_URL=$STAGING_URL"
  else
    log "review tunnel started but URL was not found in logs yet; run: pm2 logs $TUNNEL_PM2 --lines 120"
  fi
else
  log "cloudflared is not available and could not be installed; staged slot is healthy only on localhost:$TARGET_PORT"
fi

log "===== STAGE READY: production still on $ACTIVE_SLOT, target staged on $TARGET_SLOT commit=$TARGET_COMMIT ====="
