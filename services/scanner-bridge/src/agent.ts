
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { randomUUID, randomBytes } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';

const APP_VERSION = '1.0.0';

const truthy = (v?: string): boolean => /^(1|true|yes|on)$/i.test(String(v || '').trim());


(function loadEnv() {

  const candidates: string[] = [];

  // Per-user, writable, and it survives app upgrades.
  if (process.env.APPDATA) {
    candidates.push(path.join(process.env.APPDATA, 'Restpoint', 'ScannerBridge'));
  }
  if (process.env.LOCALAPPDATA) {
    candidates.push(path.join(process.env.LOCALAPPDATA, 'Restpoint', 'ScannerBridge'));
  }
  // Portable / USB-stick deployments that ship a .env next to the EXE.
  try {
    candidates.push(path.dirname(process.execPath));
  } catch { }
  // Dev fallback: `npm run dev` from the repo.
  candidates.push(process.cwd());

  const seen = new Set<string>();
  let loadedAny = false;
  for (const dir of candidates) {
    if (!dir || seen.has(dir)) continue;
    seen.add(dir);
    for (const name of ['.env.local', '.env']) {
      const p = path.join(dir, name);
      try {
        if (!fs.existsSync(p)) continue;
        for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
          const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)/);
          if (!m) continue;
          let v = m[2].trim();
          if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
          if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
          if (process.env[m[1]] === undefined) process.env[m[1]] = v;
        }
        loadedAny = true;
        console.log(`[BRIDGE] config loaded from ${p}`);
      } catch {}
    }
  }
  if (!loadedAny) console.log('[BRIDGE] no configuration file found - using defaults.');
})();

//  desktop app: persistent identity + single-instance guard

const DATA_DIR = process.env.APPDATA
  ? path.join(process.env.APPDATA, 'Restpoint', 'ScannerBridge')
  : path.join(process.cwd(), '.bridge-data');

/** Stable id for this installation, created on first run. */
function resolveBridgeId(): string {
  const file = path.join(DATA_DIR, 'bridge-id');
  try {
    if (fs.existsSync(file)) {
      const existing = fs.readFileSync(file, 'utf8').trim();
      if (existing) return existing;
    }
  } catch {  }

  const minted = randomBytes(16).toString('hex');
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, minted, 'utf8');
  } catch (e) {

    console.warn(`[BRIDGE] could not persist bridge id: ${(e as Error).message}`);
  }
  return minted;
}

const BRIDGE_ID = resolveBridgeId();

// ─ NAPS2 path discovery 

const NAPS2_CANDIDATES_WIN = [
  'NAPS2.Console.exe',   
  'NAPS2.exe',          
  'NAPS2Console.exe',
];
const NAPS2_SEARCH_DIRS_WIN = [
  'C:\\Program Files\\NAPS2',
  'C:\\Program Files (x86)\\NAPS2',
  process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs\\NAPS2') : '',
  'C:\\NAPS2',
  'C:\\Users\\Public\\Desktop',
];
const isWin = process.platform === 'win32';

/** First NAPS2 binary that exists insinull when there is none. */
function pickBinaryInDir(dir: string): string | null {
  for (const name of NAPS2_CANDIDATES_WIN) {
    const candidate = path.join(dir, name);
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    } catch { }
  }
  return null;
}

/*
 * Resolve the NAPS2 CLI this bridge 
 */
