import React, { Fragment } from 'react';

/* ============================================================================
   ReportsView — AI predictions, trends, restock recommendations.
   ============================================================================ */
const ReportsView = ({ materials = [], usageLog = [] }) => {
  const now = new Date();
  const last30 = new Date(now); last30.setDate(now.getDate() - 30);

  const predictions = materials.map((m) => {
    const usageEvents = usageLog.filter((e) => e.materialId === m.id && e.type === 'use');
    const recentUsage = usageEvents.filter((e) => new Date(e.timestamp) >= last30);
    const totalUsed30 = recentUsage.reduce((sum, e) => sum + e.qty, 0);
    const dailyUsage = totalUsed30 / 30;
    const daysUntilOut = dailyUsage > 0 ? Math.floor(m.quantity / dailyUsage) : Infinity;

    let status = 'ok';
    if (daysUntilOut <= 2 || m.quantity <= m.minLevel * 0.5) status = 'critical';
    else if (daysUntilOut <= 7 || m.quantity <= m.minLevel) status = 'warning';

    let recommendation = '';
    if (status === 'critical') recommendation = `Order ${Math.ceil((m.minLevel * 3) - m.quantity)} ${m.unit} of ${m.name} within ${daysUntilOut === 0 ? 'today' : daysUntilOut + ' days'}`;
    else if (status === 'warning') recommendation = `Plan restock of ${Math.ceil(m.minLevel * 2)} ${m.unit} in the next ${daysUntilOut} days`;
    else recommendation = `Stock healthy. At ${dailyUsage.toFixed(1)} ${m.unit}/day, min level reached in ${Math.floor((m.quantity - m.minLevel) / Math.max(dailyUsage, 0.01))} days`;

    return { material: m, dailyUsage, daysUntilOut, status, recommendation };
  });

  const critical = predictions.filter((p) => p.status === 'critical');
  const warning = predictions.filter((p) => p.status === 'warning');

  return (
    <div className="ec-reports-view">
      <div className="ec-view-header">
        <div>
          <div className="ec-view-subtitle">AI Predictions</div>
          <h1 className="ec-view-title">Workshop intelligence</h1>
        </div>
      </div>

      <div className="ec-ai-hero">
        <div className="ec-ai-hero-head">
          <span className="ec-ai-badge">AI Predictions</span>
          <div className="ec-ai-hero-title">Workshop intelligence</div>
        </div>
        <div className="ec-ai-hero-sub">
          Analysing {usageLog.length} material events from the last 30 days.
          Forecasts refresh as you restock or use materials.
        </div>
        <div className="ec-ai-hero-stats">
          <div className="ec-ai-hero-stat">
            <div className="ec-ai-hero-stat-num">{critical.length}</div>
            <div className="ec-ai-hero-stat-lbl">Critical items</div>
          </div>
          <div className="ec-ai-hero-stat">
            <div className="ec-ai-hero-stat-num">{warning.length}</div>
            <div className="ec-ai-hero-stat-lbl">Warnings</div>
          </div>
          <div className="ec-ai-hero-stat">
            <div className="ec-ai-hero-stat-num">{predictions.length - critical.length - warning.length}</div>
            <div className="ec-ai-hero-stat-lbl">Healthy items</div>
          </div>
          <div className="ec-ai-hero-stat">
            <div className="ec-ai-hero-stat-num">0</div>
            <div className="ec-ai-hero-stat-lbl">Avg units/day</div>
          </div>
        </div>
      </div>

      <div className="ec-ai-section">
        <div className="ec-ai-section-head">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          Smart recommendations
        </div>
        <div className="ec-rec-list">
          <Fragment>
            {predictions.filter((p) => p.status !== 'ok').map((p) => (
              <div key={p.material.id} className={`ec-rec-item ${p.status}`}>
                <div className="ec-rec-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {p.status === 'critical' ? (
                      <>
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </>
                    ) : (
                      <>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </>
                    )}
                  </svg>
                </div>
                <div className="ec-rec-text">
                  {p.recommendation}
                  <span className={`ec-rec-tag ${p.status}`}>{p.status === 'critical' ? 'Action needed' : 'Plan ahead'}</span>
                </div>
              </div>
            ))}
            {predictions.filter((p) => p.status === 'ok').length > 0 && (
              <div className="ec-rec-item info">
                <div className="ec-rec-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="ec-rec-text">
                  All other materials are within healthy stock levels.
                  <span className="ec-rec-tag info">All clear</span>
                </div>
              </div>
            )}
          </Fragment>
        </div>
      </div>

      <div className="ec-ai-section">
        <div className="ec-ai-section-head">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 14l4-4 4 4 5-7" />
          </svg>
          Material run-out forecasts
        </div>
        <div className="ec-pred-grid">
          {predictions.map((p) => {
            const m = p.material;
            const daysStr = p.daysUntilOut === Infinity ? '8' : p.daysUntilOut === 0 ? 'today' : p.daysUntilOut + 'd';
            return (
              <div key={m.id} className={`ec-pred-card ${p.status}`}>
                <div className="ec-pred-head">
                  <div>
                    <div className="ec-pred-name">{m.name}</div>
                    <div className="ec-pred-cat">{m.category}</div>
                  </div>
                  <span className={`ec-pred-status ${p.status}`}>{p.status === 'critical' ? 'Critical' : p.status === 'warning' ? 'Warning' : 'OK'}</span>
                </div>
                <div className="ec-pred-body">
                  <div className="ec-pred-stat">
                    <span className="ec-pred-stat-lbl">Current</span>
                    <span className="ec-pred-stat-val">{m.quantity} {m.unit}</span>
                  </div>
                  <div className="ec-pred-stat">
                    <span className="ec-pred-stat-lbl">Daily use</span>
                    <span className="ec-pred-stat-val">{p.dailyUsage.toFixed(1)} {m.unit}</span>
                  </div>
                  <div className="ec-pred-stat">
                    <span className="ec-pred-stat-lbl">Runs out in</span>
                    <span className={`ec-pred-stat-val ${p.status}`}>{daysStr}</span>
                  </div>
                </div>
                <div className="ec-pred-rec">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <div>{p.recommendation}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
