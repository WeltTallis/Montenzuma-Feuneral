/* Dashboard sidebar navigation (Metis-style layout).
   Home → operations overview · Calendar → cross-branch deceased schedule ·
   Store → inventory & journal · Workshop → production analytics ·
   Flowers → flower charts & bookings analysis. */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ic } from "../opsIcons";

export const NAV_ITEMS = [
  { id: "home", view: "home", sub: "command", label: "Home", desc: "Operations overview", icon: "home", full: "Home — operations overview" },
  { id: "store", view: "store", sub: null, label: "Store", desc: "Inventory & journal", icon: "store", full: "Store — inventory & journal" },
  { id: "flowers", view: "flowers", sub: null, label: "Flowers", desc: "Charts & bookings", icon: "flower", full: "Flowers — charts & bookings analysis" },
  { id: "coffin-store", view: "coffin-store", sub: null, label: "Coffin Store", desc: "Cross-branch inventory", icon: "store", full: "Coffin Store — all branches" },
  { id: "calendar", view: "calendar", sub: null, label: "Calendar", desc: "Deceased & service schedule", icon: "cal", full: "Calendar — deceased & service schedule" },
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

  /* ESC closes the mobile drawer. */
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
      localStorage.removeItem("user");
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
                <span className="rpd-nav-ico"><Ic n={item.icon} s={18} /></span>
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
            <Ic n={collapsed ? "chevR" : "chevL"} s={14} /><span>{collapsed ? "Expand" : "Collapse"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

