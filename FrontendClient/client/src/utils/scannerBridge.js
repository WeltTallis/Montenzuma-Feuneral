import env from './config/env';

/**
 * Scanner Bridge — shared helpers.
 *
 * The Restpoint web app talks to the local Scanner Bridge agent over a WebSocket
 * (default ws://localhost:8081). These helpers centralise discovery + probing so
 * both the "Install Scanner Bridge" banner (deceased list page) and the
 * Scan-document modal (deceased profile) use the same logic.
 */

// localStorage key the user can use to point at a non-default bridge,
// e.g. "restpoint.scannerBridgeUrl" = "ws://192.168.1.50:8081"
const BRIDGE_URL_KEY = 'restpoint.scannerBridgeUrl';

/** Candidate bridge URLs, best first. */
export const getBridgeUrls = () => {
  const urls = [];
  try {
    const custom = localStorage.getItem(BRIDGE_URL_KEY);
    if (custom) urls.push(custom);
  } catch { /* localStorage unavailable */ }
  urls.push('ws://localhost:8081');
  // Browser mixed-content: on https pages some clients reject ws:// even for
  // localhost — offer the TLS variant as a fallback for bridges that support it.
  if (typeof window !== 'undefined' && window.location?.protocol === 'https:') {
    urls.push('wss://localhost:8081');
  }
  return urls;
};

/**
 * Probe the bridge with a PING; resolves with the first URL that answers.
 *   → { ok: true, url, info }   |   → { ok: false, url: null, info: null }
 */
export const probeBridge = async (timeoutMs = 3000) => {
  const urls = getBridgeUrls();
  for (const url of urls) {
    const result = await pingOnce(url, timeoutMs);
    if (result.ok) return result;
  }
  return { ok: false, url: null, info: null };
};

/** Open a socket, send PING, wait for the pong. */
const pingOnce = (url, timeoutMs) =>
  new Promise((resolve) => {
    let ws = null;
    let settled = false;
    const done = (ok, info) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { if (ws) ws.close(); } catch { /* ignore */ }
      resolve({ ok, url, info });
    };

    try {
      ws = new WebSocket(url);
    } catch {
      return done(false, null);
    }

    const timer = setTimeout(() => done(false, null), timeoutMs);
    ws.onopen = () => {
      try { ws.send(JSON.stringify({ action: 'PING' })); } catch { /* ignore */ }
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.status === 'OK' && data?.bridge) {
          clearTimeout(timer);
          done(true, data);
        }
      } catch { /* non-json */ }
    };
    ws.onerror = () => done(false, null);
    ws.onclose = () => done(false, null);
  });

/**
 * Ask the bridge which scanner devices it can actually see, for the side panel.
 * Resolves to an array (possibly empty) and never throws — a bridge that is
 * present but has no hardware attached is still a useful answer.
 */
export const listScanners = (url, timeoutMs = 5000) =>
  new Promise((resolve) => {
    if (!url) return resolve([]);
    let ws = null;
    let settled = false;
    const done = (list) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { if (ws) ws.close(); } catch { /* ignore */ }
      resolve(Array.isArray(list) ? list : []);
    };

    try { ws = new WebSocket(url); } catch { return done([]); }
    const timer = setTimeout(() => done([]), timeoutMs);
    ws.onopen = () => { try { ws.send(JSON.stringify({ action: 'GET_SCANNERS' })); } catch { done([]); } };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data?.scanners)) done(data.scanners);
      } catch { /* non-json */ }
    };
    ws.onerror = () => done([]);
    ws.onclose = () => done([]);
  });

/**
 * Ask the bridge which printers the reception computer has, and which of them it
 * can reach over Bluetooth or Wi-Fi but has no queue for yet.
 *
 * Like GET_SCANNERS this is harmless local metadata, so the bridge answers it
 * before the user has authorised anything — the picker can populate on load.
 *
 *   → { ok: true, printers, discovered, default }  |  → { ok: false, reason }
 */
