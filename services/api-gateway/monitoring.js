/**
 * Rest Point OS — real infrastructure monitoring.
 *
 * The old Grafana / Prometheus / Loki / Promtail / blackbox-exporter /
 * uptime-kuma stack has been removed. This module replaces it with data the
 * gateway can measure directly, with no external collector:
 *
 *   - Service health : live HTTP probe of every routed service + latency (ms)
 *   - Request stats  : total / 2xx / 4xx / 5xx / 429, avg latency, per-service
 *   - Cache          : Redis INFO stats (keyspace_hits / keyspace_misses)
 *   - BullMQ         : queue depth read straight from the bull:* keys
 *   - Process        : gateway uptime + RSS/heap memory
 *   - Live log       : rolling ring buffer of recent requests
 *
 * Every dependency here is lazy and failure-tolerant: if Redis is unreachable
 * the dashboard degrades to "unavailable" for those cards instead of taking
 * the gateway down. A previous health-check implementation caused a full
 * production outage ("fetch failed" for every service), so nothing here ever
 * blocks boot or a request.
 */

const os = require('os');

// --- Tunables -------------------------------------------------------------
const PROBE_TIMEOUT_MS = Number(process.env.MONITOR_PROBE_TIMEOUT_MS || 3000);
const PROBE_CONCURRENCY = 8;
const LOG_RING_SIZE = 200;
const SERIES_SIZE = 60;
const SERIES_INTERVAL_MS = 15000;

// --- In-process metrics ---------------------------------------------------
const startedAt = Date.now();

const counters = {
  total: 0,
  ok: 0,
  clientError: 0,
  serverError: 0,
  rateLimited: 0,
  latencySum: 0,
  latencyCount: 0,
};

const perService = new Map();
const logRing = [];
const series = [];

function serviceBucket(key) {
  if (!perService.has(key)) perService.set(key, { count: 0, errorCount: 0, latencySum: 0 });
  return perService.get(key);
}

function pushLog(entry) {
  logRing.unshift(entry);
  if (logRing.length > LOG_RING_SIZE) logRing.length = LOG_RING_SIZE;
}

/**
 * Express middleware: record every API request. Mount it BEFORE the proxy so
 * the timing covers the real upstream call, and skip the monitoring endpoints
 * themselves so polling the dashboard does not inflate its own numbers.
 */
function metricsMiddleware(req, res, next) {
  if (!req.path || req.path === '/monitoring' || req.path === '/health') return next();

  const started = process.hrtime.bigint();
  const firstSegment = (req.path.split('/').filter(Boolean)[0] || 'root');

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const status = res.statusCode;

    counters.total += 1;
    counters.latencySum += ms;
    counters.latencyCount += 1;
    if (status === 429) counters.rateLimited += 1;
    else if (status >= 500) counters.serverError += 1;
    else if (status >= 400) counters.clientError += 1;
    else counters.ok += 1;

    const b = serviceBucket(firstSegment);
    b.count += 1;
    b.latencySum += ms;
    if (status >= 400) b.errorCount += 1;

    pushLog({
      t: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl.split('?')[0],
      service: firstSegment,
      status,
      ms: Math.round(ms * 10) / 10,
    });
  });

  return next();
}

function countersSnapshot() {
  const avg = counters.latencyCount ? counters.latencySum / counters.latencyCount : 0;
  return {
    total: counters.total,
    ok: counters.ok,
    clientError: counters.clientError,
    serverError: counters.serverError,
    rateLimited: counters.rateLimited,
    avgLatencyMs: Math.round(avg * 10) / 10,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
  };
}

function perServiceSnapshot() {
  const out = {};
  perService.forEach((b, name) => {
    out[name] = {
      count: b.count,
      errors: b.errorCount,
      avgLatencyMs: Math.round((b.latencySum / (b.count || 1)) * 10) / 10,
    };
  });
  return out;
}

