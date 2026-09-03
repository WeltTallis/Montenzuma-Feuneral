// ─── MUST BE FIRST: raise the libuv thread pool before any async I/O ───────
// dns.lookup(), fs, and crypto all share this pool (default size 4). With
// ~30 services being health-checked concurrently every 30s, 4 slots is not
// enough — real proxied requests queue behind stuck DNS/connect lookups for
// dead services, which is why /hearses was taking 14-23s even though the
// hearse service itself answers in ~50ms.
// This only works because it runs before any threadpool call happens in this
// process. For a fully reliable fix, also set UV_THREADPOOL_SIZE=64 in your
// docker-compose environment / Dockerfile ENV so it's set before Node starts.
if (!process.env.UV_THREADPOOL_SIZE) {
  process.env.UV_THREADPOOL_SIZE = '64';
}

// @montezuma/shared-logger is a TypeScript package compiled with a `default`
// export (plus a named `logger` export). When loaded through plain CommonJS
// `require()` it resolves to the module namespace object `{ __esModule:true,
// logger, default }`, so call `.default` (or `.logger`) when `require()` did not
// hand back the pino instance directly. Fall back to console so the gateway can
// always boot even if the logger transport fails to initialize.
const loggerModule = require('../../packages/shared-logger/src/index');
const Logger =
  (loggerModule && typeof loggerModule.info === 'function') ? loggerModule
    : (loggerModule && loggerModule.default && typeof loggerModule.default.info === 'function') ? loggerModule.default
      : (loggerModule && loggerModule.logger && typeof loggerModule.logger.info === 'function') ? loggerModule.logger
        : {
          debug: (...args) => console.log('[DEBUG]', ...args),
          info: (...args) => console.log('[INFO]', ...args),
          warn: (...args) => console.warn('[WARN]', ...args),
          error: (...args) => console.error('[ERROR]', ...args),
        };
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const dns = require('dns');
const http = require('http');
const fs = require('fs');
// Using Node's built-in global fetch (no explicit require needed, no
// version-mismatch risk from a transitively-hoisted undici copy). A prior
// version of this file used a manually constructed undici Agent/dispatcher
// for health checks, which started failing every single lookup instantly
// ("fetch failed") for every service, including ones that had been
// reliably healthy for hours. Root cause not worth chasing further —
// plain global fetch is what worked before and is what's used here again.

// Load .env from the api-gateway directory specifically
const dotenvPath = path.join(__dirname, '.env');
console.log('Loading .env from:', dotenvPath);
dotenv.config({ path: dotenvPath, override: false });

// ─── Runtime environment guard for service URLs ──────────────────────────
// The .env bundled into the Docker image carries LOCAL (host) service URLs
// (http://127.0.0.1:<host-port>). Inside a container, 127.0.0.1 is THIS
// gateway process, so those URLs yield ECONNREFUSED for every service —
// exactly the "Now API Gateway is Down" production failure. Detect container
// mode and rewrite any loopback service URL to the canonical Docker DNS
// name. Explicit environment variables (docker-compose `environment:`,
// `docker run -e`, CI secrets) always take precedence over the bundled .env
// (dotenv is loaded with override:false above) — this guard only repairs
// loopback values that arrived from the bundled .env file. On the host
// (nodemon / local dev) nothing is rewritten.
const isRunningInContainer =
  process.env.RUNNING_IN_DOCKER === 'true' ||
  (function () {
    try { return fs.existsSync('/.dockerenv'); } catch { return false; }
  })();

