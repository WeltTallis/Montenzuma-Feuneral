#!/usr/bin/env bash
set -Eeuo pipefail
: "${R2_ENDPOINT:?Set R2_ENDPOINT}"
: "${AWS_ACCESS_KEY_ID:?Set AWS_ACCESS_KEY_ID}"
: "${AWS_SECRET_ACCESS_KEY:?Set AWS_SECRET_ACCESS_KEY}"
R2_BUCKET="${R2_BUCKET:-restpoint}"
R2_PREFIX="${R2_PREFIX:-restpoint-backups}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/restpoint-verify}"
STAMP="${BACKUP_STAMP:-$(aws s3 ls "s3://$R2_BUCKET/$R2_PREFIX/" --endpoint-url "$R2_ENDPOINT" | awk '/PRE/ {gsub("/","",$2); print $2}' | sort | tail -n 1)}"
[[ -n "$STAMP" ]] || { echo "No R2 backup found" >&2; exit 1; }
TARGET="$BACKUP_DIR/$STAMP"
rm -rf "$TARGET"
mkdir -p "$TARGET"
aws s3 cp "s3://$R2_BUCKET/$R2_PREFIX/$STAMP/" "$TARGET/" --recursive --endpoint-url "$R2_ENDPOINT" --only-show-errors
(cd "$TARGET" && sha256sum -c SHA256SUMS)
gzip -t "$TARGET"/db/*.sql.gz
tar -tzf "$TARGET/uploads/uploads.tar.gz" >/dev/null
echo "[verify] PASS: $STAMP"
