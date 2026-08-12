/**
 * Mini Store Service
 * --------------------
 * A self-contained Express service that exposes a small store inventory
 * REST API (items, pick, restock, adjust, transactions, stats) and also
 * serves the matching standalone Mini Store UI (`mini-store.html`).
 *
 * It follows the same conventions as the other restpoint services:
 *   - ES module + ts-node dev workflow
 *   - dotenv loaded from the repo-root `.env`
 *   - knex + mysql2 migrations
 *   - GET /health  -> { status, service, version }
 *
 * When a database is not reachable the service still starts (demo-only mode)
 * so the UI can be opened straight away.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root
const envPath = path.resolve(__dirname, '../../.env');
console.log(`[STORE] Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

import express from 'express';
import cors from 'cors';
import knex from 'knex';
import storeRoutes from './routes/storeRoutes.js';

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// DATABASE
// ============================================
let storeKnex: knex.Knex | null = null;

const buildConfig = () => ({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'restpoint_main',
  },
  pool: { min: 2, max: 10 },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations',
  },
});

const initDatabase = async () => {
  try {
    storeKnex = knex(buildConfig());
    console.log('[STORE] Database connection initialized');

    if (!storeKnex) return;
    const hasMigrationsTable = await storeKnex.schema.hasTable('knex_migrations');
    if (!hasMigrationsTable || !(await storeKnex.schema.hasTable('store_items'))) {
      await storeKnex.migrate.latest();
      console.log('[STORE] Knex migrations completed successfully');
    } else {
      await storeKnex.migrate.latest();
      console.log('[STORE] Migrations already up to date');
    }
  } catch (error: any) {
    console.error('[STORE] Database initialization failed (running demo-only):', error.message);
    storeKnex = null;
  }
};

app.locals.storeKnex = storeKnex;

// ============================================
// STATIC UI - serve the Mini Store UI at '/'
// ============================================
const UI_FILE = path.resolve(__dirname, '../../mini-store.html');

app.get('/', (_req, res) => {
  res.sendFile(UI_FILE, (err) => {
    if (err) res.status(500).json({ success: false, message: 'Mini Store UI not found' });
  });
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'store-service', version: '1.0.0' });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/store', (req: any, _res: any, next: any) => {
  // keep app.locals.storeKnex fresh on every request
  req.app.locals.storeKnex = storeKnex;
  next();
});
app.use('/api/store', storeRoutes);

// ============================================
// START SERVER
// ============================================
const startServer = async () => {
  await initDatabase();
  // re-sync after init (db may have become available)
  app.locals.storeKnex = storeKnex;

  const PORT = Number(process.env.STORE_SERVICE_PORT) || Number(process.env.PORT) || 7071;
  const HOST = process.env.HOST || '0.0.0.0';

  app.listen(PORT, HOST, () => {
    console.log('========================================');
    console.log(`🏪 Mini Store Service`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Host: ${HOST}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   UI:  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/`);
    console.log(`   API: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/store/...`);
    console.log(`   DB: ${process.env.DB_NAME || 'not configured'} ${storeKnex ? '🟢 connected' : '🟡 demo-only'}`);
    console.log('========================================');
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
startServer();

export default app;
