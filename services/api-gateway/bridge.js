'use strict';

// Restpoint Cloud  Scanner Bridge authorisation

const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { getJwtSecret } = require('./tenantIdentity');

const GRANT_TTL_SECONDS = 60;
const GRANT_SCOPE = 'bridge:scan';
// A second scope for the other physical action the bridge can take: putting a
// document on paper. Kept separate from the scan scope so a grant handed out for
// a print cannot also drive the scanner (and vice versa) - the bridge records
// the scope of the session it authorised and enforces it per action.
const PRINT_GRANT_SCOPE = 'bridge:print';
const KNOWN_GRANT_SCOPES = [GRANT_SCOPE, PRINT_GRANT_SCOPE];

/** Map what a client may ask for onto a real scope; anything else is a scan. */
function normaliseScope(requested) {
  const value = String(requested || '').trim().toLowerCase();
  if (value === PRINT_GRANT_SCOPE || value === 'print' || value === 'bridge:printer') return PRINT_GRANT_SCOPE;
  return GRANT_SCOPE;
}

// In-memory replay guard: a grant is single-use, so we remember its jti until

const usedGrants = new Map();

function pruneUsedGrants() {
  const now = Date.now();
  for (const [jti, expMs] of usedGrants) {
    if (expMs <= now) usedGrants.delete(jti);
  }
}

/** Sign a short-lived bridge grant for the authenticated caller. */
function issueGrant(user, opts = {}) {
  const secret = getJwtSecret();
  pruneUsedGrants();

  const jti = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const scope = normaliseScope(opts.scope);

  const payload = {
    jti,
    scope,
    sub: String(user.id || user.userId || user.email || 'unknown'),
    role: user.role || 'staff',
    tenant: user.tenantSlug || user.tenant_slug || user.tenantId || 'system_shared',
    // Recorded for audit; the agent never trusts it for authorisation.
    origin: String(opts.origin || '').slice(0, 200),
    iat: now,
    exp: now + GRANT_TTL_SECONDS,
  };

  const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
  return { grant: token, expiresAt: payload.exp * 1000, ttlSeconds: GRANT_TTL_SECONDS };
}

/**
 * Verify a grant presented by a bridge agent.
 * Returns { valid, reason, tenant, subject, expiresAt } — never throws.
 */
function verifyGrant(presented) {
  try {
    const token = String(presented || '').trim();
    if (!token) return { valid: false, reason: 'missing grant' };

    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    } catch (e) {
      const reason = e && e.name === 'TokenExpiredError' ? 'grant expired' : 'grant signature invalid';
      return { valid: false, reason };
    }

    if (!KNOWN_GRANT_SCOPES.includes(decoded.scope)) return { valid: false, reason: 'wrong scope' };

    pruneUsedGrants();
    if (usedGrants.has(decoded.jti)) return { valid: false, reason: 'grant already used' };
    usedGrants.set(decoded.jti, decoded.exp * 1000);

    return {
      valid: true,
      tenant: decoded.tenant,
      subject: decoded.sub,
      role: decoded.role,
      scope: decoded.scope,
      origin: decoded.origin || '',
      expiresAt: decoded.exp * 1000,
    };
  } catch {
    return { valid: false, reason: 'verification error' };
  }
}

/**
 * Minimal platform-JWT check for the gateway.
 *
 * The gateway is a reverse proxy, so it normally delegates authentication to the
 * upstream auth service and has no middleware of its own. The grant endpoint
 * cannot be proxied: the bridge agent needs an answer from the cloud itself, and
 * the answer has to be a real signature check. This verifies the same HS256
 * secret the rest of the platform uses and takes the tenant from the SIGNED
 * claims, never from a client-supplied header.
 */
function requireAuth(req, res, next) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

  try {
    const claims = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    req.user = claims;
    req.tenantSlug = claims.tenantSlug || claims.tenant_slug || undefined;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
}

/** Register the bridge endpoints on the gateway app. */
function registerBridgeRoutes(app, Logger, { requireAuth: injected } = {}) {
  // A caller may supply its own auth middleware; otherwise use the platform-JWT
  // check defined above.
  const auth = typeof injected === 'function' ? injected : requireAuth;
  // Browser asks the cloud for permission to drive the bridge (scan or print).
  // `scope` in the body selects which physical action the grant unlocks.
  app.post('/bridge/grant', auth, (req, res) => {
    try {
      const scope = normaliseScope(req.body?.scope);
      const { grant, expiresAt, ttlSeconds } = issueGrant(req.user || {}, {
        origin: req.headers.origin || '',
        scope,
      });
      res.json({ success: true, data: { grant, expiresAt, ttlSeconds, scope } });
    } catch (e) {
      Logger.error(`[bridge] grant failed: ${e.message}`);
      res.status(500).json({ success: false, message: 'Could not issue bridge grant' });
    }
  });

  // The bridge agent asks the cloud whether a grant is genuine.
  // Deliberately unauthenticated: the agent holds no credentials of its own and
  // the grant IS the credential. It is single-use and 60s long, so there is
  // nothing here worth harvesting or brute-forcing.
  app.post('/bridge/verify-grant', (req, res) => {
    try {
      const result = verifyGrant(req.body?.grant);
      // Always 200: the agent gets a clean valid:true/false verdict instead of
      // having to distinguish auth failures from validation failures.
      res.json({
        success: true,
        data: result.valid
          ? { valid: true, tenant: result.tenant, subject: result.subject, role: result.role, scope: result.scope, expiresAt: result.expiresAt }
          : { valid: false, reason: result.reason },
      });
    } catch (e) {
      Logger.error(`[bridge] verify-grant failed: ${e.message}`);
      res.json({ success: true, data: { valid: false, reason: 'server error' } });
    }
  });

  Logger.info('[bridge] grant + verify-grant endpoints registered');
}

module.exports = {
  registerBridgeRoutes,
  issueGrant,
  verifyGrant,
  requireAuth,
  normaliseScope,
  GRANT_TTL_SECONDS,
  GRANT_SCOPE,
  PRINT_GRANT_SCOPE,
};
