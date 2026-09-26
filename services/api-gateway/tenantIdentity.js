'use strict';

/**
 * Gateway tenant-identity chokepoint  (audit finding 2.2 / 2.3)
 * =============================================================================
 * The platform is DATABASE-PER-TENANT, so the tenant slug carried on a request
 * IS the isolation boundary. Until now the gateway forwarded the client's own
 * `x-tenant-slug` / `x-tenant-id` / `x-user-id` headers verbatim, and every
 * downstream service derived its database from them. A user holding a perfectly
 * valid token for Tenant A could therefore simply send:
 *
 *     Authorization: Bearer <valid Tenant-A token>
 *     x-tenant-slug: tenant-b
 *
 * and be served Tenant B's invoices, coffins, hearses, deceased records,
 * next-of-kin and autopsy data. `requireApiKey` did not help: it compares
 * against `INTERNAL_API_KEY`, which is not defined in any .env file, so it never
 * matched.
 *
 * The fix makes the gateway the single place a request's tenant identity is
 * established:
 *
 *   1. A token that verifies with the platform secret -> identity comes from the
 *      CLAIMS. Client headers are discarded.
 *   2. No token / token that does not verify here    -> identity headers are
 *      STRIPPED, so the request can only ever land on `system_shared` (or be
 *      rejected by the service's own `protect`). The client's asserted slug is
 *      forwarded only as `x-tenant-assertion`, which no service reads as
 *      authority.
 *   3. A small explicit allowlist of PRE-AUTHENTICATION surfaces (login,
 *      register, onboarding, public deceased lookup, blog) still accepts a client
 *      slug, because there is no token yet by definition — those routes use the
 *      slug only to *find* the right database, not to authorise access to data
 *      the caller does not already own.
 *
 * A token signed with a PER-TENANT secret does not verify at the gateway (the
 * gateway deliberately keeps no MariaDB pool on this hot path). That is safe: we
 * strip the headers and the target service performs the authoritative two-stage
 * verification in its own `protect` middleware, which re-derives the tenant slug
 * from those claims.
 */

const jwt = require('jsonwebtoken');

const PLATFORM_ROLES = new Set(['systemadmin', 'superadmin']);

// Every tenant slug the platform issues is lowercase-kebab.
const TENANT_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
// Branch ids are concatenated into the "<org>-<branch>" database slug downstream,
// so allow a slightly wider alphabet but nothing that could escape that position.
const BRANCH_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

/**
 * Pre-authentication routes. These legitimately operate on a client-asserted
 * tenant slug because the caller is not logged in yet. Everything else requires
 * a verified token.
 *
 * Matched against the path AFTER the `/api` and `/restpoint` prefixes are
 * stripped, so a rule reads as `auth`, `public`, `blog`, etc.
 */
const PRE_AUTH_PREFIXES = new Set([
  'auth',          // /auth/login, /auth/register, /auth/refresh, /auth/logout
  'login',
  'register',
  'logout',
  'refresh',
  'tenant',        // tenant-service public tenant resolution
  'tenants',
  'onboarding',
  'public',        // public deceased / postmortem lookup by admission number
  'blog',          // newsroom articles
  'blog-engagement',
]);

const PRE_AUTH_METHODS = new Set(['GET', 'HEAD', 'POST', 'OPTIONS']);

// ─── Secret resolution (lazy, fails closed) ─────────────────────────────────

let cachedSecret;
let secretResolved = false;

function getJwtSecret() {
  if (secretResolved) return cachedSecret;
  cachedSecret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
  if (!cachedSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is required');
    }
    // Dev-only: random per-process secret. Never a committed literal.
    cachedSecret = require('crypto').randomBytes(48).toString('base64url');
    console.warn(
      '[TENANT-IDENTITY] JWT_SECRET not set — using an ephemeral development secret. Do NOT use in production.'
    );
  }
  secretResolved = true;
  return cachedSecret;
}

// ─── Small helpers ─────────────────────────────────────────────────────────

const firstHeader = (value) => (Array.isArray(value) ? value[0] : value);

function extractToken(req) {
  const header = req.headers && req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies && req.cookies.access_token) return req.cookies.access_token;
  return null;
}

/** Strip the `/api` and `/restpoint` gateway prefixes off an incoming URL. */
function servicePathOf(req) {
  const raw = (req.originalUrl || req.url || '').split('?')[0];
  return raw.split('/').filter(Boolean).slice(2).join('/');
}

