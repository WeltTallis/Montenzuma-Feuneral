/* Main dashboard navigation - redesigned collapsible sidebar. */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Ic } from "../opsIcons";

const TRANSITIONS = { default: "0.22s cubic-bezier(0.4, 0, 0.2, 1)" };

const COLORS = {

  bg: "#ffffff",
  border: "#e8e8e8",
  text: "#000000",
  muted: "#555555",
  light: "#999999",
  accent: "#2e7d32",
  accentBg: "#e8f5e9",
  hover: "#f5f5f5",
  mark: "#2e7d32",
};

const SidebarNav = styled.nav`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${({ $collapsed }) => ($collapsed ? "20px 8px" : "20px 16px")};
  display: flex;
  flex-direction: column;
  gap: 2px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e2e4df; border-radius: 2px; }
`;

const NavGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
`;

const NavCaption = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${COLORS.light};
  padding: ${({ $collapsed }) => ($collapsed ? "0" : "0 12px 12px")};
  text-align: ${({ $collapsed }) => ($collapsed ? "center" : "left")};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  max-height: ${({ $collapsed }) => ($collapsed ? "0px" : "24px")};
  overflow: hidden;
  transition: opacity ${TRANSITIONS.default}, max-height ${TRANSITIONS.default}, padding ${TRANSITIONS.default};
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  height: 44px;
  padding: ${({ $collapsed }) => ($collapsed ? "0" : "0 12px")};
  justify-content: ${({ $collapsed }) => ($collapsed ? "center" : "flex-start")};
  border: 1px solid transparent;
  border-radius: 10px;
  background: ${({ $active }) => ($active ? COLORS.accentBg : "transparent")};
  color: ${({ $active }) => ($active ? COLORS.accent : COLORS.text)};
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  transition: background 0.15s ease, color 0.15s ease, padding ${TRANSITIONS.default};
  &:hover {
    background: ${COLORS.hover};
    color: ${COLORS.text};
  }
`;

const MenuIcon = styled.span`
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  display: grid;
  place-items: center;
  color: ${({ $active }) => ($active ? COLORS.accent : COLORS.text)};
`;

const MenuLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: ${({ $visible }) => ($visible ? "1" : "0 0 0")};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity ${TRANSITIONS.default};
`;

const MenuBadge = styled.span`
  background: ${COLORS.text};
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity ${TRANSITIONS.default};
  flex-shrink: 0;
`;

const CollapsedBadge = styled.span`
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: ${COLORS.text};
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity ${TRANSITIONS.default};
`;

const Footer = styled.div`
  border-top: 1px solid ${COLORS.border};
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FooterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 40px;
  padding: ${({ $collapsed }) => ($collapsed ? "0" : "0 12px")};
  justify-content: ${({ $collapsed }) => ($collapsed ? "center" : "flex-start")};
  border: none;
  background: transparent;
  color: ${COLORS.muted};
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.15s ease, color 0.15s ease, padding ${TRANSITIONS.default};
  &:hover { background: ${COLORS.hover}; color: ${COLORS.accent}; }
`;

const FooterLabel = styled.span`
  flex: ${({ $visible }) => ($visible ? "1" : "0 0 0")};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity ${TRANSITIONS.default};
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px;
  border: none;
  background: transparent;
  color: ${COLORS.light};
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease;
  &:hover { background: ${COLORS.hover}; color: ${COLORS.accent}; }
