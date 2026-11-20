import React from 'react';
import { STAGES } from '../data/stages';

/* ============================================================================
   StageProgress — horizontal stage progress bar with dots.
   ============================================================================ */
const StageProgress = ({ currentStage, showLabels = true }) => {
  const currentIdx = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="ec-stage-progress">
      <div className="ec-stage-dots">
        {STAGES.map((s, i) => {
          let cls = '';
          if (i < currentIdx) cls = 'done';
          else if (i === currentIdx) cls = 'current';
          return (
            <div key={s.key} className={`ec-stage-dot ${cls}`} style={{ background: s.color }} />
          );
        })}
      </div>
      {showLabels && (
        <div className="ec-stage-labels">
          {STAGES.map((s, i) => {
            let cls = '';
            if (i < currentIdx) cls = 'done';
            else if (i === currentIdx) cls = 'current';
            return (
              <span key={s.key} className={`ec-stage-label ${cls}`}>
                {s.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StageProgress;