import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import env from '../../utils/config/env';
import { getTenantSlug, getParentTenantSlug } from '../../utils/globalAuth';
import ReusableCalendar from '../../utils/calender/calender';
import HorizontalCalendar from '../views/horizontalCalender';
import WeeklyView from '../views/weeklyView';
import DailyView from '../views/dailyView';
import { formatDate, toDateKey, todayKey } from '../../utils/dates/parseDates';

const API = env.FULL_API_URL;

// ─── Design Tokens (Modern SaaS Aesthetic) ───────────────────────────
const S = {
  primary: '#1d4ed8', // Rich Royal Blue
  primaryLight: '#eff6ff',
  primaryDark: '#1e3a8a',
  bg: '#f8fafc',
  cardBg: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  success: '#059669',
  successLight: '#ecfdf5',
  warning: '#d97706',
  warningLight: '#fffbeb',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  info: '#0284c7',
  drawerWidth: 520,
  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.04)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.06)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.08)',
  shadowXl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease',
};

// ─── Helpers ─────────────────────────────────────────────────────────
const getStockStatus = (stock) => {
  if (stock <= 0) return { label: 'Out of Stock', cls: 'tag-ou', color: '#dc2626' };
  if (stock <= 2) return { label: 'Low Stock', cls: 'tag-lo', color: '#d97706' };
  return { label: 'Available', cls: 'tag-ok', color: '#059669' };
};

const getBookingStatus = (status) => {
  const map = {
    pending: { label: 'Pending', cls: 'tag-pe' },
    booked: { label: 'Approved', cls: 'tag-bo' },
    completed: { label: 'Completed', cls: 'tag-co' },
    cancelled: { label: 'Cancelled', cls: 'tag-ca' },
    approved: { label: 'Approved', cls: 'tag-ar' },
    rejected: { label: 'Rejected', cls: 'tag-ou' },
    transferring: { label: 'In Transit', cls: 'tag-tr' },
    delivered: { label: 'Delivered', cls: 'tag-de' },
  };
  return map[status] || map.pending;
};

const getReqStatus = (status) => {
  const map = {
    pending: { label: 'Pending', cls: 'tag-pe' },
    approved: { label: 'Approved', cls: 'tag-ar' },
    rejected: { label: 'Rejected', cls: 'tag-ou' },
    transferring: { label: 'In Transit', cls: 'tag-tr' },
    delivered: { label: 'Delivered', cls: 'tag-de' },
  };
  return map[status] || map.pending;
};

const getBookingDotColor = (b) => {
  switch (b.status) {
    case 'pending': return S.warning;
    case 'booked':
    case 'approved': return S.info;
    case 'completed': return S.success;
    case 'cancelled':
    case 'rejected': return S.danger;
    default: return S.primary;
  }
};

const getCoffinName = (coffinId, coffinsList = []) => {
  const c = coffinsList.find(x => (x.coffin_id || x.id) == coffinId);
  return c ? c.name : 'Coffin';
};

const getStatusColor = (status) => {
  const map = {
    pending: S.warning,
    booked: S.info,
    approved: S.info,
    completed: S.success,
    cancelled: S.danger,
    rejected: S.danger,
    transferring: '#7C3AED',
    delivered: '#0D9488',
  };
  return map[status] || S.primary;
};

const formatKES = (n) => 'KES ' + parseFloat(n || 0).toLocaleString();


// ─── Inline Styles Object ────────────────────────────────────────────
const styles = {
  W: {
    maxWidth: 2200,
    margin: '0 auto',

    fontFamily: S.font,
    color: S.text,
    background: S.bg,
    minHeight: '100vh',
    fontSize: 14,
    WebkitFontSmoothing: 'antialiased',
  },
  hd: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    flexWrap: 'wrap',
    gap: 16,
  },
  hdLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  hdH1: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: '-0.025em',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    margin: 0,
  },
  hdH1Icon: {
    color: S.text,
    background: S.primaryLight,
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
  },
  hdInfoP: { color: S.text, fontSize: 13, marginTop: 4, margin: 0 },

  // Stats Cards
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '120px',
    boxShadow: S.shadowMd,
    transition: S.transition,
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.71)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.15)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: '1',
  },
  statSubtext: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: '4px',
    fontWeight: '500',
  },

  notifContainer: { position: 'relative' },
  notifBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    border: `1px solid ${S.border}`,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 18,
    color: S.textMuted,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: S.transition,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    background: S.danger,
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 6px',
    borderRadius: 10,
    border: '2px solid #fff',
  },
  notifPanel: {
    position: 'absolute',
    top: 60,
    right: 0,
    width: 380,
    background: '#fff',
    border: `1px solid ${S.border}`,
    borderRadius: 16,
    boxShadow: S.shadowXl,
    zIndex: 200,
    display: 'none',
    flexDirection: 'column',
    maxHeight: 450,
    overflow: 'hidden',
  },
  notifPanelOpen: { display: 'flex' },
  notifHeader: {
    padding: '16px 20px',
    borderBottom: `1px solid ${S.border}`,
    fontWeight: 700,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14,
  },
  notifList: { overflowY: 'auto', flex: 1 },
  notifItem: {
    padding: '14px 20px',
    borderBottom: `1px solid ${S.borderLight}`,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  notifItemUnread: { background: S.primaryLight },
  notifIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    flexShrink: 0,
  },

  // Modern Tabs (Segmented Control)
  tabs: {
    display: 'inline-flex',
    gap: 4,
    marginBottom: 24,
    background: '#fff',
    padding: 4,
    borderRadius: 10,
    border: `1px solid ${S.border}`,
    boxShadow: S.shadowSm,
  },
  tab: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    background: 'transparent',
    color: S.textMuted,
    transition: S.transition,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'inherit',
  },
  tabActive: {
    background: S.primary,
    color: '#fff',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
  },
  badge: {
    background: '#fff',
    color: S.primary,
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 8,
  },
  badgeActive: { background: 'rgba(255,255,255,0.2)', color: '#fff' },

  // Tables
  tw: {
    background: '#fff',
    border: `1px solid ${S.border}`,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: S.shadowMd,
  },
  tt: {
    padding: '16px 24px',
    borderBottom: `1px solid ${S.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    background: '#fff',
  },
  sbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: S.bg,
    border: `1px solid ${S.border}`,
    borderRadius: 8,
    padding: '10px 14px',
    width: 300,
  },
  sboxInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 14,
    width: '100%',
    fontFamily: 'inherit',
    color: S.text,
  },
  ff: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  fn: {
    padding: '8px 14px',
    borderRadius: 8,
    border: `1px solid ${S.border}`,
    background: '#fff',
    color: S.textMuted,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: S.transition,
    fontFamily: 'inherit',
  },
  fnActive: { background: S.primaryLight, color: S.primary, borderColor: S.primary },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '12px 24px',
    textAlign: 'left',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: S.textMuted,
    background: S.bg,
    fontWeight: 700,
    borderBottom: `1px solid ${S.border}`,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '14px 24px',
    fontSize: 14,
    borderBottom: `1px solid ${S.borderLight}`,
    color: '#334155',
    verticalAlign: 'middle',
  },
  ci: { display: 'flex', alignItems: 'center', gap: 12 },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: S.primaryLight,
    color: S.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
  },
  cname: { fontWeight: 600, color: S.text, fontSize: 14 },
  sku: { fontSize: 12, color: S.textMuted },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 16,
    fontSize: 11,
    fontWeight: 600,
  },
  ib: {
    width: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    border: `1px solid ${S.border}`,
    background: '#fff',
    color: S.textMuted,
    cursor: 'pointer',
    transition: S.transition,
    margin: '0 2px',
    fontSize: 14,
  },
  es: {
    textAlign: 'center',
    padding: '48px 24px',
    color: S.textMuted,
  },
  esIcon: { fontSize: 28, marginBottom: 12, opacity: 0.2 },
  esP: { fontSize: 14, margin: 0 },
  rg: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },

  // Modal styles
  moOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.6)',
    backdropFilter: 'blur(6px)',
    zIndex: 250,
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  moOpen: { display: 'flex' },
  md: {
    background: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: S.shadowXl,
  },
  mh: {
    padding: '20px 24px',
    borderBottom: `1px solid ${S.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mh2: { fontSize: 18, fontWeight: 700, margin: 0 },
  mx: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: `none`,
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: S.textMuted,
  },
  mb: { padding: 24 },
  mf: {
    padding: '16px 24px',
    borderTop: `1px solid ${S.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    background: S.bg,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  fg: { marginBottom: 16 },
  fr: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  fl: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: S.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  fi: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${S.border}`,
    background: '#fff',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    transition: S.transition,
    boxSizing: 'border-box',
  },
  fs: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${S.border}`,
    background: '#fff',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    transition: S.transition,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: S.transition,
    whiteSpace: 'nowrap',
  },
  btnP: { background: S.primary, color: '#fff', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' },
  btnD: { background: S.danger, color: '#fff' },
  btnG: { background: '#f1f5f9', color: '#475569' },
  btnS: { background: S.success, color: '#fff' },
  btnW: { background: S.warning, color: '#fff' },
  btnSm: { padding: '6px 12px', fontSize: 12, borderRadius: 6 },
  btnWFull: { width: '100%', padding: 12 },

  // Drawer
  drawerOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 199,
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.3s',
  },
  drawerOverlayOpen: { opacity: 1, pointerEvents: 'auto' },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: '100%',
    maxWidth: S.drawerWidth,
    background: '#fff',
    boxShadow: '-8px 0 30px rgba(0,0,0,0.1)',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
  },
  drawerOpen: { transform: 'translateX(0)' },
  drawerHeader: {
    padding: '20px 24px',
    borderBottom: `1px solid ${S.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerHeaderH2: { fontSize: 18, fontWeight: 700, margin: 0 },
  drawerBody: { flex: 1, overflowY: 'auto', padding: 24, background: S.bg },

  // Detail drawer
  detailImage: {
    width: '100%',
    height: 220,
    background: `linear-gradient(135deg, ${S.bg} 0%, ${S.borderLight} 100%)`,
    borderRadius: 12,
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${S.border}`,
  },
  detailStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    fontSize: 16,
    fontWeight: 700,
  },
  statusDot: { width: 10, height: 10, borderRadius: '50%' },
  detailSection: { marginBottom: 24, background: '#fff', border: `1px solid ${S.border}`, borderRadius: 12, padding: 20 },
  detailSectionH4: {
    fontSize: 13,
    fontWeight: 700,
    color: S.textMuted,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: `1px solid ${S.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: 14,
  },
  detailRowSpan: { color: S.textMuted },
  detailRowStrong: { color: S.text, fontWeight: 600, textAlign: 'right' },
  otherBranchesList: { display: 'flex', flexDirection: 'column', gap: 8 },
  otherBranchItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: S.bg,
    borderRadius: 8,
    fontSize: 13,
    border: `1px solid ${S.border}`,
  },
  branchTag: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 },
  detailActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 },

  // Tracker
  tracker: { display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '24px 0 32px' },
  trackerDot: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#fff',
    border: '3px solid ' + S.border,
    color: S.textMuted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    transition: 'all 0.3s',
  },
  trackerStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1, textAlign: 'center', width: '25%' },
  trackerLabel: { fontSize: 11, fontWeight: 600, color: S.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' },
  historyLog: { background: S.bg, border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, marginTop: 16 },
  historyItem: { display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 16, position: 'relative' },
  historyCheck: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: S.success,
    color: '#fff',
    fontSize: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
    zIndex: 1,
  },

  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    color: S.textMuted,
    fontSize: 14,
    gap: 10,
  },
};

// ─── Tag helpers ─────────────────────────────────────────────────────
const Tag = ({ cls, children }) => {
  const tagStyles = {
    'tag-ok': { background: S.successLight, color: S.success },
    'tag-lo': { background: S.warningLight, color: S.warning },
    'tag-ou': { background: S.dangerLight, color: S.danger },
    'tag-pe': { background: S.warningLight, color: S.warning },
    'tag-bo': { background: '#e0f2fe', color: S.info },
    'tag-co': { background: S.successLight, color: S.success },
    'tag-ca': { background: S.dangerLight, color: S.danger },
    'tag-ar': { background: '#e0e7ff', color: S.primaryDark },
    'tag-tr': { background: S.warningLight, color: S.warning },
    'tag-de': { background: S.successLight, color: S.success },
  };
  return <span style={{ ...styles.tag, ...(tagStyles[cls] || tagStyles['tag-ok']) }}>{children}</span>;
};

