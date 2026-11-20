import { createHash } from 'node:crypto';
import { Queue, QueueEvents } from 'bullmq';
import type { RedisOptions } from 'ioredis';
import config from '../config';
import type {
  EtimsResponse,
  OscuSalesRequest,
  VscuSalesRequest,
} from '../src/sdk/types';

export const SALES_QUEUE_NAME = 'etims-sales-submissions';
export const SALES_JOB_NAME = 'submit-sales-transaction';

export type SalesQueueJobData =
  | { mode: 'oscu'; request: OscuSalesRequest }
  | { mode: 'vscu'; request: VscuSalesRequest };

export const salesJobOptions = {
  attempts: 1,
  removeOnComplete: { count: 100, age: 24 * 60 * 60 },
  removeOnFail: { age: 7 * 24 * 60 * 60 },
} as const;

let salesQueue: Queue<SalesQueueJobData, EtimsResponse> | null = null;
let salesQueueEvents: QueueEvents | null = null;

function redisConnectionOptions(): RedisOptions {
  if (!config.redis.url) {
    return {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: null,
    };
  }

  const url = new URL(config.redis.url);
  if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use the redis:// or rediss:// protocol');
  }
  const database = url.pathname.length > 1 ? Number(url.pathname.slice(1)) : 0;
  if (!Number.isInteger(database) || database < 0) {
    throw new Error('REDIS_URL must contain a valid database number');
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: database,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

function getQueue(): Queue<SalesQueueJobData, EtimsResponse> {
  if (!salesQueue) {
    const connection = redisConnectionOptions();
    salesQueue = new Queue<SalesQueueJobData, EtimsResponse>(SALES_QUEUE_NAME, {
      connection,
      defaultJobOptions: salesJobOptions,
    });
    salesQueue.on('error', (error) => {
      // Queue errors are surfaced to the submitting request or worker; this prevents
      // Redis event-emitter errors from becoming unhandled process exceptions.
      console.error('[eTIMS sales queue] Redis queue error:', error);
    });
  }
  return salesQueue;
}

function getQueueEvents(): QueueEvents {
  if (!salesQueueEvents) {
    salesQueueEvents = new QueueEvents(SALES_QUEUE_NAME, {
      connection: redisConnectionOptions(),
    });
    salesQueueEvents.on('error', (error) => {
      console.error('[eTIMS sales queue] Queue event error:', error);
    });
  }
  return salesQueueEvents;
}

export function salesJobId(jobData: SalesQueueJobData): string {
  const identity = jobData.mode === 'oscu'
    ? `${jobData.request.tin}|${jobData.request.bhfId}|${jobData.request.invcNo}`
    : `${jobData.request.tin}|${jobData.request.bhfId}|${jobData.request.trdInvcNo}|${jobData.request.invcNo}`;
  const digest = createHash('sha256').update(`${jobData.mode}|${identity}`).digest('hex');
  return `sale-${digest}`;
}

export async function submitSalesTransaction(jobData: SalesQueueJobData): Promise<EtimsResponse> {
  const queue = getQueue();
  const events = getQueueEvents();
  await Promise.all([queue.waitUntilReady(), events.waitUntilReady()]);

  const job = await queue.add(
    SALES_JOB_NAME,
    jobData,
    { jobId: salesJobId(jobData) }
  );
  return job.waitUntilFinished(events, config.queueWaitTimeoutMs);
}

export async function closeSalesQueue(): Promise<void> {
  const resources: Promise<void>[] = [];
  if (salesQueueEvents) {
    resources.push(salesQueueEvents.close());
    salesQueueEvents = null;
  }
  if (salesQueue) {
    resources.push(salesQueue.close());
    salesQueue = null;
  }
  await Promise.all(resources);
}

export { redisConnectionOptions };
