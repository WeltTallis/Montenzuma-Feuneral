import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../../api';
import { ENDPOINTS } from '../../api/endpoints';
import { getUserId, getParentTenantSlug } from '../../utils/globalAuth';
import { countUnseenDecisions, markDecisionsSeen } from '../../utils/leaveDecisionBadge';
import { useSocket } from '../../utils/context/socketContext';
// `isWorkshopAdmin` and `BookOpen` were only needed by the removed "Store
// Journal" nav item; the Journal now lives inside the dashboard's Store view.
import { LayoutDashboard, Users, FileText, Calendar, Box, Hammer, ShoppingCart, Package, Truck, Beaker, Activity, LifeBuoy, Settings, LogOut, Menu, X, ChevronLeft, ChevronRight } from '../../utils/icons/icons';

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
  position: relative;
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

// Red COUNT badge for "Apply Leave" (was an 8px dot that could only say
// "something", never "how much"). Deliberately oversized and solid red: this is
// the one signal that tells an employee their leave was approved or rejected,
// and it has to be legible at a glance from across a desk.
//
// The white ring keeps it readable over both the white nav row and the navy
// active row it sits on, and the pulse makes it impossible to miss on first
// arrival — then settles so it stops nagging.
const LeaveAlertDot = styled.span`
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background: #DC2626;
  color: #FFFFFF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 0 0 2px ${COLORS.white}, 0 2px 6px rgba(220, 38, 38, 0.5);
  pointer-events: none;
  z-index: 3;
  animation: leaveBadgePulse 2.4s ease-in-out infinite;

  @keyframes leaveBadgePulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 2px ${COLORS.white}, 0 2px 6px rgba(220, 38, 38, 0.5); }
    50%      { transform: scale(1.08); box-shadow: 0 0 0 2px ${COLORS.white}, 0 0 0 6px rgba(220, 38, 38, 0.18); }
  }

  /* Respect reduced-motion: keep the badge legible, drop the animation. */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  /* Collapsed rail has no room for a wide pill — show just the number. */
  ${(props) => props.$compact && `
    min-width: 18px;
    height: 18px;
    font-size: 11px;
    top: 0;
    right: 0;
  `}
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
  bottom: 18px;
  left: 14px;
  /* Above the sidebar drawer (70) and its scrim (65) is what made the button
     "get lost" — while the drawer was open it stayed on top, and at full scroll
     it floated over the dark footer where a translucent white button all but
     disappeared. It now sits ABOVE the drawer only while closed, and gets a
     solid background + stronger shadow so it is always visible. */
  z-index: 80;
  width: 52px;
  height: 52px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 18px;
  padding: 0;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22), 0 2px 8px rgba(15, 23, 42, 0.12);
  display: none;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textMain};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    transform: scale(0.96);
  }

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
// SINGLE TENANT COMPONENTS
// ============================================================

const SingleTenantMenuButton = styled.button`
  position: fixed;
  bottom: 18px;
  left: 14px;
  z-index: 80;
  width: 52px;
  height: 52px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 18px;
  padding: 0;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22), 0 2px 8px rgba(15, 23, 42, 0.12);
  display: none;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textMain};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    transform: scale(0.96);
  }

  &:hover {
    background: ${COLORS.grayHover};
  }

  @media (max-width: 767px) {
    display: flex;
  }
`;

const SingleTenantOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 65;
`;

const SingleTenantSidebar = styled.aside`
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
`;

// ============================================================
// MAIN COMPONENT - FIXED
// ============================================================

