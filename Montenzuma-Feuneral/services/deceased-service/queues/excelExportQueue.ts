import { Queue } from 'bullmq';
import Redis, { RedisOptions } from 'ioredis';
import Logger from '../../../packages/shared-logger/src/index';

let excelExportQueue: Queue | null = null;
// When Redis is unreachable, don't re-attempt on every request — back off for 30s.
let redisUnavailableUntil = 0;

export interface DeceasedReportJob {
  tenant: { db_name: string; id: number; name: string; tenant_slug: string };
  tenantSlug: string;
  startDate?: string;
  endDate?: string;
  requestedBy?: string;
}

export function getExcelExportConnectionOptions(): RedisOptions {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    connectTimeout: 3000,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
  };
}

/**
 * Safely initialize the Excel export queue
 * Returns null if Redis is not available, but doesn't crash.
 * The connection probe is hard-capped at 3s so API requests never hang.
 */
export async function getExcelExportQueue(): Promise<Queue | null> {
  if (excelExportQueue) return excelExportQueue;

  if (Date.now() < redisUnavailableUntil) return null;

  let testConnection: Redis | null = null;
  try {
    const connectionOptions = getExcelExportConnectionOptions();

    // Probe the connection with a hard ceiling so callers never hang.
    // The error handler prevents "[ioredis] Unhandled error event" spam, and the
    // PING catches auth problems (NOAUTH) that a bare TCP connect hides —
    // without it the queue is created but every queue.add fails with NOAUTH.
    testConnection = new Redis({
      ...connectionOptions,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times: number) => (times > 2 ? null : Math.min(times * 500, 1500)),
    });
    testConnection.on('error', () => { /* probe failure handled via catch below */ });

    await Promise.race([
      (async () => {
        await testConnection!.connect();
        await testConnection!.ping();
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connect timeout (3s)')), 3000)
      ),
    ]);

    // BullMQ requires maxRetriesPerRequest: null on the shared connection
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
    redisUnavailableUntil = Date.now() + 30_000; // retry the connection in 30s
    return null;
  } finally {
    try { testConnection?.disconnect(); } catch { /* already closed */ }
  }
}

/**
 * Check if the queue is available
 */
export function isExcelExportQueueAvailable(): boolean {
  return excelExportQueue !== null;
}

export async function closeExcelExportQueue(): Promise<void> {
  if (!excelExportQueue) return;
  await excelExportQueue.close();
  excelExportQueue = null;
}

// Export for backward compatibility
export { excelExportQueue as queue };
