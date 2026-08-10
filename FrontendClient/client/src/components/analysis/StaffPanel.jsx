// src/components/analysis/StaffPanel.jsx
// Staff and drivers availability
import React from "react";

const StaffPanel = () => {
  const staff = [
    { initials: "SM", name: "Sarah Mutua", role: "Funeral Director", status: "busy", statusText: "Busy" },
    { initials: "PN", name: "Peter Njoroge", role: "Driver · H-01", status: "info", statusText: "In Transit" },
    { initials: "AO", name: "Ali Odhiambo", role: "Driver · H-02", status: "danger", statusText: "Conflict" },
    { initials: "JK", name: "James Kariuki", role: "Driver · H-03", status: "info", statusText: "In Transit" },
    { initials: "GW", name: "Grace Waweru", role: "Driver · H-04", status: "success", statusText: "Available" },
    { initials: "BK", name: "Brian Koech", role: "Embalmer", status: "warning", statusText: "Busy" },
    { initials: "AN", name: "Alice Njeri", role: "Coordinator", status: "success", statusText: "Available" },
    { initials: "TO", name: "Tom Odhiambo", role: "Funeral Director", status: "warning", statusText: "Busy" },
  ];

  const getStatusColor = (status) => {
    const colors = {
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
      info: "bg-info",
      busy: "bg-warning",
    };
    return colors[status] || "bg-muted-foreground";
  };

  const getStatusTextColor = (status) => {
    const colors = {
      success: "text-success",
      warning: "text-warning",
      danger: "text-danger",
      info: "text-info",
      busy: "text-warning",
    };
    return colors[status] || "text-muted-foreground";
  };

  return (
    <div className="staff-panel">
      <div className="panel-header">
        <div className="panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.128a4 4 0 0 1 0 7.744M22 21v-2a4 4 0 0 0-3-3.87"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          <span>Staff & Drivers</span>
        </div>
        <div className="panel-header-right">
          <span className="available-indicator">
            <span className="available-dot success"></span>
            3 available
          </span>
          <button className="view-all-link">Full roster</button>
        </div>
      </div>
      <div className="staff-grid">
        {staff.map((person, idx) => (
          <div key={idx} className="staff-item">
            <div className="staff-avatar">{person.initials}</div>
            <div className="staff-info">
              <div className="staff-name">{person.name}</div>
              <div className="staff-role">{person.role}</div>
            </div>
            <div className="staff-status">
              <div className={`status-dot ${getStatusColor(person.status)}`}></div>
              <span className={`status-text ${getStatusTextColor(person.status)}`}>{person.statusText}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffPanel;