import React from "react";

/* =========================================================
 * DashboardNav — standalone, minimal top navigation bar
 * (built independently, mirrors a light app shell):
 *
 *   <nav white / border-b neutral-100>
 *     <flex justify-end h-12 px-4>
 *       Hearse Bookings | Coffin Bookings | Flower Bookings
 *       | Deceased Register | Workshop   (bell + 3 badge)
 *
 * Active tab gets a 2px animated underline. No external
 * dependencies — pure React + inline styles + <style>.
 * ========================================================= */

const DashboardNav = ({ tabs = [], active = "", onSelect, badge = 3 }) => {
  return (
    <nav
      className="dashnav"
      style={{
        width: "100%",
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 16px",
        background: "#ffffff",
        borderBottom: "1px solid #f5f5f4",
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      <style>{`
        .dashnav-link {
          position: relative;
          padding: 0 14px;
          height: 48px;
          display: flex;
          align-items: center;
          font-size: 13px;
          font-family: inherit;
          color: #a3a3a3;
          background: transparent;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.2s ease;
        }
        .dashnav-link:hover { color: #525252; }
        .dashnav-link.active { color: #171717; font-weight: 500; }
        .dashnav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 14px;
          right: 14px;
          height: 2px;
          background: #171717;
          border-radius: 1px 1px 0 0;
          transform: scaleX(0);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dashnav-link.active::after { transform: scaleX(1); }
        .dashnav-link:hover::after { transform: scaleX(1); }
        .dashnav-bell {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 48px;
          cursor: pointer;
          color: #a3a3a3;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .dashnav-bell:hover { background: #fafaf9; color: #525252; }
      `}</style>

      {/* Right-aligned tabs */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {(tabs || []).map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              className={`dashnav-link${isActive ? " active" : ""}`}
              onClick={() => onSelect && onSelect(t.id)}
              role="tab"
              aria-selected={isActive}
            >
              {t.label}
            </button>
          );
        })}

        {/* Notification bell with red count badge */}
        <div
          className="dashnav-bell"
          style={{ marginLeft: 6 }}
          title="Notifications"
          role="button"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 7,
              width: 16,
              height: 16,
              background: "#ef4444",
              color: "#fff",
              fontSize: 9,
              fontWeight: 600,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {badge}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNav;