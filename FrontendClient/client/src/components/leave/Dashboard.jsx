// ═══════════════════════════════════════════════════════════════════════════
// NEXUS OS — Operations & Leave Management (Dashboard)
// Premium light console: personnel sidebar, department capacity, leave
// requests, distribution chart and Kenyan-holiday operations calendar.
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { useSocket } from '../../utils/context/socketContext';
import { api, ENDPOINTS } from '../../api';
import { getUserId, getTenantSlug, getParentTenantSlug } from '../../utils/globalAuth';
import {
  Calendar,
  Clock,
  Users,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  UserPlus,
  Search,
  SlidersHorizontal,
  Zap,
  ChevronLeft,
  ChevronRight,
  Download,
  Wallet,
  Loader2
} from '../../utils/icons/icons';

ChartJS.register(ArcElement, Tooltip);

const DEFAULT_LEAVE_DAYS = 26;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const AVATAR_COLORS = ['#4338CA', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#DB2777'];
const CRITICAL_DEPARTMENTS = ['Mortuary', 'Hearse/Transport', 'Body Preparation', 'Funeral Services'];
const DEPARTMENT_ORDER = [
  ...CRITICAL_DEPARTMENTS,
  'Reception/Front Office',
  'Administration',
  'Finance',
  'Florist',
  'Workshop/Maintenance',
  'Cleaning',
  'Security',
  'Management',
  'General Assignment'
];
const ROLE_TO_DEPARTMENT = {
  mortician: 'Mortuary',
  embalmer: 'Body Preparation',
  mortuary_attendant: 'Mortuary',
  hearse_driver: 'Hearse/Transport',
  driver: 'Hearse/Transport',
  receptionist: 'Reception/Front Office',
  hr: 'Administration',
  accounts: 'Finance',
  accountant: 'Finance',
  florist: 'Florist',
  technician: 'Workshop/Maintenance',
  workshop_manager: 'Workshop/Maintenance',
  cleaner: 'Cleaning',
  security: 'Security',
  admin: 'Management',
  manager: 'Management',
  supervisor: 'Funeral Services',
  funeral_officer: 'Funeral Services'
};

// Kenyan Public Holidays (Month-Day format)
const KENYAN_HOLIDAYS = [
  { date: '01-01', name: "New Year's Day" },
  { date: '05-01', name: 'Labour Day' },
  { date: '06-01', name: 'Madaraka Day' },
  { date: '10-20', name: 'Mashujaa Day' },
  { date: '12-12', name: 'Jamhuri Day' },
  { date: '12-25', name: 'Christmas Day' },
  { date: '12-26', name: 'Boxing Day' }
];

// ─── UTILITIES ───
const pad2 = (n) => String(n).padStart(2, '0');
const toYmd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const TODAY_STR = toYmd(new Date());
const parseDate = (str) => new Date(`${String(str || '').slice(0, 10)}T00:00:00`);
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const round1 = (v) => Math.round(num(v) * 10) / 10;
const getInitials = (name) => (name ? String(name).trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '??');
const avatarColor = (id) => AVATAR_COLORS[Math.abs(num(id)) % AVATAR_COLORS.length];
const fmtDate = (dateStr, full = false) => {
  if (!dateStr) return '—';
  const d = parseDate(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', full
    ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
};
const coversDay = (leave, ymd) => {
  const start = String(leave.start_date || '').slice(0, 10);
  const end = String(leave.end_date || '').slice(0, 10);
  return start <= ymd && ymd <= end;
};
const isPastDay = (ymd) => String(ymd).slice(0, 10) < TODAY_STR;
const holidayOf = (ymd) => KENYAN_HOLIDAYS.find((h) => h.date === ymd.slice(5));

// Type pill "kind" — drives colour classes (Emergency when flagged priority)
const typeKind = (leave) => {
  if (String(leave.priority || '') === 'emergency') return 'Emergency';
  switch (String(leave.leave_type || '').toLowerCase()) {
    case 'annual': return 'Annual';
    case 'sick': return 'Sick';
    case 'maternity':
    case 'paternity': return 'Maternity';
    default: return 'Casual';
  }
};
const typeLabel = (leave) => {
  if (String(leave.priority || '') === 'emergency') return 'Emergency';
  const t = String(leave.leave_type || '').toLowerCase();
  if (t === 'annual') return 'Annual';
  if (t === 'sick') return 'Sick';
  if (t === 'maternity') return 'Maternity';
  if (t === 'paternity') return 'Paternity';
  if (t === 'compassionate') return 'Compassionate';
  if (t === 'study') return 'Study';
  if (t === 'unpaid') return 'Unpaid';
  return t || 'Leave';
};

const deriveDepartment = (emp) => {
  const explicit = emp?.department || emp?.user_department || emp?.department_name;
  if (explicit) return explicit;
  const role = String(emp?.role || emp?.user_role || '').toLowerCase().trim();
  if (ROLE_TO_DEPARTMENT[role]) return ROLE_TO_DEPARTMENT[role];
  if (emp?.user_branch) return emp.user_branch;
  return 'General Assignment';
};

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL THEME (design tokens from the Nexus OS light palette)
// ═══════════════════════════════════════════════════════════════════════════
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  :root {
    --nx-bg: #F8F9FB;
    --nx-surface: #FFFFFF;
    --nx-surface-2: #F1F3F6;
    --nx-surface-hover: #EDF0F4;
    --nx-border: #E5E7EB;
    --nx-border-light: #F1F3F6;
    --nx-border-strong: #D1D5DB;
    --nx-text: #111827;
    --nx-text-dim: #4B5563;
    --nx-text-mute: #9CA3AF;
    --nx-primary: #4338CA;
    --nx-primary-dark: #3730A3;
    --nx-primary-light: #EEF2FF;
    --nx-success: #059669;
    --nx-success-light: #ECFDF5;
    --nx-warning: #D97706;
    --nx-warning-light: #FFFBEB;
    --nx-danger: #DC2626;
    --nx-danger-light: #FEF2F2;
    --nx-purple: #7C3AED;
    --nx-purple-light: #F5F3FF;
    --nx-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
    --nx-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    --nx-shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
    --nx-shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  .ops-leave-root *::-webkit-scrollbar { width: 8px; height: 8px; }
  .ops-leave-root *::-webkit-scrollbar-track { background: transparent; }
  .ops-leave-root *::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
  .ops-leave-root *::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
`;

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════════════════
const Root = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  color: var(--nx-text);
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

// ─── SIDEBAR ───
const Sidebar = styled.aside`
  width: 300px;
  flex-shrink: 0;
  background: var(--nx-surface);
  border: 1px solid var(--nx-border);
  border-radius: 14px;
  box-shadow: var(--nx-shadow-sm);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0.75rem;
  height: calc(100vh - 6rem);
  min-height: 480px;
  overflow: hidden;

  @media (max-width: 1024px) {
    width: 100%;
    position: relative;
    top: 0;
    height: auto;
    max-height: 70vh;
    min-height: 380px;
  }
`;

const SidebarHeader = styled.div`
  padding: 1.25rem;
  border-bottom: 1px solid var(--nx-border);
`;

const Logo = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
  color: var(--nx-text);
`;

const LogoIcon = styled.div`
  width: 30px;
  height: 30px;
  background: var(--nx-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: white;
  font-size: 0.85rem;
  box-shadow: 0 4px 6px -1px rgba(67, 56, 202, 0.2);
`;

const DeptSelect = styled.select`
  margin-bottom: 0.75rem;
  width: 100%;
  padding: 0.65rem 0.85rem;
  background: var(--nx-surface-2);
  border: 1px solid var(--nx-border);
  border-radius: 8px;
  color: var(--nx-text);
  font-size: 0.8rem;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  &:focus { outline: none; border-color: var(--nx-primary); box-shadow: 0 0 0 3px var(--nx-primary-light); }
`;

const SearchBox = styled.div`
  position: relative;
  svg { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--nx-text-mute); }
  input {
    width: 100%;
    padding: 0.65rem 0.85rem 0.65rem 2.25rem;
    background: var(--nx-surface-2);
    border: 1px solid var(--nx-border);
    border-radius: 8px;
    color: var(--nx-text);
    font-size: 0.8rem;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s;
    &:focus { outline: none; border-color: var(--nx-primary); background: var(--nx-surface); box-shadow: 0 0 0 3px var(--nx-primary-light); }
  }
`;

const EmployeeList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
`;

const EmployeeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.25rem;
  border: 1px solid transparent;
  position: relative;
  &:hover { background: var(--nx-surface-2); }
  ${props => props.$active && `
    background: var(--nx-primary-light);
    border-color: rgba(67, 56, 202, 0.1);
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 25%;
      bottom: 25%;
      width: 3px;
      background: var(--nx-primary);
      border-radius: 0 3px 3px 0;
    }
  `}
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const EmpInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const EmpName = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--nx-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmpRole = styled.div`
  font-size: 0.7rem;
  color: var(--nx-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const ListNote = styled.div`
  text-align: center;
  color: var(--nx-text-mute);
  font-size: 0.8rem;
  padding: 2rem 1rem;
`;

// ─── MAIN CONTENT ───
const Main = styled.main`
  flex: 1;
  min-width: 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const H1 = styled.h1`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.25rem;
  color: var(--nx-text);
`;

const Subtitle = styled.p`
  color: var(--nx-text-dim);
  font-size: 0.9rem;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const Btn = styled.button`
  padding: 0.65rem 1.1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  ${props => {
    switch (props.$variant) {
      case 'primary': return `background: var(--nx-primary); color: white; box-shadow: 0 2px 4px rgba(67,56,202,0.2); &:hover { background: var(--nx-primary-dark); transform: translateY(-1px); }`;
      case 'danger': return `background: var(--nx-danger); color: white; box-shadow: 0 2px 4px rgba(220,38,38,0.2); &:hover { background: #B91C1C; transform: translateY(-1px); }`;
      case 'success': return `background: var(--nx-success); color: white; box-shadow: 0 2px 4px rgba(5,150,105,0.2); &:hover { background: #047857; transform: translateY(-1px); }`;
      default: return `background: var(--nx-surface); color: var(--nx-text-dim); border: 1px solid var(--nx-border); box-shadow: var(--nx-shadow-sm); &:hover { background: var(--nx-surface-2); color: var(--nx-text); border-color: var(--nx-border-strong); }`;
    }
  }}
  &:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; }
