import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';

import { queue as analyticsQueue } from './services/backgroundJob';
import AnalyticsService from './services/analyticsService';
import { sendDailyOperationsReports } from './services/dailyOperationsSms';
import {
  incrementFailure,
  incrementSuccess,
  init as initMetrics,
  observeJobDuration,
} from './services/metrics';

import { logger } from '@montezuma/shared-logger';

/**
 * Redis configuration
 *
 * Priority:
 * 1. REDIS_URL
 * 2. REDIS_HOST + REDIS_PORT + REDIS_PASSWORD
 *
 * When running inside Docker, REDIS_HOST should normally be:
 *
 *   restpoint_redis
 */
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || '6379';
const redisPassword = process.env.REDIS_PASSWORD;

const REDIS_URL =
  process.env.REDIS_URL ||
  `redis://${redisPassword ? `:${encodeURIComponent(redisPassword)}@` : ''}${redisHost}:${redisPort}`;

/**
 * Redis connection used by the BullMQ worker.
 *
 * BullMQ requires maxRetriesPerRequest: null for worker connections.
 */
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

/**
 * Redis connection events
 */
connection.on('connect', () => {
  logger.info('Analytics worker Redis connection established');
});

connection.on('ready', () => {
  logger.info('Analytics worker Redis connection ready');
});

connection.on('error', (error: Error) => {
  logger.error(
    'Analytics worker Redis connection error',
    error,
  );
});

connection.on('close', () => {
  logger.warn(
    'Analytics worker Redis connection closed',
  );
});

/**
 * Safely convert unknown errors to messages.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Initialize metrics polling for the analytics queue.
 */
try {
  initMetrics(analyticsQueue);
} catch (error: unknown) {
  logger.warn(
    `Could not initialize metrics polling: ${getErrorMessage(error)}`,
  );
}

/**
 * Analytics job data.
 */
interface AnalyticsJobData {
  tenantId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Analytics job result.
 */
interface AnalyticsJobResult {
  jobId: string;
  period: {
    startDate?: string;
    endDate?: string;
  };
  data: unknown;
}

interface DailyOperationsSmsJobResult {
  tenants: number;
  messagesSent: number;
}

/**
 * Create BullMQ worker.
 */
const worker = new Worker<
  AnalyticsJobData,
  AnalyticsJobResult | DailyOperationsSmsJobResult
>(
  'analytics-jobs',
  async (job: Job<AnalyticsJobData>) => {
    if (job.name === 'daily-operations-sms') {
      return sendDailyOperationsReports();
    }

    const {
      tenantId,
      startDate,
      endDate,
    } = job.data || {};

    const requestId =
      Math.random()
        .toString(36)
        .substring(2, 10);

    const jobId = String(job.id);

    logger.info(
      `[${requestId}] Processing analytics job ${jobId} for tenant ${tenantId ?? 'unknown'}`,
    );

    const start = Date.now();

    try {
      /**
       * Validate required data before processing.
       */
      if (!tenantId) {
        throw new Error(
          `Analytics job ${jobId} is missing tenantId`,
        );
      }

      /**
       * Generate dashboard analytics.
       */
      const data =
        await AnalyticsService.getDashboardData(
          tenantId,
          startDate,
          endDate,
        );

      const durationSec =
        (Date.now() - start) / 1000;

      /**
       * Record successful metrics.
       */
      observeJobDuration(
        durationSec,
        tenantId,
      );

      incrementSuccess(tenantId);

      logger.info(
        `[${requestId}] Analytics job ${jobId} completed successfully`,
      );

      return {
        jobId,
        period: {
          startDate,
          endDate,
        },
        data,
      };
    } catch (error: unknown) {
      const durationSec =
        (Date.now() - start) / 1000;

      /**
       * Record failure metrics.
       */
      if (tenantId) {
        observeJobDuration(
          durationSec,
          tenantId,
        );

        incrementFailure(tenantId);
      }

      logger.error(
        `[${requestId}] Analytics job ${jobId} failed during processing: ${getErrorMessage(error)}`,
      );

      /**
       * Re-throw the error so BullMQ marks the job
       * as failed and performs configured retries.
       */
      throw error;
    }
  },
  {
    connection,
    concurrency: 2,
  },
);

/**
 * Worker completed event.
 */
worker.on(
  'completed',
  (job: Job<AnalyticsJobData, AnalyticsJobResult | DailyOperationsSmsJobResult>) => {
    logger.info(
      `Analytics job ${String(job.id)} completed`,
    );
  },
);

/**
 * Worker failed event.
 */
worker.on(
  'failed',
  (
    job: Job<AnalyticsJobData, AnalyticsJobResult | DailyOperationsSmsJobResult> | undefined,
    error: Error,
  ) => {
    logger.error(
      `Analytics job ${job ? String(job.id) : 'unknown'} failed: ${error.message}`,
    );
  },
);

/**
 * Worker error event.
 */
worker.on('error', (error: Error) => {
  logger.error(
    'Analytics worker error',
    error,
  );
});

/**
 * Graceful shutdown.
 */
let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  logger.info(
    `Received ${signal}; shutting down analytics worker...`,
  );

  try {
    /**
     * Stop accepting new jobs and wait for
     * currently running jobs to finish.
     */
    await worker.close();

    /**
     * Close the Redis connection after the worker
     * has stopped.
     */
    await connection.quit();

    logger.info(
      'Analytics worker shut down gracefully',
    );

    process.exit(0);
  } catch (error: unknown) {
    logger.error(
      `Error shutting down analytics worker: ${getErrorMessage(error)}`,
    );

    /**
     * Make sure the Redis connection does not remain
     * open if graceful shutdown fails.
     */
    try {
      connection.disconnect();
    } catch {
      // Ignore disconnect errors during forced shutdown.
    }

    process.exit(1);
  }
}

/**
 * Handle Docker/systemd shutdown signals.
 */
if (require.main === module) {
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('unhandledRejection', (reason: unknown) => {
    logger.error(`Unhandled promise rejection: ${getErrorMessage(reason)}`);
    void shutdown('unhandledRejection');
  });

  process.once('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception in analytics worker', error);
    void shutdown('uncaughtException');
  });
}

export { worker };
