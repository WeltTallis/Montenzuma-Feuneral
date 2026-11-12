-- ============================================================
-- 999_grant_auto_provision.sql

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