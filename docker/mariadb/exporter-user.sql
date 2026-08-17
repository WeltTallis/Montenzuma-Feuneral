-- =============================================================================
-- RestPoint - Dedicated monitoring user for the Prometheus mysql_exporter
-- =============================================================================
-- Auto-executed by the MariaDB entrypoint on FIRST database initialisation
-- (empty data volume) from /docker-entrypoint-initdb.d/01-exporter-user.sql.
--
-- On an EXISTING / already-initialised database this will NOT run automatically.
-- Create the user manually instead:
--
--   docker exec -i restpoint_mariadb mysql -uroot -p"<DB_ROOT_PASSWORD>" \
--     < docker/mariadb/exporter-user.sql
--
-- The password below MUST match DATA_SOURCE_NAME in monitoring/docker-compose.yml
-- (mysql-exporter service).
-- =============================================================================

CREATE USER IF NOT EXISTS 'exporter'@'%' IDENTIFIED BY 'exporter_password' WITH MAX_USER_CONNECTIONS 3;

-- Full grant set so the exporter exposes every metric it can.
--   SELECT            -> information_schema + performance_schema data
--   PROCESS           -> SHOW GLOBAL STATUS / VARIABLES, SHOW ENGINE INNODB STATUS
--   REPLICATION CLIENT-> SHOW SLAVE STATUS / Galera (wsrep) replication status
--   SUPER             -> SHOW MASTER STATUS, full global-scope visibility
--   RELOAD            -> FLUSH / binlog visibility
--   LOCK TABLES       -> FLUSH TABLES WITH READ LOCK (consistency)
--   EVENT/SHOW VIEW/SHOW ROUTINE/TRIGGER -> schema metadata
GRANT SELECT, PROCESS, REPLICATION CLIENT, SUPER, RELOAD, LOCK TABLES,
      EVENT, SHOW VIEW, SHOW ROUTINE, TRIGGER
  ON *.* TO 'exporter'@'%';

FLUSH PRIVILEGES;
