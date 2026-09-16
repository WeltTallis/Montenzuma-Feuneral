import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { safeTenantQuery } from '../../../shared/dbConfig';
import Logger from '../../../packages/shared-logger/src/index';
import ExcelExportService from '../services/excelExportService';
import centralizedUploadService from '../../../packages/shared-services/src/centralizedUploadService';

interface ExportRequest extends Request {
  tenant?: {
    db_name: string;
    id: number;
    tenant_id: number;
    name: string;
    tenant_slug: string;
    logo_url?: string | null;
  };
  tenantSlug?: string;
  user?: { email?: string; id?: number };
}

// ============================================
// INTAKE REGISTER EXCEL TEMPLATE COLORS
// Pure Black & Champagne Gold Luxury Palette matching the HTML preview.
// ============================================
const T = {
  headerBg: 'FF0D0D0D',     // Pure Black Header Band
  ink: 'FF0D0D0D',          // Footer bar
  accent: 'FFD4B778',       // Champagne Gold
  success: 'FF2C4A2E',
  successBg: 'FFE8F0E8',
  warning: 'FF6B2E3A',
  warningBg: 'FFF4E8E8',
  line: 'FFE0DCD5',         // Soft border for data cells
  zebra: 'FFFCFBF9',        // Very light warm beige
  white: 'FFFFFFFF',
  text: 'FF0D0D0D',         // Pure Black for primary text
  monoText: 'FF2C2823',     // Dark Charcoal for mono text
  muted: 'FFA8A39B',        // Muted Gray for empty data
  gray2: 'FF8A8579',
  substripBg: 'FF1B1815',   // Dark Charcoal for substrip
  thBg: 'FFF4F2EE',         // Light warm gray for table headers
  thText: 'FF0D0D0D',
};

// Removed: 'ID Type', 'Alt. Phone', 'Email', 'Receiving Officer', 'Verified By'
const HEADERS = [
  'Admission #', 'Date Admitted', 'Time Received', 'Full Name', 'Gender',
  'Age', 'Date of Death', 'Cause of Death', 'Place of Death', 'Body Status',
  'Permit Number', 'Received From', 'Contact Person', 'Relationship', 
  'ID Number', 'Primary Phone', 'Date Released', 'Days in Morgue',
];

const COL_WIDTHS = [12, 13, 11, 24, 9, 6, 13, 22, 22, 18, 13, 20, 19, 13, 13, 17, 13, 10];

// ─── Helpers ─────────────────────────────────────────────────────────
const dash = (v: any): string => (v === null || v === undefined || v === '' ? '—' : String(v));

function formatDate(v: any): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return dash(v);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
}

