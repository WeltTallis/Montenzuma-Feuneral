import React from 'react';
import { AlertTriangle, Package, ShieldCheck, TrendingUp } from 'lucide-react';
import styled from 'styled-components';

const Cards = styled.section`
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;
  .summary-card { display:flex;align-items:center;gap:13px;min-width:0;padding:17px;border:1px solid #e6ece8;border-radius:15px;background:#fff;box-shadow:0 5px 22px rgba(32,64,52,.035); }
  .summary-icon { width:39px;height:39px;display:grid;place-items:center;flex:0 0 auto;border-radius:12px; }
  .summary-label { color:#788a84;font-size:11px;font-weight:750;text-transform:uppercase;letter-spacing:.07em; }
  .summary-value { color:#17352f;margin-top:5px;font-size:24px;line-height:1;letter-spacing:-.04em;font-weight:820; }
  .summary-note { color:#8b9b95;margin-top:5px;font-size:11px; }
  @media(max-width:780px) { grid-template-columns:repeat(2,minmax(0,1fr)); }
  @media(max-width:430px) { gap:8px;.summary-card { padding:12px 10px;gap:8px; }.summary-icon { width:32px;height:32px; }.summary-value { font-size:20px; }.summary-label { font-size:9px; } }
`;

const SummaryCards = ({ chemicals, summary, ppeRequests }) => {
  const lowStock = chemicals.filter((chemical) =>
    Number(chemical.current_stock ?? chemical.quantity_available) <= Number(chemical.min_stock_level || 0)
  ).length;
  const usage = Number(summary.total_usage_30d || 0);
  const cards = [
    { label: 'Chemical items', value: chemicals.length, note: 'Active inventory', icon: Package, tone: ['#e9f4ef', '#176b53'] },
    { label: 'Low stock', value: lowStock, note: lowStock ? 'Needs attention' : 'All levels healthy', icon: AlertTriangle, tone: ['#fff3e5', '#c87820'] },
    { label: 'Usage · 30 days', value: Number.isFinite(usage) ? usage.toLocaleString() : '0', note: 'Across all branches', icon: TrendingUp, tone: ['#edf1fb', '#526db0'] },
    { label: 'PPE requests', value: ppeRequests.length, note: 'Requests on record', icon: ShieldCheck, tone: ['#f2edfa', '#8054a6'] },
  ];
  return (
    <Cards aria-label="Inventory summary">
      {cards.map(({ label, value, note, icon: Icon, tone }) => (
        <div className="summary-card" key={label}>
          <div className="summary-icon" style={{ background:tone[0],color:tone[1] }}><Icon size={19} /></div>
          <div><div className="summary-label">{label}</div><div className="summary-value">{value}</div><div className="summary-note">{note}</div></div>
        </div>
      ))}
    </Cards>
  );
};

export default SummaryCards;