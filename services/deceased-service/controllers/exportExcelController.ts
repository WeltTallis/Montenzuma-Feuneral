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
// Mirrors the "Sterling & Hayes Memorial Estates — Official Deceased Intake
// Register" design exactly: navy export button, ink footer, status badges,
// zebra rows and Excel-native gridlines.
// ============================================
const T = {
  exportBtn: 'FF0F3040',    // #0F3040
  headerBorder: 'FF08222D', // #08222d
  ink: 'FF03071E',          // #03071E (navy footer)
    success: 'FF3D4F47',
    successBg: 'FFEFF2EE',
    warning: 'FF946B2D',
    warningBg: 'FFFBF7EE',
    line: 'FFE2DDD3',
    zebra: 'FFFAF8F4',
  white: 'FFFFFFFF',
    text: 'FF14181C',
    muted: 'FF8E8579',
    slate: 'FFB5AFA3',
    gray2: 'FF4B514D',
    accent: 'FF8B7355',
};

const HEADERS = [
  'Admission #', 'Date Admitted', 'Time Received', 'Full Name', 'Gender',
  'Age', 'Date of Death', 'Cause of Death', 'Place of Death', 'Body Status',
  'Permit Number', 'Received From', 'Contact Person', 'Relationship', 'ID Type',
  'ID Number', 'Primary Phone', 'Alt. Phone', 'Email', 'Receiving Officer',
  'Verified By', 'Officer Signature', 'Date Released', 'Days in Morgue',
];

const COL_WIDTHS = [16, 14, 12, 24, 10, 8, 14, 22, 18, 22, 16, 22, 20, 14, 12, 14, 18, 16, 24, 20, 20, 26, 14, 16];

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

