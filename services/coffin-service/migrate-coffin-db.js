#!/usr/bin/env node
/**
 * Coffin Service - independent central-coffin-database migration runner
 * -------------------------------------------------
 * Creates the central coffin database (if needed) and applies every knex
 * migration under ./migrations. This is run independently of the tenant
 * migration runner - each tenant does NOT get its own coffin schema.
 *
 * Usage:
 *   node migrate-coffin-db.js
 */
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const knex = require('knex');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const COFFIN_DATABASE = process.env.COFFIN_DATABASE || process.env.DB_NAME || 'restpoint_coffin';

const BASE = {
  host: process.env.COFFIN_DB_HOST || process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.COFFIN_DB_PORT || process.env.DB_PORT || 3306),
  user: process.env.COFFIN_DB_USER || process.env.DB_USER || 'restpoint_user',
  password: process.env.COFFIN_DB_PASSWORD || process.env.DB_PASSWORD || '',
};

async function main() {
  console.log(`[COFFIN] Ensuring central database: ${COFFIN_DATABASE}`);

  const admin = mysql.createPool({ ...BASE, waitForConnections: true, connectionLimit: 5, queueLimit: 0 });
  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${COFFIN_DATABASE}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await admin.end();

  console.log(`[COFFIN] Running knex migrations on: ${COFFIN_DATABASE}`);

  const db = knex({
    client: 'mysql2',
    connection: { ...BASE, database: COFFIN_DATABASE, charset: 'utf8mb4' },
    pool: { min: 0, max: 5 },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      tableName: 'knex_migrations',
    },
  });

  const [batch, log] = await db.migrate.latest();
  console.log(`[COFFIN] Migration batch ${batch} applied. Files: ${(log && log.join(', ')) || '(none pending)'}`);

  await db.destroy();
  console.log('[COFFIN] Central coffin database migration complete.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[COFFIN] Migration failed:', (err && err.message) ? err.message : err);
    process.exit(1);
  });
