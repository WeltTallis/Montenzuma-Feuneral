

import { ensurePostmortemRequestsTable, ensurePostmortemTable, ensureDeceasedPostmortemFlags } from './postmortemRequestControl';
import { safeTenantExecute, safeTenantQuery, resolveDatabase, getRootPool } from '../../../../shared/dbConfig';
import { getKenyaTimeISO, getKenyaDate } from '../../../../packages/shared-utils/dist/timestamps';
import type { Browser } from 'puppeteer' with { 'resolution-mode': 'import' };

import Logger from '../../../../packages/shared-logger/src/index';
import { tableColumns, pickAs } from '../../utils/tenantSchema';
import generateBarcodeBars from '../../utils/generateBarCode'
import { Request, Response } from 'express';

import { DateTime } from 'luxon';
import sharp from 'sharp';
import https from 'https';
import http from 'http';
import path from 'path';
import fs from 'fs';


interface TenantRequest extends Request {
    tenantSlug?: string;
}

const nowNairobi = getKenyaTimeISO();

const formatFacilityName = (tenantSlug: string): string => {
    if (!tenantSlug || tenantSlug === 'system_shared') return 'RestPoint Mortuary';
    return tenantSlug
        .replace(/[-_]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
        .join(' ');
};

// ─── PDF HELPERS ──────────────────────────────────────────────
function fmtLong(iso: string | null | undefined): string {
    if (!iso) return 'N/A';
    try {
        return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return 'N/A';
    }
}

function fmtShort(iso: string | null | undefined): string {
    if (!iso) return 'N/A';
    try {
        return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return 'N/A';
    }
}

function esc(s: string | null | undefined): string {
    if (s == null) return 'N/A';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}





/**
 * Resolve the real tenant branding from `tenant_tracking.tenants`.
 * The PDF used to derive its header from the URL slug
 */
async function resolveTenantBranding(tenantSlug: string): Promise<{
    name: string; logoUrl: string; phone: string; email: string; address: string;
}> {
    const empty = { name: '', logoUrl: '', phone: '', email: '', address: '' };
    if (!tenantSlug || tenantSlug === 'system_shared') return empty;

    try {
        const pool = await getRootPool();

        // Try the slug as-is, then progressively strip trailing `-<segment>`s.
        let candidate = tenantSlug;
        for (let attempt = 0; attempt < 8 && candidate.includes('-'); attempt++) {
            const [rows] = await pool.query(
                `SELECT tenant_name, logo_url, phone, email, location, country
                 FROM tenant_tracking.tenants
                 WHERE tenant_slug = ? AND status = 'active'
                 LIMIT 1`,
                [candidate],
            );
            const row: any = (rows as any[])[0];
            if (row) {
                const location = (row.location || '').trim();
                const country = (row.country || '').trim();
                return {
                    name: (row.tenant_name || '').trim(),
                    logoUrl: (row.logo_url || '').trim(),
                    phone: (row.phone || '').trim(),
                    email: (row.email || '').trim(),
                    // Avoid "Nairobi, Kenya" style duplication when the stored
                    // location already ends with the country.
                    address: location.toLowerCase().endsWith(country.toLowerCase()) && country
                        ? location
                        : [location, country].filter(Boolean).join(', '),
                };
            }
            const lastDash = candidate.lastIndexOf('-');
            candidate = candidate.substring(0, lastDash);
            if (!candidate) break;
        }
    } catch (err: any) {
        console.warn('[PDF] Tenant branding lookup failed:', err?.message || err);
    }
    return empty;
}

/**
 * Load the tenant logo as a base64 data URL.
 *
 * Logos are stored as a RELATIVE path (`/uploads/tenants/<slug>/logos/x.png`)
 * by the tenant-service upload handler, so `new URL()` cannot parse them and a
 * plain HTTP fetch always failed — which is why the PDF showed no logo.
 *
 * Strategy, in order:
 *   1. relative `/uploads/...` path → read from the shared uploads volume
 *      (same approach already used for the signature image), which works
 *      without any network hop or DNS;
 *   2. absolute http(s) URL → fetch it.
 *
 * Never throws; returns null when no logo can be loaded, in which case the
 * template simply omits the image.
 */
async function loadLogoBase64(logoUrl: string): Promise<string | null> {
    if (!logoUrl) return null;

    const raw = String(logoUrl).trim();

    // ── 1. Relative uploads path → local filesystem ──
    if (raw.startsWith('/uploads/') || raw.startsWith('uploads/')) {
        try {
            const uploadsBase = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
            const relativePath = raw.replace(/^\/?uploads\//, '');
            const fsPath = path.join(uploadsBase, relativePath);

            // Guard against traversal in a stored DB value.
            if (!fsPath.startsWith(path.resolve(uploadsBase)) && !fsPath.startsWith(uploadsBase)) {
                return null;
            }
            if (!fs.existsSync(fsPath)) return null;

            const buffer = fs.readFileSync(fsPath);
            if (!buffer.length) return null;

            // Derive the MIME from the extension — a JPEG named .jpg mislabelled
            // as PNG renders as a broken image in Chromium.
            const ext = path.extname(fsPath).toLowerCase();
            const mimeByExt: Record<string, string> = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
            };
            const mime = mimeByExt[ext] || 'image/png';
            return `data:${mime};base64,` + buffer.toString('base64');
        } catch (err: any) {
            console.warn('[PDF] Could not read tenant logo from disk:', err?.message || err);
            return null;
        }
    }

    // ── 2. Absolute URL → HTTP fetch ──
    return fetchLogoBase64(raw);
}

/**
 * Fetch a tenant logo and inline it as a base64 data URL.
 *
 * The old version only spoke https and always claimed image/png, so an
 * http:// logo (rejected by Node's https client) or an SVG/JPEG logo produced
 * a broken image in the PDF. Redirects were also unhandled, and uploads
 * commonly live behind a redirecting public gateway.
 */
function fetchLogoBase64(url: string, depth = 0): Promise<string | null> {
    return new Promise((resolve) => {
        if (!url || depth > 3) { resolve(null); return; }

        let parsed: URL;
        try {
            parsed = new URL(url);
        } catch {
            resolve(null);
            return;
        }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            resolve(null);
            return;
        }

        const client = parsed.protocol === 'https:' ? https : http;
        const req = client.get(url, { timeout: 8000 }, (res) => {
            const status = res.statusCode || 0;
            // Follow redirects so gateway-hosted uploads resolve.
            if (status >= 300 && status < 400 && res.headers.location) {
                res.resume();
                resolve(fetchLogoBase64(new URL(res.headers.location, url).toString(), depth + 1));
                return;
            }
            if (status !== 200) { res.resume(); resolve(null); return; }

            // Preserve the real content type — a JPEG/SVG logo mislabelled as
            // PNG renders as a broken image in Chromium.
            const contentType = String(res.headers['content-type'] || '').split(';')[0].trim();
            const mime = /^image\/(png|jpe?g|gif|webp|svg\+xml|bmp|x-icon|vnd\.microsoft\.icon)$/i.test(contentType)
                ? contentType
                : 'image/png';

            const chunks: Buffer[] = [];
            res.on('data', (chunk: Buffer) => chunks.push(chunk));
            res.on('end', () => {
                if (!chunks.length) { resolve(null); return; }
                resolve(`data:${mime};base64,` + Buffer.concat(chunks).toString('base64'));
            });
            res.on('error', () => resolve(null));
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
    });
}

// HTML TEMPLATE — height:297mm + overflow:hidden = GUARANTEED 1 page
// flex pushes bottom section to bottom, filling the page
// async: renders the barcode (await generateBarcodeBars) into the HTML.
async function buildReportHtml(p: {
    tenantName: string;
    tenantAddress: string;
    tenantPhone: string;
    tenantEmail: string;
    deceasedFullName: string;
    deceasedAdmission: string;
    deceasedDateOfDeath: string;
    deceasedAge: string | number;
    deceasedGender: string;
    examDate: string;
    pathologistName: string;
    pathologistCredentials: string;
    pathologistLicense: string;
    mannerOfDeath: string;
    immediateCause: string;
    underlyingCause: string;
    examinationSummary: string;
    kinName: string;
    kinRelationship: string;
    kinPhone: string;
    verifiedDate: string;
    issuedDate: string;
    logoBase64: string | null;
    signatureBase64: string | null;
}): Promise<string> {

    const logoHtml = p.logoBase64
        ? '<img src="' + p.logoBase64 + '" alt="Logo" style="height:50px;width:auto;max-width:115px;object-fit:contain;" />'
        : '';

    let pathSig: string;
    if (p.signatureBase64) {
        pathSig = '<img src="' + p.signatureBase64 + '" alt="Signature" style="max-width:100%;max-height:32px;object-fit:contain;" />';
    } else {
        const shortName = (p.pathologistName || 'Pathologist')
            .replace(/^Dr\.\s*/i, '').split(' ').slice(0, 2).join(' ');
        pathSig = esc(shortName);
    }

    // ACTUALLY RENDER THE BARCODE. This line used to be
    //   const barcodeBars = generateBarcodeBars;
    let barcodeBars = '';
    try {
        barcodeBars = await generateBarcodeBars(p.deceasedAdmission || '', {
            width: 2,
            height: 60,
            displayValue: true,
        });
    } catch (e) {
        Logger.warn({ message: `Barcode render failed, omitting it: ${(e as Error).message}` });
        barcodeBars = '';
    }

    return '<!DOCTYPE html>\n'
        + '<html lang="en">\n<head>\n<meta charset="UTF-8">\n<style>\n'
        + '@page { size: A4; margin: 0; }\n'
        + '* { box-sizing: border-box; margin: 0; padding: 0; }\n'
        + 'html, body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #3a3530; background: #fbfaf7; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; font-size: 15px; }\n'
        + '.sheet { width: 210mm; height: 297mm; overflow: hidden; display: flex; flex-direction: column; background: #fbfaf7; position: relative; }\n'
        + '.sheet-inner { padding: 28px 40px 0; position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; }\n'
        + '.top-rule { width: 100%; height: 1px; background: #1a1a1a; position: relative; opacity: 0.8; }\n'
        + '.top-rule::after { content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100px; height: 1px; background: #a8906a; opacity: 0.7; }\n'
        + '.top-ornament { text-align: center; margin: 6px 0 7px; color: #a8906a; font-size: 0.68rem; opacity: 0.35; letter-spacing: 0.8em; }\n'
        + '.letterhead { display: flex; flex-direction: column; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid #e8e0d4; position: relative; z-index: 1; }\n'
        + '.home-name { width: 100%; }\n'
        + '.home-name h2 { font-family: "Segoe UI", sans-serif; margin: 0; font-size: 1.38rem; font-weight: 700; color: #1a1a1a; letter-spacing: 0.04em; line-height: 1.15; text-transform: uppercase; }\n'
        + '.letterhead-row { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; }\n'
        + '.logo-left { display: flex; align-items: center; gap: 14px; }\n'
        + '.logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }\n'
        + '.logo-text .address { font-size: 0.66rem; color: #8a7d6e; font-style: normal; font-family: Consolas, "Courier New", monospace; line-height: 1.45; letter-spacing: 0.02em; font-weight: 600; }\n'
        + '.letterhead-right { text-align: right; font-family: Consolas, "Courier New", monospace; font-size: 0.68rem; }\n'
        + '.ref-label { font-family: "Segoe UI", sans-serif; font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.22em; color: #1a1a1a; margin-bottom: 4px; font-weight: 700; }\n'
        + '.ref-number { font-family: Georgia, serif; font-size: 1.05rem; font-weight: 700; color: #1a1a1a; font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }\n'
        + '.ref-date { margin-top: 5px; color: #8a7d6e; font-size: 0.64rem; font-weight: 600; }\n'
        + '.intro-block { margin: 18px 0 20px; position: relative; z-index: 1; padding-left: 15px; border-left: 3px solid #7c2b23; }\n'
        + '.intro-block .dear { font-family: Georgia, serif; font-size: 1rem; font-weight: 700; color: #3a3530; margin-bottom: 7px; }\n'
        + '.intro-block .body-text { font-family: Georgia, serif; font-size: 0.92rem; line-height: 1.6; color: #3a3530; font-weight: 700; max-width: 95%; }\n'
        + '.intro-block .body-text .name { font-style: italic; font-weight: 700; color: #7c2b23; }\n'
        + '.data-heading { display: flex; align-items: center; gap: 9px; font-family: "Segoe UI", sans-serif; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 700; color: #3a3530; margin-bottom: 11px; }\n'
        + '.data-heading::after { content: ""; flex: 1; height: 1px; background: linear-gradient(to right, #a8906a, transparent); opacity: 0.5; }\n'
        + '.data-heading .icon-chip { width: 20px; height: 20px; background: rgba(168,144,106,0.08); display: flex; align-items: center; justify-content: center; color: #a8906a; font-size: 8px; flex-shrink: 0; border: 1px solid rgba(168,144,106,0.18); border-radius: 50%; }\n'
        + '.dual-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px; margin-bottom: 18px; position: relative; z-index: 1; page-break-inside: avoid; }\n'
        + '.data-section { position: relative; z-index: 1; page-break-inside: avoid; }\n'
        + '.dual-sections .info-grid { display: grid; grid-template-columns: 1fr; gap: 7px; }\n'
        + '.info-grid.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 9px 32px; }\n'
        + '.info-row { display: flex; flex-direction: column; gap: 2px; padding-bottom: 7px; border-bottom: 1px dotted #ddd4c6; }\n'
        + '.info-row.full { grid-column: 1 / -1; }\n'
        + '.info-row label { font-family: "Segoe UI", sans-serif; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.12em; color: #6b6157; font-weight: 700; }\n'
        + '.info-row span { font-family: Georgia, serif; font-size: 0.96rem; color: #3a3530; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: 0.01em; line-height: 1.28; }\n'
        + '.summary-box { margin: 14px 0; padding: 14px 18px; background: #f6f2ea; border-left: 4px solid #7c2b23; position: relative; page-break-inside: avoid; border-radius: 0 4px 4px 0; }\n'
        + '.summary-box::after { content: ""; position: absolute; top: 0; right: 0; width: 24px; height: 24px; border-top: 1px solid #a8906a; border-right: 1px solid #a8906a; opacity: 0.25; border-radius: 0 4px 0 0; }\n'
        + '.summary-box::before { content: "\\2767"; font-family: Georgia, serif; font-size: 1.2rem; color: #a8906a; position: absolute; top: 8px; right: 14px; opacity: 0.4; }\n'
        + '.summary-box strong { display: block; margin-bottom: 6px; font-family: Georgia, serif; font-size: 0.96rem; color: #3a3530; font-weight: 700; }\n'
        + '.summary-box p { margin: 0; font-family: Georgia, serif; font-size: 0.84rem; line-height: 1.6; color: #3a3530; font-weight: 600; }\n'
        + '.bottom-section { background: #ffffff; padding: 22px 40px 20px; position: relative; z-index: 1; page-break-inside: avoid; margin-top: auto; }\n'
        + '.signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 34px; position: relative; z-index: 1; page-break-inside: avoid; align-items: start; }\n'
        + '.signatures::before { content: ""; position: absolute; top: -12px; left: 0; right: 0; height: 1px; background: linear-gradient(to right, transparent, #a8906a, transparent); opacity: 0.4; }\n'
        + '.sig-block { display: flex; flex-direction: column; min-width: 0; }\n'
        + '.sig-script { font-family: "Brush Script MT", "Lucida Handwriting", cursive; font-size: 1.95rem; color: #3a3530; line-height: 1; margin-bottom: 4px; min-height: 35px; font-weight: 400; word-break: break-word; }\n'
        + '.sig-line { border-top: 1px solid #1a1a1a; padding-top: 4px; margin-bottom: 5px; opacity: 0.5; }\n'
        + '.sig-name { font-family: Georgia, serif; font-weight: 700; font-size: 0.88rem; color: #3a3530; letter-spacing: 0.02em; }\n'
        + '.sig-title { font-family: Georgia, serif; font-size: 0.74rem; color: #6b6157; margin-top: 2px; font-style: italic; font-weight: 600; }\n'
        + '.sig-meta { margin-top: 4px; font-family: Consolas, "Courier New", monospace; font-size: 0.6rem; color: #8a7d6e; line-height: 1.5; letter-spacing: 0.02em; font-weight: 600; }\n'
        + '.barcode-wrap { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; min-width: 0; }\n'
        + '.barcode { display: flex; align-items: flex-start; gap: 0; height: 42px; padding: 2px 4px; background: #fff; max-width: 100%; overflow: hidden; }\n'
        + '.barcode-text { font-family: Consolas, "Courier New", monospace; font-size: 0.68rem; font-weight: 700; color: #1a1a1a; letter-spacing: 0.15em; text-align: left; padding-left: 4px; }\n'
        + '.family-contact { margin-top: 10px; padding-top: 7px; border-top: 1px dotted #ddd4c6; width: 100%; max-width: 100%; overflow: hidden; }\n'
        + '.family-contact .fc-heading { font-family: "Segoe UI", sans-serif; font-size: 0.52rem; text-transform: uppercase; letter-spacing: 0.18em; color: #6b6157; font-weight: 700; margin-bottom: 5px; }\n'
        + '.family-contact .fc-grid { display: grid; grid-template-columns: 1fr; gap: 1px; }\n'
        + '.family-contact .fc-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 2px 0; min-width: 0; }\n'
        + '.family-contact .fc-row .fc-label { font-family: "Segoe UI", sans-serif; font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.1em; color: #6b6157; font-weight: 700; flex-shrink: 0; white-space: nowrap; }\n'
        + '.family-contact .fc-row .fc-value { font-family: Georgia, serif; font-size: 0.76rem; color: #3a3530; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n'
        + '.bottom-ornament { text-align: center; margin-top: 18px; padding-top: 13px; border-top: 1px solid #e8e0d4; position: relative; z-index: 1; }\n'
        + '.bottom-ornament .closing { font-family: Georgia, serif; font-size: 0.84rem; font-style: italic; color: #8a7d6e; font-weight: 700; letter-spacing: 0.02em; }\n'
        + '.bottom-ornament .closing .leaf { color: #a8906a; opacity: 0.5; margin: 0 8px; }\n'
        + '</style>\n</head>\n<body>\n'
        + '<div class="sheet">\n'
        + '  <div class="sheet-inner">\n'
        + '    <div class="top-rule"></div>\n'
        + '    <div class="top-ornament">&#10087;</div>\n'
        + '    <header class="letterhead">\n'
        + '      <div class="home-name"><h2>' + esc(p.tenantName) + '</h2></div>\n'
        + '      <div class="letterhead-row">\n'
        + '        <div class="logo-left">\n'
        + '          <div class="logo">' + logoHtml + '</div>\n'
        + '          <div class="logo-text"><address class="address">' + esc(p.tenantAddress) + (p.tenantPhone ? '<br>Tel: ' + esc(p.tenantPhone) : '') + (p.tenantEmail ? ' &middot; ' + esc(p.tenantEmail) : '') + '</address></div>\n'
        + '        </div>\n'
        + '        <div class="letterhead-right">\n'
        + '          <div class="ref-label">Case Reference</div>\n'
        + '          <div class="ref-number">' + esc(p.deceasedAdmission) + '</div>\n'
        + '          <div class="ref-date">Issued: ' + p.issuedDate + '</div>\n'
        + '        </div>\n'
        + '      </div>\n'
        + '    </header>\n'
        + '    <div class="intro-block">\n'
        + '      <div class="dear">Dear Family,</div>\n'
        + '      <div class="body-text">Please find enclosed the postmortem examination report for <span class="name">' + esc(p.deceasedFullName) + '</span>. This document has been prepared with care by the attending pathologist and verified by our records team.</div>\n'
        + '    </div>\n'
        + '    <div class="dual-sections">\n'
        + '      <section class="data-section">\n'
        + '        <div class="data-heading"><span class="icon-chip">&#10087;</span>About Your Loved One</div>\n'
        + '        <div class="info-grid">\n'
        + '          <div class="info-row"><label>Full Name</label><span>' + esc(p.deceasedFullName) + '</span></div>\n'
        + '          <div class="info-row"><label>Date of Passing</label><span>' + p.deceasedDateOfDeath + '</span></div>\n'
        + '        </div>\n'
        + '      </section>\n'
        + '      <section class="data-section">\n'
        + '        <div class="data-heading"><span class="icon-chip">&#10087;</span>Requesting Authority</div>\n'
        + '        <div class="info-grid">\n'
        + '          <div class="info-row"><label>Name</label><span>' + esc(p.kinName) + '</span></div>\n'
        + '          <div class="info-row"><label>Role</label><span>' + esc(p.kinRelationship) + '</span></div>\n'
        + '        </div>\n'
        + '      </section>\n'
        + '    </div>\n'
        + '    <section class="data-section">\n'
        + '      <div class="data-heading"><span class="icon-chip">&#10087;</span>Examination Report</div>\n'
        + '      <div class="info-grid two-col">\n'
        + '        <div class="info-row"><label>Date of Examination</label><span>' + p.examDate + '</span></div>\n'
        + '        <div class="info-row"><label>Attending Pathologist</label><span>' + esc(p.pathologistName) + '</span></div>\n'
        + '        <div class="info-row"><label>Manner of Passing</label><span>' + esc(p.mannerOfDeath) + '</span></div>\n'
        + '        <div class="info-row"><label>Immediate Cause</label><span>' + esc(p.immediateCause) + '</span></div>\n'
        + '        <div class="info-row full"><label>Underlying Cause</label><span>' + esc(p.underlyingCause) + '</span></div>\n'
        + '      </div>\n'
        + (p.examinationSummary ? '      <div class="summary-box"><strong>Examination Summary</strong><p>' + esc(p.examinationSummary) + '</p></div>\n' : '')
        + '    </section>\n'
        + '  </div>\n'
        + '  <div class="bottom-section">\n'
        + '    <section class="signatures">\n'
        + '      <div class="sig-block">\n'
        + '        <div class="sig-script">' + pathSig + '</div>\n'
        + '        <div class="sig-line"></div>\n'
        + '        <div class="sig-name">' + esc(p.pathologistName || 'Attending Pathologist') + '</div>\n'
        + '        <div class="sig-title">' + esc(p.pathologistCredentials || 'Pathologist') + '</div>\n'
        + '      </div>\n'
        + '      <div class="barcode-wrap">\n'
        + '        <div class="barcode">' + barcodeBars + '</div>\n'
        + '        <div class="barcode-text">' + esc(p.deceasedAdmission) + '</div>\n'
        + '        <div class="family-contact">\n'
        + '          <div class="fc-heading">Next of Kin</div>\n'
        + '          <div class="fc-grid">\n'
        + '            <div class="fc-row"><span class="fc-label">Name</span><span class="fc-value">' + esc(p.kinName) + '</span></div>\n'
        + '            <div class="fc-row"><span class="fc-label">Telephone</span><span class="fc-value">' + esc(p.kinPhone) + '</span></div>\n'
        + '            <div class="fc-row"><span class="fc-label">Verified</span><span class="fc-value">' + p.verifiedDate + '</span></div>\n'
        + '          </div>\n'
        + '        </div>\n'
        + '      </div>\n'
        + '    </section>\n'
        + '    <div class="bottom-ornament"><div class="closing"><span class="leaf">&#10087;</span>With our deepest sympathies<span class="leaf">&#10087;</span></div></div>\n'
        + '  </div>\n'
        + '</div>\n'
        + '</body>\n</html>';
}

// ─── INK-BLUE SIGNATURE NORMALIZATION (unchanged) ─────────────
async function toInkBlueBuffer(buffer: Buffer): Promise<Buffer> {
    const { data, info } = await sharp(buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const INK_BLUE = { r: 15, g: 51, b: 231 };
    const normalized = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] / 255;
        const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        const ink = alpha * Math.min(1, Math.pow(1 - luminance, 0.45) * 1.13);
        normalized[i] = INK_BLUE.r;
        normalized[i + 1] = INK_BLUE.g;
        normalized[i + 2] = INK_BLUE.b;
        normalized[i + 3] = Math.round(Math.min(1, Math.max(0, ink)) * 255);
    }

    return sharp(normalized, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png({ compressionLevel: 9, palette: false })
        .toBuffer();
}

async function normalizeSignatureToInkBlue(signatureDataUrl: string): Promise<string> {
    if (!signatureDataUrl || !signatureDataUrl.startsWith('data:image')) {
        return signatureDataUrl;
    }
    try {
        const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const inkBuffer = await toInkBlueBuffer(buffer);
        return `data:image/png;base64,${inkBuffer.toString('base64')}`;
    } catch (error: any) {
        Logger.warn(`[POSTMORTEM] Failed to normalize signature to ink blue: ${error.message}`);
        return signatureDataUrl;
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT: requestPostmortem (unchanged)
// ═══════════════════════════════════════════════════════════════
export const requestPostmortem = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-slug'] as string || req.headers['x-tenant-slug'] as string || req.tenantSlug;
    if (!tenantSlug || tenantSlug === 'system_shared') {
        return res.status(400).json({ success: false, message: 'Valid tenant required. Please provide x-tenant-slug header' });
    }
    try {
        const { deceased_id, reason, requested_by, requesting_authority, notes, source, priority } = req.body;
        if (!deceased_id || !reason || !requested_by) {
            return res.status(400).json({ success: false, message: 'deceased_id, reason, and requested_by are required' });
        }
        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) {
            return res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });
        }

        const now = getKenyaTimeISO();
        const requestId = `PMREQ-${Date.now()}-${deceased_id}`;
        const existingQuery = 'SELECT id FROM postmortem WHERE deceased_id = ?';
        const existing = await safeTenantQuery(dbName, existingQuery, [deceased_id]);

        if (existing && (existing as any[]).length > 0) {
            const updateQuery = `UPDATE postmortem SET status = 'pending', requested_by = ?, requested_at = ?, requesting_authority = ?, updated_at = ? WHERE deceased_id = ?`;
            await safeTenantExecute(dbName, updateQuery, [requested_by, now, reason, now, deceased_id]);
        } else {
            const insertQuery = `INSERT INTO postmortem (deceased_id, status, requested_by, requested_at, requesting_authority, examination_summary, created_at, updated_at) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?)`;
            await safeTenantExecute(dbName, insertQuery, [deceased_id, requested_by, now, reason, reason, now, now]);
        }

        let trackingRequestId: number | null = null;
        try {
            await ensurePostmortemRequestsTable(dbName);
            const requestRef = `PMR-${Date.now()}`;
            const sourceTag = typeof source === 'string' && source.trim() ? source.trim() : 'postmortem_request_form';
            const trackingNotes = [
                typeof notes === 'string' && notes.trim() ? notes.trim() : null,
                `Source: ${sourceTag}`,
                typeof priority === 'string' && priority.trim() ? `Priority: ${priority.trim()}` : null,
            ].filter(Boolean).join(' · ') || null;

            const tracked: any = await safeTenantExecute(dbName, `
                INSERT INTO postmortem_requests
                    (deceased_id, request_ref, requested_by, requesting_authority, reason, notes, status, initiated_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'initiated', ?, ?, ?)
            `, [deceased_id, requestRef, requested_by, requesting_authority || null, reason, trackingNotes, requested_by, now, now]);
            trackingRequestId = tracked?.insertId ?? null;
        } catch (trackErr: any) {
            Logger.warn({ message: 'Failed to mirror postmortem request into postmortem_requests', error: trackErr?.message });
        }

        // Sync the deceased record: the body is now awaiting postmortem examination.
        // `postmortem_requested` is the flag analytics-service counts on.
        try {
            await ensureDeceasedPostmortemFlags(dbName);
            await safeTenantExecute(dbName,
                `UPDATE deceased SET body_status = 'Postmortem Requested', postmortem_requested = 1, postmortem_completed = 0, updated_at = ? WHERE deceased_id = ?`,
                [now, deceased_id]);
        } catch (statusErr: any) {
            Logger.warn({ message: 'Failed to set deceased body_status to Postmortem Requested', error: statusErr?.message });
        }

        try {
            const axios = require('axios');
            const configuredUrl = process.env.SOCKETIO_SERVICE_URL || '';
            const candidateUrls = [configuredUrl, 'http://localhost:5018', 'http://127.0.0.1:5018'].filter(Boolean);

            const emitPayload = {
                tenantSlug,
                data: {
                    id: `postmortem-request-${deceased_id}-${Date.now()}`,
                    deceasedId: deceased_id, requestId, requestedBy: requested_by, reason,
                    title: 'Postmortem Requested', message: `Postmortem examination requested for deceased ${deceased_id}`,
                    type: 'postmortem_requested', priority: 'high',
                    fullContent: `Request ID: ${requestId}\nDeceased ID: ${deceased_id}\nRequested By: ${requested_by}\nReason: ${reason}\nDate: ${now}`,
                }
            };

            for (const socketioServiceUrl of candidateUrls) {
                try {
                    await axios.post(`${socketioServiceUrl}/emit/postmortem-requested`, emitPayload, { timeout: 3000 });
                    break;
                } catch (urlError: any) {
                    Logger.warn({ message: `SocketIO URL failed: ${socketioServiceUrl}`, error: urlError.message });
                }
            }

            const trackingPayload = {
                tenantSlug,
                data: {
                    id: trackingRequestId ? `pmr-${trackingRequestId}` : `postmortem-request-${deceased_id}-${Date.now()}`,
                    requestId: trackingRequestId ? String(trackingRequestId) : '', deceasedId: deceased_id,
                    requestedBy: requested_by, requestingAuthority: requesting_authority || '', reason,
                    title: 'Postmortem Request Received', message: `Postmortem request submitted by ${requested_by}`,
                    type: 'postmortem_request', priority: 'high',
                    fullContent: [`Deceased ID: ${deceased_id}`, `Requested By: ${requested_by}`, requesting_authority ? `Requesting Authority: ${requesting_authority}` : null, `Reason: ${reason}`, typeof source === 'string' && source ? `Source: ${source}` : null, `Date: ${now}`].filter(Boolean).join('\n'),
                },
            };

            for (const socketioServiceUrl of candidateUrls) {
                try {
                    await axios.post(`${socketioServiceUrl}/emit/postmortem-request-created`, trackingPayload, { timeout: 3000 });
                    break;
                } catch (urlError: any) {
                    Logger.warn({ message: `SocketIO URL failed for postmortem-request-created: ${socketioServiceUrl}`, error: urlError.message });
                }
            }
        } catch (emitError: any) {
            Logger.warn({ message: `Failed to emit postmortem-requested notification`, error: emitError.message });
        }

        return res.status(201).json({
            success: true, message: "Postmortem request submitted successfully",
            data: { requestId, deceased_id, status: 'pending' }
        });

    } catch (error: any) {
        Logger.error({ message: "Error requesting postmortem", error: error.message || error });
        return res.status(500).json({ success: false, message: error.sqlMessage || error.message || "Internal server error" });
    }
};

