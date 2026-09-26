"use strict";
/**
 * @file shared/dbConfig.ts
 * PRODUCTION-GRADE CENTRALIZED DATABASE CONFIGURATION
 * Features: Circuit Breaker, Pool Limits, Logger, Memory Leak Prevention
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.closeAllConnections = exports.closeTenantDB = exports.safeTenantExecute = exports.safeTenantQuery = exports.execute = exports.query = exports.getTenantDBBySlug = exports.getTenantDB = exports.resolveDatabase = exports.lookupTenantDatabase = exports.getRootPool = void 0;
const mysql = __importStar(require("mysql2/promise"));
// ============================================
// Logger (production-safe, no console.log)
// ============================================
const LOGGER = {
    info: (msg, data) => {
        if (process.env.NODE_ENV !== 'test') {
            process.stdout.write(JSON.stringify({ level: 'info', msg, data, ts: new Date().toISOString() }) + '\n');
        }
    },
    warn: (msg, data) => {
        process.stdout.write(JSON.stringify({ level: 'warn', msg, data, ts: new Date().toISOString() }) + '\n');
    },
    error: (msg, data) => {
        process.stderr.write(JSON.stringify({ level: 'error', msg, data, ts: new Date().toISOString() }) + '\n');
    },
};
// ============================================
// GSSAPI Auth Plugin Fix for MariaDB 10.11+
// ============================================
const auth_gssapi_client = () => () => {
    throw new Error('GSSAPI not supported - use mysql_native_password');
};
// ============================================
// Circuit Breaker
// ============================================
class CircuitBreaker {
    failures = 0;
    lastFailureTime = 0;
    state = 'CLOSED';
    threshold;
    timeout;
    halfOpenMaxRequests = 1;
    halfOpenRequests = 0;
    constructor(threshold = 5, timeout = 30000) {
        this.threshold = threshold;
        this.timeout = timeout;
    }
    async call(fn, fallback) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime >= this.timeout) {
                this.state = 'HALF_OPEN';
                this.halfOpenRequests = 0;
                LOGGER.info('Circuit breaker half-open, allowing test request');
            }
            else {
                LOGGER.warn('Circuit breaker OPEN, using fallback', { failures: this.failures });
                return fallback();
            }
        }
        if (this.state === 'HALF_OPEN' && this.halfOpenRequests >= this.halfOpenMaxRequests) {
            return fallback();
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure(error);
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        this.halfOpenRequests = 0;
        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            LOGGER.info('Circuit breaker CLOSED after successful half-open request');
        }
    }
    onFailure(error) {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
            LOGGER.error('Circuit breaker OPEN after half-open failure', { error: error.message });
        }
        else if (this.failures >= this.threshold) {
            this.state = 'OPEN';
            LOGGER.error('Circuit breaker OPEN', { failures: this.failures, threshold: this.threshold });
        }
    }
    getState() {
        return this.state;
    }
    reset() {
        this.failures = 0;
        this.state = 'CLOSED';
        this.halfOpenRequests = 0;
    }
}
// ============================================
// Configuration
// ============================================
const DB_CONFIG = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number.parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'restpoint_user',
    password: process.env.DB_PASSWORD || '',
    authPlugins: { auth_gssapi_client },
    dateStrings: true, // return DATE/DATETIME columns as plain 'YYYY-MM-DD' strings (no UTC shift)
    connectTimeout: 10000,
};
// Pool limits to prevent memory leaks
const MAX_POOL_CACHE_SIZE = 50; // Max tenant pools to cache
const POOL_IDLE_TIMEOUT = 300000; // 5 minutes idle timeout
const POOL_CLEANUP_INTERVAL = 60000; // Check every 60s
const MAX_POOL_CONNECTIONS = 10;
const MIN_POOL_CONNECTIONS = 2;
// ─── Connection Pool Caches ──────────────────────────────────────────────────
let rootPool = null;
const tenantPoolCache = new Map();
const branchDbCache = new Map();
const branchDbCacheTTL = 300000; // 5 minutes
// slug → resolved database name, keyed by `<mode>:<slug>` (`active` = only
// status='active' rows, `any` = status ignored). Positive hits live 5 minutes,
// MISSES only 30s — a missing row must not be re-queried on every request, but
// a tenant that is provisioned moments later must not stay "missing" either.
const tenantLookupCache = new Map();
const TENANT_LOOKUP_TTL = 300000; // 5 minutes (positive hits)
const TENANT_LOOKUP_NEGATIVE_TTL = 30000; // 30 seconds (misses)
// Circuit breakers
const rootPoolBreaker = new CircuitBreaker(5, 30000);
const tenantPoolBreaker = new CircuitBreaker(3, 30000);
// ─── Pool Cleanup Interval (prevents memory leaks) ───────────────────────────
let cleanupInterval = null;
function startPoolCleanup() {
    if (cleanupInterval)
        return;
    cleanupInterval = setInterval(() => {
        const now = Date.now();
        let cleaned = 0;
        // Clean stale branch DB cache entries
        for (const [key, entry] of branchDbCache) {
            if (now - entry.createdAt > branchDbCacheTTL) {
                branchDbCache.delete(key);
                cleaned++;
            }
        }
        // Clean stale tenant-lookup entries (hits and misses have different TTLs)
        for (const [key, entry] of tenantLookupCache) {
            const ttl = entry.dbName ? TENANT_LOOKUP_TTL : TENANT_LOOKUP_NEGATIVE_TTL;
            if (now - entry.createdAt > ttl) {
                tenantLookupCache.delete(key);
                cleaned++;
            }
        }
        // Clean idle tenant pools (beyond max cache size)
        if (tenantPoolCache.size > MAX_POOL_CACHE_SIZE) {
            const sorted = [...tenantPoolCache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
            const toRemove = sorted.slice(0, tenantPoolCache.size - MAX_POOL_CACHE_SIZE);
            for (const [key, entry] of toRemove) {
                entry.pool.end().catch(() => { });
                tenantPoolCache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            LOGGER.info('Pool cleanup completed', { removed: cleaned, remaining: tenantPoolCache.size });
        }
    }, POOL_CLEANUP_INTERVAL);
    // Allow process to exit even if interval is running
    if (cleanupInterval)
        cleanupInterval.unref();
}
function stopPoolCleanup() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
    }
}
// ─── Root Pool ───────────────────────────────────────────────────────────────
const getRootPool = async () => {
    if (!rootPool) {
        rootPool = mysql.createPool({
            ...DB_CONFIG,
            database: 'tenant_tracking',
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 10,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
            idleTimeout: POOL_IDLE_TIMEOUT,
        });
        // Test connection
        try {
            const conn = await rootPool.getConnection();
            conn.release();
            LOGGER.info('Root database pool created (tenant_tracking)');
        }
        catch (err) {
            LOGGER.error('Root pool creation failed', { error: err.message });
        }
        startPoolCleanup();
    }
    return rootPool;
};
exports.getRootPool = getRootPool;
// ─── Tenant Lookup Helpers ───────────────────────────────────────────────────
// Schemas that must NEVER be handed back as a tenant database, whatever the
// registry says. Last line of defence for a malformed/attacked tracking row.
const RESERVED_SCHEMAS = new Set([
    'information_schema',
    'mysql',
    'performance_schema',
    'sys',
    'tenant_tracking',
]);
/**
 * Every spelling of the same identifier the registry may hold.
 *
 * tenant-service provisions a tenant with `db_name = tenant_slug =
 * generateSlug(tenant_name)`, i.e. HYPHENATED (`acme-funeral-home`), while the
 * legacy/bootstrap path used underscores (`restpoint_acme`, `tenant_acme`) and
 * a branch appends its own name to the parent database
 * (`acme-funeral-home-nairobi`). Normalising the separators here means
 * `x-tenant-slug: acme-funeral-home` still finds a row stored as
 * `acme_funeral_home` (and vice versa).
 */
