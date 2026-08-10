// src/components/analysis/NeedsAttentionPanel.jsx
// Alerts and items needing attention — date-driven real data.
import React, { useEffect, useState } from "react";
import { fetchNeedsAttentionData } from "../../api/dashboardDataApi";

const getSeverityColor = (severity) => {
  const colors = {
    danger: "severity-danger",
    warning: "severity-warning",
    info: "severity-info",
  };
  return colors[severity] || "severity-info";
};

const getIcon = (name) => {
  const icons = {
    truck: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m10 0H9m10 0h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
        <circle cx="17" cy="18" r="2"/>
        <circle cx="7" cy="18" r="2"/>
      </svg>
    ),
    clock: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
    package: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73zm1 .27V12"/>
        <path d="M3.29 7L12 12l8.71-5M7.5 4.27l9 5.15"/>
      </svg>
    ),
    "file-x": (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
        <path d="M14 2v5a1 1 0 0 0 1 1h5m-5.5 4.5l-5 5m0-5l5 5"/>
      </svg>
    ),
    "flower-2": (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1"/>
        <circle cx="12" cy="8" r="2"/>
        <path d="M12 10v12m0 0c4.2 0 7-1.667 7-5c-4.2 0-7 1.667-7 5m0 0c-4.2 0-7-1.667-7-5c4.2 0 7 1.667 7 5"/>
      </svg>
    ),
    users: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.128a4 4 0 0 1 0 7.744M22 21v-2a4 4 0 0 0-3-3.87"/>
        <circle cx="9" cy="7" r="4"/>
      </svg>
    ),
  };
  return icons[name] || icons.clock;
};

const NeedsAttentionPanel = ({ date }) => {
  const [alerts, setAlerts] = useState([]);

  // Independent alerts fetch for this component (date-driven).
  useEffect(() => {
    let mounted = true;
    fetchNeedsAttentionData(date)
      .then((data) => { if (mounted) setAlerts(data.alerts || []); })
      .catch(() => { if (mounted) setAlerts([]); });
    return () => { mounted = false; };
  }, [date]);

  return (
    <div className="needs-attention">
      <div className="panel-header">
        <div className="panel-title">
          <div className="severity-indicator danger"></div>
          <span>Needs Attention</span>
          <span className="alert-count danger">{alerts.length}</span>
        </div>
        <button className="view-all-link">View all alerts</button>
      </div>
      <div className="alerts-list">
        {alerts.length === 0 && (
          <div className="alert-item severity-info">
            <div className="alert-icon severity-info">
              {getIcon("clock")}
            </div>
            <div className="alert-content">
              <div className="alert-header">
                <span className="alert-title">All clear</span>
                <span className="alert-time">Now</span>
              </div>
              <div className="alert-message">No issues requiring attention on the selected date.</div>
            </div>
            <button className="alert-action severity-info">OK</button>
          </div>
        )}
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-item ${getSeverityColor(alert.severity)}`}>
            <div className={`alert-icon ${getSeverityColor(alert.severity)}`}>
              {getIcon(alert.icon)}
            </div>
            <div className="alert-content">
              <div className="alert-header">
                <span className="alert-title">{alert.title}</span>
                <span className="alert-time">{alert.time}</span>
              </div>
              <div className="alert-message">{alert.message}</div>
            </div>
            <button className={`alert-action ${getSeverityColor(alert.severity)}`}>
              {alert.action}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 12h14m-7-7l7 7l-7 7"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NeedsAttentionPanel;