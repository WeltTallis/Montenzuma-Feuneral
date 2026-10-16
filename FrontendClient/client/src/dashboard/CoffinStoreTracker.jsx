// CoffinStoreTracker.jsx
// Cross-branch coffin store tracker for the dashboard.
// Shows coffin stock in every branch, the most-moving (popular) coffin types,
// and low-stock alerts — so managers know which coffin is most needed and
// where to rebalance stock.
// Self-contained: fetches from CoffinAPI (cross-branch endpoint) and computes
// derived metrics on the client.
import { useEffect, useMemo, useState } from 'react';
import { CoffinAPI } from '../api/coffinApi';
import { getTenantSlug } from '../utils/globalAuth';

const C = {
  navy: '#0a0a0a', navyBg: '#f1f5f9',
  green: '#16a34a', greenBg: '#f0fdf4',
  amber: '#d97706', amberBg: '#fffbeb',
  red: '#dc2626', redBg: '#fef2f2',
  blue: '#0284c7', blueBg: '#eff6ff',
  ink: '#1a1a1a', muted: '#777777', line: '#e0e0e0', card: '#ffffff',
};

const pad = (n) => String(n).padStart(2, '0');
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const currency = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 });
};

export default function CoffinStoreTracker() {
  const [coffins, setCoffins] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branchFilter, setBranchFilter] = useState('all');

  // Today's bookings tab
  const [todayBookings, setTodayBookings] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const tenantSlug = getTenantSlug();
  const parentSlug = tenantSlug ? tenantSlug.split('-').slice(0, -1).join('-') || tenantSlug : '';

  // ── Load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const inv = await CoffinAPI.getAllBranches(parentSlug || tenantSlug || 'default');
        const items = Array.isArray(inv?.data) ? inv.data : [];

        let orders = [];
        try {
          const ord = await CoffinAPI.getOrders({ tenant_slug: parentSlug || tenantSlug });
          orders = Array.isArray(ord?.data) ? ord.data : [];
        } catch { /* orders optional */ }

        if (!cancelled) {
          setCoffins(items);
          setBookings(orders);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.friendlyMessage || err.message || 'Failed to load coffin store data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [parentSlug, tenantSlug]);

  // ── Load today's bookings ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const loadToday = async () => {
      setTodayLoading(true);
      try {
        const params = { tenant_slug: parentSlug || tenantSlug, today: '1' };
        if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
        const ord = await CoffinAPI.getTodayBookings(params);
        const orders = Array.isArray(ord?.data) ? ord.data : [];
        if (!cancelled) {
          setTodayBookings(orders);
        }
      } catch (err) {
        console.warn('[CoffinStoreTracker] Today bookings load failed:', err?.message);
        if (!cancelled) setTodayBookings([]);
      } finally {
        if (!cancelled) setTodayLoading(false);
      }
    };
    loadToday();
    return () => { cancelled = true; };
  }, [parentSlug, tenantSlug, searchQuery]);

  // ── Derived metrics ────────────────────────────────────────────────────

  const byBranch = useMemo(() => {
    const map = new Map();
    coffins.forEach((c) => {
      const b = c.branch_name || c.branch_slug || c.branch_id || 'Unknown Branch';
      if (!map.has(b)) map.set(b, []);
      map.get(b).push(c);
    });
    return Array.from(map.entries()).map(([branch, items]) => ({
      branch,
      total: items.reduce((s, c) => s + (Number(c.quantity) || 0), 0),
      count: items.length,
      lowStock: items.filter((c) => {
        const q = Number(c.quantity || 0);
        return q <= 5 || q === 0;
      }).length,
      items,
    }));
  }, [coffins]);

  const totalCoffins = coffins.reduce((s, c) => s + (Number(c.quantity) || 0), 0);
  const totalBranches = byBranch.length;
  const lowStockCoffins = coffins.filter((c) => {
    const q = Number(c.quantity || 0);
    return q <= 5 || q === 0;
  });
  const outOfStock = coffins.filter((c) => Number(c.quantity || 0) === 0);

  const mostMoving = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => {
      const key = `${b.coffin_name || b.type || 'Unknown'} | ${b.color || ''} | ${b.size || ''}`;
      const qty = Number(b.quantity || 1);
      const cur = map.get(key) || { name: b.coffin_name || b.type || 'Unknown', color: b.color || '', size: b.size || '', qty: 0, branches: new Set() };
      cur.qty += qty;
      if (b.branch_name) cur.branches.add(b.branch_name);
      if (b.branch_id) cur.branches.add(String(b.branch_id));
      map.set(key, cur);
    });
    return Array.from(map.values())
      .map((m) => ({ ...m, branches: m.branches.size }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);
  }, [bookings]);

  const filteredBranches = branchFilter === 'all' ? byBranch : byBranch.filter((b) => b.branch === branchFilter);

  const handleRetry = () => {
    window.dispatchEvent(new CustomEvent('ws:reload-coffin-store'));
  };

  if (loading) {
    return (
      <div style={{ padding: 30, textAlign: 'center', color: C.muted }}>
        <span style={{ fontSize: 22, marginRight: 8 }} role="img" aria-label="loading">📦</span>
        <div style={{ marginTop: 8, fontWeight: 600 }}>Loading coffin store across branches…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 30, textAlign: 'center', color: C.red }}>
        <span style={{ fontSize: 22, marginRight: 8 }} role="img" aria-label="error">⚠️</span>
        <div style={{ marginTop: 8, fontWeight: 600 }}>{error}</div>
        <button onClick={handleRetry} style={{ marginTop: 12, padding: '8px 16px', background: C.navy, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: "'Source Sans Pro', -apple-system, BlinkMacSystemFont, sans-serif", color: C.ink }}>
      <header style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 24 }} role="img" aria-label="coffin">⚰️</span>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Coffin Store Tracker</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>Cross-branch inventory and low-stock watch</p>
        </div>
      </header>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Total Coffins in Stock" value={totalCoffins} sub={`${totalBranches} branch${totalBranches === 1 ? '' : 's'}`} color={C.navy} bg={C.navyBg} icon="📦" />
        <KpiCard label="Branches Tracked" value={totalBranches} sub="All branches reporting" color={C.blue} bg={C.blueBg} icon="🏢" />
        <KpiCard label="Low Stock (≤5)" value={lowStockCoffins.length} sub={outOfStock.length > 0 ? `${outOfStock.length} out of stock` : 'All replenished'} color={lowStockCoffins.length ? C.amber : C.green} bg={lowStockCoffins.length ? C.amberBg : C.greenBg} icon="⚠️" />
        <KpiCard label="Most Moving" value={mostMoving.length ? mostMoving[0].qty : 0} sub={mostMoving.length ? mostMoving[0].name : '—'} color={C.green} bg={C.greenBg} icon="🔥" />
      </div>

      {/* ── Low stock alerts ───────────────────────────────────────────── */}
      {lowStockCoffins.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }} role="img" aria-label="alert">⚠️</span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Low Stock Alerts</h2>
          </div>
          <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 8, background: C.card }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f9fafb', borderBottom: `1px solid ${C.line}` }}>
                  <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Coffin</th>
                  <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Type / Color / Size</th>
                  <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Branch</th>
                  <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStockCoffins.map((c) => (
                  <tr key={`${c.coffin_id}-${c.branch_id}`} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{c.name || c.type || 'Unnamed'}</td>
                    <td style={{ padding: 10, color: C.muted }}>{`${c.type || ''} · ${c.color || '—'} · ${c.size || '—'}`}</td>
                    <td style={{ padding: 10 }}>{c.branch_name || c.branch_slug || c.branch_id || '—'}</td>
                    <td style={{ padding: 10, fontWeight: 700, color: Number(c.quantity) === 0 ? C.red : C.amber }}>{Number(c.quantity || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Most moving coffins ────────────────────────────────────────── */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }} role="img" aria-label="trending">🔥</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Most Moving Coffins</h2>
        </div>
        <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 8, background: C.card }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f9fafb', borderBottom: `1px solid ${C.line}` }}>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Coffin</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Specs</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Units Booked</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Branches</th>
              </tr>
            </thead>
            <tbody>
              {mostMoving.length > 0 ? (
                mostMoving.map((m, i) => (
                  <tr key={i} style={{ borderBottom: i < mostMoving.length - 1 ? `1px solid ${C.line}` : 'none' }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{i + 1}. {m.name}</td>
                    <td style={{ padding: 10, color: C.muted }}>{`${m.color || '—'} · ${m.size || '—'}`}</td>
                    <td style={{ padding: 10, fontWeight: 700, color: C.green }}>{m.qty}</td>
                    <td style={{ padding: 10 }}>{m.branches}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={{ padding: 20, textAlign: 'center', color: C.muted }} colspan="4">No booking data yet — most-moving list will populate as coffins are ordered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Today's Coffin Bookings */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16 }} role="img" aria-label="today">📅</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Today's Coffin Bookings</h2>
          <input
            type="text"
            placeholder="Search by coffin name, client name, or booked by…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.line}`, fontSize: 12, background: '#fff' }}
          />
          {todayLoading && <span style={{ fontSize: 12, color: C.muted }}>Loading…</span>}
        </div>
        <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 8, background: C.card }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f9fafb', borderBottom: `1px solid ${C.line}` }}>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Coffin</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Client / Deceased</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Booked By</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Service Date</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Amount</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Deposit</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Balance</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Paid</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {todayBookings.length > 0 ? (
                todayBookings.map((b) => {
                  const amount = Number(b.amount || 0);
                  const deposit = Number(b.deposit || 0);
                  const balance = amount - deposit;
                  const paid = b.paid === 1 || b.paid === true;
                  return (
                    <tr key={b.order_id || b.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{b.coffin_name || b.type || '—'}</td>
                      <td style={{ padding: 10, color: C.muted }}>{`${b.booked_by || b.client_name || '—'} · ${b.booked_for || b.deceased_name || '—'}`}</td>
                      <td style={{ padding: 10 }}>{b.booked_by || b.client_name || '—'}</td>
                      <td style={{ padding: 10 }}>{b.service_date || '—'}</td>
                      <td style={{ padding: 10, fontWeight: 600, color: C.navy }}>{currency(amount)}</td>
                      <td style={{ padding: 10, fontWeight: 600, color: C.green }}>{currency(deposit)}</td>
                      <td style={{ padding: 10, fontWeight: 700, color: balance > 0 ? C.amber : C.green }}>{currency(balance)}</td>
                      <td style={{ padding: 10, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: paid ? C.green : C.muted }}>{paid ? 'Yes' : 'No'}</td>
                      <td style={{ padding: 10, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.ink }}>{b.status || 'active'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td style={{ padding: 20, textAlign: 'center', color: C.muted }} colspan="9">No coffin bookings found for today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Per-branch inventory ───────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }} role="img" aria-label="branch">🏢</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Coffins by Branch</h2>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.line}`, fontSize: 12, background: '#fff' }}
          >
            <option value="all">All branches</option>
            {byBranch.map((b) => <option key={b.branch} value={b.branch}>{b.branch}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 8, background: C.card }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f9fafb', borderBottom: `1px solid ${C.line}` }}>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Branch</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Coffin Types</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Total Units</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Low Stock</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Top Coffin</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.length > 0 ? (
                filteredBranches.map((b) => {
                  const top = b.items
                    .sort((a, z) => (Number(z.quantity || 0) - Number(a.quantity || 0)))[0];
                  return (
                    <tr key={b.branch} style={{ borderBottom: `1px solid ${C.line}` }}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{b.branch}</td>
                      <td style={{ padding: 10 }}>{b.count}</td>
                      <td style={{ padding: 10, fontWeight: 700 }}>{b.total}</td>
                      <td style={{ padding: 10, fontWeight: 600, color: b.lowStock ? C.amber : C.green }}>{b.lowStock}</td>
                      <td style={{ padding: 10, color: C.muted, fontSize: 12 }}>{top ? `${top.name || top.type || '—'}` : '—'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td style={{ padding: 20, textAlign: 'center', color: C.muted }} colspan="5">No branches match this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Detail table ───────────────────────────────────────────────── */}
      <section style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }} role="img" aria-label="list">📋</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>All Coffin Inventory</h2>
        </div>
        <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 8, background: C.card }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f9fafb', borderBottom: `1px solid ${C.line}` }}>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Branch</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Coffin</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Color / Size</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Price</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Stock</th>
                <th style={{ padding: 10, color: C.muted, fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {coffins.length > 0 ? (
                coffins.map((c) => {
                  const q = Number(c.quantity || 0);
                  const status = q === 0 ? 'Out of Stock' : q <= 5 ? 'Low Stock' : 'In Stock';
                  const statusColor = q === 0 ? C.red : q <= 5 ? C.amber : C.green;
                  return (
                    <tr key={`${c.coffin_id}-${c.branch_id}`} style={{ borderBottom: `1px solid ${C.line}` }}>
                      <td style={{ padding: 10 }}>{c.branch_name || c.branch_slug || c.branch_id || '—'}</td>
                      <td style={{ padding: 10, fontWeight: 600 }}>{c.name || c.type || 'Unnamed Coffin'}</td>
                      <td style={{ padding: 10, color: C.muted }}>{`${c.color || '—'} / ${c.size || '—'}`}</td>
                      <td style={{ padding: 10 }}>{currency(c.exact_price || c.price || 0)}</td>
                      <td style={{ padding: 10, fontWeight: 700, color: statusColor }}>{q}</td>
                      <td style={{ padding: 10, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: statusColor }}>{status}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td style={{ padding: 20, textAlign: 'center', color: C.muted }} colspan="6">No coffin inventory found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value, sub, color, bg, icon }) {
  return (
    <div style={{ background: bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 20 }} role="img" aria-hidden="true">{icon}</span>
      <div>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.muted, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: color }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>}
      </div>
    </div>
  );
}

