require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

/**
 * Insurance tables live in their own schema.
 *
 * The rest of the platform uses a shared multi-tenant database (see
 * workshop-service / coffin-service, which both point at OPERATIONS_DATABASE
 * and isolate rows by tenant_slug). Insurance is deliberately NOT pointed at
 * that database by default: policies and claims carry national ID numbers,
 * which is personal data that a funeral-home operator has no business reading,
 * and keeping it behind its own database name means a future access-control
 * split touches one file rather than a dozen queries.
 *
 * Set INSURANCE_DATABASE in the environment to point it at the shared
 * database instead if you prefer a single schema.
 */
const getClientConfig = () => {
  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_PORT = Number.parseInt(process.env.DB_PORT || '3306', 10);
  const DB_USER = process.env.DB_USER || 'root';
  const DB_PASSWORD = process.env.DB_PASSWORD || '';
  const DB_NAME = process.env.INSURANCE_DATABASE || 'restpoint_insurance';

  return {
    client: 'mysql2',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      // MariaDB in this stack is 10.11+; without this the driver can attempt
      // GSSAPI and fail the handshake (same fix as shared/config/db.js).
      authPlugins: {
        auth_gssapi_client: () => () => {
          throw new Error('GSSAPI not supported - use mysql_native_password');
        },
      },
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations_insurance',
    },
  };
};

module.exports = {
  development: getClientConfig(),
  production: getClientConfig(),
};