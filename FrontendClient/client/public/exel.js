import { Request, Response } from 'express';
import crypto from 'crypto';
import ExcelJS from 'exceljs';
import { safeTenantQuery } from '../../../shared/dbConfig';
import Logger from '../../../packages/shared-logger/src/index';

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
    const timeout = new Promise < null > (resolve => { timer = setTimeout(() => resolve(null), ms); });
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
        workbook.title = 'Deceased Records — Certified Extract';
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
            const imgId = workbook.addImage({ buffer: logoBuf, extension: 'png' });
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
        tId.border = { bottom: { style: 'dashed', color: argb(COLORS.brassLight) } };

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
            const qrId = workbook.addImage({ buffer: qrBuf, extension: 'png' });
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

        /* ---------------- STREAM ---------------- */
        const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
        const fileName = `${tenantSlug}_Deceased_Records_${now.toISOString().slice(0, 10)}.xlsx`;

        Logger.info({ message: `Styled Excel export generated: ${records.length} records · ${track} · expires ${fmtStamp(expires)}` });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Length', String(buffer.byteLength));
        return res.send(buffer);
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
    return res.status(200).json({ success: true, data: [] });
};

export default {
    exportExcelWithCharts,
    checkExportStatus,
    getExportHistory,
};


< !DOCTYPE html >
    <html lang="en">
        <head>
            <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Deceased Records — Certified Export · LF Services</title>

                    <link rel="preconnect" href="https://fonts.googleapis.com">
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                            <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Instrument+Sans:ital,wght@0,400..700;1,400..600&family=Spline+Sans+Mono:wght@400..600&family=Mrs+Saint+Delafield&display=swap" rel="stylesheet">
                                <script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"></script>

                                <style>
  /* ====== PROJECT PALETTE (COLORS) ====== */
                                    :root{
                                        --ink:        #1A1A1A;
                                    --bone:       #FAF8F4;
                                    --white:      #FFFFFF;
                                    --brass:      #6B4045;
                                    --brassLight: #A98F6E;
                                    --verdigris:  #3D4F47;
                                    --verdigrisD: #2E3F37;
                                    --line:       #E2DDD3;
                                    --gray:       #6B6862;
                                    --muted:      #999999;
                                    --red:        #9B4A3F;
                                    --inkBlue:    #0f33e7;   /* stamp + tracking ink only */
                                    --gold:       #C9A227;
                                    --goldDark:   #A8851C;
                                    --page:       #F1EDE4;   /* linen backdrop behind the white sheet */
  }
                                    *{margin:0; padding:0; box-sizing:border-box; }
                                    body{
                                        font - family:'Instrument Sans', sans-serif;
                                    background:var(--page); color:var(--ink); min-height:100vh;
  }
                                    body::after{
                                        content:''; position:fixed; inset:0; pointer-events:none; z-index:60; opacity:.04;
                                    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' /></filter><rect width='160' height='160' filter='url(%23n)' /></svg>");
  }
                                    ::selection{background:var(--gold); color:var(--ink); }
                                    .mono{font - family:'Spline Sans Mono', monospace; }

                                    .stage{padding:clamp(20px, 4vw, 44px) clamp(10px, 2.5vw, 20px) 60px; }
                                    .sheet{
                                        max - width:1080px; margin:0 auto; background:var(--white);
                                    border:1px solid var(--line);
                                    box-shadow:0 1px 2px rgba(26,26,26,.05), 0 30px 70px -34px rgba(26,26,26,.25);
                                    padding:clamp(24px, 4.5vw, 54px) clamp(18px, 4.5vw, 58px) clamp(28px, 4vw, 44px);
                                    animation:sheetIn .7s cubic-bezier(.22,1,.36,1) both;
  }
                                    @keyframes sheetIn{from{opacity:0; transform:translateY(16px); } }

                                    /* ============ MINIMAL LETTERHEAD (fluid, tablet-safe) ============ */
                                    .masthead{display:flex; justify-content:space-between; align-items:flex-start; gap:clamp(18px, 3vw, 36px); }
                                    .mast-brand{display:flex; gap:clamp(14px, 2vw, 22px); align-items:flex-start; min-width:0; }
                                    .logo img{height:clamp(38px, 4.5vw, 52px); width:auto; display:block; }
                                    .logo-fallback{
                                        width:clamp(44px, 5vw, 56px); height:clamp(44px, 5vw, 56px);
                                    border:1.5px solid var(--ink); display:flex; align-items:center; justify-content:center;
                                    font-family:'Fraunces', serif; font-size:clamp(16px, 2vw, 21px); font-weight:600; letter-spacing:.06em;
  }
                                    .classification{
                                        font - size:clamp(7.5px, 1vw, 9px); font-weight:700; letter-spacing:.22em;
                                    text-transform:uppercase; color:var(--brass); margin-bottom:6px; white-space:nowrap;
  }
                                    h1{
                                        font - family:'Fraunces', serif; font-optical-sizing:auto;
                                    font-size:clamp(20px, 1.2vw + 12px, 34px); font-weight:560;
                                    letter-spacing:-.015em; line-height:1.06; color:var(--ink);
  }
                                    h1 em{font - style:italic; font-weight:470; color:var(--brass); }
                                    .facility{font - size:clamp(10.5px, 1.1vw, 13px); color:var(--gray); margin-top:4px; }
                                    .genline{font - size:clamp(9.5px, 1vw, 11.5px); color:var(--muted); margin-top:3px; letter-spacing:.02em; }

                                    /* tracking / expiry — the only ink-blue on the page */
                                    .track{text - align:right; flex:none; align-self:center; }
                                    .track .lbl{
                                        font - size:clamp(7.5px, .9vw, 9px); font-weight:700; letter-spacing:.2em;
                                    text-transform:uppercase; color:var(--muted); margin-bottom:4px;
  }
                                    .track .id{
                                        font - family:'Spline Sans Mono', monospace; font-size:clamp(12px, 1.1vw + 4px, 15px);
                                    font-weight:600; letter-spacing:.04em; color:var(--inkBlue);
                                    border-bottom:1px dashed #B6C0F2; padding-bottom:3px; white-space:nowrap;
  }
                                    .track .exp{margin - top:6px; font-size:clamp(9.5px, 1vw, 11px); color:var(--gray); white-space:nowrap; }
                                    .track .exp b{color:var(--inkBlue); font-weight:600; }

                                    .rule-double{
                                        height:6px; margin:clamp(16px, 2.5vw, 24px) 0 0;
                                    border-top:2.5px solid var(--ink); border-bottom:1px solid var(--ink);
  }

                                    /* ============ SLIM SUMMARY ============ */
                                    .ledger{
                                        display:flex; align-items:center; flex-wrap:wrap;
                                    padding:clamp(10px, 1.6vw, 14px) 0; border-bottom:1px solid var(--line);
  }
                                    .stat{display:flex; align-items:baseline; gap:8px; }
                                    .stat + .stat{border - left:1px solid var(--line); margin-left:clamp(14px, 2vw, 22px); padding-left:clamp(14px, 2vw, 22px); }
                                    .stat b{
                                        font - family:'Fraunces', serif; font-size:clamp(16px, 2vw, 21px); font-weight:550;
                                    line-height:1; color:var(--ink); font-variant-numeric:tabular-nums;
  }
                                    .stat span{
                                        font - size:clamp(8px, .95vw, 9.5px); font-weight:700; letter-spacing:.14em;
                                    text-transform:uppercase; color:var(--muted); white-space:nowrap;
  }
                                    .ledger-period{margin - left:auto; font-size:clamp(10px, 1.05vw, 11.5px); color:var(--gray); letter-spacing:.03em; }
                                    .ledger-period b{color:var(--ink); font-weight:600; }

                                    /* ============ RECORDS TABLE — ink bar, warm rules ============ */
                                    .table-wrap{overflow - x:auto; -webkit-overflow-scrolling:touch; }
                                    table{width:100%; border-collapse:collapse; min-width:900px; }
                                    thead tr.ruler th{
                                        background:var(--white); color:var(--muted); text-align:center;
                                    font-family:'Spline Sans Mono', monospace; font-size:9px; font-weight:600;
                                    letter-spacing:.08em; padding:9px 12px 6px; border-bottom:1px solid var(--line);
  }
                                    thead tr.head th{
                                        background:var(--ink); color:var(--bone); text-align:left;
                                    font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
                                    padding:13px 12px; white-space:nowrap; border-bottom:2px solid var(--gold);
  }
                                    tbody td{
                                        padding:13px 12px; vertical-align:middle;
                                    border-bottom:1px solid var(--line); font-size:13.5px; color:#33312D;
  }
                                    tbody tr{transition:background .15s; animation:rowIn .5s cubic-bezier(.22,1,.36,1) both; animation-delay:calc(var(--i,0) * 26ms); }
                                    tbody tr:hover{background:var(--bone); }
                                    @keyframes rowIn{from{opacity:0; transform:translateY(5px); } }

                                    .c-id{font - family:'Spline Sans Mono', monospace; font-size:11.5px; color:var(--brass); white-space:nowrap; letter-spacing:.02em; }
                                    .c-name{font - family:'Fraunces', serif; font-size:15px; font-weight:550; color:var(--ink); }
                                    .c-date{font - variant - numeric:tabular-nums; font-size:12.5px; color:var(--gray); white-space:nowrap; }
                                    .c-kin b{display:block; font-weight:500; font-size:13px; color:var(--ink); }
                                    .c-kin span{display:block; margin-top:2px; font-size:9.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
                                    .c-svc{font - size:10px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:var(--gray); white-space:nowrap; }

                                    .st{display:inline-flex; align-items:center; gap:8px; font-size:12.5px; font-weight:600; letter-spacing:.03em; white-space:nowrap; }
                                    .st i{width:7px; height:7px; border-radius:50%; flex:none; }
                                    .st-admitted{color:var(--brass); }        .st-admitted i{background:var(--brassLight); }
                                    .st-released{color:var(--verdigrisD); }   .st-released i{background:var(--verdigris); }
                                    .st-pending {color:var(--red); }          .st-pending  i{background:transparent; border:1.5px solid var(--red); }

                                    /* kin signatures — plain ink pen */
                                    .sig{
                                        font - family:'Mrs Saint Delafield', cursive; font-size:24px; line-height:1;
                                    color:var(--ink); display:inline-block; padding:0 12px 3px 4px;
                                    border-bottom:1px dotted #D6D0C2; white-space:nowrap;
  }
                                    .sig-none{
                                        font - size:11.5px; font-style:italic; color:var(--muted);
                                    display:inline-block; padding:0 6px 4px; border-bottom:1px dotted #DDD8CB; white-space:nowrap;
  }

                                    .extract-end{
                                        margin:20px 0 0; text-align:center;
                                    font-size:10px; font-weight:600; letter-spacing:.2em; text-transform:uppercase; color:var(--muted);
  }

                                    /* ============ FOOTER — INK STAMP · QR · BASE LINE ============ */
                                    .docfoot{margin - top:26px; padding-top:30px; border-top:2.5px solid var(--ink); position:relative; }
                                    .docfoot::before{content:''; position:absolute; top:4px; left:0; right:0; border-top:1px solid var(--ink); }
                                    .docfoot-grid{
                                        display:flex; justify-content:center; align-items:center;
                                    gap:clamp(36px, 6vw, 70px); flex-wrap:wrap;
  }
                                    .foot-stamp{color:var(--inkBlue); transform:rotate(-6deg); mix-blend-mode:multiply; opacity:.92; }
                                    .stamp text{font - family:'Instrument Sans', sans-serif; fill:currentColor; }
                                    .stamp .cap{font - family:'Fraunces', serif; }

                                    .foot-qr{text - align:center; }
                                    .qr-frame{display:inline-block; border:1px solid var(--line); padding:7px; background:var(--white); }
                                    .qr-frame canvas{width:92px; height:92px; display:block; }
                                    .qr-cap{margin - top:9px; font-size:9.5px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--ink); }
                                    .qr-url{margin - top:3px; font-size:10.5px; color:var(--gray); letter-spacing:.03em; }
                                    .qr-exp{margin - top:2px; font-size:10px; color:var(--muted); }

                                    .foot-base{
                                        margin - top:28px; padding-top:14px; border-top:1px solid var(--line);
                                    display:flex; justify-content:space-between; align-items:center; gap:16px;
                                    font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--muted);
  }
                                    .foot-base .ref{font - family:'Spline Sans Mono', monospace; font-size:9.5px; letter-spacing:.06em; color:var(--inkBlue); }

                                    /* ============ EXCEL SHEET TAB ============ */
                                    .tabs{max - width:1080px; margin:12px auto 0; display:flex; align-items:flex-end; gap:6px; padding:0 4px; }
                                    .tab{
                                        background:var(--white); border:1px solid var(--line); border-bottom:2.5px solid var(--verdigrisD);
                                    border-radius:6px 6px 0 0; padding:7px 16px 6px; font-size:11px; font-weight:600; color:var(--ink);
  }
                                    .tab.ghost{border - bottom - color:transparent; color:var(--muted); font-weight:400; padding:7px 11px 6px; }
                                    .tab-note{margin - left:auto; font-size:9.5px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); padding-bottom:8px; }

                                    /* ============ RESPONSIVE ============ */
                                    @media (max-width:900px){
    .track{align - self:flex-start; padding-top:2px; }
  }
                                    @media (max-width:680px){
    .masthead{flex - direction:column; gap:16px; }
                                    .track{
                                        text - align:left; align-self:auto; width:100%;
                                    display:flex; align-items:baseline; gap:10px 14px; flex-wrap:wrap;
                                    border-top:1px dashed var(--line); padding-top:12px;
    }
                                    .track .lbl{margin:0; }
                                    .track .exp{margin:0; }
                                    .ledger-period{margin - left:0; width:100%; padding-top:8px; }
                                    .docfoot-grid{gap:30px; }
                                    .foot-stamp svg{width:108px; height:108px; }
                                    .foot-base{flex - direction:column; gap:8px; text-align:center; }
                                    .tab-note{display:none; }
                                    thead tr.head th, tbody td{padding - left:9px; padding-right:9px; }
  }

                                    /* ============ PRINT ============ */
                                    @media print{
                                        @page{size:A4; margin:12mm; }
                                    *{animation:none !important; transition:none !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
                                    body{background:var(--white); } body::after{display:none; }
                                    .stage{padding:0; }
                                    .sheet{max - width:none; border:0; box-shadow:none; padding:0; }
                                    .tabs{display:none; }
  }
                                </style>
                            </head>
                            <body>

                                <main class="stage">
                                    <article class="sheet">

                                        <!-- ============ MINIMAL LETTERHEAD ============ -->
                                        <header class="masthead">
                                            <div class="mast-brand">
                                                <div class="logo" id="logoSlot">
                                                    <img src="https://lf.services/wp-content/uploads/2024/09/LFS-Logo2-e1725725010766.png" alt="LF Services"
                                                        onerror="logoFallback(this)">
                                                </div>
                                                <div>
                                                    <p class="classification">Official registry extract · Strictly confidential</p>
                                                    <h1>Deceased <em>Records</em></h1>
                                                    <p class="facility">Peacehaven Memorial Mortuary · Mortuary Management Suite</p>
                                                    <p class="genline" id="genLine">—</p>
                                                </div>
                                            </div>

                                            <div class="track">
                                                <p class="lbl">Tracking ID</p>
                                                <p class="id" id="trackId">LFS-EXP-——————</p>
                                                <p class="exp">Verification expires <b id="trackExp">—</b></p>
                                            </div>
                                        </header>

                                        <div class="rule-double"></div>

                                        <!-- ============ SLIM SUMMARY ============ -->
                                        <section class="ledger" aria-label="Summary">
                                            <div class="stat"><b id="nTotal">0</b><span>Total records</span></div>
                                            <div class="stat"><b id="nAdm">0</b><span>Admitted</span></div>
                                            <div class="stat"><b id="nRel">0</b><span>Released</span></div>
                                            <div class="stat"><b id="nPend">0</b><span>Pending</span></div>
                                            <p class="ledger-period">Reporting period <b>01 Jan — 31 Mar 2025</b></p>
                                        </section>

                                        <!-- ============ RECORDS TABLE ============ -->
                                        <div class="table-wrap">
                                            <table>
                                                <thead>
                                                    <tr class="ruler" aria-hidden="true">
                                                        <th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th><th>I</th>
                                                    </tr>
                                                    <tr class="head">
                                                        <th>File ID</th><th>Full Name</th><th>Date of Birth</th><th>Date of Death</th>
                                                        <th>Next of Kin</th><th>Service</th><th>Status</th><th>Release Date</th><th>Kin Signature</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="tbody"></tbody>
                                            </table>
                                        </div>

                                        <p class="extract-end" id="extractEnd">—</p>

                                        <!-- ============ FOOTER : INK STAMP · QR ============ -->
                                        <footer class="docfoot">
                                            <div class="docfoot-grid">
                                                <div class="foot-stamp" aria-hidden="true">
                                                    <svg class="stamp" width="128" height="128" viewBox="0 0 140 140">
                                                        <defs>
                                                            <path id="arcTop" d="M 18 70 A 52 52 0 0 1 122 70" fill="none" />
                                                            <path id="arcBot" d="M 18 70 A 52 52 0 0 0 122 70" fill="none" />
                                                            <filter id="inkbleed">
                                                                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" result="n" />
                                                                <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
                                                            </filter>
                                                        </defs>
                                                        <g filter="url(#inkbleed)">
                                                            <circle cx="70" cy="70" r="66" fill="none" stroke="currentColor" stroke-width="2.2" />
                                                            <circle cx="70" cy="70" r="60" fill="none" stroke="currentColor" stroke-width="1" />
                                                            <circle cx="70" cy="70" r="42" fill="none" stroke="currentColor" stroke-width="1" />
                                                            <path d="M18 66 l4 4 -4 4 -4 -4 Z" fill="currentColor" />
                                                            <path d="M122 66 l4 4 -4 4 -4 -4 Z" fill="currentColor" />
                                                            <text font-size="9" font-weight="700" letter-spacing="1.6">
                                                                <textPath href="#arcTop" startOffset="50%" text-anchor="middle">OFFICIAL REGISTRY EXTRACT</textPath>
                                                            </text>
                                                            <text font-size="8.5" font-weight="600" letter-spacing="1.6">
                                                                <textPath href="#arcBot" startOffset="50%" text-anchor="middle">LF SERVICES · PEACEHAVEN</textPath>
                                                            </text>
                                                            <text class="cap" x="70" y="63" text-anchor="middle" font-size="12.5" font-weight="600" letter-spacing="1.5">CERTIFIED</text>
                                                            <text x="70" y="76" text-anchor="middle" font-size="8" letter-spacing="1.2" id="stampDate">—</text>
                                                            <text x="70" y="88" text-anchor="middle" font-size="7.5" letter-spacing="1" id="stampNo">—</text>
                                                            <text x="70" y="100" text-anchor="middle" font-size="6.5" font-weight="700" letter-spacing="1" id="stampValid">—</text>
                                                        </g>
                                                    </svg>
                                                </div>

                                                <div class="foot-qr">
                                                    <div class="qr-frame"><canvas id="qr" width="92" height="92"></canvas></div>
                                                    <p class="qr-cap">Scan to verify</p>
                                                    <p class="qr-url mono" id="qrUrl">—</p>
                                                    <p class="qr-exp" id="qrExp">—</p>
                                                </div>
                                            </div>

                                            <div class="foot-base">
                                                <span>© 2025 LF Services</span>
                                                <span>Strictly confidential — handle with dignity</span>
                                                <span class="ref" id="footRef">—</span>
                                            </div>
                                        </footer>

                                    </article>

                                    <!-- Excel worksheet tab -->
                                    <div class="tabs" aria-hidden="true">
                                        <span class="tab">Deceased Records</span>
                                        <span class="tab ghost">+</span>
                                        <span class="tab-note">Worksheet 1 of 1</span>
                                    </div>
                                </main>

                                <script>
  /* ================= DUMMY DATA ================= */
                                    const RECORDS = [
                                    {id:'LFS-2025-0398', name:'Margaret A. Okonkwo',  dob:'12 Mar 1941', dod:'02 Jan 2025', kin:'Chinedu Okonkwo', relation:'Son',      service:'Burial',       status:'Released', release:'18 Jan 2025' },
                                    {id:'LFS-2025-0401', name:'Samuel K. Mwangi',     dob:'27 Jul 1958', dod:'04 Jan 2025', kin:'Grace Mwangi',    relation:'Wife',     service:'Cremation',    status:'Released', release:'21 Jan 2025' },
                                    {id:'LFS-2025-0404', name:'Elizabeth N. Achieng', dob:'09 Nov 1936', dod:'07 Jan 2025', kin:'Peter Achieng',   relation:'Son',      service:'Burial',       status:'Admitted', release:null },
                                    {id:'LFS-2025-0409', name:'Robert D. Mensah',     dob:'15 Feb 1949', dod:'11 Jan 2025', kin:'Lydia Mensah',    relation:'Daughter', service:'Repatriation', status:'Admitted', release:null },
                                    {id:'LFS-2025-0412', name:'Fatima B. Yusuf',      dob:'30 Apr 1972', dod:'14 Jan 2025', kin:'Ibrahim Yusuf',   relation:'Husband',  service:'Burial',       status:'Pending',  release:null },
                                    {id:'LFS-2025-0415', name:'John P. Kamau',        dob:'23 Sep 1945', dod:'19 Jan 2025', kin:'Mary Kamau',      relation:'Daughter', service:'Cremation',    status:'Released', release:'02 Feb 2025' },
                                    {id:'LFS-2025-0418', name:'Alice W. Njeri',       dob:'05 Jun 1953', dod:'22 Jan 2025', kin:'James Njeri',     relation:'Son',      service:'Burial',       status:'Admitted', release:null },
                                    {id:'LFS-2025-0421', name:'Peter O. Ochieng',     dob:'18 Dec 1961', dod:'26 Jan 2025', kin:'Rose Ochieng',    relation:'Wife',     service:'Memorial',     status:'Pending',  release:null },
                                    {id:'LFS-2025-0424', name:'Dorcas M. Wambui',     dob:'08 Aug 1939', dod:'01 Feb 2025', kin:'Ruth Wambui',     relation:'Daughter', service:'Burial',       status:'Released', release:'16 Feb 2025' },
                                    {id:'LFS-2025-0427', name:'Henry T. Asante',      dob:'21 Jan 1950', dod:'05 Feb 2025', kin:'Daniel Asante',   relation:'Son',      service:'Repatriation', status:'Admitted', release:null },
                                    {id:'LFS-2025-0430', name:'Beatrice A. Wanjiku',  dob:'14 Oct 1947', dod:'09 Feb 2025', kin:'Paul Wanjiku',    relation:'Son',      service:'Cremation',    status:'Released', release:'24 Feb 2025' },
                                    {id:'LFS-2025-0433', name:'Michael E. Oduya',     dob:'02 May 1966', dod:'14 Feb 2025', kin:'Sarah Oduya',     relation:'Wife',     service:'Burial',       status:'Admitted', release:null },
                                    {id:'LFS-2025-0436', name:'Grace N. Atieno',      dob:'29 Mar 1955', dod:'19 Feb 2025', kin:'David Atieno',    relation:'Brother',  service:'Burial',       status:'Pending',  release:null },
                                    {id:'LFS-2025-0439', name:'Joseph B. Barasa',     dob:'11 Jul 1944', dod:'24 Feb 2025', kin:'Esther Barasa',   relation:'Daughter', service:'Memorial',     status:'Released', release:'11 Mar 2025' },
                                    ];

  /* ================= TRACKING / EXPIRATION SYSTEM ================= */
  const $ = s => document.querySelector(s);
  const pad = n => String(n).padStart(2, '0');
  const fmtDate  = d => `${pad(d.getDate())} ${d.toLocaleDateString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
  const fmtStamp = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  const fmtTime  = d => d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});

                                    const now = new Date();
                                    const ref = [...crypto.getRandomValues(new Uint8Array(3))]
                .map(b => b.toString(16).padStart(2,'0')).join('').toUpperCase();
                                    const TRACK = `LFS-EXP-${ref}`;

                                    const exp = new Date(now);
                                    exp.setDate(exp.getDate() + 7);
                                    exp.setHours(23, 59, 59, 0);
                                    const expUnix = Math.floor(exp.getTime() / 1000);

                                    $('#trackId').textContent   = TRACK;
                                    $('#trackExp').textContent  = `${fmtDate(exp)} · 23:59`;
                                    $('#genLine').textContent   = `Generated ${fmtDate(now)} · ${fmtTime(now)} · sys.admin@lf.services`;
                                    $('#stampDate').textContent = fmtDate(now).toUpperCase();
                                    $('#stampNo').textContent   = `NO. ${ref}`;
                                    $('#stampValid').textContent= `VALID THRU ${fmtStamp(exp)}`;
                                    $('#qrUrl').textContent     = `lf.services/v/${ref}`;
                                    $('#qrExp').textContent     = `Expires ${fmtDate(exp)} · 23:59`;
                                    $('#footRef').textContent   = `REF ${TRACK} · EXP ${fmtStamp(exp)}`;

  /* ================= RENDER TABLE ================= */
  const initials = kin => {
    const p = kin.trim().split(/\s+/);
    return p.length > 1 ? `${p[0][0]}. ${p[p.length - 1]}` : kin;
  };
  const statusCell = st => {
    const cls = {Admitted:'st-admitted', Released:'st-released', Pending:'st-pending' }[st];
                                    return `<span class="st ${cls}"><i></i>${st}</span>`;
  };

  $('#tbody').innerHTML = RECORDS.map((r, i) => {
    const signed = r.status === 'Released';
                                    return `<tr style="--i:${i}">
                                        <td class="c-id">${r.id}</td>
                                        <td class="c-name">${r.name}</td>
                                        <td class="c-date">${r.dob}</td>
                                        <td class="c-date">${r.dod}</td>
                                        <td class="c-kin"><b>${r.kin}</b><span>${r.relation}</span></td>
                                        <td class="c-svc">${r.service}</td>
                                        <td>${statusCell(r.status)}</td>
                                        <td class="c-date">${r.release ?? '—'}</td>
                                        <td>${signed ? `<span class="sig">${initials(r.kin)}</span>`
                                            : `<span class="sig-none">awaiting signature</span>`}</td>
                                    </tr>`;
  }).join('');

                                    /* summary counts */
                                    const c = {Admitted:0, Released:0, Pending:0 };
  RECORDS.forEach(r => c[r.status]++);
                                    $('#nTotal').textContent = RECORDS.length;
                                    $('#nAdm').textContent   = c.Admitted;
                                    $('#nRel').textContent   = c.Released;
                                    $('#nPend').textContent  = c.Pending;

                                    $('#extractEnd').textContent =
                                    `— End of extract · ${RECORDS.length} records · ref ${TRACK} · expires ${fmtStamp(exp)} —`;

                                    /* ================= LOGO FALLBACK ================= */
                                    function logoFallback(img){
    const d = document.createElement('div');
                                    d.className = 'logo-fallback';
                                    d.textContent = 'LFS';
                                    img.replaceWith(d);
  }

                                    /* ================= QR (verification · carries expiry) ================= */
                                    if (window.QRious){
                                        new QRious({
                                            element: $('#qr'),
                                            value: `https://lf.services/verify/${TRACK}?exp=${expUnix}`,
                                            size: 230, level: 'M', padding: 0,
                                            background: '#FFFFFF', foreground: '#1A1A1A'
                                        });
  }
                                </script>
                            </body>
                        </html>