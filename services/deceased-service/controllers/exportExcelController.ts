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
// Design mirrors the clean HTML preview:
// verdigris header bar, alternating colored columns,
// solid status pills, QR + Signature footer.
// ============================================

/* ---------------- DESIGN TOKENS (COLORS) ---------------- */
const COLORS = {
  ink: 'FF1A1A1A',
  bone: 'FFFAF8F4',
  bone2: 'FFF4F1EA',       // Soft bone for end-of-extract/base line
  white: 'FFFFFFFF',
  brass: 'FF6B4045',
  brassLight: 'FFA98F6E',
  verdigris: 'FF3D4F47',
  verdigrisDark: 'FF2E3F37',
  verdigrisTint: 'FFEDF1EF', // Soft green tint for alternating columns
  line: 'FFE2DDD3',
  lineSoft: 'FFECE7DD',
  gray: 'FF6B6862',
  muted: 'FF999999',
  red: 'FF9B4A3F',
  inkBlue: 'FF0F33E7',
  gold: 'FFC9A227',
  goldSoft: 'FFE5C158',
} as const;

const FONT_SERIF = 'Georgia';
const FONT_MONO = 'Consolas';
const FONT_SANS = 'Calibri';

const VERIFY_BASE = 'https://lf.services/verify';
const EXPIRY_DAYS = 7;

