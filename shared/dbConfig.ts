/**
 * @file shared/dbConfig.ts
 * PRODUCTION-GRADE CENTRALIZED DATABASE CONFIGURATION
 * Features: Circuit Breaker, Pool Limits, Logger, Memory Leak Prevention
 */

import * as mysql from 'mysql2/promise';


// Logger (production-safe, no console.log)

const LOGGER = {
  info: (msg: string, data?: any) => {
    if (process.env.NODE_ENV !== 'test') {
      process.stdout.write(
        JSON.stringify({ level: 'info', msg, data, ts: new Date().toISOString() }) + '\n'
      );
    }
  },
  warn: (msg: string, data?: any) => {
    process.stdout.write(
      JSON.stringify({ level: 'warn', msg, data, ts: new Date().toISOString() }) + '\n'
    );
  },
  error: (msg: string, data?: any) => {
    process.stderr.write(
      JSON.stringify({ level: 'error', msg, data, ts: new Date().toISOString() }) + '\n'
    );
  },
};


// GSSAPI Auth Plugin Fix for MariaDB 10.11+

const auth_gssapi_client = () => () => {
  throw new Error('GSSAPI not supported - use mysql_native_password');
};


// Circuit Breaker

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly halfOpenMaxRequests: number = 1;
  private halfOpenRequests = 0;

  constructor(threshold = 5, timeout = 30000) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async call<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'HALF_OPEN';
        this.halfOpenRequests = 0;
        LOGGER.info('Circuit breaker half-open, allowing test request');
      } else {
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
    } catch (error: any) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.halfOpenRequests = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      LOGGER.info('Circuit breaker CLOSED after successful half-open request');
    }
  }

  private onFailure(error: any): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      LOGGER.error('Circuit breaker OPEN after half-open failure', { error: error.message });
    } else if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      LOGGER.error('Circuit breaker OPEN', { failures: this.failures, threshold: this.threshold });
    }
  }

  getState(): string {
    return this.state;
  }
  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.halfOpenRequests = 0;
  }
}


// Configuration

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
let rootPool: mysql.Pool | null = null;
const tenantPoolCache = new Map<
  string,
  { pool: mysql.Pool; createdAt: number; lastUsed: number }
>();
const branchDbCache = new Map<string, { dbName: string; createdAt: number }>();
const branchDbCacheTTL = 300000; // 5 minutes

// slug → resolved database name, keyed by `<mode>:<slug>` (`active` = only
// status='active' rows, `any` = status ignored). Positive hits live 5 minutes,
// MISSES only 30s — a missing row must not be re-queried on every request, but
// a tenant that is provisioned moments later must not stay "missing" either.
const tenantLookupCache = new Map<string, { dbName: string | null; createdAt: number }>();
const TENANT_LOOKUP_TTL = 300000;         // 5 minutes (positive hits)
const TENANT_LOOKUP_NEGATIVE_TTL = 30000; // 30 seconds (misses)

// Circuit breakers
const rootPoolBreaker = new CircuitBreaker(5, 30000);
const tenantPoolBreaker = new CircuitBreaker(3, 30000);

// ─── Pool Cleanup Interval (prevents memory leaks) ───────────────────────────
let cleanupInterval: NodeJS.Timeout | null = null;

function startPoolCleanup(): void {
  if (cleanupInterval) return;
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
  if (cleanupInterval) cleanupInterval.unref();
}

function stopPoolCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// ─── Root Pool 

export const getRootPool = async (): Promise<mysql.Pool> => {
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
    } catch (err: any) {
      LOGGER.error('Root pool creation failed', { error: err.message });
      const failedPool = rootPool;
      rootPool = null;
      await failedPool?.end().catch(() => { });
      throw new Error(`Root database connection failed: ${err.message}`);
    }

    startPoolCleanup();
  }
  return rootPool;
};

// ─── Tenant Lookup with Circuit Breaker 

