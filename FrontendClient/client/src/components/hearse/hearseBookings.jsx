import { resolveBranchName, isMultiDay, getBookingDateRange, getMultiDayColor } from './viewerShared';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTenantId, getBranchId, getBranchSlug, getBranches as getCachedBranches, getParentTenantSlug } from '../../utils/globalAuth';
import { useSocket } from '../../utils/context/socketContext';
import useAuthStore from '../../utils/store/useAuthStore';
import apiClient from '../../api/axios';
import { ENDPOINTS, getTenantHeaders } from '../../api/endpoints';
import BookNewHearseModal from './BookNewHearseModal';
import styled, { keyframes } from 'styled-components';
import HearseCalendar from './HearseCalendar';
import env from '../../utils/config/env';
import notify from '../../utils/notify';
import {
  Truck, Car, Clock, Check, Search, Plus, RefreshCw, MoreVertical,
  ChevronLeft, ChevronRight, ChevronFirst, ChevronLast, List, Grid, X,
  Calendar, MapPin, Phone, User, Filter
} from '../../utils/icons/icons';



const API_BASE_URL = import.meta.env.PROD
  ? 'https://restpoint.co.ke/api/v1/restpoint'
  : (env.FULL_API_URL || 'http://localhost:5000/api/v1/restpoint');

const RESULTS_PER_PAGE = 10;

// Placeholder branch labels the backend used to store literally. They are NOT
// real branch names, so they must never be shown as a booking's branch — a
// booking either resolves to a real place ("Nairobi", "Thika", "Eter Mumo")
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