export const listPrinters = (url, timeoutMs = 8000) =>
  new Promise((resolve) => {
    if (!url) return resolve({ ok: false, reason: 'No bridge is running on this computer.' });
    let ws = null;
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { if (ws) ws.close(); } catch { /* ignore */ }
      resolve(result);
    };

    try { ws = new WebSocket(url); } catch { return done({ ok: false, reason: 'Could not reach the bridge.' }); }
    const timer = setTimeout(
      () => done({ ok: false, reason: 'The printer bridge did not answer in time.' }),
      timeoutMs,
    );
    ws.onopen = () => { try { ws.send(JSON.stringify({ action: 'GET_PRINTERS' })); } catch { done({ ok: false, reason: 'Could not reach the bridge.' }); } };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!Array.isArray(data?.printers)) return;
        if (data.enabled === false) {
          return done({ ok: false, reason: 'Printing is disabled on this computer\'s bridge.' });
        }
        done({
          ok: true,
          printers: data.printers,
          discovered: Array.isArray(data.discovered) ? data.discovered : [],
          default: data.default || '',
        });
      } catch { /* non-json */ }
    };
    ws.onerror = () => done({ ok: false, reason: 'Could not reach the bridge.' });
    ws.onclose = () => done({ ok: false, reason: 'The bridge closed the connection.' });
  });

/**
 * Install a queue for a printer the OS has already seen on the network or over
 * Bluetooth but that has never been printed from (the bridge answers
 * GET_PRINTERS with these under `discovered`). Needs a print-authorised session,
 * because it changes the machine's printer configuration.
 */
export const connectPrinter = (ws, sessionId, printer) =>
  new Promise((resolve) => {
    try {
      ws.send(JSON.stringify({
        action: 'CONNECT_PRINTER',
        sessionId: sessionId || undefined,
        name: printer?.name,
        instanceId: printer?.instanceId,
        host: printer?.host,
      }));
      resolve({ ok: true });
    } catch {
      resolve({ ok: false, reason: 'Could not talk to the printer bridge.' });
    }
  });

/**
 * Build the PRINT payload. The document travels either inline (`dataBase64`,
 * when the page already holds the bytes) or as a `documentUrl` the bridge
 * fetches itself with the user's token — which keeps large PDFs off the socket.
 */
export const buildPrintMessage = ({
  documentName, printer, copies = 1, duplex = false, sessionId, dataBase64, documentUrl, apiBase, extra = {},
}) => {
  const token = getAuthToken();
  const tenantSlug = readStored('tenantSlug') || readStored('tenant_slug');

  return {
    action: 'PRINT',
    sessionId: sessionId || undefined,
    documentName: documentName || 'Document.pdf',
    printer: printer || undefined,
    copies,
    duplex,
    apiBase: apiBase || env.FULL_API_URL,
    ...(dataBase64 ? { dataBase64 } : {}),
    ...(documentUrl ? { documentUrl } : {}),
    ...(token ? { token } : {}),
    ...(tenantSlug ? { tenantSlug } : {}),
    ...extra,
  };
};

/** Read a value from either storage, tolerating privacy-mode failures. */
const readStored = (key) => {
  try { return localStorage.getItem(key) || sessionStorage.getItem(key) || ''; } catch { return ''; }
};

/** The signed-in user's access token, if the app has one. */
export const getAuthToken = () => readStored('authToken') || readStored('accessToken');

/**
 * Ask the Restpoint cloud for a short-lived bridge grant.
 *
 * The grant is what proves to the bridge that this tab is a genuine, signed-in
 * Restpoint session. It expires in 60s and is single-use, which is why it is
 * fetched per job rather than cached.
 *
 * `scope` selects which physical action the grant unlocks - 'bridge:scan' to
 * drive the scanner, 'bridge:print' to print. They are deliberately separate:
 * a grant fetched in order to print cannot drive the scanner.
 *
 *   → { ok: true, grant, expiresAt }  |  → { ok: false, reason }
 */