`;

// ─── OPERATIONAL CAPACITY GRID ───
const OpsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 1280px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const OpsCard = styled.div`
  background: var(--nx-surface);
  border: 1px solid var(--nx-border);
  padding: 1.25rem;
  border-radius: 12px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  box-shadow: var(--nx-shadow-sm);
  cursor: pointer;
  &:hover { box-shadow: var(--nx-shadow); transform: translateY(-2px); }
  ${props => props.$status === 'danger' && `
    border-color: rgba(220, 38, 38, 0.2);
    background: linear-gradient(135deg, var(--nx-danger-light) 0%, var(--nx-surface) 100%);
  `}
  ${props => props.$status === 'warning' && `
    border-color: rgba(217, 119, 6, 0.2);
    background: linear-gradient(135deg, var(--nx-warning-light) 0%, var(--nx-surface) 100%);
  `}
`;

const OpsTitle = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--nx-text-mute);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
`;

const OpsStats = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const OpsVal = styled.span`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${props => (props.$tone === 'danger' ? 'var(--nx-danger)' : props.$tone === 'warning' ? 'var(--nx-warning)' : 'var(--nx-text)')};
`;

const OpsTotal = styled.span`
  font-size: 0.9rem;
  color: var(--nx-text-dim);
  font-family: 'JetBrains Mono', monospace;
`;

const OpsStatus = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  &::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  color: ${props => (props.$tone === 'danger' ? 'var(--nx-danger)' : props.$tone === 'warning' ? 'var(--nx-warning)' : 'var(--nx-success)')};
`;

// ─── EMPLOYEE STATS GRID ───
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1280px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const StatCard = styled.div`
  background: var(--nx-surface);
  border: 1px solid var(--nx-border);
  padding: 1.25rem;
  border-radius: 12px;
  box-shadow: var(--nx-shadow-sm);
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const StatLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--nx-text-dim);
`;

const StatIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$bg || 'var(--nx-primary-light)'};
  color: ${props => props.$fg || 'var(--nx-primary)'};
`;

const StatValue = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
  color: ${props => props.$color || 'var(--nx-text)'};
`;

const StatSub = styled.div`
  font-size: 0.7rem;
  color: var(--nx-text-mute);
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ProgressBar = styled.div`
  height: 6px;
  background: var(--nx-surface-2);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 3px;
  width: 0;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
  background: ${props => props.$color || 'var(--nx-primary)'};
  width: ${props => props.$on ? `${props.$pct}%` : '0'};
`;

// ─── DASHBOARD GRID / CARDS ───
const DashGrid = styled.div`
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1280px) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: var(--nx-surface);
  border: 1px solid var(--nx-border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--nx-shadow-sm);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const CardTitle = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--nx-text);
`;

// ─── TABLE ───
const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--nx-text-mute);
  border-bottom: 1px solid var(--nx-border);
  letter-spacing: 0.08em;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 1rem 0.5rem;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--nx-border-light);
  color: var(--nx-text-dim);
  vertical-align: middle;
`;

const Tr = styled.tr`
  transition: background 0.2s;
  cursor: pointer;
  &:hover td { background: var(--nx-surface-hover); }
  &:last-child td { border-bottom: none; }
`;

const TypePill = styled.span`
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  ${props => {
    switch (props.$kind) {
      case 'Annual': return 'background: var(--nx-success-light); color: var(--nx-success);';
      case 'Sick': return 'background: var(--nx-danger-light); color: var(--nx-danger);';
      case 'Maternity': return 'background: var(--nx-purple-light); color: var(--nx-purple);';
      case 'Emergency': return `background: var(--nx-danger); color: white; animation: ${keyframes`0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); } 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }`} 2s infinite;`;
      default: return 'background: var(--nx-warning-light); color: var(--nx-warning);';
    }
  }}
`;

const StatusPill = styled.span`
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  display: inline-block;
  text-transform: capitalize;
  white-space: nowrap;
  ${props => {
    switch (props.$status) {
      case 'approved': return 'background: var(--nx-success-light); color: var(--nx-success);';
      case 'pending': return 'background: var(--nx-warning-light); color: var(--nx-warning);';
      case 'rejected': return 'background: var(--nx-danger-light); color: var(--nx-danger);';
      default: return 'background: var(--nx-surface-2); color: var(--nx-text-mute);';
    }
  }}
`;

// ─── CHART ───
const ChartContainer = styled.div`
  position: relative;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChartCenterText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
`;

const ChartCenterVal = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--nx-text);
`;

const ChartCenterLabel = styled.div`
  font-size: 0.65rem;
  color: var(--nx-text-mute);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: 'JetBrains Mono', monospace;
`;

const ChartLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--nx-text-dim);
`;

const LegendDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: ${props => props.$color};
`;

// ─── CALENDAR ───
const CalControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CalBtn = styled.button`
  background: var(--nx-surface-2);
  border: 1px solid var(--nx-border);
  color: var(--nx-text-dim);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover { color: var(--nx-primary); border-color: var(--nx-primary); background: var(--nx-primary-light); }
`;

const CalMonth = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 120px;
  text-align: center;
  color: var(--nx-text);
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const CalDayName = styled.div`
  text-align: center;
  font-size: 0.65rem;
  color: var(--nx-text-mute);
  font-weight: 600;
  padding-bottom: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
`;

