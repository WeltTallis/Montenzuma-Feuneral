'use strict';

/**
 * Restpoint Cloud <-> Scanner Bridge authorisation
 * ================================================
 *
 * WHY THIS EXISTS
 * ---------------
 * The bridge is a desktop app running a WebSocket server on
 * ws://127.0.0.1:8081. Anything that can open a socket to loopback could send
 * START_SCAN and make the machine physically pull paper through the scanner.
 * The agent's Origin allow-list stops hostile *web pages*, but it does nothing
 * about a local process, another user on the PC, or malware. The agent also had
 * no way to tell a genuine Restpoint tab from any other local client - it just
 * obeyed whatever arrived.
 *
 * The fix makes the CLOUD the authority, so nothing secret has to be written to
 * the reception computer:
 *
 *   1. Browser -> cloud  POST /bridge/grant         (authenticated as the user)
 *                 returns a short-lived, single-use, scope-limited grant.
 *   2. Browser -> agent  HELLO { grant }
 *   3. Agent   -> cloud  POST /bridge/verify-grant  (the cloud burns the grant)
 *   4. Agent   -> browser HELLO_OK { sessionId, bridgeId, expiresAt }
 *   5. Browser -> agent  START_SCAN { sessionId }   (required on every scan)
 *
 * A replayed grant is worthless (single-use, 60s), a local attacker with no
 * Restpoint session cannot obtain one, and the agent only ever contacts the
 * cloud URL configured on its own machine.
 */

const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { getJwtSecret } = require('./tenantIdentity');

const GRANT_TTL_SECONDS = 60;
const GRANT_SCOPE = 'bridge:scan';

// In-memory replay guard: a grant is single-use, so we remember its jti until
// it would have expired anyway. A restart clears the set; the worst case is
// that a grant issued just before a restart is replayable once, and it still
// has to pass signature + expiry.
const usedGrants = new Map();

function pruneUsedGrants() {
  const now = Date.now();
  for (const [jti, expMs] of usedGrants) {
    if (expMs <= now) usedGrants.delete(jti);
  }
}

/** Sign a short-lived scan grant for the authenticated caller. */
function issueGrant(user, opts = {}) {
  const secret = getJwtSecret();
  pruneUsedGrants();

  const jti = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    jti,
    scope: GRANT_SCOPE,
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

    if (decoded.scope !== GRANT_SCOPE) return { valid: false, reason: 'wrong scope' };

    pruneUsedGrants();
    if (usedGrants.has(decoded.jti)) return { valid: false, reason: 'grant already used' };
    usedGrants.set(decoded.jti, decoded.exp * 1000);

    return {
      valid: true,
      tenant: decoded.tenant,
      subject: decoded.sub,
      role: decoded.role,
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
  // Browser asks the cloud for permission to scan.
  app.post('/bridge/grant', auth, (req, res) => {
    try {
      const { grant, expiresAt, ttlSeconds } = issueGrant(req.user || {}, {
        origin: req.headers.origin || '',
      });
      res.json({ success: true, data: { grant, expiresAt, ttlSeconds } });
    } catch (e) {
      Logger.error(`[bridge] grant failed: ${e.message}`);
      res.status(500).json({ success: false, message: 'Could not issue scan grant' });
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
          ? { valid: true, tenant: result.tenant, subject: result.subject, role: result.role, expiresAt: result.expiresAt }
          : { valid: false, reason: result.reason },
      });
    } catch (e) {
      Logger.error(`[bridge] verify-grant failed: ${e.message}`);
      res.json({ success: true, data: { valid: false, reason: 'server error' } });
    }
  });

  Logger.info('[bridge] grant + verify-grant endpoints registered');
}

module.exports = { registerBridgeRoutes, issueGrant, verifyGrant, requireAuth, GRANT_TTL_SECONDS, GRANT_SCOPE };
