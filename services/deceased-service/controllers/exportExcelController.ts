import { Request, Response } from 'express';
import { getExcelExportQueue, isExcelExportQueueAvailable } from '../queues/excelExportQueue';
import Logger from '../../../packages/shared-logger/src/index';
import { getKenyaTimeISO } from '../../../packages/shared-utils/dist/timestamps';

interface ExportRequest extends Request {
  tenant?: {
    db_name: string;
    id: number;
    tenant_id: number;
    name: string;
    tenant_slug: string;
  };
  tenantSlug?: string;
  user?: { email?: string; id?: number };
}

// ============================================
// EXPORT WITH CHARTS (QuickChart Workaround)
// ============================================
export const exportExcelWithCharts = async (req: ExportRequest, res: Response): Promise<Response> => {
  try {
    const tenant = req.tenant;
    const tenantSlug = req.tenantSlug || 'unknown';
    const user = req.user;

    if (!tenant?.db_name) {
      return res.status(400).json({
        success: false,
        message: 'Tenant information missing'
      });
    }

    const { startDate, endDate } = req.body;

    // Get queue (may be null if Redis is not available)
    const queue = await getExcelExportQueue();
    if (!queue) {
      return res.status(503).json({
        success: false,
        message: 'Export service temporarily unavailable - Redis connection required for background processing'
      });
    }

    // Add job to queue
    const job = await queue.add(
      'export-excel',
      {
        tenantId: tenant.id || tenant.tenant_id,
        tenantSlug: tenant.tenant_slug || tenantSlug,
        dbName: tenant.db_name,
        startDate,
        endDate,
        userId: user?.id?.toString(),
        requestedBy: user?.email || 'System Admin',
      },
      {
        jobId: `excel-export-${tenantSlug}-${Date.now()}`,
        priority: 1,
      }
    );

    Logger.info({ message: `Excel export job queued: ${job.id}` });

    // Return job ID for polling
    const jobId = typeof job.id === 'string' ? job.id : String(job.id);
    return res.status(202).json({
      success: true,
      message: 'Export job queued successfully',
      jobId,
      status: 'processing',
      estimatedTime: '30-60 seconds',
      checkStatusUrl: `/api/deceased/export-status/${jobId}`,
    });

  } catch (error: any) {
    Logger.error({ message: 'Failed to queue Excel export', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to queue export job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// CHECK EXPORT STATUS
// ============================================
export const checkExportStatus = async (req: ExportRequest, res: Response): Promise<Response> => {
  try {
    const { jobId } = req.params;
    const jobIdStr = Array.isArray(jobId) ? jobId[0] : jobId;

    const queue = await getExcelExportQueue();
    if (!queue) {
      return res.status(503).json({
        success: false,
        message: 'Export service temporarily unavailable - Redis connection required'
      });
    }

    const job = await queue.getJob(jobIdStr);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const state = await job.getState();
    const progress = job.progress;

    if (state === 'completed') {
      const result = job.returnvalue;

      // Read the compressed file and send it
      const fs = require('fs');
      const filepath = result?.filepath;

      if (filepath && fs.existsSync(filepath)) {
        const fileBuffer = fs.readFileSync(filepath);

        // Clean up both compressed and original files after sending
        try {
          fs.unlinkSync(filepath);
          if (result?.originalFilepath && fs.existsSync(result.originalFilepath)) {
            fs.unlinkSync(result.originalFilepath);
          }
        } catch (err) {
          Logger.warn({ message: 'Failed to clean up export files', error: err.message });
        }

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${result?.filename || 'export.zip'}`);

        return res.send(fileBuffer);
      }

      return res.status(500).json({
        success: false,
        message: 'File not found'
      });
    }

    if (state === 'failed') {
      const failedReason = job.failedReason;
      return res.status(500).json({
        success: false,
        message: 'Export failed',
        error: failedReason
      });
    }

    // Job is still processing
    return res.status(200).json({
      success: true,
      status: state,
      progress: typeof progress === 'number' ? progress : 0,
      message: 'Export in progress...'
    });

  } catch (error: any) {
    Logger.error({ message: 'Failed to check export status', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to check export status'
    });
  }
};

// ============================================
// GET EXPORT HISTORY
// ============================================
export const getExportHistory = async (req: ExportRequest, res: Response): Promise<Response> => {
  try {
    const tenantSlug = req.tenantSlug || 'unknown';

    // Get recent jobs from the queue
    const queue = await getExcelExportQueue();
    if (!queue) {
      return res.status(503).json({
        success: false,
        message: 'Export service temporarily unavailable - Redis connection required'
      });
    }

    const jobs = await queue.getJobs(['completed', 'failed'], 0, 19);

    const history = jobs
      .filter(job => {
        const data = job.data;
        return data.tenantSlug === tenantSlug;
      })
      .map(job => ({
        jobId: typeof job.id === 'string' ? job.id : String(job.id),
        date: new Date(job.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        range: job.data.startDate && job.data.endDate
          ? `${job.data.startDate} to ${job.data.endDate}`
          : 'All records',
        format: 'XLSX',
        status: job.finishedOn ? 'Completed' : 'Failed',
        recordCount: job.returnvalue?.recordCount || 0,
        requestedBy: job.data.requestedBy || 'System Admin',
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.status(200).json({
      success: true,
      data: history
    });

  } catch (error: any) {
    Logger.error({ message: 'Failed to get export history', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to get export history'
    });
  }
};

export default {
  exportExcelWithCharts,
  checkExportStatus,
  getExportHistory,
};