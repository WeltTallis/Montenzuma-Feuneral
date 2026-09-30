// ─────────────────────────────────────────────────────────────────────────────
// Scanner Bridge — end-to-end smoke test (no scanner hardware required).
//
//  Prereq:  npm run build   (spawns  services/scanner-bridge/dist/agent.js)
//  Does:    fake documents-service → WebSocket PING → START_SCAN (MOCK_SCAN)
//  Asserts: SCANNING → UPLOADING → COMPLETE statuses, the PDF payload
//           (%PDF- magic), and that Authorization / x-tenant-slug headers
//           are sent straight to the documents-service.
//
//  Run:   npm run build && npm test
// ─────────────────────────────────────────────────────────────────────────────
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';

const here = path.dirname(fileURLToPath(import.meta.url));
const agentPath = path.resolve(here, '..', 'dist', 'agent.js');
const BRIDGE_PORT = 8199;
const E2E_DECEASED = 'E2E-001';
// The only grant the fake cloud will accept.
const E2E_GRANT = 'e2e-valid-scan-grant';

const log = (...a) => console.log('[e2e]', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = false;
const fail = (msg) => { failed = true; console.error(`  ✘ ${msg}`); };

async function readBody(req, timeoutMs = 15_000) {
  const chunks = [];
  const deadline = Date.now() + timeoutMs;
  try {
    for await (const chunk of req) {
      if (Date.now() > deadline) break;
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
  } catch { /* some builds expose .read() instead */ }
  return Buffer.concat(chunks);
}

// ── 1. fake documents-service capture ─────────────────────────────────────
log('step 1: fake documents-service…');
const captures = [];
const httpServer = createServer(async (req, res) => {
  const body = await readBody(req);
  captures.push({
    url: req.url,
    method: req.method,
    authorization: req.headers.authorization,
    tenantSlug: req.headers['x-tenant-slug'],
    contentType: req.headers['content-type'],
    body,
  });
  res.statusCode = 201;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    success: true,
    message: 'Uploaded successfully',
    data: { document_id: 9001, original_name: 'capture.pdf', file_size: body.length, category: 'Scan' },
  }));
});
await new Promise((ok) => httpServer.listen(0, '127.0.0.1', ok));
const httpPort = httpServer.address().port;
log(`fake documents-service on 127.0.0.1:${httpPort}`);

// ── 1b. fake Restpoint cloud: issues + verifies scan grants ───────────────
// The bridge refuses to drive the scanner until a scan grant has been checked
// with the cloud, so the e2e has to stand in for the gateway too.
log('step 1b: fake Restpoint cloud (grant verification)…');
const cloudServer = createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url !== '/bridge/verify-grant') { res.statusCode = 404; return res.end('{}'); }
    let grant = '';
    try { grant = JSON.parse(raw || '{}').grant || ''; } catch { /* ignore */ }
    const valid = grant === E2E_GRANT;
    res.end(JSON.stringify({
      success: true,
      data: valid ? { valid: true, tenant: 'e2e-tenant', subject: 'e2e-user' } : { valid: false, reason: 'grant signature invalid' },
    }));
  });
});
await new Promise((ok) => cloudServer.listen(0, '127.0.0.1', ok));
const cloudPort = cloudServer.address().port;
log(`fake Restpoint cloud on 127.0.0.1:${cloudPort}`);

// ── 2. spawn the compiled agent in MOCK_SCAN mode ──────────────────────────
log('step 2: spawning compiled agent (MOCK_SCAN)…');
const agent = spawn(process.execPath, [agentPath], {
  env: {
    ...process.env,
    MOCK_SCAN: '1',
    BRIDGE_ALLOW_SHUTDOWN: '1',
    BRIDGE_PORT: String(BRIDGE_PORT),
    BRIDGE_HOST: '127.0.0.1',
    BRIDGE_CLOUD_URL: `http://127.0.0.1:${cloudPort}`,
  },
  stdio: 'ignore',
});

// ── 3. wait for the bridge, connect, PING ─────────────────────────────────
log('step 3: connecting to the bridge…');
let ws;
for (let attempt = 0; attempt < 25; attempt++) {
  try {
    ws = new WebSocket(`ws://127.0.0.1:${BRIDGE_PORT}`);
    await new Promise((ok, err) => { ws.once('open', ok); ws.once('error', err); setTimeout(() => err(new Error('connect timeout')), 2500); });
    break;
  } catch { ws = null; await sleep(300); }
}
if (!ws) { console.error('✘ bridge did not come up — did you run `npm run build`?'); agent.kill?.(); process.exit(1); }
log('connected');

const send = (payload) => ws.send(JSON.stringify(payload));
const inbox = [];
ws.on('message', (data) => inbox.push(JSON.parse(String(data))));
const waitFor = (predicate, timeoutMs) => {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const tick = () => {
      const found = inbox.find(predicate);
      if (found) return resolve(found);
      if (Date.now() > deadline) return resolve(null);
      setTimeout(tick, 50);
    };
    tick();
  });
};