function isPreAuthRoute(req) {
  if (!PRE_AUTH_METHODS.has(req.method)) return false;
  return PRE_AUTH_PREFIXES.has(servicePathOf(req).split('/')[0]);
}

// ─── Verification cache ─────────────────────────────────────────────────────
// The gateway re-encounters the same access token on every call a user makes.
// Memoise the positive result briefly to avoid re-verifying on every request.
// A short TTL bounds the window in which a revoked token still passes here; the
// authoritative check still runs in each service's `protect` middleware, which is
// uncached — so this cache can only ever skip redundant work, never authorise.

const VERIFY_CACHE_TTL_MS = 15_000;
const VERIFY_CACHE_MAX = 5000;
const verifyCache = new Map();

function cacheGet(key) {
  const hit = verifyCache.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    verifyCache.delete(key);
    return undefined;
  }
  return hit.claims;
}

function cacheSet(key, claims) {
  if (verifyCache.size >= VERIFY_CACHE_MAX) {
    // Bounded eviction: drop the oldest insertion (Map preserves insertion order).
    const oldest = verifyCache.keys().next();
    if (!oldest.done) verifyCache.delete(oldest.value);
  }
  verifyCache.set(key, { claims, expires: Date.now() + VERIFY_CACHE_TTL_MS });
}

/**
 * Verify the request's token and return normalised identity claims.
 * @returns {{verified: boolean, tenantSlug?: string, tenantId?: string|number,
 *            userId?: string|number, role?: string, reason?: string}}
 */
function resolveIdentity(req) {
  const token = extractToken(req);
  if (!token) return { verified: false, reason: 'no-token' };

  const cached = cacheGet(token);
  if (cached) return { ...cached, verified: true, fromCache: true };

  let claims;
  try {
    // `algorithms: ['HS256']` pins the accepted algorithm, blocking both
    // `alg: none` and RS/HS algorithm-confusion attacks.
    claims = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
  } catch (err) {
    // Either invalid/expired, or signed with a per-tenant secret we cannot check
    // here. Both handled identically: no identity, so headers get stripped and
    // the target service decides.
    return { verified: false, reason: err && err.name === 'TokenExpiredError' ? 'expired' : 'unverified' };
  }

  if (!claims || typeof claims !== 'object') return { verified: false, reason: 'malformed' };

  const identity = {
    tenantSlug: claims.tenantSlug || claims.tenant_slug || undefined,
    tenantId: claims.tenantId || claims.tenant_id || undefined,
    userId: claims.userId || claims.user_id || claims.id || undefined,
    role: String(claims.role || ''),
  };

  // A verified token with no tenant claim is a platform-level token (e.g. a
  // system admin): allowed to act across tenants by design, but it carries no
  // tenant identity of its own.
  if (identity.tenantSlug && !TENANT_SLUG_RE.test(String(identity.tenantSlug))) {
    return { verified: false, reason: 'malformed-tenant-claim' };
  }

  cacheSet(token, identity);
  return { ...identity, verified: true };
}

// ─── The proxy hook ─────────────────────────────────────────────────────────

/**
 * Rewrite the outbound tenant-identity headers on a proxied request.
 *
 * Idempotent: called by both the primary and the fallback proxy, and safe to call
 * more than once for the same request.
 *
 * @param {import('http').IncomingMessage} proxyReq outbound request
 * @param {import('express').Request} req        inbound request
 * @param {object} log                           logger
 */
