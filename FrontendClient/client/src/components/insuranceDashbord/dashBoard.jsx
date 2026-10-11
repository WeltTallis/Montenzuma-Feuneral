import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { insuranceApi } from '../../api/insuranceApi';
import { planFor } from '../insurance/amani/amaniData';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import './crmDashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

const money = value => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(value || 0));
const dateText = value => value ? new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const unwrap = response => response?.data && !Array.isArray(response.data) ? response.data : response;
const rows = response => { const value = unwrap(response); return Array.isArray(value) ? value : value?.policies || value?.claims || []; };

/* 'YYYY-MM-DD' in the browser's timezone — buckets claims/payments onto
   calendar days so the small calendar can dot each day with its activity. */
const dayKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/* "Jan 2024"-style label for the drawer's "Active Member Since …" line. */
const monthYear = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' });
};

const TABS = ['Dashboard', 'Members', 'Claims', 'Payments', 'Analytics', 'Calendar'];

export default function InsuranceDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Dashboard');
  const [members, setMembers] = useState([]);
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [query, setQuery] = useState('');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [azLetter, setAzLetter] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [claimDetail, setClaimDetail] = useState(null);
  const [busyClaim, setBusyClaim] = useState(false);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selectedDay, setSelectedDay] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [policyRes, statsRes, claimRes, analyticsRes] = await Promise.all([
        insuranceApi.listPolicies(), insuranceApi.getStats(), insuranceApi.listClaims(), insuranceApi.getAnalytics()
      ]);
      setMembers(rows(policyRes));
      setStats({ ...unwrap(statsRes), ...unwrap(analyticsRes) });
      setClaims(rows(claimRes));
      try {
        const payRes = await insuranceApi.listPayments({ limit: 100 });
        const list = unwrap(payRes)?.payments || [];
        setPaymentHistory(Array.isArray(list) ? list : []);
      } catch { /* history is advisory — keep dashboard up if it fails */ }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not load data.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // --- Derived data ---
  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? members.filter(m => [m.fullName, m.policyNumber, m.phone, m.coverType, m.idNumber].some(v => String(v || '').toLowerCase().includes(q))) : members;
    if (azLetter) list = list.filter(m => String(m.fullName || '').trim().toUpperCase().startsWith(azLetter));
    return [...list].sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || '')));
  }, [members, query, azLetter]);

  const filteredClaims = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? claims.filter(c => [c.reference, c.deceasedName, c.claimantFullName, c.policyNumber].some(v => String(v || '').toLowerCase().includes(q))) : claims;
  }, [claims, query]);

  const paidTotal = Number(stats?.totalContributions || stats?.paidContributions || 0);
  const activeCount = members.filter(p => String(p.status).toLowerCase() === 'active').length;
  const pendingCount = Number(stats?.pendingClaims ?? claims.filter(c => ['submitted', 'under_review'].includes(String(c.status).toLowerCase())).length);
  const defaulterCount = members.filter(p => ['lapsed', 'defaulter'].includes(String(p.status).toLowerCase())).length;

  // --- Handlers ---
  const openProfile = (record, type) => {
    setSelectedRecord(record); setSelectedType(type);
    if (type === 'claim') { setClaimDetail(null); insuranceApi.getClaim(record.claimId).then(v => setClaimDetail(v?.claim || v?.data?.claim || v)).catch(() => {}); }
  };
  const closeProfile = () => { setSelectedRecord(null); setSelectedType(null); setClaimDetail(null); };

  const changeClaimStatus = async (claimId, status) => {
    setBusyClaim(true);
    try {
      await insuranceApi.updateClaimStatus(claimId, status, '');
      await load();
      setSelectedRecord(c => c ? { ...c, status } : c);
      setClaimDetail(c => c ? { ...c, status } : c);
    } catch (err) { alert(err?.message || 'Could not update.'); }
    finally { setBusyClaim(false); }
  };

  const getStatusClass = (status) => {
    const s = String(status).toLowerCase();
    if (['active', 'approved', 'settled', 'paid'].includes(s)) return 'badge-success';
    if (['lapsed', 'defaulter', 'rejected', 'failed'].includes(s)) return 'badge-danger';
    if (['pending', 'submitted', 'under_review'].includes(s)) return 'badge-warning';
    return 'badge-info';
  };

  /* ── ADDITIONS (nothing removed) ──────────────────────────────────────
     A–Z strip: click a letter to list every member whose name starts with
     it ("view all"); letters with no members are dimmed and inert.        */
  const renderAzStrip = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '12px 24px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-section)' }}>
      <button className="btn" style={{ padding: '0', height: '28px', minWidth: '36px', justifyContent: 'center', fontWeight: azLetter ? '400' : '700' }} onClick={() => setAzLetter(null)}>All</button>
      {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(L => {
        const has = memberLetters.has(L);
        const active = azLetter === L;
        return (
          <button
            key={L}
            className="btn"
            style={{ padding: '0', width: '28px', height: '28px', justifyContent: 'center', fontWeight: active ? '700' : '400', background: active ? 'var(--black)' : undefined, color: active ? 'var(--white)' : undefined, opacity: has ? 1 : 0.35, cursor: has ? 'pointer' : 'not-allowed' }}
            onClick={() => { if (has) setAzLetter(active ? null : L); }}
            title={has ? `Show members whose name starts with ${L}` : `No members start with ${L}`}
          >{L}</button>
        );
      })}
    </div>
  );

  const dayColor = (type) => (type === 'claim' ? '#dc2626' : type === 'paid' ? '#0284c7' : type === 'failed' ? '#d97706' : '#777777');

  /* Small calendar for the overview: month nav, today highlight, one dot per
     activity (red claim / blue premium / amber failed payment) and the
     selected day's full activity list underneath. */
  const renderCalendarCard = (compact) => {
    const todayKey = dayKey(today);
    const eventsForSelected = selectedDay ? (calendarEvents[selectedDay] || []) : [];
    return (
      <div className="card">
        <div className="card-header">
          <h3>{calMonthName}</h3>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn" style={{ padding: '4px 10px' }} onClick={() => { setCalMonth(p => { const d = new Date(p.year, p.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; }); setSelectedDay(''); }}>‹</button>
            <button className="btn" style={{ padding: '4px 10px' }} onClick={() => { setCalMonth(p => { const d = new Date(p.year, p.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; }); setSelectedDay(''); }}>›</button>
          </div>
        </div>
        <div style={{ padding: compact ? '16px' : '24px' }}>
          <div className="cal-grid" style={{ marginBottom: '8px', textAlign: 'center', fontWeight: '700', fontSize: '11px', color: 'var(--gray)' }}>
            <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
          </div>
          <div className="cal-grid">
            {calDays.map((day, i) => {
              if (!day) return <div key={`off-${i}`} className="cal-day off"></div>;
              const key = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const evs = calendarEvents[key] || [];
              const isToday = key === todayKey;
              const hasClaim = evs.some(e => e.type === 'claim');
              const isSelected = selectedDay === key;
              return (
                <div
                  key={key}
                  className={`cal-day ${isToday ? 'today' : ''} ${hasClaim ? 'event' : ''}`}
                  style={{ cursor: 'pointer', ...(isSelected ? { outline: '2px solid var(--black)', outlineOffset: '1px' } : {}) }}
                  title={evs.map(e => e.label).join(' · ') || 'No activities'}
                  onClick={() => setSelectedDay(isSelected ? '' : key)}
                >
                  <span>{day}</span>
                  {evs.length > 0 && (
                    <div className="cal-dots">
                      {evs.slice(0, 4).map((e, j) => <div key={j} className="cal-dot" style={{ background: dayColor(e.type) }}></div>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--mid)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%' }}></span> Claim filed</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', background: '#0284c7', borderRadius: '50%' }}></span> Premium received</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', background: '#d97706', borderRadius: '50%' }}></span> Payment failed</div>
          </div>
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '8px' }}>
              {selectedDay ? `Activities on ${selectedDay}` : 'Select a day to see its activities'}
            </div>
            {selectedDay ? (
              eventsForSelected.length ? eventsForSelected.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 0', borderBottom: i < eventsForSelected.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <span style={{ width: '8px', height: '8px', marginTop: '6px', flexShrink: '0', borderRadius: '50%', background: dayColor(e.type) }}></span>
                  <div style={{ minWidth: '0' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--dark)' }}>{e.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{e.detail}</div>
                  </div>
                </div>
              )) : <div className="empty-state" style={{ padding: '8px 0' }}>No activities recorded on this day</div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  // --- Calendar ---
  const calDaysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const calStartOffset = (new Date(calMonth.year, calMonth.month, 1).getDay() + 6) % 7;
  const calDays = [];
  for (let i = 0; i < calStartOffset; i++) calDays.push(null);
  for (let i = 1; i <= calDaysInMonth; i++) calDays.push(i);
  const today = new Date();
  const calMonthName = new Date(calMonth.year, calMonth.month).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });

  // --- Charts ---
  const monthlyData = stats?.monthlyContributions || [];
  const trendData = {
    labels: monthlyData.slice(-6).map(item => new Date(`${item.month}-01`).toLocaleDateString('en-KE', { month: 'short' })),
    datasets: [{ label: 'Premiums Collected', data: monthlyData.slice(-6).map(item => Number(item.amount || 0)), borderColor: '#0a0a0a', backgroundColor: 'rgba(10,10,10,0.05)', fill: true, tension: 0.4, borderWidth: 2 }]
  };
  const barData = {
    labels: monthlyData.slice(-6).map(item => new Date(`${item.month}-01`).toLocaleDateString('en-KE', { month: 'short' })),
    datasets: [{ label: 'Monthly Revenue (KES)', data: monthlyData.slice(-6).map(item => Number(item.amount || 0)), backgroundColor: '#0a0a0a', borderRadius: 4 }]
  };
  const claimsChartData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [{ data: [
      claims.filter(c => ['approved','settled'].includes(String(c.status).toLowerCase())).length,
      claims.filter(c => ['under_review','submitted'].includes(String(c.status).toLowerCase())).length,
      claims.filter(c => String(c.status).toLowerCase() === 'rejected').length,
    ], backgroundColor: ['#16a34a', '#d97706', '#dc2626'], borderWidth: 0 }]
  };
  const statusPieData = {
    labels: ['Active', 'Lapsed', 'Pending'],
    datasets: [{ data: [activeCount, defaulterCount, members.length - activeCount - defaulterCount], backgroundColor: ['#16a34a', '#dc2626', '#d97706'], borderWidth: 0 }]
  };

  // --- Payments from member contributions ---
  const allContributions = useMemo(() => {
    return members.flatMap(m => (m.contributions || []).map(c => ({ ...c, memberName: m.fullName, policyNumber: m.policyNumber }))).sort((a, b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0));
  }, [members]);

  // --- Full attempt history (paid + failed + pending) for ops follow-up ---
  const visiblePayments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return paymentHistory.filter(p => {
      if (paymentFilter !== 'all' && String(p.status || '').toLowerCase() !== paymentFilter) return false;
      if (!q) return true;
      return [p.memberName, p.policyNumber, p.reference, p.phone, p.failureReason].some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [paymentHistory, paymentFilter, query]);
  const failedPayments = useMemo(() => paymentHistory.filter(p => String(p.status || '').toLowerCase() === 'failed'), [paymentHistory]);

  /* ── ADDITIONS (nothing removed) ──────────────────────────────────────
     A–Z index: which letters actually have members, and the members under
     the letter currently picked on the overview / View All tables.        */
  const memberLetters = useMemo(() => new Set(members.map(m => String(m.fullName || '').trim()[0]?.toUpperCase()).filter(Boolean)), [members]);
  const azMembers = useMemo(() => {
    if (!azLetter) return members;
    return members.filter(m => String(m.fullName || '').trim().toUpperCase().startsWith(azLetter))
      .sort((a, b) => String(a.fullName || '').localeCompare(String(b.fullName || '')));
  }, [members, azLetter]);
  /* Daily activity for the small calendar: claims filed (red), premiums
     received (blue), failed payments (amber) — real data, keyed by day.  */
  const calendarEvents = useMemo(() => {
    const map = {};
    const push = (key, ev) => { if (!key) return; (map[key] = map[key] || []).push(ev); };
    claims.forEach(c => push(dayKey(c.createdAt), { type: 'claim', label: `Claim filed — ${c.reference || `#${c.claimId}`}`, detail: `${c.deceasedName || 'Deceased'} · ${String(c.status || 'submitted').replace(/_/g, ' ')}` }));
    paymentHistory.forEach(p => {
      const st = String(p.status || '').toLowerCase();
      push(dayKey(p.createdAt), {
        type: st === 'paid' ? 'paid' : st === 'failed' ? 'failed' : 'pending',
        label: st === 'paid' ? 'Premium received' : st === 'failed' ? 'Payment failed' : 'Payment pending',
        detail: `${p.memberName || p.policyNumber || '—'} · ${money(p.amount)}${p.failureReason ? ` — ${p.failureReason}` : ''}`,
      });
    });
    return map;
  }, [claims, paymentHistory]);

  /* ── ADDITIONS (nothing removed) ──────────────────────────────────────
     Member-drawer figures: this policy's payments from the loaded history,
     the paid total, and an estimated next due date (last payment + 30 days). */
  const memberPayments = selectedRecord && selectedType === 'member'
    ? paymentHistory.filter(p => p.policyNumber === selectedRecord.policyNumber)
    : [];
  const memberContributed = memberPayments
    .filter(p => String(p.status || '').toLowerCase() === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const memberLastPaid = memberPayments.find(p => String(p.status || '').toLowerCase() === 'paid');
  const memberNextPayment = memberLastPaid ? new Date(new Date(memberLastPaid.createdAt).getTime() + 30 * 86400000) : null;

  return (
    <div className="crm-dash">
      {/* ─── TOP NAVIGATION ─── */}
      <header className="topnav">
        <div className="brand">
          <h1>Montenzuma</h1>
          <span>Amani Cover CRM</span>
        </div>
        <nav className="nav-links">
          {TABS.map(t => (
            <div key={t} className={`nav-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</div>
          ))}
        </nav>
        <div className="nav-spacer"></div>
        <div className="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search policy, name, ID..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="avatar">AD</div>
      </header>

      <main className="content">
        {error && <div className="empty-state" style={{color:'var(--danger)'}}>{error} <button onClick={load} className="btn" style={{marginTop:'10px'}}>Retry</button></div>}
        {loading && <div className="empty-state">Loading...</div>}

        {!loading && !error && (
          <>
            {/* ════════════════════════ DASHBOARD TAB ════════════════════════ */}
            {tab === 'Dashboard' && (
              <>
                <div className="page-header">
                  <div><h1 className="page-title">Backend Management</h1><p className="page-subtitle">Overview of Amani Cover operations.</p></div>
                  <button className="btn btn-primary" onClick={() => navigate('/amani/cover/apply')}>+ New Member</button>
                </div>
                <div className="kpi-grid">
                  <div className="kpi-card"><span className="kpi-label">Active Policies</span><span className="kpi-value">{activeCount.toLocaleString()}</span><span className="kpi-sub up">of {members.length} total</span></div>
                  <div className="kpi-card"><span className="kpi-label">Total Contributions</span><span className="kpi-value">{money(paidTotal)}</span><span className="kpi-sub up">Confirmed M-Pesa</span></div>
                  <div className="kpi-card"><span className="kpi-label">Pending Claims</span><span className="kpi-value">{pendingCount}</span><span className="kpi-sub down">Action required</span></div>
                  <div className="kpi-card"><span className="kpi-label">Defaulters</span><span className="kpi-value">{defaulterCount}</span><span className="kpi-sub down">Needs follow-up</span></div>
                </div>
                <div className="grid-2">
                  <div className="card">
                    <div className="card-header"><h3>Recent Members</h3><button className="btn" style={{padding:'6px 12px',fontSize:'12px'}} onClick={() => setTab('Members')}>View All</button></div>
                    {/* ── ADDED: A–Z strip — click a letter to see every member starting with it ── */}
                    {renderAzStrip()}
                    <div className="table-wrap"><table><thead><tr><th>Name</th><th>Policy</th><th>Plan</th><th>Premium</th><th>Status</th></tr></thead><tbody>
                      {(azLetter ? azMembers : members.slice(0, 5)).map(m => (
                        <tr key={m.policyNumber} onClick={() => openProfile(m, 'member')}>
                          <td><div className="mem-info"><div className="mem-avatar">{(m.fullName || 'U').charAt(0)}</div><div><div className="mem-name">{m.fullName || 'Unnamed'}</div><div className="mem-meta">{m.phone || '—'}</div></div></div></td>
                          <td>{m.policyNumber}</td><td>{m.coverType || '—'}</td><td>{money(m.monthlyPremium)}</td>
                          <td><span className={`badge ${getStatusClass(m.status)}`}>{m.status || 'Pending'}</span></td>
                        </tr>
                      ))}
                      {!members.length && <tr><td colSpan="5" className="empty-state">No members yet</td></tr>}
                    </tbody></table></div>
                  </div>
                  <div className="card">
                    <div className="card-header"><h3>Pending Claims</h3><button className="btn" style={{padding:'6px 12px',fontSize:'12px'}} onClick={() => setTab('Claims')}>View All</button></div>
                    <div className="table-wrap"><table><thead><tr><th>Ref</th><th>Deceased</th><th>Status</th></tr></thead><tbody>
                      {claims.filter(c => ['submitted','under_review'].includes(String(c.status).toLowerCase())).slice(0, 5).map(c => (
                        <tr key={c.claimId} onClick={() => openProfile(c, 'claim')}>
                          <td><b>{c.reference || `#${c.claimId}`}</b></td><td>{c.deceasedName || '—'}</td>
                          <td><span className={`badge ${getStatusClass(c.status)}`}>{c.status}</span></td>
                        </tr>
                      ))}
                      {!claims.length && <tr><td colSpan="3" className="empty-state">No claims</td></tr>}
                    </tbody></table></div>
                  </div>
                </div>
                <div className="grid-2-eq">
                  <div className="card"><div className="card-header"><h3>Premium Trend</h3></div><div style={{padding:'24px',height:'300px',position:'relative'}}>{trendData.labels.length > 0 ? <Line data={trendData} options={{responsive:true,maintainAspectRatio:false}} /> : <div className="empty-state">No data</div>}</div></div>
                  <div className="card"><div className="card-header"><h3>Claims Distribution</h3></div><div style={{padding:'24px',height:'300px',position:'relative'}}>{claims.length > 0 ? <Doughnut data={claimsChartData} options={{responsive:true,maintainAspectRatio:false,cutout:'60%'}} /> : <div className="empty-state">No claims</div>}</div></div>
                </div>
                {/* ── ADDED: small activity calendar showing every day's activity ── */}
                <div style={{ marginBottom: '24px' }}>{renderCalendarCard(false)}</div>
                {/* ── ADDED: failed payments — whose cover, how much, why ── */}
                {failedPayments.length > 0 && (
                  <div className="card" style={{ marginBottom: '24px' }}>
                    <div className="card-header">
                      <h3>Failed Payments — Needs Follow-up ({failedPayments.length})</h3>
                      <button className="btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setTab('Payments')}>View All</button>
                    </div>
                    <div className="table-wrap"><table><thead><tr><th>Member</th><th>Policy / Cover</th><th>Amount</th><th>Date</th><th>Why it failed</th><th>Retry</th></tr></thead><tbody>
                      {failedPayments.slice(0, 10).map((p, i) => (
                        <tr key={p.reference || i}>
                          <td><b>{p.memberName || '—'}</b></td>
                          <td>{p.policyNumber || '—'}</td>
                          <td>{money(p.amount)}</td>
                          <td>{dateText(p.createdAt)}</td>
                          <td style={{ maxWidth: '340px' }}>{p.failureReason || 'Not completed.'}</td>
                          <td><span className={`badge ${p.retryable ? 'badge-warning' : 'badge-danger'}`}>{p.retryable ? 'Safe to retry' : 'Contact support'}</span></td>
                        </tr>
                      ))}
                    </tbody></table></div>
                  </div>
                )}
              </>
            )}

            {/* ════════════════════════ MEMBERS TAB ════════════════════════ */}
            {tab === 'Members' && (
              <>
                <div className="page-header">
                  <div><h1 className="page-title">All Members</h1><p className="page-subtitle">{filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found</p></div>
                  <button className="btn btn-primary" onClick={() => navigate('/amani/cover/apply')}>+ New Member</button>
                </div>
                <div className="card">
                  {/* ── ADDED: A–Z strip on View All — click a letter to list all members starting with it ── */}
                  {renderAzStrip()}
                  <div className="table-wrap"><table><thead><tr><th>Name</th><th>Policy No.</th><th>ID Number</th><th>Phone</th><th>Plan</th><th>Premium</th><th>Status</th></tr></thead><tbody>
                    {filteredMembers.map(m => (
                      <tr key={m.policyNumber} onClick={() => openProfile(m, 'member')}>
                        <td><div className="mem-info"><div className="mem-avatar">{(m.fullName || 'U').charAt(0)}</div><div><div className="mem-name">{m.fullName || 'Unnamed'}</div><div className="mem-meta">{m.phone || '—'}</div></div></div></td>
                        <td>{m.policyNumber}</td><td>{m.idNumber || '—'}</td><td>{m.phone || '—'}</td><td>{m.coverType || '—'}</td><td>{money(m.monthlyPremium)}</td>
                        <td><span className={`badge ${getStatusClass(m.status)}`}>{m.status || 'Pending'}</span></td>
                      </tr>
                    ))}
                    {!filteredMembers.length && <tr><td colSpan="7" className="empty-state">No members match your search</td></tr>}
                  </tbody></table></div>
                </div>
              </>
            )}

            {/* ════════════════════════ CLAIMS TAB ════════════════════════ */}
            {tab === 'Claims' && (
              <>
                <div className="page-header">
                  <div><h1 className="page-title">Claims Register</h1><p className="page-subtitle">{filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''}</p></div>
                </div>
                <div className="kpi-grid">
                  <div className="kpi-card"><span className="kpi-label">Total Claims</span><span className="kpi-value">{claims.length}</span></div>
                  <div className="kpi-card"><span className="kpi-label">Pending Review</span><span className="kpi-value">{claims.filter(c => ['submitted','under_review'].includes(String(c.status).toLowerCase())).length}</span><span className="kpi-sub down">Needs action</span></div>
                  <div className="kpi-card"><span className="kpi-label">Approved</span><span className="kpi-value">{claims.filter(c => ['approved','settled'].includes(String(c.status).toLowerCase())).length}</span><span className="kpi-sub up">Processed</span></div>
                  <div className="kpi-card"><span className="kpi-label">Rejected</span><span className="kpi-value">{claims.filter(c => String(c.status).toLowerCase() === 'rejected').length}</span></div>
                </div>
                <div className="card">
                  <div className="table-wrap"><table><thead><tr><th>Reference</th><th>Deceased</th><th>Claimant</th><th>Policy</th><th>Cause</th><th>Submitted</th><th>Status</th></tr></thead><tbody>
                    {filteredClaims.map(c => (
                      <tr key={c.claimId} onClick={() => openProfile(c, 'claim')}>
                        <td><b>{c.reference || `Claim ${c.claimId}`}</b></td>
                        <td>{c.deceasedName || '—'}</td><td>{c.claimantFullName || '—'}</td><td>{c.policyNumber || '—'}</td><td>{c.causeOfDeath || '—'}</td>
                        <td>{dateText(c.createdAt)}</td>
                        <td><span className={`badge ${getStatusClass(c.status)}`}>{c.status || 'Submitted'}</span></td>
                      </tr>
                    ))}
                    {!filteredClaims.length && <tr><td colSpan="7" className="empty-state">No claims found</td></tr>}
                  </tbody></table></div>
                </div>
              </>
            )}

            {/* ════════════════════════ PAYMENTS TAB ════════════════════════ */}
            {tab === 'Payments' && (
              <>
                <div className="page-header">
                  <div><h1 className="page-title">Payment Transactions</h1><p className="page-subtitle">All M-Pesa contributions across members.</p></div>
                </div>
                <div className="kpi-grid">
                  <div className="kpi-card"><span className="kpi-label">Total Collected</span><span className="kpi-value">{money(paidTotal)}</span><span className="kpi-sub up">All time</span></div>
                  <div className="kpi-card"><span className="kpi-label">Transactions</span><span className="kpi-value">{paymentHistory.length || allContributions.length}</span></div>
                  <div className="kpi-card"><span className="kpi-label">Failed Attempts</span><span className="kpi-value">{failedPayments.length}</span><span className="kpi-sub down">Needs follow-up / retry</span></div>
                  <div className="kpi-card"><span className="kpi-label">Defaulters</span><span className="kpi-value">{defaulterCount}</span><span className="kpi-sub down">No recent payment</span></div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <h3>Transaction Log</h3>
                    <div style={{display:'flex',gap:'8px'}}>
                      {['all','paid','failed','pending'].map(f => (
                        <button key={f} className="btn" style={{padding:'4px 10px',fontWeight:paymentFilter===f?'700':'400'}} onClick={() => setPaymentFilter(f)}>{f[0].toUpperCase()+f.slice(1)}</button>
                      ))}
                    </div>
                  </div>
                  <div className="table-wrap"><table><thead><tr><th>Member</th><th>Policy</th><th>Amount</th><th>Reference</th><th>Date</th><th>Status</th><th>Reason / Next step</th></tr></thead><tbody>
                    {visiblePayments.length > 0 ? visiblePayments.slice(0, 100).map((c, i) => (
                      <tr key={c.reference || i}>
                        <td>{c.memberName || '—'}</td><td>{c.policyNumber || '—'}</td><td>{money(c.amount)}</td>
                        <td>{c.receipt || c.reference || '—'}</td><td>{dateText(c.createdAt)}</td>
                        <td><span className={`badge ${getStatusClass(c.status)}`}>{c.status || 'Pending'}</span></td>
                        <td style={{maxWidth:'280px'}}>{c.status === 'failed' ? (<span>{c.failureReason || 'Not completed.'}{c.retryable ? ' — safe to retry.' : ''}</span>) : c.status === 'pending' ? 'Waiting for M-Pesa approval…' : (c.receipt ? `Receipt ${c.receipt}` : '—')}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="7" className="empty-state">No payment transactions found. Contributions will appear here after members pay via M-Pesa.</td></tr>
                    )}
                  </tbody></table></div>
                </div>
              </>
            )}

            {/* ════════════════════════ ANALYTICS TAB ════════════════════════ */}
            {tab === 'Analytics' && (
              <>
                <div className="page-header">
                  <div><h1 className="page-title">Analytics</h1><p className="page-subtitle">Premium revenue, claims, and member demographics.</p></div>
                </div>
                <div className="kpi-grid">
                  <div className="kpi-card"><span className="kpi-label">Total Revenue</span><span className="kpi-value">{money(paidTotal)}</span></div>
                  <div className="kpi-card"><span className="kpi-label">Total Members</span><span className="kpi-value">{members.length}</span></div>
                  <div className="kpi-card"><span className="kpi-label">Claims Filed</span><span className="kpi-value">{claims.length}</span></div>
                  <div className="kpi-card"><span className="kpi-label">Active Rate</span><span className="kpi-value">{members.length ? Math.round((activeCount / members.length) * 100) : 0}%</span></div>
                </div>
                <div className="grid-2-eq">
                  <div className="card"><div className="card-header"><h3>Premium Trend (6 months)</h3></div><div style={{padding:'24px',height:'320px',position:'relative'}}>{trendData.labels.length > 0 ? <Line data={trendData} options={{responsive:true,maintainAspectRatio:false}} /> : <div className="empty-state">No data</div>}</div></div>
                  <div className="card"><div className="card-header"><h3>Monthly Revenue</h3></div><div style={{padding:'24px',height:'320px',position:'relative'}}>{barData.labels.length > 0 ? <Bar data={barData} options={{responsive:true,maintainAspectRatio:false}} /> : <div className="empty-state">No data</div>}</div></div>
                </div>
                <div className="grid-2-eq">
                  <div className="card"><div className="card-header"><h3>Claims Breakdown</h3></div><div style={{padding:'24px',height:'320px',position:'relative'}}>{claims.length > 0 ? <Doughnut data={claimsChartData} options={{responsive:true,maintainAspectRatio:false,cutout:'60%'}} /> : <div className="empty-state">No claims</div>}</div></div>
                  <div className="card"><div className="card-header"><h3>Member Status</h3></div><div style={{padding:'24px',height:'320px',position:'relative'}}>{members.length > 0 ? <Doughnut data={statusPieData} options={{responsive:true,maintainAspectRatio:false,cutout:'60%'}} /> : <div className="empty-state">No members</div>}</div></div>
                </div>
              </>
            )}

            {/* ════════════════════════ CALENDAR TAB ════════════════════════ */}
            {tab === 'Calendar' && (
              <>
                <div className="page-header">
                  <div><h1 className="page-title">Calendar</h1><p className="page-subtitle">Track policy due dates, claim deadlines, and follow-ups.</p></div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <h3>{calMonthName}</h3>
                    <div style={{display:'flex',gap:'4px'}}>
                      <button className="btn" style={{padding:'4px 10px'}} onClick={() => setCalMonth(p => { const d = new Date(p.year, p.month - 1); return {year: d.getFullYear(), month: d.getMonth()}; })}>‹</button>
                      <button className="btn" style={{padding:'4px 10px'}} onClick={() => setCalMonth(p => { const d = new Date(p.year, p.month + 1); return {year: d.getFullYear(), month: d.getMonth()}; })}>›</button>
                    </div>
                  </div>
                  <div style={{padding:'24px'}}>
                    <div className="cal-grid" style={{marginBottom:'8px',textAlign:'center',fontWeight:'700',fontSize:'11px',color:'var(--gray)'}}>
                      <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
                    </div>
                    <div className="cal-grid">
                      {calDays.map((day, i) => {
                        if (!day) return <div key={i} className="cal-day off"></div>;
                        const isToday = day === today.getDate() && calMonth.month === today.getMonth() && calMonth.year === today.getFullYear();
                        return <div key={i} className={`cal-day ${isToday ? 'today' : ''}`}><span>{day}</span></div>;
                      })}
                    </div>
                    <div style={{marginTop:'16px',display:'flex',gap:'16px',fontSize:'12px',color:'var(--mid)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}><span style={{width:'8px',height:'8px',background:'var(--danger)',borderRadius:'50%'}}></span> Claim Deadline</div>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}><span style={{width:'8px',height:'8px',background:'var(--info)',borderRadius:'50%'}}></span> Premium Due</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* ─── DRAWER ─── */}
      <div className={`drawer-overlay ${selectedRecord ? 'open' : ''}`} onClick={closeProfile}></div>
      <aside className={`drawer ${selectedRecord ? 'open' : ''}`}>
        {selectedRecord && selectedType === 'member' && (
          <>
            <div className="drawer-header">
              {/* ── Mock-style header: member since · policy · avatar · status ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {String(selectedRecord.status).toLowerCase() === 'active' ? 'Active Member Since' : 'Member Since'} {monthYear(selectedRecord.createdAt)}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--mid)', fontWeight: 500 }}>Policy: {selectedRecord.policyNumber}</span>
                </div>
                <button className="drawer-close" onClick={closeProfile}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="avatar-lg" style={{ width: '56px', height: '56px', fontSize: '22px' }}>{(selectedRecord.fullName || 'U').charAt(0)}</div>
                <div>
                  <div className="drawer-name">{selectedRecord.fullName}</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '2px' }}>{selectedRecord.idNumber || selectedRecord.policyNumber} · {selectedRecord.coverType || '—'}</div>
                  <div className={`badge ${getStatusClass(selectedRecord.status)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
                    {selectedRecord.status || 'Active'}
                  </div>
                </div>
              </div>
            </div>
            <div className="drawer-body">
              {/* ── ADDED: Coverage Details (mock section) — real data only ── */}
              <div className="section-head primary">Coverage Details</div>
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">Plan Type</span><div className="detail-value">{selectedRecord.coverType || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Who Is Covered</span><div className="detail-value" style={{ color: '#92764c', fontFamily: "'Merriweather', serif", fontSize: '17px' }}>{planFor(selectedRecord.coverType).covers}</div></div>
                <div className="detail-item"><span className="detail-label">Premium</span><div className="detail-value">{money(selectedRecord.monthlyPremium)} / Month</div></div>
                <div className="detail-item"><span className="detail-label">Covered People</span><div className="detail-value">{selectedRecord.coveredCount || '—'}</div></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><span className="detail-label">Total Contribution So Far</span><div className="detail-value" style={{ fontFamily: "'Merriweather', serif", fontSize: '18px' }}>{money(memberContributed)}</div></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><span className="detail-label">Next Payment (from last payment + 30 days)</span><div className="detail-value">{memberNextPayment ? dateText(memberNextPayment) : 'No successful payment recorded yet'}</div></div>
              </div>
              <div className="section-head primary"><span>01</span> Personal Information</div>
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">National ID</span><div className="detail-value">{selectedRecord.idNumber || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Phone</span><div className="detail-value">{selectedRecord.phone || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Next of Kin</span><div className="detail-value">{selectedRecord.nextOfKinName || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Relationship</span><div className="detail-value">{selectedRecord.nextOfKinRelationship || '—'}</div></div>
              </div>
              <div className="section-head primary"><span>02</span> Policy Details</div>
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">Policy Number</span><div className="detail-value">{selectedRecord.policyNumber}</div></div>
                <div className="detail-item"><span className="detail-label">Cover Plan</span><div className="detail-value">{selectedRecord.coverType}</div></div>
                <div className="detail-item"><span className="detail-label">Premium</span><div className="detail-value">{money(selectedRecord.monthlyPremium)}</div></div>
                <div className="detail-item"><span className="detail-label">Status</span><div className="detail-value"><span className={`badge ${getStatusClass(selectedRecord.status)}`}>{selectedRecord.status}</span></div></div>
              </div>
              {/* ── ADDED: Beneficiaries (mock section) — next of kin on record ── */}
              <div className="section-head primary">Beneficiaries</div>
              {selectedRecord.nextOfKinName ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--border-light)', borderRadius: '4px', background: 'var(--white)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: 'var(--bg-field)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mid)', fontWeight: 700, fontSize: '14px', fontFamily: "'Merriweather', serif" }}>{(selectedRecord.nextOfKinName || '?').charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--black)' }}>{selectedRecord.nextOfKinName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{selectedRecord.nextOfKinRelationship || 'Next of kin'}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dark)', background: 'var(--bg-field)', padding: '4px 8px', borderRadius: '4px' }}>Primary</div>
                  </div>
                  {Number(selectedRecord.coveredCount) > 1 && <div style={{ fontSize: '12px', color: 'var(--gray)' }}>This policy covers {selectedRecord.coveredCount} people in total.</div>}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '32px' }}>Next of kin not recorded{Number(selectedRecord.coveredCount) > 1 ? ` — this policy covers ${selectedRecord.coveredCount} people in total` : ''}.</div>
              )}
              {(selectedRecord.contributions || []).length > 0 && (
                <>
                  <div className="section-head primary"><span>03</span> Contribution History</div>
                  <div className="table-wrap"><table><thead><tr><th>Date</th><th>Amount</th><th>Ref</th><th>Status</th></tr></thead><tbody>
                    {selectedRecord.contributions.map((c, i) => (
                      <tr key={i}><td>{dateText(c.paidAt || c.createdAt)}</td><td>{money(c.amount)}</td><td>{c.mpesaRef || c.reference || '—'}</td><td><span className={`badge ${getStatusClass(c.status)}`}>{c.status || 'Paid'}</span></td></tr>
                    ))}
                  </tbody></table></div>
                </>
              )}
            </div>
            <div className="drawer-footer">
              <a href={selectedRecord.phone ? `sms:${String(selectedRecord.phone).replace(/[^+\d]/g, '')}?body=Hello ${selectedRecord.fullName}, this is Amani Cover...` : '#'} className="btn" style={{flex:1,justifyContent:'center'}}>Send SMS</a>
            </div>
          </>
        )}
        {selectedRecord && selectedType === 'claim' && (
          <>
            <div className="drawer-header">
              <div>
                <div className="avatar-lg" style={{background:'var(--danger)'}}>C</div>
                <h2 className="drawer-name">{selectedRecord.reference || `Claim ${selectedRecord.claimId}`}</h2>
                <div className="drawer-meta">Deceased: {selectedRecord.deceasedName}</div>
              </div>
              <button className="drawer-close" onClick={closeProfile}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="drawer-body">
              <div className="section-head primary"><span>01</span> Claim Information</div>
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">Claimant</span><div className="detail-value">{selectedRecord.claimantFullName || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Phone</span><div className="detail-value">{selectedRecord.phone || claimDetail?.phone || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Cause of Death</span><div className="detail-value">{selectedRecord.causeOfDeath || claimDetail?.causeOfDeath || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Date of Death</span><div className="detail-value">{dateText(selectedRecord.deathDate)}</div></div>
              </div>
              <div className="section-head primary"><span>02</span> Documents</div>
              <div className="detail-grid" style={{marginBottom:'32px'}}>
                <div><span className="detail-label" style={{marginBottom:'8px',display:'block'}}>Claimant ID</span><a href={claimDetail?.claimantIdPath || '#'} target="_blank" className="doc-placeholder" rel="noreferrer"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M7 16h10"/></svg><span style={{fontSize:'12px',fontWeight:'600'}}>View ID</span></a></div>
                <div><span className="detail-label" style={{marginBottom:'8px',display:'block'}}>Death Certificate</span><a href={claimDetail?.deathCertificatePath || '#'} target="_blank" className="doc-placeholder" rel="noreferrer"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span style={{fontSize:'12px',fontWeight:'600'}}>View Cert</span></a></div>
              </div>
              <div className="section-head primary"><span>03</span> Timeline</div>
              <div className="timeline">
                <div className="timeline-item"><div className="timeline-dot done"></div><div className="timeline-text">Claim Initiated</div><div className="timeline-time">{dateText(selectedRecord.createdAt)}</div></div>
                <div className="timeline-item"><div className={`timeline-dot ${['approved','settled'].includes(String(selectedRecord.status).toLowerCase()) ? 'done' : 'active'}`}></div><div className="timeline-text">{String(selectedRecord.status).replace(/_/g, ' ')}</div><div className="timeline-time">Current status</div></div>
              </div>
            </div>
            <div className="drawer-footer">
              <select className="status-select" value={selectedRecord.status || 'submitted'} disabled={busyClaim} onChange={e => changeClaimStatus(selectedRecord.claimId, e.target.value)}>
                <option value="submitted">Submitted</option><option value="under_review">Under Review</option><option value="approved">Approved</option><option value="settled">Settled</option><option value="rejected">Rejected</option>
              </select>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
