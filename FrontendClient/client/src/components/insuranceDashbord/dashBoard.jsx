import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { insuranceApi } from '../../api/insuranceApi';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import './crmDashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

const money = value => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(value || 0));
const dateText = value => value ? new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const unwrap = response => response?.data && !Array.isArray(response.data) ? response.data : response;
const rows = response => { const value = unwrap(response); return Array.isArray(value) ? value : value?.policies || value?.claims || []; };

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
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [claimDetail, setClaimDetail] = useState(null);
  const [busyClaim, setBusyClaim] = useState(false);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [policyRes, statsRes, claimRes, analyticsRes] = await Promise.all([
        insuranceApi.listPolicies(), insuranceApi.getStats(), insuranceApi.listClaims(), insuranceApi.getAnalytics()
      ]);
      setMembers(rows(policyRes));
      setStats({ ...unwrap(statsRes), ...unwrap(analyticsRes) });
      setClaims(rows(claimRes));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not load data.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // --- Derived data ---
  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? members.filter(m => [m.fullName, m.policyNumber, m.phone, m.coverType, m.idNumber].some(v => String(v || '').toLowerCase().includes(q))) : members;
  }, [members, query]);

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
                    <div className="table-wrap"><table><thead><tr><th>Name</th><th>Policy</th><th>Plan</th><th>Premium</th><th>Status</th></tr></thead><tbody>
                      {members.slice(0, 5).map(m => (
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
                  <div className="kpi-card"><span className="kpi-label">Transactions</span><span className="kpi-value">{allContributions.length}</span></div>
                  <div className="kpi-card"><span className="kpi-label">Active Payers</span><span className="kpi-value">{activeCount}</span></div>
                  <div className="kpi-card"><span className="kpi-label">Defaulters</span><span className="kpi-value">{defaulterCount}</span><span className="kpi-sub down">No recent payment</span></div>
                </div>
                <div className="card">
                  <div className="card-header"><h3>Transaction Log</h3></div>
                  <div className="table-wrap"><table><thead><tr><th>Member</th><th>Policy</th><th>Amount</th><th>Reference</th><th>Date</th><th>Status</th></tr></thead><tbody>
                    {allContributions.length > 0 ? allContributions.slice(0, 50).map((c, i) => (
                      <tr key={i}>
                        <td>{c.memberName || '—'}</td><td>{c.policyNumber || '—'}</td><td>{money(c.amount)}</td>
                        <td>{c.mpesaRef || c.reference || '—'}</td><td>{dateText(c.paidAt || c.createdAt)}</td>
                        <td><span className={`badge ${getStatusClass(c.status)}`}>{c.status || 'Paid'}</span></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="empty-state">No payment transactions found. Contributions will appear here after members pay via M-Pesa.</td></tr>
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
              <div>
                <div className="avatar-lg">{(selectedRecord.fullName || 'U').charAt(0)}</div>
                <h2 className="drawer-name">{selectedRecord.fullName}</h2>
                <div className="drawer-meta">{selectedRecord.policyNumber} · {selectedRecord.coverType}</div>
              </div>
              <button className="drawer-close" onClick={closeProfile}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="drawer-body">
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
                <div className="detail-item"><span className="detail-label">Phone</span><div className="detail-value">{selectedRecord.phone || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Cause of Death</span><div className="detail-value">{selectedRecord.causeOfDeath || '—'}</div></div>
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
