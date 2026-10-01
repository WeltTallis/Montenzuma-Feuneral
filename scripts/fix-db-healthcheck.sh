#!/bin/sh
# ============================================================================
# Repair the MariaDB Docker healthcheck user.
# ============================================================================
# THE BUG THIS FIXES
# ------------------
# mariadb:10.11 (10.11.19+) ships `healthcheck.sh`, which authenticates using
# credentials read from a generated file inside the data volume:
#
#     /var/lib/mysql/.my-healthcheck.cnf
#
# The image's entrypoint creates that file AND a matching `healthcheck` SQL
# user — but ONLY when initialising an EMPTY volume, or when it decides an
# upgrade is needed. `_check_if_upgrade_is_needed` deliberately SKIPS the repair
# when `.my-healthcheck.cnf` already exists:
#
#     if [ ! -f "$DATADIR"/.my-healthcheck.cnf ]; then ... return 0; fi
#     mysql_note "MariaDB upgrade not required"
#     return 1
#
# So a volume where the file survived but the SQL account did not (restored from
# a dump, an older image, a manual DROP USER, a partial init) is permanently
# broken and nothing ever repairs it:
#
#     ERROR 1045 (28000): Access denied for user 'healthcheck'@'localhost'
#     healthcheck innodb_initialized failed
#
# `connect` still PASSES (the script treats 28000 as "we did connect"), so only
# `innodb_initialized` fails — and that test needs the USAGE grant. The container
# is therefore permanently `unhealthy` while serving every application fine, and
# because services use `condition: service_healthy` that blocks the whole stack.
#
# WHAT THIS DOES
# --------------
# Reads the user/password straight out of `.my-healthcheck.cnf` — the source of
# truth — and (re)creates the SQL account with it. It NEVER invents a password,
# so it cannot drift from the file the healthcheck actually reads. `USAGE` is
# all `innodb_initialized` needs, so no data privileges are granted.
#
# Usage:  sh scripts/fix-db-healthcheck.sh [container]  (default: restpoint_mariadb)
# Exit:   0 fixed/verified, 1 failed.
# ============================================================================

set -eu

CONTAINER="${1:-restpoint_mariadb}"
CNF_IN_CONTAINER="/var/lib/mysql/.my-healthcheck.cnf"

log()  { echo "$*"; }
warn() { echo "WARNING: $*" >&2; }
die()  { echo "ERROR: $*" >&2; exit 1; }

log "==> Repairing MariaDB healthcheck user on '${CONTAINER}'"

command -v docker >/dev/null 2>&1 || die "docker not found on PATH"
docker inspect "$CONTAINER" >/dev/null 2>&1 || \
  die "container '${CONTAINER}' not found (is the stack running?)"

# Ask the CONTAINER to print the file so we depend on no host tooling.
cnf=$(docker exec "$CONTAINER" sh -c "cat '$CNF_IN_CONTAINER' 2>/dev/null" || true)

if [ -z "$cnf" ]; then
  die "No $CNF_IN_CONTAINER in the data volume.
  That file is generated on FIRST init only, so this volume was initialised by an
  older image. It is recreated automatically once the entrypoint sees the file
  missing; restarting the container is normally enough:
      docker restart $CONTAINER
  If it is still missing afterwards, the volume predates 10.11.19 and the
  healthcheck has no credentials to use. Investigate before deleting anything."
fi

log "    found $CNF_IN_CONTAINER"

# Parse [mariadb-client] user= / password=. Strip quotes and trailing blanks so
# a value like `pw  # note` still parses.
extract() {
  printf '%s\n' "$cnf" \
    | sed -n "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" \
    | head -n 1 \
    | sed -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/"
}

HC_USER=$(extract user)
HC_PASS=$(extract password)
[ -n "$HC_USER" ] || die "Could not parse 'user' from $CNF_IN_CONTAINER"
log "    healthcheck user: '${HC_USER}' (password read, not printed)"


# --- 2. Root credentials ---------------------------------------------------
# The entrypoint UNSETS MARIADB_ROOT_PASSWORD before exec'ing the server, so it
# is normally not readable inside the container. Read it from .env on the host —
# the same value compose interpolates into the container.
root_pw=""
for envf in .env.production .env; do
  [ -f "$envf" ] || continue
  root_pw=$(sed -n 's/^[[:space:]]*MARIADB_ROOT_PASSWORD[[:space:]]*=[[:space:]]*//p' "$envf" \
            | head -n 1 | sed -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/")
  [ -n "$root_pw" ] && break
done
[ -n "$root_pw" ] || die "Could not read MARIADB_ROOT_PASSWORD from .env.production or .env"

# --- 3. Create / converge the account --------------------------------------
# Escape for a single-quoted SQL literal. Backslash is an escape character in
# MySQL/MariaDB string literals unless NO_BACKSLASH_ESCAPES is set, so
# backslashes are doubled FIRST and quotes second.
sql_escape() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e "s/'/''/g"; }
U=$(sql_escape "$HC_USER")
P=$(sql_escape "$HC_PASS")

# CREATE USER IF NOT EXISTS is a no-op when the account already exists, so each
# account is followed by ALTER USER — that converges a STALE password onto
# whatever the .cnf says today, the only way to guarantee a match.
#
# Host coverage: 'localhost' serves the unix-socket probe, '127.0.0.1' and '::1'
# serve the TCP fallback inside `connect` (the error log shows both).
log "    applying grants..."
docker exec -i "$CONTAINER" mariadb -uroot -p"$root_pw" --protocol socket <<SQL
SET @@SESSION.SQL_MODE=REPLACE(@@SESSION.SQL_MODE,'NO_BACKSLASH_ESCAPES','');
CREATE USER IF NOT EXISTS '$U'@'localhost' IDENTIFIED BY '$P';
ALTER  USER '$U'@'localhost' IDENTIFIED BY '$P';
CREATE USER IF NOT EXISTS '$U'@'127.0.0.1' IDENTIFIED BY '$P';
ALTER  USER '$U'@'127.0.0.1' IDENTIFIED BY '$P';
CREATE USER IF NOT EXISTS '$U'@'::1' IDENTIFIED BY '$P';
ALTER  USER '$U'@'::1' IDENTIFIED BY '$P';
GRANT USAGE ON *.* TO '$U'@'localhost';
GRANT USAGE ON *.* TO '$U'@'127.0.0.1';
GRANT USAGE ON *.* TO '$U'@'::1';
FLUSH PRIVILEGES;
SQL

# --- 4. Verify with the image's REAL healthcheck binary --------------------
log "    running the image's own healthcheck.sh..."
if docker exec "$CONTAINER" healthcheck.sh --su-mysql --connect --innodb_initialized; then
  log "OK: healthcheck.sh now passes."
else
  warn "healthcheck.sh still fails. Latest health log:"
  docker inspect --format '{{range .State.Health.Log}}{{.ExitCode}}: {{.Output}}{{end}}' \
    "$CONTAINER" 2>/dev/null | tail -n 10 >&2 || true
  exit 1
fi

log ""
log "Done. Docker re-probes every 15s, so the container should report"
log "'healthy' shortly. Then run 'make prod-up' to start the services that"
log "were blocked by 'condition: service_healthy'."
