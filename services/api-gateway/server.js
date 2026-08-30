const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load .env from the api-gateway directory specifically
const dotenvPath = path.join(__dirname, '.env');
console.log('Loading .env from:', dotenvPath);
dotenv.config({ path: dotenvPath, override: false });

// ─── Redis Client for Direct Notification Access ────────────────────
let redisClient = null;
let redisConnected = false;

try {
  const { createClient } = require('redis');
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  redisClient = createClient({ url: redisUrl });

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

  // Connect asynchronously
  redisClient.connect().catch(err => {
    console.warn(`[REDIS] Failed to connect: ${err.message}`);
  });
} catch (err) {
  console.warn('[REDIS] redis package not available, notifications will return empty');
}

const APP_NAME = 'restpoint-gateway';
const APP_VERSION = '2.0.0';

const Logger = {
  info: (m, d) => { console.log(`[INFO] ${m}`, d || ''); },
  error: (m, d) => { console.error(`[ERROR] ${m}`, d || ''); },
  warn: (m, d) => { console.warn(`[WARN] ${m}`, d || ''); },
  debug: (m, d) => { console.debug(`[DEBUG] ${m}`, d || ''); },
};

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const isProd = (process.env.NODE_ENV || 'development') === 'production';


// SERVICE URLS —  127.0.0.1 to avoid Node 18+ IPv6 localhost resolution bug

const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:5001',
  tenant: process.env.TENANT_SERVICE_URL || 'http://127.0.0.1:5002',
  deceased: process.env.DECEASED_SERVICE_URL || 'http://127.0.0.1:5003',
  coffin: process.env.COFFIN_SERVICE_URL || 'http://127.0.0.1:5008',
  marketplace: process.env.MARKETPLACE_SERVICE_URL || 'http://127.0.0.1:5005',
  mpesa: process.env.MPESA_SERVICE_URL || 'http://127.0.0.1:5006',
  portal: process.env.PORTAL_SERVICE_URL || 'http://127.0.0.1:5007',
  invoices: process.env.INVOICES_SERVICE_URL || 'http://127.0.0.1:5008',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:5018',
  documents: process.env.DOCUMENTS_SERVICE_URL || 'http://127.0.0.1:8112',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://127.0.0.1:5012',
  bodycheckout: process.env.BODYCHECKOUT_SERVICE_URL || 'http://127.0.0.1:5013',
  edocuments: process.env.EDOCUMENTS_SERVICE_URL || 'http://127.0.0.1:5014',
  calendar: process.env.CALENDAR_SERVICE_URL || 'http://127.0.0.1:5015',
  chemicals: process.env.CHEMICALS_SERVICE_URL || 'http://127.0.0.1:5019',
  billing: process.env.BILLING_SERVICE_URL || 'http://127.0.0.1:5017',
  socketio: process.env.SOCKETIO_SERVICE_URL || 'http://127.0.0.1:5018',
  workshop: process.env.WORKSHOP_SERVICE_URL || 'http://127.0.0.1:6060',
  extra: process.env.EXTRA_SERVICES_URL || 'http://127.0.0.1:5019',
  call: process.env.CALL_SERVICE_URL || 'http://127.0.0.1:5020',
  qrcode: process.env.QRCODE_SERVICE_URL || 'http://127.0.0.1:5021',
  scanner: process.env.SCANNER_SERVICE_URL || 'http://127.0.0.1:5022',
  hearse: process.env.HEARSE_SERVICE_URL || 'http://127.0.0.1:5023',
  leave: process.env.LEAVE_SERVICE_URL || 'http://127.0.0.1:5017',
    support: process.env.SUPPORT_SERVICE_URL || 'http://127.0.0.1:8111',
  florist: process.env.FLORIST_SERVICE_URL || 'http://127.0.0.1:7070',
  store: process.env.STORE_SERVICE_URL || 'http://127.0.0.1:7071',
};

const app = express();

