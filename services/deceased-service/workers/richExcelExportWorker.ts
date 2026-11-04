import { Response } from 'express';
import { Worker } from 'bullmq';
import Logger from '../../../packages/shared-logger/src/index';
import {
    getExcelExportConnectionOptions,
    getExcelExportQueue,
    DeceasedReportJob
} from '../queues/excelExportQueue';
import { exportExcelWithCharts } from '../controllers/exel/exportExcelController';

export async function createExcelExportWorker(): Promise<Worker | null> {
    try {
        const queue = await getExcelExportQueue();
        if (!queue) return null;

        const worker = new Worker<DeceasedReportJob>(
            'excel-export',
            async (job) => {
                await job.updateProgress(5);
                let statusCode = 200;
                let responseBody: any;
                const request: any = {
                    tenant: job.data.tenant,
                    tenantSlug: job.data.tenantSlug,
                    user: { email: job.data.requestedBy },
                    body: { startDate: job.data.startDate, endDate: job.data.endDate },
                    _processingExportJob: true,
                };
                const response = {
                    status(code: number) {
                        statusCode = code;
                        return this;
                    },
                    json(body: unknown) {
                        responseBody = body;
                        return this;
                    },
                    send(body: unknown) {
                        responseBody = body;
                        return this;
                    },
                    setHeader() {
                        return this;
                    },
                } as unknown as Response;

                await exportExcelWithCharts(request, response);
                if (statusCode < 200 || statusCode >= 300 || !responseBody?.success || !responseBody?.fileUrl) {
                    throw new Error(responseBody?.message || 'Report could not be uploaded');
                }
                await job.updateProgress(100);
                return responseBody;
            },
            { connection: getExcelExportConnectionOptions(), concurrency: 1 }
        );

        worker.on('completed', (job) => {
            Logger.info({ message: `Rich deceased report job ${job.id} completed` });
        });
        worker.on('failed', (job, error) => {
            Logger.error({ message: `Rich deceased report job ${job?.id} failed`, error: error.message });
        });
        worker.on('error', (error) => {
            Logger.error({ message: 'Rich deceased report worker error', error: error.message });
        });
        return worker;
    } catch (error: any) {
        Logger.warn(`[ExcelExportWorker] Failed to create rich report worker: ${error.message}`);
        return null;
    }
}
