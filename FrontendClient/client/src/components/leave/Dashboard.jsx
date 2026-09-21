/* ═══════════════════════════════════════════════════════════════════════════
   HR LEAVE DASHBOARD  (route: /tenant/:slug/leaves)

   Layout — single top navigation bar (no title line):

     Top bar → Overview · Approvals · Employees · History · Calendar
               + Refresh + Apply leave. 
               Picking one shows that section alone (e.g. Employees → only
               the employees table, History → only the leave history table).

     1. Overview             → status donut, 6-month trend, leave-type mix
     2. Approvals inbox      → search / filter / sort / bulk approve / export
        (side column:         → on leave today, next 14 days, own balance)
     3. Employees & balances  → searchable table, click a row for the drawer
     4. Leave history         → search / filter / paginate / export
     5. Calendar              → compact month grid, periods list scrolls

   Everything is derived from the endpoints the leave service already exposes
   (stats/overview, all, balances, users/on-leave, balance/:id, additions/:id)
   — no new API surface and no new dependencies.
   ═══════════════════════════════════════════════════════════════════════════ */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { api, ENDPOINTS } from '../../api';
import { getUserId, getTenantSlug, getParentTenantSlug } from '../../utils/globalAuth';
import notify from '../../utils/notify';
import {
  Calendar, CalendarDays, Clock, Timer, History, Users, UserCheck,
  User, FileText, CheckCircle, XCircle, AlertCircle, AlertTriangle, Loader2,
  RefreshCw, Check, X, ChevronRight, ChevronLeft, ChevronFirst, ChevronLast, Plus,
  Trash2, Search, BarChart3, PieChartIcon, TrendingUp, Hourglass, Flag,
  Briefcase, Download, Eye, ListChecks,
} from '../../utils/icons/icons';
import LeaveCalendar from './LeaveCalendar';

/* ── Palette — identical to the other Leave screens ───────────────────────── */
const COLORS = {
  primary: '#0A2463',
  primaryLight: '#1A3A7A',
  primarySoft: 'rgba(10, 36, 99, 0.08)',
  white: '#FFFFFF',
  bg: '#F5F7FA',
  border: '#E8ECF0',
  text: '#1A1D24',
  textSecondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#E74C3C',
  info: '#3B82F6',
  violet: '#7C3AED',
  teal: '#0D9488',
};

const LEAVE_TYPE_META = {
  annual: { label: 'Annual', color: '#10B981' },
  sick: { label: 'Sick', color: '#E74C3C' },
  maternity: { label: 'Maternity', color: '#3B82F6' },
  paternity: { label: 'Paternity', color: '#6366F1' },
  compassionate: { label: 'Compassionate', color: '#F59E0B' },
  study: { label: 'Study', color: '#0A2463' },
  unpaid: { label: 'Unpaid', color: '#6B7280' },
};

const STATUS_META = {
  pending: { label: 'Pending', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)', fg: '#B45309' },
  approved: { label: 'Approved', color: '#10B981', bg: 'rgba(16, 185, 129, 0.14)', fg: '#047857' },
  rejected: { label: 'Rejected', color: '#E74C3C', bg: 'rgba(231, 76, 60, 0.12)', fg: '#B91C1C' },
  cancelled: { label: 'Cancelled', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.18)', fg: '#475569' },
};

const PRIORITY_META = {
  emergency: { label: 'Emergency', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.10)' },
  high: { label: 'High', color: '#EA580C', bg: 'rgba(234, 88, 12, 0.10)' },
  medium: { label: 'Medium', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.10)' },
  low: { label: 'Low', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.10)' },
};

const TYPE_FILTERS = ['all', 'annual', 'sick', 'maternity', 'paternity', 'compassionate', 'study', 'unpaid'];
const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected', 'cancelled'];
const PRIORITY_FILTERS = ['all', 'emergency', 'high', 'medium', 'low'];
const PAGE_SIZE = 10;

/* ── Meta lookups (never throw on unknown values) ─────────────────────────── */
const typeMeta = (t) => LEAVE_TYPE_META[String(t || '').toLowerCase()]
  || { label: t ? String(t) : 'Leave', color: COLORS.textSecondary };
const statusMeta = (s) => STATUS_META[String(s || '').toLowerCase()] || STATUS_META.cancelled;
const priorityMeta = (p) => PRIORITY_META[String(p || '').toLowerCase()] || PRIORITY_META.medium;

/* ── Small data helpers ───────────────────────────────────────────────────── */
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round1 = (n) => Math.round(safeNum(n) * 10) / 10;

