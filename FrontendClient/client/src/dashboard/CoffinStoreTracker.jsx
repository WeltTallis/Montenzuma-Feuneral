// CoffinStoreTracker.jsx
// ═══════════════════════════════════════════════════════════════════════════
// Cross-branch coffin store tracker for the dashboard — redesigned.
//
//  • 🧊 Cool emoji chars + a clean "good color" system (mirrors coffininventory)
//  • 🏢⚰️🔗 REAL relationships : branch → coffin → booking → client/deceased,
//    plus cross-branch TRANSFER suggestions (surplus branch → deficit branch)
//  • 🗂️ 3-BRANCH STACK : branches render as stacked columns, 3 at a time,
//    with prev/next paging when the org has more than 3 branches
//  • 🎨 Every inventory row/chip is colour-coded by stock health
//
// Self-contained: fetches from CoffinAPI (cross-branch endpoint) and computes
// all derived metrics on the client. No new dependencies required.
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react';
import { CoffinAPI } from '../api/coffinApi';
import { getTenantSlug } from '../utils/globalAuth';

// ── Palette (good colours, same spirit as components/coffins/coffininventory) ──
const C = {
  // surfaces
  ink: '#0f172a',
  muted: '#64748b',
  faint: '#94a3b8',
  line: '#e2e8f0',
  lineSoft: '#f1f5f9',
  card: '#ffffff',
  bg: '#f8fafc',

  // brand
  primary: '#1d4ed8',
  primaryDark: '#1e3a8a',
  primarySoft: '#eff6ff',

  // status — the "good colours" every inventory chip uses
  success: '#059669', successDark: '#15803d', successBg: '#ecfdf5', successRing: '#a7f3d0',
  warning: '#d97706', warningDark: '#b45309', warningBg: '#fffbeb', warningRing: '#fde68a',
  danger: '#dc2626', dangerDark: '#b91c1c', dangerBg: '#fef2f2', dangerRing: '#fecaca',
  info: '#0284c7', infoBg: '#e0f2fe',
  purple: '#7c3aed', purpleBg: '#f5f3ff', purpleRing: '#ddd6fe',
};

// Accent themes for the branch stack columns (cycled per branch).
const BRANCH_ACCENTS = [
  { key: 'blue',   color: '#1d4ed8', soft: '#eff6ff', ring: '#bfdbfe', grad: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', emoji: '🏢' },
  { key: 'green',  color: '#047857', soft: '#ecfdf5', ring: '#a7f3d0', grad: 'linear-gradient(135deg,#047857,#10b981)', emoji: '🏬' },
  { key: 'purple', color: '#6d28d9', soft: '#f5f3ff', ring: '#ddd6fe', grad: 'linear-gradient(135deg,#5b21b6,#a78bfa)', emoji: '🏛️' },
  { key: 'rose',   color: '#be185d', soft: '#fff1f2', ring: '#fecdd3', grad: 'linear-gradient(135deg,#9f1239,#fb7185)', emoji: '🏩' },
  { key: 'amber',  color: '#b45309', soft: '#fffbeb', ring: '#fde68a', grad: 'linear-gradient(135deg,#92400e,#f59e0b)', emoji: '🏦' },
];

const pad = (n) => String(n).padStart(2, '0');
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const currency = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 });
};
const branchKeyOf = (c) => c.branch_name || c.branch_slug || (c.branch_id != null ? `Branch ${c.branch_id}` : 'Unknown Branch');

// ── Stock health → good colour + emoji for every inventory chip ────────────
const stockStatus = (q) => {
  const n = Number(q || 0);
  if (n <= 0) return { label: 'Out of Stock', color: C.danger, dark: C.dangerDark, bg: C.dangerBg, ring: C.dangerRing, emoji: '💀', pct: 0 };
  if (n <= 5) return { label: 'Low Stock', color: C.warning, dark: C.warningDark, bg: C.warningBg, ring: C.warningRing, emoji: '⚠️', pct: Math.min(45, 10 + n * 7) };
  return { label: 'In Stock', color: C.success, dark: C.successDark, bg: C.successBg, ring: C.successRing, emoji: '✅', pct: Math.min(100, 55 + n * 2) };
};

