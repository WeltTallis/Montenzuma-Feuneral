import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSocket } from '../../utils/context/socketContext';
import env from '../../utils/config/env';
import HearseCalendar from './HearseCalendar';
import DayTimeline from './DayTimeline';
import useAuthStore from '../../utils/store/useAuthStore';
import { getTenantHeaders } from '../../api/endpoints';
import { getTenantId, getBranchId, getBranchSlug } from '../../utils/globalAuth';
import {
  Truck, Car, Clock, Check, Search, Plus, RefreshCw, MoreVertical,
  ChevronLeft, ChevronRight, ChevronFirst, ChevronLast, List, Grid, X,
  Calendar, MapPin, Phone, User, Filter
} from '../../utils/icons/icons';
import BookNewHearseModal from './BookNewHearseModal';
import notify from '../../utils/notify';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://restpoint.co.ke/api/v1/restpoint'
  : (env.FULL_API_URL || 'http://localhost:5000/api/v1/restpoint');

const RESULTS_PER_PAGE = 10;

const STATUS_CONFIG = {
  pending: { label: 'Pending', progress: 10, color: '#f59e0b', bg: '#fef3c7', dotColor: '#f59e0b' },
  booked: { label: 'Booked', progress: 25, color: '#3b82f6', bg: '#dbeafe', dotColor: '#3b82f6' },
  in_transit: { label: 'In Transit', progress: 60, color: '#ec4899', bg: '#fce7f3', dotColor: '#ec4899' },
  completed: { label: 'Completed', progress: 100, color: '#10b981', bg: '#d1fae5', dotColor: '#10b981' },
  cancelled: { label: 'Cancelled', progress: 0, color: '#ef4444', bg: '#fee2e2', dotColor: '#ef4444' },
  postponed: { label: 'Postponed', progress: 15, color: '#f59e0b', bg: '#fef3c7', dotColor: '#f59e0b' },
  maintenance: { label: 'Maintenance', progress: 0, color: '#8b5cf6', bg: '#f3e8ff', dotColor: '#8b5cf6' },
};

const STATUS_LIST = Object.keys(STATUS_CONFIG);

const COLORS = {
  primary: '#1a5f7a',
  primaryLight: '#2c8ac9',
  primaryDark: '#134b5f',
  white: '#FFFFFF',
  bg: '#f5f7fa',
  surface: '#ffffff',
  border: '#d1d5db',
  borderLight: '#e5e7eb',
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  success: '#10b981',
  successLight: '#d1fae5',
  successDark: '#059669',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningDark: '#d97706',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  dangerDark: '#dc2626',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  infoDark: '#2563eb',
  accent: '#3b82f6',
  accentHover: '#2563eb',
  radius: '8px',
  radiusSm: '6px',
  radiusXs: '4px',
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.04)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.06)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.15s ease',
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const formatDateStr = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
const fmtDateOnly = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

