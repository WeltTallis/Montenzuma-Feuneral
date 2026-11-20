

//  MINI   STORE  SERVICE  SERVER.ts
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import knex from 'knex';

// import Logger from '../../../packages/shared-logger/src/index';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env. In Docker the image runs from /usr/src/app/services/store-service
// and .dockerignore EXCLUDES .env, so the old hard-coded `../../.env` always
// resolved to a path that does not exist — it logged "Loading .env from:
// /usr/src/app/.env" and then silently did nothing, which reads like a missing
// file. Real configuration arrives as real environment variables (compose
// `env_file` + `environment:`), so a missing file is normal and must not be
// reported as a problem. Try the repo root first (local dev), then this
// service's own .env, and only warn if none exist.
const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env'),
];
const foundEnv = envCandidates.find((p) => {
  try { return fs.existsSync(p); } catch { return false; }
});

if (foundEnv) {
  dotenv.config({ path: foundEnv });
  console.log(`[STORE] Loaded .env from: ${foundEnv}`);
} else {
  // Expected in Docker. Say so explicitly, and name what we will use instead.
  console.log('[STORE] No .env file found (normal in Docker) — using environment variables from the container.');
}

// Fail fast if persistent database configuration is absent; do not start a
// service that appears to accept inventory changes without storing them.
const REQUIRED_DB_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'OPERATIONS_DATABASE'];
const missingDbEnv = REQUIRED_DB_ENV.filter((k) => !process.env[k]);
if (missingDbEnv.length) {
  throw new Error(
    `[STORE] FATAL: missing database configuration: ${missingDbEnv.join(', ')}. ` +
    'Set DB_HOST / DB_USER / DB_PASSWORD / OPERATIONS_DATABASE on the service ' +
    '(docker-compose `environment:` or `env_file`).',
  );
}


const { default: storeRoutes } = await import('./routes/storeRoutes.ts');
const app = express();
// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DATABASE

let storeKnex: knex.Knex | null = null;

const buildConfig = () => ({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.OPERATIONS_DATABASE || process.env.DB_NAME || 'restpoint_operations',
  },
  pool: { min: 2, max: 10 },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations_store',
  },
});

const initDatabase = async () => {
  const database = knex(buildConfig());
  storeKnex = database;
  try {
    await database.raw('SELECT 1');
    console.log('[STORE] Database connection established');
    await database.migrate.latest();
    console.log('[STORE] Database migrations completed successfully');
  } catch (error: any) {
    console.error('[STORE] Database initialization failed:', error.message);
    await database.destroy();
    storeKnex = null;
    throw error;
  }
};

app.locals.storeKnex = storeKnex;

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', async (_req, res) => {
  if (!storeKnex) {
    return res.status(503).json({ status: 'unavailable', service: 'store-service' });
  }
  try {
    await storeKnex.raw('SELECT 1');
    return res.status(200).json({ status: 'ok', service: 'store-service', version: '1.0.0' });
  } catch (error) {
    console.error('[STORE] Health check database query failed:', error);
    return res.status(503).json({ status: 'unavailable', service: 'store-service' });
  }
});


// API ROUTES

app.use('/api/store', (req: any, _res: any, next: any) => {
  req.app.locals.storeKnex = storeKnex;
  next();
});
app.use('/api/store', storeRoutes);

// START SERVER
const startServer = async () => {
  await initDatabase();
  app.locals.storeKnex = storeKnex;

  const PORT = Number(process.env.STORE_SERVICE_PORT) || Number(process.env.PORT) || 7071;
  const HOST = process.env.HOST || '0.0.0.0';

  app.listen(PORT, HOST, () => {

    // Logger.info({
    //   message: "Mini  store  Service  Up  And   Running",
    //   port: PORT,
    //   host: HOST
    // })
    console.log(`Mini Store Service`);

  });
};

// Unhandled rejections / exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('[STORE] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('[STORE] Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[STORE] SIGTERM received, shutting down gracefully...');
  if (storeKnex) storeKnex.destroy();
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('[STORE] SIGINT received, shutting down gracefully...');
  if (storeKnex) storeKnex.destroy();
  process.exit(0);
});

// Initialize and start
startServer().catch((error) => {
  console.error('[STORE] Startup failed; service will not serve demo data:', error);
  process.exit(1);
});

export default app;
