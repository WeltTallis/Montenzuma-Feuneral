import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { insuranceApi } from '../../api/insuranceApi';
import './index.css';
import './workspace.css';

const TABS = [
  ['overview', 'Overview', '◫'],
  ['claims', 'Claims', '▤'],
  ['analytics', 'Analytics', '↗'],
  ['calendar', 'Calendar', '▦'],
  ['sms', 'SMS', '✉'],
];
const money = value => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(value || 0));
const dateText = value => value ? new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const unwrap = response => response?.data && !Array.isArray(response.data) ? response.data : response;
const rows = response => { const value = unwrap(response); return Array.isArray(value) ? value : value?.policies || value?.claims || []; };

function Status({ value }) {
  const label = String(value || 'unknown').replaceAll('_', ' ');
  return <span className={`insdash-status insdash-status-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</span>;
}

function Metric({ label, value, note, accent = '' }) {
  return <article className={`insdash-metric ${accent}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function Empty({ title, children }) {
  return <div className="insdash-empty-state"><span className="insdash-empty-mark">—</span><b>{title}</b><span>{children}</span></div>;
}

function ClaimDrawer({ claim, onClose, onStatus, busy }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    if (!claim) { setDetail(null); return undefined; }
    setDetail(null); setError('');
    insuranceApi.getClaim(claim.claimId).then(value => alive && setDetail(value?.claim || value?.data?.claim || value))
      .catch(err => alive && setError(err?.message || 'Could not load the full claim file.'));
    return () => { alive = false; };
  }, [claim]);
  if (!claim) return null;
  const c = detail || claim;
  const policy = c.policy || {};
  const paymentList = c.contributions || c.payments || [];
  const totalContributed = c.totalContributions ?? paymentList.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const smsBody = `Hello ${c.claimantFullName || 'there'}, we have an update on claim ${c.reference || ''} for ${c.deceasedName || 'your family member'}. Current status: ${String(c.status || 'submitted').replaceAll('_', ' ')}. Please contact Amani Cover if you need help.`;
  const smsHref = c.phone ? `sms:${String(c.phone).replace(/[^+\d]/g, '')}?body=${encodeURIComponent(smsBody)}` : '';
  const facts = [
    ['Claimant', c.claimantFullName], ['ID number', c.claimantIdNumber], ['Phone', c.phone],
    ['Relationship', c.relationship], ['Deceased', c.deceasedName], ['Date of death', dateText(c.deathDate)],
    ['Cause of death', c.causeOfDeath], ['Place of death', c.placeOfDeath], ['Submitted', dateText(c.createdAt)],
    ['Policy number', c.policyNumber], ['Policy holder', policy.fullName], ['Policy holder phone', policy.phone],
    ['Cover type', policy.coverType], ['People covered', policy.coveredCount], ['Monthly contribution', policy.monthlyPremium ? money(policy.monthlyPremium) : '—'],
  ];
  return <div className="insdash-drawer-layer" onMouseDown={e => e.target === e.currentTarget && onClose()}><aside className="insdash-drawer insdash-claim-drawer" aria-label={`Claim ${claim.reference}`}>
    <div className="insdash-drawer-top"><div><span className="insdash-drawer-tag">CLAIM FILE</span><h2>{claim.reference || `Claim ${claim.claimId}`}</h2></div><button onClick={onClose} aria-label="Close claim">×</button></div>
    <div className="insdash-claim-hero"><Status value={c.status} /><h3>{c.deceasedName || 'Claim record'}</h3><p>{c.claimantFullName || claim.claimantFullName || 'Claimant details load with the full file'}</p></div>
    {error && <div className="insdash-error" role="alert">{error}</div>}
    {!detail && !error && <p className="insdash-drawer-loading">Loading submitted details and contribution history…</p>}
    <section className="insdash-drawer-section"><p className="insdash-eyebrow">SUBMITTED CLAIM DETAILS</p><div className="insdash-facts-grid">{facts.map(([label, value]) => <div className="insdash-detail-fact" key={label}><span>{label}</span><b>{value || '—'}</b></div>)}</div>
      {c.notes && <div className="insdash-submitted-notes"><span>Additional notes</span><p>{c.notes}</p></div>}
      <div className="insdash-documents">{[['Death certificate', c.deathCertificatePath || c.docDeathCertPath], ['Claimant ID', c.claimantIdPath || c.docClaimantIdPath], ['Burial permit', c.burialPermitPath || c.docBurialPermitPath]].map(([label, href]) => href && <a key={label} href={href} target="_blank" rel="noreferrer">{label} ↗</a>)}</div>
    </section>
    <section className="insdash-drawer-section"><div className="insdash-contribution-head"><div><p className="insdash-eyebrow">POLICY CONTRIBUTIONS</p><b className="insdash-contribution-total">{money(totalContributed)}</b></div><span>{paymentList.filter(p => p.status === 'paid').length} paid payments</span></div>
      {paymentList.length ? <div className="insdash-payment-list">{paymentList.map(p => <div className="insdash-payment-row" key={p.reference || p.paymentId}><span><b>{p.reference || p.receipt || 'Contribution'}</b><small>{dateText(p.createdAt || p.paidAt)}</small></span><span>{money(p.amount)}<Status value={p.status} /></span></div>)}</div> : <p className="insdash-muted">Payment history is unavailable for this policy.</p>}
    </section>
    <section className="insdash-drawer-section"><p className="insdash-eyebrow">REVIEW</p><label className="insdash-field-label">Update claim status<select value={c.status || 'submitted'} disabled={busy} onChange={e => onStatus(c.claimId, e.target.value, c.reviewNotes || '')}><option value="submitted">Submitted</option><option value="under_review">Under review</option><option value="approved">Approved</option><option value="settled">Settled</option><option value="rejected">Rejected</option></select></label>
      {c.reviewNotes && <div className="insdash-submitted-notes"><span>Review notes</span><p>{c.reviewNotes}</p></div>}
    </section>
    {smsHref && <a className="insdash-button insdash-button-dark insdash-sms-action" href={smsHref}>✉ Open prefilled SMS</a>}
    <p className="insdash-sms-note">Your device’s messaging app will open. The SMS is sent only after you confirm it there.</p>
  </aside></div>;
}

