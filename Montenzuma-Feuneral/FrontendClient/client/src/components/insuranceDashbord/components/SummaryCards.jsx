import React from 'react';
export default function SummaryCards({ policies, stats }) {
  const active = policies.filter(p => String(p.status).toLowerCase() === 'active').length;
  const covered = policies.reduce((sum, p) => sum + Number(p.coveredCount || 1), 0);
  const cards = [['Members', policies.length.toLocaleString(), 'Registered Amani Cover policies'], ['Active cover', active.toLocaleString(), 'Members with active status'], ['People covered', covered.toLocaleString(), 'Across all listed policies'], ['Claims to review', Number(stats?.pendingClaims || 0).toLocaleString(), `${Number(stats?.totalClaims || 0).toLocaleString()} claims recorded`]];
  return <section className="insdash-summary" aria-label="Insurance summary">{cards.map(([label, value, note], i) => <article className="insdash-summary-card" key={label}><div className="insdash-summary-top"><span>{label}</span><span className={`insdash-summary-icon insdash-icon-${i}`}>{['◉', '✓', '♧', '▤'][i]}</span></div><strong>{value}</strong><small>{note}</small></article>)}</section>;
}