// Canonical Docker-network URLs (container_name + in-container listen port).
// Used (a) as fallback when no env var is set and (b) as rewrite targets for
// loopback URLs found while running inside a container. NOTE: workshop uses
// 6969 because docker-compose.prod.yml sets PORT=6969 for that container and
// points the gateway at :6969 (dev compose maps 6969:5000 with PORT=5000 —
// if you deploy with the dev file, override WORKSHOP_SERVICE_URL there).
const DOCKER_SERVICE_DEFAULTS = {
  auth: 'http://restpoint_auth_service:5000',
  tenant: 'http://restpoint_tenant_service:5000',
  deceased: 'http://restpoint_deceased_service:5000',
  coffin: 'http://restpoint_coffin_service:5000',
  marketplace: 'http://restpoint_marketplace_service:5000',
  mpesa: 'http://restpoint_mpesa_service:5000',
  portal: 'http://restpoint_portal_service:5000',
  invoices: 'http://restpoint_invoice_service:5000',
  // Notification REST (bell list / mark-read / delete) is implemented by the
  // socketio-service (see services/socketio-service/server.ts). There is NO
  // notification-service container in this repo: pointing at the old name
  // produced a guaranteed ECONNREFUSED on every request, so the UI bell never
  // showed anything even when Redis and Socket.IO were perfectly healthy.
  notification: 'http://restpoint_socketio_service:5000',
  documents: 'http://restpoint_documents_service:5000',
  analytics: 'http://restpoint_analytics_service:5000',
  bodycheckout: 'http://restpoint_bodycheckout_service:5000',
  edocuments: 'http://restpoint_edocuments_service:5000',
  calendar: 'http://restpoint_calender_service:5000', // (sic) container name
  chemicals: 'http://restpoint_chemical_service:5000',
  billing: 'http://restpoint_billing_service:5000',
  socketio: 'http://restpoint_socketio_service:5000',
  workshop: 'http://restpoint_workshop_service:6969',
  extra: 'http://restpoint_extra_services:5000',
  call: 'http://restpoint_call_service:5000',
  qrcode: 'http://restpoint_qrcode_service:5000',
  scanner: 'http://restpoint_scanner_service:2024',
  hearse: 'http://restpoint_hearse_service:5000',
  leave: 'http://restpoint_leave_service:5000',
  support: 'http://restpoint_support_service:5000',
  // Florist service IS a container now (services/florist-service/Dockerfile,
  // container restpoint_florist_service on the restpoint_network, internal port
  // 5000, published on the host as 7070). The gateway container reaches it via
  // the Docker network hostname below; FLORIST_SERVICE_URL in
  // docker-compose.yml / docker-compose.prod.yml overrides this default.
  florist: 'http://restpoint_florist_service:5000',
  store: 'http://restpoint_store_service:5000',
};

const LOOPBACK_URL_RE = /^https?:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?(?:\/|$)/i;
const DOCKER_HOSTNAME_RE = /^https?:\/\/(?:restpoint_|host\.docker\.internal)/i;

// Host-mode equivalents of DOCKER_SERVICE_DEFAULTS: 127.0.0.1 + the host port
// each service is published on by docker-compose.yml / docker-compose.prod.yml
// (same values the local-development .env uses). Used ONLY when the gateway is
// NOT in a container and someone handed it Docker-network hostnames
// (restpoint_*), which cannot resolve outside the Docker network — the mirror
// image of the loopback-in-container failure above. Services without a known
// host port (not published for host use) keep their URL and just warn.
const HOST_SERVICE_DEFAULTS = {
  auth: 'http://127.0.0.1:5001',
  tenant: 'http://127.0.0.1:5002',
  deceased: 'http://127.0.0.1:5003',
  invoices: 'http://127.0.0.1:5005',
  coffin: 'http://127.0.0.1:5006',
  documents: 'http://127.0.0.1:5011',
  analytics: 'http://127.0.0.1:5009',
  socketio: 'http://127.0.0.1:5018',
  // Notification REST is served by the socketio-service, so in host mode it
  // uses the same host-published port as socketio.
  notification: 'http://127.0.0.1:5018',
  bodycheckout: 'http://127.0.0.1:5015',
  chemicals: 'http://127.0.0.1:5105',
  billing: 'http://127.0.0.1:5020',
  workshop: 'http://127.0.0.1:6969',
  extra: 'http://127.0.0.1:5016',
  scanner: 'http://127.0.0.1:2024',
  hearse: 'http://127.0.0.1:5023',
  leave: 'http://127.0.0.1:5017',
  support: 'http://127.0.0.1:8111',
  florist: 'http://127.0.0.1:7070',
  store: 'http://127.0.0.1:7071',
};

function resolveServiceUrl(envKey, serviceKey) {
  const configured = process.env[envKey];
  let url = configured || DOCKER_SERVICE_DEFAULTS[serviceKey];

  if (isRunningInContainer && LOOPBACK_URL_RE.test(url)) {
    url = DOCKER_SERVICE_DEFAULTS[serviceKey];
    console.log(`[RUNTIME] Container mode: ${envKey} loopback URL rewritten to ${url}`);
  } else if (!isRunningInContainer && DOCKER_HOSTNAME_RE.test(url)) {
    // Host process pointed at a Docker-network hostname: it cannot resolve
    // outside the Docker network (ENOTFOUND) — the exact misconfiguration
    // that marked every healthy service DOWN. Rewrite to the host-published
    // port where one is known (explicit env vars still win — this only
    // repairs values that arrived from a bundled/prod .env or shell export).
    const hostUrl = HOST_SERVICE_DEFAULTS[serviceKey];
    if (hostUrl) {
      console.warn(`[RUNTIME] Host mode: ${envKey}=${url} is a Docker-network hostname (unresolvable outside Docker). Rewritten to ${hostUrl}.`);
      url = hostUrl;
    } else {
      console.warn(`[RUNTIME WARNING] ${envKey}=${url} is a Docker-network hostname but the gateway is NOT running in a container and no host port is known for "${serviceKey}". Requests to it will fail with ENOTFOUND until ${envKey} is set to a reachable URL.`);
    }
  }
  return url;
}

