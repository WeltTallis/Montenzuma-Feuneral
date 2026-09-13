// src/modules/landing/nav.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var GlobalFonts = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap');
`;
var ink = "#15171A";
var bone = "#FAF8F4";
var bone2 = "#F3EFE6";
var brass = "#8B7355";
var line = "#E3DDD0";
var gray = "#6B6862";
var accent = "#C77B5E";
var SiteHeader = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: top 0.4s ease;
`;
var UtilityBar = styled.div`
  background: ${ink};
  color: rgba(250, 248, 244, 0.7);
  padding: 0.5rem 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: max-height 0.4s ease, opacity 0.4s ease, padding 0.4s ease;
  max-height: 50px;
  overflow: hidden;

  &.hidden {
    max-height: 0;
    padding: 0;
    opacity: 0;
  }

  @media (max-width: 900px) {
    display: none;
  }
`;
var UtilityContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
var UtilGroup = styled.div`display: flex; align-items: center; gap: 1.5rem;`;
var UtilItem = styled.div`display: flex; align-items: center; gap: 0.4rem;`;
var UtilDot = styled.div`width: 6px; height: 6px; background: #4D9B7F; border-radius: 50%; box-shadow: 0 0 8px #4D9B7F;`;
var UtilLink = styled.a`color: rgba(250, 248, 244, 0.7); text-decoration: none; transition: color 0.2s; &:hover { color: ${bone}; }`;
var NavWrapper = styled.div`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid ${line};
  transition: box-shadow 0.4s ease, background 0.4s ease;

  &.scrolled {
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 10px 30px -10px rgba(21, 23, 26, 0.08);
  }

  /* Mobile: fully opaque so animated hero text never bleeds
     through the fixed bar (backdrop blur on mobile makes the
     hero title appear to blink behind the nav). */
  @media (max-width: 900px) {
    background: #FFFFFF;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
`;
var NavContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.2rem 2rem;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 2rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr auto;
    padding: 0.65rem 1.25rem;
    gap: 1rem;
  }
`;
var LogoWrap = styled.a`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  text-decoration: none;

  /* Mobile: logo removed — the slim bar shows only Client Login + hamburger */
  @media (max-width: 900px) {
    display: none;
  }
`;
var LogoMark = styled.div`
  width: 32px;
  height: 32px;
  position: relative;
  border: 1.5px solid ${ink};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  &::before, &::after {
    content: '';
    position: absolute;
    background: ${ink};
    transition: background 0.3s;
  }
  &::before { width: 12px; height: 1.5px; }
  &::after { width: 1.5px; height: 12px; }

  ${LogoWrap}:hover & {
    transform: rotate(180deg);
    border-color: ${accent};
  }
  ${LogoWrap}:hover &::before, ${LogoWrap}:hover &::after {
    background: ${accent};
  }
`;
var LogoText = styled.div`
  font-family: 'Fraunces', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${ink};
  letter-spacing: -0.02em;
`;
var MainNav = styled.nav`
  display: flex;
  gap: 2.5rem;
  align-items: center;
  justify-content: center;

  @media (max-width: 900px) {
    display: none;
  }
`;
var NavItemWrapper = styled.div`
  position: relative;
`;
var NavLink = styled.button`
  position: relative;
  font-size: 0.85rem;
  font-weight: 500;
  color: ${gray};
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.5rem 0;
  transition: color 0.3s ease, transform 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  background: none;
  border: none;
  font-family: 'Space Grotesk', sans-serif;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: ${accent};
    transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover {
    color: ${ink};
    transform: translateY(-1px);
  }

  &:hover::after {
    width: 120%;
    left: -10%;
    transform: translateX(0);
  }

  &.active {
    color: ${ink};
    font-weight: 600;
  }

  &.active::after {
    width: 120%;
    left: -10%;
    transform: translateX(0);
  }