// ─── Circuit Breaker & Service Health Tracking ─────────────────────
const serviceHealth = {};
const HEALTH_CHECK_INTERVAL = 30000; // Check every 30 seconds
const FAILURE_THRESHOLD = 5; // Mark as down after 5 failures (was 3)
const RECOVERY_TIMEOUT = 60000; // Try recovery after 60 seconds
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds (was 2)

// Initialize health status for all services
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

    // Append /health to the URL
    const healthUrl = url.endsWith('/') ? `${url}health` : `${url}/health`;

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
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

// Periodic health check for all services
async function performHealthChecks() {
  const checks = Object.entries(SERVICE_URLS).map(([serviceName, url]) => {
    const baseUrl = url.split('/')[0] + '//' + url.split('/')[2];
    return checkServiceHealth(serviceName, baseUrl);
  });

  await Promise.allSettled(checks);
}

// Start health check interval
const healthCheckInterval = setInterval(performHealthChecks, HEALTH_CHECK_INTERVAL);
Logger.info('[CIRCUIT BREAKER] Health monitoring started');

// Honor proxy headers when running behind a reverse proxy (load balancer, nginx, CDN)
if ((process.env.TRUST_PROXY || 'false').toString().toLowerCase() === 'true') {
  app.set('trust proxy', true);
  Logger.info('Express trust proxy enabled (TRUST_PROXY=true)');
}
// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'QUERY', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization',  'x-branch-db'  , 'x-slug', 'x-tenant-slug', 'x-tenant-id', 'x-user-id', 'x-branch-id', 'x-branch-code', 'x-branch-slug', 'x-user-email', 'x-user-name', 'x-branch-slug', 'Origin', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// Rate limiting - Increased to 1 million requests per window for load testing
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use('/api/', apiLimiter);

