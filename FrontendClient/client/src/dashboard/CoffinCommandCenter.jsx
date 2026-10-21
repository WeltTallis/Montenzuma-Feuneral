import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './coffin-analytics-dashboard.css';
import { CoffinAPI } from '../api/coffinApi';
import { loadCoffinTypesCatalog } from '../components/coffins/coffinColorUtils';
import { getParentTenantSlug, getTenantSlug } from '../utils/globalAuth';

/* ── Colour hex map for swatches ─────────────────────────────────── */
const COLOR_HEX = {
  White: '#cbd5e1', Brown: '#92400e', Chocolate: '#78350f',
  Black: '#0f172a', Purple: '#7c3aed', Natural: '#d4a017',
  Mahogany: '#7f1d1d', Walnut: '#3d2817', 'Dark Cherry': '#5a1a1a',
  'Golden Oak': '#c89060', Honey: '#d97706', Pine: '#65a30d',
  'Light Pink': '#f5d5d5', 'Midnight Black': '#0f172a',
  'Rich Mahogany': '#7f1d1d', 'Walnut Brown': '#3d2817',
  'Metallic Gold': '#d4af37', 'Deep Rosewood': '#65000b',
  'Pearl White': '#f8f6f0', Red: '#dc2626', Blue: '#2563eb',
  Grey: '#6b7280', Gray: '#6b7280', Silver: '#94a3b8',
  Cream: '#fef3c7', Beige: '#d4c5a9',
};

const LOW_STOCK = 2;
const CRITICAL_STOCK = 1;
const ACTIVE_STATUSES = new Set(['pending', 'confirmed', 'booked', 'reserved']);

