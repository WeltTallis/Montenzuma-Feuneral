import React from 'react';
import { STAGE_INDEX, STAGE_DESC } from '../data/stages';

/* ============================================================================
   OrderCard — dashboard/orders list card with stage progress.
   ============================================================================ */
const OrderCard = ({ order, onSelect, onStatusChange }) => {
  const stageIdx = STAGE_INDEX[order.stage] || 0;
  const stage = STAGES_LIST[stageIdx];
  const isDark = order.id === 'EC-2039' || order.id === 'EC-2037';
  const darkCls = isDark ? 'dark' : '';
  const stageBgClass = `stage-${order.stage}`;

  // Worker name only
  const firstWorker = order.workers?.[0] ? WORKERS_LIST.find((w) => w.id === order.workers[0]) : null;
  const workerName = firstWorker
    ? order.workers.length > 1
      ? `${firstWorker.name.split(' ')[0]} +${order.workers.length - 1} others`
      : firstWorker.name
    : 'Unassigned';

  let pillCls = 'ontrack';
  let pillLabel = stage?.name || order.stage;
  if (order.priority === 'rush') {
    pillCls = 'urgent';
    pillLabel = 'Urgent';
  }
  const deadlineCls = order.priority === 'rush' ? 'urgent' : '';

  // Stage progress dots
  const stagesHTML = STAGES_LIST.map((s, i) => {
    let cls = '';
    if (i < stageIdx) cls = 'done';
    else if (i === stageIdx) cls = 'current';
    return <div key={s.key} className={`ec-stage ${cls}`} />;
  });

  const labelsHTML = STAGES_LIST.map((s, i) => {
    let cls = '';
    if (i < stageIdx) cls = 'done';
    else if (i === stageIdx) cls = 'current';
    return <span key={s.key} className={`ec-stage-label ${cls}`}>{s.name}</span>;
  });

  return (
    <div
      className={`ec-order-card ${stageBgClass} ${darkCls}`}
      onClick={() => onSelect?.(order.id)}
    >
      <div className="ec-order-top">
        <div>
          <div className="ec-order-id">Order #{order.id}</div>
          <div className="ec-order-title">{order.name}</div>
          <div className="ec-order-meta">
            {order.client} · {order.material} · {order.size}
          </div>
        </div>
        <span className={`ec-status-pill ${pillCls}`}>{pillLabel}</span>
      </div>
      <div>
        <div className="ec-stages">{stagesHTML}</div>
        <div className="ec-stage-labels">{labelsHTML}</div>
      </div>
      <div className="ec-oc-bottom">
        <div className="ec-oc-stats-row">
          <div className="ec-oc-stat">
            <span className="ec-oc-stat-label">Started</span>
            <span className="ec-oc-stat-value">
              {order.startedAt} <em>· {order.elapsed}</em>
            </span>
          </div>
          <div className="ec-oc-stat">
            <span className="ec-oc-stat-label">Deadline</span>
            <span className={`ec-oc-stat-value ${deadlineCls}`}>{order.deadline}</span>
          </div>
          <div className="ec-oc-stat" style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <span className="ec-oc-stat-label">Assigned to</span>
            <span className="ec-oc-stat-value">{workerName}</span>
          </div>
        </div>
        <div className="ec-oc-progress-row">
          <span className="ec-oc-pct">{order.progress}%</span>
          <div className="ec-oc-bar">
            <div className="ec-oc-fill" style={{ width: `${order.progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Imported at bottom to avoid circular reference issues with STAGES_LIST/WORKERS_LIST
let STAGES_LIST = [];
let WORKERS_LIST = [];

export { OrderCard, setOrderCardDeps };

function setOrderCardDeps(stages, workers) {
  STAGES_LIST = stages;
  WORKERS_LIST = workers;
}

export default OrderCard;