// ── Booking status → colour + emoji ────────────────────────────────────────
const bookingStatus = (status) => {
  const s = String(status || 'pending').toLowerCase();
  const map = {
    pending:   { label: 'Pending',   color: C.warning, bg: C.warningBg, emoji: '🕒' },
    booked:    { label: 'Approved',  color: C.success, bg: C.successBg, emoji: '✅' },
    approved:  { label: 'Approved',  color: C.success, bg: C.successBg, emoji: '✅' },
    completed: { label: 'Completed', color: C.primary, bg: C.primarySoft, emoji: '🏁' },
    delivered: { label: 'Delivered', color: C.primary, bg: C.primarySoft, emoji: '🚚' },
    cancelled: { label: 'Cancelled', color: C.muted,   bg: C.lineSoft,  emoji: '🚫' },
    rejected:  { label: 'Rejected',  color: C.danger,  bg: C.dangerBg,  emoji: '⛔' },
  };
  const normalized = ['transferring', 'transit', 'in-transit', 'in_transit'].includes(s) ? 'approved' : s;
  return map[normalized] || map.pending;
};

// ── Shared inline styles ────────────────────────────────────────────────────
const styles = {
  wrap: { padding: 24, fontFamily: "'Inter','Source Sans Pro',-apple-system,BlinkMacSystemFont,sans-serif", color: C.ink, maxWidth: 1400, margin: '0 auto' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' },
  h2: { margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' },
  panel: { border: `1px solid ${C.line}`, borderRadius: 14, background: C.card, boxShadow: '0 1px 2px rgba(15,23,42,0.04)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '11px 12px', textAlign: 'left', background: C.lineSoft, borderBottom: `1px solid ${C.line}`, color: C.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' },
  td: { padding: '11px 12px', borderBottom: `1px solid ${C.lineSoft}`, verticalAlign: 'middle' },
  chip: (color, bg) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, color, background: bg, whiteSpace: 'nowrap' }),
  pillBtn: (bg, color = '#fff') => ({ padding: '7px 14px', borderRadius: 8, border: 'none', background: bg, color, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'filter .15s ease' }),
  emptyCell: { padding: '26px 12px', textAlign: 'center', color: C.muted },
};

