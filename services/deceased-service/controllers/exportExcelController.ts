import { Request, Response } from 'express';
import crypto from 'crypto';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { safeTenantQuery } from '../../../shared/dbConfig';
import Logger from '../../../packages/shared-logger/src/index';
import { centralizedUploadService } from '../../../shared/centralizedUploadService';

// ============================================
// SYNCHRONOUS STYLED EXCEL EXPORT
// In-process generation — no queue, no hanging.
// Design mirrors the certified-registry HTML preview:
// letterhead + logo, tracking ID w/ expiry, ink header bar,
// pure-white hairline ledger, certification stamp + QR footer.
// ============================================

/* ---------------- DESIGN TOKENS (COLORS) ---------------- */
const COLORS = {
  ink: 'FF1A1A1A',
  bone: 'FFFAF8F4',
  white: 'FFFFFFFF',
  brass: 'FF6B4045',
  brassLight: 'FFA98F6E',
  verdigris: 'FF3D4F47',
  verdigrisDark: 'FF2E3F37',
  line: 'FFE2DDD3',
  gray: 'FF6B6862',
  muted: 'FF999999',
  red: 'FF9B4A3F',
  inkBlue: 'FF0F33E7',
  gold: 'FFC9A227',
} as const;

const FONT_SERIF = 'Georgia';
const FONT_MONO = 'Consolas';
const FONT_SANS = 'Calibri';

const LOGO_URL = 'https://lf.services/wp-content/uploads/2024/09/LFS-Logo2-e1725725010766.png';
const VERIFY_BASE = 'https://lf.services/verify';
const EXPIRY_DAYS = 7;

