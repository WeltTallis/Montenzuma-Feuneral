// ============================================
// Migration Runner - Hearse Service
// ============================================
// Simple script to run hearse service migrations

import * as dotenv from 'dotenv';
import * as path from 'path';
import { runMigrations } from './database';

// Load environment variables from multiple locations
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Main migration function
 */
const main = async (): Promise<void> => {
  try {

    await runMigrations();

    process.exit(0);
  } catch (error) {

    process.exit(1);
  }
};

// Run the migration
main();

// Handle uncaught errors
process.on('uncaughtException', (error) => {

  process.exit(1);

});

process.on('unhandledRejection', (reason) => {

  process.exit(1);

});