const CalDay = styled.div`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: var(--nx-text-dim);
  border-radius: 8px;
  position: relative;
  border: 1px solid transparent;
  background: var(--nx-surface-2);
  ${props => props.$clickable && 'cursor: pointer; transition: all 0.2s;'}
  ${props => props.$clickable && ':hover { border-color: var(--nx-border-strong); transform: translateY(-1px); box-shadow: var(--nx-shadow); }'}
  ${props => props.$empty && 'background: transparent; cursor: default; pointer-events: none;'}
  ${props => props.$today && 'border-color: var(--nx-primary); color: var(--nx-primary); background: var(--nx-primary-light); font-weight: 700;'}
  ${props => props.$holiday && 'background: var(--nx-danger-light); color: var(--nx-danger); border: 1px solid rgba(220, 38, 38, 0.1);'}
  ${props => props.$kind === 'Annual' && 'background: var(--nx-success-light); color: var(--nx-success); border: 1px solid rgba(5, 150, 105, 0.1);'}
  ${props => props.$kind === 'Sick' && 'background: var(--nx-danger-light); color: var(--nx-danger); border: 1px solid rgba(220, 38, 38, 0.1);'}
  ${props => props.$kind === 'Maternity' && 'background: var(--nx-purple-light); color: var(--nx-purple); border: 1px solid rgba(124, 58, 237, 0.1);'}
  ${props => props.$kind === 'Emergency' && 'background: var(--nx-danger); color: white; border: 1px solid var(--nx-danger);'}
  ${props => (props.$kind === 'Casual') && 'background: var(--nx-warning-light); color: var(--nx-warning); border: 1px solid rgba(217, 119, 6, 0.1);'}
`;

const CalHolidayTag = styled.div`
  font-size: 0.55rem;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.9;
  font-weight: 600;
  line-height: 1;
`;

// ─── SIDE PANEL & MODALS ───
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.4);
  backdrop-filter: blur(4px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  z-index: ${props => props.$z || 998};
  ${props => props.$open && 'opacity: 1; pointer-events: auto;'}
`;

const SidePanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: ${props => props.$width || 480}px;
  max-width: 100vw;
  height: 100vh;
  background: var(--nx-surface);
  border-left: 1px solid var(--nx-border);
  box-shadow: var(--nx-shadow-lg);
  transform: translateX(100%);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: ${props => props.$z || 999};
  display: flex;
  flex-direction: column;
  ${props => props.$open && 'transform: translateX(0);'}
`;

const PanelHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid var(--nx-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const PanelTitle = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.$color || 'var(--nx-text)'};
`;

const PanelClose = styled.button`
  background: var(--nx-surface-2);
  border: 1px solid var(--nx-border);
  cursor: pointer;
  color: var(--nx-text-dim);
  padding: 0.4rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  &:hover { color: var(--nx-text); border-color: var(--nx-border-strong); background: var(--nx-surface-hover); }
`;

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

const PanelFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid var(--nx-border);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  background: var(--nx-surface);
  flex-wrap: wrap;
`;

const DetailSection = styled.div`
  margin-bottom: 2rem;
`;

const DetailSectionTitle = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--nx-text-mute);
  margin-bottom: 0.75rem;
  letter-spacing: 0.1em;
  font-family: 'JetBrains Mono', monospace;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const DetailItem = styled.div`
  background: var(--nx-surface-2);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--nx-border-light);
`;

const DetailLabel = styled.div`
  font-size: 0.65rem;
  color: var(--nx-text-mute);
  margin-bottom: 0.35rem;
  text-transform: uppercase;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
`;

const DetailValue = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--nx-text);
`;

const ReasonBox = styled.div`
  background: var(--nx-surface-2);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--nx-border-light);
  border-left: 3px solid var(--nx-primary);
  font-size: 0.875rem;
  color: var(--nx-text-dim);
  line-height: 1.5;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ActivityCard = styled.div`
  border: 1px solid var(--nx-border);
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--nx-surface);
  box-shadow: var(--nx-shadow-sm);
  &:hover { border-color: var(--nx-primary); box-shadow: var(--nx-shadow); transform: translateY(-1px); }
`;

const ActivityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
`;

const ActivityName = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--nx-text);
  min-width: 0;
`;

const ActivityMeta = styled.div`
  font-size: 0.7rem;
  color: var(--nx-text-dim);
`;

const DocItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--nx-border);
  border-radius: 8px;
  color: var(--nx-text);
  transition: all 0.2s;
  cursor: pointer;
  background: var(--nx-surface);
  &:hover { border-color: var(--nx-primary); background: var(--nx-primary-light); }
`;

const DocIcon = styled.div`
  width: 36px;
  height: 36px;
  background: var(--nx-danger-light);
  color: var(--nx-danger);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const DocInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const DocName = styled.div`
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DocSize = styled.div`
  font-size: 0.7rem;
  color: var(--nx-text-mute);
  font-family: 'JetBrains Mono', monospace;
`;

const EmptyPanel = styled.div`
  text-align: center;
  color: var(--nx-text-mute);
  padding: 3rem 0;
  font-size: 0.875rem;
  svg { margin-bottom: 1rem; opacity: 0.3; }
`;

const WarningBox = styled.div`
  background: ${props => (props.$danger ? 'var(--nx-danger-light)' : 'var(--nx-warning-light)')};
  border: 1px solid ${props => (props.$danger ? 'rgba(220, 38, 38, 0.2)' : 'rgba(217, 119, 6, 0.2)')};
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: ${props => (props.$danger ? '#991B1B' : '#92400E')};
  svg { flex-shrink: 0; color: ${props => (props.$danger ? 'var(--nx-danger)' : 'var(--nx-warning)')}; }
`;

const WarningText = styled.div`
  font-size: 0.8rem;
  line-height: 1.4;
`;

// ─── FORMS ───
const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--nx-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--nx-surface-2);
  border: 1px solid var(--nx-border);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: var(--nx-text);
  transition: all 0.2s;
  &:focus { outline: none; border-color: var(--nx-primary); background: var(--nx-surface); box-shadow: 0 0 0 3px var(--nx-primary-light); }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--nx-surface-2);
  border: 1px solid var(--nx-border);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: var(--nx-text);
  transition: all 0.2s;
  &:focus { outline: none; border-color: var(--nx-primary); background: var(--nx-surface); box-shadow: 0 0 0 3px var(--nx-primary-light); }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--nx-surface-2);
  border: 1px solid var(--nx-border);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: var(--nx-text);
  min-height: 90px;
  resize: vertical;
  transition: all 0.2s;
  &:focus { outline: none; border-color: var(--nx-primary); background: var(--nx-surface); box-shadow: 0 0 0 3px var(--nx-primary-light); }
`;

// ─── CENTERED MODAL (rejection / registration) ───
const Modal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: var(--nx-surface);
  border-radius: 14px;
  box-shadow: var(--nx-shadow-lg);
  width: 100%;
  max-width: ${props => (props.$wide ? '640px' : '440px')};
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  animation: ${keyframes`from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); }`} 0.25s ease both;
`;

const ModalHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
`;

const ModalTitle = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--nx-text);
`;

// ─── TOASTS & LOADER ───
const ToastContainer = styled.div`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1003;
`;

const Toast = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.1rem;
  border-radius: 10px;
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: var(--nx-shadow-md);
  animation: ${keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`} 0.3s ease both;
  max-width: 360px;
