import { Queue } from 'bullmq';
import Redis from 'ioredis';
import Logger from '../../../packages/shared-logger/src/index';

let excelExportQueue: Queue | null = null;

/**
 * Safely initialize the Excel export queue
 * Returns null if Redis is not available, but doesn't crash
 */
export async function getExcelExportQueue(): Promise<Queue | null> {
  if (excelExportQueue) return excelExportQueue;

  try {
    const connectionOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    };

    // Test connection first
    const testConnection = new Redis(connectionOptions);
    await testConnection.connect();
    await testConnection.quit();

    // If connection successful, create the queue
    excelExportQueue = new Queue('excel-export', {
      connection: connectionOptions,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 3600, // Keep completed jobs for 24 hours
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    Logger.info('[ExcelExport] Queue initialized successfully');
    return excelExportQueue;
  } catch (error: any) {
    Logger.warn(`[ExcelExport] Redis not available - queue disabled (${error.message})`);
    excelExportQueue = null;
    return null;
  }
}

/**
 * Check if the queue is available
 */
export function isExcelExportQueueAvailable(): boolean {
  return excelExportQueue !== null;
}

// Export for backward compatibility
export { excelExportQueue as queue };
