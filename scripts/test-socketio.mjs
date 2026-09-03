#!/usr/bin/env node
/**
 * scripts/test-socketio.mjs — dependency-free Socket.IO / Engine.IO
 * connectivity test for a live RestPoint deployment.
 *
 * Usage:
 *   node scripts/test-socketio.mjs [baseUrl]
 *   node scripts/test-socketio.mjs https://restpoint.co.ke
 *
 * What it checks (in order):
 *   1. Engine.IO POLLING handshake: GET {base}/socket.io/?EIO=4&transport=polling
 *      MUST return 200 with a body starting 0{"sid":...}. If it returns HTML,
 *      the request is falling through to the SPA (nginx /socket.io/ location
 *      missing or pointing at the wrong port) — the exact cause of the
 *      frontend "websocket error".
 *   2. WebSocket UPGRADE: connects to {wsBase}/socket.io/?EIO=4&transport=websocket
 *      and expects the first frame 0{"sid":...}. Close code 1006 = the upgrade
 *      never reached a WebSocket server (proxy dropping Upgrade headers or
 *      wrong upstream).
 *
 * Exit code 0 = both transports OK, 1 = at least one failed.
 */

const base = (process.argv[2] || 'https://restpoint.co.ke').replace(/\/+$/, '');
const socketPath = '/socket.io/';
const wsBase = base.replace(/^http/, 'ws');

let failures = 0;

console.log(`\n=== Socket.IO connectivity test → ${base} ===\n`);

// ─── 1. Polling handshake ────────────────────────────────────────────────────
try {
    const pollingUrl = `${base}${socketPath}?EIO=4&transport=polling&t=${Date.now()}`;
    const res = await fetch(pollingUrl, { headers: { Accept: '*/*' } });
    const text = await res.text();

    console.log(`[POLLING] GET ${pollingUrl}`);
    console.log(`[POLLING] status: ${res.status} ${res.statusText}`);
    console.log(`[POLLING] content-type: ${res.headers.get('content-type')}`);
    console.log(`[POLLING] body (first 120 chars): ${text.slice(0, 120).replace(/\n/g, ' ')}`);

    if (res.ok && text.startsWith('0{')) {
        const open = JSON.parse(text.slice(1));
        console.log(`[POLLING] ✅ Engine.IO handshake OK — sid=${open.sid}, upgrades=${JSON.stringify(open.upgrades)}`);
        if (Array.isArray(open.upgrades) && !open.upgrades.includes('websocket')) {
            console.log('[POLLING] ⚠️  server does NOT offer websocket upgrade (check server transports config)');
        }
    } else if (text.trimStart().startsWith('<')) {
        console.log('[POLLING] ❌ Received HTML instead of the Engine.IO handshake —');
        console.log('          /socket.io/ is being served by the SPA fallback.');
        console.log('          Fix: nginx must have location /socket.io/ → socketio-service');
        console.log('          (PROD host port 5013 → container 5000) placed BEFORE location /.');
        failures++;
    } else {
        console.log(`[POLLING] ❌ Unexpected response (expected 0{"sid":...}).`);
        failures++;
    }
} catch (err) {
    console.log(`[POLLING] ❌ Request failed: ${err.cause?.code || err.message}`);
    failures++;
}

// ─── 2. WebSocket upgrade ────────────────────────────────────────────────────
await new Promise((resolve) => {
    const wsUrl = `${wsBase}${socketPath}?EIO=4&transport=websocket&t=${Date.now()}`;
    console.log(`\n[WS] connecting ${wsUrl}`);
    let settled = false;
    const done = (code) => { if (!settled) { settled = true; resolve(code); } };

    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => {
        console.log('[WS] ❌ TIMEOUT — no handshake response in 10s');
        try { ws.close(); } catch { /* noop */ }
        failures++;
        done(1);
    }, 10000);

    ws.onopen = () => console.log('[WS] open — upgrade accepted by origin');
    ws.onmessage = (m) => {
        const data = String(m.data);
        console.log(`[WS] first frame: ${data.slice(0, 120)}`);
        if (data.startsWith('0{')) {
            console.log('[WS] ✅ WebSocket transport OK');
        } else {
            console.log('[WS] ❌ unexpected first frame (expected 0{"sid":...})');
            failures++;
        }
        clearTimeout(timer);
        ws.close();
        done(0);
    };
    ws.onerror = () => { /* details arrive via onclose / timeout */ };
    ws.onclose = (e) => {
        clearTimeout(timer);
        if (!settled) {
            console.log(`[WS] ❌ closed before handshake: code=${e.code} reason=${e.reason || 'none'}`);
            if (e.code === 1006) {
                console.log('      1006 = abnormal closure — the upgrade never reached a WebSocket');
                console.log('      server (nginx missing Upgrade/Connection headers, wrong upstream port,');
                console.log('      or the request hit the SPA/another non-WS backend).');
            }
            failures++;
            done(1);
        }
    };
});

console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===\n`);
process.exit(failures === 0 ? 0 : 1);
