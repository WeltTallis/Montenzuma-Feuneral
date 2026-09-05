#!/usr/bin/env bash
# =============================================================================
# RestPoint — Per-tenant upload folder bootstrap (run ON the production server)
#
# Creates the standard per-tenant upload folder skeleton for EVERY existing
# tenant (and branch) under /opt/storage/uploads/<tenant-slug>/:
#   signatures/ documents/ images/ logos/ pdf/ exports/ flowers/ deceased/
#   receipts/ reports/ contracts/ employees/ chemicals/ invoices/
# Plus legacy mirrors: FlowerSamples/<slug> and tenants/<slug>/logos.
#
# It also migrates legacy repo flower images into FlowerSamples (so old
# arrangement URLs keep working) and sets ownership for the container user
# (uid 1001 "nodejs") so uploads stop failing with EACCES.
#
# Idempotent — safe to re-run. Usage:  bash scripts/setup-tenant-upload-folders.sh
# =============================================================================
set -euo pipefail

STORAGE_DIR="${STORAGE_DIR:-/opt/storage}"
REPO_DIR="${REPO_DIR:-/opt/restpoint}"
UPLOADS_DIR="${STORAGE_DIR}/uploads"
CONTAINER_UID="${CONTAINER_UID:-1001}"   # "nodejs" user inside every image
CONTAINER_GID="${CONTAINER_GID:-1001}"

log()  { printf '\033[34m[FOLDERS]\033[0m %s\n' "$*"; }
ok()   { printf '\033[32m[  OK  ]\033[0m %s\n' "$*"; }
warn() { printf '\033[33m[WARN]\033[0m %s\n' "$*"; }

[ "$(id -u)" -eq 0 ] || { echo "Must run as root (sudo)."; exit 1; }

mkdir -p "${UPLOADS_DIR}" "${UPLOADS_DIR}/FlowerSamples"

# ---------------------------------------------------------------------------
# 0. Migrate legacy flower images shipped in the repo checkout so old
#    /uploads/FlowerSamples/... URLs keep working.
# ---------------------------------------------------------------------------
if [ -d "${REPO_DIR}/services/uploads/FlowerSamples" ] && [ -n "$(ls -A "${REPO_DIR}/services/uploads/FlowerSamples" 2>/dev/null)" ]; then
  if [ -n "$(ls -A "${UPLOADS_DIR}/FlowerSamples" 2>/dev/null)" ]; then
    warn "FlowerSamples already has data — skipping repo migration"
  else
    log "Migrating ${REPO_DIR}/services/uploads/FlowerSamples -> ${UPLOADS_DIR}/FlowerSamples"
    cp -a "${REPO_DIR}/services/uploads/FlowerSamples/." "${UPLOADS_DIR}/FlowerSamples/"
    ok "Legacy flower images migrated"
  fi
fi
# ---------------------------------------------------------------------------
# 1. Discover tenant + branch slugs from the registry DB (best effort).
#    Reads only tenant_tracking.tenants / tenant_tracking.branches.
# ---------------------------------------------------------------------------
DB_HOST="${DB_HOST:-$(grep -E '^DB_HOST=' "${REPO_DIR}/.env.production" 2>/dev/null | head -n1 | cut -d= -f2- || echo 127.0.0.1)}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-$(grep -E '^DB_USER=' "${REPO_DIR}/.env.production" 2>/dev/null | head -n1 | cut -d= -f2- || echo restpoint_user)}"
DB_PASSWORD="${DB_PASSWORD:-$(grep -E '^DB_PASSWORD=' "${REPO_DIR}/.env.production" 2>/dev/null | head -n1 | cut -d= -f2- || true)}"

QRY="SELECT slug FROM (SELECT tenant_slug AS slug FROM tenant_tracking.tenants UNION SELECT DISTINCT branch_slug AS slug FROM tenant_tracking.branches) t WHERE slug IS NOT NULL AND slug <> '';"

slugs=""
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^restpoint_mariadb$'; then
  slugs="$(docker exec restpoint_mariadb mariadb -h127.0.0.1 -u"${DB_USER}" -p"${DB_PASSWORD}" -N -e "${QRY}" 2>/dev/null || true)"
fi
if [ -z "${slugs}" ] && command -v mariadb >/dev/null 2>&1; then
  slugs="$(mariadb -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" -N -e "${QRY}" 2>/dev/null || true)"
fi

if [ -z "${slugs}" ]; then
  # Fallback: derive from the existing uploads tree (covers tenants never
  # registered in tenant_tracking) — skip known non-tenant folders.
  slugs="$(ls -1A "${UPLOADS_DIR}" 2>/dev/null | grep -vE '^(FlowerSamples|scanner|invoices|_legacy|tenants)$' || true)"
  if [ -n "${slugs}" ]; then
    warn "DB slugs unavailable — using existing folder names under ${UPLOADS_DIR}"
  fi
fi

if [ -z "${slugs}" ]; then
  warn "No tenant slugs found — created base dirs only."
else
  log "Tenants: $(echo "${slugs}" | tr '\n' ' ')"
fi

SUBDIRS=(signatures documents images logos pdf exports flowers deceased receipts reports contracts employees chemicals invoices)

for slug in ${slugs}; do
  # Sanitize: letters, digits, dash, underscore, dot, lowercase — same rules as
  # generateSlug()/sanitizeSlug(). Avoids any shell/URL special chars.
  safe="$(printf '%s' "${slug}" | tr -cd '[:alnum:]_.-' | tr '[:upper:]' '[:lower:]')"
  [ -n "${safe}" ] || continue

  root="${UPLOADS_DIR}/${safe}"
  mkdir -p "${root}"
  for sub in "${SUBDIRS[@]}"; do
    mkdir -p "${root}/${sub}"
  done

  # Legacy layouts kept alive so old DB rows still resolve.
  mkdir -p "${UPLOADS_DIR}/FlowerSamples/${safe}"
  mkdir -p "${UPLOADS_DIR}/tenants/${safe}/logos"

  ok "Tenant folders ready: ${root}"
done
# ---------------------------------------------------------------------------
# 2. Ownership — every service container runs as uid/gid 1001 (nodejs).
# ---------------------------------------------------------------------------
log "Setting ownership ${CONTAINER_UID}:${CONTAINER_GID} on ${STORAGE_DIR} ..."
chown -R "${CONTAINER_UID}:${CONTAINER_GID}" "${STORAGE_DIR}"
chmod -R u+rwX "${STORAGE_DIR}"
ok "Permissions fixed"

echo
ok "Done. Verify:"
echo "  ls ${UPLOADS_DIR}/<tenant-slug>/signatures"
echo "  curl -I https://restpoint.co.ke/uploads/<tenant-slug>/signatures/<file>.png"
exit 0