const STATUS_CONFIG = {
  pending: { label: 'Pending', progress: 10, color: '#d97706', bg: '#FFFBEB', dotColor: '#d97706' },
  booked: { label: 'Booked', progress: 25, color: '#00296B', bg: '#EFF6FF', dotColor: '#00296B' },
  confirmed: { label: 'Confirmed', progress: 25, color: '#00296B', bg: '#EFF6FF', dotColor: '#00296B' },
  scheduled: { label: 'Scheduled', progress: 25, color: '#E36414', bg: '#FFEDD5', dotColor: '#E36414' },
  in_transit: { label: 'In Transit', progress: 60, color: '#E36414', bg: '#FFEDD5', dotColor: '#E36414' },
  in_progress: { label: 'In Progress', progress: 60, color: '#0c0b0f', bg: '#F3F4F6', dotColor: '#0c0b0f' },
  postponed: { label: 'Postponed', progress: 15, color: '#d97706', bg: '#FFFBEB', dotColor: '#d97706' },
  completed: { label: 'Completed', progress: 100, color: '#5F0F40', bg: '#FCE7F3', dotColor: '#5F0F40' },
  delivered: { label: 'Delivered', progress: 100, color: '#132A13', bg: '#E8F5E9', dotColor: '#132A13' },
  cancelled: { label: 'Cancelled', progress: 0, color: '#DD2D4A', bg: '#FEE2E2', dotColor: '#DD2D4A' },
  maintenance: { label: 'Maintenance', progress: 0, color: '#03071E', bg: '#E0E7FF', dotColor: '#03071E' },
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
    const r = await fetch(`${API_BASE_URL}/hearse-bookings${query ? `?${query}` : ''}&t=${Date.now()}`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Failed');
    return (await r.json()).bookings || [];
  },
  getBranches: async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/tenant/${getTenantSlug()}/branches`, { headers: getAuthHeaders() });
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
    const r = await fetch(`${API_BASE_URL}/hearses`, { headers: { ...getTenantHeaders(), ...getAuthHeaders() } });
    return r.ok ? (await r.json()).hearses || [] : [];
  },
  getDrivers: async () => {
    const candidates = [
      getParentTenantSlug(),
      getTenantSlug(),
      localStorage.getItem('tenantSlug'),
      localStorage.getItem('parentTenantSlug'),
    ].filter((slug, index, slugs) => slug && slugs.indexOf(slug) === index);
    if (!candidates.length) {
      throw new Error('Could not resolve your organisation to load drivers. Please sign in again.');
    }

    const isDriver = (user) => {
      const roles = [
        user?.role,
        user?.role_name,
        user?.user_role,
        ...(Array.isArray(user?.roles) ? user.roles : []),
      ].map((role) => String(typeof role === 'object' ? role?.name || role?.role : role || '')
        .toLowerCase()
        .replace(/[\s_-]+/g, '_'));
      return roles.some((role) => role === 'driver' || role.includes('driver'));
    };
    let lastUserList = [];
    let successfulLookup = false;
    let lastLookupError = null;

    for (const slug of candidates) {
      let response;
      try {
        response = await apiClient.get(ENDPOINTS.TENANT.USERS(slug));
      } catch (error) {
        if (error?.response?.status === 404) continue;
        lastLookupError = error;

        continue;
      }

      const payload = response?.data;
      const users = Array.isArray(payload)
        ? payload
        : payload?.data?.users || payload?.data || payload?.users;
      if (!Array.isArray(users)) {
        lastLookupError = new Error(`Tenant user service returned an invalid list for "${slug}".`);

        continue;
      }

      successfulLookup = true;
      lastUserList = users;
      const drivers = users
        .filter(isDriver)
        .map((user) => ({
          id: user.driver_id ?? user.user_id ?? user.id,
          driver_id: user.driver_id ?? user.user_id ?? user.id,
          driver_name: user.driver_name || user.full_name
            || `${user.first_name || ''} ${user.last_name || ''}`.trim()
            || user.username || '',
          driver_phone: user.driver_phone || user.phone_number || user.phone || '',
          role: user.role,
        }))
        .filter((driver) => driver.id != null && driver.driver_name);
      if (drivers.length) return drivers;
    }

    if (!successfulLookup && lastLookupError) {
      throw new Error(lastLookupError?.response?.data?.message || lastLookupError.message || 'Unable to load tenant users for driver lineup.');
    }
    const roles = [...new Set(lastUserList.map((user) => String(user?.role || '')).filter(Boolean))];

    return [];
  },
  getDailyLineup: async (date) => {
    const r = await fetch(`${API_BASE_URL}/hearse-lineups/day?date=${encodeURIComponent(date)}`, { headers: getAuthHeaders() });
    if (!r.ok) throw new Error('Failed to load the daily driver lineup');
    return r.json();
  },
  saveStandbyDriver: async (date, assignment) => {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
    const r = await fetch(`${API_BASE_URL}/hearse-lineups/standby`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        date,
        driver_id: assignment.driver_id || null,
        driver_name: assignment.driver_name || null,
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Failed to save the standby driver');
    return data;
  },
  assignBookingLineup: async (bookingId, lineup) => {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
    const r = await fetch(`${API_BASE_URL}/hearse-bookings/${encodeURIComponent(bookingId)}/lineup`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(lineup),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Failed to save the booking lineup');
    return data;
  },
  //updates    hearses
  updateStatus: async (id, status, reason) => {
    const h = getAuthHeaders(); h['Content-Type'] = 'application/json';
    const body = { status };
    if (String(status) === 'cancelled') body.cancel_reason = reason || null;
    const r = await fetch(`${API_BASE_URL}/hearse-bookings/${id}/status`, { method: 'PUT', headers: h, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Failed');
    return r.json();
  },

  //     register   hearse  ..
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
  const [standbyDriverId, setStandbyDriverId] = useState('');
  const [standbyDriverName, setStandbyDriverName] = useState('');
  const [lineupLoading, setLineupLoading] = useState(false);
  const [savingStandby, setSavingStandby] = useState(false);
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
  const [selectedDate, setSelectedDate] = useState(formatDateStr(new Date()));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [newBookingInitialDates, setNewBookingInitialDates] = useState([]);

  const [actionMenuId, setActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);
  const [dateFilter, setDateFilter] = useState('all');

  // Register hearse
  const [registerHearseOpen, setRegisterHearseOpen] = useState(false);
  const [hearseForm, setHearseForm] = useState({ plate_number: '', hearse_name: '', model: '', capacity: '8', status: 'available', branch_id: '', branch_slug: '', branch_name: '', branch_code: '', fuel_card_number: '' });
  const [registerLoading, setRegisterLoading] = useState(false);

  // Cancel modal
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

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

  // Inclusive YYYY-MM-DD bounds for the month currently on screen. The month can
  // be 12/13 in some time zones, so the range is built from a local Date and
  // the last day is taken from the next month's day-0 rather than assumed to
  // be 30.
  // Inclusive YYYY-MM-DD bounds for the month currently on screen.
  //   month=9&year=2026  ->  from 2026-09-01, to 2026-09-30
  // The last day is taken from "day 0 of the next month" so February and the
  // 31-day months are always correct — never a hard-coded 30.
  // A local Date is used (not UTC) so the bounds always match the local
  // calendar the user is looking at.
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

  useEffect(() => {
    let current = true;
    setLineupLoading(true);
    api.getDailyLineup(selectedDate)
      .then((lineup) => {
        if (current) {
          setStandbyDriverId(lineup.standby_driver_id == null ? '' : String(lineup.standby_driver_id));
          setStandbyDriverName(lineup.standby_driver_name || '');
        }
      })
      .catch((error) => {
        if (current) notify.error(error.message || 'Failed to load the standby driver.');
      })
      .finally(() => {
        if (current) setLineupLoading(false);
      });
    return () => { current = false; };
  }, [selectedDate]);

  const saveStandby = useCallback(async (assignment) => {
    setSavingStandby(true);
    try {
      const lineup = await api.saveStandbyDriver(selectedDate, assignment);
      setStandbyDriverId(lineup.standby_driver_id == null ? '' : String(lineup.standby_driver_id));
      setStandbyDriverName(lineup.standby_driver_name || '');
      notify.success(assignment.driver_id || assignment.driver_name ? 'Standby driver assigned for this day.' : 'Standby driver removed.');
    } catch (error) {
      notify.error(error.message || 'Failed to save the standby driver.');
    } finally {
      setSavingStandby(false);
    }
  }, [selectedDate]);

  const saveBookingLineup = useCallback(async (bookingId, lineup) => {
    setSavingBookingLineup(String(bookingId));
    try {
      await api.assignBookingLineup(bookingId, lineup);
      await refreshData();
      notify.success('Booking driver and assistant lineup saved.');
    } catch (error) {
      notify.error(error.message || 'Failed to save the booking lineup.');
    } finally {
      setSavingBookingLineup(null);
    }
  }, [refreshData]);

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
        <RefreshCw size={32} color={COLORS.primary} className="animate-spin" />
      </Container>
    );
  }

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

            <SecondaryButton onClick={refreshData} disabled={refreshing} style={{ marginLeft: 'auto' }}>
              {Icons.refresh} {refreshing ? 'Refreshing...' : 'Refresh'}
            </SecondaryButton>
            <PrimaryButton onClick={() => openNewBooking('')}>{Icons.plus} Book Hearse</PrimaryButton>
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
                            <TableCell><div style={{ fontSize: '0.78rem' }}>{branchLabel(b)}</div></TableCell>
                            <TableCell>
                              <div style={{ fontSize: '0.78rem' }}>{fmtBookingDates(b)}</div>
                              <div style={{ fontSize: '0.7rem', color: COLORS.textMuted }}>Pickup: {fmtBookingTime(b)}</div>
                            </TableCell>
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
              allBookings={bookings}
              hearses={allHearses}
              branches={branches}
              drivers={drivers}
              standbyDriverId={standbyDriverId}
              standbyDriverName={standbyDriverName}
              lineupLoading={lineupLoading}
              savingStandby={savingStandby}
              savingBookingLineup={savingBookingLineup}
              onSaveStandby={saveStandby}
              onSaveBookingLineup={saveBookingLineup}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onDateClick={(date) => {
                const [year, month] = date.split('-').map(Number);
                if (Number.isInteger(year) && Number.isInteger(month)
                  && (month - 1 !== viewMonth || year !== viewYear)) {
                  goToMonth(month - 1, year);
                }
              }}
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
                      <div style={{ fontSize: '0.78rem', color: COLORS.textMuted, marginTop: '0.15rem' }}>
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
                        : COLORS.textMuted,
                    }}
                  >
                    {(() => {
                      const charge = Number(selectedBooking.service_charge ?? selectedBooking.total_service_charge ?? selectedBooking.total_charge) || 0;
                      return charge > 0 ? `KSH ${charge.toLocaleString()}` : 'Not set (optional)';
                    })()}
                  </DetailValue>
                </DetailItem>
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