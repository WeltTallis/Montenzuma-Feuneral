#!/usr/bin/env bash
# =============================================================================
# RestPoint — Production storage setup (run ONCE on the production server)
#
# Prepares the host directories every service bind-mounts:
#   /opt/storage          → ALL tenant uploads (signatures, logos, documents,
#                           hearse images, scans, invoice PDFs)
#       /opt/storage/uploads/<tenant-slug>/signatures/...
#   /opt/backups          → database dumps + uploads archives (make backup)
#
# It also MIGRATES existing data out of the old docker named volumes
# (shared_uploads / florist_service_data / scanner_uploads) and the old
# repo bind mounts (services/*/uploads) so nothing is lost, then fixes
# ownership for the containers' non-root user (uid 1001 "nodejs").
#
# Usage (as root on the server):
#   cd /opt/restpoint && bash scripts/setup-production-storage.sh
# =============================================================================
set -euo pipefail

STORAGE_DIR="${STORAGE_DIR:-/opt/storage}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups}"
REPO_DIR="${REPO_DIR:-/opt/restpoint}"
CONTAINER_UID="${CONTAINER_UID:-1001}"   # "nodejs" user inside every service image
CONTAINER_GID="${CONTAINER_GID:-1001}"

log()  { printf '\033[34m[SETUP]\033[0m %s\n' "$*"; }
ok()   { printf '\033[32m[  OK ]\033[0m %s\n' "$*"; }
warn() { printf '\033[33m[WARN]\033[0m %s\n' "$*"; }

[ "$(id -u)" -eq 0 ] || { echo "Must run as root (sudo)."; exit 1; }

log "Creating host directories..."
mkdir -p "${STORAGE_DIR}/uploads" "${BACKUP_DIR}/db" "${BACKUP_DIR}/uploads"
ok "${STORAGE_DIR} and ${BACKUP_DIR} ready"

# ---------------------------------------------------------------------------
# 1. Migrate data from old docker named volumes (if they exist and the
#    destination is still empty). Volume names are project-prefixed.
# ---------------------------------------------------------------------------
migrate_volume() {
  local vol="$1" dest="$2"
  local found
  found="$(docker volume ls --format '{{.Name}}' | grep -E "(^|_)${vol}$" | head -n 1 || true)"
  if [ -z "${found}" ]; then
    warn "volume '${vol}' not found — skipping"
    return 0
  fi
  mkdir -p "${dest}"
  if [ -n "$(ls -A "${dest}" 2>/dev/null)" ]; then
    warn "${dest} already has data — skipping migration of '${found}'"
    return 0
  fi
  log "Migrating docker volume '${found}' → ${dest} ..."
  docker run --rm -v "${found}:/from:ro" -v "${dest}:/to" alpine \
    sh -c 'cp -a /from/. /to/ && chown -R '"${CONTAINER_UID}:${CONTAINER_GID}"' /to'
  ok "Migrated ${found} → ${dest}"
}

migrate_volume "shared_uploads"      "${STORAGE_DIR}/uploads"          # main uploads volume
migrate_volume "florist_service_data" "${STORAGE_DIR}/uploads"         # florist had its own volume
migrate_volume "scanner_uploads"     "${STORAGE_DIR}/uploads/scanner"  # scanner had its own volume

# ---------------------------------------------------------------------------
# 2. Migrate legacy repo bind-mount data (hearse images / documents service /
#    invoice PDFs used to live inside the git checkout)
# ---------------------------------------------------------------------------
migrate_dir() {
  local src="$1" dest="$2"
  if [ -d "${src}" ] && [ -n "$(ls -A "${src}" 2>/dev/null)" ]; then
    mkdir -p "${dest}"
    if [ -n "$(ls -A "${dest}" 2>/dev/null)" ]; then
      warn "${dest} already has data — skipping copy from ${src}"
      return 0
    fi
    log "Migrating ${src} → ${dest} ..."
    cp -a "${src}/." "${dest}/"
    ok "Migrated ${src} → ${dest}"
  fi
}

migrate_dir "${REPO_DIR}/services/hearse-service/uploads/hearses" "${STORAGE_DIR}/uploads/hearses"
migrate_dir "${REPO_DIR}/services/deceased-service/uploads"       "${STORAGE_DIR}/uploads/_legacy/deceased"
migrate_dir "${REPO_DIR}/services/documents-service/uploads"      "${STORAGE_DIR}/uploads/_legacy/documents"
migrate_dir "${REPO_DIR}/services/invoice-service/generated"      "${STORAGE_DIR}/invoices/invoice-service"
migrate_dir "${REPO_DIR}/services/billing-service/invoices"       "${STORAGE_DIR}/invoices/billing"

# ---------------------------------------------------------------------------
# 3. Ownership — every service container runs as uid/gid 1001 (nodejs) and
#    MUST be able to write into the bind mount.
# ---------------------------------------------------------------------------
log "Setting ownership ${CONTAINER_UID}:${CONTAINER_GID} on ${STORAGE_DIR} ..."
chown -R "${CONTAINER_UID}:${CONTAINER_GID}" "${STORAGE_DIR}"
chmod -R u+rwX "${STORAGE_DIR}"
ok "Permissions fixed"

echo
ok "Setup complete. Next steps:"
echo "  1) cd ${REPO_DIR} && docker compose -f docker-compose.prod.yml up -d --build"
echo "  2) Verify:  ls ${STORAGE_DIR}/uploads/<tenant-slug>/signatures"
echo "  3) Verify a signature URL:  curl -I https://restpoint.co.ke/uploads/<tenant-slug>/signatures/<file>.png"
echo "  4) Nightly backups (uploads + database) into ${BACKUP_DIR}:"
echo "       crontab -e  →  30 2 * * * ${REPO_DIR}/scripts/backup-production.sh >> ${REPO_DIR}/logs/backup.log 2>&1"