/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Restpoint Scanner Bridge Agent
 * ─────────────────────────────────────────────────────────────────────────────
 *  A small, always-running background agent for the reception computer.
 *  Exposes a LOCAL WebSocket server (default ws://localhost:8081) that the
 *  Restpoint web app connects to when a user clicks **Scan Docs** on a
 *  deceased profile. On `START_SCAN` the agent:
 *
 *    1. Drives the physical scanner (TWAIN / WIA / eSCL via the NAPS2 CLI,
 *       or a custom SCAN_COMMAND) and produces a single (multi-page) PDF.
 *    2. Uploads the PDF DIRECTLY to the documents-service:
 *         POST {apiBase}/documents/upload/{deceasedId}
 *       using the auth token + tenant slug the web app passed along.
 *    3. Streams SCANNING → UPLOADING → COMPLETE back to the browser so the
 *       UI can show a live "Scanning…" modal.
 *
 *  BUILT IN TYPESCRIPT → compiled by `npm run build` into ONE self-contained
 *  executable: dist/agent.js. That single file is what ships to production.
 * ─────────────────────────────────────────────────────────────────────────────
 */
'use strict';

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { WebSocketServer, WebSocket } from 'ws';

const APP_VERSION = '1.0.0';

const truthy = (v?: string): boolean => /^(1|true|yes|on)$/i.test(String(v || '').trim());

const BRIDGE_HOST = process.env.BRIDGE_HOST || '127.0.0.1'; // Bind locally for security
const BRIDGE_PORT = Number(process.env.BRIDGE_PORT || 8081);
const MOCK_MODE = truthy(process.env.MOCK_SCAN);
const ALLOW_SHUTDOWN = truthy(process.env.BRIDGE_ALLOW_SHUTDOWN);

const NAPS2_PATH = process.env.NAPS2_PATH || (process.platform === 'win32' ? 'naps2.exe' : 'naps2');
const SCANNER_NAME = (process.env.SCANNER_NAME || '').trim();
const DEFAULT_FORMAT = (process.env.SCANNER_DEFAULT_FORMAT || 'pdf').toLowerCase();
const DEFAULT_RESOLUTION = Number(process.env.SCANNER_DEFAULT_DPI || 300);
const DEFAULT_COLOR_MODE = (process.env.SCANNER_DEFAULT_COLOR_MODE || 'color').toLowerCase();
const DEFAULT_DUPLEX = truthy(process.env.SCANNER_DUPLEX);

const SCAN_COMMAND = (process.env.SCAN_COMMAND || '').trim();
const SCAN_COMMAND_EXTRA = (process.env.SCAN_COMMAND_EXTRA || '').trim();
const SCANNER_STDIO = process.env.SCANNER_STDIO === 'inherit' ? 'inherit' : 'pipe';
const SCAN_TIMEOUT_MS = Math.max(10000, Number(process.env.SCAN_TIMEOUT_MS || 120000));
const ALLOWED_ORIGINS = (process.env.BRIDGE_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

function systemTempDir(): string {
    return process.env.TEMP || process.env.TMP || (process.platform === 'win32' ? 'C:\\Windows\\Temp' : '/tmp');
}

function ensureDir(dir: string): string {
    try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
        console.warn(`[BRIDGE] could not create work dir ${dir}: ${(e as Error).message}`);
    }
    return dir;
}

const SCAN_DIR = ensureDir(process.env.SCANNER_WORK_DIR || path.join(systemTempDir(), 'restpoint-scanner-bridge'));

// ── helpers ──────────────────────────────────────────────────────────────────
function decodeOut(buf: unknown): string {
    if (buf === undefined || buf === null) return '';
    if (typeof buf === 'string') return buf;
    if (Buffer.isBuffer(buf)) return buf.toString('utf8');
    if (buf instanceof Uint8Array) return Buffer.from(buf).toString('utf8');
    return String(buf);
}

const timestampSuffix = (): string => {
    const d = new Date();
    const p = (n: number, w = 2) => String(n).padStart(w, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

const sanitizeFilename = (name: string): string => {
    const base = String(name || '');
    const clean = base.replace(/[\\/:*?"<>|\r\n\t]/g, '-').replace(/-+/g, '-').trim();
    const safe = clean || `Scan_${timestampSuffix()}.pdf`;
    return safe.length > 120 ? safe.slice(-120) : safe;
};

const extForFormat = (format: string): string => {
    const f = (format || 'pdf').toLowerCase();
    if (f === 'jpeg' || f === 'jpg') return '.jpg';
    if (f === 'tiff' || f === 'tif') return '.tiff';
    if (f === 'png') return '.png';
    return '.pdf';
};

const mimeForFormat = (format: string): string =>
    extForFormat(format) === '.pdf' ? 'application/pdf' : 'application/octet-stream';

/** Minimal POSIX-like tokenizer: groups quoted args, strips the quotes. */
function splitShell(input: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inWord = false;
    let quote: string | null = null;
    for (const ch of input) {
        if (quote) {
            if (ch === quote) quote = null;
            else cur += ch;
            continue;
        }
        if (ch === '"' || ch === "'") { quote = ch; inWord = true; continue; }
        if (ch === ' ' || ch === '\t' || ch === '\n') {
            if (inWord) { out.push(cur); cur = ''; inWord = false; }
            continue;
        }
        cur += ch;
        inWord = true;
    }
    if (inWord) out.push(cur);
    return out.filter((s) => s.length > 0);
}

// ── mock scanner: small valid PDF so the whole pipeline runs with no hardware ─
function makeMockPdf(lines: string[] = ['Restpoint scan - mock page', 'Generated by the scanner bridge (MOCK_SCAN mode)']): Buffer {
    const content = lines.join('\n') + '\n';
    const objects: Array<{ n: number; body: string }> = [
        { n: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' },
        { n: 2, body: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
        { n: 3, body: '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>' },
        { n: 4, body: `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream` },
        { n: 5, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' },
    ];
    let pdf = Buffer.from('%PDF-1.4\n');
    const offsets: number[] = [];
    for (const o of objects) {
        offsets.push(pdf.length);
        pdf = Buffer.concat([pdf, Buffer.from(`${o.n} 0 obj\n${o.body}\nendobj\n`)]);
    }
    const xrefPos = pdf.length;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) xref += `${String(off).padStart(10, '0')} 00000 n \n`;
    pdf = Buffer.concat([
        pdf,
        Buffer.from(`${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`),
    ]);
    return pdf;
}

interface ScanOptions {
    output: string;
    resolution?: number;
    colorMode?: string;
    duplex?: boolean;
    pages?: number;
    source?: string;
    format?: string;
}

/** Substitute {TOKENS} in a custom SCAN_COMMAND template. */
function substituteTokens(o: ScanOptions): string {
    const map: Record<string, string> = {
        '{NAPS2}': NAPS2_PATH,
        '{OUTPUT}': `"${o.output}"`,
        '{FORMAT}': o.format || DEFAULT_FORMAT,
        '{RESOLUTION}': String(o.resolution || DEFAULT_RESOLUTION),
        '{MODE}': o.colorMode ? `--mode ${o.colorMode}` : '',
        '{DUPLEX}': o.duplex ? '--duplex' : '',
        '{SOURCE}': o.source && o.source !== 'auto' ? `--source ${o.source}` : '',
        '{SCANNER}': SCANNER_NAME ? `--scanner "${SCANNER_NAME}"` : '',
    };
    let cmd = SCAN_COMMAND;
    for (const [k, v] of Object.entries(map)) {
        cmd = cmd.split(k).join(v); // Safe replace all
    }
    return cmd;
}

/** Default NAPS2 invocation argv. */
function defaultScanArgv(o: ScanOptions): string[] {
    const args: string[] = [NAPS2_PATH, 'scan'];
    args.push('--output', o.output);
    args.push('--format', o.format || DEFAULT_FORMAT);
    args.push('--resolution', String(o.resolution || DEFAULT_RESOLUTION));
    args.push('--mode', o.colorMode || DEFAULT_COLOR_MODE);
    if (o.duplex) args.push('--duplex');
    if (o.source && o.source !== 'auto') args.push('--source', o.source);
    if (o.pages && o.pages > 1) args.push('--pages', String(o.pages));
    if (SCANNER_NAME) args.push('--scanner', SCANNER_NAME);
    if (SCAN_COMMAND_EXTRA) args.push(...splitShell(SCAN_COMMAND_EXTRA));
    return args;
}

function buildScanArgv(o: ScanOptions): string[] {
    if (SCAN_COMMAND) return splitShell(substituteTokens(o));
    return defaultScanArgv(o);
}

/** Run the scanner CLI synchronously; success is validated by the produced file. */
function execScanner(o: ScanOptions): { ok: boolean; stderr: string; error?: string } {
    const argv = buildScanArgv(o);
    console.log(`[BRIDGE] running: ${argv.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`);

    try {
        const r: SpawnSyncReturns<Buffer> = spawnSync(argv[0], argv.slice(1), {
            stdio: SCANNER_STDIO,
            timeout: SCAN_TIMEOUT_MS,
            encoding: 'buffer'
        });

        const stderr = decodeOut(r.stderr);
        const stdout = decodeOut(r.stdout);

        if (stderr.trim()) console.warn(`[BRIDGE] scanner stderr: ${stderr.trim().slice(0, 500)}`);
        if (stdout.trim()) console.log(`[BRIDGE] scanner stdout: ${stdout.trim().slice(0, 500)}`);

        if (r.error) {
            return { ok: false, stderr, error: r.error.message };
        }
        if (r.status !== 0) {
            return { ok: false, stderr, error: `Scanner command exited with code ${r.status}.` };
        }

        return { ok: true, stderr };
    } catch (e) {
        const msg = (e as Error).message || 'scanner command failed';
        return {
            ok: false,
            stderr: '',
            error: /timed out/i.test(msg) ? `Scanner timed out after ${SCAN_TIMEOUT_MS / 1000}s — is it powered on, connected and not busy?` : msg,
        };
    }
}

async function fileIsPdf(file: string): Promise<boolean> {
    try {
        // FIX: fs.promises.readFile does not support { limit: 5 }. Read file and slice.
        const buf = await fs.promises.readFile(file);
        return buf.length >= 5 && buf.slice(0, 5).toString('ascii') === '%PDF-';
    } catch {
        return false;
    }
}

/** Wait (bounded) until `file` exists and looks like a PDF. */
async function waitForScanOutput(file: string, timeoutMs = 10000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (fs.existsSync(file)) {
            const st = fs.statSync(file);
            if (st.size > 0 && (await fileIsPdf(file))) return true;
        }
        await new Promise((r) => setTimeout(r, 400));
    }
    return false;
}

/** Produce a scanned PDF at `output`. Mock mode needs no hardware. */
async function scanToPdf(o: ScanOptions): Promise<string> {
    if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 1200)); // feel like a real scan
        ensureDir(path.dirname(o.output));
        fs.writeFileSync(o.output, makeMockPdf());
        return o.output;
    }
    const result = execScanner(o);
    if (!result.ok) throw new Error(result.error || 'The scanner did not produce a document.');

    const ok = await waitForScanOutput(o.output, Math.min(10000, SCAN_TIMEOUT_MS));
    if (!ok) throw new Error('The scanner finished but did not write a PDF — check the scanner driver and try again.');
    return o.output;
}

// ── upload: DIRECTLY to the documents-service ─────────────────────────────────
interface UploadContext {
    apiBase: string;
    deceasedId: string;
    filePath: string;
    documentName: string;
    category: string;
    token?: string;
    tenantSlug?: string;
    userId?: string;
    format?: string;
}

function buildMultipart(ctx: UploadContext, boundary: string): Buffer {
    const safeName = sanitizeFilename(ctx.documentName);
    const mime = mimeForFormat(ctx.format || 'pdf');
    const safeCategory = String(ctx.category || 'General').replace(/[\r\n]+/g, ' ').slice(0, 100);
    const safeDeceasedId = String(ctx.deceasedId || '').trim();
    const parts: Buffer[] = [];
    parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="deceasedId"\r\n\r\n${safeDeceasedId}\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${safeName}"\r\n` +
        `Content-Type: ${mime}\r\n\r\n`
    ));
    parts.push(fs.readFileSync(ctx.filePath));
    parts.push(Buffer.from(
        `\r\n--${boundary}\r\nContent-Disposition: form-data; name="documentName"\r\n\r\n${safeName}\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="category"\r\n\r\n${safeCategory}\r\n` +
        `--${boundary}--\r\n`
    ));
    return Buffer.concat(parts);
}

async function uploadScannedDocument(ctx: UploadContext): Promise<{ body: any; httpStatus: number }> {
    const base = ctx.apiBase.replace(/\/+$/, '');
    const safeDeceasedId = String(ctx.deceasedId || '').trim();
    const primaryUrl = `${base}/documents/upload`;
    const legacyUrl = `${base}/documents/upload/${encodeURIComponent(safeDeceasedId)}`;
    const boundary = `----RestpointBridge-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const body = buildMultipart({ ...ctx, deceasedId: safeDeceasedId }, boundary);

    const headers: Record<string, string> = {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length),
    };
    if (ctx.token) headers['Authorization'] = `Bearer ${ctx.token}`;
    if (ctx.tenantSlug) headers['x-tenant-slug'] = String(ctx.tenantSlug).replace(/[\r\n]+/g, '').trim();
    if (ctx.userId) headers['x-user-id'] = String(ctx.userId).replace(/[\r\n]+/g, '').trim();

    const fetchFn = (typeof fetch !== 'undefined' ? fetch : null) as any;
    if (!fetchFn) throw new Error('Node 18+ (with global fetch) is required for uploads.');

    const tryUpload = async (url: string) => {
        console.log(`[BRIDGE] uploading ${body.length} bytes → POST ${url}`);
        const res = await fetchFn(url, { method: 'POST', headers, body, redirect: 'follow' });
        const text = await res.text();
        let json: any = {};
        try { json = JSON.parse(text); } catch { /* non-JSON body */ }
        return { res, text, json };
    };

    const primary = await tryUpload(primaryUrl);
    if (primary.res.ok) {
        try { return { body: JSON.parse(primary.text), httpStatus: primary.res.status }; }
        catch { return { body: primary.text, httpStatus: primary.res.status }; }
    }

    if (primary.res.status !== 404) {
        const detail = primary.json?.message || primary.json?.details || primary.json?.error || primary.text.slice(0, 300);
        throw new Error(`Upload failed (HTTP ${primary.res.status}): ${detail}`);
    }

    const fallback = await tryUpload(legacyUrl);
    if (!fallback.res.ok) {
        const detail = fallback.json?.message || fallback.json?.details || fallback.json?.error || fallback.text.slice(0, 300);
        throw new Error(`Upload failed (HTTP ${fallback.res.status}): ${detail}`);
    }

    try { return { body: JSON.parse(fallback.text), httpStatus: fallback.res.status }; }
    catch { return { body: fallback.text, httpStatus: fallback.res.status }; }
}

// ── WebSocket server ──────────────────────────────────────────────────────────
let busy = false;

function sendJson(socket: WebSocket, payload: Record<string, unknown>): void {
    if (socket && socket.readyState === WebSocket.OPEN) {
        try { socket.send(JSON.stringify(payload)); } catch (e) {
            console.warn(`[BRIDGE] send failed: ${(e as Error).message}`);
        }
    }
}

function getScanners(): unknown[] {
    if (MOCK_MODE) {
        const name = SCANNER_NAME || 'HP ScanJet Pro 2600 f1 (mock)';
        return [{ id: 'mock-1', name, location: 'Reception computer', available: true, mock: true }];
    }
    try {
        const r: SpawnSyncReturns<Buffer> = spawnSync(NAPS2_PATH, ['list'], { stdio: 'pipe', timeout: 8000, encoding: 'buffer' });
        const lines = decodeOut(r.stdout).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const scanners = lines
            .map((line, i) => ({ id: `naps2-${i}`, name: line, available: true }))
            .filter((s) => !/^usage|^error|not found|command not found/i.test(String(s.name)));
        if (scanners.length) return scanners;
    } catch (e) {
        console.warn(`[BRIDGE] scanner discovery failed: ${(e as Error).message}`);
    }
    return [];
}

async function handleStartScan(socket: WebSocket, msg: Record<string, any>): Promise<void> {
    const deceasedId = String(msg?.deceasedId || '').trim();
    const apiBase = String(msg?.apiBase || 'http://localhost:5000/api/v1/restpoint').trim();
    if (!deceasedId) {
        sendJson(socket, { status: 'ERROR', message: 'Missing deceasedId. The web app must pass the deceased profile id.' });
        return;
    }

    busy = true;
    const format = String(msg?.format || 'pdf').toLowerCase();
    const fileName = sanitizeFilename(msg?.documentName || `Scan_${deceasedId.slice(0, 40)}_${timestampSuffix()}.pdf`);
    const output = path.join(SCAN_DIR, `scan-${Date.now()}-${Math.round(Math.random() * 1e6)}${extForFormat(format)}`);

    try {
        sendJson(socket, { status: 'SCANNING', progress: 5, message: 'Warming up the scanner…', mock: MOCK_MODE });

        // Beat for the browser to render the "Scanning…" state before the driver spins up.
        await new Promise((r) => setTimeout(r, 350));

        const pdfPath = await scanToPdf({
            output,
            resolution: msg?.resolution,
            colorMode: msg?.colorMode,
            duplex: msg?.duplex,
            pages: msg?.pages,
            source: msg?.source,
            format,
        });

        sendJson(socket, { status: 'SCANNING', progress: 100, message: 'Pages scanned — uploading to Restpoint documents…' });
        sendJson(socket, { status: 'UPLOADING', message: 'Uploading to the documents service…' });

        const { body: serverRes } = await uploadScannedDocument({
            apiBase,
            deceasedId,
            filePath: pdfPath,
            documentName: fileName,
            category: msg?.category || 'Scan',
            token: msg?.token,
            tenantSlug: msg?.tenantSlug,
            userId: msg?.userId,
            format,
        });

        const document = (serverRes?.success ? serverRes?.data : serverRes) || {};
        sendJson(socket, { status: 'COMPLETE', message: 'Document scanned and uploaded successfully!', document, server: serverRes });
        console.log(`[BRIDGE] ✔ scanned + uploaded: ${fileName} (deceased ${deceasedId})`);
    } catch (e) {
        const message = (e as Error).message || String(e);
        console.error(`[BRIDGE] scan failed for deceased ${deceasedId}: ${message}`);
        sendJson(socket, { status: 'ERROR', message });
    } finally {
        busy = false;
        try { if (fs.existsSync(output)) fs.unlinkSync(output); } catch { /* keep going */ }
    }
}

function handleMessage(socket: WebSocket, raw: unknown): void {
    let msg: Record<string, any>;
    try {
        // FIX: Ensure raw buffer is converted to string properly
        const rawStr = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw || '{}');
        msg = JSON.parse(rawStr);
    } catch {
        sendJson(socket, { status: 'ERROR', message: 'Invalid JSON payload.' });
        return;
    }

    switch (String(msg?.action || '').toUpperCase()) {
        case 'PING':
            sendJson(socket, {
                type: 'pong', status: 'OK', version: APP_VERSION,
                bridge: 'restpoint-scanner-bridge', mock: MOCK_MODE,
                scanner: SCANNER_NAME || null, busy, time: Date.now(),
            });
            return;

        case 'GET_SCANNERS':
            sendJson(socket, { status: 'OK', scanners: getScanners() });
            return;

        case 'START_SCAN':
            if (busy) {
                sendJson(socket, { status: 'ERROR', message: 'Another scan is already in progress. Wait for it to finish, then try again.' });
                return;
            }
            void handleStartScan(socket, msg);
            return;

        case 'SHUTDOWN':
            if (!ALLOW_SHUTDOWN) {
                sendJson(socket, { status: 'ERROR', message: 'SHUTDOWN is not enabled on this bridge.' });
                return;
            }
            console.log('[BRIDGE] shutdown requested — closing server.');
            sendJson(socket, { status: 'OK', message: 'bye' });
            setTimeout(() => { try { socket.close(1000, 'bye'); } catch { /* ignore */ } }, 120);
            setTimeout(() => { process.exit(0); }, 350);
            return;

        default:
            sendJson(socket, { status: 'ERROR', message: `Unknown action "${msg?.action}".` });
    }
}

const wss = new WebSocketServer({ host: BRIDGE_HOST, port: BRIDGE_PORT });

wss.on('connection', (socket: WebSocket, request: any) => {
    // (Optional) origin allow-list.
    const origin = (request && request.headers && request.headers.origin) || (request && request.origin) || '';
    if (ALLOWED_ORIGINS.length && origin && !ALLOWED_ORIGINS.includes(origin)) {
        console.warn(`[BRIDGE] rejecting connection from origin ${origin}`);
        socket.close(1008, 'Origin not allowed');
        return;
    }

    socket.on('message', (raw: unknown) => {
        try { handleMessage(socket, raw); }
        catch (e) { sendJson(socket, { status: 'ERROR', message: (e as Error).message || 'internal error' }); }
    });
    socket.on('error', (e: Error) => console.error(`[BRIDGE] socket error: ${e.message}`));
});

const shutdown = () => {
    console.log('[BRIDGE] stopping…');
    try { wss.close(); } catch { /* ignore */ }
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('══════════════════════════════════════════════════════════════');
console.log(`  Restpoint Scanner Bridge v${APP_VERSION}`);
console.log(`  listening   →  ws://${BRIDGE_HOST}:${BRIDGE_PORT}`);
console.log(`  mode        →  ${MOCK_MODE ? 'MOCK (no hardware)' : 'real scanner'}`);
console.log(`  scanner     →  ${SCANNER_NAME || 'auto-detect (NAPS2)'}`);
console.log(`  work dir    →  ${SCAN_DIR}`);
console.log('  To scan + upload send: { action:"START_SCAN", deceasedId, token, tenantSlug, apiBase }');
console.log('══════════════════════════════════════════════════════════════');

export { };