#!/usr/bin/env bash
# Nightly pg_dump of zavis_landing with local retention plus optional
# client-side encrypted off-box upload.
set -euo pipefail

STATE_DIR=${STATE_DIR:-/home/ubuntu/zavis-deploy}
ENV_FILE=${DB_BACKUP_ENV_FILE:-$STATE_DIR/db-backup.env}
LOG_DIR=${LOG_DIR:-/home/ubuntu/logs}
STATUS_FILE=${DB_BACKUP_STATUS_FILE:-$STATE_DIR/db-backup-status.json}

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a
  . "$ENV_FILE"
  set +a
fi

DB_NAME=${DB_NAME:-zavis_landing}
BACKUP_DIR=${DB_BACKUP_DIR:-/var/backups/zavis-landing}
LOCAL_RETENTION=${DB_BACKUP_LOCAL_RETENTION:-14}
REMOTE_ENABLED=${DB_BACKUP_REMOTE_ENABLED:-0}
REMOTE_PREFIX=${DB_BACKUP_REMOTE_PREFIX:-database-backups/zavis-landing}
REMOTE_RETENTION=${DB_BACKUP_REMOTE_RETENTION:-30}
SOURCE_ENV=${DB_BACKUP_SOURCE_ENV:-/home/ubuntu/zavis-shared/.env.local}
KEY_FILE=${DB_BACKUP_ENCRYPTION_KEY_FILE:-$STATE_DIR/db-backup-encryption.key}

mkdir -p "$BACKUP_DIR" "$LOG_DIR" "$STATE_DIR"

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
  local ok="$1" dump_file="${2:-}" encrypted_file="${3:-}" remote_uri="${4:-}" error="${5:-}"
  local tmp
  tmp="${STATUS_FILE}.tmp"
  cat > "$tmp" <<JSON
{
  "ok": $ok,
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database": "$(json_escape "$DB_NAME")",
  "dumpFile": "$(json_escape "$dump_file")",
  "encryptedFile": "$(json_escape "$encrypted_file")",
  "remoteUri": "$(json_escape "$remote_uri")",
  "error": "$(json_escape "$error")"
}
JSON
  mv "$tmp" "$STATUS_FILE"
}

read_env_var() {
  local name="$1" file="$2" line value
  [ -f "$file" ] || return 0
  line=$(grep -E "^${name}=" "$file" | tail -1 || true)
  [ -n "$line" ] || return 0
  value=${line#*=}
  value=${value%$'\r'}
  value=${value#\"}; value=${value%\"}
  value=${value#\'}; value=${value%\'}
  printf '%s' "$value"
}

load_from_source_env_if_unset() {
  local name="$1" current value
  current="${!name:-}"
  if [ -z "$current" ]; then
    value=$(read_env_var "$name" "$SOURCE_ENV")
    if [ -n "$value" ]; then
      export "$name=$value"
    fi
  fi
}

cleanup_old_local_backups() {
  find "$BACKUP_DIR" -maxdepth 1 -type f -name "${DB_NAME}_*.dump" -printf '%T@ %p\n' \
    | sort -rn \
    | tail -n "+$((LOCAL_RETENTION + 1))" \
    | cut -d' ' -f2- \
    | while IFS= read -r old_file; do
        rm -f "$old_file" "$old_file.sha256" "$old_file.enc" "$old_file.enc.sha256"
      done
}

upload_remote_if_enabled() {
  local dump_file="$1" encrypted_file remote_uri encrypted_base
  [ "$REMOTE_ENABLED" = "1" ] || return 0

  command -v aws >/dev/null || {
    log "remote upload skipped: aws CLI not installed"
    return 0
  }

  load_from_source_env_if_unset R2_ACCESS_KEY_ID
  load_from_source_env_if_unset R2_SECRET_ACCESS_KEY
  load_from_source_env_if_unset R2_BUCKET
  load_from_source_env_if_unset R2_ENDPOINT

  if [ -z "${R2_ACCESS_KEY_ID:-}" ] || [ -z "${R2_SECRET_ACCESS_KEY:-}" ] || [ -z "${R2_BUCKET:-}" ] || [ -z "${R2_ENDPOINT:-}" ]; then
    log "remote upload skipped: R2 env is incomplete"
    return 0
  fi

  if [ ! -f "$KEY_FILE" ]; then
    log "remote upload skipped: encryption key file missing at $KEY_FILE"
    return 0
  fi

  encrypted_file="${dump_file}.enc"
  encrypted_base=$(basename "$encrypted_file")
  remote_uri="s3://${R2_BUCKET}/${REMOTE_PREFIX}/${encrypted_base}"

  aws_r2() {
    AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    AWS_DEFAULT_REGION="${R2_REGION:-auto}" \
    aws --endpoint-url "$R2_ENDPOINT" "$@"
  }

  openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
    -in "$dump_file" \
    -out "$encrypted_file" \
    -pass "file:$KEY_FILE"
  chmod 640 "$encrypted_file"
  sha256sum "$encrypted_file" > "${encrypted_file}.sha256"
  chmod 640 "${encrypted_file}.sha256"

  aws_r2 s3 cp "$encrypted_file" "$remote_uri" --only-show-errors || return 1

  aws_r2 s3 cp "${encrypted_file}.sha256" "${remote_uri}.sha256" --only-show-errors || return 1

  if [ "$REMOTE_RETENTION" -gt 0 ]; then
    aws_r2 s3 ls "s3://${R2_BUCKET}/${REMOTE_PREFIX}/" \
      | awk '/\.dump\.enc$/ {print $4}' \
      | sort -r \
      | tail -n "+$((REMOTE_RETENTION + 1))" \
      | while IFS= read -r old_key; do
          [ -n "$old_key" ] || continue
          aws_r2 s3 rm "s3://${R2_BUCKET}/${REMOTE_PREFIX}/${old_key}" --only-show-errors || true
          aws_r2 s3 rm "s3://${R2_BUCKET}/${REMOTE_PREFIX}/${old_key}.sha256" --only-show-errors || true
        done
  fi

  printf '%s\n' "$remote_uri"
}

STAMP=$(date -u +%Y%m%d_%H%M%S)
OUT="${BACKUP_DIR}/${DB_NAME}_${STAMP}.dump"
REMOTE_URI=""

if ! command -v pg_dump >/dev/null; then
  write_status false "" "" "" "pg_dump not found"
  log "FATAL: pg_dump not found"
  exit 1
fi

if ! run_low_priority sudo -u postgres pg_dump -Fc -Z 6 "$DB_NAME" > "$OUT"; then
  write_status false "$OUT" "" "" "pg_dump failed"
  rm -f "$OUT"
  log "FATAL: pg_dump failed"
  exit 1
fi

chmod 640 "$OUT"
sha256sum "$OUT" > "${OUT}.sha256"
chmod 640 "${OUT}.sha256"
cleanup_old_local_backups

if ! REMOTE_URI=$(upload_remote_if_enabled "$OUT"); then
  write_status false "$OUT" "${OUT}.enc" "" "remote upload failed"
  log "FATAL: remote upload failed"
  exit 1
fi

write_status true "$OUT" "${OUT}.enc" "$REMOTE_URI" ""
log "Backup complete: $(ls -lh "$OUT" | awk '{print $5, $9}')"
if [ -n "$REMOTE_URI" ]; then
  log "Encrypted remote backup uploaded: $REMOTE_URI"
fi