function findNaps2Binary(): string {
  const envRaw = String(process.env.NAPS2_PATH || '').trim();

  if (envRaw) {
    try {
      if (fs.existsSync(envRaw)) {
        const st = fs.statSync(envRaw);
        if (st.isFile()) {
          console.log(`[BRIDGE] NAPS2_PATH (file) -> ${envRaw}`);
          return envRaw;
        }
        if (st.isDirectory()) {
          const inside = pickBinaryInDir(envRaw);
          if (inside) {
            console.log(`[BRIDGE] NAPS2_PATH (folder) -> ${inside}`);
            return inside;
          }
          console.warn(`[BRIDGE] NAPS2_PATH folder "${envRaw}" has no known NAPS2 binary — using the folder as-is.`);
          return envRaw;
        }
      }
    } catch { 

    }

    // Allow NAPS2_PATH to omit the ".exe" extension on Windows.
    if (isWin && !/\.exe$/i.test(envRaw)) {
      const withExe = `${envRaw}.exe`;
      try {
        if (fs.existsSync(withExe) && fs.statSync(withExe).isFile()) {
          console.log(`[BRIDGE] NAPS2_PATH -> ${withExe}`);
          return withExe;
        }
      } catch { /* ignore */ }
    }

    console.warn(`[BRIDGE] NAPS2_PATH "${envRaw}" not found on disk — using it as-is (it must be on PATH).`);
    return envRaw;
  }

  if (isWin) {
    for (const dir of NAPS2_SEARCH_DIRS_WIN) {
      if (!dir) continue;
      try { if (!fs.existsSync(dir)) continue; } catch { continue; }
      const found = pickBinaryInDir(dir);
      if (found) {
        console.log(`[BRIDGE] auto-discovered NAPS2 at ${found}`);
        return found;
      }
    }
  }

  const fallback = isWin ? 'naps2.exe' : 'naps2';
  console.warn(`[BRIDGE] could not locate NAPS2 — falling back to "${fallback}" (it must be on PATH).`);
  return fallback;
}


const NAPS2_BIN = findNaps2Binary();
const NAPS2_PATH = NAPS2_BIN;
export const resolvedNaps2Path = NAPS2_BIN;
//  Network 
const BRIDGE_HOST = process.env.BRIDGE_HOST || '127.0.0.1'; // Bind locally for security
const BRIDGE_PORT = Number(process.env.BRIDGE_PORT || 8081);
const MOCK_MODE = truthy(process.env.MOCK_SCAN);
const ALLOW_SHUTDOWN = truthy(process.env.BRIDGE_ALLOW_SHUTDOWN);

//  Scanner setting
const SCANNER_NAME = (process.env.SCANNER_NAME || '').trim();
const DEFAULT_FORMAT = (process.env.SCANNER_DEFAULT_FORMAT || 'pdf').toLowerCase();
const DEFAULT_RESOLUTION = Number(process.env.SCANNER_DEFAULT_DPI || 300);
const DEFAULT_COLOR_MODE = (process.env.SCANNER_DEFAULT_COLOR_MODE || 'color').toLowerCase();
const DEFAULT_DUPLEX = truthy(process.env.SCANNER_DUPLEX);

const SCAN_COMMAND = (process.env.SCAN_COMMAND || '').trim();
const SCAN_COMMAND_EXTRA = (process.env.SCAN_COMMAND_EXTRA || '').trim();
const SCANNER_STDIO = process.env.SCANNER_STDIO === 'inherit' ? 'inherit' : 'pipe';
const SCAN_TIMEOUT_MS = Math.max(10000, Number(process.env.SCAN_TIMEOUT_MS || 120000));
//  Origin allow-list (fail-closed


