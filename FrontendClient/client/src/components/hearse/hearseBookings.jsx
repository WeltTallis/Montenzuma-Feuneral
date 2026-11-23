import { resolveBranchName, isMultiDay, getBookingDateRange, getMultiDayColor } from './viewerShared';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getBranchId, getBranchSlug, getBranches as getCachedBranches } from '../../utils/globalAuth';
import { useSocket } from '../../utils/context/socketContext';
import useAuthStore from '../../utils/store/useAuthStore';
import apiClient, { fetchWithCredentials } from '../../api/axios';
import { ENDPOINTS, getTenantHeaders } from '../../api/endpoints';
import BookNewHearseModal from './BookNewHearseModal';
import styled, { keyframes, createGlobalStyle } from 'styled-components';

const SwalZIndex = createGlobalStyle`
  .swal2-container { z-index: 10100 !important; }
`;
import HearseCalendar from './HearseCalendar';
import env from '../../utils/config/env';
import notify from '../../utils/notify';
import Swal from 'sweetalert2';

// SweetAlert2 

import {
  Truck, Car, Clock, Check, Search, Plus, RefreshCw, MoreVertical,
  ChevronLeft, ChevronRight, ChevronFirst, ChevronLast, List, Grid, X,
  Calendar, MapPin, Phone, User, Filter
} from '../../utils/icons/icons';



const API_BASE_URL = import.meta.env.PROD
  ? 'https://restpoint.co.ke/api/v1/restpoint'
  : (env.FULL_API_URL || 'http://localhost:5000/api/v1/restpoint');

const RESULTS_PER_PAGE = 10;

// Placeholder branch labels the backend used to store
// or it shows "Unknown".
const GENERIC_BRANCH_NAMES = new Set([
  'main branch',
  'main',
  'default',
  'branch',
  'unknown',
  'n/a',
  'na',
  '—',
  '-',
  '',
]);






const COLORS = {
  // Dispatch palette 
  ink: '#15171A',
  bone: '#FAF8F4',
  bone2: '#F3EFE6',
  brass: '#8B7355',
  verdigris: '#3D4F47',
  verdigrisTint: '#EBEFEE',
  line: '#E3DDD0',
  gray: '#6B6862',
  red: '#9B4A3F',
  orange: '#D97843',
  yellow: '#C9A227',
  green: '#475A43',
  white: '#FFFFFF',
  surface: '#ffffff',
  border: '#E3DDD0',
  borderLight: '#F3EFE6',
  text: '#15171A',
  textSecondary: '#6B6862',
  textMuted: '#8A8780',
  success: '#475A43',
  successLight: '#EBEFEE',
  successDark: '#3D4F47',
  warning: '#C9A227',
  warningLight: '#F7F2E5',
  warningDark: '#8B7355',
  danger: '#9B4A3F',
  dangerLight: '#F4E9E5',
  dangerDark: '#7A3B33',
  bookingAccent: '#8A1B46',
  info: '#D97843',
  infoLight: '#F4E9E5',
  infoDark: '#B05A30',
  accent: '#3D4F47',
  accentHover: '#2E3C38',
  radius: '12px',
  radiusSm: '8px',
  radiusXs: '4px',
  shadowSm: '0 1px 3px rgba(0,0,0,0.06)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.08)',
  shadowLg: '0 10px 30px rgba(0,0,0,0.10)',
  transition: 'all 0.15s ease',
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', progress: 10, color: COLORS.red, bg: COLORS.dangerLight, dotColor: COLORS.red },
  booked: { label: 'Booked', progress: 25, color: COLORS.orange, bg: COLORS.warningLight, dotColor: COLORS.orange },
  confirmed: { label: 'Confirmed', progress: 25, color: COLORS.green, bg: COLORS.successLight, dotColor: COLORS.green },
  scheduled: { label: 'Scheduled', progress: 25, color: COLORS.brass, bg: COLORS.warningLight, dotColor: COLORS.brass },
  in_transit: { label: 'In Transit', progress: 60, color: COLORS.orange, bg: COLORS.warningLight, dotColor: COLORS.orange },
  in_progress: { label: 'In Progress', progress: 60, color: COLORS.ink, bg: COLORS.bone2, dotColor: COLORS.ink },
  postponed: { label: 'Postponed', progress: 15, color: COLORS.yellow, bg: COLORS.warningLight, dotColor: COLORS.yellow },
  completed: { label: 'Completed', progress: 100, color: COLORS.green, bg: COLORS.successLight, dotColor: COLORS.green },
  delivered: { label: 'Delivered', progress: 100, color: COLORS.green, bg: COLORS.successLight, dotColor: COLORS.green },
  cancelled: { label: 'Cancelled', progress: 0, color: COLORS.red, bg: COLORS.dangerLight, dotColor: COLORS.red },
  maintenance: { label: 'Maintenance', progress: 0, color: COLORS.ink, bg: COLORS.bone2, dotColor: COLORS.ink },
};

const STATUS_LIST = Object.keys(STATUS_CONFIG);

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
  return `${first} - ${last}`;
};

