#!/usr/bin/env node
/**
 * check-connection-status.mjs
 * ---------------------------------------------------------------------------
 * Regression guard for the "Connection Lost popup shows while the internet is
 * fine" class of bugs.
 *
 * It runs the REAL client module
 *   FrontendClient/client/src/api/connectionStatus.js
 * with axios + the env config stubbed, so the state machine can be driven
 * through every false-positive scenario without a browser or a test runner:
 *
 *   • cancelled / aborted requests        -> must not count as offline
 *   • axios timeouts (ECONNABORTED)       -> must not count as offline
 *   • a 503/504 from ONE microservice     -> must not count as offline
 *   • a single transport failure          -> must not announce an outage
 *   • two consecutive failures + dead     -> announces the outage exactly once
 *     /health probe
 *   • a successful request                -> clears the outage
 *   • the 5s probe interval               -> clears it with no API traffic at all
 *   • spurious native online/offline      -> silent (probe disproves them)
 *
 * Usage:  node scripts/check-connection-status.mjs
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT = path.join(ROOT, 'FrontendClient', 'client');
const SOURCE = path.join(CLIENT, 'src', 'api', 'connectionStatus.js');

let failures = 0;
const check = (name, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failures += 1;
};

// ── 1. the touched client files still parse (JSX + ESM) ────────────────────
let parser = null;
try {
  parser = createRequire(`${CLIENT}/`)('@babel/parser');
} catch {
  console.log('note: @babel/parser not installed in FrontendClient/client — skipping syntax checks');
}

if (parser) {
  for (const rel of [
    'src/api/connectionStatus.js',
    'src/api/axios.js',
    'src/components/common/ConnectionToast.jsx',
  ]) {
    const file = path.join(CLIENT, rel);
    if (!fs.existsSync(file)) {
      check(`exists: ${rel}`, false);
      continue;
    }
    try {
      parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
      check(`parses: ${rel}`, true);
    } catch (err) {
      check(`parses: ${rel} -> ${err.message}`, false);
    }
  }
}

// ─ 2. drive the real state machine with stubbed dependencies ───────────────
const stubbed = fs
  .readFileSync(SOURCE, 'utf8')
  .replace("import axios from 'axios';", 'const axios = globalThis.__axios;')
  .replace("import env from '../utils/config/env';", 'const env = globalThis.__env;');

globalThis.window = new EventTarget(); // the module dispatches DOM Event objects
globalThis.__env = { API_GATEWAY_URL: 'http://gateway.test' };

const events = [];
globalThis.window.addEventListener('app:connection-lost', () => events.push('lost'));
globalThis.window.addEventListener('app:connection-restored', () => events.push('restored'));

let probeFails = true;
globalThis.__axios = {
  isCancel: (e) => e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError',
  get: async () => {
    if (probeFails) {
      const err = new Error('Network Error');
      err.code = 'ERR_NETWORK';
      throw err;
    }
    return { status: 200, data: 'healthy' };
  },
};

const tmp = path.join(os.tmpdir(), `conn-status-${process.pid}.mjs`);
fs.writeFileSync(tmp, stubbed);
const mod = await import(pathToFileURL(tmp).href);

const transport = () => ({ code: 'ERR_NETWORK', config: {} });
const timeout = () => ({ code: 'ECONNABORTED', config: {} });
const cancelled = () => ({ code: 'ERR_CANCELED', config: {} });
const aborted = () => ({ code: 'ERR_NETWORK', config: { signal: { aborted: true } } });
const http503 = () => ({ code: 'ERR_BAD_RESPONSE', response: { status: 503 }, config: {} });
const http504 = () => ({ code: 'ERR_BAD_RESPONSE', response: { status: 504 }, config: {} });

check('30s timeout is NOT a transport failure', !mod.isTransportFailure(timeout()));
check('cancelled request is NOT a transport failure', !mod.isTransportFailure(cancelled()));
check('aborted request is NOT a transport failure', !mod.isTransportFailure(aborted()));
check('503 from one service is NOT a transport failure', !mod.isTransportFailure(http503()));
check('504 from one service is NOT a transport failure', !mod.isTransportFailure(http504()));
check('ERR_NETWORK IS a transport failure', mod.isTransportFailure(transport()));

await mod.reportFailure(transport());
check('a single blip announces nothing', !mod.isConnectionLost() && events.length === 0);

await mod.reportFailure(transport());
check('two failures + dead probe: outage announced once', mod.isConnectionLost() && events.join() === 'lost');

probeFails = false;
mod.reportSuccess();
check('a successful request clears the outage', !mod.isConnectionLost() && events.join() === 'lost,restored');

probeFails = true;
await mod.reportFailure(transport());
await mod.reportFailure(transport());
check('outage re-flagged before the interval test', mod.isConnectionLost());
probeFails = false;
await new Promise((resolve) => setTimeout(resolve, 6000));
check(
  '5s probe interval self-heals with no API traffic',
  !mod.isConnectionLost() && events.join() === 'lost,restored,lost,restored'
);

const seen = events.length;
await mod.reportOnlineEvent();
check('spurious native "online" is silent (nothing was lost)', events.length === seen);
await mod.reportOfflineEvent();
check('spurious native "offline" is disproved by the probe', !mod.isConnectionLost() && events.length === seen);

probeFails = true;
await mod.reportOfflineEvent();
check(
  'genuine native "offline" (probe fails) announces the outage',
  mod.isConnectionLost() && events.join() === 'lost,restored,lost,restored,lost'
);

probeFails = false;
mod.markConnectionRestored();
check('restored again and probing stopped', !mod.isConnectionLost());

fs.rmSync(tmp, { force: true });
console.log(`\n${failures === 0 ? '✅ connection-status behaviour verified' : `❌ ${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);