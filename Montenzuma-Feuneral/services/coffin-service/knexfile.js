/**
 * Coffin Service - Knex configuration
 * -------------------------------------------------
 * The coffin service uses ONE central (shared) database that serves ALL tenants.
 * It holds every coffin-domain table: coffin inventory, bookings/orders,
 * stock requests, images, coffin usage and deceased-coffin assignments.
 * Tenants are isolated inside that single database via the tenant_slug
 * (and tenant_id) columns - NOT via per-tenant databases.
 *
 * Run the independent migration:
 *   node migrate-coffin-db.js          (recommended - creates the DB too)
 *   npx knex migrate:latest            (requires the central DB to already exist)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const COFFIN_DATABASE = process.env.OPERATIONS_DATABASE || process.env.DB_NAME || 'restpoint_operations';

const buildConfig = () => ({
  client: 'mysql2',
  connection: {
    host: process.env.COFFIN_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.COFFIN_DB_PORT || process.env.DB_PORT || 3306),
    user: process.env.COFFIN_DB_USER || process.env.DB_USER,
    password: process.env.COFFIN_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database: COFFIN_DATABASE,
    charset: 'utf8mb4',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: require('path').resolve(__dirname, 'migrations'),
    tableName: 'knex_migrations',
  },
});

module.exports = {
  development: buildConfig(),
  production: buildConfig(),
};