function formatTime12(v: any): string {
  if (!v) return '—';
  const s = String(v).trim();
  const parts = s.split(':').map((p) => parseInt(p, 10));
  if (parts.length < 2 || isNaN(parts[0])) return dash(v);
  let h = parts[0];
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Normalize body_status to the template's display badges.
function statusDisplay(raw: any): { label: string; kind: 'success' | 'warning' } {
  const s = String(raw || '').toLowerCase();
  if (/release|buried|transfer|dispatch/.test(s)) return { label: 'Released', kind: 'success' };
  if (/autopsy|postmortem/.test(s)) return { label: 'Pending Autopsy', kind: 'warning' };
  if (/admit|morgue|care|embalm|normal/.test(s)) return { label: 'Normal Condition', kind: 'success' };
  return { label: 'Pending', kind: 'warning' };
}

function daysInMorgue(dateAdmitted: any, dispatchDate: any): string {
  if (!dateAdmitted) return '—';
  const start = new Date(dateAdmitted);
  if (isNaN(start.getTime())) return '—';
  const end = dispatchDate ? new Date(dispatchDate) : new Date();
  if (isNaN(end.getTime())) return '—';
  const days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
  return `${days} Day${days === 1 ? '' : 's'}`;
}

function globalUploadsDir(): string {
  for (const envDir of [
    process.env.GLOBAL_UPLOADS_DIR,
    process.env.UPLOADS_BASE_DIR,
    process.env.UPLOAD_PATH,
  ].filter(Boolean)) {
    try {
      fs.mkdirSync(envDir as string, { recursive: true });
      return envDir as string;
    } catch { /* next */ }
  }
  const fallbacks = [
    path.join(process.cwd(), 'uploads'),
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../../uploads'),
  ];
  for (const base of fallbacks) {
    try { fs.mkdirSync(base, { recursive: true }); return base; } catch { /* next */ }
  }
  return path.join(require('os').tmpdir(), 'restpoint-uploads');
}

// Resolve the tenant logo image from the shared uploads disk.
function resolveTenantLogo(tenantSlug: string, logoUrl?: string | null): { buffer: Buffer; extension: 'png' | 'jpeg' | 'gif' } | null {
  try {
    const base = globalUploadsDir();
    const candidates: string[] = [];
    if (logoUrl) {
      const raw = String(logoUrl).replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '');
      candidates.push(raw.startsWith('uploads/') ? path.join(base, raw.slice('uploads/'.length)) : path.join(base, raw));
    }
    const safeSlug = String(tenantSlug || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const logoDir = path.join(base, 'tenants', safeSlug, 'logos');
    const logoDirs = [
      logoDir,
      path.join(base, safeSlug, 'logos'),
      path.join(base, safeSlug, 'documents', 'logos'),
    ];
    for (const dir of logoDirs) {
      if (fs.existsSync(dir)) {
        for (const file of fs.readdirSync(dir).sort().reverse()) candidates.push(path.join(dir, file));
      }
    }
    for (const candidate of candidates) {
      if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) continue;
      const ext = path.extname(candidate).toLowerCase();
      if (ext === '.png') return { buffer: fs.readFileSync(candidate), extension: 'png' };
      if (ext === '.jpg' || ext === '.jpeg') return { buffer: fs.readFileSync(candidate), extension: 'jpeg' };
      if (ext === '.gif') return { buffer: fs.readFileSync(candidate), extension: 'gif' };
    }
  } catch { /* branding is optional; continue without a logo */ }
  return null;
}

// Encrypt an .xlsx buffer with a password using the standard Office "Agile Encryption"
async function encryptXlsxWithPassword(buffer: Buffer, password: string): Promise<Buffer> {
  const XlsxPopulate = require('xlsx-populate') as {
    fromDataAsync: (
      data: Buffer,
    ) => Promise<{ outputAsync: (opts: { password: string }) => Promise<Buffer> }>;
  };
  const workbook = await XlsxPopulate.fromDataAsync(buffer);
  return workbook.outputAsync({ password });
}

async function getDeceasedColumns(dbName: string): Promise<Set<string>> {
  try {
    const rows: any[] = await safeTenantQuery(
      dbName,
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deceased'`
    );
    return new Set(rows.map((r) => String(r.COLUMN_NAME).toLowerCase()));
  } catch {
    return new Set();
  }
}