// ─── DNS Lookup Cache ────────────────────────────────────────────────────
// Docker service names resolve to a stable container IP for the life of the
// container. Without caching, every proxied request AND every health check
// re-issues a getaddrinfo() call through the (now-larger, but still finite)
// libuv thread pool. This cache removes the vast majority of those calls and
// de-dupes concurrent lookups for the same hostname so a burst of health
// checks doesn't fire 20 identical DNS queries at once.
//
// ROOT-CAUSE NOTE — the "Invalid IP address: undefined" production outage:
// Node ≥ 20 runs net.connect() in autoSelectFamily ("Happy Eyeballs") mode,
// and that path calls custom lookup functions with options.all === true,
// expecting the callback to receive an ARRAY of { address, family } results.
// The previous implementation ignored the options argument and always
// answered with a single (address, family) pair, so every NEW socket to a
// backend died with ERR_INVALID_IP_ADDRESS("undefined") — all proxied
// traffic returned 503 while local routes (e.g. /health) kept working.
// This version honors the caller's options, returns the exact shape Node
// asked for, and validates every result before caching/forwarding it.
const DNS_CACHE_TTL_MS = 60000;
const dnsCache = new Map(); // "<host>|<family>|all|one" -> { expires, address?, family?, results? }
const dnsInFlight = new Map(); // same key -> Promise

function cachedLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  const wantsAll = !!(options && options.all);
  const family = (options && options.family) || 0;
  const cacheKey = `${hostname}|${family}|${wantsAll ? 'all' : 'one'}`;

  const cached = dnsCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    if (wantsAll) return callback(null, cached.results);
    return callback(null, cached.address, cached.family);
  }

  if (dnsInFlight.has(cacheKey)) {
    dnsInFlight.get(cacheKey).then(
      (result) => {
        if (wantsAll) return callback(null, result.results);
        callback(null, result.address, result.family);
      },
      (err) => callback(err)
    );
    return;
  }

  const lookupPromise = new Promise((resolve, reject) => {
    dns.lookup(hostname, { ...options }, (err, address, resolvedFamily) => {
      dnsInFlight.delete(cacheKey);
      if (err) return reject(err);

      if (wantsAll) {
        // options.all === true → dns.lookup hands back an array of results
        // (the second callback argument), which is what autoSelectFamily
        // net.connect() requires. Never cache/forward an empty answer.
        const results = Array.isArray(address) ? address : [];
        if (results.length === 0) {
          return reject(new Error(`DNS lookup for ${hostname} returned no addresses`));
        }
        dnsCache.set(cacheKey, { results, expires: Date.now() + DNS_CACHE_TTL_MS });
        return resolve({ results });
      }

      // Single-result form: net.js converts a missing address or a family
      // outside 4/6 into ERR_INVALID_IP_ADDRESS, so reject instead of
      // caching or forwarding anything malformed.
      if (!address || (resolvedFamily !== 4 && resolvedFamily !== 6)) {
        return reject(new Error(`DNS lookup for ${hostname} returned an invalid address/family`));
      }
      dnsCache.set(cacheKey, { address, family: resolvedFamily, expires: Date.now() + DNS_CACHE_TTL_MS });
      resolve({ address, family: resolvedFamily });
    });
  });
  dnsInFlight.set(cacheKey, lookupPromise);
  lookupPromise.then(
    (result) => {
      if (wantsAll) return callback(null, result.results);
      callback(null, result.address, result.family);
    },
    (err) => callback(err)
  );
}

// ─── Shared keep-alive HTTP agent for proxied traffic ───────────────────
// Reuses TCP sockets to each backend instead of opening a fresh connection
// (and doing a fresh DNS lookup) per request.
const sharedHttpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 10000,
  maxSockets: 100,
  maxFreeSockets: 20,
  lookup: cachedLookup,
});

// ─── Small bounded-concurrency runner: REMOVED with the health-check loop ─
// (was only used to pace the periodic backend probes that no longer exist;
// proxied traffic uses the shared keep-alive agent's own socket limits).

// ─── Redis Client for Direct Notification Access ────────────────────
// Uses ioredis (declared dependency of this service and the repo-wide Redis
// client per SERVICE_TOPOLOGY.md). lazyConnect keeps the explicit .connect()
// call below meaningful; retryStrategy gives up after ~10s so a missing
// Redis degrades gracefully instead of spamming reconnect errors forever.
let redisClient = null;
let redisConnected = false;

