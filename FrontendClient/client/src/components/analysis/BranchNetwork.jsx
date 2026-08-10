// src/components/analysis/BranchNetwork.jsx
import React from "react";

const BranchNetwork = () => {
  const branches = [
    { name: "Nairobi", cases: 14, hearses: "3/5", coffins: 12, staff: "8/10", health: 92, healthColor: "success" },
    { name: "Kisumu", cases: 5, hearses: "4/4", coffins: 2, staff: "4/5", health: 61, healthColor: "danger" },
    { name: "Mombasa", cases: 4, hearses: "2/3", coffins: 7, staff: "5/5", health: 84, healthColor: "warning" },
    { name: "Nakuru", cases: 1, hearses: "1/2", coffins: 4, staff: "2/3", health: 78, healthColor: "warning" },
  ];

  const transfers = [
    { from: "Nairobi", to: "Kisumu", item: "3x Oak Standard", eta: "14:30", status: "En route" },
    { from: "Mombasa", to: "Nairobi", item: "H-06 (hearse)", eta: "17:00", status: "Departed" },
  ];

  return (
    <div className="branch-network">
      <div className="panel-header">
        <div className="panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>Branch Network</span>
        </div>
        <button className="view-all-link">Full view</button>
      </div>
      <div className="branches-list">
        {branches.map((branch, idx) => (
          <div key={idx} className="branch-item">
            <div className="branch-info">
              <div className="branch-name">{branch.name}</div>
              <div className="branch-cases">{branch.cases} cases</div>
            </div>
            <div className="branch-stats">
              <div className="branch-stat">
                <div className="stat-label">Hearses</div>
                <div className="stat-value">{branch.hearses}</div>
              </div>
              <div className="branch-stat">
                <div className="stat-label">Coffins</div>
                <div className="stat-value">{branch.coffins}</div>
              </div>
              <div className="branch-stat">
                <div className="stat-label">Staff</div>
                <div className="stat-value">{branch.staff}</div>
              </div>
            </div>
            <div className="branch-health">
              <div className="health-header">
                <span className="health-label">Health</span>
                <span className={"health-value " + branch.healthColor}>{branch.health}%</span>
              </div>
              <div className="health-bar">
                <div className={"health-fill " + branch.healthColor} style={{width: branch.health + "%"}}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="transfers-section">
        <div className="transfers-title">Active Transfers</div>
        <div className="transfers-list">
          {transfers.map((transfer, idx) => (
            <div key={idx} className="transfer-item">
              <div className="transfer-icon"></div>
              <div className="transfer-route">
                {transfer.from} ? {transfer.to} · {transfer.item}
              </div>
              <div className="transfer-eta">ETA {transfer.eta}</div>
              <div className={"transfer-status bg-info-bg text-info"}>{transfer.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BranchNetwork;