function memorySnapshot() {
  const m = process.memoryUsage();
  const totalMem = os.totalmem();
  return {
    rssBytes: m.rss,
    rssMb: Math.round((m.rss / 1048576) * 10) / 10,
    heapUsedMb: Math.round((m.heapUsed / 1048576) * 10) / 10,
    hostTotalMb: Math.round(totalMem / 1048576),
    hostFreeMb: Math.round(os.freemem() / 1048576),
    hostUsedPct: Math.round(((totalMem - os.freemem()) / totalMem) * 100),
  };
}

// --- Service probes ------------------------------------------------------
/**
 * Probe one service. ANY HTTP response (even a 404/502 from the app) proves
 * the process is alive and answering, so that counts as UP - only a
 * network-level failure (refused / timeout / DNS) counts as DOWN.
 */
async function probeOne(name, url) {
  const started = Date.now();
  try {
    const target = new URL('/', url).toString();
    await fetch(target, { method: 'GET', signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
    return { name, url, up: true, latencyMs: Date.now() - started, error: null };
  } catch (err) {
    return {
      name,
      url,
      up: false,
      latencyMs: Date.now() - started,
      error: (err && (err.cause?.code || err.code || err.name)) || 'unreachable',
    };
  }
}

/** Probe every service with bounded concurrency so a dead host cannot stall us. */
async function probeAll(serviceUrls) {
  const entries = Object.entries(serviceUrls || {});
  const results = [];
  let cursor = 0;

  async function worker() {
    while (cursor < entries.length) {
      const [name, url] = entries[cursor++];
      results.push(await probeOne(name, url));
    }
  }

  const n = Math.min(PROBE_CONCURRENCY, entries.length || 1);
  await Promise.all(Array.from({ length: n }, worker));
  return results;
}

// --- Redis (cache + BullMQ) ----------------------------------------------
let redisClient = null;
let redisFailedAt = 0;
const REDIS_RETRY_MS = 30000;

function getRedis() {
  if (redisClient) return redisClient;
  // Cool down after a failure so a dead Redis cannot stall the endpoint.
  if (redisFailedAt && Date.now() - redisFailedAt < REDIS_RETRY_MS) return null;

  const url = process.env.REDIS_URL;
  if (!url) { redisFailedAt = Date.now(); return null; }

  try {
    // Lazy require: ioredis is only needed on this path.
    const Redis = require('ioredis');
    redisClient = new Redis(url, {
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    redisClient.on('error', () => { /* handled by the caller's try/catch */ });
    return redisClient;
  } catch {
    redisFailedAt = Date.now();
    return null;
  }
}

/** Real cache hit/miss counters straight from the Redis server. */
async function cacheStats() {
  const r = getRedis();
  if (!r) return { available: false, reason: 'REDIS_URL not configured' };
  try {
    if (r.status !== 'ready') await r.connect().catch(() => {});
    const info = await r.info('stats');
    const hits = Number((/keyspace_hits:(\d+)/.exec(info) || [])[1] || 0);
    const misses = Number((/keyspace_misses:(\d+)/.exec(info) || [])[1] || 0);
    const total = hits + misses;
    return {
      available: true,
      hits,
      misses,
      total,
      hitRatePct: total ? Math.round((hits / total) * 1000) / 10 : 0,
    };
  } catch (err) {
    redisFailedAt = Date.now();
    return { available: false, reason: err.message };
  }
}

/**
 * BullMQ queue depth, read directly from the bull:<queue>:* keys so the
 * gateway needs no bullmq dependency. Queue names are DISCOVERED by scanning
 * for meta keys, so new queues appear automatically.
 */
async function queueStats() {
  const r = getRedis();
  if (!r) return { available: false, reason: 'REDIS_URL not configured', queues: [], totals: null };
  try {
    if (r.status !== 'ready') await r.connect().catch(() => {});

    const names = new Set();
    let cursor = '0';
    do {
      const [next, keys] = await r.scan(cursor, 'MATCH', 'bull:*:meta', 'COUNT', 100);
      cursor = next;
      keys.forEach((k) => names.add(k.slice('bull:'.length, -':meta'.length)));
    } while (cursor !== '0');

    const queues = await Promise.all([...names].map(async (name) => {
      const k = (suffix) => 'bull:' + name + ':' + suffix;
      const [wait, active, delayed, failed, enqueued] = await Promise.all([
        r.llen(k('wait')).catch(() => 0),
        r.llen(k('active')).catch(() => 0),
        r.zcard(k('delayed')).catch(() => 0),
        r.zcard(k('failed')).catch(() => 0),
        r.get(k('id')).catch(() => '0'),
      ]);
      return {
        name: name,
        waiting: wait,
        active: active,
        delayed: delayed,
        failed: failed,
        // BullMQ monotonic auto-increment counter = jobs ever enqueued.
        enqueued: Number(enqueued || 0),
      };
    }));

    queues.sort((a, b) => a.name.localeCompare(b.name));
    const totals = queues.reduce((acc, q) => {
      acc.waiting += q.waiting; acc.active += q.active;
      acc.delayed += q.delayed; acc.failed += q.failed; acc.enqueued += q.enqueued;
      return acc;
    }, { waiting: 0, active: 0, delayed: 0, failed: 0, enqueued: 0 });

    return { available: true, queues: queues, totals: totals };
  } catch (err) {
    redisFailedAt = Date.now();
    return { available: false, reason: err.message, queues: [], totals: null };
  }
}

// --- Rolling series ------------------------------------------------------
function recordSeriesSample(probeResult) {
  const upCount = probeResult.filter((p) => p.up).length;
  const latencies = probeResult.filter((p) => p.up).map((p) => p.latencyMs);
  series.push({
    t: new Date().toISOString(),
    total: counters.total,
    serverError: counters.serverError,
    rateLimited: counters.rateLimited,
    servicesUp: upCount,
    servicesTotal: probeResult.length,
    avgLatencyMs: latencies.length
      ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10
      : 0,
  });
  if (series.length > SERIES_SIZE) series.shift();
}

let seriesTimer = null;
function startSeriesTimer(getServiceUrls) {
  if (seriesTimer) return;
  seriesTimer = setInterval(async () => {
    try { recordSeriesSample(await probeAll(getServiceUrls())); }
    catch { /* never let the sampler throw */ }
  }, SERIES_INTERVAL_MS);
  if (seriesTimer.unref) seriesTimer.unref();
}

// --- Public API ----------------------------------------------------------
/**
 * Build the full monitoring report. serviceUrls is the gateway's routing
 * table; every other number is measured live at call time.
 */
async function buildReport(serviceUrls, appMeta) {
  const [services, cache, queues] = await Promise.all([
    probeAll(serviceUrls),
    cacheStats(),
    queueStats(),
  ]);

  recordSeriesSample(services);

  const c = countersSnapshot();
  const up = services.filter((s) => s.up).length;

  return {
    generatedAt: new Date().toISOString(),
    service: (appMeta && appMeta.name) || 'restpoint-gateway',
    version: (appMeta && appMeta.version) || null,
    summary: {
      servicesUp: up,
      servicesTotal: services.length,
      allUp: up === services.length && services.length > 0,
      total: c.total,
      ok: c.ok,
      clientError: c.clientError,
      serverError: c.serverError,
      rateLimited: c.rateLimited,
      avgLatencyMs: c.avgLatencyMs,
      uptimeSeconds: c.uptimeSeconds,
    },
    process: memorySnapshot(),
    requests: { overall: c, perService: perServiceSnapshot() },
    services: services,
    cache: cache,
    queues: queues,
    series: series,
    logs: logRing.slice(0, 60),
  };
}

module.exports = {
  metricsMiddleware: metricsMiddleware,
  buildReport: buildReport,
  startSeriesTimer: startSeriesTimer,
  countersSnapshot: countersSnapshot,
  PROBE_TIMEOUT_MS: PROBE_TIMEOUT_MS,
};