export const fetchBridgeGrant = async (scope = 'bridge:scan', timeoutMs = 10000) => {
  const token = getAuthToken();
  if (!token) return { ok: false, reason: 'You need to sign in to Restpoint first.' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${env.API_GATEWAY_URL}/bridge/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({ scope }),
      signal: controller.signal,
    });
    if (res.status === 401) return { ok: false, reason: 'Your session has expired. Please sign in again.' };
    if (!res.ok) return { ok: false, reason: `Restpoint returned HTTP ${res.status}.` };
    const body = await res.json();
    const grant = body?.data?.grant;
    if (!grant) return { ok: false, reason: 'Restpoint did not issue a bridge grant.' };
    return { ok: true, grant, expiresAt: body?.data?.expiresAt };
  } catch (e) {
    return { ok: false, reason: 'Could not reach Restpoint to authorise this. Check your internet connection.' };
  } finally {
    clearTimeout(timer);
  }
};

/** Scan grant — the authority the bridge requires before it drives the scanner. */
export const fetchScanGrant = (timeoutMs) => fetchBridgeGrant('bridge:scan', timeoutMs);

/** Print grant — the authority the bridge requires before it prints anything. */
export const fetchPrintGrant = (timeoutMs) => fetchBridgeGrant('bridge:print', timeoutMs);

/**
 * Complete the bridge handshake on an OPEN socket: send the grant, wait for the
 * bridge to confirm it with the cloud, and hand back the session id.
 *
 *   → { ok: true, sessionId, info }  |  → { ok: false, reason, code }
 */
export const authoriseSocket = (ws, grant, timeoutMs = 15000) =>
  new Promise((resolve) => {
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(
      () => done({ ok: false, reason: 'The scanner bridge did not answer in time.' }),
      timeoutMs,
    );

    const onMessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }

      if (data?.type === 'hello_ok') {
        ws.removeEventListener('message', onMessage);
        done({ ok: true, sessionId: data.sessionId, info: data });
        return;
      }
      if (data?.type === 'hello_rejected') {
        ws.removeEventListener('message', onMessage);
        done({
          ok: false,
          code: data.code || 'GRANT_REJECTED',
          // Surface the bridge's own reason: "grant expired" and "could not
          // reach Restpoint" need very different advice for the user.
          reason: data.reason || 'The bridge could not confirm your Restpoint session.',
        });
        return;
      }
    };

    ws.addEventListener('message', onMessage);
    try {
      ws.send(JSON.stringify({ action: 'HELLO', grant }));
    } catch {
      ws.removeEventListener('message', onMessage);
      done({ ok: false, reason: 'Could not talk to the scanner bridge.' });
    }
  });

/**
 * Build the START_SCAN payload the bridge expects, enriched with the current
 * user session (token / tenant slug / gateway base) so the agent can upload the
 * scanned PDF straight to the documents-service.
 *
 * `sessionId` comes from the HELLO handshake and is mandatory: the bridge
 * refuses to drive the scanner without an authorised session.
 */
export const buildStartScanMessage = ({ deceasedId, documentName, category, sessionId, extra = {} }) => {
  const token = getAuthToken();
  const tenantSlug = readStored('tenantSlug') || readStored('tenant_slug');

  // The bridge is local, but document uploads must use the same canonical
  // gateway as the rest of the app. In production this is the cloud API;
  // localhost is used only by local development builds.
  const apiBase = env.FULL_API_URL;

  return {
    action: 'START_SCAN',
    sessionId: sessionId || undefined,
    deceasedId: String(deceasedId || ''),
    documentName: documentName || `Scan_${String(deceasedId || 'document')}.pdf`,
    category: category || 'Scan',
    apiBase,
    ...(token ? { token } : {}),
    ...(tenantSlug ? { tenantSlug } : {}),
    resolution: 300,
    colorMode: 'color',
    duplex: true,
    source: 'auto',
    format: 'pdf',
    ...extra,
  };
};