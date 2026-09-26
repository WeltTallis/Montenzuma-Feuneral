const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// JWT secrets are resolved lazily (on the first middleware invocation) instead
// of at module load time. Several TS/ESM services statically import this module
// through their route files, and ES module import declarations are hoisted and
// evaluated BEFORE their server.ts runs dotenv.config(). Reading process.env
// here at module-load used to crash those services with
// "FATAL: JWT_SECRET environment variable is required" even though the real
// .env file contained a JWT_SECRET. Deferring the read fixes that whole class
// of import-order bugs while still failing loudly (same message) if a secret
// was genuinely never configured.

let GLOBAL_JWT_SECRET = null;
let JWT_SECRET_RESOLVED = false;

const getJwtSecret = () => {
  if (JWT_SECRET_RESOLVED) {
    return GLOBAL_JWT_SECRET;
  }
  GLOBAL_JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
  if (!GLOBAL_JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      // Fail closed. There is deliberately NO hardcoded fallback any more:
      // the previous 'dev_local_jwt_secret_please_change' literal was
      // committed to git, so anybody could mint a valid platform-wide token
      // against it.
      throw new Error('FATAL: JWT_SECRET environment variable is required');
    }
    // Non-production only: an EPHEMERAL random secret. Tokens do not survive a
    // restart, which is the correct trade-off versus shipping a publicly known
    // signing key in source control.
    GLOBAL_JWT_SECRET = crypto.randomBytes(48).toString('base64url');
    console.warn(
      'WARNING: JWT_SECRET not set — generated an EPHEMERAL development secret. ' +
      'Tokens will not survive a process restart. Set JWT_SECRET in .env. Do NOT use in production.'
    );
  }

  JWT_SECRET_RESOLVED = true;
  return GLOBAL_JWT_SECRET;
};

// ─── Tenant isolation primitives ───────────────────────────────────────────

// Roles allowed to act outside a single tenant (system-admin tooling).
const PLATFORM_ROLES = new Set(['systemadmin', 'superadmin']);

// Every tenant slug the platform issues is lowercase-kebab; reject anything else
// before it is ever used as a database name or cache key.
const TENANT_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

// Duplicate headers arrive from Node as an array. Always take the first element
// rather than letting "[ 'a', 'b' ]" flow through as a string.
const firstHeader = (value) => (Array.isArray(value) ? value[0] : value);

/**
 * Legitimate slug relationships inside ONE organisation:
 *  - exact match                         ("org"        -> "org")
 *  - a branch of the claimed tenant      ("org-home"   -> "org-home-machakos")
 *  - the parent of the claimed tenant    ("org-home-machakos" -> "org-home")
 * Anything else is a different organisation and must be refused.
 */
const slugBelongsToOrg = (claimSlug, headerSlug) => {
  if (!claimSlug || !headerSlug) return false;
  if (claimSlug === headerSlug) return true;
  return headerSlug.startsWith(`${claimSlug}-`) || claimSlug.startsWith(`${headerSlug}-`);
};

/**
 * Derive the authoritative tenant context from the VERIFIED token claims and
 * attach it to the request. The claims are the single source of truth — the
 * `x-tenant-slug` header is only ever treated as an untrusted assertion.
 */
const attachTenantFromClaims = (req) => {
  const claims = req.user || {};
  const role = String(claims.role || '');
  req.role = role;
  req.isPlatformAdmin = PLATFORM_ROLES.has(role);
  req.tenantSlug = claims.tenantSlug || claims.tenant_slug || undefined;
  req.tenantId = claims.tenantId || claims.tenant_id || undefined;
  return claims;
};

// Create a root pool for tenant secret lookups (lazy init)
let rootPool = null;
const getRootPool = () => {
  if (!rootPool) {
    rootPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }

  return rootPool;

};

/**
 * Try to verify a JWT token, falling back through multiple secrets
 * @param {string} token - The JWT token to verify
 * @returns {{ decoded: Object|null, error: string|null }}
 */