/**
 * Schemas that must NEVER be handed back as a tenant database, whatever the
 * registry says. Last line of defence for a malformed/attacked tracking row.
 */
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
const identVariants = (value: string): string[] => {
  const raw = String(value || '').trim();
  if (!raw) return [];
  return Array.from(new Set([raw, raw.replace(/_/g, '-'), raw.replace(/-/g, '_')])).filter(Boolean);
};

/** `%`/`_`/`\` in a slug must not turn into wildcards inside a LIKE pattern. */
const escapeLikePattern = (value: string): string =>
  String(value).replace(/[\\%_]/g, (ch) => `\\${ch}`);

/** A schema name is only usable as a tenant DB when it is not a system schema. */
const toUsableDbName = (value: any): string | null => {
  const name = String(value ?? '').trim();
  if (!name) return null;
  if (RESERVED_SCHEMAS.has(name.toLowerCase())) {
    LOGGER.error('Refusing reserved schema as tenant database', { name });
    return null;
  }
  return name;
};

const schemaExists = async (pool: mysql.Pool, name: string): Promise<boolean> => {
  try {
    const [rows] = await pool.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ? LIMIT 1',
      [name]
    );
    return (rows as any[]).length > 0;
  } catch {
    return false;
  }
};

/**
 * One allowlist row lookup that matches the slug against BOTH registry columns
 * (`tenant_slug` and `db_name`) in every separator spelling, with the status
 * filter applied by the caller.
 */
const findTenantRow = async (
  pool: mysql.Pool,
  slug: string,
  requireActive: boolean
): Promise<any | null> => {
  const variants = identVariants(slug);
  const [rows] = await pool.query(
    `SELECT db_name, tenant_slug, status
       FROM tenant_tracking.tenants
      WHERE (tenant_slug IN (?)
             OR db_name IN (?)
             OR REPLACE(TRIM(tenant_slug), '_', '-') IN (?)
             OR REPLACE(TRIM(db_name), '_', '-') IN (?))
        ${requireActive ? `AND status = 'active'` : ''}
      LIMIT 1`,
    [variants, variants, variants, variants]
  );
  const list = rows as any[];
  return list.length > 0 ? list[0] : null;
};

/**
 * Resolve a tenant slug → database name through the tenant allowlist.
 *
 * SECURITY: the slug is ALWAYS matched against tenant_tracking.tenants, so an
 * arbitrary schema name (information_schema, mysql, another tenant's db_name,
 * …) can never be used as "the tenant".
 *
 * `requireActive` defaults to TRUE (unchanged behaviour for every caller).
 * Pass `{ requireActive: false }` when the DATA must still be readable while the
 * tenant row is not `status = "active"` (suspended / trial / pending) — e.g. the
 * deceased-service, where a suspended funeral home must keep access to its
 * mortuary records. The slug↔db_name allowlist check is kept in both modes.
 *
 * RESOLUTION ORDER (first hit wins):
 *   1. tenants.tenant_slug / tenants.db_name (exact, trimmed, `-`/`_` folded)
 *   2. tenant_tracking.branches.branch_slug → branch_db_name (the parent row is
 *      the fallback) — multi-branch tenants address a branch as
 *      `<org>-<branch>`, a slug `tenants` alone does not know about
 *   3. `<parent>-<branch>` decomposition: the parent tenant's own `branches`
 *      table decides the database (`branch_slug` exact, then a name match)
 */
