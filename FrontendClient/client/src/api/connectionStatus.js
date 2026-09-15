import axios from 'axios';
import env from '../utils/config/env';

/**
 * Single source of truth for "can we actually reach the backend?".
 *
 * The browser's native `online`/`offline` events only fire when the network
 * interface changes, and the browser stays "online" when the backend/proxy is
 * unreachable — so a request-level bridge is needed. The bridge used to guess
 * from a single failed request, which produced "Connection Lost" toasts on
 * perfectly healthy internet:
 *
 *   • a 503/504 from ONE microservice meant "you are offline"
 *   • a 30s axios timeout (slow report/PDF endpoint) meant "you are offline"
 *   • one request aborted by a navigation/unmount meant "you are offline"
 *   • once flagged, nothing cleared it unless another `api` request succeeded,
 *     so the toast could stay pinned forever while the app worked fine
 *
 * What counts now:
 *   1. only genuine transport failures (no HTTP response, DNS/refused/network)
 *   2. at least two of them inside FAILURE_WINDOW_MS (single blips stay silent)
 *   3. confirmation from a cheap gateway /health probe before the UI claims
 *      the user is offline
 *
 * Recovery is guaranteed too: while lost, the probe is retried on an interval
 * (and on tab focus), so the toast clears as soon as the backend answers again
 * even if no other request is in flight.
 */

export const CONNECTION_LOST_EVENT = 'app:connection-lost';
export const CONNECTION_RESTORED_EVENT = 'app:connection-restored';

const FAILURES_BEFORE_LOST = 2;
const FAILURE_WINDOW_MS = 20000;
const PROBE_TIMEOUT_MS = 4000;
const PROBE_INTERVAL_MS = 5000;

// Errors that mean "nothing answered": DNS failure, refused/reset socket, no route.
const TRANSPORT_ERROR_CODES = new Set([
  'ERR_NETWORK',
  'ERR_INTERNET_DISCONNECTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
]);

let consecutiveFailures = 0;
let lastFailureAt = 0;
let lost = false;
let probeTimer = null;
let probeInFlight = false;

const emit = (eventName) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(eventName));
};

export const isConnectionLost = () => lost;

/** Requests the app itself aborted (unmount, refresh, the 5s branch timeout). */
export const isCancelledRequest = (error) => {
  if (!error) return false;
  if (typeof axios.isCancel === 'function' && axios.isCancel(error)) return true;
  if (error.code === 'ERR_CANCELED') return true;
  if (error.name === 'CanceledError' || error.name === 'AbortError') return true;
  return Boolean(error.config?.signal?.aborted);
};

/**
 * True only for genuine "the network/backend never answered" failures.
 * An HTTP status — even 500/502/503/504 — means the backend DID answer, and a
 * timeout means it answered too slowly; neither is the user's internet dying.
 */
export const isTransportFailure = (error) => {
  if (!error || error.response) return false;
  if (isCancelledRequest(error)) return false;
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return false;
  return TRANSPORT_ERROR_CODES.has(error.code);
};

/**
 * One cheap, unauthenticated GET to the gateway root. In production nginx
 * answers /health directly (200 "healthy") without touching a microservice, so
 * this measures connectivity rather than the health of one service. Raw axios
 * (not the `api` instance) so it can never re-enter the interceptors.
 */
export const probeConnection = async () => {
  try {
    await axios.get(`${env.API_GATEWAY_URL}/health`, {
      timeout: PROBE_TIMEOUT_MS,
      withCredentials: false,
      headers: { 'Cache-Control': 'no-cache' },
    });
    return true;
  } catch {
    return false;
  }
};

const stopProbing = () => {
  if (probeTimer) {
    clearInterval(probeTimer);
    probeTimer = null;
  }
};

const startProbing = () => {
  stopProbing();
  probeTimer = setInterval(async () => {
    // Background tabs throttle timers anyway; skip the round-trip entirely.
    if (probeInFlight || (typeof document !== 'undefined' && document.hidden)) return;
    probeInFlight = true;
    const reachable = await probeConnection();
    probeInFlight = false;
    if (reachable) markConnectionRestored();
  }, PROBE_INTERVAL_MS);
};

/** The backend answered — clear the outage (and the toast) if one was announced. */
export const markConnectionRestored = () => {
  consecutiveFailures = 0;
  lastFailureAt = 0;
  stopProbing();
  if (!lost) return;
  lost = false;
  emit(CONNECTION_RESTORED_EVENT);
};

/** Feed every successful response here. */
export const reportSuccess = () => {
  markConnectionRestored();
};

/** Feed every failed request here; only probe-confirmed outages are announced. */
export const reportFailure = async (error) => {
  if (!isTransportFailure(error)) return;
  if (lost) return;

  const now = Date.now();
  consecutiveFailures = now - lastFailureAt > FAILURE_WINDOW_MS ? 1 : consecutiveFailures + 1;
  lastFailureAt = now;
  if (consecutiveFailures < FAILURES_BEFORE_LOST) return;

  // Confirm against the gateway before telling the user they are offline.
  if (await probeConnection()) {
    consecutiveFailures = 0;
    return;
  }

  lost = true;
  emit(CONNECTION_LOST_EVENT);
  startProbing();
};

/** Native `offline` event. Browsers do fire it spuriously, so confirm first. */
export const reportOfflineEvent = async () => {
  if (lost) return;
  if (await probeConnection()) return;
  lost = true;
  consecutiveFailures = FAILURES_BEFORE_LOST;
  emit(CONNECTION_LOST_EVENT);
  startProbing();
};

/** Native `online` event: only meaningful if the user was told they were offline. */
export const reportOnlineEvent = async () => {
  if (!lost) return;
  if (!(await probeConnection())) return;
  markConnectionRestored();
};