const identVariants = (value) => {
    const raw = String(value || '').trim();
    if (!raw)
        return [];
    return Array.from(new Set([raw, raw.replace(/_/g, '-'), raw.replace(/-/g, '_')])).filter(Boolean);
};
const escapeLikePattern = (value) => String(value).replace(/[\\%_]/g, (ch) => `\\${ch}`);
const toUsableDbName = (value) => {
    const name = String(value !== null && value !== void 0 ? value : '').trim();
    if (!name)
        return null;
    if (RESERVED_SCHEMAS.has(name.toLowerCase())) {
        LOGGER.error('Refusing reserved schema as tenant database', { name });
        return null;
    }
    return name;
};
const schemaExists = async (pool, name) => {
    try {
        const [rows] = await pool.query('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ? LIMIT 1', [name]);
        return rows.length > 0;
    }
    catch (_a) {
        return false;
    }
};
/**
 * One allowlist row lookup that matches the slug against BOTH registry columns
 * (`tenant_slug` and `db_name`) in every separator spelling, with the status
 * filter applied by the caller.
 */
const findTenantRow = async (pool, slug, requireActive) => {
    const variants = identVariants(slug);
    const [rows] = await pool.query(`SELECT db_name, tenant_slug, status
       FROM tenant_tracking.tenants
      WHERE (tenant_slug IN (?)
             OR db_name IN (?)
             OR REPLACE(TRIM(tenant_slug), '_', '-') IN (?)
             OR REPLACE(TRIM(db_name), '_', '-') IN (?))
        ${requireActive ? `AND status = 'active'` : ''}
      LIMIT 1`, [variants, variants, variants, variants]);
    return rows.length > 0 ? rows[0] : null;
};
// ─── Tenant Lookup with Circuit Breaker ──────────────────────────────────────
const lookupTenantDatabase = async (tenantSlug, options = {}) => {
    const requireActive = options.requireActive !== false;
    const slug = String(tenantSlug || '').trim();
    if (!slug) {
        LOGGER.warn('Invalid slug provided', { slug: tenantSlug });
        return null;
    }
    const cacheKey = `${requireActive ? 'active' : 'any'}:${slug}`;
    const cached = tenantLookupCache.get(cacheKey);
    if (cached) {
        const ttl = cached.dbName ? TENANT_LOOKUP_TTL : TENANT_LOOKUP_NEGATIVE_TTL;
        if (Date.now() - cached.createdAt < ttl)
            return cached.dbName;
        tenantLookupCache.delete(cacheKey);
    }
    const remember = (dbName) => {
        tenantLookupCache.set(cacheKey, { dbName, createdAt: Date.now() });
        return dbName;
    };
    return rootPoolBreaker.call(async () => {
        const pool = await (0, exports.getRootPool)();
        // ── Pass 1: the registry's own columns ─────────────────────────────────
        const row = await findTenantRow(pool, slug, requireActive);
        if (row) {
            const direct = toUsableDbName(row.db_name);
            if (direct) {
                LOGGER.info('Tenant database resolved from tenant_tracking.tenants', { slug, dbName: direct });
                return remember(direct);
            }
            // A row whose db_name is empty can still be usable: tenant-service
            // always writes db_name = tenant_slug, so fall back to the row's OWN
            // slug (server-controlled) once a schema with that name really exists.
            const fallback = toUsableDbName(row.tenant_slug);
            if (fallback && (await schemaExists(pool, fallback))) {
                LOGGER.warn('Tenant row has no db_name - using its slug as the database', { slug, dbName: fallback });
                return remember(fallback);
            }
            LOGGER.warn('Tenant row found but it has no usable database', { slug, tenantSlug: row.tenant_slug, dbName: row.db_name });
        }
        // ── Pass 2: the platform-wide branch registry ───────────────────────────
        // tenant_tracking.branches maps every branch slug to the database holding
        // its data. Multi-branch tenants send the BRANCH slug in x-tenant-slug,
        // while `tenants` only knows the PARENT slug.
        try {
            const [branchRows] = await pool.query(`SELECT b.branch_db_name, t.db_name AS tenant_db_name, t.tenant_slug AS tenant_slug
             FROM tenant_tracking.branches b
             LEFT JOIN tenant_tracking.tenants t ON t.id = b.tenant_id
            WHERE b.branch_slug IN (?)
              ${requireActive ? `AND t.status = 'active'` : ''}
            LIMIT 1`, [identVariants(slug)]);
            const branch = branchRows[0];
            if (branch) {
                const branchDb = toUsableDbName(branch.branch_db_name) ||
                    toUsableDbName(branch.tenant_db_name) ||
                    toUsableDbName(branch.tenant_slug);
                if (branchDb) {
                    LOGGER.info('Tenant database resolved from tenant_tracking.branches', { slug, dbName: branchDb });
                    return remember(branchDb);
                }
            }
        }
        catch (err) {
            // The tracking branch table is optional in older deployments - it must
            // never break the primary (tenants) lookup.
            LOGGER.warn('Branch registry lookup skipped', { slug, error: err.message });
        }
        // ── Pass 3: `<parent-slug>-<branch>` decomposition ──────────────────────
        // Mirrors resolveDatabase()'s branch mode but allowlist-first: the parent
        // must exist in tenant_tracking.tenants before its own `branches` table is
        // consulted for the exact full slug.
        const dashIndex = slug.lastIndexOf('-');
        if (dashIndex > 0) {
            const parentSlug = slug.slice(0, dashIndex);
            const branchName = slug.slice(dashIndex + 1);
            const parentRow = await findTenantRow(pool, parentSlug, false);
            const parentDb = parentRow
                ? toUsableDbName(parentRow.db_name) || toUsableDbName(parentRow.tenant_slug)
                : null;
            if (parentDb) {
                try {
                    const tenantPool = await (0, exports.getTenantDB)(parentDb);
                    const [exactRows] = await tenantPool.query('SELECT branch_db_name FROM branches WHERE branch_slug = ? AND is_active = TRUE LIMIT 1', [slug]);
                    const exact = exactRows[0];
                    const exactDb = exact ? toUsableDbName(exact.branch_db_name) : null;
                    if (exactDb) {
                        LOGGER.info('Tenant database resolved from branches (parent + branch)', { slug, parentDb, dbName: exactDb });
                        return remember(exactDb);
                    }
                    const like = `%${escapeLikePattern(branchName)}%`;
                    const [rows] = await tenantPool.query(`SELECT branch_db_name FROM branches
                WHERE (branch_slug LIKE ? OR branch_name LIKE ?) AND is_active = TRUE
                LIMIT 1`, [like, like]);
                    const loose = rows[0];
                    const looseDb = loose ? toUsableDbName(loose.branch_db_name) : null;
                    if (looseDb) {
                        LOGGER.info('Tenant database resolved from branches (name match)', { slug, parentDb, dbName: looseDb });
                        return remember(looseDb);
                    }
                }
                catch (err) {
                    LOGGER.warn('Branch decomposition lookup failed', { slug, parentDb, error: err.message });
                    // The slug belongs to a real tenant, so serving the parent database
                    // is better than 403-ing every request.
                    return remember(parentDb);
                }
            }
        }
        // ── No match - log what the registry DOES hold nearby ─────────────────
        // Without this, "No database found for tenant" gives the operator nothing
        // to act on. The near-miss list names the values actually stored, so the
        // data can be corrected (or the resolver extended) immediately.
        let nearMisses = [];
        try {
            const prefix = `${escapeLikePattern(String(slug).split('-')[0])}%`;
            const [near] = await pool.query(`SELECT tenant_slug, db_name, status
             FROM tenant_tracking.tenants
            WHERE tenant_slug LIKE ? OR db_name LIKE ?
            LIMIT 5`, [prefix, prefix]);
            nearMisses = near.map((r) => `${r.tenant_slug} -> ${r.db_name} (${r.status})`);
        }
        catch (_a) {
            /* diagnostics only - never fatal */
        }
        LOGGER.warn(requireActive ? 'No active database found for tenant' : 'No database found for tenant', {
            tenantSlug: slug,
            requireActive,
            searched: [
                'tenants.tenant_slug',
                'tenants.db_name',
                'tenant_tracking.branches.branch_slug',
                'branches.branch_slug (parent)',
            ],
            nearMisses,
        });
        return remember(null);
    }, () => null);
};
exports.lookupTenantDatabase = lookupTenantDatabase;
// ─── Unified Slug Resolution ─────────────────────────────────────────
const resolveDatabase = async (slug) => {
    if (!slug) {
        LOGGER.warn('Invalid slug provided', { slug });
        return null;
    }
    // Check cache first
    const cached = branchDbCache.get(slug);
    if (cached && Date.now() - cached.createdAt < branchDbCacheTTL) {
        return cached.dbName;
    }
    LOGGER.info('Resolving database for slug', { slug });
    // Check if slug IS the database name
    try {
        const pool = await (0, exports.getRootPool)();
        const [dbRows] = await pool.query('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ? LIMIT 1', [slug]);
        const dbResult = dbRows;
        if (dbResult.length > 0) {
            branchDbCache.set(slug, { dbName: slug, createdAt: Date.now() });
            return slug;
        }
    }
    catch (err) {
        LOGGER.warn('Direct DB check failed', { slug, error: err.message });
    }
    // Try as main tenant slug
    const mainDbName = await (0, exports.lookupTenantDatabase)(slug);
    if (mainDbName) {
        branchDbCache.set(slug, { dbName: mainDbName, createdAt: Date.now() });
        return mainDbName;
    }
    // Try branch mode
    const lastDashIndex = slug.lastIndexOf('-');
    if (lastDashIndex > 0) {
        const possibleTenantSlug = slug.substring(0, lastDashIndex);
        const branchName = slug.substring(lastDashIndex + 1);
        const tenantDbName = await (0, exports.lookupTenantDatabase)(possibleTenantSlug);
        if (tenantDbName) {
            try {
                const pool = await (0, exports.getTenantDB)(tenantDbName);
                // Prefer an EXACT full-slug match first (e.g. `org-home-nairobi`) so
                // similarly named branches (`Nairobi`, `Nairobi West`) can never
                // cross-resolve, then fall back to the loose name match.
                const [exactRows] = await pool.query('SELECT branch_db_name FROM branches WHERE branch_slug = ? AND is_active = TRUE LIMIT 1', [slug]);
                const exactList = exactRows;
                if (exactList.length > 0 && exactList[0].branch_db_name) {
                    branchDbCache.set(slug, { dbName: exactList[0].branch_db_name, createdAt: Date.now() });
                    return exactList[0].branch_db_name;
                }
                const [rows] = await pool.query(`SELECT branch_db_name FROM branches
           WHERE (branch_slug LIKE ? OR branch_name LIKE ?) AND is_active = TRUE
           LIMIT 1`, [`%${branchName}%`, `%${branchName}%`]);
                const list = rows;
                if (list.length > 0) {
                    const branchDbName = list[0].branch_db_name;
                    branchDbCache.set(slug, { dbName: branchDbName, createdAt: Date.now() });
                    return branchDbName;
                }
            }
            catch (err) {
                LOGGER.warn('Branch lookup failed, falling back to main DB', {
                    tenantDbName,
                    error: err.message,
                });
                return tenantDbName;
            }
            return tenantDbName;
        }
    }
    LOGGER.error('Could not resolve database for slug', { slug });
    return null;
};
exports.resolveDatabase = resolveDatabase;
// ─── Tenant Pool Management ──────────────────────────────────────────────────
const getTenantDB = async (tenantDbName) => {
    const cached = tenantPoolCache.get(tenantDbName);
    if (cached) {
        cached.lastUsed = Date.now();
        return cached.pool;
    }
    // Enforce max cache size
    if (tenantPoolCache.size >= MAX_POOL_CACHE_SIZE) {
        const oldest = [...tenantPoolCache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed)[0];
        if (oldest) {
            oldest[1].pool.end().catch(() => { });
            tenantPoolCache.delete(oldest[0]);
            LOGGER.info('Evicted oldest pool to maintain cache limit', { dbName: oldest[0] });
        }
    }
    const pool = mysql.createPool({
        ...DB_CONFIG,
        database: tenantDbName,
        waitForConnections: true,
        connectionLimit: MAX_POOL_CONNECTIONS,
        queueLimit: 20,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        idleTimeout: POOL_IDLE_TIMEOUT,
    });
    // Test connection
    try {
        const conn = await pool.getConnection();
        conn.release();
        LOGGER.info('Connected to tenant database', { dbName: tenantDbName });
    }
    catch (err) {
        LOGGER.error('Tenant database connection failed', { dbName: tenantDbName, error: err.message });
        // A database that does not exist is a permanent, deterministic failure — every
        // query against this pool would fail with the same error. Fail fast with a clear
        // message instead of caching a poisoned pool whose error only surfaces later at
        // the call site (e.g. "Unknown database" inside a controller).
        if (err && (err.code === 'ER_BAD_DB_ERROR' || /Unknown database/i.test(err.message || ''))) {
            await pool.end().catch(() => { });
            throw new Error(`Unknown database '${tenantDbName}'. Did you mean to resolveDatabase(slug) first?`);
        }
    }
    tenantPoolCache.set(tenantDbName, { pool, createdAt: Date.now(), lastUsed: Date.now() });
    return pool;
};
exports.getTenantDB = getTenantDB;
const getTenantDBBySlug = async (tenantSlug) => {
    const dbName = await (0, exports.lookupTenantDatabase)(tenantSlug);
    if (!dbName)
        return null;
    return (0, exports.getTenantDB)(dbName);
};
exports.getTenantDBBySlug = getTenantDBBySlug;
// ─── Global Query Executors ──────────────────────────────────────────────────
const query = async (req, sql, params = []) => {
    const rawSlug = req.headers['x-slug'] || req.headers['x-tenant-slug'];
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
    if (!slug) {
        throw new Error('Missing x-slug or x-tenant-slug header');
    }
    const dbName = await (0, exports.resolveDatabase)(slug);
    if (!dbName) {
        throw new Error(`No database configured for: ${slug}`);
    }
    try {
        const pool = await (0, exports.getTenantDB)(dbName);
        const [rows] = await pool.query(sql, params);
        return rows;
    }
    catch (error) {
        LOGGER.error('Query error', { dbName, message: error.message, sql: sql.substring(0, 200) });
        throw error;
    }
};
exports.query = query;
const execute = async (req, sql, params = []) => {
    const rawSlug = req.headers['x-slug'] || req.headers['x-tenant-slug'];
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
    if (!slug) {
        throw new Error('Missing x-slug or x-tenant-slug header');
    }
    const dbName = await (0, exports.resolveDatabase)(slug);
    if (!dbName) {
        throw new Error(`No database configured for: ${slug}`);
    }
    try {
        const pool = await (0, exports.getTenantDB)(dbName);
        const [result] = await pool.query(sql, params);
        return result;
    }
    catch (error) {
        LOGGER.error('Execute error', { dbName, message: error.message, sql: sql.substring(0, 200) });
        throw error;
    }
};
exports.execute = execute;
// ─── Safe Query Functions ────────────────────────────────────────────────────
const safeTenantQuery = async (dbName, sql, params = []) => {
    try {
        const pool = await (0, exports.getTenantDB)(dbName);
        const [rows] = await pool.query(sql, params);
        return rows;
    }
    catch (error) {
        LOGGER.error('safeTenantQuery error', {
            dbName,
            message: error.message,
            sql: sql.substring(0, 200),
        });
        throw error;
    }
};
exports.safeTenantQuery = safeTenantQuery;
const safeTenantExecute = async (dbName, sql, params = []) => {
    try {
        const pool = await (0, exports.getTenantDB)(dbName);
        const [result] = await pool.query(sql, params);
        return result;
    }
    catch (error) {
        LOGGER.error('safeTenantExecute error', {
            dbName,
            message: error.message,
            sql: sql.substring(0, 200),
        });
        throw error;
    }
};
exports.safeTenantExecute = safeTenantExecute;
// ─── Connection Management ───────────────────────────────────────────────────
const closeTenantDB = async (tenantDbName) => {
    const entry = tenantPoolCache.get(tenantDbName);
    if (entry) {
        await entry.pool.end().catch(() => { });
        tenantPoolCache.delete(tenantDbName);
        LOGGER.info('Closed pool for tenant', { dbName: tenantDbName });
    }
};
exports.closeTenantDB = closeTenantDB;
const closeAllConnections = async () => {
    stopPoolCleanup();
    for (const [dbName, entry] of tenantPoolCache) {
        await entry.pool.end().catch(() => { });
        LOGGER.info('Closed pool', { dbName });
    }
    tenantPoolCache.clear();
    branchDbCache.clear();
    tenantLookupCache.clear();
    if (rootPool) {
        await rootPool.end().catch(() => { });
        rootPool = null;
        LOGGER.info('Closed root pool');
    }
};
exports.closeAllConnections = closeAllConnections;
// ─── Health Check ────────────────────────────────────────────────────────────
const healthCheck = async () => {
    try {
        const pool = await (0, exports.getRootPool)();
        await pool.query('SELECT 1');
        return {
            status: 'healthy',
            pools: tenantPoolCache.size,
            cacheSize: branchDbCache.size,
            rootPoolBreaker: rootPoolBreaker.getState(),
            timestamp: new Date().toISOString(),
        };
    }
    catch (err) {
        return {
            status: 'unhealthy',
            pools: tenantPoolCache.size,
            cacheSize: branchDbCache.size,
            rootPoolBreaker: rootPoolBreaker.getState(),
            timestamp: new Date().toISOString(),
        };
    }
};
exports.healthCheck = healthCheck;
// ─── Default Export ──────────────────────────────────────────────────────────
exports.default = {
    getRootPool: exports.getRootPool,
    lookupTenantDatabase: exports.lookupTenantDatabase,
    resolveDatabase: exports.resolveDatabase,
    getTenantDB: exports.getTenantDB,
    getTenantDBBySlug: exports.getTenantDBBySlug,
    query: exports.query,
    execute: exports.execute,
    safeTenantQuery: exports.safeTenantQuery,
    safeTenantExecute: exports.safeTenantExecute,
    closeTenantDB: exports.closeTenantDB,
    closeAllConnections: exports.closeAllConnections,
    healthCheck: exports.healthCheck,
};
//# sourceMappingURL=dbConfig.js.map