//   BRIDGE_ALLOWED_ORIGINS=https://restpoint.co.ke,https://app.restpoint.co.ke
const DEFAULT_ALLOWED_ORIGINS = [
    'https://restpoint.co.ke',
    'https://www.restpoint.co.ke',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
];
const ALLOWED_ORIGINS = (() => {
    const configured = (process.env.BRIDGE_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
})();

//  Restpoint Cloud address used for grant verification 

const CLOUD_URL = String(
    process.env.BRIDGE_CLOUD_URL || 'https://restpoint.co.ke'
).replace(/\/+$/, '');

const GRANT_TOLERANCE_MS = 90_000;   // session outlives the 60s grant a little


const SCANNER_DRIVER = (process.env.SCANNER_DRIVER || (isWin ? 'wia' : '')).trim().toLowerCase();
const SCANNER_SOURCE = (process.env.SCANNER_SOURCE || (DEFAULT_DUPLEX ? 'duplex' : '')).trim().toLowerCase();
/** Optional named NAPS2 profile; when empty the bridge uses --noprofile (deterministic flags). */
const SCANNER_PROFILE = (process.env.SCANNER_PROFILE || '').trim();
/** When SCANNER_NAME is empty, bind to the first device the driver reports. */
const SCANNER_AUTO_DETECT = process.env.SCANNER_AUTO_DETECT === undefined ? true : truthy(process.env.SCANNER_AUTO_DETECT);
/** Drivers probed by GET_SCANNERS (escl does network discovery — opt in only). */
const SCANNER_DRIVERS = (process.env.SCANNER_DRIVERS || (SCANNER_DRIVER ? `${SCANNER_DRIVER},twain` : 'wia,twain'))
  .split(',').map((d) => d.trim().toLowerCase()).filter((d) => /^(wia|twain|escl|sane|apple)$/.test(d));

/** Map the app'svalues (color|gray|bw). */
function bitDepthFor(mode?: string): string {
  const m = String(mode || '').toLowerCase();
  if (m === 'gray' || m === 'grey' || m === 'grayscale' || m === 'greyscale') return 'gray';
  if (m === 'bw' || m === 'b&w' || m === 'mono' || m === 'monochrome' || m === 'blackwhite' || m === 'black-and-white') return 'bw';
  return 'color';
}

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

// helper
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
        '{NAPS2}': '"' + NAPS2_BIN + '"',
        '{OUTPUT}': `"${o.output}"`,
        '{FORMAT}': o.format || DEFAULT_FORMAT,
        '{RESOLUTION}': String(o.resolution || DEFAULT_RESOLUTION),
        '{MODE}': o.colorMode ? ('--bitdepth ' + bitDepthFor(o.colorMode)) : '',
        '{DUPLEX}': o.duplex ? '--source duplex' : '',
        '{SOURCE}': (o.source && o.source !== 'auto') ? ('--source ' + o.source) : '',
        '{SCANNER}': SCANNER_NAME ? ('--device "' + SCANNER_NAME + '"') : '',
        '{DRIVER}': SCANNER_DRIVER ? ('--driver ' + SCANNER_DRIVER) : '',
    };
    let cmd = SCAN_COMMAND;
    for (const [k, v] of Object.entries(map)) {
        cmd = cmd.split(k).join(v); // Safe replace all
    }
    return cmd;
}

/**
 * Default NAPS2 invocation. NAPS2 6.x-8.x has NO "scan" verb - it is purely
 * flag driven:
 *   -o <file> --dpi N --bitdepth color|gray|bw [--source glass|feeder|duplex]
 *   [--driver wia] [--device "name"] [--noprofile | -p profile] [-n pages] -v -f
 */
function defaultScanArgv(o: ScanOptions): string[] {
    const args: string[] = [NAPS2_BIN, '-o', o.output];
    args.push('--dpi', String(o.resolution || DEFAULT_RESOLUTION));
    args.push('--bitdepth', bitDepthFor(o.colorMode || DEFAULT_COLOR_MODE));

    // Paper source: the per-scan override wins, then the env default, then duplex.
    const source = String(o.source || SCANNER_SOURCE || (o.duplex ? 'duplex' : '')).toLowerCase();
    if (source && source !== 'auto') args.push('--source', source);

    // NAPS2 8.x requires an explicit driver before a device may be selected.
    if (SCANNER_DRIVER) args.push('--driver', SCANNER_DRIVER);
    const device = resolveScannerName();
    if (device) args.push('--device', device);

    if (SCANNER_PROFILE) args.push('-p', SCANNER_PROFILE);
    else args.push('--noprofile'); // deterministic flags instead of the GUI's last-used profile

    if (o.pages && o.pages > 1) args.push('-n', String(o.pages));
    if (SCAN_COMMAND_EXTRA) args.push(...splitShell(SCAN_COMMAND_EXTRA));
    args.push('-v', '-f'); // verbose progress + overwrite a leftover temp file
    return args;
}

function buildScanArgv(o: ScanOptions): string[] {
    if (SCAN_COMMAND) return splitShell(substituteTokens(o));
    return defaultScanArgv(o);
}

