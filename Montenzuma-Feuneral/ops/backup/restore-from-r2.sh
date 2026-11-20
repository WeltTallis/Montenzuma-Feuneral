#!/usr/bin/env bash
set -Eeuo pipefail
[[ "${CONFIRM_RESTORE:-}" == "YES" ]] || { echo "Set CONFIRM_RESTORE=YES" >&2; exit 2; }
: "${DB_ROOT_PASSWORD:?Set DB_ROOT_PASSWORD}"
: "${BACKUP_STAMP:?Set BACKUP_STAMP}"
R2_BUCKET="${R2_BUCKET:-restpoint}"
R2_PREFIX="${R2_PREFIX:-restpoint-backups}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/restpoint-restore}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
COMPOSE=(docker compose)
[[ -n "${COMPOSE_FILE:-}" ]] && COMPOSE+=( -f "$COMPOSE_FILE" )
TARGET="$BACKUP_DIR/$BACKUP_STAMP"
if [[ "${BACKUP_SOURCE:-r2}" == "local" ]]; then
  [[ -d "$TARGET" ]] || { echo "Local backup not found: $TARGET" >&2; exit 1; }
else
  : "${R2_ENDPOINT:?Set R2_ENDPOINT}"
  : "${AWS_ACCESS_KEY_ID:?Set AWS_ACCESS_KEY_ID}"
  : "${AWS_SECRET_ACCESS_KEY:?Set AWS_SECRET_ACCESS_KEY}"
  mkdir -p "$TARGET"
  aws s3 cp "s3://$R2_BUCKET/$R2_PREFIX/$BACKUP_STAMP/" "$TARGET/" --recursive --endpoint-url "$R2_ENDPOINT" --only-show-errors
fi
(cd "$TARGET" && sha256sum -c SHA256SUMS)
gunzip -c "$TARGET/db/mariadb-all.sql.gz" | "${COMPOSE[@]}" exec -T -e MYSQL_PWD="$DB_ROOT_PASSWORD" mariadb mariadb -uroot
gunzip -c "$TARGET/db/mpesa-all.sql.gz" | "${COMPOSE[@]}" exec -T -e PGPASSWORD="${MPESA_DB_PASSWORD:-}" mpesa-postgres psql -U "${MPESA_DB_USER:-mpesa}"
gunzip -c "$TARGET/db/insurance-all.sql.gz" | "${COMPOSE[@]}" exec -T -e PGPASSWORD="${INSURANCE_PG_PASSWORD:-}" insurance-postgres psql -U "${INSURANCE_PG_USER:-insurance}"
if [[ "${RESTORE_UPLOADS:-NO}" == "YES" ]]; then tar -C /opt/storage -xzf "$TARGET/uploads/uploads.tar.gz"; fi
echo "[restore] completed"