const ModernSidebar = ({
  onLogout = () => { },
  onToggle,
  menuItems: customMenuItems,
  activePath: customActivePath,
  tenantData,
  deploymentType = 'multi',
  tenantSlug: propTenantSlug // CRITICAL: This comes from DashboardLayout
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug: urlSlug } = useParams();
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return false;
    }
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [hasMounted, setHasMounted] = useState(false);

  const isSingleTenant = deploymentType === 'single';

  // ============================================================
  // CRITICAL FIX: Get tenant slug from props FIRST, then localStorage
  // DO NOT rely on useParams() - it may not work correctly here
  // ============================================================
  const getTenantSlug = useCallback(() => {
    // Priority 1: the logged-in user's COMPLETE BRANCH SLUG
    // (`<org-slug>-<branch-name>` — e.g. `org-home-nairobi` for the Main
    // branch, `org-home-machakos` / `org-home-thika` for children). EVERY
    // nav link must carry the complete slug of the user's own branch; the
    // backend resolves any complete branch slug back to the right database.
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const branchSlug = user?.branchSlug || user?.branch_slug || '';
      if (branchSlug && branchSlug !== 'undefined' && branchSlug !== 'null') {
        console.log('[ModernSidebar] Using user complete branch slug:', branchSlug);
        return branchSlug;
      }
    } catch (e) {
      console.error('[ModernSidebar] Error parsing user:', e);
    }

    // Priority 2: Prop from DashboardLayout (most reliable for parent org)
    if (propTenantSlug && propTenantSlug !== 'undefined' && propTenantSlug !== 'null') {
      console.log('[ModernSidebar] Using tenant slug from props:', propTenantSlug);
      return propTenantSlug;
    }

    // Priority 3: URL param from useParams()
    if (urlSlug && urlSlug !== 'undefined' && urlSlug !== 'null') {
      console.log('[ModernSidebar] Using tenant slug from URL params:', urlSlug);
      return urlSlug;
    }

    // Priority 4: localStorage
    const stored = localStorage.getItem('tenantSlug');
    if (stored && stored !== 'undefined' && stored !== 'null') {
      console.log('[ModernSidebar] Using tenant slug from localStorage:', stored);
      return stored;
    }

    // Priority 5: user object fallbacks (parent tenant slug etc.)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userSlug = user?.tenantSlug || user?.tenant_slug || user?.parentTenantSlug || user?.branchDbName || '';
      if (userSlug) {
        console.log('[ModernSidebar] Using tenant slug from user object:', userSlug);
        return userSlug;
      }
    } catch (e) {
      console.error('[ModernSidebar] Error parsing user:', e);
    }

    console.warn('[ModernSidebar] No tenant slug found! This will cause navigation issues.');
    return '';
  }, [propTenantSlug, urlSlug]);

  const tenantSlug = getTenantSlug();

  // ── Red COUNT badge on "Apply Leave" ──────────────────────────────────────
  // Shows how many of THIS user's requests an approver has DECIDED
  // (approved/rejected) that they have not opened the Apply Leave page to see
  // yet. Deliberately NOT the notification bell — it is a badge on this nav item.
  //
  // This used to POLL: a GET /leaves/my-leaves every 60s, re-armed on EVERY
  // route change by its `location.pathname` dependency. With several tabs open
  // that is a request per user per minute per tab, and it was the leave endpoint
  // that kept tripping the API gateway's rate limiter.
  //
  // It is now event-driven. leave-service publishes to the platform socket bus
  // (SOCKETIO_SERVICE_URL/emit/...), which arrives here already prefixed as
  // `notification:leave:updated`. The socket is ALSO the reconnect safety net:
  // a slow poll is kept only while the socket is DOWN, so a user who never
  // approves anything generates zero requests on a healthy connection.
  const [leaveAlertCount, setLeaveAlertCount] = useState(0);
  const { socket, connected } = useSocket();
  const leaveRowsRef = useRef([]);

  const recomputeBadge = useCallback(() => {
    const uid = getUserId();
    if (!uid) {
      setLeaveAlertCount(0);
      return;
    }
    setLeaveAlertCount(countUnseenDecisions(leaveRowsRef.current, uid));
  }, []);

  // Seed once per mount: one request to learn the CURRENT state. The badge must
  // be right on first paint, before any event has had a chance to fire.
  useEffect(() => {
    const uid = getUserId();
    if (!uid) return undefined;

    let cancelled = false;

    const fetchOnce = async () => {
      try {
        const parentSlug = getParentTenantSlug() || getTenantSlug();
        const headers = { 'x-tenant-slug': parentSlug, 'x-user-id': String(uid) };
        const res = await api.get(ENDPOINTS.LEAVE.MY_LEAVES, { headers });
        const rows = res?.data?.data || res?.data || [];
        if (cancelled || !Array.isArray(rows)) return;
        leaveRowsRef.current = rows;
        recomputeBadge();
      } catch {
        // Leave service unreachable — never show a false "you have news" badge.
        if (!cancelled) setLeaveAlertCount(0);
      }
    };

    fetchOnce();

    // ── Recovery poll, ONLY while the socket is down ──
    // A 60s retry is cheap when compared with polling unconditionally, and it
    // guarantees the badge self-heals if the socket was down when a decision
    // landed (otherwise the miss would persist until the next reload).
    const poll = setInterval(() => {
      if (!connected) fetchOnce();
    }, 60000);

    return () => { cancelled = true; clearInterval(poll); };
  }, [connected, recomputeBadge]);

  // Real-time updates. Applies the change to the cached rows and recomputes, so
  // an approval lands on the badge without any request.
  useEffect(() => {
    if (!socket) return undefined;

    const onLeaveEvent = (payload) => {
      // The bus prefixes events with "notification:". Accept the bare name too
      // so this keeps working if the event is ever added to the no-prefix list.
      const leave = payload?.leave || payload?.data || payload;
      if (!leave || leave.id == null) return;

      const uid = getUserId();
      if (!uid) return;

      // Ignore decisions about somebody else's request.
      const owner = leave.user_id ?? leave.userId;
      if (owner != null && String(owner) !== String(uid)) return;

      const rows = Array.isArray(leaveRowsRef.current) ? leaveRowsRef.current : [];
      const key = String(leave.id);
      const idx = rows.findIndex((l) => String(l?.id) === key);

      if (idx === -1) {
        // Never seen this request (e.g. the tab was closed when it was filed) —
        // one fetch to resync beats guessing at the shape of the new row.
        const parentSlug = getParentTenantSlug() || getTenantSlug();
        api.get(ENDPOINTS.LEAVE.MY_LEAVES, { headers: { 'x-tenant-slug': parentSlug, 'x-user-id': String(uid) } })
          .then((res) => {
            const next = res?.data?.data || res?.data || [];
            if (Array.isArray(next)) {
              leaveRowsRef.current = next;
              recomputeBadge();
            }
          })
          .catch(() => { /* badge simply stays as-is until the next event */ });
        return;
      }

      // Merge the authoritative status in place. `status` is what the badge
      // counts, so updating it is the entire job.
      const next = rows.slice();
      next[idx] = { ...next[idx], ...leave, id: next[idx].id };
      leaveRowsRef.current = next;
      recomputeBadge();
    };

    socket.on('notification:leave:updated', onLeaveEvent);
    socket.on('notification:leave:created', onLeaveEvent);

    return () => {
      socket.off('notification:leave:updated', onLeaveEvent);
      socket.off('notification:leave:created', onLeaveEvent);
    };
  }, [socket, recomputeBadge]);

  // Opening the Apply Leave page IS the "I have seen it" signal — the badge must
  // NOT self-dismiss on a timer or after N seconds. It stays put until the user
  // deliberately visits the page, because a leave decision that quietly vanishes
  // is worse than one that nags.
  //
  // `markDecisionsSeen` is imported statically (not via a dynamic import) so it
  // cannot lose a race with the badge recompute or fail silently on a slow chunk.
  useEffect(() => {
    if (!location.pathname.includes('/leaves/apply')) return;
    markDecisionsSeen(leaveRowsRef.current, getUserId());
    recomputeBadge();
  }, [location.pathname, recomputeBadge]);

  // Debug log to show what slug we're using
  console.log('[ModernSidebar] Final tenant slug:', tenantSlug);

  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth < 768;
    // Only force-close the drawer on a REAL desktop -> mobile transition.
    // Mobile browsers fire `resize` constantly (URL bar / keyboard appear and
    // collapse), so closing on EVERY resize made the hamburger feel broken —
    // the drawer opened and instantly closed before the user could navigate.
    if (mobile !== isMobile) {
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
    }
  }, [isMobile]);

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
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !isMobile) {
      localStorage.setItem('sidebarOpen', isOpen.toString());
    }
  }, [isOpen, isMobile, hasMounted]);

  // ============================================================
  // FIXED: Build paths with the correct tenant slug
  // ============================================================
  const defaultMenuItems = [
    {
      section: 'Main',
      items: [
        { icon: Truck, label: 'Fleet', path: `/${tenantSlug}/fleet` },
        { icon: Calendar, label: 'Hearse Bookings', path: `/${tenantSlug}/hearse` },
        { icon: Users, label: 'Deceased', path: `/${tenantSlug}/deceased` },
        { icon: Package, label: 'Coffins', path: `/${tenantSlug}/coffins` },
        { icon: Beaker, label: 'Chemicals', path: `/${tenantSlug}/chemicals` },
        { icon: Hammer, label: 'Workshop', path: `/${tenantSlug}/workshop` },
        { icon: ShoppingCart, label: 'Flowers', path: `/${tenantSlug}/flowers` },
        { icon: Box, label: 'Mini Store', path: `/${tenantSlug}/mini-store` },
        { icon: LayoutDashboard, label: 'Dashboard', path: `/${tenantSlug}/dashboard` },
        { icon: Activity, label: 'Insurance', path: `/${tenantSlug}/insurance` },
      ]
    },
    {
      section: 'Extra',
      items: [
        { icon: Settings, label: 'Settings', path: `/${tenantSlug}/settings` },
        { icon: Calendar, label: 'Leaves', path: `/${tenantSlug}/leaves` },
        { icon: FileText, label: 'Apply Leave', path: `/${tenantSlug}/leaves/apply` },
        { icon: LifeBuoy, label: 'Support', path: `/${tenantSlug}/support` },
        // "Store Journal" used to sit HERE as its own admin-only nav item. It is
        // gone because the Journal is no longer a separate destination: the
        // Calendar + History journal is part of the Store view inside the
        // Operations dashboard's Workshop module (dashboard/WorkshopPanel.jsx →
        // StoreView), which every user reaches from Workshop → Dashboard. Leaving
        // a second, duplicate entry point here meant two UIs for one feature and
        // a dead-looking link for anyone who was not an admin.
      ]
    }
  ];

  const baseMenuItems = customMenuItems || defaultMenuItems;
  const filterSingleTenantMenu = (items) =>
    (items || []).map((section) => ({
      ...section,
      items: (section.items || []).filter((item) => {
        // Root-level twins plus both the new (/{slug}/…) and the legacy
        // (/tenant/{slug}/…) spellings of the tenant-scoped paths.
        // NOTE: Chemicals is deliberately NOT hidden. It has no other entry
        // point, so filtering it here left single-tenant users with no way to
        // reach /chemicals at all.
        const hiddenPaths = [
          `/${tenantSlug}/dashboard`, `/${tenantSlug}/analytics`, `/${tenantSlug}/workshop`,
          `/tenant/${tenantSlug}/dashboard`, `/tenant/${tenantSlug}/analytics`, `/tenant/${tenantSlug}/workshop`,
          '/dashboard', '/analytics', '/workshop',
        ];
        const hiddenLabels = ['Dashboard', 'Analytics', 'Workshop'];
        const itemPath = item.path || '';
        return !(hiddenLabels.includes(item.label) || hiddenPaths.includes(itemPath) || itemPath.includes('/dashboard') || itemPath.includes('/analytics') || itemPath.includes('/workshop'));
      })
    })).filter((section) => (section.items || []).length > 0);

  const menuItems = isSingleTenant ? filterSingleTenantMenu(baseMenuItems) : baseMenuItems;

  const isActive = (path) => {
    if (customActivePath) {
      return location.pathname === customActivePath || location.pathname.startsWith(customActivePath + '/');
    }
    // Exact match
    if (location.pathname === path) return true;

    // Check if current path starts with this path
    if (location.pathname.startsWith(path + '/')) {
      const remainingPath = location.pathname.slice(path.length);
      const excludedChildRoutes = ['/apply', '/my-leaves', '/all', '/analytics'];
      const isExcludedChild = excludedChildRoutes.some(child => remainingPath === child || remainingPath.startsWith(child + '/'));

      if (isExcludedChild) {
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
    console.log('[ModernSidebar] Navigating to:', path);
    navigate(path);
    if (isMobile) setIsOpen(false);
  };

  const handleSwitchToTab = () => {
    const slug = getTenantSlug();
    console.log('[ModernSidebar] Switching to tab with slug:', slug);
    navigate(`/${slug}/receptionist`, { replace: true });
  };

  const toggleSidebar = useCallback(() => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) onToggle(newState);
  }, [isOpen, onToggle]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    onLogout();
    navigate('/login');
  }, [onLogout, navigate]);

  const renderMenuItems = (items, forceVisible = false) => {
    const visible = forceVisible || isOpen;
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
        {leaveAlertCount > 0 && item.label === 'Apply Leave' && (
          <LeaveAlertDot
            title={`${leaveAlertCount} leave ${leaveAlertCount === 1 ? 'decision' : 'decisions'} waiting for you`}
            aria-label={`${leaveAlertCount} leave decisions waiting`}
          >
            {leaveAlertCount > 99 ? '99+' : leaveAlertCount}
          </LeaveAlertDot>
        )}
        <MenuItemLabel $active={isActive(item.path)} $visible={visible}>
          {item.label}
        </MenuItemLabel>
        {item.badge && visible && (
          <MenuBadge $visible={visible}>{item.badge}</MenuBadge>
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
        {leaveAlertCount > 0 && item.label === 'Apply Leave' && (
          <LeaveAlertDot
            $compact
            title={`${leaveAlertCount} leave ${leaveAlertCount === 1 ? 'decision' : 'decisions'} waiting for you`}
            aria-label={`${leaveAlertCount} leave decisions waiting`}
          >
            {leaveAlertCount > 99 ? '99+' : leaveAlertCount}
          </LeaveAlertDot>
        )}
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

  // ─── MOBILE VIEW (off-canvas drawer for ALL deployment types) ──
  // Single-tenant installs show the SAME persistent sidebar panel as every
  // other tenant on large screens (desktop view below). On small screens we
  // fall back to a hamburger button + slide-in drawer so navigation never
  // disappears on any device.
  if (isMobile) {
    const DrawerButton = isSingleTenant ? SingleTenantMenuButton : MobileMenuButton;
    const DrawerPanel = isSingleTenant ? SingleTenantSidebar : MobileSidebar;
    const DrawerOverlay = isSingleTenant ? SingleTenantOverlay : SidebarOverlay;

    return (
      <>
        <DrawerButton
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open menu"
          aria-expanded={isOpen}
          /* The button is position:fixed, so with the drawer open it would
             otherwise hover over the drawer panel itself. Hide it while open —
             the panel has its own CloseButton. */
          style={isOpen ? { display: 'none' } : undefined}
        >
          <Menu size={22} />
        </DrawerButton>

        {isOpen && <DrawerOverlay onClick={() => setIsOpen(false)} aria-hidden="true" />}

        <DrawerPanel $isOpen={isOpen}>
          <CloseButton type="button" onClick={() => setIsOpen(false)} aria-label="Close sidebar">
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
                {renderMenuItems(section.items, true)}
              </NavSection>
            ))}
          </SidebarNav>

          <SidebarFooter $isOpen={true}>
            <SwitchTabButton $collapsed={false} onClick={handleSwitchToTab}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v6M9 5h6M5 8l-3 4 3 4M19 8l3 4-3 4M9 22h6"></path>
                <rect x="7" y="12" width="10" height="6" rx="1" />
              </svg>
              <span>Switch to Tab</span>
            </SwitchTabButton>
            <LogoutButton $collapsed={false} onClick={handleLogout}>
              <LogOut size={18} />
              <span>Sign Out</span>
            </LogoutButton>
          </SidebarFooter>
        </DrawerPanel>
      </>
    );
  }












  //  DESKTOP VIEW (multi-branch) 
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
