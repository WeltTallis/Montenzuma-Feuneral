import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Calendar, Box, Hammer, ShoppingCart, Package, Truck, Beaker, Activity, BarChart3, FileBarChart, LifeBuoy, Settings, LogOut, Menu, X, ChevronLeft, ChevronRight } from '../../utils/icons/icons';

// ============================================================
// DESIGN SYSTEM
// ============================================================

const COLORS = {
  bgPage: '#F4F5F7',
  white: '#FFFFFF',
  border: '#E8E8E8',
  textMain: '#000000',
  textMuted: '#555555',
  textLight: '#999999',
  green: '#2E7D32',
  greenBg: '#E8F5E9',
  red: '#D32F2F',
  redHover: '#B71C1C',
  grayHover: '#F5F5F5',
  shadow: 'rgba(0, 0, 0, 0.15)',
};

const TRANSITIONS = {
  default: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

// ============================================================
// STYLED COMPONENTS
// ============================================================

const SidebarWrapper = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  align-items: stretch;
  height: 100vh;
  
  @media (max-width: 767px) {
    display: none;
  }
`;

const SidebarContainer = styled.aside`
  width: ${(props) => (props.$isOpen ? '200px' : '60px')};
  background: ${COLORS.white};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width ${TRANSITIONS.default};
  border-right: 1px solid ${COLORS.border};
  height: 100vh;
  position: relative;
`;

const SidebarNav = styled.nav`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${(props) => (props.$isOpen ? '20px 16px' : '20px 8px')};
  
  &::-webkit-scrollbar {
    width: 0;
  }
`;

const NavSection = styled.div`
  margin-bottom: 24px;
`;

const NavSectionTitle = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: ${COLORS.textLight};
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: ${(props) => (props.$isOpen ? '0 12px 12px 12px' : '0')};
  text-align: ${(props) => (props.$isOpen ? 'left' : 'center')};
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  transition: opacity ${TRANSITIONS.default};
  white-space: nowrap;
  overflow: hidden;
  
  ${(props) => !props.$isOpen && `
    height: 12px;
    margin-bottom: 16px;
  `}
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 12px;
  height: 44px;
  margin-bottom: 4px;
  cursor: pointer;
  border-radius: 10px;
  background: ${(props) => (props.$active ? COLORS.greenBg : 'transparent')};
  color: ${(props) => (props.$active ? COLORS.green : COLORS.textMain)};
  transition: all ${TRANSITIONS.default};
  justify-content: ${(props) => (props.$collapsed ? 'center' : 'flex-start')};
  position: relative;
  font-size: 14px;
  font-weight: 700;
  
  &:hover {
    background: ${COLORS.grayHover};
    color: ${COLORS.textMain};
  }
`;

const MenuItemIcon = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: ${(props) => (props.$active ? COLORS.green : COLORS.textMain)};
  
  svg {
    width: 20px;
    height: 20px;
    stroke-width: 2.2;
  }
`;

const MenuItemLabel = styled.span`
  font-size: 14px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity ${TRANSITIONS.default};
  flex: 1;
`;

const MenuBadge = styled.span`
  background: ${COLORS.textMain};
  color: ${COLORS.white};
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 12px;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity ${TRANSITIONS.default};
  flex-shrink: 0;
`;

const CollapsedItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 2px 0;
  cursor: pointer;
  border-radius: 10px;
  background: ${(props) => (props.$active ? COLORS.greenBg : 'transparent')};
  color: ${(props) => (props.$active ? COLORS.green : COLORS.textMain)};
  transition: all ${TRANSITIONS.default};
  height: 44px;
  
  &:hover {
    background: ${COLORS.grayHover};
    color: ${COLORS.textMain};
  }
`;

const Tooltip = styled.div`
  position: absolute;
  left: calc(100% + 16px);
  top: 50%;
  transform: translateY(-50%);
  background: ${COLORS.textMain};
  color: ${COLORS.white};
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all ${TRANSITIONS.default};
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 4px 12px ${COLORS.shadow};
  
  &::before {
    content: '';
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 5px solid transparent;
    border-right-color: ${COLORS.textMain};
  }
  
  ${CollapsedItem}:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

const SidebarFooter = styled.div`
  padding: ${(props) => (props.$isOpen ? '12px 16px' : '12px 8px')};
  border-top: 1px solid ${COLORS.border};
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: padding ${TRANSITIONS.default};
`;

const SwitchTabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  background: ${COLORS.bgPage};
  color: ${COLORS.textMain};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all ${TRANSITIONS.default};
  white-space: nowrap;
  text-align: left;
  position: relative;
  justify-content: ${(props) => (props.$collapsed ? 'center' : 'flex-start')};
  
  &:hover {
    background: #EEEEEE;
  }
  
  svg {
    width: 16px;
    height: 16px;
    stroke-width: 2.2;
    flex-shrink: 0;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 14px;
  height: 40px;
  padding: 0 12px;
  background: ${COLORS.red};
  color: ${COLORS.white};
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all ${TRANSITIONS.default};
  white-space: nowrap;
  text-align: left;
  position: relative;
  justify-content: ${(props) => (props.$collapsed ? 'center' : 'flex-start')};
  
  &:hover {
    background: ${COLORS.redHover};
  }
  
  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2.2;
    flex-shrink: 0;
  }
`;

const ToggleButton = styled.button`
  background: ${COLORS.bgPage};
  border: 1px solid ${COLORS.border};
  color: ${COLORS.textMain};
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${TRANSITIONS.default};
  flex-shrink: 0;
  padding: 0;
  
  &:hover {
    background: ${COLORS.textMain};
    color: white;
  }
  
  svg {
    width: 16px;
    height: 16px;
    transition: transform ${TRANSITIONS.default};
  }
`;

// ============================================================
// MOBILE COMPONENTS
// ============================================================

const MobileMenuButton = styled.button`
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 60;
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  box-shadow: 0 2px 12px ${COLORS.shadow};
  display: none;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textMain};
  
  @media (max-width: 767px) {
    display: flex;
  }
`;

const SidebarOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 65;
  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileSidebar = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  background: ${COLORS.white};
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  z-index: 70;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.05);
  transition: transform 0.25s ease;
  transform: ${(props) => (props.$isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  border-right: 1px solid ${COLORS.border};
  
  @media (min-width: 768px) {
    display: none;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  align-self: flex-end;
  color: ${COLORS.textMuted};
  margin-bottom: 16px;
`;

// ============================================================
// MAIN COMPONENT
// ============================================================

const ModernSidebar = ({
  onLogout = () => { },
  onToggle,
  menuItems: customMenuItems,
  activePath: customActivePath,
  tenantData
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (mobile) {
      setIsOpen(false);
    } else {
      const savedState = localStorage.getItem('sidebarOpen');
      setIsOpen(savedState !== null ? savedState === 'true' : true);
    }
  }, []);

  useEffect(() => {
    checkMobile();
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [checkMobile]);

  useEffect(() => {
    if (isMobile && isOpen) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebarOpen', isOpen.toString());
    }
  }, [isOpen, isMobile]);

  const tenantSlug = slug || localStorage.getItem('tenantSlug') || 'default';

  // Full menu items for all users (no single tenant restriction)
  const defaultMenuItems = [
    {
      section: 'Main',
      items: [
        { icon: Truck, label: 'Hearse', path: `/tenant/${tenantSlug}/hearse` },
        { icon: Users, label: 'Deceased', path: `/tenant/${tenantSlug}/deceased` },
        { icon: Package, label: 'Coffins', path: `/tenant/${tenantSlug}/coffins` },
        { icon: Beaker, label: 'Chemicals', path: `/tenant/${tenantSlug}/chemicals` },
        { icon: Hammer, label: 'Workshop', path: `/tenant/${tenantSlug}/workshop` },
        { icon: ShoppingCart, label: 'Flower Bookings', path: `/tenant/${tenantSlug}/flowers` },
        { icon: ShoppingCart, label: 'Catalogue', path: `/tenant/${tenantSlug}/catalogue` },
      ]
    },
    {
      section: 'Analytics',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: `/tenant/${tenantSlug}/dashboard` },
        { icon: BarChart3, label: 'Chemical Analytics', path: `/tenant/${tenantSlug}/chemicals/analytics` },
        { icon: FileBarChart, label: 'Deceased Analytics', path: `/tenant/${tenantSlug}/deceased/analytics` },
      ]
    },
    {
      section: 'Extra',
      items: [
        { icon: Settings, label: 'Settings', path: `/tenant/${tenantSlug}/settings` },
        { icon: Calendar, label: 'Leaves Dashboard', path: `/tenant/${tenantSlug}/leaves` },
        { icon: FileText, label: 'Apply Leave', path: `/tenant/${tenantSlug}/leaves/apply` },
        { icon: LifeBuoy, label: 'Support', path: `/tenant/${tenantSlug}/support` },
      ]
    }
  ];

  const menuItems = customMenuItems || defaultMenuItems;

  const isActive = (path) => {
    if (customActivePath) {
      return location.pathname === customActivePath || location.pathname.startsWith(customActivePath + '/');
    }
    // Exact match
    if (location.pathname === path) return true;

    // Check if current path starts with this path
    if (location.pathname.startsWith(path + '/')) {
      // Get the remaining path after the menu item's path
      const remainingPath = location.pathname.slice(path.length);

      // List of child routes that should not activate parent
      const excludedChildRoutes = ['/apply', '/my-leaves', '/all', '/analytics'];
      const isExcludedChild = excludedChildRoutes.some(child => remainingPath === child || remainingPath.startsWith(child + '/'));

      if (isExcludedChild) {
        // Check if there's an exact menu item for this child route
        const allMenuItems = menuItems.flatMap(section => section.items || []);
        const hasExactChildMatch = allMenuItems.some(item =>
          item.path !== path && location.pathname === item.path
        );

        if (hasExactChildMatch) {
          return false;
        }
      }

      return true;
    }

    return false;
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) setIsOpen(false);
  };

  const handleSwitchToTab = () => {
    const tenantSlug = slug || localStorage.getItem('tenantSlug') || 'default';
    navigate(`/tenant/${tenantSlug}/receptionist`, { replace: true });
  };

  const toggleSidebar = useCallback(() => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) onToggle(newState);
  }, [isOpen, onToggle]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    onLogout();
    navigate('/login');
  }, [onLogout, navigate]);

  const renderMenuItems = (items) => {
    return items.map((item, index) => (
      <MenuItem
        key={index}
        $active={isActive(item.path)}
        $collapsed={false}
        onClick={() => handleNavClick(item.path)}
        role="button"
        tabIndex={0}
      >
        <MenuItemIcon $active={isActive(item.path)}>
          <item.icon size={20} />
        </MenuItemIcon>
        <MenuItemLabel $active={isActive(item.path)} $visible={isOpen}>
          {item.label}
        </MenuItemLabel>
        {item.badge && isOpen && (
          <MenuBadge $visible={isOpen}>{item.badge}</MenuBadge>
        )}
      </MenuItem>
    ));
  };

  const renderCollapsedItems = (items) => {
    return items.map((item, index) => (
      <CollapsedItem
        key={index}
        $active={isActive(item.path)}
        onClick={() => handleNavClick(item.path)}
        role="button"
        tabIndex={0}
      >
        <Tooltip>{item.label}</Tooltip>
        <MenuItemIcon $active={isActive(item.path)}>
          <item.icon size={20} />
        </MenuItemIcon>
        {item.badge && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: COLORS.textMain,
            color: COLORS.white,
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '12px',
            minWidth: '12px',
            textAlign: 'center'
          }}>
            {item.badge}
          </span>
        )}
      </CollapsedItem>
    ));
  };

  // ─── MOBILE VIEW ─────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <MobileMenuButton onClick={() => setIsOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </MobileMenuButton>

        {isOpen && <SidebarOverlay onClick={() => setIsOpen(false)} aria-hidden="true" />}

        <MobileSidebar $isOpen={isOpen}>
          <CloseButton onClick={() => setIsOpen(false)} aria-label="Close sidebar">
            <X size={22} />
          </CloseButton>

          <SidebarNav $isOpen={true}>
            {menuItems.map((section, idx) => (
              <NavSection key={idx}>
                {section.section && (
                  <NavSectionTitle $isOpen={true}>
                    {section.section}
                  </NavSectionTitle>
                )}
                {renderMenuItems(section.items)}
              </NavSection>
            ))}
          </SidebarNav>

          <SidebarFooter $isOpen={true}>
            <LogoutButton $collapsed={false} onClick={handleLogout}>
              <LogOut size={18} />
              <span>Sign Out</span>
            </LogoutButton>
          </SidebarFooter>
        </MobileSidebar>
      </>
    );
  }

  // ─── DESKTOP VIEW ────────────────────────────────────────────
  return (
    <SidebarWrapper>
      <SidebarContainer $isOpen={isOpen}>
        <SidebarNav $isOpen={isOpen}>
          {menuItems.map((section, idx) => (
            <NavSection key={idx}>
              {section.section && (
                <NavSectionTitle $isOpen={isOpen}>
                  {isOpen ? section.section : ''}
                </NavSectionTitle>
              )}
              {isOpen ? renderMenuItems(section.items) : renderCollapsedItems(section.items)}
            </NavSection>
          ))}
        </SidebarNav>

        <SidebarFooter $isOpen={isOpen}>
          <SwitchTabButton $collapsed={!isOpen} onClick={handleSwitchToTab}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v6M9 5h6M5 8l-3 4 3 4M19 8l3 4-3 4M9 22h6"></path>
              <rect x="7" y="12" width="10" height="6" rx="1" />
            </svg>
            {isOpen && <span>Switch to Tab</span>}
            {!isOpen && <Tooltip>Switch to Tab</Tooltip>}
          </SwitchTabButton>

          <LogoutButton $collapsed={!isOpen} onClick={handleLogout}>
            <LogOut size={18} />
            {isOpen && <span>Sign Out</span>}
            {!isOpen && <Tooltip>Sign Out</Tooltip>}
          </LogoutButton>

          <ToggleButton $isOpen={isOpen} onClick={toggleSidebar}>
            {isOpen ? (
              <ChevronLeft size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </ToggleButton>
        </SidebarFooter>
      </SidebarContainer>
    </SidebarWrapper>
  );
};

export default ModernSidebar;