try {
  const Redis = require('ioredis');
  const redisUrl = process.env.REDIS_URL || 'redis://restpoint_redis:6379';
  redisClient = new Redis(redisUrl, {
    lazyConnect: true,
    retryStrategy: (times) => (times > 20 ? null : Math.min(times * 500, 2000)),
  });

  redisClient.on('connect', () => {
    redisConnected = true;
    console.log(`[REDIS] Connected to ${redisUrl}`);
  });

  redisClient.on('error', (err) => {
    redisConnected = false;
    console.warn(`[REDIS] Error: ${err.message}`);
  });

  redisClient.on('end', () => {
    redisConnected = false;
    console.warn('[REDIS] Disconnected');
  });

  redisClient.connect().catch(err => {
    console.warn(`[REDIS] Failed to connect: ${err.message}`);
  });
} catch (err) {
  console.warn('[REDIS] ioredis not available, notifications will return empty');
}

const APP_NAME = 'restpoint-gateway';
const APP_VERSION = '2.0.2';

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const isProd = (process.env.NODE_ENV || 'development') === 'production';

// SERVICE URLS — resolved through resolveServiceUrl() so that:
//  - explicit env vars (compose `environment:`, `docker run -e`, shell) win;
//  - inside a container, any residual loopback URL from the bundled .env is
//    rewritten to the canonical Docker DNS name;
//  - on the host, Docker-only hostnames are warned about (they ENOTFOUND).
const SERVICE_URLS = {
  auth: resolveServiceUrl('AUTH_SERVICE_URL', 'auth'),
  tenant: resolveServiceUrl('TENANT_SERVICE_URL', 'tenant'),
  deceased: resolveServiceUrl('DECEASED_SERVICE_URL', 'deceased'),
  coffin: resolveServiceUrl('COFFIN_SERVICE_URL', 'coffin'),
  marketplace: resolveServiceUrl('MARKETPLACE_SERVICE_URL', 'marketplace'),
  mpesa: resolveServiceUrl('MPESA_SERVICE_URL', 'mpesa'),
  portal: resolveServiceUrl('PORTAL_SERVICE_URL', 'portal'),
  invoices: resolveServiceUrl('INVOICES_SERVICE_URL', 'invoices'),
  notification: resolveServiceUrl('NOTIFICATION_SERVICE_URL', 'notification'),
  documents: resolveServiceUrl('DOCUMENTS_SERVICE_URL', 'documents'),
  analytics: resolveServiceUrl('ANALYTICS_SERVICE_URL', 'analytics'),
  bodycheckout: resolveServiceUrl('BODYCHECKOUT_SERVICE_URL', 'bodycheckout'),
  edocuments: resolveServiceUrl('EDOCUMENTS_SERVICE_URL', 'edocuments'),
  calendar: resolveServiceUrl('CALENDAR_SERVICE_URL', 'calendar'),
  chemicals: resolveServiceUrl('CHEMICALS_SERVICE_URL', 'chemicals'),
  billing: resolveServiceUrl('BILLING_SERVICE_URL', 'billing'),
  socketio: resolveServiceUrl('SOCKETIO_SERVICE_URL', 'socketio'),
  workshop: resolveServiceUrl('WORKSHOP_SERVICE_URL', 'workshop'),
  extra: resolveServiceUrl('EXTRA_SERVICES_URL', 'extra'),
  call: resolveServiceUrl('CALL_SERVICE_URL', 'call'),
  qrcode: resolveServiceUrl('QRCODE_SERVICE_URL', 'qrcode'),
  scanner: resolveServiceUrl('SCANNER_SERVICE_URL', 'scanner'),
  hearse: resolveServiceUrl('HEARSE_SERVICE_URL', 'hearse'),
  leave: resolveServiceUrl('LEAVE_SERVICE_URL', 'leave'),
  support: resolveServiceUrl('SUPPORT_SERVICE_URL', 'support'),
  florist: resolveServiceUrl('FLORIST_SERVICE_URL', 'florist'),
  store: resolveServiceUrl('STORE_SERVICE_URL', 'store'),
};

const app = express();