function CalendarView({ policies, claims, onClaim }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const year = month.getFullYear(); const monthIndex = month.getMonth();
  const firstOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const events = [...claims.map(c => ({ date: c.createdAt, label: `${c.reference || 'Claim'} · ${c.deceasedName}`, type: 'claim', claim: c })), ...policies.map(p => ({ date: p.createdAt, label: `${p.fullName || 'Member'} · joined`, type: 'member' }))].filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === monthIndex; });
  const dayEvents = day => events.filter(e => new Date(e.date).getDate() === day);
  const count = Math.ceil((firstOffset + days) / 7) * 7;
  return <section className="insdash-section-card insdash-calendar"><div className="insdash-section-heading"><div><p className="insdash-eyebrow">INSURANCE ACTIVITY</p><h2>{month.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</h2><p className="insdash-muted">Claim submissions and policy registrations recorded by the system.</p></div><div className="insdash-calendar-actions"><button aria-label="Previous month" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}>‹</button><button onClick={() => setMonth(new Date())}>Today</button><button aria-label="Next month" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}>›</button></div></div>
    <div className="insdash-cal-grid">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <b key={d}>{d}</b>)}{Array.from({ length: count }, (_, i) => { const day = i - firstOffset + 1; const visible = day > 0 && day <= days; const items = visible ? dayEvents(day) : []; return <div key={i} className={`insdash-cal-cell ${!visible ? 'is-empty' : ''} ${visible && day === new Date().getDate() && monthIndex === new Date().getMonth() && year === new Date().getFullYear() ? 'is-today' : ''}`}><span>{visible ? day : ''}</span>{items.slice(0, 2).map((e, n) => <button key={`${e.type}-${n}`} className={`insdash-cal-event is-${e.type}`} title={e.label} onClick={() => e.claim && onClaim(e.claim)}>{e.label}</button>)}{items.length > 2 && <small>+{items.length - 2} more</small>}</div>; })}</div>
    <div className="insdash-calendar-legend"><span><i className="is-claim" /> Claims</span><span><i className="is-member" /> New policies</span></div>
  </section>;
}