const verifyTokenWithFallback = async (token) => {
  // First try: global JWT_SECRET.
  // `algorithms: ['HS256']` pins the accepted algorithm so a token re-signed
  // with `alg: none` or an RS/HS confusion trick can never be accepted.
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    return { decoded, error: null };
  } catch (e) {
    // Continue to try tenant-specific secrets
  }

  // Second try: decode without verification to get tenantId, then look up tenant secret
  try {
    const payload = jwt.decode(token);
    if (payload && payload.tenantId) {
      const pool = getRootPool();
      const [columns] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'jwt_secret'`
      );

      if (columns && columns.length > 0) {
        const [tenants] = await pool.query(
          'SELECT jwt_secret FROM tenant_tracking.tenants WHERE id = ?',
          [payload.tenantId]
        );
        if (tenants.length > 0 && tenants[0].jwt_secret) {
          try {
            const decoded = jwt.verify(token, tenants[0].jwt_secret, { algorithms: ['HS256'] });
            return { decoded, error: null };
          } catch (e) {
            // Tenant secret also failed
          }
        }
      }
    }
  } catch (e) {
    // Could not decode token
  }

  return { decoded: null, error: 'Token invalid or expired' };
};

/**
 * Protect middleware - verifies JWT token from Authorization header or cookie
 * Tries global JWT_SECRET first, then per-tenant secrets
 * Attaches user payload to req.user
 */

const protect = async (req, res, next) => {
  let token;

  // Get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Get token from cookies
  else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  // Fail fast if the JWT secret isn't configured at all — surface the config
  // problem as a clear 500 instead of a misleading 401.
  try {
    getJwtSecret();
  } catch (secretError) {
    return res.status(500).json({
      success: false,
      message: secretError.message
    });
  }

  try {
    const { decoded, error } = await verifyTokenWithFallback(token);
    if (decoded) {
      req.user = decoded;
      // Derive the tenant context from the verified claims immediately so any
      // downstream middleware that prefers `req.tenantSlug` over the raw header
      // is already correct by the time it runs.
      attachTenantFromClaims(req);
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized, token is invalid or expired'
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token verification failed'
    });
  }
};

/**
 * Authorize middleware - checks if user has required role
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'superadmin', 'tenant')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no user context'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
        requiredRoles: roles
      });
    }

    next();
  };
};

/**
 * enforceTenant — MULTI-TENANT ISOLATION ENFORCEMENT
 *
 * Mount this immediately AFTER `protect` on every tenant-scoped router.
 *
 * Background: tenant context used to be taken verbatim from the `x-tenant-slug`
 * request header, which the client fully controls. Because this platform is
 * database-per-tenant, that header WAS the isolation boundary — so any user
 * holding a valid token for Tenant A could send `x-tenant-slug: tenant-b` and be
 * served Tenant B's invoices, coffins, hearses, deceased records and autopsy
 * data. The JWT claims are now the single source of truth; this middleware
 * rejects any request whose header names a different organisation.
 *
 * Branch slugs ("org-home" -> "org-home-machakos") are legitimate and are
 * allowed, because the platform models branches as sub-tenants of one org.
 */
const enforceTenant = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no user context'
    });
  }

  const claims = attachTenantFromClaims(req);
  const headerSlug = firstHeader(req.headers['x-tenant-slug']) || firstHeader(req.headers['x-slug']);
  const claimSlug = req.tenantSlug;

  if (headerSlug) {
    if (!TENANT_SLUG_RE.test(String(headerSlug))) {
      return res.status(400).json({
        success: false,
        message: 'Malformed tenant slug'
      });
    }

    // Platform admins are the only principals allowed to act for another org.
    if (!req.isPlatformAdmin && claimSlug && !slugBelongsToOrg(claimSlug, String(headerSlug))) {
      console.warn(
        `[TENANT-ISOLATION] BLOCKED ${req.method} ${req.originalUrl} ` +
        `user=${claims.userId} role=${claims.role} claimTenant=${claimSlug} headerTenant=${headerSlug}`
      );
      return res.status(403).json({
        success: false,
        message: 'Tenant context does not match authenticated session'
      });
    }
  }

  // Claims always win. Anything downstream that reads `req.tenantSlug` now
  // sees the authenticated tenant, not an attacker-supplied string.
  if (claimSlug) {
    req.tenantSlug = claimSlug;
  }

  next();
};

/**
 * requireSystemAdmin — guards platform-wide administration endpoints
 * (e.g. /system-admin/*). Without this, an anonymous internet request could
 * enumerate every tenant and suspend a paying customer's production platform.
 */
const requireSystemAdmin = async (req, res, next) => {
  const header = req.headers.authorization;
  const token =
    (header && header.startsWith('Bearer') ? header.split(' ')[1] : null) ||
    (req.cookies && req.cookies.access_token);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'System administrator authentication required'
    });
  }

  try {
    getJwtSecret();
  } catch (secretError) {
    return res.status(500).json({ success: false, message: secretError.message });
  }

  try {
    const { decoded } = await verifyTokenWithFallback(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token is invalid or expired'
      });
    }
    if (!PLATFORM_ROLES.has(String(decoded.role || ''))) {
      console.warn(
        `[SYSTEM-ADMIN] refused ${req.method} ${req.originalUrl} ` +
        `user=${decoded.userId} role=${decoded.role}`
      );
      return res.status(403).json({
        success: false,
        message: 'System administrator role required'
      });
    }
    req.user = decoded;
    attachTenantFromClaims(req);
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token verification failed'
    });
  }
};

/**
 * Optional auth - attaches user if token present, but doesn't block if missing
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (token) {
    try {
      // Use the SAME two-stage verification as `protect` so per-tenant secrets
      // work here too. Previously this only tried the GLOBAL secret, which
      // silently rejected every tenant-specific token.
      const { decoded } = await verifyTokenWithFallback(token);
      if (decoded) {
        req.user = decoded;
        attachTenantFromClaims(req);
      }
    } catch (error) {
      // Token invalid, but we continue anyway (optional auth)
    }
  }

  next();
};

/**
 * List of all valid roles in the system
 */
const ALL_ROLES = [
  'admin',
  'superadmin',
  'systemadmin',
  'staff',
  'user',
  'manager',
  'director',
  'mortician',
  'driver',
  'tenant'
];

/**
 * Authorize any authenticated user (any role) - fastest for broad access
 */
const authorizeAny = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no user context'
    });
  }
  next();
};

module.exports = {
  protect,
  authorize,
  authorizeAny,
  optionalAuth,
  enforceTenant,
  requireSystemAdmin,
  // Exported so service tenant-middlewares can apply the same validation.
  TENANT_SLUG_RE,
  PLATFORM_ROLES,
  firstHeader,
  attachTenantFromClaims,
  ALL_ROLES
};