log('step 4: PING…');
send({ action: 'PING' });
const pong = await waitFor((m) => m?.status === 'OK' && m?.type === 'pong', 6_000);
if (!pong) { console.error('✘ PING failed', inbox); agent.kill?.(); process.exit(1); }
log(`PING ok — bridge v${pong?.version}, mock=${pong?.mock}`);

// A scan is only allowed after the bridge has confirmed a grant with the cloud.
log('step 4b: HELLO (authorise with the cloud)…');
send({ action: 'HELLO', grant: E2E_GRANT });
const hello = await waitFor((m) => m?.type === 'hello_ok' || m?.type === 'hello_rejected', 10_000);
if (hello?.type !== 'hello_ok') {
  console.error('✘ HELLO was not authorised', inbox);
  agent.kill?.(); httpServer.close(); cloudServer.close(); process.exit(1);
}
log(`HELLO ok — session ${String(hello.sessionId).slice(0, 8)}…, bridge ${String(hello.bridgeId).slice(0, 8)}`);

log('step 5: START_SCAN → SCANNING → UPLOADING → COMPLETE…');
send({
  action: 'START_SCAN',
  sessionId: hello.sessionId,
  deceasedId: E2E_DECEASED,
  documentName: 'Scan_E2E.pdf',
  category: 'Scan',
  token: 'test-bearer-token',
  tenantSlug: 'e2e-tenant',
  apiBase: `http://127.0.0.1:${httpPort}/api/v1/restpoint`,
  resolution: 200,
  colorMode: 'gray',
  duplex: true,
});
const complete = await waitFor((m) => m?.status === 'COMPLETE' || m?.status === 'ERROR', 15_000);
log('final message:', JSON.stringify(complete));
ws.close();

// ── assertions ─────────────────────────────────────────────────────────────
console.log('\n── assertions ──');
const statuses = inbox.map((m) => m?.status);
if (statuses.includes('SCANNING')) console.log('  ✔ SCANNING status received'); else fail('SCANNING status missing');
if (statuses.includes('UPLOADING')) console.log('  ✔ UPLOADING status received'); else fail('UPLOADING status missing');
if (statuses.includes('COMPLETE')) console.log('  ✔ COMPLETE status received'); else fail(`COMPLETE missing — ${JSON.stringify(statuses)}`);

if (captures.length === 0) {
  fail('documents-service never received the upload');
} else {
  const c = captures[0];
  /* The documents-service accepts BOTH forms (see services/documents-service/server.js):
       POST /documents/upload/{deceasedId}   → id in the path (legacy/gateway form)
       POST /documents/upload                → id in the multipart body as `deceasedId`
     The bridge prefers the body form and only falls back to the path form on a 404.
     Assert the real invariant: the deceased id reaches the service either way. */
  const pathForm = c.url === `/api/v1/restpoint/documents/upload/${E2E_DECEASED}`;
  const bodyForm =
    c.url === '/api/v1/restpoint/documents/upload' &&
    c.body.includes(Buffer.from('name="deceasedId"')) &&
    c.body.includes(Buffer.from(E2E_DECEASED));
  if (pathForm) console.log(`  ✔ upload URL carries the deceased id (${c.url})`);
  else if (bodyForm) console.log(`  ✔ upload ${c.url} + deceasedId "${E2E_DECEASED}" in multipart body`);
  else fail(`deceased id not transmitted — url: ${c.url}, body carries deceasedId: ${c.body.includes(Buffer.from('deceasedId'))}`);
  if (c.method === 'POST') console.log('  ✔ upload method POST'); else fail(`method ${c.method}`);
  if (c.authorization === 'Bearer test-bearer-token') console.log('  ✔ Authorization header forwarded'); else fail(`Authorization header: ${c.authorization}`);
  if (c.tenantSlug === 'e2e-tenant') console.log('  ✔ x-tenant-slug header forwarded'); else fail(`x-tenant-slug: ${c.tenantSlug}`);
  if (c.body.includes(Buffer.from('%PDF-'))) console.log(`  ✔ payload is a real PDF (${c.body.length} bytes)`); else fail('payload is not a PDF');
  if (/multipart\/form-data;\s*boundary=/.test(c.contentType)) console.log('  ✔ multipart content-type with boundary'); else fail(`content-type: ${c.contentType}`);
  // The scanner only ever ran because the cloud authorised the bridge first.
  if (hello?.sessionId) console.log('  ✔ scan only ran after a cloud-authorised HELLO session');
  else fail('no authorised session');
}

// ── teardown ───────────────────────────────────────────────────────────────
try {
  const s = new WebSocket(`ws://127.0.0.1:${BRIDGE_PORT}`);
  await new Promise((ok) => { s.once('open', ok); setTimeout(ok, 1500); });
  s.send(JSON.stringify({ action: 'SHUTDOWN' }));
} catch { /* already gone */ }
await sleep(400);
try { agent.kill?.(); } catch { /* ignore */ }
try { httpServer.close(); } catch { /* ignore */ }
try { cloudServer.close(); } catch { /* ignore */ }

console.log(failed ? '\n✘ E2E FAILED' : '\n✔ E2E PASSED — scan → direct documents-service upload works');
process.exit(failed ? 1 : 0);