const fmtBookingTime = (b) => {
  const raw = b?.booking_time || b?.from_timestamp || b?.estimated_departure_time || b?.start_time;
  if (!raw) return 'Not specified';
  const match = String(raw).match(/(?:^|[T\s])(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!match) return 'Not specified';
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return 'Not specified';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const fmtRoute = (b) => {
  if (b?.from_location && (b?.to_location || b?.destination)) {
    return `${b.from_location} → ${b.to_location || b.destination}`;
  }
  return b?.to_location || b?.destination || 'N/A';
};

// ── Date gating helpers ─────────────────────────────────────────────────────
// Only today's bookings may have their status changed (in_transit, completed,
// postponed, etc.). Future bookings (tomorrow or within 3 days) may ONLY be
// cancelled. This prevents staff from accidentally advancing a hearse's status
// before the service date.

const isSameDay = (d1, d2) => {
  const a = new Date(d1);
  const b = new Date(d2);
  return a.toDateString() === b.toDateString();
};

const getBookingDate = (b) => {
  if (!b) return null;
  try {
    const dates =
      typeof b.booking_dates === 'string' ? JSON.parse(b.booking_dates) : (b.booking_dates || []);
    if (Array.isArray(dates) && dates.length > 0) return dates[0];
  } catch { /* fall through to fallback fields */ }
  return b.booking_date || b.estimated_departure_time || b.from_timestamp || b.start_time || null;
};

const isBookingToday = (b) => {
  const d = getBookingDate(b);
  if (!d) return false;
  return isSameDay(d, new Date());
};

const isBookingInFuture = (b) => {
  const d = getBookingDate(b);
  if (!d) return false;
  const bookingDay = new Date(d);
  bookingDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((bookingDay - today) / (1000 * 60 * 60 * 24));
  return diffDays > 0; // any future day (tomorrow or beyond)
};

const isBookingWithin3Days = (b) => {
  const d = getBookingDate(b);
  if (!d) return false;
  const bookingDay = new Date(d);
  bookingDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((bookingDay - today) / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= 3;
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

// ── Tenant-wide scoping helpers ─────────────────────────────────────────────
// Hearses & hearse bookings live in ONE shared operations database across ALL
// branches of a tenant. They must ALWAYS be scoped by the tenant ID (never by
// branch slug/db), otherwise a multi-branch tenant only ever sees its own
// branch's fleet and bookings instead of everything in one place.
const resolveTenantId = () => {
  const direct = localStorage.getItem('tenantId');
  if (direct && direct !== 'undefined' && direct !== 'null') return direct;
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    const fromUser = u.tenantId || u.tenant_id || u.tenant?.id || u.tenant?.tenantId;
    if (fromUser) return String(fromUser);
  } catch { /* ignore */ }
  // Last resort: read tenantId straight from the auth token payload
  try {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload?.tenantId) return String(payload.tenantId);
  } catch { /* ignore */ }
  return null;
};

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
  const headers = { 'x-tenant-slug': getTenantSlug() };
  // ALWAYS send the tenant id — this is what makes bookings & the fleet
  // tenant-wide (all branches appear in one place).
  const tenantId = resolveTenantId();
  if (tenantId) headers['x-tenant-id'] = tenantId;
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
  getBookings: async (params = {}) => {
    // Month scoping: the calendar only ever renders one month, so the page
    // passes the visible month's bounds and the server filters server-side
    // instead of shipping every booking this tenant has ever had.
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    if (params.status && params.status !== 'all') qs.set('status', params.status);
    const query = qs.toString();
    const r = await fetchWithCredentials(`${API_BASE_URL}/hearse-bookings${query ? `?${query}` : ''}&t=${Date.now()}`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Failed');
    return (await r.json()).bookings || [];
  },
  getBranches: async () => {
    try {
      const r = await fetchWithCredentials(`${API_BASE_URL}/tenant/${getTenantSlug()}/branches`, { headers: getAuthHeaders() });
      if (r.ok) {
        const payload = await r.json();
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.data)
            ? payload.data
            : payload.data?.branches || payload.branches || [];
        if (Array.isArray(list) && list.length) return list;
      }
    } catch { /* use the branch list cached during authentication */ }
    return getCachedBranches();
  },

  //get   all  herases
  getAllHearses: async () => {
    const r = await fetchWithCredentials(`${API_BASE_URL}/hearses`, { headers: { ...getTenantHeaders(), ...getAuthHeaders() } });
    return r.ok ? (await r.json()).hearses || [] : [];
  },
  getDrivers: async () => {
    const r = await fetchWithCredentials(`${API_BASE_URL}/all-drivers`, {
      headers: { ...getTenantHeaders(), ...getAuthHeaders() },
    });
    if (!r.ok) throw new Error('Unable to load registered drivers for lineup.');
    const payload = await r.json();
    const rawDrivers = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.drivers)
        ? payload.drivers
        : Array.isArray(payload?.data)
          ? payload.data
          : payload?.data?.drivers || [];
    const registeredDrivers = Array.isArray(rawDrivers)
      ? rawDrivers.map((driver) => ({
        ...driver,
        driver_id: driver?.driver_id ?? driver?.id,
        driver_name: driver?.driver_name || driver?.full_name || driver?.name || '',
        driver_phone: driver?.driver_phone || driver?.phone || '',
      })).filter((driver) => driver.driver_id != null && driver.driver_name)
      : [];
    if (registeredDrivers.length) return registeredDrivers;

    // Driver accounts are also maintained as tenant users in Settings. Use
    // them when the legacy operations `drivers` table is empty; UUIDs stay as
    // selector keys and are never sent as the integer booking driver_id.
    const candidates = [getTenantSlug(), localStorage.getItem('parentTenantSlug')]
      .filter((slug, index, list) => slug && list.indexOf(slug) === index);
    for (const slug of candidates) {
      try {
        const response = await apiClient.get(ENDPOINTS.TENANT.USERS(slug));
        const payload = response?.data;
        const users = Array.isArray(payload) ? payload : payload?.data?.users || payload?.data || payload?.users || [];
        if (!Array.isArray(users)) continue;
        const drivers = users.filter((user) => {
          const roles = [user?.role, user?.role_name, ...(Array.isArray(user?.roles) ? user.roles : [])]
            .map((role) => String(typeof role === 'object' ? role?.name || role?.role : role || '').toLowerCase().replace(/[\s-]+/g, '_'));
          return roles.some((role) => role === 'driver' || role.includes('driver'));
        }).map((user) => ({
          driver_id: null,
          driver_key: user.user_id || user.id || user.email,
          driver_name: user.full_name || user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '',
          driver_phone: user.phone || user.phone_number || '',
          tenant_user_id: user.user_id || user.id,
        })).filter((driver) => driver.driver_key && driver.driver_name);
        if (drivers.length) return drivers;
      } catch { /* try the next tenant identity */ }
    }
    return [];
  },
  sendSmsLineup: async ({ date, message, driverIds }) => {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
    const r = await fetchWithCredentials(`${API_BASE_URL}/hearse-lineups/send-sms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ date, message, driver_ids: driverIds || [] }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.message || 'Failed to send the SMS lineup.');
    return data;
  },
  assignBookingLineup: async (bookingId, lineup) => {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
    const r = await fetchWithCredentials(`${API_BASE_URL}/hearse-bookings/${encodeURIComponent(bookingId)}/lineup`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(lineup),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Failed to save the booking lineup');
    return data;
  },
  updateBooking: async (bookingId, details) => {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
    const r = await fetchWithCredentials(`${API_BASE_URL}/hearse-bookings/${encodeURIComponent(bookingId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(details),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.message || 'Failed to update the booking');
    return data.booking || data;
  },
  //updates    hearses
  updateStatus: async (id, status, reason) => {
    const h = getAuthHeaders(); h['Content-Type'] = 'application/json';
    const body = { status, booking_id: id };
    if (String(status) === 'cancelled') body.cancel_reason = reason || null;
    const r = await fetchWithCredentials(`${API_BASE_URL}/hearse-bookings/${id}/status`, { method: 'PUT', headers: h, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Failed');
    return r.json();
  },
  postponeBooking: async (id, date, reason) => {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
    const r = await fetchWithCredentials(`${API_BASE_URL}/hearse-bookings/${encodeURIComponent(id)}/postpone`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ new_departure_time: date, reason }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const error = new Error(data.message || 'Could not postpone this booking.');
      error.conflicts = data.conflicts || [];
      throw error;
    }
    return data;
  },

  //     register   hearse  ..
  registerHearse: async (data) => {
    const h = getAuthHeaders(); h['Content-Type'] = 'application/json';
    const r = await fetchWithCredentials(`${API_BASE_URL}/hearses`, { method: 'POST', headers: h, body: JSON.stringify(data) });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || 'Failed to register'); }
    return r.json();
  },
};

/* ===== STYLED COMPONENTS ===== */
const Container = styled.div`
  min-height: 100vh;
  background: ${COLORS.bone};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: ${COLORS.text};
  box-sizing: border-box;
  *, *::before, *::after { box-sizing: border-box; }
`;

const MainContent = styled.div`
  max-width: 2200px;
  margin: 0 auto;
  padding: 0rem;
  @media (max-width: 900px) { padding: 0.75rem; }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.6rem;
  margin-bottom: 1rem;
`;

const StatCard = styled.div`
  background: ${props => props.$bg || COLORS.surface};
  border-radius: ${COLORS.radiusSm};
  box-shadow: ${COLORS.shadowSm};
  border: none;
  padding: 0.7rem 0.9rem;
  transition: ${COLORS.transition};
  position: relative;
  overflow: hidden;
  &:hover { transform: translateY(-2px); box-shadow: ${COLORS.shadowMd}; }
`;

const StatHeader = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;`;
const StatLabel = styled.div`font-size:0.62rem;font-weight:700;color:rgba(255,255,255,0.9);text-transform:uppercase;letter-spacing:0.05em;`;
const StatIcon = styled.div`width:22px;height:22px;border-radius:${COLORS.radiusXs};display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.2);color:#ffffff;`;
const StatValue = styled.div`font-size:1.25rem;font-weight:800;color:#ffffff;line-height:1.2;margin-bottom:0.15rem;`;
const StatSubtext = styled.div`font-size:0.64rem;color:rgba(255,255,255,0.8);font-weight:500;`;

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
  &:focus { outline: none; border-color: ${COLORS.accent}; box-shadow: 0 0 0 3px rgba(61, 79, 71, 0.1); }
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
  &:focus { outline: none; border-color: ${COLORS.accent}; box-shadow: 0 0 0 3px rgba(61, 79, 71, 0.1); }
`;

const TableCard = styled.div`
  background: ${COLORS.surface};
  border-radius: ${COLORS.radius};
  box-shadow: ${COLORS.shadowSm};
  border: 1px solid ${COLORS.line};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  min-width: 900px;
  font-family: 'Inter', sans-serif;
`;

const TableHead = styled.thead`
  background: ${COLORS.ink};
  border-bottom: none;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${COLORS.line};
  cursor: pointer;
  transition: ${COLORS.transition};
  background: ${({ $striped }) => ($striped ? COLORS.bone2 : COLORS.surface)};
  &:hover { background: ${COLORS.verdigrisTint}; }
  &:last-child { border-bottom: none; }
`;

const TableCell = styled.td`
  padding: 1rem 1.25rem;
  vertical-align: middle;
  border-bottom: none;
  color: ${COLORS.text};
`;

const TableHeader = styled.th`
  padding: 1rem 1.25rem;
  text-align: left;
  font-weight: 600;
  color: ${COLORS.bone};
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  border-bottom: none;
  font-family: 'Fraunces', 'Inter', serif;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.28rem 0.75rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  color: ${props => STATUS_CONFIG[props.$status]?.color || COLORS.text};
  background: ${props => STATUS_CONFIG[props.$status]?.bg || COLORS.bone2};
  border: 1px solid ${props => STATUS_CONFIG[props.$status]?.bg || COLORS.line};
  &::before {
    content: '';
    width: 8px; height: 8px;
    border-radius: 50%;
    background: ${props => STATUS_CONFIG[props.$status]?.dotColor || COLORS.borderLight};
    flex-shrink: 0;
  }
`;

// Priority badge — matches HTML dispatch design (colored dot + label)
const PriorityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  white-space: nowrap;
  font-size: 0.78rem;
  .priority-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
`;

