-- ============================================================
-- 999_grant_auto_provision.sql
-- ============================================================
-- Grants the app user (restpoint_user) the global CREATE + GRANT
-- privileges it needs to AUTO-PROVISION per-tenant databases at
-- runtime (TenantModel.registerTenant creates one database per
-- tenant and Grants the app user access to it).
--
-- Without these privileges every new tenant fails with:
--   Access denied for user 'restpoint_user'@'%' to database '<tenant>'
--
-- Run ONCE as the MariaDB root/admin user:
--
--   docker exec -i restpoint_mariadb mysql -uroot -p"<DB_ROOT_PASSWORD>" \
--     < init-db.sql/999_grant_auto_provision.sql
--
-- Alternatively start the stack with DB_ADMIN_USER / DB_ADMIN_PASSWORD
-- set (compose wires these automatically) — the tenant-service will then
-- auto-create databases as admin instead of requiring this manual grant.
-- ============================================================

-- Create the user if it does not exist yet (idempotent).
CREATE USER IF NOT EXISTS 'restpoint_user'@'%' IDENTIFIED BY '${DB_PASSWORD}';

-- Global privileges: allows CREATE DATABASE for any new tenant DB and
-- GRANT access to the application user on those databases.
GRANT ALL PRIVILEGES ON *.* TO 'restpoint_user'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'restpoint_user'@'localhost' WITH GRANT OPTION;

-- Keep existing DB objects working.
GRANT ALL PRIVILEGES ON restpoint_main.* TO 'restpoint_user'@'%';
GRANT ALL PRIVILEGES ON restpoint_main.* TO 'restpoint_user'@'localhost';
GRANT ALL PRIVILEGES ON tenant_tracking.* TO 'restpoint_user'@'%';
GRANT ALL PRIVILEGES ON tenant_tracking.* TO 'restpoint_user'@'localhost';
GRANT ALL PRIVILEGES ON restpoint_operations.* TO 'restpoint_user'@'%';
GRANT ALL PRIVILEGES ON restpoint_operations.* TO 'restpoint_user'@'localhost';

FLUSH PRIVILEGES;