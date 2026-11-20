import { Worker, type Job } from 'bullmq';
import config from '../config';
import logger from '../utils/logger';
import { createEtimsClient, type EtimsClient } from '../src/sdk/client';
import type { EtimsClientOptions, EtimsResponse } from '../src/sdk/types';
import {
  SALES_JOB_NAME,
  SALES_QUEUE_NAME,
  redisConnectionOptions,
  type SalesQueueJobData,
} from '../queues/salesQueue';

let etimsClient: EtimsClient | null = null;

function getEtimsClient(): EtimsClient {
  if (etimsClient) return etimsClient;
  const { mode, baseUrl, tin, bhfId } = config.etims;
  if (!tin || !bhfId) {
    throw new Error('ETIMS_TIN and ETIMS_BHF_ID must be configured before processing sales');
  }

  const options: EtimsClientOptions = { mode, baseUrl, tin, bhfId };
  if (mode === 'oscu') {
    if (!config.etims.username || !config.etims.password || !config.etims.communicationKey) {
      throw new Error(
        'ETIMS_USERNAME, ETIMS_PASSWORD, and ETIMS_COMMUNICATION_KEY must be configured for OSCU'
      );
    }
    options.username = config.etims.username;
    options.password = config.etims.password;
    options.communicationKey = config.etims.communicationKey;
  } else {
    options.allowInsecureVscu = config.etims.allowInsecureVscu;
  }

  etimsClient = createEtimsClient(options);
  return etimsClient;
}

export async function processSalesJob(
  job: Job<SalesQueueJobData>
): Promise<EtimsResponse> {
  if (job.name !== SALES_JOB_NAME) {
    throw new Error(`Unsupported eTIMS sales job: ${job.name}`);
  }
  if (job.data.mode !== config.etims.mode) {
    throw new Error(`Queued ${job.data.mode.toUpperCase()} job does not match configured eTIMS mode`);
  }

  logger.info(`Processing eTIMS sales job ${job.id}`);
  return getEtimsClient().sendSalesTransaction(job.data.request);
}

export function createSalesWorker() {
  const worker = new Worker<SalesQueueJobData, EtimsResponse>(
    SALES_QUEUE_NAME,
    processSalesJob,
    {
      connection: redisConnectionOptions(),
      concurrency: 1,
      maxStalledCount: 0,
    }
  );

  worker.on('completed', (job) => {
    logger.info(`eTIMS sales job ${job.id} completed`);
  });
  worker.on('failed', (job, error) => {
    logger.error(`eTIMS sales job ${job?.id ?? 'unknown'} failed`, error);
  });
  worker.on('error', (error) => {
    logger.error('eTIMS sales worker error', error);
  });
  return worker;
}

async function main(): Promise<void> {
  const worker = createSalesWorker();
  await worker.waitUntilReady();
  logger.info(`eTIMS sales worker listening on ${SALES_QUEUE_NAME} (concurrency 1)`);

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}; closing eTIMS sales worker`);
    await worker.close();
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

if (require.main === module) {
  main().catch((error: unknown) => {
    logger.error('Failed to start eTIMS sales worker', error);
    process.exitCode = 1;
  });
}
