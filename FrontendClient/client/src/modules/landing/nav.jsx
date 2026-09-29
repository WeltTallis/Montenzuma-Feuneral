import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

/* ── Colors ── */
const ink = "#15171A", bone = "#FAF8F4", bone2 = "#F3EFE6", brass = "#8B7355", line = "#E3DDD0", gray = "#6B6862", accent = "#C77B5E";

/* ── Header Containers ── */
const SiteHeader = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: top 0.4s ease;
`;

const UtilityBar = styled.div`
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

const UtilityContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UtilGroup = styled.div`display: flex; align-items: center; gap: 1.5rem;`;
const UtilItem = styled.div`display: flex; align-items: center; gap: 0.4rem;`;
const UtilDot = styled.div`width: 6px; height: 6px; background: #4D9B7F; border-radius: 50%; box-shadow: 0 0 8px #4D9B7F;`;
const UtilLink = styled.a`color: rgba(250, 248, 244, 0.7); text-decoration: none; transition: color 0.2s; &:hover { color: ${bone}; }`;

const NavWrapper = styled.div`
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

const NavContainer = styled.div`
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

/* ── Logo ── */
const LogoWrap = styled.a`
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

const LogoMark = styled.div`
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

const LogoText = styled.div`
  font-family: 'Fraunces', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${ink};
  letter-spacing: -0.02em;
`;

/* ── Main Nav ── */
const MainNav = styled.nav`
  display: flex;
  gap: 2.5rem;
  align-items: center;
  justify-content: center;

  @media (max-width: 900px) {
    display: none;
  }
`;

const NavItemWrapper = styled.div`
  position: relative;
`;

const NavLink = styled.button`
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

// Scanner navigation link - prominent with dark green background
const NavLinkScanner = styled(NavLink)`
  background: #1A2A27 !important;
  color: white !important;
  padding: 0.6rem 1.25rem !important;
  border-radius: 6px !important;
  font-weight: 600 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(26, 42, 39, 0.3) !important;
  
  &:hover {
    background: #24352F !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(26, 42, 39, 0.4) !important;
  }
  
  &::after {
    display: none !important;
  }
  
  @media (max-width: 900px) {
    padding: 0.5rem 1rem !important;
    font-size: 0.8rem !important;
  }
`;

const DropdownArrow = styled.span`
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

/* ── Dropdown ── */
const DropdownMenu = styled.div`
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

const DropdownHeader = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${brass};
  padding: 0.5rem 1rem 0.8rem;
  border-bottom: 1px solid ${line};
  margin-bottom: 0.3rem;
`;

const DropdownItem = styled.a`
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

/* ── CTA / Login ── */
const NavCta = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: flex-end;
`;

const BtnLogin = styled.a`
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

/* ── Mobile Menu ── */
const MobileMenuBtn = styled.button`
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

const MobileLines = styled.div`
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

/* ── Mobile Slide-Down Panel ── */
const MobilePanel = styled.div`
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

const MobilePanelInner = styled.div`
  padding: 0.5rem 1.5rem 1.75rem;
`;

const MobileLink = styled.button`
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

const MobileGroupLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: ${brass};
  padding: 1.4rem 0.25rem 0.4rem;
`;

const MobileSubLink = styled(MobileLink)`
  font-weight: 400;
  font-size: 0.82rem;
  text-transform: none;
  letter-spacing: 0.02em;
  color: ${gray};
  padding: 0.75rem 0.25rem;
`;

const MobileActions = styled.div`
  padding-top: 1.5rem;
  display: flex;
`;

const MobileLoginBtn = styled.button`
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

// Mobile Scanner button - prominent with dark green background
const MobileScannerBtn = styled.button`
  width: 100%;
  padding: 0.95rem;
  background: #1A2A27;
  color: #FFFFFF;
  border: 1px solid #1A2A27;
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
  box-shadow: 0 2px 8px rgba(26, 42, 39, 0.3);

  &:hover {
    background: #24352F;
    border-color: #24352F;
    box-shadow: 0 4px 12px rgba(26, 42, 39, 0.4);
  }
