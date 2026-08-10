import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSocket } from '../../utils/context/socketContext';
import env from '../../utils/config/env';
import HearseCalendar from './HearseCalendar';
import useAuthStore from '../../utils/store/useAuthStore';
import { Truck, Car, Clock, Check, Search, Plus, RefreshCw, MoreVertical, ChevronLeft, ChevronRight, ChevronFirst, ChevronLast, List, Grid, X, Calendar, MapPin, Phone, User, Filter } from '../../utils/icons/icons';

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
// Parse booking_dates (JSON array string or array) into a compact display, e.g.
// "Aug 10, 2026" for a single date or "Aug 10 – Aug 12, 2026" for multi-day.
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
// Route display: "Nairobi → Karen Memorial Park" (from / to separate fields).
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
    const r = await fetch(`${API_BASE_URL}/hearses`, { headers: getAuthHeaders() });
    return r.ok ? (await r.json()).hearses || [] : [];
  },
  updateStatus: async (id, status) => {
    const h = getAuthHeaders(); h['Content-Type'] = 'application/json';
    const r = await fetch(`${API_BASE_URL}/hearse-bookings/${id}/status`, { method: 'PUT', headers: h, body: JSON.stringify({ status }) });
    if (!r.ok) throw new Error('Failed');
    return r.json();
  },
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: ${COLORS.bg};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: ${COLORS.text};
  box-sizing: border-box;
  *, *::before, *::after {
    box-sizing: border-box;
  }
`;

const Header = styled.div`
  background: ${COLORS.surface};
  border-bottom: 1px solid ${COLORS.border};
  padding: 1rem 1.25rem;
  box-shadow: ${COLORS.shadowSm};
`;

const HeaderContent = styled.div`

  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Title = styled.h1`
  font-size: 1.375rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: ${COLORS.text};

  @media (max-width: 900px) {
    font-size: 1.25rem;
  }
`;

const LiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${COLORS.successLight};
  color: ${COLORS.successDark};
  margin-left: 0.75rem;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${COLORS.success};
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    flex-direction: column;
    width: 100%;
    
    button {
      width: 100%;
      justify-content: center;
    }
  }
`;

const PrimaryButton = styled.button`
  background: ${COLORS.primary};
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

  &:hover {
    background: ${COLORS.primaryDark};
    transform: translateY(-1px);
    box-shadow: ${COLORS.shadowMd};
  }

  &:disabled {
    background: ${COLORS.textMuted};
    cursor: not-allowed;
    transform: none;
  }
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

  &:hover {
    background: ${COLORS.bg};
    border-color: ${COLORS.textSecondary};
  }
`;

const MainContent = styled.div`

  margin: 0 auto;
  padding: 1rem;

  @media (max-width: 900px) {
    padding: 0.75rem;
  }
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

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${COLORS.shadowLg};
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const StatIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${COLORS.radiusXs};
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
  margin-bottom: 0.25rem;
`;

const StatSubtext = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
`;

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
    
    > div, > input, > select {
      width: 100% !important;
      min-width: 0 !important;
    }
  }
`;

const SearchInput = styled.input`
  flex: 1;
  max-width: 50%; 
  padding: 0.5rem 0.75rem;
  border: 1px solid ${COLORS.border};
  border-radius: ${COLORS.radiusSm};
  font-size: 0.8125rem;
  color: ${COLORS.text};
  background: ${COLORS.surface};
  transition: ${COLORS.transition};

  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px ${COLORS.accentGlow || 'rgba(59, 130, 246, 0.1)'};
  }

  @media (max-width: 900px) {
    width: 100%;
    min-width: 0;
  }
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

  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px ${COLORS.accentGlow || 'rgba(59, 130, 246, 0.1)'};
  }
`;

const PillGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
`;

const Pill = styled.button`
  padding: 0.375rem 0.75rem;
  border: 1px solid ${COLORS.border};
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${COLORS.transition};
  background: ${COLORS.surface};
  color: ${COLORS.textSecondary};

  &:hover {
    background: ${COLORS.bg};
    border-color: ${COLORS.primary};
    color: ${COLORS.primary};
  }

  ${props => props.$active && `
    background: ${COLORS.primary};
    color: ${COLORS.white};
    border-color: ${COLORS.primary};
  `}
`;

const TableCard = styled.div`
  background: ${COLORS.surface};
  border-radius: ${COLORS.radius};
  box-shadow: ${COLORS.shadowSm};
  border: 1px solid ${COLORS.border};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  min-width: 800px;
`;

