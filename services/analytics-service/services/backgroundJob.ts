import { Queue, type JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '@montezuma/shared-logger';

/**
 * Redis configuration
 *   REDIS_HOST=restpoint_redis
 *   REDIS_PORT=6379
 */
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || '6379';
const redisPassword = process.env.REDIS_PASSWORD;

const REDIS_URL =
  process.env.REDIS_URL ||
  `redis://${redisPassword ? `:${encodeURIComponent(redisPassword)}@` : ''}${redisHost}:${redisPort}`;

/**
 * BullMQ requires maxRetriesPerRequest: null for connections
 * used by workers/queues.
 */
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

/**
 * Redis connection logging
 */
connection.on('connect', () => {
  logger.info('Analytics Redis connection established');
});

connection.on('ready', () => {
  logger.info('Analytics Redis connection ready');
});

connection.on('error', (error: Error) => {
  logger.error(

    {
      message: 'Analytics Redis connection error',
      error: error?.message
    }


  );
});

connection.on('close', () => {
  logger.warn('Analytics Redis connection closed');
});

/**
 * Analytics queue
 */
const analyticsQueue = new Queue('analytics-jobs', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000,
    },
  },
});

/**
 * Add an analytics job.
 */
async function addJob(
  data: Record<string, unknown>,
  opts: JobsOptions = {},
): Promise<string> {
  const job = await analyticsQueue.add(
    'analytics-job',
    data,
    opts,
  );

  if (!job.id) {
    throw new Error('Analytics job was created without an ID');
  }

  return String(job.id);
}

async function scheduleDailyOperationsSms(): Promise<void> {
  if (process.env.DAILY_OPERATIONS_SMS_ENABLED === 'false') {
    logger.info('Daily operations SMS schedule is disabled');
    return;
  }

  const cron = process.env.DAILY_OPERATIONS_SMS_CRON || '0 18 * * *';
  const timeZone = process.env.DAILY_OPERATIONS_SMS_TIMEZONE || 'Africa/Nairobi';
  await analyticsQueue.add(
    'daily-operations-sms',
    {},
    {
      jobId: 'daily-operations-sms',
      repeat: { pattern: cron, tz: timeZone },
      removeOnComplete: { age: 86400, count: 50 },
      removeOnFail: { age: 604800, count: 50 },
    },
  );
  logger.info({ msg: 'Daily operations SMS schedule registered', cron, timeZone });
}

/**
 * Get an analytics job by ID.
 */
async function getJob(jobId: string) {
  if (!jobId || !jobId.trim()) {
    return null;
  }

  const job = await analyticsQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();

  return {
    id: String(job.id),
    state,
    data: job.data,
    result: job.returnvalue ?? null,
    failedReason: job.failedReason ?? null,
    finishedOn: job.finishedOn ?? null,
    processedOn: job.processedOn ?? null,
    timestamp: job.timestamp,
  };
}

/**
 * Remove old completed and failed jobs.
 *
 * completedGraceSeconds:
 *   How long completed jobs should be retained.
 *
 * failedGraceSeconds:
 *   How long failed jobs should be retained.
 */
async function cleanupOldJobs(
  completedGraceSeconds = 3600,
  failedGraceSeconds = 86400,
): Promise<void> {
  try {
    const completedGraceMs = completedGraceSeconds * 1000;
    const failedGraceMs = failedGraceSeconds * 1000;

    await analyticsQueue.clean(
      completedGraceMs,
      1000,
      'completed',
    );

    await analyticsQueue.clean(
      failedGraceMs,
      1000,
      'failed',
    );

    logger.info('Analytics queue cleanup completed');
  } catch (error) {
    logger.error(

      {
        message: 'Error cleaning old analytics jobs',
        error: error?.message,
      }

    );
  }
}

/**
 * Periodic cleanup.
 *
 * Enabled by default.
 *
 * Set:
 *   ENABLE_JOB_CLEANUP=false
 *
 * to disable it.
 */
let cleanupTimer: NodeJS.Timeout | undefined;

if (process.env.ENABLE_JOB_CLEANUP !== 'false') {
  const cleanupIntervalMs = Number.parseInt(
    process.env.JOB_CLEANUP_INTERVAL_MS || '3600000',
    10,
  );

  if (
    Number.isFinite(cleanupIntervalMs) &&
    cleanupIntervalMs > 0
  ) {
    cleanupTimer = setInterval(() => {
      cleanupOldJobs().catch((error) => {
        logger.error(
          {
            message: 'cleanupOldJobs error',
            error,
          }
        );
      });
    }, cleanupIntervalMs);

    /**
     * Don't allow the cleanup timer to prevent
     * graceful Node.js process shutdown.
     */
    cleanupTimer.unref();
  } else {
    logger.warn(
      `Invalid JOB_CLEANUP_INTERVAL_MS: ${process.env.JOB_CLEANUP_INTERVAL_MS}`,
    );
  }
}

/**
 * Graceful shutdown.
 *
 * This is useful when the Docker container receives
 * SIGTERM/SIGINT during deployment or restart.
 */
async function closeQueue(): Promise<void> {
  try {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = undefined;
    }

    await analyticsQueue.close();
    await connection.quit();

    logger.info(
      'Analytics queue and Redis connection closed',
    );
  } catch (error) {
    logger.error(
      {
        message: 'Error closing analytics queue',
        error: error?.message
      }
    );
  }
}

export {
  analyticsQueue as queue,
  addJob,
  getJob,
  scheduleDailyOperationsSms,
  cleanupOldJobs,
  closeQueue,
};