`;
var NavLinkScanner = styled(NavLink)`
  background: #3D4F47 !important;
  color: white !important;
  padding: 0.6rem 1.25rem !important;
  border-radius: 6px !important;
  font-weight: 600 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(61, 79, 71, 0.3) !important;
  
  &:hover {
    background: #2E3F37 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(61, 79, 71, 0.4) !important;
  }
  
  &::after {
    display: none !important;
  }
  
  @media (max-width: 900px) {
    padding: 0.5rem 1rem !important;
    font-size: 0.8rem !important;
  }
`;
var DropdownArrow = styled.span`
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid ${gray};
  transition: transform 0.3s ease, border-top-color 0.3s ease;
  margin-left: 2px;

  ${NavItemWrapper}:hover & {
    transform: rotate(180deg);
    border-top-color: ${accent};
  }
`;
var DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 15px);
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid ${line};
  border-radius: 4px;
  min-width: 220px;
  padding: 0.5rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 20px 40px rgba(21, 23, 26, 0.08);
  z-index: 100;

  ${NavItemWrapper}:hover & {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }
`;
var DropdownHeader = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${brass};
  padding: 0.5rem 1rem 0.8rem;
  border-bottom: 1px solid ${line};
  margin-bottom: 0.3rem;
`;
var DropdownItem = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1rem;
  color: ${gray};
  text-decoration: none;
  font-size: 0.8rem;
  text-transform: none;
  letter-spacing: 0.02em;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
  font-weight: 500;

  &:hover {
    background: ${bone2};
    color: ${ink};
  }

  &::after {
    content: '→';
    opacity: 0;
    transform: translateX(-5px);
    transition: all 0.2s ease;
    font-size: 0.8rem;
  }

  &:hover::after {
    opacity: 1;
    transform: translateX(0);
    color: ${accent};
  }
`;
var NavCta = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: flex-end;
`;
var BtnLogin = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.7rem 1.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;
  border: 1px solid ${ink};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  z-index: 1;
  background: ${ink};
  color: #FFFFFF;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${accent};
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: -1;
  }

  &:hover {
    color: #FFFFFF;
    border-color: ${accent};
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(199, 123, 94, 0.2);
  }
  
  &:hover::before {
    transform: translateY(0);
  }

  /* Mobile: compact login button for the slim bar */
  @media (max-width: 900px) {
    padding: 0.5rem 0.9rem;
    font-size: 0.68rem;
  }
`;
var MobileMenuBtn = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 1001;

  @media (max-width: 900px) {
    display: block;
  }
`;
var MobileLines = styled.div`
  display: block;
  width: 24px;
  height: 16px;
  position: relative;

  span {
    display: block;
    position: absolute;
    height: 2px;
    width: 100%;
    background: ${ink};
    border-radius: 2px;
    transition: all 0.3s ease;
    
    &:nth-child(1) { top: 0; }
    &:nth-child(2) { top: 7px; width: 80%; right: 0; }
    &:nth-child(3) { top: 14px; }
  }

  /* Hamburger → X when the mobile panel is open */
  &.open span:nth-child(1) { top: 7px; transform: rotate(45deg); }
  &.open span:nth-child(2) { opacity: 0; width: 0; right: auto; }
  &.open span:nth-child(3) { top: 7px; transform: rotate(-45deg); }
`;
var MobilePanel = styled.div`
  display: none;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid ${line};
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 900px) {
    display: block;
  }

  &.open {
    max-height: calc(100vh - 56px);
    overflow-y: auto;
    box-shadow: 0 30px 40px rgba(21, 23, 26, 0.15);
  }
`;
var MobilePanelInner = styled.div`
  padding: 0.5rem 1.5rem 1.75rem;
`;
var MobileLink = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid ${line};
  padding: 1rem 0.25rem;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${ink};
  cursor: pointer;
  transition: color 0.2s ease, padding-left 0.2s ease;

  &:hover {
    color: ${accent};
    padding-left: 0.6rem;
  }
`;
var MobileGroupLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: ${brass};
  padding: 1.4rem 0.25rem 0.4rem;
