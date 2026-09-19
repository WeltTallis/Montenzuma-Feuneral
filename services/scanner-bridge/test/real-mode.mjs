// ─────────────────────────────────────────────────────────────────────────────
// Scanner Bridge — real-mode (non-mock) verification. NO scanner hardware needed.
//
//  Prereq:  npm run build
//  Does:    starts the compiled bridge four times and checks the real-scan path:
//             A. NAPS2_PATH = install FOLDER   → resolves NAPS2.Console.exe inside
//             B. NAPS2_PATH = the .exe         → used verbatim
//             C. NAPS2_PATH unset              → auto-discovery finds NAPS2
//             D. NAPS2_PATH bogus              → START_SCAN explains the fix
//  Asserts: PING reports the resolved binary + driver, mock is OFF, and
//           GET_SCANNERS answers with an array (empty when no device is attached).
//
//  Run:   npm run build && npm run test:real
// ─────────────────────────────────────────────────────────────────────────────
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';

const here = path.dirname(fileURLToPath(import.meta.url));
const agentPath = path.resolve(here, '..', 'dist', 'agent.js');
const PORT = 8207;
const MOCK_OFF = { MOCK_SCAN: '', BRIDGE_ALLOW_SHUTDOWN: '1', BRIDGE_PORT: String(PORT), BRIDGE_HOST: '127.0.0.1' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = false;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? '  OK  ' : '  FAIL'} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failed = true;
};

function withChild(env, run) {
  const child = spawn(process.execPath, [agentPath], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => { out += String(d); });
  child.stderr.on('data', (d) => { out += String(d); });
  return run(child, () => out).finally(async () => {
    try { child.kill(); } catch { /* ignore */ }
    await sleep(250);
  });
}

async function connect() {
  for (let i = 0; i < 30; i++) {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
    try {
      await new Promise((ok, err) => { ws.once('open', ok); ws.once('error', err); setTimeout(() => err(new Error('timeout')), 1500); });
      return ws;
    } catch { await sleep(250); }
  }
  throw new Error('bridge did not start');
}

function ask(ws, payload, want, timeoutMs = 20000) {
  const inbox = [];
  const onMsg = (d) => inbox.push(JSON.parse(String(d)));
  ws.on('message', onMsg);
  ws.send(JSON.stringify(payload));
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const tick = () => {
      const hit = inbox.find(want);
      if (hit) { ws.off('message', onMsg); return resolve(hit); }
      if (Date.now() > deadline) { ws.off('message', onMsg); return resolve(null); }
      setTimeout(tick, 80);
    };
    tick();
  });
}

const isPong = (m) => m?.type === 'pong';
const INSTALL_FOLDER = 'C:\\Program Files\\NAPS2';

// ── A. NAPS2_PATH pointing at the INSTALL FOLDER ────────────────────────────
console.log('A) NAPS2_PATH as a folder: ' + INSTALL_FOLDER);
await withChild({ ...MOCK_OFF, NAPS2_PATH: INSTALL_FOLDER }, async (child, log) => {
  const ws = await connect();
  const pong = await ask(ws, { action: 'PING' }, isPong);
  check(!!pong, 'PING answered');
  check(pong?.mock === false, 'bridge is in real-scan mode', 'mock=' + pong?.mock);
  check(pong?.naps2 === INSTALL_FOLDER + '\\NAPS2.Console.exe', 'folder override resolved to NAPS2.Console.exe', String(pong?.naps2));
  check(/NAPS2_PATH \(folder\)/.test(log()), 'start-up log shows the folder resolution', '');

  const res = await ask(ws, { action: 'GET_SCANNERS' }, (m) => m?.scanners, 20000);
  check(Array.isArray(res?.scanners), 'GET_SCANNERS returned an array', JSON.stringify(res?.scanners));
  check(!JSON.stringify(res?.scanners || []).includes('mock'), 'no mock scanner in real mode');
  ws.close();
});

// ── B. NAPS2_PATH pointing at the .EXE ─────────────────────────────────────
console.log('B) NAPS2_PATH as the executable: NAPS2.Console.exe');
await withChild({ ...MOCK_OFF, NAPS2_PATH: INSTALL_FOLDER + '\\NAPS2.Console.exe' }, async (child, log) => {
  const ws = await connect();
  const pong = await ask(ws, { action: 'PING' }, isPong);
  check(pong?.naps2 === INSTALL_FOLDER + '\\NAPS2.Console.exe', 'file override used verbatim', String(pong?.naps2));
  check(/NAPS2_PATH \(file\)/.test(log()), 'start-up log shows the file resolution', '');
  ws.close();
});

// ── C. NAPS2_PATH omitted → auto-discovery ─────────────────────────────────
console.log('C) NAPS2_PATH unset (auto-discovery)');
await withChild({ ...MOCK_OFF, NAPS2_PATH: '' }, async (child, log) => {
  const ws = await connect();
  const pong = await ask(ws, { action: 'PING' }, isPong);
  check(/NAPS2\.Console\.exe$/.test(String(pong?.naps2 || '')), 'auto-discovered the installed NAPS2', String(pong?.naps2));
  check(/auto-discovered NAPS2 at/.test(log()), 'start-up log shows auto-discovery', '');
  ws.close();
});

// ── D. bogus NAPS2_PATH → actionable error instead of a hang ───────────────
console.log('D) bogus NAPS2_PATH → actionable error');
await withChild({ ...MOCK_OFF, NAPS2_PATH: 'C:\\does\\not\\exist\\NAPS2.Console.exe' }, async (child) => {
  const ws = await connect();
  const pong = await ask(ws, { action: 'PING' }, isPong);
  check(!!pong, 'bridge still starts with a bogus path');
  const err = await ask(ws, { action: 'START_SCAN', deceasedId: 'X-1', apiBase: 'http://127.0.0.1:1/api' }, (m) => m?.status === 'ERROR', 15000);
  check(/NAPS2 was not found at/.test(String(err?.message || '')), 'START_SCAN explains NAPS2 is missing', String(err?.message));
  ws.close();
});

console.log(failed ? '\nREAL-MODE VERIFICATION FAILED' : '\nREAL-MODE VERIFICATION PASSED');
process.exit(failed ? 1 : 0);