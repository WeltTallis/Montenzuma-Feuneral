/**
 * Insurance Service - database bootstrap.
 *
 * Unlike the shared services this one owns its own schema
 * (`restpoint_insurance` by default). Two things therefore have to happen at
 * boot that the other services never do:
 *
 *   1. CREATE DATABASE IF NOT EXISTS - MariaDB cannot create a database from
 *      inside an already-`USE`d connection, so we connect WITHOUT a database
 *      first, issue the CREATE, and only then open a pool bound to it.
 *   2. Run migrations - knex is invoked in-process (not via the CLI) so that
 *      `docker compose up` on a fresh volume produces working tables without
 *      anyone having to remember to run `npm run migrate`.
 *
 * Both are idempotent, so restarting the container is always safe.
 */
import mysql from 'mysql2/promise';
import path from 'path';
import knexLib, { Knex } from 'knex';

export const DB_NAME: string =
  process.env.INSURANCE_DATABASE || 'restpoint_insurance';

/** MariaDB 10.11+ in this stack needs the GSSAPI guard (see shared/config/db.js). */
const authPlugins = {
  auth_gssapi_client: () => () => {
    throw new Error('GSSAPI not supported - use mysql_native_password');
  },
};

const ROOT_CONNECTION = {
  host: process.env.DB_HOST || 'mariadb',
  port: Number.parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  authPlugins,
} as any;

let instance: Knex | null = null;

/** Create the schema if it is not there yet. Idempotent. */
export async function ensureDatabase(): Promise<void> {
  // The name comes from our own env var, but validate the identifier anyway so
  // a stray backtick in .env cannot turn this into a syntax error at boot.
  if (!/^[A-Za-z0-9_]+$/.test(DB_NAME)) {
    throw new Error(`INSURANCE_DATABASE is not a valid identifier: ${DB_NAME}`);
  }

  const conn = await mysql.createConnection(ROOT_CONNECTION);
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` ` +
        'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    );
  } finally {
    await conn.end();
  }
}

/** Shared knex instance bound to the insurance database. */
export function getKnex(): Knex {
  if (instance) return instance;

  const config = require(path.join(__dirname, '..', 'knexfile.js')).production;

  instance = knexLib({
    client: 'mysql2',
    connection: { ...config.connection, database: DB_NAME },
    pool: config.pool,
    migrations: config.migrations,
  });

  return instance;
}

/**
 * Apply pending migrations. Safe to call on every boot.
 * A transient DB outage at start-up is logged rather than thrown so the
 * container does not crash-loop - /health reports the real problem instead.
 */
export async function runMigrations(): Promise<boolean> {
  const knex = getKnex();
  try {
    const [batch, applied] = await knex.migrate.latest();
    if (applied && applied.length) {
      console.log(`[insurance] applied ${applied.length} migration(s) (batch ${batch})`);
    } else {
      console.log('[insurance] schema already up to date');
    }
    return true;
  } catch (err: any) {
    console.error('[insurance] migration failed:', err?.message || err);
    return false;
  }
}

/** True when the policies table exists - used by /health. */
export async function isSchemaReady(): Promise<boolean> {
  try {
    return await getKnex().schema.hasTable('insurance_policies');
  } catch {
    return false;
  }
}

/** Initialise everything: create the database, then migrate. */
export async function init(): Promise<void> {
  await ensureDatabase();
  await runMigrations();
}

/** Close the pool cleanly on SIGTERM so docker stops without a 10s wait. */
export async function close(): Promise<void> {
  if (instance) {
    await instance.destroy();
    instance = null;
  }
}