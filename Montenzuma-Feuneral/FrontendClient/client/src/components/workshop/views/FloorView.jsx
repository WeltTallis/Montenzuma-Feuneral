import React, { useMemo, useCallback } from 'react';
import { CoffinCard } from '../components/CoffinCard';
import { setCoffinCardDeps } from '../components/CoffinCard';

/* ============================================================================
   FloorView — production floor kanban board.
   ============================================================================ */
const FloorView = ({ orders = [], workers = [], colors = {}, onPause, onResume, onAdvance, onDispatch, onBack, onOrderSelect }) => {
  useMemo(() => {
    if (typeof setCoffinCardDeps === 'function') setCoffinCardDeps(workers, colors);
  }, [workers, colors, setCoffinCardDeps]);

  const STAGES = [
    { key: 'building', name: 'Building', color: '#2563EB' },
    { key: 'waiting', name: 'Waiting Bay', color: '#D97706' },
    { key: 'painting', name: 'Painting', color: '#7C3AED' },
    { key: 'interior', name: 'Interior', color: '#0891B2' },
    { key: 'store', name: 'Store', color: '#059669' },
  ];

  const columns = STAGES.map((stage, i) => {
    const stageOrders = orders.filter((o) => o.stage === stage.key);
    return {
      key: stage.key,
      name: stage.name,
      color: stage.color,
      orders: stageOrders,
    };
  });

  return (
    <div className="ec-floor-view">
      <div className="ec-view-header">
        <div>
          <div className="ec-view-subtitle">Production Floor</div>
          <h1 className="ec-view-title">Live production board</h1>
        </div>
      </div>

      <div className="ec-kanban">
        {columns.map((col) => (
          <div key={col.key} className="ec-kb-col" style={{ borderTopColor: col.color, background: `${col.color}15` }}>
            <div className="ec-kb-col-head">
              <div className="ec-kb-col-title">
                <span className="ec-stage-dot" style={{ background: col.color }} />
                {col.name}
              </div>
              <span className="ec-kb-col-count">{col.orders.length}</span>
            </div>
            <div className="ec-kb-col-body">
              {col.orders.length === 0 ? (
                <div className="ec-kb-empty">No coffins in this stage</div>
              ) : (
                col.orders.map((c) => (
                  <CoffinCard
                    key={c.id}
                    coffin={c}
                    stageIdx={STAGES.findIndex((s) => s.key === col.key)}
                    onSelect={onOrderSelect}
                    onPause={onPause}
                    onResume={onResume}
                    onAdvance={onAdvance}
                    onDispatch={onDispatch}
                    onBack={onBack}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FloorView;
