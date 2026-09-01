const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');
const { migrateTenantTables } = require('./migrate-tenant-tables');

// Load environment variables

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for real-time updates
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});

app.set('io', io);

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug', 'x-tenant-id', 'x-user-id']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[LEAVE] Client connected: ${socket.id}`);

  socket.on('join_tenant', (tenantSlug) => {
    socket.join(`tenant_${tenantSlug}`);
    console.log(`[LEAVE] Socket ${socket.id} joined tenant_${tenantSlug}`);
  });

  socket.on('join_admin', () => {
    socket.join('admin');
    console.log(`[LEAVE] Socket ${socket.id} joined admin room`);
  });

  socket.on('disconnect', () => {
    console.log(`[LEAVE] Client disconnected: ${socket.id}`);
  });
});

// ============================================
// TENANT RESOLUTION MIDDLEWARE
// ============================================

// Resolves the MAIN/PARENT tenant database for a given slug. Leaves ALWAYS live
// in the parent tenant's single main database so every leave for an organization
// appears in ONE place — never split across branch databases.
async function resolveMainTenantDatabase(tenantSlug, { resolveDatabase, lookupTenantDatabase, getRootPool }) {
  try {
    // 1. If the slug IS a tenant slug, return the tenant's main database directly.
    const mainDb = await lookupTenantDatabase(tenantSlug);
    if (mainDb) return mainDb;

    // 2. The slug may be a branch slug or a branch database name. Resolve it,
    //    then map the database back to the owning tenant's MAIN database.
    const resolved = await resolveDatabase(tenantSlug);
    if (resolved) {
      try {
        const rootPool = await getRootPool(); // already connects to tenant_tracking
        const [rows] = await rootPool.query(
          `SELECT t.db_name FROM tenants t
           JOIN branches b ON b.tenant_id = t.id
           WHERE b.branch_db_name = ? AND t.status = 'active' LIMIT 1`,
          [resolved]
        );
        if (Array.isArray(rows) && rows.length > 0 && rows[0].db_name) {
          return rows[0].db_name;
        }
      } catch (e) { /* best-effort — fall through to resolved db */ }
      return resolved;
    }
  } catch (err) {
    console.error('[LEAVE] resolveMainTenantDatabase error:', err && err.message ? err.message : String(err));
  }
  return null;
}

app.use(async (req, res, next) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] || req.headers['x-slug'] || 'system_shared';
    req.tenantSlug = tenantSlug;

    console.log(`[LEAVE] ${req.method} ${req.path} - Tenant: ${tenantSlug}`);

    if (tenantSlug === 'system_shared') {
      req.tenant = {
        db_name: process.env.DB_NAME || 'restpoint_main',
        tenant_id: 1,
        name: 'System Shared'
      };
      return next();
    }

    // Resolve tenant database using shared dbConfig
    try {
      const dbConfig = require('../../shared/dbConfig.js');
      const { resolveDatabase, lookupTenantDatabase, getRootPool } = dbConfig;

      // LEAVES ALWAYS LIVE IN THE MAIN/PARENT TENANT DATABASE ONLY — never in a
      // branch DB. This keeps every leave request for an organization in ONE
      // place (the parent tenant's main database), regardless of which branch
      // the requesting user belongs to.
      let dbName = await resolveMainTenantDatabase(tenantSlug, { resolveDatabase, lookupTenantDatabase, getRootPool });

      if (!dbName) {
        // Fallback: for multi-branch tenants the database name is the tenant
        // slug; for single-branch tenants it is also the tenant slug.
        dbName = tenantSlug.replace(/-/g, '_');
      }

      req.tenant = {
        db_name: dbName,
        tenant_slug: tenantSlug,
        name: tenantSlug
      };
      console.log(`[LEAVE] Tenant resolved (MAIN database): ${dbName}`);

      // Auto-migrate: Ensure leave tables exist in this tenant's MAIN database
      if (dbName) {
        migrateTenantTables(dbName).catch(err => {
          console.warn(`[LEAVE] Auto-migration warning for ${dbName}:`, err.message);
        });
      }
    } catch (dbErr) {
      console.error('[LEAVE] Database resolution error:', dbErr.message);
      req.tenant = {
        db_name: process.env.DB_NAME || 'restpoint_main',
        tenant_slug: tenantSlug,
        name: tenantSlug
      };
    }

    next();
  } catch (error) {
    console.error('[LEAVE] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize tenant database',
      error: error.message
    });
  }
});

// Routes
const leaveRoutes = require('./leaveRoutes');
app.use('/leaves', leaveRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'leave-service', timestamp: new Date().toISOString() });
});

// Compatibility health endpoint (some probes and the Docker healthcheck hit /health)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'leave-service', timestamp: new Date().toISOString() });
});

app.head('/health', (_req, res) => {
  res.status(200).end();
});

// ============================================
// AUTO-MIGRATION: Ensure leave tables exist
// ============================================
async function ensureLeaveTables(dbName) {
  try {
    await migrateTenantTables(dbName);
    console.log(`✅ Leave tables ensured in database: ${dbName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to ensure leave tables in ${dbName}:`, error.message);
    return false;
  }
}

// ============================================
// MIGRATE ALL TENANT DATABASES
// ============================================
async function migrateAllTenantDatabases() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'tenant_tracking',
      authPlugins: {
        auth_gssapi_client: function () {
          return function () {
            throw new Error('GSSAPI not supported - use mysql_native_password');
          };
        },
      },
    });

    // Get all active tenants
    const [tenants] = await connection.query(
      'SELECT db_name, tenant_name FROM tenants WHERE status = "active"'
    );

    console.log(`[LEAVE] Found ${tenants.length} active tenant(s) to migrate`);

    for (const tenant of tenants) {
      if (tenant.db_name) {
        console.log(`[LEAVE] Migrating tenant: ${tenant.tenant_name} (${tenant.db_name})`);
        await ensureLeaveTables(tenant.db_name);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('[LEAVE] Error migrating tenant databases:', error.message);
  }
}

// ============================================
// START SERVER
// ============================================
async function startServer() {
  // Run auto-migration on the main database
  const mainDb = process.env.DB_NAME || 'restpoint_main';
  console.log(`🔧 Running auto-migration for leave tables in: ${mainDb}`);
  await ensureLeaveTables(mainDb);

  // Migrate all tenant databases
  console.log(`🔧 Migrating leave tables for all tenant databases...`);
  await migrateAllTenantDatabases();

  const PORT = process.env.PORT || 5017;
  server.listen(PORT, () => {
    console.log('========================================');
    console.log(`📅 Leave Management Service`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Default Leave Days: 26 per user per year`);
    console.log('========================================');
  });
}

startServer();

module.exports = { app, server, io };