// ─── MUST BE FIRST: raise the libuv thread pool before any async I/O ───────

if (!process.env.UV_THREADPOOL_SIZE) {
  process.env.UV_THREADPOOL_SIZE = '64';
}

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
// undici ships as a dependency of Node/express-stack projects in most cases;
// if it's not already in package.json, run: npm install undici
const { Agent: UndiciAgent, fetch: undiciFetch } = require('undici');

// Load .env from the api-gateway directory specifically
const dotenvPath = path.join(__dirname, '.env');
console.log('Loading .env from:', dotenvPath);
dotenv.config({ path: dotenvPath, override: false });

// ─── DNS Lookup Cache ────────────────────────────────────────────────────
// Docker service names resolve to a stable container IP for the life of the
// container. Without caching, every proxied request AND every health check
// re-issues a getaddrinfo() call through the (now-larger, but still finite)
// libuv thread pool. This cache removes the vast majority of those calls and
// de-dupes concurrent lookups for the same hostname so a burst of health
// checks doesn't fire 20 identical DNS queries at once.
const DNS_CACHE_TTL_MS = 60000;
const dnsCache = new Map(); // hostname -> { address, family, expires }
const dnsInFlight = new Map(); // hostname -> Promise

function cachedLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  const cached = dnsCache.get(hostname);
  if (cached && cached.expires > Date.now()) {
    return callback(null, cached.address, cached.family);
  }

  if (dnsInFlight.has(hostname)) {
    dnsInFlight.get(hostname).then(
      (result) => callback(null, result.address, result.family),
      (err) => callback(err)
    );
    return;
  }

  const lookupPromise = new Promise((resolve, reject) => {
    dns.lookup(hostname, {}, (err, address, family) => {
      dnsInFlight.delete(hostname);
      if (err) return reject(err);
      dnsCache.set(hostname, { address, family, expires: Date.now() + DNS_CACHE_TTL_MS });
      resolve({ address, family });
    });
  });
  dnsInFlight.set(hostname, lookupPromise);
  lookupPromise.then(
    (result) => callback(null, result.address, result.family),
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

// ─── Dedicated dispatcher for health-check fetches ───────────────────────
// Kept separate from real traffic so a storm of health checks against dead
// services can't monopolize sockets that real proxied requests need, and
// uses the same DNS cache so lookups aren't repeated every 30s.
const healthCheckDispatcher = new UndiciAgent({
  connect: { lookup: cachedLookup },
  keepAliveTimeout: 10000,
  connections: 10, // cap concurrent sockets per health-check target
});

// ─── Small bounded-concurrency runner (no extra dependency needed) ──────
// Replaces "fire all 30 health checks at once" with "run at most N at a
// time" so a burst of dead-service lookups can't queue up and delay real
// request DNS/connect work that shares the same thread pool.
async function runWithConcurrencyLimit(taskFns, limit) {
  const results = new Array(taskFns.length);
  let cursor = 0;
  async function worker() {
    while (cursor < taskFns.length) {
      const idx = cursor++;
      try {
        results[idx] = { status: 'fulfilled', value: await taskFns[idx]() };
      } catch (reason) {
        results[idx] = { status: 'rejected', reason };
      }
    }
  }
  const workers = Array.from({ length: Math.min(limit, taskFns.length) }, worker);
  await Promise.all(workers);
  return results;
}

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
const APP_VERSION = '2.0.1';

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const isProd = (process.env.NODE_ENV || 'development') === 'production';

// SERVICE URLS — Docker DNS container names + internal listen ports.
// 127.0.0.1 inside a container resolves to the gateway itself, not the
// target service, so it must NOT be used as a fallback in production.
const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://restpoint_auth_service:5000',
  tenant: process.env.TENANT_SERVICE_URL || 'http://restpoint_tenant_service:5000',
  deceased: process.env.DECEASED_SERVICE_URL || 'http://restpoint_deceased_service:5000',
  coffin: process.env.COFFIN_SERVICE_URL || 'http://restpoint_coffin_service:5000',
  marketplace: process.env.MARKETPLACE_SERVICE_URL || 'http://restpoint_marketplace_service:5000',
  mpesa: process.env.MPESA_SERVICE_URL || 'http://restpoint_mpesa_service:5000',
  portal: process.env.PORTAL_SERVICE_URL || 'http://restpoint_portal_service:5000',
  invoices: process.env.INVOICES_SERVICE_URL || 'http://restpoint_invoice_service:5000',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://restpoint_notification_service:5000',
  documents: process.env.DOCUMENTS_SERVICE_URL || 'http://restpoint_documents_service:5000',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://restpoint_analytics_service:5000',
  bodycheckout: process.env.BODYCHECKOUT_SERVICE_URL || 'http://restpoint_bodycheckout_service:5000',
  edocuments: process.env.EDOCUMENTS_SERVICE_URL || 'http://restpoint_edocuments_service:5000',
  calendar: process.env.CALENDAR_SERVICE_URL || 'http://restpoint_calender_service:5000',
  chemicals: process.env.CHEMICALS_SERVICE_URL || 'http://restpoint_chemical_service:5000',
  billing: process.env.BILLING_SERVICE_URL || 'http://restpoint_billing_service:5000',
  socketio: process.env.SOCKETIO_SERVICE_URL || 'http://restpoint_socketio_service:5000',
  workshop: process.env.WORKSHOP_SERVICE_URL || 'http://restpoint_workshop_service:5000',
  extra: process.env.EXTRA_SERVICES_URL || 'http://restpoint_extra_services:5000',
  call: process.env.CALL_SERVICE_URL || 'http://restpoint_call_service:5000',
  qrcode: process.env.QRCODE_SERVICE_URL || 'http://restpoint_qrcode_service:5000',
  scanner: process.env.SCANNER_SERVICE_URL || 'http://restpoint_scanner_service:2024',
  hearse: process.env.HEARSE_SERVICE_URL || 'http://restpoint_hearse_service:5000',
  leave: process.env.LEAVE_SERVICE_URL || 'http://restpoint_leave_service:5000',
  support: process.env.SUPPORT_SERVICE_URL || 'http://restpoint_support_service:5000',
  florist: process.env.FLORIST_SERVICE_URL || 'http://restpoint_florist_service:5000',
  store: process.env.STORE_SERVICE_URL || 'http://restpoint_store_service:5000',
};