/**
 * Mirror the examination state onto everything else that tracks it.
 *
 * `savePostmortem` used to write only the findings columns, so the row's
 * `status` stayed 'pending' forever — every read path (profile sidebar,
 * deceased timeline, dashboard "Pending Postmortem" card, analytics counters)
 * kept reporting a finished case as outstanding. The deceased row was equally
 * stale: `body_status` was pinned to 'Postmortem Requested' with nothing ever
 * moving it on.
 *
 * Every write is guarded independently so a tenant missing a column — or one
 * whose `postmortem_requests` predates the `completed` state — still receives
 * the parts it can accept.
 */
const syncPostmortemCompletion = async (
    dbName: string,
    deceasedId: string,
    now: string,
    completed: boolean,
): Promise<void> => {
    // 1. Close out the tracked request so it stops showing as outstanding.
    try {
        await ensurePostmortemRequestsTable(dbName);
        await safeTenantExecute(
            dbName,
            `UPDATE postmortem_requests SET status = ?, completed_at = ?, updated_at = ?
             WHERE deceased_id = ? AND status <> 'completed'`,
            [completed ? 'completed' : 'pending', completed ? now : null, now, deceasedId],
        );
    } catch (e: any) {
        Logger.warn({ message: 'Could not close postmortem_requests after examination', error: e?.message });
    }

    // 2. The deceased row — flags analytics-service reads, plus body_status.
    //    This update MUST succeed — if it silently fails, the deceased stays on
    //    'Postmortem Requested' forever even after results are saved.
    await ensureDeceasedPostmortemFlags(dbName);
    const sets: string[] = ['updated_at = ?', 'postmortem_requested = 1', `postmortem_completed = ${completed ? 1 : 0}`];
    if (completed) {
        // Only advance the body_status when it is still awaiting the exam —
        // a body released since the postmortem must not be dragged back.
        sets.push("body_status = CASE WHEN body_status = 'Postmortem Requested' THEN 'Postmortem Done' ELSE body_status END");
    }
    await safeTenantExecute(dbName, `UPDATE deceased SET ${sets.join(', ')} WHERE deceased_id = ?`, [now, deceasedId]);
};
// ═══════════════════════════════════════════════════════════════
// EXPORT: savePostmortem (unchanged)
// ═══════════════════════════════════════════════════════════════
export const savePostmortem = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-slug'] as string || req.headers['x-tenant-slug'] as string || req.tenantSlug;

    if (!tenantSlug || tenantSlug === 'system_shared') {
        return res.status(400).json({ success: false, message: 'Valid tenant required. Please provide x-tenant-slug header' });
    }

    try {
        const {
            deceased_id, pathologist_name, external_pathologist_name, external_pathologist_mobile, external_pathologist_id,
            examination_summary, cause_of_death, immediate_cause_of_death, underlying_cause_of_death, contributing_conditions,
            manner_of_death, requesting_authority, findings, head_findings, chest_findings, abdomen_findings, extremities_findings,
            toxicology_findings, custom_findings, staff_username, mortuary_name
        } = req.body;

        if (!deceased_id) return res.status(400).json({ success: false, message: 'deceased_id is required' });

        // The examination form always submits `status: 'completed'`, but an
        // amended/incomplete save may legitimately send 'in_progress'. Anything
        // else is treated as completed — filing findings IS the examination
        // being carried out, and that is what the UI asserts on success.
        const requestedStatus = String(req.body.status || 'completed').trim().toLowerCase();
        const finalStatus: string = requestedStatus === 'in_progress' ? 'in_progress' : 'completed';
        const isCompleted = finalStatus === 'completed';

        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) return res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });

        const rawSignature = (req.body as any).signature_base64;
        const signature_base64 = rawSignature ? await normalizeSignatureToInkBlue(rawSignature) : null;

        await ensurePostmortemTable(dbName);

        const existingQuery = 'SELECT id FROM postmortem WHERE deceased_id = ?';
        const existing = await safeTenantQuery(dbName, existingQuery, [deceased_id]);
        const now = getKenyaTimeISO();

        if (existing && (existing as any[]).length > 0) {
            const updateQuery = `
                UPDATE postmortem SET
                    pathologist_name = ?, external_pathologist_name = ?, external_pathologist_mobile = ?, external_pathologist_id = ?,
                    examination_summary = ?, cause_of_death = ?, immediate_cause_of_death = ?, underlying_cause_of_death = ?,
                    contributing_conditions = ?, manner_of_death = ?, requesting_authority = ?, findings = ?, head_findings = ?,
                    chest_findings = ?, abdomen_findings = ?, extremities_findings = ?, toxicology_findings = ?, custom_findings = ?,
                    signature = ?, staff_username = ?, mortuary_name = ?,
                    status = ?, completed_at = COALESCE(completed_at, ?), updated_at = ?
                WHERE deceased_id = ?`;

            await safeTenantExecute(dbName, updateQuery, [
                pathologist_name, external_pathologist_name, external_pathologist_mobile, external_pathologist_id,
                examination_summary, cause_of_death, immediate_cause_of_death, underlying_cause_of_death, contributing_conditions,
                manner_of_death, requesting_authority,
                typeof findings === 'string' ? findings : JSON.stringify(findings),
                head_findings || null, chest_findings || null, abdomen_findings || null, extremities_findings || null,
                toxicology_findings || null, custom_findings || null, signature_base64,
                staff_username || null, mortuary_name || null,
                // THE FIX: this status used to be announced over the socket but
                // never written to the row, so the record stayed 'pending' in the
                // database and every reload showed "Postmortem Pending". COALESCE
                // keeps the FIRST completion timestamp, so amending a report
                // never rewrites when the examination was actually carried out.
                finalStatus, isCompleted ? now : null, now, deceased_id]);

            await syncPostmortemCompletion(dbName, deceased_id, now, isCompleted);

            emitPostmortemUpdate(tenantSlug, deceased_id, { status: finalStatus, pathologist_name, cause_of_death, manner_of_death, completed_at: isCompleted ? now : null });

            try {
                let deceasedName = '';
                try {
                    const nRows: any[] = (await safeTenantQuery(dbName, 'SELECT full_name FROM deceased WHERE deceased_id = ?', [deceased_id])) || [];
                    deceasedName = nRows[0]?.full_name || '';
                } catch { }

                const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
                const axios = require('axios');
                const who = deceasedName || deceased_id;
                await axios.post(`${socketioServiceUrl}/emit/postmortem-results-ready`, {
                    tenantSlug, data: {
                        id: `postmortem-results-${deceased_id}-${Date.now()}`, deceasedId: deceased_id, deceasedName,
                        pathologistName: pathologist_name || 'N/A', causeOfDeath: cause_of_death || 'Pending',
                        mannerOfDeath: manner_of_death || 'Undetermined', title: 'Postmortem Results Available',
                        message: `Postmortem results for ${who} are now available`, type: 'postmortem_results', priority: 'high',
                        fullContent: `Deceased: ${who}\nDeceased ID: ${deceased_id}\nPathologist: ${pathologist_name || 'N/A'}\nCause of Death: ${cause_of_death || 'Pending'}\nManner of Death: ${manner_of_death || 'Undetermined'}\nCompleted: ${now}`
                    }
                }, { timeout: 5000 });
            } catch (emitError) {
                console.warn('[POSTMORTEM] Failed to emit postmortem-results-ready notification:', emitError.message);
            }

            return res.status(200).json({ success: true, message: 'Postmortem data saved successfully', data: { deceased_id } });
        } else {
            const insertQuery = `
                INSERT INTO postmortem (
                    deceased_id, pathologist_name, external_pathologist_name, external_pathologist_mobile, external_pathologist_id,
                    examination_summary, cause_of_death, immediate_cause_of_death, underlying_cause_of_death, contributing_conditions,
                    manner_of_death, requesting_authority, findings, head_findings, chest_findings, abdomen_findings, extremities_findings,
                    toxicology_findings, custom_findings, staff_username, mortuary_name, signature, status, completed_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const result = await safeTenantExecute(dbName, insertQuery, [
                deceased_id, pathologist_name, external_pathologist_name, external_pathologist_mobile, external_pathologist_id,
                examination_summary, cause_of_death, immediate_cause_of_death, underlying_cause_of_death, contributing_conditions,
                manner_of_death, requesting_authority,
                typeof findings === 'string' ? findings : JSON.stringify(findings),
                head_findings || null, chest_findings || null, abdomen_findings || null, extremities_findings || null,
                toxicology_findings || null, custom_findings || null, staff_username || null, mortuary_name || null,
                signature_base64, finalStatus, isCompleted ? now : null, now, now]);

            await syncPostmortemCompletion(dbName, deceased_id, now, isCompleted);

            emitPostmortemUpdate(tenantSlug, deceased_id, { status: finalStatus, pathologist_name, cause_of_death, manner_of_death, completed_at: isCompleted ? now : null });

            try {
                let deceasedName = '';
                try {
                    const nRows: any[] = (await safeTenantQuery(dbName, 'SELECT full_name FROM deceased WHERE deceased_id = ?', [deceased_id])) || [];
                    deceasedName = nRows[0]?.full_name || '';
                } catch { }

                const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
                const axios = require('axios');
                const who = deceasedName || deceased_id;
                await axios.post(`${socketioServiceUrl}/emit/postmortem-results-ready`, {
                    tenantSlug, data: {
                        id: `postmortem-results-${deceased_id}-${Date.now()}`, deceasedId: deceased_id, deceasedName,
                        pathologistName: pathologist_name || 'N/A', causeOfDeath: cause_of_death || 'Pending',
                        mannerOfDeath: manner_of_death || 'Undetermined', title: 'Postmortem Results Available',
                        message: `Postmortem results for ${who} are now available`, type: 'postmortem_results', priority: 'high',
                        fullContent: `Deceased: ${who}\nDeceased ID: ${deceased_id}\nPathologist: ${pathologist_name || 'N/A'}\nCause of Death: ${cause_of_death || 'Pending'}\nManner of Death: ${manner_of_death || 'Undetermined'}\nCompleted: ${now}`
                    }
                }, { timeout: 5000 });
            } catch (emitError) {
                console.warn('[POSTMORTEM] Failed to emit postmortem-results-ready notification:', emitError.message);
            }

            return res.status(201).json({ success: true, message: 'Postmortem data saved successfully', data: { id: (result as any).insertId, deceased_id } });
        }
    } catch (error: any) {
        console.error('Error in savePostmortem:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
};

const emitPostmortemUpdate = async (tenantSlug: string, deceasedId: string, data: any) => {
    const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
    try {
        const axios = require('axios');
        if (!tenantSlug || tenantSlug === 'system_shared') return;

        try {
            await axios.post(`${socketioServiceUrl}/emit/postmortem-updated`, {
                tenantSlug, data: { deceasedId, data, timestamp: new Date().toISOString() }
            }, { timeout: 5000, headers: { 'Content-Type': 'application/json' } });
        } catch (error) {
            console.error('[POSTMORTEM] Failed to emit postmortem-updated:', error.message);
        }

        if (data.status === 'completed') {
            const notificationPayload = {
                tenantSlug,
                data: {
                    id: `postmortem-${Date.now()}`, type: 'postmortem_completed', title: 'Postmortem Completed',
                    message: `Postmortem examination has been completed for deceased ID: ${deceasedId}`,
                    fullContent: `Postmortem Status: Completed\nDeceased ID: ${deceasedId}\nPathologist: ${data.pathologist_name || 'N/A'}\nCause of Death: ${data.cause_of_death || 'N/A'}\nManner of Death: ${data.manner_of_death || 'N/A'}\nCompleted At: ${data.completed_at || 'N/A'}`,
                    priority: 'high',
                    data: { deceased_id: deceasedId, status: 'completed', pathologist_name: data.pathologist_name, cause_of_death: data.cause_of_death, manner_of_death: data.manner_of_death, completed_at: data.completed_at },
                    timestamp: new Date().toISOString(),
                    expiresAt: Date.now() + (2 * 60 * 60 * 1000)
                }
            };

            try {
                await axios.post(`${socketioServiceUrl}/emit/postmortem-completed`, notificationPayload, { timeout: 5000, headers: { 'Content-Type': 'application/json' } });
            } catch (error) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    try {
                        await axios.post(`http://localhost:5018/emit/postmortem-completed`, notificationPayload, { timeout: 5000, headers: { 'Content-Type': 'application/json' } });
                    } catch (fallbackError) { }
                }
            }
        }
    } catch (error) {
        console.error('[POSTMORTEM] Socket emit error:', error);
    }
};

