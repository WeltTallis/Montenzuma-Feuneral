#!/bin/sh
# ============================================================================
# Align the M-Pesa PostgreSQL role password with .env.production.
# ============================================================================
# THE BUG THIS FIXES
# ------------------
# The official postgres image applies POSTGRES_USER / POSTGRES_PASSWORD /
# POSTGRES_DB ONLY when it initialises an EMPTY data directory. On every later
# boot it silently keeps whatever roles and passwords already exist in the
# volume. So once MPESA_DB_PASSWORD in .env.production changes (or the volume
# was first created with a different value, e.g. the docker-compose.yml
# default `mpesa-local`, or an older production password), the running server
# still expects the OLD password while mpesa-service connects with the NEW one:
#
#     FATAL: password authentication failed for user "mpesa" (SQLSTATE 28P01)
#
# The Go service exits via logrus.Fatal and restart-loops every minute.
# Recreating the container does NOT help — only the volume's first init ever
# reads POSTGRES_PASSWORD.
#
# WHAT THIS DOES
# --------------
# Reads MPESA_DB_USER / MPESA_DB_PASSWORD (falling back to DB_PASSWORD, exactly
# like docker-compose.prod.yml resolves it) plus MPESA_DB_NAME from
# .env.production, then converges the role inside the RUNNING container with
# ALTER ROLE over the local socket (the image ships `local all all trust`, so
# that step needs no password). Missing role/database are created first, so a
# volume initialised with different names self-heals too. It then verifies
# with a real SCRAM login over TCP — the same auth path the Go service uses —
# and never invents credentials of its own.
#
# Usage:  sh scripts/fix-mpesa-db-password.sh [postgres-container]
#         (default: first RUNNING container whose name contains mpesa-postgres)
# Exit:   0 aligned and verified, 1 failed.
# ============================================================================

set -eu

CONTAINER="${1:-}"

log()  { echo "$*"; }
warn() { echo "WARNING: $*" >&2; }
die()  { echo "ERROR: $*" >&2; exit 1; }

# Read `KEY=value` from an env file. Strips quotes and trailing blanks.
read_env() {
  sed -n "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" "$2" 2>/dev/null \
    | head -n 1 \
    | sed -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/"
}

log "==> Aligning M-Pesa PostgreSQL password with .env.production"

command -v docker >/dev/null 2>&1 || die "docker not found on PATH"

# --- 1. Locate the running postgres container ------------------------------
if [ -z "$CONTAINER" ]; then
  CONTAINER=$(docker ps --format '{{.Names}}' | grep -m 1 'mpesa-postgres' || true)
fi
[ -n "$CONTAINER" ] || die "No RUNNING container matching 'mpesa-postgres' found.
Start the database first (e.g. 'make prod-up' or 'docker compose -f docker-compose.prod.yml up -d mpesa-postgres')."
log "    container: ${CONTAINER}"

# --- 2. Read the credentials compose would use -----------------------------
# Mirror docker-compose.prod.yml:
#   POSTGRES_PASSWORD: ${MPESA_DB_PASSWORD:-${DB_PASSWORD:?...}}
ENV_FILE=""
for f in .env.production .env; do
  [ -f "$f" ] && ENV_FILE="$f" && break
done
[ -n "$ENV_FILE" ] || die "Neither .env.production nor .env found in the current directory.
Run this from the deployment root (e.g. /opt/restpoint)."
log "    env file:  ${ENV_FILE}"

DB_USER=$(read_env MPESA_DB_USER "$ENV_FILE"); DB_USER="${DB_USER:-mpesa}"
DB_NAME=$(read_env MPESA_DB_NAME "$ENV_FILE"); DB_NAME="${DB_NAME:-mpesa}"
DB_PASS=$(read_env MPESA_DB_PASSWORD "$ENV_FILE")
if [ -z "$DB_PASS" ]; then
  DB_PASS=$(read_env DB_PASSWORD "$ENV_FILE")
fi
[ -n "$DB_PASS" ] || die "MPESA_DB_PASSWORD (and DB_PASSWORD) missing/empty in ${ENV_FILE}."

# Identifiers end up unquoted-interpolated into SQL — refuse anything unsafe.
printf '%s' "$DB_USER" | grep -Eq '^[a-zA-Z_][a-zA-Z0-9_]*$' || \
  die "MPESA_DB_USER '${DB_USER}' is not a plain identifier; refusing to build SQL."
printf '%s' "$DB_NAME" | grep -Eq '^[a-zA-Z_][a-zA-Z0-9_]*$' || \
  die "MPESA_DB_NAME '${DB_NAME}' is not a plain identifier; refusing to build SQL."

log "    user:      ${DB_USER}"
log "    database:  ${DB_NAME}"
log "    password:  read from ${ENV_FILE} (not printed)"

# Escape a value for a single-quoted PostgreSQL string literal: backslash is
# an escape character in standard strings, so double it BEFORE doubling ''.
sql_escape() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e "s/'/''/g"; }
P=$(sql_escape "$DB_PASS")


# --- 3. Converge role and database over the local socket -------------------
# The image's pg_hba.conf has `local all all trust`, and it always bootstraps
# a `postgres` superuser regardless of POSTGRES_USER — so this needs no
# password even while every TCP login is failing.
log "    checking role and database..."
ROLE_EXISTS=$(docker exec "$CONTAINER" psql -U postgres -d postgres -tAc \
  "SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}'" 2>/dev/null || true)
if [ "$ROLE_EXISTS" = "1" ]; then
  log "    role '${DB_USER}' exists — converging password"
else
  log "    role '${DB_USER}' MISSING — creating (volume was initialised with other names)"
  docker exec -i "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
    -c "CREATE ROLE \"${DB_USER}\" LOGIN SUPERUSER CREATEDB CREATEROLE" >/dev/null
fi

DB_EXISTS=$(docker exec "$CONTAINER" psql -U postgres -d postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" 2>/dev/null || true)
if [ "$DB_EXISTS" != "1" ]; then
  log "    database '${DB_NAME}' MISSING — creating"
  docker exec -i "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
    -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\"" >/dev/null
fi

# ALTER ROLE always runs: it is the only way to converge a STALE password in
# the volume onto whatever the env file says today.
log "    applying ALTER ROLE..."
docker exec -i "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "ALTER ROLE \"${DB_USER}\" WITH LOGIN SUPERUSER CREATEDB CREATEROLE PASSWORD '${P}'" >/dev/null

# --- 4. Verify with a real TCP/SCRAM login (the app's exact auth path) -----
# pg_isready / socket logins do NOT prove the password works; only a TCP
# login with PGPASSWORD does, and 127.0.0.1 inside the container traverses
# the same `host all all all scram-sha-256` rule the app hits over the network.
log "    verifying TCP password login..."
if docker exec -e PGPASSWORD="$DB_PASS" "$CONTAINER" \
     psql -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" -tAc 'SELECT 1' >/dev/null 2>&1; then
  log "OK: SCRAM password login over TCP now succeeds."
else
  warn "TCP password login still fails. Recent postgres log:"
  docker logs --tail 20 "$CONTAINER" >&2 2>/dev/null || true
  exit 1
fi

log ""
log "Done. mpesa-service exits fatal and is restarted by Docker every ~60s, so"
log "it should connect on its own shortly. To force it immediately:"
log "    docker restart restpoint_mpesa_service"
log ""
log "NOTE: changing MPESA_DB_PASSWORD in ${ENV_FILE} alone will NEVER update an"
log "existing volume — re-run this script after every password change."

