#!/usr/bin/env bash
# =============================================================================
# scripts/fix-db-healthcheck.sh
#
# Repairs the MariaDB healthcheck user and credential file so that the
# container's HEALTHCHECK can connect via /var/lib/mysql/.my-healthcheck.cnf.
#
# What it does:
#   1. Reads MARIADB_ROOT_PASSWORD from .env (or .env.production)
#   2. Waits for the restpoint_mariadb container to accept root connections
#   3. Creates the `healthcheck`@`%` SQL user with SELECT on information_schema
#   4. Writes /var/lib/mysql/.my-healthcheck.cnf with the healthcheck credentials
#   5. Restarts MariaDB so the healthcheck picks up the new cnf file
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_DIR}"

# ── Resolve the root password ───────────────────────────────────────────────
DB_ROOT_PASSWORD=""
if [ -f .env ]; then
    DB_ROOT_PASSWORD="$(sed -n 's/^[[:space:]]*MARIADB_ROOT_PASSWORD[[:space:]]*=[[:space:]]*//p' .env | head -n 1 | tr -d '\r')"
fi
if [ -z "${DB_ROOT_PASSWORD}" ] && [ -f .env.production ]; then
    DB_ROOT_PASSWORD="$(sed -n 's/^[[:space:]]*MARIADB_ROOT_PASSWORD[[:space:]]*=[[:space:]]*//p' .env.production | head -n 1 | tr -d '\r')"
fi
if [ -z "${DB_ROOT_PASSWORD}" ]; then
    echo "ERROR: MARIADB_ROOT_PASSWORD not found in .env or .env.production" >&2
    exit 1
fi

echo "=== Fixing MariaDB healthcheck user ==="

# ── Wait for MariaDB to accept root connections ─────────────────────────────
echo "Waiting for restpoint_mariadb to accept connections..."
for i in $(seq 1 60); do
    if docker exec restpoint_mariadb mariadb -uroot -p"${DB_ROOT_PASSWORD}" --protocol=socket -e "SELECT 1" >/dev/null 2>&1; then
        echo "MariaDB is ready."
        break
    fi
    if [ "${i}" -eq 60 ]; then
        echo "ERROR: MariaDB did not become ready within 60 attempts." >&2
        exit 1
    fi
    sleep 2
done

# ── Create the healthcheck SQL user ─────────────────────────────────────────
echo "Creating healthcheck SQL user..."
docker exec restpoint_mariadb mariadb -uroot -p"${DB_ROOT_PASSWORD}" --protocol=socket <<'SQL'
CREATE USER IF NOT EXISTS 'healthcheck'@'%' IDENTIFIED BY 'healthcheck_pw_ChangeMe';
GRANT SELECT ON information_schema.* TO 'healthcheck'@'%';
FLUSH PRIVILEGES;
SQL
echo "✓ healthcheck user created / verified"

# ── Write the .my-healthcheck.cnf credential file ───────────────────────────
echo "Writing /var/lib/mysql/.my-healthcheck.cnf..."
docker exec restpoint_mariadb sh -c "
cat > /var/lib/mysql/.my-healthcheck.cnf <<'CNF'
[client]
user=healthcheck
password=healthcheck_pw_ChangeMe
socket=/var/run/mysqld/mysqld.sock
CNF
chmod 600 /var/lib/mysql/.my-healthcheck.cnf
chown mysql:mysql /var/lib/mysql/.my-healthcheck.cnf
"
echo "✓ .my-healthcheck.cnf written"

# ── Verify the healthcheck can connect ──────────────────────────────────────
echo "Verifying healthcheck connection..."
if docker exec restpoint_mariadb mariadb --defaults-extra-file=/var/lib/mysql/.my-healthcheck.cnf --protocol=socket -N -B -e "SELECT 1 FROM information_schema.ENGINES WHERE engine='innodb' AND support IN ('YES','DEFAULT','ENABLED')" | grep -qx 1; then
    echo "✓ Healthcheck query succeeded — InnoDB is available"
else
    echo "WARNING: Healthcheck query did not return expected result"
fi

echo ""
echo "=== MariaDB healthcheck fix complete ==="
echo "If MariaDB was crash-looping due to InnoDB corruption, you may still need"
echo "to remove the mariadb_data volume and reinitialize (see make fix-db)."