export const lookupTenantDatabase = async (
  tenantSlug: string,
  options: { requireActive?: boolean } = {}
): Promise<string | null> => {
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
    if (Date.now() - cached.createdAt < ttl) return cached.dbName;
    tenantLookupCache.delete(cacheKey);
  }

  const remember = (dbName: string | null): string | null => {
    tenantLookupCache.set(cacheKey, { dbName, createdAt: Date.now() });
    return dbName;
  };

  return rootPoolBreaker.call(
    async () => {
      const pool = await getRootPool();

      // ── Pass 1: the registry's own columns ─────────────────────────────────
      const row = await findTenantRow(pool, slug, requireActive);
      if (row) {
        const direct = toUsableDbName(row.db_name);
        if (direct) {
          LOGGER.info('Tenant database resolved from tenant_tracking.tenants', {
            slug,
            dbName: direct,
          });
          return remember(direct);
        }
        // A row whose db_name is empty can still be usable: tenant-service
        // always writes db_name = tenant_slug, so fall back to the row's OWN
        // slug (server-controlled) once a schema with that name really exists.
        const fallback = toUsableDbName(row.tenant_slug);
        if (fallback && (await schemaExists(pool, fallback))) {
          LOGGER.warn('Tenant row has no db_name — using its slug as the database', {
            slug,
            dbName: fallback,
          });
          return remember(fallback);
        }
        LOGGER.warn('Tenant row found but it has no usable database', {
          slug,
          tenantSlug: row.tenant_slug,
          dbName: row.db_name,
        });
      }
      // ── Pass 2: the platform-wide branch registry ───────────────────────────
      // tenant_tracking.branches maps every branch slug to the database holding
      // its data. Multi-branch tenants send the BRANCH slug in x-tenant-slug,
      // while `tenants` only knows the PARENT slug.
      try {
        const [branchRows] = await pool.query(
          `SELECT b.branch_db_name, t.db_name AS tenant_db_name, t.tenant_slug AS tenant_slug
             FROM tenant_tracking.branches b
             LEFT JOIN tenant_tracking.tenants t ON t.id = b.tenant_id
            WHERE b.branch_slug IN (?)
              ${requireActive ? `AND t.status = 'active'` : ''}
            LIMIT 1`,
          [identVariants(slug)]
        );
        const branch = (branchRows as any[])[0];
        if (branch) {
          const branchDb =
            toUsableDbName(branch.branch_db_name) ||
            toUsableDbName(branch.tenant_db_name) ||
            toUsableDbName(branch.tenant_slug);
          if (branchDb) {
            LOGGER.info('Tenant database resolved from tenant_tracking.branches', {
              slug,
              dbName: branchDb,
            });
            return remember(branchDb);
          }
        }
      } catch (err: any) {
        // The tracking branch table is optional in older deployments — it must
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
            const tenantPool = await getTenantDB(parentDb);
            const [exactRows] = await tenantPool.query(
              'SELECT branch_db_name FROM branches WHERE branch_slug = ? AND is_active = TRUE LIMIT 1',
              [slug]
            );
            const exact = (exactRows as any[])[0];
            const exactDb = exact ? toUsableDbName(exact.branch_db_name) : null;
            if (exactDb) {
              LOGGER.info('Tenant database resolved from branches (parent + branch)', {
                slug,
                parentDb,
                dbName: exactDb,
              });
              return remember(exactDb);
            }

            const like = `%${escapeLikePattern(branchName)}%`;
            const [rows] = await tenantPool.query(
              `SELECT branch_db_name FROM branches
                WHERE (branch_slug LIKE ? OR branch_name LIKE ?) AND is_active = TRUE
                LIMIT 1`,
              [like, like]
            );
            const loose = (rows as any[])[0];
            const looseDb = loose ? toUsableDbName(loose.branch_db_name) : null;
            if (looseDb) {
              LOGGER.info('Tenant database resolved from branches (name match)', {
                slug,
                parentDb,
                dbName: looseDb,
              });
              return remember(looseDb);
            }
          } catch (err: any) {
            LOGGER.warn('Branch decomposition lookup failed', {
              slug,
              parentDb,
              error: err.message,
            });
            // The slug belongs to a real tenant, so serving the parent database
            // is better than 403-ing every request.
            return remember(parentDb);
          }
        }
      }

      // ── No match — log what the registry DOES hold nearby ───────────────────
      // Without this, "No database found for tenant" gives the operator nothing
      // to act on. The near-miss list names the values actually stored, so the
      // data can be corrected (or the resolver extended) immediately.
      let nearMisses: string[] = [];
      try {
        const prefix = `${escapeLikePattern(String(slug).split('-')[0]!)}%`;
        const [near] = await pool.query(
          `SELECT tenant_slug, db_name, status
             FROM tenant_tracking.tenants
            WHERE tenant_slug LIKE ? OR db_name LIKE ?
            LIMIT 5`,
          [prefix, prefix]
        );
        nearMisses = (near as any[]).map(
          (r) => `${r.tenant_slug} → ${r.db_name} (${r.status})`
        );
      } catch {
        /* diagnostics only — never fatal */
      }

      LOGGER.warn(
        requireActive ? 'No active database found for tenant' : 'No database found for tenant',
        {
          tenantSlug: slug,
          requireActive,
          searched: [
            'tenants.tenant_slug',
            'tenants.db_name',
            'tenant_tracking.branches.branch_slug',
            'branches.branch_slug (parent)',
          ],
          nearMisses,
        }
      );
      return remember(null);
    },
    () => null
  );
};



