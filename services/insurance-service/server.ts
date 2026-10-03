import path from 'path';
// Must load .env FIRST, before anything that reads process.env (db.ts reads
// INSURANCE_DATABASE / DB_* at import time).
require('dotenv').config({ path: path.join(__dirname, '.env') });

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import insuranceRoutes from './routes/insuranceRoutes';
import { init, isSchemaReady, close, DB_NAME } from './db';
import { validateTenantActive } from '../../shared/tenancy';

const app = express();
const server = http.createServer(app);
const PORT = Number.parseInt(process.env.PORT || '5013', 10);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-tenant-slug',
      'x-tenant-id',
      'x-branch-id',
      'x-branch-slug',
      'x-user-id',
    ],
  }),
);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));

/* ------------------------------------------------------------------
   Tenant resolution - identical contract to the other services, so the
   gateway can pass the same headers it already sends. Public Amani
   submissions arrive with no tenant header at all, which resolves to
   `system_shared` (the single-tenant install used by the public site).
   ------------------------------------------------------------------ */
app.use(async (req: Request, res: Response, next: NextFunction) => {
  const tenantSlug =
    (req.headers['x-tenant-slug'] as string) ||
    (req.headers['x-tenant-id'] as string) ||
    'system_shared';
  const branchId = req.headers['x-branch-id'] || req.query.branchId || null;

  req.tenantSlug = tenantSlug;
  req.branchId = branchId as any;

  if (tenantSlug !== 'system_shared') {
    const tenantStatus = await validateTenantActive(tenantSlug);
    if (!tenantStatus.active) {
      if (tenantStatus.reason && tenantStatus.reason.includes('not found')) {
        return res.status(404).json({ success: false, message: tenantStatus.reason });
      }
      // DB unreachable (Docker not up yet) - allow, so a cold start does not
      // reject every form submission with a 403.
      if (tenantStatus.reason && tenantStatus.reason.includes('Error validating')) {
        console.warn(`[insurance] DB unavailable, allowing request for "${tenantSlug}"`);
        req.tenant = { id: tenantSlug, db_name: tenantSlug, tenant_slug: tenantSlug };
        return next();
      }
      return res.status(403).json({ success: false, message: tenantStatus.reason });
    }
    req.tenant = tenantStatus.tenant;
  }

  next();
});

/**
 * Health check.
 *
 * `status` is only UP when the schema is actually there, so an orchestrator
 * or the `depends_on: service_healthy` gate in docker-compose does not treat a
 * half-migrated service as ready to take traffic.
 */
app.get('/health', async (_req: Request, res: Response) => {
  const ready = await isSchemaReady();
  res.status(ready ? 200 : 503).json({
    status: ready ? 'UP' : 'DEGRADED',
    service: 'insurance-service',
    database: DB_NAME,
    schemaReady: ready,
    timestamp: new Date().toISOString(),
  });
});

// Insurance routes - gateway proxies /insurance/... here.
app.use('/insurance', insuranceRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `No route: ${req.method} ${req.originalUrl}` });
});

// Express needs all four parameters to recognise this as an error handler;
// `next` is unused but its presence is what makes it one.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[insurance] unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

/**
 * Boot: create the database, run migrations, THEN listen. Listening first
 * would mean the gateway's health check passes while the tables do not exist
 * yet and the first real submission 500s.
 */
async function start() {
  try {
    await init();
  } catch (err: any) {
    console.error('[insurance] database init failed:', err?.message || err);
    console.error('[insurance] starting anyway - /health will report DEGRADED.');
  }

  server.listen(PORT, () => {
    console.log(`[insurance] listening on :${PORT} (database: ${DB_NAME})`);
  });
}

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    console.log(`[insurance] ${signal} received, shutting down`);
    server.close(() => {
      close()
        .catch(() => {})
        .finally(() => process.exit(0));
    });
  });
}

start();

export { app, server };