`;

export default function Header() {
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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Close the mobile menu when tapping outside of it */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && e.target.closest && !e.target.closest('[data-mobile-menu]')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  /* Lock body scroll while the mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const go = (path) => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
  };

  /* Smooth-scroll to a landing section; if it does not exist on the
     current page, go home first and then scroll to it. */
  const goToSection = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/');
      setTimeout(() => {
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  const blogLinks = [
    { label: 'All Stories', path: '/blog/stories' },
    { label: 'The Architecture of Blooms', path: '/blog/architecture-of-blooms' },
    { label: 'Funeral Welfare, A Modern Guide', path: '/blog/funeral-welfare-management' },
    { label: 'Member Contributions', path: '/blog/member-contributions' },
    { label: 'Bereavement Management', path: '/blog/bereavement-management' },
    { label: 'The Future of Death Care', path: '/blog/future-of-death-care-software-restpoint' },
  ];

  const policyLinks = [
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Data Migration', path: '/data-migration' },
    { label: 'SLA Policy', path: '/sla' },
    { label: 'Release Notes', path: '/releases' },
  ];

  return (
    <>
      <SiteHeader>
        
        {/* Top Utility Bar */}
        <UtilityBar className={utilityHidden ? 'hidden' : ''}>
          <UtilityContainer>
            <UtilGroup>
              <UtilItem>
                <UtilDot /> System Online
              </UtilItem>
              <UtilItem style={{ opacity: 0.5 }}>|</UtilItem>
              <UtilItem>Death Care OS &mdash; v2.0</UtilItem>
            </UtilGroup>
            <UtilGroup>
              <UtilLink href="/support">Support</UtilLink>
              <UtilLink href="/releases">Release notes</UtilLink>
            </UtilGroup>
          </UtilityContainer>
        </UtilityBar>

        {/* Main Navigation */}
        <NavWrapper className={scrolled ? 'scrolled' : ''}>
          <NavContainer>
            
            {/* Left: Logo */}
            <LogoWrap href="#" onClick={(e) => { e.preventDefault(); go('/'); }}>
              <LogoMark />
              <LogoText>Rest Point</LogoText>
            </LogoWrap>

            {/* Center: Links */}
            <MainNav>
              <NavItemWrapper>
                <NavLink onClick={() => goToSection('features')}>Features</NavLink>
              </NavItemWrapper>
              
              <NavItemWrapper>
                <NavLink onClick={() => goToSection('modules')}>Modules</NavLink>
              </NavItemWrapper>
              
              {/* About Link (Active) */}
              <NavItemWrapper>
                <NavLink onClick={() => go('/about')}>About</NavLink>
              </NavItemWrapper>

              {/* Blogs with Dropdown */}
              <NavItemWrapper>
                <NavLink>
                  Blogs <DropdownArrow />
                </NavLink>
                <DropdownMenu>
                  <DropdownHeader>The Journal</DropdownHeader>
                  {blogLinks.map((b) => (
                    <DropdownItem key={b.label} href="#" onClick={(e) => { e.preventDefault(); go(b.path); }}>{b.label}</DropdownItem>
                  ))}
                </DropdownMenu>
              </NavItemWrapper>

              {/* Scanner Link (Prominent) */}
              <NavItemWrapper>
                <NavLinkScanner onClick={() => go('/scanner')}>
                  <i className="fas fa-scanner" style={{ fontSize: '0.85rem' }}></i>
                  Scanner
                </NavLinkScanner>
              </NavItemWrapper>

              {/* Policies with Dropdown */}
              <NavItemWrapper>
                <NavLink>
                  Policies <DropdownArrow />
                </NavLink>
                <DropdownMenu>
                  <DropdownHeader>Legal & Security</DropdownHeader>
                  {policyLinks.map((p) => (
                    <DropdownItem key={p.label} href="#" onClick={(e) => { e.preventDefault(); go(p.path); }}>{p.label}</DropdownItem>
                  ))}
                </DropdownMenu>
              </NavItemWrapper>
            </MainNav>

            {/* Right: Actions */}
            <NavCta>
              <BtnLogin href="#" onClick={(e) => { e.preventDefault(); go('/login'); }}>Client Login</BtnLogin>
            </NavCta>

            {/* Mobile Menu */}
            <MobileMenuBtn data-mobile-menu onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
              <MobileLines className={menuOpen ? 'open' : ''}>
                <span></span><span></span><span></span>
              </MobileLines>
            </MobileMenuBtn>

          </NavContainer>
        </NavWrapper>

        {/* Mobile Slide-Down Panel */}
        <MobilePanel className={menuOpen ? 'open' : ''} data-mobile-menu>
          <MobilePanelInner>
            <MobileLink onClick={() => goToSection('features')}>Features</MobileLink>
            <MobileLink onClick={() => goToSection('modules')}>Modules</MobileLink>
            <MobileLink onClick={() => go('/about')}>About</MobileLink>

            <MobileGroupLabel>The Journal</MobileGroupLabel>
            {blogLinks.map((b) => (
              <MobileSubLink key={b.label} onClick={() => go(b.path)}>{b.label}</MobileSubLink>
            ))}

            <MobileGroupLabel>Legal &amp; Security</MobileGroupLabel>
            {policyLinks.map((p) => (
              <MobileSubLink key={p.label} onClick={() => go(p.path)}>{p.label}</MobileSubLink>
            ))}

            <MobileActions>
              <MobileScannerBtn onClick={() => go('/scanner')}>
                <i className="fas fa-scanner" style={{ fontSize: '0.85rem' }}></i>
                Scanner
              </MobileScannerBtn>
              <MobileLoginBtn onClick={() => go('/login')}>Client Login</MobileLoginBtn>
            </MobileActions>
          </MobilePanelInner>
        </MobilePanel>
      </SiteHeader>
    </>
  );
}