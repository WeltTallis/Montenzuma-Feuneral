
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
const isMac = process.platform === 'darwin';

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
const ALLOW_SHUTDOWN = truthy(process.env.BRIDGE_ALLOW_SHUTDOWN);
const BRIDGE_HOST = process.env.BRIDGE_HOST || '127.0.0.1'; 
const BRIDGE_PORT = Number(process.env.BRIDGE_PORT || 8081);
const MOCK_MODE = truthy(process.env.MOCK_SCAN);

//  Scanner setting
const DEFAULT_COLOR_MODE = (process.env.SCANNER_DEFAULT_COLOR_MODE || 'color').toLowerCase();
const SCAN_TIMEOUT_MS = Math.max(10000, Number(process.env.SCAN_TIMEOUT_MS || 120000));
const DEFAULT_FORMAT = (process.env.SCANNER_DEFAULT_FORMAT || 'pdf').toLowerCase();
const SCANNER_STDIO = process.env.SCANNER_STDIO === 'inherit' ? 'inherit' : 'pipe';
const DEFAULT_RESOLUTION = Number(process.env.SCANNER_DEFAULT_DPI || 300);
const SCANNER_PAGE_SIZE = (process.env.SCANNER_PAGE_SIZE || 'a4').trim().toLowerCase();
const SCAN_COMMAND_EXTRA = (process.env.SCAN_COMMAND_EXTRA || '').trim();
const SCANNER_NAME = (process.env.SCANNER_NAME || '').trim();
const SCAN_COMMAND = (process.env.SCAN_COMMAND || '').trim();
const PRINT_DUPLEX = truthy(process.env.PRINT_DUPLEX);
const DEFAULT_DUPLEX = truthy(process.env.SCANNER_DUPLEX);







// ── Printer settings ────────────────────────────────────────────────────────
// The same agent that drives the scanner also prints: clicking Print in
// Restpoint sends the document here and the bridge puts it on paper silently,
// with no system print dialog. Printers are whatever the reception OS already
// knows about - USB, Wi-Fi/TCP-IP, Bluetooth (BTHENUM/WSD) or virtual - so the
// web app can list them and pick one without any extra driver work.
const PRINT_COMMAND = (process.env.PRINT_COMMAND || '').trim();
const PRINTER_NAME = (process.env.PRINTER_NAME || '').trim();
const PRINTER_TIMEOUT_MS = Math.max(10000, Number(process.env.PRINTER_TIMEOUT_MS || 60000));
/** Largest document the bridge will accept inline (base64) or download, in bytes. */
const PRINT_MAX_BYTES = Math.max(1024, Number(process.env.PRINT_MAX_BYTES || 25 * 1024 * 1024));
/** Silent print tool for PDFs (SumatraPDF). Auto-discovered on Windows when unset. */
const SUMATRA_PATH = (process.env.SUMATRA_PATH || '').trim();
/** When 0 the bridge refuses PRINT/CONNECT_PRINTER entirely (scan-only bridge). */
const PRINTING_ENABLED = process.env.PRINTING_ENABLED === undefined ? true : truthy(process.env.PRINTING_ENABLED);
/** Virtual printers (Microsoft Print to PDF, OneNote, …) are hidden unless asked for. */
const PRINTER_INCLUDE_VIRTUAL = truthy(process.env.PRINTER_INCLUDE_VIRTUAL);
const DEFAULT_COPIES = Math.max(1, Number(process.env.PRINT_COPIES || 1));

const PRINT_MOCK = truthy(process.env.MOCK_PRINT) || MOCK_MODE;
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

const GRANT_TOLERANCE_MS = 10 * 60_000;


const DEFAULT_SCANNER_DRIVER = isWin ? 'wia' : isMac ? 'apple' : 'sane';
const SCANNER_DRIVER = (process.env.SCANNER_DRIVER || DEFAULT_SCANNER_DRIVER).trim().toLowerCase();
const SCANNER_SOURCE = (process.env.SCANNER_SOURCE || (DEFAULT_DUPLEX ? 'duplex' : '')).trim().toLowerCase();
/** Optional named NAPS2 profile; when empty the bridge uses --noprofile (deterministic flags). */
const SCANNER_PROFILE = (process.env.SCANNER_PROFILE || '').trim();
/** When SCANNER_NAME is empty, bind to the first device the driver reports. */
const SCANNER_AUTO_DETECT = process.env.SCANNER_AUTO_DETECT === undefined ? true : truthy(process.env.SCANNER_AUTO_DETECT);
/** Drivers probed by GET_SCANNERS (escl does network discovery — opt in only). */
const DEFAULT_SCANNER_DRIVERS = isWin
    ? [SCANNER_DRIVER, SCANNER_DRIVER === 'wia' ? 'twain' : 'wia'].join(',')
    : SCANNER_DRIVER;
