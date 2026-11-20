import axios from 'axios';
import { Job, Queue, Worker } from 'bullmq';
import { clearServiceCache } from '@montezuma/shared-services';
import { sendTransactionalSms } from './sendTransactionalSms';

type SideEffectJob =
    | {
        kind: 'sms';
        payload: { phone: string; message: string; tenantSlug: string; event: string };
    }
    | {
        kind: 'body-released';
        payload: { tenantSlug: string; data: Record<string, unknown> };
    }
    | {
        kind: 'hearse-booking-created';
        payload: { tenantSlug: string; data: Record<string, unknown> };
    }
    | {
        kind: 'hearse-data-changed';
        payload: { tenantSlug: string; data: Record<string, unknown> };
    }
    | {
        kind: 'deceased-admitted';
        payload: { tenantSlug: string; data: Record<string, unknown> };
    }
    | {
        kind: 'cache-clear';
        payload: { serviceName: string; scopes: string[] };
    };

const queueName = 'restpoint-side-effects';
function redisConnection() {
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        connectTimeout: 3000,
        retryStrategy: (times: number) => Math.min(times * 500, 30_000),
    };
}

let sideEffectQueue: Queue<SideEffectJob> | null = null;
let sideEffectWorker: Worker<SideEffectJob> | null = null;

function getQueue(): Queue<SideEffectJob> {
    if (!sideEffectQueue) {
        sideEffectQueue = new Queue<SideEffectJob>(queueName, {
            connection: redisConnection(),
            defaultJobOptions: {
                attempts: 5,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: { count: 1000, age: 24 * 60 * 60 },
                removeOnFail: { age: 7 * 24 * 60 * 60 },
            },
        });
        sideEffectQueue.on('error', (error) => {
            console.error('[SideEffects] Queue error:', error.message);
        });
    }
    return sideEffectQueue;
}

export async function enqueueSideEffect(job: SideEffectJob): Promise<void> {
    await getQueue().add(job.kind, job);
}

async function processSideEffect(job: Job<SideEffectJob>): Promise<void> {
    const task = job.data;

    if (task.kind === 'sms') {
        const sent = await sendTransactionalSms(task.payload);
        if (!sent) throw new Error(`SMS delivery failed for ${task.payload.event}`);
        return;
    }

    if (task.kind === 'cache-clear') {
        await Promise.all(task.payload.scopes.map((scope) => clearServiceCache(task.payload.serviceName, scope)));
        return;
    }

    const socketUrl = process.env.SOCKETIO_SERVICE_URL || 'http://restpoint_socketio_service:5000';
    let endpoint: string;
    if (task.kind === 'body-released') endpoint = '/emit/body-released';
    else if (task.kind === 'hearse-booking-created') endpoint = '/emit/hearse-booking-created';
    else if (task.kind === 'deceased-admitted') endpoint = '/emit/deceased-admitted';
    else endpoint = '/emit/hearse_data_changed';
    await axios.post(
        `${socketUrl}${endpoint}`,
        { tenantSlug: task.payload.tenantSlug, data: task.payload.data },
        { timeout: 5000 }
    );
}

export function startAsyncSideEffectWorker(): Worker<SideEffectJob> {
    if (sideEffectWorker) return sideEffectWorker;

    sideEffectWorker = new Worker<SideEffectJob>(queueName, processSideEffect, {
        connection: redisConnection(),
        concurrency: 5,
    });
    sideEffectWorker.on('failed', (job, error) => {
        console.error(`[SideEffects] Job ${job?.id} failed:`, error.message);
    });
    sideEffectWorker.on('error', (error) => {
        console.error('[SideEffects] Worker error:', error.message);
    });
    return sideEffectWorker;
}

export async function closeAsyncSideEffectResources(): Promise<void> {
    if (sideEffectWorker) {
        await sideEffectWorker.close();
        sideEffectWorker = null;
    }
    if (sideEffectQueue) {
        await sideEffectQueue.close();
        sideEffectQueue = null;
    }
}
