import React from 'react';

/* ============================================================================
   CoffinCard — kanban card for production floor view.
   ============================================================================ */
const CoffinCard = ({ coffin, stageIdx, onSelect, onPause, onResume, onAdvance, onDispatch, onBack }) => {
  const STAGES_LIST = [
    { key: 'building', name: 'Building', color: '#2563EB' },
    { key: 'waiting', name: 'Waiting Bay', color: '#D97706' },
    { key: 'painting', name: 'Painting', color: '#7C3AED' },
    { key: 'interior', name: 'Interior', color: '#0891B2' },
    { key: 'store', name: 'Store', color: '#059669' },
  ];
  const stage = STAGES_LIST[stageIdx];
  const isLast = stageIdx === STAGES_LIST.length - 1;
  const isFirst = stageIdx === 0;
  const isRush = coffin.priority === 'rush';
  const isPaused = coffin.paused === true;
  const colorHex = COLOR_HEX[coffin.color] || '#999';
  const workerName = coffin.workers?.[0] ? WORKERS_LIST.find((w) => w.id === coffin.workers[0])?.name : 'Unassigned';

  return (
    <div
      className={`ec-coffin-card ${isRush ? 'rush' : ''} ${isPaused ? 'paused' : ''}`}
      onClick={() => onSelect?.(coffin.id)}
    >
      <div className="ec-cc-top">
        <span className="ec-cc-id">#{coffin.id}</span>
        {isPaused ? (
          <span className="ec-cc-priority paused-pill">Paused</span>
        ) : (
          <span className={`ec-cc-priority ${coffin.priority}`}>
            {isRush ? 'Rush' : 'Normal'}
          </span>
        )}
      </div>
      <div className="ec-cc-name">{coffin.name}</div>
      <div className="ec-cc-tags">
        <span className="ec-cc-tag">
          <span className="ec-cc-color-dot" style={{ background: colorHex }} />
          {coffin.color}
        </span>
        <span className="ec-cc-tag">{coffin.type}</span>
        <span className="ec-cc-tag">{coffin.size}</span>
      </div>
      <div className="ec-cc-meta-row">
        <span className="ec-cc-worker-name">{workerName}</span>
        <span className={`ec-cc-deadline ${isRush ? 'urgent' : ''}`}>{coffin.deadline}</span>
      </div>
      {isPaused && coffin.pauseReason && (
        <div className="ec-cc-pause-reason">Reason: {coffin.pauseReason}</div>
      )}
      <div className="ec-cc-progress-wrap">
        <div className="ec-cc-progress-head">
          <span>Progress</span>
          <span className={`ec-cc-progress-pct ${stage?.color}`}>{coffin.progress}%</span>
        </div>
        <div className="ec-cc-progress-bar">
          <div className={`ec-cc-progress-fill ${stage?.color}`} style={{ width: `${coffin.progress}%` }} />
        </div>
      </div>
      <div className="ec-cc-actions" onClick={(e) => e.stopPropagation()}>
        {isPaused ? (
          <button className="ec-cc-btn resume" onClick={() => onResume?.(coffin.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Resume
          </button>
        ) : (
          <>
            {!isFirst && (
              <button className="ec-cc-btn back" onClick={() => onBack?.(coffin.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
            )}
            <button className="ec-cc-btn pause" onClick={() => onPause?.(coffin.id)} title="Pause this order">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </button>
            {!isLast ? (
              <button className="ec-cc-btn advance" onClick={() => onAdvance?.(coffin.id)}>
                Advance
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ) : (
              <button className="ec-cc-btn dispatch" onClick={() => onDispatch?.(coffin.id)}>
                Dispatch
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

let WORKERS_LIST = [];
let COLOR_HEX = {};

export { CoffinCard, setCoffinCardDeps };

function setCoffinCardDeps(workers, colors) {
  WORKERS_LIST = workers;
  COLOR_HEX = colors;
}

export default CoffinCard;