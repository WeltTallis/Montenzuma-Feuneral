#!/usr/bin/env bash
# =============================================================================
# RestPoint — Production backup (uploads + database) → /opt/backups
#
# Designed to run from cron on the production server:
#   30 2 * * * /opt/restpoint/scripts/backup-production.sh >> /opt/restpoint/logs/backup.log 2>&1
#
# Layout produced:
#   /opt/backups/db/restpoint_db_<ts>.sql.gz        (all databases)
#   /opt/backups/uploads/uploads_<ts>.tar.gz        (full /opt/storage/uploads)
#
# Retention: keeps the newest RETAIN db dumps and upload archives, prunes older.
# =============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/backups}"
STORAGE_DIR="${STORAGE_DIR:-/opt/storage}"
MARIADB_CONTAINER="${MARIADB_CONTAINER:-restpoint_mariadb}"
RETAIN="${RETAIN:-14}"
ENV_FILE="${ENV_FILE:-/opt/restpoint/.env.production}"

ts="$(date +%Y%m%d_%H%M%S)"
mkdir -p "${BACKUP_DIR}/db" "${BACKUP_DIR}/uploads"

echo "[BACKUP ${ts}] start"

# ---------------------------------------------------------------------------
# 1. Database dump (reads DB_ROOT_PASSWORD from .env.production)
# ---------------------------------------------------------------------------
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-}"
if [ -z "${DB_ROOT_PASSWORD}" ] && [ -f "${ENV_FILE}" ]; then
  DB_ROOT_PASSWORD="$(grep -E '^DB_ROOT_PASSWORD=' "${ENV_FILE}" | tail -n 1 | cut -d= -f2- | tr -d '\"'"'"' ' || true)"
fi

if docker ps --format '{{.Names}}' | grep -qx "${MARIADB_CONTAINER}"; then
  OUT="${BACKUP_DIR}/db/restpoint_db_${ts}.sql.gz"
  if [ -n "${DB_ROOT_PASSWORD}" ]; then
    docker exec "${MARIADB_CONTAINER}" sh -c \
      "exec mysqldump -uroot -p'${DB_ROOT_PASSWORD}' --all-databases --single-transaction" 2>/dev/null \
      | gzip > "${OUT}"
  else
    echo "[BACKUP] WARN: DB_ROOT_PASSWORD not found — attempting socket auth"
    docker exec "${MARIADB_CONTAINER}" sh -c \
      "exec mysqldump -uroot --all-databases --single-transaction" 2>/dev/null \
      | gzip > "${OUT}"
  fi
  echo "[BACKUP ${ts}] database → ${OUT} ($(du -h "${OUT}" | cut -f1))"
else
  echo "[BACKUP] WARN: container ${MARIADB_CONTAINER} not running — skipping db dump"
fi

# ---------------------------------------------------------------------------
# 2. All tenant uploads (signatures, logos, documents, hearse images, scans,
#    invoices) — the ONE storage directory bind-mounted into every service.
# ---------------------------------------------------------------------------
OUT="${BACKUP_DIR}/uploads/uploads_${ts}.tar.gz"
if [ -d "${STORAGE_DIR}/uploads" ]; then
  tar -czf "${OUT}" -C "${STORAGE_DIR}" uploads
  echo "[BACKUP ${ts}] uploads → ${OUT} ($(du -h "${OUT}" | cut -f1))"
else
  echo "[BACKUP] WARN: ${STORAGE_DIR}/uploads missing — skipping uploads archive"
fi

# ---------------------------------------------------------------------------
# 3. Retention
# ---------------------------------------------------------------------------
ls -1t "${BACKUP_DIR}"/db/restpoint_db_*.sql.gz      2>/dev/null | tail -n +$((RETAIN + 1)) | xargs -r rm -f
ls -1t "${BACKUP_DIR}"/uploads/uploads_*.tar.gz      2>/dev/null | tail -n +$((RETAIN + 1)) | xargs -r rm -f

echo "[BACKUP ${ts}] done"