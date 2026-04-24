#!/usr/bin/env bash
# Restore the newest local dump into a throwaway database and drop it.
# This validates that backup files are not just present, but restorable.
set -euo pipefail

STATE_DIR=${STATE_DIR:-/home/ubuntu/zavis-deploy}
ENV_FILE=${DB_BACKUP_ENV_FILE:-$STATE_DIR/db-backup.env}
LOG_DIR=${LOG_DIR:-/home/ubuntu/logs}
STATUS_FILE=${DB_RESTORE_TEST_STATUS_FILE:-$STATE_DIR/db-restore-smoke-test-status.json}

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a
  . "$ENV_FILE"
  set +a
fi

DB_NAME=${DB_NAME:-zavis_landing}
BACKUP_DIR=${DB_BACKUP_DIR:-/var/backups/zavis-landing}
TEST_DB="${DB_NAME}_restoretest_$(date -u +%Y%m%d_%H%M%S)"

mkdir -p "$LOG_DIR" "$STATE_DIR"

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

run_low_priority() {
  if command -v ionice >/dev/null; then
    ionice -c2 -n7 nice -n 10 "$@"
  else
    nice -n 10 "$@"
  fi
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

write_status() {
  local ok="$1" dump_file="${2:-}" table_count="${3:-0}" provider_count="${4:-0}" error="${5:-}"
  local tmp
  tmp="${STATUS_FILE}.tmp"
  cat > "$tmp" <<JSON
{
  "ok": $ok,
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database": "$(json_escape "$DB_NAME")",
  "testDatabase": "$(json_escape "$TEST_DB")",
  "dumpFile": "$(json_escape "$dump_file")",
  "tableCount": $table_count,
  "providerCount": $provider_count,
  "error": "$(json_escape "$error")"
}
JSON
  mv "$tmp" "$STATUS_FILE"
}

drop_test_db() {
  sudo -u postgres dropdb --if-exists "$TEST_DB" >/dev/null 2>&1 || true
}

trap drop_test_db EXIT

LATEST_DUMP=$(find "$BACKUP_DIR" -maxdepth 1 -type f -name "${DB_NAME}_*.dump" -printf '%T@ %p\n' \
  | sort -rn \
  | head -1 \
  | cut -d' ' -f2-)

if [ -z "$LATEST_DUMP" ] || [ ! -f "$LATEST_DUMP" ]; then
  write_status false "" 0 0 "no local dump found"
  log "FATAL: no local dump found in $BACKUP_DIR"
  exit 1
fi

log "restore smoke test: using $LATEST_DUMP"
drop_test_db
sudo -u postgres createdb "$TEST_DB"

if ! run_low_priority sudo -u postgres pg_restore --no-owner --no-privileges -d "$TEST_DB" < "$LATEST_DUMP"; then
  write_status false "$LATEST_DUMP" 0 0 "pg_restore failed"
  log "FATAL: pg_restore failed for $LATEST_DUMP"
  exit 1
fi

TABLE_COUNT=$(sudo -u postgres psql -At -d "$TEST_DB" -c "select count(*) from information_schema.tables where table_schema = 'public';")
PROVIDER_COUNT=$(sudo -u postgres psql -At -d "$TEST_DB" -c "select case when to_regclass('public.providers') is null then 0 else (select count(*) from public.providers) end;")

write_status true "$LATEST_DUMP" "$TABLE_COUNT" "$PROVIDER_COUNT" ""
log "restore smoke test OK: tables=$TABLE_COUNT providers=$PROVIDER_COUNT"