/* ---------------- SMALL HELPERS ---------------- */
const argb = (c: string) => ({ argb: c });
const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => `${pad(d.getDate())} ${d.toLocaleDateString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
const fmtStamp = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
const fmtTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const solid = (color: string) => ({ type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: color } });

const excelBuffer = (b: Buffer) => b as unknown as NonNullable<ExcelJS.Image['buffer']>;

function safeMerge(worksheet: ExcelJS.Worksheet, range: string): boolean {
  try {
    worksheet.mergeCells(range);
    return true;
  } catch (err: any) {
    Logger.warn({ message: `Excel merge skipped — range overlaps an existing merge: ${range}`, error: err?.message });
    return false;
  }
}

type Status = 'Released' | 'Admitted' | 'Pending';
function normalizeStatus(raw: any): Status {
  const s = String(raw || 'Pending').toLowerCase();
  if (s.includes('release') || s.includes('buried') || s.includes('transfer')) return 'Released';
  if (s.includes('admit') || s.includes('morgue') || s.includes('care') || s.includes('embalm')) return 'Admitted';
  return 'Pending';
}

/** Backgrounds for status pills (solid fills with white text) */
const STATUS_FILL: Record<Status, string> = {
  Released: COLORS.verdigris,
  Admitted: COLORS.brass,
  Pending: COLORS.red,
};

/** Alternating column backgrounds to make the list pop */
const COL_FILLS = [
  COLORS.bone2,        // Col 1: File ID
  COLORS.white,        // Col 2: Full Name
  COLORS.verdigrisTint,// Col 3: DOB
  COLORS.white,        // Col 4: DOD
  COLORS.bone2,        // Col 5: Next of Kin
  COLORS.white,        // Col 6: Service
  COLORS.white,        // Col 7: Status (Pill provides the color here)
  COLORS.verdigrisTint,// Col 8: Release Date
];

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let timer: any;
  const timeout = new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), ms); });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function makeQr(payload: string): Promise<Buffer | null> {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toBuffer(payload, {
      type: 'png', width: 240, margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#2E3F37', light: '#FFFFFF' }, // Verdigris dark QR code
    });
  } catch {
    return null;
  }
}

/* ---------------- GLOBAL UPLOADS (TENANT-SCOPED) ---------------- */
const slugifyTenant = (raw: string): string =>
  String(raw || 'system')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'system';

const getGlobalUploadsDir = (): string =>
  process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';

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
    const tenant = (req as any).tenant;
    const dbName = tenant?.db_name;
    const tenantSlug = (req as any).tenantSlug || tenant?.tenant_slug || 'unknown';
    const facility = tenant?.name || 'LF Services';

    const rawEmail = (req as any).user?.email || 'sys.admin';
    const author = String(rawEmail).split('@')[0] || 'sys.admin';

    if (!dbName) {
      return res.status(400).json({ success: false, message: 'Tenant information missing' });
    }

    const { startDate, endDate } = (req.body || {}) as { startDate?: string; endDate?: string };

    // ── SCHEMA-ADAPTIVE RECORD FETCH ────────────────────────────────────
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
    const dcol = (name: string, alias?: string) =>
      has(name) ? `d.${name}${alias ? ` AS ${alias}` : ''}` : `NULL AS ${alias || name}`;

    let nextOfKinExpr = dcol('contact_person', 'next_of_kin');
    if (has('deceased_id') && (await tableExists('next_of_kin'))) {
      const kCols = await tableColumns('next_of_kin');
      const kinWhere = [`nok.deceased_id = d.deceased_id`];
      if (kCols.has('is_deleted')) kinWhere.push(`nok.is_deleted = 0`);
      const kinOrder = kCols.has('is_primary') ? `nok.is_primary DESC, nok.id ASC` : `nok.id ASC`;
      nextOfKinExpr = `(SELECT nok.full_name FROM next_of_kin nok WHERE ${kinWhere.join(' AND ')} ORDER BY ${kinOrder} LIMIT 1) AS next_of_kin`;
    }

    const serviceExpr = has('service_type')
      ? `d.service_type AS service_type`
      : has('burial_type') ? `d.burial_type AS service_type` : `NULL AS service_type`;

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
    (workbook as unknown as { title: string }).title = 'Deceased Records — Certified Extract';
    workbook.created = now;

    const worksheet = workbook.addWorksheet('Deceased Records', {
      properties: { defaultColWidth: 12 },
    });

    worksheet.columns = [
      { key: 'fileId', width: 18 },
      { key: 'fullName', width: 28 },
      { key: 'dob', width: 16 },
      { key: 'dod', width: 16 },
      { key: 'kin', width: 26 },
      { key: 'service', width: 14 },
      { key: 'status', width: 14 },
      { key: 'releaseDate', width: 16 },
    ];

    const COLS = 8;
    // Starts immediately at row 1 (No letterhead/stats)
    const ROW = { header: 1, dataStart: 2 };

    /* ---------------- TABLE HEADER (Verdigris bar + gold keyline) ---------------- */
    const HEADERS = ['File ID', 'Full Name', 'Date of Birth', 'Date of Death',
      'Next of Kin', 'Service', 'Status', 'Release Date'];
    
    HEADERS.forEach((h, i) => {
      const cell = worksheet.getRow(ROW.header).getCell(i + 1);
      cell.value = h.toUpperCase();
      cell.font = { name: FONT_SANS, size: 9, bold: true, color: argb(COLORS.bone) };
      cell.fill = solid(COLORS.verdigrisDark); // Elegant dark green header
      cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      cell.border = { bottom: { style: 'medium', color: argb(COLORS.gold) } };
    });
    worksheet.getRow(ROW.header).height = 28;

    /* ---------------- DATA ROWS (Colorful Column Backgrounds + Pills) ---------------- */
    const putDate = (row: ExcelJS.Row, col: number, v: any) => {
      const cell = row.getCell(col);
      if (v) {
        cell.value = new Date(v);
        cell.numFmt = 'dd mmm yyyy';
        cell.font = { name: FONT_SANS, size: 10, color: argb(COLORS.gray) };
      } else {
        cell.value = '—';
        cell.font = { name: FONT_SANS, size: 10, color: argb(COLORS.muted) };
      }
      cell.alignment = { vertical: 'middle', indent: 1 };
    };

    records.forEach((item, idx) => {
      const row = worksheet.getRow(ROW.dataStart + idx);
      row.height = 28;

      // Apply alternating column backgrounds
      for (let c = 1; c <= COLS; c++) {
        row.getCell(c).fill = solid(COL_FILLS[c - 1]);
      }

      // A — File ID (mono, brass)
      const idCell = row.getCell(1);
      idCell.value = item.deceased_id || item.admission_number || '—';
      idCell.font = { name: FONT_MONO, size: 10, color: argb(COLORS.brass), bold: true };
      idCell.alignment = { vertical: 'middle', indent: 1 };

      // B — Full Name (serif)
      const nameCell = row.getCell(2);
      nameCell.value = item.full_name || '—';
      nameCell.font = { name: FONT_SERIF, size: 12, color: argb(COLORS.ink) };
      nameCell.alignment = { vertical: 'middle', indent: 1 };

      // C / D — dates
      putDate(row, 3, item.date_of_birth);
      putDate(row, 4, item.date_of_death);

      // E — Next of Kin
      const kinCell = row.getCell(5);
      kinCell.value = {
        richText: [
          { font: { name: FONT_SANS, size: 11, color: argb(COLORS.ink), bold: true }, text: item.next_of_kin || '—' },
          { font: { name: FONT_SANS, size: 7, bold: true, color: argb(COLORS.muted) }, text: '\nNEXT OF KIN' },
        ],
      };
      kinCell.alignment = { vertical: 'middle', wrapText: true, indent: 1 };

      // F — Service (small caps)
      const svcCell = row.getCell(6);
      svcCell.value = String(item.service_type || '—').toUpperCase();
      svcCell.font = { name: FONT_SANS, size: 9, bold: true, color: argb(COLORS.verdigrisDark) };
      svcCell.alignment = { vertical: 'middle', indent: 1 };

      // G — Status (Solid Pill: colored fill + bold white text)
      const status = normalizeStatus(item.body_status);
      const stCell = row.getCell(7);
      stCell.value = status;
      stCell.font = { name: FONT_SANS, size: 10, bold: true, color: argb(COLORS.bone) };
      stCell.fill = solid(STATUS_FILL[status]); // Solid pill background
      stCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // H — Release date
      putDate(row, 8, item.release_date || item.dispatch_date);

      // hairline bottom on every cell
      for (let c = 1; c <= COLS; c++) {
        row.getCell(c).border = { bottom: { style: 'hair', color: argb(COLORS.lineSoft) } };
      }
    });

    /* ---------------- END-OF-EXTRACT / EMPTY STATE ---------------- */
    let lastRow: number;
    if (records.length === 0) {
      lastRow = ROW.dataStart;
      safeMerge(worksheet, `A${lastRow}:H${lastRow}`);
      const empty = worksheet.getCell(`A${lastRow}`);
      empty.value = 'NO RECORDS FOUND FOR THE SELECTED PERIOD';
      empty.font = { name: FONT_SANS, size: 10, italic: true, color: argb(COLORS.muted) };
      empty.alignment = { horizontal: 'center', vertical: 'middle' };
      empty.fill = solid(COLORS.bone2);
      worksheet.getRow(lastRow).height = 36;
    } else {
      lastRow = ROW.dataStart + records.length - 1;
    }

    const endNum = lastRow + 1;
    safeMerge(worksheet, `A${endNum}:H${endNum}`);
    const endCell = worksheet.getCell(`A${endNum}`);
    endCell.value = `—  END OF EXTRACT · ${records.length} RECORD${records.length === 1 ? '' : 'S'} · REF ${track} · EXPIRES ${fmtStamp(expires)}  —`;
    endCell.font = { name: FONT_SANS, size: 8, bold: true, color: argb(COLORS.gray) };
    endCell.fill = solid(COLORS.bone2); // Soft bone background instead of black
    endCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(endNum).height = 30;

    /* ---------------- FOOTER: QR (LEFT) + SIGNATURE (RIGHT) ---------------- */
    const f0 = endNum + 2; // Top row of footer

    // Set row heights for footer area
    [f0, f0 + 1, f0 + 2, f0 + 3, f0 + 4, f0 + 5, f0 + 6].forEach(r => worksheet.getRow(r).height = 18);

    // 1. QR Code Block (Left side, A:B)
    const qrBuf = await makeQr(verifyUrl);
    if (qrBuf) {
      const qrId = workbook.addImage({ buffer: excelBuffer(qrBuf), extension: 'png' });
      worksheet.addImage(qrId, { tl: { col: 0.5, row: f0 - 0.5 }, ext: { width: 120, height: 120 } });
    }

    const qrCapRow = f0 + 7;
    safeMerge(worksheet, `A${qrCapRow}:B${qrCapRow}`);
    const cap = worksheet.getCell(`A${qrCapRow}`);
    cap.value = 'SCAN TO VERIFY';
    cap.font = { name: FONT_SANS, size: 8, bold: true, color: argb(COLORS.ink) };
    cap.alignment = { horizontal: 'center', vertical: 'middle' };

    safeMerge(worksheet, `A${qrCapRow + 1}:B${qrCapRow + 1}`);
    const qurl = worksheet.getCell(`A${qrCapRow + 1}`);
    qurl.value = `lf.services/v/${ref}`;
    qurl.font = { name: FONT_MONO, size: 8, color: argb(COLORS.gray) };
    qurl.alignment = { horizontal: 'center', vertical: 'middle' };

    safeMerge(worksheet, `A${qrCapRow + 2}:B${qrCapRow + 2}`);
    const qexp = worksheet.getCell(`A${qrCapRow + 2}`);
    qexp.value = `Expires ${fmtDate(expires)} · 23:59`;
    qexp.font = { name: FONT_SANS, size: 7, color: argb(COLORS.muted) };
    qexp.alignment = { horizontal: 'center', vertical: 'middle' };

    // 2. Signature Block (Right side, E:H, separated by line on col D)
    const sigLines = [
      `${facility} · Mortuary Management Suite`,
      `Generated ${fmtDate(now)} · ${fmtTime(now)} · ${author}`,
      `Issued by the Office of the Registrar`
    ];

    sigLines.forEach((txt, i) => {
      const r = f0 + i;
      safeMerge(worksheet, `E${r}:H${r}`);
      const cell = worksheet.getCell(`E${r}`);
      cell.value = txt;
      cell.font = { name: FONT_SANS, size: 9, color: argb(COLORS.muted) };
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      // Draw the vertical separator line on column D
      cell.border = { left: { style: 'thin', color: argb(COLORS.line) } };
      worksheet.getRow(r).height = 20;
    });

    // Tracking ID Label & Value
    const trackLabelRow = f0 + 4;
    safeMerge(worksheet, `E${trackLabelRow}:H${trackLabelRow}`);
    const tLbl = worksheet.getCell(`E${trackLabelRow}`);
    tLbl.value = 'TRACKING ID';
    tLbl.font = { name: FONT_SANS, size: 7, bold: true, color: argb(COLORS.muted) };
    tLbl.alignment = { horizontal: 'right', vertical: 'middle' };
    tLbl.border = { left: { style: 'thin', color: argb(COLORS.line) } };

    const trackValRow = f0 + 5;
    safeMerge(worksheet, `E${trackValRow}:H${trackValRow}`);
    const tIdCell = worksheet.getCell(`E${trackValRow}`);
    tIdCell.value = track;
    tIdCell.font = { name: FONT_MONO, size: 12, bold: true, color: argb(COLORS.verdigrisDark) };
    tIdCell.alignment = { horizontal: 'right', vertical: 'middle' };
    tIdCell.border = {
      left: { style: 'thin', color: argb(COLORS.line) },
      bottom: { style: 'mediumDashed', color: argb(COLORS.brassLight) }
    };

    // Registrar & Seal Line
    const regRow = f0 + 6;
    safeMerge(worksheet, `E${regRow}:H${regRow}`);
    const regCell = worksheet.getCell(`E${regRow}`);
    regCell.value = '— Registrar General —';
    regCell.font = { name: FONT_SERIF, size: 11, italic: true, color: argb(COLORS.ink) };
    regCell.alignment = { horizontal: 'right', vertical: 'middle' };
    regCell.border = { left: { style: 'thin', color: argb(COLORS.line) } };

    const sealRow = f0 + 7;
    safeMerge(worksheet, `E${sealRow}:H${sealRow}`);
    const sealCell = worksheet.getCell(`E${sealRow}`);
    sealCell.border = {
      top: { style: 'thin', color: argb(COLORS.ink) },
      left: { style: 'thin', color: argb(COLORS.line) }
    };
    sealCell.alignment = { horizontal: 'right' };

    const baseRowNum = Math.max(qrCapRow + 3, sealRow + 2);

    /* ---------------- BASE LINE ---------------- */
    const baseRow = worksheet.getRow(baseRowNum);
    baseRow.height = 24;
    for (let c = 1; c <= COLS; c++) {
      baseRow.getCell(c).border = { top: { style: 'thin', color: argb(COLORS.line) } };
      baseRow.getCell(c).fill = solid(COLORS.bone2); // Soft bone background
    }

    safeMerge(worksheet, `A${baseRowNum}:C${baseRowNum}`);
    const bLeft = worksheet.getCell(`A${baseRowNum}`);
    bLeft.value = `© ${now.getFullYear()} ${facility}`;
    bLeft.font = { name: FONT_SANS, size: 8, bold: true, color: argb(COLORS.muted) };
    bLeft.alignment = { vertical: 'middle', indent: 1 };

    safeMerge(worksheet, `D${baseRowNum}:E${baseRowNum}`);
    const bMid = worksheet.getCell(`D${baseRowNum}`);
    bMid.value = 'STRICTLY CONFIDENTIAL — HANDLE WITH DIGNITY';
    bMid.font = { name: FONT_SANS, size: 8, color: argb(COLORS.muted) };
    bMid.alignment = { horizontal: 'center', vertical: 'middle' };

    safeMerge(worksheet, `F${baseRowNum}:H${baseRowNum}`);
    const bRight = worksheet.getCell(`F${baseRowNum}`);
    bRight.value = {
      richText: [
        { font: { name: FONT_SANS, size: 8, bold: true, color: argb(COLORS.muted) }, text: 'REF ' },
        { font: { name: FONT_MONO, size: 8, bold: true, color: argb(COLORS.verdigrisDark) }, text: track },
        { font: { name: FONT_SANS, size: 8, bold: true, color: argb(COLORS.muted) }, text: ` · EXP ${fmtStamp(expires)}` },
      ],
    };
    bRight.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };

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

    const exportPin = String((req.body || {}).exportPin || '').trim();
    const pinProtected = /^\d{4}$/.test(exportPin);
    const finalBuffer = await encryptWithPin(buffer, exportPin);

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
    const tenant = (req as any).tenant;
    const tenantSlug = (req as any).tenantSlug || tenant?.tenant_slug || 'unknown';
    const safeSlug = slugifyTenant(tenantSlug);

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