`;
export const NAV_ITEMS = [
  { id: "overview", group: "Workspace", label: "Overview", icon: "home", full: "Overview" },
  { id: "release-calendar", group: "Workspace", label: "Morgue", icon: "cal", full: "Morgue" },
  { id: "fleet", group: "Workspace", label: "Fleet", icon: "truck", full: "Fleet" },
  { id: "store", group: "Management", label: "Store", icon: "store", full: "Store" },
  { id: "coffin-store", group: "Management", label: "Coffins", icon: "store", full: "Coffins" },
  { id: "flowers", group: "Management", label: "Florist", icon: "flower", full: "Florist" },
];

export default function DashSidebar({
  active,
  collapsed,
  onNavigate,
  onToggleCollapse,
  onOpenMobile,
  onCloseMobile,
  mobileNavOpen,
  tenantSlug,
  itemBadges = {},
}) {
  const navigate = useNavigate();
  const siteHref = "/all-deceased";

  const [isMobile, setIsMobile] = useState(() => {
    try { return window.innerWidth <= 1024; } catch { return false; }
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const collapsedMode = Boolean(collapsed) && !isMobile;

  return (
    <>
      <button
        type="button"
        className="rpd-nav-open-trigger"
        onClick={onOpenMobile}
        aria-label="Open dashboard navigation"
        aria-controls="dashboard-navigation"
        aria-expanded={mobileNavOpen}
      >
        <Ic n="menu" s={18} />
      </button>
      <div className="rpd-nav-scrim" onClick={onCloseMobile} aria-hidden="true" />
      <aside id="dashboard-navigation" className={`rpd-nav${collapsed ? " is-collapsed" : ""}`} aria-label="Dashboard navigation">
        <button
          type="button"
          className="rpd-nav-burger"
          onClick={onCloseMobile}
          aria-label="Close navigation"
        >
          <Ic n="menu" s={18} />
        </button>

        <div
          className="rpd-shell-brand"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsedMode ? "center" : "space-between",
            gap: "8px",
          }}
        >
          <span className="rpd-shell-mark" title="RestPoint">RP</span>
          {!collapsedMode && (
            <span className="rpd-shell-brand-copy">
              <b>RestPoint</b>
              <small>Operations</small>
            </span>
          )}
          {!isMobile && !collapsedMode && (
            <button
              type="button"
              className="rpd-nav-collapse"
              onClick={() => onToggleCollapse()}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Ic n={collapsed ? "chevR" : "chevL"} s={16} />
            </button>
          )}
        </div>

        <SidebarNav $collapsed={collapsedMode}>
          {NAV_ITEMS.map((item, index) => {
            const isActive = active === item.id;
            const isFirst = index === 0;
            const groupChanged =
              !isFirst && NAV_ITEMS[index - 1].group !== item.group;
            const showCaption = isFirst || groupChanged;
            const badge = Number(itemBadges?.[item.id] || 0);

            return (
              <NavGroup key={item.id}>
                {showCaption && (
                  <NavCaption $collapsed={collapsedMode}>{item.group}</NavCaption>
                )}
                <MenuItem
                  type="button"
                  $active={isActive}
                  $collapsed={collapsedMode}
                  onClick={() => onNavigate(item.id)}
                  title={collapsedMode ? item.full : undefined}
                  aria-label={item.full}
                  aria-current={isActive ? "page" : undefined}
                >
                  <MenuIcon $active={isActive}>
                    <Ic n={item.icon} s={16} />
                  </MenuIcon>
                  <MenuLabel $visible={!collapsedMode}>{item.label}</MenuLabel>
                  {badge > 0 &&
                    (collapsedMode ? (
                      <CollapsedBadge $visible>{badge}</CollapsedBadge>
                    ) : (
                      <MenuBadge $visible>{badge}</MenuBadge>
                    ))}
                </MenuItem>
              </NavGroup>
            );
          })}
        </SidebarNav>

        <Footer>
          <FooterButton
            type="button"
            $collapsed={collapsedMode}
            onClick={() => navigate(siteHref)}
            title="Back to main site"
          >
            <Ic n="arrowL" s={14} />
            <FooterLabel $visible={!collapsedMode}>Back to main site</FooterLabel>
          </FooterButton>

          <FooterButton
            type="button"
            $collapsed={collapsedMode}
            onClick={handleLogout}
            title="Sign out"
          >
            <Ic n="logout" s={14} />
            <FooterLabel $visible={!collapsedMode}>Sign out</FooterLabel>
          </FooterButton>

          {!isMobile && (
            <ToggleButton
              type="button"
              className="rpd-nav-collapse"
              onClick={() => onToggleCollapse()}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Ic n={collapsed ? "chevR" : "chevL"} s={16} />
            </ToggleButton>
          )}
        </Footer>
      </aside>
    </>
  );
}

