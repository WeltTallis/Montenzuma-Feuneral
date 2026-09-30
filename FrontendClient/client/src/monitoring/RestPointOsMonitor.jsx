/**
 * Rest Point OS — Infrastructure Monitor
 *
 * React port of the standalone monitoring/index.html, now served inside the app
 * at /<slug>/monitoring. Every value comes from the API gateway's
 * GET /monitoring endpoint (services/api-gateway/monitoring.js) — live service
 * probes, real Redis cache counters, real BullMQ queue depth, and real request
 * metrics recorded by the gateway. The old Grafana / Prometheus / Loki /
 * Promtail / blackbox-exporter / uptime-kuma stack is gone.
 *
 * Cards whose original metric has no real source (e.g. "Slow Query Tracker" —
 * nothing exposes slow-query telemetry) are re-pointed at real data rather than
 * filled with plausible-looking dummy numbers.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import env from '../utils/config/env';
import './monitor.css';

Chart.register(...registerables);

const REFRESH_MS = 5000;
const MONITOR_URL = `${env.API_GATEWAY_URL}/monitoring`;

const C = {
  cyan: '#00d9ff', pink: '#ff006e', green: '#00ff88',
  red: '#ff3b3b', yellow: '#ffcc00', grid: '#1F2326', tick: '#5a5e63', faint: '#8a8e93',
};

// Distinct hues for the multi-line per-service chart. Chosen to stay legible on
// the #0d1117 panel and to remain distinguishable for the most common forms of
// colour-vision deficiency (no red/green-only pairing, varied lightness).
const SERIES_COLORS = ['#00d9ff', '#ff006e', '#00ff88', '#ffcc00', '#b388ff', '#ff8a5c'];

Chart.defaults.color = C.tick;
Chart.defaults.borderColor = C.grid;
Chart.defaults.font.family = "'JetBrains Mono', monospace";

/* ── formatting ───────────────────────────────────────────────────────────── */

const num = (n) => (Number(n) || 0).toLocaleString('en-US');

