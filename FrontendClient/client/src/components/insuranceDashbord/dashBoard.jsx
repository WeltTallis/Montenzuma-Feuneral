import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { insuranceApi } from '../../api/insuranceApi';
import DashboardHeader from './components/DashboardHeader';
import SummaryCards from './components/SummaryCards';
import MembersPanel from './components/MembersPanel';
import MemberDrawer from './components/MemberDrawer';
import './index.css';

export default function InsuranceDashboard() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([insuranceApi.listPolicies(), insuranceApi.getStats()]).then(([policyResponse, statsResponse]) => {
      if (!alive) return;
      setMembers(Array.isArray(policyResponse) ? policyResponse : policyResponse?.policies || policyResponse?.data || []);
      setStats(statsResponse?.data || statsResponse);
    }).catch(err => { if (alive) setError(err?.response?.data?.message || err?.message || 'Could not load insurance data.'); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? members.filter(m => [m.fullName, m.policyNumber, m.phone, m.coverType].some(value => String(value || '').toLowerCase().includes(term))) : members;
  }, [members, query]);

  return <main className="insdash">
    <DashboardHeader query={query} onQuery={setQuery} onAdd={() => navigate('/amani/cover/apply')} />
    <div className="insdash-content">
      <div className="insdash-title-row"><div><p className="insdash-eyebrow">AMANI COVER · OPERATIONS</p><h1>Insurance dashboard</h1><p className="insdash-muted">A clear view of members, cover and claims.</p></div><span className="insdash-date">{new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
      <SummaryCards policies={members} stats={stats} />
      {error && <div className="insdash-error" role="alert"><b>Insurance data is unavailable</b><span>{error}</span><button onClick={() => window.location.reload()}>Retry</button></div>}
      <MembersPanel members={filtered} selected={selected} onSelect={setSelected} onOpen={setProfile} loading={loading} />
      <footer className="insdash-footer"><span>AMANI COVER</span><span>Member services dashboard</span></footer>
    </div>
    <MemberDrawer member={profile} onClose={() => setProfile(null)} />
  </main>;
}
