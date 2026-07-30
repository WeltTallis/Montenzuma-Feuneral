// ============================================
// Migration Runner - Hearse Service
// ============================================
// Simple script to run hearse service migrations

import * as dotenv from 'dotenv';
import * as path from 'path';
import { runMigrations } from '../database/db';

// Load environment variables from multiple locations
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Main migration function
 */
const main = async (): Promise<void> => {
  try {
    console.log('🔄 [MigrationRunner] Starting migrations...');
    await runMigrations();
    console.log('✅ [MigrationRunner] Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ [MigrationRunner] Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
main();

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ [MigrationRunner] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ [MigrationRunner] Unhandled rejection:', reason);
  process.exit(1);
});