// ─── Main Component ──────────────────────────────────────────────────
const CoffinDashboard = () => {
  const [tab, setTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data
  const [coffins, setCoffins] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);

  // Filters
  const [invFilter, setInvFilter] = useState('all');
  const [bkFilter, setBkFilter] = useState('all');
  const [invQuery, setInvQuery] = useState('');
  const [bkQuery, setBkQuery] = useState('');
  // Reservations view: 'calendar' (default monthly view) or 'list'
  const [bkView, setBkView] = useState('calendar');
  const [calendarMode, setCalendarMode] = useState('week');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [detailDate, setDetailDate] = useState(null);

  // Transfers tab state (lifted from renderTransfers to avoid conditional hooks)
  const [transferTab, setTransferTab] = useState('incoming');
  const [expandedTransferId, setExpandedTransferId] = useState(null);
  const [transferQuery, setTransferQuery] = useState('');

  // Drawer / Modal
  const [drawer, setDrawer] = useState({ open: false, title: '', content: '' });
  const [modal, setModal] = useState({ open: false, type: '', data: {} });
  const [submitLoading, setSubmitLoading] = useState(false);




  useEffect(() => {
    const faId = 'font-awesome-cdn-inject';
    if (!document.getElementById(faId)) {
      const link = document.createElement('link');
      link.id = faId;
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
      document.head.appendChild(link);
    }
  }, []);

  // ─── API Calls ──────────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tenantSlug = getTenantSlug();
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      // Fix: Use logged-in user's actual branch ID instead of defaulting to branchList[0]
      const userBranchId = user?.branchId || user?.branch_id;

      // Fetch branches using PARENT tenant slug ONLY (never branch slug)
      // Read parentTenantSlug DIRECTLY from user object in localStorage
      let branchList = [];
      try {
        const userObj = JSON.parse(userStr || '{}');
        const parentTenantSlug = userObj.parentTenantSlug;

        console.log('[COFFIN UI] Branch slug (current):', tenantSlug);
        console.log('[COFFIN UI] Parent slug (from user object):', parentTenantSlug);

        if (!parentTenantSlug) {
          console.error('[COFFIN UI] No parentTenantSlug in user object! User must log out and log back in.');
          throw new Error('No parentTenantSlug found. Please log out and log back in.');
        }

        // Use parentTenantSlug - NEVER use branch slug for fetching branches
        console.log('[COFFIN UI] Fetching branches from:', `/tenant/${parentTenantSlug}/branches`);

        const branchesRes = await api.get(`/tenant/${parentTenantSlug}/branches`);
        if (branchesRes.data?.success && branchesRes.data?.data) {
          const rawBranches = Array.isArray(branchesRes.data.data) ? branchesRes.data.data : [];
          branchList = rawBranches.map(b => ({
            id: b.branch_id,
            name: b.branch_name,
            branch_slug: b.branch_slug || b.branch_db_name,
            branch_db_name: b.branch_db_name
          }));
          console.log('[COFFIN UI] Fetched branches from API:', branchList.length);
        }
      } catch (e) {
        console.error('[COFFIN UI] Error fetching branches:', e);
      }

      if (branchList.length === 0) {
        // Fallback: create a default main branch
        branchList = [{
          id: 1,
          name: 'Main Branch',
          branch_slug: tenantSlug,
          branch_db_name: tenantSlug
        }];
        console.log('[COFFIN UI] Using fallback branch:', branchList[0]);
      }

      const defaultBranch = branchList.find(b => b.id == userBranchId)?.id || branchList[0]?.id || 1;

      setBranches(branchList);
      setCurrentBranch(defaultBranch);

      // Persist branch info to localStorage so axios interceptor sends correct x-branch-* headers
      const resolvedBranch = branchList.find(b => b.id == defaultBranch);
      if (resolvedBranch) {
        localStorage.setItem('branchId', String(resolvedBranch.id));
        localStorage.setItem('branchSlug', resolvedBranch.branch_slug || '');
        localStorage.setItem('branchDb', resolvedBranch.branch_db_name || '');
      }

      try {
        // Fetch coffins from ALL branch DBs (each row includes its branch_id/branch_name).
        // This mirrors the working "Find in Other Branches" query (/coffins/all-branches) and
        // keeps the current branch's coffins visible in the Inventory tab + Reservation dropdown.
        // The old /coffins/list endpoint is branch-agnostic and can resolve to the wrong DB (or
        // wrong tenant_slug) for a branch user, which is why the dropdown used to say "no coffins".
        const parentSlug = getParentTenantSlug();
        const allBranchRes = await api.get('/coffins/all-branches', {
          params: { parent_slug: parentSlug }
        });
        if (allBranchRes.data?.success && Array.isArray(allBranchRes.data?.data)) {
          setCoffins(allBranchRes.data.data);
        } else {
          // Fallback to the classic list endpoint if the cross-branch call is unavailable.
          const coffinRes = await api.get('/coffins/list');
          if (coffinRes.data?.success && coffinRes.data?.data) {
            setCoffins(coffinRes.data.data);
          }
        }
      } catch (e) {
        console.error('[COFFIN UI] Error fetching coffins:', e);
      }

      try {
        const bookingRes = await api.get('/coffins/bookings');
        if (bookingRes.data?.success && bookingRes.data?.data) {
          setBookings(bookingRes.data.data);
        }
      } catch (e) {
        console.error('Error fetching bookings:', e);
      }

      try {
        const stockRes = await api.get('/coffins/stock-requests');
        if (stockRes.data?.success && stockRes.data?.data) {
          setStockRequests(stockRes.data.data);
        }
      } catch (e) {
        console.error('Error fetching stock requests:', e);
      }
    } catch (error) {
      console.error('[COFFIN UI] Error fetching coffin data:', error);
      setError(error.message);
      toast.error('Failed to load coffin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);



  // ─── Inject Font Awesome CDN (Fix for missing icons) ──────────────────

  // ─── CRUD Handlers ──────────────────────────────────────────────────
  const handleCreateCoffin = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const data = modal.data;
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('exact_price', parseFloat(data.price));
      formData.append('quantity', parseInt(data.stock) || 0);
      if (data.size) formData.append('size', data.size);
      if (data.color) formData.append('color', data.color);
      if (data.notes) formData.append('notes', data.notes);
      if (data.images && data.images.length > 0) {
        Array.from(data.images).forEach(file => formData.append('images', file));
      }

      const res = await api.post('/coffins/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        toast.success('Coffin created successfully');
        setModal({ open: false, type: '', data: {} });
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coffin');
    } finally { setSubmitLoading(false); }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const d = modal.data;
      const selectedBranchId = d.branch_id || currentBranch;
      const isInterBranch = selectedBranchId != currentBranch;

      const res = await api.post('/coffins/bookings', {
        client_name: d.client_name,
        client_phone: d.client_phone,
        deceased_name: d.deceased_name,
        coffin_id: d.coffin_id,
        color: d.color || '',
        size: d.size || '',
        quantity: d.quantity || 1,
        service_date: d.service_date,
        notes: d.notes,
        paid: d.paid || false,
        specifications: d.specifications || [],
        branch_id: selectedBranchId,
      });

      if (res.data?.success) {
        if (isInterBranch) {
          try {
            await api.post('/coffins/stock-requests', {
              from_branch_id: selectedBranchId,
              to_branch_id: currentBranch,
              coffin_id: d.coffin_id,
              quantity: 1,
              client_name: d.client_name,
              client_phone: d.client_phone,
              deceased_name: d.deceased_name,
              service_date: d.service_date,
              notes: d.notes || 'Inter-branch reservation - transfer required',
              req_type: 'client'
            });
            const branchName = branches.find(b => b.id == selectedBranchId)?.name || 'other branch';
            toast.success(`Reservation created! Transfer request sent to ${branchName}`);
          } catch (stockRequestError) {
            console.error('Failed to create stock request:', stockRequestError);
            toast.success('Booking created successfully (transfer request failed)');
          }
        } else {
          toast.success('Booking created successfully');
        }
        setModal({ open: false, type: '', data: {} });
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally { setSubmitLoading(false); }
  };

  const handleCreateStockRequest = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const d = modal.data;
      const res = await api.post('/coffins/stock-requests', {
        from_branch_id: currentBranch,
        to_branch_id: d.to_branch_id,
        coffin_id: d.coffin_id,
        quantity: parseInt(d.quantity) || 1,
        client_name: d.client_name,
        client_phone: d.client_phone,
        deceased_name: d.deceased_name,
        service_date: d.service_date,
        notes: d.notes,
      });
      if (res.data?.success) {
        toast.success('Stock request sent');
        setModal({ open: false, type: '', data: {} });
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    } finally { setSubmitLoading(false); }
  };

  const handleStockAction = async (id, action) => {
    try {
      const res = await api.post(`/coffins/stock-requests/${id}/${action}`);
      if (res.data?.success) {
        toast.success(`Request ${action}ed successfully`);
        setDrawer({ open: false, title: '', content: '' });
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} request`);
    }
  };

  const handleBookingStatus = async (id, status) => {
    try {
      const res = await api.patch(`/coffins/bookings/${id}/status`, { status });
      if (res.data?.success) {
        toast.success(`Booking ${status}`);
        setDrawer({ open: false, title: '', content: '' });
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking');
    }
  };

  const handleDeleteCoffin = async (id) => {
    if (!confirm('Are you sure you want to delete this coffin?')) return;
    try {
      const res = await api.delete(`/coffins/delete/${id}`);
      if (res.data?.success) {
        toast.success('Coffin deleted');
        setDrawer({ open: false, title: '', content: '' });
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coffin');
    }
  };

  // ─── Filtered Data ──────────────────────────────────────────────────
  // Coffins registered without a per-branch id (branch_id undefined) belong to the
  // current branch, so keep them visible. Otherwise match the selected branch.
  const branchCoffins = coffins.filter(c => !currentBranch || !c.branch_id || c.branch_id === currentBranch || c.branch_id == currentBranch);
  const branchBookings = bookings.filter(b => !currentBranch || b.branch_id === currentBranch || b.branch_id == currentBranch);

  const filteredCoffins = branchCoffins.filter(c => {
    if (invQuery) {
      const ql = invQuery.toLowerCase();
      if (!c.name?.toLowerCase().includes(ql) &&
        !(c.custom_id || c.coffin_id)?.toLowerCase().includes(ql) &&
        !c.size?.toLowerCase().includes(ql) &&
        !c.color?.toLowerCase().includes(ql) &&
        !c.material?.toLowerCase().includes(ql)) return false;
    }
    if (invFilter === 'available') return c.stock > 2;
    if (invFilter === 'low') return c.stock > 0 && c.stock <= 2;
    if (invFilter === 'out') return c.stock <= 0;
    return true;

  });

  const filteredBookings = branchBookings.filter(b => {
    if (bkQuery) {
      const ql = bkQuery.toLowerCase();
      if (!b.client_name?.toLowerCase().includes(ql) && !b.deceased_name?.toLowerCase().includes(ql)) return false;
    }
    if (bkFilter === 'unpaid') return !b.paid;
    if (bkFilter !== 'all') return b.status === bkFilter;
    return true;

  });

  const incomingRequests = stockRequests.filter(r => r.to_branch_id == currentBranch);
  const outgoingRequests = stockRequests.filter(r => r.from_branch_id == currentBranch);

  const totalStock = branchCoffins.reduce((s, c) => s + (parseInt(c.stock) || 0), 0);
  const lowStockCount = branchCoffins.filter(c => c.stock > 0 && c.stock <= 2).length;
  const outOfStockCount = branchCoffins.filter(c => c.stock <= 0).length;
  const pendingBookingsCount = branchBookings.filter(b => b.status === 'pending').length;

  // ─── Drawer Views ───────────────────────────────────────────────────
  const openDrawer = (title, content) => setDrawer({ open: true, title, content });
  const closeDrawer = () => setDrawer({ open: false, title: '', content: '' });

  const viewCoffin = (id) => {
    const c = coffins.find(x => (x.coffin_id || x.id) == id);
    if (!c) return;
    const st = getStockStatus(c.stock);
    const reserved = bookings.filter(b => b.coffin_id == id && (b.status === 'pending' || b.status === 'booked')).length;
    const available = Math.max(0, c.stock - reserved);
    const isBorrowed = c.owner_branch_id && c.owner_branch_id != c.branch_id;

    const content = `
      <div style="border-radius:12px; overflow:hidden;">
        <div style="${objToStr(styles.detailImage)}">
          <i class="fa-solid fa-image" style="font-size:56px; color:#cbd5e1"></i>
        </div>
        <div style="${objToStr(styles.detailStatus)}">
          <span style="width:10px; height:10px; border-radius:50%; background:${st.color}; display:inline-block"></span>
          ${st.label}
        </div>
        ${isBorrowed ? `` : ''}
        <div style="${objToStr(styles.detailSection)}">
          <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-boxes-stacked"></i> Inventory</h4>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Total Stock</span><strong style="${objToStr(styles.detailRowStrong)}">${c.stock}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Reserved</span><strong style="${objToStr(styles.detailRowStrong)}">${reserved}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Available</span><strong style="color:${available > 0 ? S.success : S.danger}; font-weight:600">${available}</strong></div>
        </div>
        <div style="${objToStr(styles.detailSection)}">
          <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-info-circle"></i> Information</h4>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Coffin ID</span><strong style="${objToStr(styles.detailRowStrong)}">${c.coffin_id || c.custom_id || 'N/A'}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Custom ID</span><strong style="${objToStr(styles.detailRowStrong)}">${c.custom_id || 'N/A'}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">SKU</span><strong style="${objToStr(styles.detailRowStrong)}">${c.sku || 'N/A'}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Material</span><strong style="${objToStr(styles.detailRowStrong)}">${c.material || 'N/A'}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Size</span><strong style="${objToStr(styles.detailRowStrong)}">${c.size || 'N/A'}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Color</span><strong style="${objToStr(styles.detailRowStrong)}">${c.color || 'N/A'}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Category</span><strong style="${objToStr(styles.detailRowStrong)}">${c.category || 'N/A'}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Type</span><strong style="${objToStr(styles.detailRowStrong)}">${c.type || 'N/A'}</strong></div>
        </div>
        <div style="${objToStr(styles.detailSection)}">
          <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-tag"></i> Pricing</h4>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Selling Price</span><strong style="${objToStr(styles.detailRowStrong)}">${formatKES(c.price)}</strong></div>
        </div>
        <div style="${objToStr(styles.detailSection)}">
          <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-building"></i> Other Branches</h4>
          <div style="${objToStr(styles.otherBranchesList)}">
            ${branches.filter(b => b.id != currentBranch).map(b => {
      const stock = coffins.filter(co => co.branch_id == b.id && co.name === c.name).reduce((sum, co) => sum + (parseInt(co.stock) || 0), 0);
      const color = stock > 2 ? S.success : stock > 0 ? S.warning : S.danger;
      return `<div style="${objToStr(styles.otherBranchItem)}">
                <span style="${objToStr(styles.branchTag)}"><span style="width:8px; height:8px; border-radius:50%; background:${color}; display:inline-block"></span>${b.name}</span>
                <strong>${stock} Available</strong>
              </div>`;
    }).join('')}
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-top:24px;">
          ${c.stock > 0 ? `<button class="drawer-btn btn-s" onclick="window.__openBookingModal(${c.coffin_id || c.id})"><i class="fa-solid fa-calendar-plus"></i> Book Locally</button>` : ''}
          <button class="drawer-btn btn-w" onclick="window.__openFindStock('${c.name?.replace(/'/g, "\\'") || ''}')"><i class="fa-solid fa-network-wired"></i> Find Stock Elsewhere</button>
          <button class="drawer-btn btn-d" onclick="window.__deleteCoffin(${c.coffin_id || c.id})"><i class="fa-solid fa-trash"></i> Delete Coffin</button>
          <button class="drawer-btn btn-g" onclick="window.__closeDrawer()">Close</button>
        </div>
      </div>`;
    openDrawer(c.name || 'Coffin Details', content);
  };

  const viewBooking = (id) => {
    const b = bookings.find(x => x.id === id);
    if (!b) return;

    const c = b.coffin_id ? coffins.find(x => (x.coffin_id || x.id) == b.coffin_id) : null;
    const bs = getBookingStatus(b.status);

    const content = `
      <div style="${objToStr(styles.detailSection)}">
        <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-user"></i> Client Info</h4>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Client Name</span><strong style="${objToStr(styles.detailRowStrong)}">${b.client_name || 'N/A'}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Client Phone</span><strong style="${objToStr(styles.detailRowStrong)}">${b.client_phone || 'N/A'}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Deceased Name</span><strong style="${objToStr(styles.detailRowStrong)}">${b.deceased_name || 'N/A'}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Service Date</span><strong style="${objToStr(styles.detailRowStrong)}">${formatDate(b.service_date)}</strong></div>
      </div>
      <div style="${objToStr(styles.detailSection)}">
        <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-box"></i> Item & Payment</h4>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Coffin Selected</span><strong style="${objToStr(styles.detailRowStrong)}">${c ? c.name : 'N/A'}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Total Price</span><strong style="${objToStr(styles.detailRowStrong)}">${formatKES(b.coffin_price || b.price)}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Payment Status</span><strong><span class="inline-tag ${b.paid ? 'tag-ok' : 'tag-ou'}">${b.paid ? 'Paid' : 'Unpaid'}</span></strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Booking Status</span><strong><span class="inline-tag ${bs.cls}">${bs.label}</span></strong></div>
      </div>
      <div style="${objToStr(styles.detailSection)}">
        <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-sticky-note"></i> Notes</h4>
        <div style="background:${S.bg}; padding:12px; border-radius:8px; font-size:13px; color:#334155; border:1px solid ${S.border};">${b.notes || 'No notes provided'}</div>
      </div>
      <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-top:24px;">
        ${b.status === 'pending' ? `<button class="drawer-btn btn-s" onclick="window.__handleBookingStatus(${b.id},'booked')"><i class="fa-solid fa-check"></i> Approve Reservation</button>` : ''}
        ${b.status === 'pending' ? `<button class="drawer-btn btn-d" onclick="window.__handleBookingStatus(${b.id},'cancelled')"><i class="fa-solid fa-times"></i> Cancel Reservation</button>` : ''}
        ${b.status === 'booked' ? `<button class="drawer-btn btn-s" onclick="window.__handleBookingStatus(${b.id},'completed')"><i class="fa-solid fa-check-double"></i> Mark Completed</button>` : ''}
        ${!b.paid && b.status !== 'cancelled' ? `<button class="drawer-btn btn-w" onclick="window.__markPaid(${b.id})"><i class="fa-solid fa-coins"></i> Mark as Paid</button>` : ''}
        <button class="drawer-btn btn-g" onclick="window.__closeDrawer()">Close</button>
      </div>`;
    openDrawer(`Reservation #${b.id}`, content);
  };

  const viewRequest = (id) => {
    const r = stockRequests.find(x => x.id === id);
    if (!r) return;
    const c = coffins.find(x => (x.coffin_id || x.id) == r.coffin_id);

    const stages = ['pending', 'approved', 'transferring', 'delivered'];
    const currentStageIdx = stages.indexOf(r.status);
    const stageLabels = ['Requested', 'Approved', 'In Transit', 'Delivered'];

    let trackerHtml = `<div style="position:relative; margin:24px 0 32px;">
      <div style="position:absolute; top:16px; left:16px; right:16px; height:3px; background:${S.border}; z-index:0; border-radius:2px;"></div>
      <div style="display:flex; justify-content:space-between;">`;
    stageLabels.forEach((label, idx) => {
      let icon = (idx + 1).toString();
      if (idx < currentStageIdx) { icon = '<i class="fa-solid fa-check" style="font-size:12px"></i>'; }
      const dotBg = idx < currentStageIdx ? S.success : idx === currentStageIdx ? S.primary : '#fff';
      const dotBorder = idx < currentStageIdx ? S.success : idx === currentStageIdx ? S.primary : S.border;
      const dotColor = idx < currentStageIdx || idx === currentStageIdx ? '#fff' : S.textMuted;
      const labelColor = idx <= currentStageIdx ? S.text : S.textMuted;
      trackerHtml += `<div style="display:flex; flex-direction:column; align-items:center; gap:8px; z-index:1; text-align:center; width:25%;">
        <div style="width:32px; height:32px; border-radius:50%; background:${dotBg}; border:3px solid ${dotBorder}; color:${dotColor}; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; transition:all 0.3s; ${idx === currentStageIdx ? 'transform:scale(1.1);' : ''}">${icon}</div>
        <div style="font-size:11px; font-weight:600; color:${labelColor}; text-transform:uppercase; letter-spacing:0.05em;">${label}</div>
      </div>`;
    });
    trackerHtml += `</div></div>`;

    let historyHtml = `<div style="background:${S.bg}; border:1px solid ${S.border}; border-radius:12px; padding:16px; margin-top:16px;">`;
    if (r.history && r.history.length > 0) {
      r.history.forEach((h, idx) => {
        const time = new Date(r.created_at || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        historyHtml += `<div style="display:flex; align-items:flex-start; gap:12px; padding-bottom:16px; position:relative;">
          ${idx < r.history.length - 1 ? `<div style="position:absolute; left:9px; top:24px; bottom:-6px; width:2px; background:${S.border};"></div>` : ''}
          <div style="width:20px; height:20px; border-radius:50%; background:${S.success}; color:#fff; font-size:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; z-index:1;"><i class="fa-solid fa-check"></i></div>
          <div>
            <div style="font-size:13px; color:${S.text}; font-weight:500;">${h}</div>
            <div style="font-size:11px; color:${S.textMuted}; margin-top:2px;">${time}</div>
          </div>
        </div>`;
      });
    }
    historyHtml += `</div>`;

    const content = `
      <div style="${objToStr(styles.detailSection)}">
        <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-exchange-alt"></i> Transfer Info</h4>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Type</span><strong style="${objToStr(styles.detailRowStrong)}">${r.req_type === 'client' ? 'Client Reservation' : 'Stock Replenishment'}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Coffin</span><strong style="${objToStr(styles.detailRowStrong)}">${c ? c.name : 'N/A'}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">From Branch</span><strong style="${objToStr(styles.detailRowStrong)}">${branches.find(b => b.id == r.from_branch_id)?.name || 'N/A'}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">To Branch</span><strong style="${objToStr(styles.detailRowStrong)}">${branches.find(b => b.id == r.to_branch_id)?.name || 'N/A'}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Quantity</span><strong style="${objToStr(styles.detailRowStrong)}">${r.quantity || 1}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Status</span><strong><span class="inline-tag ${getReqStatus(r.status).cls}">${getReqStatus(r.status).label}</span></strong></div>
      </div>
      <div style="${objToStr(styles.detailSection)}">
        <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-sticky-note"></i> Reason</h4>
        <div style="background:${S.bg}; padding:12px; border-radius:8px; font-size:13px; color:#334155; border:1px solid ${S.border};">${r.notes || 'No reason provided'}</div>
      </div>
      <h4 style="font-size:13px; font-weight:700; margin-top:24px; margin-bottom:12px; color:${S.textMuted}; text-transform:uppercase; letter-spacing:0.05em;">Progress Tracker</h4>
      ${trackerHtml}
      ${historyHtml}
      <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-top:24px;">
        ${r.status === 'pending' && r.to_branch_id == currentBranch ? `<button class="drawer-btn btn-s" onclick="window.__handleStockAction(${r.id},'approve')"><i class="fa-solid fa-check"></i> Approve Request</button>` : ''}
        ${r.status === 'approved' && r.to_branch_id == currentBranch ? `<button class="drawer-btn btn-w" onclick="window.__handleStockAction(${r.id},'transferring')"><i class="fa-solid fa-truck"></i> Mark In Transit</button>` : ''}
        ${r.status === 'transferring' && r.to_branch_id == currentBranch ? `<button class="drawer-btn btn-s" onclick="window.__handleStockAction(${r.id},'delivered')"><i class="fa-solid fa-check-double"></i> Confirm Delivered</button>` : ''}
        <button class="drawer-btn btn-g" onclick="window.__closeDrawer()">Close</button>
      </div>`;
    openDrawer(`Transfer Request #${r.id}`, content);
  };

  // ─── Find Stock in Other Branches ───────────────────────────────────
  const [interSearch, setInterSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const openFindStock = async (searchQuery = '') => {
    setInterSearch(searchQuery);
    setSelectedBranch('');

    const parentSlug = getParentTenantSlug();
    const otherBranches = branches.filter(b => b.id != currentBranch);

    console.log('[FindStock] Current branch:', currentBranch, 'Other branches:', otherBranches.length, 'Parent slug:', parentSlug);

    // Show loading state
    openDrawer('Find Stock in Other Branches', `
      <div style="text-align:center; padding:40px 20px;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size:32px; color:${S.primary};"></i>
        <p style="margin-top:16px; color:${S.textMuted}; font-size:14px;">Loading inventory from all branches...</p>
      </div>
    `);

    try {
      // Fetch coffins from ALL branch databases using parent slug
      const res = await api.get('/coffins/all-branches', {
        params: { parent_slug: parentSlug }
      });

      if (res.data?.success && res.data?.data) {
        const allCoffins = res.data.data;
        // Cache it globally for the render function
        window.__interBranchCoffins = allCoffins;
        console.log('[FindStock] Loaded', allCoffins.length, 'coffins from', res.data.branches, 'branches');

        if (allCoffins.length === 0) {
          openDrawer('Find Stock in Other Branches', `
            <div style="text-align:center; padding: 0px;">
              <i class="fa-solid fa-box-open" style="font-size:48px; color:${S.textMuted}; margin-bottom:16px; opacity:0.5;"></i>
              <h3 style="font-size:16px; font-weight:700; color:${S.text}; margin:0 0 8px;">No Coffins Found</h3>
              <p style="font-size:14px; color:${S.textMuted}; margin:0;">No coffins available in other branches.</p>
              <p style="font-size:12px; color:${S.textMuted}; margin:8px 0 0;">Checked ${otherBranches.length} branches</p>
            </div>
          `);
        } else {
          const content = `
            <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">
              <div style="position:relative;">
                <i class="fa-solid fa-magnifying-glass" style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:${S.textMuted};"></i>
                <input id="interSearchInput" placeholder="Search coffin name..."
                  style="width:100%; padding:12px 16px 12px 44px; border-radius:10px; border:1px solid ${S.border}; background:#fff; font-size:14px; font-family:inherit; outline:none; transition:all 0.2s; box-sizing:border-box;"
                  value="${searchQuery}" oninput="window.__renderInterResults(this.value, document.getElementById('branchSelector').value)">
              </div>
              <select id="branchSelector"
                style="width:100%; padding:12px 16px; border-radius:10px; border:1px solid ${S.border}; background:#fff; font-size:14px; font-family:inherit; outline:none; cursor:pointer; appearance:none; background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E'); background-repeat:no-repeat; background-position:right 16px center;"
                onchange="window.__onBranchChange(this.value)">
                <option value="">All Branches (${otherBranches.length})</option>
                ${otherBranches.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
              </select>
            </div>
            <div id="interResults" style="display:flex; flex-direction:column; gap:12px;"></div>
            <div style="margin-top:24px;">
              <button class="drawer-btn btn-g" onclick="window.__closeDrawer()">Close Search</button>
            </div>`;

          openDrawer('Find Stock in Other Branches', content);
          setTimeout(() => window.__renderInterResults(searchQuery, ''), 50);
        }
      } else {
        openDrawer('Find Stock in Other Branches', `
          <div style="text-align:center; padding:40px 20px;">
            <i class="fa-solid fa-circle-exclamation" style="font-size:48px; color:${S.warning}; margin-bottom:16px;"></i>
            <h3 style="font-size:16px; font-weight:700; color:${S.text}; margin:0 0 8px;">Unable to Load</h3>
            <p style="font-size:14px; color:${S.textMuted}; margin:0;">Failed to load branch inventory. Please try again.</p>
          </div>
        `);
      }
    } catch (err) {
      console.error('[FindStock] Error:', err);
      openDrawer('Find Stock in Other Branches', `
        <div style="text-align:center; padding:40px 20px;">
          <i class="fa-solid fa-circle-exclamation" style="font-size:48px; color:${S.danger}; margin-bottom:16px;"></i>
          <h3 style="font-size:16px; font-weight:700; color:${S.text}; margin:0 0 8px;">Error Loading Inventory</h3>
          <p style="font-size:14px; color:${S.textMuted}; margin:0;">${err.response?.data?.message || err.message || 'Please try again later.'}</p>
        </div>
      `);
    }
  };

  const renderInterResults = (query, branchFilter) => {
    const coffinsToSearch = window.__interBranchCoffins || [];

    const results = coffinsToSearch.filter(c => {
      // "Find in Other Branches" must not surface the CURRENT branch's own stock —
      // that stock is already shown in the Inventory tab / Reservation dropdown.
      if (c.branch_id && c.branch_id == currentBranch) return false;
      if (branchFilter && c.branch_id != parseInt(branchFilter)) return false;
      if (query) {
        const ql = query.toLowerCase();
        if (!c.name?.toLowerCase().includes(ql)) return false;
      }
      return true;
    });

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <h4 style="font-size:13px; font-weight:700; color:${S.textMuted}; text-transform:uppercase; letter-spacing:0.05em; margin:0;">${results.length} Items Found</h4>
      </div>
    `;

    if (results.length === 0) {
      html += `
        <div style="text-align:center; padding:10px 20px; background:#fff; border-radius:12px; border:1px dashed ${S.border};">
          <i class="fa-solid fa-box-open" style="font-size:24px; color:${S.textMuted}; margin-bottom:12px; opacity:0.5;"></i>
          <p style="font-size:14px; font-weight:600; color:${S.text}; margin:0 0 4px;">No Coffins Found</p>
          <p style="font-size:13px; color:${S.textMuted}; margin:0;">Try adjusting your search or branch filter.</p>
        </div>
      `;
    } else {
      html += results.map(c => {
        const stock = parseInt(c.stock) || 0;
        const stockColor = stock > 2 ? S.success : stock > 0 ? S.warning : S.danger;
        const stockBg = stock > 2 ? S.successLight : stock > 0 ? S.warningLight : S.dangerLight;
        const stockLabel = stock > 2 ? 'Available' : stock > 0 ? 'Low Stock' : 'Out of Stock';

        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:16px; border:1px solid ${S.border}; border-radius:12px; background:#fff; transition:all 0.2s; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
            <div style="display:flex; gap:16px; align-items:center;">
              <div style="width:48px; height:48px; background:${S.primaryLight}; border-radius:12px; display:flex; align-items:center; justify-content:center; color:${S.primary}; font-weight:800; font-size:18px; flex-shrink:0;">
                ${c.name?.charAt(0) || '?'}
              </div>
              <div>
                <div style="font-weight:700; color:${S.text}; font-size:15px; margin-bottom:4px;">${c.name}</div>
                <div style="font-size:13px; color:${S.textMuted}; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <span style="display:inline-flex; align-items:center; gap:4px;"><i class="fa-solid fa-building" style="font-size:11px;"></i> ${c.branch_name || 'Unknown'}</span>
                  <span style="color:${S.border};">|</span>
                  <span style="font-weight:600; color:${S.text};">${formatKES(c.price)}</span>
                  ${c.color ? `<span style="color:${S.border};">|</span><span><i class="fa-solid fa-palette" style="font-size:11px;"></i> Color: ${c.color}</span>` : ''}
                  ${c.size ? `<span style="color:${S.border};">|</span><span><i class="fa-solid fa-ruler" style="font-size:11px;"></i> Size: ${c.size}</span>` : ''}
                </div>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:10px;">
              <span style="display:inline-flex; align-items:center; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; background:${stockBg}; color:${stockColor};">
                ${stock} ${stockLabel}
              </span>
              ${stock > 0 ?
            `<button class="drawer-btn btn-p btn-sm" style="width:auto; padding:8px 14px;" onclick="window.__reserveInterBranch(${c.coffin_id || c.id})">
                  <i class="fa-solid fa-paper-plane"></i> Request
                </button>`
            :
            `<span style="font-size:12px; color:${S.textMuted}; font-weight:600;">Unavailable</span>`
          }
            </div>
          </div>
        `;
      }).join('');
    }

    const el = document.getElementById('interResults');
    if (el) el.innerHTML = html;
  };

  // ─── Expose to window for drawer HTML buttons ───────────────────────
  useEffect(() => {
    window.__closeDrawer = closeDrawer;
    window.__openBookingModal = (coffinId) => {
      closeDrawer();
      setModal({ open: true, type: 'booking', data: { coffin_id: coffinId, service_date: todayKey() } });
    };
    window.__openFindStock = (query) => {
      closeDrawer();
      setTimeout(() => openFindStock(query), 300);
    };
    window.__deleteCoffin = handleDeleteCoffin;
    window.__handleBookingStatus = handleBookingStatus;
    window.__handleStockAction = handleStockAction;
    window.__markPaid = async (id) => {
      const b = bookings.find(x => x.id === id);
      if (b) {
        try {
          await api.patch(`/coffins/bookings/${id}/status`, { paid: true });
          toast.success('Marked as paid');
          closeDrawer();
          fetchAllData();
        } catch (err) {
          toast.error('Failed to mark as paid');
        }
      }
    };

    window.__renderInterResults = renderInterResults;
    window.__onBranchChange = (branchId) => {
      setSelectedBranch(branchId);
      const searchQuery = document.getElementById('interSearchInput')?.value || '';
      window.__renderInterResults(searchQuery, branchId);
    };

    window.__reserveInterBranch = (cid) => {
      const c = (window.__interBranchCoffins || []).find(x => (x.coffin_id || x.id) == cid);
      if (!c) return;
      const content = `
        <button class="drawer-btn btn-g btn-sm" style="width:auto;  onclick="window.__openFindStock('')">
          <i class="fa-solid fa-arrow-left"></i> Back to Search
        </button>
        
        <div style="background:${S.primaryLight}; border:1px solid #bfdbfe; border-radius:12px; padding:20px; margin-bottom:24px;">
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="width:48px; height:48px; background:${S.primary}; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:18px;">
              ${c.name?.charAt(0) || '?'}
            </div>
            <div>
              <h4 style="font-size:16px; font-weight:700; color:${S.primaryDark}; margin:0 0 4px;">${c.name}</h4>
              <p style="font-size:13px; color:${S.primaryDark}; margin:0; opacity:0.8;">
                From <strong>${c.branch_name || 'other branch'}</strong> • ${formatKES(c.price)}
              </p>
            </div>
          </div>
        </div>

        <div style="${objToStr(styles.detailSection)}">
          <h4 style="${objToStr(styles.detailSectionH4)}">Coffen Details</h4>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13px;">
            <div><strong>Size:</strong> ${c.size || 'N/A'}</div>
            <div><strong>Color:</strong> ${c.color || 'N/A'}</div>
            <div><strong>Type:</strong> ${c.type || 'N/A'}</div>
            <div><strong>Available:</strong> ${c.stock} units</div>
          </div>
        </div>

        <div style="${objToStr(styles.detailSection)}" style="margin-top:16px;">
          <h4 style="${objToStr(styles.detailSectionH4)}">Request Details</h4>
          <div style="${objToStr(styles.fg)}">
            <label style="${objToStr(styles.fl)}">Quantity *</label>
            <input class="drawer-input" id="ir-quantity" type="number" min="1" max="${c.stock}" value="1" placeholder="1">
          </div>
          <div style="${objToStr(styles.fg)}">
            <label style="${objToStr(styles.fl)}">Client Name *</label>
            <input class="drawer-input" id="ir-client" placeholder="John Doe">
          </div>
          <div style="${objToStr(styles.fg)}">
            <label style="${objToStr(styles.fl)}">Client Phone</label>
            <input class="drawer-input" id="ir-phone" placeholder="0712-345-678">
          </div>
          <div style="${objToStr(styles.fg)}">
            <label style="${objToStr(styles.fl)}">Expected By</label>
            <input type="date" class="drawer-input" id="ir-date">
          </div>
          <div style="${objToStr(styles.fg)}">
            <label style="${objToStr(styles.fl)}">Notes / Reason</label>
            <textarea class="drawer-textarea" id="ir-reason" placeholder="Purpose for this request..." style="min-height:80px;"></textarea>
          </div>
        </div>
        
        <button class="drawer-btn btn-p btn-w-full" onclick="window.__submitInterReserve(${c.coffin_id || c.id}, ${c.branch_id})" style="margin-top:8px; padding:14px; font-size:14px;">
          <i class="fa-solid fa-paper-plane"></i> Send Transfer Request
        </button>
      `;
      openDrawer('Request Coffin Transfer', content);
    };

    window.__submitInterReserve = async (cid) => {
      const c = (window.__interBranchCoffins || []).find(x => (x.coffin_id || x.id) == cid);
      if (!c) return;
      const quantity = document.getElementById('ir-quantity')?.value;
      const client = document.getElementById('ir-client')?.value;
      const phone = document.getElementById('ir-phone')?.value;
      const reason = document.getElementById('ir-reason')?.value;
      const expectedDate = document.getElementById('ir-date')?.value;

      if (!client || !quantity) {
        toast.error('Client name and quantity are required');
        return;
      }

      try {
        // Get current user's info from localStorage
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        const currentUserBranchId = user?.branchId || currentBranch;
        const userEmail = user?.email || null;

        // Get branch slugs for both branches
        const fromBranch = branches.find(b => b.id == currentUserBranchId);
        const toBranch = branches.find(b => b.id == c.branch_id);

        const res = await api.post('/coffins/stock-requests', {
          from_branch_id: fromBranch?.id || currentUserBranchId,  // Use branch ID (INT) for FK
          to_branch_id: toBranch?.id || c.branch_id,              // Use branch ID (INT) for FK
          coffin_id: cid,
          quantity: parseInt(quantity) || 1,
          client_name: client,
          client_phone: phone,
          service_date: expectedDate || null,
          notes: reason || 'Inter-branch stock request',
          req_type: 'client',
          requested_by: userEmail,  // Auto-populate from logged-in user
        });
        if (res.data?.success) {
          toast.success(`Transfer request sent to ${c.branch_name || 'branch'}`);
          closeDrawer();
          fetchAllData();
        } else if (res.data?.missing_fields) {
          // Show specific missing fields
          toast.error(`Missing: ${res.data.missing_fields.join(', ')}`);
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to create request';
        const missingFields = err.response?.data?.missing_fields;
        if (missingFields && Array.isArray(missingFields)) {
          toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        } else {
          toast.error(errorMsg);
        }
      }
    };

    return () => {
      delete window.__closeDrawer;
      delete window.__openBookingModal;
      delete window.__openFindStock;
      delete window.__deleteCoffin;
      delete window.__handleBookingStatus;
      delete window.__handleStockAction;
      delete window.__markPaid;
      delete window.__renderInterResults;
      delete window.__reserveInterBranch;
      delete window.__submitInterReserve;
      delete window.__onBranchChange;
    };
  }, [bookings, branches, currentBranch, coffins]);

  // ─── Render Tabs ────────────────────────────────────────────────────
  const pendingReqCount = outgoingRequests.filter(r => r.status === 'pending').length;

  // ─── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.W}>
        <div style={styles.loading}>
          <div style={{ width: 20, height: 20, border: '2px solid #e8ecf1', borderTopColor: S.primary, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
          Loading coffin inventory...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={styles.W}>
        <div style={styles.es}>
          <i className="fa-solid fa-exclamation-triangle" style={{ ...styles.esIcon, color: S.danger, opacity: 1 }}></i>
          <p style={styles.esP}>Error loading coffin inventory</p>
          <p style={{ fontSize: 12, color: S.textMuted, marginTop: 8 }}>{error}</p>
          <button style={{ ...styles.btn, ...styles.btnP, marginTop: 16 }} onClick={fetchAllData}>
            <i className="fa-solid fa-redo"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Render Inventory Tab ───────────────────────────────────────────
  const renderInventory = () => (
    <>
      {/* Modern Stat Cards */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, background: '#1e3a8a' }}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Total Stock</span>
            <div style={styles.statIcon}><i className="fa-solid fa-boxes-stacked"></i></div>
          </div>
          <div style={styles.statValue}>{totalStock}</div>
          <div style={styles.statSubtext}>Units available</div>
        </div>

        <div style={{ ...styles.statCard, background: '#15803d' }}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Available</span>
            <div style={styles.statIcon}><i className="fa-solid fa-circle-check"></i></div>
          </div>
          <div style={styles.statValue}>{totalStock - lowStockCount - outOfStockCount}</div>
          <div style={styles.statSubtext}>Ready to book</div>
        </div>

        <div style={{ ...styles.statCard, background: '#d97706' }}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Low Stock</span>
            <div style={styles.statIcon}><i className="fa-solid fa-triangle-exclamation"></i></div>
          </div>
          <div style={styles.statValue}>{lowStockCount}</div>
          <div style={styles.statSubtext}>Needs restocking</div>
        </div>

        <div style={{ ...styles.statCard, background: '#b91c1c' }}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Out of Stock</span>
            <div style={styles.statIcon}><i className="fa-solid fa-times-circle"></i></div>
          </div>
          <div style={styles.statValue}>{outOfStockCount}</div>
          <div style={styles.statSubtext}>Unavailable items</div>
        </div>
      </div>

      {branchCoffins.length === 0 && coffins.length > 0 && (
        <div style={{ background: S.warningLight, border: '1px solid #fcd34d', color: '#92400e', padding: 16, borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="fa-solid fa-info-circle" style={{ fontSize: 20 }}></i>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>No coffins in {branches.find(b => b.id == currentBranch)?.name || 'this branch'}</p>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>There are {coffins.length} coffins in other branches. Use "Find in Other Branches" to search and request stock.</p>
          </div>
          <button
            style={{ ...styles.btn, ...styles.btnP, ...styles.btnSm, whiteSpace: 'nowrap' }}
            onClick={() => openFindStock()}
          >
            <i className="fa-solid fa-network-wired"></i> Find Stock
          </button>
        </div>
      )}
      <div style={styles.tw}>
        <div style={styles.tt}>
          <div style={styles.sbox}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: S.textMuted }}></i>
            <input
              style={styles.sboxInput}
              placeholder="Search name or SKU..."
              value={invQuery}
              onChange={e => setInvQuery(e.target.value)}
            />
          </div>
          <div style={styles.ff}>
            {[['all', 'All'], ['available', 'Available'], ['low', 'Low'], ['out', 'Out']].map(f => (
              <button
                key={f[0]}
                style={{ ...styles.fn, ...(invFilter === f[0] ? styles.fnActive : {}) }}
                onClick={() => setInvFilter(f[0])}
              >
                {f[1]}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Coffin</th>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Details</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoffins.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div style={styles.es}>
                      <i className="fa-solid fa-box-open" style={styles.esIcon}></i>
                      <p style={styles.esP}>No coffins found locally.</p>
                      {invQuery && (
                        <button
                          style={{ ...styles.btn, ...styles.btnP, marginTop: 16 }}
                          onClick={() => openFindStock(invQuery)}
                        >
                          <i className="fa-solid fa-network-wired"></i> Find "{invQuery}" in other branches
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCoffins.map(coffin => {
                  const st = getStockStatus(coffin.stock);
                  const id = coffin.coffin_id || coffin.id;
                  return (
                    <tr key={id}>
                      <td style={styles.td}>
                        <div style={styles.ci}>
                          <div style={styles.thumb}>{coffin.name?.charAt(0) || '?'}</div>
                          <div>
                            <div style={styles.cname}>{coffin.name}</div>
                            <div style={styles.sku}>{coffin.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...styles.td, fontSize: 12, fontWeight: 600, color: S.textMuted, fontFamily: 'monospace' }}>{coffin.custom_id || coffin.coffin_id || '—'}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12 }}>
                          {coffin.size && <span style={{ color: S.text, fontWeight: 600 }}>Size: {coffin.size}</span>}
                          {coffin.color && <span style={{ color: S.text, fontWeight: 600 }}>Color: {coffin.color}</span>}
                          {coffin.material && <span style={{ color: S.textMuted }}>Material: {coffin.material}</span>}
                          {coffin.category && <span style={{ color: S.textMuted }}>Category: {coffin.category}</span>}
                          {!coffin.size && !coffin.color && !coffin.material && !coffin.category && (
                            <span style={{ color: S.textLight, fontStyle: 'italic' }}>No additional details</span>
                          )}
                        </div>
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{formatKES(coffin.price)}</td>
                      <td style={{ ...styles.td, fontWeight: 700, color: coffin.stock <= 0 ? S.danger : coffin.stock <= 2 ? S.warning : S.success }}>
                        {coffin.stock}
                      </td>
                      <td style={styles.td}><Tag cls={st.cls}>{st.label}</Tag></td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {coffin.stock > 0 && (
                            <button
                              style={{ ...styles.btn, ...styles.btnS, ...styles.btnSm }}
                              onClick={() => setModal({ open: true, type: 'booking', data: { coffin_id: id, service_date: todayKey() } })}
                            >
                              Book
                            </button>
                          )}
                          {coffin.stock <= 0 && (
                            <button
                              style={{ ...styles.btn, ...styles.btnW, ...styles.btnSm }}
                              onClick={() => openFindStock(coffin.name)}
                            >
                              Find Stock
                            </button>
                          )}
                          {coffin.stock > 0 && (
                            <button
                              style={{ ...styles.btn, ...styles.btnW, ...styles.btnSm, padding: '6px 10px' }}
                              onClick={() => openFindStock(coffin.name)}
                              title="Search stock in other branches"
                            >
                              <i className="fa-solid fa-network-wired" style={{ fontSize: 12 }}></i>
                            </button>
                          )}
                          <button
                            style={styles.ib}
                            onClick={() => viewCoffin(id)}
                            title="View Details"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // ─── Render Bookings Tab ────────────────────────────────────────────
  const renderBookings = () => {
    const toDateKey = (raw) => {
      if (!raw) return '';
      const s = String(raw);
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
      const d = new Date(s);
      if (isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const handleDateSelect = (date) => {
      setSelectedDate(date);
      setDetailDate(date);
    };

    const closeDetail = () => setDetailDate(null);

    const handleWeekBookingClick = (b) => {
      viewBooking(b.id);
    };

    return (
      <>
        <div style={styles.tw}>
          <div style={styles.tt}>
            <div style={styles.sbox}>
              <i className="fa-solid fa-magnifying-glass" style={{ color: S.textMuted }}></i>
              <input
                style={styles.sboxInput}
                placeholder="Search client..."
                value={bkQuery}
                onChange={e => setBkQuery(e.target.value)}
              />
            </div>
            <div style={styles.ff}>
              {[
                ['all', 'All', '#0f172a'],
                ['pending', 'Pending', '#d97706'],
                ['booked', 'Approved', '#0284c7'],
                ['completed', 'Completed', '#059669'],
                ['unpaid', 'Unpaid', '#dc2626'],
              ].map(f => {
                const active = bkFilter === f[0];
                return (
                  <button
                    key={f[0]}
                    style={{
                      ...styles.fn,
                      background: active ? f[2] : '#fff',
                      color: active ? '#fff' : S.textMuted,
                      border: `1px solid ${active ? f[2] : S.border}`,
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                      fontWeight: 700,
                    }}
                    onClick={() => setBkFilter(f[0])}
                  >
                    {f[1]}
                  </button>
                );
              })}
            </div>
          </div>
          {bkView === 'calendar' ? (
            <div>
              <HorizontalCalendar
                eventsData={filteredBookings}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                dateKey="service_date"
              />

              {calendarMode === 'week' ? (
                <WeeklyView
                  currentDate={selectedDate}
                  bookings={filteredBookings}
                  getEvents={(ds) => filteredBookings.filter(b => toDateKey(b.service_date) === ds).map(b => ({
                    id: b.id,
                    client: b.client_name || '—',
                    dest: b.deceased_name || '—',
                    from: getCoffinName(b.coffin_id, coffins) || '—',
                    start: 6,
                    end: 22,
                    allDay: true,
                    status: b.status || 'booked',
                    branch: 'nairobi',
                    branchName: branches.find(br => br.id == b.branch_id)?.name || 'Main Branch'
                  }))}
                  openBookingDetails={(b) => viewBooking(b.id)}
                />
              ) : (
                <DailyView
                  selectedDate={selectedDate}
                  onDateChange={(d) => handleDateSelect(d)}
                  bookings={{
                    [toDateKey(selectedDate)]: filteredBookings
                      .filter(b => toDateKey(b.service_date) === toDateKey(selectedDate))
                      .map(b => ({
                        id: b.id,
                        client: b.client_name || '—',
                        dest: b.deceased_name || '—',
                        from: getCoffinName(b.coffin_id, coffins) || '—',
                        start: 6,
                        end: 22,
                        allDay: true,
                        status: b.status || 'booked',
                        branch: 'nairobi',
                        branchName: branches.find(br => br.id == b.branch_id)?.name || 'Main Branch'
                      }))
                  }}
                  onBookingClick={(b) => viewBooking(b.id)}
                />
              )}

              {detailDate && (
                <div className="coffin-detail-panel">
                  <div className="coffin-detail-title">
                    <span>
                      <i className="fa-solid fa-calendar-day" style={{ marginRight: 8, color: S.primary }}></i>
                      {formatDate(toDateKey(detailDate))} — Bookings
                    </span>
                    <button
                      onClick={closeDetail}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: S.textMuted,
                        cursor: 'pointer',
                        fontSize: '16px',
                      }}
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                  <div className="coffin-detail-grid">
                    {filteredBookings
                      .filter(b => toDateKey(b.service_date) === toDateKey(detailDate))
                      .map(b => {
                        const bs = getBookingStatus(b.status);
                        const coffin = coffins.find(c => (c.coffin_id || c.id) == b.coffin_id);
                        return (
                          <div
                            key={b.id}
                            className="coffin-detail-card"
                            onClick={() => viewBooking(b.id)}
                          >
                            <div className="coffin-detail-card-head">
                              <span className="coffin-detail-card-client">{b.client_name}</span>
                              <span className="coffin-bcard-status" style={{ background: getStatusColor(b.status) }}>{bs.label}</span>
                            </div>
                            <div className="coffin-detail-card-meta">
                              <div><strong>Deceased:</strong> {b.deceased_name || 'N/A'}</div>
                              <div><strong>Coffin:</strong> {coffin?.name || 'N/A'}</div>
                              <div><strong>Price:</strong> {formatKES(b.coffin_price || b.price)}</div>
                              <div><strong>Payment:</strong> <span className={b.paid ? 'coffin-bcard-pay paid' : 'coffin-bcard-pay unpaid'}>{b.paid ? 'Paid' : 'Unpaid'}</span></div>
                              {b.notes && <div><strong>Notes:</strong> {b.notes}</div>}
                            </div>
                          </div>
                        );
                      })}
                    {filteredBookings.filter(b => toDateKey(b.service_date) === toDateKey(detailDate)).length === 0 && (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: S.textMuted, padding: 20 }}>
                        <i className="fa-solid fa-calendar-check" style={{ fontSize: 24, opacity: 0.3, marginBottom: 8 }}></i>
                        <p>No bookings on this day</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Client</th>
                    <th style={styles.th}>Deceased</th>
                    <th style={styles.th}>Coffin</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Payment</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div style={styles.es}>
                          <i className="fa-solid fa-calendar-xmark" style={styles.esIcon}></i>
                          <p style={styles.esP}>No reservations found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map(b => {
                      const bs = getBookingStatus(b.status);
                      const coffin = coffins.find(c => (c.coffin_id || c.id) == b.coffin_id);
                      return (
                        <tr key={b.id}>
                          <td style={{ ...styles.td, fontWeight: 600 }}>#{b.id}</td>
                          <td style={{ ...styles.td, fontWeight: 600 }}>{b.client_name}</td>
                          <td style={styles.td}>{b.deceased_name}</td>
                          <td style={styles.td}>{coffin?.name || 'N/A'}</td>
                          <td style={styles.td}>{formatDate(b.service_date)}</td>
                          <td style={styles.td}>
                            <Tag cls={b.paid ? 'tag-ok' : 'tag-ou'}>{b.paid ? 'Paid' : 'Unpaid'}</Tag>
                          </td>
                          <td style={styles.td}><Tag cls={bs.cls}>{bs.label}</Tag></td>
                          <td style={styles.td}>
                            <button style={styles.ib} onClick={() => viewBooking(b.id)} title="View Details">
                              <i className="fa-solid fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  // ─── Render Transfers Tab ───────────────────────────────────────────
  const renderTransfers = () => {
    const pendingCount = stockRequests.filter(r => r.status === 'pending').length;
    const totalIncoming = incomingRequests.length;
    const totalOutgoing = outgoingRequests.length;

    const filteredIncoming = incomingRequests.filter(r => {
      if (!transferQuery) return true;
      const q = transferQuery.toLowerCase();
      const coffin = coffins.find(c => (c.coffin_id || c.id) == r.coffin_id);
      const branch = branches.find(b => b.id == r.from_branch_id);
      return String(r.id).includes(q) || coffin?.name?.toLowerCase().includes(q) || branch?.name?.toLowerCase().includes(q);
    });
    const filteredOutgoing = outgoingRequests.filter(r => {
      if (!transferQuery) return true;
      const q = transferQuery.toLowerCase();
      const coffin = coffins.find(c => (c.coffin_id || c.id) == r.coffin_id);
      const branch = branches.find(b => b.id == r.to_branch_id);
      return String(r.id).includes(q) || coffin?.name?.toLowerCase().includes(q) || branch?.name?.toLowerCase().includes(q);
    });

    const toggleExpand = (id) => setExpandedTransferId(expandedTransferId === id ? null : id);

    const getStatusBadge = (status) => {
      const cfg = getReqStatus(status);
      const map = {
        'tag-pe': { bg: S.warningLight, color: S.warning },
        'tag-ar': { bg: '#e0e7ff', color: S.primaryDark },
        'tag-tr': { bg: S.infoLight, color: S.info },
        'tag-de': { bg: S.successLight, color: S.success },
      };
      const c = map[cfg.cls] || { bg: S.warningLight, color: S.warning };
      return <span style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', background: c.bg, color: c.color }}>{cfg.label}</span>;
    };

    const timelineSteps = (status) => {
      const steps = [
        { key: 'pending', label: 'Request Initiated', icon: 'fa-solid fa-circle-check', done: true },
        { key: 'approved', label: 'Approved', icon: 'fa-solid fa-check', done: status === 'approved' || status === 'transferring' || status === 'delivered' },
        { key: 'transferring', label: 'In Transit', icon: 'fa-solid fa-truck', done: status === 'transferring' || status === 'delivered' },
        { key: 'delivered', label: 'Delivered', icon: 'fa-solid fa-flag-checkered', done: status === 'delivered' },
      ];
      return steps;
    };

    const Timeline = ({ status }) => {
      const steps = timelineSteps(status);
      const completedCount = steps.filter(s => s.done).length;
      const progressPct = ((completedCount - 1) / (steps.length - 1)) * 100;
      return (
        <div style={{ position: 'relative', padding: '0 4px', marginTop: 8 }}>
          <div style={{ position: 'absolute', top: 14, left: 28, right: 28, height: 2, background: S.border, zIndex: 0 }}></div>
          <div style={{ position: 'absolute', top: 14, left: 28, height: 2, background: S.success, zIndex: 1, width: `calc(${progressPct}% - 20px)` }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
            {steps.map((s, i) => (
              <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '25%', textAlign: 'center' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', background: '#fff',
                  border: `3px solid ${s.done ? S.success : S.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: s.done ? '#fff' : S.textLight, transition: 'all 0.3s',
                }}><i className={s.icon}></i></div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.done ? S.text : S.textLight }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const TransferRow = ({ r, type }) => {
      const coffin = coffins.find(c => (c.coffin_id || c.id) == r.coffin_id);
      const fromBranch = branches.find(b => b.id == r.from_branch_id);
      const toBranch = branches.find(b => b.id == r.to_branch_id);
      const isExpanded = expandedTransferId === r.id;
      const origin = type === 'incoming' ? fromBranch : toBranch;
      const dest = type === 'incoming' ? toBranch : fromBranch;

      const actionButtons = [];
      if (type === 'incoming') {
        if (r.status === 'pending') {
          actionButtons.push(<button key="a" style={{ ...styles.ib, color: S.success, borderColor: 'transparent', background: S.successLight }} onClick={(e) => { e.stopPropagation(); handleStockAction(r.id, 'approve'); }} title="Approve"><i className="fa-solid fa-check"></i></button>);
        }
        if (r.status === 'approved') {
          actionButtons.push(<button key="b" style={{ ...styles.ib, color: S.warning, borderColor: 'transparent', background: S.warningLight }} onClick={(e) => { e.stopPropagation(); handleStockAction(r.id, 'transferring'); }} title="Send"><i className="fa-solid fa-truck"></i></button>);
        }
        if (r.status === 'transferring') {
          actionButtons.push(<button key="c" style={{ ...styles.ib, color: S.success, borderColor: 'transparent', background: S.successLight }} onClick={(e) => { e.stopPropagation(); handleStockAction(r.id, 'delivered'); }} title="Receive"><i className="fa-solid fa-circle-check"></i></button>);
        }
      }

      return (
        <>
          <div style={{ borderBottom: isExpanded ? 'none' : `1px solid ${S.borderLight}`, background: isExpanded ? '#fbfcfd' : '#fff', cursor: 'pointer', transition: 'background 0.15s' }} onClick={() => toggleExpand(r.id)}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1.5fr 40px', gap: 24, padding: '18px 24px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: S.bg, border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.text, fontSize: 16, flexShrink: 0 }}>
                  <i className="fa-solid fa-box"></i>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: S.textLight, textTransform: 'uppercase', marginBottom: 2 }}>#{r.id} · {type === 'incoming' ? 'INC' : 'OUT'}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: S.text }}>{coffin?.name || 'Unknown Coffin'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0f172a', display: 'inline-block' }}></span>
                    {origin?.name || 'N/A'}
                  </div>
                  <div style={{ fontSize: 11, color: S.textMuted, fontWeight: 500 }}>Origin</div>
                </div>
                <div style={{ flex: 1, height: 2, borderTop: '2px dotted', borderColor: S.border, position: 'relative' }}>
                  <i className="fa-solid fa-truck" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fbfcfd', padding: '0 4px', color: S.textLight, fontSize: 10 }}></i>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.text, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    {dest?.name || 'N/A'}
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: S.success, boxShadow: `0 0 0 3px ${S.successLight}`, display: 'inline-block' }}></span>
                  </div>
                  <div style={{ fontSize: 11, color: S.textMuted, fontWeight: 500 }}>Destination</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: S.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="fa-regular fa-clock" style={{ fontSize: 11 }}></i> {r.transfer_date ? formatDate(r.transfer_date) : '—'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{getStatusBadge(r.status)}</div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', color: S.textLight, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <i className="fas fa-chevron-down"></i>
              </div>
            </div>
          </div>

          {isExpanded && (
            <div style={{ background: S.bg, borderBottom: `1px solid ${S.border}`, padding: '28px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 40 }}>
                <div>
                  <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: S.textMuted, marginBottom: 16 }}>Shipment Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: S.textLight, marginBottom: 4 }}>Quantity</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{r.quantity || 1} Unit{r.quantity > 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: S.textLight, marginBottom: 4 }}>Coffin</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{coffin?.name || 'N/A'}</div>
                    </div>
                    <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: S.textLight, marginBottom: 4 }}>From</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{fromBranch?.name || 'N/A'}</div>
                    </div>
                    <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: S.textLight, marginBottom: 4 }}>To</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{toBranch?.name || 'N/A'}</div>
                    </div>
                    {r.notes && (
                      <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 8, border: `1px solid ${S.borderLight}`, gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: S.textLight, marginBottom: 4 }}>Notes</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: S.textMuted }}>{r.notes}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: S.textMuted, marginBottom: 8 }}>Processing Timeline</h3>
                  <Timeline status={r.status} />

                  {type === 'incoming' && actionButtons.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 28, paddingTop: 20, borderTop: `1px solid ${S.border}` }}>
                      {r.status === 'pending' && (
                        <button style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: S.dangerLight, color: S.danger, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => { e.stopPropagation(); handleStockAction(r.id, 'rejected'); }}>
                          <i className="fa-solid fa-times"></i> Reject
                        </button>
                      )}
                      {r.status === 'pending' && (
                        <button style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: S.success, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => { e.stopPropagation(); handleStockAction(r.id, 'approve'); }}>
                          <i className="fa-solid fa-check"></i> Approve & Dispatch
                        </button>
                      )}
                      {r.status === 'approved' && (
                        <button style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: S.infoLight, color: S.info, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => { e.stopPropagation(); handleStockAction(r.id, 'transferring'); }}>
                          <i className="fa-solid fa-truck"></i> Mark In Transit
                        </button>
                      )}
                      {r.status === 'transferring' && (
                        <button style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: S.success, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => { e.stopPropagation(); handleStockAction(r.id, 'delivered'); }}>
                          <i className="fa-solid fa-circle-check"></i> Confirm Delivered
                        </button>
                      )}
                    </div>
                  )}
                  {type === 'outgoing' && (
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 28, paddingTop: 20, borderTop: `1px solid ${S.border}` }}>
                      <button style={{ padding: '10px 18px', borderRadius: 8, border: `1px solid ${S.border}`, background: '#fff', color: S.danger, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => { e.stopPropagation(); handleStockAction(r.id, 'rejected'); }}>
                        <i className="fa-solid fa-times"></i> Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      );
    };

    return (
      <>
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: S.bg, padding: 4, borderRadius: 12, border: `1px solid ${S.borderLight}` }}>
            <button style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: transferTab === 'incoming' ? '#fff' : 'transparent', color: transferTab === 'incoming' ? S.text : S.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: transferTab === 'incoming' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }} onClick={() => setTransferTab('incoming')}>
              <i className="fa-solid fa-arrow-down" style={{ color: transferTab === 'incoming' ? S.info : 'inherit', fontSize: 13 }}></i> Incoming
              <span style={{ background: transferTab === 'incoming' ? '#0f172a' : S.border, color: transferTab === 'incoming' ? '#fff' : S.textMuted, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{totalIncoming}</span>
            </button>
            <button style={{ padding: '9px 18px', border: 'none', borderRadius: 8, background: transferTab === 'outgoing' ? '#fff' : 'transparent', color: transferTab === 'outgoing' ? S.text : S.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: transferTab === 'outgoing' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }} onClick={() => setTransferTab('outgoing')}>
              <i className="fa-solid fa-arrow-up-right" style={{ color: transferTab === 'outgoing' ? S.purple : 'inherit', fontSize: 13 }}></i> Outgoing
              <span style={{ background: transferTab === 'outgoing' ? '#0f172a' : S.border, color: transferTab === 'outgoing' ? '#fff' : S.textMuted, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{totalOutgoing}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 260 }}>
              <i className="fa-solid fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: S.textLight, fontSize: 12 }}></i>
              <input type="text" placeholder="Search ID, coffin, or branch..." value={transferQuery} onChange={e => setTransferQuery(e.target.value)} style={{ width: '100%', padding: '9px 14px 9px 36px', border: `1px solid ${S.border}`, borderRadius: 10, background: '#fff', fontSize: 13, fontWeight: 500, outline: 'none', fontFamily: 'inherit', transition: S.transition }} />
            </div>
          </div>
        </div>

        {/* Transfer List */}
        <div style={{ borderTop: `1px solid ${S.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 1.5fr 40px', gap: 24, padding: '12px 24px', background: S.bg, borderBottom: `1px solid ${S.borderLight}`, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: S.textMuted }}>
            <div>Asset Details</div>
            <div>Route</div>
            <div>Timeline</div>
            <div style={{ textAlign: 'right' }}>Status</div>
            <div></div>
          </div>

          {transferTab === 'incoming' && filteredIncoming.length === 0 && (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: S.textMuted }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 22, color: S.textLight }}><i className="fa-solid fa-inbox"></i></div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: S.text }}>No incoming requests</p>
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>Requests from other branches will appear here</p>
            </div>
          )}
          {transferTab === 'incoming' && filteredIncoming.map(r => <TransferRow key={r.id} r={r} type="incoming" />)}

          {transferTab === 'outgoing' && filteredOutgoing.length === 0 && (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: S.textMuted }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: S.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 22, color: S.textLight }}><i className="fa-solid fa-paper-plane"></i></div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: S.text }}>No outgoing requests</p>
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>Requests sent to other branches will appear here</p>
            </div>
          )}
          {transferTab === 'outgoing' && filteredOutgoing.map(r => <TransferRow key={r.id} r={r} type="outgoing" />)}
        </div>
      </>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────
  return (
    <div style={styles.W}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .drawer-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px 16px; border-radius: 8px; border: none; font-size: 13px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          transition: ${S.transition}; white-space: nowrap; width: 100%;
        }
        .drawer-btn.btn-p { background: ${S.primary}; color: #fff; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
        .drawer-btn.btn-p:hover { background: ${S.primaryDark}; transform: translateY(-1px); }
        .drawer-btn.btn-d { background: ${S.danger}; color: #fff; }
        .drawer-btn.btn-d:hover { background: #b91c1c; }
        .drawer-btn.btn-g { background: #f1f5f9; color: #475569; }
        .drawer-btn.btn-g:hover { background: #e2e8f0; }
        .drawer-btn.btn-s { background: ${S.success}; color: #fff; }
        .drawer-btn.btn-s:hover { background: #047857; }
        .drawer-btn.btn-w { background: ${S.warning}; color: #fff; }
        .drawer-btn.btn-w:hover { background: #b45309; }
        .drawer-btn.btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 6px; width: auto; }
        .drawer-btn.btn-w-full { width: 100%; padding: 12px; }
        
        .drawer-input {
          width: 100%; padding: 12px 16px; border-radius: 10px;
          border: 1px solid ${S.border}; background: #fff; font-size: 14px;
          font-family: inherit; outline: none; transition: ${S.transition};
          box-sizing: border-box;
        }
        .drawer-input:focus { border-color: ${S.primary}; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        
        .drawer-textarea {
          width: 100%; padding: 12px 16px; border-radius: 10px;
          border: 1px solid ${S.border}; background: #fff; font-size: 14px;
          font-family: inherit; outline: none; transition: ${S.transition};
          resize: vertical; box-sizing: border-box;
        }
        .drawer-textarea:focus { border-color: ${S.primary}; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        
        .inline-tag {
          display: inline-flex; align-items: center; padding: 4px 10px;
          border-radius: 16px; font-size: 11px; font-weight: 600;
        }
        .inline-tag.tag-ok { background: ${S.successLight}; color: ${S.success}; }
        .inline-tag.tag-lo { background: ${S.warningLight}; color: ${S.warning}; }
        .inline-tag.tag-ou { background: ${S.dangerLight}; color: ${S.danger}; }
        .inline-tag.tag-pe { background: ${S.warningLight}; color: ${S.warning}; }
        .inline-tag.tag-bo { background: #e0f2fe; color: ${S.info}; }
        .inline-tag.tag-co { background: ${S.successLight}; color: ${S.success}; }
        .inline-tag.tag-ca { background: ${S.dangerLight}; color: ${S.danger}; }
        .inline-tag.tag-ar { background: #e0e7ff; color: ${S.primaryDark}; }
        .inline-tag.tag-tr { background: ${S.warningLight}; color: ${S.warning}; }
        .inline-tag.tag-de { background: ${S.successLight}; color: ${S.success}; }
        tr:hover td { background: #f8fafc; }
      `}</style>

      <ToastContainer position="top-center" autoClose={3000} />

      {/* ─── Unified Top Navigation Bar ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap', background: '#fff', border: `1px solid ${S.border}`, borderRadius: 14, padding: '10px 16px', boxShadow: S.shadowSm }}>

        {/* Left: Branch + Main Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {branches.length > 1 && (
            <select
              value={currentBranch || ''}
              onChange={e => {
                const newBranch = parseInt(e.target.value);
                setCurrentBranch(newBranch);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${S.border}`,
                background: S.bg,
                fontSize: 13,
                fontFamily: 'inherit',
                fontWeight: 600,
                color: S.text,
                cursor: 'pointer',
                minWidth: 150,
              }}
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 10, background: S.bg, border: `1px solid ${S.borderLight}` }}>
            {[
              { key: 'inventory', icon: 'fa-boxes-stacked', label: 'Inventory' },
              { key: 'bookings', icon: 'fa-calendar-check', label: 'Reservations' },
              { key: 'transfers', icon: 'fa-right-left', label: 'Transfers', badge: pendingReqCount },
            ].map(t => (
              <button
                key={t.key}
                style={{ ...styles.tab, margin: 0, ...(tab === t.key ? styles.tabActive : {}) }}
                onClick={() => setTab(t.key)}
              >
                <i className={`fa-solid ${t.icon}`}></i>
                {t.label}
                {t.badge > 0 && (
                  <span style={{ ...styles.badge, ...(tab === t.key ? styles.badgeActive : {}) }}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Contextual controls per active tab */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {tab === 'inventory' && (
            <>
              <span style={{ fontSize: 13, fontWeight: 700, color: S.text, whiteSpace: 'nowrap' }}>
                Inventory <span style={{ color: S.textMuted, fontWeight: 400 }}>({branchCoffins.length} items)</span>
              </span>
              <button
                style={{ ...styles.btn, ...styles.btnP, whiteSpace: 'nowrap' }}
                onClick={() => setModal({ open: true, type: 'coffin', data: { stock: 0, price: 0 } })}
              >
                <i className="fa-solid fa-plus"></i> Add Coffin
              </button>
              <button
                style={{ ...styles.btn, ...styles.btnW, whiteSpace: 'nowrap' }}
                onClick={() => openFindStock()}
                title="Search and request stock from other branches"
              >
                <i className="fa-solid fa-network-wired"></i> Find Stock in Other Branches
              </button>
            </>
          )}

          {tab === 'bookings' && (
            <>
              <span style={{ fontSize: 13, fontWeight: 700, color: S.text, whiteSpace: 'nowrap' }}>
                Reservations <span style={{ color: S.textMuted, fontWeight: 400 }}>({filteredBookings.length})</span>
              </span>
              <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 10, background: S.bg, border: `1px solid ${S.borderLight}` }}>
                <button
                  style={{ ...styles.fn, ...(bkView === 'calendar' ? styles.fnActive : {}) }}
                  onClick={() => setBkView('calendar')}
                >
                  <i className="fa-solid fa-calendar-days" style={{ marginRight: 6 }}></i>Calendar
                </button>
                <button
                  style={{ ...styles.fn, ...(bkView === 'list' ? styles.fnActive : {}) }}
                  onClick={() => setBkView('list')}
                >
                  <i className="fa-solid fa-list" style={{ marginRight: 6 }}></i>List
                </button>
              </div>
              <button
                style={{ ...styles.btn, ...styles.btnP, whiteSpace: 'nowrap' }}
                onClick={() => setModal({ open: true, type: 'booking', data: { service_date: todayKey() } })}
              >
                <i className="fa-solid fa-plus"></i> New Reservation
              </button>
            </>
          )}

          {tab === 'transfers' && (
            <>
              <span style={{ fontSize: 13, fontWeight: 700, color: S.text, whiteSpace: 'nowrap' }}>
                Logistics & Transfers <span style={{ color: S.textMuted, fontWeight: 500 }}>{stockRequests.filter(r => r.status === 'pending').length} pending · {incomingRequests.length} incoming · {outgoingRequests.length} outgoing</span>
              </span>
              <button
                style={{ padding: '8px 14px', border: `1px solid ${S.border}`, borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, color: S.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: S.transition, whiteSpace: 'nowrap' }}
                onClick={fetchAllData}
              >
                <i className="fa-solid fa-arrows-rotate" style={{ fontSize: 12 }}></i> Refresh
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'inventory' && renderInventory()}
      {tab === 'bookings' && renderBookings()}
      {tab === 'transfers' && renderTransfers()}

      {/* ──────────── MODALS ──────────── */}

      {/* Add Coffin Modal */}
      <div
        style={{ ...styles.moOverlay, ...(modal.open && modal.type === 'coffin' ? styles.moOpen : {}) }}
        onClick={() => setModal({ open: false, type: '', data: {} })}
      >
        <div style={styles.md} onClick={e => e.stopPropagation()}>
          <div style={styles.mh}>
            <h2 style={styles.mh2}>Add New Coffin</h2>
            <button style={styles.mx} onClick={() => setModal({ open: false, type: '', data: {} })}>&times;</button>
          </div>
          <form onSubmit={handleCreateCoffin}>
            <div style={styles.mb}>
              <div style={styles.fr}>
                <div style={styles.fg}>
                  <label style={styles.fl}>Name *</label>
                  <input
                    style={styles.fi}
                    required
                    value={modal.data.name || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
                    placeholder="Mahogany Heritage"
                  />
                </div>
                <div style={styles.fg}></div>
              </div>
              <div style={styles.fr}>
                <div style={styles.fg}>
                  <label style={styles.fl}>Size (ft)</label>
                  <input
                    style={styles.fi}
                    value={modal.data.size || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, size: e.target.value } })}
                    placeholder="e.g. 6ft, 7ft"
                  />
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Color</label>
                  <input
                    style={styles.fi}
                    value={modal.data.color || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, color: e.target.value } })}
                    placeholder="e.g. Black, Brown"
                  />
                </div>
              </div>
              <div style={styles.fr}>
                <div style={styles.fg}>
                  <label style={styles.fl}>Price (KES) *</label>
                  <input
                    style={styles.fi}
                    required
                    type="number"
                    value={modal.data.price || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, price: e.target.value } })}
                  />
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Stock</label>
                  <input
                    style={styles.fi}
                    type="number"
                    value={modal.data.stock || 0}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, stock: parseInt(e.target.value) || 0 } })}
                  />
                </div>
              </div>
              <div style={styles.fg}>
                <label style={styles.fl}>Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => {
                    const files = Array.from(e.target.files);
                    setModal({ ...modal, data: { ...modal.data, images: files } });
                  }}
                  style={{ width: '100%', padding: '8px 0' }}
                />
                <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>You can select multiple images (max 10)</div>
              </div>
              <div style={styles.fg}>
                <label style={styles.fl}>Notes</label>
                <textarea
                  style={{ ...styles.fi, minHeight: 80, resize: 'vertical' }}
                  value={modal.data.notes || ''}
                  onChange={e => setModal({ ...modal, data: { ...modal.data, notes: e.target.value } })}
                  placeholder="Any notes..."
                />
              </div>
            </div>
            <div style={styles.mf}>
              <button type="button" style={{ ...styles.btn, ...styles.btnG }} onClick={() => setModal({ open: false, type: '', data: {} })}>Cancel</button>
              <button type="submit" style={{ ...styles.btn, ...styles.btnP }} disabled={submitLoading}>
                {submitLoading ? 'Saving...' : 'Save Coffin'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Booking Modal */}
      <div
        style={{ ...styles.moOverlay, ...(modal.open && modal.type === 'booking' ? styles.moOpen : {}) }}
        onClick={() => setModal({ open: false, type: '', data: {} })}
      >
        <div style={styles.md} onClick={e => e.stopPropagation()}>
          <div style={styles.mh}>
            <h2 style={styles.mh2}>New Reservation</h2>
            <button style={styles.mx} onClick={() => setModal({ open: false, type: '', data: {} })}>&times;</button>
          </div>
          <form onSubmit={handleCreateBooking}>
            <div style={styles.mb}>
              <div style={styles.fr}>
                <div style={styles.fg}>
                  <label style={styles.fl}>Client Name *</label>
                  <input
                    style={styles.fi}
                    required
                    value={modal.data.client_name || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, client_name: e.target.value } })}
                    placeholder="John Doe"
                  />
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Client Phone</label>
                  <input
                    style={styles.fi}
                    value={modal.data.client_phone || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, client_phone: e.target.value } })}
                    placeholder="0712-345-678"
                  />
                </div>
              </div>
              <div style={styles.fg}>
                <label style={styles.fl}>Deceased Name <span style={{ fontWeight: 400, color: S.textMuted }}>(optional)</span></label>
                <input
                  style={styles.fi}
                  value={modal.data.deceased_name || ''}
                  onChange={e => setModal({ ...modal, data: { ...modal.data, deceased_name: e.target.value } })}
                  placeholder="Jane Doe"
                />
              </div>
              <div style={styles.fr}>
                <div style={styles.fg}>
                  <label style={styles.fl}>Select Branch *</label>
                  <select
                    style={styles.fs}
                    required
                    value={modal.data.branch_id || currentBranch}
                    onChange={e => {
                      const selectedBranchId = e.target.value;
                      setModal({ ...modal, data: { ...modal.data, branch_id: selectedBranchId, coffin_id: '' } });
                    }}
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Service Date *</label>
                  <input
                    style={styles.fi}
                    required
                    type="date"
                    value={modal.data.service_date || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, service_date: e.target.value } })}
                  />
                </div>
              </div>
              <div style={styles.fg}>
                <label style={styles.fl}>Coffin *</label>
                <select
                  style={styles.fs}
                  required
                  value={modal.data.coffin_id || ''}
                  onChange={e => setModal({ ...modal, data: { ...modal.data, coffin_id: e.target.value } })}
                >
                  <option value="">Select coffin</option>
                  {(() => {
                    const selectedBranchId = modal.data.branch_id || currentBranch;
                    // Coffins without a per-branch id (branch_id null/undefined) belong to the
                    // selected branch's pool, so keep them visible — same rule as the Inventory tab.
                    const branchCoffinsList = coffins.filter(c => {
                      const matchesBranch = !c.branch_id || c.branch_id == selectedBranchId;
                      const hasStock = (parseInt(c.stock) || 0) > 0;
                      return matchesBranch && hasStock;
                    });
                    return branchCoffinsList.length > 0 ? branchCoffinsList.map(c => (
                      <option key={c.coffin_id || c.id} value={c.coffin_id || c.id}>
                        {c.name} — {formatKES(c.price)} ({c.stock} left)
                      </option>
                    )) : <option value="" disabled>No coffins available in this branch</option>;
                  })()}
                </select>
                {(() => {
                  const selectedBranchId = modal.data.branch_id || currentBranch;
                  const availableInBranch = coffins.filter(c => (!c.branch_id || c.branch_id == selectedBranchId) && (parseInt(c.stock) || 0) > 0).length;
                  if (availableInBranch === 0) {
                    return (
                      <div style={{ background: S.warningLight, border: '1px solid #fcd34d', color: '#92400e', padding: 12, borderRadius: 8, marginTop: 8, textAlign: 'center', fontSize: 13 }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }}></i>
                        No stock available in selected branch.
                        <button
                          style={{ ...styles.btn, ...styles.btnP, ...styles.btnSm, marginTop: 8 }}
                          onClick={() => { setModal({ open: false, type: '', data: {} }); openFindStock(); }}
                          type="button"
                        >
                          <i className="fa-solid fa-network-wired"></i> Find in Other Branches
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              {(() => {
                const selectedBranchId = modal.data.branch_id || currentBranch;
                const sel = coffins.find(c => (c.coffin_id || c.id) == modal.data.coffin_id);
                if (!sel) return null;
                const selType = sel.type || sel.name;
                const colorOptions = coffins
                  .filter(c => (!c.branch_id || c.branch_id == selectedBranchId) && (parseInt(c.stock) || 0) > 0 && (c.type || c.name) === selType && (c.color || '').trim())
                  .map(c => c.color);
                const uniqueColors = [...new Set(colorOptions)];
                if (uniqueColors.length === 0) return null;
                const currentColor = modal.data.color || sel.color || '';
                return (
                  <div style={styles.fg}>
                    <label style={styles.fl}>
                      Color {sel.color ? <span style={{ fontWeight: 400, color: S.textMuted }}>(selected: {sel.color})</span> : '(optional)'}
                    </label>
                    <select
                      style={styles.fs}
                      value={currentColor}
                      onChange={e => {
                        const chosen = e.target.value;
                        const match = coffins.find(c =>
                          (!c.branch_id || c.branch_id == selectedBranchId) &&
                          (parseInt(c.stock) || 0) > 0 &&
                          (c.type || c.name) === selType &&
                          (c.color || '') === chosen
                        );
                        setModal(prev => ({ ...prev, data: {
                          ...prev.data,
                          color: chosen,
                          coffin_id: match ? (match.coffin_id || match.id) : prev.data.coffin_id,
                          size: match ? (match.size || prev.data.size) : prev.data.size
                        } }));
                      }}
                    >
                      <option value="">{currentColor ? 'Keep current color' : 'Select color (optional)'}</option>
                      {uniqueColors.map((cl, i) => <option key={i} value={cl}>{cl}</option>)}
                    </select>
                  </div>
                );
              })()}
              <div style={styles.fg}>
                <label style={styles.fl}>Notes</label>
                <textarea
                  style={{ ...styles.fi, minHeight: 80, resize: 'vertical' }}
                  value={modal.data.notes || ''}
                  onChange={e => setModal({ ...modal, data: { ...modal.data, notes: e.target.value } })}
                />
              </div>
            </div>
            <div style={styles.mf}>
              <button type="button" style={{ ...styles.btn, ...styles.btnG }} onClick={() => setModal({ open: false, type: '', data: {} })}>Cancel</button>
              <button type="submit" style={{ ...styles.btn, ...styles.btnP }} disabled={submitLoading}>
                {submitLoading ? 'Saving...' : 'Create Reservation'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stock Request Modal */}
      <div
        style={{ ...styles.moOverlay, ...(modal.open && modal.type === 'stockRequest' ? styles.moOpen : {}) }}
        onClick={() => setModal({ open: false, type: '', data: {} })}
      >
        <div style={styles.md} onClick={e => e.stopPropagation()}>
          <div style={styles.mh}>
            <h2 style={styles.mh2}>New Stock Request</h2>
            <button style={styles.mx} onClick={() => setModal({ open: false, type: '', data: {} })}>&times;</button>
          </div>
          <form onSubmit={handleCreateStockRequest}>
            <div style={styles.mb}>
              <div style={styles.fr}>
                <div style={styles.fg}>
                  <label style={styles.fl}>Request To *</label>
                  <select
                    style={styles.fs}
                    required
                    value={modal.data.to_branch_id || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, to_branch_id: e.target.value } })}
                  >
                    <option value="">Select branch</option>
                    {branches.filter(b => b.id != currentBranch).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Coffin *</label>
                  <select
                    style={styles.fs}
                    required
                    value={modal.data.coffin_id || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, coffin_id: e.target.value } })}
                  >
                    <option value="">Select coffin</option>
                    {coffins.filter(c => c.stock > 0).map(c => (
                      <option key={c.coffin_id || c.id} value={c.coffin_id || c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.fr}>
                <div style={styles.fg}>
                  <label style={styles.fl}>Quantity</label>
                  <input
                    style={styles.fi}
                    type="number"
                    min={1}
                    value={modal.data.quantity || 1}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, quantity: parseInt(e.target.value) || 1 } })}
                  />
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Client Name</label>
                  <input
                    style={styles.fi}
                    value={modal.data.client_name || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, client_name: e.target.value } })}
                  />
                </div>
              </div>
              <div style={styles.fr}>
                <div style={styles.fg}>
                  <label style={styles.fl}>Client Phone</label>
                  <input
                    style={styles.fi}
                    value={modal.data.client_phone || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, client_phone: e.target.value } })}
                  />
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Deceased Name</label>
                  <input
                    style={styles.fi}
                    value={modal.data.deceased_name || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, deceased_name: e.target.value } })}
                  />
                </div>
              </div>
              <div style={styles.fg}>
                <label style={styles.fl}>Notes</label>
                <textarea
                  style={{ ...styles.fi, minHeight: 80, resize: 'vertical' }}
                  value={modal.data.notes || ''}
                  onChange={e => setModal({ ...modal, data: { ...modal.data, notes: e.target.value } })}
                />
              </div>
            </div>
            <div style={styles.mf}>
              <button type="button" style={{ ...styles.btn, ...styles.btnG }} onClick={() => setModal({ open: false, type: '', data: {} })}>Cancel</button>
              <button type="submit" style={{ ...styles.btn, ...styles.btnP }} disabled={submitLoading}>
                {submitLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ──────────── DRAWER ──────────── */}
      <div
        style={{ ...styles.drawerOverlay, ...(drawer.open ? styles.drawerOverlayOpen : {}) }}
        onClick={closeDrawer}
      ></div>
      <div style={{ ...styles.drawer, ...(drawer.open ? styles.drawerOpen : {}) }}>
        <div style={styles.drawerHeader}>
          <h2 style={styles.drawerHeaderH2}>{drawer.title}</h2>
          <button style={styles.mx} onClick={closeDrawer}>&times;</button>
        </div>
        <div style={styles.drawerBody} dangerouslySetInnerHTML={{ __html: drawer.content }} />
      </div>
    </div>
  );
};

// ─── Helper ──────────────────────────────────────────────────────────
const objToStr = (obj) => {
  if (!obj) return '';
  return Object.entries(obj)
    .map(([key, val]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (typeof val === 'number' && !['opacity', 'zIndex', 'fontWeight', 'flex'].includes(key)) {
        return `${cssKey}:${val}px`;
      }
      return `${cssKey}:${val}`;
    })
    .join(';');
};

export default CoffinDashboard;
