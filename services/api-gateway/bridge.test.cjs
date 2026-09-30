/**
 * Scanner Bridge grant tests
 * --------------------------
 * Exercises the real route handlers from bridge.js without needing Docker or a
 * running gateway. Run with:  node bridge.test.cjs
 */
process.env.JWT_SECRET = 'test-secret-for-bridge-grant-only';

const jwt = require('jsonwebtoken');
const { registerBridgeRoutes } = require('./bridge');

const SECRET = 'test-secret-for-bridge-grant-only';
const Logger = { info() {}, warn() {}, error() {}, log() {} };

// Minimal express stand-in: just enough to drive the real handlers.
const routes = [];
const app = { post: (p, ...h) => routes.push({ p, h }) };
registerBridgeRoutes(app, Logger);

function call(path, body, headers = {}) {
  return new Promise((resolve) => {
    const layer = routes.find((r) => r.p === path);
    if (!layer) return resolve({ status: 0, json: { error: 'no route ' + path } });
    const chain = [...layer.h];
    const req = { body, headers: { host: 'x', origin: 'https://restpoint.co.ke', ...headers } };
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      json(j) { resolve({ status: this.statusCode, json: j }); },
    };
    let i = 0;
    const next = () => {
      const fn = chain[i++];
      if (!fn) return resolve({ status: 500, json: { error: 'handler did not respond' } });
      try { fn(req, res, next); } catch (e) { resolve({ status: 500, json: { error: e.message } }); }
    };
    next();
  });
}

const results = [];
const check = (name, cond, extra = '') => {
  results.push([name, cond]);
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (extra ? '  [' + extra + ']' : ''));
};

(async () => {
  let r = await call('/bridge/grant', {});
  check('grant without a token -> 401', r.status === 401, 'got ' + r.status);

  const good = jwt.sign({ userId: 'u1', role: 'staff', tenantSlug: 'tenant-a' }, SECRET, { expiresIn: '1h' });
  r = await call('/bridge/grant', {}, { authorization: 'Bearer ' + good });
  check('grant with a valid JWT -> 200 + grant', r.status === 200 && !!r.json?.data?.grant, 'got ' + r.status);
  const grant = r.json?.data?.grant;
  check('grant TTL is 60s', r.json?.data?.ttlSeconds === 60, 'ttl=' + r.json?.data?.ttlSeconds);

  r = await call('/bridge/grant', {}, { authorization: 'Bearer not-a-real-token' });
  check('grant with a bad token -> 401', r.status === 401, 'got ' + r.status);

  r = await call('/bridge/verify-grant', { grant });
  check('verify a fresh grant -> valid:true', r.json?.data?.valid === true, JSON.stringify(r.json?.data));
  check('grant carries the signed tenant', r.json?.data?.tenant === 'tenant-a', 'tenant=' + r.json?.data?.tenant);

  r = await call('/bridge/verify-grant', { grant });
  check('REPLAY of a used grant -> rejected', r.json?.data?.valid === false, r.json?.data?.reason);

  r = await call('/bridge/verify-grant', { grant: 'not-a-jwt' });
  check('garbage grant -> rejected', r.json?.data?.valid === false, r.json?.data?.reason);

  r = await call('/bridge/verify-grant', {});
  check('missing grant -> rejected', r.json?.data?.valid === false, r.json?.data?.reason);

  const expired = jwt.sign({ userId: 'u1', tenantSlug: 't', scope: 'bridge:scan', jti: 'x1' }, SECRET, { expiresIn: -10 });
  r = await call('/bridge/verify-grant', { grant: expired });
  check('expired grant -> rejected', r.json?.data?.valid === false, r.json?.data?.reason);

  const wrongScope = jwt.sign({ userId: 'u1', tenantSlug: 't', scope: 'something:else', jti: 'x2' }, SECRET, { expiresIn: '5m' });
  r = await call('/bridge/verify-grant', { grant: wrongScope });
  check('wrong-scope token -> rejected', r.json?.data?.valid === false, r.json?.data?.reason);

  const forged = jwt.sign({ userId: 'evil', tenantSlug: 't', scope: 'bridge:scan', jti: 'x3' }, 'attacker-key', { expiresIn: '5m' });
  r = await call('/bridge/verify-grant', { grant: forged });
  check('forged signature -> rejected', r.json?.data?.valid === false, r.json?.data?.reason);

  // A tenant must not be steerable by a spoofed header on the grant request.
  r = await call('/bridge/grant', {}, { authorization: 'Bearer ' + good, 'x-tenant-slug': 'tenant-b' });
  const tenantFromGrant = jwt.decode(r.json.data.grant).tenant;
  check('spoofed x-tenant-slug ignored on grant', tenantFromGrant === 'tenant-a', 'tenant=' + tenantFromGrant);

  const passed = results.filter(([, c]) => c).length;
  console.log('\n' + passed + '/' + results.length + ' passed');
  process.exit(passed === results.length ? 0 : 1);
})();