export default function InsuranceDashboard() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]); const [claims, setClaims] = useState([]); const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState(''); const [selectedClaim, setSelectedClaim] = useState(null); const [busyClaim, setBusyClaim] = useState(false);
  const [smsMember, setSmsMember] = useState(''); const [smsMessage, setSmsMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [policyResponse, statsResponse, claimResponse, analyticsResponse] = await Promise.all([insuranceApi.listPolicies(), insuranceApi.getStats(), insuranceApi.listClaims(), insuranceApi.getAnalytics()]);
      setMembers(rows(policyResponse)); setStats({ ...unwrap(statsResponse), ...unwrap(analyticsResponse) }); setClaims(rows(claimResponse));
    } catch (err) { setError(err?.response?.data?.message || err?.message || 'Could not load insurance operations.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filteredMembers = useMemo(() => { const q = query.trim().toLowerCase(); return q ? members.filter(m => [m.fullName, m.policyNumber, m.phone, m.coverType].some(v => String(v || '').toLowerCase().includes(q))) : members; }, [members, query]);
  const filteredClaims = useMemo(() => { const q = query.trim().toLowerCase(); return q ? claims.filter(c => [c.reference, c.policyNumber, c.claimantFullName, c.deceasedName, c.status].some(v => String(v || '').toLowerCase().includes(q))) : claims; }, [claims, query]);
  const paidTotal = Number(stats?.totalContributions || stats?.paidContributions || 0);
  const activeCount = members.filter(p => String(p.status).toLowerCase() === 'active').length;
  const pendingCount = Number(stats?.pendingClaims ?? claims.filter(c => ['submitted', 'under_review'].includes(String(c.status).toLowerCase())).length);
  const tabLabel = TABS.find(t => t[0] === tab)?.[1] || 'Overview';

  const changeClaimStatus = async (claimId, status, notes) => {
    setBusyClaim(true);
    try { await insuranceApi.updateClaimStatus(claimId, status, notes); await load(); setSelectedClaim(current => current ? { ...current, status } : current); }
    catch (err) { setError(err?.message || 'Could not update claim status.'); }
    finally { setBusyClaim(false); }
  };
  const chooseSmsMember = phone => { setSmsMember(phone); setSmsMessage(`Hello, this is Amani Cover. We are contacting you with an update about your policy. Please contact our team if you need assistance.`); };
  const smsHref = smsMember ? `sms:${String(smsMember).replace(/[^+\d]/g, '')}?body=${encodeURIComponent(smsMessage)}` : '';
  const openClaim = claim => { setSelectedClaim(claim); setTab('claims'); };

  return <main className="insdash">
    <header className="insdash-header"><div className="insdash-brand"><span className="insdash-brand-mark">A</span><span><b>Amani Cover</b><small>Insurance operations</small></span></div><div className="insdash-header-right"><label className="insdash-search"><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search members, policy or claim" /></label><button className="insdash-button insdash-button-dark" onClick={() => navigate('/amani/cover/apply')}>＋ <span>New member</span></button></div></header>
    <div className="insdash-workspace">
      <aside className="insdash-local-nav" aria-label="Insurance sections"><p className="insdash-eyebrow">WORKSPACE</p>{TABS.map(([key, label, icon]) => <button key={key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}><span>{icon}</span>{label}{key === 'claims' && pendingCount > 0 && <i>{pendingCount}</i>}</button>)}<div className="insdash-local-nav-foot"><span className="insdash-live-dot" /> Live insurance records</div></aside>
      <section className="insdash-main"><div className="insdash-page-title"><div><p className="insdash-eyebrow">AMANI COVER · OPERATIONS</p><h1>{tab === 'overview' ? 'Insurance overview' : tabLabel}</h1><p className="insdash-muted">Manage member cover, review claims and follow contributions from one workspace.</p></div><div className="insdash-page-actions"><span>{new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span><button className="insdash-button" onClick={load} disabled={loading}>↻ Refresh</button></div></div>
      {error && <div className="insdash-error" role="alert"><b>Insurance data could not be loaded</b><span>{error}</span><button onClick={load}>Retry</button></div>}
      {loading ? <div className="insdash-loading"><span className="insdash-loader" />Loading insurance records…</div> : <>
        {(tab === 'overview' || tab === 'analytics') && <div className="insdash-metrics"><Metric label="Policies" value={members.length.toLocaleString()} note="Registered cover policies" /><Metric label="Active cover" value={activeCount.toLocaleString()} note="Policies with active status" accent="is-green" /><Metric label="Paid contributions" value={money(paidTotal)} note="Confirmed M-Pesa payments" accent="is-gold" /><Metric label="Claims to review" value={pendingCount.toLocaleString()} note={`${claims.length} claim records`} accent="is-red" /></div>}
        {tab === 'overview' && <div className="insdash-overview-grid"><section className="insdash-section-card"><div className="insdash-section-heading"><div><p className="insdash-eyebrow">MEMBER DIRECTORY</p><h2>Policies and people</h2><p className="insdash-muted">Search by member, policy number, phone or cover.</p></div><button className="insdash-link-button" onClick={() => setTab('sms')}>Send SMS →</button></div><div className="insdash-table-scroll"><table className="insdash-table"><thead><tr><th>Member / policy holder</th><th>Policy</th><th>Cover</th><th>People</th><th>Status</th><th /></tr></thead><tbody>{filteredMembers.slice(0, 8).map(m => <tr key={m.policyNumber}><td><b>{m.fullName || 'Unnamed member'}</b><small>{m.phone || 'No phone on file'}</small></td><td>{m.policyNumber || '—'}</td><td>{m.coverType || '—'}</td><td>{m.coveredCount || 1}</td><td><Status value={m.status} /></td><td><button className="insdash-row-action" onClick={() => { chooseSmsMember(m.phone); setTab('sms'); }}>SMS</button></td></tr>)}</tbody></table>{!filteredMembers.length && <Empty title="No member policies found">New policy records will appear here.</Empty>}</div></section>
          <section className="insdash-section-card"><div className="insdash-section-heading"><div><p className="insdash-eyebrow">CLAIM QUEUE</p><h2>Recently submitted</h2><p className="insdash-muted">Open a claim to review all submitted details.</p></div><button className="insdash-link-button" onClick={() => setTab('claims')}>All claims →</button></div><div className="insdash-recent-list">{claims.slice(0, 6).map(c => <button key={c.claimId} className="insdash-recent-claim" onClick={() => openClaim(c)}><span className="insdash-recent-icon">↗</span><span><b>{c.deceasedName || 'Claim'} <small>{c.reference}</small></b><small>{c.claimantFullName || 'Claimant'} · {dateText(c.createdAt)}</small></span><Status value={c.status} /></button>)}{!claims.length && <Empty title="No claims submitted">Submitted claim applications will appear here.</Empty>}</div></section></div>}
        {tab === 'claims' && <section className="insdash-section-card"><div className="insdash-section-heading"><div><p className="insdash-eyebrow">CLAIM REGISTER</p><h2>Submitted claims</h2><p className="insdash-muted">Select a record to view the claimant’s submitted information and policy contributions.</p></div><span className="insdash-total-pill">{filteredClaims.length} records</span></div><div className="insdash-table-scroll"><table className="insdash-table"><thead><tr><th>Claim reference</th><th>Deceased</th><th>Claimant</th><th>Policy</th><th>Submitted</th><th>Status</th><th /></tr></thead><tbody>{filteredClaims.map(c => <tr key={c.claimId} onClick={() => setSelectedClaim(c)}><td><b>{c.reference || `Claim ${c.claimId}`}</b></td><td>{c.deceasedName || '—'}</td><td>{c.claimantFullName || '—'}</td><td>{c.policyNumber || '—'}</td><td>{dateText(c.createdAt)}</td><td><Status value={c.status} /></td><td><button className="insdash-row-action" onClick={e => { e.stopPropagation(); setSelectedClaim(c); }}>Review →</button></td></tr>)}</tbody></table>{!filteredClaims.length && <Empty title="No matching claims">Try another search or wait for a submitted claim.</Empty>}</div></section>}
        {tab === 'analytics' && <div className="insdash-analytics-grid"><section className="insdash-section-card"><div className="insdash-section-heading"><div><p className="insdash-eyebrow">CLAIMS ANALYTICS</p><h2>Claim status mix</h2><p className="insdash-muted">Counts from live insurance claim records.</p></div></div>{(() => { const groups = ['submitted', 'under_review', 'approved', 'settled', 'rejected'].map(status => ({ status, count: claims.filter(c => String(c.status).toLowerCase() === status).length })); const max = Math.max(1, ...groups.map(g => g.count)); return <div className="insdash-bars">{groups.map(g => <div className="insdash-bar-row" key={g.status}><span>{g.status.replaceAll('_', ' ')}</span><div><i style={{ width: `${Math.max(g.count ? 6 : 0, (g.count / max) * 100)}%` }} /></div><b>{g.count}</b></div>); })()}</div><div className="insdash-analytics-note">Claims paid are not included as financial payouts: the backend currently records claim decisions, while M-Pesa disbursement is not configured.</div></section>
          <section className="insdash-section-card"><div className="insdash-section-heading"><div><p className="insdash-eyebrow">PORTFOLIO</p><h2>Cover mix</h2><p className="insdash-muted">Active and inactive policies by cover type.</p></div></div>{(() => { const types = [...new Set(members.map(p => p.coverType || 'Unspecified'))]; return types.length ? <div className="insdash-cover-list">{types.map(type => { const subset = members.filter(p => (p.coverType || 'Unspecified') === type); const active = subset.filter(p => String(p.status).toLowerCase() === 'active').length; return <div key={type} className="insdash-cover-row"><span><b>{type}</b><small>{active} active · {subset.length} total</small></span><strong>{subset.length}</strong></div>; })}</div> : <Empty title="No policy data">Portfolio analytics will appear when policies are available.</Empty>; })()}</section></div>}
        {tab === 'analytics' && <section className="insdash-section-card insdash-monthly-analytics"><div className="insdash-section-heading"><div><p className="insdash-eyebrow">PAYMENT HISTORY</p><h2>Paid contributions by month</h2><p className="insdash-muted">Confirmed M-Pesa collections over the last 12 months.</p></div></div>{(stats?.monthlyContributions || []).length ? <div className="insdash-bars">{stats.monthlyContributions.map(item => { const max = Math.max(1, ...stats.monthlyContributions.map(row => Number(row.amount || 0))); return <div className="insdash-bar-row" key={item.month}><span>{new Date(`${item.month}-01T00:00:00`).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' })}</span><div><i className="is-contribution" style={{ width: `${Math.max(5, Number(item.amount || 0) / max * 100)}%` }} /></div><b>{money(item.amount)}</b></div>; })}</div> : <Empty title="No paid contributions recorded">Monthly totals will appear when M-Pesa payments are confirmed.</Empty>}</section>}
        {tab === 'calendar' && <CalendarView policies={members} claims={claims} onClaim={openClaim} />}
        {tab === 'sms' && <section className="insdash-section-card insdash-sms-page"><div className="insdash-section-heading"><div><p className="insdash-eyebrow">MEMBER COMMUNICATION</p><h2>Send a text message</h2><p className="insdash-muted">Choose a policy holder and prepare a message in your device’s SMS app.</p></div></div><div className="insdash-sms-form"><label className="insdash-field-label">Member or policy holder<select value={smsMember} onChange={e => chooseSmsMember(e.target.value)}><option value="">Choose a member</option>{members.filter(m => m.phone).map(m => <option key={m.policyNumber} value={m.phone}>{m.fullName} · {m.policyNumber} · {m.phone}</option>)}</select></label><label className="insdash-field-label">Message<textarea rows="6" maxLength={480} value={smsMessage} onChange={e => setSmsMessage(e.target.value)} placeholder="Write a message to the policy holder…" /></label><div className="insdash-sms-footer"><span>{smsMessage.length}/480 characters · Opens your messaging app for confirmation</span><a className={`insdash-button insdash-button-dark ${!smsHref ? 'is-disabled' : ''}`} href={smsHref || undefined} aria-disabled={!smsHref} onClick={e => !smsHref && e.preventDefault()}>✉ Continue to SMS</a></div></div></section>}
      </>}
      <footer className="insdash-footer"><span>AMANI COVER · INSURANCE OPERATIONS</span><span>Member, claims and contribution records</span></footer>
      </section>
    </div>
    <ClaimDrawer claim={selectedClaim} onClose={() => setSelectedClaim(null)} onStatus={changeClaimStatus} busy={busyClaim} />
  </main>;
}