`;
var MobileSubLink = styled(MobileLink)`
  font-weight: 400;
  font-size: 0.82rem;
  text-transform: none;
  letter-spacing: 0.02em;
  color: ${gray};
  padding: 0.75rem 0.25rem;
`;
var MobileActions = styled.div`
  padding-top: 1.5rem;
  display: flex;
`;
var MobileLoginBtn = styled.button`
  width: 100%;
  padding: 0.95rem;
  background: ${ink};
  color: #FFFFFF;
  border: 1px solid ${ink};
  border-radius: 4px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background 0.3s ease, border-color 0.3s ease;

  &:hover {
    background: ${accent};
    border-color: ${accent};
  }
`;
var MobileScannerBtn = styled.button`
  width: 100%;
  padding: 0.95rem;
  background: #3D4F47;
  color: #FFFFFF;
  border: 1px solid #3D4F47;
  border-radius: 6px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background 0.3s ease, border-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 8px rgba(61, 79, 71, 0.3);

  &:hover {
    background: #2E3F37;
    border-color: #2E3F37;
    box-shadow: 0 4px 12px rgba(61, 79, 71, 0.4);
  }
`;
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [utilityHidden, setUtilityHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      if (currentScroll > 100) {
        setUtilityHidden(true);
      } else {
        setUtilityHidden(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && e.target.closest && !e.target.closest("[data-mobile-menu]")) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);
  const go = (path) => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(path);
  };
  const goToSection = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/");
      setTimeout(() => {
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  };
  const blogLinks = [
    { label: "All Stories", path: "/blog/stories" },
    { label: "The Architecture of Blooms", path: "/blog/architecture-of-blooms" },
    { label: "Funeral Welfare, A Modern Guide", path: "/blog/funeral-welfare-management" },
    { label: "Member Contributions", path: "/blog/member-contributions" },
    { label: "Bereavement Management", path: "/blog/bereavement-management" },
    { label: "The Future of Death Care", path: "/blog/future-of-death-care-software-restpoint" }
  ];
  const policyLinks = [
    { label: "Terms of Service", path: "/terms" },
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Data Migration", path: "/data-migration" },
    { label: "SLA Policy", path: "/sla" },
    { label: "Release Notes", path: "/releases" }
  ];
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(GlobalFonts, {}),
    /* @__PURE__ */ jsxs(SiteHeader, { children: [
      /* @__PURE__ */ jsx(UtilityBar, { className: utilityHidden ? "hidden" : "", children: /* @__PURE__ */ jsxs(UtilityContainer, { children: [
        /* @__PURE__ */ jsxs(UtilGroup, { children: [
          /* @__PURE__ */ jsxs(UtilItem, { children: [
            /* @__PURE__ */ jsx(UtilDot, {}),
            " System Online"
          ] }),
          /* @__PURE__ */ jsx(UtilItem, { style: { opacity: 0.5 }, children: "|" }),
          /* @__PURE__ */ jsx(UtilItem, { children: "Death Care OS \u2014 v2.0" })
        ] }),
        /* @__PURE__ */ jsxs(UtilGroup, { children: [
          /* @__PURE__ */ jsx(UtilLink, { href: "#", children: "Support" }),
          /* @__PURE__ */ jsx(UtilLink, { href: "#", children: "Docs" }),
          /* @__PURE__ */ jsx(UtilLink, { href: "#", children: "Status" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(NavWrapper, { className: scrolled ? "scrolled" : "", children: /* @__PURE__ */ jsxs(NavContainer, { children: [
        /* @__PURE__ */ jsxs(LogoWrap, { href: "#", onClick: (e) => {
          e.preventDefault();
          go("/");
        }, children: [
          /* @__PURE__ */ jsx(LogoMark, {}),
          /* @__PURE__ */ jsx(LogoText, { children: "Rest Point" })
        ] }),
        /* @__PURE__ */ jsxs(MainNav, { children: [
          /* @__PURE__ */ jsx(NavItemWrapper, { children: /* @__PURE__ */ jsx(NavLink, { onClick: () => goToSection("features"), children: "Features" }) }),
          /* @__PURE__ */ jsx(NavItemWrapper, { children: /* @__PURE__ */ jsx(NavLink, { onClick: () => goToSection("modules"), children: "Modules" }) }),
          /* @__PURE__ */ jsx(NavItemWrapper, { children: /* @__PURE__ */ jsx(NavLink, { onClick: () => go("/about"), children: "About" }) }),
          /* @__PURE__ */ jsxs(NavItemWrapper, { children: [
            /* @__PURE__ */ jsxs(NavLink, { children: [
              "Blogs ",
              /* @__PURE__ */ jsx(DropdownArrow, {})
            ] }),
            /* @__PURE__ */ jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsx(DropdownHeader, { children: "The Journal" }),
              blogLinks.map((b) => /* @__PURE__ */ jsx(DropdownItem, { href: "#", onClick: (e) => {
                e.preventDefault();
                go(b.path);
              }, children: b.label }, b.label))
            ] })
          ] }),
          /* @__PURE__ */ jsx(NavItemWrapper, { children: /* @__PURE__ */ jsxs(NavLinkScanner, { onClick: () => go("/scanner"), children: [
            /* @__PURE__ */ jsx("i", { className: "fas fa-scanner", style: { fontSize: "0.85rem" } }),
            "Scanner"
          ] }) }),
          /* @__PURE__ */ jsxs(NavItemWrapper, { children: [
            /* @__PURE__ */ jsxs(NavLink, { children: [
              "Policies ",
              /* @__PURE__ */ jsx(DropdownArrow, {})
            ] }),
            /* @__PURE__ */ jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsx(DropdownHeader, { children: "Legal & Security" }),
              policyLinks.map((p) => /* @__PURE__ */ jsx(DropdownItem, { href: "#", onClick: (e) => {
                e.preventDefault();
                go(p.path);
              }, children: p.label }, p.label))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(NavCta, { children: /* @__PURE__ */ jsx(BtnLogin, { href: "#", onClick: (e) => {
          e.preventDefault();
          go("/login");
        }, children: "Client Login" }) }),
        /* @__PURE__ */ jsx(MobileMenuBtn, { "data-mobile-menu": true, onClick: () => setMenuOpen((v) => !v), "aria-label": "Toggle menu", children: /* @__PURE__ */ jsxs(MobileLines, { className: menuOpen ? "open" : "", children: [
          /* @__PURE__ */ jsx("span", {}),
          /* @__PURE__ */ jsx("span", {}),
          /* @__PURE__ */ jsx("span", {})
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx(MobilePanel, { className: menuOpen ? "open" : "", "data-mobile-menu": true, children: /* @__PURE__ */ jsxs(MobilePanelInner, { children: [
        /* @__PURE__ */ jsx(MobileLink, { onClick: () => goToSection("features"), children: "Features" }),
        /* @__PURE__ */ jsx(MobileLink, { onClick: () => goToSection("modules"), children: "Modules" }),
        /* @__PURE__ */ jsx(MobileLink, { onClick: () => go("/about"), children: "About" }),
        /* @__PURE__ */ jsx(MobileGroupLabel, { children: "The Journal" }),
        blogLinks.map((b) => /* @__PURE__ */ jsx(MobileSubLink, { onClick: () => go(b.path), children: b.label }, b.label)),
        /* @__PURE__ */ jsx(MobileGroupLabel, { children: "Legal & Security" }),
        policyLinks.map((p) => /* @__PURE__ */ jsx(MobileSubLink, { onClick: () => go(p.path), children: p.label }, p.label)),
        /* @__PURE__ */ jsxs(MobileActions, { children: [
          /* @__PURE__ */ jsxs(MobileScannerBtn, { onClick: () => go("/scanner"), children: [
            /* @__PURE__ */ jsx("i", { className: "fas fa-scanner", style: { fontSize: "0.85rem" } }),
            "Scanner"
          ] }),
          /* @__PURE__ */ jsx(MobileLoginBtn, { onClick: () => go("/login"), children: "Client Login" })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  Header as default
};