// ============================================
// BUILD THE INTAKE REGISTER WORKBOOK
// ============================================
function buildIntakeRegisterWorkbook(
  records: any[],
  meta: { facilityName: string; generatedBy: string; trackingId: string; timestamp: string; logo?: { buffer: Buffer; extension: 'png' | 'jpeg' | 'gif' } | null }
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Restpoint Funeral Home Software';
  workbook.lastModifiedBy = meta.generatedBy;
  workbook.created = new Date();
  workbook.modified = new Date();

  const ws = workbook.addWorksheet('Intake Register', {
    views: [{ state: 'frozen', ySplit: 3, topLeftCell: 'A4' }],
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  ws.properties.tabColor = { argb: T.headerBg };
  ws.pageSetup.printTitlesRow = '1:3';
  ws.pageSetup.printArea = `A1:R${Math.max(4, records.length + 4)}`; // Updated to R (18 cols)
  ws.properties.defaultRowHeight = 18;

  ws.columns = COL_WIDTHS.map((w) => ({ width: w }));

  const thinBorder = {
    bottom: { style: 'thin' as const, color: { argb: T.line } }
  };

  // ── Row 1: Facility header (left) + Export generated / tracking ID (right) ──
  ws.mergeCells('A1:I1');
  const leftCell = ws.getCell('A1');
  leftCell.value = {
    richText: [
      { text: `${meta.facilityName}\n`, font: { name: 'Cambria', size: 22, bold: true, italic: true, color: { argb: T.accent } } },
      { text: 'OFFICIAL DECEASED INTAKE REGISTER · ESTD. 1974', font: { name: 'Calibri', size: 8.5, bold: true, color: { argb: 'FFA8A39B' } } },
    ],
  };
  leftCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: T.headerBg } };
  leftCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
  if (meta.logo) {
    const logoId = workbook.addImage({ buffer: meta.logo.buffer as any, extension: meta.logo.extension });
    ws.addImage(logoId, { tl: { col: 0.15, row: 0.18 }, ext: { width: 82, height: 42 } });
    leftCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 7 };
  }

  ws.mergeCells('J1:R1');
  const rightCell = ws.getCell('J1');
  rightCell.value = {
    richText: [
      { text: 'EXPORT GENERATED\n', font: { name: 'Consolas', size: 8, color: { argb: 'FF7C7568' } } },
      { text: `${meta.timestamp}\n`, font: { name: 'Consolas', size: 10, bold: true, color: { argb: T.accent } } },
      { text: `Tracking ID: ${meta.trackingId}`, font: { name: 'Consolas', size: 8, color: { argb: 'FF6E6759' } } },
    ],
  };
  rightCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: T.headerBg } };
  rightCell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, indent: 1 };
  ws.getRow(1).height = 46;

  // ── Row 2: Generated By + Record Count (Substrip) ──
  ws.mergeCells('A2:I2');
  const genCell = ws.getCell('A2');
  genCell.value = `Generated by ${meta.generatedBy}`;
  genCell.font = { name: 'Calibri', size: 8.5, italic: true, color: { argb: T.muted } };
  genCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  genCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: T.substripBg } };

  ws.mergeCells('J2:R2');
  const countCell = ws.getCell('J2');
  countCell.value = `${records.length} of ${records.length} Records · All Records`;
  countCell.font = { name: 'Consolas', size: 8.5, color: { argb: T.accent } };
  countCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
  countCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: T.substripBg } };
  ws.getRow(2).height = 16;

  // ── Row 3: Column headers ──
  const headerRow = ws.getRow(3);
  headerRow.height = 26;
  HEADERS.forEach((label, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = label;
    cell.font = { name: 'Calibri', size: 8, bold: true, color: { argb: T.thText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: T.thBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: T.accent } }, // Gold underline
    };
  });
  ws.autoFilter = { from: 'A3', to: 'R3' };

  // ── Data rows ──
  records.forEach((item, index) => {
    const rowNumber = 4 + index;
    const row = ws.getRow(rowNumber);
    row.height = 28;

    const zebraFill = index % 2 === 1
      ? { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: T.zebra } }
      : null;
    const applyBase = (cell: ExcelJS.Cell) => {
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 10, color: { argb: T.text } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      if (zebraFill) cell.fill = zebraFill;
    };

    // A - Admission #
    applyBase(row.getCell(1));
    row.getCell(1).value = dash(item.admission_number);
    row.getCell(1).font = { name: 'Consolas', size: 9.5, bold: true, color: { argb: T.text } };

    // B - Date Admitted
    applyBase(row.getCell(2));
    row.getCell(2).value = formatDate(item.date_admitted || item.created_at);

    // C - Time Received
    applyBase(row.getCell(3));
    row.getCell(3).value = formatTime12(item.time_received);
    row.getCell(3).font = { name: 'Consolas', size: 9, color: { argb: T.monoText } };
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };

    // D - Full Name
    applyBase(row.getCell(4));
    row.getCell(4).value = dash(item.full_name);
    row.getCell(4).font = { name: 'Cambria', size: 11, bold: true, color: { argb: T.text } };

    // E - Gender
    applyBase(row.getCell(5));
    row.getCell(5).value = dash(item.gender);
    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };

    // F - Age
    applyBase(row.getCell(6));
    row.getCell(6).value = dash(item.age);
    row.getCell(6).font = { name: 'Consolas', size: 9.5, bold: true, color: { argb: T.text } };
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };

    // G - Date of Death
    applyBase(row.getCell(7));
    row.getCell(7).value = formatDate(item.date_of_death);

    // H - Cause of Death
    applyBase(row.getCell(8));
    row.getCell(8).value = dash(item.cause_of_death);

    // I - Place of Death
    applyBase(row.getCell(9));
    row.getCell(9).value = dash(item.place_of_death);

    // J - Body Status badge
    applyBase(row.getCell(10));
    const st = statusDisplay(item.body_status);
    row.getCell(10).value = st.label;
    row.getCell(10).font = { name: 'Calibri', size: 8, bold: true, color: { argb: st.kind === 'success' ? T.success : T.warning } };
    row.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: st.kind === 'success' ? T.successBg : T.warningBg } };
    row.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(10).border = {
      top: { style: 'thin', color: { argb: st.kind === 'success' ? T.success : T.warning } },
      left: { style: 'thin', color: { argb: st.kind === 'success' ? T.success : T.warning } },
      bottom: { style: 'thin', color: { argb: st.kind === 'success' ? T.success : T.warning } },
      right: { style: 'thin', color: { argb: st.kind === 'success' ? T.success : T.warning } },
    };

    // K - Permit Number
    applyBase(row.getCell(11));
    row.getCell(11).value = dash(item.permit_number);
    row.getCell(11).font = { name: 'Consolas', size: 9, color: { argb: T.monoText } };

    // L - Received From
    applyBase(row.getCell(12));
    row.getCell(12).value = dash(item.received_from);

    // M - Contact Person
    applyBase(row.getCell(13));
    row.getCell(13).value = dash(item.contact_person);

    // N - Relationship
    applyBase(row.getCell(14));
    row.getCell(14).value = dash(item.relationship);

    // O - ID Number
    applyBase(row.getCell(15));
    row.getCell(15).value = dash(item.id_number);
    row.getCell(15).font = { name: 'Consolas', size: 9, color: { argb: T.monoText } };

    // P - Primary Phone
    applyBase(row.getCell(16));
    row.getCell(16).value = dash(item.primary_phone);
    row.getCell(16).font = { name: 'Consolas', size: 9, color: { argb: T.monoText } };

    // Q - Date Released
    applyBase(row.getCell(17));
    row.getCell(17).value = formatDate(item.dispatch_date);

    // R - Days in Morgue
    applyBase(row.getCell(18));
    row.getCell(18).value = daysInMorgue(item.date_admitted || item.created_at, item.dispatch_date);
    row.getCell(18).font = { name: 'Consolas', size: 9, color: { argb: T.monoText } };
    row.getCell(18).alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // ── Footer row (black bar, gold rule on top) ──
  const footerRowNum = 4 + records.length;
  ws.mergeCells(`A${footerRowNum}:I${footerRowNum}`);
  ws.mergeCells(`J${footerRowNum}:R${footerRowNum}`);
  const footLeft = ws.getCell(`A${footerRowNum}`);
  const footRight = ws.getCell(`J${footerRowNum}`);
  
  [footLeft, footRight].forEach((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: T.ink } };
    c.border = { top: { style: 'medium', color: { argb: T.accent } } };
    c.alignment = { vertical: 'middle', indent: 1 };
  });
  
  footLeft.value = 'Confidential Compliant Record';
  footLeft.font = { name: 'Cambria', size: 9, italic: true, color: { argb: T.muted } };
  footLeft.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  
  footRight.value = 'Restpoint Mortuary Management System';
  footRight.font = { name: 'Consolas', size: 8, color: { argb: T.accent } };
  footRight.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
  ws.getRow(footerRowNum).height = 26;

  return workbook;
}

