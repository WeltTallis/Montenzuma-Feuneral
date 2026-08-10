// src/components/analysis/PredictiveInsights.jsx
import React from "react";

const PredictiveInsights = () => {
  const insights = [
    { icon: "package", iconBg: "warning", title: "Inventory Forecast", message: "Oak Standard coffin stock may fall below safety level within 4 days based on current booking pace.", action: "Order Now", actionColor: "warning" },
    { icon: "truck", iconBg: "info", title: "Fleet Pressure Tomorrow", message: "Tomorrow schedule is at 87% fleet capacity. H-04 should be pre-positioned in Westlands by 07:30.", action: "Plan Route", actionColor: "info" },
    { icon: "clock", iconBg: "warning", title: "Scheduling Risk", message: "3 funerals tomorrow have under 45 min transport gap. Consider reassigning FN-2058 to H-04.", action: "View Schedule", actionColor: "warning" },
    { icon: "trending-up", iconBg: "purple", title: "Demand Forecast", message: "Based on booking patterns, demand expected +18% next week. Consider pre-stocking Mahogany Deluxe.", action: "See Forecast", actionColor: "purple" },
  ];

  return (
    <div className="predictive-insights">
      <div className="panel-header">
        <div className="panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594zM20 2v4m2-2h-4"/>
            <circle cx="4" cy="20" r="2"/>
          </svg>
          <span>Operational Intelligence</span>
        </div>
        <span className="ai-badge">AI Insights</span>
      </div>
      <div className="insights-list">
        {insights.map((insight, idx) => (
          <div key={idx} className="insight-item">
            <div className={"insight-icon " + insight.iconBg}>
              <div className="insight-icon-inner"></div>
            </div>
            <div className="insight-content">
              <div className="insight-title">{insight.title}</div>
              <div className="insight-message">{insight.message}</div>
            </div>
            <button className={"insight-action " + insight.actionColor}>
              {insight.action}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="8" cy="21" r="1"/>
                <circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PredictiveInsights;
