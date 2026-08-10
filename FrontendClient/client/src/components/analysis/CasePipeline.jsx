// src/components/analysis/CasePipeline.jsx
// Active cases pipeline with status stages
import React from "react";

const CasePipeline = () => {
  const stages = [
    { name: "New", count: 3, color: "muted" },
    { name: "Arrangements", count: 5, color: "primary" },
    { name: "Preparation", count: 7, color: "info" },
    { name: "Viewing", count: 4, color: "purple" },
    { name: "Funeral Today", count: 3, color: "warning" },
    { name: "Cemetery", count: 2, color: "amber" },
    { name: "Completed", count: 18, color: "success" },
  ];

  const cases = [
    { id: "FN-2051", name: "Grace Wanjiku", location: "Nairobi", director: "Sarah M.", time: "10:00", status: "Funeral Today", hasAlert: true },
    { id: "FN-2052", name: "David Otieno", location: "Kisumu", director: "Brian K.", time: "Pending docs", status: "Arrangements", hasAlert: true },
    { id: "FN-2048", name: "John Kamau", location: "Nairobi", director: "Sarah M.", time: "Ready 11:00", status: "Preparation", hasAlert: false },
    { id: "FN-2049", name: "Samuel Mwenda", location: "Mombasa", director: "Alice N.", time: "14:00–16:00", status: "Viewing", hasAlert: false },
    { id: "FN-2053", name: "Amina Hassan", location: "Nairobi", director: "Unassigned", time: "Intake done", status: "New", hasAlert: false },
    { id: "FN-2050", name: "Peter Muthoni", location: "Nairobi", director: "Tom O.", time: "14:30", status: "Funeral Today", hasAlert: false },
  ];

  const getStatusColor = (status) => {
    const colors = {
      New: "bg-muted text-muted-foreground",
      Arrangements: "bg-primary-light text-primary",
      Preparation: "bg-info-bg text-info",
      Viewing: "bg-purple-bg text-purple",
      "Funeral Today": "bg-warning-bg text-warning",
      Cemetery: "bg-amber text-amber",
      Completed: "bg-success-bg text-success",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="case-pipeline">
      <div className="panel-header">
        <div className="panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            <rect width="20" height="14" x="2" y="6" rx="2"/>
          </svg>
          <span>Active Cases</span>
          <span className="count-badge primary">{cases.length}</span>
        </div>
        <div className="panel-header-right">
          <button className="text-link">Filter</button>
          <button className="text-link primary">New Case</button>
        </div>
      </div>
      <div className="stages-bar">
        {stages.map((stage, idx) => (
          <button key={idx} className="stage-item">
            <div className={`stage-dot ${stage.color}`}></div>
            <span className="stage-name">{stage.name}</span>
            <span className="stage-count">{stage.count}</span>
          </button>
        ))}
      </div>
      <div className="cases-list">
        {cases.map((caseItem, idx) => (
          <div key={idx} className="case-item">
            <div className="case-id">
              <span className="mono-font bold">{caseItem.id}</span>
            </div>
            <div className="case-details">
              <div className="case-name-row">
                <span className="case-name">{caseItem.name}</span>
                {caseItem.hasAlert && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="alert-icon">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4m0 4h.01"/>
                  </svg>
                )}
              </div>
              <div className="case-meta">
                {caseItem.location} · {caseItem.director} · {caseItem.time}
              </div>
            </div>
            <div className={`case-status ${getStatusColor(caseItem.status)}`}>
              {caseItem.status}
            </div>
            <button className="case-action">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 18l6-6l-6-6"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CasePipeline;