const fmtBookingDates = (b) => {
  let dates = [];
  try {
    dates = typeof b?.booking_dates === 'string' ? JSON.parse(b.booking_dates) : (b?.booking_dates || []);
  } catch { dates = []; }
  if (!Array.isArray(dates) || dates.length === 0) {
    const fallback = b?.booking_date || b?.estimated_departure_time || b?.date;
    return fmtDateOnly(fallback);
  }
  const clean = dates.map(d => String(d).slice(0, 10)).sort();
  const first = new Date(clean[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const last = new Date(clean[clean.length - 1] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (clean.length === 1) return first;
  return `${first} – ${last}`;
};

const fmtRoute = (b) => {
  if (b?.from_location && (b?.to_location || b?.destination)) {
    return `${b.from_location} → ${b.to_location || b.destination}`;
  }
  return b?.to_location || b?.destination || 'N/A';
};

const genId = (id, plateNumber) => {
  if (!id) return 'N/A';
  const idStr = id.toString();
  if (idStr.startsWith('BK-')) return idStr;
  const timestamp = Date.now().toString().slice(-6);
  let baseId;
  if (plateNumber) {
    baseId = plateNumber.replace(/[^A-Z0-9]/gi, '').slice(0, 6);
  } else {
    baseId = Math.floor(1000 + Math.random() * 9000).toString();
  }
  return `BK-${baseId}${timestamp}`;
};

const getTenantSlug = () => {
  const direct = localStorage.getItem('tenantSlug') || localStorage.getItem('tenant_slug');
  if (direct && direct !== 'default' && direct !== 'dashboard' && direct !== 'undefined' && direct !== 'null') return direct;
  const parent = localStorage.getItem('parentTenantSlug');
  if (parent && parent !== 'default' && parent !== 'dashboard' && parent !== 'undefined' && parent !== 'null') return parent;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.parentTenantSlug || user.tenantSlug || user.tenant?.slug || '';
  } catch { return ''; }
};

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
  const headers = { 'x-tenant-slug': getTenantSlug() };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const Icons = {
  truck: <Truck size={16} />,
  car: <Car size={16} />,
  search: <Search size={16} />,
  plus: <Plus size={16} />,
  refresh: <RefreshCw size={16} />,
  moreV: <MoreVertical size={16} />,
  clock: <Clock size={16} />,
  check: <Check size={16} />,
  chevLeft: <ChevronLeft size={16} />,
  chevRight: <ChevronRight size={16} />,
  chevFirst: <ChevronFirst size={16} />,
  chevLast: <ChevronLast size={16} />,
  list: <List size={16} />,
  grid: <Grid size={16} />,
  x: <X size={16} />,
  calendar: <Calendar size={16} />,
};

const api = {
  getBookings: async () => {
    const r = await fetch(`${API_BASE_URL}/hearse-bookings?t=${Date.now()}`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Failed');
    return (await r.json()).bookings || [];
  },
  getBranches: async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/tenant/${getTenantSlug()}/branches`, { headers: getAuthHeaders() });
      return r.ok ? (await r.json()).data || [] : [];
    } catch { return []; }
  },
  getAllHearses: async () => {
    const r = await fetch(`${API_BASE_URL}/hearses`, { headers: { ...getTenantHeaders(), ...getAuthHeaders() } });
    return r.ok ? (await r.json()).hearses || [] : [];
  },
  updateStatus: async (id, status, reason) => {
    const h = getAuthHeaders(); h['Content-Type'] = 'application/json';
    const body = { status };
    if (String(status) === 'cancelled') body.cancel_reason = reason || null;
    const r = await fetch(`${API_BASE_URL}/hearse-bookings/${id}/status`, { method: 'PUT', headers: h, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Failed');
    return r.json();
  },
  registerHearse: async (data) => {
    const h = getAuthHeaders(); h['Content-Type'] = 'application/json';
    const r = await fetch(`${API_BASE_URL}/hearses`, { method: 'POST', headers: h, body: JSON.stringify(data) });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || 'Failed to register'); }
    return r.json();
  },
};

/* ===== STYLED COMPONENTS ===== */
const Container = styled.div`
  min-height: 100vh;
  background: ${COLORS.bg};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: ${COLORS.text};
  box-sizing: border-box;
  *, *::before, *::after { box-sizing: border-box; }
`;

const MainContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  @media (max-width: 900px) { padding: 0.75rem; }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const StatCard = styled.div`
  background: ${props => props.$bg || COLORS.surface};
  border-radius: ${COLORS.radiusSm};
  box-shadow: ${COLORS.shadowMd};
  border: none;
  padding: 1rem 1.25rem;
  transition: ${COLORS.transition};
  position: relative;
  overflow: hidden;
  &:hover { transform: translateY(-2px); box-shadow: ${COLORS.shadowLg}; }
`;

const StatHeader = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;`;
const StatLabel = styled.div`font-size:0.75rem;font-weight:700;color:rgba(255,255,255,0.9);text-transform:uppercase;letter-spacing:0.04em;`;
const StatIcon = styled.div`width:32px;height:32px;border-radius:${COLORS.radiusXs};display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.2);color:#ffffff;`;
const StatValue = styled.div`font-size:1.75rem;font-weight:800;color:#ffffff;line-height:1.2;margin-bottom:0.25rem;`;
const StatSubtext = styled.div`font-size:0.7rem;color:rgba(255,255,255,0.8);font-weight:500;`;

const FilterCard = styled.div`
  background: ${COLORS.surface};
  border-radius: ${COLORS.radius};
  box-shadow: ${COLORS.shadowSm};
  border: 1px solid ${COLORS.border};
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: ${props => props.$marginBottom || '0'};
  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    > div, > input, > select, > button { width: 100% !important; min-width: 0 !important; }
  }
`;

const SearchInput = styled.input`
  flex: 0 1 200px;
  min-width: 150px;
  max-width: 200px;
  padding: 0.4rem 0.65rem;
  border: 1px solid ${COLORS.border};
  border-radius: ${COLORS.radiusSm};
  font-size: 0.8125rem;
  color: ${COLORS.text};
  background: ${COLORS.surface};
  transition: ${COLORS.transition};
  &:focus { outline: none; border-color: ${COLORS.primary}; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
  @media (max-width: 900px) { width: 100%; min-width: 0; flex: 1 1 100%; }
`;

const Select = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${COLORS.border};
  border-radius: ${COLORS.radiusSm};
  font-size: 0.8125rem;
  color: ${COLORS.text};
  background: ${COLORS.surface};
  cursor: pointer;
  transition: ${COLORS.transition};
  &:focus { outline: none; border-color: ${COLORS.primary}; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
`;

const TableCard = styled.div`
  background: ${COLORS.surface};
  border-radius: ${COLORS.radius};
  box-shadow: ${COLORS.shadowSm};
  border: 1px solid ${COLORS.border};
  overflow: hidden;
`;

const Table = styled.table`width:100%;border-collapse:collapse;font-size:0.8125rem;min-width:800px;`;
const TableHead = styled.thead`background:${COLORS.bg};border-bottom:1px solid ${COLORS.border};`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${COLORS.border};
  cursor: pointer;
  transition: ${COLORS.transition};
  &:hover { background: ${COLORS.bg}; }
  &:last-child { border-bottom: none; }
`;

const TableCell = styled.td`padding:0.875rem 1rem;color:${COLORS.text};vertical-align:middle;`;

const TableHeader = styled.th`
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: ${COLORS.textSecondary};
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => STATUS_CONFIG[props.$status]?.bg || COLORS.borderLight};
  color: ${props => STATUS_CONFIG[props.$status]?.color || COLORS.textSecondary};
  &::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: ${props => STATUS_CONFIG[props.$status]?.dotColor || COLORS.textMuted};
  }
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  padding: 0.375rem;
  border-radius: ${COLORS.radiusXs};
  transition: ${COLORS.transition};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover { background: ${COLORS.border}; color: ${COLORS.text}; }
`;

const PrimaryButton = styled.button`
  background: ${props => props.$bg || COLORS.primary};
  color: ${COLORS.white};
  border: none;
  border-radius: ${COLORS.radiusSm};
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: ${COLORS.transition};
  box-shadow: ${COLORS.shadowSm};
  white-space: nowrap;
  &:hover { opacity: 0.9; }
  &:disabled { background: ${COLORS.textMuted}; cursor: not-allowed; }
`;

const SecondaryButton = styled.button`
  background: ${COLORS.surface};
  color: ${COLORS.text};
  border: 1px solid ${COLORS.border};
  border-radius: ${COLORS.radiusSm};
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: ${COLORS.transition};
  white-space: nowrap;
  &:hover { background: ${COLORS.bg}; }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: ${COLORS.textSecondary};
  svg { width: 3rem; height: 3rem; margin-bottom: 1rem; opacity: 0.4; }
  h4 { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem; color: ${COLORS.text}; }
  p { font-size: 0.8125rem; margin: 0; color: ${COLORS.textSecondary}; }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid ${COLORS.border};
  flex-wrap: wrap;
  gap: 0.5rem;
  @media (max-width: 900px) { justify-content: center; }
`;

const PageInfo = styled.span`font-size:0.8rem;color:${COLORS.textSecondary};`;
const PageButtons = styled.div`display:flex;gap:0.25rem;align-items:center;flex-wrap:wrap;justify-content:center;`;

const PageButton = styled.button`
  width: 32px; height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  background: ${COLORS.surface};
  color: ${COLORS.textSecondary};
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${COLORS.transition};
  &:hover:not(:disabled) { background: ${COLORS.bg}; border-color: ${COLORS.primary}; color: ${COLORS.primary}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  ${props => props.$active && `background:${COLORS.primary};color:${COLORS.white};border-color:${COLORS.primary};`}
`;

const DrawerOverlay = styled.div`position:fixed;inset:0;background:rgba(15,23,42,0.5);z-index:9998;animation:${fadeIn}0.12s ease-out;backdrop-filter:blur(3px);`;

const Drawer = styled.div`
  position:fixed;top:0;right:0;bottom:0;
  width:${props => props.$w || '480px'};max-width:100%;
  background:${COLORS.surface};
  box-shadow:-12px 0 36px rgba(17,24,39,0.18);
  z-index:9999;
  transform:translateX(${props => props.$open ? '0' : '100%'});
  transition:transform 0.28s cubic-bezier(0.4,0,0.2,1);
  display:flex;flex-direction:column;
  @media(max-width:900px){width:100%}
`;

const DrawerHeader = styled.div`
  padding:1.1rem 1.25rem;
  background:linear-gradient(135deg,${COLORS.primaryDark},${COLORS.primary});
  display:flex;justify-content:space-between;align-items:center;gap:0.5rem;
  flex-shrink:0;
`;
const DrawerTitle = styled.h2`font-size:1.0625rem;font-weight:700;margin:0;color:#FFFFFF;letter-spacing:0.01em;`;
const DrawerSubtitle = styled.p`
  display:inline-block;margin:0.5rem 0 0;
  padding:0.22rem 0.6rem;border-radius:99px;
  background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.22);
  font-size:0.72rem;font-weight:700;letter-spacing:0.05em;color:rgba(255,255,255,0.95);
`;
const DrawerClose = styled.button`
  width:30px;height:30px;flex-shrink:0;
  border:none;border-radius:8px;cursor:pointer;
  background:rgba(255,255,255,0.16);color:#FFFFFF;
  display:inline-flex;align-items:center;justify-content:center;
  transition:background 0.15s ease;
  &:hover{background:rgba(255,255,255,0.3);}
`;
const DrawerBody = styled.div`
  flex:1;overflow-y:auto;padding:1.25rem;-webkit-overflow-scrolling:touch;
  &::-webkit-scrollbar{width:5px}
  &::-webkit-scrollbar-thumb{background:${COLORS.borderLight};border-radius:99px}
`;

/* Status banner */
const StatusStrip = styled.div`
  display:flex;align-items:center;gap:0.5rem;
  padding:0.7rem 0.95rem;border-radius:${COLORS.radiusSm};
  background:${props => STATUS_CONFIG[props.$status]?.bg || COLORS.borderLight};
  border:1px solid ${props => (STATUS_CONFIG[props.$status]?.dotColor || COLORS.borderLight) + '55'};
  margin-bottom:0.35rem;
  .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${props => STATUS_CONFIG[props.$status]?.dotColor || COLORS.textMuted};}
  .lbl{font-size:0.875rem;font-weight:700;color:${props => STATUS_CONFIG[props.$status]?.color || COLORS.text};}
  .cap{margin-left:auto;font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${props => STATUS_CONFIG[props.$status]?.color || COLORS.textSecondary};opacity:0.7;}
`;

/* Booking details — clean text rows (no boxes) */
const DetailGrid = styled.div`
  display:flex;
  flex-direction:column;
  margin:0.55rem 0 1.25rem;
`;

const DetailItem = styled.div`
  display:flex;
  flex-direction:column;
  gap:0.2rem;
  padding:0.65rem 0;
  border-bottom:1px solid ${COLORS.borderLight};
  &:last-child{border-bottom:none;padding-bottom:0.35rem;}
`;

const DetailLabel = styled.div`
  font-size:0.6875rem;
  font-weight:700;
  color:${COLORS.textMuted};
  text-transform:uppercase;
  letter-spacing:0.06em;
`;

const DetailValue = styled.div`
  font-size:0.9375rem;
  font-weight:600;
  color:${COLORS.text};
  line-height:1.45;
  word-break:break-word;
  & > div{font-weight:400;color:${COLORS.textSecondary};}
`;

const ModalOverlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);padding:1rem;`;
const ModalBox = styled.div`background:${COLORS.white};border-radius:${COLORS.radius};width:460px;max-width:100%;max-height:90vh;overflow:auto;box-shadow:0 20px 40px rgba(0,0,0,0.15);animation:${fadeIn}0.15s ease-out;`;
const ModalHead = styled.div`padding:1rem 1.25rem;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,${COLORS.primaryDark},${COLORS.primary});border-radius:${COLORS.radius} ${COLORS.radius} 0 0;`;
const ModalBody = styled.div`padding:1.25rem;`;
const ModalFoot = styled.div`display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;border-top:1px solid ${COLORS.border};padding-top:1rem;`;
const ModalInput = styled.input`width:100%;padding:0.5rem 0.75rem;border:1px solid ${COLORS.border};border-radius:${COLORS.radiusSm};font-size:0.8125rem;color:${COLORS.text};background:${COLORS.white};outline:none;box-sizing:border-box;&::placeholder{color:${COLORS.textMuted}}&:focus{border-color:${COLORS.primaryLight};box-shadow:0 0 0 2px rgba(44,138,201,0.1);}`;
const ModalLabel = styled.label`display:block;font-weight:600;margin-bottom:0.35rem;font-size:0.78rem;color:${COLORS.text};`;

const ActionMenu = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: ${COLORS.radiusSm};
  box-shadow: ${COLORS.shadowLg};
  z-index: 50;
  min-width: 160px;
  overflow: hidden;
`;

const ActionMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  color: ${COLORS.text};
  font-size: 0.78rem;
  cursor: pointer;
  transition: ${COLORS.transition};
  text-align: left;
  &:hover { background: ${COLORS.bg}; }
`;

// ═════════════════════════════════════════════════════════════════════════════════════

const HearseBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [allHearses, setAllHearses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(formatDateStr(new Date()));
  const [timelineDate, setTimelineDate] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [newBookingInitialDates, setNewBookingInitialDates] = useState([]);

  const [actionMenuId, setActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);
  const [dateFilter, setDateFilter] = useState('all');

  // Register hearse
  const [registerHearseOpen, setRegisterHearseOpen] = useState(false);
  const [hearseForm, setHearseForm] = useState({ plate_number: '', hearse_name: '', model: '', capacity: '8', status: 'available', branch_code: '' });
  const [registerLoading, setRegisterLoading] = useState(false);

  // Cancel modal
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const { socket } = useSocket();
  const { user } = useAuthStore();

  const getDateRange = useCallback((filter) => {
    const today = new Date();
    const ts = formatDateStr(today);

    switch (filter) {
      case 'today':
        return { start: ts, end: ts };
      case 'tomorrow': {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        const s = formatDateStr(d);
        return { start: s, end: s };
      }
      case 'thisWeek': {
        const dow = today.getDay();
        const mon = new Date(today);
        mon.setDate(today.getDate() - ((dow + 6) % 7));
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        return { start: formatDateStr(mon), end: formatDateStr(sun) };
      }
      case 'nextWeek': {
        const dow = today.getDay();
        const nm = new Date(today);
        nm.setDate(today.getDate() + (7 - ((dow + 6) % 7)));
        const ns = new Date(nm);
        ns.setDate(nm.getDate() + 6);
        return { start: formatDateStr(nm), end: formatDateStr(ns) };
      }
      case 'thisMonth':
        return {
          start: formatDateStr(new Date(today.getFullYear(), today.getMonth(), 1)),
          end: formatDateStr(new Date(today.getFullYear(), today.getMonth() + 1, 0))
        };
      case 'nextMonth': {
        const nm = today.getMonth() + 1;
        const y = nm > 11 ? today.getFullYear() + 1 : today.getFullYear();
        const m = nm > 11 ? 0 : nm;
        return {
          start: formatDateStr(new Date(y, m, 1)),
          end: formatDateStr(new Date(y, m + 1, 0))
        };
      }
      default:
        return { start: null, end: null };
    }
  }, []);

  const handleDateFilter = useCallback((f) => { setDateFilter(f); setCurrentPage(1); }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bks, brs, hrs] = await Promise.all([api.getBookings(), api.getBranches(), api.getAllHearses()]);
      setBookings(bks); setBranches(brs); setAllHearses(hrs);
    } catch (e) { notify.error('Failed to load data'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_booking', (d) => {
      if (d.booking) {
        setBookings(p => [d.booking, ...p]);
        const code = d.booking_code || `BK-${d.booking_id}`;
        notify.success(`New booking: ${code} - ${d.booking_client_name || 'Client'}`);
      }
    });
    socket.on('booking_status_updated', (d) => {
      setBookings(p => p.map(b => b.booking_id === d.booking_id ? { ...b, status: d.status, ...d.booking } : b));
    });
    socket.on('booking_postponed', () => loadData());
    return () => { socket.off('new_booking'); socket.off('booking_status_updated'); socket.off('booking_postponed'); };
  }, [socket, loadData]);

  const filtered = useMemo(() => {
    let result = [...bookings];
    if (filterStatus) result = result.filter(b => b.status === filterStatus);
    if (filterBranch) result = result.filter(b => String(b.branch_id) === String(filterBranch));
    if (dateFilter !== 'all') {
      const range = getDateRange(dateFilter);
      if (range.start && range.end) {
        result = result.filter(b => {
          let dates = [];
          try { dates = typeof b.booking_dates === 'string' ? JSON.parse(b.booking_dates) : (b.booking_dates || []); } catch { dates = []; }
          if (dates.length === 0 && b.booking_date) dates = [String(b.booking_date).slice(0, 10)];
          if (dates.length === 0 && b.estimated_departure_time) dates = [String(b.estimated_departure_time).slice(0, 10)];
          return dates.some(d => d >= range.start && d <= range.end);
        });
      }
    }
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      result = result.filter(b =>
        (b.client_name || '').toLowerCase().includes(q) ||
        (b.booking_code || genId(b.booking_id) || '').toLowerCase().includes(q) ||
        (b.destination || '').toLowerCase().includes(q) ||
        (b.from_location || b.from || '').toLowerCase().includes(q) ||
        (b.to_location || '').toLowerCase().includes(q) ||
        (b.hearse_name || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [bookings, filterStatus, filterBranch, dateFilter, getDateRange, searchInput]);

  // FIX: missing closing paren for Math.max(1, Math.ceil(...))
  const totalPages = Math.max(1, Math.ceil(filtered.length / RESULTS_PER_PAGE));
  const pageData = filtered.slice((currentPage - 1) * RESULTS_PER_PAGE, currentPage * RESULTS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [filterStatus, filterBranch, dateFilter, searchInput]);

  useEffect(() => {
    const handler = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) setActionMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending' || b.status === 'booked').length;
    const inProgress = bookings.filter(b => b.status === 'in_transit').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const active = bookings.filter(b => !['completed', 'cancelled'].includes(b.status)).length;
    return { total, pending, inProgress, completed, active };
  }, [bookings]);

  const openDrawer = useCallback((b) => { setSelectedBooking(b); setDrawerOpen(true); setActionMenuId(null); }, []);
  const closeDrawer = useCallback(() => { setDrawerOpen(false); setSelectedBooking(null); }, []);

  const changeStatus = useCallback(async (id, status, reason) => {
    try {
      await api.updateStatus(id, status, reason);
      setBookings(p => p.map(b => String(b.booking_id ?? b.id) === String(id)
        ? { ...b, status, ...(status === 'cancelled' ? { cancel_reason: reason || null } : {}) }
        : b));
      if (selectedBooking && String(selectedBooking.booking_id ?? selectedBooking.id) === String(id)) {
        setSelectedBooking(p => ({ ...p, status, ...(status === 'cancelled' ? { cancel_reason: reason || null } : {}) }));
      }
      notify.success(`Status → ${STATUS_CONFIG[status]?.label || status}`);
      setActionMenuId(null);
    } catch { notify.error('Failed to update'); }
  }, [selectedBooking]);

  const openCancelModal = useCallback((b) => {
    setCancelBooking(b);
    setCancelReason(b?.cancel_reason || '');
    setActionMenuId(null);
  }, []);

  // FIX: missing closeCancelModal function — now defined
  const closeCancelModal = useCallback(() => {
    setCancelBooking(null);
    setCancelReason('');
  }, []);

  const confirmCancel = useCallback(async () => {
    if (!cancelBooking) return;
    if (!cancelReason.trim()) { notify.error('Please enter a cancel reason'); return; }
    setCancelLoading(true);
    await changeStatus(cancelBooking.booking_id || cancelBooking.id, 'cancelled', cancelReason.trim());
    setCancelLoading(false);
    closeCancelModal();
  }, [cancelBooking, cancelReason, changeStatus, closeCancelModal]);

  const openNewBooking = useCallback((date) => {
    const initialDates = date ? [date] : [];
    setNewBookingInitialDates(initialDates);
    setNewBookingOpen(true);
  }, []);

  const closeNewBooking = useCallback(() => {
    setNewBookingOpen(false);
    setNewBookingInitialDates([]);
  }, []);

  const onCreateBooking = useCallback((dates) => {
    if (!dates || dates.length === 0) return;
    setNewBookingInitialDates(dates);
    setNewBookingOpen(true);
  }, []);

  const handleRegisterHearse = async (e) => {
    e.preventDefault();
    if (!hearseForm.plate_number.trim() || !hearseForm.hearse_name.trim()) {
      notify.error('Plate number and name are required');
      return;
    }
    setRegisterLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const u = userStr ? JSON.parse(userStr) : {};
      const dbName = u?.dbName || u?.branchDbName || '';
      await api.registerHearse({
        ...hearseForm,
        branch_id: u?.branch_id || '',
        branch_code: dbName.split('-').pop() || hearseForm.branch_code || '',
      });
      notify.success('Hearse registered successfully!');
      setRegisterHearseOpen(false);
      setHearseForm({ plate_number: '', hearse_name: '', model: '', capacity: '8', status: 'available', branch_code: '' });
      await loadData();
    } catch (err) { notify.error('Failed: ' + err.message); }
    setRegisterLoading(false);
  };

  const calendarItems = useMemo(() => {
    const items = [];
    bookings.forEach(b => {
      let bookingDates = [];
      try {
        bookingDates = typeof b.booking_dates === 'string' ? JSON.parse(b.booking_dates) : (b.booking_dates || []);
      } catch {
        const fallback = b.booking_date || b.estimated_departure_time;
        if (fallback) bookingDates = [formatDateStr(fallback)];
      }
      bookingDates.forEach((dateStr) => {
        items.push({ ...b, date: String(dateStr).slice(0, 10) });
      });
    });
    return items;
  }, [bookings]);

  const renderPagination = () => {
    const btns = [];
    btns.push(
      <PageButton key="first" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>{Icons.chevFirst}</PageButton>,
      <PageButton key="prev" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>{Icons.chevLeft}</PageButton>
    );
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
        if (i === 3 || i === totalPages - 2) {
          btns.push(<span key={`dots-${i}`} style={{ padding: '0 0.25rem', color: COLORS.textMuted, fontSize: '0.8rem' }}>…</span>);
        }
        continue;
      }
      btns.push(<PageButton key={i} onClick={() => setCurrentPage(i)} $active={currentPage === i}>{i}</PageButton>);
    }
    btns.push(
      <PageButton key="next" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>{Icons.chevRight}</PageButton>,
      <PageButton key="last" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>{Icons.chevLast}</PageButton>
    );
    return btns;
  };

  if (loading) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <RefreshCw size={32} color={COLORS.primary} className="animate-spin" />
      </Container>
    );
  }

  const branchOptions = branches.length > 0 ? branches : [];

  return (
    <Container>
      <MainContent>
        {/* Stats Cards */}
        <StatsGrid>
          <StatCard $bg="#1e3a8a">
            <StatHeader><StatLabel>Total Bookings</StatLabel><StatIcon>{Icons.truck}</StatIcon></StatHeader>
            <StatValue>{stats.total}</StatValue><StatSubtext>All time</StatSubtext>
          </StatCard>
          <StatCard $bg="#0f766e">
            <StatHeader><StatLabel>Active</StatLabel><StatIcon>{Icons.car}</StatIcon></StatHeader>
            <StatValue>{stats.active}</StatValue><StatSubtext>In progress</StatSubtext>
          </StatCard>
          <StatCard $bg="#d97706">
            <StatHeader><StatLabel>Pending</StatLabel><StatIcon>{Icons.clock}</StatIcon></StatHeader>
            <StatValue>{stats.pending}</StatValue><StatSubtext>Needs attention</StatSubtext>
          </StatCard>
          <StatCard $bg="#be185d">
            <StatHeader><StatLabel>In Transit</StatLabel><StatIcon>{Icons.truck}</StatIcon></StatHeader>
            <StatValue>{stats.inProgress}</StatValue><StatSubtext>On the road</StatSubtext>
          </StatCard>
          <StatCard $bg="#15803d">
            <StatHeader><StatLabel>Completed</StatLabel><StatIcon>{Icons.check}</StatIcon></StatHeader>
            <StatValue>{stats.completed}</StatValue><StatSubtext>Delivered</StatSubtext>
          </StatCard>
        </StatsGrid>

        {/* Filter Bar */}
        <FilterCard>
          <FilterRow>
            <SearchInput
              type="text"
              placeholder="Search client, ID, destination..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
              <option value="">All Branches</option>
              {branchOptions.map((b) => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
              {branchOptions.length === 0 && <option value="">No branches</option>}
            </Select>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUS_LIST.map((status) => <option key={status} value={status}>{STATUS_CONFIG[status]?.label || status}</option>)}
            </Select>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <ActionButton
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? COLORS.primary : COLORS.surface,
                  color: viewMode === 'table' ? COLORS.white : COLORS.textSecondary
                }}
              >{Icons.list}</ActionButton>
              <ActionButton
                onClick={() => setViewMode('calendar')}
                style={{
                  background: viewMode === 'calendar' ? COLORS.primary : COLORS.surface,
                  color: viewMode === 'calendar' ? COLORS.white : COLORS.textSecondary
                }}
              >{Icons.grid}</ActionButton>
            </div>

            <SecondaryButton onClick={loadData} style={{ marginLeft: 'auto' }}>{Icons.refresh} Refresh</SecondaryButton>
            <PrimaryButton onClick={() => openNewBooking('')}>{Icons.plus} Book Hearse</PrimaryButton>
            <PrimaryButton onClick={() => setRegisterHearseOpen(true)} $bg={COLORS.success}>{Icons.plus} Register Hearse</PrimaryButton>
          </FilterRow>
        </FilterCard>

        {/* Main Content Area */}
        <TableCard>
          {viewMode === 'table' && (
            <>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeader>Booking ID</TableHeader>
                      <TableHeader>Client</TableHeader>
                      <TableHeader>Route</TableHeader>
                      <TableHeader>Hearse</TableHeader>
                      <TableHeader>Branch</TableHeader>
                      <TableHeader>Dates</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </tr>
                  </TableHead>
                  <tbody>
                    {pageData.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <EmptyState>
                            <Truck />
                            <h4>No bookings found</h4>
                            <p>Try adjusting your filters or create a new booking.</p>
                          </EmptyState>
                        </td>
                      </tr>
                    ) : (
                      pageData.map((b) => {
                        const bid = b.booking_id || b.id;
                        const code = b.booking_code || genId(bid, b.plate_number);
                        return (
                          <TableRow key={bid} onClick={() => openDrawer(b)}>
                            <TableCell>
                              <span style={{ fontWeight: 600, color: COLORS.primary, fontSize: '0.78rem' }}>{code}</span>
                            </TableCell>
                            <TableCell>
                              <div style={{ fontWeight: 500 }}>{b.client_name || 'N/A'}</div>
                              {b.client_phone && (
                                <div style={{ fontSize: '0.72rem', color: COLORS.textMuted }}>{b.client_phone}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div style={{ fontSize: '0.78rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtRoute(b)}</div>
                            </TableCell>
                            <TableCell>
                              <div style={{ fontSize: '0.78rem' }}>{b.hearse_name || 'N/A'}</div>
                              {b.plate_number && <div style={{ fontSize: '0.68rem', color: COLORS.textMuted }}>{b.plate_number}</div>}
                            </TableCell>
                            <TableCell><div style={{ fontSize: '0.78rem' }}>{b.branch_name || 'N/A'}</div></TableCell>
                            <TableCell><div style={{ fontSize: '0.78rem' }}>{fmtBookingDates(b)}</div></TableCell>
                            <TableCell>
                              <StatusBadge $status={b.status}>{STATUS_CONFIG[b.status]?.label || b.status}</StatusBadge>
                            </TableCell>
                            <TableCell>
                              <div style={{ position: 'relative' }} ref={actionMenuRef}>
                                <ActionButton onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuId(actionMenuId === bid ? null : bid);
                                }}>{Icons.moreV}</ActionButton>
                                {actionMenuId === bid && (
                                  <ActionMenu onClick={(e) => e.stopPropagation()}>
                                    {b.status === 'booked' && (
                                      <ActionMenuItem onClick={() => changeStatus(bid, 'in_transit')}>{Icons.truck} Mark In Transit</ActionMenuItem>
                                    )}
                                    {b.status === 'in_transit' && (
                                      <ActionMenuItem onClick={() => changeStatus(bid, 'completed')}>{Icons.check} Mark Completed</ActionMenuItem>
                                    )}
                                    {(b.status === 'booked' || b.status === 'pending') && (
                                      <ActionMenuItem onClick={() => changeStatus(bid, 'postponed')}>{Icons.clock} Postpone</ActionMenuItem>
                                    )}
                                    {!['completed', 'cancelled'].includes(b.status) && (
                                      <ActionMenuItem onClick={() => openCancelModal(b)} style={{ color: COLORS.danger }}>
                                        {Icons.x} Cancel
                                      </ActionMenuItem>
                                    )}
                                  </ActionMenu>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
              <Pagination>
                <PageInfo>
                  Showing {(currentPage - 1) * RESULTS_PER_PAGE + 1}–{Math.min(currentPage * RESULTS_PER_PAGE, filtered.length)} of {filtered.length}
                </PageInfo>
                <PageButtons>{renderPagination()}</PageButtons>
              </Pagination>
            </>
          )}

          {viewMode === 'calendar' && (
            <HearseCalendar
              bookings={filtered}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onDateClick={(date) => { setSelectedDate(date); setTimelineDate(date); }}
              onItemClick={openDrawer}
              onCreateBooking={onCreateBooking}
            />
          )}

          {/* Timeline */}
          {timelineDate && (
            <div style={{ marginTop: '1rem' }}>
              <DayTimeline
                date={timelineDate}
                bookings={calendarItems.filter(i => i.date === String(timelineDate).slice(0, 10))}
                onClose={() => setTimelineDate(null)}
                onItemClick={openDrawer}
              />
            </div>
          )}
        </TableCard>
      </MainContent>

      {/* ─── Detail Drawer ─── */}
      {drawerOpen && <DrawerOverlay onClick={closeDrawer} />}
      <Drawer $open={drawerOpen} $w="520px">
        <DrawerHeader>
          <div>
            <DrawerTitle>Booking Details</DrawerTitle>
            {selectedBooking && (
              <DrawerSubtitle>{selectedBooking.booking_code || genId(selectedBooking.booking_id)}</DrawerSubtitle>
            )}
          </div>
          <DrawerClose onClick={closeDrawer} aria-label="Close">{Icons.x}</DrawerClose>
        </DrawerHeader>
        <DrawerBody>
          {selectedBooking && (
            <>
              <StatusStrip $status={selectedBooking.status}>
                <span className="dot" />
                <span className="lbl">{STATUS_CONFIG[selectedBooking.status]?.label || selectedBooking.status}</span>
                <span className="cap">Current status</span>
              </StatusStrip>

              <DetailGrid>
                <DetailItem>
                  <DetailLabel>Client</DetailLabel>
                  <DetailValue>
                    {selectedBooking.client_name || 'N/A'}
                    {selectedBooking.client_phone && (
                      <div style={{ fontSize: '0.78rem', color: COLORS.textMuted, marginTop: '0.15rem' }}>
                        {selectedBooking.client_phone}
                      </div>
                    )}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Route</DetailLabel>
                  <DetailValue>{fmtRoute(selectedBooking)}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Dates</DetailLabel>
                  <DetailValue>{fmtBookingDates(selectedBooking)}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Hearse</DetailLabel>
                  <DetailValue>
                    {selectedBooking.hearse_name || 'N/A'}
                    {selectedBooking.plate_number && (
                      <div style={{ fontSize: '0.78rem', color: COLORS.textMuted, marginTop: '0.15rem' }}>
                        {selectedBooking.plate_number}
                      </div>
                    )}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Branch</DetailLabel>
                  <DetailValue>{selectedBooking.branch_name || 'N/A'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Booked By</DetailLabel>
                  <DetailValue>{selectedBooking.booked_by || 'System'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Created</DetailLabel>
                  <DetailValue>{fmtDate(selectedBooking.created_at)}</DetailValue>
                </DetailItem>
                {selectedBooking.cancel_reason && (
                  <DetailItem style={{ gridColumn: '1 / -1' }}>
                    <DetailLabel>Cancel Reason</DetailLabel>
                    <DetailValue style={{ color: COLORS.danger }}>{selectedBooking.cancel_reason}</DetailValue>
                  </DetailItem>
                )}
              </DetailGrid>

              {!['completed', 'cancelled'].includes(selectedBooking.status) && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedBooking.status === 'booked' && (
                    <PrimaryButton onClick={() => { changeStatus(selectedBooking.booking_id || selectedBooking.id, 'in_transit'); closeDrawer(); }}>
                      {Icons.truck} Mark In Transit
                    </PrimaryButton>
                  )}
                  {selectedBooking.status === 'in_transit' && (
                    <PrimaryButton onClick={() => { changeStatus(selectedBooking.booking_id || selectedBooking.id, 'completed'); closeDrawer(); }}>
                      {Icons.check} Mark Completed
                    </PrimaryButton>
                  )}
                  <SecondaryButton
                    onClick={() => { openCancelModal(selectedBooking); closeDrawer(); }}
                    style={{ color: COLORS.danger, borderColor: COLORS.dangerLight }}
                  >
                    {Icons.x} Cancel Booking
                  </SecondaryButton>
                </div>
              )}
            </>
          )}
        </DrawerBody>
      </Drawer>

      {/* ─── Register Hearse Modal ─── */}
      {registerHearseOpen && (
        <ModalOverlay onClick={() => setRegisterHearseOpen(false)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Register New Hearse</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Add a new vehicle to the fleet</div>
              </div>
              <button
                style={{
                  width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.12)',
                  border: 'none', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onClick={() => setRegisterHearseOpen(false)}
              ><X size={14} /></button>
            </ModalHead>
            <ModalBody>
              <form onSubmit={handleRegisterHearse}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <ModalLabel>Plate Number *</ModalLabel>
                    <ModalInput placeholder="KAB 123A" value={hearseForm.plate_number}
                      onChange={e => setHearseForm(p => ({ ...p, plate_number: e.target.value }))} required />
                  </div>
                  <div>
                    <ModalLabel>Hearse Name *</ModalLabel>
                    <ModalInput placeholder="e.g., Mercedes E-Class" value={hearseForm.hearse_name}
                      onChange={e => setHearseForm(p => ({ ...p, hearse_name: e.target.value }))} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <ModalLabel>Model</ModalLabel>
                    <ModalInput placeholder="e.g., E-Class" value={hearseForm.model}
                      onChange={e => setHearseForm(p => ({ ...p, model: e.target.value }))} />
                  </div>
                  <div>
                    <ModalLabel>Capacity (seats)</ModalLabel>
                    <ModalInput type="number" min="1" value={hearseForm.capacity}
                      onChange={e => setHearseForm(p => ({ ...p, capacity: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <ModalLabel>Status</ModalLabel>
                  <Select value={hearseForm.status} onChange={e => setHearseForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%' }}>
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
                <ModalFoot>
                  <SecondaryButton type="button" onClick={() => setRegisterHearseOpen(false)}>Cancel</SecondaryButton>
                  <PrimaryButton type="submit" disabled={registerLoading}>
                    {registerLoading ? 'Registering...' : 'Register Hearse'}
                  </PrimaryButton>
                </ModalFoot>
              </form>
            </ModalBody>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* ─── Cancel Modal ─── */}
      {cancelBooking && (
        <ModalOverlay onClick={closeCancelModal}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Cancel Booking</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                  {cancelBooking.booking_code || genId(cancelBooking.booking_id)}
                </div>
              </div>
              <button
                style={{
                  width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.12)',
                  border: 'none', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onClick={closeCancelModal}
              ><X size={14} /></button>
            </ModalHead>
            <ModalBody>
              <p style={{ fontSize: '0.82rem', color: COLORS.textSecondary, marginBottom: '0.75rem' }}>
                Please provide a reason for cancelling this booking.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancel reason..."
                rows={3}
                style={{
                  width: '100%', padding: '0.5rem 0.75rem',
                  border: '1px solid ' + COLORS.border, borderRadius: COLORS.radiusSm,
                  fontSize: '0.8125rem', color: COLORS.text, background: COLORS.white,
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit'
                }}
              />
              <ModalFoot>
                <SecondaryButton type="button" onClick={closeCancelModal}>Back</SecondaryButton>
                <PrimaryButton
                  type="button"
                  onClick={confirmCancel}
                  disabled={cancelLoading || !cancelReason.trim()}
                  $bg={COLORS.danger}
                >
                  {cancelLoading ? 'Cancelling...' : 'Confirm Cancel'}
                </PrimaryButton>
              </ModalFoot>
            </ModalBody>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* ─── New Booking Modal ─── */}
      {newBookingOpen && (
        <BookNewHearseModal
          open={newBookingOpen}
          initialDates={newBookingInitialDates}
          hearses={allHearses}
          branches={branches}
          showToast={(msg, type) => { if (type === 'success') notify.success(msg); else notify.error(msg); }}
          onClose={closeNewBooking}
          onCreated={loadData}
        />
      )}
    </Container>
  );
};

export default HearseBookings;