// Request logging
app.use((req, res, next) => {
  Logger.info(`→ ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware to check service health before proxying
function checkServiceAvailability(req, res, next) {
  const urlWithoutQuery = req.url.split('?')[0];
  const pathParts = urlWithoutQuery.split('/').filter(Boolean);
  const firstSegment = pathParts[0];

  if (!firstSegment) {
    return res.status(400).json({ success: false, message: 'No service specified' });
  }

  // Map route to service name
  const serviceName = Object.keys(SERVICE_ROUTES).find(
    route => firstSegment === route || firstSegment.startsWith(route + '-')
  );

  if (!serviceName) {
    return next(); // Unknown service, let normal routing handle it
  }

  const health = serviceHealth[serviceName];

  // Check if service is marked as unhealthy
  if (health && !health.isHealthy) {
    const timeSinceFailure = Date.now() - health.lastFailure;

    // If within recovery timeout, immediately return 503 (no logging to reduce spam)
    if (timeSinceFailure < RECOVERY_TIMEOUT) {
      // Special handling for notification service - return empty notifications instead of 503
      if (serviceName === 'notification' || serviceName === 'notifications') {
        return res.status(200).json({
          notifications: [],
          total: 0,
          source: 'gateway-fallback',
          message: 'Notification service is currently unavailable'
        });
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
      // Recovery timeout reached, allow request and reset status
      Logger.info(`[CIRCUIT BREAKER] ${serviceName} recovered, allowing requests`);
      health.isHealthy = true;
      health.failures = 0;
    }
  }

  next();
}

// SERVICE ROUTING TABLE



const SERVICE_ROUTES = {
  // Auth service (port 5001)
  'auth': SERVICE_URLS.auth,
  'login': SERVICE_URLS.auth,
  'register': SERVICE_URLS.auth,
  'logout': SERVICE_URLS.auth,
  'refresh': SERVICE_URLS.auth,
  'users': SERVICE_URLS.auth,
  'change-password': SERVICE_URLS.auth,
  'me': SERVICE_URLS.auth,

  // Tenant service (port 8002)
  'tenant': SERVICE_URLS.tenant,
  'tenants': SERVICE_URLS.tenant,
  'system-admin': SERVICE_URLS.tenant,
  'uploads': SERVICE_URLS.tenant,

  // Deceased service (port 5003)
  'deceased': SERVICE_URLS.deceased,
  'autopsy': SERVICE_URLS.deceased,
  'postmortem': SERVICE_URLS.deceased,
  'postmortem-requests': SERVICE_URLS.deceased,
  'charges': SERVICE_URLS.deceased,
  'payments': SERVICE_URLS.deceased,
  'charge-settings': SERVICE_URLS.deceased,
  'embalming': SERVICE_URLS.deceased,

  // Hearse service (port 5002)
  'hearses': SERVICE_URLS.hearse,
  'hearse-bookings': SERVICE_URLS.hearse,
  'all-drivers': SERVICE_URLS.hearse,
  'drivers': SERVICE_URLS.hearse,

  // Coffin service (port 8108)
  'coffins': SERVICE_URLS.coffin,

  // Chemical service (port 5019 for local dev, 5105 in Docker)
  'chemicals': SERVICE_URLS.chemicals,

  // Support service (port 8111)
  'support': SERVICE_URLS.support,

  // Invoice service (port 5008)
  'invoices': SERVICE_URLS.invoices,

  // Billing service (port 5017)
  'billing': SERVICE_URLS.billing,

  // Scanner service (port 5022)
  'scanner': SERVICE_URLS.scanner,

  // Workshop service (port 6969)
  'workshop': SERVICE_URLS.workshop,

  // Florist service (port 7070)
  'florist': SERVICE_URLS.florist,

  // Documents service (port 5011)
  'documents': SERVICE_URLS.documents,

  // Notification service (port 8111)
  'notification': SERVICE_URLS.notification,
  'notifications': SERVICE_URLS.notification,

  // E-Documents service (port 5014)
  'edocuments': SERVICE_URLS.edocuments,

  // Leave service (port 5017)
  'leaves': SERVICE_URLS.leave,

  // Analytics service (port 5012)
  'analytics': SERVICE_URLS.analytics,

  // Body checkout service (port 5013)
  'bodycheckout': SERVICE_URLS.bodycheckout,
  'body-release': SERVICE_URLS.bodycheckout,

  // Extra services (port 5019)
  'extra': SERVICE_URLS.extra,

  // Call service (port 5020)
  'call': SERVICE_URLS.call,

  // QR code service (port 5021)
  'qrcode': SERVICE_URLS.qrcode,

  // Onboarding routes (direct to tenant service)
  'onboarding': SERVICE_URLS.tenant,

  // Portal service (port 5007)
  'portal': SERVICE_URLS.portal,
  'public': SERVICE_URLS.portal,

  // M-Pesa service (port 5006)
  'mpesa': SERVICE_URLS.mpesa,

    // Marketplace service (port 5005)
  'marketplace': SERVICE_URLS.marketplace,

  // Mini Store service (port 7071)
  'store': SERVICE_URLS.store,
};

// Create proxy instances for each unique target URL (cached)
const proxyCache = {};
for (const targetUrl of Object.values(SERVICE_ROUTES)) {
  if (!proxyCache[targetUrl]) {
    proxyCache[targetUrl] = createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      secure: false,
      proxyTimeout: 30000, // 30 seconds - allow time for file uploads and DB operations
      timeout: 30000, // 30 seconds - allow time for file uploads and DB operations
      onProxyReq: (proxyReq, req, res) => {
        if (req.headers.authorization) proxyReq.setHeader('Authorization', req.headers.authorization);
        if (req.headers['x-tenant-slug']) proxyReq.setHeader('x-tenant-slug', req.headers['x-tenant-slug']);
        if (req.headers['x-tenant-id']) proxyReq.setHeader('x-tenant-id', req.headers['x-tenant-id']);
        if (req.headers['x-user-id']) proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
        if (req.headers['x-branch-slug']) proxyReq.setHeader('x-branch-slug', req.headers['x-branch-slug']);
        if (req.headers['x-branch-id']) proxyReq.setHeader('x-branch-id', req.headers['x-branch-id']);
        if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
          const bodyStr = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyStr));
          proxyReq.write(bodyStr);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        Logger.debug(`[PROXY] ${req.method} ${req.originalUrl} → ${proxyRes.statusCode}`);
        // Override CORS headers from backend to ensure consistency
        const origin = req.headers.origin;
        if (origin && allowedOrigins.includes(origin)) {
          proxyRes.headers['Access-Control-Allow-Origin'] = origin;
          proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
          // Remove any wildcard origin header that conflicts with credentials
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

          // Track failure in circuit breaker
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

// ─── Direct Redis Notification Endpoints ───────────────────────────
// These endpoints query Redis directly, bypassing the socketio-service entirely.
// Notifications are stored in Redis with keys like: notifications:${tenantSlug}:socketio:${id}

// GET /api/v1/restpoint/notification/notifications - Fetch all notifications for tenant from Redis
app.get(['/api/v1/restpoint/notification/notifications', '/api/v1/restpoint/notifications'], async (req, res) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] || req.query.tenantSlug || 'unknown';

    if (!redisConnected || !redisClient) {
      // Redis not connected - return empty notifications
      return res.status(200).json({ notifications: [], total: 0, source: 'redis-unavailable' });
    }

    const pattern = `notifications:${tenantSlug}:*`;
    const keys = [];
    let cursor = 0;

    // Use SCAN to find all notification keys for this tenant
    do {
      const reply = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = reply.cursor;
      keys.push(...reply.keys);
    } while (cursor !== 0);

    const notifications = [];
    for (const key of keys) {
      try {
        const value = await redisClient.get(key);
        if (value) {
          notifications.push(JSON.parse(value));
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => {
      const aTime = new Date(a.createdAt || a.timestamp || 0).getTime();
      const bTime = new Date(b.createdAt || b.timestamp || 0).getTime();
      return bTime - aTime;
    });

    return res.status(200).json({ notifications, total: notifications.length, source: 'redis-direct' });
  } catch (error) {
    console.error('[NOTIFICATION] Error fetching from Redis:', error.message);
    return res.status(200).json({ notifications: [], total: 0, source: 'redis-error', error: error.message });
  }
});

// PUT /api/v1/restpoint/notification/notifications/:id/read - Mark notification as read (delete from Redis)
app.put(['/api/v1/restpoint/notification/notifications/:id/read', '/api/v1/restpoint/notifications/:id/read'], async (req, res) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] || req.query.tenantSlug || 'unknown';
    const { id } = req.params;

    if (redisConnected && redisClient) {
      const key = `notifications:${tenantSlug}:socketio:${id}`;
      await redisClient.del(key);
      console.log(`[NOTIFICATION] Deleted ${id} from Redis (read by user)`);
    }

    return res.status(200).json({ success: true, message: 'Notification marked as read and deleted' });
  } catch (error) {
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  }
});

// PUT /api/v1/restpoint/notification/notifications/mark-all-read - Mark all notifications as read
app.put(['/api/v1/restpoint/notification/notifications/mark-all-read', '/api/v1/restpoint/notifications/mark-all-read'], async (req, res) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] || req.query.tenantSlug || 'unknown';

    if (redisConnected && redisClient) {
      const pattern = `notifications:${tenantSlug}:*`;
      const keys = [];
      let cursor = 0;

      do {
        const reply = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = reply.cursor;
        keys.push(...reply.keys);
      } while (cursor !== 0);

      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`[NOTIFICATION] Deleted ${keys.length} notifications for tenant ${tenantSlug}`);
      }
    }

    return res.status(200).json({ success: true, message: 'All notifications marked as read and deleted' });
  } catch (error) {
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  }
});

// DELETE /api/v1/restpoint/notification/notifications/:id - Delete notification from Redis
app.delete(['/api/v1/restpoint/notification/notifications/:id', '/api/v1/restpoint/notifications/:id'], async (req, res) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] || req.query.tenantSlug || 'unknown';
    const { id } = req.params;

    if (redisConnected && redisClient) {
      const key = `notifications:${tenantSlug}:socketio:${id}`;
      await redisClient.del(key);
      console.log(`[NOTIFICATION] Deleted ${id} from Redis`);
    }

    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    return res.status(200).json({ success: true, message: 'Notification deleted' });
  }
});

// Dynamic routing middleware mounted at /api/v1/restpoint
// Express strips /api/v1/restpoint 
app.use('/api/v1/restpoint', checkServiceAvailability, (req, res, next) => {
  // Extract the first path segment from the stripped URL
  // req.url = /hearses/available → firstSegment = hearses
  // IMPORTANT: Strip query string first to avoid "hearses?t=123" as service name
  const urlWithoutQuery = req.url.split('?')[0];
  const pathParts = urlWithoutQuery.split('/').filter(Boolean);
  const firstSegment = pathParts[0];

  if (!firstSegment) {
    return res.status(400).json({ success: false, message: 'No service specified' });
  }

  // Look up the target service
  const targetUrl = SERVICE_ROUTES[firstSegment];
  if (!targetUrl) {
    Logger.warn(`[ROUTE] Unknown service: ${firstSegment} (from ${req.originalUrl})`);
    return res.status(404).json({
      success: false,
      message: `Unknown service: ${firstSegment}`,
      path: req.originalUrl
    });
  }

  // Rewrite the path for auth service routes
  // Auth routes need /auth prefix (e.g., /refresh → /auth/refresh)
  let rewrittenUrl = req.url;
  if (firstSegment === 'auth' || firstSegment === 'login' ||
    firstSegment === 'register' || firstSegment === 'logout' ||
    firstSegment === 'refresh' || firstSegment === 'users' ||
    firstSegment === 'change-password' || firstSegment === 'me') {
    // Add /auth prefix if not already present
    if (!pathParts[0]?.startsWith('auth/') && pathParts[0] !== 'auth') {
      rewrittenUrl = '/auth' + req.url;
    }
  }

  // Rewrite mini-store paths: /store/* → /api/store/*
  if (firstSegment === 'store' || firstSegment === 'store-service') {
    rewrittenUrl = '/api' + req.url;
  }

  Logger.debug(`[ROUTE] ${req.method} ${req.originalUrl} → ${targetUrl}${rewrittenUrl}`);

  // Temporarily replace req.url for the proxy
  const originalUrl = req.url;
  req.url = rewrittenUrl;

  // Forward to the correct proxy
  const proxy = proxyCache[targetUrl];
  if (proxy) {
    const proxyErr = (err, req, res) => {
      // Restore original URL on error
      req.url = originalUrl;
      next(err);
    };

    proxy(req, res, (err) => {
      // Restore original URL after proxy completes
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

  // Restore original URL if no proxy
  req.url = originalUrl;
  return res.status(500).json({ success: false, message: 'Proxy not available' });
});

// =============================================================================
// HEALTH & DEBUG
// =============================================================================

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

// HEALTH CHECK ENDPOINTS

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

// HEAD /health — required by Docker HEALTHCHECK and Kubernetes liveness probes
app.head('/health', (_req, res) => {
  // Gateway itself is always healthy as long as it's serving requests
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

  // Trigger immediate health check
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

// Graceful shutdown
process.on('SIGINT', () => {
  Logger.info('Shutting down...');
  clearInterval(healthCheckInterval);
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  Logger.info('Shutting down...');
  clearInterval(healthCheckInterval);
  server.close(() => process.exit(0));
});


// START SERVER

const server = app.listen(PORT, HOST, async () => {
  Logger.info(`  ${APP_NAME} v${APP_VERSION}`);
  Logger.info(`  Running on http://${HOST}:${PORT}`);
  Logger.info(' Available Endpoints:');
  Logger.info(`   GET  http://localhost:${PORT}/health`);
  Logger.info(`   GET  http://localhost:${PORT}/health/:service`);

  // Perform initial health check on startup
  Logger.info(' Performing initial health checks...');
  await performHealthChecks();
  Logger.info(' Health checks complete');
});

module.exports = app;