`;

const LoadingBox = styled.div`
  text-align: center;
  padding: 5rem 1rem;
  color: var(--nx-text-dim);
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  justify-content: center;
`;

const Spin = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid var(--nx-border);
  border-top-color: var(--nx-primary);
  border-radius: 50%;
  animation: ${keyframes`to { transform: rotate(360deg); }`} 0.8s linear infinite;
`;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const LeaveDashboard = () => {
  const { socket, connected } = useSocket();

  const [leaves, setLeaves] = useState([]);
  const [usersOnLeave, setUsersOnLeave] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const [panel, setPanel] = useState(null); // { type: 'leave', leaveId } | { type: 'day', date }
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ employeeId: '', kind: 'add', days: 1, reason: '' });
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({ employeeId: '', start: TODAY_STR, end: TODAY_STR, reason: '', submitting: false });
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({ full_name: '', email: '', phone: '', role: 'staff', submitting: false });
  const [rejectState, setRejectState] = useState({ open: false, leaveId: null, reason: '' });
  const [returnsConfirmed, setReturnsConfirmed] = useState({});
  const [barsOn, setBarsOn] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Leaves always live in the PARENT tenant's main database (the apply flow
      // stores rows with the parent slug). HR may be viewing from a branch
      // context, so pin every dashboard read to the parent slug — otherwise the
      // requests employees submit are invisible here even though they exist.
      const parentSlug = getParentTenantSlug() || getTenantSlug() || 'system_shared';
      const tenantHeaders = { headers: { 'x-tenant-slug': parentSlug } };
      const [leavesRes, onLeaveRes, balancesRes] = await Promise.all([
        api.get(ENDPOINTS.LEAVE.ALL, tenantHeaders).catch(() => ({ data: { data: [] } })),
        api.get(ENDPOINTS.LEAVE.USERS_ON_LEAVE, tenantHeaders).catch(() => ({ data: { data: [] } })),
        api.get(ENDPOINTS.LEAVE.BALANCES, tenantHeaders).catch(() => ({ data: { data: [] } })),
      ]);
      const leavesData = leavesRes?.data?.data || leavesRes?.data || [];
      setLeaves(Array.isArray(leavesData) ? leavesData : []);
      const onLeaveData = onLeaveRes?.data?.data || onLeaveRes?.data || [];
      setUsersOnLeave(Array.isArray(onLeaveData) ? onLeaveData : []);
      const balancesData = balancesRes?.data?.data || balancesRes?.data || [];
      setBalances(Array.isArray(balancesData) ? balancesData : []);
    } catch (error) {
      console.error('Error fetching leave data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-select the first employee once balances arrive
  useEffect(() => {
    if (!loading && balances.length > 0) {
      setSelectedId(prev => (prev != null && balances.some(b => b.user_id === prev)
        ? prev
        : balances[0].user_id));
    }
  }, [loading, balances]);

  // Animate stat progress bars on employee change
  useEffect(() => {
    setBarsOn(false);
    const t = setTimeout(() => setBarsOn(true), 120);
    return () => clearTimeout(t);
  }, [selectedId]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return undefined;
    const handleLeaveCreated = (data) => { if (data) showToast(`New leave request from ${data.name || 'staff'}`, 'success'); fetchData(); };
    const handleLeaveUpdated = () => fetchData();
    const handleDaysAdded = () => { showToast('Leave days updated successfully', 'success'); fetchData(); };
    const handleHolidayRecorded = () => { showToast('Holiday compensation recorded', 'success'); fetchData(); };
    socket.on('leave:created', handleLeaveCreated);
    socket.on('leave:updated', handleLeaveUpdated);
    socket.on('leave:days_added', handleDaysAdded);
    socket.on('leave:holiday_recorded', handleHolidayRecorded);
    return () => {
      socket.off('leave:created', handleLeaveCreated);
      socket.off('leave:updated', handleLeaveUpdated);
      socket.off('leave:days_added', handleDaysAdded);
      socket.off('leave:holiday_recorded', handleHolidayRecorded);
    };
  }, [socket, fetchData, showToast]);

  // ─── DERIVED DATA ───
  const deptOfUser = useCallback((userId) => {
    const emp = balances.find(b => b.user_id === userId);
    return emp ? deriveDepartment(emp) : 'General Assignment';
  }, [balances]);

  const departmentList = useMemo(() => {
    const found = new Set(balances.map(emp => deriveDepartment(emp)));
    return DEPARTMENT_ORDER.filter(d => found.has(d));
  }, [balances]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return balances.filter(emp => {
      const dept = deriveDepartment(emp);
      const matchDept = deptFilter === 'all' || dept === deptFilter;
      const matchSearch = !q
        || String(emp.name || '').toLowerCase().includes(q)
        || String(emp.email || '').toLowerCase().includes(q);
      return matchDept && matchSearch;
    });
  }, [balances, deptFilter, search]);

  // Distinct user_ids with an APPROVED leave covering today
  const onLeaveTodayIds = useMemo(() => {
    const ids = new Set();
    (usersOnLeave || []).forEach(l => { if (l?.user_id != null) ids.add(l.user_id); });
    (leaves || []).forEach(l => {
      if (l?.user_id != null && l.status === 'approved' && coversDay(l, TODAY_STR)) ids.add(l.user_id);
    });
    return ids;
  }, [usersOnLeave, leaves]);

  const opsCards = useMemo(() => {
    const byDept = new Map();
    balances.forEach(emp => {
      const dept = deriveDepartment(emp);
      if (!byDept.has(dept)) byDept.set(dept, { total: 0, absent: 0 });
      const bucket = byDept.get(dept);
      bucket.total += 1;
      if (onLeaveTodayIds.has(emp.user_id)) bucket.absent += 1;
    });
    let depts = [...byDept.keys()]
      .sort((a, b) => (DEPARTMENT_ORDER.indexOf(a) - DEPARTMENT_ORDER.indexOf(b)));
    if (depts.length === 1 && depts[0] === 'General Assignment') depts = ['Overall Operations'];
    return depts.slice(0, 4).map(dept => {
      const bucket = byDept.get(dept) || { total: balances.length, absent: 0 };
      const available = bucket.total - bucket.absent;
      let status = '';
      let text = 'Fully Operational';
      if (available <= 0) { status = 'danger'; text = 'CRITICAL: No Staff'; }
      else if (available === 1 && bucket.total > 2) { status = 'warning'; text = 'Warning: Minimal Staff'; }
      return { dept, total: bucket.total, absent: bucket.absent, available, status, text };
    });
  }, [balances, onLeaveTodayIds]);

  const selectedBal = useMemo(
    () => balances.find(b => b.user_id === selectedId) || null,
    [balances, selectedId]
  );

  const selectedStats = useMemo(() => {
    if (!selectedBal) return null;
    return {
      total: round1(num(selectedBal.initial) + num(selectedBal.manualAdditions) + num(selectedBal.holidayCompensations) || DEFAULT_LEAVE_DAYS),
      used: round1(selectedBal.leaveTaken),
      remaining: round1(selectedBal.currentBalance),
      pending: round1(selectedBal.pendingDays)
    };
  }, [selectedBal]);

  const selectedLeaves = useMemo(() => {
    if (selectedId == null) return [];
    return (leaves || [])
      .filter(l => l.user_id === selectedId)
      .sort((a, b) => String(b.start_date).localeCompare(String(a.start_date)));
  }, [leaves, selectedId]);

  const distribution = useMemo(() => {
    const counts = { Annual: 0, Sick: 0, Maternity: 0, Other: 0 };
    (leaves || []).forEach(l => {
      if (l.user_id !== selectedId || l.status !== 'approved') return;
      const kind = typeKind(l);
      if (kind === 'Annual') counts.Annual += num(l.days);
      else if (kind === 'Sick' || kind === 'Emergency') counts.Sick += num(l.days);
      else if (kind === 'Maternity') counts.Maternity += num(l.days);
      else counts.Other += num(l.days);
    });
    return {
      values: [round1(counts.Annual), round1(counts.Sick), round1(counts.Maternity), round1(counts.Other)],
      totalUsed: round1(counts.Annual + counts.Sick + counts.Maternity + counts.Other)
    };
  }, [leaves, selectedId]);

  const chartData = useMemo(() => ({
    labels: ['Annual', 'Sick', 'Maternity', 'Other'],
    datasets: [{
      data: distribution.values,
      backgroundColor: ['#059669', '#DC2626', '#7C3AED', '#D97706'],
      borderWidth: 2,
      borderColor: '#FFFFFF',
      hoverOffset: 4
    }]
  }), [distribution]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true
      }
    }
  }), []);

  // ─── ACTIONS ───
  const selectEmployee = (id) => setSelectedId(id);
  const closePanel = () => setPanel(null);

  const openLeavePanel = (leaveId) => setPanel({ type: 'leave', leaveId });
  const openDayPanel = (dateStr) => setPanel({ type: 'day', date: String(dateStr).slice(0, 10) });

  const changeMonth = (dir) => {
    setCalMonth(prev => {
      let m = prev + dir;
      let y = calYear;
      if (m < 0) { m = 11; y -= 1; }
      else if (m > 11) { m = 0; y += 1; }
      setCalYear(y);
      return m;
    });
  };

  const approveLeave = async (leaveId) => {
    try {
      await api.patch(ENDPOINTS.LEAVE.UPDATE_STATUS(leaveId), {
        status: 'approved',
        approved_by: getUserId() || 1
      });
      showToast('Leave request approved', 'success');
      fetchData();
    } catch (error) {
      console.error('Error approving leave:', error);
      showToast('Failed to approve leave', 'error');
    }
  };

  const submitRejection = async () => {
    if (!rejectState.reason.trim()) { showToast('Please provide a rejection reason', 'warning'); return; }
    try {
      await api.patch(ENDPOINTS.LEAVE.UPDATE_STATUS(rejectState.leaveId), {
        status: 'rejected',
        rejection_reason: rejectState.reason,
        approved_by: getUserId() || 1
      });
      setRejectState({ open: false, leaveId: null, reason: '' });
      showToast('Leave request rejected', 'warning');
      fetchData();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      showToast('Failed to reject leave', 'error');
    }
  };

  const confirmReturn = (leaveId) => {
    setReturnsConfirmed(prev => ({ ...prev, [leaveId]: true }));
    showToast('Return to work recorded', 'success');
  };

  const openAdjustModal = () => {
    setAdjustForm({ employeeId: selectedId != null ? String(selectedId) : '', kind: 'add', days: 1, reason: '' });
    setAdjustOpen(true);
  };

  const submitAdjustment = async () => {
    const { employeeId, kind, days, reason } = adjustForm;
    if (!employeeId) { showToast('Please select an employee', 'error'); return; }
    const dayCount = parseInt(days, 10);
    if (!dayCount || dayCount < 1) { showToast('Enter a valid number of days', 'error'); return; }
    if (!reason.trim()) { showToast('Please provide a reason / note', 'error'); return; }
    try {
      if (kind === 'holiday') {
        await api.post(ENDPOINTS.LEAVE.HOLIDAY_COMPENSATION, {
          user_id: employeeId,
          holiday_date: TODAY_STR,
          holiday_name: reason.trim(),
          note: reason.trim(),
          recorded_by: getUserId() || 1
        });
        showToast('Holiday compensation recorded (+1 day)', 'success');
      } else {
        const prefix = kind === 'carry' ? 'Carry-forward: ' : '';
        await api.post(ENDPOINTS.LEAVE.ADD_DAYS, {
          user_id: employeeId,
          days: dayCount,
          reason: `${prefix}${reason.trim()}`,
          added_by: getUserId() || 1
        });
        showToast(`Balance updated (+${dayCount} days)`, 'success');
      }
      setAdjustOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error applying adjustment:', error);
      showToast(error?.response?.data?.message || 'Failed to apply adjustment', 'error');
    }
  };

  const openEmergencyModal = () => {
    setEmergencyForm({
      employeeId: selectedId != null ? String(selectedId) : '',
      start: TODAY_STR,
      end: TODAY_STR,
      reason: '',
      submitting: false
    });
    setEmergencyOpen(true);
  };

  const submitEmergencyLeave = async () => {
    const { employeeId, start, end, reason } = emergencyForm;
    if (!employeeId) { showToast('Please select an employee', 'error'); return; }
    if (!reason.trim()) { showToast('Please provide a reason for the emergency', 'error'); return; }
    if (String(end) < String(start)) { showToast('End date must be after start date', 'error'); return; }
    setEmergencyForm(prev => ({ ...prev, submitting: true }));
    try {
      const applyRes = await api.post(ENDPOINTS.LEAVE.APPLY, {
        user_id: employeeId,
        leave_type: 'annual',
        priority: 'emergency',
        start_date: start,
        end_date: end,
        reason: `[EMERGENCY] ${reason.trim()}`,
        is_half_day: false
      });
      const created = applyRes?.data?.data;
      if (created?.id) {
        await api.patch(ENDPOINTS.LEAVE.UPDATE_STATUS(created.id), {
          status: 'approved',
          approved_by: getUserId() || 1
        });
      }
      setEmergencyOpen(false);
      showToast('Emergency leave logged (auto-approved, HR validation on return)', 'warning');
      fetchData();
    } catch (error) {
      console.error('Error logging emergency leave:', error);
      showToast(error?.response?.data?.message || 'Failed to log emergency leave', 'error');
    } finally {
      setEmergencyForm(prev => ({ ...prev, submitting: false }));
    }
  };

  const submitRegisterEmployee = async () => {
    const { full_name, email, phone, role } = registerForm;
    if (!full_name.trim() || !email.trim()) { showToast('Please provide employee name and email', 'error'); return; }
    setRegisterForm(prev => ({ ...prev, submitting: true }));
    try {
      const response = await api.post(ENDPOINTS.LEAVE.ADD_EMPLOYEE, {
        full_name: full_name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role: role || 'staff'
      });
      if (response?.data?.status === 'success') {
        showToast(response.data.message || 'Employee registered successfully', 'success');
        setRegisterOpen(false);
        setRegisterForm({ full_name: '', email: '', phone: '', role: 'staff', submitting: false });
        fetchData();
      } else {
        showToast(response?.data?.message || 'Failed to register employee', 'error');
        setRegisterForm(prev => ({ ...prev, submitting: false }));
      }
    } catch (error) {
      console.error('Error registering employee:', error);
      showToast(error?.response?.data?.message || 'Failed to register employee', 'error');
      setRegisterForm(prev => ({ ...prev, submitting: false }));
    }
  };

  // ─── CALENDAR CELLS ───
  const calendarCells = useMemo(() => {
    const cells = [];
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    for (let i = 0; i < firstDay; i += 1) cells.push(<CalDay key={`e${i}`} className="empty" $empty />);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = `${calYear}-${pad2(calMonth + 1)}-${pad2(day)}`;
      const holiday = holidayOf(dateStr);
      let kind = '';
      let mine = false;
      (leaves || []).forEach(l => {
        if (l.user_id !== selectedId) return;
        if (l.status === 'rejected' || l.status === 'cancelled') return;
        if (coversDay(l, dateStr)) { mine = true; kind = typeKind(l); }
      });
      let others = 0;
      (leaves || []).forEach(l => {
        if (l.user_id === selectedId || l.status !== 'approved') return;
        if (coversDay(l, dateStr)) others += 1;
      });
      const clickable = Boolean(holiday || mine || others > 0);
      cells.push(
        <CalDay
          key={dateStr}
          $today={dateStr === TODAY_STR}
          $holiday={Boolean(holiday)}
          $kind={holiday ? '' : kind}
          $clickable={clickable}
          onClick={clickable ? () => openDayPanel(dateStr) : undefined}
        >
          <span>{day}</span>
          {holiday && <CalHolidayTag>{holiday.name.split(' ')[0]}</CalHolidayTag>}
        </CalDay>
      );
    }
    return cells;
  }, [calYear, calMonth, leaves, selectedId]);

  if (loading) {
    return (
      <Root className="ops-leave-root">
        <GlobalStyle />
        <LoadingBox>
          <Spin />
          <span>Loading leave data...</span>
        </LoadingBox>
      </Root>
    );
  }

  return (
    <Root className="ops-leave-root">
      <GlobalStyle />

      {/* ─── SIDEBAR ─── */}
      <Sidebar>
        <SidebarHeader>
          <Logo>
            <LogoIcon>N</LogoIcon>
            NEXUS OS
          </Logo>
          <DeptSelect value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="all">All Departments</option>
            {departmentList.map(d => <option key={d} value={d}>{d}</option>)}
          </DeptSelect>
          <SearchBox>
            <Search size={16} />
            <input
              type="text"
              value={search}
              placeholder="Search personnel..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchBox>
        </SidebarHeader>
        <EmployeeList>
          {filteredEmployees.length === 0 ? (
            <ListNote>No personnel match this view</ListNote>
          ) : filteredEmployees.map(emp => {
            const remaining = round1(emp.currentBalance);
            return (
              <EmployeeItem
                key={emp.user_id}
                $active={emp.user_id === selectedId}
                onClick={() => selectEmployee(emp.user_id)}
              >
                <Avatar style={{ background: avatarColor(emp.user_id) }}>{getInitials(emp.name)}</Avatar>
                <EmpInfo>
                  <EmpName>{emp.name || 'Unknown'}</EmpName>
                  <EmpRole>{emp.email || '—'}</EmpRole>
                </EmpInfo>
                <StatusDot style={{ background: remaining > 0 ? 'var(--nx-success)' : 'var(--nx-danger)' }} />
              </EmployeeItem>
            );
          })}
        </EmployeeList>
      </Sidebar>

      {/* ─── MAIN ─── */}
      <Main>
        <Header>
          <div>
            <H1>{selectedBal ? `${selectedBal.name || 'Employee'} — Leave Profile` : 'Operations Dashboard'}</H1>
            <Subtitle>
              {selectedBal
                ? `${deptOfUser(selectedId)} • ${selectedBal.email || ''}`
                : 'Monitor capacity and manage personnel leave'}
            </Subtitle>
          </div>
          <HeaderActions>
            {!connected && (
              <WarningBox $danger style={{ margin: 0, padding: '0.6rem 0.9rem' }}>
                <WarningText>Real-time updates disconnected</WarningText>
              </WarningBox>
            )}
            <Btn $variant="secondary" onClick={() => setRegisterOpen(true)}>
              <UserPlus size={14} />
              Register Employee
            </Btn>
            <Btn $variant="secondary" onClick={openAdjustModal}>
              <SlidersHorizontal size={14} />
              Adjust Balances
            </Btn>
            <Btn $variant="danger" onClick={openEmergencyModal}>
              <Zap size={14} />
              Emergency Leave
            </Btn>
          </HeaderActions>
        </Header>

        {!selectedBal ? (
          <LoadingBox>
            <Users size={40} style={{ opacity: 0.3 }} />
            <span>No personnel found. Register an employee to get started.</span>
          </LoadingBox>
        ) : (
          <>
            {/* Operational Capacity */}
            <OpsGrid>
              {opsCards.map(card => (
                <OpsCard
                  key={card.dept}
                  $status={card.status}
                  onClick={() => setDeptFilter(departmentList.includes(card.dept) ? card.dept : 'all')}
                >
                  <OpsTitle>{card.dept}</OpsTitle>
                  <OpsStats>
                    <OpsVal $tone={card.status || 'ok'}>{card.available}</OpsVal>
                    <OpsTotal>/ {card.total} Available</OpsTotal>
                  </OpsStats>
                  <OpsStatus $tone={card.status || 'ok'}>
                    {card.text}{card.absent > 0 ? ` (${card.absent} on leave)` : ''}
                  </OpsStatus>
                </OpsCard>
              ))}
            </OpsGrid>

            {/* Employee Leave Stats */}
            <StatsGrid>
              <StatCard>
                <StatHeader>
                  <StatLabel>Total Allocation</StatLabel>
                  <StatIcon $bg="var(--nx-primary-light)" $fg="var(--nx-primary)"><Calendar size={16} /></StatIcon>
                </StatHeader>
                <StatValue $color="var(--nx-primary)">{selectedStats?.total ?? 0}</StatValue>
                <StatSub>Days / Year</StatSub>
                <ProgressBar>
                  <ProgressFill $on={barsOn} $pct={100} $color="var(--nx-primary)" />
                </ProgressBar>
              </StatCard>
              <StatCard>
                <StatHeader>
                  <StatLabel>Used Leave</StatLabel>
                  <StatIcon $bg="var(--nx-danger-light)" $fg="var(--nx-danger)"><CheckCircle size={16} /></StatIcon>
                </StatHeader>
                <StatValue $color="var(--nx-danger)">{selectedStats?.used ?? 0}</StatValue>
                <StatSub>Days Taken</StatSub>
                <ProgressBar>
                  <ProgressFill
                    $on={barsOn}
                    $pct={Math.min(((selectedStats?.used || 0) / (selectedStats?.total || 1)) * 100, 100)}
                    $color="var(--nx-danger)"
                  />
                </ProgressBar>
              </StatCard>
              <StatCard>
                <StatHeader>
                  <StatLabel>Remaining</StatLabel>
                  <StatIcon $bg="var(--nx-success-light)" $fg="var(--nx-success)"><Wallet size={16} /></StatIcon>
                </StatHeader>
                <StatValue $color="var(--nx-success)">{selectedStats?.remaining ?? 0}</StatValue>
                <StatSub>Days Available</StatSub>
                <ProgressBar>
                  <ProgressFill
                    $on={barsOn}
                    $pct={Math.min(((selectedStats?.remaining || 0) / (selectedStats?.total || 1)) * 100, 100)}
                    $color="var(--nx-success)"
                  />
                </ProgressBar>
              </StatCard>
              <StatCard>
                <StatHeader>
                  <StatLabel>Pending Requests</StatLabel>
                  <StatIcon $bg="var(--nx-warning-light)" $fg="var(--nx-warning)"><Clock size={16} /></StatIcon>
                </StatHeader>
                <StatValue $color="var(--nx-warning)">{selectedStats?.pending ?? 0}</StatValue>
                <StatSub>Awaiting Approval</StatSub>
                <ProgressBar>
                  <ProgressFill
                    $on={barsOn}
                    $pct={Math.min(((selectedStats?.pending || 0) / (selectedStats?.total || 1)) * 100, 100)}
                    $color="var(--nx-warning)"
                  />
                </ProgressBar>
              </StatCard>
            </StatsGrid>

            {/* Requests + Distribution */}
            <DashGrid>
              <Card>
                <CardHeader>
                  <CardTitle>Leave Requests (Click row for details)</CardTitle>
                </CardHeader>
                <TableContainer>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Employee</Th>
                        <Th>Type</Th>
                        <Th>Dates</Th>
                        <Th>Days</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLeaves.length === 0 ? (
                        <tr>
                          <Td colSpan={5} style={{ textAlign: 'center', color: 'var(--nx-text-mute)', cursor: 'default' }}>
                            No leave requests found
                          </Td>
                        </tr>
                      ) : selectedLeaves.map(leave => (
                        <Tr key={leave.id} onClick={() => openLeavePanel(leave.id)}>
                          <Td style={{ fontWeight: 600, color: 'var(--nx-text)' }}>
                            {leave.name || selectedBal?.name || 'Unknown'}
                          </Td>
                          <Td>
                            <TypePill $kind={typeKind(leave)}>{typeLabel(leave)}</TypePill>
                          </Td>
                          <Td style={{ fontSize: '0.8rem' }}>
                            {fmtDate(leave.start_date)}
                          </Td>
                          <Td style={{ fontWeight: 500, color: 'var(--nx-text)' }}>{round1(leave.days)}d</Td>
                          <Td><StatusPill $status={leave.status}>{leave.status}</StatusPill></Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableContainer>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Leave Distribution</CardTitle>
                </CardHeader>
                <ChartContainer>
                  <Doughnut data={chartData} options={chartOptions} />
                  <ChartCenterText>
                    <ChartCenterVal>{distribution.totalUsed}</ChartCenterVal>
                    <ChartCenterLabel>Total Used</ChartCenterLabel>
                  </ChartCenterText>
                </ChartContainer>
                <ChartLegend>
                  <LegendItem><LegendDot $color="#059669" /> Annual</LegendItem>
                  <LegendItem><LegendDot $color="#DC2626" /> Sick</LegendItem>
                  <LegendItem><LegendDot $color="#D97706" /> Other</LegendItem>
                  <LegendItem><LegendDot $color="#7C3AED" /> Maternity</LegendItem>
                </ChartLegend>
              </Card>
            </DashGrid>

            {/* Operations Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Operations Calendar (Kenyan Public Holidays Highlighted)</CardTitle>
                <CalControls>
                  <CalBtn onClick={() => changeMonth(-1)}><ChevronLeft size={14} /></CalBtn>
                  <CalMonth>{MONTH_NAMES[calMonth]} {calYear}</CalMonth>
                  <CalBtn onClick={() => changeMonth(1)}><ChevronRight size={14} /></CalBtn>
                </CalControls>
              </CardHeader>
              <CalGrid>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                  <CalDayName key={d}>{d}</CalDayName>
                ))}
                {calendarCells}
              </CalGrid>
            </Card>
          </>
        )}
      </Main>

      {/* ─── SIDE PANEL ─── */}
      <Overlay $z={998} $open={Boolean(panel)} onClick={closePanel} />

      {/* Leave details */}
      <SidePanel $open={panel?.type === 'leave'}>
        {(() => {
          if (panel?.type !== 'leave') return null;
          const leave = (leaves || []).find(l => l.id === panel.leaveId);
          if (!leave) return null;
          const docName = leave.supporting_document ? String(leave.supporting_document).split(/[\\/]/).pop() : '';
          return (
            <>
              <PanelHeader>
                <PanelTitle>
                  <FileText size={18} style={{ color: 'var(--nx-primary)' }} />
                  {`${typeLabel(leave)} Leave Details`}
                </PanelTitle>
                <PanelClose onClick={closePanel}><X size={16} /></PanelClose>
              </PanelHeader>
              <PanelBody>
                <DetailSection>
                  <DetailSectionTitle>Request Overview</DetailSectionTitle>
                  <DetailGrid>
                    <DetailItem>
                      <DetailLabel>Status</DetailLabel>
                      <DetailValue><StatusPill $status={leave.status}>{leave.status}</StatusPill></DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Duration</DetailLabel>
                      <DetailValue>{round1(leave.days)} Days</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Date Applied</DetailLabel>
                      <DetailValue style={{ fontSize: '0.8rem' }}>{fmtDate(leave.created_at, true)}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Approver</DetailLabel>
                      <DetailValue style={{ fontSize: '0.8rem' }}>
                        {leave.status === 'approved' ? (leave.approved_by ? `Admin (ID ${leave.approved_by})` : 'HR Admin') : 'N/A'}
                      </DetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailSection>
                <DetailSection>
                  <DetailSectionTitle>Leave Dates</DetailSectionTitle>
                  <DetailGrid>
                    <DetailItem>
                      <DetailLabel>Start Date</DetailLabel>
                      <DetailValue style={{ fontSize: '0.8rem' }}>{fmtDate(leave.start_date, true)}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>End Date</DetailLabel>
                      <DetailValue style={{ fontSize: '0.8rem' }}>{fmtDate(leave.end_date, true)}</DetailValue>
                    </DetailItem>
                  </DetailGrid>
                </DetailSection>
                <DetailSection>
                  <DetailSectionTitle>Reason / Notes</DetailSectionTitle>
                  <ReasonBox>{leave.reason || 'No reason provided.'}</ReasonBox>
                  {leave.rejection_reason && (
                    <ReasonBox style={{ borderLeftColor: 'var(--nx-danger)', marginTop: '0.5rem' }}>
                      <strong>Rejection Reason:</strong> {leave.rejection_reason}
                    </ReasonBox>
                  )}
                </DetailSection>
                <DetailSection>
                  <DetailSectionTitle>Supporting Documents</DetailSectionTitle>
                  {docName ? (
                    <DocItem
                      onClick={() => {
                        const url = String(leave.supporting_document);
                        if (/^https?:\/\//.test(url)) window.open(url, '_blank', 'noopener');
                      }}
                    >
                      <DocIcon><FileText size={16} /></DocIcon>
                      <DocInfo>
                        <DocName>{docName}</DocName>
                        <DocSize>Supporting Document</DocSize>
                      </DocInfo>
                      <Download size={16} style={{ color: 'var(--nx-text-mute)' }} />
                    </DocItem>
                  ) : (
                    <div style={{ color: 'var(--nx-text-mute)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                      No documents attached.
                    </div>
                  )}
                </DetailSection>
              </PanelBody>
              <PanelFooter>
                {leave.status === 'pending' ? (
                  <>
                    <Btn $variant="danger" onClick={() => setRejectState({ open: true, leaveId: leave.id, reason: '' })}>
                      Reject Request
                    </Btn>
                    <Btn $variant="success" onClick={() => approveLeave(leave.id)}>
                      Approve Leave
                    </Btn>
                  </>
                ) : leave.status === 'approved' && isPastDay(leave.end_date) && !returnsConfirmed[leave.id] ? (
                  <>
                    <Btn $variant="secondary" onClick={closePanel}>Close</Btn>
                    <Btn $variant="success" onClick={() => confirmReturn(leave.id)}>
                      Confirm Return to Work
                    </Btn>
                  </>
                ) : (
                  <Btn $variant="secondary" onClick={closePanel}>Close</Btn>
                )}
              </PanelFooter>
            </>
          );
        })()}
      </SidePanel>

      {/* Operations day view */}
      <SidePanel $open={panel?.type === 'day'}>
        {(() => {
          if (panel?.type !== 'day') return null;
          const dateStr = panel.date;
          const holiday = holidayOf(dateStr);
        const dayLeaves = (leaves || []).filter(l => {
          if (l.status === 'rejected' || l.status === 'cancelled') return false;
          return coversDay(l, dateStr);
        });
        const deptCounts = {};
        dayLeaves.forEach(l => {
          if (l.status !== 'approved') return;
          const dept = deptOfUser(l.user_id);
          deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        const conflicts = Object.keys(deptCounts).filter(dept => {
          const totalInDept = balances.filter(b => deriveDepartment(b) === dept).length;
          return totalInDept > 1 && deptCounts[dept] >= totalInDept / 2;
        });
        return (
          <>
            <PanelHeader>
                <PanelTitle>
                  <Calendar size={18} style={{ color: 'var(--nx-primary)' }} />
                  {`Operations on ${fmtDate(dateStr, true)}`}
                </PanelTitle>
                <PanelClose onClick={closePanel}><X size={16} /></PanelClose>
              </PanelHeader>
              <PanelBody>
                {holiday && (
                  <WarningBox $danger>
                    <AlertTriangle size={20} />
                    <WarningText><strong>Public Holiday:</strong> {holiday.name}. Offices are closed.</WarningText>
                  </WarningBox>
                )}
                {conflicts.length > 0 && (
                  <WarningBox>
                    <AlertTriangle size={20} />
                    <WarningText>
                      <strong>Operational Conflict Warning:</strong> Over 50% of staff in{' '}
                      <strong>{conflicts.join(', ')}</strong> are on leave this day. Approvals for this
                      department should be halted.
                    </WarningText>
                  </WarningBox>
                )}
                {dayLeaves.length === 0 ? (
                  <EmptyPanel>
                    <CheckCircle size={40} />
                    <br />
                    No leave activities on this day.
                  </EmptyPanel>
                ) : (
                  <>
                    <DetailSectionTitle>Active Leaves ({dayLeaves.length})</DetailSectionTitle>
                    <ActivityList>
                      {dayLeaves.map(item => {
                        const emp = balances.find(b => b.user_id === item.user_id);
                        return (
                          <ActivityCard
                            key={item.id}
                            onClick={() => { selectEmployee(item.user_id); openLeavePanel(item.id); }}
                          >
                            <ActivityHeader>
                              <ActivityName>
                                <Avatar style={{ width: 28, height: 28, fontSize: '0.7rem', background: avatarColor(item.user_id) }}>
                                  {getInitials(item.name || emp?.name)}
                                </Avatar>
                                {item.name || emp?.name || 'Unknown'}
                              </ActivityName>
                              <TypePill $kind={typeKind(item)}>{typeLabel(item)}</TypePill>
                            </ActivityHeader>
                            <ActivityMeta>
                              {deptOfUser(item.user_id)} • {item.status} • Ends on {fmtDate(item.end_date)}
                            </ActivityMeta>
                          </ActivityCard>
                        );
                      })}
                    </ActivityList>
                  </>
                )}
              </PanelBody>
              <PanelFooter>
                <Btn $variant="secondary" onClick={closePanel}>Close</Btn>
              </PanelFooter>
            </>
          );
        })()}
      </SidePanel>

      {/* ─── ADJUST BALANCE MODAL ─── */}
      <Overlay $z={1000} $open={adjustOpen} onClick={() => setAdjustOpen(false)} />
      <SidePanel $z={1001} $width={450} $open={adjustOpen}>
        <PanelHeader>
          <PanelTitle><SlidersHorizontal size={18} /> Adjust Leave Balance</PanelTitle>
          <PanelClose onClick={() => setAdjustOpen(false)}><X size={16} /></PanelClose>
        </PanelHeader>
        <PanelBody>
          <FormGroup>
            <FormLabel>Select Employee</FormLabel>
            <FormSelect
              value={adjustForm.employeeId}
              onChange={(e) => setAdjustForm({ ...adjustForm, employeeId: e.target.value })}
            >
              <option value="">Select employee...</option>
              {balances.map(emp => (
                <option key={emp.user_id} value={emp.user_id}>
                  {emp.name || 'Unknown'} ({deriveDepartment(emp)}) — Balance: {round1(emp.currentBalance)}d
                </option>
              ))}
            </FormSelect>
          </FormGroup>
          <FormGroup>
            <FormLabel>Adjustment Type</FormLabel>
            <FormSelect
              value={adjustForm.kind}
              onChange={(e) => setAdjustForm({ ...adjustForm, kind: e.target.value })}
            >
              <option value="add">Add Manual Days</option>
              <option value="carry">Carry-Forward from Previous Year</option>
              <option value="holiday">Holiday Compensation (Worked Public Holiday, +1)</option>
            </FormSelect>
          </FormGroup>
          {adjustForm.kind !== 'holiday' && (
            <FormGroup>
              <FormLabel>Number of Days</FormLabel>
              <FormInput
                type="number"
                min="1"
                value={adjustForm.days}
                onChange={(e) => setAdjustForm({ ...adjustForm, days: e.target.value })}
              />
            </FormGroup>
          )}
          <FormGroup>
            <FormLabel>{adjustForm.kind === 'holiday' ? 'Holiday Name / Note' : 'Reason / Note'}</FormLabel>
            <FormInput
              type="text"
              value={adjustForm.reason}
              placeholder={adjustForm.kind === 'carry' ? 'e.g. Carried over 5 days from last year' : 'e.g. Approved by HR'}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            />
          </FormGroup>
        </PanelBody>
        <PanelFooter>
          <Btn $variant="secondary" onClick={() => setAdjustOpen(false)}>Cancel</Btn>
          <Btn $variant="primary" onClick={submitAdjustment}>Apply Adjustment</Btn>
        </PanelFooter>
      </SidePanel>

      {/* ─── EMERGENCY LEAVE MODAL ─── */}
      <Overlay $z={1000} $open={emergencyOpen} onClick={() => setEmergencyOpen(false)} />
      <SidePanel $z={1001} $width={450} $open={emergencyOpen}>
        <PanelHeader>
          <PanelTitle $color="var(--nx-danger)"><Zap size={18} /> Log Emergency Leave</PanelTitle>
          <PanelClose onClick={() => setEmergencyOpen(false)}><X size={16} /></PanelClose>
        </PanelHeader>
        <PanelBody>
          <WarningBox $danger>
            <AlertTriangle size={20} />
            <WarningText>
              Emergency leaves bypass normal approval workflows but require HR validation upon return.
            </WarningText>
          </WarningBox>
          <FormGroup>
            <FormLabel>Select Employee</FormLabel>
            <FormSelect
              value={emergencyForm.employeeId}
              onChange={(e) => setEmergencyForm({ ...emergencyForm, employeeId: e.target.value })}
            >
              <option value="">Select employee...</option>
              {balances.map(emp => (
                <option key={emp.user_id} value={emp.user_id}>{emp.name || 'Unknown'} ({deriveDepartment(emp)})</option>
              ))}
            </FormSelect>
          </FormGroup>
          <FormGroup>
            <FormLabel>Start Date</FormLabel>
            <FormInput
              type="date"
              value={emergencyForm.start}
              onChange={(e) => setEmergencyForm({ ...emergencyForm, start: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>End Date</FormLabel>
            <FormInput
              type="date"
              value={emergencyForm.end}
              min={emergencyForm.start}
              onChange={(e) => setEmergencyForm({ ...emergencyForm, end: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>Emergency Reason</FormLabel>
            <FormInput
              type="text"
              value={emergencyForm.reason}
              placeholder="Brief description of emergency"
              onChange={(e) => setEmergencyForm({ ...emergencyForm, reason: e.target.value })}
            />
          </FormGroup>
        </PanelBody>
        <PanelFooter>
          <Btn $variant="secondary" onClick={() => setEmergencyOpen(false)}>Cancel</Btn>
          <Btn $variant="danger" onClick={submitEmergencyLeave} disabled={emergencyForm.submitting}>
            {emergencyForm.submitting ? 'Logging...' : 'Log Emergency'}
          </Btn>
        </PanelFooter>
      </SidePanel>

      {/* ─── REJECTION MODAL ─── */}
      {rejectState.open && (
        <Modal onClick={(e) => { if (e.target === e.currentTarget) setRejectState({ open: false, leaveId: null, reason: '' }); }}>
          <ModalContent>
            <ModalHeaderRow>
              <ModalTitle><XCircle size={20} style={{ color: 'var(--nx-danger)' }} /> Reject Leave Request</ModalTitle>
              <PanelClose onClick={() => setRejectState({ open: false, leaveId: null, reason: '' })}><X size={16} /></PanelClose>
            </ModalHeaderRow>
            <p style={{ marginBottom: '1rem', color: 'var(--nx-text-dim)', fontSize: '0.875rem' }}>
              Please provide a reason for rejecting this leave request:
            </p>
            <FormTextarea
              value={rejectState.reason}
              placeholder="Enter rejection reason..."
              autoFocus
              onChange={(e) => setRejectState({ ...rejectState, reason: e.target.value })}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <Btn $variant="secondary" onClick={() => setRejectState({ open: false, leaveId: null, reason: '' })}>Cancel</Btn>
              <Btn $variant="danger" onClick={submitRejection} disabled={!rejectState.reason.trim()}>Reject Leave</Btn>
            </div>
          </ModalContent>
        </Modal>
      )}

      {/* ─── REGISTER EMPLOYEE MODAL ─── */}
      {registerOpen && (
        <Modal onClick={(e) => { if (e.target === e.currentTarget) setRegisterOpen(false); }}>
          <ModalContent>
            <ModalHeaderRow>
              <ModalTitle><UserPlus size={20} style={{ color: 'var(--nx-primary)' }} /> Register Employee</ModalTitle>
              <PanelClose onClick={() => setRegisterOpen(false)}><X size={16} /></PanelClose>
            </ModalHeaderRow>
            <p style={{ marginBottom: '1.25rem', color: 'var(--nx-text-dim)', fontSize: '0.875rem' }}>
              Register a new employee to the leaves database. Each employee automatically receives{' '}
              <strong>{DEFAULT_LEAVE_DAYS} days</strong> of annual leave per year.
            </p>
            <FormGroup>
              <FormLabel>Full Name</FormLabel>
              <FormInput
                type="text"
                value={registerForm.full_name}
                placeholder="e.g. Jane Wanjiru"
                onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Email</FormLabel>
              <FormInput
                type="email"
                value={registerForm.email}
                placeholder="e.g. jane@restpoint.co.ke"
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Phone (Optional)</FormLabel>
              <FormInput
                type="text"
                value={registerForm.phone}
                placeholder="e.g. +254 700 000 000"
                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Role</FormLabel>
              <FormSelect
                value={registerForm.role}
                onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
              >
                <option value="staff">Staff</option>
                <option value="mortician">Mortician</option>
                <option value="embalmer">Embalmer</option>
                <option value="hearse_driver">Hearse Driver</option>
                <option value="receptionist">Receptionist</option>
                <option value="hr">HR</option>
                <option value="accounts">Accounts</option>
                <option value="florist">Florist</option>
                <option value="technician">Technician</option>
                <option value="cleaner">Cleaner</option>
                <option value="security">Security</option>
                <option value="admin">Admin</option>
              </FormSelect>
            </FormGroup>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <Btn $variant="secondary" onClick={() => setRegisterOpen(false)}>Cancel</Btn>
              <Btn
                $variant="primary"
                onClick={submitRegisterEmployee}
                disabled={registerForm.submitting || !registerForm.full_name.trim() || !registerForm.email.trim()}
              >
                <Loader2 size={14} style={{ display: registerForm.submitting ? 'inline-block' : 'none' }} />
                {registerForm.submitting ? 'Registering...' : 'Register Employee'}
              </Btn>
            </div>
          </ModalContent>
        </Modal>
      )}

      {/* ─── TOASTS ─── */}
      <ToastContainer>
        {toasts.map(toast => (
          <Toast key={toast.id} style={{ background: toast.type === 'success' ? 'var(--nx-success)' : toast.type === 'error' ? 'var(--nx-danger)' : 'var(--nx-warning)' }}>
            {toast.type === 'success' && <CheckCircle size={16} />}
            {toast.type === 'error' && <XCircle size={16} />}
            {toast.type === 'warning' && <AlertCircle size={16} />}
            {toast.message}
          </Toast>
        ))}
      </ToastContainer>
    </Root>
  );
};

export default LeaveDashboard;



















