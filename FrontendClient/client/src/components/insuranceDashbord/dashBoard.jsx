import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { insuranceApi } from '../../api/insuranceApi';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import './crmDashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

const money = value => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(value || 0));
const dateText = value => value ? new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const unwrap = response => response?.data && !Array.isArray(response.data) ? response.data : response;
const rows = response => { const value = unwrap(response); return Array.isArray(value) ? value : value?.policies || value?.claims || []; };

export default function InsuranceDashboard() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [query, setQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null); // Can be a member or claim
  const [selectedType, setSelectedType] = useState(null); // 'member' or 'claim'
  const [claimDetail, setClaimDetail] = useState(null);
  const [busyClaim, setBusyClaim] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [policyResponse, statsResponse, claimResponse, analyticsResponse] = await Promise.all([
        insuranceApi.listPolicies(), 
        insuranceApi.getStats(), 
        insuranceApi.listClaims(), 
        insuranceApi.getAnalytics()
      ]);
      setMembers(rows(policyResponse));
      setStats({ ...unwrap(statsResponse), ...unwrap(analyticsResponse) });
      setClaims(rows(claimResponse));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not load insurance operations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? members.filter(m => [m.fullName, m.policyNumber, m.phone, m.coverType].some(v => String(v || '').toLowerCase().includes(q))) : members;
  }, [members, query]);

  const paidTotal = Number(stats?.totalContributions || stats?.paidContributions || 0);
  const activeCount = members.filter(p => String(p.status).toLowerCase() === 'active').length;
  const pendingCount = Number(stats?.pendingClaims ?? claims.filter(c => ['submitted', 'under_review'].includes(String(c.status).toLowerCase())).length);
  const defaulterCount = members.filter(p => String(p.status).toLowerCase() === 'lapsed' || String(p.status).toLowerCase() === 'defaulter').length;

  const openProfile = (record, type) => {
    setSelectedRecord(record);
    setSelectedType(type);
    if (type === 'claim') {
      setClaimDetail(null);
      insuranceApi.getClaim(record.claimId).then(v => setClaimDetail(v?.claim || v?.data?.claim || v)).catch(() => {});
    }
  };

  const closeProfile = () => {
    setSelectedRecord(null);
    setSelectedType(null);
    setClaimDetail(null);
  };

  const changeClaimStatus = async (claimId, status) => {
    setBusyClaim(true);
    try {
      await insuranceApi.updateClaimStatus(claimId, status, selectedRecord.reviewNotes || '');
      await load();
      setSelectedRecord(c => c ? { ...c, status } : c);
      setClaimDetail(c => c ? { ...c, status } : c);
    } catch (err) {
      alert(err?.message || 'Could not update claim status.');
    } finally {
      setBusyClaim(false);
    }
  };

  // --- Calendar Data ---
  const today = new Date();
  const year = today.getFullYear(); 
  const monthIndex = today.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  
  const calDays = [];
  for (let i = 0; i < startOffset; i++) calDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calDays.push(i);

  // --- Charts Data ---
  const trendData = {
    labels: (stats?.monthlyContributions || []).slice(-6).map(item => new Date(`${item.month}-01T00:00:00`).toLocaleDateString('en-KE', { month: 'short' })),
    datasets: [
      {
        label: 'Premiums Collected',
        data: (stats?.monthlyContributions || []).slice(-6).map(item => Number(item.amount || 0)),
        borderColor: '#0a0a0a',
        backgroundColor: 'rgba(10, 10, 10, 0.05)',
        fill: true, tension: 0.4, borderWidth: 2
      }
    ]
  };
  
  const claimStatuses = ['approved', 'under_review', 'rejected', 'submitted'];
  const claimsChartData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [{
      data: [
        claims.filter(c => String(c.status).toLowerCase() === 'approved' || String(c.status).toLowerCase() === 'settled').length,
        claims.filter(c => String(c.status).toLowerCase() === 'under_review' || String(c.status).toLowerCase() === 'submitted').length,
        claims.filter(c => String(c.status).toLowerCase() === 'rejected').length,
      ],
      backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
      borderWidth: 0
    }]
  };

  const getStatusClass = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'active' || s === 'approved' || s === 'settled') return 'badge-success';
    if (s === 'lapsed' || s === 'defaulter' || s === 'rejected') return 'badge-danger';
    if (s === 'pending' || s === 'submitted' || s === 'under_review') return 'badge-warning';
    return 'badge-info';
  };

  return (
    <div className="crm-dash">
      <header className="topnav">
        <div className="brand">
          <h1>Montenzuma</h1>
          <span>Amani Cover CRM</span>
        </div>
        
        <nav className="nav-links">
          <div className="nav-tab active">Dashboard</div>
          <div className="nav-tab" onClick={() => navigate('/amani/cover/apply')}>Applications</div>
        </nav>

        <div className="nav-spacer"></div>
        
        <div className="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search policy no, name, ID..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="avatar">AD</div>
      </header>

      <main className="content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Backend Management</h1>
            <p className="page-subtitle">Manage all Amani Cover members, policies, and claims.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/amani/cover/apply')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Member
          </button>
        </div>

        {error && <div className="empty-state" style={{color: 'var(--danger)'}}>{error} <button onClick={load} className="btn" style={{marginTop: '10px'}}>Retry</button></div>}

        {loading ? (
           <div className="empty-state">Loading operations dashboard...</div>
        ) : (
          <>
            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-label">Active Policies</span>
                <span className="kpi-value">{activeCount.toLocaleString()}</span>
                <span className="kpi-sub up">of {members.length} total</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Total Contributions</span>
                <span className="kpi-value">{money(paidTotal)}</span>
                <span className="kpi-sub up">Confirmed M-Pesa payments</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Pending Claims</span>
                <span className="kpi-value">{pendingCount}</span>
                <span className="kpi-sub down">Action required</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Lapsed / Defaulters</span>
                <span className="kpi-value">{defaulterCount}</span>
                <span className="kpi-sub down">Requires follow-up</span>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-header">
                  <h3>Recent Applications & Members</h3>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Member Name</th>
                        <th>Policy No.</th>
                        <th>Plan</th>
                        <th>Premium</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.slice(0, 10).map(m => (
                        <tr key={m.policyNumber} onClick={() => openProfile(m, 'member')}>
                          <td>
                            <div className="mem-info">
                              <div className="mem-avatar">{(m.fullName || 'U').charAt(0)}</div>
                              <div>
                                <div className="mem-name">{m.fullName || 'Unnamed'}</div>
                                <div className="mem-meta">{m.phone || 'No phone'}</div>
                              </div>
                            </div>
                          </td>
                          <td>{m.policyNumber}</td>
                          <td>{m.coverType || '—'}</td>
                          <td>{money(m.monthlyPremium)}</td>
                          <td><span className={`badge ${getStatusClass(m.status)}`}>{m.status || 'Pending'}</span></td>
                        </tr>
                      ))}
                      {!filteredMembers.length && <tr><td colSpan="5" className="empty-state">No members found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>{today.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</h3>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn" style={{ padding: '4px 8px', fontSize: '12px' }}>‹</button>
                    <button className="btn" style={{ padding: '4px 8px', fontSize: '12px' }}>›</button>
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div className="cal-grid" style={{ marginBottom: '8px', textAlign: 'center', fontWeight: '700', fontSize: '11px', color: 'var(--gray)' }}>
                    <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
                  </div>
                  <div className="cal-grid">
                    {calDays.map((day, i) => {
                      if (!day) return <div key={i} className="cal-day off"></div>;
                      const isToday = day === today.getDate();
                      let isEvent = false; let isInfo = false;
                      // Just a mock indicator based on days
                      if (day === 8 || day === 15 || day === 22) isEvent = true;
                      if (day === 5 || day === 20) isInfo = true;
                      return (
                        <div key={i} className={`cal-day ${isToday ? 'today' : ''} ${isEvent ? 'event' : ''} ${isInfo ? 'info-event' : ''}`}>
                          <span>{day}</span>
                          {(isEvent || isInfo) && <div className="cal-dots"><div className={`cal-dot ${isInfo ? 'info' : ''}`}></div></div>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--mid)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%' }}></span> Action Needed</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', background: 'var(--info)', borderRadius: '50%' }}></span> Policy Due</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid-2-eq">
              <div className="card">
                <div className="card-header">
                  <h3>Premiums Collected</h3>
                </div>
                <div style={{ padding: '24px', height: '320px', position: 'relative' }}>
                  {trendData.labels.length > 0 ? <Line data={trendData} options={{ responsive: true, maintainAspectRatio: false }} /> : <div className="empty-state">No data available</div>}
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3>Claims Distribution</h3>
                </div>
                <div style={{ padding: '24px', height: '320px', position: 'relative' }}>
                   {claims.length > 0 ? <Doughnut data={claimsChartData} options={{ responsive: true, maintainAspectRatio: false, cutout: '60%' }} /> : <div className="empty-state">No claims recorded</div>}
                </div>
              </div>
            </div>

            {/* CLAIMS TABLE */}
            <div className="card" style={{marginTop: '24px'}}>
               <div className="card-header">
                  <h3>Submitted Claims Register</h3>
               </div>
               <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Claim Reference</th>
                        <th>Deceased</th>
                        <th>Claimant</th>
                        <th>Policy</th>
                        <th>Submitted</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map(c => (
                        <tr key={c.claimId} onClick={() => openProfile(c, 'claim')}>
                          <td><b>{c.reference || `Claim ${c.claimId}`}</b></td>
                          <td>{c.deceasedName || '—'}</td>
                          <td>{c.claimantFullName || '—'}</td>
                          <td>{c.policyNumber || '—'}</td>
                          <td>{dateText(c.createdAt)}</td>
                          <td><span className={`badge ${getStatusClass(c.status)}`}>{c.status || 'Submitted'}</span></td>
                        </tr>
                      ))}
                      {!claims.length && <tr><td colSpan="6" className="empty-state">No claims found</td></tr>}
                    </tbody>
                  </table>
               </div>
            </div>
          </>
        )}
      </main>

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
              <button className="drawer-close" onClick={closeProfile}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="drawer-body">
              <div className="section-head primary"><span>01</span> Personal Information</div>
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">National ID</span><div className="detail-value">{selectedRecord.idNumber || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Phone Number</span><div className="detail-value">{selectedRecord.phone || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Next of Kin</span><div className="detail-value">{selectedRecord.nextOfKinName || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Relationship</span><div className="detail-value">{selectedRecord.nextOfKinRelationship || '—'}</div></div>
              </div>

              <div className="section-head primary"><span>02</span> Policy Details</div>
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">Policy Number</span><div className="detail-value">{selectedRecord.policyNumber}</div></div>
                <div className="detail-item"><span className="detail-label">Cover Plan</span><div className="detail-value">{selectedRecord.coverType}</div></div>
                <div className="detail-item"><span className="detail-label">Premium Amount</span><div className="detail-value">{money(selectedRecord.monthlyPremium)}</div></div>
                <div className="detail-item"><span className="detail-label">Status</span><div className="detail-value">{selectedRecord.status}</div></div>
              </div>
            </div>
            <div className="drawer-footer">
               <a href={selectedRecord.phone ? `sms:${String(selectedRecord.phone).replace(/[^+\d]/g, '')}?body=Hello ${selectedRecord.fullName}, this is Amani Cover...` : '#'} className="btn" style={{flex: 1, justifyContent: 'center'}}>Send SMS</a>
            </div>
          </>
        )}
        
        {selectedRecord && selectedType === 'claim' && (
          <>
             <div className="drawer-header">
              <div>
                <div className="avatar-lg" style={{background: 'var(--danger)'}}>C</div>
                <h2 className="drawer-name">{selectedRecord.reference}</h2>
                <div className="drawer-meta">Deceased: {selectedRecord.deceasedName}</div>
              </div>
              <button className="drawer-close" onClick={closeProfile}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="drawer-body">
              <div className="section-head primary"><span>01</span> Claim Information</div>
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">Claimant Name</span><div className="detail-value">{selectedRecord.claimantFullName || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Claimant Phone</span><div className="detail-value">{selectedRecord.phone || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Cause of Death</span><div className="detail-value">{selectedRecord.causeOfDeath || '—'}</div></div>
                <div className="detail-item"><span className="detail-label">Date of Death</span><div className="detail-value">{dateText(selectedRecord.deathDate)}</div></div>
              </div>

              <div className="section-head primary"><span>02</span> Documents</div>
              <div className="detail-grid" style={{ marginBottom: '32px' }}>
                <div>
                  <span className="detail-label" style={{ marginBottom: '8px', display: 'block' }}>Claimant ID</span>
                  <a href={claimDetail?.claimantIdPath || claimDetail?.docClaimantIdPath || '#'} target="_blank" className="doc-placeholder" rel="noreferrer">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M7 16h10"/></svg>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>View ID</span>
                  </a>
                </div>
                <div>
                  <span className="detail-label" style={{ marginBottom: '8px', display: 'block' }}>Death Certificate</span>
                  <a href={claimDetail?.deathCertificatePath || claimDetail?.docDeathCertPath || '#'} target="_blank" className="doc-placeholder" rel="noreferrer">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>View Cert</span>
                  </a>
                </div>
              </div>

              <div className="section-head primary"><span>03</span> Claim Process Timeline</div>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-dot done"></div>
                  <div className="timeline-text">Claim Initiated</div>
                  <div className="timeline-time">{dateText(selectedRecord.createdAt)}</div>
                </div>
                <div className="timeline-item">
                  <div className={`timeline-dot ${selectedRecord.status === 'approved' || selectedRecord.status === 'settled' ? 'done' : 'active'}`}></div>
                  <div className="timeline-text">Under Review / Approved</div>
                  <div className="timeline-time">Status: {String(selectedRecord.status).replaceAll('_', ' ')}</div>
                </div>
              </div>
            </div>
            
            <div className="drawer-footer">
                <select className="status-select" value={selectedRecord.status || 'submitted'} disabled={busyClaim} onChange={e => changeClaimStatus(selectedRecord.claimId, e.target.value)}>
                   <option value="submitted">Submitted</option>
                   <option value="under_review">Under Review</option>
                   <option value="approved">Approved</option>
                   <option value="settled">Settled</option>
                   <option value="rejected">Rejected</option>
                </select>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
