import React from 'react';
export default function DashboardHeader({ query, onQuery, onAdd }) {
  return <header className="insdash-header"><div className="insdash-brand"><span className="insdash-brand-mark">A</span><span><b>Montenzuma</b><small>Amani Cover · Member services</small></span></div><div className="insdash-header-right"><label className="insdash-search"><span aria-hidden="true">⌕</span><input value={query} onChange={e => onQuery(e.target.value)} placeholder="Search members or policy number" /></label><button className="insdash-button insdash-button-dark" onClick={onAdd}>＋ <span>New member</span></button></div></header>;
}