const app = express();

// ─── Circuit Breaker & Service Health Tracking ─────────────────────
const serviceHealth = {};
const HEALTH_CHECK_INTERVAL = 30000; // Check every 30 seconds
const FAILURE_THRESHOLD = 5; // Mark as down after 5 consecutive failures
const RECOVERY_TIMEOUT = 60000; // Try recovery after 60 seconds
// 10s — several TS services (tsx, cold starts, first DB hit) take >5s to answer
// /health. With a 5s timeout live services kept getting "aborted" and marked
// DOWN, so the breaker 503'd requests that would have succeeded.
const HEALTH_CHECK_TIMEOUT = 10000; // 10 seconds
const HEALTH_CHECK_CONCURRENCY = 10; // 26 services / 10 at once ≈ 3 batches × 10s = one interval

Object.keys(SERVICE_URLS).forEach(serviceName => {
  serviceHealth[serviceName] = {
    isHealthy: true,
    failures: 0,
    lastFailure: null,
    lastCheck: null,
  };
});

// Health check function for a single service
async function checkServiceHealth(serviceName, url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const healthUrl = url.endsWith('/') ? `${url}health` : `${url}/health`;

    const response = await undiciFetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      dispatcher: healthCheckDispatcher,
    });

    clearTimeout(timeoutId);
    const isHealthy = response.ok;
    serviceHealth[serviceName].lastCheck = Date.now();

    if (isHealthy) {
      serviceHealth[serviceName].failures = 0;
      serviceHealth[serviceName].isHealthy = true;
      Logger.info(`[HEALTH] ${serviceName} is healthy`);
    } else {
      handleServiceFailure(serviceName);
      Logger.warn(`[HEALTH] ${serviceName} returned ${response.status}`);
    }
  } catch (error) {
    handleServiceFailure(serviceName);
    Logger.warn(`[HEALTH] ${serviceName} health check failed: ${error.message}`);
  }
}

