import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { safeTenantQuery } from '../../../shared/dbConfig';
import Logger from '../../../packages/shared-logger/src/index';

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
// SYNCHRONOUS STYLED EXCEL EXPORT
// Generates the beautifully designed Excel file in-process and streams it back.
// This completely eliminates queue/hanging issues.
// ============================================
export const exportExcelWithCharts = async (req: ExportRequest, res: Response): Promise<Response> => {
  try {
    // The tenant middleware stores tenant data via (req as any).tenant — not
    // the typed req.tenant field. Reading req.tenant directly always returns
    // undefined at runtime (TypeScript compiles it as a plain property access
    // that the middleware never writes to), which caused every export to fail
    // with "Tenant information missing" even when the tenant was valid.
    const tenant = (req as any).tenant;
    const dbName = tenant?.db_name;
    const tenantSlug = (req as any).tenantSlug || tenant?.tenant_slug || 'unknown';
    const userEmail = (req as any).user?.email || 'System Admin';

    if (!dbName) {
      return res.status(400).json({ success: false, message: 'Tenant information missing' });
    }

    const { startDate, endDate } = req.body || {};

    let whereClause = '';
    const params: any[] = [];
    if (startDate && endDate) {
      whereClause = 'WHERE created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const query = `
      SELECT deceased_id, full_name, admission_number, date_of_birth, date_of_death,
             next_of_kin, service_type, body_status, release_date, dispatch_date, date_admitted, created_at
      FROM deceased
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 5000
    `;
    const records: any[] = await safeTenantQuery(dbName, query, params);

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Deceased Records');

    // Define column headers
    worksheet.columns = [
      { header: 'File ID', key: 'fileId', width: 18 },
      { header: 'Full Name', key: 'fullName', width: 22 },
      { header: 'Date of Birth', key: 'dob', width: 16 },
      { header: 'Date of Death', key: 'dod', width: 16 },
      { header: 'Next of Kin', key: 'nextOfKin', width: 20 },
      { header: 'Service', key: 'service', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Release Date', key: 'releaseDate', width: 16 },
      { header: 'Kin Signature', key: 'signature', width: 22 }
    ];

    // Add title row (merged cells)
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${tenant?.name || 'Facility'} - Deceased Records Export`;
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };

    // Add subtitle row
    worksheet.mergeCells('A2:I2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `Generated: ${new Date().toLocaleString()} • Author: ${userEmail}`;
    subtitleCell.font = { italic: true, size: 11, color: { argb: 'FFFFFFFF' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475A43' } };

    // Style header row (row 4)
    const headerRow = worksheet.getRow(4);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B7355' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 28;

    // Add data rows dynamically
    records.forEach((item, index) => {
      const rowNumber = 5 + index;
      const row = worksheet.getRow(rowNumber);
      
      row.getCell('A').value = item.deceased_id || item.admission_number || '—';
      row.getCell('B').value = item.full_name || '—';
      row.getCell('C').value = item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString() : '—';
      row.getCell('D').value = item.date_of_death ? new Date(item.date_of_death).toLocaleDateString() : '—';
      row.getCell('E').value = item.next_of_kin || '—';
      row.getCell('F').value = item.service_type || '—';
      
      // Normalize status for styling
      const rawStatus = (item.body_status || 'Pending').toLowerCase();
      let displayStatus = 'Pending';
      if (rawStatus.includes('release') || rawStatus.includes('buried') || rawStatus.includes('transfer')) {
        displayStatus = 'Released';
      } else if (rawStatus.includes('admit') || rawStatus.includes('morgue') || rawStatus.includes('care') || rawStatus.includes('embalm')) {
        displayStatus = 'Admitted';
      }
      row.getCell('G').value = displayStatus;
      
      const relDate = item.release_date || item.dispatch_date;
      row.getCell('H').value = relDate ? new Date(relDate).toLocaleDateString() : '—';
      row.getCell('I').value = item.next_of_kin ? `${item.next_of_kin}` : 'Pending...';
      
      // Style status cells
      const statusCell = row.getCell('G');
      if (displayStatus === 'Released') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5E5D0' } };
        statusCell.font = { bold: true, color: { argb: 'FF2C3E26' } };
      } else if (displayStatus === 'Admitted') {
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
      
      // Style signature cell (italic)
      row.getCell('I').font = { italic: true, size: 12 };
      
      // Row styling
      row.height = 45;
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

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `${tenantSlug}_Deceased_Records_${new Date().toISOString().slice(0, 10)}.xlsx`;

    Logger.info({ message: `Styled Excel export generated successfully: ${records?.length || 0} records` });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.send(Buffer.from(buffer));
  } catch (error: any) {
    Logger.error({ message: 'Styled Excel export failed', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to generate export',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Dummy functions to prevent routing errors if they are still mapped in your routes file
export const checkExportStatus = async (req: ExportRequest, res: Response): Promise<Response> => {
  return res.status(400).json({ success: false, message: 'Synchronous export does not require status polling.' });
};

export const getExportHistory = async (req: ExportRequest, res: Response): Promise<Response> => {
  return res.status(200).json({ success: true, data: [] });
};

export default {
  exportExcelWithCharts,
  checkExportStatus,
  getExportHistory,
};