// Driver tag — matches HTML dispatch design (initials in dot + name)
const DriverTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: ${COLORS.ink};
  font-weight: 500;
  .dot {
    width: 24px; height: 24px;
    border-radius: 50%;
    background: ${COLORS.verdigris};
    color: ${COLORS.bone};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Fraunces', 'Inter', serif;
    font-size: 0.75rem;
    font-weight: 600;
    flex-shrink: 0;
  }
  .assistant {
    font-size: 0.72rem;
    font-weight: 600;
    color: ${COLORS.brass};
    margin-left: 0.15rem;
    letter-spacing: 0.02em;
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
  background: ${props => props.$bg || COLORS.accent};
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
  &:disabled { background: ${COLORS.borderLight}; cursor: not-allowed; }
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
  &:hover { background: ${COLORS.bone2}; }
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
  &:hover:not(:disabled) { background: ${COLORS.bone2}; border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  ${props => props.$active && `background:${COLORS.accent};color:${COLORS.white};border-color:${COLORS.accent};`}
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
  background:linear-gradient(135deg,${COLORS.accentHover},${COLORS.accent});
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
const DrawerColumns = styled.div`
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  gap:1.25rem;
  align-items:start;
  @media(max-width:900px){grid-template-columns:1fr;}
`;

const LineupForm = styled.form`
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:0.75rem;
  & > div:last-child{grid-column:1 / -1;}
  @media(max-width:560px){grid-template-columns:1fr;& > div:last-child{grid-column:auto;}}
`;

/* Status banner */
const StatusStrip = styled.div`
  display:flex;align-items:center;gap:0.5rem;
  padding:0.7rem 0.95rem;border-radius:${COLORS.radiusSm};
  background:${props => STATUS_CONFIG[props.$status]?.bg || COLORS.borderLight};
  border:1px solid ${props => (STATUS_CONFIG[props.$status]?.bg || COLORS.borderLight) + '55'};
  margin-bottom:0.35rem;
  .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${props => STATUS_CONFIG[props.$status]?.color || COLORS.ink};}
  .lbl{font-size:0.875rem;font-weight:700;color:${COLORS.ink};opacity:0.95;align-self:center;}
  .cap{margin-left:auto;font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${COLORS.textMuted};opacity:0.9;}
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

const BookingMetaGrid = styled(DetailGrid)`
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:0.75rem 1rem;
  align-items:stretch;
  & > ${DetailItem}{padding:0.65rem 0.75rem;border:1px solid ${COLORS.borderLight};border-radius:${COLORS.radiusSm};}
  @media(max-width:560px){grid-template-columns:1fr;}
`;

const DetailLabel = styled.div`
  font-size:0.6875rem;
  font-weight:700;
  color:${COLORS.textSecondary};
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
const ModalHead = styled.div`padding:1rem 1.25rem;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,${COLORS.accentHover},${COLORS.accent});border-radius:${COLORS.radius} ${COLORS.radius} 0 0;`;
const ModalBody = styled.div`padding:1.25rem;`;
const ModalFoot = styled.div`display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;border-top:1px solid ${COLORS.border};padding-top:1rem;`;
const ModalInput = styled.input`width:100%;padding:0.5rem 0.75rem;border:1px solid ${COLORS.border};border-radius:${COLORS.radiusSm};font-size:0.8125rem;color:${COLORS.text};background:${COLORS.white};outline:none;box-sizing:border-box;&::placeholder{color:${COLORS.textSecondary}}&:focus{border-color:${COLORS.accent};box-shadow:0 0 0 2px rgba(61,79,71,0.1);}`;
const ModalLabel = styled.label`display:block;font-weight:600;margin-bottom:0.35rem;font-size:0.78rem;color:${COLORS.text};`;
const SmsDateQuickActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;
const SmsDateQuickButton = styled.button`
  flex: 1;
  min-height: 34px;
  border: 1px solid ${props => props.$active ? COLORS.accent : COLORS.border};
  border-radius: 8px;
  background: ${props => props.$active ? COLORS.accent : COLORS.white};
  color: ${props => props.$active ? COLORS.white : COLORS.textSecondary};
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  &:hover { border-color: ${COLORS.accent}; color: ${props => props.$active ? COLORS.white : COLORS.accent}; }
  &:focus-visible { outline: 3px solid rgba(61, 79, 71, .25); outline-offset: 2px; }
`;

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

const BookingInlineEditor = ({ draft, setDraft, hearses, branches, onSubmit, onCancel, saving }) => (
  <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
      <div>
        <ModalLabel htmlFor="inline-edit-client">Client name</ModalLabel>
        <ModalInput id="inline-edit-client" value={draft.client_name} onChange={(e) => setDraft({ ...draft, client_name: e.target.value })} />
      </div>
      <div>
        <ModalLabel htmlFor="inline-edit-phone">Client phone</ModalLabel>
        <ModalInput id="inline-edit-phone" value={draft.client_phone} onChange={(e) => setDraft({ ...draft, client_phone: e.target.value })} />
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
      <div>
        <ModalLabel htmlFor="inline-edit-from">Pickup location</ModalLabel>
        <ModalInput id="inline-edit-from" value={draft.from_location} onChange={(e) => setDraft({ ...draft, from_location: e.target.value })} />
      </div>
      <div>
        <ModalLabel htmlFor="inline-edit-to">Destination</ModalLabel>
        <ModalInput id="inline-edit-to" value={draft.to_location} onChange={(e) => setDraft({ ...draft, to_location: e.target.value })} />
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
      <div>
        <ModalLabel htmlFor="inline-edit-date">Pickup date</ModalLabel>
        <ModalInput id="inline-edit-date" type="date" value={draft.booking_date} onChange={(e) => setDraft({ ...draft, booking_date: e.target.value })} />
      </div>
      <div>
        <ModalLabel htmlFor="inline-edit-time">Pickup time</ModalLabel>
        <ModalInput id="inline-edit-time" type="time" value={draft.booking_time} onChange={(e) => setDraft({ ...draft, booking_time: e.target.value })} />
      </div>
    </div>
    <div>
      <ModalLabel htmlFor="inline-edit-hearse">Hearse</ModalLabel>
      <Select id="inline-edit-hearse" value={draft.hearse_id} onChange={(e) => setDraft({ ...draft, hearse_id: e.target.value })} style={{ width: '100%' }}>
        <option value="">No hearse selected</option>
        {(hearses || []).map((hearse) => <option key={hearse.id} value={hearse.id}>{hearse.hearse_name || hearse.plate_number || `Hearse ${hearse.id}`}</option>)}
      </Select>
    </div>
    <div>
      <ModalLabel htmlFor="inline-edit-branch">Branch</ModalLabel>
      <Select id="inline-edit-branch" value={draft.branch_id} onChange={(e) => {
        const branch = (branches || []).find((item) => String(item.branch_id ?? item.id) === String(e.target.value));
        setDraft({ ...draft, branch_id: e.target.value, branch_name: branch?.branch_name || branch?.name || draft.branch_name });
      }} style={{ width: '100%' }}>
        <option value="">Current branch</option>
        {(branches || []).map((branch) => {
          const id = branch.branch_id ?? branch.id;
          return <option key={id} value={id}>{branch.branch_name || branch.name || branch.branch_code || id}</option>;
        })}
      </Select>
    </div>
    <div>
      <ModalLabel htmlFor="inline-edit-charge">Service charge</ModalLabel>
      <ModalInput id="inline-edit-charge" type="number" min="0" step="0.01" value={draft.service_charge} onChange={(e) => setDraft({ ...draft, service_charge: e.target.value })} />
    </div>
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</PrimaryButton>
      <SecondaryButton type="button" onClick={onCancel} disabled={saving}>Cancel</SecondaryButton>
    </div>
  </form>
);

const HearseBookings = () => {
  // ── URL state (canonical numeric month) ─────────────────────────────────
  // The visible month lives in the query string so the page is linkable and
  // survives a refresh / shared link:
  //   /<tenant-slug>/hearse?month=9&year=2026&status=all
  //
  // The month is a NUMBER (1-12), not a name. Names invite a whole class of
  // bugs — "Sept"/"sep"/"9"/"09"/"September " all have to be normalised, and a
  // typo silently falls back to the wrong month. A number is validated once,
  // here, and everything downstream (ISO range, cache key, calendar) is derived
  // from it deterministically.
  const [searchParams, setSearchParams] = useSearchParams();

  // STRICT integer parse. `parseInt("9abc", 10)` returns 9, which would silently
  // show September for a malformed URL, so the whole string must be digits —
  // the regex rejects "", "9abc", "1.5", "-3", " 9 " and "0x9" alike.
  const toInt = (v) => {
    const s = String(v ?? '').trim();
    if (!/^\d{1,6}$/.test(s)) return NaN;
    const n = Number.parseInt(s, 10);
    return Number.isSafeInteger(n) ? n : NaN;
  };

  const rawMonth = toInt(searchParams.get('month'));
  const rawYear = toInt(searchParams.get('year'));
  // Reject out-of-range months and implausible years instead of letting them
  // through — a rolled-over Date would silently show the wrong month.
  const urlMonth = rawMonth >= 1 && rawMonth <= 12 ? rawMonth - 1 : NaN; // 0-based
  const urlYear = Number.isInteger(rawYear) && rawYear >= 1970 && rawYear <= 2200 ? rawYear : NaN;

  // Status is a free-text param, so it is whitelisted against the real status
  // list (module-level STATUS_LIST) rather than trusted. Anything unrecognised
  // behaves as "all" instead of silently filtering everything away.
  const rawStatus = String(searchParams.get('status') || 'all').trim().toLowerCase();
  const urlStatus = (rawStatus === 'all' || STATUS_LIST.includes(rawStatus)) ? rawStatus : 'all';

  // Month actually on screen. Anything missing or malformed in the URL falls
  // back to the current month, so a bare or broken /hearse link still works.
  // `now` is pinned once per mount (empty dep array) so it stays a STABLE
  // dependency — a fresh `new Date()` on every render would defeat the
  // memoisation on monthRange and refetch the month on every paint.
  const now = useMemo(() => new Date(), []);
  const initialMonth = Number.isNaN(urlMonth) ? now.getMonth() : urlMonth;
  const initialYear = Number.isNaN(urlYear) ? now.getFullYear() : urlYear;
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [viewYear, setViewYear] = useState(initialYear);

  // Rewrite the URL to the canonical form whenever the visible month changes.
  // `replace: true` is essential — pushing would stack a history entry per
  // month the user paged through.
  const goToMonth = useCallback((month, year) => {
    const m = Math.min(11, Math.max(0, month));
    const y = Math.min(2200, Math.max(1970, year));
    setViewMonth(m);
    setViewYear(y);
    const next = new URLSearchParams(searchParams);
    next.set('month', String(m + 1));   // 1-12 in the URL, 0-11 in JS
    next.set('year', String(y));
    next.set('status', urlStatus);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, urlStatus]);

  // The URL is the source of truth, so follow it when it changes underneath us
  // (browser Back / Forward, or a pasted link). Without this the grid would
  // keep showing the old month while the address bar said something else.
  // NaN means "malformed or absent", which we deliberately leave alone — the
  // current month is already showing and rewriting it here would fight the
  // initial state.
  useEffect(() => {
    if (!Number.isNaN(urlMonth) && urlMonth !== viewMonth) setViewMonth(urlMonth);
    if (!Number.isNaN(urlYear) && urlYear !== viewYear) setViewYear(urlYear);
  }, [urlMonth, urlYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const [bookings, setBookings] = useState([]);
  const [allHearses, setAllHearses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [savingBookingLineup, setSavingBookingLineup] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  // Seeded from the URL (?status=...) so a shared link opens with the same
  // filter applied. An empty string means "no status filter" client-side; the
  // URL uses 'all' for the same thing, hence the mapping.
  const [filterStatus, setFilterStatus] = useState(
    urlStatus && urlStatus !== 'all' ? urlStatus : ''
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode] = useState('calendar');
  const [calendarDayView, setCalendarDayView] = useState(false);
  const [selectedDate, setSelectedDate] = useState(formatDateStr(new Date()));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingLineupDraft, setBookingLineupDraft] = useState({
    driverId: '',
    driverName: '',
    assistantName: '',
  });
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [newBookingInitialDates, setNewBookingInitialDates] = useState([]);
  // Send SMS lineup modal
  const [smsLineupOpen, setSmsLineupOpen] = useState(false);
  const [smsLineupDate, setSmsLineupDate] = useState(selectedDate);
  const [smsLineupMessage, setSmsLineupMessage] = useState('');
  const [smsLineupLoading, setSmsLineupLoading] = useState(false);
  const [smsLineupResults, setSmsLineupResults] = useState(null);
  const [smsSelectedDriverIds, setSmsSelectedDriverIds] = useState([]);
  const [editingBooking, setEditingBooking] = useState(null);
  const [bookingDetailsEditing, setBookingDetailsEditing] = useState(false);
  const [editBookingDraft, setEditBookingDraft] = useState(null);
  const [editBookingSaving, setEditBookingSaving] = useState(false);

  const [actionMenuId, setActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);
  const [dateFilter, setDateFilter] = useState('all');

  // Register hearse
  const [registerHearseOpen, setRegisterHearseOpen] = useState(false);
  const [hearseForm, setHearseForm] = useState({ plate_number: '', hearse_name: '', model: '', capacity: '8', status: 'available', branch_id: '', branch_slug: '', branch_name: '', branch_code: '', fuel_card_number: '' });
  const [registerLoading, setRegisterLoading] = useState(false);

  // Cancel modal
  const [postponeBooking, setPostponeBooking] = useState(null);
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeReason, setPostponeReason] = useState('');
  const [postponeLoading, setPostponeLoading] = useState(false);

  const { socket, connected } = useSocket();
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
  const monthRange = useMemo(() => {
    const y = Number.isInteger(viewYear) ? viewYear : now.getFullYear();
    const m = Number.isInteger(viewMonth) && viewMonth >= 0 && viewMonth <= 11
      ? viewMonth
      : now.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    return { from: formatDateStr(first), to: formatDateStr(last) };
  }, [viewYear, viewMonth, now]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Only the visible month is requested. Branches and the fleet do not
      // change month-to-month, so they are still fetched once per call but the
      // (large) bookings payload is now bounded to ~30 days.
      const [bks, brs, hrs, drs] = await Promise.all([
        api.getBookings({ from: monthRange.from, to: monthRange.to }),
        api.getBranches(),
        api.getAllHearses(),
        api.getDrivers(),
      ]);
      setBookings(bks); setBranches(brs); setAllHearses(hrs); setDrivers(drs);
    } catch (e) { notify.error(e.message || 'Failed to load data'); }
    setLoading(false);
  }, [monthRange.from, monthRange.to]);

  // Refresh data IN PLACE — same fetch as loadData() but WITHOUT the
  // full-page loading spinner. This is used after a create/update so the
  // page only refreshes its data (the hearse fleet / bookings list) instead
  // of swapping the entire view for a full-screen spinner, which currently
  // feels like the whole page reloading.
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [bks, brs, hrs, drs] = await Promise.all([
        api.getBookings({ from: monthRange.from, to: monthRange.to }),
        api.getBranches(),
        api.getAllHearses(),
        api.getDrivers(),
      ]);
      setBookings(bks); setBranches(brs); setAllHearses(hrs); setDrivers(drs);
    } catch (e) { notify.error(e.message || 'Failed to refresh data'); }
    finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [monthRange.from, monthRange.to]);

  // Keep the calendar mounted while changing months so its selected daily
  // view survives week strips that cross a month boundary.
  useEffect(() => { refreshData(); }, [refreshData]);

  const saveBookingLineup = useCallback(async (bookingId, lineup) => {
    setSavingBookingLineup(String(bookingId));
    try {
      await api.assignBookingLineup(bookingId, lineup);
      const selectedDriver = drivers.find((driver) =>
        String(driver.driver_id ?? driver.id) === String(lineup.driver_id ?? '')
      );
      const assignedDriverName = lineup.driver_name
        || selectedDriver?.driver_name
        || selectedDriver?.full_name
        || '';
      setSelectedBooking((current) => {
        if (!current || String(current.booking_id || current.id) !== String(bookingId)) return current;
        return {
          ...current,
          driver_id: lineup.driver_id || null,
          manual_driver_name: lineup.driver_name || null,
          assigned_driver_name: assignedDriverName,
          assistant_name: lineup.assistant_name || null,
        };
      });
      await refreshData();
      notify.success('Booking driver and assistant lineup saved.');
    } catch (error) {
      const message = error.message || 'Failed to save the booking lineup.';
      notify.error(lineup.driver_id
        ? `Registered driver warning: ${message}`
        : message);
    } finally {
      setSavingBookingLineup(null);
    }
  }, [drivers, refreshData]);

  useEffect(() => {
    if (!socket || !connected) return;
    refreshData();
    const handleNewBooking = (d) => {
      if (d.booking) {
        setBookings(p => [d.booking, ...p]);
        const code = d.booking_code || `BK-${d.booking_id}`;
        notify.success(`New booking: ${code} - ${d.booking_client_name || 'Client'}`);
      }
    };
    const handleStatusUpdate = (d) => {
      setBookings(p => p.map(b => b.booking_id === d.booking_id ? { ...b, status: d.status, ...d.booking } : b));
    };
    const handleBookingPostponed = () => refreshData();
    const handleHearseChange = () => refreshData();
    socket.on('new_booking', handleNewBooking);
    socket.on('booking_status_updated', handleStatusUpdate);
    socket.on('booking_postponed', handleBookingPostponed);
    socket.on('hearse_data_changed', handleHearseChange);
    return () => {
      socket.off('new_booking', handleNewBooking);
      socket.off('booking_status_updated', handleStatusUpdate);
      socket.off('booking_postponed', handleBookingPostponed);
      socket.off('hearse_data_changed', handleHearseChange);
    };
  }, [socket, connected, refreshData]);

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

  const openDrawer = useCallback((b) => {
    setSelectedBooking(b);
    setBookingLineupDraft({
      driverId: b.driver_id == null ? '' : String(b.driver_id),
      driverName: b.manual_driver_name || (!b.driver_id ? b.assigned_driver_name || '' : ''),
      assistantName: b.assistant_name || '',
    });
    setDrawerOpen(true);
    setActionMenuId(null);
  }, []);
  const closeDrawer = useCallback(() => { setDrawerOpen(false); setSelectedBooking(null); }, []);

  // ── Send SMS lineup ───────────────────────────────────────────────────────
  const getLineupBookingsForDate = useCallback((date) => {
    if (!date) return [];
    const dayBookings = bookings.filter((b) => {
      let dates = [];
      try {
        const parsedDates = typeof b.booking_dates === 'string' ? JSON.parse(b.booking_dates) : b.booking_dates;
        dates = Array.isArray(parsedDates) ? parsedDates : [];
      } catch {
        dates = [];
      }
      if (dates.length === 0 && b.booking_date) dates = [String(b.booking_date).slice(0, 10)];
      if (dates.length === 0 && b.estimated_departure_time) dates = [String(b.estimated_departure_time).slice(0, 10)];
      return dates.some((d) => String(d).slice(0, 10) === date);
    });
    return dayBookings;
  }, [bookings]);

  const buildLineupMessage = useCallback((date) => {
    const dayBookings = getLineupBookingsForDate(date);
    if (dayBookings.length === 0) return '';
    const lines = dayBookings.map((b) => {
      const time = fmtBookingTime(b);
      return `- ${b.client_name || 'Client'}: ${b.from_location || b.from || '—'} → ${b.to_location || b.destination || '—'}${time !== 'Not specified' ? ` @ ${time}` : ''}`;
    }).join('\n');
    const label = new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    return `Rest Point Hearse Lineup — ${label}:\n${lines}\n\nPlease reply to confirm receipt.`;
  }, [getLineupBookingsForDate, fmtBookingTime]);

  const openSmsLineup = useCallback(() => {
    const defaultDate = formatDateStr(new Date());
    setSmsLineupDate(defaultDate);
    setSmsLineupMessage(buildLineupMessage(defaultDate));
    setSmsLineupResults(null);
    setSmsSelectedDriverIds([]);
    setSmsLineupOpen(true);
  }, [buildLineupMessage]);

  const sendSmsLineup = useCallback(async () => {
    if (getLineupBookingsForDate(smsLineupDate).length === 0) {
      setSmsLineupMessage('');
      notify.error('No bookings are scheduled for this date. No SMS was sent.');
      return;
    }
    setSmsLineupLoading(true);
    setSmsLineupResults(null);
    try {
      const data = await api.sendSmsLineup({
        date: smsLineupDate,
        message: smsLineupMessage,
        driverIds: smsSelectedDriverIds,
      });
      setSmsLineupResults(data);
      notify.success(`SMS lineup sent to ${data.sent || 0} of ${data.total || 0} driver(s).`);
    } catch (error) {
      notify.error(error.message || 'Failed to send SMS lineup.');
    } finally {
      setSmsLineupLoading(false);
    }
  }, [smsLineupDate, smsLineupMessage, smsSelectedDriverIds, getLineupBookingsForDate]);

  const closeSmsLineup = useCallback(() => { setSmsLineupOpen(false); setSmsLineupResults(null); }, []);
  const smsLineupBookingCount = getLineupBookingsForDate(smsLineupDate).length;
  const smsTodayDate = formatDateStr(new Date());
  const smsTomorrowDateObject = new Date();
  smsTomorrowDateObject.setDate(smsTomorrowDateObject.getDate() + 1);
  const smsTomorrowDate = formatDateStr(smsTomorrowDateObject);

  const changeStatus = useCallback(async (booking, status, reason, skipConfirmation = false) => {
    const id = booking.booking_id || booking.id;

    // ── Date gating ─────────────────────────────────────────────────────────
    // Only today's bookings may have their status advanced (in_transit,
    // completed, postponed, etc.). Future bookings (tomorrow or within 3
    // days) may ONLY be cancelled.
    const today = isBookingToday(booking);
    const future = isBookingInFuture(booking);

    if (!today && status !== 'cancelled') {
      await Swal.fire({
        icon: 'warning',
        title: 'Cannot update status',
        html: `This booking is for a future date. You can only update the status of <b>today's</b> bookings. Future bookings can only be <b>cancelled</b>.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#1a5f7a',
      });
      setActionMenuId(null);
      return;
    }

    // ── SweetAlert confirmation ────────────────────────────────────────────
    const isCompleted = status === 'completed';
    const confirmHtml = isCompleted
      ? `<div style="text-align:left;"><p style="margin:0 0 0.5rem 0;"><b>Are you sure you want to mark this hearse as <span style="color:#5F0F40">Completed</span>?</b></p><p style="margin:0;color:#ef4444;font-size:0.85rem;"><b>Warning:</b> Once completed, this hearse will become <b>available and ready for booking</b> again.</p></div>`
      : `<div style="text-align:left;"><p style="margin:0;"><b>Are you sure you want to update this hearse status to <span style="color:#1a5f7a">${STATUS_CONFIG[status]?.label || status}</span>?</b></p></div>`;

    const result = skipConfirmation ? { isConfirmed: true } : await Swal.fire({
      icon: isCompleted ? 'warning' : 'question',
      title: isCompleted ? 'Confirm Completion' : 'Confirm Status Update',
      html: confirmHtml,
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel',
      confirmButtonColor: isCompleted ? '#5F0F40' : '#1a5f7a',
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      setActionMenuId(null);
      return;
    }

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
      closeDrawer();
    } catch { notify.error('Failed to update'); }
  }, [selectedBooking]);

  const openCancelModal = useCallback(async (b) => {
    setActionMenuId(null);
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Cancel Booking?',
      text: b?.booking_code || genId(b?.booking_id),
      input: 'textarea',
      inputValue: b?.cancel_reason || '',
      inputPlaceholder: 'Enter reason for cancellation...',
      inputAttributes: { 'aria-label': 'Cancellation reason' },
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel booking',
      cancelButtonText: 'Keep booking',
      confirmButtonColor: '#134b5f',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
      inputValidator: (value) => !String(value || '').trim() ? 'A cancellation reason is required.' : undefined,
    });
    if (result.isConfirmed) await changeStatus(b, 'cancelled', String(result.value).trim(), true);
  }, [changeStatus]);

  const openPostponeModal = useCallback((booking) => {
    setPostponeBooking(booking);
    setPostponeDate(formatDateStr(new Date()));
    setPostponeReason('');
    setActionMenuId(null);
  }, []);

  const closePostponeModal = useCallback(() => {
    if (postponeLoading) return;
    setPostponeBooking(null);
    setPostponeDate('');
    setPostponeReason('');
  }, [postponeLoading]);

  const confirmPostpone = useCallback(async () => {
    if (!postponeBooking || !postponeDate) {
      notify.error('Choose a new departure date first.');
      return;
    }
    setPostponeLoading(true);
    try {
      const id = postponeBooking.booking_id || postponeBooking.id;
      await api.postponeBooking(id, postponeDate, postponeReason.trim());
      await refreshData();
      notify.success('Booking postponed successfully.');
      setPostponeBooking(null);
      setPostponeDate('');
      setPostponeReason('');
      closeDrawer();
    } catch (error) {
      const conflictDates = (error.conflicts || []).map((conflict) => conflict.date).filter(Boolean);
      await Swal.fire({
        icon: 'error',
        title: conflictDates.length ? 'Hearse is unavailable' : 'Could not postpone booking',
        text: conflictDates.length
          ? `${error.message} Conflicting date${conflictDates.length === 1 ? '' : 's'}: ${conflictDates.join(', ')}`
          : error.message,
        confirmButtonColor: '#1a5f7a',
      });
    } finally {
      setPostponeLoading(false);
    }
  }, [postponeBooking, postponeDate, postponeReason, refreshData, closeDrawer]);

  // FIX: missing closeCancelModal function — now defined
  const openNewBooking = useCallback((date) => {
    const initialDates = date ? [date] : [];
    setNewBookingInitialDates(initialDates);
    setNewBookingOpen(true);
  }, []);

  const closeNewBooking = useCallback(() => {
    setNewBookingOpen(false);
    setNewBookingInitialDates([]);
    setEditingBooking(null);
  }, []);

  const openEditBooking = useCallback((booking) => {
    let dates = [];
    try {
      dates = typeof booking.booking_dates === 'string' ? JSON.parse(booking.booking_dates) : booking.booking_dates;
    } catch { dates = []; }
    const bookingDate = Array.isArray(dates) && dates.length
      ? String(dates[0]).slice(0, 10)
      : String(booking.booking_date || booking.from_timestamp || '').slice(0, 10);
    const timeMatch = String(booking.from_timestamp || '').match(/(?:T|\s)(\d{2}:\d{2})/);
    setEditBookingDraft({
      client_name: booking.client_name || '',
      client_phone: booking.client_phone || '',
      from_location: booking.from_location || '',
      to_location: booking.to_location || booking.destination || '',
      booking_date: bookingDate,
      booking_time: booking.booking_time || timeMatch?.[1] || '',
      booking_dates: Array.isArray(dates) && dates.length ? dates : [bookingDate],
      hearse_id: booking.hearse_id == null ? '' : String(booking.hearse_id),
      branch_id: booking.branch_id == null ? '' : String(booking.branch_id),
      branch_name: booking.branch_name || '',
      service_charge: Number(booking.service_charge || 0),
    });
    setBookingDetailsEditing(true);
  }, []);

  const cancelEditBooking = useCallback(() => {
    setBookingDetailsEditing(false);
    setEditBookingDraft(null);
  }, []);

  const saveEditBooking = useCallback(async (event) => {
    event.preventDefault();
    if (!selectedBooking || !editBookingDraft) return;
    const result = await Swal.fire({
      icon: 'question',
      title: 'Are you sure?',
      text: 'Save these booking detail changes?',
      showCancelButton: true,
      confirmButtonText: 'Yes, save changes',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#134b5f',
      cancelButtonColor: '#64748b',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    setEditBookingSaving(true);
    try {
      const dates = [editBookingDraft.booking_date].filter(Boolean);
      const updated = await api.updateBooking(selectedBooking.booking_id || selectedBooking.id, {
        ...editBookingDraft,
        booking_dates: dates,
        service_charge: Number(editBookingDraft.service_charge) || 0,
      });
      setSelectedBooking((current) => ({ ...current, ...updated }));
      setBookingDetailsEditing(false);
      setEditBookingDraft(null);
      await refreshData();
      notify.success('Booking updated successfully.');
    } catch (error) {
      notify.error(error.message || 'Failed to update the booking.');
    } finally {
      setEditBookingSaving(false);
    }
  }, [editBookingDraft, refreshData, selectedBooking]);

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
    if (registrationBranches.length > 0 && !hearseForm.branch_id && !hearseForm.branch_slug) {
      notify.error('Select the branch this hearse belongs to');
      return;
    }
    if (!hearseForm.branch_name.trim()) {
      notify.error('Enter or select a branch name');
      return;
    }
    setRegisterLoading(true);
    try {
      const payload = { ...hearseForm };
      const fuelCard = String(payload.fuel_card_number || '').trim();
      if (fuelCard) payload.fuel_card_number = fuelCard;
      else delete payload.fuel_card_number;
      payload.plate_number = String(payload.plate_number || '').trim();
      payload.hearse_name = String(payload.hearse_name || '').trim();
      if (payload.model) payload.model = String(payload.model).trim();
      payload.branch_name = String(payload.branch_name || '').trim();
      await api.registerHearse(payload);
      notify.success('Hearse registered successfully!');
      setRegisterHearseOpen(false);
      setHearseForm({ plate_number: '', hearse_name: '', model: '', capacity: '8', status: 'available', branch_id: '', branch_slug: '', branch_name: '', branch_code: '', fuel_card_number: '' });
      // Refresh only the data in place — do NOT call loadData() here because
      // that toggles a full-screen spinner (setLoading(true)) which makes the
      // whole page swap to a spinner, i.e. a "whole page refresh". Using
      // refreshData() keeps the current view mounted and just updates the list.
      await refreshData();
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
          btns.push(<span key={`dots-${i}`} style={{ padding: '0 0.25rem', color: COLORS.textSecondary, fontSize: '0.8rem' }}>…</span>);
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

  /* The booking feed reports a generic branch_name ("Main"), so it cannot be
     shown directly. Resolve the real name from the live branch list first —
     that is authoritative and works for any tenant, unlike the hardcoded
     slug→name map in viewerShared — then fall back to the slug resolver.

     NOTE: this must stay ABOVE the `if (loading)` early return below. A hook
     that only runs on the non-loading render is a hooks-order violation and
     crashes the page with React error #310 ("Rendered more hooks than during
     the previous render"). */
  const branchOptions = branches.length > 0 ? branches : [];
  const registrationBranches = useMemo(() => {
    const byKey = new Map();
    branchOptions.forEach((branch) => {
      const id = branch?.branch_id || branch?.branchId || branch?.id || '';
      const slug = branch?.branch_slug || branch?.branchSlug || branch?.slug || branch?.branch_db_name || branch?.branchDbName || '';
      const name = String(branch?.branch_name || branch?.branchName || branch?.name || '').trim();
      const key = String(id || slug);
      if (!key || !name || GENERIC_BRANCH_NAMES.has(name.toLowerCase())) return;
      byKey.set(key, {
        key,
        id: String(id),
        slug: String(slug),
        code: String(branch?.branch_code || branch?.branchCode || ''),
        name,
      });
    });
    return Array.from(byKey.values());
  }, [branchOptions]);
  const branchNameByKey = useMemo(() => {
    const m = new Map();
    branchOptions.forEach((br) => {
      const nm = br?.branch_name || br?.name || br?.branch_slug || '';
      if (!nm) return;
      [br?.branch_id, br?.branch_slug, br?.id, br?.slug].forEach((k) => {
        if (k != null && k !== '') m.set(String(k).toLowerCase(), nm);
      });
    });
    return m;
  }, [branchOptions]);

  const branchLabel = (b) => {
    if (!b) return 'Unknown';
    // 1. The API now joins the branches registry, so `branch_name` is the REAL
    //    name ("Nairobi", "Thika", "Eter Mumo"). Trust it — but only when it is a
    //    real name, since older/other feeds can still send a generic literal.
    const apiName = (b.branch_name || '').trim();
    if (apiName && !GENERIC_BRANCH_NAMES.has(apiName.toLowerCase())) return apiName;

    // 2. Live branch list — authoritative for any tenant.
    const keys = [b.branch_id, b.branch_slug, b.branch, b.booking_branch_slug, b.hearse_branch_id, b.branch_slug_resolved];
    for (const k of keys) {
      if (k == null || k === '') continue;
      const hit = branchNameByKey.get(String(k).toLowerCase());
      if (hit && !GENERIC_BRANCH_NAMES.has(String(hit).toLowerCase())) return hit;
    }

    // 3. Slug/registry resolver in viewerShared.
    const resolved = resolveBranchName(b);
    if (resolved && !GENERIC_BRANCH_NAMES.has(String(resolved).toLowerCase())) return resolved;

    // 4. Nothing resolved to a real branch — show the branch's own value rather
    //    than the misleading "Main Branch" placeholder.
    const byId = b.branch_id == null ? '' : branchNameByKey.get(String(b.branch_id).toLowerCase());
    return apiName || byId || resolved || 'Unknown';
  };

  if (loading) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <RefreshCw size={32} color={COLORS.accent} className="animate-spin" />
      </Container>
    );
  }

  return (
    <Container>
      <SwalZIndex />
      <MainContent>
        {/* Stats Cards */}
        {!calendarDayView && <StatsGrid>
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
        </StatsGrid>}

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
            <Select
              value={filterStatus}
              onChange={(e) => {
                const v = e.target.value;
                setFilterStatus(v);
                // Keep the URL in step so the status filter is shareable too.
                const next = new URLSearchParams(searchParams);
                next.set('status', v || 'all');
                setSearchParams(next, { replace: true });
              }}
            >
              <option value="">All Statuses</option>
              {STATUS_LIST.map((status) => <option key={status} value={status}>{STATUS_CONFIG[status]?.label || status}</option>)}
            </Select>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <ActionButton
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? COLORS.accent : COLORS.surface,
                  color: viewMode === 'table' ? COLORS.white : COLORS.textSecondary
                }}
              >{Icons.list}</ActionButton>
              <ActionButton
                onClick={() => setViewMode('calendar')}
                style={{
                  background: viewMode === 'calendar' ? COLORS.accent : COLORS.surface,
                  color: viewMode === 'calendar' ? COLORS.white : COLORS.textSecondary
                }}
              >{Icons.grid}</ActionButton>
            </div>

            <SecondaryButton onClick={refreshData} disabled={refreshing} style={{ marginLeft: 'auto' }}>
              {Icons.refresh} {refreshing ? 'Refreshing...' : 'Refresh'}
            </SecondaryButton>
            <PrimaryButton $bg="#DD2D4A" onClick={() => openNewBooking('')}>{Icons.plus} Book Hearse</PrimaryButton>
            <PrimaryButton
              onClick={() => {
                const currentBranchId = String(getBranchId() || '');
                const currentBranchSlug = String(getBranchSlug() || '');
                const currentBranch = registrationBranches.find((branch) =>
                  (currentBranchId && branch.id === currentBranchId)
                  || (currentBranchSlug && branch.slug.toLowerCase() === currentBranchSlug.toLowerCase())
                );
                setHearseForm((form) => ({
                  ...form,
                  branch_id: currentBranch?.id || '',
                  branch_slug: currentBranch?.slug || '',
                  branch_name: currentBranch?.name || '',
                  branch_code: currentBranch?.code || '',
                }));
                setRegisterHearseOpen(true);
              }}
              $bg={COLORS.success}
            >{Icons.plus} Register Hearse</PrimaryButton>
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
                      <TableHeader>Hearse Name</TableHeader>
                      <TableHeader>Number Plate</TableHeader>
                      <TableHeader>Pickup</TableHeader>
                      <TableHeader>Destination</TableHeader>
                      <TableHeader>Time</TableHeader>
                      <TableHeader>Priority</TableHeader>
                      <TableHeader>Driver</TableHeader>
                      <TableHeader>Status</TableHeader>
                    </tr>
                  </TableHead>
                  <tbody>
                    {pageData.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <EmptyState>
                            <Truck />
                            <h4>No dispatches found</h4>
                            <p>Try adjusting your filters or create a new booking.</p>
                          </EmptyState>
                        </td>
                      </tr>
                    ) : (
                      pageData.map((b, idx) => {
                        const bid = b.booking_id || b.id;
                        const code = b.booking_code || genId(bid, b.plate_number);
                        const statusConfig = STATUS_CONFIG[String(b.status || '').toLowerCase().replace(/\s+/g, '_')] || STATUS_CONFIG.booked;
                        const priority = b.priority || 'Normal';
                        const priorityColor =
                          priority === 'Critical' || priority === 'critical' ? COLORS.red :
                            priority === 'High' || priority === 'high' ? COLORS.orange :
                              priority === 'Medium' || priority === 'medium' ? COLORS.yellow :
                                COLORS.green;
                        const driverName = b.driver_name || b.driver || 'Unassigned';
                        const assistantName = b.assistant_name || '';
                        const driverInitials = driverName
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'DR';
                        return (
                          <TableRow key={bid} $striped={idx % 2 === 1} onClick={() => openDrawer(b)}>
                            <TableCell>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: COLORS.ink }}>{b.hearse_name || code}</div>
                              {b.plate_number && (
                                <span className="plate" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: COLORS.brass, letterSpacing: '0.06em', display: 'block', marginTop: '2px' }}>{b.plate_number}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: COLORS.brass }}>{b.plate_number || '—'}</div>
                            </TableCell>
                            <TableCell>
                              <div style={{ fontSize: '0.82rem', color: COLORS.textSecondary }}>{b.from_location || '—'}</div>
                            </TableCell>
                            <TableCell>
                              <div style={{ fontSize: '0.82rem', color: COLORS.textSecondary }}>{b.to_location || b.destination || '—'}</div>
                            </TableCell>
                            <TableCell>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: COLORS.ink }}>{fmtBookingTime(b)}</div>
                            </TableCell>
                            <TableCell>
                              <PriorityBadge>
                                <span className="priority-dot" style={{ background: priorityColor }} />
                                <span style={{ color: priorityColor }}>{priority}</span>
                              </PriorityBadge>
                            </TableCell>
                            <TableCell>
                              <DriverTag>
                                <span className="dot">{driverInitials}</span>
                                {driverName}
                                {assistantName && <span className="assistant">+ {assistantName}</span>}
                              </DriverTag>
                            </TableCell>
                            <TableCell>
                              <StatusBadge $status={String(b.status || '').toLowerCase().replace(/\s+/g, '_')}>
                                {statusConfig.label || b.status}
                              </StatusBadge>
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
                                      <ActionMenuItem onClick={() => changeStatus(b, 'in_transit')}>{Icons.truck} Mark In Transit</ActionMenuItem>
                                    )}
                                    {b.status === 'in_transit' && (
                                      <ActionMenuItem onClick={() => changeStatus(b, 'completed')}>{Icons.check} Mark Completed</ActionMenuItem>
                                    )}
                                    {!['completed', 'cancelled'].includes(b.status) && (
                                      <ActionMenuItem onClick={() => openPostponeModal(b)}>{Icons.clock} Postpone</ActionMenuItem>
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
              allBookings={bookings}
              hearses={allHearses}
              branches={branches}
              drivers={drivers}
              onSendSmsLineup={openSmsLineup}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onDateClick={(date) => {
                const [year, month] = date.split('-').map(Number);
                if (Number.isInteger(year) && Number.isInteger(month)
                  && (month - 1 !== viewMonth || year !== viewYear)) {
                  goToMonth(month - 1, year);
                }
              }}
              onDayViewChange={setCalendarDayView}
              onItemClick={openDrawer}
              onCreateBooking={onCreateBooking}
              month={new Date(viewYear, viewMonth, 1)}
              onMonthChange={goToMonth}
            />
          )}

        </TableCard>
      </MainContent>

      {/* ─── Detail Drawer ─── */}
      {drawerOpen && <DrawerOverlay onClick={closeDrawer} />}
      <Drawer $open={drawerOpen} $w="860px">
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

              <DrawerColumns>
                <DetailGrid>
                  {bookingDetailsEditing && editBookingDraft ? (
                    <BookingInlineEditor
                      draft={editBookingDraft}
                      setDraft={setEditBookingDraft}
                      hearses={allHearses}
                      branches={branches}
                      onSubmit={saveEditBooking}
                      onCancel={cancelEditBooking}
                      saving={editBookingSaving}
                    />
                  ) : (<>
                    <DetailItem>
                      <DetailLabel>Client</DetailLabel>
                      <DetailValue>
                        {selectedBooking.client_name || 'N/A'}
                        {selectedBooking.client_phone && (
                          <div style={{ fontSize: '0.78rem', color: COLORS.textSecondary, marginTop: '0.15rem' }}>
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
                      <DetailLabel>Pickup time</DetailLabel>
                      <DetailValue>{fmtBookingTime(selectedBooking)}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Dates</DetailLabel>
                      <DetailValue>
                        {(() => {
                          const multiDay = isMultiDay(selectedBooking);
                          const dates = multiDay ? getBookingDateRange(selectedBooking) : [];
                          const color = multiDay ? getMultiDayColor(selectedBooking) : null;
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div>{fmtBookingDates(selectedBooking)}</div>
                              {multiDay && dates.length > 1 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                  {dates.map((d, idx) => {
                                    const dt = new Date(d + 'T00:00:00');
                                    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()];
                                    return (
                                      <span key={d} style={{
                                        background: color,
                                        color: '#fff',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontSize: 10,
                                        fontWeight: 600,
                                      }}>
                                        {dayName} {dt.getDate()}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Hearse</DetailLabel>
                      <DetailValue>
                        {selectedBooking.hearse_name || 'N/A'}
                        {selectedBooking.plate_number && (
                          <div style={{ fontSize: '0.78rem', color: COLORS.textSecondary, marginTop: '0.15rem' }}>
                            {selectedBooking.plate_number}
                          </div>
                        )}
                      </DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Total Service Charge</DetailLabel>
                      <DetailValue
                        style={{
                          fontWeight: 700,
                          color: Number(selectedBooking.service_charge ?? selectedBooking.total_service_charge ?? selectedBooking.total_charge) > 0
                            ? COLORS.successDark
                            : COLORS.textSecondary,
                        }}
                      >
                        {(() => {
                          const charge = Number(selectedBooking.service_charge ?? selectedBooking.total_service_charge ?? selectedBooking.total_charge) || 0;
                          return charge > 0 ? `KSH ${charge.toLocaleString()}` : 'Not set (optional)';
                        })()}
                      </DetailValue>
                    </DetailItem>
                    {selectedBooking.cancel_reason && (
                      <DetailItem style={{ gridColumn: '1 / -1' }}>
                        <DetailLabel>Cancel Reason</DetailLabel>
                        <DetailValue style={{ color: COLORS.danger }}>{selectedBooking.cancel_reason}</DetailValue>
                      </DetailItem>
                    )}
                    {selectedBooking.postpone_reason && (
                      <DetailItem style={{ gridColumn: '1 / -1' }}>
                        <DetailLabel>Postponement Reason</DetailLabel>
                        <DetailValue>{selectedBooking.postpone_reason}</DetailValue>
                      </DetailItem>
                    )}
                  </>)}
                </DetailGrid>

                <div style={{ minWidth: 0 }}>
                  <div style={{
                    border: `1px solid ${COLORS.line}`,
                    borderRadius: COLORS.radiusSm,
                    padding: '1rem',
                    marginBottom: '1.25rem',
                    background: COLORS.bone,
                  }}>
                    <div style={{ marginBottom: '0.85rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: COLORS.ink }}>Driver lineup</div>
                      <div style={{ marginTop: '0.2rem', fontSize: '0.75rem', color: COLORS.gray }}>
                        Assign or update the driver and assistant for this booking.
                      </div>
                    </div>
                    <LineupForm
                      onSubmit={(event) => {
                        event.preventDefault();
                        const selectedDriver = drivers.find((driver) =>
                          String(driver.driver_id ?? driver.driver_key ?? '') === String(bookingLineupDraft.driverId || '')
                        );
                        saveBookingLineup(selectedBooking.booking_id || selectedBooking.id, {
                          driver_id: selectedDriver
                            ? (selectedDriver.driver_id ?? null)
                            : (bookingLineupDraft.driverName.trim() ? null : bookingLineupDraft.driverId || null),
                          driver_name: bookingLineupDraft.driverName.trim() || selectedDriver?.driver_name || '',
                          registered_driver_key: selectedDriver?.tenant_user_id || null,
                          assistant_name: bookingLineupDraft.assistantName,
                        });
                      }}
                    >
                      <div>
                        <ModalLabel htmlFor="booking-lineup-driver">Select driver (optional)</ModalLabel>
                        <Select
                          id="booking-lineup-driver"
                          value={bookingLineupDraft.driverId}
                          onChange={(event) => setBookingLineupDraft((current) => ({
                            ...current,
                            driverId: event.target.value,
                            driverName: '',
                          }))}
                          style={{ width: '100%' }}
                        >
                          <option value="">{drivers.length ? 'Unassigned' : 'No drivers found for this tenant'}</option>
                          {drivers.map((driver) => {
                            const driverId = driver.driver_id ?? driver.driver_key ?? driver.id;
                            return (
                              <option key={driverId} value={driverId}>
                                {driver.driver_name || driver.full_name || `Driver ${driverId}`}
                              </option>
                            );
                          })}
                        </Select>
                      </div>
                      <div>
                        <ModalLabel htmlFor="booking-lineup-manual-driver">Or enter driver name</ModalLabel>
                        <ModalInput
                          id="booking-lineup-manual-driver"
                          value={bookingLineupDraft.driverName}
                          onChange={(event) => setBookingLineupDraft((current) => ({
                            ...current,
                            driverId: '',
                            driverName: event.target.value,
                          }))}
                          placeholder="Type driver name"
                        />
                      </div>
                      <div>
                        <ModalLabel htmlFor="booking-lineup-assistant">Assistant name (optional)</ModalLabel>
                        <ModalInput
                          id="booking-lineup-assistant"
                          value={bookingLineupDraft.assistantName}
                          onChange={(event) => setBookingLineupDraft((current) => ({
                            ...current,
                            assistantName: event.target.value,
                          }))}
                          placeholder="Enter assistant name"
                        />
                      </div>
                      <div>
                        <PrimaryButton
                          type="submit"
                          disabled={String(savingBookingLineup || '') === String(selectedBooking.booking_id || selectedBooking.id)}
                        >
                          {String(savingBookingLineup || '') === String(selectedBooking.booking_id || selectedBooking.id)
                            ? 'Saving lineup...'
                            : 'Save lineup'}
                        </PrimaryButton>
                      </div>
                    </LineupForm>
                  </div>
                  <BookingMetaGrid style={{ marginTop: '1rem', marginBottom: 0 }}>
                    <DetailItem>
                      <DetailLabel>Branch</DetailLabel>
                      <DetailValue style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {(() => {
                          const name = branchLabel(selectedBooking);
                          const multiDay = isMultiDay(selectedBooking);
                          const color = multiDay ? getMultiDayColor(selectedBooking) : null;
                          return (
                            <>
                              {color && (
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                              )}
                              <span style={{ fontWeight: 600, color: color || 'inherit' }}>{name}</span>
                            </>
                          );
                        })()}
                      </DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Booked By</DetailLabel>
                      <DetailValue style={{ color: COLORS.bookingAccent }}>
                        {selectedBooking.booked_by || 'System'}
                      </DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Created</DetailLabel>
                      <DetailValue>{fmtDate(selectedBooking.created_at)}</DetailValue>
                    </DetailItem>
                  </BookingMetaGrid>
                  <SecondaryButton
                    type="button"
                    onClick={() => openEditBooking(selectedBooking)}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      marginTop: '1rem',
                      background: '#134b5f',
                      color: COLORS.white,
                      borderColor: '#134b5f',
                    }}
                  >
                    Edit Booking
                  </SecondaryButton>
                  {!['completed', 'cancelled'].includes(selectedBooking.status) && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                      {selectedBooking.status === 'booked' && (
                        <PrimaryButton onClick={() => { changeStatus(selectedBooking, 'in_transit'); }}>
                          {Icons.truck} Mark In Transit
                        </PrimaryButton>
                      )}
                      {selectedBooking.status === 'in_transit' && (
                        <PrimaryButton onClick={() => { changeStatus(selectedBooking, 'completed'); }}>
                          {Icons.check} Mark Completed
                        </PrimaryButton>
                      )}
                      <SecondaryButton
                        onClick={() => { openCancelModal(selectedBooking); closeDrawer(); }}
                        style={{
                          background: COLORS.bookingAccent,
                          color: COLORS.white,
                          borderColor: COLORS.bookingAccent,
                        }}
                      >
                        {Icons.x} Cancel Booking
                      </SecondaryButton>
                    </div>
                  )}
                </div>
              </DrawerColumns>
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
                    <option value="out_of_service">Out of Service</option>
                  </Select>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <ModalLabel>Branch *</ModalLabel>
                  {registrationBranches.length > 0 ? (
                    <Select
                      value={hearseForm.branch_id || hearseForm.branch_slug}
                      onChange={(e) => {
                        const selectedBranch = registrationBranches.find((branch) => branch.key === e.target.value);
                        setHearseForm((form) => ({
                          ...form,
                          branch_id: selectedBranch?.id || '',
                          branch_slug: selectedBranch?.slug || '',
                          branch_name: selectedBranch?.name || '',
                          branch_code: selectedBranch?.code || '',
                        }));
                      }}
                      style={{ width: '100%' }}
                      required
                    >
                      <option value="">Select branch</option>
                      {registrationBranches.map((branch) => (
                        <option key={branch.key} value={branch.key}>{branch.name}</option>
                      ))}
                    </Select>
                  ) : (
                    <ModalInput
                      placeholder="e.g., Nairobi or Thika"
                      value={hearseForm.branch_name}
                      onChange={(e) => setHearseForm((form) => ({ ...form, branch_name: e.target.value }))}
                      required
                    />
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <ModalLabel>Fuel Card Number</ModalLabel>
                    <ModalInput placeholder="e.g., FC-12345" value={hearseForm.fuel_card_number}
                      onChange={e => setHearseForm(p => ({ ...p, fuel_card_number: e.target.value }))} maxLength={50} />
                  </div>
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

      {postponeBooking && (
        <ModalOverlay onClick={closePostponeModal}>
          <ModalBox onClick={(event) => event.stopPropagation()}>
            <ModalHead>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Postpone Hearse Booking</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                  {postponeBooking.booking_code || genId(postponeBooking.booking_id || postponeBooking.id)}
                </div>
              </div>
              <button type="button" onClick={closePostponeModal} disabled={postponeLoading} aria-label="Close postpone dialog"
                style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </ModalHead>
            <ModalBody>
              <p style={{ marginTop: 0, color: COLORS.textSecondary, fontSize: '0.82rem' }}>
                The service checks availability before saving. Multi-day bookings keep their duration.
              </p>
              <div style={{ marginBottom: '0.85rem' }}>
                <ModalLabel htmlFor="hearse-postpone-date">New departure date *</ModalLabel>
                <ModalInput id="hearse-postpone-date" type="date" min={formatDateStr(new Date())} value={postponeDate}
                  onChange={(event) => setPostponeDate(event.target.value)} required />
              </div>
              <div>
                <ModalLabel htmlFor="hearse-postpone-reason">Reason (optional)</ModalLabel>
                <ModalInput id="hearse-postpone-reason" value={postponeReason} maxLength={500}
                  onChange={(event) => setPostponeReason(event.target.value)} placeholder="Reason for postponement" />
              </div>
              <ModalFoot>
                <SecondaryButton type="button" onClick={closePostponeModal} disabled={postponeLoading}>Cancel</SecondaryButton>
                <PrimaryButton type="button" onClick={confirmPostpone} disabled={postponeLoading || !postponeDate}>
                  {postponeLoading ? 'Checking availability…' : 'Check & Postpone'}
                </PrimaryButton>
              </ModalFoot>
            </ModalBody>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* Cancellation UI is handled by SweetAlert above. */}
      {false && (
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
          editingBooking={editingBooking}
          showToast={(msg, type) => { if (type === 'success') notify.success(msg); else notify.error(msg); }}
          onClose={closeNewBooking}
          onCreated={loadData}
          onUpdated={loadData}
        />
      )}
      {/* ─── Send SMS Line Up Modal ─── */}
      {smsLineupOpen && (
        <ModalOverlay onClick={closeSmsLineup}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Send SMS Line Up</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>
                  Drivers for {new Date(smsLineupDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>
              <button
                style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={closeSmsLineup}
              ><X size={14} /></button>
            </ModalHead>
            <ModalBody>
              <div>
                <ModalLabel htmlFor="sms-lineup-date">Date</ModalLabel>
                <ModalInput
                  id="sms-lineup-date"
                  type="date"
                  value={smsLineupDate}
                  onChange={(event) => {
                    setSmsLineupDate(event.target.value);
                    setSmsLineupMessage(buildLineupMessage(event.target.value));
                  }}
                  required
                />
                <SmsDateQuickActions role="group" aria-label="Quick select SMS lineup date">
                  <SmsDateQuickButton
                    type="button"
                    $active={smsLineupDate === smsTodayDate}
                    onClick={() => {
                      setSmsLineupDate(smsTodayDate);
                      setSmsLineupMessage(buildLineupMessage(smsTodayDate));
                    }}
                  >
                    Today
                  </SmsDateQuickButton>
                  <SmsDateQuickButton
                    type="button"
                    $active={smsLineupDate === smsTomorrowDate}
                    onClick={() => {
                      setSmsLineupDate(smsTomorrowDate);
                      setSmsLineupMessage(buildLineupMessage(smsTomorrowDate));
                    }}
                  >
                    Tomorrow
                  </SmsDateQuickButton>
                </SmsDateQuickActions>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <ModalLabel htmlFor="sms-lineup-message">Message</ModalLabel>
                <textarea
                  id="sms-lineup-message"
                  value={smsLineupMessage}
                  disabled={smsLineupBookingCount === 0}
                  placeholder={smsLineupBookingCount === 0 ? 'No bookings for this date.' : ''}
                  onChange={(event) => setSmsLineupMessage(event.target.value)}
                  rows="5"
                  style={{
                    width: '100%', padding: '0.5rem 0.75rem', border: '1px solid ' + COLORS.border,
                    borderRadius: COLORS.radiusSm, fontSize: '0.8125rem', color: COLORS.text,
                    background: COLORS.white, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                    opacity: smsLineupBookingCount === 0 ? 0.65 : 1,
                  }}
                />
                {smsLineupBookingCount === 0 && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: COLORS.muted }}>
                    A lineup message is generated only for dates with bookings.
                  </div>
                )}
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.ink, marginBottom: '0.4rem' }}>Select drivers</div>
                <div style={{
                  maxHeight: '220px', overflowY: 'auto', border: '1px solid ' + COLORS.border,
                  borderRadius: COLORS.radiusSm, background: COLORS.white, padding: '0.5rem',
                }}>
                  {drivers.map((driver) => {
                    const id = String(driver.driver_id ?? driver.id ?? '');
                    const phone = driver.driver_phone || driver.phone || '';
                    const checked = smsSelectedDriverIds.includes(id);
                    return (
                      <label key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', cursor: 'pointer', fontSize: '0.8125rem' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSmsSelectedDriverIds(checked
                              ? smsSelectedDriverIds.filter((x) => x !== id)
                              : [...smsSelectedDriverIds, id]);
                          }}
                          style={{ width: 16, height: 16 }}
                        />
                        <span>{driver.driver_name || driver.full_name || `Driver ${id}`}</span>
                        {phone && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: COLORS.textSecondary }}>{phone}</span>}
                      </label>
                    );
                  })}
                  {!drivers.length && <div style={{ fontSize: '0.8rem', color: COLORS.textSecondary, padding: '0.5rem' }}>No drivers found.</div>}
                </div>
                <div style={{ fontSize: '0.7rem', color: COLORS.textSecondary, marginTop: '0.3rem' }}>
                  Leave all unchecked to send to every driver with a phone number.
                </div>
              </div>
              {smsLineupResults && (
                <div style={{
                  marginTop: '0.75rem', padding: '0.6rem', borderRadius: COLORS.radiusSm,
                  background: smsLineupResults.sent ? COLORS.successLight : COLORS.dangerLight,
                  color: smsLineupResults.sent ? COLORS.successDark : COLORS.dangerDark,
                  fontSize: '0.8rem',
                }}>
                  {smsLineupResults.sent} of {smsLineupResults.total} driver(s) sent.
                </div>
              )}
            </ModalBody>
            <ModalFoot>
              <SecondaryButton type="button" onClick={closeSmsLineup} disabled={smsLineupLoading}>Cancel</SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={sendSmsLineup}
                disabled={smsLineupLoading || smsLineupBookingCount === 0 || !smsLineupMessage.trim()}
                $bg={COLORS.accent}
              >
                {smsLineupLoading ? 'Sending…' : 'Send SMS Lineup'}
              </PrimaryButton>
            </ModalFoot>
          </ModalBox>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default HearseBookings;
