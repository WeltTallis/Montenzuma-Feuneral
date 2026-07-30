// ============================================
// HEARSE SERVICE - Local Database Configuration
// ============================================
// Self-contained within hearse service - no external imports
// Uses environment variables from .env or docker-compose
// Uses knex for migrations

import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import knex, { Knex } from 'knex';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load root .env file - works from both source and dist directories
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ============================================
// Type Definitions
// ============================================

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
}

export interface KnexMigrationConfig {
  client: string;
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    charset: string;
  };
  migrations: {
    directory: string;
    tableName: string;
  };
  pool: {
    min: number;
    max: number;
  };
}

// ============================================
// Configuration
// ============================================

const HEARSE_DB_CONFIG: DatabaseConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.HEARSE_DB_NAME || 'restpoint_hearses',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// ============================================
// Database Connection Pool
// ============================================

let hearsePool: Pool | null = null;

/**
 * Get or create the database connection pool
 */
export const getHearsePool = async (): Promise<Pool> => {
  if (!hearsePool) {
    try {
      hearsePool = await mysql.createPool(HEARSE_DB_CONFIG);
      console.log('✅ [HearseService] Local hearse database pool created:', HEARSE_DB_CONFIG.database);
    } catch (error) {
      console.error('❌ [HearseService] Failed to create hearse database pool:', error);
      throw error;
    }
  }
  return hearsePool;
};

/**
 * Get a connection from the pool
 */
export const getHearseConnection = async (): Promise<PoolConnection> => {
  const pool = await getHearsePool();
  return pool.getConnection();
};

/**
 * Execute a safe query with parameters
 */
export const safeQuery = async (
  sql: string,
  params: any[] = []
): Promise<any> => {
  const pool = await getHearsePool();
  const [rows] = await pool.query(sql, params);
  return rows;
};

/**
 * Execute a safe query and return rows directly
 */
export const safeQueryRows = async <T extends RowDataPacket>(
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  const pool = await getHearsePool();
  const [rows] = await pool.query<T[]>(sql, params);
  return rows;
};

/**
 * Execute a safe query and return the result (for INSERT/UPDATE/DELETE)
 */
export const safeQueryResult = async (
  sql: string,
  params: any[] = []
): Promise<ResultSetHeader> => {
  const pool = await getHearsePool();
  const [result] = await pool.query<ResultSetHeader>(sql, params);
  return result;
};

/**
 * Execute a transaction with multiple queries
 */
export const transaction = async <T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await getHearseConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================
// Knex Migration Runner
// ============================================

/**
 * Run Knex migrations - self-contained
 */
export const runMigrations = async (): Promise<void> => {
  console.log('🔄 [HearseService] Running knex migrations...');

  // First ensure the database exists
  const rootPool = await mysql.createPool({
    host: HEARSE_DB_CONFIG.host,
    port: HEARSE_DB_CONFIG.port,
    user: HEARSE_DB_CONFIG.user,
    password: HEARSE_DB_CONFIG.password,
    multipleStatements: true
  });

  await rootPool.query(
    `CREATE DATABASE IF NOT EXISTS \`${HEARSE_DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`✅ [HearseService] Database ensured: ${HEARSE_DB_CONFIG.database}`);
  await rootPool.end();

  // Run knex migrations
  const knexInstance: Knex = knex({
    client: 'mysql2',
    connection: {
      host: HEARSE_DB_CONFIG.host,
      port: HEARSE_DB_CONFIG.port,
      user: HEARSE_DB_CONFIG.user,
      password: HEARSE_DB_CONFIG.password,
      database: HEARSE_DB_CONFIG.database,
      charset: 'utf8mb4'
    },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      tableName: 'knex_migrations'
    },
    pool: {
      min: 2,
      max: 10
    }
  });

  try {
    const [batchNo, log] = await knexInstance.migrate.latest();
    if (log.length === 0) {
      console.log('✅ [HearseService] All migrations already up to date');
    } else {
      console.log(`✅ [HearseService] Migrations up to date (batch ${batchNo}):`, log);
    }
  } catch (error) {
    console.error('❌ [HearseService] Migration failed:', error);
    throw error;
  } finally {
    await knexInstance.destroy();
  }
};

/**
 * Rollback migrations
 */
export const rollbackMigrations = async (): Promise<void> => {
  console.log('[HearseService] Rolling back migrations...');

  const knexInstance: Knex = knex({
    client: 'mysql2',
    connection: {
      host: HEARSE_DB_CONFIG.host,
      port: HEARSE_DB_CONFIG.port,
      user: HEARSE_DB_CONFIG.user,
      password: HEARSE_DB_CONFIG.password,
      database: HEARSE_DB_CONFIG.database,
      charset: 'utf8mb4'
    },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      tableName: 'knex_migrations'
    },
    pool: {
      min: 2,
      max: 10
    }
  });

  try {
    const [batchNo, log] = await knexInstance.migrate.rollback();
    if (log.length === 0) {
      console.log('✅ [HearseService] No migrations to rollback');
    } else {
      console.log(`✅ [HearseService] Rolled back batch ${batchNo}:`, log);
    }
  } catch (error) {
    console.error('❌ [HearseService] Rollback failed:', error);
    throw error;
  } finally {
    await knexInstance.destroy();
  }
};

/**
 * Reset database (rollback all and run latest)
 */
export const resetDatabase = async (): Promise<void> => {
  console.log('🔄 [HearseService] Resetting database...');
  await rollbackMigrations();
  await runMigrations();
};

// ============================================
// Health Check
// ============================================

/**
 * Check if the database is healthy
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const pool = await getHearsePool();
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('❌ [HearseService] Health check failed:', error);
    return false;
  }
};

// ============================================
// Exports
// ============================================

export default {
  getHearsePool,
  getHearseConnection,
  safeQuery,
  safeQueryRows,
  safeQueryResult,
  transaction,
  runMigrations,
  rollbackMigrations,
  resetDatabase,
  healthCheck,
  HEARSE_DB_CONFIG
};

export const HEARSE_DB = HEARSE_DB_CONFIG;