/** Run the scanner CLI synchronously; success is validated by the produced file. */
function execScanner(o: ScanOptions): { ok: boolean; stderr: string; error?: string } {
    // Fail fast — before device discovery, which can take a few seconds — with an
    // actionable message when the NAPS2 binary cannot be located at all. Custom
    // SCAN_COMMANDs may drive a different tool, so they are left alone.
    if (!SCAN_COMMAND) {
        const looksLikePath = NAPS2_BIN.includes('/') || NAPS2_BIN.includes('\\');
        if (looksLikePath && !fs.existsSync(NAPS2_BIN)) {
            return {
                ok: false,
                stderr: '',
                error: 'NAPS2 was not found at ' + JSON.stringify(NAPS2_BIN) + ' - set NAPS2_PATH to NAPS2.Console.exe or to its install folder (e.g. C:\\Program Files\\NAPS2).',
            };
        }
    }

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
            // Surface NAPS2's own diagnostic (it prints e.g. "The selected scanner
            // could not be found." on stdout) instead of a bare exit code.
            const lines = (stdout + '\n' + stderr).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            const noise = /^(usage|naps2\.console|at least one of)/i;
            const detail = lines.filter((l) => !noise.test(l)).pop() || '';
            return { ok: false, stderr, error: detail ? ('NAPS2: ' + detail) : ('Scanner command exited with code ' + r.status + '.') };
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

/** Device names NAPS2 reports for `driver` (empty array when there are none). */
function listDevices(driver: string): string[] {
    const names: string[] = [];
    try {
        const r: SpawnSyncReturns<Buffer> = spawnSync(NAPS2_BIN, ['--driver', driver, '--listdevices'], {
            stdio: 'pipe', timeout: 8000, encoding: 'buffer'
        });
        const out = decodeOut(r.stdout) + decodeOut(r.stderr);
        for (const raw of out.split(/\r?\n/)) {
            const line = raw.trim();
            if (!line) continue;
            if (/^(usage|error|the --driver|at least one|no device|unknown)/i.test(line)) continue;
            const name = line.replace(/^(wia|twain|escl|sane|apple)\s*:\s*/i, '').trim();
            if (name) names.push(name);
        }
    } catch (e) {
        console.warn('[BRIDGE] ' + driver + ' device discovery failed: ' + (e as Error).message);
    }
    return names;
}

let _scannerName: string | null = null;
/**
 * The device to hand NAPS2 as --device. NAPS2 8.x refuses to scan without one
 * ("No device was specified."), so unless SCANNER_NAME pins a device we bind to
 * the first one the driver reports (cached after the first probe).
 */
function resolveScannerName(): string {
    if (SCANNER_NAME) return SCANNER_NAME;
    if (!SCANNER_AUTO_DETECT) return '';
    if (_scannerName !== null) return _scannerName;
    _scannerName = '';
    for (const driver of SCANNER_DRIVERS) {
        const devices = listDevices(driver);
        if (devices.length) {
            _scannerName = devices[0];
            console.log('[BRIDGE] auto-detected scanner: ' + _scannerName + ' (' + driver + ')');
            break;
        }
    }
    if (!_scannerName) console.warn('[BRIDGE] no scanner device detected - connect the scanner or set SCANNER_NAME.');
    return _scannerName;
}

/**
 * Ask NAPS2 for the connected devices. NAPS2 6+/8.x has no "list" verb: use
 * --listdevices, which only works together with an explicit --driver. eSCL does
 * network discovery and can hang, so it is opt-in via SCANNER_DRIVERS.
 */
function getScanners(): unknown[] {
    if (MOCK_MODE) {
        const name = SCANNER_NAME || 'HP ScanJet Pro 2600 f1 (mock)';
        return [{ id: 'mock-1', name, location: 'Reception computer', available: true, mock: true }];
    }

    const seen = new Set<string>();
    const scanners: Array<Record<string, unknown>> = [];

    for (const driver of SCANNER_DRIVERS) {
        for (const name of listDevices(driver)) {
            const key = name.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            scanners.push({ id: driver + '-' + scanners.length, name, driver, available: true });
        }
    }
    if (!scanners.length) console.warn('[BRIDGE] no scanner devices found - check the USB/network connection and SCANNER_DRIVER.');
    return scanners;
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


// ── cloud-issued scan grant ────────────────────────────────────────────────
// Authorised sessions, keyed by the socket that completed the HELLO handshake.
// A scan is only ever run for a socket that holds one of these, which is what
// stops a local process (or a second user on the reception PC) from driving the
// scanner simply by opening a socket and sending START_SCAN.
interface BridgeSession {
    id: string;
    tenant: string;
    subject: string;
    expiresAt: number;
}

const sessions = new Map<WebSocket, BridgeSession>();

function sessionFor(socket: WebSocket): BridgeSession | null {
    const s = sessions.get(socket);
    if (!s) return null;
    if (s.expiresAt <= Date.now()) { sessions.delete(socket); return null; }
    return s;
}

/**
 * Ask the Restpoint cloud whether a scan grant is genuine.
 * Always fails closed: any network, parsing or transport problem is a "no".
 */
async function verifyScanGrant(grant: string): Promise<{ ok: boolean; reason: string; data?: any }> {
    const fetchFn = (typeof fetch !== 'undefined' ? fetch : null) as any;
    if (!fetchFn) return { ok: false, reason: 'this bridge needs Node 18+ to reach Restpoint' };

    const url = `${CLOUD_URL}/bridge/verify-grant`;
    try {
        const res = await fetchFn(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grant }),
            signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) return { ok: false, reason: `cloud returned HTTP ${res.status}` };
        const json = await res.json();
        const data = json?.data || json;
        if (!data?.valid) return { ok: false, reason: String(data?.reason || 'grant rejected') };
        return { ok: true, reason: 'granted', data };
    } catch (e) {
        // Offline / DNS / TLS problems must NOT silently authorise a scan.
        return { ok: false, reason: `could not reach Restpoint (${(e as Error).message})` };
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
        case 'HELLO':
            void (async () => {
                const grant = String(msg?.grant || '').trim();
                if (!grant) {
                    sendJson(socket, { status: 'ERROR', type: 'hello_rejected', message: 'Missing scan grant. Sign in to Restpoint first.' });
                    return;
                }
                sendJson(socket, { status: 'AUTHORISING', type: 'hello_pending', message: 'Checking with Restpoint…' });
                const verdict = await verifyScanGrant(grant);
                if (!verdict.ok) {
                    console.warn(`[BRIDGE] HELLO rejected: ${verdict.reason}`);
                    sendJson(socket, {
                        status: 'ERROR', type: 'hello_rejected', code: 'GRANT_REJECTED',
                        reason: verdict.reason, bridgeId: BRIDGE_ID,
                        message: 'This bridge could not confirm your Restpoint session. Please sign in again.',
                    });
                    try { socket.close(1008, 'grant rejected'); } catch { /* ignore */ }
                    return;
                }
                const session: BridgeSession = {
                    id: randomUUID(),
                    tenant: String(verdict.data?.tenant || 'system_shared'),
                    subject: String(verdict.data?.subject || 'unknown'),
                    expiresAt: Date.now() + GRANT_TOLERANCE_MS,
                };
                sessions.set(socket, session);
                console.log(`[BRIDGE] authorised ${session.subject} @ ${session.tenant} on ${BRIDGE_ID.slice(0, 8)}`);
                sendJson(socket, {
                    status: 'OK', type: 'hello_ok', bridge: 'restpoint-scanner-bridge',
                    version: APP_VERSION, bridgeId: BRIDGE_ID,
                    sessionId: session.id, tenant: session.tenant,
                    expiresAt: session.expiresAt, time: Date.now(),
                });
            })();
            return;

        case 'PING':
            sendJson(socket, {
                type: 'pong', status: 'OK', version: APP_VERSION,
                bridge: 'restpoint-scanner-bridge', bridgeId: BRIDGE_ID,
                // Lets the app show "bridge found" before the user has signed in,
                // and tell that state apart from "authorised to scan".
                authorised: !!sessionFor(socket), mock: MOCK_MODE,
                scanner: SCANNER_NAME || null, busy, time: Date.now(),
                naps2: resolvedNaps2Path, driver: SCANNER_DRIVER || null, device: _scannerName || null,
            });
            return;

        case 'GET_SCANNERS':
            sendJson(socket, { status: 'OK', scanners: getScanners() });
            return;

        case 'START_SCAN':
            // Authorisation gate. Everything before this point only ever reads
            // local hardware metadata; this is the first action with a physical
            // or data-security consequence, so it must be cloud-authorised.
            const session = sessionFor(socket);
            if (!session) {
                sendJson(socket, {
                    status: 'ERROR', code: 'NOT_AUTHORISED', bridgeId: BRIDGE_ID,
                    message: 'This bridge is not authorised. Sign in to Restpoint and reconnect.',
                });
                return;
            }
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

// Origin enforcement happens in verifyClient, i.e. BEFORE the WebSocket upgrade
// completes. Doing it in the 'connection' handler (as this used to) was too
// late: the handshake had already succeeded, so a hostile page got a live,
// usable socket and was only disconnected a moment later — measured as
// "ACCEPTED" by the test that drove this fix. verifyClient returning a non-true
// value aborts the upgrade outright (HTTP 401), so the page never obtains a
// socket it could ever send START_SCAN on.
//
// A client that sends NO Origin is not a browser, so it cannot have been
// navigated to by a hostile page; it is allowed through, which keeps the
// agent's own diagnostics and the e2e/mock tests working. The single-flight
// `busy` lock and the upload auth remain the guards on that path.
const wss = new WebSocketServer({
    host: BRIDGE_HOST,
    port: BRIDGE_PORT,
    verifyClient: (info: any) => {
        const origin = (info && info.origin)
            || (info && info.req && info.req.headers && info.req.headers.origin)
            || '';
        if (origin && !ALLOWED_ORIGINS.includes(origin)) {
            console.warn(`[BRIDGE] rejected upgrade from disallowed origin: ${origin}`);
            return false;
        }
        return true;
    },
});

wss.on('connection', (socket: WebSocket) => {
    socket.on('message', (raw: unknown) => {
        try { handleMessage(socket, raw); }
        catch (e) { sendJson(socket, { status: 'ERROR', message: (e as Error).message || 'internal error' }); }
    });
    socket.on('error', (e: Error) => console.error(`[BRIDGE] socket error: ${e.message}`));
    socket.on('close', () => { sessions.delete(socket); });
});

// Single-instance guard for the desktop app. A second copy (double-click, or an
// auto-start entry firing alongside a manual launch) must not crash with a raw
// EADDRINUSE stack trace the user cannot act on - the first instance is already
// doing the job, so we exit cleanly.
wss.on('error', (e: any) => {
    if (e && e.code === 'EADDRINUSE') {
        console.log(`[BRIDGE] port ${BRIDGE_PORT} is already in use - another copy is probably already running. Exiting.`);
        process.exit(0);
    }
    console.error(`[BRIDGE] server error: ${e?.message || e}`);
    process.exit(1);
});

const shutdown = () => {
    console.log('[BRIDGE] stopping…');
    try { wss.close(); } catch { /* ignore */ }
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Resolve the device in the background so the first scan (and the PING payload)
// already knows which scanner to use.
if (!MOCK_MODE) setTimeout(() => { try { resolveScannerName(); } catch { /* logged inside */ } }, 750);
console.log('══════════════════════════════════════════════════════════════');
console.log(`  Restpoint Scanner Bridge v${APP_VERSION}`);
console.log(`  listening   →  ws://${BRIDGE_HOST}:${BRIDGE_PORT}`);
console.log(`  mode        →  ${MOCK_MODE ? 'MOCK (no hardware)' : 'real scanner'}`);
console.log(`  naps2       →  ${resolvedNaps2Path}`);
if (!MOCK_MODE && !fs.existsSync(resolvedNaps2Path)) {
    console.warn(`  ⚠  ${resolvedNaps2Path} does not exist — set NAPS2_PATH to NAPS2.Console.exe`);
}
console.log(`  scanner     →  ${SCANNER_NAME || 'auto-detect'}`);
console.log(`  driver      →  ${SCANNER_DRIVER || 'auto'}`);
console.log(`  work dir    →  ${SCAN_DIR}`);
console.log(`  origins     →  ${ALLOWED_ORIGINS.join(', ')}`);
console.log(`  cloud       →  ${CLOUD_URL}`);
console.log(`  bridge id   →  ${BRIDGE_ID}`);
console.log(`  data dir    →  ${DATA_DIR}`);
console.log('  Scan flow: HELLO {grant} → START_SCAN {sessionId, deceasedId, token}');
console.log('  To scan + upload send: { action:"START_SCAN", deceasedId, token, tenantSlug, apiBase }');
console.log('══════════════════════════════════════════════════════════════');
export { };