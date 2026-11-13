/* Main dashboard navigation - redesigned collapsible sidebar. */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Ic } from "../opsIcons";

const TRANSITIONS = { default: "0.3s cubic-bezier(0.4, 0, 0.2, 1)" };

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
  padding: ${({ $collapsed }) => ($collapsed ? "16px 8px" : "16px 12px")};
  display: flex;
  flex-direction: column;
  &::-webkit-scrollbar { width: 0; }
`;

const NavGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
`;

const NavCaption = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${COLORS.light};
  padding: ${({ $collapsed }) => ($collapsed ? "0" : "0 10px 8px")};
  text-align: ${({ $collapsed }) => ($collapsed ? "center" : "left")};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  max-height: ${({ $collapsed }) => ($collapsed ? "12px" : "24px")};
  overflow: hidden;
  transition: opacity ${TRANSITIONS.default}, max-height ${TRANSITIONS.default}, padding ${TRANSITIONS.default};
  ${({ $collapsed }) => $collapsed && "height: 12px; margin-bottom: 16px;"}
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  height: 36px;
  padding: ${({ $collapsed }) => ($collapsed ? "0" : "0 8px")};
  justify-content: ${({ $collapsed }) => ($collapsed ? "center" : "flex-start")};
  border-radius: 10px;
  margin-bottom: 2px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  transition: all ${TRANSITIONS.default};
  && {
    border: 1px solid transparent;
    background: ${({ $active }) => ($active ? COLORS.accentBg : "transparent")};
    color: ${({ $active }) => ($active ? COLORS.accent : COLORS.text)};
  }
  &&:hover {
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
  padding: ${({ $collapsed }) => ($collapsed ? "12px 8px" : "12px 16px")};
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: padding ${TRANSITIONS.default};
`;

const FooterButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ $danger }) => ($danger ? "14px" : "8px")};
  width: 100%;
  height: ${({ $danger }) => ($danger ? "40px" : "36px")};
  padding: ${({ $collapsed, $danger }) =>
    $collapsed ? "0" : $danger ? "0 12px" : "0 10px"};
  justify-content: ${({ $collapsed }) => ($collapsed ? "center" : "flex-start")};
  font-family: inherit;
  font-size: ${({ $danger }) => ($danger ? "13px" : "12px")};
  font-weight: 700;
  cursor: pointer;
  border-radius: 8px;
  transition: all ${TRANSITIONS.default};
  white-space: nowrap;
  text-align: left;
  && {
    border: ${({ $danger }) => ($danger ? "none" : `1px solid ${COLORS.border}`)};
    background: ${({ $danger }) => ($danger ? "#d32f2f" : "#f4f5f7")};
    color: ${({ $danger }) => ($danger ? "#fff" : COLORS.text)};
  }
  &&:hover {
    background: ${({ $danger }) => ($danger ? "#b71c1c" : "#eee")};
    color: ${({ $danger }) => ($danger ? "#fff" : COLORS.text)};
  }
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
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  padding: 0;
  cursor: pointer;
  border-radius: 8px;
  transition: all ${TRANSITIONS.default};
  && {
    border: 1px solid ${COLORS.border};
    background: #f4f5f7;
    color: ${COLORS.text};
  }
  &&:hover { background: ${COLORS.text}; color: #fff; }
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
        <Ic n="menu" s={22} />
      </button>
      <div className="rpd-nav-scrim" onClick={onCloseMobile} aria-hidden="true" />
      <aside id="dashboard-navigation" className={`rpd-nav${collapsed ? " is-collapsed" : ""}`} aria-label="Dashboard navigation">
        <button
          type="button"
          className="rpd-nav-burger"
          onClick={onCloseMobile}
          aria-label="Close navigation"
        >
          <Ic n="x" s={20} />
        </button>

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
                    <Ic n={item.icon} s={20} />
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

        <Footer $collapsed={collapsedMode}>
          <FooterButton
            type="button"
            $danger={false}
            $collapsed={collapsedMode}
            onClick={() => navigate(siteHref)}
            title="Back to main site"
          >
            <Ic n="arrowL" s={16} />
            <FooterLabel $visible={!collapsedMode}>Back to main site</FooterLabel>
          </FooterButton>

          <FooterButton
            type="button"
            $danger
            $collapsed={collapsedMode}
            onClick={handleLogout}
            title="Sign out"
          >
            <Ic n="logout" s={18} />
            <FooterLabel $visible={!collapsedMode}>Sign out</FooterLabel>
          </FooterButton>

          {!isMobile && (
            <ToggleButton
              type="button"
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