// ─── Unified Slug Resolution ─────────────────────────────────────────

export const resolveDatabase = async (slug: string): Promise<string | null> => {
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
    const pool = await getRootPool();
    const [dbRows] = await pool.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ? LIMIT 1',
      [slug]
    );
    const dbResult = dbRows as any[];
    if (dbResult.length > 0) {
      branchDbCache.set(slug, { dbName: slug, createdAt: Date.now() });
      return slug;
    }
  } catch (err: any) {
    LOGGER.warn('Direct DB check failed', { slug, error: err.message });
  }

  // Try as main tenant slug
  const mainDbName = await lookupTenantDatabase(slug);
  if (mainDbName) {
    branchDbCache.set(slug, { dbName: mainDbName, createdAt: Date.now() });
    return mainDbName;
  }

  // Try branch mode
  const lastDashIndex = slug.lastIndexOf('-');
  if (lastDashIndex > 0) {
    const possibleTenantSlug = slug.substring(0, lastDashIndex);
    const branchName = slug.substring(lastDashIndex + 1);
    const tenantDbName = await lookupTenantDatabase(possibleTenantSlug);

    if (tenantDbName) {
      try {
        const pool = await getTenantDB(tenantDbName);
        // Prefer an EXACT full-slug match first (e.g. `org-home-nairobi`) so
        // similarly named branches (`Nairobi`, `Nairobi West`) can never
        // cross-resolve, then fall back to the loose name match.
        const [exactRows] = await pool.query(
          'SELECT branch_db_name FROM branches WHERE branch_slug = ? AND is_active = TRUE LIMIT 1',
          [slug]
        );
        const exactList = exactRows as any[];
        if (exactList.length > 0 && exactList[0].branch_db_name) {
          branchDbCache.set(slug, { dbName: exactList[0].branch_db_name, createdAt: Date.now() });
          return exactList[0].branch_db_name;
        }
        const [rows] = await pool.query(
          `SELECT branch_db_name FROM branches
           WHERE (branch_slug LIKE ? OR branch_name LIKE ?) AND is_active = TRUE
           LIMIT 1`,
          [`%${branchName}%`, `%${branchName}%`]
        );
        const list = rows as any[];
        if (list.length > 0) {
          const branchDbName = list[0].branch_db_name;
          branchDbCache.set(slug, { dbName: branchDbName, createdAt: Date.now() });
          return branchDbName;
        }
      } catch (err: any) {
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

// ─── Tenant Pool Management ──────────────────────────────────────────────────

export const getTenantDB = async (tenantDbName: string): Promise<mysql.Pool> => {
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
  } catch (err: any) {
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

export const getTenantDBBySlug = async (tenantSlug: string): Promise<mysql.Pool | null> => {
  const dbName = await lookupTenantDatabase(tenantSlug);
  if (!dbName) return null;
  return getTenantDB(dbName);
};

// ─── Global Query Executors ──────────────────────────────────────────────────

export const query = async (req: any, sql: string, params: any[] = []): Promise<any[]> => {
  const rawSlug = req.headers['x-slug'] || req.headers['x-tenant-slug'];
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!slug) {
    throw new Error('Missing x-slug or x-tenant-slug header');
  }

  const dbName = await resolveDatabase(slug);
  if (!dbName) {
    throw new Error(`No database configured for: ${slug}`);
  }

  try {
    const pool = await getTenantDB(dbName);
    const [rows] = await pool.query(sql, params);
    return rows as any[];
  } catch (error: any) {
    LOGGER.error('Query error', { dbName, message: error.message, sql: sql.substring(0, 200) });
    throw error;
  }
};

export const execute = async (
  req: any,
  sql: string,
  params: any[] = []
): Promise<mysql.ResultSetHeader> => {
  const rawSlug = req.headers['x-slug'] || req.headers['x-tenant-slug'];
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!slug) {
    throw new Error('Missing x-slug or x-tenant-slug header');
  }

  const dbName = await resolveDatabase(slug);
  if (!dbName) {
    throw new Error(`No database configured for: ${slug}`);
  }

  try {
    const pool = await getTenantDB(dbName);
    const [result] = await pool.query(sql, params);
    return result as unknown as mysql.ResultSetHeader;
  } catch (error: any) {
    LOGGER.error('Execute error', { dbName, message: error.message, sql: sql.substring(0, 200) });
    throw error;
  }
};

// ─── Safe Query Functions ────────────────────────────────────────────────────

export const safeTenantQuery = async (
  dbName: string,
  sql: string,
  params: any[] = []
): Promise<any[]> => {
  try {
    const pool = await getTenantDB(dbName);
    const [rows] = await pool.query(sql, params);
    return rows as any[];
  } catch (error: any) {
    LOGGER.error('safeTenantQuery error', {
      dbName,
      message: error.message,
      sql: sql.substring(0, 200),
    });
    throw error;
  }
};

export const safeTenantExecute = async (
  dbName: string,
  sql: string,
  params: any[] = []
): Promise<mysql.ResultSetHeader> => {
  try {
    const pool = await getTenantDB(dbName);
    const [result] = await pool.query(sql, params);
    return result as unknown as mysql.ResultSetHeader;
  } catch (error: any) {
    LOGGER.error('safeTenantExecute error', {
      dbName,
      message: error.message,
      sql: sql.substring(0, 200),
    });
    throw error;
  }
};

// ─── Connection Management ───────────────────────────────────────────────────

export const closeTenantDB = async (tenantDbName: string): Promise<void> => {
  const entry = tenantPoolCache.get(tenantDbName);
  if (entry) {
    await entry.pool.end().catch(() => { });
    tenantPoolCache.delete(tenantDbName);
    LOGGER.info('Closed pool for tenant', { dbName: tenantDbName });
  }
};

export const closeAllConnections = async (): Promise<void> => {
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

// ─── Health Check ────────────────────────────────────────────────────────────

export const healthCheck = async (): Promise<{
  status: string;
  pools: number;
  cacheSize: number;
  rootPoolBreaker: string;
  timestamp: string;
  error?: string;
}> => {
  try {
    const pool = await getRootPool();
    await pool.query('SELECT 1');
    return {
      status: 'healthy',
      pools: tenantPoolCache.size,
      cacheSize: branchDbCache.size,
      rootPoolBreaker: rootPoolBreaker.getState(),
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      status: 'unhealthy',
      pools: tenantPoolCache.size,
      cacheSize: branchDbCache.size,
      rootPoolBreaker: rootPoolBreaker.getState(),
      timestamp: new Date().toISOString(),
      error: err?.message || 'Unknown database health-check failure',
    };
  }
};

// ─── Default Export ──────────────────────────────────────────────────────────

export default {
  getRootPool,
  lookupTenantDatabase,
  resolveDatabase,
  getTenantDB,
  getTenantDBBySlug,
  query,
  execute,
  safeTenantQuery,
  safeTenantExecute,
  closeTenantDB,
  closeAllConnections,
  healthCheck,
};
