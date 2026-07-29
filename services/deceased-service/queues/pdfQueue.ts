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

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

let pdfQueue: Queue | null = null;

/**
 * Safely initialize the PDF queue
 * Returns null if Redis is not available, but doesn't crash
 */
export async function getPDFQueue(): Promise<Queue | null> {
  if (pdfQueue) return pdfQueue;

  try {
    // Test connection first
    const testConnection = new Redis(connection);
    await testConnection.connect();
    await testConnection.quit();

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

    Logger.info('[PDFQueue] Queue initialized successfully');
    return pdfQueue;
  } catch (error: any) {
    Logger.warn(`[PDFQueue] Redis not available - queue disabled (${error.message})`);
    pdfQueue = null;
    return null;
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

export function startPDFWorker(): void {
  // Only start worker if Redis is available
  getPDFQueue().then((queue) => {
    if (queue) {
      const worker = new Worker<PDFGenerationJob>(PDF_QUEUE_NAME, processPDFGeneration, {
        connection,
        concurrency: 2,
      });
      console.log('PDF Worker started');
    } else {
      console.log('PDF Worker not started - Redis not available');
    }
  });
}

export function isPDFQueueAvailable(): boolean {
  return pdfQueue !== null;
}

// Export for backward compatibility
export { pdfQueue as queue };
