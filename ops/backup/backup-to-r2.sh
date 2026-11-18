#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
: "${R2_ENDPOINT:?Set R2_ENDPOINT}"
: "${AWS_ACCESS_KEY_ID:?Set AWS_ACCESS_KEY_ID}"
: "${AWS_SECRET_ACCESS_KEY:?Set AWS_SECRET_ACCESS_KEY}"
: "${DB_ROOT_PASSWORD:?Set DB_ROOT_PASSWORD}"
R2_BUCKET="${R2_BUCKET:-restpoint}"
R2_PREFIX="${R2_PREFIX:-restpoint-backups}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/restpoint}"
BACKUP_RETENTION_COPIES="${BACKUP_RETENTION_COPIES:-3}"
COMPOSE=(docker compose)
[[ -n "${COMPOSE_FILE:-}" ]] && COMPOSE+=( -f "$COMPOSE_FILE" )
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORK_DIR="$BACKUP_DIR/$STAMP"
mkdir -p "$WORK_DIR/db" "$WORK_DIR/uploads"

echo "[backup] dumping MariaDB"
"${COMPOSE[@]}" exec -T -e MYSQL_PWD="$DB_ROOT_PASSWORD" mariadb \
  mariadb-dump -uroot --all-databases --single-transaction --routines --events --triggers \
  | gzip -c > "$WORK_DIR/db/mariadb-all.sql.gz"

dump_postgres() {
  local service="$1" user="$2" password="$3" output="$4"
  echo "[backup] dumping $service"
  "${COMPOSE[@]}" exec -T -e PGPASSWORD="$password" "$service" \
    pg_dumpall -U "$user" | gzip -c > "$WORK_DIR/db/$output"
}
dump_postgres mpesa-postgres "${MPESA_DB_USER:-mpesa}" "${MPESA_DB_PASSWORD:-}" mpesa-all.sql.gz
dump_postgres insurance-postgres "${INSURANCE_PG_USER:-insurance}" "${INSURANCE_PG_PASSWORD:-}" insurance-all.sql.gz

echo "[backup] archiving complete uploads tree"
tar -C /opt/storage -czf "$WORK_DIR/uploads/uploads.tar.gz" uploads
printf 'restpoint_backup_version=1\ncreated_at_utc=%s\nuploads_root=/opt/storage/uploads\n' "$STAMP" > "$WORK_DIR/manifest.txt"
(cd "$WORK_DIR" && sha256sum db/*.sql.gz uploads/uploads.tar.gz manifest.txt > SHA256SUMS)

DEST="s3://$R2_BUCKET/$R2_PREFIX/$STAMP/"
aws s3 cp "$WORK_DIR/" "$DEST" --recursive --endpoint-url "$R2_ENDPOINT" --only-show-errors
aws s3 cp "$WORK_DIR/manifest.txt" "s3://$R2_BUCKET/$R2_PREFIX/latest-manifest.txt" --endpoint-url "$R2_ENDPOINT" --only-show-errors

mapfile -t LOCAL_SNAPSHOTS < <(find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' -printf '%f\n' | sort -r)
for old in "${LOCAL_SNAPSHOTS[@]:$BACKUP_RETENTION_COPIES}"; do
  rm -rf "$BACKUP_DIR/$old"
done
mapfile -t R2_SNAPSHOTS < <(aws s3 ls "s3://$R2_BUCKET/$R2_PREFIX/" --endpoint-url "$R2_ENDPOINT" | awk '$1 == "PRE" {gsub("/", "", $2); print $2}' | sort -r)
for old in "${R2_SNAPSHOTS[@]:$BACKUP_RETENTION_COPIES}"; do
  aws s3 rm "s3://$R2_BUCKET/$R2_PREFIX/$old/" --recursive --endpoint-url "$R2_ENDPOINT" --only-show-errors
done
echo "[backup] completed: $DEST"