// Resolve a signature stored as a URL path (e.g. /uploads/<slug>/signatures/x.png)
// into an image buffer so it can be embedded in the sheet. Falls back to null.
function resolveSignatureBuffer(value: any): Buffer | null {
  if (!value) return null;
  const v = String(value).trim();
  try {
    if (/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(v)) {
      const b64 = v.split(',')[1];
      return Buffer.from(b64, 'base64');
    }
    // URL path or absolute path → locate on the shared uploads disk.
    let rel = String(v).replace(/^https?:\/\/[^/]+\//, '');
    rel = rel.replace(/^\/?(uploads[\\/])*/, '');
    const base = globalUploadsDir();
    const candidates = [path.join(base, rel)];
    if (v.includes('uploads')) {
      const after = v.split('uploads')[1].replace(/^[\\/]+/, '');
      candidates.push(path.join(base, after));
    }
    for (const c of candidates) {
      if (fs.existsSync(c)) return fs.readFileSync(c);
    }
  } catch { /* fall through */ }
  return null;
}

// Discover the columns that actually exist on this tenant's deceased table so the
// export never breaks on older databases that are missing newer columns.
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

// Same introspection for next_of_kin (older DBs lack signature / id_number / id_type).
async function getKinColumns(dbName: string): Promise<Set<string>> {
  try {
    const rows: any[] = await safeTenantQuery(
      dbName,
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'next_of_kin'`
    );
    return new Set(rows.map((r) => String(r.COLUMN_NAME).toLowerCase()));
  } catch {
    return new Set();
  }
}
// ============================================
// BUILD THE INTAKE REGISTER WORKBOOK
// Reproduces the reference HTML sheet exactly.
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
  ws.properties.tabColor = T.exportBtn;
  ws.pageSetup.printTitlesRow = '1:3';
  ws.pageSetup.printArea = `A1:X${Math.max(4, records.length + 4)}`;
  ws.properties.defaultRowHeight = 18;

  ws.columns = COL_WIDTHS.map((w) => ({ width: w }));

  const thinBorder = {
    top: { style: 'thin' as const, color: { argb: T.line } },
    left: { style: 'thin' as const, color: { argb: T.line } },
    bottom: { style: 'thin' as const, color: { argb: T.line } },
    right: { style: 'thin' as const, color: { argb: T.line } },
  };

  // ── Row 1: Facility header (left) + Export generated / barcode (right) ──
  ws.mergeCells('A1:L1');
  const leftCell = ws.getCell('A1');
  leftCell.value = {
    richText: [
      { text: `${meta.facilityName}\n`, font: { name: 'Saira', size: 18, bold: true, color: { argb: T.ink } } },
      { text: 'OFFICIAL DECEASED INTAKE REGISTER', font: { name: 'Saira', size: 10, color: { argb: T.accent } } },
    ],
  };
  leftCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  if (meta.logo) {
    const logoId = workbook.addImage({ buffer: meta.logo.buffer as any, extension: meta.logo.extension });
    ws.addImage(logoId, { tl: { col: 0.15, row: 0.18 }, ext: { width: 82, height: 42 } });
    leftCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true, indent: 7 };
  }
  ws.mergeCells('M1:X1');
  const rightCell = ws.getCell('M1');
  const barcodeBars = '|||||||||||||||||||||||||||||||||||||||||||';
  rightCell.value = {
    richText: [
      { text: 'EXPORT GENERATED\n', font: { name: 'Saira', size: 9, color: { argb: T.muted } } },
      { text: `${meta.timestamp}\n`, font: { name: 'Consolas', size: 12, bold: true, color: { argb: T.ink } } },
      { text: `${barcodeBars}\n`, font: { name: 'Consolas', size: 6, color: { argb: T.ink } } },
      { text: `TRACKING ID: ${meta.trackingId}`, font: { name: 'Consolas', size: 9, color: { argb: T.slate } } },
    ],
  };
  rightCell.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };
  ws.getRow(1).height = 58;

  // ── Row 2: Generated By ──
  ws.mergeCells('A2:X2');
  const genCell = ws.getCell('A2');
  genCell.value = `Generated By: ${meta.generatedBy}`;
  genCell.font = { name: 'Saira', size: 11, color: { argb: T.gray2 } };
  genCell.alignment = { horizontal: 'left', vertical: 'middle' };
  genCell.border = { bottom: { style: 'thick', color: { argb: T.exportBtn } } };
  ws.getRow(2).height = 22;

  // ── Row 3: Column headers ──
  const headerRow = ws.getRow(3);
  headerRow.height = 26;
  HEADERS.forEach((label, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = label;
    cell.font = { name: 'Consolas', size: 10, bold: true, color: { argb: T.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: T.exportBtn } };
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: T.headerBorder } },
      left: { style: 'thin', color: { argb: T.headerBorder } },
      bottom: { style: 'thin', color: { argb: T.headerBorder } },
      right: { style: 'thin', color: { argb: T.headerBorder } },
    };
  });
  ws.autoFilter = { from: 'A3', to: 'X3' };

  // ── Data rows ──
  records.forEach((item, index) => {
    const rowNumber = 4 + index;
    const row = ws.getRow(rowNumber);
    row.height = 30;

    const zebraFill = index % 2 === 1
      ? { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: T.zebra } }
      : null;
    const applyBase = (cell: ExcelJS.Cell) => {
      cell.border = thinBorder;
      cell.font = { name: 'Saira', size: 11, color: { argb: T.text } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      if (zebraFill) cell.fill = zebraFill;
    };
    const mono = { name: 'Consolas', size: 11, color: { argb: T.text } };
    const monoBold = (color: string) => ({ name: 'Consolas', size: 11, bold: true, color: { argb: color } });

    // A - Admission #
    applyBase(row.getCell(1));
    row.getCell(1).value = dash(item.admission_number);
    row.getCell(1).font = monoBold(T.exportBtn);

    // B - Date Admitted
    applyBase(row.getCell(2));
    row.getCell(2).value = formatDate(item.date_admitted || item.created_at);

    // C - Time Received
    applyBase(row.getCell(3));
    row.getCell(3).value = formatTime12(item.time_received);
    row.getCell(3).font = mono;

    // D - Full Name
    applyBase(row.getCell(4));
    row.getCell(4).value = dash(item.full_name);
    row.getCell(4).font = { name: 'Saira', size: 11, bold: true, color: { argb: T.text } };

    // E - Gender
    applyBase(row.getCell(5));
    row.getCell(5).value = dash(item.gender);

    // F - Age
    applyBase(row.getCell(6));
    row.getCell(6).value = dash(item.age);
    row.getCell(6).font = monoBold(T.exportBtn);
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
    row.getCell(10).font = { name: 'Saira', size: 11, bold: true, color: { argb: st.kind === 'success' ? T.success : T.warning } };
    row.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: st.kind === 'success' ? T.successBg : T.warningBg } };
    row.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' };

    // K - Permit Number
    applyBase(row.getCell(11));
    row.getCell(11).value = dash(item.permit_number);

    // L - Received From
    applyBase(row.getCell(12));
    row.getCell(12).value = dash(item.received_from);

    // M - Contact Person
    applyBase(row.getCell(13));
    row.getCell(13).value = dash(item.contact_person);

    // N - Relationship
    applyBase(row.getCell(14));
    row.getCell(14).value = dash(item.relationship);

    // O - ID Type
    applyBase(row.getCell(15));
    row.getCell(15).value = dash(item.id_type);

    // P - ID Number
    applyBase(row.getCell(16));
    row.getCell(16).value = dash(item.id_number);

    // Q - Primary Phone (amber bold mono)
    applyBase(row.getCell(17));
    row.getCell(17).value = dash(item.primary_phone);
    row.getCell(17).font = monoBold(T.warning);

    // R - Alt. Phone
    applyBase(row.getCell(18));
    row.getCell(18).value = dash(item.alternative_phone);

    // S - Email
    applyBase(row.getCell(19));
    row.getCell(19).value = dash(item.email);

    // T - Receiving Officer
    applyBase(row.getCell(20));
    row.getCell(20).value = dash(item.receiving_officer);

    // U - Verified By
    applyBase(row.getCell(21));
    row.getCell(21).value = dash(item.verified_by || item.created_by);

    // V - Officer Signature (embeds the image when resolvable, else italic text)
    const sigValue = item.kin_signature || item.signature;
    const sigBuffer = resolveSignatureBuffer(sigValue);
    applyBase(row.getCell(22));
    if (sigBuffer) {
      try {
        const imgId = workbook.addImage({ buffer: sigBuffer as any, extension: 'png' });
        ws.addImage(imgId, { tl: { col: 21, row: rowNumber - 1 }, ext: { width: 160, height: 30 } });
      } catch {
        row.getCell(22).value = dash(sigValue);
        row.getCell(22).font = { name: 'Consolas', size: 10, italic: true, color: { argb: T.gray2 } };
      }
    } else {
      row.getCell(22).value = sigValue ? dash(sigValue) : '—';
      row.getCell(22).font = { name: 'Consolas', size: 10, italic: true, color: { argb: T.gray2 } };
    }

    // W - Date Released
    applyBase(row.getCell(23));
    row.getCell(23).value = formatDate(item.dispatch_date);

    // X - Days in Morgue (green bold mono)
    applyBase(row.getCell(24));
    row.getCell(24).value = daysInMorgue(item.date_admitted || item.created_at, item.dispatch_date);
    row.getCell(24).font = monoBold(T.success);
  });

  // ── Footer row (ink navy bar with three aligned blocks) ──
  const footerRowNum = 4 + records.length;
  const footerTimestamp = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  ws.mergeCells(`A${footerRowNum}:H${footerRowNum}`);
  ws.mergeCells(`I${footerRowNum}:P${footerRowNum}`);
  ws.mergeCells(`Q${footerRowNum}:X${footerRowNum}`);
  const footLeft = ws.getCell(`A${footerRowNum}`);
  const footMid = ws.getCell(`I${footerRowNum}`);
  const footRight = ws.getCell(`Q${footerRowNum}`);
  [footLeft, footMid, footRight].forEach((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: T.ink } };
    c.font = { name: 'Consolas', size: 10, bold: true, color: { argb: T.white } };
    c.border = { top: { style: 'thin', color: { argb: T.ink } }, bottom: { style: 'thin', color: { argb: T.ink } } };
    c.alignment = { vertical: 'middle' };
  });
  footLeft.value = 'CONFIDENTIAL: HIPAA COMPLIANT RECORD';
  footLeft.alignment = { vertical: 'middle', horizontal: 'left' };
  footMid.value = 'RESTPOINT FUNERAL HOME SOFTWARE';
  footMid.alignment = { vertical: 'middle', horizontal: 'center' };
  footRight.value = `EXPORT TIMESTAMP: ${footerTimestamp}`;
  footRight.alignment = { vertical: 'middle', horizontal: 'right' };
  ws.getRow(footerRowNum).height = 26;

  return workbook;
}
// ============================================
// SYNCHRONOUS STYLED EXCEL EXPORT
// Generates the intake register in-process and streams it back. This path is
// fully synchronous — it does NOT depend on Redis/BullMQ, so the old
// "export queue keeps hanging" problem cannot occur. On success the file is
// also written to Documents (global uploader) and recorded in export history.
// ============================================
export const exportExcelWithCharts = async (req: ExportRequest, res: Response): Promise<Response> => {
  try {
    // The tenant middleware stores tenant data via (req as any).tenant — not
    // the typed req.tenant field.
    const tenant = (req as any).tenant;
    const dbName = tenant?.db_name;
    const tenantSlug = (req as any).tenantSlug || tenant?.tenant_slug || 'unknown';
    const userEmail = (req as any).user?.email || 'System Admin';
    let facilityName = tenant?.name || 'Restpoint Funeral Home';
    let logoUrl = tenant?.logo_url || null;

    // The deceased service middleware has the database slug, while the exact
    // facility branding is authoritative in the central tenant registry.
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
    } catch {
      // Export remains available when the central branding registry is offline.
    }

    if (!dbName) {
      return res.status(400).json({ success: false, message: 'Tenant information missing' });
    }

    const { startDate, endDate } = req.body || {};

    // Build the SELECT safely against the real schema.
    const cols = await getDeceasedColumns(dbName);
    const kinCols = await getKinColumns(dbName);
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
      'd.receiving_officer',
      'd.verified_by',
      'd.created_by',
      'd.signature',
      'd.date_admitted',
      'd.created_at',
      'd.dispatch_date',
      `${permitExpr} AS permit_number`,
      "COALESCE(d.phone_number, nk.contact, '—') AS primary_phone",
      "COALESCE(d.alternative_phone, nk.alternative_phone, '—') AS alternative_phone",
      "COALESCE(d.email, nk.email, '—') AS email",
      "COALESCE(d.id_type, nk.id_type, '—') AS id_type",
      "COALESCE(d.national_id, nk.id_number, '—') AS id_number",
      `${contactExpr} AS contact_person`,
      "COALESCE(nk.relationship, d.relationship, '—') AS relationship",
    ];
    // Older next_of_kin schemas have no signature column — only select it when present.
    if (kinCols.has('signature')) selectParts.push('nk.signature AS kin_signature');

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
    const ymd = now.toISOString().slice(0, 10);
    const safeSlug = String(tenantSlug).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'tenant';
    const fileName = `Deceased_Intake_Register_${safeSlug}_${ymd}.xlsx`;

    // ── Upload the exported file into Documents via the global uploader ──
    let uploadedUrl = '';
    try {
      const upload = await centralizedUploadService.uploadDocument(Buffer.from(buffer), fileName, safeSlug, 'exports');
      if (upload && upload.success) uploadedUrl = upload.urlPath || '';
      Logger.info({ message: 'Excel export uploaded to documents', fileName, urlPath: uploadedUrl });
    } catch (uploadErr: any) {
      Logger.warn({ message: 'Excel export document upload skipped', error: uploadErr && uploadErr.message });
    }

    // ── Persist export history ──
    try {
      const exportService = ExcelExportService.getInstance();
      await exportService.saveExportHistory(dbName, {
        tenant_slug: tenantSlug,
        file_name: fileName,
        file_size: Buffer.byteLength(buffer),
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

    Logger.info({ message: `Styled intake register exported successfully: ${records.length} records` });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.send(Buffer.from(buffer));
  } catch (error: any) {
    Logger.error({ message: 'Styled Excel export failed', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to generate export',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// The synchronous export does not require status polling, but the route is kept
// for backward compatibility with the old queue-based client.
export const checkExportStatus = async (req: ExportRequest, res: Response): Promise<Response> => {
  return res.status(400).json({ success: false, message: 'Synchronous export does not require status polling.' });
};

// Return the most recent 10 export history entries for this tenant.
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