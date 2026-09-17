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
 * Build the START_SCAN payload the bridge expects, enriched with the current
 * user session (token / tenant slug / gateway base) so the agent can upload the
 * scanned PDF straight to the documents-service.
 */
export const buildStartScanMessage = ({ deceasedId, documentName, category, extra = {} }) => {
  const read = (key) => {
    try { return localStorage.getItem(key) || sessionStorage.getItem(key) || ''; } catch { return ''; }
  };
  const token = read('authToken') || read('accessToken');
  const tenantSlug = read('tenantSlug') || read('tenant_slug');

  // The bridge is local, but document uploads must use the same canonical
  // gateway as the rest of the app. In production this is the cloud API;
  // localhost is used only by local development builds.
  const apiBase = env.FULL_API_URL;

  return {
    action: 'START_SCAN',
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