/* Dashboard sidebar navigation (Clean White Design).
   Home ? dashboard · Deceased ? records · Schedule ? calendar · Analytics ? reports · Store ? inventory · Settings ? configuration. */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ic } from "../opsIcons";

export const NAV_ITEMS = [
  { id: "dashboard", view: "dashboard", label: "Dashboard", desc: "Overview & KPIs", icon: "home", full: "Dashboard — overview & KPIs" },
  { id: "deceased", view: "deceased", label: "Deceased", desc: "Intake & records", icon: "users", full: "Deceased — intake & records" },
  { id: "schedule", view: "schedule", label: "Schedule", desc: "Calendar & events", icon: "cal", full: "Schedule — calendar & events" },
  { id: "analytics", view: "analytics", label: "Analytics", desc: "Reports & insights", icon: "grid", full: "Analytics — reports & insights" },
  { id: "store", view: "store", label: "Store", desc: "Inventory & supplies", icon: "store", full: "Store — inventory & supplies" },
  { id: "settings", view: "settings", label: "Settings", desc: "Configuration", icon: "store", full: "Settings — configuration" },
];

export default function DashSidebar({
  active,
  collapsed,
  onNavigate,
  onToggleCollapse,
  onCloseMobile,
  tenantSlug,
}) {
  const navigate = useNavigate();
  const siteHref = tenantSlug ? `/${tenantSlug}/reception` : "/";

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && typeof onCloseMobile === "function") onCloseMobile();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCloseMobile]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("users");
      sessionStorage.clear();
    } catch { /* storage blocked */ }
    navigate("/login");
  };

  return (
    <>
      <div className="rpd-nav-scrim" onClick={onCloseMobile} aria-hidden="true" />
      <aside className={`rpd-nav${collapsed ? " is-collapsed" : ""}`} aria-label="Dashboard navigation">
        <button type="button" className="rpd-nav-burger" onClick={onCloseMobile} aria-label="Close navigation">
          <Ic n="menu" s={18} />
        </button>
        <nav className="rpd-nav-list" aria-label="Dashboard sections">
          <p className="rpd-nav-caption">Navigate</p>
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`rpd-nav-item${isActive ? " on" : ""}`}
                onClick={() => onNavigate(item.id)}
                title={item.full}
                aria-label={item.full}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="rpd-nav-ico"><Ic n={item.icon} s={16} /></span>
                <span className="rpd-nav-txt"><b>{item.label}</b><small>{item.desc}</small></span>
                {isActive ? <span className="rpd-nav-bar" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </nav>
        <div className="rpd-nav-foot">
          <button type="button" className="rpd-nav-ghost" onClick={() => navigate(siteHref)} title="Back to main site">
            <Ic n="arrowL" s={14} /><span>Back to main site</span>
          </button>
          <button type="button" className="rpd-nav-ghost" onClick={handleLogout} title="Sign out">
            <Ic n="logout" s={14} /><span>Sign out</span>
          </button>
          <button type="button" className="rpd-nav-collapse" onClick={onToggleCollapse} aria-label={collapsed ? "Expand" : "Collapse"}>
            <Ic n={collapsed ? "chevronRight" : "chevronLeft"} s={14} /><span>{collapsed ? "Expand" : "Collapse"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}