function handleServiceFailure(serviceName) {
  serviceHealth[serviceName].failures++;
  serviceHealth[serviceName].lastFailure = Date.now();

  if (serviceHealth[serviceName].failures >= FAILURE_THRESHOLD && serviceHealth[serviceName].isHealthy) {
    serviceHealth[serviceName].isHealthy = false;
    Logger.warn(`[CIRCUIT BREAKER] ${serviceName} marked as DOWN (failures: ${serviceHealth[serviceName].failures})`);
  }
}

// Periodic health check for all services — bounded concurrency instead of
// firing every check simultaneously, plus a guard so a slow cycle (services
// timing out) never overlaps the next interval tick and double-counts
// failures.
let healthCheckCycleRunning = false;
async function performHealthChecks() {
  if (healthCheckCycleRunning) return;
  healthCheckCycleRunning = true;
  try {
    const taskFns = Object.entries(SERVICE_URLS).map(([serviceName, url]) => {
      const baseUrl = url.split('/')[0] + '//' + url.split('/')[2];
      return () => checkServiceHealth(serviceName, baseUrl);
    });

    await runWithConcurrencyLimit(taskFns, HEALTH_CHECK_CONCURRENCY);
  } finally {
    healthCheckCycleRunning = false;
  }
}

const healthCheckInterval = setInterval(performHealthChecks, HEALTH_CHECK_INTERVAL);
Logger.info('[CIRCUIT BREAKER] Health monitoring started');

if ((process.env.TRUST_PROXY || 'false').toString().toLowerCase() === 'true') {
  app.set('trust proxy', 1);
  Logger.info('Express trust proxy enabled (trust first hop)');
}

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
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

// On-demand recovery probe: when the circuit breaker is open, give the
// service a quick live check before rejecting the request.
const PROBE_TIMEOUT = 3000;
const PROBE_MIN_GAP = 10000;

