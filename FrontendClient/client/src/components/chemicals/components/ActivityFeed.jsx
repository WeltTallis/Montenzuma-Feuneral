import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock3, PackageCheck } from 'lucide-react';

const dateLabel = (date) => {
  if (!date) return 'Date unavailable';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(parsed);
};

const activityType = (type) => {
  if (type === 'received') return { label: 'Stock received', Icon: ArrowDownLeft, tone: 'received' };
  if (type === 'consumed') return { label: 'Usage recorded', Icon: ArrowUpRight, tone: 'consumed' };
  if (type === 'transferred') return { label: 'Stock distributed', Icon: ArrowUpRight, tone: 'consumed' };
  if (type === 'adjusted') return { label: 'Stock adjusted', Icon: PackageCheck, tone: 'adjusted' };
  return { label: type || 'Inventory updated', Icon: PackageCheck, tone: 'adjusted' };
};

const ActivityFeed = ({ transactions, loading }) => (
  <section className="panel activity-panel">
    <div className="panel-heading">
      <div><h2>Recent activity</h2><p>Latest stock movements in this inventory</p></div>
      <Clock3 size={17} color="#779184" />
    </div>
    {loading && !transactions.length ? <p className="activity-empty">Loading activity…</p> : !transactions.length ? (
      <p className="activity-empty">No recent stock movements.</p>
    ) : (
      <ul className="activity-list">
        {transactions.slice(0, 8).map((transaction) => {
          const activity = activityType(transaction.transaction_type);
          const Icon = activity.Icon;
          return (
            <li key={transaction.id}>
              <span className={`activity-icon ${activity.tone}`}><Icon size={16} /></span>
              <div className="activity-copy">
                <strong>{activity.label}: {transaction.chemical_name || 'Chemical'}</strong>
                <small>{transaction.performed_by || transaction.performed_by_name || 'Team member'} · {dateLabel(transaction.created_at)}</small>
              </div>
              <span className={`activity-quantity ${activity.tone}`}>
                {activity.tone === 'consumed' ? '−' : '+'}{Number(transaction.quantity || 0).toLocaleString()} {transaction.unit || ''}
              </span>
            </li>
          );
        })}
      </ul>
    )}
    <style>{`
      .activity-panel { overflow:hidden; }
      .activity-list { list-style:none;margin:0;padding:0 20px 10px; }
      .activity-list li { display:flex;align-items:center;gap:11px;padding:11px 0;border-top:1px solid #eef2ef; }
      .activity-icon { width:32px;height:32px;display:grid;place-items:center;flex:0 0 auto;border-radius:10px; }
      .activity-icon.received { color:#267858;background:#eaf5ee; }.activity-icon.consumed { color:#b87832;background:#fff4e8; }.activity-icon.adjusted { color:#526db0;background:#edf1fb; }
      .activity-copy { min-width:0;flex:1; }.activity-copy strong,.activity-copy small { display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
      .activity-copy strong { color:#355448;font-size:11px;font-weight:720; }.activity-copy small { color:#94a29b;font-size:10px;margin-top:4px; }
      .activity-quantity { white-space:nowrap;font-size:10px;font-weight:750; }.activity-quantity.received { color:#32815d; }.activity-quantity.consumed { color:#bd803c; }.activity-quantity.adjusted { color:#6479a8; }
      .activity-empty { padding:8px 20px 20px;color:#91a098;font-size:12px; }
      @media(max-width:520px) { .activity-list { padding:0 13px 8px; }.activity-copy small { max-width:190px; }.activity-quantity { font-size:9px; } }
    `}</style>
  </section>
);

export default ActivityFeed;
