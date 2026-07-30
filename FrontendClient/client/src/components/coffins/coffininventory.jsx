import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import env from '../../utils/config/env';
import { getTenantSlug } from '../../utils/globalAuth';

const API = env.FULL_API_URL;

// ─── Design Tokens (from Memoria Inventory template) ─────────────────
const S = {
  primary: '#4338ca',
  primaryLight: '#eef2ff',
  bg: '#f8fafc',
  cardBg: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  success: '#059669',
  successLight: '#ecfdf5',
  warning: '#d97706',
  warningLight: '#fffbeb',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  info: '#0284c7',
  drawerWidth: 520,
  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

// ─── Helpers ─────────────────────────────────────────────────────────
const getStockStatus = (stock) => {
  if (stock <= 0) return { label: 'Out of Stock', cls: 'tag-ou', color: '#dc2626' };
  if (stock <= 2) return { label: 'Low Stock', cls: 'tag-lo', color: '#d97706' };
  return { label: 'Available', cls: 'tag-ok', color: '#059669' };
};

const getBookingStatus = (status) => {
  const map = {
    pending: { label: 'Pending Approval', cls: 'tag-pe' },
    booked: { label: 'Approved / Booked', cls: 'tag-bo' },
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
    pending: { label: 'Pending Approval', cls: 'tag-pe' },
    approved: { label: 'Approved', cls: 'tag-ar' },
    rejected: { label: 'Rejected', cls: 'tag-ou' },
    transferring: { label: 'In Transit', cls: 'tag-tr' },
    delivered: { label: 'Delivered', cls: 'tag-de' },
  };
  return map[status] || map.pending;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatKES = (n) => 'KES ' + parseFloat(n || 0).toLocaleString();

const COFFIN_TYPES = {
  Traditional: '⚰️', Modern: '🪦', Religious: '✝️',
  'Eco-Friendly': '🌿', Child: '🕊️', Veteran: '🎖️',
};

// ─── Inline Styles Object ────────────────────────────────────────────
const styles = {
  W: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '32px 24px',
    fontFamily: S.font,
    color: S.text,
    background: S.bg,
    minHeight: '100vh',
    fontSize: 15,
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
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: '-1px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    margin: 0,
  },
  hdH1Icon: {
    color: S.primary,
    background: S.primaryLight,
    width: 52,
    height: 52,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
  },
  hdInfoP: { color: S.textMuted, fontSize: 14, marginTop: 4, margin: 0 },
  notifContainer: { position: 'relative' },
  notifBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    border: `1px solid ${S.border}`,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 20,
    color: S.textMuted,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  notifBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    background: S.danger,
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 7px',
    borderRadius: 12,
    border: '2px solid #fff',
  },
  notifPanel: {
    position: 'absolute',
    top: 64,
    right: 0,
    width: 380,
    background: '#fff',
    border: `1px solid ${S.border}`,
    borderRadius: 16,
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    zIndex: 200,
    display: 'none',
    flexDirection: 'column',
    maxHeight: 450,
    overflow: 'hidden',
  },
  notifPanelOpen: { display: 'flex' },
  notifHeader: {
    padding: '18px 20px',
    borderBottom: `1px solid ${S.border}`,
    fontWeight: 700,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifList: { overflowY: 'auto', flex: 1 },
  notifItem: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
  },
  notifItemUnread: { background: '#fafbff' },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 28,
    background: '#fff',
    padding: 8,
    borderRadius: 14,
    border: `1px solid ${S.border}`,
    width: 'fit-content',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  tab: {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    background: 'transparent',
    color: S.textMuted,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: 'inherit',
  },
  tabActive: {
    background: S.primary,
    color: '#fff',
    boxShadow: '0 2px 8px rgba(67,56,202,0.2)',
  },
  badge: {
    background: '#fff',
    color: S.primary,
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: 10,
    marginLeft: 4,
  },
  badgeActive: { background: 'rgba(255,255,255,0.2)', color: '#fff' },
  tw: {
    background: '#fff',
    border: `1px solid ${S.border}`,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  tt: {
    padding: '20px 24px',
    borderBottom: `1px solid ${S.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  sbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: S.bg,
    border: `1px solid ${S.border}`,
    borderRadius: 10,
    padding: '12px 16px',
    width: 320,
  },
  sboxInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 15,
    width: '100%',
    fontFamily: 'inherit',
    color: S.text,
  },
  ff: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  fn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: `1px solid ${S.border}`,
    background: '#fff',
    color: S.textMuted,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  fnActive: { background: S.primary, color: '#fff', borderColor: S.primary },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '14px 24px',
    textAlign: 'left',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: S.textMuted,
    background: S.bg,
    fontWeight: 700,
    borderBottom: `1px solid ${S.border}`,
  },
  td: {
    padding: '18px 24px',
    fontSize: 15,
    borderBottom: '1px solid #f1f5f9',
    color: '#334155',
    verticalAlign: 'middle',
  },
  ci: { display: 'flex', alignItems: 'center', gap: 14 },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: S.primaryLight,
    color: S.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  cname: { fontWeight: 600, color: S.text, fontSize: 15 },
  sku: { fontSize: 13, color: S.textMuted },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  ib: {
    width: 36,
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    border: `1px solid ${S.border}`,
    background: '#fff',
    color: S.textMuted,
    cursor: 'pointer',
    transition: 'all 0.2s',
    margin: '0 2px',
  },
  es: {
    textAlign: 'center',
    padding: '64px 24px',
    color: S.textMuted,
  },
  esIcon: { fontSize: 32, marginBottom: 16, opacity: 0.3 },
  esP: { fontSize: 16, margin: 0 },
  rg: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },

  // Modal styles
  moOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.7)',
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
    borderRadius: 20,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
  },
  mh: {
    padding: '24px 28px',
    borderBottom: `1px solid ${S.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mh2: { fontSize: 20, fontWeight: 700, margin: 0 },
  mx: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: `1px solid ${S.border}`,
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: S.textMuted,
  },
  mb: { padding: 28 },
  mf: {
    padding: '20px 28px',
    borderTop: `1px solid ${S.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
  fg: { marginBottom: 20 },
  fr: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  fl: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: S.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fi: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: `1px solid ${S.border}`,
    background: '#fff',
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  },
  fs: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: `1px solid ${S.border}`,
    background: '#fff',
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.2s',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 20px',
    borderRadius: 10,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  btnP: { background: S.primary, color: '#fff', boxShadow: '0 4px 12px rgba(67,56,202,0.2)' },
  btnD: { background: S.danger, color: '#fff' },
  btnG: { background: '#f1f5f9', color: '#475569' },
  btnS: { background: S.success, color: '#fff' },
  btnW: { background: S.warning, color: '#fff' },
  btnSm: { padding: '8px 14px', fontSize: 13, borderRadius: 8 },
  btnWFull: { width: '100%', padding: 14 },

  // Drawer
  drawerOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.6)',
    backdropFilter: 'blur(3px)',
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
    padding: '24px 28px',
    borderBottom: `1px solid ${S.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerHeaderH2: { fontSize: 20, fontWeight: 700, margin: 0 },
  drawerBody: { flex: 1, overflowY: 'auto', padding: 28 },

  // Detail drawer
  detailImage: {
    width: '100%',
    height: 240,
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    borderRadius: 16,
    marginBottom: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${S.border}`,
  },
  detailStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
    fontSize: 18,
    fontWeight: 700,
  },
  statusDot: { width: 12, height: 12, borderRadius: '50%' },
  detailSection: { marginBottom: 28 },
  detailSectionH4: {
    fontSize: 15,
    fontWeight: 700,
    color: S.text,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: `1px solid ${S.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    fontSize: 15,
  },
  detailRowSpan: { color: S.textMuted },
  detailRowStrong: { color: S.text, fontWeight: 600, textAlign: 'right' },
  otherBranchesList: { display: 'flex', flexDirection: 'column', gap: 10 },
  otherBranchItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: S.bg,
    borderRadius: 10,
    fontSize: 14,
    border: `1px solid ${S.border}`,
  },
  branchTag: { display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 },
  detailActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 32 },

  // Tracker
  tracker: { display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '32px 0 40px' },
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
    fontSize: 13,
    fontWeight: 700,
    transition: 'all 0.3s',
  },
  trackerStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1, textAlign: 'center', width: '25%' },
  trackerLabel: { fontSize: 12, fontWeight: 600, color: S.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  historyLog: { background: S.bg, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20, marginTop: 20 },
  historyItem: { display: 'flex', alignItems: 'flex-start', gap: 14, paddingBottom: 20, position: 'relative' },
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
    fontSize: 15,
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
    'tag-ar': { background: '#e0e7ff', color: '#4338ca' },
    'tag-tr': { background: S.warningLight, color: S.warning },
    'tag-de': { background: S.successLight, color: S.success },
  };
  return <span style={{ ...styles.tag, ...(tagStyles[cls] || tagStyles['tag-ok']) }}>{children}</span>;
};

// ─── Main Component ──────────────────────────────────────────────────
const CoffinDashboard = () => {
  const [tab, setTab] = useState('inventory');
  const [loading, setLoading] = useState(true);

  // Data
  const [coffins, setCoffins] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notifId, setNotifId] = useState(1);

  // Filters
  const [invFilter, setInvFilter] = useState('all');
  const [bkFilter, setBkFilter] = useState('all');
  const [invQuery, setInvQuery] = useState('');
  const [bkQuery, setBkQuery] = useState('');

  // Drawer / Modal
  const [drawer, setDrawer] = useState({ open: false, title: '', content: '' });
  const [modal, setModal] = useState({ open: false, type: '', data: {} });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notifications on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ─── API Calls ──────────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantSlug = getTenantSlug();

      let branchList = [];
      try {
        const tenantRes = await api.get(`/tenant/${tenantSlug}/settings`).catch(() => null);
        if (tenantRes?.data?.branches) {
          branchList = tenantRes.data.branches;
        }
      } catch (e) { /* ignore */ }

      if (branchList.length === 0) {
        branchList = [{ id: 1, name: 'Main Branch' }];
      }
      setBranches(branchList);
      setCurrentBranch(branchList[0]?.id || 1);

      const coffinRes = await api.get('/coffins/list');
      if (coffinRes.data?.success && coffinRes.data?.data) {
        setCoffins(coffinRes.data.data);
      }

      const bookingRes = await api.get('/coffins/bookings');
      if (bookingRes.data?.success && bookingRes.data?.data) {
        setBookings(bookingRes.data.data);
      }

      const stockRes = await api.get('/coffins/stock-requests');
      if (stockRes.data?.success && stockRes.data?.data) {
        setStockRequests(stockRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching coffin data:', error);
      toast.error('Failed to load coffin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // ─── Notifications ──────────────────────────────────────────────────
  const addNotif = (msg) => {
    setNotifications(prev => [{ id: notifId, msg, read: false, ct: Date.now() }, ...prev]);
    setNotifId(prev => prev + 1);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ─── CRUD Handlers ──────────────────────────────────────────────────
  const handleCreateCoffin = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const data = modal.data;
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('type', data.type);
      formData.append('material', data.material);
      formData.append('price', parseFloat(data.price));
      formData.append('stock', parseInt(data.stock) || 0);
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
        addNotif(`New coffin "${data.name}" added to inventory`);
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
      const res = await api.post('/coffins/bookings', {
        client_name: d.client_name,
        client_phone: d.client_phone,
        deceased_name: d.deceased_name,
        coffin_id: d.coffin_id,
        service_date: d.service_date,
        notes: d.notes,
        paid: d.paid || false,
        specifications: d.specifications || [],
      });
      if (res.data?.success) {
        toast.success('Booking created successfully');
        setModal({ open: false, type: '', data: {} });
        addNotif(`New reservation for ${d.client_name}`);
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
        addNotif(`Stock request sent to ${branches.find(b => b.id == d.to_branch_id)?.name || 'other branch'}`);
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
        addNotif(`Stock request #${id} ${action}ed`);
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
        addNotif(`Booking #${id} ${status}`);
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
        addNotif('Coffin removed from inventory');
        setDrawer({ open: false, title: '', content: '' });
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coffin');
    }
  };

  // ─── Filtered Data ──────────────────────────────────────────────────
  const branchCoffins = coffins.filter(c =>
    !currentBranch || c.branch_id === currentBranch || c.branch_id == currentBranch
  );
  const branchBookings = bookings.filter(b =>
    !currentBranch || b.branch_id === currentBranch || b.branch_id == currentBranch
  );

  const filteredCoffins = branchCoffins.filter(c => {
    if (invQuery) {
      const ql = invQuery.toLowerCase();
      if (!c.name?.toLowerCase().includes(ql) && !c.sku?.toLowerCase().includes(ql)) return false;
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
      <div style="border-radius:16px; overflow:hidden;">
        <div style="${objToStr(styles.detailImage)}">
          <i class="fa-solid fa-image" style="font-size:64px; color:#cbd5e1"></i>
        </div>
        <div style="${objToStr(styles.detailStatus)}">
          <span style="width:12px; height:12px; border-radius:50%; background:${st.color}; display:inline-block"></span>
          ${st.label}
        </div>
        ${isBorrowed ? `
        <div style="background:#eef2ff; border:1px solid #c7d2fe; padding:16px; border-radius:12px; margin-bottom:24px;">
          <div style="font-size:14px; font-weight:600; color:#4338ca; margin-bottom:4px;">
            📍 Owner: ${branches.find(b => b.id == c.owner_branch_id)?.name || 'Unknown'}
          </div>
          <div style="font-size:14px; font-weight:600; color:#4338ca;">
            📦 Current Location: ${branches.find(b => b.id == c.branch_id)?.name || 'Unknown'}
          </div>
        </div>` : ''}
        <div style="${objToStr(styles.detailSection)}">
          <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-boxes-stacked"></i> Inventory</h4>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Total Stock</span><strong style="${objToStr(styles.detailRowStrong)}">${c.stock}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Reserved</span><strong style="${objToStr(styles.detailRowStrong)}">${reserved}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Available</span><strong style="color:${available > 0 ? S.success : S.danger}; font-weight:600">${available}</strong></div>
        </div>
        <div style="${objToStr(styles.detailSection)}">
          <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-info-circle"></i> Information</h4>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">SKU</span><strong style="${objToStr(styles.detailRowStrong)}">${c.sku || 'N/A'}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Category</span><strong style="${objToStr(styles.detailRowStrong)}">${c.type || 'N/A'}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Material</span><strong style="${objToStr(styles.detailRowStrong)}">${c.material || 'N/A'}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Size</span><strong style="${objToStr(styles.detailRowStrong)}">${c.size || 'N/A'}</strong></div>
          <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Color</span><strong style="${objToStr(styles.detailRowStrong)}">${c.color || 'N/A'}</strong></div>
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
                <span style="${objToStr(styles.branchTag)}"><span style="width:10px; height:10px; border-radius:50%; background:${color}; display:inline-block"></span>${b.name}</span>
                <strong>${stock} Available</strong>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-top:32px;">
          ${c.stock > 0 ? `<button class="drawer-btn btn-s" onclick="window.__openBookingModal(${c.coffin_id || c.id})"><i class="fa-solid fa-calendar-plus"></i> Book Locally</button>` : `<button class="drawer-btn btn-w" onclick="window.__openFindStock('${c.name?.replace(/'/g, "\\'") || ''}')"><i class="fa-solid fa-network-wired"></i> Find Stock Elsewhere</button>`}
          <button class="drawer-btn btn-d" onclick="window.__deleteCoffin(${c.coffin_id || c.id})"><i class="fa-solid fa-trash"></i> Delete Coffin</button>
          <button class="drawer-btn btn-g" onclick="window.__closeDrawer()">Close</button>
        </div>
      </div>`;
    openDrawer(c.name || 'Coffin Details', content);
  };

  const viewBooking = (id) => {
    const b = bookings.find(x => x.id === id);
    if (!b) return;
    const c = coffins.find(x => (x.coffin_id || x.id) == b.coffin_id);
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
        <div style="background:${S.bg}; padding:16px; border-radius:10px; font-size:14px; color:#334155; border:1px solid ${S.border};">${b.notes || 'No notes provided'}</div>
      </div>
      <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-top:32px;">
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

    let trackerHtml = `<div style="position:relative; margin:32px 0 40px;">
      <div style="position:absolute; top:16px; left:16px; right:16px; height:3px; background:${S.border}; z-index:0; border-radius:2px;"></div>
      <div style="display:flex; justify-content:space-between;">`;
    stageLabels.forEach((label, idx) => {
      let stepClass = '';
      let icon = (idx + 1).toString();
      if (idx < currentStageIdx) { stepClass = 'done'; icon = '<i class="fa-solid fa-check" style="font-size:13px"></i>'; }
      else if (idx === currentStageIdx) stepClass = 'active';
      const dotBg = idx < currentStageIdx ? S.success : idx === currentStageIdx ? S.primary : '#fff';
      const dotBorder = idx < currentStageIdx ? S.success : idx === currentStageIdx ? S.primary : S.border;
      const dotColor = idx < currentStageIdx || idx === currentStageIdx ? '#fff' : S.textMuted;
      const labelColor = idx <= currentStageIdx ? S.text : S.textMuted;
      trackerHtml += `<div style="display:flex; flex-direction:column; align-items:center; gap:8px; z-index:1; text-align:center; width:25%;">
        <div style="width:32px; height:32px; border-radius:50%; background:${dotBg}; border:3px solid ${dotBorder}; color:${dotColor}; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; transition:all 0.3s; ${idx === currentStageIdx ? 'transform:scale(1.1);' : ''}">${icon}</div>
        <div style="font-size:12px; font-weight:600; color:${labelColor}; text-transform:uppercase; letter-spacing:0.5px;">${label}</div>
      </div>`;
    });
    trackerHtml += `</div></div>`;

    let historyHtml = `<div style="background:${S.bg}; border:1px solid ${S.border}; border-radius:14px; padding:20px; margin-top:20px;">`;
    if (r.history && r.history.length > 0) {
      r.history.forEach((h, idx) => {
        const time = new Date(r.created_at || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        historyHtml += `<div style="display:flex; align-items:flex-start; gap:14px; padding-bottom:20px; position:relative;">
          ${idx < r.history.length - 1 ? `<div style="position:absolute; left:9px; top:24px; bottom:-6px; width:2px; background:${S.border};"></div>` : ''}
          <div style="width:20px; height:20px; border-radius:50%; background:${S.success}; color:#fff; font-size:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; z-index:1;"><i class="fa-solid fa-check"></i></div>
          <div>
            <div style="font-size:14px; color:${S.text}; font-weight:500;">${h}</div>
            <div style="font-size:12px; color:${S.textMuted}; margin-top:2px;">${time}</div>
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
        <div style="background:${S.bg}; padding:16px; border-radius:10px; font-size:14px; color:#334155; border:1px solid ${S.border};">${r.notes || 'No reason provided'}</div>
      </div>
      <h4 style="font-size:15px; font-weight:700; margin-top:32px; margin-bottom:16px;">Progress Tracker</h4>
      ${trackerHtml}
      ${historyHtml}
      <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-top:32px;">
        ${r.status === 'pending' && r.to_branch_id == currentBranch ? `<button class="drawer-btn btn-s" onclick="window.__handleStockAction(${r.id},'approve')"><i class="fa-solid fa-check"></i> Approve Request</button>` : ''}
        ${r.status === 'approved' && r.to_branch_id == currentBranch ? `<button class="drawer-btn btn-w" onclick="window.__handleStockAction(${r.id},'transferring')"><i class="fa-solid fa-truck"></i> Mark In Transit</button>` : ''}
        ${r.status === 'transferring' && r.to_branch_id == currentBranch ? `<button class="drawer-btn btn-s" onclick="window.__handleStockAction(${r.id},'delivered')"><i class="fa-solid fa-check-double"></i> Confirm Delivered</button>` : ''}
        <button class="drawer-btn btn-g" onclick="window.__closeDrawer()">Close</button>
      </div>`;
    openDrawer(`Transfer Request #${r.id}`, content);
  };

  // ─── Expose to window for drawer HTML buttons ───────────────────────
  useEffect(() => {
    window.__closeDrawer = closeDrawer;
    window.__openBookingModal = (coffinId) => {
      closeDrawer();
      setModal({ open: true, type: 'booking', data: { coffin_id: coffinId, service_date: new Date().toISOString().split('T')[0] } });
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
          addNotif(`Booking #${id} marked as paid`);
          closeDrawer();
          fetchAllData();
        } catch (err) {
          toast.error('Failed to mark as paid');
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
    };
  }, [bookings, currentBranch]);

  // ─── Find Stock in Other Branches ───────────────────────────────────
  const [interSearch, setInterSearch] = useState('');

  const openFindStock = (searchQuery = '') => {
    setInterSearch(searchQuery);
    const content = `
      <div style="margin-bottom:24px;">
        <div style="display:flex; align-items:center; gap:12px; background:${S.bg}; border:1px solid ${S.border}; border-radius:10px; padding:12px 16px; width:100%;">
          <i class="fa-solid fa-magnifying-glass" style="color:${S.textMuted}"></i>
          <input id="interSearchInput" placeholder="Search coffin name or type..." style="border:none; outline:none; background:transparent; font-size:15px; width:100%; font-family:inherit; color:${S.text};" value="${searchQuery}" oninput="window.__renderInterResults(this.value)">
        </div>
      </div>
      <div id="interResults"></div>
      <div style="margin-top:16px;">
        <button class="drawer-btn btn-g" onclick="window.__closeDrawer()">Close</button>
      </div>`;
    openDrawer('Find Stock in Other Branches', content);
    setTimeout(() => renderInterResults(searchQuery), 50);
  };

  const renderInterResults = (query) => {
    const results = coffins.filter(c => {
      if (c.branch_id == currentBranch || (parseInt(c.stock) || 0) <= 0) return false;
      if (query) {
        const ql = query.toLowerCase();
        if (!c.name?.toLowerCase().includes(ql) && !c.type?.toLowerCase().includes(ql) && !c.sku?.toLowerCase().includes(ql)) return false;
      }
      return true;
    });

    let html = `<div style="overflow-x:auto;"><table style="width:100%; border-collapse:collapse; border:1px solid ${S.border}; border-radius:12px;">
      <thead><tr>
        <th style="${objToStr(styles.th)}">Branch</th>
        <th style="${objToStr(styles.th)}">Coffin</th>
        <th style="${objToStr(styles.th)}">Avail.</th>
        <th style="${objToStr(styles.th)}">Action</th>
      </tr></thead>
      <tbody>
        ${results.length === 0 ? `<tr><td colspan="4"><div style="${objToStr(styles.es)}"><i class="fa-solid fa-box-open" style="${objToStr(styles.esIcon)}"></i><p style="${objToStr(styles.esP)}">No available coffins found in other branches.</p></div></td></tr>` : ''}
        ${results.map(c => {
          const branch = branches.find(b => b.id == c.branch_id);
          return `<tr>
            <td style="${objToStr(styles.td)}"><strong>${branch?.name || 'Unknown'}</strong></td>
            <td style="${objToStr(styles.td)}">
              <div style="font-weight:600">${c.name}</div>
              <div style="font-size:12px; color:#94a3b8">${c.type} - ${formatKES(c.price)}</div>
            </td>
            <td style="${objToStr(styles.td)}"><span class="inline-tag tag-ok">${c.stock}</span></td>
            <td style="${objToStr(styles.td)}"><button class="drawer-btn btn-p btn-sm" onclick="window.__reserveInterBranch(${c.coffin_id || c.id})">Reserve & Request</button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>`;
    const el = document.getElementById('interResults');
    if (el) el.innerHTML = html;
  };

  // Expose inter-branch functions
  useEffect(() => {
    window.__renderInterResults = renderInterResults;
    window.__reserveInterBranch = (cid) => {
      const c = coffins.find(x => (x.coffin_id || x.id) == cid);
      if (!c) return;
      const content = `
        <button class="drawer-btn btn-g btn-sm" style="margin-bottom:24px;" onclick="window.__openFindStock('')"><i class="fa-solid fa-arrow-left"></i> Back to Search</button>
        <div style="${objToStr(styles.detailSection)}">
          <h4 style="${objToStr(styles.detailSectionH4)}">Reserve & Request Transfer</h4>
          <p style="color:${S.textMuted}; font-size:14px; margin-bottom:24px; line-height:1.5;">You are requesting <strong>${c.name}</strong> from ${branches.find(b => b.id == c.branch_id)?.name || 'other branch'}. This will create a booking and a transfer request.</p>
        </div>
        <div style="${objToStr(styles.fg)}"><label style="${objToStr(styles.fl)}">Client Name *</label><input class="drawer-input" id="ir-client" placeholder="John Doe"></div>
        <div style="${objToStr(styles.fg)}"><label style="${objToStr(styles.fl)}">Deceased Name *</label><input class="drawer-input" id="ir-deceased" placeholder="Jane Doe"></div>
        <div style="${objToStr(styles.fg)}"><label style="${objToStr(styles.fl)}">Reason / Notes</label><textarea class="drawer-textarea" id="ir-reason" placeholder="Why is this needed?" style="min-height:100px;"></textarea></div>
        <button class="drawer-btn btn-p btn-w-full" onclick="window.__submitInterReserve(${c.coffin_id || c.id})" style="margin-top:16px;"><i class="fa-solid fa-paper-plane"></i> Send Request</button>`;
      openDrawer('Reserve & Request', content);
    };
    window.__submitInterReserve = async (cid) => {
      const c = coffins.find(x => (x.coffin_id || x.id) == cid);
      if (!c) return;
      const client = document.getElementById('ir-client')?.value;
      const deceased = document.getElementById('ir-deceased')?.value;
      const reason = document.getElementById('ir-reason')?.value;
      if (!client || !deceased) {
        toast.error('Client and Deceased names are required');
        return;
      }
      try {
        const res = await api.post('/coffins/stock-requests', {
          from_branch_id: currentBranch,
          to_branch_id: c.branch_id,
          coffin_id: cid,
          quantity: 1,
          client_name: client,
          deceased_name: deceased,
          notes: reason || 'Inter-branch request',
        });
        if (res.data?.success) {
          toast.success('Reservation created & transfer requested');
          addNotif(`Inter-branch request sent to ${branches.find(b => b.id == c.branch_id)?.name || 'other branch'} for ${c.name}`);
          closeDrawer();
          fetchAllData();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to create request');
      }
    };
    return () => {
      delete window.__renderInterResults;
      delete window.__reserveInterBranch;
      delete window.__submitInterReserve;
    };
  }, [coffins, branches, currentBranch]);

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

  // ─── Render Inventory Tab ───────────────────────────────────────────
  const renderInventory = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
          Inventory <span style={{ color: S.textMuted, fontWeight: 400 }}>({branchCoffins.length} items)</span>
        </h3>
        <button style={{ ...styles.btn, ...styles.btnP }} onClick={() => setModal({ open: true, type: 'coffin', data: { type: 'Traditional', stock: 0, price: 0 } })}>
          <i className="fa-solid fa-plus"></i> Add Coffin
        </button>
      </div>
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
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoffins.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div style={styles.es}>
                      <i className="fa-solid fa-box-open" style={styles.esIcon}></i>
                      <p style={styles.esP}>No coffins found locally.</p>
                      {invQuery && (
                        <button
                          style={{ ...styles.btn, ...styles.btnP, marginTop: 20 }}
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
                          <div style={styles.thumb}>{COFFIN_TYPES[coffin.type] || coffin.type?.charAt(0) || '?'}</div>
                          <div>
                            <div style={styles.cname}>{coffin.name}</div>
                            <div style={styles.sku}>{coffin.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{coffin.type}</td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{formatKES(coffin.price)}</td>
                      <td style={{ ...styles.td, fontWeight: 700, color: coffin.stock <= 0 ? S.danger : coffin.stock <= 2 ? S.warning : S.success }}>
                        {coffin.stock}
                      </td>
                      <td style={styles.td}><Tag cls={st.cls}>{st.label}</Tag></td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {coffin.stock > 0 ? (
                            <button
                              style={{ ...styles.btn, ...styles.btnS, ...styles.btnSm }}
                              onClick={() => setModal({ open: true, type: 'booking', data: { coffin_id: id, service_date: new Date().toISOString().split('T')[0] } })}
                            >
                              Book
                            </button>
                          ) : (
                            <button
                              style={{ ...styles.btn, ...styles.btnW, ...styles.btnSm }}
                              onClick={() => openFindStock(coffin.name)}
                            >
                              Find Stock
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
  const renderBookings = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Reservations</h3>
        <button
          style={{ ...styles.btn, ...styles.btnP }}
          onClick={() => setModal({ open: true, type: 'booking', data: { service_date: new Date().toISOString().split('T')[0] } })}
        >
          <i className="fa-solid fa-plus"></i> New Reservation
        </button>
      </div>
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
            {[['all', 'All'], ['pending', 'Pending'], ['booked', 'Approved'], ['completed', 'Completed'], ['unpaid', 'Unpaid']].map(f => (
              <button
                key={f[0]}
                style={{ ...styles.fn, ...(bkFilter === f[0] ? styles.fnActive : {}) }}
                onClick={() => setBkFilter(f[0])}
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
      </div>
    </>
  );

  // ─── Render Transfers Tab ───────────────────────────────────────────
  const renderTransfers = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Transfers</h3>
        <button style={{ ...styles.btn, ...styles.btnP }} onClick={() => openFindStock()}>
          <i className="fa-solid fa-network-wired"></i> Find in Other Branches
        </button>
      </div>
      <div style={styles.rg}>
        <div style={styles.tw}>
          <div style={styles.tt}>
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fa-solid fa-arrow-down" style={{ color: S.success }}></i> Incoming ({incomingRequests.length})
            </h4>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>From</th>
                  <th style={styles.th}>Coffin</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {incomingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div style={styles.es}>
                        <i className="fa-solid fa-check-double" style={styles.esIcon}></i>
                        <p style={styles.esP}>No incoming requests</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  incomingRequests.map(r => {
                    const coffin = coffins.find(c => (c.coffin_id || c.id) == r.coffin_id);
                    const rs = getReqStatus(r.status);
                    const fromBranch = branches.find(b => b.id == r.from_branch_id);
                    return (
                      <tr key={r.id}>
                        <td style={{ ...styles.td, fontWeight: 600 }}>#{r.id}</td>
                        <td style={styles.td}>{fromBranch?.name || 'N/A'}</td>
                        <td style={styles.td}>{coffin?.name || 'N/A'}</td>
                        <td style={styles.td}><Tag cls={rs.cls}>{rs.label}</Tag></td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button style={styles.ib} onClick={() => viewRequest(r.id)} title="View Progress">
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            {r.status === 'pending' && (
                              <button
                                style={{ ...styles.ib, color: S.success, borderColor: 'transparent' }}
                                onClick={() => handleStockAction(r.id, 'approve')}
                                title="Approve"
                              >
                                <i className="fa-solid fa-check"></i>
                              </button>
                            )}
                            {r.status === 'approved' && (
                              <button
                                style={{ ...styles.ib, color: S.warning, borderColor: 'transparent' }}
                                onClick={() => handleStockAction(r.id, 'transferring')}
                                title="Send"
                              >
                                <i className="fa-solid fa-truck"></i>
                              </button>
                            )}
                            {r.status === 'transferring' && (
                              <button
                                style={{ ...styles.ib, color: S.success, borderColor: 'transparent' }}
                                onClick={() => handleStockAction(r.id, 'delivered')}
                                title="Receive"
                              >
                                <i className="fa-solid fa-circle-check"></i>
                              </button>
                            )}
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

        <div style={styles.tw}>
          <div style={styles.tt}>
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fa-solid fa-arrow-up" style={{ color: S.warning }}></i> Outgoing ({outgoingRequests.length})
            </h4>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>To</th>
                  <th style={styles.th}>Coffin</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {outgoingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div style={styles.es}>
                        <i className="fa-solid fa-paper-plane" style={styles.esIcon}></i>
                        <p style={styles.esP}>No outgoing requests</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  outgoingRequests.map(r => {
                    const coffin = coffins.find(c => (c.coffin_id || c.id) == r.coffin_id);
                    const rs = getReqStatus(r.status);
                    const toBranch = branches.find(b => b.id == r.to_branch_id);
                    return (
                      <tr key={r.id}>
                        <td style={{ ...styles.td, fontWeight: 600 }}>#{r.id}</td>
                        <td style={styles.td}>{toBranch?.name || 'N/A'}</td>
                        <td style={styles.td}>{coffin?.name || 'N/A'}</td>
                        <td style={styles.td}><Tag cls={rs.cls}>{rs.label}</Tag></td>
                        <td style={styles.td}>
                          <button style={styles.ib} onClick={() => viewRequest(r.id)} title="View Progress">
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
        </div>
      </div>
    </>
  );

  // ─── Main Render ────────────────────────────────────────────────────
  return (
    <div style={styles.W}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .drawer-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 20px; border-radius: 10px; border: none; font-size: 14px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          transition: all 0.2s; white-space: nowrap; width: 100%;
        }
        .drawer-btn.btn-p { background: ${S.primary}; color: #fff; box-shadow: 0 4px 12px rgba(67,56,202,0.2); }
        .drawer-btn.btn-p:hover { background: #3730a3; transform: translateY(-1px); }
        .drawer-btn.btn-d { background: ${S.danger}; color: #fff; }
        .drawer-btn.btn-d:hover { background: #b91c1c; }
        .drawer-btn.btn-g { background: #f1f5f9; color: #475569; }
        .drawer-btn.btn-g:hover { background: #e2e8f0; }
        .drawer-btn.btn-s { background: ${S.success}; color: #fff; }
        .drawer-btn.btn-s:hover { background: #047857; }
        .drawer-btn.btn-w { background: ${S.warning}; color: #fff; }
        .drawer-btn.btn-w:hover { background: #b45309; }
        .drawer-btn.btn-sm { padding: 8px 14px; font-size: 13px; border-radius: 8px; }
        .drawer-btn.btn-w-full { width: 100%; padding: 14px; }
        .drawer-input {
          width: 100%; padding: 12px 16px; border-radius: 10px;
          border: 1px solid ${S.border}; background: #fff; font-size: 15px;
          font-family: inherit; outline: none; transition: all 0.2s;
          box-sizing: border-box;
        }
        .drawer-input:focus, .drawer-textarea:focus { border-color: ${S.primary}; box-shadow: 0 0 0 3px rgba(67,56,202,0.1); }
        .drawer-textarea {
          width: 100%; padding: 12px 16px; border-radius: 10px;
          border: 1px solid ${S.border}; background: #fff; font-size: 15px;
          font-family: inherit; outline: none; transition: all 0.2s;
          resize: vertical; box-sizing: border-box;
        }
        .inline-tag {
          display: inline-flex; align-items: center; padding: 5px 12px;
          border-radius: 20px; font-size: 12px; font-weight: 600;
        }
        .inline-tag.tag-ok { background: ${S.successLight}; color: ${S.success}; }
        .inline-tag.tag-lo { background: ${S.warningLight}; color: ${S.warning}; }
        .inline-tag.tag-ou { background: ${S.dangerLight}; color: ${S.danger}; }
        .inline-tag.tag-pe { background: ${S.warningLight}; color: ${S.warning}; }
        .inline-tag.tag-bo { background: #e0f2fe; color: ${S.info}; }
        .inline-tag.tag-co { background: ${S.successLight}; color: ${S.success}; }
        .inline-tag.tag-ca { background: ${S.dangerLight}; color: ${S.danger}; }
        .inline-tag.tag-ar { background: #e0e7ff; color: #4338ca; }
        .inline-tag.tag-tr { background: ${S.warningLight}; color: ${S.warning}; }
        .inline-tag.tag-de { background: ${S.successLight}; color: ${S.success}; }
        tr:hover td { background: #fafbfc; }
      `}</style>

      <ToastContainer position="top-center" autoClose={3000} />

      {/* Header */}
      <div style={styles.hd}>
        <div style={styles.hdLeft}>
          <div>
            <h1 style={styles.hdH1}>
              <i className="fa-solid fa-box-archive" style={styles.hdH1Icon}></i>
              Memoria Inventory
            </h1>
            <p style={styles.hdInfoP}>
              Managing inventory for <strong>{branches.find(b => b.id == currentBranch)?.name || 'Main Branch'} Branch</strong>
            </p>
          </div>
        </div>
        <div style={styles.notifContainer} ref={notifRef}>
          <button
            style={styles.notifBtn}
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <i className="fa-solid fa-bell"></i>
            {unreadCount > 0 && <span style={styles.notifBadge}>{unreadCount}</span>}
          </button>
          <div style={{ ...styles.notifPanel, ...(notifOpen ? styles.notifPanelOpen : {}) }}>
            <div style={styles.notifHeader}>
              <span>Notifications</span>
              <button
                style={{ ...styles.btn, ...styles.btnG, ...styles.btnSm }}
                onClick={markAllRead}
              >
                Mark all read
              </button>
            </div>
            <div style={styles.notifList}>
              {notifications.length === 0 ? (
                <div style={{ ...styles.es, padding: 48 }}>
                  <i className="fa-solid fa-bell-slash" style={styles.esIcon}></i>
                  <p style={styles.esP}>No notifications</p>
                </div>
              ) : (
                notifications.map(n => {
                  const time = new Date(n.ct).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={n.id} style={{ ...styles.notifItem, ...(n.read ? {} : styles.notifItemUnread) }}>
                      <div style={{ ...styles.notifIcon, background: n.read ? '#f1f5f9' : S.primaryLight, color: n.read ? S.textMuted : S.primary }}>
                        <i className="fa-solid fa-bell"></i>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{n.msg}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{time}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: 'inventory', icon: 'fa-boxes-stacked', label: 'Inventory' },
          { key: 'bookings', icon: 'fa-calendar-check', label: 'Reservations' },
          { key: 'transfers', icon: 'fa-right-left', label: 'Transfers', badge: pendingReqCount },
        ].map(t => (
          <button
            key={t.key}
            style={{ ...styles.tab, ...(tab === t.key ? styles.tabActive : {}) }}
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
                  <label style={styles.fl}>Type *</label>
                  <select
                    style={styles.fs}
                    required
                    value={modal.data.type || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, type: e.target.value } })}
                  >
                    <option value="">Select type</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Modern">Modern</option>
                    <option value="Religious">Religious</option>
                    <option value="Eco-Friendly">Eco-Friendly</option>
                    <option value="Child">Child</option>
                    <option value="Veteran">Veteran</option>
                  </select>
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Material *</label>
                  <input
                    style={styles.fi}
                    required
                    value={modal.data.material || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, material: e.target.value } })}
                    placeholder="Solid Mahogany"
                  />
                </div>
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
                <label style={styles.fl}>Deceased Name *</label>
                <input
                  style={styles.fi}
                  required
                  value={modal.data.deceased_name || ''}
                  onChange={e => setModal({ ...modal, data: { ...modal.data, deceased_name: e.target.value } })}
                  placeholder="Jane Doe"
                />
              </div>
              <div style={styles.fr}>
                <div style={styles.fg}>
                  <label style={styles.fl}>Coffin *</label>
                  <select
                    style={styles.fs}
                    required
                    value={modal.data.coffin_id || ''}
                    onChange={e => setModal({ ...modal, data: { ...modal.data, coffin_id: e.target.value } })}
                  >
                    <option value="">Select coffin</option>
                    {branchCoffins.filter(c => c.stock > 0).map(c => (
                      <option key={c.coffin_id || c.id} value={c.coffin_id || c.id}>
                        {c.name} — {formatKES(c.price)} ({c.stock} left)
                      </option>
                    ))}
                  </select>
                  {branchCoffins.filter(c => c.stock > 0).length === 0 && (
                    <div style={{ background: S.warningLight, border: '1px solid #fcd34d', color: '#92400e', padding: 12, borderRadius: 10, marginTop: 8, textAlign: 'center', fontSize: 13 }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }}></i>
                      No local stock available.
                      <button
                        style={{ ...styles.btn, ...styles.btnP, ...styles.btnSm, marginTop: 8 }}
                        onClick={() => { setModal({ open: false, type: '', data: {} }); openFindStock(); }}
                        type="button"
                      >
                        <i className="fa-solid fa-network-wired"></i> Find in Other Branches
                      </button>
                    </div>
                  )}
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