async function probeServiceHealth(url) {
  try {
    const probeUrl = url.endsWith('/') ? `${url}health` : `${url}/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
    const response = await undiciFetch(probeUrl, {
      method: 'GET',
      signal: controller.signal,
      dispatcher: healthCheckDispatcher,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

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

  if (!serviceName) {
    return next();
  }

  const health = serviceHealth[serviceName];

  if (health && !health.isHealthy) {
    const timeSinceFailure = Date.now() - health.lastFailure;

    if (timeSinceFailure < RECOVERY_TIMEOUT) {
      if (serviceName === 'notification' || serviceName === 'notifications') {
        return res.status(200).json({
          notifications: [],
          total: 0,
          source: 'gateway-fallback',
          message: 'Notification service is currently unavailable'
        });
      }

      const serviceUrl = SERVICE_URLS[serviceName];
      if (serviceUrl && timeSinceFailure >= PROBE_MIN_GAP) {
        const alive = await probeServiceHealth(serviceUrl);
        if (alive) {
          Logger.info(`[CIRCUIT BREAKER] ${serviceName} recovered via on-demand probe`);
          health.isHealthy = true;
          health.failures = 0;
          return next();
        }
        health.lastFailure = Date.now();
      }

      return res.status(503).json({
        success: false,
        message: 'Now API Gateway is Down',
        description: 'Unable to connect to the API Gateway.',
        details: 'No services can be reached at the moment.',
        action: 'Please contact the System Administrator.',
        service: serviceName,
        error: 'SERVICE_DOWN',
        timestamp: new Date().toISOString()
      });
    } else {
      Logger.info(`[CIRCUIT BREAKER] ${serviceName} recovered, allowing requests`);
      health.isHealthy = true;
      health.failures = 0;
    }
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

// Create proxy instances for each unique target URL (cached), now sharing
// the keep-alive agent + DNS cache instead of opening a fresh connection
// (and DNS lookup) per request.
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
      onProxyReq: (proxyReq, req, res) => {
        if (req.headers.authorization) proxyReq.setHeader('Authorization', req.headers.authorization);
        if (req.headers['x-tenant-slug']) proxyReq.setHeader('x-tenant-slug', req.headers['x-tenant-slug']);
        if (req.headers['x-tenant-id']) proxyReq.setHeader('x-tenant-id', req.headers['x-tenant-id']);
        if (req.headers['x-user-id']) proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
        if (req.headers['x-branch-slug']) proxyReq.setHeader('x-branch-slug', req.headers['x-branch-slug']);
        if (req.headers['x-branch-id']) proxyReq.setHeader('x-branch-id', req.headers['x-branch-id']);
        // Re-stream the already-consumed body safely. The previous manual
        // JSON.stringify + proxyReq.write() here is a known-fragile pattern
        // with http-proxy-middleware: it can throw "write after end" or
        // leave the proxied socket in a bad state for certain payloads,
        // which surfaces to the client as a 502 from the front-end reverse
        // proxy (the gateway process resets the connection mid-request).
        // fixRequestBody is the library's own helper for this exact problem.
        try {
          fixRequestBody(proxyReq, req);
        } catch (bodyErr) {
          Logger.error(`[PROXY] Failed to re-stream body for ${req.method} ${req.originalUrl}: ${bodyErr.message}`);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
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
      onError: (err, req, res) => {
        Logger.error(`[PROXY ERROR] ${req.method} ${req.originalUrl}: ${err.message}`);
        if (!res.headersSent) {
          const firstSegment = (req.originalUrl || req.url || '').split('/').filter(Boolean)[2] || 'unknown';
          const friendlyName = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);

          const serviceName = Object.keys(SERVICE_ROUTES).find(
            route => firstSegment === route || firstSegment.startsWith(route + '-')
          );
          if (serviceName) {
            handleServiceFailure(serviceName);
          }

          res.status(503).json({
            success: false,
            message: 'Now API Gateway is Down',
            description: 'Unable to connect to the API Gateway.',
            details: 'No services can be reached at the moment.',
            action: 'Please contact the System Administrator.',
            service: firstSegment,
            serviceName: friendlyName,
            error: err.code,
            target: targetUrl,
            timestamp: new Date().toISOString()
          });
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
            error: err.code,
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
  const serviceStatus = {};
  Object.keys(SERVICE_URLS).forEach(serviceName => {
    const health = serviceHealth[serviceName];
    serviceStatus[serviceName] = {
      url: SERVICE_URLS[serviceName],
      healthy: health.isHealthy,
      failures: health.failures,
      lastCheck: health.lastCheck ? new Date(health.lastCheck).toISOString() : null,
      lastFailure: health.lastFailure ? new Date(health.lastFailure).toISOString() : null,
    };
  });

  const allHealthy = Object.values(serviceHealth).every(h => h.isHealthy);

  res.json({
    success: true,
    status: allHealthy ? 'ok' : 'degraded',
    service: APP_NAME,
    version: APP_VERSION,
    port: PORT,
    uptime: process.uptime(),
    services: serviceStatus,
  });
});

app.head('/health', (_req, res) => {
  res.status(200).end();
});

app.get('/health/:service', async (req, res) => {
  const serviceName = req.params.service;
  const url = SERVICE_URLS[serviceName];

  if (!url) {
    return res.status(404).json({
      success: false,
      message: `Unknown service: ${serviceName}`,
    });
  }

  const baseUrl = url.split('/')[0] + '//' + url.split('/')[2];
  await checkServiceHealth(serviceName, baseUrl);

  const health = serviceHealth[serviceName];
  res.json({
    success: true,
    service: serviceName,
    url: url,
    healthy: health.isHealthy,
    failures: health.failures,
    lastCheck: health.lastCheck ? new Date(health.lastCheck).toISOString() : null,
    lastFailure: health.lastFailure ? new Date(health.lastFailure).toISOString() : null,
  });
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
const server = app.listen(PORT, HOST, async () => {
  Logger.info(`  ${APP_NAME} v${APP_VERSION}`);
  Logger.info(`  Running on http://${HOST}:${PORT}`);
  Logger.info(`  UV_THREADPOOL_SIZE=${process.env.UV_THREADPOOL_SIZE}`);
  Logger.info(' Available Endpoints:');
  Logger.info(`   GET  http://localhost:${PORT}/health`);
  Logger.info(`   GET  http://localhost:${PORT}/health/:service`);
  Logger.info(`   GET  http://localhost:${PORT}/debug/dns-cache`);

  Logger.info(' Performing initial health checks...');
  await performHealthChecks();
  Logger.info(' Health checks complete');
});

const gracefulShutdown = (signal) => {
  Logger.info(`Shutting down (${signal})...`);
  clearInterval(healthCheckInterval);
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