export const getPostmortemByDeceasedId = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-slug'] as string || req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { deceased_id } = req.params;

    if (!deceased_id || !tenantSlug) return res.status(400).json({ success: false, message: 'deceased_id and tenant are required' });

    try {
        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) return res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });

        const selectQuery = `
            SELECT 
                id, deceased_id, status, pathologist_name, external_pathologist_name, external_pathologist_mobile, external_pathologist_id,
                examination_summary, cause_of_death, immediate_cause_of_death, underlying_cause_of_death, contributing_conditions,
                manner_of_death, requesting_authority, findings, head_findings, chest_findings, abdomen_findings, extremities_findings,
                toxicology_findings, custom_findings, signature, report_pdf_url, created_at, updated_at,
                requested_by, requested_at
            FROM postmortem WHERE deceased_id = ?`;

        const records = await safeTenantQuery(dbName, selectQuery, [deceased_id]);
        if (!records || (records as any[]).length === 0) return res.status(404).json({ success: false, message: 'Postmortem record not found' });

        const postmortem = (records as any[])[0];
        if (postmortem.findings && typeof postmortem.findings === 'string') {
            try { postmortem.findings = JSON.parse(postmortem.findings); } catch (e) { }
        }

        return res.status(200).json({ success: true, message: 'Postmortem record fetched successfully', data: postmortem });
    } catch (error: any) {
        console.error(' Error in getPostmortemByDeceasedId:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updatePostmortem = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-slug'] as string || req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { id } = req.params;

    if (!id || !tenantSlug) return res.status(400).json({ success: false, message: 'id and tenant are required' });

    try {
        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) return res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });

        await ensurePostmortemTable(dbName);

        const updates = req.body;
        // `status` and `completed_at` used to be missing from this allow-list,
        // so a record could never be closed through this endpoint — it could
        // only ever stay pending. Accept them now, and stamp completed_at on the
        // transition so the caller does not have to supply it.
        const allowedFields = [
            'pathologist_name', 'external_pathologist_name', 'external_pathologist_mobile', 'external_pathologist_id',
            'examination_summary', 'cause_of_death', 'immediate_cause_of_death', 'underlying_cause_of_death',
            'contributing_conditions', 'manner_of_death', 'requesting_authority', 'findings', 'report_pdf_url',
            'signature', 'status', 'completed_at'];

        const VALID_STATUSES = ['pending', 'in_progress', 'completed'];
        const requestedStatus = updates.status !== undefined ? String(updates.status).trim().toLowerCase() : null;
        if (requestedStatus !== null && !VALID_STATUSES.includes(requestedStatus)) {
            return res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
        }

        const now = getKenyaTimeISO();
        const fields: string[] = [];
        const values: any[] = [];

        for (const field of allowedFields) {
            if (updates[field] === undefined) continue;
            // completed_at is stamped below so the transition itself dates the row.
            if (field === 'completed_at' && requestedStatus === 'completed') continue;
            fields.push(`${field} = ?`);
            const value = field === 'findings' && typeof updates[field] === 'object'
                ? JSON.stringify(updates[field])
                : field === 'signature' && typeof updates[field] === 'string' && updates[field].startsWith('data:image')
                    ? await normalizeSignatureToInkBlue(updates[field])
                    : updates[field];
            values.push(value);
        }

        if (requestedStatus === 'completed') {
            fields.push('completed_at = COALESCE(completed_at, ?)');
            values.push(now);
        }

        if (fields.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });

        fields.push('updated_at = ?');
        values.push(now);
        values.push(id);

        const updateQuery = `UPDATE postmortem SET ${fields.join(', ')} WHERE id = ?`;
        await safeTenantExecute(dbName, updateQuery, values);

        // Keep the surrounding records in step with the new state, otherwise the
        // timeline / dashboard / analytics keep reporting the old one.
        if (requestedStatus) {
            const owner: any[] = (await safeTenantQuery(dbName, 'SELECT deceased_id FROM postmortem WHERE id = ?', [id])) || [];
            const deceasedId = owner[0]?.deceased_id;
            if (deceasedId) {
                await syncPostmortemCompletion(dbName, deceasedId, now, requestedStatus === 'completed');
                emitPostmortemUpdate(tenantSlug, deceasedId, { status: requestedStatus, completed_at: requestedStatus === 'completed' ? now : null });
            }
        }

        return res.status(200).json({ success: true, message: 'Postmortem record updated successfully' });
    } catch (error: any) {
        console.error('Error in updatePostmortem:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// ═══════════════════════════════════════════════════════════════
// PUPPETEER LOADER
// puppeteer v23+ is published as ESM-only, so it cannot be `require`d
// from this CommonJS service. It is loaded once through a dynamic
// import() (same pattern as xlsx-populate in exportExcelController.ts).
// ═══════════════════════════════════════════════════════════════
type PuppeteerNodeModule = typeof import('puppeteer', { with: { 'resolution-mode': 'import' } })['default'];

let puppeteerModulePromise: Promise<PuppeteerNodeModule> | null = null;

const loadPuppeteer = async (): Promise<PuppeteerNodeModule> => {
    if (!puppeteerModulePromise) {
        puppeteerModulePromise = import('puppeteer')
            .then((mod: any) => (mod.default || mod) as PuppeteerNodeModule);
    }
    return puppeteerModulePromise;
};

// ═══════════════════════════════════════════════════════════════
// EXPORT: generatePostmortemPDF — Puppeteer, GUARANTEED 1 page
// ═══════════════════════════════════════════════════════════════
export const generatePostmortemPDF = async (req: TenantRequest, res: Response): Promise<void> => {
    const tenantSlug = req.headers['x-slug'] as string || req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { deceased_id } = req.params;

    if (!deceased_id || !tenantSlug) {
        res.status(400).json({ success: false, message: 'deceased_id and tenant are required' });
        return;
    }

    let browser: Browser | null = null;

    try {
        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) {
            res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });
            return;
        }

        // ── 1. QUERY POSTMORTEM ──
        const postmortemQuery = `
            SELECT id, deceased_id, status, pathologist_name, external_pathologist_name,
                   external_pathologist_mobile, external_pathologist_id,
                   examination_summary, cause_of_death, immediate_cause_of_death,
                   underlying_cause_of_death, contributing_conditions,
                   manner_of_death, requesting_authority, signature,
                   created_at, updated_at
            FROM postmortem WHERE deceased_id = ?`;
        const pmResults = await safeTenantQuery(dbName, postmortemQuery, [deceased_id]);
        if (!pmResults || (pmResults as any[]).length === 0) {
            res.status(404).json({ success: false, message: 'Postmortem record not found' });
            return;
        }
        const postmortem = (pmResults as any[])[0];

        // ── 2. QUERY DECEASED ──
        // Schema-adaptive: older tenants are missing `age`, `signature`,
        // `date_of_birth`, `national_id`, ... and this endpoint is PUBLIC
        // (the results page requests the PDF right after the search), so a
        // hardcoded list made it 500 on exactly the same tenants as the search.
        const dCols = await tableColumns(dbName, 'deceased');
        const DECEASED_PDF_COLS = [
            'full_name', 'date_of_death', 'signature', 'admission_number',
            'date_of_birth', 'age', 'gender', 'place_of_death', 'national_id',
        ];
        let deceased: any = null;
        if (dCols.has('deceased_id')) {
            const deceasedQuery = `SELECT ${DECEASED_PDF_COLS.map((c) => pickAs(dCols, c, c)).join(', ')}
                FROM deceased WHERE deceased_id = ?`;
            const decResults = await safeTenantQuery(dbName, deceasedQuery, [deceased_id]);
            deceased = decResults && (decResults as any[]).length > 0 ? (decResults as any[])[0] : null;
        }

        // ── 3. QUERY NEXT OF KIN ──
        // `is_primary` / `is_deleted` are absent on some older tenants, so the
        // filters are built from the real schema instead of being hardcoded.
        const nCols = await tableColumns(dbName, 'next_of_kin');
        let nextOfKin: any = null;
        if (nCols.size > 0 && nCols.has('deceased_id')) {
            const where = ['deceased_id = ?'];
            if (nCols.has('is_primary')) where.push('is_primary = 1');
            if (nCols.has('is_deleted')) where.push('is_deleted = 0');
            const kinSelect = ['full_name', 'relationship', 'contact']
                .map((c) => pickAs(nCols, c, c))
                .join(', ');
            const kinQuery = `SELECT ${kinSelect} FROM next_of_kin WHERE ${where.join(' AND ')} LIMIT 1`;
            const kinResults = await safeTenantQuery(dbName, kinQuery, [deceased_id]);
            nextOfKin = kinResults && (kinResults as any[]).length > 0 ? (kinResults as any[])[0] : null;
        }

        // ── 4. EXTRACT VALUES ──
        const facilityName = formatFacilityName(tenantSlug);
        const fullName = deceased?.full_name || 'Unknown';
        const admissionNumber = deceased?.admission_number || deceased_id;
        const dateOfDeath = fmtLong(deceased?.date_of_death);
        const age = deceased?.age || 'N/A';
        const gender = deceased?.gender || 'N/A';

        const pathologistName = postmortem.external_pathologist_name || postmortem.pathologist_name || 'Attending Pathologist';
        const pathologistLicense = postmortem.external_pathologist_id || '';
        const pathologistCredentials = pathologistLicense ? 'MBChB, MMed (Pathology)' : 'Pathologist';
        const examDate = fmtLong(postmortem.updated_at || postmortem.created_at);
        const mannerOfDeath = postmortem.manner_of_death || 'N/A';
        const immediateCause = postmortem.immediate_cause_of_death || postmortem.cause_of_death || 'N/A';
        const underlyingCause = postmortem.underlying_cause_of_death || 'N/A';
        const examinationSummary = postmortem.examination_summary || '';

        const kinName = nextOfKin?.full_name || deceased?.full_name || 'N/A';
        const kinRelationship = nextOfKin?.relationship || 'N/A';
        const kinPhone = nextOfKin?.contact || 'N/A';

        const issuedDate = fmtLong(new Date().toISOString());
        const verifiedDate = fmtShort(new Date().toISOString());
        const reportRef = `PM-${deceased_id}-${DateTime.now().setZone('Africa/Nairobi').toFormat('yyyyMMdd')}`;
        const fullTimestamp = DateTime.now().setZone('Africa/Nairobi').toFormat('yyyy-MM-dd hh:mm:ss a');

        // ── 5. LOAD SIGNATURE ──
        let signatureBase64: string | null = null;
        const signaturePath =
            postmortem?.signature ||
            postmortem?.pathologist_signature ||
            deceased?.pathologist_signature ||
            deceased?.signature;

        if (signaturePath && typeof signaturePath === 'string') {
            try {
                let sigBuffer: Buffer | null = null;
                if (signaturePath.startsWith('data:image')) {
                    const base64Data = signaturePath.split(',')[1];
                    sigBuffer = Buffer.from(base64Data, 'base64');
                } else if (signaturePath.startsWith('http')) {
                    const axios = require('axios');
                    const response = await axios.get(signaturePath, { responseType: 'arraybuffer', timeout: 10000 });
                    sigBuffer = Buffer.from(response.data);
                } else {
                    const uploadsBase = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
                    const relativePath = signaturePath.replace(/^\/uploads\//, '');
                    const fsPath = path.join(uploadsBase, relativePath);
                    if (fs.existsSync(fsPath)) sigBuffer = fs.readFileSync(fsPath);
                }
                if (sigBuffer) {
                    try {
                        const inkBuffer = await toInkBlueBuffer(sigBuffer);
                        signatureBase64 = 'data:image/png;base64,' + inkBuffer.toString('base64');
                    } catch {
                        signatureBase64 = 'data:image/png;base64,' + sigBuffer.toString('base64');
                    }
                }
            } catch (sigError) {
                console.warn('[PDF] Failed to load signature:', sigError);
            }
        }

        // ── 6. TENANT BRANDING (logo + name, same source as Settings) ──
        // Previously the logo was a hardcoded third-party image and the name was
        // derived from the URL slug, so every report showed another company's
        // branding. Resolve the real record; the env var stays as an operator
        // override for single-tenant deployments.
        const branding = await resolveTenantBranding(tenantSlug);
        const brandingName = branding.name || facilityName;   // fall back to the slug-derived name
        const logoBase64 = await loadLogoBase64(
            branding.logoUrl || process.env.FUNERAL_HOME_LOGO_URL || '',
        );

        // ── 7. BUILD HTML ──
        // await: buildReportHtml renders the barcode, which is async.
        const html = await buildReportHtml({
            tenantName: brandingName,
            tenantAddress: branding.address,
            tenantPhone: branding.phone,
            tenantEmail: branding.email,
            deceasedFullName: fullName,
            deceasedAdmission: admissionNumber,
            deceasedDateOfDeath: dateOfDeath,
            deceasedAge: age,
            deceasedGender: gender,
            examDate,
            pathologistName,
            pathologistCredentials,
            pathologistLicense,
            mannerOfDeath,
            immediateCause,
            underlyingCause,
            examinationSummary,
            kinName,
            kinRelationship,
            kinPhone,
            verifiedDate,
            issuedDate,
            logoBase64,
            signatureBase64,
        });

        // ── 8. GENERATE PDF WITH PUPPETEER ──
        const puppeteer = await loadPuppeteer();
        browser = await puppeteer.launch({
            // v25 accepts `boolean | 'shell'` only — `true` = new headless mode
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
        });

        const page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            if (url.startsWith('data:') || url.startsWith('about:') || url.startsWith('file:')) {
                req.continue();
            } else {
                req.abort();
            }
        });

        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

        await page.setContent(html, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        await new Promise(r => setTimeout(r, 500));

        // ── 9. GENERATE PDF — preferCSSPageSize respects our @page rule ──
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
            preferCSSPageSize: true,
        });

        // ── 10. SEND RESPONSE ──
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="postmortem-${deceased_id}.pdf"`);
        res.send(pdfBuffer);

        // ── 11. SOCKET EMIT ──
        try {
            const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
            const axios = require('axios');
            const notificationPayload = {
                tenantSlug,
                data: {
                    id: `postmortem-pdf-${deceased_id}-${Date.now()}`,
                    deceasedId: deceased_id,
                    deceasedName: fullName,
                    reportRef,
                    title: 'Postmortem PDF Generated',
                    message: `Postmortem report PDF has been generated for ${fullName} (${deceased_id})`,
                    type: 'postmortem_pdf_generated',
                    priority: 'high',
                    fullContent: `Postmortem Report PDF Generated\nDeceased ID: ${deceased_id}\nName: ${fullName}\nReport Reference: ${reportRef}\nPathologist: ${pathologistName}\nCause of Death: ${immediateCause}\nManner of Death: ${mannerOfDeath}\nGenerated: ${fullTimestamp}`,
                    data: {
                        deceased_id: deceased_id,
                        deceased_name: fullName,
                        report_ref: reportRef,
                        pathologist: pathologistName,
                        cause_of_death: immediateCause,
                        manner_of_death: mannerOfDeath,
                        generated_at: fullTimestamp,
                    },
                    timestamp: new Date().toISOString(),
                    expiresAt: Date.now() + (2 * 60 * 60 * 1000),
                },
            };

            await axios.post(`${socketioServiceUrl}/emit/postmortem-pdf-generated`, notificationPayload, { timeout: 5000, headers: { 'Content-Type': 'application/json' } });
        } catch (emitError: any) {
            console.warn('[PDF] Failed to emit pdf generated event', emitError.message);
        }

    } catch (error: any) {
        console.error('Error in generatePostmortemPDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};