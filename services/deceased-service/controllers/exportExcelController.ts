import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { getExcelExportQueue, isExcelExportQueueAvailable } from '../queues/excelExportQueue';
import { safeTenantQuery } from '../../../shared/dbConfig';
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
// SYNCHRONOUS FALLBACK (no Redis required)
// Generates the Excel file in-process and streams it back so the
// user still gets their export when the queue is unavailable.
// ============================================
const generateSyncExcelExport = async (
  req: ExportRequest,
  res: Response,
  startDate?: string,
  endDate?: string
): Promise<Response> => {
  try {
    const tenant = req.tenant;
    const dbName = tenant?.db_name;
    if (!dbName) {
      return res.status(400).json({ success: false, message: 'Tenant information missing' });
    }

    let whereClause = '';
    const params: any[] = [];
    if (startDate && endDate) {
      whereClause = 'WHERE created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const query = `
      SELECT deceased_id, full_name, admission_number, date_of_birth, date_of_death,
             next_of_kin, service_type, body_status, release_date, date_admitted, created_at
      FROM deceased
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 5000
    `;
    const records: any[] = await safeTenantQuery(dbName, query, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Deceased Records');
    sheet.columns = [
      { header: 'Deceased ID', key: 'deceased_id', width: 18 },
      { header: 'Full Name', key: 'full_name', width: 28 },
      { header: 'Admission No.', key: 'admission_number', width: 16 },
      { header: 'Date Admitted', key: 'date_admitted', width: 20 },
      { header: 'Date of Birth', key: 'date_of_birth', width: 16 },
      { header: 'Date of Death', key: 'date_of_death', width: 16 },
      { header: 'Status', key: 'body_status', width: 18 },
      { header: 'Next of Kin', key: 'next_of_kin', width: 24 },
      { header: 'Service Type', key: 'service_type', width: 16 },
      { header: 'Release Date', key: 'release_date', width: 18 },
      { header: 'Registered', key: 'created_at', width: 20 },
    ];
    sheet.getRow(1).font = { bold: true, color: { argb: 'FF15171A' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3EFE6' } };

    (records || []).forEach((r) => sheet.addRow(r));

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `${tenant?.tenant_slug || 'tenant'}_Deceased_Records_${new Date().toISOString().slice(0, 10)}.xlsx`;

    Logger.info({ message: `Sync Excel export generated: ${records?.length || 0} records (queue unavailable)` });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.send(Buffer.from(buffer));
  } catch (error: any) {
    Logger.error({ message: 'Sync Excel export failed', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to generate export',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

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
      // No Redis → generate the file synchronously so the export still works
      return await generateSyncExcelExport(req, res, startDate, endDate);
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

      // Read the generated file and send it
      const fs = require('fs');
      const filepath = result?.filepath;

      if (filepath && fs.existsSync(filepath)) {
        const fileBuffer = fs.readFileSync(filepath);

        // Clean up the file after sending (single file — the worker no longer
        // produces a separate "compressed" copy)
        try {
          fs.unlinkSync(filepath);
        } catch (err) {
          Logger.warn({ message: 'Failed to clean up export file', error: err.message });
        }

        // .xlsx IS the correct MIME type — a bare application/zip response made
        // some clients/browsers block or corrupt the download, and the export
        // "never worked". The workbook itself is already ZIP-packaged (OOXML).
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${result?.filename || 'export.xlsx'}`);

        return res.send(fileBuffer);
      }

      return res.status(500).json({
        success: false,
        message: 'Export file not found — it may have been cleaned up. Please start a new export.'
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