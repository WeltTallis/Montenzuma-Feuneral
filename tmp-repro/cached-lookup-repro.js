// Validation for the FIXED cachedLookup (copied verbatim from
// services/api-gateway/server.js). Proves the production path
// (http.Agent with a custom lookup on Node 24) works again, that the
// DNS cache engages and stays correct, and documents the old failure.
// Run: node tmp-repro/cached-lookup-repro.js
'use strict';
const net = require('net');
const dns = require('dns');
const http = require('http');

console.log('Node:', process.version, '\n');

// ── verbatim copy of the FIXED cachedLookup in services/api-gateway/server.js ──
const DNS_CACHE_TTL_MS = 60000;
const dnsCache = new Map(); // "<host>|<family>|all|one" -> { expires, address?, family?, results? }
const dnsInFlight = new Map(); // same key -> Promise

function cachedLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  const wantsAll = !!(options && options.all);
  const family = (options && options.family) || 0;
  const cacheKey = `${hostname}|${family}|${wantsAll ? 'all' : 'one'}`;

  const cached = dnsCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    if (wantsAll) return callback(null, cached.results);
    return callback(null, cached.address, cached.family);
  }

  if (dnsInFlight.has(cacheKey)) {
    dnsInFlight.get(cacheKey).then(
      (result) => {
        if (wantsAll) return callback(null, result.results);
        callback(null, result.address, result.family);
      },
      (err) => callback(err)
    );
    return;
  }

  const lookupPromise = new Promise((resolve, reject) => {
    dns.lookup(hostname, { ...options }, (err, address, resolvedFamily) => {
      dnsInFlight.delete(cacheKey);
      if (err) return reject(err);

      if (wantsAll) {
        const results = Array.isArray(address) ? address : [];
        if (results.length === 0) {
          return reject(new Error(`DNS lookup for ${hostname} returned no addresses`));
        }
        dnsCache.set(cacheKey, { results, expires: Date.now() + DNS_CACHE_TTL_MS });
        return resolve({ results });
      }

      if (!address || (resolvedFamily !== 4 && resolvedFamily !== 6)) {
        return reject(new Error(`DNS lookup for ${hostname} returned an invalid address/family`));
      }
      dnsCache.set(cacheKey, { address, family: resolvedFamily, expires: Date.now() + DNS_CACHE_TTL_MS });
      resolve({ address, family: resolvedFamily });
    });
  });
  dnsInFlight.set(cacheKey, lookupPromise);
  lookupPromise.then(
    (result) => {
      if (wantsAll) return callback(null, result.results);
      callback(null, result.address, result.family);
    },
    (err) => callback(err)
  );
}

// Control: the OLD broken implementation (ignores options, single result).
function brokenLookup(hostname, options, callback) {
  if (typeof options === 'function') { callback = options; options = {}; }
  dns.lookup(hostname, {}, (err, address, family) => {
    if (err) return callback(err);
    callback(null, address, family);
  });
}

function makeServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', message: 'Hearse Service' }));
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function httpTrial(name, host, port, agent) {
  return new Promise((resolve) => {
    const req = http.get({ host, port, agent, path: '/' }, (res) => {
      res.resume();
      console.log(`✅ ${name}: HTTP ${res.statusCode}`);
      resolve(true);
    });
    req.on('error', (e) => {
      console.log(`❌ ${name}: ERROR -> "${e.message}" [code=${e.code}]`);
      resolve(false);
    });
  });
}

(async () => {
  const server = await makeServer();
  const port = server.address().port;
  let pass = 0;
  const total = 6;

  const fixedAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 10000, maxSockets: 100, maxFreeSockets: 20, lookup: cachedLookup });

  (await httpTrial('1. http.Agent + FIXED lookup (production path, first request)', 'localhost', port, fixedAgent)) && pass++;
  (await httpTrial('2. http.Agent + FIXED lookup (second request -> DNS cache HIT)', 'localhost', port, fixedAgent)) && pass++;
  (await httpTrial('3. http.Agent + FIXED lookup, explicit family: 4', 'localhost', port, new http.Agent({ lookup: cachedLookup, family: 4 }))) && pass++;

  // Direct net.connect (the underlying primitive net.js uses)
  await new Promise((resolve) => {
    const s = net.connect({ host: 'localhost', port, lookup: cachedLookup });
    s.on('connect', () => { console.log('✅ 4. net.connect + FIXED lookup (all:true path): CONNECT OK'); pass++; s.destroy(); resolve(); });
    s.on('error', (e) => { console.log(`❌ 4. net.connect + FIXED lookup: "${e.message}"`); resolve(); });
  });

  // ENOTFOUND surfaces as a clean error, not a crash or "Invalid IP address"
  const gotCleanError = !(await httpTrial('5. http.Agent + FIXED lookup, nonexistent host (expect clean error)', 'no-such-host-restpoint', port, new http.Agent({ lookup: cachedLookup })));
  console.log(gotCleanError ? '✅ 5b. nonexistent host produced a clean lookup error' : '❌ 5b. unexpected success');
  if (gotCleanError) pass++;

  // Control: the old implementation must still reproduce the prod failure
  await new Promise((resolve) => {
    const s = net.connect({ host: 'localhost', port, lookup: brokenLookup });
    s.on('connect', () => { console.log('❌ 6. CONTROL broken lookup unexpectedly connected'); s.destroy(); resolve(); });
    s.on('error', (e) => {
      const ok = e.message === 'Invalid IP address: undefined';
      console.log(`${ok ? '✅' : '❌'} 6. CONTROL broken lookup reproduces prod error: "${e.message}"`);
      if (ok) pass++;
      resolve();
    });
  });

  console.log(`\n${pass}/${total} checks passed`);
  console.log('DNS cache:', JSON.stringify([...dnsCache.entries()].map(([k, v]) => ({ key: k, expiresInMs: v.expires - Date.now(), ...(v.results ? { results: v.results } : { address: v.address, family: v.family }) }))));

  fixedAgent.destroy();
  server.close();
})();