// ─── Service health monitoring: REMOVED ─────────────────────────────
// The gateway no longer probes backend /health endpoints at all — the
// background 30s loop, the startup sweep, and the per-service DOWN/UP
// bookkeeping are gone. Why:
//   1. In production the probe results were wrong more often than right.
//      One wrong service URL (loopback inside a container, or Docker DNS
//      hostname on the host) made /health report EVERY service DOWN even
//      though real traffic flowed — exactly the "all services down" outage.
//   2. Nothing ever consumed the results as a gate: the proxy below never
//      blocked on them, and no dashboard reads the per-service map.
// What protects callers now is the proxy's own per-request timeout (30s)
// and its error handler, which react to the actual request's outcome.
// GET /health still returns 200 (Docker/compose HEALTHCHECK, nginx,
// blackbox-exporter and `make health` depend on that) and lists the
// RESOLVED routing table — no health claims — so a misconfigured service
// URL remains visible for debugging.

if ((process.env.TRUST_PROXY || 'false').toString().toLowerCase() === 'true') {
  app.set('trust proxy', 1);
  Logger.info('Express trust proxy enabled (trust first hop)');
}

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'QUERY', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-branch-db', 'x-slug', 'x-tenant-slug', 'x-tenant-id', 'x-user-id', 'x-branch-id', 'x-branch-code', 'x-branch-slug', 'x-user-email', 'x-user-name', 'Origin', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