function applyTenantIdentity(proxyReq, req, log) {
  // `x-slug` was an undocumented alias some clients still send. It is never
  // legitimate, so it is always removed rather than forwarded.
  proxyReq.removeHeader('x-slug');

  const clientSlug = firstHeader(req.headers['x-tenant-slug']) || firstHeader(req.headers['x-tenant-id']);
  const clientUser = firstHeader(req.headers['x-user-id']);
  const clientBranch = firstHeader(req.headers['x-branch-id']);

  let identity;
  try {
    identity = resolveIdentity(req);
  } catch (err) {
    // Secret misconfiguration — fail closed rather than trusting the client.
    if (log && log.error) log.error(`[TENANT-IDENTITY] ${err.message} — stripping tenant headers`);
    identity = { verified: false, reason: 'secret-unavailable' };
  }

  // `identityEstablished` tracks whether *we* set a tenant slug. It must NOT be
  // inferred from `proxyReq.getHeader(...)`: http-proxy-middleware has already
  // copied the client's headers onto proxyReq, so the header is always present
  // when the client sent one — and testing its presence would let the client's
  // own value satisfy the check and skip the fail-closed strip entirely.
  let identityEstablished = false;

  if (identity.verified && identity.tenantSlug) {
    // ── Authoritative path: identity comes from the signed claims ──
    proxyReq.setHeader('x-tenant-slug', String(identity.tenantSlug));
    proxyReq.setHeader('x-tenant-id', String(identity.tenantId || ''));
    proxyReq.setHeader('x-user-id', String(identity.userId || ''));
    proxyReq.setHeader('x-tenant-verified', '1');
    proxyReq.removeHeader('x-tenant-assertion');
    proxyReq.removeHeader('x-user-assertion');
    proxyReq.removeHeader('x-tenant-mismatch');
    identityEstablished = true;

    // A client asking for a different tenant than its token authorises is an
    // attack, not a routing quirk. The header is replaced with the claim value
    // and the attempt is logged for alerting.
    if (clientSlug && String(clientSlug) !== String(identity.tenantSlug)) {
      if (log && log.warn) {
        log.warn(
          `[TENANT-ISOLATION] overrode x-tenant-slug=${clientSlug} with claim tenant=${identity.tenantSlug} ` +
          `for ${req.method} ${req.originalUrl} (user=${identity.userId}, role=${identity.role})`
        );
      }
      proxyReq.setHeader('x-tenant-mismatch', '1');
    }
  } else if (isPreAuthRoute(req)) {
    // ── Pre-authentication surface: a client slug is expected and legitimate ──
    const slug = clientSlug ? String(clientSlug) : 'system_shared';
    if (clientSlug && !TENANT_SLUG_RE.test(slug) && !PLATFORM_ROLES.has(identity.role)) {
      if (log && log.warn) {
        log.warn(`[TENANT-IDENTITY] rejected malformed pre-auth slug "${slug}" on ${req.method} ${req.originalUrl}`);
      }
      // Malformed: fall through to the fail-closed strip below.
    } else {
      proxyReq.setHeader('x-tenant-slug', slug);
      proxyReq.setHeader('x-tenant-verified', '0');
      proxyReq.removeHeader('x-tenant-assertion');
      proxyReq.removeHeader('x-user-assertion');
      if (clientUser) proxyReq.setHeader('x-user-id', String(clientUser).slice(0, 64));
      identityEstablished = true;
      if (log && log.debug) {
        log.debug(`[TENANT-IDENTITY] pre-auth ${req.method} ${req.originalUrl} slug=${slug} reason=${identity.reason}`);
      }
    }
  }

  if (!identityEstablished) {
    // ── Fail closed: no verified identity and not a pre-auth surface ──
    // Unconditionally drop every client-asserted identity header. The request can
    // now only ever resolve to `system_shared`, or be rejected outright by the
    // target service's own `protect` middleware.
    proxyReq.removeHeader('x-tenant-slug');
    proxyReq.removeHeader('x-tenant-id');
    proxyReq.removeHeader('x-user-id');
    proxyReq.setHeader('x-tenant-verified', '0');
    proxyReq.removeHeader('x-tenant-mismatch');
    // Retained for observability ONLY — no service reads this as authority.
    if (clientSlug) proxyReq.setHeader('x-tenant-assertion', String(clientSlug).slice(0, 128));
    if (clientUser) proxyReq.setHeader('x-user-assertion', String(clientUser).slice(0, 128));

    if (log && log.warn && clientSlug) {
      log.warn(
        `[TENANT-IDENTITY] stripped client-asserted tenant "${clientSlug}" on ` +
        `${req.method} ${req.originalUrl} (reason=${identity.reason}) — request can only reach system_shared`
      );
    }
  }

  // Branch selection is a filter INSIDE the authorised tenant, so it passes
  // through — but only after shape validation, because it is concatenated into
  // the "<org>-<branch>" database slug downstream.
  if (clientBranch && BRANCH_ID_RE.test(String(clientBranch))) {
    proxyReq.setHeader('x-branch-id', String(clientBranch));
  } else {
    proxyReq.removeHeader('x-branch-id');
  }

  const branchSlug = firstHeader(req.headers['x-branch-slug']);
  if (branchSlug && BRANCH_ID_RE.test(String(branchSlug))) {
    proxyReq.setHeader('x-branch-slug', String(branchSlug));
  } else {
    proxyReq.removeHeader('x-branch-slug');
  }
}

module.exports = {
  applyTenantIdentity,
  resolveIdentity,
  isPreAuthRoute,
  servicePathOf,
  getJwtSecret,
  PLATFORM_ROLES,
  TENANT_SLUG_RE,
  PRE_AUTH_PREFIXES,
};
