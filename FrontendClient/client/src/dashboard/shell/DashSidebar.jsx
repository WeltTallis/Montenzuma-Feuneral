/* Main dashboard navigation. */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ic } from "../opsIcons";

export const NAV_ITEMS = [
  { id: "overview", group: "Workspace", label: "Overview", icon: "home", full: "Overview" },
  { id: "release-calendar", group: "Workspace", label: "Release calendar", icon: "cal", full: "Release calendar" },
  { id: "fleet", group: "Workspace", label: "Hearse fleet", icon: "truck", full: "Hearse fleet" },
  { id: "store", group: "Management", label: "Store", icon: "store", full: "Store" },
  { id: "coffin-store", group: "Management", label: "Coffin inventory", icon: "store", full: "Coffin inventory" },
  { id: "flowers", group: "Management", label: "Florist", icon: "flower", full: "Florist" },
];

export default function DashSidebar({
  active,
  collapsed,
  onNavigate,
  onToggleCollapse,
  onCloseMobile,
  tenantSlug,
  itemBadges = {},
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
        <div className="rpd-shell-brand">
          <span className="rpd-shell-mark">RP</span>
          <span className="rpd-shell-brand-copy"><b>RestPoint</b><small>Care operations</small></span>
        </div>
        <nav className="rpd-nav-list" aria-label="Dashboard sections">
          {NAV_ITEMS.map((item, index) => {
            const isActive = active === item.id;
            return (
              <div className="rpd-nav-entry" key={item.id}>
                {(index === 0 || NAV_ITEMS[index - 1].group !== item.group) && (
                  <p className="rpd-nav-caption">{item.group}</p>
                )}
                <button
                  type="button"
                  className={`rpd-nav-item${isActive ? " on" : ""}`}
                  onClick={() => onNavigate(item.id)}
                  title={item.full}
                  aria-label={item.full}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="rpd-nav-ico"><Ic n={item.icon} s={16} /></span>
                  <span className="rpd-nav-txt"><b>{item.label}</b></span>
                  {itemBadges[item.id] > 0 && <span className="rpd-nav-badge">{itemBadges[item.id]}</span>}
                  {isActive ? <span className="rpd-nav-bar" aria-hidden="true" /> : null}
                </button>
              </div>
            );
          })}
        </nav>
        <div className="rpd-nav-foot">
          <div className="rpd-nav-workspace"><span className="rpd-workspace-dot" /><span>Workspace active</span></div>
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