/** Human uptime: 4d 2h / 3h 12m / 45s. */
function uptime(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${Math.floor(s % 60)}s`;
}

const clockOf = (iso) => {
  try { return new Date(iso).toLocaleTimeString('en-GB', { hour12: false }); }
  catch { return '--:--:--'; }
};

/**
 * Alerts are DERIVED from the live report — there is no alert store. Anything
 * genuinely wrong (service down, 5xx, failed jobs, bad latency, Redis down)
 * becomes a row; when everything is healthy we say so instead of inventing one.
 */
function deriveAlerts(d) {
  const out = [];
  const when = clockOf(d.generatedAt);

  (d.services || []).filter((s) => !s.up).forEach((s) => {
    out.push({ when, sev: 'err', msg: `Service unreachable (${s.error || 'no response'})`, svc: s.name });
  });

  if (d.summary.serverError > 0) {
    out.push({ when, sev: 'err', msg: `${num(d.summary.serverError)} server errors (5xx) recorded`, svc: 'api_gateway' });
  }
  if (d.summary.rateLimited > 0) {
    out.push({ when, sev: 'warn', msg: `${num(d.summary.rateLimited)} rate-limited requests (429)`, svc: 'api_gateway' });
  }
  if (d.summary.avgLatencyMs > 500) {
    out.push({ when, sev: 'warn', msg: `Average latency high: ${Math.round(d.summary.avgLatencyMs)}ms`, svc: 'api_gateway' });
  }
  if (d.queues?.available && d.queues.totals?.failed > 0) {
    out.push({ when, sev: 'warn', msg: `${num(d.queues.totals.failed)} background jobs failed`, svc: 'bullmq' });
  }
  if (d.queues?.available && d.queues.totals?.waiting > 500) {
    out.push({ when, sev: 'warn', msg: `Queue backlog: ${num(d.queues.totals.waiting)} jobs waiting`, svc: 'bullmq' });
  }
  if (d.cache && d.cache.available === false) {
    out.push({ when, sev: 'warn', msg: `Cache telemetry unavailable: ${d.cache.reason || 'unknown'}`, svc: 'redis' });
  }

  const slow = (d.services || []).filter((s) => s.up && s.latencyMs > 800);
  slow.slice(0, 3).forEach((s) => {
    out.push({ when, sev: 'warn', msg: `Slow response: ${s.latencyMs}ms`, svc: s.name });
  });

  return out;
}

/** A Chart.js canvas that is created once and updated in place. */
function ChartBox({ build, deps, className = 'rpm-chart' }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    chartRef.current = new Chart(canvas.getContext('2d'), build());
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const c = chartRef.current;
    if (!c) return;
    const next = build();
    c.data = next.data;
    if (next.options) c.options = next.options;
    c.update('none');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return <div className={className}><canvas ref={ref} /></div>;
}

const gradientFor = (ctx, color) => {
  const g = ctx.createLinearGradient(0, 0, 0, 200);
  g.addColorStop(0, color + '40');
  g.addColorStop(1, color + '00');
  return g;
};

const axisY = (extra = {}) => ({ grid: { color: C.grid }, border: { display: false }, ...extra });
const axisX = () => ({ grid: { display: false }, border: { display: false } });

export default function RestPointOsMonitor() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState(15);
  const [auto, setAuto] = useState(true);

  // Log viewer state. searchResult is null until the user searches, so the card
  // can show the live request log by default and switch to query results.
  const [logQuery, setLogQuery] = useState({ service: '', level: '', contains: '', hours: 1 });
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const runLogSearch = useCallback(async (q) => {
    setSearching(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams();
      if (q.service) params.set('service', q.service);
      if (q.level) params.set('level', q.level);
      if (q.contains) params.set('contains', q.contains);
      params.set('hours', String(q.hours || 1));
      params.set('limit', '200');

      const res = await fetch(`${MONITOR_URL}/logs?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      const body = await res.text();
      let json;
      try { json = JSON.parse(body); }
      catch { throw new Error('log endpoint returned non-JSON (is /monitoring routed to the gateway?)'); }
      if (json?.success) setSearchResult(json.data);
      else setSearchError(json?.message || 'Log search failed');
    } catch (e) {
      setSearchError(e.message);
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  }, []);

  const load = useCallback(async (silent) => {
    if (!silent) setRefreshing(true);
    try {
      // Bypass the axios instance: /monitoring lives at the gateway ROOT, not
      // under the /api/v1/restpoint service prefix, and needs no auth token.
      const res = await fetch(MONITOR_URL, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(REFRESH_MS * 2),
      });

      // Read the body once, as text, so a mis-routed request (nginx serving
      // the SPA index.html for /monitoring) produces an actionable message
      // instead of the bare "Unexpected token '<', "<!DOCTYPE "... is not
      // valid JSON" that used to leave the whole screen blank.
      const body = await res.text();

      if (!res.ok) {
        throw new Error(`gateway responded ${res.status} ${res.statusText || ''}`.trim());
      }

      let json;
      try {
        json = JSON.parse(body);
      } catch {
        const kind = /^\s*<(?:!doctype|html)/i.test(body) ? 'an HTML page' : 'a non-JSON response';
        throw new Error(
          `${MONITOR_URL} returned ${kind} instead of JSON. `
          + 'The reverse proxy is not routing /monitoring to the API gateway '
          + '(it is serving the SPA fallback) - fix the nginx location block.'
        );
      }

      if (json?.success && json.data) { setData(json.data); setError(null); }
      else setError(json?.message || 'Gateway returned no report');
    } catch (e) {
      setError(`Cannot reach ${MONITOR_URL} — ${e.message}`);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!auto) return undefined;
    const id = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(id);
  }, [auto, load]);

  const series = data?.series || [];
  const perService = data?.requests?.perService || {};
  const alerts = useMemo(() => (data ? deriveAlerts(data) : []), [data]);
  const services = data?.services || [];
  const cache = data?.cache || { available: false };
  const queues = data?.queues || { available: false, queues: [] };
  // New panels. Both are optional in the payload so an older gateway (or a
  // partial report) degrades to an empty card rather than crashing the render.
  const slow = data?.slowQueries || { thresholdMs: 1500, total: 0, worstMs: 0, avgMs: 0, byService: {}, slowest: [] };
  const logsStore = data?.logsStore || { lokiConfigured: false, lokiUrl: null };

  // Trend = request volume seen at each sample; falls back to the running total
  // so the chart is never a flat line of invented values.
  const trendLabels = useMemo(
    () => series.slice(-range).map((s) => clockOf(s.t)), [series, range]
  );
  const trendData = useMemo(() => {
    const pts = series.slice(-range);
    return pts.map((s, i) => (i === 0 ? 0 : Math.max(0, s.total - pts[i - 1].total)));
  }, [series, range]);
  const latencyData = useMemo(() => series.slice(-range).map((s) => s.avgLatencyMs), [series, range]);

  /* ── Per-service traffic over time ──────────────────────────────────────
   * Each sample carries a per-service counter snapshot, so the plotted value is
   * the DELTA between consecutive samples — the requests that arrived during
   * that interval. Plotting the raw cumulative count instead would draw N
   * monotonically rising lines that all slope upward forever and say nothing
   * about which service is actually busy right now.
   *
   * Only the busiest services get a line: with ~25 services the legend becomes
   * unreadable, and the long tail is flat near zero anyway. */
  const topServices = useMemo(() => {
    const totals = Object.entries(perService)
      .map(([name, v]) => [name, Number(v?.count) || 0])
      .sort((a, b) => b[1] - a[1]);
    return totals.slice(0, 6).map(([name]) => name);
  }, [perService]);

  const svcSeries = useMemo(
    () => series.slice(-range).map((s) => s.perService || {}),
    [series, range]
  );

  const svcDatasets = useMemo(
    () => topServices.map((name, i) => ({
      label: name,
      data: svcSeries.map((snap, idx) => {
        const now = Number(snap?.[name]);
        const prev = idx > 0 ? Number(svcSeries[idx - 1]?.[name]) : null;
        if (!Number.isFinite(now)) return 0;
        // First sample has no predecessor — show 0 rather than the cumulative
        // total, which would be a huge false spike.
        return prev === null || !Number.isFinite(prev) ? 0 : Math.max(0, now - prev);
      }),
      borderColor: SERIES_COLORS[i % SERIES_COLORS.length],
      backgroundColor: 'transparent',
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 5,
      borderWidth: 2,
      fill: false,
    })),
    [topServices, svcSeries]
  );

  const latencyPerService = useMemo(
    () => services.filter((s) => s.up).map((s) => s.latencyMs).sort((a, b) => b - a).slice(0, 10),
    [services]
  );

  const buildTrend = () => ({
    type: 'line',
    data: {
      labels: trendLabels,
      datasets: [
        {
          label: 'API Requests / sample', data: trendData, borderColor: C.cyan,
          backgroundColor: gradientFor(document.createElement('canvas').getContext('2d'), C.cyan),
          tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2, fill: true,
        },
        {
          label: 'Avg latency (ms)', data: latencyData, borderColor: C.pink,
          backgroundColor: 'transparent', yAxisID: 'y1',
          tension: 0.4, pointRadius: 0, borderWidth: 2, fill: false,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 10, usePointStyle: true, color: C.faint } } },
      scales: {
        y: axisY({ beginAtZero: true }),
        y1: { position: 'right', grid: { display: false }, border: { display: false }, beginAtZero: true },
        x: axisX(),
      },
    },
  });

  const q = queues.totals || {};
  const s = data?.summary || {};
  const proc = data?.process || {};

  /* The four chart builders below were referenced by the cards but never
     declared, so the first render threw `ReferenceError: buildHistory is not
     defined` and the Error Boundary replaced the whole monitor. Each returns
     the same Chart.js config shape as buildTrend and reads only real fields
     from the gateway's /monitoring payload. */

  /** API requests per service (cumulative since start). */
  const buildHistory = () => {
    const entries = Object.entries(perService)
      .map(([name, v]) => [name, Number(v?.count) || 0])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
    return {
      type: 'bar',
      data: {
        labels: entries.map(([n]) => n),
        datasets: [
          {
            label: 'Requests', data: entries.map(([, v]) => v),
            backgroundColor: gradientFor(document.createElement('canvas').getContext('2d'), C.cyan),
            borderColor: C.cyan, borderWidth: 1, borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: axisY({ beginAtZero: true }), y: axisX() },
      },
    };
  };

  /** Redis hit vs miss split. */
  const buildCache = () => {
    const hits = Number(cache.hits) || 0;
    const misses = Number(cache.misses) || 0;
    return {
      type: 'doughnut',
      data: {
        labels: ['Hits', 'Misses'],
        datasets: [
          {
            data: [hits, misses],
            backgroundColor: [C.green, C.yellow],
            borderColor: '#0d1117', borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, color: C.faint } } },
      },
    };
  };

  /** Real probe latency for the services that are currently up. */
  const buildLatency = () => ({
    type: 'bar',
    data: {
      labels: services.filter((x) => x.up).map((x) => x.name).slice(0, 12),
      datasets: [
        {
          label: 'Latency (ms)', data: latencyPerService,
          backgroundColor: gradientFor(document.createElement('canvas').getContext('2d'), C.pink),
          borderColor: C.pink, borderWidth: 1, borderRadius: 3,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: axisY({ beginAtZero: true }), x: axisX() },
    },
  });

  /** 429s recorded at each sample in the selected range. */
  const buildRateLimit = () => {
    const pts = series.slice(-range);
    return {
      type: 'line',
      data: {
        labels: pts.map((x) => clockOf(x.t)),
        datasets: [
          {
            label: '429s', data: pts.map((x) => Number(x.rateLimited) || 0),
            borderColor: C.yellow, backgroundColor: 'transparent',
            tension: 0.35, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2, fill: false,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false } },
        scales: { y: axisY({ beginAtZero: true, precision: 0 }), x: axisX() },
      },
    };
  };

  /** Requests per service over time — one line per busy service, per interval. */
  const buildServiceTraffic = () => ({
    type: 'line',
    data: {
      labels: trendLabels,
      datasets: svcDatasets,
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      // With 6 series a shared legend is the only way to tell the lines apart.
      plugins: {
        legend: {
          display: true, position: 'bottom',
          labels: { boxWidth: 10, usePointStyle: true, color: C.faint, padding: 12 },
        },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: { y: axisY({ beginAtZero: true, precision: 0 }), x: axisX() },
    },
  });

  /** Slowest requests — the DB-bound ones. Bar per request, slowest at the top. */
  const buildSlowQueries = () => {
    const rows = (data?.slowQueries?.slowest || []).slice(0, 12);
    return {
      type: 'bar',
      data: {
        labels: rows.map((r) => `${r.method} ${r.path}`),
        datasets: [{
          label: 'Duration (ms)',
          data: rows.map((r) => Number(r.ms) || 0),
          // Colour by severity against the configured threshold, so one glance
          // separates "slow" from "unacceptable".
          backgroundColor: rows.map((r) => {
            const thr = Number(data?.slowQueries?.thresholdMs) || 1500;
            const ms = Number(r.ms) || 0;
            if (ms >= thr * 3) return C.red;
            if (ms >= thr * 2) return C.yellow;
            return C.pink;
          }),
          borderColor: C.pink, borderWidth: 1, borderRadius: 3,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              // The label is the full path; the axis truncates it, so show the
              // real value (plus service) on hover.
              title: (items) => items[0]?.label || '',
              afterLabel: (item) => {
                const r = rows[item.dataIndex];
                return r ? `service: ${r.service} · status ${r.status} · ${clockOf(r.t)}` : '';
              },
            },
          },
        },
        scales: {
          x: axisY({ beginAtZero: true, title: { display: true, text: 'ms', color: C.faint } }),
          y: axisX({ ticks: { autoSkip: false, maxRotation: 0, font: { size: 9 }, callback: function (v) { const l = this.getLabelForValue(v); return l.length > 30 ? l.slice(0, 29) + '…' : l; } } }),
        },
      },
    };
  };

  const Stat = ({ tone, title, value }) => (
    <div className={`rpm-stat ${tone || ''}`}>
      <div className="t">{title}</div>
      <div className="n">{value}</div>
    </div>
  );

  return (
    <div className="rpm">
      <header className="rpm-header">
        <div className="rpm-header-left">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="15" stroke="#FAF8F4" strokeWidth="1.5" />
            <path d="M16 8V24M8 16H24" stroke="#FAF8F4" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="16" cy="16" r="3.5" fill="#FAF8F4" />
          </svg>
          <div>
            <h1>Rest Point OS</h1>
            <div className="tag">Funeral Home Infrastructure Monitor</div>
          </div>
        </div>
        <div className="rpm-header-right">
          <div className="rpm-pill">
            <div className={`rpm-dot ${error ? 'wait' : s.allUp === false ? 'bad' : ''}`} />
            <span>
              {error ? 'GATEWAY UNREACHABLE'
                : `${s.servicesUp || 0}/${s.servicesTotal || 0} SERVICES ONLINE`}
            </span>
            <button onClick={() => load()} type="button">{refreshing ? '…' : 'REFRESH'}</button>
          </div>
          <div className="rpm-pill">
            <span>UPTIME: {uptime(s.uptimeSeconds)}</span>
            <button onClick={() => setAuto((a) => !a)} type="button">{auto ? 'PAUSE' : 'LIVE'}</button>
          </div>
        </div>
      </header>

      <div className="rpm-grid">
        {error && (
          <div className="rpm-banner rpm-span-4" style={{ margin: 0 }}>{error}</div>
        )}

        <div className="rpm-card rpm-span-4">
          <div className="rpm-card-head">
            <h2>Gateway Overview</h2>
            <span className="label">
              {data ? `Last sample ${clockOf(data.generatedAt)}` : 'Waiting for data'}
            </span>
          </div>
          <div className="rpm-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 0 }}>
            <Stat tone="info" title="API Requests" value={num(s.total)} />
            <Stat tone="success" title="Cache Hit Rate" value={cache.available ? `${cache.hitRatePct}%` : '—'} />
            <Stat tone="danger" title="Jobs Failed" value={queues.available ? num(q.failed) : '—'} />
            <Stat tone="warning" title="Memory (RSS)" value={proc.rssMb != null ? `${proc.rssMb} MB` : '—'} />
          </div>
        </div>

        <div className="rpm-card rpm-span-3">
          <div className="rpm-card-head">
            <h2>Service Traffic Trends</h2>
            <div className="rpm-times">
              {[5, 15, 30, 60].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`rpm-time-btn ${range === n ? 'active' : ''}`}
                  onClick={() => setRange(n)}
                >
                  {n}m
                </button>
              ))}
            </div>
          </div>
          <ChartBox build={buildTrend} deps={[trendData, latencyData, trendLabels]} />
        </div>

        <div className="rpm-card">
          <div className="rpm-card-head"><h2>Critical Alerts</h2><span className="label">Live</span></div>
          <div className="rpm-alerts">
            {alerts.length === 0 ? (
              <div className="rpm-empty">{data ? 'All systems nominal — no alerts' : 'No data yet'}</div>
            ) : alerts.map((a, i) => (
              <div key={i} className={`rpm-alert ${a.sev === 'err' ? '' : a.sev}`}>
                <div className="when">{a.when}</div>
                <div className="what">{a.msg}</div>
                <div className="who">{a.svc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rpm-card rpm-span-2">
          <div className="rpm-card-head"><h2>API Requests by Service</h2><span className="label">Since start</span></div>
          <ChartBox build={buildHistory} deps={[perService]} />
        </div>

        <div className="rpm-card">
          <div className="rpm-card-head"><h2>Cache Performance</h2><span className="label">Redis</span></div>
          <div className="rpm-stats">
            <Stat tone="success" title="Hits" value={cache.available ? num(cache.hits) : '—'} />
            <Stat tone="warning" title="Misses" value={cache.available ? num(cache.misses) : '—'} />
            <Stat tone="info" title="Total" value={cache.available ? num(cache.total) : '—'} />
          </div>
          <ChartBox build={buildCache} deps={[cache.hits, cache.misses, cache.available]} className="rpm-chart-sm" />
        </div>

        <div className="rpm-card">
          <div className="rpm-card-head"><h2>BullMQ Workers</h2><span className="label">Background Jobs</span></div>
          <div className="rpm-stats">
            <Stat tone="info" title="Enqueued" value={queues.available ? num(q.enqueued) : '—'} />
            <Stat tone="success" title="Active" value={queues.available ? num(q.active) : '—'} />
            <Stat tone="danger" title="Failed" value={queues.available ? num(q.failed) : '—'} />
          </div>
          {queues.available && queues.queues.length ? (
            <div className="rpm-logs" style={{ height: 180 }}>
              {queues.queues.map((qq) => (
                <div className="rpm-log" key={qq.name}>
                  <span className="svc">{qq.name}</span>
                  <span className="msg">
                    waiting {qq.waiting} · active {qq.active} · delayed {qq.delayed} · failed {qq.failed}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rpm-empty">{queues.reason || 'No queues found'}</div>
          )}
        </div>

        <div className="rpm-card rpm-span-2">
          <div className="rpm-card-head"><h2>Service Latency</h2><span className="label">Real probe</span></div>
          <ChartBox build={buildLatency} deps={[latencyPerService, services]} />
        </div>

        <div className="rpm-card rpm-span-2">
          <div className="rpm-card-head"><h2>Rate Limit Hits</h2><span className="label">429s</span></div>
          <ChartBox build={buildRateLimit} deps={[series, range]} />
        </div>

        {/* ── Requests per service, over time ────────────────────────────── */}
        <div className="rpm-card rpm-span-4">
          <div className="rpm-card-head">
            <h2>Requests by Service</h2>
            <div className="rpm-times">
              {[5, 15, 30, 60].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`rpm-time-btn ${range === n ? 'active' : ''}`}
                  onClick={() => setRange(n)}
                >
                  {n}m
                </button>
              ))}
            </div>
          </div>
          {topServices.length === 0 ? (
            <div className="rpm-empty">No service traffic recorded yet</div>
          ) : (
            <ChartBox
              className="rpm-chart rpm-chart-tall"
              build={buildServiceTraffic}
              deps={[svcDatasets, trendLabels]}
            />
          )}
        </div>

        {/* ── Slow queries ──────────────────────────────────────────────── */}
        <div className="rpm-card rpm-span-4">
          <div className="rpm-card-head">
            <h2>Slow Queries</h2>
            <span className="label">
              {slow.total > 0
                ? `${num(slow.total)} over ${slow.thresholdMs}ms · worst ${num(Math.round(slow.worstMs))}ms`
                : `none over ${slow.thresholdMs}ms`}
            </span>
          </div>

          <div className="rpm-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
            <Stat tone="danger" title="Slow Recorded" value={num(slow.total)} />
            <Stat tone="warning" title="Worst (ms)" value={slow.worstMs ? num(Math.round(slow.worstMs)) : '—'} />
            <Stat tone="info" title="Avg (ms)" value={slow.avgMs ? num(slow.avgMs) : '—'} />
            <Stat
              tone="info"
              title="Worst Service"
              value={(() => {
                const worst = Object.entries(slow.byService).sort((a, b) => b[1] - a[1])[0];
                return worst ? `${worst[0]} (${worst[1]})` : '—';
              })()}
            />
          </div>

          {(slow.slowest || []).length === 0 ? (
            <div className="rpm-empty">
              No request has taken longer than {slow.thresholdMs}ms since the gateway started.
              These are end-to-end timings measured around the real upstream call, so they
              include the downstream service&apos;s database time.
            </div>
          ) : (
            <ChartBox
              className="rpm-chart rpm-chart-tall"
              build={buildSlowQueries}
              deps={[data?.slowQueries]}
            />
          )}
        </div>

        {/* ── Application logs (Loki-backed) ───────────────────────────── */}
        <div className="rpm-card rpm-span-4">
          <div className="rpm-card-head">
            <h2>Application Logs</h2>
            <span className="label">
              {searchResult?.available
                ? `Loki · ${num(searchResult.total)} lines`
                : logsStore.lokiConfigured
                  ? 'Loki unreachable — request log'
                  : 'Loki not deployed — request log'}
            </span>
          </div>

          <form
            className="rpm-log-filters"
            onSubmit={(e) => { e.preventDefault(); runLogSearch(logQuery); }}
          >
            <input
              className="rpm-log-input"
              placeholder="service (e.g. coffin-service)"
              value={logQuery.service}
              onChange={(e) => setLogQuery((q) => ({ ...q, service: e.target.value }))}
            />
            <select
              className="rpm-log-input"
              value={logQuery.level}
              onChange={(e) => setLogQuery((q) => ({ ...q, level: e.target.value }))}
            >
              <option value="">any level</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
              <option value="DEBUG">DEBUG</option>
            </select>
            <input
              className="rpm-log-input"
              placeholder="contains text…"
              value={logQuery.contains}
              onChange={(e) => setLogQuery((q) => ({ ...q, contains: e.target.value }))}
            />
            <select
              className="rpm-log-input"
              value={logQuery.hours}
              onChange={(e) => setLogQuery((q) => ({ ...q, hours: Number(e.target.value) }))}
            >
              <option value={1}>last 1h</option>
              <option value={6}>last 6h</option>
              <option value={24}>last 24h</option>
            </select>
            <button type="submit" className="rpm-btn" disabled={searching}>
              {searching ? 'Searching…' : 'Search logs'}
            </button>
          </form>

          {searchError && <div className="rpm-banner" style={{ margin: '0 0 12px' }}>{searchError}</div>}

          {searchResult && !searchResult.available && (
            <div className="rpm-banner" style={{ margin: '0 0 12px' }}>
              {searchResult.reason || 'Loki unavailable'}. The Loki/Promtail stack is not in
              docker-compose, so there is no central log store to query — showing the
              gateway&apos;s live request log instead.
            </div>
          )}

          <div className="rpm-logs">
            {searchResult?.available ? (
              searchResult.entries.length === 0 ? (
                <div className="rpm-empty">No log lines matched</div>
              ) : searchResult.entries.map((l, i) => (
                <div className="rpm-log" key={`${l.t}-${i}`}>
                  <span className="svc">{l.service}</span>
                  <span className="msg">{l.line}</span>
                </div>
              ))
            ) : (data?.logs || []).length === 0 ? (
              <div className="rpm-empty">No requests recorded yet</div>
            ) : data.logs.map((l, i) => {
              const sev = l.status >= 500 ? 'error' : l.status >= 400 ? 'warn' : 'info';
              return (
                <div className={`rpm-log ${sev === 'error' ? 'err' : sev === 'warn' ? 'warn' : ''}`} key={`${l.t}-${i}`}>
                  <span className="svc">{l.service}</span>
                  <span className="msg">{l.method} {l.path} → {l.status} ({l.ms}ms)</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rpm-card rpm-span-4">
          <div className="rpm-card-head">
            <h2>System Service Status</h2>
            <div className="rpm-pill">
              <div className={`rpm-dot ${s.allUp === false ? 'bad' : ''}`} />
              <span>{data ? `Refreshed at ${clockOf(data.generatedAt)}` : 'Connecting…'}</span>
            </div>
          </div>
          <div className="rpm-status-grid">
            {services.length === 0 ? (
              <div className="rpm-empty">No services reported</div>
            ) : services.map((sv) => (
              <div className={`rpm-status-item ${sv.up ? '' : 'down'}`} key={sv.name}>
                <div className="info">
                  <div className={`rpm-status-dot ${sv.up ? 'up' : 'down'}`} />
                  <div style={{ minWidth: 0 }}>
                    <div className="name">{sv.name}</div>
                    <div className="lat">
                      {sv.up ? `${sv.latencyMs}ms latency` : sv.error || 'unreachable'}
                    </div>
                  </div>
                </div>
                <div className={`rpm-status-text ${sv.up ? 'up' : 'down'}`}>
                  {sv.up ? 'Active' : 'Down'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rpm-card rpm-span-4">
          <div className="rpm-card-head"><h2>Live Request Log</h2><span className="label">Gateway ring buffer</span></div>
          <div className="rpm-logs">
            {(data?.logs || []).length === 0 ? (
              <div className="rpm-empty">No requests recorded yet</div>
            ) : data.logs.map((l, i) => {
              const sev = l.status >= 500 ? 'error' : l.status >= 400 ? 'warn' : 'info';
              return (
                <div className={`rpm-log ${sev === 'error' ? 'err' : sev === 'warn' ? 'warn' : ''}`} key={`${l.t}-${i}`}>
                  <span className="ts">{clockOf(l.t)}</span>
                  <span className={`lvl ${sev}`}>[{l.status}]</span>
                  <span className="svc">[{l.service}]</span>
                  <span className="msg">{l.method} {l.path} · {l.ms}ms</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

