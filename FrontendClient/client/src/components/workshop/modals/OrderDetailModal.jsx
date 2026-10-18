import React, { useState, useCallback } from 'react';
import { STAGES, STAGE_INDEX, STAGE_DESC } from '../data/stages';

/* ============================================================================
   OrderDetailModal — view and update order details.
   Props: open, order, onClose, onStatusChange, onDelete
   ============================================================================ */
const OrderDetailModal = ({ open, order, onClose, onStatusChange, onDelete }) => {
  const [currentStageKey, setCurrentStageKey] = useState(order?.stage || 'building');

  const stageIdx = STAGE_INDEX[currentStageKey] || 0;
  const currentStage = STAGES[stageIdx];

  const handleStageChange = useCallback((newStageKey) => {
    if (newStageKey === currentStageKey) return;
    onStatusChange?.(order.id, newStageKey);
    setCurrentStageKey(newStageKey);
  }, [currentStageKey, order.id, onStatusChange]);

  const workersHTML = order?.workers?.map((w) => {
    const initials = w.name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    return (
      <span key={w.id} className="ec-modal-worker-chip">
        <span className="ec-chip-av" style={{ background: w.color || '#888' }}>{initials}</span>
        {w.name}
      </span>
    );
  }) || [];

  const stagesListHTML = STAGES.map((s, i) => {
    const isCurrent = i === stageIdx;
    return (
      <button
        key={s.key}
        className={`ec-stage-update-btn ${s.cls} ${isCurrent ? 'current' : ''}`}
        disabled={isCurrent}
        onClick={() => handleStageChange(s.key)}
        style={{ '--sc': s.color, '--sbg': s.bg, '--sborder': `${s.color}40` }}
      >
        <span className="ec-stage-num">{i + 1}</span>
        <div className="ec-stage-info">
          <div className="ec-sn">{s.name}</div>
          <div className="ec-sd">{STAGE_DESC[s.key]}</div>
        </div>
        {isCurrent && <span className="ec-stage-current-tag">Current</span>}
      </button>
    );
  });

  const pillCls = order?.priority === 'rush' ? 'urgent' : 'ontrack';
  const pillLabel = order?.priority === 'rush' ? 'Urgent' : currentStage?.name;

  return (
    <div className="ec-modal-overlay open" onClick={onClose}>
      <div className="ec-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="ec-modal-head">
          <div>
            <div className="ec-mh-id">Order #{order?.id}</div>
            <div className="ec-mh-name">{order?.name}</div>
          </div>
          <button className="ec-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="ec-modal-body">
          <div className="ec-modal-section">
            <div className="ec-modal-section-title">Order details</div>
            <div className="ec-modal-info-grid">
              <div className="ec-modal-info-item">
                <div className="ec-lbl">Client</div>
                <div className="ec-val">{order?.client}</div>
              </div>
              <div className="ec-modal-info-item">
                <div className="ec-lbl">Type</div>
                <div className="ec-val">{order?.type}</div>
              </div>
              <div className="ec-modal-info-item">
                <div className="ec-lbl">Material</div>
                <div className="ec-val">{order?.material}</div>
              </div>
              <div className="ec-modal-info-item">
                <div className="ec-lbl">Size</div>
                <div className="ec-val">{order?.size}</div>
              </div>
              <div className="ec-modal-info-item">
                <div className="ec-lbl">Color</div>
                <div className="ec-val">{order?.color}</div>
              </div>
              <div className="ec-modal-info-item">
                <div className="ec-lbl">Deadline</div>
                <div className="ec-val">{order?.deadline}</div>
              </div>
            </div>
          </div>

          <div className="ec-modal-progress-block">
            <div className="ec-modal-progress-head">
              <span>Build progress</span>
              <span className="ec-pct">{order?.progress}%</span>
            </div>
            <div className="ec-modal-progress-track">
              <div className="ec-modal-progress-fill" style={{ width: `${order?.progress || 0}%` }} />
            </div>
          </div>

          <div className="ec-modal-section">
            <div className="ec-modal-section-title">Assigned workers ({order?.workers?.length || 0})</div>
            <div className="ec-modal-workers">{workersHTML || '<span style="color:#999;font-size:12px;">No workers assigned</span>'}</div>
          </div>

          <div className="ec-modal-section">
            <div className="ec-modal-section-title">Update status — click a stage to move this order</div>
            <div className="ec-stage-update-list">{stagesListHTML}</div>
          </div>
        </div>
        <div className="ec-modal-footer">
          <button className="ec-modal-delete-btn" onClick={() => onDelete?.(order?.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            </svg>
            Delete order
          </button>
          <button className="ec-modal-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;