const SCANNER_DRIVERS = (process.env.SCANNER_DRIVERS || DEFAULT_SCANNER_DRIVERS)
  .split(',').map((d) => d.trim().toLowerCase()).filter((d, i, all) => /^(wia|twain|escl|sane|apple)$/.test(d) && all.indexOf(d) === i);

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
/** Printed documents are spooled here and deleted once handed to the queue. */
const PRINT_DIR = ensureDir(path.join(SCAN_DIR, 'print'));

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
        '{PAGESIZE}': SCANNER_PAGE_SIZE ? ('--pagesize ' + SCANNER_PAGE_SIZE) : '',
        '{MODE}': o.colorMode ? ('--bitdepth ' + bitDepthFor(o.colorMode)) : '',
        '{DUPLEX}': o.duplex ? '--source duplex' : '',
        '{SOURCE}': (o.source && o.source !== 'auto') ? ('--source ' + o.source) : '',
        '{SCANNER}': resolveScannerName() ? ('--device "' + resolveScannerName() + '"') : '',
        '{DRIVER}': resolveScannerDriver() ? ('--driver ' + resolveScannerDriver()) : '',
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
    if (SCANNER_PAGE_SIZE) args.push('--pagesize', SCANNER_PAGE_SIZE);

    // Paper source: the per-scan override wins, then the env default, then duplex.
    const source = String(o.source || SCANNER_SOURCE || (o.duplex ? 'duplex' : '')).toLowerCase();
    if (source && source !== 'auto') args.push('--source', source);

    // NAPS2 8.x requires an explicit driver before a devic
    const device = resolveScannerName();
    const driver = resolveScannerDriver();
    if (driver) args.push('--driver', driver);
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
    bridgeGrant?: string;
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
    if (ctx.bridgeGrant) headers['X-Bridge-Grant'] = ctx.bridgeGrant;
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

// ── printers: discovery (USB / Wi-Fi / Bluetooth / virtual) ─────────────────
// Printers are never "connected" by the bridge: they are whatever the reception
// OS already knows about. Windows exposes every installed queue - USB, TCP/IP
// (Wi-Fi), Bluetooth (BTHENUM) and WSD - through the printing subsystem, and
// macOS/Linux through CUPS. We only read that inventory so Restpoint can show
// the same list the receptionist already sees in their system settings, and so
// the bridge knows the default printer to use when the web app does not name one.

/** PowerShell snippet: every installed printer queue with how it is connected. */
const PS_LIST_PRINTERS = [
    '$ErrorActionPreference = "Stop"',
    '$out = @()',
    '$def = $null',
    'try { $def = (Get-CimInstance Win32_Printer | Where-Object { $_.Default -eq $true } | Select-Object -First 1).Name } catch {}',
    'Get-CimInstance Win32_Printer | ForEach-Object {',
    '  $out += [PSCustomObject]@{',
    '    name = $_.Name',
    '    driver = $_.DriverName',
    '    port = $_.PortName',
    '    default = ($_.Name -eq $def)',
    '    status = $_.PrinterStatus',
    '    offline = [bool]$_.WorkOffline',
    '    network = [bool]$_.Network',
    '  }',
    '}',
    '$out | ConvertTo-Json -Compress -Depth 3',
].join('; ');

/**
 * PowerShell snippet: printers/drivers Windows has SEEN but has not installed
 * yet. This is how a Bluetooth or Wi-Fi Direct printer that has never been
 * printed from shows up, which is exactly the case where a one-click
 * "Add printer" in Restpoint saves the receptionist a trip to Settings.
 */
const PS_DISCOVER_PRINTERS = [
    '$ErrorActionPreference = "SilentlyContinue"',
    '$out = @()',
    'Get-PnpDevice -PresentOnly | Where-Object { $_.Class -eq "Printer" -or $_.Class -eq "PrintQueue" } | ForEach-Object {',
    '  $out += [PSCustomObject]@{ name = $_.FriendlyName; instanceId = $_.InstanceId; status = $_.Status }',
    '}',
    '$out | ConvertTo-Json -Compress -Depth 3',
].join('; ');

/**
 * Turn a Windows port name into the transport the printer hangs off:
 *   USB001 → usb, WSD-… / IP_192.168.1.20 → wifi, BTHENUM\{…} → bluetooth,
 *   FILE: / PORTPROMPT: → virtual.
 * Unknown ports are reported as "other" rather than guessed at.
 */
function connectionFromPort(port: string, name = ''): string {
    const p = String(port || '').trim().toUpperCase();
    const n = String(name || '').toUpperCase();
    if (/^BTH/.test(p) || p.startsWith('BTHENUM') || /BLUETOOTH|BTH/.test(n)) return 'bluetooth';
    if (/^USB/.test(p) || /^USB#/.test(p)) return 'usb';
    if (/^WSD|^IP_|WSDPRINT|^TCP/.test(p)) return 'wifi';
    if (/^LPT/.test(p) || /^COM/.test(p)) return 'serial';
    if (/^(FILE|PORTPROMPT|NUL):/.test(p)) return 'virtual';
    // A host name or bare IP in the port means a TCP/IP queue (Wi-Fi/Ethernet).
    if (/^\d{1,3}(\.\d{1,3}){3}/.test(p) || /[A-Z0-9-]+\.(LOCAL|LAN|HOME|INTERNAL)$/.test(p)) return 'wifi';
    if (/^(ONE|IP|HP|SAMSUNG|CANON|BROTHER|XEROX|KYOCERA|EPSON|RICOH|SHARP|LEXMARK|DELL)/.test(p)) return 'wifi';
    return 'other';
}

/** Virtual queues are software, not paper - used to print to a PDF. */
function isVirtualPrinter(name: string, driver: string): boolean {
    return /microsoft print to pdf|print to file|onenote|microsoft xps|pdfcreator|pdf24|bullzip|green print|print to imagefox/i.test(
        `${name || ''} ${driver || ''}`,
    );
}

/** Run a PowerShell snippet and return stdout, or '' when PowerShell is unusable. */
function runPowerShell(script: string, timeoutMs = 10000): string {
    if (!isWin) return '';
    try {
        const r: SpawnSyncReturns<Buffer> = spawnSync(
            'powershell.exe',
            ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
            { stdio: 'pipe', timeout: timeoutMs, encoding: 'buffer', windowsHide: true },
        );
        return decodeOut(r.stdout);
    } catch (e) {
        console.warn('[BRIDGE] PowerShell failed: ' + (e as Error).message);
        return '';
    }
}

/** Parse whatever PowerShell's ConvertTo-Json produced (object, or [object]). */
function parsePsJson<T = any>(raw: string): T[] {
    const text = String(raw || '').trim();
    if (!text || text === 'null') return [];
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return [];
    }
}
/** Run a CLI and return stdout+stderr, never throwing (used for the CUPS tools). */
function runCli(bin: string, args: string[], timeoutMs = 10000): string {
    try {
        const r: SpawnSyncReturns<Buffer> = spawnSync(bin, args, {
            stdio: 'pipe',
            timeout: timeoutMs,
            encoding: 'buffer',
        });
        return decodeOut(r.stdout) + decodeOut(r.stderr);
    } catch {
        return '';
    }
}