// ============================================
// SYNCHRONOUS STYLED EXCEL EXPORT
// ============================================
export const exportExcelWithCharts = async (req: ExportRequest, res: Response): Promise<Response> => {
  try {
    const tenant = (req as any).tenant;
    const dbName = tenant?.db_name;
    const tenantSlug = (req as any).tenantSlug || tenant?.tenant_slug || 'unknown';
    const userEmail = (req as any).user?.email || 'System Admin';
    let facilityName = tenant?.name || 'Restpoint Funeral Home';
    let logoUrl = tenant?.logo_url || null;

    try {
      if (tenantSlug && tenantSlug !== 'system_shared') {
        const brandingRows: any[] = await safeTenantQuery(
          'tenant_tracking',
          'SELECT tenant_name, logo_url FROM tenants WHERE tenant_slug = ? LIMIT 1',
          [tenantSlug]
        );
        if (brandingRows[0]) {
          facilityName = brandingRows[0].tenant_name || facilityName;
          logoUrl = brandingRows[0].logo_url || logoUrl;
        }
      }
    } catch { /* continue */ }

    if (!dbName) {
      return res.status(400).json({ success: false, message: 'Tenant information missing' });
    }

    const { startDate, endDate, exportPin } = req.body || {};

    const pin = String(exportPin ?? '').trim();
    if (pin && !/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'Export PIN must be 4 to 6 digits.',
      });
    }

    const cols = await getDeceasedColumns(dbName);
    const has = (c: string) => cols.has(c.toLowerCase());
    const permitExpr = has('permit_number')
      ? "COALESCE(d.permit_number, d.national_id, '—')"
      : "COALESCE(d.national_id, '—')";
    const contactExpr = has('contact_person')
      ? "COALESCE(nk.full_name, d.contact_person, 'Contact Not Listed')"
      : "COALESCE(nk.full_name, 'Contact Not Listed')";

    const selectParts = [
      'd.deceased_id',
      'd.admission_number',
      'd.full_name',
      'd.gender',
      'd.age',
      'd.date_of_birth',
      'd.date_of_death',
      'd.time_received',
      'd.cause_of_death',
      'd.place_of_death',
      'd.body_status',
      'd.received_from',
      'd.created_by',
      'd.date_admitted',
      'd.created_at',
      'd.dispatch_date',
      `${permitExpr} AS permit_number`,
      "COALESCE(d.phone_number, nk.contact, '—') AS primary_phone",
      "COALESCE(d.national_id, nk.id_number, '—') AS id_number",
      `${contactExpr} AS contact_person`,
      "COALESCE(nk.relationship, d.relationship, '—') AS relationship",
    ];

    const where: string[] = [];
    const params: any[] = [];
    if (has('is_deleted')) where.push('(d.is_deleted = 0 OR d.is_deleted IS NULL)');
    if (startDate && endDate) {
      where.push('d.created_at BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    const query = `
      SELECT ${selectParts.join(', ')}
      FROM deceased d
      LEFT JOIN next_of_kin nk
        ON nk.deceased_id = d.deceased_id
       AND nk.is_primary = 1
       AND (nk.is_deleted IS NULL OR nk.is_deleted = 0)
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY d.created_at DESC
      LIMIT 5000
    `;
    const records: any[] = await safeTenantQuery(dbName, query, params);

    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const trackingId = `EXP-${now.getTime()}`;
    const period = startDate && endDate ? `${startDate} to ${endDate}` : 'All Records';

    const workbook = buildIntakeRegisterWorkbook(records, {
      facilityName,
      generatedBy: `${userEmail} (System Admin)`,
      trackingId,
      timestamp,
      logo: resolveTenantLogo(tenantSlug, logoUrl),
    });

    const buffer: any = await workbook.xlsx.writeBuffer();
    const plainBuffer = Buffer.from(buffer);
    const ymd = now.toISOString().slice(0, 10);
    const safeSlug = String(tenantSlug).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'tenant';
    const fileName = `Deceased_Intake_Register_${safeSlug}_${ymd}.xlsx`;

    let fileBuffer = plainBuffer;
    if (pin) {
      try {
        fileBuffer = await encryptXlsxWithPassword(plainBuffer, pin);
        Logger.info({ message: 'Excel export encrypted with PIN', trackingId });
      } catch (cryptErr: any) {
        Logger.error({ message: 'Excel export PIN encryption failed', error: cryptErr && cryptErr.message });
        return res.status(500).json({
          success: false,
          message: 'Could not encrypt the export with the supplied PIN. Please try again.',
        });
      }
    }

    let uploadedUrl = '';
    try {
      const upload = await centralizedUploadService.uploadDocument(fileBuffer, fileName, safeSlug, 'exports');
      if (upload && upload.success) uploadedUrl = upload.urlPath || '';
      Logger.info({ message: 'Excel export uploaded to documents', fileName, urlPath: uploadedUrl });
    } catch (uploadErr: any) {
      Logger.warn({ message: 'Excel export document upload skipped', error: uploadErr && uploadErr.message });
    }

    try {
      const exportService = ExcelExportService.getInstance();
      await exportService.saveExportHistory(dbName, {
        tenant_slug: tenantSlug,
        file_name: fileName,
        file_size: fileBuffer.length,
        record_count: records.length,
        generated_at: now.toISOString(),
        generated_by: userEmail,
        period,
        status: 'success',
        file_url: uploadedUrl || undefined,
        tracking_id: trackingId,
      });
    } catch (histErr: any) {
      Logger.warn({ message: 'Failed to save export history', error: histErr && histErr.message });
    }

    Logger.info({ message: `Styled intake register exported successfully: ${records.length} records${pin ? ' (PIN-protected)' : ''}` });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.send(fileBuffer);
  } catch (error: any) {
    Logger.error({ message: 'Styled Excel export failed', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to generate export',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const checkExportStatus = async (req: ExportRequest, res: Response): Promise<Response> => {
  return res.status(400).json({ success: false, message: 'Synchronous export does not require status polling.' });
};

export const getExportHistory = async (req: ExportRequest, res: Response): Promise<Response> => {
  try {
    const tenant = (req as any).tenant;
    const dbName = tenant?.db_name;
    const tenantSlug = (req as any).tenantSlug || tenant?.tenant_slug || 'unknown';

    if (!dbName) {
      return res.status(400).json({ success: false, message: 'Tenant information missing' });
    }

    const exportService = ExcelExportService.getInstance();
    const { records, total, page, totalPages } = await exportService.getExportHistory(dbName, tenantSlug, 1, 10);

    const data = records.map((r) => ({
      id: r.id,
      fileName: r.file_name,
      fileSize: r.file_size,
      recordCount: r.record_count,
      generatedAt: r.generated_at,
      generatedBy: r.generated_by,
      period: r.period,
      status: r.status,
      fileUrl: (r as any).file_url || '',
      trackingId: (r as any).tracking_id || '',
    }));

    return res.status(200).json({ success: true, data, total, page, totalPages });
  } catch (error: any) {
    Logger.error({ message: 'Failed to load export history', error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to load export history' });
  }
};

export default {
  exportExcelWithCharts,
  checkExportStatus,
  getExportHistory,
};