/* ---------------- SMALL HELPERS ---------------- */
const argb = (c: string) => ({ argb: c });
const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => `${pad(d.getDate())} ${d.toLocaleDateString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
const fmtStamp = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
const fmtTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const solid = (color: string) => ({ type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: color } });

/** ExcelJS's bundled typings declare `Image.buffer` as a module-local Buffer
 *  (interface Buffer extends ArrayBuffer) that Node's Buffer doesn't satisfy,
 *  though the runtime accepts it (documented addImage pattern) — bridge once. */
const excelBuffer = (b: Buffer) => b as unknown as NonNullable<ExcelJS.Image['buffer']>;

type Status = 'Released' | 'Admitted' | 'Pending';
function normalizeStatus(raw: any): Status {
  const s = String(raw || 'Pending').toLowerCase();
  if (s.includes('release') || s.includes('buried') || s.includes('transfer')) return 'Released';
  if (s.includes('admit') || s.includes('morgue') || s.includes('care') || s.includes('embalm')) return 'Admitted';
  return 'Pending';
}
const STATUS_COLOR: Record<Status, string> = {
  Released: COLORS.verdigrisDark,
  Admitted: COLORS.brass,
  Pending: COLORS.red,
};

/** Fetch the brand logo — never throws, never blocks the export. */
async function fetchLogo(): Promise<Buffer | null> {
  try {
    if (typeof fetch !== 'function') return null; // Node < 18
    const res = await fetch(LOGO_URL);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Race any promise against a timeout; loses gracefully with null. */
async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let timer: any;
  const timeout = new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), ms); });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** QR PNG via the `qrcode` package (npm i qrcode). Skips gracefully if absent. */
async function makeQr(payload: string): Promise<Buffer | null> {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toBuffer(payload, {
      type: 'png', width: 240, margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#1A1A1A', light: '#FFFFFF' },
    });
  } catch {
    return null;
  }
}

/* ---------------- GLOBAL UPLOADS (TENANT-SCOPED) ----------------
 * Same storage contract as the legacy excelExportService: every generated
 * report lands in the ONE shared uploads folder every service bind-mounts in
 * production (/opt/storage/uploads) and that tenant-service serves at
 * /uploads/<tenant-slug>/deceased-reports/<file>.
 * The slug is sanitized exactly like the signature uploaders so the on-disk
 * folder and the /uploads/... URL always match and tenant exports never mix. */
const slugifyTenant = (raw: string): string =>
  String(raw || 'system')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'system';

const getGlobalUploadsDir = (): string =>
  process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';

/** Encrypt a workbook with a 4-digit PIN using standard Office (ECMA-376
 *  Agile) encryption via xlsx-populate — the same format Excel prompts for
 *  and the Workbook Vault viewer (xlsx-preview.html) decrypts fully locally.
 *  Returns the original buffer untouched when no valid PIN is supplied or
 *  when the encryption library is unavailable. */
async function encryptWithPin(buffer: Buffer, pin: string): Promise<Buffer> {
  if (!/^\d{4}$/.test(pin || '')) return buffer;
  try {
    const mod: any = await import('xlsx-populate');
    const XlsxPopulate = mod.default || mod;
    const wb = await XlsxPopulate.fromDataAsync(buffer);
    const out = await wb.outputAsync({ password: pin });
    Logger.info({ message: 'Export encrypted with the supplied PIN (Agile encryption)' });
    return Buffer.from(out);
  } catch (err: any) {
    Logger.error({ message: 'PIN encryption failed — saving the export unencrypted', error: err?.message });
    return buffer;
  }
}

/** Persist the generated workbook into THIS tenant's global uploads folder
 *  through the GLOBAL UPLOADER (centralizedUploadService) — the same storage
 *  pipeline every other service uses. Files land in
 *    <GLOBAL_UPLOADS_DIR>/<tenant-slug>/exports/deceased-reports/<file>
 *  and are served to browsers at
 *    /uploads/<tenant-slug>/exports/deceased-reports/<file>
 *  Throws on failure so the caller can fall back to streaming the file
 *  inline and the client still receives its export. */
async function saveToGlobalUploads(
  buffer: Buffer,
  tenantSlug: string,
  fileName: string
): Promise<{ fullPath: string; fileUrl: string; filename: string }> {
  const result = await centralizedUploadService.uploadExcel(buffer, fileName, tenantSlug, 'deceased-reports');
  if (!result.success) {
    throw new Error(result.error || 'Global uploads save failed');
  }
  return { fullPath: result.path, fileUrl: result.urlPath, filename: result.filename };
}

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

export const exportExcelWithCharts = async (req: ExportRequest, res: Response): Promise<Response> => {
  try {
    // Tenant middleware writes to (req as any).tenant — reading the typed
    // req.tenant always yields undefined at runtime. Keep reading the raw field.
    const tenant = (req as any).tenant;
    const dbName = tenant?.db_name;
    const tenantSlug = (req as any).tenantSlug || tenant?.tenant_slug || 'unknown';
    const facility = tenant?.name || 'LF Services';

    // Show the local part of the email only — "sys.admin", never "System Admin".
    const rawEmail = (req as any).user?.email || 'sys.admin';
    const author = String(rawEmail).split('@')[0] || 'sys.admin';

    if (!dbName) {
      return res.status(400).json({ success: false, message: 'Tenant information missing' });
    }

    const { startDate, endDate } = (req.body || {}) as { startDate?: string; endDate?: string };

    // ── SCHEMA-ADAPTIVE RECORD FETCH ────────────────────────────────────
    // Tenant databases were provisioned at different times: older ones have
    // no next_of_kin column on deceased (next of kin lives in its own
    // next_of_kin table), and release_date / service_type are not present in
    // every schema. Introspect the ACTUAL columns once and build the SELECT
    // with safe fallbacks so the export can never die on "Unknown column".
    const tableColumns = async (table: string): Promise<Set<string>> => {
      try {
        const cols = await safeTenantQuery(
          dbName,
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          [dbName, table]
        );
        return new Set((Array.isArray(cols) ? cols : []).map((c: any) => String(c.COLUMN_NAME).toLowerCase()));
      } catch {
        return new Set<string>();
      }
    };

    const tableExists = async (table: string): Promise<boolean> => {
      try {
        const t = await safeTenantQuery(
          dbName,
          `SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
          [dbName, table]
        );
        return Array.isArray(t) && t.length > 0;
      } catch {
        return false;
      }
    };

    const dCols = await tableColumns('deceased');
    const has = (name: string) => dCols.has(String(name).toLowerCase());
    // Column reference with a NULL fallback so a missing column can never
    // break the query — the sheet simply shows '—' for that field.
    const dcol = (name: string, alias?: string) =>
      has(name) ? `d.${name}${alias ? ` AS ${alias}` : ''}` : `NULL AS ${alias || name}`;

    // Next of kin — the dedicated next_of_kin table (primary kin first) when
    // it exists, otherwise the deceased.contact_person column on newer DBs.
    // The subquery joins on d.deceased_id, so it is only used when that
    // column actually exists in this tenant's schema.
    let nextOfKinExpr = dcol('contact_person', 'next_of_kin');
    if (has('deceased_id') && (await tableExists('next_of_kin'))) {
      const kCols = await tableColumns('next_of_kin');
      const kinWhere = [`nok.deceased_id = d.deceased_id`];
      if (kCols.has('is_deleted')) kinWhere.push(`nok.is_deleted = 0`);
      const kinOrder = kCols.has('is_primary') ? `nok.is_primary DESC, nok.id ASC` : `nok.id ASC`;
      nextOfKinExpr = `(SELECT nok.full_name FROM next_of_kin nok WHERE ${kinWhere.join(' AND ')} ORDER BY ${kinOrder} LIMIT 1) AS next_of_kin`;
    }

    // Service type — service_type on newer DBs, burial_type otherwise.
    const serviceExpr = has('service_type')
      ? `d.service_type AS service_type`
      : has('burial_type') ? `d.burial_type AS service_type` : `NULL AS service_type`;

    // Release date — release_date on newer DBs, dispatch_date otherwise
    // (the row mapping already falls back to dispatch_date itself).
    const releaseExpr = has('release_date')
      ? `d.release_date AS release_date`
      : has('dispatch_date') ? `d.dispatch_date AS release_date` : `NULL AS release_date`;

    const selectParts = [
      dcol('deceased_id'),
      dcol('full_name'),
      dcol('admission_number'),
      dcol('date_of_birth'),
      dcol('date_of_death'),
      nextOfKinExpr,
      serviceExpr,
      dcol('body_status'),
      releaseExpr,
      dcol('dispatch_date'),
      dcol('date_admitted'),
      dcol('created_at'),
    ].join(',\n             ');

    let whereClause = '';
    const params: any[] = [];
    if (startDate && endDate && has('created_at')) {
      whereClause = 'WHERE d.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const orderExpr = has('created_at') ? 'd.created_at DESC' : 'd.id DESC';
    const query = `
      SELECT ${selectParts}
      FROM deceased d
      ${whereClause}
      ORDER BY ${orderExpr}
      LIMIT 5000
    `;
    const records: any[] = await safeTenantQuery(dbName, query, params);

    /* ---------------- TRACKING / EXPIRATION SYSTEM ---------------- */
    const now = new Date();
    const ref = crypto.randomBytes(3).toString('hex').toUpperCase();
    const track = `LFS-EXP-${ref}`;
    const expires = new Date(now);
    expires.setDate(expires.getDate() + EXPIRY_DAYS);
    expires.setHours(23, 59, 59, 0);
    const verifyUrl = `${VERIFY_BASE}/${track}?exp=${Math.floor(expires.getTime() / 1000)}`;

    /* ---------------- WORKBOOK ---------------- */
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LF Services';
    // Runtime Workbook serializes `title` (lib/doc/workbook.js) but the bundled
    // typings omit it from the Workbook class — bridge the type.
    (workbook as unknown as { title: string }).title = 'Deceased Records — Certified Extract';
    workbook.created = now;

    const worksheet = workbook.addWorksheet('Deceased Records', {
      properties: { defaultColWidth: 12 },
    });

    // 8 columns — Kin Signature column removed by design.
    worksheet.columns = [
      { key: 'fileId', width: 17 },
      { key: 'fullName', width: 26 },
      { key: 'dob', width: 14 },
      { key: 'dod', width: 14 },
      { key: 'kin', width: 24 },
      { key: 'service', width: 15 },
      { key: 'status', width: 13 },
      { key: 'releaseDate', width: 14 },
    ];

    const COLS = 8;
    const ROW = { rule: 8, stats: 9, period: 10, ruler: 11, header: 12, dataStart: 13 };

    /* ---------------- LETTERHEAD ---------------- */
    [1, 2, 3].forEach(r => { worksheet.getRow(r).height = 15; });
    worksheet.getRow(4).height = 14;
    worksheet.getRow(5).height = 30;
    worksheet.getRow(6).height = 15;
    worksheet.getRow(7).height = 14;
    worksheet.getRow(8).height = 5;
    worksheet.getRow(9).height = 24;
    worksheet.getRow(10).height = 16;
    worksheet.getRow(11).height = 16;
    worksheet.getRow(12).height = 26;

    // Logo (floats over A1:A3 — fetch failure just skips it)
    const logoBuf = await withTimeout(fetchLogo(), 4000);
    if (logoBuf) {
      const imgId = workbook.addImage({ buffer: excelBuffer(logoBuf), extension: 'png' });
      worksheet.addImage(imgId, { tl: { col: 0.15, row: 0.1 }, ext: { width: 150, height: 50 } });
    }

    // Classification line
    worksheet.mergeCells('B4:E4');
    const cls = worksheet.getCell('B4');
    cls.value = 'OFFICIAL REGISTRY EXTRACT · STRICTLY CONFIDENTIAL';
    cls.font = { name: FONT_SANS, size: 7.5, bold: true, color: argb(COLORS.brass) };
    cls.alignment = { vertical: 'middle' };

    // Title — serif with italic accent word
    worksheet.mergeCells('B5:E5');
    const title = worksheet.getCell('B5');
    title.value = {
      richText: [
        { font: { name: FONT_SERIF, size: 20, bold: true, color: argb(COLORS.ink) }, text: 'Deceased ' },
        { font: { name: FONT_SERIF, size: 20, italic: true, color: argb(COLORS.brass) }, text: 'Records' },
      ],
    };
    title.alignment = { vertical: 'middle' };

    // Facility + generated line
    worksheet.mergeCells('B6:E6');
    const fac = worksheet.getCell('B6');
    fac.value = `${facility} · Mortuary Management Suite`;
    fac.font = { name: FONT_SANS, size: 9, color: argb(COLORS.gray) };
    fac.alignment = { vertical: 'middle' };

    worksheet.mergeCells('B7:E7');
    const gen = worksheet.getCell('B7');
    gen.value = `Generated ${fmtDate(now)} · ${fmtTime(now)} · ${author}`;
    gen.font = { name: FONT_SANS, size: 8, color: argb(COLORS.muted) };
    gen.alignment = { vertical: 'middle' };

    // Tracking ID + expiry (the only ink blue in the letterhead)
    worksheet.mergeCells('G1:H1');
    const tLbl = worksheet.getCell('G1');
    tLbl.value = 'TRACKING ID';
    tLbl.font = { name: FONT_SANS, size: 7, bold: true, color: argb(COLORS.muted) };
    tLbl.alignment = { horizontal: 'right', vertical: 'bottom' };

    worksheet.mergeCells('G2:H2');
    const tId = worksheet.getCell('G2');
    tId.value = track;
    tId.font = { name: FONT_MONO, size: 11, bold: true, color: argb(COLORS.inkBlue) };
    tId.alignment = { horizontal: 'right', vertical: 'middle' };
    tId.border = { bottom: { style: 'mediumDashed', color: argb(COLORS.brassLight) } };

    worksheet.mergeCells('G3:H3');
    const tExp = worksheet.getCell('G3');
    tExp.value = {
      richText: [
        { font: { name: FONT_SANS, size: 8, color: argb(COLORS.gray) }, text: 'Verification expires ' },
        { font: { name: FONT_SANS, size: 8, bold: true, color: argb(COLORS.inkBlue) }, text: `${fmtDate(expires)} · 23:59` },
      ],
    };
    tExp.alignment = { horizontal: 'right', vertical: 'top' };

    // Thick-thin double rule
    for (let c = 1; c <= COLS; c++) {
      worksheet.getRow(ROW.rule).getCell(c).border = {
        top: { style: 'thick', color: argb(COLORS.ink) },
        bottom: { style: 'thin', color: argb(COLORS.ink) },
      };
    }

    /* ---------------- SUMMARY LEDGER ---------------- */
    const stats: Record<Status, number> = { Released: 0, Admitted: 0, Pending: 0 };
    records.forEach(it => { stats[normalizeStatus(it.body_status)]++; });

    const statCell = (addr: string, n: number, label: string, divider: boolean) => {
      const cell = worksheet.getCell(addr);
      cell.value = {
        richText: [
          { font: { name: FONT_SERIF, size: 14, bold: true, color: argb(COLORS.ink) }, text: `${n}  ` },
          { font: { name: FONT_SANS, size: 7.5, bold: true, color: argb(COLORS.muted) }, text: label },
        ],
      };
      cell.alignment = { vertical: 'middle' };
      if (divider) cell.border = { left: { style: 'thin', color: argb(COLORS.line) } };
    };
    statCell('A9', records.length, 'TOTAL RECORDS', false);
    statCell('D9', stats.Admitted, 'ADMITTED', true);
    statCell('F9', stats.Released, 'RELEASED', true);
    statCell('H9', stats.Pending, 'PENDING', true);

    const periodLabel = startDate && endDate
      ? `${fmtDate(new Date(startDate))} — ${fmtDate(new Date(endDate))}`
      : 'All records';

    worksheet.mergeCells(`A${ROW.period}:H${ROW.period}`);
    const period = worksheet.getCell(`A${ROW.period}`);
    period.value = {
      richText: [
        { font: { name: FONT_SANS, size: 8, color: argb(COLORS.gray) }, text: 'Reporting period ' },
        { font: { name: FONT_SANS, size: 8, bold: true, color: argb(COLORS.ink) }, text: periodLabel },
      ],
    };
    period.alignment = { horizontal: 'right', vertical: 'middle' };
    for (let c = 1; c <= COLS; c++) {
      worksheet.getRow(ROW.period).getCell(c).border = { bottom: { style: 'hair', color: argb(COLORS.line) } };
    }

    /* ---------------- COLUMN RULER (A–H) ---------------- */
    'ABCDEFGH'.split('').forEach((ch, i) => {
      const cell = worksheet.getRow(ROW.ruler).getCell(i + 1);
      cell.value = ch;
      cell.font = { name: FONT_MONO, size: 7.5, color: argb(COLORS.muted) };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { bottom: { style: 'hair', color: argb(COLORS.line) } };
    });

    /* ---------------- TABLE HEADER (ink bar + gold keyline) ---------------- */
    const HEADERS = ['File ID', 'Full Name', 'Date of Birth', 'Date of Death',
      'Next of Kin', 'Service', 'Status', 'Release Date'];
    HEADERS.forEach((h, i) => {
      const cell = worksheet.getRow(ROW.header).getCell(i + 1);
      cell.value = h.toUpperCase();
      cell.font = { name: FONT_SANS, size: 8.5, bold: true, color: argb(COLORS.bone) };
      cell.fill = solid(COLORS.ink);
      cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      cell.border = { bottom: { style: 'medium', color: argb(COLORS.gold) } };
    });

    /* ---------------- DATA ROWS (pure white, hairline rules) ---------------- */
    const putDate = (row: ExcelJS.Row, col: number, v: any) => {
      const cell = row.getCell(col);
      if (v) {
        cell.value = new Date(v);
        cell.numFmt = 'dd mmm yyyy';
        cell.font = { name: FONT_SANS, size: 9.5, color: argb(COLORS.gray) };
      } else {
        cell.value = '—';
        cell.font = { name: FONT_SANS, size: 9.5, color: argb(COLORS.muted) };
      }
      cell.alignment = { vertical: 'middle', indent: 1 };
    };

    records.forEach((item, idx) => {
      const row = worksheet.getRow(ROW.dataStart + idx);
      row.height = 26;

      // A — File ID (mono, brass)
      const idCell = row.getCell(1);
      idCell.value = item.deceased_id || item.admission_number || '—';
      idCell.font = { name: FONT_MONO, size: 9.5, color: argb(COLORS.brass) };
      idCell.alignment = { vertical: 'middle', indent: 1 };

      // B — Full Name (serif)
      const nameCell = row.getCell(2);
      nameCell.value = item.full_name || '—';
      nameCell.font = { name: FONT_SERIF, size: 11.5, color: argb(COLORS.ink) };
      nameCell.alignment = { vertical: 'middle', indent: 1 };

      // C / D — dates
      putDate(row, 3, item.date_of_birth);
      putDate(row, 4, item.date_of_death);

      // E — Next of Kin (name + small-caps label, two lines)
      const kinCell = row.getCell(5);
      kinCell.value = {
        richText: [
          { font: { name: FONT_SANS, size: 10.5, color: argb(COLORS.ink) }, text: item.next_of_kin || '—' },
          { font: { name: FONT_SANS, size: 7, bold: true, color: argb(COLORS.muted) }, text: '\nNEXT OF KIN' },
        ],
      };
      kinCell.alignment = { vertical: 'middle', wrapText: true, indent: 1 };

      // F — Service (small caps)
      const svcCell = row.getCell(6);
      svcCell.value = String(item.service_type || '—').toUpperCase();
      svcCell.font = { name: FONT_SANS, size: 8.5, bold: true, color: argb(COLORS.gray) };
      svcCell.alignment = { vertical: 'middle', indent: 1 };

      // G — Status (colored text, no fills — pure white sheet)
      const status = normalizeStatus(item.body_status);
      const stCell = row.getCell(7);
      stCell.value = status;
      stCell.font = { name: FONT_SANS, size: 10, bold: true, color: argb(STATUS_COLOR[status]) };
      stCell.alignment = { vertical: 'middle', indent: 1 };

      // H — Release date
      putDate(row, 8, item.release_date || item.dispatch_date);

      // hairline bottom on every cell
      for (let c = 1; c <= COLS; c++) {
        row.getCell(c).border = { bottom: { style: 'hair', color: argb(COLORS.line) } };
      }
    });

    /* ---------------- END-OF-EXTRACT / EMPTY STATE ---------------- */
    let lastRow: number;
    if (records.length === 0) {
      lastRow = ROW.dataStart;
      worksheet.mergeCells(`A${lastRow}:H${lastRow}`);
      const empty = worksheet.getCell(`A${lastRow}`);
      empty.value = 'NO RECORDS FOUND FOR THE SELECTED PERIOD';
      empty.font = { name: FONT_SANS, size: 9, italic: true, color: argb(COLORS.muted) };
      empty.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(lastRow).height = 34;
    } else {
      lastRow = ROW.dataStart + records.length;
    }

    const endNum = lastRow + 1;
    worksheet.mergeCells(`A${endNum}:H${endNum}`);
    const endCell = worksheet.getCell(`A${endNum}`);
    endCell.value = `—  END OF EXTRACT · ${records.length} RECORD${records.length === 1 ? '' : 'S'} · REF ${track} · EXPIRES ${fmtStamp(expires)}  —`;
    endCell.font = { name: FONT_SANS, size: 7.5, bold: true, color: argb(COLORS.muted) };
    endCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(endNum).height = 26;

    /* ---------------- FOOTER: CERTIFICATION STAMP + QR ---------------- */
    const f0 = endNum + 2; // stamp top row
    const stampLines: Array<[string, Partial<ExcelJS.Font>]> = [
      ['OFFICIAL REGISTRY EXTRACT', { name: FONT_SANS, size: 6.5, bold: true }],
      ['CERTIFIED', { name: FONT_SERIF, size: 13, bold: true }],
      [fmtDate(now).toUpperCase(), { name: FONT_SANS, size: 7.5 }],
      [`NO. ${ref}`, { name: FONT_MONO, size: 7.5 }],
      [`VALID THRU ${fmtStamp(expires)}`, { name: FONT_SANS, size: 6.5, bold: true }],
    ];
    const stampHeights = [13, 22, 13, 13, 13];

    stampLines.forEach(([text, font], i) => {
      const rowNum = f0 + i;
      worksheet.getRow(rowNum).height = stampHeights[i];
      worksheet.mergeCells(`C${rowNum}:E${rowNum}`);
      const cell = worksheet.getCell(`C${rowNum}`);
      cell.value = text;
      cell.font = { ...font, color: argb(COLORS.inkBlue) };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    // box border around the stamp block
    for (let r = 0; r < 5; r++) {
      for (let c = 3; c <= 5; c++) {
        worksheet.getRow(f0 + r).getCell(c).border = {
          top: r === 0 ? { style: 'medium', color: argb(COLORS.inkBlue) } : undefined,
          bottom: r === 4 ? { style: 'medium', color: argb(COLORS.inkBlue) } : undefined,
          left: c === 3 ? { style: 'medium', color: argb(COLORS.inkBlue) } : undefined,
          right: c === 5 ? { style: 'medium', color: argb(COLORS.inkBlue) } : undefined,
        };
      }
    }

    // QR — scannable verification code carrying track + expiry
    const qrBuf = await makeQr(verifyUrl);
    if (qrBuf) {
      const qrId = workbook.addImage({ buffer: excelBuffer(qrBuf), extension: 'png' });
      worksheet.addImage(qrId, { tl: { col: 6.1, row: f0 - 1 }, ext: { width: 92, height: 92 } });

      const capRow = f0 + 5;
      worksheet.mergeCells(`G${capRow}:H${capRow}`);
      const cap = worksheet.getCell(`G${capRow}`);
      cap.value = 'SCAN TO VERIFY';
      cap.font = { name: FONT_SANS, size: 7, bold: true, color: argb(COLORS.ink) };
      cap.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells(`G${capRow + 1}:H${capRow + 1}`);
      const qurl = worksheet.getCell(`G${capRow + 1}`);
      qurl.value = `lf.services/v/${ref}`;
      qurl.font = { name: FONT_MONO, size: 7.5, color: argb(COLORS.gray) };
      qurl.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells(`G${capRow + 2}:H${capRow + 2}`);
      const qexp = worksheet.getCell(`G${capRow + 2}`);
      qexp.value = `Expires ${fmtDate(expires)} · 23:59`;
      qexp.font = { name: FONT_SANS, size: 7, color: argb(COLORS.muted) };
      qexp.alignment = { horizontal: 'center', vertical: 'middle' };

      var baseRowNum = capRow + 4;
    } else {
      // graceful fallback if `qrcode` isn't installed — print the verify URL instead
      worksheet.mergeCells(`G${f0 + 2}:H${f0 + 2}`);
      const alt = worksheet.getCell(`G${f0 + 2}`);
      alt.value = verifyUrl;
      alt.font = { name: FONT_MONO, size: 8, color: argb(COLORS.inkBlue) };
      alt.alignment = { horizontal: 'center', vertical: 'middle' };
      var baseRowNum = f0 + 4;
    }

    /* ---------------- BASE LINE ---------------- */
    const baseRow = worksheet.getRow(baseRowNum);
    baseRow.height = 22;
    for (let c = 1; c <= COLS; c++) {
      baseRow.getCell(c).border = { top: { style: 'thin', color: argb(COLORS.line) } };
    }
    worksheet.mergeCells(`A${baseRowNum}:C${baseRowNum}`);
    const bLeft = worksheet.getCell(`A${baseRowNum}`);
    bLeft.value = `© ${now.getFullYear()} ${facility}`;
    bLeft.font = { name: FONT_SANS, size: 7.5, bold: true, color: argb(COLORS.muted) };
    bLeft.alignment = { vertical: 'middle' };

    worksheet.mergeCells(`D${baseRowNum}:F${baseRowNum}`);
    const bMid = worksheet.getCell(`D${baseRowNum}`);
    bMid.value = 'STRICTLY CONFIDENTIAL — HANDLE WITH DIGNITY';
    bMid.font = { name: FONT_SANS, size: 7.5, color: argb(COLORS.muted) };
    bMid.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells(`G${baseRowNum}:H${baseRowNum}`);
    const bRight = worksheet.getCell(`G${baseRowNum}`);
    bRight.value = {
      richText: [
        { font: { name: FONT_SANS, size: 7.5, bold: true, color: argb(COLORS.muted) }, text: 'REF ' },
        { font: { name: FONT_MONO, size: 7.5, bold: true, color: argb(COLORS.inkBlue) }, text: track },
        { font: { name: FONT_SANS, size: 7.5, bold: true, color: argb(COLORS.muted) }, text: ` · EXP ${fmtStamp(expires)}` },
      ],
    };
    bRight.alignment = { horizontal: 'right', vertical: 'middle' };

    /* ---------------- VIEW + PAGE SETUP ---------------- */
    worksheet.views = [{ state: 'frozen', ySplit: ROW.header, showGridLines: false }];
    worksheet.pageSetup = {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    };
    worksheet.headerFooter = {
      oddFooter: `&8&K6B6862${track} · Expires ${fmtStamp(expires)}&R&8&K6B6862Page &P of &N`,
    };

    /* ---------------- PIN + SAVE TO GLOBAL UPLOADS + RESPOND ---------------- */
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const fileName = `${slugifyTenant(tenantSlug)}_Deceased_Records_${now.toISOString().slice(0, 10)}.xlsx`;

    Logger.info({ message: `Styled Excel export generated: ${records.length} records · ${track} · expires ${fmtStamp(expires)}` });

    // Optional 4-digit PIN — encrypt with standard Office encryption so only
    // someone with the PIN can open it (Excel prompts for it; the browser
    // Workbook Vault decrypts locally, then previews instantly).
    const exportPin = String((req.body || {}).exportPin || '').trim();
    const pinProtected = /^\d{4}$/.test(exportPin);
    const finalBuffer = await encryptWithPin(buffer, exportPin);

    // Primary path — persist the workbook through the GLOBAL UPLOADER into
    // the shared uploads folder scoped to THIS tenant, then hand the
    // /uploads/... URL back so the browser opens it instantly in
    // xlsx-preview.html (Workbook Vault viewer).
    try {
      const { fullPath, fileUrl, filename } = await saveToGlobalUploads(finalBuffer, tenantSlug, fileName);
      Logger.info({ message: `Export saved to global uploads via centralized uploader: ${fullPath}` });
      return res.status(200).json({
        success: true,
        message: 'Export saved to the global uploads folder',
        fileName: filename,
        fileUrl,
        pinProtected,
        trackingId: track,
        expiresAt: expires.toISOString(),
        recordCount: records.length,
        data: { fileName: filename, fileUrl, pinProtected, trackingId: track, expiresAt: expires.toISOString(), recordCount: records.length },
      });
    } catch (saveErr: any) {
      // Shared volume unavailable — never lose the export: stream inline
      // (legacy behaviour) so the client still receives the file.
      Logger.error({ message: 'Global uploads save failed — streaming export inline instead', error: saveErr?.message });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Length', String(finalBuffer.byteLength));
      return res.send(finalBuffer);
    }
  } catch (error: any) {
    Logger.error({ message: 'Styled Excel export failed', error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to generate export',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Dummy functions to prevent routing errors if they are still mapped in your routes file
export const checkExportStatus = async (req: ExportRequest, res: Response): Promise<Response> => {
  return res.status(400).json({ success: false, message: 'Synchronous export does not require status polling.' });
};

export const getExportHistory = async (req: ExportRequest, res: Response): Promise<Response> => {
  try {
    // Tenant middleware writes to (req as any).tenant — same pattern as the export.
    const tenant = (req as any).tenant;
    const tenantSlug = (req as any).tenantSlug || tenant?.tenant_slug || 'unknown';
    const safeSlug = slugifyTenant(tenantSlug);

    // New exports are written by the GLOBAL UPLOADER into
    //   <uploads>/<slug>/exports/deceased-reports/…
    // while older exports live directly in <uploads>/<slug>/deceased-reports/…
    // — list BOTH so history never loses previously generated files.
    const reportDirs = [
      { dir: path.join(getGlobalUploadsDir(), safeSlug, 'exports', 'deceased-reports'), urlBase: `/uploads/${safeSlug}/exports/deceased-reports` },
      { dir: path.join(getGlobalUploadsDir(), safeSlug, 'deceased-reports'), urlBase: `/uploads/${safeSlug}/deceased-reports` },
    ];

    const perDir = await Promise.all(
      reportDirs.map(async ({ dir, urlBase }) => {
        let entries: string[];
        try {
          entries = await fs.promises.readdir(dir);
        } catch {
          // This location doesn't exist yet for the tenant — not an error.
          return [];
        }
        return Promise.all(
          entries
            .filter((f) => /\.xlsx$/i.test(f))
            .map(async (f) => {
              try {
                const st = await fs.promises.stat(path.join(dir, f));
                return {
                  fileName: f,
                  fileUrl: `${urlBase}/${f}`,
                  size: st.size,
                  modifiedAt: st.mtime.toISOString(),
                };
              } catch {
                return null;
              }
            })
        );
      })
    );

    // Merge both locations, dedupe by file name (newest location wins order),
    // newest first.
    const seen = new Set<string>();
    const files = perDir
      .flat()
      .filter((f): f is NonNullable<typeof f> => f !== null)
      .filter((f) => (seen.has(f.fileName) ? false : (seen.add(f.fileName), true)))
      .sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1));

    return res.status(200).json({ success: true, data: files, count: files.length });
  } catch (error: any) {
    Logger.error({ message: 'Export history lookup failed', error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to load export history' });
  }
};

export default {
  exportExcelWithCharts,
  checkExportStatus,
  getExportHistory,
};