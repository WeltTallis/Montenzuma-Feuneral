// Load service-specific .env first, then root .env for shared config (with override)
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env'), override: false });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('../../packages/shared-logger/dist/index').default;

// Load routes AFTER .env is loaded so dbConfig can read DB credentials
const coffinRoutes = require('./routes/coffinRoutes.cjs');

const app = express();
const PORT = process.env.PORT || 8108;

// CORS configuration
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug', 'x-tenant-id', 'x-user-id', 'x-branch-id', 'x-branch-code']
};

logger.info({ msg: 'Starting coffin service...' });

// Prevent process from exiting
process.on('uncaughtException', (error) => {
  logger.error({ msg: 'Uncaught Exception', error: error.message, stack: error.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error({ msg: 'Unhandled Rejection', reason: reason?.message || reason });
});

// Mount routes
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple tenant middleware - resolve database from tenant slug
app.use(async (req, res, next) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] || req.headers['x-slug'] || 'system_shared';
    req.tenantSlug = tenantSlug;

    // For system_shared, use default DB
    if (tenantSlug === 'system_shared') {
      req.tenant = {
        db_name: process.env.DB_NAME || 'restpoint_main',
        tenant_id: 1,
        tenant_name: 'System Shared',
        tenant_slug: tenantSlug
      };
      return next();
    }

    // For non-system tenants — resolve database from tenant_tracking
    try {
      const { resolveDatabase } = require('../../shared/dbConfig');
      let dbName = await resolveDatabase(tenantSlug);

      // Fallback: convert slug to db name pattern
      if (!dbName) {
        dbName = tenantSlug.replace(/-/g, '_');
      }

      req.tenant = {
        db_name: dbName,
        tenant_slug: tenantSlug,
        tenant_name: tenantSlug
      };
    } catch (err) {
      logger.error({ msg: 'Tenant resolution error', tenantSlug, error: err.message });
      // Fall back to default DB rather than blocking
      req.tenant = {
        db_name: process.env.DB_NAME || 'restpoint_main',
        tenant_slug: tenantSlug,
        tenant_name: tenantSlug
      };
    }

    next();
  } catch (error) {
    logger.error({ msg: 'Middleware error', error: error.message });
    res.status(500).json({
      success: false,
      message: 'Middleware error',
      error: error.message
    });
  }
});

// Routes - mount at /coffins to match API gateway paths
app.use('/coffins', coffinRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'coffin-service',
    tenant: req.tenantSlug,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Coffin Service',
    tenant: req.tenantSlug,
    endpoints: {
      create: 'POST /',
      list: 'GET /',
      detail: 'GET /:id',
      update: 'PUT /:id',
      delete: 'DELETE /:id',
      assign: 'POST /assign',
      health: 'GET /health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  logger.info({ msg: 'Route not found', method: req.method, url: req.originalUrl });
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found.`
  });
});

// Global error handler
app.use((err, req, res) => {
  logger.error({ msg: 'Unhandled Error', error: err.message });
  res.status(500).json({
    status: 'error',
    message: 'Internal server error.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info({ msg: 'Coffin Service running', port: PORT, health: `http://localhost:${PORT}/health` });
  });

  server.on('error', (error) => {
    logger.error({ msg: 'Server error', error: error.message });
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info({ msg: 'Received SIGINT, shutting down...' });
    server.close(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    logger.info({ msg: 'Received SIGTERM, shutting down...' });
    server.close(() => process.exit(0));
  });

} catch (error) {
  logger.error({ msg: 'Failed to start server', error: error.message });
  process.exit(1);
}