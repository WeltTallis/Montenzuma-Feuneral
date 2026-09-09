import { Worker } from 'bullmq';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { safeTenantQuery } from '../../../shared/dbConfig';
import Logger from '../../../packages/shared-logger/src/index';
import { getExcelExportQueue } from '../queues/excelExportQueue';

interface ExportJobData {
  tenantId: number;
  tenantSlug: string;
  dbName: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  requestedBy?: string;
}

/**
 * Create and configure the Excel export worker
 * This function should be called only when Redis is available
 */
export async function createExcelExportWorker(): Promise<Worker | null> {
  try {
    const queue = await getExcelExportQueue();
    if (!queue) {
      Logger.warn('[ExcelExportWorker] Cannot create worker - queue not available');
      return null;
    }

    const worker = new Worker<ExportJobData>(
      'excel-export',
      async (job) => {
        const { tenantId, tenantSlug, dbName, startDate, endDate, requestedBy } = job.data;

        try {
          Logger.info({ message: `Starting Excel export for tenant ${tenantSlug}` });

          // Update job progress
          await job.updateProgress(10);

          // Build query with date filters
          let whereClause = '';
          const params: any[] = [];

          if (startDate && endDate) {
            whereClause = 'WHERE created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
          }

          // Fetch deceased records
          const query = `
            SELECT 
              deceased_id,
              full_name,
              date_of_birth,
              date_of_death,
              next_of_kin,
              service_type,
              body_status,
              release_date,
              created_at
            FROM deceased
            ${whereClause}
            ORDER BY created_at DESC
          `;

          await job.updateProgress(30);
          const records = await safeTenantQuery(dbName, query, params);

          // Create workbook
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Deceased Records');

          // Define columns
          worksheet.columns = [
            { header: 'File ID', key: 'fileId', width: 18 },
            { header: 'Full Name', key: 'fullName', width: 22 },
            { header: 'Date of Birth', key: 'dob', width: 16 },
            { header: 'Date of Death', key: 'dod', width: 16 },
            { header: 'Next of Kin', key: 'nextOfKin', width: 20 },
            { header: 'Service', key: 'service', width: 14 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Release Date', key: 'releaseDate', width: 16 },
            { header: 'Admission Date', key: 'admissionDate', width: 16 }
          ];

          await job.updateProgress(50);

          // Add title row
          worksheet.mergeCells('A1:I1');
          const titleCell = worksheet.getCell('A1');
          titleCell.value = 'Lee Funeral Home - Deceased Records Export';
          titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
          titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
          titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };

          // Add subtitle row
          worksheet.mergeCells('A2:I2');
          const subtitleCell = worksheet.getCell('A2');
          subtitleCell.value = `Generated: ${new Date().toLocaleString()} • Author: ${requestedBy || 'System Admin'}`;
          subtitleCell.font = { italic: true, size: 11, color: { argb: 'FFFFFFFF' } };
          subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
          subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475A43' } };

          // Style header row
          const headerRow = worksheet.getRow(4);
          headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B7355' } };
          headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
          headerRow.height = 28;

          await job.updateProgress(70);

          // Add data rows
          const dataRows = (records as any[]) || [];
          dataRows.forEach((record, index) => {
            const rowNumber = 5 + index;
            const row = worksheet.getRow(rowNumber);

            row.getCell('A').value = record.deceased_id;
            row.getCell('B').value = record.full_name;
            row.getCell('C').value = record.date_of_birth ? new Date(record.date_of_birth).toLocaleDateString() : '—';
            row.getCell('D').value = record.date_of_death ? new Date(record.date_of_death).toLocaleDateString() : '—';
            row.getCell('E').value = record.next_of_kin || '—';
            row.getCell('F').value = record.service_type || '—';
            row.getCell('G').value = record.body_status || '—';
            row.getCell('H').value = record.release_date ? new Date(record.release_date).toLocaleDateString() : '—';
            row.getCell('I').value = record.created_at ? new Date(record.created_at).toLocaleDateString() : '—';

            // Style status cells
            const statusCell = row.getCell('G');
            const status = (record.body_status || '').toLowerCase();
            if (status === 'released' || status === 'transferred') {
              statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5E5D0' } };
              statusCell.font = { bold: true, color: { argb: 'FF2C3E26' } };
            } else if (status === 'admitted' || status === 'active') {
              statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E0D5' } };
              statusCell.font = { bold: true, color: { argb: 'FF5A4A38' } };
            } else {
              statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
              statusCell.font = { bold: true, color: { argb: 'FF721C24' } };
            }

            // Style file ID
            row.getCell('A').font = { bold: true, color: { argb: 'FF8B7355' } };

            // Style dates
            row.getCell('C').font = { color: { argb: 'FF555555' } };
            row.getCell('D').font = { color: { argb: 'FF555555' } };
            row.getCell('H').font = { color: { argb: 'FF555555' } };
            row.getCell('I').font = { color: { argb: 'FF555555' } };

            // Row styling
            row.height = 22;
            row.alignment = { vertical: 'middle' };

            // Alternate row colors
            if (index % 2 === 0) {
              row.eachCell((cell) => {
                if (!cell.fill || cell.fill.type !== 'pattern') {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F7F4' } };
                }
              });
            }
          });

          await job.updateProgress(90);

          // ── Save the workbook ──
          // IMPORTANT: ExcelJS output (.xlsx) is ALREADY a ZIP-compressed
          // package (the OOXML spec is a ZIP of XML parts). The previous code
          // piped it through a raw GZIP stream and renamed it *.zip — a bare
          // gzip stream is NOT a valid ZIP archive, so every downloaded export
          // was unopenable/corrupt. We now write the plain .xlsx directly into
          // the service's persistent data volume (uid 1001 writable) and serve
          // it as-is. The controller deletes the file right after sending.
          const exportDir = process.env.EXPORT_DIR || '/usr/src/app/data/exports';
          fs.mkdirSync(exportDir, { recursive: true });

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
          const filename = `Deceased_Records_${tenantSlug}_${timestamp}.xlsx`;
          const filepath = path.join(exportDir, filename);

          await workbook.xlsx.writeFile(filepath);

          const fileSize = fs.statSync(filepath).size;

          Logger.info({
            message: `Excel export completed`,
            filename,
            size: `${(fileSize / 1024).toFixed(2)} KB`,
            records: dataRows.length,
          });

          await job.updateProgress(100);

          return {
            success: true,
            filename,
            filepath,
            recordCount: dataRows.length,
            tenantSlug,
            size: fileSize,
          };

        } catch (error: any) {
          Logger.error({ message: 'Excel export failed', error: error.message });
          throw error;
        }
      },
      {
        connection: (queue as any).connection,
        concurrency: 2,
      }
    );

    worker.on('completed', (job) => {
      Logger.info({ message: `Excel export job ${job.id} completed successfully` });
    });

    worker.on('failed', (job, err) => {
      Logger.error({ message: `Excel export job ${job?.id} failed`, error: err.message });
    });

    worker.on('progress', (job, progress) => {
      Logger.info({ message: `Excel export job ${job.id} progress: ${progress}%` });
    });

    Logger.info('[ExcelExportWorker] Worker created successfully');
    return worker;
  } catch (error: any) {
    Logger.warn(`[ExcelExportWorker] Failed to create worker: ${error.message}`);
    return null;
  }
}

// Legacy export for backward compatibility - but prefer using createExcelExportWorker()
export { createExcelExportWorker as default };
