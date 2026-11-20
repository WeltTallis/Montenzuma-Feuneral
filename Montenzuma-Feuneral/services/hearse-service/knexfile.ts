
//  Knex Configuration
import { Knex } from 'knex';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface KnexConfig {
  [key: string]: Knex.Config;
}

const config: KnexConfig = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'restpoint_user',
      password: process.env.DB_PASSWORD || '',
      database: process.env.OPERATIONS_DATABASE || 'restpoint_operations',
      charset: 'utf8mb4'
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations_hearse'
    },
    pool: {
      min: 2,
      max: 10
    }
  },
  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'restpoint_user',
      password: process.env.DB_PASSWORD || '',
      database: process.env.OPERATIONS_DATABASE || 'restpoint_operations',
      charset: 'utf8mb4'
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations_hearse'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};

export default config;