const TableHead = styled.thead`
  background: ${COLORS.bg};
  border-bottom: 1px solid ${COLORS.border};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${COLORS.border};
  cursor: pointer;
  transition: ${COLORS.transition};

  &:hover {
    background: ${COLORS.bg};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 0.875rem 1rem;
  color: ${COLORS.text};
  vertical-align: middle;
`;

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
  background: ${props => {
    const cfg = STATUS_CONFIG[props.$status];
    return cfg ? cfg.bg : COLORS.borderLight;
  }};
  color: ${props => {
    const cfg = STATUS_CONFIG[props.$status];
    return cfg ? cfg.color : COLORS.textSecondary;
  }};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => {
    const cfg = STATUS_CONFIG[props.$status];
    return cfg ? cfg.dotColor : COLORS.textMuted;
  }};
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

  &:hover {
    background: ${COLORS.border};
    color: ${COLORS.text};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: ${COLORS.textSecondary};

  svg {
    width: 3rem;
    height: 3rem;
    margin-bottom: 1rem;
    opacity: 0.4;
  }

  h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
    color: ${COLORS.text};
  }

  p {
    font-size: 0.8125rem;
    margin: 0;
    color: ${COLORS.textSecondary};
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid ${COLORS.border};
  flex-wrap: wrap;
  gap: 0.5rem;

  @media (max-width: 900px) {
    justify-content: center;
  }
`;

const PageInfo = styled.span`
  font-size: 0.8rem;
  color: ${COLORS.textSecondary};
`;

const PageButtons = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
`;

const PageButton = styled.button`
  width: 32px;
  height: 32px;
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

  &:hover:not(:disabled) {
    background: ${COLORS.bg};
    border-color: ${COLORS.primary};
    color: ${COLORS.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${props => props.$active && `
    background: ${COLORS.primary};
    color: ${COLORS.white};
    border-color: ${COLORS.primary};
  `}
`;

const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9998;
  animation: ${fadeIn} 0.12s ease-out;
  backdrop-filter: blur(3px);
`;

const Drawer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: ${props => props.$w || '480px'};
  max-width: 100%;
  background: ${COLORS.surface};
  box-shadow: ${COLORS.shadowLg};
  z-index: 9999;
  transform: translateX(${props => props.$open ? '0' : '100%'});
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;

  @media (max-width: 900px) {
    width: 100%;
  }
`;

const DrawerHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${COLORS.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${COLORS.bg};
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const DrawerTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: ${COLORS.text};
`;

const DrawerSubtitle = styled.p`
  font-size: 0.8125rem;
  color: ${COLORS.textSecondary};
  margin: 0.25rem 0 0;
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  -webkit-overflow-scrolling: touch;
`;

const DrawerFooter = styled.div`
  padding: 1rem 1.25rem;
  border-top: 1px solid ${COLORS.border};
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const DetailItem = styled.div`
  padding: 0.75rem;
  background: ${COLORS.bg};
  border-radius: ${COLORS.radiusSm};
  border: 1px solid ${COLORS.border};
`;

const DetailLabel = styled.div`
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${COLORS.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.25rem;
`;

const DetailValue = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${COLORS.text};
  word-break: break-word;
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: calc(100% - 2rem);
`;

const Toast = styled.div`
  padding: 0.875rem 1.25rem;
  border-radius: ${COLORS.radiusSm};
  font-size: 0.8125rem;
  font-weight: 500;
  box-shadow: ${COLORS.shadowMd};
  animation: ${fadeIn} 0.2s ease-out;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.type === 'error' ? COLORS.dangerLight : COLORS.successLight};
  color: ${props => props.type === 'error' ? COLORS.dangerDark : COLORS.successDark};
  border: 1px solid ${props => props.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'};

  span {
    flex: 1;
  }
`;

const ToastCloseBtn = styled.button`
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1.125rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;
  opacity: 0.6;
  transition: ${COLORS.transition};

  &:hover {
    opacity: 1;
  }
`;

const getTenantSlugFunc = getTenantSlug;

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [actionMenuId, setActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [prefillDate, setPrefillDate] = useState('');
  const { socket } = useSocket();
  const { user } = useAuthStore();

  const [newForm, setNewForm] = useState({
    hearse_id: '', client_name: '', client_phone: '', from_location: '', to_location: '', destination: '', booking_dates: [], branch_id: '', booking_date: ''
  });
    const [selectedBookingDates, setSelectedBookingDates] = useState([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [tempDateSelection, setTempDateSelection] = useState([]);
  const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [submitLoading, setSubmitLoading] = useState(false);
  const [hearseAvailable, setHearseAvailable] = useState(null);
  const [availabilityConflict, setAvailabilityConflict] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [registerHearseOpen, setRegisterHearseOpen] = useState(false);
  const [hearseForm, setHearseForm] = useState({
    plate_number: '', hearse_name: '', model: '', capacity: '8', status: 'available', branch_code: ''
  });
  const [registerLoading, setRegisterLoading] = useState(false);

  const removeToast = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message: msg, type }]);
    setTimeout(() => {
      setToasts(p => p.filter(t => t.id !== id));
    }, type === 'error' ? 6000 : 4000);
  }, []);

  const getDateRange = useCallback((filter) => {
    const today = new Date(), ts = formatDateStr(today);
    switch (filter) {
      case 'today': return { start: ts, end: ts };
      case 'tomorrow': { const d = new Date(today); d.setDate(d.getDate() + 1); const s = formatDateStr(d); return { start: s, end: s }; }
      case 'thisWeek': { const dow = today.getDay(), mon = new Date(today); mon.setDate(today.getDate() - ((dow + 6) % 7)); const sun = new Date(mon); sun.setDate(mon.getDate() + 6); return { start: formatDateStr(mon), end: formatDateStr(sun) }; }
      case 'nextWeek': { const dow = today.getDay(), nm = new Date(today); nm.setDate(today.getDate() + (7 - ((dow + 6) % 7))); const ns = new Date(nm); ns.setDate(nm.getDate() + 6); return { start: formatDateStr(nm), end: formatDateStr(ns) }; }
      case 'thisMonth': return { start: formatDateStr(new Date(today.getFullYear(), today.getMonth(), 1)), end: formatDateStr(new Date(today.getFullYear(), today.getMonth() + 1, 0)) };
      case 'nextMonth': { const nm = today.getMonth() + 1, y = nm > 11 ? today.getFullYear() + 1 : today.getFullYear(), m = nm > 11 ? 0 : nm; return { start: formatDateStr(new Date(y, m, 1)), end: formatDateStr(new Date(y, m + 1, 0)) }; }
      default: return { start: null, end: null };
    }
  }, []);

  const handleDateFilter = useCallback((f) => { setDateFilter(f); setCurrentPage(1); }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bks, brs, hrs] = await Promise.all([api.getBookings(), api.getBranches(), api.getAllHearses()]);
      setBookings(bks);
      setBranches(brs);
      setAllHearses(hrs);
    } catch (e) { showToast('Failed to load data', 'error'); }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Pre-check hearse availability while the user fills the form.
  // When a hearse and one or more dates are selected, immediately warn if the
  // hearse is already booked on any selected date. NOTE: this is a UX hint only —
  // the backend re-checks atomically on submit, so a last-second conflict still
  // returns 409. We never trust the pre-check alone.
  const checkAvailability = useCallback(async (hearseId, dates) => {
          if (!hearseId || !dates || dates.length === 0) {
      setHearseAvailable(null);
      setAvailabilityConflict(null);
      return;
    }
    setCheckingAvailability(true);
    setHearseAvailable(null);
    try {
      const headers = getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      if (user?.branch_id) headers['x-branch-id'] = user.branch_id;
      if (user?.email) headers['x-user-email'] = user.email;
      headers['x-user-name'] = user?.full_name || user?.username || user?.name || 'System';

      const response = await fetch(`${API_BASE_URL}/hearse-bookings/check-availability`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ hearse_id: hearseId, booking_dates: dates })
      });
      const data = await response.json();
      if (response.ok) {
        setHearseAvailable(data.available);
        setAvailabilityConflict(data.conflicts && data.conflicts.length ? data.conflicts : null);
      } else {
        // Treat non-OK as "unknown" availability; the submit-time check is authoritative
        setHearseAvailable(null);
        setAvailabilityConflict(null);
      }
    } catch {
      setHearseAvailable(null);
      setAvailabilityConflict(null);
    } finally {
      setCheckingAvailability(false);
    }
  }, []);

  useEffect(() => {
    if (!newBookingOpen) return;
    if (!newForm.hearse_id || selectedBookingDates.length === 0) {
      setHearseAvailable(null);
      setAvailabilityConflict(null);
      return;
    }
    // debounce to avoid hammering the API while picking dates
    const t = setTimeout(() => {
      checkAvailability(newForm.hearse_id, selectedBookingDates);
    }, 500);
    return () => clearTimeout(t);
  }, [newBookingOpen, newForm.hearse_id, selectedBookingDates, checkAvailability]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_booking', (d) => {
      if (d.booking) {
        setBookings(p => [d.booking, ...p]);
        const code = d.booking.booking_code || `BK-${d.booking.booking_id}`;
        const client = d.booking.client_name || 'Client';
        const destination = d.booking.destination || '';
        showToast(`New booking: ${code} - ${client}${destination ? ' to ' + destination : ''}`);
      }
    });
    socket.on('booking_status_updated', (d) => {
      setBookings(p => p.map(b => b.booking_id === d.booking_id ? { ...b, status: d.status, ...d.booking } : b));
    });
    socket.on('booking_postponed', () => loadData());
    return () => {
      socket.off('new_booking');
      socket.off('booking_status_updated');
      socket.off('booking_postponed');
    };
  }, [socket, showToast, loadData]);

  const filtered = useMemo(() => {
    let result = [...bookings];
    if (filterStatus) result = result.filter(b => b.status === filterStatus);
    if (filterBranch) result = result.filter(b => String(b.branch_id) === String(filterBranch));
    if (dateFilter !== 'all') {
      const range = getDateRange(dateFilter);
      if (range.start && range.end) {
        result = result.filter(b => {
          let dates = [];
          try {
            dates = typeof b.booking_dates === 'string' ? JSON.parse(b.booking_dates) : (b.booking_dates || []);
          } catch { dates = []; }
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
        (b.hearse_name || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [bookings, filterStatus, filterBranch, dateFilter, getDateRange, searchInput]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / RESULTS_PER_PAGE));
  const pageData = filtered.slice((currentPage - 1) * RESULTS_PER_PAGE, currentPage * RESULTS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [filterStatus, filterBranch, dateFilter, searchInput]);
  useEffect(() => {
    const handler = (e) => { if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) setActionMenuId(null); };
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

  const changeStatus = useCallback(async (id, status) => {
    try {
      await api.updateStatus(id, status);
      setBookings(p => p.map(b => b.booking_id === id ? { ...b, status } : b));
      if (selectedBooking && (selectedBooking.booking_id === id || selectedBooking.id === id)) {
        setSelectedBooking(p => ({ ...p, status }));
      }
      showToast(`Status → ${STATUS_CONFIG[status].label}`);
      setActionMenuId(null);
    } catch { showToast('Failed to update', 'error'); }
  }, [selectedBooking, showToast]);

  const getNextStatuses = (status) => {
    switch (status) {
      case 'pending': return ['booked', 'cancelled'];
      case 'booked': return ['in_transit', 'cancelled'];
      case 'in_transit': return ['completed'];
      case 'completed': return [];
      case 'cancelled': return ['pending'];
      case 'postponed': return ['booked'];
      case 'maintenance': return ['booked'];
      default: return [];
    }
  };

  const openNewBooking = useCallback((date) => {
    const dateStr = date || '';
    setPrefillDate(dateStr);
    const initialDates = dateStr ? [dateStr] : [];
    setSelectedBookingDates(initialDates);
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const userBranchId = user?.branch_id || '';
    const userBranchCode = user?.branch_code || '';
    const dbName = user?.dbName || user?.branchDbName || '';
    const branchName = dbName.split('-').pop() || '';

    setNewForm({
      hearse_id: '',
      client_name: '',
      client_phone: '',
      from_location: '',
      to_location: '',
      destination: '',
      booking_dates: initialDates,
      branch_id: userBranchId,
      branch_code: branchName,
      booking_date: dateStr || ''
    });
    setNewBookingOpen(true);
  }, []);

  const closeNewBooking = useCallback(() => {
    setNewBookingOpen(false);
    setPrefillDate('');
    setSelectedBookingDates([]);
    setDatePickerOpen(false);
  }, []);

  const toggleFormDate = (dateStr) => {
    setTempDateSelection(prev => {
      if (prev.includes(dateStr)) return prev.filter(d => d !== dateStr);
      return [...prev, dateStr].sort();
    });
  };

  const confirmFormDates = () => {
    setSelectedBookingDates(tempDateSelection);
    setNewForm(p => ({ ...p, booking_dates: tempDateSelection }));
    setDatePickerOpen(false);
  };

  const onCreateBooking = useCallback((dates) => {
    if (!dates || dates.length === 0) return;
    const dateStr = dates[0];
    setPrefillDate(dateStr);
    setSelectedBookingDates(dates);
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const userBranchId = user?.branch_id || '';
    const dbName = user?.dbName || user?.branchDbName || '';
    const branchName = dbName.split('-').pop() || '';

    setNewForm({
      hearse_id: '',
      client_name: '',
      client_phone: '',
      from_location: '',
      to_location: '',
      destination: '',
      booking_dates: dates,
      branch_id: userBranchId,
      branch_code: branchName,
      booking_date: dateStr || ''
    });
    setNewBookingOpen(true);
  }, []);

  const handleNewBooking = useCallback(async (e) => {
    e.preventDefault();
    if (!newForm.hearse_id || !newForm.client_name || !newForm.from_location || !newForm.to_location || selectedBookingDates.length === 0) {
      showToast('Please fill all required fields and select at least one date', 'error'); return;
    }

    // Pre-check: if we've already determined the hearse is unavailable for the
    // selected dates, stop early and surface the conflict. The backend re-checks
    // atomically on submit anyway, so a race between this pre-check and submit
    // is still safely rejected by the server with a 409.
    if (hearseAvailable === false && availabilityConflict) {
      const conflictList = availabilityConflict.map(c => `${c.date || 'selected date'} (${c.reason})`).join(', ');
      showToast(`This hearse is already booked for: ${conflictList}. Please choose another date or vehicle.`, 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      const headers = getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      if (user?.branch_id) headers['x-branch-id'] = user.branch_id;
      if (user?.email) headers['x-user-email'] = user.email;
      headers['x-user-name'] = user?.full_name || user?.username || user?.name || 'System';

      const firstBookingDate = selectedBookingDates.length > 0 ? selectedBookingDates[0] + 'T00:00:00' : new Date().toISOString();

      const requestBody = {
        hearse_id: newForm.hearse_id,
        client_name: newForm.client_name,
        client_phone: newForm.client_phone || '',
        from_location: newForm.from_location,
        to_location: newForm.to_location,
        destination: newForm.to_location,
        from_timestamp: firstBookingDate,
        booking_date: firstBookingDate,
        booking_dates: selectedBookingDates,
        booked_by: user?.email || 'system',
        branch_id: newForm.branch_id || user?.branch_id || '',
        branch_code: newForm.branch_code || user?.branch_code || ''
      };

      const response = await fetch(`${API_BASE_URL}/hearse-bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // 409 = atomic server-side conflict: the hearse was booked between the
        // pre-check and this submit. Surface the existing booking to the user.
        if (response.status === 409) {
          throw new Error(errorData.message || 'This hearse was just booked on the same date by another user. Please choose another date or vehicle.');
        }
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      showToast('Booking created successfully!');
      setHearseAvailable(null);
      setAvailabilityConflict(null);
      closeNewBooking();
      await loadData();
    } catch (e) {
      showToast('Failed to create booking: ' + e.message, 'error');
    }
    setSubmitLoading(false);
  }, [newForm, selectedBookingDates, showToast, closeNewBooking, loadData, hearseAvailable, availabilityConflict]);

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
        items.push({ ...b, date: dateStr });
      });
    });
    return items;
  }, [bookings]);

  const getBookingTime = useCallback((item) => {
    if (item.booking_date && item.booking_date.includes('T')) {
      return new Date(item.booking_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (item.estimated_departure_time) {
      return new Date(item.estimated_departure_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return '';
  }, []);

  const getBookingStatus = useCallback((item) => {
    const cfg = STATUS_CONFIG[item.status];
    if (!cfg) return null;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.25rem 0.6rem',
        borderRadius: '6px',
        fontSize: '0.68rem',
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}33`
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dotColor }} />
        {cfg.label}
      </span>
    );
  }, []);

  const getStatusColor = useCallback((item) => {
    return STATUS_CONFIG[item.status]?.dotColor || '#a8a29e';
  }, []);

  const getIsUrgent = useCallback((item) => {
    return item.status === 'booked' || item.status === 'in_transit';
  }, []);

  const renderPagination = () => {
    const btns = [];
    const btnStyle = { width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid ' + COLORS.border, borderRadius: 6, background: COLORS.surface, color: COLORS.textSecondary, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: COLORS.transition };
    const activeBtnStyle = { ...btnStyle, background: COLORS.primary, color: COLORS.white, borderColor: COLORS.primary };
    btns.push(
      <PageButton key="first" style={btnStyle} disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>{Icons.chevFirst}</PageButton>,
      <PageButton key="prev" style={btnStyle} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>{Icons.chevLeft}</PageButton>
    );
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
        if (i === 3 || i === totalPages - 2) btns.push(<span key={`dots-${i}`} style={{ padding: '0 0.25rem', color: COLORS.textMuted, fontSize: '0.8rem' }}>…</span>);
        continue;
      }
      btns.push(<PageButton key={i} style={currentPage === i ? activeBtnStyle : btnStyle} onClick={() => setCurrentPage(i)} $active={currentPage === i}>{i}</PageButton>);
    }
    btns.push(
      <PageButton key="next" style={btnStyle} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>{Icons.chevRight}</PageButton>,
      <PageButton key="last" style={btnStyle} disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>{Icons.chevLast}</PageButton>
    );
    return btns;
  };

  if (loading) return (
    <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <RefreshCw size={32} color={COLORS.primary} className="animate-spin" />
    </Container>
  );

  const branchOptions = branches.length > 0 ? branches : [];

  return (
    <Container>
      <Header>
        <HeaderContent>
          <div>
            <Title>
              <Truck size={24} />
              Hearse Bookings
              <LiveBadge>Live</LiveBadge>
            </Title>
            <div style={{ fontSize: '0.8125rem', color: COLORS.textSecondary, marginTop: '0.25rem' }}>
              {stats.active} active booking{stats.active !== 1 ? 's' : ''}
            </div>
          </div>
          <HeaderActions>
            <SecondaryButton onClick={loadData}>
              {Icons.refresh} Refresh
            </SecondaryButton>
            <PrimaryButton onClick={() => openNewBooking('')}>
              {Icons.plus} New Booking
            </PrimaryButton>
            <PrimaryButton onClick={() => setRegisterHearseOpen(true)} style={{ background: COLORS.success }}>
              {Icons.plus} Register Hearse
            </PrimaryButton>
          </HeaderActions>
        </HeaderContent>
      </Header>

      <MainContent>
        {/* Stats Cards - Deep Solid Colors */}
        <StatsGrid>
          <StatCard $bg="#1e3a8a"> {/* Deep Blue */}
            <StatHeader>
              <StatLabel>Total Bookings</StatLabel>
              <StatIcon>{Icons.truck}</StatIcon>
            </StatHeader>
            <StatValue>{stats.total}</StatValue>
            <StatSubtext>All time</StatSubtext>
          </StatCard>

          <StatCard $bg="#0f766e"> {/* Deep Teal */}
            <StatHeader>
              <StatLabel>Active</StatLabel>
              <StatIcon>{Icons.car}</StatIcon>
            </StatHeader>
            <StatValue>{stats.active}</StatValue>
            <StatSubtext>In progress</StatSubtext>
          </StatCard>

          <StatCard $bg="#d97706"> {/* Deep Amber/Orange */}
            <StatHeader>
              <StatLabel>Pending</StatLabel>
              <StatIcon>{Icons.clock}</StatIcon>
            </StatHeader>
            <StatValue>{stats.pending}</StatValue>
            <StatSubtext>Needs attention</StatSubtext>
          </StatCard>

          <StatCard $bg="#be185d"> {/* Deep Pink/Rose */}
            <StatHeader>
              <StatLabel>In Transit</StatLabel>
              <StatIcon>{Icons.truck}</StatIcon>
            </StatHeader>
            <StatValue>{stats.inProgress}</StatValue>
            <StatSubtext>On the road</StatSubtext>
          </StatCard>

          <StatCard $bg="#15803d"> {/* Deep Green */}
            <StatHeader>
              <StatLabel>Completed</StatLabel>
              <StatIcon>{Icons.check}</StatIcon>
            </StatHeader>
            <StatValue>{stats.completed}</StatValue>
            <StatSubtext>Delivered</StatSubtext>
          </StatCard>
        </StatsGrid>

        <FilterCard>
          <FilterRow>
            <SearchInput
              style={{ width: 50 }}
              type="text"
              placeholder="Search client, ID, destination..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />

            <Select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
            >
              <option value="">All Branches</option>
              {branchOptions.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name}
                </option>
              ))}
              {branchOptions.length === 0 && <option value="">No branches</option>}
            </Select>

            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUS_LIST.map((status) => {
                const cfg = STATUS_CONFIG[status];
                return (
                  <option key={status} value={status}>
                    {cfg?.label || status}
                  </option>
                );
              })}
            </Select>

            <div style={{ display: "flex", gap: "0.25rem" }}>
              <ActionButton
                onClick={() => setViewMode("table")}
                style={{
                  background:
                    viewMode === "table" ? COLORS.primary : COLORS.surface,
                  color:
                    viewMode === "table" ? COLORS.white : COLORS.textSecondary,
                }}
              >
                {Icons.list}
              </ActionButton>

              <ActionButton
                onClick={() => setViewMode("calendar")}
                style={{
                  background:
                    viewMode === "calendar" ? COLORS.primary : COLORS.surface,
                  color:
                    viewMode === "calendar" ? COLORS.white : COLORS.textSecondary,
                }}
              >
                {Icons.grid}
              </ActionButton>
            </div>
          </FilterRow>
        </FilterCard>

        {/* Main Content */}
        <TableCard>
          {viewMode === 'table' && (
            <>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeader>Booking ID</TableHeader>
                      <TableHeader>Client</TableHeader>
                      <TableHeader>Destination</TableHeader>
                      <TableHeader>Hearse</TableHeader>
                      <TableHeader>Branch</TableHeader>
                      <TableHeader>Date</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader style={{ width: 40 }}></TableHeader>
                    </tr>
                  </TableHead>
                  <tbody>
                    {pageData.map((b) => (
                      <TableRow key={b.booking_id || b.id} onClick={() => openDrawer(b)}>
                        <TableCell>
                          <span style={{ fontWeight: 500, fontSize: '0.75rem', color: COLORS.textSecondary }}>
                            {b.booking_code || genId(b.booking_id, b.plate_number || b.number_plate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div style={{ fontWeight: 500 }}>{b.client_name}</div>
                          {b.client_phone && <div style={{ fontSize: '0.72rem', color: COLORS.textMuted, marginTop: '0.15rem' }}>{b.client_phone}</div>}
                        </TableCell>
                        <TableCell>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{fmtRoute(b)}</div>
                          {b.booking_dates && <div style={{ fontSize: '0.72rem', color: COLORS.textMuted, marginTop: '0.15rem' }}>{fmtBookingDates(b)}</div>}
                        </TableCell>
                        <TableCell>
                          <span style={{ fontWeight: 500, fontSize: '0.75rem' }}>{b.plate_number || b.number_plate || 'N/A'}</span>
                          <div style={{ fontSize: '0.72rem', color: COLORS.textMuted, marginTop: '0.15rem' }}>{b.hearse_name || ''}</div>
                        </TableCell>
                        <TableCell>
                          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: COLORS.bg, borderRadius: '0.25rem' }}>
                            {b.branch_name || b.branch_code || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>{fmtBookingDates(b)}</div>
                          {b.delivery_time && <div style={{ fontSize: '0.72rem', color: COLORS.textMuted, marginTop: '0.15rem' }}>{b.delivery_time}</div>}
                        </TableCell>
                        <TableCell>
                          <StatusBadge $status={b.status}>
                            {STATUS_CONFIG[b.status]?.label || b.status}
                          </StatusBadge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div style={{ position: 'relative' }} ref={actionMenuId === (b.booking_id || b.id) ? actionMenuRef : null}>
                            <ActionButton onClick={() => setActionMenuId(actionMenuId === (b.booking_id || b.id) ? null : (b.booking_id || b.id))}>
                              {Icons.moreV}
                            </ActionButton>
                            {actionMenuId === (b.booking_id || b.id) && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                background: COLORS.surface,
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: COLORS.radiusSm,
                                boxShadow: COLORS.shadowLg,
                                minWidth: '180px',
                                zIndex: 1000,
                                marginTop: '0.25rem'
                              }}>
                                <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Change Status
                                </div>
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      changeStatus(b.booking_id || b.id, e.target.value);
                                      setActionMenuId(null);
                                    }
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem',
                                    border: 'none',
                                    background: COLORS.bg,
                                    color: COLORS.text,
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                    borderRadius: '0.25rem',
                                    margin: '0.25rem 0'
                                  }}
                                >
                                  <option value="">Select status...</option>
                                  {getNextStatuses(b.status).map((s) => (
                                    <option key={s} value={s}>
                                      {STATUS_CONFIG[s]?.label || s}
                                    </option>
                                  ))}
                                </select>
                                <div style={{ height: 1, background: COLORS.border, margin: '0.25rem 0' }} />
                                <button
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem',
                                    border: 'none',
                                    background: 'transparent',
                                    color: COLORS.text,
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onClick={() => openDrawer(b)}
                                  onMouseEnter={(e) => e.target.style.background = COLORS.bg}
                                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                  View Details
                                </button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </div>
              {pageData.length === 0 && (
                <EmptyState>
                  <Search size={48} />
                  <h4>No bookings found</h4>
                  <p>Try adjusting your search or filters</p>
                </EmptyState>
              )}
              <Pagination>
                <PageInfo>
                  {filtered.length > 0 ? `${(currentPage - 1) * RESULTS_PER_PAGE + 1}–${Math.min(currentPage * RESULTS_PER_PAGE, filtered.length)} of ${filtered.length} bookings` : '0 bookings'}
                </PageInfo>
                <PageButtons>{renderPagination()}</PageButtons>
              </Pagination>
            </>
          )}

          {viewMode === 'calendar' && (
            <div style={{ padding: '1rem' }}>
              <HearseCalendar
                bookings={bookings}
                onItemClick={openDrawer}
                onCreateBooking={onCreateBooking}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
          )}
        </TableCard>
      </MainContent>

      {/* Detail Drawer */}
      {drawerOpen && <DrawerOverlay onClick={closeDrawer} />}
      <Drawer $open={drawerOpen}>
        {selectedBooking && (
          <>
            <DrawerHeader>
              <div>
                <DrawerTitle>Booking Details</DrawerTitle>
                <DrawerSubtitle>
                  ID: {selectedBooking.booking_code || genId(selectedBooking.booking_id, selectedBooking.plate_number || selectedBooking.number_plate)}
                </DrawerSubtitle>
              </div>
              <ActionButton
                onClick={closeDrawer}
                style={{
                  background: COLORS.danger,
                  color: COLORS.white,
                  padding: '0.5rem 1rem',
                  borderRadius: COLORS.radiusSm,
                  fontSize: '0.8125rem',
                  fontWeight: 500
                }}
              >
                ← Back to List
              </ActionButton>
            </DrawerHeader>
            <DrawerBody>
              {/* Client Information */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Client Information
                </div>
                <div style={{
                  padding: '1rem',
                  background: COLORS.bg,
                  borderRadius: COLORS.radiusSm,
                  border: `1px solid ${COLORS.border}`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                        Client Name
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: COLORS.text }}>
                        {selectedBooking.client_name || '—'}
                      </div>
                    </div>
                    <StatusBadge $status={selectedBooking.status} style={{
                      fontSize: '0.8125rem',
                      padding: '0.4rem 0.875rem'
                    }}>
                      {STATUS_CONFIG[selectedBooking.status]?.label || selectedBooking.status}
                    </StatusBadge>
                  </div>
                  {selectedBooking.client_phone && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem',
                      background: COLORS.surface,
                      borderRadius: COLORS.radiusXs,
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '0.75rem', color: COLORS.textSecondary }}>📞</span>
                      <span style={{ fontSize: '0.875rem', color: COLORS.text }}>{selectedBooking.client_phone}</span>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem',
                    background: COLORS.surface,
                    borderRadius: COLORS.radiusXs
                  }}>
                    <span style={{ fontSize: '0.75rem', color: COLORS.textSecondary }}>👤</span>
                    <span style={{ fontSize: '0.875rem', color: COLORS.text }}>
                      Booked by: {selectedBooking.booked_by_name || selectedBooking.booked_by || user?.email || 'System'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textSecondary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Trip Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '1rem', background: COLORS.bg, borderRadius: COLORS.radiusSm, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.375rem', textTransform: 'uppercase' }}>
                      From Location
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: COLORS.text }}>
                      {selectedBooking.from_location || '—'}
                    </div>
                  </div>
                  <div style={{ padding: '1rem', background: COLORS.bg, borderRadius: COLORS.radiusSm, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.375rem', textTransform: 'uppercase' }}>
                      To / Destination
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: COLORS.text }}>
                      {selectedBooking.to_location || selectedBooking.destination || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textSecondary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Vehicle Information
                </div>
                <div style={{ padding: '1rem', background: COLORS.bg, borderRadius: COLORS.radiusSm, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                        Hearse Name
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: COLORS.text }}>
                        {selectedBooking.hearse_name || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '0.625rem', background: COLORS.surface, borderRadius: COLORS.radiusXs, display: 'inline-block' }}>
                    <span style={{ fontSize: '0.75rem', color: COLORS.textSecondary, marginRight: '0.5rem' }}>Plate Number:</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.text }}>
                      {selectedBooking.plate_number || selectedBooking.number_plate || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textSecondary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Schedule
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '1rem', background: COLORS.bg, borderRadius: COLORS.radiusSm, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.375rem', textTransform: 'uppercase' }}>
                      Booking Date
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: COLORS.text }}>
                      {fmtBookingDates(selectedBooking)}
                    </div>
                  </div>
                  {selectedBooking.delivery_time && (
                    <div style={{ padding: '1rem', background: COLORS.bg, borderRadius: COLORS.radiusSm, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.375rem', textTransform: 'uppercase' }}>
                        Delivery Time
                      </div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: COLORS.text }}>
                        {selectedBooking.delivery_time}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textSecondary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Additional Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.875rem', background: COLORS.bg, borderRadius: COLORS.radiusSm, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                      Branch
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: COLORS.text }}>
                      {selectedBooking.branch_name || branchOptions.find(b => String(b.branch_id) === String(selectedBooking.branch_id))?.branch_name || selectedBooking.branch_code || '—'}
                    </div>
                  </div>
                  {selectedBooking.end_date && (
                    <div style={{ padding: '0.875rem', background: COLORS.bg, borderRadius: COLORS.radiusSm, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                        End Date (Multi-day)
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: COLORS.text }}>
                        {fmtDateOnly(selectedBooking.end_date)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textSecondary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Timestamps
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.875rem', background: COLORS.bg, borderRadius: COLORS.radiusSm, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                      Created At
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: COLORS.text }}>
                      {fmtDate(selectedBooking.created_at)}
                    </div>
                  </div>
                  {selectedBooking.updated_at && (
                    <div style={{ padding: '0.875rem', background: COLORS.bg, borderRadius: COLORS.radiusSm, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                        Last Updated
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: COLORS.text }}>
                        {fmtDate(selectedBooking.updated_at)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textSecondary, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Quick Actions
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {getNextStatuses(selectedBooking.status).map((s) => (
                    <PrimaryButton
                      key={s}
                      onClick={() => changeStatus(selectedBooking.booking_id || selectedBooking.id, s)}
                      style={{ fontSize: '0.8125rem', padding: '0.625rem 1rem' }}
                    >
                      Move to {STATUS_CONFIG[s].label}
                    </PrimaryButton>
                  ))}
                </div>
              </div>
            </DrawerBody>
          </>
        )}
      </Drawer>

      {/* Register New Hearse Drawer */}
      {registerHearseOpen && <DrawerOverlay onClick={() => setRegisterHearseOpen(false)} />}
      <Drawer $open={registerHearseOpen} $w="520px">
        <DrawerHeader style={{ background: COLORS.successDark }}>
          <div>
            <DrawerTitle style={{ color: COLORS.white }}>Register New Hearse</DrawerTitle>
            <DrawerSubtitle style={{ color: 'rgba(255,255,255,0.7)' }}>Add a new hearse vehicle to your fleet</DrawerSubtitle>
          </div>
          <ActionButton onClick={() => setRegisterHearseOpen(false)} style={{ color: COLORS.white }}>{Icons.x}</ActionButton>
        </DrawerHeader>
        <DrawerBody>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!hearseForm.plate_number || !hearseForm.branch_code) {
              showToast('Plate number and branch code are required', 'error');
              return;
            }
            setRegisterLoading(true);
            try {
              const headers = getAuthHeaders();
              headers['Content-Type'] = 'application/json';
              const response = await fetch(`${API_BASE_URL}/hearses`, {
                method: 'POST',
                headers,
                body: JSON.stringify(hearseForm)
              });
              if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${response.status}`);
              }
              showToast('Hearse registered successfully!');
              setRegisterHearseOpen(false);
              setHearseForm({ plate_number: '', hearse_name: '', model: '', capacity: '8', status: 'available', branch_code: '' });
              const hrs = await api.getAllHearses();
              setAllHearses(hrs);
            } catch (e) {
              showToast('Failed to register hearse: ' + e.message, 'error');
            }
            setRegisterLoading(false);
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.8125rem', color: COLORS.text }}>
                  Plate Number *
                </label>
                <input
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm, fontSize: '0.8125rem', color: COLORS.text, background: COLORS.surface }}
                  placeholder="e.g., KCA 123T"
                  value={hearseForm.plate_number}
                  onChange={e => setHearseForm(p => ({ ...p, plate_number: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.8125rem', color: COLORS.text }}>
                  Hearse Name
                </label>
                <input
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm, fontSize: '0.8125rem', color: COLORS.text, background: COLORS.surface }}
                  placeholder="e.g., Mercedes Sprinter"
                  value={hearseForm.hearse_name}
                  onChange={e => setHearseForm(p => ({ ...p, hearse_name: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.8125rem', color: COLORS.text }}>
                  Model
                </label>
                <input
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm, fontSize: '0.8125rem', color: COLORS.text, background: COLORS.surface }}
                  placeholder="e.g., 2020 Toyota Hiace"
                  value={hearseForm.model}
                  onChange={e => setHearseForm(p => ({ ...p, model: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.8125rem', color: COLORS.text }}>
                  Capacity (seats)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm, fontSize: '0.8125rem', color: COLORS.text, background: COLORS.surface }}
                  value={hearseForm.capacity}
                  onChange={e => setHearseForm(p => ({ ...p, capacity: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.8125rem', color: COLORS.text }}>
                Branch Code / Name *
              </label>
              <input
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm, fontSize: '0.8125rem', color: COLORS.text, background: COLORS.surface }}
                placeholder="e.g., main-branch or Nairobi"
                value={hearseForm.branch_code}
                onChange={e => setHearseForm(p => ({ ...p, branch_code: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <SecondaryButton type="button" onClick={() => setRegisterHearseOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={registerLoading} style={{ background: COLORS.success }}>
                {registerLoading ? 'Registering...' : 'Register Hearse'}
              </PrimaryButton>
            </div>
          </form>
        </DrawerBody>
      </Drawer>

      {/* New Booking Drawer */}
      {newBookingOpen && <DrawerOverlay onClick={closeNewBooking} />}
      <Drawer $open={newBookingOpen} $w="600px">
        <DrawerHeader style={{ background: COLORS.primaryDark }}>
          <div>
            <DrawerTitle style={{ color: COLORS.white }}>New Hearse Booking</DrawerTitle>
            <DrawerSubtitle style={{ color: 'rgba(255,255,255,0.7)' }}>Book a hearse for a funeral service trip</DrawerSubtitle>
          </div>
          <ActionButton onClick={closeNewBooking} style={{ color: COLORS.white }}>{Icons.x}</ActionButton>
        </DrawerHeader>
        <DrawerBody>
          <form onSubmit={handleNewBooking}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.8125rem', color: COLORS.text }}>
                  Client Name *
                </label>
                <input
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm, fontSize: '0.8125rem', color: COLORS.text, background: COLORS.surface }}
                  placeholder="Full name"
                  value={newForm.client_name}
                  onChange={e => setNewForm(p => ({ ...p, client_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.8125rem', color: COLORS.text }}>
                  Phone
                </label>
                <input
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm, fontSize: '0.8125rem', color: COLORS.text, background: COLORS.surface }}
                  placeholder="0712 345 678"
                  value={newForm.client_phone}
                  onChange={e => setNewForm(p => ({ ...p, client_phone: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.8125rem', color: COLORS.text }}>
                  Select Hearse *
                </label>
                <select
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm, fontSize: '0.8125rem', color: COLORS.text, background: COLORS.surface }}
                  value={newForm.hearse_id}
                  onChange={e => setNewForm(p => ({ ...p, hearse_id: e.target.value }))}
                  required
                >
                  <option value="">— Select —</option>
                  {allHearses.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.hearse_name || 'N/A'} — {h.plate_number || h.number_plate} {h.branch_name ? `(${h.branch_name})` : ''}
                    </option>
                  ))}
                                </select>
                {newForm.hearse_id && (hearseAvailable === false || checkingAvailability) && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, background: hearseAvailable === false ? COLORS.dangerLight : COLORS.warningLight, color: hearseAvailable === false ? COLORS.danger : COLORS.warningDark }}>
                    {checkingAvailability
                      ? 'Checking availability...'
                      : (availabilityConflict?.map(c => `${c.date || 'date'} (${c.reason})`).join(', '))}
                    {hearseAvailable === false && ' — Hearse is already booked on the selected date(s).'}
                  </div>
                )}
                {newForm.hearse_id && hearseAvailable === true && !checkingAvailability && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, background: COLORS.successLight, color: COLORS.successDark }}>
                    ✓ Hearse is available for all selected dates
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.8125rem', color: COLORS.text }}>
                  Booking Dates * <span style={{ fontWeight: 400, color: COLORS.textMuted }}>(click to select)</span>
                </label>
                <div style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: `1px solid ${selectedBookingDates.length > 0 ? COLORS.primary : COLORS.border}`,
                  borderRadius: COLORS.radiusSm,
                  fontSize: '0.8125rem',
                  color: COLORS.text,
                  background: COLORS.surface,
                  cursor: 'pointer',
                  minHeight: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.35rem'
                }} onClick={() => { setTempDateSelection([...selectedBookingDates]); setPickerMonth(new Date().getMonth()); setPickerYear(new Date().getFullYear()); setDatePickerOpen(true); }}>
                  {selectedBookingDates.length > 0 ? selectedBookingDates.map(d => {
                    const dt = new Date(d + 'T00:00:00');
                    return (
                      <span key={d} style={{
                        padding: '0.2rem 0.5rem',
                        background: COLORS.primaryLight + '22',
                        color: COLORS.primary,
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    );
                  }) : <span style={{ color: COLORS.textMuted }}>Click to select dates...</span>}
                </div>
                {selectedBookingDates.length > 0 && (
                  <div style={{ fontSize: '0.7rem', color: COLORS.textSecondary, marginTop: '0.25rem' }}>
                    {selectedBookingDates.length} date{selectedBookingDates.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </div>

            {/* Date Picker Modal */}
            {datePickerOpen && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 99999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', padding: '1rem'
              }} onClick={() => setDatePickerOpen(false)}>
                <div style={{
                  background: '#fff', borderRadius: '12px', width: '440px', maxWidth: '100%',
                  maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.2)'
                }} onClick={(e) => e.stopPropagation()}>
                  <div style={{
                    padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLORS.primaryDark, color: '#fff'
                  }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Select Dates</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Click dates to toggle selection</div>
                    </div>
                    <button style={{
                      width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)',
                      border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }} onClick={() => setDatePickerOpen(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.primary, marginBottom: '0.5rem' }}>
                      {tempDateSelection.length} date{tempDateSelection.length !== 1 ? 's' : ''} selected
                    </div>
                    {tempDateSelection.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                        {tempDateSelection.map(d => {
                          const dt = new Date(d + 'T00:00:00');
                          return (
                            <span key={d} style={{
                              padding: '0.2rem 0.5rem', background: COLORS.primaryLight + '22',
                              color: COLORS.primary, borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600
                            }}>
                              {dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {/* Month Navigation */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: '0.75rem', padding: '0.25rem 0'
                    }}>
                      <button type="button" style={{
                        width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e2e8f0',
                        background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#334155', fontSize: '16px'
                      }} onClick={() => {
                        if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(p => p - 1); }
                        else setPickerMonth(p => p - 1);
                      }}>

                      </button>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][pickerMonth]} {pickerYear}
                      </div>
                      <button type="button" style={{
                        width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e2e8f0',
                        background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#334155', fontSize: '16px'
                      }} onClick={() => {
                        if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(p => p + 1); }
                        else setPickerMonth(p => p + 1);
                      }}>

                      </button>
                    </div>
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px'
                    }}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
                        <div key={w} style={{
                          textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', padding: '0.4rem 0'
                        }}>{w}</div>
                      ))}
                      {(() => {
                        const todayStr = formatDateStr(new Date());
                        const y = pickerYear, m = pickerMonth;
                        const first = new Date(y, m, 1);
                        const startOffset = first.getDay();
                        const days = [];
                        for (let i = 0; i < startOffset; i++) days.push(null);
                        const lastDate = new Date(y, m + 1, 0).getDate();
                        for (let i = 1; i <= lastDate; i++) days.push(i);
                        return days.map((day, idx) => {
                          if (day === null) return <div key={`e-${idx}`} />;
                          const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isToday = dateStr === todayStr;
                          const isSelected = tempDateSelection.includes(dateStr);
                          const isPast = new Date(dateStr) < new Date(todayStr);
                          return (
                            <div key={dateStr} style={{
                              textAlign: 'center', padding: '0.4rem 0', cursor: isPast ? 'not-allowed' : 'pointer',
                              borderRadius: '6px', fontSize: '0.82rem', fontWeight: isSelected ? 700 : 500,
                              background: isSelected ? COLORS.primary : isToday ? '#f0fdf4' : 'transparent',
                              color: isSelected ? '#fff' : isPast ? '#ccc' : isToday ? COLORS.successDark : '#1a1a1a',
                              border: isToday && !isSelected ? `1px solid ${COLORS.success}` : '1px solid transparent',
                              transition: 'all 0.1s ease'
                            }} onClick={() => !isPast && toggleFormDate(dateStr)}>
                              {day}
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div style={{
                      display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem',
                      borderTop: '1px solid #e2e8f0', paddingTop: '1rem'
                    }}>
                      <SecondaryButton type="button" onClick={() => setDatePickerOpen(false)}>Cancel</SecondaryButton>
                      <PrimaryButton type="button" onClick={confirmFormDates} disabled={tempDateSelection.length === 0}>
                        Confirm ({tempDateSelection.length})
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.8125rem', color: COLORS.text }}>
                  From Location *
                </label>
                <input
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm, fontSize: '0.8125rem', color: COLORS.text, background: COLORS.surface }}
                  placeholder="e.g., Nairobi CBD"
                  value={newForm.from_location}
                  onChange={e => setNewForm(p => ({ ...p, from_location: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.8125rem', color: COLORS.text }}>
                  To Location *
                </label>
                <input
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.border}`, borderRadius: COLORS.radiusSm, fontSize: '0.8125rem', color: COLORS.text, background: COLORS.surface }}
                  placeholder="e.g., Karen Memorial Park"
                  value={newForm.to_location}
                  onChange={e => setNewForm(p => ({ ...p, to_location: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.8125rem', color: COLORS.text }}>
                Branch (auto-filled from profile)
              </label>
              <input
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${COLORS.borderLight}`, borderRadius: COLORS.radiusSm, fontSize: '0.8125rem', color: COLORS.textSecondary, background: COLORS.bg, cursor: 'not-allowed' }}
                value={newForm.branch_id ? (branchOptions.find(b => String(b.branch_id) === String(newForm.branch_id))?.branch_name || `Branch #${newForm.branch_id}`) : 'Auto-filled from your profile'}
                disabled
                readOnly
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <SecondaryButton type="button" onClick={closeNewBooking}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={submitLoading}>
                {submitLoading ? 'Creating...' : 'Create Booking'}
              </PrimaryButton>
            </div>
          </form>
        </DrawerBody>
      </Drawer>

      {/* Toasts */}
      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type}>
            <span>{t.message}</span>
            <ToastCloseBtn onClick={() => removeToast(t.id)} aria-label="Dismiss notification">×</ToastCloseBtn>
          </Toast>
        ))}
      </ToastContainer>
    </Container>
  );
};

export default HearseBookings;