export default function CoffinCommandCenter({ onOpenStore, embedded = false }) {
  /* ── State ──────────────────────────────────────────────────────── */
  const [variants, setVariants] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [branches, setBranches] = useState([]);
  const [catalog, setCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branchFilter, setBranchFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [rangeDays, setRangeDays] = useState(7);
  const [attnOpen, setAttnOpen] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  /* ── Load real data from API ────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parentSlug = getParentTenantSlug() || getTenantSlug();

      // Fetch real coffin inventory across all branches
      let coffinsData = [];
      try {
        const res = await CoffinAPI.getAllBranches(parentSlug);
        coffinsData = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      } catch (e) {
        console.warn('[CoffinCommandCenter] getAllBranches failed, trying fallback:', e.message);
        // Fallback: try the main api endpoint
        try {
          const { default: api } = await import('../api');
          const fallback = await api.get('/coffins/list');
          coffinsData = Array.isArray(fallback.data?.data) ? fallback.data.data : (Array.isArray(fallback.data) ? fallback.data : []);
        } catch { /* no data available */ }
      }

      // Map coffins to variant objects
      const mappedVariants = coffinsData.map((c, idx) => ({
        id: String(c.coffin_id || c.id || `c_${idx}`),
        type: c.type || c.coffin_type || c.name || 'Unknown',
        color: c.color || c.coffin_color || 'Unknown',
        branch: c.branch_name || c.branch_slug || 'Main',
        qty: parseInt(c.stock ?? c.quantity ?? c.qty) || 0,
        location: c.location || c.rack || '',
      }));

      // Fetch real orders/bookings
      let ordersData = [];
      try {
        const ordersRes = await CoffinAPI.getOrders({ parent_slug: parentSlug });
        ordersData = Array.isArray(ordersRes?.data) ? ordersRes.data : (Array.isArray(ordersRes) ? ordersRes : []);
      } catch (e) {
        console.warn('[CoffinCommandCenter] getOrders failed:', e.message);
      }

      // Map orders to booking objects
      const mappedBookings = ordersData.map((o, idx) => ({
        id: String(o.order_id || o.id || `o_${idx}`),
        variantId: String(o.coffin_id || o.coffinId || ''),
        qty: parseInt(o.quantity || o.qty) || 1,
        status: (o.status || 'pending').toLowerCase(),
        date: o.created_at || o.createdAt || o.date || o.order_date || new Date().toISOString(),
        client: o.client_name || o.clientName || o.customer_name || o.deceased_name || o.deceasedName || '',
        amount: parseFloat(o.amount || o.total || 0),
      }));

      // Derive branches from actual data
      const branchSet = new Set();
      mappedVariants.forEach(v => branchSet.add(v.branch));
      mappedBookings.forEach(b => {
        const v = mappedVariants.find(x => x.id === b.variantId);
        if (v) branchSet.add(v.branch);
      });
      const derivedBranches = [...branchSet].filter(Boolean).sort();

      // Build catalog from localStorage (registered types) + real data
      const newCat = {};
      const storedCat = loadCoffinTypesCatalog();
      if (storedCat && storedCat.length > 0) {
        storedCat.forEach(t => {
          if (t.name) {
            newCat[t.name] = { colors: (t.colors || []).map(c => c.name || c) };
          }
        });
      }
      // Also add types/colors found in actual inventory data
      mappedVariants.forEach(v => {
        if (!newCat[v.type]) newCat[v.type] = { colors: [] };
        if (v.color && !newCat[v.type].colors.includes(v.color)) {
          newCat[v.type].colors.push(v.color);
        }
      });

      setVariants(mappedVariants);
      setBookings(mappedBookings);
      setBranches(derivedBranches.length > 0 ? derivedBranches : []);
      setCatalog(newCat);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('[CoffinCommandCenter] Failed to load data:', err);
      setError(err.friendlyMessage || err.message || 'Failed to load coffin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const refreshTimer = setInterval(fetchData, 60000);
    return () => clearInterval(refreshTimer);
  }, [fetchData]);

  /* ── Derived / filtered data ────────────────────────────────────── */
  const filteredVariants = useMemo(() => {
    return variants.filter(v => {
      if (branchFilter !== 'all' && v.branch !== branchFilter) return false;
      if (typeFilter !== 'all' && v.type !== typeFilter) return false;
      return true;
    });
  }, [variants, branchFilter, typeFilter]);

  const bookedFor = useCallback((vid) => {
    return bookings
      .filter(b => b.variantId === vid && ACTIVE_STATUSES.has(b.status))
      .reduce((s, b) => s + b.qty, 0);
  }, [bookings]);

  const statusOf = useCallback((v) => {
    const a = Math.max(0, v.qty - bookedFor(v.id));
    if (v.qty === 0) return 'out';
    if (a <= CRITICAL_STOCK) return 'critical';
    if (a <= LOW_STOCK) return 'low';
    return 'ok';
  }, [bookedFor]);

  const filteredBookings = useMemo(() => {
    const ids = new Set(filteredVariants.map(v => v.id));
    const cut = Date.now() - rangeDays * 86400000;
    return bookings.filter(b => ids.has(b.variantId) && new Date(b.date).getTime() >= cut);
  }, [filteredVariants, rangeDays, bookings]);

  /* ── KPIs ───────────────────────────────────────────────────────── */
  const totalStock = useMemo(() => filteredVariants.reduce((s, v) => s + v.qty, 0), [filteredVariants]);
  const totalBooked = useMemo(() => filteredVariants.reduce((s, v) => s + bookedFor(v.id), 0), [filteredVariants, bookedFor]);
  const totalAvailable = useMemo(() => Math.max(0, totalStock - totalBooked), [totalStock, totalBooked]);
  const outOfStockCount = useMemo(() => filteredVariants.filter(v => statusOf(v) === 'out').length, [filteredVariants, statusOf]);
  const recentBookingsCount = useMemo(() => filteredBookings.filter(b => ACTIVE_STATUSES.has(b.status)).length, [filteredBookings]);

  /* ── Attention alerts ───────────────────────────────────────────── */
  const attentionBranches = useMemo(() => {
    const byBranch = {};
    filteredVariants.forEach(v => {
      const st = statusOf(v);
      if (st === 'critical' || st === 'out') {
        if (!byBranch[v.branch]) byBranch[v.branch] = [];
        byBranch[v.branch].push({ v, st });
      }
    });
    return Object.entries(byBranch)
      .map(([branch, items]) => ({
        branch,
        items: items.sort((a, b) => (a.st === 'out' ? -1 : 1)),
        count: items.length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredVariants, statusOf]);

  const totalAlerts = useMemo(() => attentionBranches.reduce((s, b) => s + b.count, 0), [attentionBranches]);

  /* ── Trend chart ────────────────────────────────────────────────── */
  const trendBuckets = useMemo(() => {
    const days = rangeDays;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const buckets = Array.from({ length: days }, (_, i) => ({
      date: new Date(now.getTime() - (days - 1 - i) * 86400000),
      count: 0,
    }));
    filteredBookings.filter(b => ACTIVE_STATUSES.has(b.status)).forEach(b => {
      const bd = new Date(b.date);
      bd.setHours(0, 0, 0, 0);
      const idx = buckets.findIndex(x => x.date.getTime() === bd.getTime());
      if (idx >= 0) buckets[idx].count += b.qty;
    });
    return buckets;
  }, [rangeDays, filteredBookings]);

  /* ── Top booked variants ────────────────────────────────────────── */
  const topBookedVariants = useMemo(() => {
    const c = {};
    filteredBookings.filter(b => ACTIVE_STATUSES.has(b.status)).forEach(b => {
      c[b.variantId] = (c[b.variantId] || 0) + b.qty;
    });
    return Object.entries(c)
      .map(([id, n]) => ({ v: variants.find(v => v.id === id), n }))
      .filter(x => x.v)
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);
  }, [filteredBookings, variants]);

  /* ── Colour popularity ──────────────────────────────────────────── */
  const colorCounts = useMemo(() => {
    const c = {};
    filteredBookings.filter(b => ACTIVE_STATUSES.has(b.status)).forEach(b => {
      const v = variants.find(x => x.id === b.variantId);
      if (v) c[v.color] = (c[v.color] || 0) + b.qty;
    });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [filteredBookings, variants]);

  const totalColorBookings = useMemo(() => colorCounts.reduce((s, e) => s + e[1], 0), [colorCounts]);

  /* ── Stock health ───────────────────────────────────────────────── */
  const healthCounts = useMemo(() => {
    const b = { ok: 0, low: 0, critical: 0, out: 0 };
    filteredVariants.forEach(v => b[statusOf(v)]++);
    return b;
  }, [filteredVariants, statusOf]);

  /* ── Stock by branch bar data ───────────────────────────────────── */
  const branchStockData = useMemo(() => {
    return branches.map(b => {
      const vs = variants.filter(v => v.branch === b && (typeFilter === 'all' || v.type === typeFilter));
      const stock = vs.reduce((s, v) => s + v.qty, 0);
      const booked = vs.reduce((s, v) => s + bookedFor(v.id), 0);
      return { b, avail: Math.max(0, stock - booked) };
    });
  }, [branches, variants, typeFilter, bookedFor]);

  /* ── Matrix cols ────────────────────────────────────────────────── */
  const matrixCols = useMemo(() => {
    const cols = [];
    Object.entries(catalog).forEach(([type, cfg]) => {
      if (typeFilter !== 'all' && type !== typeFilter) return;
      (cfg.colors || []).forEach(color => cols.push({ type, color }));
    });
    return cols;
  }, [catalog, typeFilter]);

  /* ── Branch breakdown table ─────────────────────────────────────── */
  const branchTableRows = useMemo(() => {
    return branches.map(b => {
      const vs = variants.filter(v => v.branch === b && (typeFilter === 'all' || v.type === typeFilter));
      const stock = vs.reduce((s, v) => s + v.qty, 0);
      const booked = vs.reduce((s, v) => s + bookedFor(v.id), 0);
      return {
        b,
        stock,
        booked,
        avail: Math.max(0, stock - booked),
        fill: stock ? Math.round((booked / stock) * 100) : 0,
      };
    });
  }, [branches, variants, typeFilter, bookedFor]);

  /* ── Recent activity feed ───────────────────────────────────────── */
  const recentFeed = useMemo(() => {
    const ids = new Set(filteredVariants.map(v => v.id));
    return bookings
      .filter(b => ids.has(b.variantId))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 12);
  }, [bookings, filteredVariants]);

  /* ── Heatmap data ───────────────────────────────────────────────── */
  const heatmapData = useMemo(() => {
    const cut = Date.now() - 30 * 86400000;
    const g = {};
    branches.forEach(b => { g[b] = new Array(7).fill(0); });
    bookings.filter(b => new Date(b.date).getTime() >= cut && ACTIVE_STATUSES.has(b.status)).forEach(b => {
      const v = variants.find(x => x.id === b.variantId);
      if (v && g[v.branch]) {
        const dayIdx = (new Date(b.date).getDay() + 6) % 7;
        g[v.branch][dayIdx] += b.qty;
      }
    });
    const maxVal = Math.max(1, ...Object.values(g).flat());
    return { grid: g, max: maxVal };
  }, [branches, bookings, variants]);

  /* ── Helpers ────────────────────────────────────────────────────── */
  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return s + 's ago';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  };

  /* ── Loading / Error states ─────────────────────────────────────── */
  if (loading && variants.length === 0) {
    return (
      <div className="cb-root">
        <div className="cb-wrap" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
            Loading coffin inventory…
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            Fetching real-time data from all branches
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = variants.length === 0;

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="cb-root">
      {/* Topbar */}
      {!embedded && (
        <header className="cb-topbar">
          <div className="cb-brand">
            <div className="cb-mark">CB</div>
            <div className="cb-title">
              CoffinBook<span className="cb-sub">Analytics &amp; Command Center</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {lastUpdate && (
              <div className="cb-live-badge">
                <span className="cb-live-dot"></span>LIVE
              </div>
            )}
            <div className="cb-nav-links">
              <button
                type="button"
                className="cb-nav-link"
                onClick={() => onOpenStore && onOpenStore('inventory')}
              >
                Inventory
              </button>
              <button
                type="button"
                className="cb-nav-link"
                onClick={() => onOpenStore && onOpenStore('bookings')}
              >
                Bookings
              </button>
              <button type="button" className="cb-nav-link on">
                Analytics
              </button>
            </div>
          </div>
        </header>
      )}

      <div className="cb-wrap">
        {/* Page Head */}
        <div className="cb-page-head">
          <div className="cb-page-title">Real-time Inventory Analytics</div>
          <div className="cb-page-sub">
            {isEmpty
              ? 'No coffin inventory data yet — register coffins to see analytics'
              : 'Live view of stock, bookings and branch performance — auto-refreshes every 60s'}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
            padding: '12px 16px', marginBottom: 16, color: '#991b1b', fontSize: 13
          }}>
            <strong>⚠ </strong>{error}
            <button
              onClick={fetchData}
              style={{
                marginLeft: 12, background: '#dc2626', color: '#fff', border: 'none',
                padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && !error && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
              No coffin inventory data
            </div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
              Register coffin types and add inventory in the Coffin Store to see analytics, stock health, booking trends, and branch breakdowns here.
            </div>
            <button
              onClick={() => onOpenStore && onOpenStore('inventory')}
              style={{
                background: '#0f766e', color: '#fff', border: 'none', padding: '10px 24px',
                borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Go to Coffin Inventory
            </button>
          </div>
        )}

        {/* Main analytics content — only shown when we have real data */}
        {!isEmpty && (
          <>
            {/* Toolbar */}
            <div className="cb-toolbar">
              <select
                className="cb-select"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                <option value="all">All branches</option>
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <select
                className="cb-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All coffin types</option>
                {Object.keys(catalog).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <div className="cb-seg">
                <button className={rangeDays === 7 ? 'on' : ''} onClick={() => setRangeDays(7)}>7 days</button>
                <button className={rangeDays === 14 ? 'on' : ''} onClick={() => setRangeDays(14)}>14 days</button>
                <button className={rangeDays === 30 ? 'on' : ''} onClick={() => setRangeDays(30)}>30 days</button>
              </div>

              <div style={{ flex: 1 }}></div>
              <button
                onClick={fetchData}
                style={{
                  background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 14px',
                  borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 500, color: '#475569'
                }}
              >
                ↻ Refresh
              </button>
              {lastUpdate && (
                <div className="cb-last-update">
                  Updated {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* KPIs */}
            <div className="cb-kpis">
              <div className="cb-kpi" style={{ animationDelay: '0ms' }}>
                <div className="cb-kpi-top">
                  <div className="cb-kpi-label">Total stock</div>
                  <div className="cb-kpi-icon blue">▦</div>
                </div>
                <div className="cb-kpi-value">{totalStock}</div>
                <div className="cb-kpi-foot">
                  <span className="cb-kpi-note">{filteredVariants.length} variants</span>
                </div>
              </div>

              <div className="cb-kpi" style={{ animationDelay: '40ms' }}>
                <div className="cb-kpi-top">
                  <div className="cb-kpi-label">Available</div>
                  <div className="cb-kpi-icon green">✓</div>
                </div>
                <div className="cb-kpi-value">{totalAvailable}</div>
                <div className="cb-kpi-foot">
                  <span className="cb-kpi-note">after bookings</span>
                </div>
              </div>

              <div className="cb-kpi" style={{ animationDelay: '80ms' }}>
                <div className="cb-kpi-top">
                  <div className="cb-kpi-label">Booked</div>
                  <div className="cb-kpi-icon amber">◷</div>
                </div>
                <div className="cb-kpi-value">{totalBooked}</div>
                <div className="cb-kpi-foot">
                  <span className="cb-kpi-note">active reservations</span>
                </div>
              </div>

              <div className="cb-kpi" style={{ animationDelay: '120ms' }}>
                <div className="cb-kpi-top">
                  <div className="cb-kpi-label">Out of stock</div>
                  <div className="cb-kpi-icon red">!</div>
                </div>
                <div className="cb-kpi-value">{outOfStockCount}</div>
                <div className="cb-kpi-foot">
                  <span className="cb-kpi-note">need restocking</span>
                </div>
              </div>

              <div className="cb-kpi" style={{ animationDelay: '160ms' }}>
                <div className="cb-kpi-top">
                  <div className="cb-kpi-label">Bookings ({rangeDays}d)</div>
                  <div className="cb-kpi-icon violet">↗</div>
                </div>
                <div className="cb-kpi-value">{recentBookingsCount}</div>
                <div className="cb-kpi-foot">
                  <span className="cb-kpi-note">in selected range</span>
                </div>
              </div>
            </div>

            {/* Needs Attention Card */}
            <div className={`cb-attn-card ${attnOpen ? 'open' : ''}`}>
              <div className="cb-attn-head" onClick={() => setAttnOpen(!attnOpen)}>
                <div>
                  <div className="cb-attn-title">
                    <div className={`cb-attn-title-ico ${totalAlerts === 0 ? 'ok' : ''}`}>
                      {totalAlerts === 0 ? '✓' : '!'}
                    </div>
                    {totalAlerts === 0
                      ? 'All good — nothing needs attention'
                      : 'Needs attention — running out of stock'}
                  </div>
                  <div className="cb-attn-sub">
                    {totalAlerts === 0
                      ? 'Every variant is healthy across all branches'
                      : `${totalAlerts} variant${totalAlerts > 1 ? 's' : ''} across ${attentionBranches.length} branch${attentionBranches.length > 1 ? 'es' : ''} need restocking`}
                  </div>
                </div>
                <div className="cb-attn-right">
                  {totalAlerts > 0 && (
                    <div className="cb-attn-total">{totalAlerts} alerts</div>
                  )}
                  <button
                    type="button"
                    className="cb-attn-toggle"
                    aria-label="Toggle details"
                    onClick={(e) => { e.stopPropagation(); setAttnOpen(!attnOpen); }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="cb-attn-body-wrap">
                <div className="cb-attn-body">
                  {attentionBranches.length === 0 && (
                    <div style={{ padding: 16, color: '#64748b', fontSize: 13, textAlign: 'center' }}>
                      No items need attention right now
                    </div>
                  )}
                  {attentionBranches.map(be => (
                    <div key={be.branch} className="cb-attn-branch">
                      <div className="cb-attn-branch-head">
                        <div className="cb-attn-branch-name">{be.branch}</div>
                        <div className="cb-attn-branch-count">
                          {be.count} item{be.count > 1 ? 's' : ''}
                        </div>
                      </div>
                      {be.items.map(({ v, st }) => (
                        <div key={v.id} className="cb-attn-item">
                          <div
                            className="cb-attn-swatch"
                            style={{ background: COLOR_HEX[v.color] || '#999' }}
                          />
                          <div className="cb-attn-item-info">
                            <div className="cb-attn-item-name">
                              {v.type} · {v.color}
                            </div>
                            <div className="cb-attn-item-meta">
                              {v.location ? `${v.location} · ` : ''}{Math.max(0, v.qty - bookedFor(v.id))} avail
                            </div>
                          </div>
                          <span className={`cb-attn-badge ${st}`}>
                            {st === 'out' ? 'OUT' : 'CRITICAL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 1: Trend Chart + Most Booked */}
            <div className="cb-grid two">
              <div className="cb-card">
                <div className="cb-card-head">
                  <div>
                    <div className="cb-card-title">Booking trend</div>
                    <div className="cb-card-sub">Coffins booked per day</div>
                  </div>
                  <span className="cb-card-tag">{rangeDays} days</span>
                </div>
                {(() => {
                  const W = 640, H = 220, padL = 32, padR = 12, padT = 16, padB = 26;
                  const iW = W - padL - padR, iH = H - padT - padB;
                  const maxV = Math.max(1, ...trendBuckets.map(b => b.count));
                  const stepX = trendBuckets.length > 1 ? iW / (trendBuckets.length - 1) : iW;
                  const pts = trendBuckets.map((b, i) => ({
                    x: padL + i * stepX,
                    y: padT + iH - (b.count / maxV) * iH,
                    v: b.count,
                  }));
                  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
                  const area = `${line} L${pts[pts.length - 1]?.x || 0},${padT + iH} L${pts[0]?.x || 0},${padT + iH} Z`;

                  const hasData = trendBuckets.some(b => b.count > 0);

                  return hasData ? (
                    <svg className="cb-chart-svg" viewBox={`0 0 ${W} ${H}`}>
                      <defs>
                        <linearGradient id="cbTf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f766e" stopOpacity="0.16" />
                          <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[0, 0.25, 0.5, 0.75, 1].map(f => {
                        const y = padT + iH - f * iH;
                        return (
                          <g key={f}>
                            <line className="cb-grid-line" x1={padL} y1={y} x2={W - padR} y2={y} />
                            <text className="cb-axis-label" x={padL - 6} y={y + 3} textAnchor="end">
                              {Math.round(f * maxV)}
                            </text>
                          </g>
                        );
                      })}
                      <path d={area} fill="url(#cbTf)" />
                      <path d={line} fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="2.8" fill="#fff" stroke="#0f766e" strokeWidth="1.8" />
                      ))}
                      {trendBuckets.map((b, i) => {
                        if (rangeDays > 14 && i % 3 !== 0) return null;
                        const x = padL + i * stepX;
                        const label = b.date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
                        return (
                          <text key={i} className="cb-axis-label" x={x} y={H - 8} textAnchor="middle">
                            {label}
                          </text>
                        );
                      })}
                    </svg>
                  ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      No bookings in the last {rangeDays} days
                    </div>
                  );
                })()}
              </div>

              <div className="cb-card">
                <div className="cb-card-head">
                  <div>
                    <div className="cb-card-title">Most-booked variants</div>
                    <div className="cb-card-sub">Top 5 by total bookings</div>
                  </div>
                </div>
                <div className="cb-rank-list">
                  {topBookedVariants.length === 0 ? (
                    <div className="cb-empty">No bookings in this range</div>
                  ) : (
                    topBookedVariants.map((x, i) => {
                      const max = topBookedVariants[0]?.n || 1;
                      return (
                        <div key={x.v.id + i} className="cb-rank-row">
                          <div className={`cb-rank-num ${i === 0 ? 'top' : ''}`}>{i + 1}</div>
                          <div className="cb-rank-info">
                            <div className="cb-rank-name">{x.v.type} · {x.v.color}</div>
                            <div className="cb-rank-meta">{x.v.branch}</div>
                            <div className="cb-rank-bar-wrap">
                              <div className="cb-rank-bar" style={{ width: `${(x.n / max) * 100}%` }} />
                            </div>
                          </div>
                          <div className="cb-rank-val">{x.n}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Color Popularity + Stock Health + Stock by Branch */}
            <div className="cb-grid three">
              {/* Color Donut */}
              <div className="cb-card">
                <div className="cb-card-head">
                  <div>
                    <div className="cb-card-title">Color popularity</div>
                    <div className="cb-card-sub">Bookings by color</div>
                  </div>
                </div>
                <div className="cb-donut-wrap">
                  {colorCounts.length > 0 ? (() => {
                    const r = 44, sw = 18, cx = 68, cy = 68;
                    const circ = 2 * Math.PI * r;
                    let off = 0;
                    return (
                      <svg viewBox="0 0 136 136" style={{ width: 136, height: 136 }}>
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
                        {colorCounts.map(([col, n]) => {
                          const f = totalColorBookings ? n / totalColorBookings : 0;
                          const len = f * circ;
                          const elem = (
                            <circle key={col} cx={cx} cy={cy} r={r} fill="none"
                              stroke={COLOR_HEX[col] || '#94a3b8'}
                              strokeWidth={sw}
                              strokeDasharray={`${len} ${circ - len}`}
                              strokeDashoffset={-off}
                              transform={`rotate(-90 ${cx} ${cy})`}
                            />
                          );
                          off += len;
                          return elem;
                        })}
                      </svg>
                    );
                  })() : (
                    <div style={{ width: 136, height: 136, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                      No data
                    </div>
                  )}
                  <div className="cb-donut-center">
                    <div className="n">{totalColorBookings}</div>
                    <div className="l">bookings</div>
                  </div>
                </div>
                <div className="cb-legend">
                  {colorCounts.map(([col, n]) => (
                    <div key={col} className="cb-leg-item">
                      <span className="cb-leg-dot" style={{ background: COLOR_HEX[col] || '#94a3b8' }} />
                      {col} · <strong style={{ color: '#0f172a', marginLeft: 1 }}>{n}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock Health */}
              <div className="cb-card">
                <div className="cb-card-head">
                  <div>
                    <div className="cb-card-title">Stock health</div>
                    <div className="cb-card-sub">Variant status split</div>
                  </div>
                </div>
                {(() => {
                  const total = filteredVariants.length || 1;
                  const items = [
                    { k: 'ok', l: 'Healthy', c: '#16a34a' },
                    { k: 'low', l: 'Low', c: '#d97706' },
                    { k: 'critical', l: 'Critical', c: '#dc2626' },
                    { k: 'out', l: 'Out of stock', c: '#94a3b8' },
                  ];
                  let currentX = 0;

                  return (
                    <>
                      <svg viewBox="0 0 300 26" style={{ width: '100%', height: 26, borderRadius: 6, overflow: 'hidden' }}>
                        {items.map(it => {
                          const w = (healthCounts[it.k] / total) * 300;
                          const x = currentX;
                          currentX += w;
                          if (w <= 0) return null;
                          return (
                            <g key={it.k}>
                              <rect x={x} y="0" width={w} height="26" fill={it.c} />
                              {w >= 24 && (
                                <text x={x + w / 2} y="18" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">
                                  {healthCounts[it.k]}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                      <div className="cb-legend">
                        {items.map(it => (
                          <div key={it.k} className="cb-leg-item">
                            <span className="cb-leg-dot" style={{ background: it.c }} />
                            {it.l}{' '}
                            <strong style={{ marginLeft: 2, color: '#0f172a' }}>{healthCounts[it.k]}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Stock by branch */}
              <div className="cb-card">
                <div className="cb-card-head">
                  <div>
                    <div className="cb-card-title">Stock by branch</div>
                    <div className="cb-card-sub">Available units</div>
                  </div>
                </div>
                {branchStockData.length > 0 ? (() => {
                  const W = 340, H = 200, padL = 8, padR = 8, padT = 16, padB = 40;
                  const iW = W - padL - padR, iH = H - padT - padB;
                  const maxV = Math.max(1, ...branchStockData.map(d => d.avail));
                  const step = iW / branchStockData.length;
                  const bw = step * 0.55;

                  return (
                    <svg className="cb-chart-svg" viewBox={`0 0 ${W} ${H}`}>
                      <line className="cb-axis-line" x1={padL} y1={padT + iH} x2={W - padR} y2={padT + iH} />
                      {branchStockData.map((d, i) => {
                        const h = (d.avail / maxV) * iH;
                        const x = padL + i * step + (step - bw) / 2;
                        const y = padT + iH - h;
                        const shortName = d.b.length > 10 ? d.b.split(' ')[0] : d.b;
                        return (
                          <g key={d.b}>
                            <rect className="cb-bar" x={x} y={y} width={bw} height={h} rx="3" fill="#0284c7" />
                            <text className="cb-bar-val" x={x + bw / 2} y={y - 5} textAnchor="middle">{d.avail}</text>
                            <text className="cb-axis-label" x={x + bw / 2} y={H - 20} textAnchor="middle">{shortName}</text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })() : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    No branch data
                  </div>
                )}
              </div>
            </div>

            {/* Branch x Type x Color Matrix */}
            {matrixCols.length > 0 && branches.length > 0 && (
              <div className="cb-card cb-matrix-card">
                <div className="cb-card-head">
                  <div>
                    <div className="cb-card-title" style={{ fontSize: '14.5px' }}>
                      Full inventory by branch, type &amp; color
                    </div>
                    <div className="cb-card-sub">
                      Available units per Type · Color · Branch — scroll horizontally
                    </div>
                  </div>
                </div>

                <div className="cb-matrix-legend-bar">
                  <span className="cb-ml-item">
                    <span className="cb-ml-sw" style={{ background: '#f0fdf4', borderColor: '#86efac' }} />
                    Healthy
                  </span>
                  <span className="cb-ml-item">
                    <span className="cb-ml-sw" style={{ background: '#fffbeb', borderColor: '#fcd34d' }} />
                    Low
                  </span>
                  <span className="cb-ml-item">
                    <span className="cb-ml-sw" style={{ background: '#fef2f2', borderColor: '#fca5a5' }} />
                    Critical
                  </span>
                  <span className="cb-ml-item">
                    <span className="cb-ml-sw" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }} />
                    Out of stock
                  </span>
                </div>

                <div className="cb-matrix-wrap">
                  <table className="cb-matrix">
                    <thead>
                      <tr>
                        <th className="branch-col">Branch</th>
                        {matrixCols.map(c => (
                          <th key={`${c.type}-${c.color}`}>
                            <span className="color-swatch" style={{ background: COLOR_HEX[c.color] || '#999' }} />
                            {c.color}
                            <span className="type-line">{c.type}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {branches
                        .filter(b => branchFilter === 'all' || b === branchFilter)
                        .map(branch => (
                          <tr key={branch}>
                            <td className="branch-cell">{branch}</td>
                            {matrixCols.map(c => {
                              const v = variants.find(
                                x => x.branch === branch && x.type === c.type && x.color === c.color
                              );
                              if (!v) {
                                return (
                                  <td key={`${branch}-${c.type}-${c.color}`} className="cell-zero">
                                    <span className="val">—</span>
                                  </td>
                                );
                              }
                              const avail = Math.max(0, v.qty - bookedFor(v.id));
                              let cls = 'cell-ok';
                              if (v.qty === 0) cls = 'cell-out';
                              else if (avail <= CRITICAL_STOCK) cls = 'cell-critical';
                              else if (avail <= LOW_STOCK) cls = 'cell-low';

                              return (
                                <td
                                  key={`${branch}-${c.type}-${c.color}`}
                                  className={cls}
                                  title={`${branch} · ${c.type} · ${c.color}: ${avail} avail (${v.qty} total, ${bookedFor(v.id)} booked)`}
                                >
                                  <span className="val">{avail}</span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Row 3: Branch breakdown table + Live activity */}
            <div className="cb-grid two">
              <div className="cb-card">
                <div className="cb-card-head">
                  <div>
                    <div className="cb-card-title">Branch breakdown</div>
                    <div className="cb-card-sub">Stock, bookings and fill rate per branch</div>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="cb-branch-table">
                    <thead>
                      <tr>
                        <th>Branch</th>
                        <th>Stock</th>
                        <th>Booked</th>
                        <th>Available</th>
                        <th>Fill</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchTableRows.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No branches</td></tr>
                      ) : (() => {
                        const maxS = Math.max(1, ...branchTableRows.map(r => r.stock));
                        return branchTableRows.map(r => (
                          <tr key={r.b}>
                            <td><span className="cb-branch-name">{r.b}</span></td>
                            <td>
                              <span className="cb-mini-bar" style={{ width: `${(r.stock / maxS) * 44}px` }} />
                              {r.stock}
                            </td>
                            <td>{r.booked}</td>
                            <td>
                              <span className={r.avail > 0 ? 'cb-avail-ok' : 'cb-avail-out'}>
                                {r.avail}
                              </span>
                            </td>
                            <td>{r.fill}%</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="cb-card">
                <div className="cb-card-head">
                  <div>
                    <div className="cb-card-title">Recent activity</div>
                    <div className="cb-card-sub">Latest booking events</div>
                  </div>
                </div>
                <div className="cb-feed">
                  {recentFeed.length === 0 ? (
                    <div className="cb-empty">No booking activity yet</div>
                  ) : (
                    recentFeed.map((b, i) => {
                      const v = variants.find(x => x.id === b.variantId) || { type: '—', color: '—', branch: '—' };
                      const isFulfill = b.status === 'fulfilled' || b.status === 'completed';
                      const isCancel = b.status === 'cancelled';
                      const icCls = isFulfill ? 'fulfill' : isCancel ? 'cancel' : 'book';
                      const icCh = isFulfill ? '✓' : isCancel ? '✕' : '✦';
                      const verb = isFulfill ? 'Fulfilled' : isCancel ? 'Cancelled' : 'Booked';

                      return (
                        <div key={b.id + i} className="cb-feed-item" style={{ animationDelay: `${i * 25}ms` }}>
                          <div className={`cb-feed-ico ${icCls}`}>{icCh}</div>
                          <div className="cb-feed-body">
                            <div className="cb-feed-text">
                              <strong>{verb} {b.qty}× {v.type} · {v.color}</strong>
                            </div>
                            <div className="cb-feed-meta">
                              {v.branch}{b.client ? ` — ${b.client}` : ''} · {timeAgo(b.date)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Row 4: Heatmap */}
            {branches.length > 0 && (
              <div className="cb-card">
                <div className="cb-card-head">
                  <div>
                    <div className="cb-card-title">Booking intensity</div>
                    <div className="cb-card-sub">Bookings by branch × weekday (last 30 days)</div>
                  </div>
                </div>
                <div className="cb-heat">
                  <div></div>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <div key={d} className="cb-heat-head">{d}</div>
                  ))}
                  {branches.map(b => (
                    <React.Fragment key={b}>
                      <div className="cb-heat-lbl">{b.length > 10 ? b.split(' ')[0] : b}</div>
                      {(heatmapData.grid[b] || new Array(7).fill(0)).map((v, dayIdx) => {
                        const t = v / heatmapData.max;
                        const a = v === 0 ? 0 : 0.10 + t * 0.72;
                        const bg = v === 0 ? '#f8fafc' : `rgba(15,118,110,${a.toFixed(2)})`;
                        const textColor = v / heatmapData.max > 0.5 ? '#fff' : '#475569';
                        return (
                          <div
                            key={dayIdx}
                            className="cb-heat-cell"
                            style={{ background: bg, color: textColor }}
                            title={`${b} on day ${dayIdx + 1}: ${v} bookings`}
                          >
                            {v || ''}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
