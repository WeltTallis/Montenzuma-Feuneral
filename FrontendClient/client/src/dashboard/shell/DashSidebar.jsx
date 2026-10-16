/* Dashboard sidebar navigation (Metis-style layout).
   Home → main operations board · Deceased → intake register ·
   Store → inventory & journal · Workshop → production analytics ·
   Flowers → flower charts & bookings analysis. */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ic } from "../opsIcons";

export const NAV_ITEMS = [
  { id: "home", view: "home", sub: "command", label: "Home", desc: "Operations overview", icon: "home", full: "Home — operations overview" },
  { id: "deceased", view: "deceased", sub: "intake", label: "Deceased", desc: "Intake register", icon: "users", full: "Deceased — intake register" },
  { id: "store", view: "store", sub: null, label: "Store", desc: "Inventory & journal", icon: "store", full: "Store — inventory & journal" },
  { id: "workshop", view: "workshop", sub: null, label: "Workshop", desc: "Production analytics", icon: "hammer", full: "Workshop — production analytics" },
  { id: "flowers", view: "flowers", sub: null, label: "Flowers", desc: "Charts & bookings", icon: "flower", full: "Flowers — charts & bookings analysis" },
  { id: "coffin-store", view: "coffin-store", sub: null, label: "Coffin Store", desc: "Cross-branch inventory", icon: "store", full: "Coffin Store — all branches" },
];

const initialsOf = (name) =>
  String(name || "?").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default function DashSidebar({
  active,
  collapsed,
  onNavigate,
  onToggleCollapse,
  onCloseMobile,
  user,
  tenantSlug,
}) {
  const navigate = useNavigate();

  /* ESC closes the mobile drawer. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && typeof onCloseMobile === "function") onCloseMobile();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCloseMobile]);

  const displayName = user?.fullName || user?.full_name || user?.username || user?.name || "Staff";
  const displayRole = user?.role || user?.user_role || "Staff";
  const siteHref = tenantSlug ? `/${tenantSlug}/reception` : "/";

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
        <div className="rpd-nav-brand">
          <button type="button" className="rpd-nav-burger" onClick={onCloseMobile} aria-label="Close navigation">
            <Ic n="menu" s={18} />
          </button>
          <button type="button" className="rpd-nav-logo" onClick={() => onNavigate("home")} aria-label="Rest Point — go home">
            <span className="rpd-nav-logo-mark">R</span>
            <span className="rpd-nav-logo-txt"><b>Rest Point</b><small>Funeral Home</small></span>
          </button>
        </div>
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
          <button type="button" className="rpd-nav-user" onClick={() => navigate(siteHref)} title="Back to the main site">
            <span className="rpd-nav-avatar" aria-hidden="true">{initialsOf(displayName)}</span>
            <span className="rpd-nav-txt"><b>{displayName}</b><small style={{ textTransform: "capitalize" }}>{displayRole}</small></span>
          </button>
          <button type="button" className="rpd-nav-ghost" onClick={() => navigate(siteHref)}>
            <Ic n="arrowL" s={14} /><span>Back to main site</span>
          </button>
          <button type="button" className="rpd-nav-ghost danger" onClick={handleLogout}>
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

