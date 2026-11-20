import React from 'react';

/* ============================================================================
   StatCard — KPI stat card with trend indicator.
   Props: icon (React component), label, value, sub, color, trend, trendLabel
   ============================================================================ */
const StatCard = ({ icon: Icon, label, value, sub, color, trend, trendLabel }) => {
  const isUp = trend != null && trend >= 0;

  return (
    <div className="ec-stat-card">
      <div className="ec-stat-wrap" style={{ borderColor: color }}>
        <div className="ec-stat-ic" style={{ background: `${color}1a`, color }}>
          <Icon size={20} />
        </div>
        <div className="ec-stat-body">
          <div className="ec-stat-head">
            <div className="ec-stat-lbl">{label}</div>
            {trend != null && (
              <div className={`ec-stat-trend ${isUp ? 'up' : 'down'}`}>
                <span style={{ color: isUp ? '#059669' : '#dc2626' }}>
                  {isUp ? '▲ ' : '▼ '}
                </span>
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div className="ec-stat-val">{value}</div>
          {sub != null && <div className="ec-stat-sub">{sub}</div>}
          {trendLabel != null && <div className="ec-stat-trend-label">{trendLabel}</div>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;