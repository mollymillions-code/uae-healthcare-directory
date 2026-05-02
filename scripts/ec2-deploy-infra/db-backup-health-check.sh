#!/usr/bin/env bash
# Check freshness and minimum viability of local/remote DB backup state.
set -euo pipefail

STATE_DIR=${STATE_DIR:-/home/ubuntu/zavis-deploy}
ENV_FILE=${DB_BACKUP_ENV_FILE:-$STATE_DIR/db-backup.env}
STATUS_FILE=${DB_BACKUP_HEALTH_STATUS_FILE:-$STATE_DIR/db-backup-health.json}

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a
  . "$ENV_FILE"
  set +a
fi

DB_NAME=${DB_NAME:-zavis_landing}
BACKUP_DIR=${DB_BACKUP_DIR:-/var/backups/zavis-landing}
MAX_AGE_HOURS=${DB_BACKUP_MAX_AGE_HOURS:-30}
MIN_SIZE_BYTES=${DB_BACKUP_MIN_SIZE_BYTES:-52428800}
REMOTE_REQUIRED=${DB_BACKUP_REMOTE_REQUIRED:-0}
BACKUP_STATUS_FILE=${DB_BACKUP_STATUS_FILE:-$STATE_DIR/db-backup-status.json}
RESTORE_STATUS_FILE=${DB_RESTORE_TEST_STATUS_FILE:-$STATE_DIR/db-restore-smoke-test-status.json}
ALERT_WEBHOOK_URL=${DB_BACKUP_ALERT_WEBHOOK_URL:-}

mkdir -p "$STATE_DIR"

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

send_alert_if_configured() {
  local message="$1"
  [ -n "$ALERT_WEBHOOK_URL" ] || return 0
  curl -fsS -X POST "$ALERT_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    --data "{\"text\":\"$(json_escape "$message")\"}" >/dev/null 2>&1 || true
}

write_status() {
  local ok="$1" latest="${2:-}" age_hours="${3:-0}" size_bytes="${4:-0}" message="${5:-}"
  local tmp
  tmp="${STATUS_FILE}.tmp"
  cat > "$tmp" <<JSON
{
  "ok": $ok,
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database": "$(json_escape "$DB_NAME")",
  "latestLocalDump": "$(json_escape "$latest")",
  "latestAgeHours": $age_hours,
  "latestSizeBytes": $size_bytes,
  "message": "$(json_escape "$message")"
}
JSON
  mv "$tmp" "$STATUS_FILE"
}

fail_health() {
  local latest="${1:-}" age="${2:-0}" size="${3:-0}" message="$4"
  write_status false "$latest" "$age" "$size" "$message"
  send_alert_if_configured "Zavis DB backup health failed: $message"
  printf '[%s] FATAL: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$message"
  exit 1
}

LATEST=$(find "$BACKUP_DIR" -maxdepth 1 -type f -name "${DB_NAME}_*.dump" -printf '%T@ %s %p\n' \
  | sort -rn \
  | head -1 || true)

[ -n "$LATEST" ] || fail_health "" 0 0 "no local dump found"

LATEST_EPOCH=${LATEST%% *}
REST=${LATEST#* }
SIZE_BYTES=${REST%% *}
LATEST_FILE=${REST#* }
NOW_EPOCH=$(date +%s)
LATEST_EPOCH_INT=${LATEST_EPOCH%.*}
AGE_HOURS=$(( (NOW_EPOCH - LATEST_EPOCH_INT) / 3600 ))

[ "$SIZE_BYTES" -ge "$MIN_SIZE_BYTES" ] || fail_health "$LATEST_FILE" "$AGE_HOURS" "$SIZE_BYTES" "latest dump is too small"
[ "$AGE_HOURS" -le "$MAX_AGE_HOURS" ] || fail_health "$LATEST_FILE" "$AGE_HOURS" "$SIZE_BYTES" "latest dump is too old"
[ -f "${LATEST_FILE}.sha256" ] || fail_health "$LATEST_FILE" "$AGE_HOURS" "$SIZE_BYTES" "latest dump checksum file missing"
sha256sum -c "${LATEST_FILE}.sha256" >/dev/null || fail_health "$LATEST_FILE" "$AGE_HOURS" "$SIZE_BYTES" "latest dump checksum failed"

if [ "$REMOTE_REQUIRED" = "1" ]; then
  [ -f "$BACKUP_STATUS_FILE" ] || fail_health "$LATEST_FILE" "$AGE_HOURS" "$SIZE_BYTES" "backup status file missing"
  grep -q '"ok": true' "$BACKUP_STATUS_FILE" || fail_health "$LATEST_FILE" "$AGE_HOURS" "$SIZE_BYTES" "last backup status is not ok"
  grep -q '"remoteUri": "s3://' "$BACKUP_STATUS_FILE" || fail_health "$LATEST_FILE" "$AGE_HOURS" "$SIZE_BYTES" "remote backup URI missing"
fi

if [ -f "$RESTORE_STATUS_FILE" ]; then
  grep -q '"ok": true' "$RESTORE_STATUS_FILE" || fail_health "$LATEST_FILE" "$AGE_HOURS" "$SIZE_BYTES" "last restore smoke test is not ok"
fi

write_status true "$LATEST_FILE" "$AGE_HOURS" "$SIZE_BYTES" "backup health OK"
printf '[%s] backup health OK: %s age=%sh size=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$LATEST_FILE" "$AGE_HOURS" "$SIZE_BYTES"
