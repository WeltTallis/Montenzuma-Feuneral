import { Queue, Worker } from 'bullmq';
import { resolveDatabase, safeTenantQuery, safeTenantExecute } from '../../../shared/dbConfig';
import redisService from '../../../packages/shared-services/dist/redisService';
import Logger from '../../../packages/shared-logger/src/index';
import Redis from 'ioredis';

export const PDF_QUEUE_NAME = 'postmortem-pdf-generation';

export interface PDFGenerationJob {
  deceasedId: string;
  tenantSlug: string;
  postmortemId: number;
  requestedBy: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// BullMQ requires maxRetriesPerRequest: null on connections it shares, and the
// Redis server runs with --requirepass: REDIS_PASSWORD MUST be sent or every
// command fails with NOAUTH (this connection previously had no password, which
// spammed "[ioredis] Unhandled error event: ReplyError: NOAUTH" forever).
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

let pdfQueue: Queue | null = null;
let pdfWorker: Worker<PDFGenerationJob> | null = null;
let pdfWorkerStarting: Promise<Worker<PDFGenerationJob> | null> | null = null;

/**
 * Safely initialize the PDF queue
 * Returns null if Redis is not available, but doesn't crash
 */
export async function getPDFQueue(): Promise<Queue | null> {
  if (pdfQueue) return pdfQueue;

  let testConnection: Redis | null = null;
  try {
    // Probe the connection first. Attach the error handler BEFORE connecting so
    // probe failures (NOAUTH / ECONNREFUSED / timeout) never surface as
    // "[ioredis] Unhandled error event" spam, hard-cap the probe so callers
    // never hang, and PING so auth problems are caught — a bare TCP connect
    // succeeds even when the password is wrong.
    testConnection = new Redis({
      ...connection,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      retryStrategy: (times: number) => (times > 2 ? null : Math.min(times * 500, 1500)),
    });
    testConnection.on('error', () => { /* probe failure handled below */ });

    await Promise.race([
      (async () => {
        await testConnection!.connect();
        await testConnection!.ping();
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connect timeout (3s)')), 3000)
      ),
    ]);

    // If connection successful, create the queue
    pdfQueue = new Queue<PDFGenerationJob>(PDF_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100, age: 24 * 3600 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    });
    pdfQueue.on('error', (err: Error) => {
      Logger.warn(`[PDFQueue] Queue error: ${err.message}`);
    });

    Logger.info('[PDFQueue] Queue initialized successfully');
    return pdfQueue;
  } catch (error: any) {
    Logger.warn(`[PDFQueue] Redis not available - queue disabled (${error.message})`);
    pdfQueue = null;
    return null;
  } finally {
    try { testConnection?.disconnect(); } catch { /* already closed */ }
  }
}

export async function queuePDFGeneration(jobData: PDFGenerationJob): Promise<string> {
  const queue = await getPDFQueue();
  if (!queue) {
    throw new Error('PDF queue not available - Redis is not connected');
  }

  const job = await queue.add('generate-postmortem-pdf', jobData, {
    priority: jobData.priority === 'urgent' ? 1 : jobData.priority === 'high' ? 2 : jobData.priority === 'low' ? 4 : 3,
  });
  return job.id || '';
}

async function processPDFGeneration(job: any): Promise<void> {
  const { deceasedId, tenantSlug } = job.data;
  console.log(`Processing PDF for: ${deceasedId}`);
}

export function startPDFWorker(): Promise<Worker<PDFGenerationJob> | null> {
  if (pdfWorker) return Promise.resolve(pdfWorker);
  if (pdfWorkerStarting) return pdfWorkerStarting;

  pdfWorkerStarting = (async () => {
    const queue = await getPDFQueue();
    if (!queue) {
      console.log('PDF Worker not started - Redis not available');
      return null;
    }

    const worker = new Worker<PDFGenerationJob>(PDF_QUEUE_NAME, processPDFGeneration, {
      connection,
      concurrency: 2,
    });
    worker.on('error', (err: Error) => {
      console.warn(`[PDFWorker] Worker error: ${err.message}`);
    });
    pdfWorker = worker;
    console.log('PDF Worker started');
    return worker;
  })().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    Logger.warn(`[PDFWorker] Failed to start: ${message}`);
    return null;
  }).finally(() => {
    pdfWorkerStarting = null;
  });

  return pdfWorkerStarting;
}

export function isPDFQueueAvailable(): boolean {
  return pdfQueue !== null;
}

// Export for backward compatibility
export { pdfQueue as queue };