// Small reusable KPI tile.
function KpiCard({ emoji, label, value, sub, color, bg }) {
  return (
    <div style={{ background: bg, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, minWidth: 150, flex: '1 1 150px' }}>
      <span style={{ fontSize: 24, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.08))' }} aria-hidden> {emoji} </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.muted, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: C.faint, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

// Rounded status chip used across every inventory / booking row.
function Chip({ color, bg, children }) {
  return <span style={styles.chip(color, bg)}>{children}</span>;
}

// A thin coloured stock-health meter.
function HealthBar({ pct, color, ring }) {
  return (
    <div style={{ height: 7, borderRadius: 999, background: ring, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.max(4, Math.min(100, pct))}%`, borderRadius: 999, background: color, transition: 'width .5s ease' }} />
    </div>
  );
}

// A single stacked column in the 3-branch store view (accent-themed header +
// health summary chips + colour-coded inventory rows).
function BranchColumn({ b, accent }) {
  const healthPct = b.items.length ? Math.round((b.healthy / b.items.length) * 100) : 0;
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 16, background: C.card, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column' }}>
      {/* Accent header: branch name + totals */}
      <div style={{ background: accent.grad, color: '#fff', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{accent.emoji}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.branch}</div>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>{b.items.length} coffin types · {b.total} units</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{currency(b.value)}</div>
            <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>stock value</div>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <HealthBar pct={healthPct} color="#fff" ring="rgba(255,255,255,.25)" />
        </div>
      </div>

      {/* Health summary chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '10px 12px', borderBottom: `1px solid ${C.lineSoft}`, background: C.bg }}>
        <Chip color={C.successDark} bg={C.successBg}>✅ {b.healthy} healthy</Chip>
        <Chip color={C.warningDark} bg={C.warningBg}>⚠️ {b.lowStock} low</Chip>
        <Chip color={C.dangerDark} bg={C.dangerBg}>💀 {b.out} out</Chip>
      </div>

      {/* Colour-coded inventory rows */}
      <div style={{ padding: 6, flex: 1 }}>
        {b.items.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: C.muted, fontSize: 12 }}>No coffins in this store.</div>
        ) : (
          b.items.map((c, idx) => {
            const st = stockStatus(c.quantity);
            return (
              <div key={c.coffin_id ?? idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10 }}>
                <span style={{ fontSize: 15 }} className="cst-icon">⚰️</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name || c.type || 'Unnamed coffin'}</div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                    {[c.color, c.size].filter(Boolean).join(' · ') || '—'} · {currency(c.exact_price || c.price)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Chip color={st.color} bg={st.bg}>{st.emoji} {c.quantity || 0}</Chip>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function CoffinStoreTracker() {
  const [coffins, setCoffins] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Today's bookings tab
  const [todayBookings, setTodayBookings] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 3-branch stack paging
  const [branchPage, setBranchPage] = useState(0);

  const tenantSlug = getTenantSlug();
  const parentSlug = tenantSlug ? tenantSlug.split('-').slice(0, -1).join('-') || tenantSlug : '';

  // ── Load cross-branch inventory + orders ──────────────────────────────────
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
        if (!cancelled) setError(err?.friendlyMessage || err?.message || 'Failed to load coffin store data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [parentSlug, tenantSlug]);

  // ── Load today's bookings ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const loadToday = async () => {
      setTodayLoading(true);
      try {
        const params = { tenant_slug: parentSlug || tenantSlug, today: '1' };
        if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
        const ord = await CoffinAPI.getTodayBookings(params);
        const orders = Array.isArray(ord?.data) ? ord.data : [];
        if (!cancelled) setTodayBookings(orders);
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

    // ── Derived: branch groups (relationship: branch → coffins) ──────────────
  const byBranch = useMemo(() => {
    const map = new Map();
    coffins.forEach((c) => {
      const b = branchKeyOf(c);
      if (!map.has(b)) map.set(b, []);
      map.get(b).push(c);
    });
    return Array.from(map.entries())
      .map(([branch, items]) => {
        const total = items.reduce((s, c) => s + (Number(c.quantity) || 0), 0);
        const value = items.reduce((s, c) => s + (Number(c.exact_price || c.price || 0) * (Number(c.quantity) || 0)), 0);
        const lowStock = items.filter((c) => { const q = Number(c.quantity || 0); return q > 0 && q <= 5; }).length;
        const out = items.filter((c) => Number(c.quantity || 0) <= 0).length;
        const healthy = items.length - lowStock - out;
        return { branch, items, total, value, lowStock, out, healthy };
      })
      .sort((a, b) => b.total - a.total);
  }, [coffins]);

  // ── Derived: coffin → bookings relationship map ──────────────────────────
  const bookingsByCoffin = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => {
      const id = b.coffin_id != null ? String(b.coffin_id) : null;
      if (!id) return;
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(b);
    });
    return map;
  }, [bookings]);

  // ── Derived: enriched coffins with real booking relationships ────────────
  const enriched = useMemo(
    () =>
      coffins.map((c) => {
        const id = c.coffin_id != null ? String(c.coffin_id) : null;
        const related = id ? bookingsByCoffin.get(id) || [] : [];
        const bookedQty = related.reduce((s, b) => s + (Number(b.quantity) || 1), 0);
        const revenue = related.reduce((s, b) => s + (Number(b.amount) || 0), 0);
        const lastDate = related.map((b) => b.service_date).filter(Boolean).sort().slice(-1)[0] || null;
        return { ...c, _related: related, _bookedQty: bookedQty, _revenue: revenue, _lastDate: lastDate, _hot: related.length > 0 };
      }),
    [coffins, bookingsByCoffin]
  );

  // ── Derived: cross-branch TRANSFER suggestions (surplus → deficit) ───────
  const transferSuggestions = useMemo(() => {
    const byName = new Map();
    enriched.forEach((c) => {
      const name = (c.name || c.type || '').toLowerCase().trim();
      if (!name) return;
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(c);
    });
    const suggestions = [];
    byName.forEach((rows, name) => {
      const deficits = rows.filter((r) => Number(r.quantity || 0) <= 2);
      const surpluses = rows.filter((r) => Number(r.quantity || 0) > 2);
      deficits.forEach((d) => {
        const s = surpluses.find(
          (x) => branchKeyOf(x) !== branchKeyOf(d) && Number(x.quantity || 0) > Number(d.quantity || 0)
        );
        if (s) suggestions.push({ name: d.name || d.type, from: s, to: d });
      });
    });
    return suggestions.slice(0, 6);
  }, [enriched]);

  // ── Derived: hot / most-moving coffins ────────────────────────────────────
  const hotCoffins = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => {
      const key = `${b.coffin_name || b.type || 'Unknown'}|${b.color || ''}|${b.size || ''}`;
      const cur = map.get(key) || { name: b.coffin_name || b.type || 'Unknown', color: b.color || '', size: b.size || '', qty: 0, branches: new Set(), revenue: 0 };
      cur.qty += Number(b.quantity || 1);
      cur.revenue += Number(b.amount || 0);
      if (b.branch_name) cur.branches.add(b.branch_name);
      else if (b.branch_id != null) cur.branches.add(String(b.branch_id));
      map.set(key, cur);
    });
    return Array.from(map.values())
      .map((m) => ({ ...m, branches: m.branches.size }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);
  }, [bookings]);

  // ── Derived: top-level KPIs ───────────────────────────────────────────────
  const totalUnits = enriched.reduce((s, c) => s + (Number(c.quantity) || 0), 0);
  const totalValue = enriched.reduce((s, c) => s + (Number(c.exact_price || c.price || 0) * (Number(c.quantity) || 0)), 0);
  const totalBranches = byBranch.length;
  const lowStock = enriched.filter((c) => { const q = Number(c.quantity || 0); return q > 0 && q <= 5; });
  const outOfStock = enriched.filter((c) => Number(c.quantity || 0) <= 0);
  const todayRevenue = todayBookings.reduce((s, b) => s + (Number(b.amount) || 0), 0);

  // ── 3-branch stack paging ─────────────────────────────────────────────────
  const PER_PAGE = 3;
  const totalPages = Math.max(1, Math.ceil(byBranch.length / PER_PAGE));
  const safePage = Math.min(branchPage, totalPages - 1);
  const visibleBranches = byBranch.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  const handleRetry = () => window.dispatchEvent(new CustomEvent('ws:reload-coffin-store'));

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ ...styles.wrap, textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: 44, animation: 'cst-bob 1.4s ease-in-out infinite' }}>⚰️</div>
        <div style={{ marginTop: 12, fontWeight: 700, color: C.muted }}>Loading coffin store across branches…</div>
        <style>{`@keyframes cst-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.wrap, textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: 44 }}>🚨</div>
        <div style={{ marginTop: 12, fontWeight: 700, color: C.danger }}>{error}</div>
        <button onClick={handleRetry} style={{ ...styles.pillBtn(C.primary), marginTop: 16 }}>🔄 Retry</button>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <style>{`
        .cst-th{ cursor:default }
        @keyframes cst-pop{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
        @keyframes cst-glow{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.18)}50%{box-shadow:0 0 0 8px rgba(37,99,235,0)}}
        .cst-row:hover{ background:${C.lineSoft} }
        .cst-icon{ transition:transform .15s ease }
        .cst-icon:hover{ transform:translateY(-2px) scale(1.15) }
        @media (max-width: 720px){ .cst-scroll{ overflow-x:auto } }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 52, height: 52, borderRadius: 15, background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: '0 8px 18px rgba(30,58,138,.35)' }}>⚰️</div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            Coffin Store Tracker
            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: C.primarySoft, color: C.primary }}>LIVE</span>
          </h1>
          <p style={{ margin: '2px 0 0', color: C.muted, fontSize: 13, fontWeight: 600 }}>
            ⚰️ × 🏢 × 🔗 real cross-branch relationships · stacked 3 branches at a time
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => window.dispatchEvent(new CustomEvent('ws:reload-coffin-store'))} style={styles.pillBtn(C.primaryDark)}>🔄 Refresh</button>
        </div>
      </header>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 8 }}>
        <KpiCard emoji="📦" label="Total Units" value={totalUnits} sub={`${enriched.length} coffin types`} color={C.primaryDark} bg={C.primarySoft} />
        <KpiCard emoji="🏢" label="Branches" value={totalBranches} sub="live stores" color={C.info} bg={C.infoBg} />
        <KpiCard emoji="💰" label="Stock Value" value={currency(totalValue)} sub="at sell price" color={C.successDark} bg={C.successBg} />
        <KpiCard emoji="⚠️" label="Low Stock" value={lowStock.length} sub="reorder soon" color={C.warningDark} bg={C.warningBg} />
        <KpiCard emoji="💀" label="Out of Stock" value={outOfStock.length} sub="unavailable" color={C.dangerDark} bg={C.dangerBg} />
        <KpiCard emoji="📅" label="Today's Bookings" value={todayBookings.length} sub={currency(todayRevenue)} color={C.purple} bg={C.purpleBg} />
      </div>

      {/* ── Low-stock / transfer alert banner ───────────────────────────── */}
      {(lowStock.length > 0 || outOfStock.length > 0 || transferSuggestions.length > 0) && (
        <div style={{ margin: '14px 0 20px', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'linear-gradient(90deg,#fffbeb,#fef2f2)', border: '1px solid #fde68a' }}>
          <span style={{ fontSize: 22 }}>🚨</span>
          <div style={{ flex: 1, fontSize: 13, color: C.warningDark, fontWeight: 600 }}>
            <strong style={{ fontWeight: 800 }}>Stock watch:</strong>{' '}
            {lowStock.length} low · {outOfStock.length} out of stock
            {transferSuggestions.length > 0 && <> · {transferSuggestions.length} transfer opportunit{transferSuggestions.length === 1 ? 'y' : 'ies'} found</>}
          </div>
        </div>
      )}

      {/* ── 🗂️ 3-BRANCH STACK ────────────────────────────────────────────── */}
      <section style={{ marginBottom: 26 }}>
        <div style={{ ...styles.sectionTitle, justifyContent: 'space-between' }}>
          <div style={{ ...styles.sectionTitle, marginBottom: 0 }}>
            <span style={{ fontSize: 17 }}>🗂️</span>
            <h2 style={styles.h2}>3-Branch Stack</h2>
            {totalPages > 1 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>page {safePage + 1}/{totalPages}</span>
            )}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setBranchPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} style={{ ...styles.pillBtn(safePage === 0 ? C.line : C.primaryDark), opacity: safePage === 0 ? 0.5 : 1 }}>‹ Prev</button>
              <button onClick={() => setBranchPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} style={{ ...styles.pillBtn(safePage >= totalPages - 1 ? C.line : C.primaryDark), opacity: safePage >= totalPages - 1 ? 0.5 : 1 }}>Next ›</button>
            </div>
          )}
        </div>

        {visibleBranches.length === 0 ? (
          <div style={{ ...styles.panel, padding: 40, textAlign: 'center', color: C.muted }}>⚰️ No coffin inventory found.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            {visibleBranches.map((b, i) => (
              <BranchColumn key={b.branch} b={b} accent={BRANCH_ACCENTS[(safePage * PER_PAGE + i) % BRANCH_ACCENTS.length]} />
            ))}
          </div>
        )}
      </section>

      {/* ── 🔗 REAL RELATIONSHIPS: transfers + coffin↔booking links ─────── */}
      <section style={{ marginBottom: 26 }}>
        <div style={styles.sectionTitle}>
          <span style={{ fontSize: 17 }}>🔗</span>
          <h2 style={styles.h2}>Real Relationships</h2>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>branch · coffin · booking · client</span>
        </div>

        {/* Cross-branch transfer suggestions */}
        {transferSuggestions.length > 0 && (
          <div style={{ ...styles.panel, marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15 }}>🔄</span>
              <strong style={{ fontSize: 13 }}>Transfer suggestions</strong>
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>move surplus → deficit branch</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10, padding: 12 }}>
              {transferSuggestions.map((t, i) => (
                <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, background: C.bg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>⚰️</span>
                    <strong style={{ fontSize: 13, flex: 1 }}>{t.name}</strong>
                    <Chip color={C.purple} bg={C.purpleBg}>🔄 transfer</Chip>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
                    <Chip color={C.successDark} bg={C.successBg}>📦 {branchKeyOf(t.from)} · {Number(t.from.quantity || 0)}</Chip>
                    <span style={{ color: C.muted, fontWeight: 800 }}>→</span>
                    <Chip color={C.dangerDark} bg={C.dangerBg}>📍 {branchKeyOf(t.to)} · {Number(t.to.quantity || 0)}</Chip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coffin → bookings → client relationship table */}
        <div style={styles.panel}>
          <div style={{ overflowX: 'auto' }} className="cst-scroll">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>⚰️ Coffin</th>
                  <th style={styles.th}>🏢 Branch</th>
                  <th style={styles.th}>🎨 Color / Size</th>
                  <th style={styles.th}>💰 Price</th>
                  <th style={styles.th}>📦 Stock</th>
                  <th style={styles.th}>🔗 Bookings</th>
                  <th style={styles.th}>📅 Last Booked</th>
                  <th style={styles.th}>💰 Booked Value</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {enriched.length > 0 ? (
                  [...enriched]
                    .sort((a, b) => (b._related.length - a._related.length) || (Number(b.quantity || 0) - Number(a.quantity || 0)))
                    .map((c) => {
                      const q = Number(c.quantity || 0);
                      const st = stockStatus(q);
                      const bk = c._related.length;
                      return (
                        <tr key={`${c.coffin_id}-${c.branch_id}`} className="cst-row">
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16 }} className="cst-icon">{st.emoji}</span>
                              <div>
                                <div style={{ fontWeight: 700 }}>{c.name || c.type || 'Unnamed Coffin'}</div>
                                {c._hot && <span style={{ fontSize: 10, fontWeight: 800, color: C.danger }}>🔥 moving</span>}
                              </div>
                            </div>
                          </td>
                          <td style={styles.td}><Chip color={C.primary} bg={C.primarySoft}>🏢 {branchKeyOf(c)}</Chip></td>
                          <td style={{ ...styles.td, color: C.muted }}>{c.color || '—'} / {c.size || '—'}</td>
                          <td style={{ ...styles.td, fontWeight: 600 }}>{currency(c.exact_price || c.price || 0)}</td>
                          <td style={{ ...styles.td, fontWeight: 800, color: st.color }}>{q}</td>
                          <td style={styles.td}>
                            {bk > 0
                              ? <Chip color={C.purple} bg={C.purpleBg}>🔗 {bk} linked</Chip>
                              : <span style={{ color: C.faint, fontSize: 12 }}>— none</span>}
                          </td>
                          <td style={{ ...styles.td, color: C.muted }}>{c._lastDate || '—'}</td>
                          <td style={{ ...styles.td, fontWeight: 600, color: c._revenue > 0 ? C.successDark : C.faint }}>{c._revenue > 0 ? currency(c._revenue) : '—'}</td>
                          <td style={styles.td}><Chip color={st.color} bg={st.bg}>{st.emoji} {st.label}</Chip></td>
                        </tr>
                      );
                    })
                ) : (
                  <tr><td style={styles.emptyCell} colSpan={9}>No coffin inventory found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 🔥 HOT / most-moving coffins ─────────────────────────────────── */}
      {hotCoffins.length > 0 && (
        <section style={{ marginBottom: 26 }}>
          <div style={styles.sectionTitle}>
            <span style={{ fontSize: 17 }}>🔥</span>
            <h2 style={styles.h2}>Most Moving Coffins</h2>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>ranked by booked quantity</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
            {hotCoffins.map((h, i) => (
              <div key={i} style={{ ...styles.panel, padding: 14, borderTop: `3px solid ${i === 0 ? C.danger : i === 1 ? C.warning : C.primary}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔥'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{[h.color, h.size].filter(Boolean).join(' · ') || '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: C.primaryDark }}>{h.qty}</span>
                  <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>units booked</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>🏢 {h.branches} branch{h.branches === 1 ? '' : 'es'} · 💰 {currency(h.revenue)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 📅 TODAY'S BOOKINGS ──────────────────────────────────────────── */}
      <section>
        <div style={{ ...styles.sectionTitle, justifyContent: 'space-between' }}>
          <div style={{ ...styles.sectionTitle, marginBottom: 0 }}>
            <span style={{ fontSize: 17 }}>📅</span>
            <h2 style={styles.h2}>Today's Bookings</h2>
            {todayLoading && <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>loading…</span>}
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔎 Search client / deceased / coffin…"
            style={{ padding: '8px 12px', borderRadius: 9, border: `1px solid ${C.line}`, fontSize: 12, minWidth: 240, outline: 'none', background: C.card }}
          />
        </div>

        <div style={styles.panel}>
          <div style={{ overflowX: 'auto' }} className="cst-scroll">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>⚰️ Coffin</th>
                  <th style={styles.th}>👤 Client · Deceased</th>
                  <th style={styles.th}>📅 Service Date</th>
                  <th style={styles.th}>💰 Amount</th>
                  <th style={styles.th}>💳 Deposit</th>
                  <th style={styles.th}>⚖️ Balance</th>
                  <th style={styles.th}>✅ Paid</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayBookings.length > 0 ? (
                  todayBookings.map((b) => {
                    const amount = Number(b.amount || 0);
                    const deposit = Number(b.deposit || 0);
                    const balance = amount - deposit;
                    const paid = b.paid === 1 || b.paid === true;
                    const st = bookingStatus(b.status);
                    return (
                      <tr key={b.order_id || b.id} className="cst-row">
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15 }} className="cst-icon">⚰️</span>
                            <span style={{ fontWeight: 700 }}>{b.coffin_name || b.type || '—'}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 600 }}>{b.booked_by || b.client_name || '—'}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>for {b.booked_for || b.deceased_name || '—'}</div>
                        </td>
                        <td style={styles.td}>{b.service_date || '—'}{b.service_time ? <span style={{ color: C.muted }}> · {b.service_time}</span> : null}</td>
                        <td style={{ ...styles.td, fontWeight: 700, color: C.primaryDark }}>{currency(amount)}</td>
                        <td style={{ ...styles.td, fontWeight: 600, color: C.successDark }}>{currency(deposit)}</td>
                        <td style={{ ...styles.td, fontWeight: 800, color: balance > 0 ? C.warningDark : C.successDark }}>{currency(balance)}</td>
                        <td style={styles.td}><Chip color={paid ? C.successDark : C.muted} bg={paid ? C.successBg : C.lineSoft}>{paid ? '✅ Yes' : '⏳ No'}</Chip></td>
                        <td style={styles.td}><Chip color={st.color} bg={st.bg}>{st.emoji} {st.label}</Chip></td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td style={styles.emptyCell} colSpan={8}>📅 No coffin bookings found for today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

// __APPEND__
