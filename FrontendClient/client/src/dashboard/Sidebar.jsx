import React from "react";
import { Ic } from "./opsIcons";

/* ============================================================================
   Sidebar — clean white navigation rail.
   ============================================================================ */
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "home", desc: "Overview & KPIs" },
  { id: "deceased", label: "Morgue", icon: "users", desc: "Intake & records" },
  { id: "schedule", label: "Schedule", icon: "cal", desc: "Calendar & events" },
  { id: "analytics", label: "Analytics", icon: "grid", desc: "Reports & insights" },
  { id: "store", label: "Store", icon: "store", desc: "Inventory & supplies" },
  { id: "settings", label: "Settings", icon: "store", desc: "Configuration" },
];

export function Sidebar({
  active = "dashboard",
  onNavigate,
  user,
  collapsed = false,
  onToggleCollapse,
}) {
  const initials = (name) => name.split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className={`rpd-nav${collapsed ? " is-collapsed" : ""}`} aria-label="Dashboard navigation">
      <button type="button" className="rpd-nav-burger" onClick={onToggleCollapse} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>
        <Ic n={collapsed ? "chevR" : "chevL"} s={18} />
      </button>
      <div className="rpd-nav-brand">
        <div className="rpd-nav-logo" onClick={() => onNavigate?.("dashboard")}>
          <div className="rpd-nav-logo-mark">RP</div>
          <div className="rpd-nav-logo-txt">
            <b>RestPoint</b>
            <small>Operations Dashboard</small>
          </div>
        </div>
      </div>
      <nav className="rpd-nav-list" aria-label="Dashboard sections">
        <p className="rpd-nav-caption">Main</p>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`rpd-nav-item${isActive ? " on" : ""}`}
              onClick={() => onNavigate?.(item.id)}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="rpd-nav-ico"><Ic n={item.icon} s={16} /></span>
              <span className="rpd-nav-txt">
                <b>{item.label}</b>
                <small>{item.desc}</small>
              </span>
              {isActive ? <span className="rpd-nav-bar" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </nav>
      <div className="rpd-nav-foot">
        <div className="rpd-nav-avatar">{user?.initials || initials(user?.name || "WM")}</div>
        <button className="rpd-nav-ghost" onClick={onToggleCollapse} title={collapsed ? "Expand" : "Collapse"}>
          <Ic n={collapsed ? "chevR" : "chevL"} s={14} />
          <span>{collapsed ? "Expand" : "Collapse"}</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

