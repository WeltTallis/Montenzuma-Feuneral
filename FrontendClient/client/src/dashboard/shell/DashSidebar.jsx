/* Main dashboard navigation - modernized to match ModernSidebar design system. */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Ic } from "../opsIcons";

const COLORS = {
  bgPage: "#F4F5F7",
  white: "#FFFFFF",
  border: "#E8E8E8",
  textMain: "#000000",
  textMuted: "#555555",
  textLight: "#999999",
  green: "#2E7D32",
  greenBg: "#E8F5E9",
  red: "#D32F2F",
  redHover: "#B71C1C",
  grayHover: "#F5F5F5",
  shadow: "rgba(0, 0, 0, 0.15)",
};

const TRANSITIONS = {
  default: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
};

export const NAV_ITEMS = [
  { id: "overview", group: "Workspace", label: "Overview", icon: "home", full: "Overview" },
  { id: "release-calendar", group: "Workspace", label: "Deceased calendar", icon: "cal", full: "Deceased calendar" },
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
  const siteHref = "/all-deceased";

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
        <SidebarNav>
        {NAV_ITEMS.map((item, index) => {
          const isActive = active === item.id;
          const isFirst = index === 0;
          const groupChanged =
            !isFirst && NAV_ITEMS[index - 1].group !== item.group;

          return (
            <NavSection key={item.id}>
              {groupChanged && <NavSectionTitle>{item.group}</NavSectionTitle>}

              <MenuItem $active={isActive} onClick={() => onNavigate(item.id)}>
                <span>
                  <Ic n={item.icon} s={16} />
                </span>
                <span>{item.label}</span>
              </MenuItem>
            </NavSection>
          );
        })}
      </SidebarNav>
        <Footer>
        <FooterButtonGhost onClick={() => navigate(siteHref)} title="Back to main site">
          <Ic n="arrowL" s={14} />{" "}
          <span>Back to main site</span>
        </FooterButtonGhost>

        <FooterButtonGhost onClick={handleLogout} title="Sign out">
          <Ic n="logout" s={14} />{" "}
          <span>Sign out</span>
        </FooterButtonGhost>

        <ToggleButton
          onClick={() => onToggleCollapse()}
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <Ic n="chevronRight" s={16} />
          ) : (
            <Ic n="chevronLeft" s={16} />
          )}
        </ToggleButton>
      </Footer>
      </aside>
    </>
  );
}
