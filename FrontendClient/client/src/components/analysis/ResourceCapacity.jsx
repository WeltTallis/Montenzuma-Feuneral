// src/components/analysis/ResourceCapacity.jsx
// Resource utilization metrics
import React from "react";

const ResourceCapacity = () => {
  const resources = [
    {
      icon: "door-open",
      name: "Viewing Rooms",
      percentage: 70,
      used: 7,
      total: 10,
      color: "warning",
    },
    {
      icon: "flask-conical",
      name: "Prep Rooms",
      percentage: 67,
      used: 4,
      total: 6,
      color: "primary",
    },
    {
      icon: "building",
      name: "Chapel",
      percentage: 75,
      used: 3,
      total: 4,
      color: "warning",
    },
    {
      icon: "truck",
      name: "Hearses",
      percentage: 67,
      used: 8,
      total: 12,
      color: "primary",
    },
    {
      icon: "warehouse",
      name: "Storage",
      percentage: 60,
      used: 18,
      total: 30,
      color: "success",
    },
    {
      icon: "user",
      name: "Drivers",
      percentage: 75,
      used: 6,
      total: 8,
      color: "warning",
    },
  ];

  const getIcon = (name) => {
    const icons = {
      "door-open": (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M11 20H2m9-15.438v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561zM11 4H8a2 2 0 0 0-2 2v14m8-8h.01M22 20h-3"/>
        </svg>
      ),
      "flask-conical": (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2M6.453 15h11.094M8.5 2h7"/>
        </svg>
      ),
      building: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 10h.01M12 14h.01M12 6h.01M16 10h.01M16 14h.01M16 6h.01M8 10h.01M8 14h.01M8 6h.01M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
          <rect width="16" height="20" x="4" y="2" rx="2"/>
        </svg>
      ),
      truck: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m10 0H9m10 0h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <circle cx="17" cy="18" r="2"/>
          <circle cx="7" cy="18" r="2"/>
        </svg>
      ),
      warehouse: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11"/>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8zM6 13h12M6 17h12"/>
        </svg>
      ),
      user: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    };
    return icons[name] || null;
  };

  // Availability level drives the small status pill under each resource.
  const freeTone = (res) => {
    const ratio = res.total ? (res.total - res.used) / res.total : 0;
    if (ratio <= 0.2) return "danger";
    if (ratio <= 0.4) return "warning";
    return "success";
  };

  const freeLabel = { danger: "Nearly full", warning: "Limited", success: "Available" };

  const totalUsed = resources.reduce((sum, r) => sum + r.used, 0);
  const totalCapacity = resources.reduce((sum, r) => sum + r.total, 0);
  const totalFree = totalCapacity - totalUsed;
  const overall = totalCapacity ? Math.round((totalUsed / totalCapacity) * 100) : 0;

  const RADIUS = 30;
  const CIRC = 2 * Math.PI * RADIUS;
  const donutOffset = CIRC - (overall / 100) * CIRC;

  return (
    <div className="resource-capacity">
      <div className="panel-header">
        <div className="panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m12 14l4-4M3.34 19a10 10 0 1 1 17.32 0"/>
          </svg>
          <span>Resource Capacity</span>
          <span className="panel-subtitle">Nairobi HQ</span>
        </div>
        <div className="rc-live">
          <span className="rc-live-dot"></span>
          Live
        </div>
      </div>

      {/* Aggregate summary — doughnut (coffin-tab style) + quick stats */}
      <div className="rc-summary">
        <div className="rc-donut">
          <svg width="84" height="84" viewBox="0 0 84 84">
            <defs>
              <linearGradient id="rc-donut-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2c8ac9" />
                <stop offset="100%" stopColor="#1a5f7a" />
              </linearGradient>
            </defs>
            <circle cx="42" cy="42" r={RADIUS} fill="none" stroke="var(--color-muted)" strokeWidth="9" />
            <circle
              cx="42"
              cy="42"
              r={RADIUS}
              fill="none"
              stroke="url(#rc-donut-grad)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={donutOffset}
              transform="rotate(-90 42 42)"
            />
          </svg>
          <div className="rc-donut-center">
            <strong>{overall}%</strong>
            <span>Utilized</span>
          </div>
        </div>

        <div className="rc-stats">
          <div className="rc-stat">
            <span className="rc-stat-value">{totalUsed}</span>
            <span className="rc-stat-label">In use</span>
          </div>
          <div className="rc-stat">
            <span className="rc-stat-value rc-stat-free">{totalFree}</span>
            <span className="rc-stat-label">Available</span>
          </div>
          <div className="rc-stat">
            <span className="rc-stat-value">{resources.length}</span>
            <span className="rc-stat-label">Tracked</span>
          </div>
        </div>
      </div>

      {/* Resource list — goal-style progress bars (chemical-tab style) */}
      <div className="rc-resources">
        {resources.map((resource, idx) => {
          const tone = freeTone(resource);
          const free = resource.total - resource.used;
          return (
            <div key={idx} className={`rc-item rc-item--${resource.color}`}>
              <div className="rc-item-top">
                <div className={`rc-icon icon-${resource.color}`}>{getIcon(resource.icon)}</div>
                <div className="rc-item-text">
                  <span className="rc-name">{resource.name}</span>
                  <span className="rc-item-sub">{free} free of {resource.total}</span>
                </div>
                <span className={`rc-pct rc-pct--${resource.color}`}>{resource.percentage}%</span>
              </div>
              <div className="rc-bar">
                <div
                  className={`rc-bar-fill rc-bar-fill--${resource.color}`}
                  style={{ width: `${resource.percentage}%` }}
                ></div>
              </div>
              <div className="rc-item-foot">
                <span className={`rc-status rc-status--${tone}`}>{freeLabel[tone]}</span>
                <span className="rc-meta">{resource.used} / {resource.total} in use</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResourceCapacity;