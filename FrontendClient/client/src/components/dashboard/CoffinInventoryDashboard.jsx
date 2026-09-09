import React, { useState, useEffect, useMemo } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import api from '../../api/axios';
import { getTenantSlug, getParentTenantSlug, getTenantId } from '../../utils/globalAuth';

const S = { primary: '#1d4ed8', primaryLight: '#eff6ff', bg: '#f8fafc', cardBg: '#ffffff', text: '#1e293b', textMuted: '#64748b', border: '#e2e8f0', success: '#059669', warning: '#d97706', danger: '#dc2626', info: '#0284c7', purple: '#7c3aed' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: S.textMuted };
const tdStyle = { padding: '12px 16px', fontSize: 14, color: S.text };

export default function CoffinInventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coffins, setCoffins] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeBranchTab, setActiveBranchTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const parentSlug = getParentTenantSlug();
      const tenantId = getTenantId();
      const [coffinRes, bookingRes, branchRes] = await Promise.all([
        api.get('/coffins/all-branches', { params: { parent_slug: parentSlug, tenant_id: tenantId || undefined } }),
        api.get('/coffins/orders'),
        api.get(`/tenant/${getTenantSlug()}/branches`),
      ]);
      if (coffinRes.data?.success && Array.isArray(coffinRes.data?.data)) setCoffins(coffinRes.data.data);
      if (bookingRes.data?.success && Array.isArray(bookingRes.data?.data)) setBookings(bookingRes.data.data);
      if (branchRes.data?.success && Array.isArray(branchRes.data?.data)) setBranches(branchRes.data.data.map(b => ({ id: b.branch_id || b.id, name: b.branch_name || b.name || 'Branch' })));
    } catch (err) { setError(err.message); toast.error('Failed to load coffin inventory'); }
    finally { setLoading(false); }
  };

  const coffinsByBranch = useMemo(() => {
    const map = new Map();
    branches.forEach((br) => map.set(br.id, { ...br, coffins: [] }));
    map.set('all', { id: 'all', name: 'All Branches', coffins: [] });
    coffins.forEach((c) => { const brId = c?.branch_id || c?.branch || 'unassigned'; const branch = map.get(brId); if (branch) branch.coffins.push(c); map.get('all').coffins.push(c); });
    return map;
  }, [coffins, branches]);

  const activeBranchData = coffinsByBranch.get(activeBranchTab) || coffinsByBranch.get('all');
  const displayCoffins = activeBranchData?.coffins || [];

  const filteredCoffins = useMemo(() => {
    let result = displayCoffins;
    if (searchQuery) { const q = searchQuery.toLowerCase(); result = result.filter(c => (c.name || c.type || '').toLowerCase().includes(q) || (c.sku || '').toLowerCase().includes(q)); }
    if (statusFilter !== 'all') { result = result.filter(c => { const stock = Number(c.quantity) || 0; if (statusFilter === 'available') return stock > 2; if (statusFilter === 'low') return stock > 0 && stock <= 2; if (statusFilter === 'out') return stock <= 0; return true; }); }
    return result;
  }, [displayCoffins, searchQuery, statusFilter]);

  const branchReservations = useMemo(() => { let result = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'declined'); if (activeBranchTab !== 'all') result = result.filter(b => String(b.branch_id || b.branch) === String(activeBranchTab)); return result.slice(0, 20); }, [bookings, activeBranchTab]);

  const totalStock = coffins.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
  const totalReserved = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'declined').length;
  const lowStockCount = coffins.filter(c => { const s = Number(c.quantity) || 0; return s > 0 && s <= 2; }).length;
  const outOfStockCount = coffins.filter(c => (Number(c.quantity) || 0) <= 0).length;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchData} />;

  return (
    <div style={{ padding: 24, background: S.bg, minHeight: '100%', overflowY: 'auto' }}>
      <ToastContainer position="top-right" />
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: S.text }}>Coffin Inventory Dashboard</h1>
        <p style={{ margin: '4px 0 0', color: S.textMuted, fontSize: 14 }}>Independent inventory for all {branches.length} branches</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard title="Total Stock" value={totalStock} subtitle="All branches" color="#1e3a8a" />
        <StatCard title="Reserved" value={totalReserved} subtitle="Active reservations" color="#7c3aed" />
        <StatCard title="Low Stock" value={lowStockCount} subtitle="Needs restocking" color="#d97706" />
        <StatCard title="Out of Stock" value={outOfStockCount} subtitle="Unavailable" color="#dc2626" />
      </div>
      <BranchTabs branches={coffinsByBranch} activeTab={activeBranchTab} onTabChange={setActiveBranchTab} />
      <InventoryTable coffins={filteredCoffins} bookings={bookings} activeBranch={activeBranchTab} branches={branches} />
      <ReservationsTable bookings={branchReservations} branches={branches} />
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: S.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
        <p style={{ color: S.textMuted }}>Loading coffin inventory...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ color: S.danger, marginBottom: 16 }}>Error: {error}</p>
      <button onClick={onRetry} style={{ padding: '8px 16px', background: S.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Retry</button>
    </div>
  );
}

function StatCard({ title, value, subtitle, color }) {
  return (
    <div style={{ background: S.cardBg, borderRadius: 12, border: `1px solid ${S.border}`, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: S.textMuted, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: S.textMuted }}>{subtitle}</div>
    </div>
  );
}

function BranchTabs({ branches, activeTab, onTabChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
      {Array.from(branches.entries()).map(([brId, brData]) => (
        <button key={brId} onClick={() => onTabChange(brId)} style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${S.border}`, background: activeTab === brId ? S.primary : '#fff', color: activeTab === brId ? '#fff' : S.text, fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          {brData.name}
          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: activeTab === brId ? 'rgba(255,255,255,0.2)' : S.primaryLight, color: activeTab === brId ? '#fff' : S.primary }}>{brData.coffins.length}</span>
        </button>
      ))}
    </div>
  );
}

function Filters({ searchQuery, onSearch, statusFilter, onStatusChange }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      <input type="text" placeholder="Search coffins..." value={searchQuery} onChange={(e) => onSearch(e.target.value)} style={{ padding: '10px 16px', border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 14, flex: 1, minWidth: 200 }} />
      <div style={{ display: 'flex', gap: 4 }}>
        {[['all', 'All'], ['available', 'Available'], ['low', 'Low'], ['out', 'Out']].map(([value, label]) => (
          <button key={value} onClick={() => onStatusChange(value)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${S.border}`, background: statusFilter === value ? S.primary : '#fff', color: statusFilter === value ? '#fff' : S.text, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

function InventoryTable({ coffins, bookings, activeBranch, branches }) {
  const getStockStatus = (stock) => { if (stock <= 0) return { label: 'Out', color: S.danger }; if (stock <= 2) return { label: 'Low', color: S.warning }; return { label: 'Good', color: S.success }; };
  return (
    <div style={{ background: S.cardBg, borderRadius: 12, border: `1px solid ${S.border}`, overflow: 'hidden', marginBottom: 24 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ background: '#f8fafc' }}><th style={thStyle}>Coffin</th><th style={thStyle}>SKU</th><th style={thStyle}>Price</th><th style={thStyle}>Stock</th><th style={thStyle}>Reserved</th><th style={thStyle}>Status</th></tr></thead>
        <tbody>
          {coffins.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: S.textMuted }}>No coffins found.</td></tr>
          ) : coffins.map((c, idx) => {
            const stock = Number(c.quantity) || 0;
            const status = getStockStatus(stock);
            const reservedCount = bookings.filter(b => String(b.coffin_name || b.coffin || '').toLowerCase() === String(c.name || c.type || '').toLowerCase() && b.status !== 'cancelled' && b.status !== 'declined' && (activeBranch === 'all' || String(b.branch_id || b.branch) === String(activeBranch))).length;
            const price = Number(c.exact_price || c.price) || 0;
            return (
              <tr key={c.coffin_id || c.id || idx} style={{ borderTop: `1px solid ${S.border}` }}>
                <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 36, height: 36, borderRadius: 8, background: S.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: S.primary }}>{(c.name || c.type || '?').charAt(0)}</div><span style={{ fontWeight: 600 }}>{c.name || c.type}</span></div></td>
                <td style={tdStyle}>{c.sku || '—'}</td>
                <td style={tdStyle}>{price ? `KES ${price.toLocaleString()}` : '—'}</td>
                <td style={tdStyle}><span style={{ fontWeight: 700 }}>{stock}</span></td>
                <td style={tdStyle}><span style={{ fontWeight: 600, color: reservedCount > 0 ? S.purple : S.textMuted }}>{reservedCount}</span></td>
                <td style={tdStyle}><span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${status.color}20`, color: status.color }}>{status.label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReservationsTable({ bookings, branches }) {
  return (
    <div style={{ background: S.cardBg, borderRadius: 12, border: `1px solid ${S.border}`, overflow: 'hidden' }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${S.border}` }}><h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Reservations</h3><p style={{ margin: '4px 0 0', color: S.textMuted, fontSize: 13 }}>{bookings.length} active reservations</p></div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ background: '#f8fafc' }}><th style={thStyle}>Coffin</th><th style={thStyle}>Branch</th><th style={thStyle}>Deceased</th><th style={thStyle}>Qty</th><th style={thStyle}>Status</th><th style={thStyle}>Date</th></tr></thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: S.textMuted }}>No reservations found.</td></tr>
          ) : bookings.map((b, idx) => (
            <tr key={b.order_id || b.id || idx} style={{ borderTop: `1px solid ${S.border}` }}>
              <td style={tdStyle}>{b.coffin_name || b.coffin || 'Coffin'}</td>
              <td style={tdStyle}>{b.branch_name || branches.find(br => br.id === (b.branch_id || b.branch))?.name || '—'}</td>
              <td style={tdStyle}>{b.deceased_name || b.deceased || b.booked_for || '—'}</td>
              <td style={tdStyle}>{b.quantity || 1}</td>
              <td style={tdStyle}><span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: ['approved', 'booked'].includes(b.status) ? `${S.info}20` : b.status === 'completed' ? `${S.success}20` : `${S.warning}20`, color: ['approved', 'booked'].includes(b.status) ? S.info : b.status === 'completed' ? S.success : S.warning }}>{b.status || 'pending'}</span></td>
              <td style={tdStyle}>{b.created_at ? String(b.created_at).slice(0, 10) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}