app.use(hpp({
  whitelist: ['page', 'limit', 'status', 'search'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(process.env.JWT_SECRET));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use('/api/', apiLimiter);

app.use((req, res, next) => {
  Logger.info(`→ ${req.method} ${req.originalUrl}`);
  next();
});

// ─── Service health gating: REMOVED ─────────────────────────────────────
// There is no background health-check loop anymore (see the block near the
// top of this file) and no per-request availability gate either. The
// proxy's own per-request timeout (30s, below) and its error handler are
// what protect callers, because they react to that specific request's own
// outcome.
//
// One exception: the notification service has no container defined in
// docker-compose at all, so proxying to it is a guaranteed connection
// error on every request. Short-circuit that one permanently-absent
// service to an empty-result fallback instead of paying a failed round
// trip on every page load.
const KNOWN_UNDEPLOYED_SERVICES = new Set(['notification', 'notifications']);

async function checkServiceAvailability(req, res, next) {
  const urlWithoutQuery = req.url.split('?')[0];
  const pathParts = urlWithoutQuery.split('/').filter(Boolean);
  const firstSegment = pathParts[0];

  if (!firstSegment) {
    return res.status(400).json({ success: false, message: 'No service specified' });
  }

  const serviceName = Object.keys(SERVICE_ROUTES).find(
    route => firstSegment === route || firstSegment.startsWith(route + '-')
  );

  if (serviceName && KNOWN_UNDEPLOYED_SERVICES.has(serviceName)) {
    return res.status(200).json({
      notifications: [],
      total: 0,
      source: 'gateway-fallback',
      message: 'Notification service is not deployed'
    });
  }

  next();
}

// SERVICE ROUTING TABLE
const SERVICE_ROUTES = {
  'auth': SERVICE_URLS.auth,
  'login': SERVICE_URLS.auth,
  'register': SERVICE_URLS.auth,
  'logout': SERVICE_URLS.auth,
  'refresh': SERVICE_URLS.auth,
  'users': SERVICE_URLS.auth,
  'change-password': SERVICE_URLS.auth,
  'me': SERVICE_URLS.auth,

  'tenant': SERVICE_URLS.tenant,
  'tenants': SERVICE_URLS.tenant,
  'system-admin': SERVICE_URLS.tenant,
  'uploads': SERVICE_URLS.tenant,

  'deceased': SERVICE_URLS.deceased,
  'autopsy': SERVICE_URLS.deceased,
  'postmortem': SERVICE_URLS.deceased,
  'postmortem-requests': SERVICE_URLS.deceased,
  'charges': SERVICE_URLS.deceased,
  'payments': SERVICE_URLS.deceased,
  'charge-settings': SERVICE_URLS.deceased,
  'embalming': SERVICE_URLS.deceased,

  'hearses': SERVICE_URLS.hearse,
  'hearse-bookings': SERVICE_URLS.hearse,
  'all-drivers': SERVICE_URLS.hearse,
  'drivers': SERVICE_URLS.hearse,

  'coffins': SERVICE_URLS.coffin,
  'chemicals': SERVICE_URLS.chemicals,
  'support': SERVICE_URLS.support,
  'invoices': SERVICE_URLS.invoices,
  'billing': SERVICE_URLS.billing,
  'scanner': SERVICE_URLS.scanner,
  'workshop': SERVICE_URLS.workshop,
  'florist': SERVICE_URLS.florist,
  'documents': SERVICE_URLS.documents,
  'notification': SERVICE_URLS.notification,
  'notifications': SERVICE_URLS.notification,
  'edocuments': SERVICE_URLS.edocuments,
  'leaves': SERVICE_URLS.leave,
  'analytics': SERVICE_URLS.analytics,
  'bodycheckout': SERVICE_URLS.bodycheckout,
  'body-release': SERVICE_URLS.bodycheckout,
  'extra': SERVICE_URLS.extra,
  'call': SERVICE_URLS.call,
  'qrcode': SERVICE_URLS.qrcode,
  'onboarding': SERVICE_URLS.tenant,
  'portal': SERVICE_URLS.portal,
  'public': SERVICE_URLS.portal,
  'mpesa': SERVICE_URLS.mpesa,
  'marketplace': SERVICE_URLS.marketplace,
  'store': SERVICE_URLS.store,
};

// Fallback URLs for services that may not be reachable via primary URL.
// Used when the primary target fails to connect (e.g., host.docker.internal
// not resolving on Linux production). The gateway retries the request
// against the fallback URL before returning an error to the client.
const SERVICE_FALLBACK_URLS = {
  // Fallback URL when the primary target fails to connect. The primary florist
  // URL is http://host.docker.internal:7070 (set in DOCKER_SERVICE_DEFAULTS).
  // On some Linux hosts, host.docker.internal may not resolve, so we fall back
  // to the Docker bridge gateway IP (172.17.0.1) which routes to the host.
  // Override with FALLBACK_FLORIST_SERVICE_URL if the host is reachable at a
  // different address (e.g., a LAN IP on production).
  florist: process.env.FALLBACK_FLORIST_SERVICE_URL || 'http://172.17.0.1:7070',
};

// Create proxy instances for each unique target URL (cached), now sharing
// the keep-alive agent + DNS cache instead of opening a fresh connection
// (and DNS lookup) per request.
//
// NOTE: http-proxy-middleware v2+ moved the request/response/error hooks
// from top-level `onProxyReq` / `onProxyRes` / `onError` options into a
// nested `on: { proxyReq, proxyRes, error }` object. Passing the old
// top-level keys on v2+ is *silently ignored* — no warning, no crash — which
// means fixRequestBody() never runs (POST bodies get dropped) and the
// library falls back to its own generic error handler, which is exactly
// what produced the bare "Error occurred while trying to proxy: <host>"
// 500 response instead of the JSON 503 below. Using `on: {}` fixes both.
const proxyCache = {};
for (const targetUrl of Object.values(SERVICE_ROUTES)) {
  if (!proxyCache[targetUrl]) {
    proxyCache[targetUrl] = createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      secure: false,
      agent: sharedHttpAgent,
      proxyTimeout: 30000,
      timeout: 30000,
      on: {
        proxyReq: (proxyReq, req, res) => {
          if (req.headers.authorization) proxyReq.setHeader('Authorization', req.headers.authorization);
          if (req.headers['x-tenant-slug']) proxyReq.setHeader('x-tenant-slug', req.headers['x-tenant-slug']);
          if (req.headers['x-tenant-id']) proxyReq.setHeader('x-tenant-id', req.headers['x-tenant-id']);
          if (req.headers['x-user-id']) proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
          if (req.headers['x-branch-slug']) proxyReq.setHeader('x-branch-slug', req.headers['x-branch-slug']);
          if (req.headers['x-branch-id']) proxyReq.setHeader('x-branch-id', req.headers['x-branch-id']);
          // Re-stream the already-consumed body safely. A manual
          // JSON.stringify + proxyReq.write() here is a known-fragile
          // pattern with http-proxy-middleware: it can throw "write after
          // end" or leave the proxied socket in a bad state for certain
          // payloads, which surfaces to the client as a 502/500 (the
          // gateway process resets the connection mid-request).
          // fixRequestBody is the library's own helper for this exact
          // problem.
          try {
            fixRequestBody(proxyReq, req);
          } catch (bodyErr) {
            Logger.error(`[PROXY] Failed to re-stream body for ${req.method} ${req.originalUrl}: ${bodyErr.message}`);
          }
        },
        proxyRes: (proxyRes, req, res) => {
          Logger.debug(`[PROXY] ${req.method} ${req.originalUrl} → ${proxyRes.statusCode}`);
          const origin = req.headers.origin;
          if (origin && allowedOrigins.includes(origin)) {
            proxyRes.headers['Access-Control-Allow-Origin'] = origin;
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            if (proxyRes.headers['Access-Control-Allow-Origin'] === '*') {
              proxyRes.headers['Access-Control-Allow-Origin'] = origin;
            }
          }
        },
        error: (err, req, res) => {
          // Determine the service key from the target URL for fallback lookup
          const serviceEntry = Object.entries(SERVICE_URLS).find(([key, val]) => val === targetUrl);
          const serviceKey = serviceEntry ? serviceEntry[0] : null;
          const fallbackUrl = serviceKey ? SERVICE_FALLBACK_URLS[serviceKey] : null;

          // If the primary target failed and a fallback URL exists (and is different),
          // retry the request against the fallback URL before giving up.
          if (fallbackUrl && fallbackUrl !== targetUrl && !res.headersSent && !res.writableEnded) {
            Logger.warn(`[PROXY FALLBACK] Primary ${targetUrl} failed (${err.code || err.message}) for ${req.method} ${req.originalUrl} — retrying via ${fallbackUrl}`);

            // Get or create a proxy instance for the fallback target
            if (!proxyCache[fallbackUrl]) {
              proxyCache[fallbackUrl] = createProxyMiddleware({
                target: fallbackUrl,
                changeOrigin: true,
                secure: false,
                agent: sharedHttpAgent,
                proxyTimeout: 30000,
                timeout: 30000,
                on: {
                  proxyReq: (proxyReq, req, res) => {
                    if (req.headers.authorization) proxyReq.setHeader('Authorization', req.headers.authorization);
                    if (req.headers['x-tenant-slug']) proxyReq.setHeader('x-tenant-slug', req.headers['x-tenant-slug']);
                    if (req.headers['x-tenant-id']) proxyReq.setHeader('x-tenant-id', req.headers['x-tenant-id']);
                    if (req.headers['x-user-id']) proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
                    if (req.headers['x-branch-slug']) proxyReq.setHeader('x-branch-slug', req.headers['x-branch-slug']);
                    if (req.headers['x-branch-id']) proxyReq.setHeader('x-branch-id', req.headers['x-branch-id']);
                    try { fixRequestBody(proxyReq, req); } catch (e) { /* ignore */ }
                  },
                  error: (fallbackErr, req, res) => {
                    Logger.error(`[PROXY FALLBACK ERROR] Fallback ${fallbackUrl} also failed for ${req.method} ${req.originalUrl}: ${fallbackErr.message}`);
                    if (!res.headersSent) {
                      const firstSegment = (req.originalUrl || req.url || '').split('/').filter(Boolean)[2] || 'unknown';
                      res.status(503).json({
                        success: false,
                        message: 'Now API Gateway is Down',
                        description: 'Unable to connect to the API Gateway.',
                        details: 'No services can be reached at the moment.',
                        action: 'Please contact the System Administrator.',
                        service: firstSegment,
                        error: fallbackErr.code || fallbackErr.message,
                        target: fallbackUrl,
                        timestamp: new Date().toISOString()
                      });
                    }
                  }
                }
              });
            }

            const fallbackProxy = proxyCache[fallbackUrl];
            if (fallbackProxy) {
              fallbackProxy(req, res, (retryErr) => {
                if (retryErr && !res.headersSent) {
                  Logger.error(`[PROXY FALLBACK ERROR] Retry callback error: ${retryErr.message}`);
                }
              });
              return;
            }
          }

          Logger.error(`[PROXY ERROR] ${req.method} ${req.originalUrl}: ${err.message}`);
          if (!res.headersSent) {
            const firstSegment = (req.originalUrl || req.url || '').split('/').filter(Boolean)[2] || 'unknown';
            const friendlyName = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);

            // FIX: Use targetUrl from the closure - this is now properly captured
            res.status(503).json({
              success: false,
              message: 'Now API Gateway is Down',
              description: 'Unable to connect to the API Gateway.',
              details: 'No services can be reached at the moment.',
              action: 'Please contact the System Administrator.',
              service: firstSegment,
              serviceName: friendlyName,
              error: err.code || err.message,
              target: targetUrl,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    });
  }
}

// Dynamic routing middleware mounted at /api/v1/restpoint
app.use('/api/v1/restpoint', checkServiceAvailability, (req, res, next) => {
  const urlWithoutQuery = req.url.split('?')[0];
  const pathParts = urlWithoutQuery.split('/').filter(Boolean);
  const firstSegment = pathParts[0];

  if (!firstSegment) {
    return res.status(400).json({ success: false, message: 'No service specified' });
  }

  const targetUrl = SERVICE_ROUTES[firstSegment];
  if (!targetUrl) {
    Logger.warn(`[ROUTE] Unknown service: ${firstSegment} (from ${req.originalUrl})`);
    return res.status(404).json({
      success: false,
      message: `Unknown service: ${firstSegment}`,
      path: req.originalUrl
    });
  }

  let rewrittenUrl = req.url;
  if (firstSegment === 'auth' || firstSegment === 'login' ||
    firstSegment === 'register' || firstSegment === 'logout' ||
    firstSegment === 'refresh' || firstSegment === 'users' ||
    firstSegment === 'change-password' || firstSegment === 'me') {
    if (!pathParts[0]?.startsWith('auth/') && pathParts[0] !== 'auth') {
      rewrittenUrl = '/auth' + req.url;
    }
  }

  if (firstSegment === 'store' || firstSegment === 'store-service') {
    rewrittenUrl = '/api' + req.url;
  }

  Logger.debug(`[ROUTE] ${req.method} ${req.originalUrl} → ${targetUrl}${rewrittenUrl}`);

  const originalUrl = req.url;
  req.url = rewrittenUrl;

  const proxy = proxyCache[targetUrl];
  if (proxy) {
    proxy(req, res, (err) => {
      req.url = originalUrl;
      if (err) {
        Logger.error(`[PROXY ERROR] ${req.method} ${req.originalUrl}: ${err.message}`);
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            message: 'Now API Gateway is Down',
            description: 'Unable to connect to the API Gateway.',
            details: 'No services can be reached at the moment.',
            action: 'Please contact the System Administrator.',
            service: firstSegment,
            error: err.code || err.message,
            target: targetUrl,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    return;
  }

  req.url = originalUrl;
  return res.status(500).json({ success: false, message: 'Proxy not available' });
});

// =============================================================================
// HEALTH & DEBUG (must be before 404 handler)
// =============================================================================

app.get('/health', (req, res) => {
  // Static self-report. The gateway does NOT probe backend services anymore
  // (health monitoring removed — see the block near the top of this file),
  // so there are no per-service health claims here. The routing table below
  // shows the RESOLVED target URL for every service, which is how you debug
  // "wrong URL" misconfigurations (loopback-in-container, Docker-hostname-on-
  // host) that used to fake an "all services down" outage. Always 200: the
  // Docker HEALTHCHECK, nginx, blackbox-exporter and `make health` only need
  // to know THIS process is alive and serving.
  const routingTable = {};
  Object.keys(SERVICE_URLS).forEach(serviceName => {
    routingTable[serviceName] = { url: SERVICE_URLS[serviceName] };
  });

  res.status(200).json({
    success: true,
    status: 'ok',
    service: APP_NAME,
    version: APP_VERSION,
    port: PORT,
    uptime: process.uptime(),
    monitoring: 'disabled',
    services: routingTable,
  });
});

app.head('/health', (_req, res) => {
  res.status(200).end();
});

// Debug endpoint: inspect the DNS cache directly to confirm lookups are
// actually being reused (helpful while validating the fix).
app.get('/debug/dns-cache', (req, res) => {
  const entries = {};
  for (const [hostname, val] of dnsCache.entries()) {
    entries[hostname] = { ...val, expiresIn: Math.max(0, val.expires - Date.now()) };
  }
  res.json({ success: true, threadpoolSize: process.env.UV_THREADPOOL_SIZE, entries });
});

// 404 HANDLER
app.use((req, res) => {
  Logger.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Now API Gateway is Down',
    description: 'Unable to connect to the API Gateway.',
    details: 'No services can be reached at the moment.',
    action: 'Please contact the System Administrator.',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  Logger.error(`Server Error: ${err.message}`);
  res.status(500).json({
    success: false,
    message: 'Now API Gateway is Down',
    description: 'Unable to connect to the API Gateway.',
    details: 'No services can be reached at the moment.',
    action: 'Please contact the System Administrator.',
    error: isProd ? undefined : err.message,
    timestamp: new Date().toISOString()
  });
});

// START SERVER
const server = app.listen(PORT, HOST, () => {
  Logger.info(`  ${APP_NAME} v${APP_VERSION}`);
  Logger.info(`  Running on http://${HOST}:${PORT}`);
  Logger.info(`  UV_THREADPOOL_SIZE=${process.env.UV_THREADPOOL_SIZE}`);
  Logger.info(`  Service health monitoring: disabled (proxy reacts to real requests)`);
  Logger.info(' Available Endpoints:');
  Logger.info(`   GET  http://localhost:${PORT}/health`);
  Logger.info(`   GET  http://localhost:${PORT}/debug/dns-cache`);

  // Startup routing table — makes a misconfigured service URL visible
  // immediately in `docker logs` instead of hiding inside probe failures.
  Logger.info(' Resolved service routing table:');
  for (const [name, url] of Object.entries(SERVICE_URLS)) {
    Logger.info(`   ${name} → ${url}`);
  }
});

const gracefulShutdown = (signal) => {
  Logger.info(`Shutting down (${signal})...`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  Logger.error({ message: 'Unhandled Rejection in api gateway', error: reason });
});

process.on('uncaughtException', (err) => {
  Logger.error({ message: 'Uncaught Exception in api gateway', error: err });
});

module.exports = app;