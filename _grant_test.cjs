process.env.JWT_SECRET = 'test-secret-for-bridge-grant-only';
const http = require('node:http');
const jwt = require('jsonwebtoken');
const { registerBridgeRoutes } = require('./bridge');

const Logger = { info(){}, warn(){}, error(){}, log(){} };
let auth = 'ok';

// Minimal express stand-in: enough to exercise the real route handlers.
const routes = [];
const app = { post: (p, ...h) => routes.push({ p, h }) };
registerBridgeRoutes(app, Logger);

const call = async (path, body, headers = {}) => new Promise((resolve) => {
  const layer = routes.find((r) => r.p === path);
  if (!layer) return resolve({ status: 0, json: { error: 'no route ' + path } });
  const chain = [...layer.h];
  const req = { body, headers: { host: 'x', origin: 'https://restpoint.co.ke', ...headers } };
  const res = {
    statusCode: 200, _json: null,
    status(c) { this.statusCode = c; return this; },
    json(j) { this._json = j; resolve({ status: this.statusCode, json: j }); },
  };
  try {
    let i = 0;
    const next = () => {
      const fn = chain[i++];
      if (!fn) return resolve({ status: 500, json: { error: 'handler did not respond' } });
      try { fn(req, res, next); } catch (e) { resolve({ status: 500, json: { error: e.message } }); }
    };
    next();
  } catch (e) { resolve({ status: 500, json: { error: e.message } }); }
});

(async () => {
  const results = [];
  const check = (name, cond, extra = '') => { results.push([name, cond]); console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (extra ? '  ' + extra : '')); };

  // 1. grant without a token must be rejected
  let r = await call('/bridge/grant', {});
  check('grant without token -> 401', r.status === 401, 'got ' + r.status);

  // 2. grant with a valid platform JWT
  const good = jwt.sign({ userId: 'u1', role: 'staff', tenantSlug: 'tenant-a' }, 'test-secret-for-bridge-grant-only', { expiresIn: '1h' });
  r = await call('/bridge/grant', {}, { authorization: 'Bearer ' + good });
  check('grant with valid JWT -> 200 + grant', r.status === 200 && !!r.json?.data?.grant, 'got ' + r.status);
  const grant = r.json?.data?.grant;
  check('grant TTL is 60s', r.json?.data?.ttlSeconds === 60, 'ttl=' + r.json?.data?.ttlSeconds);

  // 3. verify the grant
  r = await call('/bridge/verify-grant', { grant });
  check('verify valid grant -> valid:true', r.json?.data?.valid === true, JSON.stringify(r.json?.data));
  check('grant carries tenant-a', r.json?.data?.tenant === 'tenant-a', 'tenant=' + r.json?.data?.tenant);

  // 4. REPLAY must fail
  r = await call('/bridge/verify-grant', { grant });
  check('REPLAY of used grant -> rejected', r.json?.data?.valid === false, r.json?.data?.reason);

  // 5. garbage / missing
  r = await call('/bridge/verify-grant', { grant: 'not-a-jwt' });
  check('garbage grant -> rejected', r.json?.data?.valid === false, r.json?.data?.reason);
  r = await call('/bridge/verify-grant', {});
  check('missing grant -> rejected', r.json?.data?.valid === false, r.json?.data?.reason);

  // 6. expired grant
  const exp = jwt.sign({ userId: 'u1', role: 'staff', tenantSlug: 't', scope: 'bridge:scan', jti: 'x1' }, 'test-secret-for-bridge-grant-only', { expiresIn: -10 });
  r = await call('/bridge/verify-grant', { grant: exp });
  check('expired grant -> rejected', r.json?.data?.valid === false, r.json?.data?.reason);

  // 7. wrong-scope token must not be usable as a grant
  const wrongScope = jwt.sign({ userId: 'u1', role: 'staff', tenantSlug: 't', scope: 'something:else', jti: 'x2' }, 'test-secret-for-bridge-grant-only', { expiresIn: '5m' });
  r = await call('/bridge/verify-grant', { grant: wrongScope });
  check('wrong-scope token -> rejected', r.json?.data?.valid === false, r.json?.data?.reason);

  // 8. token signed with the WRONG key
  const forged = jwt.sign({ userId: 'evil', role: 'staff', tenantSlug: 't', scope: 'bridge:scan', jti: 'x3' }, 'attacker-key', { expiresIn: '5m' });
  r = await call('/bridge/verify-grant', { grant: forged });
  check('forged signature -> rejected', r.json?.data?.valid === false, r.json?.data?.reason);

  const passed = results.filter(([, c]) => c).length;
  console.log('\n' + passed + '/' + results.length + ' passed');
  process.exit(passed === results.length ? 0 : 1);
})();