const toYMD = (d) => {
  if (!d) return '';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const todayYMD = () => toYMD(new Date());
const ymdPlus = (n) => {
  const d = startOfToday();
  d.setDate(d.getDate() + n);
  return toYMD(d);
};

const fmtDate = (d) => {
  const y = toYMD(d);
  if (!y) return '—';
  const dt = new Date(`${y}T12:00:00`);
  return Number.isNaN(dt.getTime())
    ? '—'
    : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtShort = (d) => {
  const y = toYMD(d);
  if (!y) return '—';
  const dt = new Date(`${y}T12:00:00`);
  return Number.isNaN(dt.getTime())
    ? '—'
    : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
const fmtDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};
const fmtRange = (a, b) => {
  if (!a && !b) return '—';
  if (a && b && toYMD(a) !== toYMD(b)) return `${fmtShort(a)} → ${fmtDate(b)}`;
  return fmtDate(a || b);
};

/** Whole days since a date (0 = today, 3 = three days ago). */
const daysSince = (d) => {
  const y = toYMD(d);
  if (!y) return null;
  const then = new Date(`${y}T00:00:00`);
  if (Number.isNaN(then.getTime())) return null;
  return Math.round((startOfToday() - then) / 86400000);
};
/** Whole days until a date (0 = today, 3 = in three days). */
const daysUntil = (d) => {
  const y = toYMD(d);
  if (!y) return null;
  const then = new Date(`${y}T00:00:00`);
  if (Number.isNaN(then.getTime())) return null;
  return Math.round((then - startOfToday()) / 86400000);
};
const humanSpan = (n) => {
  if (n === null || n === undefined) return '—';
  if (n <= 0) return 'today';
  return n === 1 ? '1 day' : `${n} days`;
};
const monthKey = (d) => toYMD(d).slice(0, 7);
const monthLabel = (key) => {
  const [y, m] = key.split('-');
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return Number.isNaN(dt.getTime()) ? key : dt.toLocaleDateString('en-GB', { month: 'short' });
};
const initials = (name, email) => {
  const s = String(name || email || '?').trim();
  const parts = s.split(/[\s.@_-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (((parts[0] || '')[0] || '') + (parts[1] ? parts[1][0] : '')).toUpperCase() || '?';
};
const normList = (res) => {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.data)) return d.data;
  return [];
};
const normObj = (res) => {
  const d = res?.data;
  if (!d) return null;
  if (d.data && typeof d.data === 'object' && !Array.isArray(d.data)) return d.data;
  return d;
};
const currentTenantSlug = () => {
  const m = window.location.pathname.match(/\/tenant\/([^/]+)/);
  return (m && m[1]) || getTenantSlug() || getParentTenantSlug() || '';
};
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/* ── Motion ───────────────────────────────────────────────────────────────── */
const spin = keyframes`
  to { transform: rotate(360deg); }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;
const shimmer = keyframes`
  0% { background-position: -420px 0; }
  100% { background-position: 420px 0; }
`;

const Spin = styled.span`
  display: inline-flex;
  animation: ${spin} 0.9s linear infinite;
`;

const Page = styled.div`
  padding: 0.25rem 0 2rem 0;
  max-width: 1440px;
  margin: 0 auto;
  animation: ${fadeUp} 0.25s ease-out;
`;

/* ── Top navigation bar (module-level so it never remounts on state change) ── */
const TopNavBar = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  padding: 0.4rem 0.5rem;
  margin: 0 0 1.25rem 0;
  box-shadow: 0 1px 2px rgba(10, 36, 99, 0.04);
`;
const TopNavItem = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border: 0;
  background: transparent;
  color: ${(p) => (p.$active ? COLORS.primary : COLORS.textSecondary)};
  font-size: 0.85rem;
  font-weight: ${(p) => (p.$active ? 700 : 500)};
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  ${(p) => (p.$active
    ? `background: ${COLORS.primarySoft}; box-shadow: inset 0 0 0 1px ${COLORS.primary};`
    : `&:hover { background: rgba(10, 36, 99, 0.06); }`
  )}
  &:focus-visible {
    outline: 2px solid ${COLORS.primary};
    outline-offset: 2px;
  }
`;
const TopNavIcon = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
`;
const TopNavLabel = styled.span`
  white-space: nowrap;
`;

/* ── Notices, skeletons, cards ────────────────────────────────────────────── */
const Notice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  font-size: 0.84rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  border: 1px solid ${(p) => (p.$tone === 'error' ? COLORS.danger : p.$tone === 'warn' ? COLORS.warning : COLORS.info)};
  background: ${(p) => (p.$tone === 'error' ? 'rgba(231, 76, 60, 0.07)'
    : p.$tone === 'warn' ? 'rgba(245, 158, 11, 0.09)' : 'rgba(59, 130, 246, 0.07)')};
  color: ${(p) => (p.$tone === 'error' ? '#B91C1C' : p.$tone === 'warn' ? '#B45309' : '#1D4ED8')};
  strong { font-weight: 700; }
`;

const Skeleton = styled.div`
  height: ${(p) => p.$h || '96px'};
  border-radius: 14px;
  margin-bottom: 0.75rem;
  background: linear-gradient(90deg, #EEF2F7 25%, #F8FAFC 50%, #EEF2F7 75%);
  background-size: 420px 100%;
  animation: ${shimmer} 1.15s linear infinite;
`;

const Stack = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Section = styled.section`
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
  overflow: hidden;
`;
const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid ${COLORS.border};
`;
const CardHeadLeft = styled.div`display: flex; align-items: center; gap: 0.55rem; min-width: 0;`;
const CardTitle = styled.h2`margin: 0; font-size: 0.98rem; font-weight: 700; color: ${COLORS.text};`;
const CardSub = styled.div`font-size: 0.75rem; color: ${COLORS.textSecondary}; margin-top: 0.1rem;`;
const CardBody = styled.div`padding: 1.1rem;`;

const Grid3 = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  @media (max-width: 1150px) { grid-template-columns: 1fr; }
`;
const Split = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 1rem;
  @media (max-width: 1150px) { grid-template-columns: 1fr; }
`;

/* ── Chips ────────────────────────────────────────────────────────────────── */
const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
  color: ${(p) => statusMeta(p.$status).fg};
  background: ${(p) => statusMeta(p.$status).bg};
`;
const PillDot = styled.span`width: 6px; height: 6px; border-radius: 50%; background: ${(p) => p.$c};`;
const TypeChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: ${COLORS.text};
  white-space: nowrap;
`;
const PriorityFlag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.71rem;
  font-weight: 700;
  padding: 0.16rem 0.5rem;
  border-radius: 999px;
  color: ${(p) => priorityMeta(p.$p).color};
  background: ${(p) => priorityMeta(p.$p).bg};
  text-transform: capitalize;
  white-space: nowrap;
`;
const MiniTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.68rem;
  font-weight: 600;
  color: ${COLORS.textSecondary};
  background: ${COLORS.bg};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  padding: 0.1rem 0.35rem;
  white-space: nowrap;
`;
const Avatar = styled.span`
  width: ${(p) => (p.$lg ? '42px' : '32px')};
  height: ${(p) => (p.$lg ? '42px' : '32px')};
  border-radius: 50%;
  background: ${(p) => p.$c || COLORS.primary};
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${(p) => (p.$lg ? '0.95rem' : '0.72rem')};
  font-weight: 700;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  text-transform: uppercase;
`;
const Name = styled.div`font-size: 0.84rem; font-weight: 700; color: ${COLORS.text}; line-height: 1.25;`;
const SubName = styled.div`font-size: 0.74rem; color: ${COLORS.textSecondary}; line-height: 1.3;`;


/* ── Toolbars, tabs, tables ───────────────────────────────────────────────── */
const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid ${COLORS.border};
`;
const SearchBox = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid ${COLORS.border};
  border-radius: 9px;
  padding: 0.4rem 0.6rem;
  background: ${COLORS.white};
  flex: 1 1 235px;
  max-width: 340px;
  color: ${COLORS.textSecondary};
  &:focus-within { border-color: ${COLORS.primary}; box-shadow: 0 0 0 3px rgba(10, 36, 99, 0.07); }
  input {
    border: 0;
    outline: 0;
    flex: 1;
    min-width: 0;
    font-size: 0.82rem;
    color: ${COLORS.text};
    background: transparent;
  }
`;
const Select = styled.select`
  border: 1px solid ${COLORS.border};
  border-radius: 9px;
  padding: 0.42rem 0.55rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${COLORS.text};
  background: ${COLORS.white};
  cursor: pointer;
  max-width: 200px;
  &:focus { outline: none; border-color: ${COLORS.primary}; }
`;
const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 9px;
  padding: 0.45rem 0.8rem;
  font-size: 0.79rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid ${COLORS.border};
  background: ${COLORS.white};
  color: ${COLORS.text};
  white-space: nowrap;
  transition: background 0.15s ease;
  &:hover { background: ${COLORS.bg}; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
  &.primary { background: ${COLORS.primary}; border-color: ${COLORS.primary}; color: #fff; }
  &.primary:hover { background: ${COLORS.primaryLight}; }
  &.ok { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.4); color: #047857; }
  &.danger { background: rgba(231, 76, 60, 0.08); border-color: rgba(231, 76, 60, 0.35); color: #B91C1C; }
`;

const TableScroll = styled.div`overflow-x: auto;`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
  min-width: 760px;
  th, td { padding: 0.7rem 0.9rem; text-align: left; vertical-align: middle; }
  th {
    background: ${COLORS.bg};
    color: ${COLORS.textSecondary};
    font-size: 0.69rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 800;
    border-bottom: 1px solid ${COLORS.border};
    white-space: nowrap;
  }
  td { border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.text}; }
  tbody tr:last-child td { border-bottom: 0; }
`;
const ClickRow = styled.tr`
  cursor: pointer;
  &:hover td { background: rgba(10, 36, 99, 0.035); }
`;
const PersonCell = styled.div`display: flex; align-items: center; gap: 0.6rem; min-width: 0;`;
const Empty = styled.div`
  padding: 2.2rem 1.2rem;
  text-align: center;
  color: ${COLORS.textSecondary};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  p { margin: 0; }
`;
const Pager = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.75rem 1.1rem;
  border-top: 1px solid ${COLORS.border};
`;
const PagerInfo = styled.span`font-size: 0.78rem; color: ${COLORS.textSecondary};`;
const PagerBtns = styled.div`display: flex; gap: 0.25rem; align-items: center;`;
const PageBtn = styled.button`
  min-width: 30px;
  border: 1px solid ${COLORS.border};
  background: ${(p) => (p.$on ? COLORS.primary : COLORS.white)};
  color: ${(p) => (p.$on ? '#fff' : COLORS.text)};
  border-radius: 8px;
  height: 30px;
  padding: 0 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: ${(p) => (p.$on ? COLORS.primary : COLORS.bg)}; }
`;
const Tick = styled.input.attrs({ type: 'checkbox' })`
  width: 15px;
  height: 15px;
  accent-color: ${COLORS.primary};
  cursor: pointer;
`;
const BulkBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding: 0.6rem 1.1rem;
  background: rgba(10, 36, 99, 0.05);
  border-bottom: 1px solid ${COLORS.border};
  font-size: 0.8rem;
  font-weight: 600;
  color: ${COLORS.primary};
`;

/* ── Coverage lists / upcoming timeline ──────────────────────────────────── */
const CoverList = styled.div`display: grid; gap: 0.55rem;`;
const CoverRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
`;
const UpcomingDay = styled.div`
  display: flex;
  gap: 0.7rem;
  padding: 0.55rem 0;
  border-bottom: 1px dashed ${COLORS.border};
  &:last-child { border-bottom: 0; }
`;
const DayBadge = styled.div`
  width: 48px;
  flex-shrink: 0;
  text-align: center;
  border-radius: 10px;
  background: ${COLORS.bg};
  border: 1px solid ${COLORS.border};
  padding: 0.3rem 0.2rem;
`;
const DayNum = styled.div`font-size: 1rem; font-weight: 800; color: ${COLORS.text}; line-height: 1.1;`;
const DayMon = styled.div`
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${COLORS.textSecondary};
`;
const CoverListInner = styled.div`display: grid; gap: 0.2rem; min-width: 0;`;

/* ── Overlay / drawer ────────────────────────────────────────────────────── */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
`;
const Drawer = styled.div`
  width: min(540px, 100%);
  height: 100%;
  background: ${COLORS.white};
  box-shadow: -12px 0 34px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
const DrawerHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.05rem 1.2rem;
  border-bottom: 1px solid ${COLORS.border};
  background: ${COLORS.bg};
`;
const DrawerTitle = styled.div`font-size: 1.02rem; font-weight: 800; color: ${COLORS.text};`;
const DrawerSub = styled.div`font-size: 0.76rem; color: ${COLORS.textSecondary}; word-break: break-word;`;
const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid ${COLORS.border};
  background: ${COLORS.white};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${COLORS.textSecondary};
  flex-shrink: 0;
  &:hover { color: ${COLORS.danger}; border-color: ${COLORS.danger}; }
`;
const DrawerBody = styled.div`
  padding: 1.1rem 1.2rem 2.2rem 1.2rem;
  overflow-y: auto;
  flex: 1;
`;
const PanelHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 800;
  color: ${COLORS.text};
  margin: 1.25rem 0 0.6rem 0;
`;
const MiniGrid = styled.div`display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem;`;
const MiniStat = styled.div`
  border: 1px solid ${COLORS.border};
  border-radius: 11px;
  padding: 0.55rem 0.65rem;
  background: ${(p) => (p.$hl ? 'rgba(10, 36, 99, 0.06)' : COLORS.white)};
`;
const MSLabel = styled.div`
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 800;
  color: ${COLORS.textSecondary};
`;
const MSValue = styled.div`font-size: 1.12rem; font-weight: 800; color: ${(p) => (p.$hl ? COLORS.primary : COLORS.text)};`;
const AddForm = styled.div`
  display: grid;
  grid-template-columns: 92px 1fr auto;
  gap: 0.5rem;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;
const Input = styled.input`
  border: 1px solid ${COLORS.border};
  border-radius: 9px;
  padding: 0.5rem 0.65rem;
  font-size: 0.82rem;
  color: ${COLORS.text};
  background: ${COLORS.white};
  min-width: 0;
  &:focus { outline: none; border-color: ${COLORS.primary}; }
`;
const HistItem = styled.div`
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  margin-bottom: 0.5rem;
`;
const HistLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;
const RingRow = styled.div`display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;`;
const RingSvg = styled.svg`width: 116px; height: 116px; flex-shrink: 0;`;
const RingLegend = styled.div`display: grid; gap: 0.45rem; flex: 1; min-width: 150px;`;

/* ── Request detail modal ────────────────────────────────────────────────── */
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;
const ModalCard = styled.div`
  width: min(600px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  background: ${COLORS.white};
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
`;
const ModalHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.05rem 1.2rem;
  border-bottom: 1px solid ${COLORS.border};
  background: ${COLORS.bg};
  border-radius: 16px 16px 0 0;
`;
const ModalTitle = styled.div`flex: 1; min-width: 0; font-size: 1.02rem; font-weight: 800; color: ${COLORS.text};`;
const ModalSub = styled.div`font-size: 0.76rem; color: ${COLORS.textSecondary}; margin-top: 0.1rem;`;
const ModalBody = styled.div`padding: 1.1rem 1.2rem 1.4rem 1.2rem;`;
const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem 1rem;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;
const FieldLabel = styled.div`
  font-size: 0.63rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 800;
  color: ${COLORS.textSecondary};
  margin-bottom: 0.15rem;
`;
const FieldValue = styled.div`font-size: 0.88rem; font-weight: 600; color: ${COLORS.text};`;
const ReasonBox = styled.div`
  background: ${COLORS.bg};
  border: 1px solid ${COLORS.border};
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  font-size: 0.86rem;
  color: ${COLORS.text};
  white-space: pre-wrap;
  word-break: break-word;
`;
const DocLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.84rem;
  font-weight: 700;
  color: ${COLORS.primary};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;
const ModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 1.15rem;
  padding-top: 0.9rem;
  border-top: 1px solid ${COLORS.border};
`;


/* ── Charts (hand-rolled — no chart library needed for these) ─────────────── */
const DonutWrap = styled.div`display: flex; align-items: center; gap: 1.1rem; flex-wrap: wrap;`;
const DonutSvg = styled.svg`width: 172px; height: 172px; flex-shrink: 0;`;
const Legend = styled.div`display: grid; gap: 0.55rem; flex: 1; min-width: 180px;`;
const LegendRow = styled.div`display: flex; align-items: center; gap: 0.5rem;`;
const LegendDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: ${(p) => p.$c};
  flex-shrink: 0;
`;
const LegendLabel = styled.span`font-size: 0.82rem; color: ${COLORS.text}; font-weight: 600;`;
const LegendValue = styled.span`margin-left: auto; font-size: 0.82rem; font-weight: 800; color: ${COLORS.text};`;
const LegendPct = styled.span`font-size: 0.74rem; color: ${COLORS.textSecondary}; min-width: 44px; text-align: right;`;

const Trend = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  align-items: end;
  gap: 0.5rem;
  height: 196px;
`;
const TrendCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  gap: 0.35rem;
  min-width: 0;
`;
const TrendCount = styled.span`font-size: 0.74rem; font-weight: 800; color: ${COLORS.text};`;
const TrendTrack = styled.div`
  width: 100%;
  flex: 1;
  display: flex;
  align-items: flex-end;
  background: transparent; /* Removed heavy background track for a sleek look */
  border-radius: 8px;
  overflow: visible;
`;
const TrendBar = styled.div`
  width: 100%;
  max-width: 26px; /* Sleek, narrow bars */
  margin: 0 auto;
  height: ${(p) => `${p.$h}%`};
  border-radius: 6px 6px 0 0; /* Smooth rounded tops */
  background: ${(p) => (p.$dim
    ? 'rgba(148, 163, 184, 0.3)'
    : `linear-gradient(180deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 100%)`)};
  transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s; /* Bouncy smooth slide up */
  box-shadow: ${(p) => p.$dim ? 'none' : `0 4px 10px rgba(10, 36, 99, 0.15)`};
  transform-origin: bottom;
  
  &:hover {
    background: ${(p) => (p.$dim ? 'rgba(148, 163, 184, 0.4)' : `linear-gradient(180deg, #2A4A8A 0%, #0A2463 100%)`)};
  }
`;
const TrendLabel = styled.span`font-size: 0.72rem; color: ${COLORS.textSecondary}; font-weight: 600;`;

const MixList = styled.div`display: grid; gap: 0.75rem;`;
const MixRow = styled.div`display: grid; grid-template-columns: 104px 1fr 118px; align-items: center; gap: 0.6rem;`;
const MixLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${COLORS.text};
  min-width: 0;
`;
const MixDot = styled.span`width: 8px; height: 8px; border-radius: 50%; background: ${(p) => p.$c}; flex-shrink: 0;`;
const MixTrack = styled.div`height: 10px; border-radius: 999px; background: ${COLORS.bg}; overflow: hidden;`;
const MixFill = styled.div`
  height: 100%;
  border-radius: 999px;
  width: ${(p) => `${p.$w}%`};
  background: ${(p) => p.$c};
  transition: width 0.25s ease;
`;
const MixMeta = styled.div`
  font-size: 0.72rem;
  color: ${COLORS.textSecondary};
  text-align: right;
  white-space: nowrap;
`;
const MixStrong = styled.span`color: ${COLORS.text}; font-weight: 700;`;

const KeyStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.6rem;
  margin-top: 1rem;
  padding-top: 0.9rem;
  border-top: 1px dashed ${COLORS.border};
`;
const KeyStat = styled.div``;
const KeyStatLabel = styled.div`
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 800;
  color: ${COLORS.textSecondary};
`;
const KeyStatValue = styled.div`font-size: 1.1rem; font-weight: 800; color: ${COLORS.text};`;

/* Donut: SVG stroke-dasharray ring. Values are already-positioned slices. */
const Donut = ({ slices, centerValue, centerLabel, ariaLabel }) => {
  const size = 172;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = slices.reduce((sum, s) => sum + safeNum(s.value), 0);
  let offset = 0;
  return (
    <DonutSvg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={ariaLabel || centerLabel}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.bg} strokeWidth={stroke} />
      {slices.filter((s) => safeNum(s.value) > 0).map((s) => {
        const len = (safeNum(s.value) / (total || 1)) * circ;
        const node = (
          <circle
            key={s.key || s.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${circ - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offset += len;
        return node;
      })}
      <text x="50%" y="47%" textAnchor="middle" fontSize="27" fontWeight="800" fill={COLORS.text}>
        {centerValue}
      </text>
      <text x="50%" y="61%" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={COLORS.textSecondary} letterSpacing="1">
        {centerLabel}
      </text>
    </DonutSvg>
  );
};

/* Monthly column chart — counts per calendar month. */
const TrendChart = ({ points }) => {
  const max = Math.max(1, ...points.map((p) => safeNum(p.value)));
  return (
    <Trend>
      {points.map((p) => (
        <TrendCol key={p.key} title={`${p.label}: ${p.value} request(s), ${p.approved} approved`}>
          <TrendCount>{p.value}</TrendCount>
          <TrendTrack>
            <TrendBar $h={p.value === 0 ? 3 : Math.max(8, (p.value / max) * 100)} $dim={p.value === 0} />
          </TrendTrack>
          <TrendLabel>{p.label}</TrendLabel>
        </TrendCol>
      ))}
    </Trend>
  );
};


const LeaveDashboard = () => {
  const navigate = useNavigate();
  const me = getUserId();
  const tenantSlug = getParentTenantSlug() || getTenantSlug() || currentTenantSlug();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  /* ── Top navigation bar — sections of the leave dashboard ─────────────────────
     Defaults to 'overview'. Picking any value isolates that specific section
     (e.g. 'employees' → only the Employees table, 'history' → only History). */
  const [view, setView] = useState('overview');

  const navSections = useMemo(() => [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'approvals', label: 'Approvals', icon: CheckCircle },
    { value: 'employees', label: 'Employees', icon: Users },
    { value: 'history', label: 'History', icon: History },
    { value: 'calendar', label: 'Calendar', icon: Calendar },
  ], []);

  const [stats, setStats] = useState({ total: 0, pending: 0, on_leave: 0, by_status: [], by_type: [] });
  const [records, setRecords] = useState([]);        // every leave request in the tenant
  const [onLeaveToday, setOnLeaveToday] = useState([]);
  const [employees, setEmployees] = useState([]);    // balance row per registered user
  const [balance, setBalance] = useState(null);      // the signed-in user's own balance

  const [actingId, setActingId] = useState(null);

  // Approvals inbox controls
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortMode, setSortMode] = useState('oldest');
  const [selected, setSelected] = useState([]);

  // History controls
  const [empQ, setEmpQ] = useState('');
  const [histQ, setHistQ] = useState('');
  const [histStatus, setHistStatus] = useState('all');
  const [histType, setHistType] = useState('all');
  const [histPage, setHistPage] = useState(1);

  // Employee drawer + request modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [addDaysForm, setAddDaysForm] = useState({ days: '', reason: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [detailActionId, setDetailActionId] = useState(null);
  const [viewRequest, setViewRequest] = useState(null);

  /* Leave data lives in the PARENT tenant's database, so the parent slug is
     always sent explicitly (same pattern as ApplyLeave / MyLeaves). */
  const tenantHeaders = useMemo(() => {
    const h = { 'x-tenant-slug': tenantSlug };
    if (me) h['x-user-id'] = String(me);
    return { headers: h };
  }, [tenantSlug, me]);

  const load = useCallback(async (signal) => {
    const [statsRes, allRes, onLeaveRes, empRes, balRes] = await Promise.all([
      api.get(ENDPOINTS.LEAVE.STATS, { ...tenantHeaders, signal }).catch(() => null),
      api.get(ENDPOINTS.LEAVE.ALL, { ...tenantHeaders, signal }).catch(() => null),
      api.get(ENDPOINTS.LEAVE.USERS_ON_LEAVE, { ...tenantHeaders, signal }).catch(() => null),
      api.get(ENDPOINTS.LEAVE.BALANCES, { ...tenantHeaders, signal }).catch(() => null),
      me
        ? api.get(ENDPOINTS.LEAVE.BALANCE(me), { ...tenantHeaders, signal }).catch(() => null)
        : Promise.resolve(null),
    ]);

    const missing = [];
    if (!statsRes) missing.push('the KPI summary');
    if (!allRes) missing.push('the leave request records');
    if (!empRes) missing.push('the employee balances');

    setStats(normObj(statsRes) || { total: 0, pending: 0, on_leave: 0, by_status: [], by_type: [] });
    setRecords(normList(allRes));
    setOnLeaveToday(normList(onLeaveRes));
    setEmployees(normList(empRes));
    setBalance(normObj(balRes));
    setWarning(missing.length
      ? `Could not load ${missing.join(', ')}. Everything else on this page is live — press Refresh to retry.`
      : '');
  }, [tenantHeaders, me]);

  useEffect(() => {
    const ctrl = new AbortController();
    let ignore = false;
    (async () => {
      try {
        await load(ctrl.signal);
      } catch (e) {
        if (!ignore) setError(e?.friendlyMessage || 'Could not reach the leave service. Please try again.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; ctrl.abort(); };
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
      setError('');
    } catch (e) {
      setError(e?.friendlyMessage || 'Failed to refresh leave data.');
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  /* Escape closes the topmost layer (drawer first, then the request modal). */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setViewRequest(null);
      setSelectedUser(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);


  /* ── Approve / reject (single + bulk) ───────────────────────────────────── */
  const actionOn = useCallback(async (ids, status, notes) => {
    const list = (Array.isArray(ids) ? ids : [ids]).filter((id) => id !== undefined && id !== null);
    if (list.length === 0) return false;

    setActingId(list.length === 1 ? list[0] : null);
    const before = records;
    setRecords((prev) => prev.map((r) => (list.includes(r.id)
      ? { ...r, status, rejection_reason: notes || r.rejection_reason }
      : r)));

    let failed = 0;
    for (const id of list) {
      try {
        await api.patch(
          ENDPOINTS.LEAVE.UPDATE_STATUS(id),
          { status, rejection_reason: notes, approved_by: me },
          tenantHeaders
        );
      } catch (e) {
        failed += 1;
      }
    }

    const done = list.length - failed;
    if (failed === list.length) {
      setRecords(before);
      setError('The leave service rejected that change. The request may already have been processed.');
      notify.error('Nothing was updated', 'Please refresh and try again.');
    } else if (failed > 0) {
      notify.warning('Partly applied', `${done} of ${list.length} requests were updated.`);
    } else {
      notify.success(
        status === 'approved'
          ? (done > 1 ? `${done} requests approved` : 'Leave approved')
          : (done > 1 ? `${done} requests rejected` : 'Leave rejected')
      );
    }

    setSelected([]);
    setActingId(null);
    try {
      await refresh();
    } catch (e) {
      /* refresh() reports its own error — nothing more to do here. */
    }
    return failed === 0;
  }, [records, tenantHeaders, me, refresh]);

  const askReason = (title) => {
    const answer = window.prompt(title);
    if (answer === null) return null;
    const clean = String(answer).trim();
    return clean || 'Not specified';
  };

  const approve = (id) => actionOn(id, 'approved', null);
  const reject = (id) => {
    const notes = askReason('Rejection reason (optional):');
    if (notes === null) return;
    actionOn(id, 'rejected', notes);
  };
  const approveSelected = () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Approve ${selected.length} selected leave request(s)?`)) return;
    actionOn(selected, 'approved', null);
  };

  const toggleSelected = (id) => setSelected((prev) => (
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  ));

  /* ── Employee drawer ────────────────────────────────────────────────────── */
  const loadUserDetail = useCallback(async (user) => {
    if (!user?.user_id) return;
    setDetailLoading(true);
    const [balRes, leavesRes, addRes] = await Promise.all([
      api.get(ENDPOINTS.LEAVE.BALANCE(user.user_id), tenantHeaders).catch(() => null),
      api.get(ENDPOINTS.LEAVE.ALL, { ...tenantHeaders, params: { user_id: user.user_id } }).catch(() => null),
      api.get(ENDPOINTS.LEAVE.ADDITIONS(user.user_id), tenantHeaders).catch(() => null),
    ]);
    setUserDetail({
      balance: normObj(balRes),
      leaves: normList(leavesRes),
      additions: normList(addRes),
    });
    setDetailLoading(false);
  }, [tenantHeaders]);

  const openUser = useCallback((user) => {
    setSelectedUser(user);
    setUserDetail(null);
    setAddDaysForm({ days: '', reason: '' });
    loadUserDetail(user);
  }, [loadUserDetail]);

  const closeUser = () => {
    setSelectedUser(null);
    setUserDetail(null);
  };

  const submitAddDays = async () => {
    if (!selectedUser) return;
    const n = Number(addDaysForm.days);
    if (!n || n < 1) {
      notify.warning('Enter the number of days', 'At least 1 day is required.');
      return;
    }
    if (!String(addDaysForm.reason).trim()) {
      notify.warning('Reason required', 'Say why these days are being added, e.g. "2026 carry-over".');
      return;
    }
    setAddSaving(true);
    try {
      await api.post(ENDPOINTS.LEAVE.ADD_DAYS, {
        user_id: selectedUser.user_id,
        days: n,
        reason: String(addDaysForm.reason).trim(),
        added_by: me || undefined,
      }, tenantHeaders);
      setAddDaysForm({ days: '', reason: '' });
      notify.success('Days added', `${n} day(s) credited to ${selectedUser.name || selectedUser.full_name || 'the employee'}.`);
      await Promise.all([loadUserDetail(selectedUser), refresh()]);
    } catch (e) {
      notify.error('Could not add days', e?.friendlyMessage || 'Please try again.');
    } finally {
      setAddSaving(false);
    }
  };

  const removeAddition = async (id) => {
    if (!window.confirm('Undo this day adjustment? The balance is recalculated immediately.')) return;
    setRemovingId(id);
    try {
      await api.delete(ENDPOINTS.LEAVE.REMOVE_DAYS(id), tenantHeaders);
      notify.success('Adjustment removed');
      if (selectedUser) await Promise.all([loadUserDetail(selectedUser), refresh()]);
    } catch (e) {
      notify.error('Could not remove that adjustment', e?.friendlyMessage || 'Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  const decideInPanel = async (id, status, notes) => {
    setDetailActionId(id);
    const ok = await actionOn(id, status, notes);
    if (ok && selectedUser) await loadUserDetail(selectedUser);
    setDetailActionId(null);
  };
  const rejectInPanel = (id) => {
    const notes = askReason('Rejection reason (optional):');
    if (notes === null) return;
    decideInPanel(id, 'rejected', notes);
  };

  const approveFromModal = async (id) => {
    const ok = await actionOn(id, 'approved', null);
    if (ok) setViewRequest(null);
  };
  const rejectFromModal = async (id) => {
    const notes = askReason('Rejection reason (optional):');
    if (notes === null) return;
    const ok = await actionOn(id, 'rejected', notes);
    if (ok) setViewRequest(null);
  };

  /* ── CSV export for whatever the officer is currently looking at ────────── */
  const exportCsv = (rows, label) => {
    if (rows.length === 0) {
      notify.info('Nothing to export', 'There are no rows in this view.');
      return;
    }
    const head = ['Employee', 'Email', 'Type', 'Priority', 'Start', 'End', 'Days',
      'Half day', 'Status', 'Submitted', 'Reference', 'Reason'];
    const lines = rows.map((r) => [
      r.name || r.full_name || '', r.email || '', typeMeta(r.leave_type).label,
      priorityMeta(r.priority).label, toYMD(r.start_date), toYMD(r.end_date), safeNum(r.days),
      safeNum(r.is_half_day) ? 'Yes' : 'No', statusMeta(r.status).label,
      toYMD(r.created_at), r.reference_code || '', String(r.reason || '').replace(/\s+/g, ' '),
    ].map(csvCell).join(','));
    const csv = [head.map(csvCell).join(','), ...lines].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-${label}-${todayYMD()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify.success('Export ready', `${rows.length} row(s) downloaded as CSV.`);
  };

  const goApply = () => navigate('apply');

  /* ── Derived: status split (records win; stats/overview is the fallback) ─ */
  const statusCounts = useMemo(() => {
    const out = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    if (records.length > 0) {
      records.forEach((r) => {
        const k = String(r.status || '').toLowerCase();
        if (out[k] === undefined) out[k] = 0;
        out[k] += 1;
      });
      return out;
    }
    (Array.isArray(stats.by_status) ? stats.by_status : []).forEach((r) => {
      const k = String(r.status || '').toLowerCase();
      if (out[k] === undefined) out[k] = 0;
      out[k] = safeNum(r.count);
    });
    return out;
  }, [records, stats.by_status]);

  const usingStatsOnly = records.length === 0;
  const totalRequests = usingStatsOnly ? safeNum(stats.total) : records.length;
  const pendingCount = statusCounts.pending;
  const approvedDays = useMemo(() => records
    .filter((r) => String(r.status || '').toLowerCase() === 'approved')
    .reduce((n, r) => n + safeNum(r.days), 0), [records]);
  const avgRequestDays = records.length > 0
    ? round1(records.reduce((n, r) => n + safeNum(r.days), 0) / records.length)
    : 0;

  /* ── Derived: approvals queue ──────────────────────────────────────────── */
  const pendingQueue = useMemo(
    () => records.filter((r) => String(r.status || '').toLowerCase() === 'pending'),
    [records]
  );

  const filteredQueue = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = pendingQueue.filter((r) => {
      if (typeFilter !== 'all' && String(r.leave_type || '').toLowerCase() !== typeFilter) return false;
      if (priorityFilter !== 'all'
        && String(r.priority || 'medium').toLowerCase() !== priorityFilter) return false;
      if (!needle) return true;
      return [r.name, r.full_name, r.email, r.reason, r.reference_code, r.leave_type]
        .filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
    const age = (r) => daysSince(r.created_at) ?? -1;
    if (sortMode === 'oldest') rows = rows.slice().sort((a, b) => age(b) - age(a));
    else if (sortMode === 'newest') rows = rows.slice().sort((a, b) => age(a) - age(b));
    else {
      rows = rows.slice().sort((a, b) => safeNum(b.days) - safeNum(a.days)
        || toYMD(a.start_date).localeCompare(toYMD(b.start_date)));
    }
    return rows;
  }, [pendingQueue, q, typeFilter, priorityFilter, sortMode]);

  /* ── Derived: today's coverage + next 14 days ──────────────────────────── */
  const onLeaveList = useMemo(() => onLeaveToday.map((u) => ({
    key: u.id || u.user_id || u.email || `onleave-${Math.random()}`,
    user_id: u.user_id,
    name: u.name || u.full_name || u.email || 'Employee',
    email: u.email,
    leave_type: u.leave_type,
    start_date: u.start_date,
    end_date: u.end_date,
    days: u.days,
  })), [onLeaveToday]);

  const upcoming = useMemo(() => {
    const from = ymdPlus(1);
    const to = ymdPlus(14);
    const rows = records
      .filter((r) => String(r.status || '').toLowerCase() === 'approved')
      .filter((r) => {
        const s = toYMD(r.start_date);
        return Boolean(s) && s >= from && s <= to;
      })
      .sort((a, b) => toYMD(a.start_date).localeCompare(toYMD(b.start_date)));
    const byDay = new Map();
    rows.forEach((r) => {
      const key = toYMD(r.start_date);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(r);
    });
    return Array.from(byDay.entries()).map(([day, items]) => ({ day, items }));
  }, [records]);

  const next14Total = upcoming.reduce((n, g) => n + g.items.length, 0);

  /* ── Derived: charts ───────────────────────────────────────────────────── */
  const statusSlices = useMemo(() => ([
    { key: 'approved', label: 'Approved', value: statusCounts.approved, color: COLORS.success },
    { key: 'pending', label: 'Pending', value: statusCounts.pending, color: COLORS.warning },
    { key: 'rejected', label: 'Rejected', value: statusCounts.rejected, color: COLORS.danger },
    { key: 'cancelled', label: 'Cancelled', value: statusCounts.cancelled, color: '#94A3B8' },
  ]), [statusCounts]);

  const months = useMemo(() => {
    const now = new Date();
    const base = [];
    for (let i = 5; i >= 0; i -= 1) {
      const key = monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1));
      base.push({ key, label: monthLabel(key), value: 0, approved: 0 });
    }
    const index = new Map(base.map((b, i) => [b.key, i]));
    records.forEach((r) => {
      const i = index.get(monthKey(r.created_at || r.start_date));
      if (i === undefined) return;
      base[i].value += 1;
      if (String(r.status || '').toLowerCase() === 'approved') base[i].approved += 1;
    });
    return base;
  }, [records]);

  const typeMix = useMemo(() => {
    if (records.length > 0) {
      const map = new Map();
      records.forEach((r) => {
        const t = String(r.leave_type || 'other').toLowerCase();
        const cur = map.get(t) || { type: t, count: 0, days: 0 };
        cur.count += 1;
        cur.days += safeNum(r.days);
        map.set(t, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.count - a.count);
    }
    return (Array.isArray(stats.by_type) ? stats.by_type : [])
      .map((t) => ({
        type: String(t.leave_type || 'other').toLowerCase(),
        count: safeNum(t.count),
        days: safeNum(t.total_days),
      }))
      .sort((a, b) => b.count - a.count);
  }, [records, stats.by_type]);

  const maxTypeCount = typeMix.reduce((m, t) => Math.max(m, t.count), 0) || 1;

  /* ── Derived: employee balances ────────────────────────────────────────── */
  const onLeaveIds = useMemo(
    () => new Set(onLeaveList.map((u) => String(u.user_id))),
    [onLeaveList]
  );

  const stateChip = (state) => ({
    available: { fg: '#047857', bg: 'rgba(16, 185, 129, 0.12)' },
    onleave: { fg: '#B45309', bg: 'rgba(245, 158, 11, 0.16)' },
    pending: { fg: '#1D4ED8', bg: 'rgba(59, 130, 246, 0.12)' },
    low: { fg: '#B45309', bg: 'rgba(245, 158, 11, 0.14)' },
    depleted: { fg: '#B91C1C', bg: 'rgba(231, 76, 60, 0.12)' },
  }[state] || { fg: '#475569', bg: 'rgba(148, 163, 184, 0.18)' });

  const employeeRows = useMemo(() => {
    const needle = empQ.trim().toLowerCase();
    return employees.map((e) => {
      const entitlement = safeNum(e.initial) + safeNum(e.manualAdditions) + safeNum(e.holidayCompensations);
      const taken = safeNum(e.leaveTaken);
      const pending = safeNum(e.pendingDays);
      const available = safeNum(e.currentBalance);
      const usedPct = entitlement > 0 ? Math.min(100, Math.round((taken / entitlement) * 100)) : 0;
      const onLeave = onLeaveIds.has(String(e.user_id));
      let state = 'available';
      let stateLabel = 'Available';
      if (onLeave) { state = 'onleave'; stateLabel = 'On leave today'; }
      else if (pending > 0) { state = 'pending'; stateLabel = `${round1(pending)} day(s) pending`; }
      else if (available <= 0) { state = 'depleted'; stateLabel = 'No days left'; }
      else if (available <= 5) { state = 'low'; stateLabel = 'Low balance'; }
      return {
        ...e,
        name: e.name || e.full_name || e.email || 'Employee',
        entitlement,
        taken,
        pending,
        available,
        usedPct,
        state,
        stateLabel,
        onLeave,
      };
    })
      .filter((e) => (!needle ? true : `${e.name} ${e.email || ''}`.toLowerCase().includes(needle)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, empQ, onLeaveIds]);

  const lowBalanceCount = employeeRows
    .filter((e) => e.state === 'low' || e.state === 'depleted').length;

  /* ── Derived: full history (search + filters + paging) ─────────────────── */
  const historyRows = useMemo(() => {
    const needle = histQ.trim().toLowerCase();
    return records
      .filter((r) => histStatus === 'all' || String(r.status || '').toLowerCase() === histStatus)
      .filter((r) => histType === 'all' || String(r.leave_type || '').toLowerCase() === histType)
      .filter((r) => {
        if (!needle) return true;
        return [r.name, r.full_name, r.email, r.reason, r.reference_code]
          .filter(Boolean).join(' ').toLowerCase().includes(needle);
      });
  }, [records, histStatus, histType, histQ]);

  const histPages = Math.max(1, Math.ceil(historyRows.length / PAGE_SIZE));
  const histCurrent = Math.min(histPage, histPages);
  const histPageRows = historyRows.slice((histCurrent - 1) * PAGE_SIZE, histCurrent * PAGE_SIZE);

  useEffect(() => { setHistPage(1); }, [histQ, histStatus, histType]);

  useEffect(() => {
    const valid = new Set(pendingQueue.map((r) => r.id));
    setSelected((prev) => {
      const next = prev.filter((id) => valid.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [pendingQueue]);

  const allQueueSelected = filteredQueue.length > 0
    && filteredQueue.every((r) => selected.includes(r.id));
  const toggleAllQueue = () => setSelected(allQueueSelected ? [] : filteredQueue.map((r) => r.id));

  /* ── Section visibility (driven by the top nav) ─────────────────────────── */
  const showOverview = view === 'overview';
  const showApprovals = view === 'approvals';
  const showEmployees = view === 'employees';
  const showHistory = view === 'history';
  const showCalendar = view === 'calendar';

  return (
    <Page>
      <TopNavBar role="tablist" aria-label="Leave dashboard sections">
        {navSections.map((s) => {
          const Icon = s.icon;
          const active = view === s.value;
          return (
            <TopNavItem
              key={s.value}
              $active={active}
              onClick={() => setView(s.value)}
              role="tab"
              aria-selected={active}
              aria-label={`Show ${s.label}`}
            >
              <TopNavIcon><Icon size={16} /></TopNavIcon>
              <TopNavLabel>{s.label}</TopNavLabel>
            </TopNavItem>
          );
        })}
        <div style={{ flex: 1 }} />
        <Btn onClick={refresh} disabled={refreshing}>
          {refreshing ? <Spin><Loader2 size={14} /></Spin> : <RefreshCw size={14} />} Refresh
        </Btn>
        <Btn className="primary" onClick={goApply}><Plus size={14} /> Apply leave</Btn>
      </TopNavBar>

      {error && (
        <Notice $tone="error">
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>{error}</div>
        </Notice>
      )}
      {warning && !loading && (
        <Notice $tone="warn">
          <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>{warning}</div>
        </Notice>
      )}

      {loading ? (
        <>
          <Skeleton $h="250px" />
          <Skeleton $h="340px" />
          <Skeleton $h="300px" />
        </>
      ) : (
        <>
          {showOverview && (
            <Grid3 style={{ marginBottom: '1rem' }}>
              <Section>
                <CardHead>
                  <CardHeadLeft>
                    <PieChartIcon size={17} color={COLORS.primary} />
                    <div>
                      <CardTitle>Status breakdown</CardTitle>
                      <CardSub>All {totalRequests} request(s) on record</CardSub>
                    </div>
                  </CardHeadLeft>
                </CardHead>
                <CardBody>
                  {totalRequests === 0 ? (
                    <Empty>
                      <PieChartIcon size={22} />
                      <p>No leave requests recorded yet.</p>
                    </Empty>
                  ) : (
                    <DonutWrap>
                      <Donut
                        slices={statusSlices}
                        centerValue={totalRequests}
                        centerLabel="REQUESTS"
                        ariaLabel={`${totalRequests} leave requests by status`}
                      />
                      <Legend>
                        {statusSlices.map((s) => (
                          <LegendRow key={s.key}>
                            <LegendDot $c={s.color} />
                            <LegendLabel>{s.label}</LegendLabel>
                            <LegendValue>{s.value}</LegendValue>
                            <LegendPct>
                              {totalRequests ? Math.round((s.value / totalRequests) * 100) : 0}%
                            </LegendPct>
                          </LegendRow>
                        ))}
                      </Legend>
                    </DonutWrap>
                  )}
                </CardBody>
              </Section>

              <Section>
                <CardHead>
                  <CardHeadLeft>
                    <TrendingUp size={17} color={COLORS.primary} />
                    <div>
                      <CardTitle>Requests per month</CardTitle>
                      <CardSub>Last 6 months · hover a column for detail</CardSub>
                    </div>
                  </CardHeadLeft>
                </CardHead>
                <CardBody>
                  {records.length === 0 ? (
                    <Empty>
                      <BarChart3 size={22} />
                      <p>No dated records to trend yet.</p>
                    </Empty>
                  ) : (
                    <>
                      <TrendChart points={months} />
                      <KeyStats>
                        <KeyStat>
                          <KeyStatLabel>Approved days booked</KeyStatLabel>
                          <KeyStatValue>{round1(approvedDays)}</KeyStatValue>
                        </KeyStat>
                        <KeyStat>
                          <KeyStatLabel>Avg days / request</KeyStatLabel>
                          <KeyStatValue>{round1(avgRequestDays)}</KeyStatValue>
                        </KeyStat>
                        <KeyStat>
                          <KeyStatLabel>Busiest month</KeyStatLabel>
                          <KeyStatValue>
                            {months.reduce((m, p) => (p.value > m.value ? p : m), months[0]).label}
                            {' · '}
                            {months.reduce((m, p) => (p.value > m.value ? p : m), months[0]).value}
                          </KeyStatValue>
                        </KeyStat>
                      </KeyStats>
                    </>
                  )}
                </CardBody>
              </Section>

              <Section>
                <CardHead>
                  <CardHeadLeft>
                    <BarChart3 size={17} color={COLORS.primary} />
                    <div>
                      <CardTitle>Leave type mix</CardTitle>
                      <CardSub>Requests and days per leave type</CardSub>
                    </div>
                  </CardHeadLeft>
                </CardHead>
                <CardBody>
                  {typeMix.length === 0 ? (
                    <Empty>
                      <BarChart3 size={22} />
                      <p>No leave types recorded yet.</p>
                    </Empty>
                  ) : (
                    <>
                      <MixList>
                        {typeMix.slice(0, 7).map((t) => {
                          const meta = typeMeta(t.type);
                          const w = maxTypeCount ? Math.round((t.count / maxTypeCount) * 100) : 0;
                          return (
                            <MixRow key={t.type}>
                              <MixLabel><MixDot $c={meta.color} />{meta.label}</MixLabel>
                              <MixTrack><MixFill $w={w} $c={meta.color} /></MixTrack>
                              <MixMeta>
                                <MixStrong>{t.count}</MixStrong> req · {round1(t.days)} days
                              </MixMeta>
                            </MixRow>
                          );
                        })}
                      </MixList>
                      <KeyStats>
                        <KeyStat>
                          <KeyStatLabel>Most used type</KeyStatLabel>
                          <KeyStatValue>{typeMeta(typeMix[0].type).label}</KeyStatValue>
                        </KeyStat>
                        <KeyStat>
                          <KeyStatLabel>Requests / employees</KeyStatLabel>
                          <KeyStatValue>{totalRequests} / {employees.length}</KeyStatValue>
                        </KeyStat>
                        <KeyStat>
                          <KeyStatLabel>Days booked in total</KeyStatLabel>
                          <KeyStatValue>{round1(typeMix.reduce((n, t) => n + t.days, 0))}</KeyStatValue>
                        </KeyStat>
                      </KeyStats>
                    </>
                  )}
                </CardBody>
              </Section>
            </Grid3>
          )}

          {showApprovals && (
            <Split style={{ marginBottom: '1rem' }}>
              <div>
                <Section>
                  <CardHead>
                    <CardHeadLeft>
                      <ListChecks size={17} color={COLORS.primary} />
                      <div>
                        <CardTitle>Approvals inbox</CardTitle>
                        <CardSub>
                          {pendingCount === 0
                            ? 'Nothing is waiting for a decision'
                            : `${filteredQueue.length} of ${pendingCount} pending request(s) shown`}
                        </CardSub>
                      </div>
                    </CardHeadLeft>
                    <Btn
                      onClick={() => exportCsv(filteredQueue, 'pending')}
                      disabled={filteredQueue.length === 0}
                    >
                      <Download size={14} /> Export CSV
                    </Btn>
                  </CardHead>

                  <Toolbar>
                    <SearchBox>
                      <Search size={15} />
                      <input
                        type="search"
                        placeholder="Search name, reason, reference…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        aria-label="Search pending requests"
                      />
                    </SearchBox>
                    <Select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      aria-label="Filter by leave type"
                    >
                      {TYPE_FILTERS.map((t) => (
                        <option key={t} value={t}>{t === 'all' ? 'All types' : typeMeta(t).label}</option>
                      ))}
                    </Select>
                    <Select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      aria-label="Filter by priority"
                    >
                      {PRIORITY_FILTERS.map((p) => (
                        <option key={p} value={p}>{p === 'all' ? 'Any priority' : priorityMeta(p).label}</option>
                      ))}
                    </Select>
                    <Select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value)}
                      aria-label="Sort pending requests"
                    >
                      <option value="oldest">Longest waiting first</option>
                      <option value="newest">Newest first</option>
                      <option value="longest">Longest leave first</option>
                    </Select>
                  </Toolbar>

                  {selected.length > 0 && (
                    <BulkBar>
                      <span>{selected.length} selected — each request is approved individually</span>
                      <Btn className="ok" onClick={approveSelected}>
                        <Check size={14} /> Approve selected
                      </Btn>
                      <Btn onClick={() => setSelected([])}><X size={14} /> Clear</Btn>
                    </BulkBar>
                  )}

                  {filteredQueue.length === 0 ? (
                    <Empty>
                      {pendingCount === 0 ? <CheckCircle size={22} /> : <Search size={22} />}
                      <p>
                        {pendingCount === 0
                          ? 'Every leave request has been decided — the inbox is empty.'
                          : 'No pending request matches the current filters.'}
                      </p>
                      {pendingCount === 0 && totalRequests === 0 && (
                        <p>Requests appear here the moment an employee applies for leave.</p>
                      )}
                    </Empty>
                  ) : (
                    <TableScroll>
                      <Table>
                        <thead>
                          <tr>
                            <th style={{ width: 34 }}>
                              <Tick
                                checked={allQueueSelected}
                                onChange={toggleAllQueue}
                                aria-label="Select every pending request"
                              />
                            </th>
                            <th>Employee</th>
                            <th>Type</th>
                            <th>Dates</th>
                            <th>Days</th>
                            <th>Priority</th>
                            <th>Waiting</th>
                            <th style={{ width: 200 }}>Decision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQueue.map((l) => {
                            const age = daysSince(l.created_at);
                            const rowBusy = actingId === l.id;
                            return (
                              <ClickRow
                                key={l.id}
                                onClick={() => setViewRequest(l)}
                                title="Open the full request"
                              >
                                <td onClick={(e) => e.stopPropagation()}>
                                  <Tick
                                    checked={selected.includes(l.id)}
                                    onChange={() => toggleSelected(l.id)}
                                    aria-label={`Select request ${l.id}`}
                                  />
                                </td>
                                <td>
                                  <PersonCell>
                                    <Avatar>{initials(l.name, l.email)}</Avatar>
                                    <div style={{ minWidth: 0 }}>
                                      <Name>{l.name || l.email || 'Employee'}</Name>
                                      <SubName>Submitted {fmtShort(l.created_at)}</SubName>
                                    </div>
                                  </PersonCell>
                                </td>
                                <td>
                                  <TypeChip>
                                    <PillDot $c={typeMeta(l.leave_type).color} />
                                    {typeMeta(l.leave_type).label}
                                    {safeNum(l.is_half_day) ? ' · half day' : ''}
                                  </TypeChip>
                                </td>
                                <td>{fmtRange(l.start_date, l.end_date)}</td>
                                <td style={{ fontWeight: 700 }}>{round1(l.days)}</td>
                                <td>
                                  <PriorityFlag $p={l.priority}>
                                    <Flag size={11} />{priorityMeta(l.priority).label}
                                  </PriorityFlag>
                                </td>
                                <td>
                                  <SubName>
                                    {age === null ? '—' : (age <= 0 ? 'Today' : humanSpan(age))}
                                  </SubName>
                                  {age !== null && age >= 3 && (
                                    <MiniTag style={{ marginTop: 2 }}>
                                      <Hourglass size={11} /> ageing
                                    </MiniTag>
                                  )}
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                    <Btn className="ok" onClick={() => approve(l.id)} disabled={rowBusy}>
                                      {rowBusy ? <Spin><Loader2 size={13} /></Spin> : <Check size={13} />} Approve
                                    </Btn>
                                    <Btn className="danger" onClick={() => reject(l.id)} disabled={rowBusy}>
                                      <XCircle size={13} /> Reject
                                    </Btn>
                                  </div>
                                </td>
                              </ClickRow>
                            );
                          })}
                        </tbody>
                      </Table>
                    </TableScroll>
                  )}

                </Section>
              </div>

              <Stack>
                <Section>
                  <CardHead>
                    <CardHeadLeft>
                      <UserCheck size={17} color={COLORS.primary} />
                      <div>
                        <CardTitle>On leave today</CardTitle>
                        <CardSub>
                          {onLeaveList.length === 0 ? 'Full team available' : 'Approved and currently away'}
                        </CardSub>
                      </div>
                    </CardHeadLeft>
                  </CardHead>
                  <CardBody>
                    {onLeaveList.length === 0 ? (
                      <Empty style={{ padding: '1.4rem 0.5rem' }}>
                        <CheckCircle size={22} />
                        <p>Nobody is on leave today — full cover available.</p>
                      </Empty>
                    ) : (
                      <CoverList>
                        {onLeaveList.map((u) => {
                          const back = daysUntil(u.end_date);
                          return (
                            <CoverRow key={u.key}>
                              <Avatar $c={typeMeta(u.leave_type).color}>
                                {initials(u.name, u.email)}
                              </Avatar>
                              <CoverListInner style={{ flex: 1 }}>
                                <Name>{u.name}</Name>
                                <SubName>
                                  {typeMeta(u.leave_type).label} · {fmtRange(u.start_date, u.end_date)}
                                </SubName>
                              </CoverListInner>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <StatusPill $status="approved">
                                  <PillDot $c={COLORS.success} />On leave
                                </StatusPill>
                                <SubName style={{ marginTop: 2 }}>
                                  {back === null ? '' : (back <= 0 ? 'Last day today' : `Back in ${humanSpan(back)}`)}
                                </SubName>
                              </div>
                            </CoverRow>
                          );
                        })}
                      </CoverList>
                    )}
                  </CardBody>
                </Section>

                <Section>
                  <CardHead>
                    <CardHeadLeft>
                      <CalendarDays size={17} color={COLORS.primary} />
                      <div>
                        <CardTitle>Starting in the next 14 days</CardTitle>
                        <CardSub>{next14Total} approved request(s) to plan cover for</CardSub>
                      </div>
                    </CardHeadLeft>
                  </CardHead>
                  <CardBody>
                    {upcoming.length === 0 ? (
                      <Empty style={{ padding: '1.4rem 0.5rem' }}>
                        <CalendarDays size={22} />
                        <p>No approved leave starts in the next two weeks.</p>
                      </Empty>
                    ) : (
                      <div>
                        {upcoming.map((g) => {
                          const dayDate = new Date(`${g.day}T12:00:00`);
                          return (
                            <UpcomingDay key={g.day}>
                              <DayBadge>
                                <DayNum>{dayDate.getDate()}</DayNum>
                                <DayMon>{dayDate.toLocaleDateString('en-GB', { month: 'short' })}</DayMon>
                              </DayBadge>
                              <CoverListInner style={{ flex: 1 }}>
                                {g.items.map((r) => (
                                  <div
                                    key={r.id}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setViewRequest(r)}
                                      style={{
                                        border: 0,
                                        background: 'none',
                                        padding: 0,
                                        cursor: 'pointer',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        color: COLORS.primary,
                                        textAlign: 'left',
                                      }}
                                    >
                                      {r.name || r.email || 'Employee'}
                                    </button>
                                    <MiniTag>{typeMeta(r.leave_type).label}</MiniTag>
                                    <span style={{ fontSize: '0.74rem', color: COLORS.textSecondary }}>
                                      {round1(r.days)} day(s) off
                                    </span>
                                  </div>
                                ))}
                              </CoverListInner>
                            </UpcomingDay>
                          );
                        })}
                      </div>
                    )}
                  </CardBody>
                </Section>

                <Section>
                  <CardHead>
                    <CardHeadLeft>
                      <User size={17} color={COLORS.primary} />
                      <div>
                        <CardTitle>My leave balance</CardTitle>
                        <CardSub>Your own annual leave position</CardSub>
                      </div>
                    </CardHeadLeft>
                  </CardHead>
                  <CardBody>
                    {balance ? (
                      <>
                        <MiniGrid>
                          <MiniStat>
                            <MSLabel>Entitlement</MSLabel>
                            <MSValue>{round1(balance.initial)}</MSValue>
                          </MiniStat>
                          <MiniStat>
                            <MSLabel>Taken</MSLabel>
                            <MSValue>{round1(balance.leaveTaken)}</MSValue>
                          </MiniStat>
                          <MiniStat $hl>
                            <MSLabel>Available</MSLabel>
                            <MSValue $hl>{round1(balance.currentBalance)}</MSValue>
                          </MiniStat>
                        </MiniGrid>
                        <KeyStats>
                          <KeyStat>
                            <KeyStatLabel>Pending days</KeyStatLabel>
                            <KeyStatValue>{round1(balance.pendingDays)}</KeyStatValue>
                          </KeyStat>
                          <KeyStat>
                            <KeyStatLabel>Manual additions</KeyStatLabel>
                            <KeyStatValue>{round1(balance.manualAdditions)}</KeyStatValue>
                          </KeyStat>
                          <KeyStat>
                            <KeyStatLabel>Holiday credit</KeyStatLabel>
                            <KeyStatValue>{round1(balance.holidayCompensations)}</KeyStatValue>
                          </KeyStat>
                        </KeyStats>
                      </>
                    ) : (
                      <Empty style={{ padding: '1.4rem 0.5rem' }}>
                        <User size={22} />
                        <p>Sign in as a registered user to load your personal balance.</p>
                      </Empty>
                    )}
                  </CardBody>
                </Section>

              </Stack>

            </Split>
          )}

          {showEmployees && (
            <Section>
              <CardHead>
                <CardHeadLeft>
                  <Briefcase size={17} color={COLORS.primary} />
                  <div>
                    <CardTitle>Employees &amp; balances</CardTitle>
                    <CardSub>
                      {employeeRows.length} employee(s)
                      {lowBalanceCount > 0 ? ` · ${lowBalanceCount} low or exhausted` : ''}
                      {' · click a row to open their leave dashboard'}
                    </CardSub>
                  </div>
                </CardHeadLeft>
              </CardHead>
              <Toolbar>
                <SearchBox>
                  <Search size={15} />
                  <input
                    type="search"
                    placeholder="Search employees by name or email…"
                    value={empQ}
                    onChange={(e) => setEmpQ(e.target.value)}
                    aria-label="Search employees"
                  />
                </SearchBox>
                <span style={{ fontSize: '0.76rem', color: COLORS.textSecondary }}>
                  Available = base entitlement + manual days + holiday credit − approved annual days.
                </span>
              </Toolbar>
              {employeeRows.length === 0 ? (
                <Empty>
                  <Users size={22} />
                  <p>
                    {employees.length === 0
                      ? 'No employees found. Registered users appear here with their leave balances.'
                      : 'No employee matches that search.'}
                  </p>
                </Empty>
              ) : (
                <TableScroll>
                  <Table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Entitlement</th>
                        <th style={{ minWidth: 170 }}>Taken</th>
                        <th>Pending</th>
                        <th>Available</th>
                        <th style={{ width: 48 }} aria-label="Open" />
                      </tr>
                    </thead>
                    <tbody>
                      {employeeRows.map((e) => {
                        const chip = stateChip(e.state);
                        return (
                          <ClickRow
                            key={e.user_id || e.email || e.name}
                            onClick={() => openUser(e)}
                            title="Open this employee's leave dashboard"
                          >
                            <td>
                              <PersonCell>
                                <Avatar $c={e.state === 'onleave' ? COLORS.warning : COLORS.primary}>
                                  {initials(e.name, e.email)}
                                </Avatar>
                                <div style={{ minWidth: 0 }}>
                                  <Name>{e.name}</Name>
                                  <SubName>{e.email || '—'}</SubName>
                                  <MiniTag
                                    style={{
                                      marginTop: 3,
                                      color: chip.fg,
                                      background: chip.bg,
                                      borderColor: 'transparent',
                                    }}
                                  >
                                    {e.stateLabel}
                                  </MiniTag>
                                </div>
                              </PersonCell>
                            </td>
                            <td style={{ fontWeight: 600 }}>{round1(e.initial)}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MixTrack style={{ flex: 1, minWidth: 70 }}>
                                  <MixFill
                                    $w={e.usedPct}
                                    $c={e.usedPct >= 80 ? COLORS.danger : COLORS.primary}
                                  />
                                </MixTrack>
                                <span style={{ fontSize: '0.74rem', color: COLORS.textSecondary, whiteSpace: 'nowrap' }}>
                                  {round1(e.taken)} ({e.usedPct}%)
                                </span>
                              </div>
                            </td>
                            <td>{round1(e.pending)}</td>
                            <td>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: e.available <= 0
                                    ? COLORS.danger
                                    : (e.available <= 5 ? COLORS.warning : COLORS.primary),
                                }}
                              >
                                {round1(e.available)} days
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <ChevronRight size={15} color={COLORS.textSecondary} />
                            </td>
                          </ClickRow>
                        );
                      })}
                    </tbody>
                  </Table>
                </TableScroll>
              )}

            </Section>
          )}

          {showHistory && (
            <Section>
              <CardHead>
                <CardHeadLeft>
                  <History size={17} color={COLORS.primary} />
                  <div>
                    <CardTitle>Leave history</CardTitle>
                    <CardSub>
                      {historyRows.length} of {records.length} request(s) match
                      {' · click a row for the full request'}
                    </CardSub>
                  </div>
                </CardHeadLeft>
                <Btn
                  onClick={() => exportCsv(historyRows, 'history')}
                  disabled={historyRows.length === 0}
                >
                  <Download size={14} /> Export CSV
                </Btn>
              </CardHead>
              <Toolbar>
                <SearchBox>
                  <Search size={15} />
                  <input
                    type="search"
                    placeholder="Search employee, reason, reference…"
                    value={histQ}
                    onChange={(e) => setHistQ(e.target.value)}
                    aria-label="Search leave history"
                  />
                </SearchBox>
                <Select
                  value={histStatus}
                  onChange={(e) => setHistStatus(e.target.value)}
                  aria-label="Filter history by status"
                >
                  {STATUS_FILTERS.map((s) => (
                    <option key={s} value={s}>{s === 'all' ? 'All statuses' : statusMeta(s).label}</option>
                  ))}
                </Select>
                <Select
                  value={histType}
                  onChange={(e) => setHistType(e.target.value)}
                  aria-label="Filter history by leave type"
                >
                  {TYPE_FILTERS.map((t) => (
                    <option key={t} value={t}>{t === 'all' ? 'All types' : typeMeta(t).label}</option>
                  ))}
                </Select>
              </Toolbar>
              {historyRows.length === 0 ? (
                <Empty>
                  <FileText size={22} />
                  <p>
                    {records.length === 0
                      ? 'No leave requests recorded yet for this tenant.'
                      : 'No request matches the current filters.'}
                  </p>
                </Empty>
              ) : (
                <>
                  <TableScroll>
                    <Table>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Type</th>
                          <th>Dates</th>
                          <th>Days</th>
                          <th>Submitted</th>
                          <th>Status</th>
                          <th style={{ width: 44 }} aria-label="Open" />
                        </tr>
                      </thead>
                      <tbody>
                        {histPageRows.map((l) => (
                          <ClickRow
                            key={l.id}
                            onClick={() => setViewRequest(l)}
                            title="Open the full request"
                          >
                            <td>
                              <PersonCell>
                                <Avatar>{initials(l.name, l.email)}</Avatar>
                                <div style={{ minWidth: 0 }}>
                                  <Name>{l.name || '—'}</Name>
                                  <SubName>{l.email || ''}</SubName>
                                </div>
                              </PersonCell>
                            </td>
                            <td>
                              <TypeChip>
                                <PillDot $c={typeMeta(l.leave_type).color} />
                                {typeMeta(l.leave_type).label}
                              </TypeChip>
                            </td>
                            <td>{fmtRange(l.start_date, l.end_date)}</td>
                            <td style={{ fontWeight: 700 }}>{round1(l.days)}</td>
                            <td><SubName>{fmtDate(l.created_at)}</SubName></td>
                            <td>
                              <StatusPill $status={l.status}>
                                <PillDot $c={statusMeta(l.status).color} />
                                {statusMeta(l.status).label}
                              </StatusPill>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <ChevronRight size={15} color={COLORS.textSecondary} />
                            </td>
                          </ClickRow>
                        ))}
                      </tbody>
                    </Table>
                  </TableScroll>
                  <Pager>
                    <PagerInfo>
                      Showing {(histCurrent - 1) * PAGE_SIZE + 1}–
                      {Math.min(histCurrent * PAGE_SIZE, historyRows.length)} of {historyRows.length}
                    </PagerInfo>
                    <PagerBtns>
                      <PageBtn onClick={() => setHistPage(1)} disabled={histCurrent === 1} aria-label="First page">
                        <ChevronFirst size={14} />
                      </PageBtn>
                      <PageBtn
                        onClick={() => setHistPage(histCurrent - 1)}
                        disabled={histCurrent === 1}
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={14} />
                      </PageBtn>
                      <PagerInfo style={{ padding: '0 0.4rem' }}>
                        Page {histCurrent} of {histPages}
                      </PagerInfo>
                      <PageBtn
                        onClick={() => setHistPage(histCurrent + 1)}
                        disabled={histCurrent === histPages}
                        aria-label="Next page"
                      >
                        <ChevronRight size={14} />
                      </PageBtn>
                      <PageBtn
                        onClick={() => setHistPage(histPages)}
                        disabled={histCurrent === histPages}
                        aria-label="Last page"
                      >
                        <ChevronLast size={14} />
                      </PageBtn>
                    </PagerBtns>
                  </Pager>
                </>
              )}

            </Section>
          )}

          {showCalendar && (
            <Section>
              <CardHead>
                <CardHeadLeft>
                  <Calendar size={17} color={COLORS.primary} />
                  <div>
                    <CardTitle>Leave calendar</CardTitle>
                    <CardSub>
                      {records.length} request(s) plotted by date · click a leave to open that employee
                    </CardSub>
                  </div>
                </CardHeadLeft>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {statusSlices.map((s) => (
                    <MiniTag key={s.key} style={{ color: s.color }}>
                      <PillDot $c={s.color} />{s.label} {s.value}
                    </MiniTag>
                  ))}
                </div>
              </CardHead>
              <CardBody style={{ padding: '0.85rem' }}>
                <LeaveCalendar
                  leaves={records}
                  onLeaveClick={(leave) => openUser({
                    user_id: leave.user_id,
                    name: leave.name,
                    email: leave.email,
                  })}
                />
              </CardBody>
            </Section>
          )}

        </>
      )}

      {selectedUser && (
        <Overlay onClick={closeUser}>
          <Drawer
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Employee leave dashboard"
          >
            <DrawerHead>
              <Avatar $lg>
                {initials(selectedUser.name || selectedUser.full_name, selectedUser.email)}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <DrawerTitle>
                  {selectedUser.name || selectedUser.full_name || 'Employee'}
                </DrawerTitle>
                <DrawerSub>{selectedUser.email || '—'}</DrawerSub>
              </div>
              <CloseBtn onClick={closeUser} aria-label="Close panel"><X size={16} /></CloseBtn>
            </DrawerHead>

            <DrawerBody>
              {detailLoading || !userDetail ? (
                <>
                  <Skeleton $h="120px" />
                  <Skeleton $h="210px" />
                  <Skeleton $h="170px" />
                </>
              ) : (
                <>
                  {(() => {
                    const b = userDetail.balance || {};
                    const ent = safeNum(b.initial) + safeNum(b.manualAdditions) + safeNum(b.holidayCompensations);
                    const avail = safeNum(b.currentBalance);
                    const r = 46;
                    const circ = 2 * Math.PI * r;
                    const pct = ent > 0 ? Math.max(0, Math.min(1, avail / ent)) : 0;
                    const low = avail <= 5;
                    return (
                      <RingRow>
                        <RingSvg viewBox="0 0 116 116" role="img" aria-label={`${round1(avail)} days available`}>
                          <circle cx="58" cy="58" r={r} fill="none" stroke={COLORS.bg} strokeWidth="13" />
                          <circle
                            cx="58"
                            cy="58"
                            r={r}
                            fill="none"
                            stroke={low ? COLORS.warning : COLORS.primary}
                            strokeWidth="13"
                            strokeLinecap="round"
                            strokeDasharray={`${circ * pct} ${circ}`}
                            transform="rotate(-90 58 58)"
                          />
                          <text x="58" y="55" textAnchor="middle" fontSize="22" fontWeight="800" fill={COLORS.text}>
                            {round1(avail)}
                          </text>
                          <text
                            x="58"
                            y="72"
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="700"
                            fill={COLORS.textSecondary}
                            letterSpacing="1"
                          >
                            DAYS LEFT
                          </text>
                        </RingSvg>
                        <RingLegend>
                          <LegendRow>
                            <LegendDot $c={COLORS.success} />
                            <LegendLabel>Entitlement</LegendLabel>
                            <LegendValue>{round1(ent)}</LegendValue>
                          </LegendRow>
                          <LegendRow>
                            <LegendDot $c={COLORS.primary} />
                            <LegendLabel>Approved leave taken</LegendLabel>
                            <LegendValue>{round1(b.leaveTaken)}</LegendValue>
                          </LegendRow>
                          <LegendRow>
                            <LegendDot $c={COLORS.warning} />
                            <LegendLabel>Waiting for approval</LegendLabel>
                            <LegendValue>{round1(b.pendingDays)}</LegendValue>
                          </LegendRow>
                          <LegendRow>
                            <LegendDot $c={COLORS.info} />
                            <LegendLabel>Manual / holiday credit</LegendLabel>
                            <LegendValue>
                              {round1(safeNum(b.manualAdditions) + safeNum(b.holidayCompensations))}
                            </LegendValue>
                          </LegendRow>
                        </RingLegend>
                      </RingRow>
                    );
                  })()}

                  <PanelHead><Calendar size={15} /> This employee&apos;s leave calendar</PanelHead>
                  <LeaveCalendar leaves={userDetail.leaves} />

                  {userDetail.leaves.some((l) => String(l.status || '').toLowerCase() === 'pending') && (
                    <>
                      <PanelHead><Clock size={15} /> Waiting for a decision</PanelHead>
                      {userDetail.leaves
                        .filter((l) => String(l.status || '').toLowerCase() === 'pending')
                        .map((l) => (
                          <HistItem key={l.id}>
                            <HistLine>
                              <TypeChip>
                                <PillDot $c={typeMeta(l.leave_type).color} />
                                {typeMeta(l.leave_type).label}
                              </TypeChip>
                              <PriorityFlag $p={l.priority}>
                                <Flag size={11} />{priorityMeta(l.priority).label}
                              </PriorityFlag>
                            </HistLine>
                            <SubName style={{ marginTop: 4 }}>
                              {fmtRange(l.start_date, l.end_date)} · {round1(l.days)} day(s) ·
                              {' submitted '}{fmtDate(l.created_at)}
                            </SubName>
                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.55rem', flexWrap: 'wrap' }}>
                              <Btn
                                className="ok"
                                onClick={() => decideInPanel(l.id, 'approved', null)}
                                disabled={detailActionId === l.id}
                              >
                                {detailActionId === l.id
                                  ? <Spin><Loader2 size={13} /></Spin>
                                  : <Check size={13} />}{' '}
                                Approve
                              </Btn>
                              <Btn
                                className="danger"
                                onClick={() => rejectInPanel(l.id)}
                                disabled={detailActionId === l.id}
                              >
                                <XCircle size={13} /> Reject
                              </Btn>
                              <Btn onClick={() => setViewRequest(l)}><Eye size={13} /> Details</Btn>
                            </div>
                          </HistItem>
                        ))}
                    </>
                  )}

                  <PanelHead><Plus size={15} /> Add leave days</PanelHead>
                  <AddForm>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Days"
                      value={addDaysForm.days}
                      onChange={(e) => setAddDaysForm((f) => ({ ...f, days: e.target.value }))}
                      aria-label="Number of days to add"
                    />
                    <Input
                      type="text"
                      placeholder="Reason (e.g. 2026 carry-over)"
                      value={addDaysForm.reason}
                      onChange={(e) => setAddDaysForm((f) => ({ ...f, reason: e.target.value }))}
                      aria-label="Reason for adding days"
                    />
                    <Btn className="primary" onClick={submitAddDays} disabled={addSaving}>
                      {addSaving ? <Spin><Loader2 size={14} /></Spin> : <Plus size={14} />} Add
                    </Btn>
                  </AddForm>
                  <SubName style={{ marginTop: 6 }}>
                    Credited days raise this employee&apos;s entitlement straight away and appear under day
                    adjustments below, where they can be undone.
                  </SubName>

                  <PanelHead><Timer size={15} /> Day adjustments ({userDetail.additions.length})</PanelHead>
                  {userDetail.additions.length === 0 ? (
                    <SubName>No manual adjustments for this employee yet.</SubName>
                  ) : (
                    userDetail.additions.map((a) => (
                      <HistItem key={a.id}>
                        <HistLine>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontWeight: 800, color: COLORS.success }}>
                              +{round1(a.days)} days
                            </span>
                            <SubName>
                              {fmtDate(a.created_at)} · {a.reason || 'No reason recorded'}
                            </SubName>
                          </div>
                          <Btn
                            className="danger"
                            onClick={() => removeAddition(a.id)}
                            disabled={removingId === a.id}
                          >
                            {removingId === a.id ? <Spin><Loader2 size={13} /></Spin> : <Trash2 size={13} />} Undo
                          </Btn>
                        </HistLine>
                      </HistItem>
                    ))
                  )}

                  <PanelHead><History size={15} /> Full leave history ({userDetail.leaves.length})</PanelHead>
                  {userDetail.leaves.length === 0 ? (
                    <SubName>This employee has not applied for leave yet.</SubName>
                  ) : (
                    userDetail.leaves.map((l) => {
                      const st = String(l.status || '').toLowerCase();
                      return (
                        <HistItem key={l.id}>
                          <HistLine>
                            <TypeChip>
                              <PillDot $c={typeMeta(l.leave_type).color} />
                              {typeMeta(l.leave_type).label}
                            </TypeChip>
                            <StatusPill $status={st}>
                              <PillDot $c={statusMeta(st).color} />{statusMeta(st).label}
                            </StatusPill>
                          </HistLine>
                          <SubName style={{ marginTop: 4 }}>
                            {fmtRange(l.start_date, l.end_date)} · {round1(l.days)} day(s)
                            {safeNum(l.is_half_day) ? ' · half day' : ''}
                          </SubName>
                          {l.reason && <SubName style={{ marginTop: 4 }}>{l.reason}</SubName>}
                          {st === 'rejected' && l.rejection_reason && (
                            <div style={{ fontSize: '0.76rem', color: COLORS.danger, marginTop: 4 }}>
                              Rejected: {l.rejection_reason}
                            </div>
                          )}
                          <div style={{ marginTop: '0.5rem' }}>
                            <Btn onClick={() => setViewRequest(l)}><Eye size={13} /> Details</Btn>
                          </div>
                        </HistItem>
                      );
                    })
                  )}


                </>
              )}
            </DrawerBody>
          </Drawer>
        </Overlay>
      )}

      {viewRequest && (
        <ModalOverlay onClick={() => setViewRequest(null)}>
          <ModalCard
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Leave request details"
          >
            <ModalHead>
              <Avatar $lg>{initials(viewRequest.name, viewRequest.email)}</Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <ModalTitle>{viewRequest.name || viewRequest.email || 'Leave request'}</ModalTitle>
                <ModalSub>
                  {typeMeta(viewRequest.leave_type).label} leave · ref{' '}
                  {viewRequest.reference_code || `#${viewRequest.id}`}
                </ModalSub>
              </div>
              <StatusPill $status={viewRequest.status}>
                <PillDot $c={statusMeta(viewRequest.status).color} />
                {statusMeta(viewRequest.status).label}
              </StatusPill>
              <CloseBtn onClick={() => setViewRequest(null)} aria-label="Close"><X size={16} /></CloseBtn>
            </ModalHead>

            <ModalBody>
              <FieldGrid>
                <div>
                  <FieldLabel>Employee</FieldLabel>
                  <FieldValue>{viewRequest.name || '—'}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <FieldValue>{viewRequest.email || '—'}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Leave type</FieldLabel>
                  <FieldValue>{typeMeta(viewRequest.leave_type).label}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Priority</FieldLabel>
                  <FieldValue>{priorityMeta(viewRequest.priority).label}</FieldValue>
                </div>
                <div>
                  <FieldLabel>First day</FieldLabel>
                  <FieldValue>{fmtDate(viewRequest.start_date)}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Last day</FieldLabel>
                  <FieldValue>{fmtDate(viewRequest.end_date)}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Working days</FieldLabel>
                  <FieldValue>
                    {round1(viewRequest.days)}{safeNum(viewRequest.is_half_day) ? ' (half day)' : ''}
                  </FieldValue>
                </div>
                <div>
                  <FieldLabel>Submitted</FieldLabel>
                  <FieldValue>{fmtDateTime(viewRequest.created_at)}</FieldValue>
                </div>
                {viewRequest.approved_at && (
                  <div>
                    <FieldLabel>Decided on</FieldLabel>
                    <FieldValue>{fmtDateTime(viewRequest.approved_at)}</FieldValue>
                  </div>
                )}
                <div>
                  <FieldLabel>Time waiting</FieldLabel>
                  <FieldValue>
                    {(() => {
                      const a = daysSince(viewRequest.created_at);
                      if (a === null) return '—';
                      return a <= 0 ? 'Submitted today' : `${humanSpan(a)} awaiting a decision`;
                    })()}
                  </FieldValue>
                </div>
              </FieldGrid>

              <div style={{ marginTop: '1rem' }}>
                <FieldLabel>Reason given by the employee</FieldLabel>
                <ReasonBox>{viewRequest.reason || 'No reason was provided.'}</ReasonBox>
              </div>

              {String(viewRequest.status || '').toLowerCase() === 'rejected' && viewRequest.rejection_reason && (
                <div style={{ marginTop: '0.85rem' }}>
                  <FieldLabel>Rejection reason</FieldLabel>
                  <ReasonBox style={{ color: COLORS.danger }}>{viewRequest.rejection_reason}</ReasonBox>
                </div>
              )}

              <div style={{ marginTop: '0.85rem' }}>
                <FieldLabel>Supporting document</FieldLabel>
                {viewRequest.supporting_document ? (
                  <DocLink
                    href={viewRequest.supporting_document}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText size={14} /> Open the attached document
                  </DocLink>
                ) : (
                  <FieldValue style={{ color: COLORS.textSecondary, fontWeight: 500 }}>
                    No document attached.
                  </FieldValue>
                )}
              </div>

              <ModalActions>
                <Btn
                  onClick={() => {
                    const target = {
                      user_id: viewRequest.user_id,
                      name: viewRequest.name,
                      email: viewRequest.email,
                    };
                    setViewRequest(null);
                    openUser(target);
                  }}
                >
                  <Users size={14} /> Employee dashboard
                </Btn>
                {String(viewRequest.status || '').toLowerCase() === 'pending' ? (
                  <>
                    <Btn
                      className="danger"
                      onClick={() => rejectFromModal(viewRequest.id)}
                      disabled={actingId === viewRequest.id}
                    >
                      <XCircle size={14} /> Reject
                    </Btn>
                    <Btn
                      className="ok"
                      onClick={() => approveFromModal(viewRequest.id)}
                      disabled={actingId === viewRequest.id}
                    >
                      {actingId === viewRequest.id
                        ? <Spin><Loader2 size={14} /></Spin>
                        : <Check size={14} />}{' '}
                      Approve
                    </Btn>
                  </>
                ) : (
                  <Btn onClick={() => setViewRequest(null)}><X size={14} /> Close</Btn>
                )}
              </ModalActions>

            </ModalBody>
          </ModalCard>
        </ModalOverlay>
      )}

    </Page>
  );
};

export default LeaveDashboard;