/** Installed printers on macOS/Linux, from CUPS (`lpstat`). */
function listPrintersCups(): PrinterRecord[] {
    const printers: PrinterRecord[] = [];
    const seen = new Set<string>();

    // `lpstat -p -d` prints "printer <name> is idle.  (accepting jobs...)" plus
    // "system default printer: <name>", so one call gives the whole list.
    const raw = runCli('lpstat', ['-p', '-d']);
    let defaultName = '';
    for (const line of raw.split(/\r?\n/)) {
        const def = line.match(/system default printer:\s*(.+)$/i);
        if (def) { defaultName = def[1].trim(); continue; }
        const m = line.match(/^printer\s+(.+?)\s+is\s/i);
        if (!m) continue;
        const name = m[1].trim();
        if (!name || seen.has(name)) continue;
        seen.add(name);
        printers.push({ name, driver: '', port: '', connection: 'other', isDefault: name === defaultName, virtual: false });
    }

    // `lpstat -v` maps each queue to its backend, which is how we tell Wi-Fi
    // (dnssd://, mdns://, socket://host) from USB (usb://…, direct).
    const backends = runCli('lpstat', ['-v']);
    for (const p of printers) {
        const line = backends.split(/\r?\n/).find((l) => l.startsWith(p.name + ' '));
        const uri = (line || '').slice(p.name.length).trim();
        p.port = uri;
        if (/^(dnssd|mdns):\/\//i.test(uri)) p.connection = 'wifi';
        else if (/^(socket|lpd|http|ipp|ipps):\/\//i.test(uri)) p.connection = 'network';
        else if (/^bluetooth:\/\//i.test(uri)) p.connection = 'bluetooth';
        else if (/^usb:\/\/|^direct/i.test(uri)) p.connection = 'usb';
    }
    return printers;
}

/** Installed printers on Windows, from Win32_Printer. */
function listPrintersWindows(): PrinterRecord[] {
    return parsePsJson<any>(runPowerShell(PS_LIST_PRINTERS, 15000))
        .map((p) => {
            const name = String(p.name || '').trim();
            const driver = String(p.driver || '');
            const port = String(p.port || '');
            const virtual = isVirtualPrinter(name, driver);
            return {
                name,
                driver,
                port,
                connection: virtual ? 'virtual' : connectionFromPort(port, name),
                isDefault: !!p.default,
                offline: !!p.offline,
                virtual,
            };
        })
        .filter((p) => p.name);
}

/**
 * A printer the bridge can send jobs to. `connection` tells the web app how it
 * is attached so the UI can label it (Wi-Fi / Bluetooth / USB / Network) and
 * explain what to check when a job fails.
 */
interface PrinterRecord {
    name: string;
    driver: string;
    port: string;
    connection: string;
    isDefault: boolean;
    offline?: boolean;
    virtual: boolean;
    mock?: boolean;
}

/** A printer the OS has seen on the network/Bluetooth but has no queue for yet. */
interface DiscoveredPrinter {
    name: string;
    connection: string;
    instanceId: string;
    installed: boolean;
}

let _printersCache: { at: number; list: PrinterRecord[] } | null = null;

/**
 * Every printer the bridge can print to. Cached for 15s: the web app asks for
 * this list each time someone opens the print dialog and PowerShell/CUPS
 * enumeration costs a few hundred milliseconds.
 */
function getPrinters(): PrinterRecord[] {
    const now = Date.now();
    if (_printersCache && now - _printersCache.at < 15000) return _printersCache.list;

    let list: PrinterRecord[];
    if (PRINT_MOCK) {
        list = [{
            name: 'Mock Office Printer', driver: 'mock', port: 'mock',
            connection: 'other', isDefault: true, virtual: false, mock: true,
        }];
    } else {
        try {
            list = isWin ? listPrintersWindows() : listPrintersCups();
        } catch (e) {
            console.warn('[BRIDGE] printer enumeration failed: ' + (e as Error).message);
            list = [];
        }
        if (!list.length) console.warn('[BRIDGE] no printers found - add the printer in Windows Settings first.');
    }

    // "Microsoft Print to PDF" and friends are useful for testing but are not
    // what a receptionist means by "print", so they stay hidden by default.
    if (!PRINTER_INCLUDE_VIRTUAL) list = list.filter((p) => !p.virtual);
    _printersCache = { at: now, list };
    return list;
}

/**
 * Printers the OS can see but that have no queue yet. This is how a Bluetooth
 * or Wi-Fi Direct printer that has never been printed from appears, which is
 * the case where a one-click "Connect printer" in Restpoint saves the trip to
 * Windows Settings. Best-effort: an empty list is a perfectly normal answer.
 */
function discoverPrinters(): DiscoveredPrinter[] {
    if (PRINT_MOCK) {
        return [{ name: 'Mock Wi-Fi Printer', connection: 'wifi', instanceId: 'mock-wifi', installed: false }];
    }
    if (!isWin) return [];
    try {
        const installed = getPrinters().map((p) => p.name.toLowerCase());
        const out: DiscoveredPrinter[] = [];
        const seen = new Set<string>();
        for (const d of parsePsJson<any>(runPowerShell(PS_DISCOVER_PRINTERS, 15000))) {
            const name = String(d.name || '').trim();
            if (!name || seen.has(name)) continue;
            seen.add(name);
            // Already installed queues are not "new" - never offer to add those.
            const lower = name.toLowerCase();
            if (installed.some((n) => n === lower || n.includes(lower) || lower.includes(n))) continue;
            out.push({
                name,
                connection: connectionFromPort(String(d.instanceId || ''), name),
                instanceId: String(d.instanceId || '').trim(),
                installed: false,
            });
        }
        return out;
    } catch (e) {
        console.warn('[BRIDGE] printer discovery failed: ' + (e as Error).message);
        return [];
    }
}

/**
 * The queue a print job should go to: the one the web app named (matched
 * loosely, because the browser and Windows disagree about casing and spacing),
 * else PRINTER_NAME, else the system default.
 */
function resolvePrinterName(requested?: string): string {
    const printers = getPrinters();
    const wanted = String(requested || '').trim();
    const find = (needle: string) =>
        printers.find((p) => p.name.toLowerCase() === needle.toLowerCase()) ||
        printers.find((p) => p.name.toLowerCase().includes(needle.toLowerCase())) ||
        printers.find((p) => needle.toLowerCase().includes(p.name.toLowerCase()));

    if (wanted) {
        const hit = find(wanted);
        if (hit) return hit.name;
        console.warn(`[BRIDGE] requested printer "${wanted}" is not installed - using the default instead.`);
    }
    if (PRINTER_NAME) {
        const hit = find(PRINTER_NAME);
        if (hit) return hit.name;
        console.warn(`[BRIDGE] PRINTER_NAME "${PRINTER_NAME}" is not installed - using the default instead.`);
    }
    const fallback = printers.find((p) => p.isDefault) || printers.find((p) => !p.virtual) || printers[0];
    return fallback ? fallback.name : '';
}

// ── printing: silent, no system dialog ───────────────────────────────────────
// "Silent" is the whole point: the receptionist clicks Print in Restpoint and
// paper comes out. Windows has no built-in silent PDF print verb, so the bridge
// tries, in order, the mechanisms that need no user interaction at all:
//   1. SumatraPDF -print-to  (purpose-built, honours copies/duplex)
//   2. the "printto" shell verb (uses whichever app the OS associates)
//   3. .NET System.Drawing for images / Out-Printer for text (always present)
// On macOS/Linux, CUPS' own `lp` does the whole job.

interface PrintOptions {
    printer: string;
    copies: number;
    duplex: boolean;
    /** Full override command; tokens {FILE} {PRINTER} {COPIES} {DUPLEX}. */
    command?: string;
}

const SUMATRA_SEARCH_DIRS = isWin
    ? [
        'C:\\Program Files\\SumatraPDF',
        'C:\\Program Files (x86)\\SumatraPDF',
        process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'SumatraPDF') : '',
    ]
    : [];

/** Locate the SumatraPDF binary used for silent PDF printing. */
function findSumatra(): string {
    const fromEnv = (SUMATRA_PATH || '').trim();
    if (fromEnv) {
        const withExe = isWin && !/\.exe$/i.test(fromEnv) ? `${fromEnv}.exe` : fromEnv;
        try { if (fs.existsSync(withExe) && fs.statSync(withExe).isFile()) return withExe; } catch { /* ignore */ }
        console.warn(`[BRIDGE] SUMATRA_PATH "${fromEnv}" not found - trying the shell print verb instead.`);
        return '';
    }
    for (const dir of SUMATRA_SEARCH_DIRS) {
        if (!dir) continue;
        const candidate = path.join(dir, 'SumatraPDF.exe');
        try { if (fs.existsSync(candidate)) return candidate; } catch { /* ignore */ }
    }
    return '';
}

/** Escape a value for embedding in a PowerShell single-quoted string. */
const psQuote = (v: string): string => `'${String(v).replace(/'/g, "''")}'`;

/** Run a PowerShell snippet for printing; never throws. */
function runPrintPowerShell(script: string): { ok: boolean; error?: string } {
    const r: SpawnSyncReturns<Buffer> = spawnSync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
        { stdio: 'pipe', timeout: PRINTER_TIMEOUT_MS, encoding: 'buffer', windowsHide: true },
    );
    if (r.error) return { ok: false, error: (r.error as Error).message };
    if (r.status !== 0) {
        const detail = (decodeOut(r.stderr) + decodeOut(r.stdout))
            .split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop();
        return { ok: false, error: detail || `printer command exited with code ${r.status}.` };
    }
    return { ok: true };
}

/**
 * Print through the Windows "printto" shell verb. This hands the file to
 * whichever application the OS has associated with the extension, which is why
 * it works for PDFs, images and Office documents without the bridge shipping a
 * PDF renderer of its own.
 */
function printViaShellVerb(file: string, printer: string): { ok: boolean; error?: string } {
    const script = [
        '$ErrorActionPreference = "Stop"',
        '$shell = New-Object -ComObject Shell.Application',
        `$shell.ShellExecute(${psQuote(file)}, "printto", ${psQuote(printer)}, "0", 0)`,
    ].join('; ');
    return runPrintPowerShell(script);
}

/**
 * Last-resort silent print that uses nothing but the .NET libraries already on
 * Windows: images go through System.Drawing.Printing (which honours the named
 * printer, copies and duplex) and plain text through Out-Printer.
 */
function printViaDotNet(file: string, o: PrintOptions, kind: string): { ok: boolean; error?: string } {
    let script: string;
    if (kind === 'image') {
        // System.Drawing can only draw onto a page, so it suits images; PDFs are
        // handled earlier in the cascade.
        script = [
            '$ErrorActionPreference = "Stop"',
            'Add-Type -AssemblyName System.Drawing',
            `$img = [System.Drawing.Image]::FromFile(${psQuote(file)})`,
            '$pd = New-Object System.Drawing.Printing.PrintDocument',
            `$pd.PrinterSettings.PrinterName = ${psQuote(o.printer)}`,
            `$pd.PrinterSettings.Copies = [Math]::Max(1, ${Math.max(1, o.copies)})`,
            o.duplex ? '$pd.PrinterSettings.Duplex = [System.Drawing.Printing.Duplex]::DefaultDuplex' : '',
            '$pd.DefaultPageSettings.Landscape = $img.Width -gt $img.Height',
            '$pd.Add_PrintPage({ param($s, $e) $e.Graphics.DrawImage($img, 0, 0, $e.MarginBounds.Width, $e.MarginBounds.Height) })',
            '$pd.Print()',
            '$pd.Dispose()',
            '$img.Dispose()',
        ].filter(Boolean).join('; ');
    } else {
        script = [
            '$ErrorActionPreference = "Stop"',
            `Get-Content -LiteralPath ${psQuote(file)} -Encoding UTF8 | Out-Printer -Name ${psQuote(o.printer)}`,
        ].join('; ');
    }
    return runPrintPowerShell(script);
}

/** CUPS print on macOS/Linux - `lp` is silent and handles every file type. */
function printViaCups(file: string, o: PrintOptions): { ok: boolean; error?: string } {
    const args = ['-d', o.printer, '-n', String(Math.max(1, o.copies))];
    if (o.duplex) args.push('-o', 'sides=two-sided-long-edge');
    args.push(file);
    const r: SpawnSyncReturns<Buffer> = spawnSync('lp', args, {
        stdio: 'pipe', timeout: PRINTER_TIMEOUT_MS, encoding: 'buffer',
    });
    if (r.error) return { ok: false, error: (r.error as Error).message };
    if (r.status !== 0) {
        const detail = (decodeOut(r.stderr) + decodeOut(r.stdout))
            .split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop();
        return { ok: false, error: detail || `lp exited with code ${r.status}.` };
    }
    return { ok: true };
}

/** Substitute tokens in a custom PRINT_COMMAND. */
function substitutePrintTokens(file: string, o: PrintOptions): string {
    const map: Record<string, string> = {
        '{FILE}': '"' + file + '"',
        '{PRINTER}': '"' + o.printer + '"',
        '{COPIES}': String(o.copies),
        '{DUPLEX}': o.duplex ? '--duplex' : '',
    };
    let cmd = o.command || '';
    for (const [k, v] of Object.entries(map)) cmd = cmd.split(k).join(v);
    return cmd;
}

/** Silent print with SumatraPDF - the only mechanism that honours every option. */
function printViaSumatra(file: string, o: PrintOptions): { ok: boolean; error?: string } {
    const bin = findSumatra();
    if (!bin) return { ok: false, error: 'SumatraPDF is not installed.' };
    // -print-settings: <page range>,<duplex|simplex>,<orientation>,<paper size>,<monochrome>
    const settings = `1-999999,${o.duplex ? 'duplex' : 'simplex'},portrait,narrow,mono`;
    const r: SpawnSyncReturns<Buffer> = spawnSync(
        bin,
        ['-print-to', o.printer, '-silent', '-print-settings', settings, file],
        { stdio: 'pipe', timeout: PRINTER_TIMEOUT_MS, encoding: 'buffer', windowsHide: true },
    );
    if (r.error) return { ok: false, error: (r.error as Error).message };
    if (r.status !== 0) {
        const detail = (decodeOut(r.stderr) + decodeOut(r.stdout))
            .split(/\r?\n/).map((l) => l.trim()).filter(Boolean).pop();
        return { ok: false, error: detail ? 'SumatraPDF: ' + detail : `SumatraPDF exited with code ${r.status}.` };
    }
    return { ok: true };
}

/** The file family, which decides which silent mechanism can handle it. */
function printKindFor(file: string): 'pdf' | 'image' | 'text' | 'other' {
    const ext = path.extname(String(file || '')).toLowerCase();
    if (ext === '.pdf') return 'pdf';
    if (/^\.(jpe?g|png|bmp|gif|tiff?|webp)$/.test(ext)) return 'image';
    if (/^\.(txt|csv|log|md|json|xml)$/.test(ext)) return 'text';
    return 'other';
}

/**
 * Print `file` on `o.printer` without ever showing a dialog, trying each
 * mechanism in turn until one accepts the job. A mechanism returning 0 has
 * still queued it - that is as much as Windows can tell us - so a printer that
 * is offline or out of paper surfaces at the device, not as a bridge error.
 */
function printFile(file: string, o: PrintOptions): { ok: boolean; via: string; error?: string } {
    const kind = printKindFor(file);
    const attempts: Array<{ via: string; run: () => { ok: boolean; error?: string } }> = [];

    if (o.command) {
        attempts.push({
            via: 'PRINT_COMMAND',
            run: () => {
                const argv = splitShell(substitutePrintTokens(file, o));
                if (!argv.length) return { ok: false, error: 'PRINT_COMMAND is empty.' };
                const r = spawnSync(argv[0], argv.slice(1), {
                    stdio: 'pipe', timeout: PRINTER_TIMEOUT_MS, encoding: 'buffer',
                });
                if (r.error) return { ok: false, error: (r.error as Error).message };
                return r.status === 0 ? { ok: true } : { ok: false, error: `PRINT_COMMAND exited with code ${r.status}.` };
            },
        });
    } else if (PRINT_MOCK) {
        attempts.push({ via: 'mock', run: () => ({ ok: true }) });
    } else if (!isWin) {
        attempts.push({ via: 'lp', run: () => printViaCups(file, o) });
    } else {
        if (kind === 'pdf') attempts.push({ via: 'sumatra', run: () => printViaSumatra(file, o) });
        attempts.push({ via: 'shell-verb', run: () => printViaShellVerb(file, o.printer) });
        if (kind === 'image') attempts.push({ via: 'dotnet', run: () => printViaDotNet(file, o, 'image') });
        if (kind === 'text') attempts.push({ via: 'out-printer', run: () => printViaDotNet(file, o, 'text') });
    }

    const failures: string[] = [];
    for (const attempt of attempts) {
        const result = attempt.run();
        if (result.ok) {
            console.log(`[BRIDGE] print queued on "${o.printer}" via ${attempt.via} (${path.basename(file)})`);
            return { ok: true, via: attempt.via };
        }
        failures.push(`${attempt.via}: ${result.error || 'failed'}`);
    }

    return {
        ok: false,
        via: 'none',
        error: `Could not print to "${o.printer}". ${failures.join(' | ')}. ` +
            'Check the printer is switched on, has paper, and is set as a default in your system settings.',
    };
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
let _scannerDriver: string | null = null;
/**
 * The device to hand NAPS2 as --device. NAPS2 8.x refuses to scan without one
 * ("No device was specified."), so unless SCANNER_NAME pins a device we bind to
 * the first one the driver reports (cached after the first probe).
 */
function resolveScannerName(): string {
    if (SCANNER_NAME) {
        _scannerDriver = SCANNER_DRIVER || SCANNER_DRIVERS[0] || '';
        return SCANNER_NAME;
    }
    if (!SCANNER_AUTO_DETECT) return '';
    if (_scannerName !== null) return _scannerName;
    _scannerName = '';
    for (const driver of SCANNER_DRIVERS) {
        const devices = listDevices(driver);
        if (devices.length) {
            _scannerName = devices[0];
            _scannerDriver = driver;
            console.log('[BRIDGE] auto-detected scanner: ' + _scannerName + ' (' + driver + ')');
            break;
        }
    }
    if (!_scannerName) console.warn('[BRIDGE] no scanner device detected - connect the scanner or set SCANNER_NAME.');
    return _scannerName;
}

function resolveScannerDriver(): string {
    return _scannerDriver || SCANNER_DRIVER || SCANNER_DRIVERS[0] || '';
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

async function handleStartScan(socket: WebSocket, msg: Record<string, any>, session: BridgeSession): Promise<void> {
    const deceasedId = String(msg?.deceasedId || '').trim();
    const apiBase = String(msg?.apiBase || `${CLOUD_URL}/api/v1/restpoint`).trim();
    try {
        const requested = new URL(apiBase);
        const trusted = new URL(process.env.BRIDGE_API_BASE || `${CLOUD_URL}/api/v1/restpoint`);
        if (requested.origin !== trusted.origin || !requested.pathname.replace(/\/+$/, '').endsWith('/api/v1/restpoint')) {
            sendJson(socket, { status: 'ERROR', code: 'UNTRUSTED_API_BASE', message: 'The upload destination is not the configured Restpoint cloud API.' });
            return;
        }
    } catch {
        sendJson(socket, { status: 'ERROR', code: 'INVALID_API_BASE', message: 'The Restpoint cloud API address is invalid.' });
        return;
    }
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
            bridgeGrant: session.uploadGrant,
            tenantSlug: session.tenant,
            userId: session.subject,
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


/** Guard against a caller sending an empty or oversized blob. */
function assertPrintableSize(bytes: number): void {
    if (bytes <= 0) throw new Error('The document was empty - nothing to print.');
    if (bytes > PRINT_MAX_BYTES) {
        throw new Error(`This document is ${Math.round(bytes / 1048576)} MB, over the ${Math.round(PRINT_MAX_BYTES / 1048576)} MB print limit.`);
    }
}

/**
 * Materialise the document on disk. Two ways in, from the same message:
 *   - dataBase64: the browser already has the bytes (it just rendered them), so
 *     they ride along inline. Simple, and works offline.
 *   - documentUrl: the bridge downloads the file itself with the user's token,
 *     which keeps large PDFs off the WebSocket frame entirely.
 */
async function materialisePrintFile(msg: Record<string, any>): Promise<{ file: string; bytes: number }> {
    const rawName = sanitizeFilename(msg?.documentName || 'Document.pdf');
    const ext = path.extname(rawName) || '.pdf';
    const target = path.join(PRINT_DIR, `print-${Date.now()}-${randomBytes(4).toString('hex')}${ext}`);

    const inline = String(msg?.dataBase64 || '');
    if (inline) {
        const buf = Buffer.from(inline, 'base64');
        assertPrintableSize(buf.length);
        fs.writeFileSync(target, buf);
        return { file: target, bytes: buf.length };
    }

    const url = String(msg?.documentUrl || '').trim();
    if (url) {
        // Only ever talk to the Restpoint API the app itself configured: a socket
        // message must not be able to make the bridge fetch an arbitrary URL off
        // the reception machine's network.
        const allowedBase = String(msg?.apiBase || '').replace(/\/+$/, '');
        if (!allowedBase || (url !== allowedBase && !url.startsWith(allowedBase + '/'))) {
            throw new Error('The bridge only downloads documents from the Restpoint API it was given.');
        }
        const fetchFn = (typeof fetch !== 'undefined' ? fetch : null) as any;
        if (!fetchFn) throw new Error('This bridge needs Node 18+ to download the document.');

        const headers: Record<string, string> = {};
        if (msg?.token) headers['Authorization'] = `Bearer ${msg.token}`;
        if (msg?.tenantSlug) headers['x-tenant-slug'] = String(msg.tenantSlug).replace(/[\r\n]+/g, '').trim();

        const res = await fetchFn(url, { headers, signal: AbortSignal.timeout(60_000) });
        if (!res.ok) throw new Error(`Could not download the document (HTTP ${res.status}).`);
        const buf = Buffer.from(await res.arrayBuffer());
        assertPrintableSize(buf.length);
        fs.writeFileSync(target, buf);
        return { file: target, bytes: buf.length };
    }

    throw new Error('No document to print - the request carried neither file data nor a download URL.');
}
/**
 * PRINT: put a document on paper, silently, on a chosen printer. Reports
 * PRINTING → PRINTED (or ERROR) exactly like START_SCAN reports the scan, so
 * the web app can drive both through the same progress UI.
 */
async function handlePrint(socket: WebSocket, msg: Record<string, any>): Promise<void> {
    busy = true;
    let file = '';
    const requested = String(msg?.printer || '').trim();
    const copies = Math.max(1, Math.min(50, Number(msg?.copies || DEFAULT_COPIES) || DEFAULT_COPIES));
    const duplex = typeof msg?.duplex === 'boolean' ? msg.duplex : DEFAULT_DUPLEX;

    try {
        const printer = resolvePrinterName(requested || undefined);
        if (!printer) {
            sendJson(socket, {
                status: 'ERROR', code: 'NO_PRINTER',
                message: 'No printer is installed on this computer. Add one in your system settings, then try again.',
            });
            return;
        }

        sendJson(socket, { status: 'PRINTING', progress: 10, message: `Preparing ${printer}…`, printer });

        const { file: spooled, bytes } = await materialisePrintFile(msg);
        file = spooled;
        sendJson(socket, {
            status: 'PRINTING', progress: 55,
            message: `Sending ${Math.round(bytes / 1024)} KB to ${printer}…`, printer,
        });

        const result = printFile(spooled, { printer, copies, duplex, command: PRINT_COMMAND || undefined });

        if (!result.ok) {
            sendJson(socket, { status: 'ERROR', code: 'PRINT_FAILED', printer, message: result.error || 'The print job failed.' });
            return;
        }

        sendJson(socket, {
            status: 'PRINTED', printer, copies, duplex, via: result.via,
            message: `Sent to ${printer}${copies > 1 ? ` (${copies} copies)` : ''}.`,
        });
        console.log(`[BRIDGE] ✔ printed to "${printer}" via ${result.via} (${bytes} bytes)`);
    } catch (e) {
        const message = (e as Error).message || String(e);
        console.error(`[BRIDGE] print failed: ${message}`);
        sendJson(socket, { status: 'ERROR', code: 'PRINT_FAILED', message });
    } finally {
        busy = false;
        // The spooled copy is disposable - it exists only for the queue to read.
        try { if (file && fs.existsSync(file)) fs.unlinkSync(file); } catch { /* keep going */ }
    }
}

/**
 * CONNECT_PRINTER: install a queue for a printer the OS has already seen on the
 * network or over Bluetooth but that has never been printed from.
 * `Add-Printer` speaks all three transports: "IP_192.168.1.20" for Wi-Fi/TCP-IP
 * and a "BTHENUM\{…}" instance id for Bluetooth.
 */
function handleConnectPrinter(socket: WebSocket, msg: Record<string, any>): void {
    if (!isWin) {
        sendJson(socket, {
            status: 'ERROR',
            message: 'Adding a printer automatically is only supported on Windows. Add it in System Settings → Printers & Scanners.',
        });
        return;
    }
    const instanceId = String(msg?.instanceId || '').trim();
    const host = String(msg?.host || '').trim();
    if (!instanceId && !host) {
        sendJson(socket, { status: 'ERROR', message: 'Nothing to connect - no device or host was given.' });
        return;
    }
    const target = instanceId || (/\d{1,3}(\.\d{1,3}){3}/.test(host) ? `IP_${host}` : host);

    sendJson(socket, { status: 'CONNECTING', message: `Connecting ${msg?.name || target}…`, target });
    const result = runPrintPowerShell([
        '$ErrorActionPreference = "Stop"',
        `Add-Printer -ConnectionName ${psQuote(target)}`,
    ].join('; '));

    if (!result.ok) {
        sendJson(socket, { status: 'ERROR', code: 'CONNECT_FAILED', message: `Could not connect ${msg?.name || target}. ${result.error}` });
        return;
    }
    _printersCache = null; // the inventory changed - drop the cached list
    sendJson(socket, { status: 'CONNECTED', message: `Connected ${msg?.name || target}.`, printers: getPrinters() });
    console.log(`[BRIDGE] connected printer: ${target}`);
}

// ── cloud-issued bridge grant ───────────────────────────────────────────────
// Authorised sessions, keyed by the socket that completed the HELLO handshake.
// A scan or a print is only ever run for a socket that holds one of these,
// which is what stops a local process (or a second user on the reception PC)
// from driving the hardware simply by opening a socket and sending a message.
//
// The grant carries a scope (bridge:scan / bridge:print). The scope of the
// grant that authorised the session is the ONLY capability that socket has, so
// a grant fetched to print a document cannot be replayed to drive the scanner.
const SCOPE_SCAN = 'bridge:scan';
const SCOPE_PRINT = 'bridge:print';

interface BridgeSession {
    id: string;
    tenant: string;
    subject: string;
    expiresAt: number;
    scope: string;
    uploadGrant: string;
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
                    // The grant's scope becomes the session's capability. An older
                    // cloud that does not report one is treated as scan-only, so
                    // the fail-closed direction is always the safe one.
                    scope: String(verdict.data?.scope || SCOPE_SCAN),
                    uploadGrant: String(grant),
                };
                sessions.set(socket, session);
                console.log(`[BRIDGE] authorised ${session.subject} @ ${session.tenant} on ${BRIDGE_ID.slice(0, 8)} (${session.scope})`);
                sendJson(socket, {
                    status: 'OK', type: 'hello_ok', bridge: 'restpoint-scanner-bridge',
                    version: APP_VERSION, bridgeId: BRIDGE_ID,
                    sessionId: session.id, tenant: session.tenant, scope: session.scope,
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
                naps2: resolvedNaps2Path, driver: resolveScannerDriver() || null, device: resolveScannerName() || null,
                // Printing is a separate capability from scanning, so report it
                // separately rather than implying the bridge can do both.
                printing: PRINTING_ENABLED, printMock: PRINT_MOCK,
                printer: PRINTER_NAME || null, printerCount: getPrinters().length,
            });
            return;

        case 'GET_SCANNERS':
            sendJson(socket, { status: 'OK', scanners: getScanners() });
            return;

        case 'GET_PRINTERS':
            // Reading the printer inventory is harmless local metadata, so - like
            // PING - it is allowed before the session is authorised. That lets
            // Restpoint show the printer picker immediately on page load.
            sendJson(socket, {
                status: 'OK',
                printers: PRINTING_ENABLED ? getPrinters() : [],
                discovered: PRINTING_ENABLED ? discoverPrinters() : [],
                enabled: PRINTING_ENABLED,
                default: PRINTING_ENABLED ? resolvePrinterName(undefined) : '',
            });
            return;

        case 'CONNECT_PRINTER':
        case 'PRINT': {
            // Both of these put paper in a machine, so they need the same
            // cloud-authorised session as a scan - and a grant for the matching
            // scope. A print grant alone cannot drive the scanner.
            if (!PRINTING_ENABLED) {
                sendJson(socket, { status: 'ERROR', code: 'PRINTING_DISABLED', message: 'Printing is disabled on this bridge. Set PRINTING_ENABLED=1 to allow it.' });
                return;
            }
            const authorised = sessionFor(socket);
            if (!authorised) {
                sendJson(socket, {
                    status: 'ERROR', code: 'NOT_AUTHORISED', bridgeId: BRIDGE_ID,
                    message: 'This bridge is not authorised. Sign in to Restpoint and reconnect.',
                });
                return;
            }
            if (authorised.scope !== SCOPE_PRINT) {
                sendJson(socket, {
                    status: 'ERROR', code: 'WRONG_SCOPE', bridgeId: BRIDGE_ID,
                    message: 'This session was authorised for scanning, not printing. Reconnect and try again.',
                });
                return;
            }
            if (busy) {
                sendJson(socket, { status: 'ERROR', message: 'Another job is already running. Wait for it to finish, then try again.' });
                return;
            }
            if (String(msg?.action || '').toUpperCase() === 'CONNECT_PRINTER') {
                handleConnectPrinter(socket, msg);
                return;
            }
            void handlePrint(socket, msg);
            return;
        }

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
            // A grant fetched for printing must not be able to drive the scanner.
            if (session.scope !== SCOPE_SCAN) {
                sendJson(socket, {
                    status: 'ERROR', code: 'WRONG_SCOPE', bridgeId: BRIDGE_ID,
                    message: 'This session was authorised for printing, not scanning. Reconnect and try again.',
                });
                return;
            }
            if (busy) {
                sendJson(socket, { status: 'ERROR', message: 'Another scan is already in progress. Wait for it to finish, then try again.' });
                return;
            }
            if (!session.uploadGrant) {
                sendJson(socket, { status: 'ERROR', code: 'UPLOAD_AUTH_MISSING', message: 'Restpoint did not authorize document upload. Please reconnect and try again.' });
                return;
            }
            void handleStartScan(socket, msg, session);
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
console.log(`  driver      →  ${resolveScannerDriver() || 'auto'}`);
console.log(`  printing    →  ${PRINTING_ENABLED ? 'enabled' : 'DISABLED (PRINTING_ENABLED=0)'}`);
if (PRINTING_ENABLED) {
    const printers = getPrinters();
    console.log(`  printers    →  ${printers.length ? printers.map((p) => `${p.name} [${p.connection}]`).join(', ') : 'none found — add one in Windows Settings'}`);
    const found = discoverPrinters();
    if (found.length) console.log(`  unpaired    →  ${found.map((p) => `${p.name} [${p.connection}]`).join(', ')}`);
}
console.log(`  work dir    →  ${SCAN_DIR}`);
console.log(`  origins     →  ${ALLOWED_ORIGINS.join(', ')}`);
console.log(`  cloud       →  ${CLOUD_URL}`);
console.log(`  bridge id   →  ${BRIDGE_ID}`);
console.log(`  data dir    →  ${DATA_DIR}`);
console.log('  Scan flow: HELLO {grant} → START_SCAN {sessionId, deceasedId, token}');
console.log('  To scan + upload send: { action:"START_SCAN", deceasedId, token, tenantSlug, apiBase }');
console.log('══════════════════════════════════════════════════════════════');
export { };
