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

  const load = useCallback(async (silent) => {
    if (!silent) setRefreshing(true);
    try {
      // Bypass the axios instance: /monitoring lives at the gateway ROOT, not
      // under the /api/v1/restpoint service prefix, and needs no auth token.
      const res = await fetch(MONITOR_URL, { headers: { Accept: 'application/json' } });
      const json = await res.json();
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

