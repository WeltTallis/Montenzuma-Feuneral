import express, { Request, Response, NextFunction } from 'express';
import { init, isSchemaReady, close, DB_NAME } from './db';
import { validateTenantActive } from '../../shared/tenancy';
import insuranceRoutes from './routes/insuranceRoutes';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import http from 'http';
import cors from 'cors';

/* dotenv MUST be loaded here, after every import, and never at the top of the
   file. It used to sit on line 2, above `import path`, and this service is the
   only one in the repo compiled with plain `tsc` rather than run under `tsx`:
   esbuild hoists imports (so every other service tolerated the ordering), but
   tsc preserves source order for top-level statements and emits imports as
   `const path_1 = require(...)`. The result was
       require('dotenv').config({ path: path_1.default.join(__dirname, '.env') })
   running BEFORE `path_1` was initialised, so every boot died instantly with
       ReferenceError: Cannot access 'path_1' before initialization
   and the container crash-looped on /health, taking apply/claim-track with it.

   Keep this block directly below the imports and never above them. */
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = Number.parseInt(process.env.PORT || '5013', 10);
const server = http.createServer(app);

/* LAST-RESORT SAFETY NET
   Without this, ANY unhandled error in an async route kills the process: node
   prints the stack and exits, Docker restarts the container, and the user sees
   "socket hang up" at the gateway rather than a useful 500. That is exactly
   what happened when getKnex() threw MODULE_NOT_FOUND — the whole service
   crash-looped on the first application submit.
   Express 4 does not forward rejected promises from async handlers to the
   error middleware, so these two listeners are what actually keep the service
   alive. They LOG rather than swallow silently: an unhandled rejection is a
   real bug and must be visible in the logs.
   Note the process is NOT exited here — exiting is what caused the outage. */
process.on('unhandledRejection', (reason) => {
  console.error('[insurance] UNHANDLED REJECTION (service kept alive):', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[insurance] UNCAUGHT EXCEPTION (service kept alive):', err);
});

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
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));
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