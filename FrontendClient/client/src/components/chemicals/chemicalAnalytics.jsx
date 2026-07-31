import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  FlaskConical, Clock, Users, TrendingUp, AlertTriangle,
  ArrowUp, ArrowDown, RefreshCw, Download, Beaker,
  Activity, Zap, RotateCw, Package, Plus, Save, X, Loader2
} from '../../utils/icons/icons';
import api from '../../api/axios';
import { toast } from 'react-toastify';

// ═══════════════════════════════════════════════════════════════════════════
//  TOKENS
// ═══════════════════════════════════════════════════════════════════════════

const T = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceHover: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0F172A',
  textBody: '#334155',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textFaint: '#CBD5E1',
  primary: '#2563EB',
  primaryBg: '#EFF6FF',
  primaryLight: '#93C5FD',
  success: '#059669',
  successBg: '#ECFDF5',
  successLight: '#6EE7B7',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  warningLight: '#FCD34D',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  dangerLight: '#FCA5A5',
  purple: '#7C3AED',
  purpleBg: '#F5F3FF',
  purpleLight: '#C4B5FD',
  cyan: '#0891B2',
  cyanBg: '#ECFEFF',
  cyanLight: '#67E8F9',
  orange: '#EA580C',
  orangeBg: '#FFF7ED',
  orangeLight: '#FDBA74',
  pink: '#DB2777',
  pinkBg: '#FDF2F8',
  pinkLight: '#F9A8D4',
  teal: '#0D9488',
  tealBg: '#F0FDFA',
  tealLight: '#5EEAD4',
  chartColors: ['#2563EB', '#7C3AED', '#0891B2', '#059669', '#D97706', '#DC2626', '#DB2777', '#EA580C'],
};

// ═══════════════════════════════════════════════════════════════════════════
//  ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const countUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
`;

const progressFill = keyframes`
  from { width: 0%; }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

// ═══════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
};

const getDaysLabel = (days) => {
  if (days <= 3) return { text: `${days}d gap`, type: 'success' };
  if (days <= 7) return { text: `${days}d gap`, type: 'info' };
  if (days <= 14) return { text: `${days}d gap`, type: 'warn' };
  return { text: `${days}d gap`, type: 'danger' };
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

// ═══════════════════════════════════════════════════════════════════════════
//  STYLED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const Page = styled.div`
  min-height: 100vh;
  background: ${T.bg};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: ${T.text};
  padding: 1.25rem 1.75rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const TitleGroup = styled.div``;

const PageTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${T.text};
`;

const PageDesc = styled.p`
  font-size: 0.8125rem;
  color: ${T.textSecondary};
  margin: 0.25rem 0 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid ${T.border};
  background: ${T.surface};
  color: ${T.textBody};

  &:hover { background: ${T.surfaceHover}; border-color: ${T.textMuted}; }

  ${props => props.$variant === 'primary' && css`
    background: ${T.primary}; color: white; border-color: ${T.primary};
    &:hover { background: #1D4ED8; box-shadow: 0 1px 3px rgba(37,99,235,0.3); }
  `}
`;

// ─── Stat Cards ────────────────────────────────────────────────────────────

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.875rem;
  margin-bottom: 1.25rem;
  animation: ${fadeIn} 0.25s ease-out;

  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const StatCard = styled.div`
  background: ${T.surface};
  border: 1px solid ${T.border};
  border-radius: 10px;
  padding: 1rem 1.125rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.15s ease;
  animation: ${fadeIn} 0.3s ease-out;

  &:hover {
    border-color: ${T.textMuted};
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    transform: translateY(-1px);
  }
`;

const StatInfo = styled.div``;

const StatLabel = styled.div`
  font-size: 0.6875rem;
  font-weight: 500;
  color: ${T.textSecondary};
  margin-bottom: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${T.text};
  line-height: 1;
  animation: ${countUp} 0.4s ease-out;
`;

const StatChange = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.1875rem;
  font-size: 0.6875rem;
  font-weight: 600;
  margin-top: 0.375rem;
  color: ${props => props.$up ? T.success : T.danger};
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.$bg};
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

// ─── Chart Grid ────────────────────────────────────────────────────────────

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.875rem;
  margin-bottom: 1.25rem;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const ChartCard = styled.div`
  background: ${T.surface};
  border: 1px solid ${T.border};
  border-radius: 10px;
  overflow: hidden;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ChartCardHeader = styled.div`
  padding: 0.875rem 1.125rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${T.borderLight};
`;

const ChartTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${T.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const ChartSubtitle = styled.span`
  font-size: 0.6875rem;
  color: ${T.textMuted};
  font-weight: 500;
`;

const ChartBody = styled.div`
  padding: 1.125rem;
`;

// ─── Donut Chart (SVG) ──────────────────────────────────────────────────────

const DonutWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const DonutSvg = styled.svg`
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.04));
`;

const DonutCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const DonutTotal = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${T.text};
  line-height: 1;
`;

const DonutTotalLabel = styled.div`
  font-size: 0.625rem;
  color: ${T.textMuted};
  margin-top: 0.125rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const LegendList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
`;

const LegendDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: ${props => props.$color};
  flex-shrink: 0;
`;

const LegendName = styled.div`
  flex: 1;
  font-size: 0.75rem;
  color: ${T.textBody};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`;

const LegendValue = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${T.text};
  white-space: nowrap;
`;

const LegendPct = styled.div`
  font-size: 0.6875rem;
  color: ${T.textMuted};
  width: 32px;
  text-align: right;
`;

// ─── Progress Bars (Goals) ─────────────────────────────────────────────────

const GoalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GoalItem = styled.div``;

const GoalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.375rem;
`;

const GoalLabel = styled.div`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${T.textBody};
`;

const GoalValue = styled.div`
  font-size: 0.8125rem;
  font-weight: 700;
  color: ${T.text};
`;

const ProgressBarBg = styled.div`
  height: 8px;
  background: ${T.borderLight};
  border-radius: 10px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  border-radius: 10px;
  background: ${props => props.$color};
  width: ${props => props.$width}%;
  animation: ${progressFill} 0.8s ease-out;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 20px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3));
    border-radius: 0 10px 10px 0;
  }
`;

// ─── Frequency Chart (Horizontal Bars) ──────────────────────────────────────

const FreqItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  &:last-child { margin-bottom: 0; }
`;

const FreqLabel = styled.div`
  width: 70px;
  font-size: 0.75rem;
  color: ${T.textSecondary};
  text-align: right;
  flex-shrink: 0;
`;

const FreqBarBg = styled.div`
  flex: 1;
  height: 28px;
  background: ${T.borderLight};
  border-radius: 6px;
  overflow: hidden;
  position: relative;
`;

const FreqBarFill = styled.div`
  height: 100%;
  border-radius: 6px;
  background: ${props => props.$color};
  width: ${props => props.$width}%;
  animation: ${progressFill} 0.6s ease-out;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  min-width: fit-content;
  transition: width 0.3s ease;
`;

const FreqBarLabel = styled.span`
  font-size: 0.6875rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
`;

const FreqCount = styled.div`
  width: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${T.text};
  flex-shrink: 0;
`;

// ─── Activity Feed ──────────────────────────────────────────────────────────

const ActivityFeed = styled.div`
  display: flex;
  flex-direction: column;
`;

const ActivityItem = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${T.borderLight};
  animation: ${slideIn} 0.25s ease-out;

  &:last-child { border-bottom: none; }
`;

const ActivityAvatar = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${props => props.$color};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const ActivityPerson = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${T.text};
`;

const ActivityTime = styled.span`
  font-size: 0.6875rem;
  color: ${T.textMuted};
  white-space: nowrap;
`;

const ActivityDesc = styled.div`
  font-size: 0.75rem;
  color: ${T.textSecondary};
  margin-top: 0.0625rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActivityMeta = styled.div`
  display: flex;
  gap: 0.375rem;
  margin-top: 0.375rem;
  flex-wrap: wrap;
`;

const MetaTag = styled.span`
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.4375rem;
  border-radius: 4px;

  ${props => {
    const map = {
      info: { bg: T.primaryBg, color: T.primary },
      warn: { bg: T.warningBg, color: T.warning },
      success: { bg: T.successBg, color: T.success },
      danger: { bg: T.dangerBg, color: T.danger },
    };
    const s = map[props.$type] || map.info;
    return css`background: ${s.bg}; color: ${s.color};`;
  }}
`;

// ─── Staff Analysis Table ───────────────────────────────────────────────────

const StaffTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const StaffTH = styled.th`
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${T.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid ${T.border};
`;

const StaffTR = styled.tr`
  border-bottom: 1px solid ${T.borderLight};
  transition: background 0.1s ease;

  &:last-child { border-bottom: none; }
  &:hover { background: ${T.surfaceHover}; }
`;

const StaffTD = styled.td`
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  color: ${T.textBody};
  vertical-align: middle;
`;

const StaffNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StaffAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${props => props.$color};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const TrendBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${props => props.$up ? T.success : T.danger};
`;

// ─── Full Width Card ────────────────────────────────────────────────────────

const FullCard = styled.div`
  background: ${T.surface};
  border: 1px solid ${T.border};
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1.25rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

// ─── Service Error Banner ────────────────────────────────────────────────────

const ErrorBanner = styled.div`
  background: ${T.dangerBg};
  border: 1px solid ${T.dangerLight};
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ErrorIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${T.danger};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ErrorContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ErrorTitle = styled.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${T.danger};
  margin: 0 0 0.25rem;
`;

const ErrorMessage = styled.p`
  font-size: 0.8125rem;
  color: ${T.textBody};
  margin: 0 0 0.5rem;
  line-height: 1.5;
`;

const ErrorAction = styled.p`
  font-size: 0.75rem;
  color: ${T.textSecondary};
  margin: 0;
  font-weight: 500;
`;

const ErrorRetryBtn = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid ${T.danger};
  background: white;
  color: ${T.danger};
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: ${T.danger};
    color: white;
  }
`;

// ─── Feedback Button ─────────────────────────────────────────────────────────

const FeedbackBtn = styled.button`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.125rem;
  background: ${T.primary};
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  transition: all 0.15s ease;
  z-index: 50;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  }
`;

// ─── Loading ───────────────────────────────────────────────────────────────

const LoadingWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 0.75rem;
`;

const SpinnerIcon = styled(RefreshCw)`
  animation: ${spin} 1s linear infinite;
`;

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ChemicalInventoryAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [showAddChem, setShowAddChem] = useState(false);
  const [showPickup, setShowPickup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [chemForm, setChemForm] = useState({ name: '', category: 'embalming', unit: 'liters', current_stock: '', min_stock_level: '', reorder_level: '', unit_cost: '', hazard_level: 'low', notes: '' });
  const [pickupForm, setPickupForm] = useState({ chemical_id: '', quantity_used: '', used_by: '', usage_notes: '' });
  const [serviceError, setServiceError] = useState(null);
  const [chemicalsList, setChemicalsList] = useState([]);
  const [showRestock, setShowRestock] = useState(false);
  const [restockForm, setRestockForm] = useState({ chemical_id: '', quantity: '', notes: '' });

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setServiceError(null);
    try {
      const [analyticsRes, listRes] = await Promise.allSettled([
        api.get('/chemicals/analytics'),
        api.get('/chemicals'),
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data?.success) {
        setDashboardSummary(analyticsRes.value.data.data);
      }
      if (listRes.status === 'fulfilled' && listRes.value?.data?.success) {
        setChemicalsList(listRes.value.data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch chemical data:', e);
      const errData = e.response?.data;
      if (errData?.error === 'SERVICE_DOWN' || e.response?.status === 503) {
        setServiceError({ message: 'Chemical service is currently unavailable', details: errData?.message || 'The service is down. Please contact your system administrator.', action: 'Try again later' });
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRetry = () => {
    setServiceError(null);
    fetchAll();
  };

  /* ─── Handlers ───────────────────────────────────────────────── */
  const handleAddChemical = async (e) => {
    e.preventDefault();
    if (!chemForm.name) return toast.error('Chemical name is required');
    setSubmitting(true);
    try {
      const payload = {
        name: chemForm.name,
        category: chemForm.category.toLowerCase(),
        unit: chemForm.unit,
        current_stock: parseFloat(chemForm.current_stock) || 0,
        min_stock_level: parseFloat(chemForm.min_stock_level) || 0,
        reorder_level: parseFloat(chemForm.reorder_level) || 0,
        unit_cost: parseFloat(chemForm.unit_cost) || 0,
        hazard_level: chemForm.hazard_level.toLowerCase(),
        notes: chemForm.notes || null,
      };
      const r = await api.post('/chemicals', payload);
      if (r.data.success) {
        toast.success('Chemical added successfully');
        setShowAddChem(false);
        setChemForm({ name: '', category: 'embalming', unit: 'liters', current_stock: '', min_stock_level: '', reorder_level: '', unit_cost: '', hazard_level: 'low', notes: '' });
        await fetchAll();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add chemical');
    }
    setSubmitting(false);
  };

  const handleRecordPickup = async (e) => {
    e.preventDefault();
    if (!pickupForm.chemical_id || !pickupForm.quantity_used) return toast.error('Select chemical and enter quantity');
    setSubmitting(true);
    try {
      const payload = {
        chemical_id: parseInt(pickupForm.chemical_id),
        quantity_used: parseFloat(pickupForm.quantity_used),
        used_by: pickupForm.used_by || 'Staff',
        usage_notes: pickupForm.usage_notes || null,
      };
      const r = await api.post('/chemicals/usage', payload);
      if (r.data.success) {
        toast.success('Pickup recorded successfully');
        setShowPickup(false);
        setPickupForm({ chemical_id: '', quantity_used: '', used_by: '', usage_notes: '' });
        await fetchAll();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to record pickup');
    }
    setSubmitting(false);
  };

  /* ─── Compute derived data from real backend response ─── */
  const data = dashboardSummary || {};
  const recentTransactions = data.recent_transactions || [];
  const topUsedChemicals = data.top_used_chemicals || [];

  // Stat cards from real data
  const totalChemicals = data.total_chemicals || 0;
  const lowStockCount = data.low_stock_count || 0;
  const totalUsage30d = parseFloat(data.total_usage_30d) || 0;
  const totalPickupCount = recentTransactions.filter(t => t.transaction_type === 'consumed').length;

  // Usage Distribution for donut chart from top_used_chemicals
  const totalVolume = topUsedChemicals.reduce((sum, c) => sum + (parseFloat(c.total_used) || 0), 0);
  const usageData = topUsedChemicals
    .filter(c => parseFloat(c.total_used) > 0)
    .map((c, i) => ({
      name: c.name,
      percentage: totalVolume > 0 ? Math.round((parseFloat(c.total_used) / totalVolume) * 100) : 0,
      volume: `${parseFloat(c.total_used).toFixed(1)}${c.unit === 'liters' ? 'L' : c.unit}`,
      color: T.chartColors[i % T.chartColors.length],
    }));

  // Goals from real data
  const stockHealth = totalChemicals > 0 ? Math.round(((totalChemicals - lowStockCount) / totalChemicals) * 100) : 100;
  const goalsData = [
    { label: 'Stock Health', current: stockHealth, target: 100, unit: '%', color: T.primary, lightColor: T.primaryLight, bgColor: T.primaryBg },
    { label: 'Total Usage (30d)', current: totalUsage30d, target: 100, unit: 'L', color: T.success, lightColor: T.successLight, bgColor: T.successBg },
    { label: 'Low Stock Alerts', current: lowStockCount, target: 0, unit: '', color: T.warning, lightColor: T.warningLight, bgColor: T.warningBg },
    { label: 'Total Chemicals', current: totalChemicals, target: 10, unit: '', color: T.purple, lightColor: T.purpleLight, bgColor: T.purpleBg },
  ];

  // Activity feed from recent_transactions
  const activityData = recentTransactions.map((t, i) => {
    const date = new Date(t.transaction_date || t.created_at);
    const daysSince = Math.floor((Date.now() - date.getTime()) / 86400000);
    return {
      id: t.id,
      person: t.performed_by || t.used_by || 'System',
      chemical: `${t.chemical_name} (${parseFloat(t.quantity).toFixed(1)}${t.unit === 'liters' ? 'L' : t.unit})`,
      action: t.transaction_type === 'received' ? 'Received' : t.transaction_type === 'consumed' ? 'Consumed' : t.transaction_type,
      time: timeAgo(date),
      date: date,
      daysSinceLast: daysSince,
      avgInterval: daysSince,
      avatarColor: T.chartColors[i % T.chartColors.length],
      type: t.transaction_type,
    };
  });

  // Pickup frequency from recent transactions
  const freqBuckets = { '0-3 days': 0, '4-7 days': 0, '8-14 days': 0, '15+ days': 0 };
  recentTransactions.forEach(t => {
    const days = Math.floor((Date.now() - new Date(t.transaction_date || t.created_at).getTime()) / 86400000);
    if (days <= 3) freqBuckets['0-3 days']++;
    else if (days <= 7) freqBuckets['4-7 days']++;
    else if (days <= 14) freqBuckets['8-14 days']++;
    else freqBuckets['15+ days']++;
  });
  const totalPickups = recentTransactions.length || 1;
  const frequencyData = [
    { range: '0-3 days', count: freqBuckets['0-3 days'], percentage: Math.round((freqBuckets['0-3 days'] / totalPickups) * 100), color: T.success },
    { range: '4-7 days', count: freqBuckets['4-7 days'], percentage: Math.round((freqBuckets['4-7 days'] / totalPickups) * 100), color: T.primary },
    { range: '8-14 days', count: freqBuckets['8-14 days'], percentage: Math.round((freqBuckets['8-14 days'] / totalPickups) * 100), color: T.warning },
    { range: '15+ days', count: freqBuckets['15+ days'], percentage: Math.round((freqBuckets['15+ days'] / totalPickups) * 100), color: T.danger },
  ];

  // Staff analysis from recent transactions
  const staffMap = {};
  recentTransactions.forEach(t => {
    const name = t.performed_by || t.used_by || 'System';
    if (!staffMap[name]) staffMap[name] = { name, pickups: 0, totalVolume: 0, dates: [] };
    staffMap[name].pickups++;
    staffMap[name].totalVolume += parseFloat(t.quantity) || 0;
    staffMap[name].dates.push(new Date(t.transaction_date || t.created_at).getTime());
  });
  const staffData = Object.values(staffMap).map((s, i) => {
    const avgVol = s.pickups > 0 ? (s.totalVolume / s.pickups).toFixed(1) : '0.0';
    const avgUnit = recentTransactions.find(t => (t.performed_by || t.used_by) === s.name)?.unit === 'liters' ? 'L' : 'units';
    let avgDays = 0;
    if (s.dates.length > 1) {
      s.dates.sort((a, b) => a - b);
      const gaps = [];
      for (let j = 1; j < s.dates.length; j++) {
        gaps.push((s.dates[j] - s.dates[j - 1]) / 86400000);
      }
      avgDays = gaps.length > 0 ? (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1) : 0;
    }
    return {
      name: s.name,
      pickups: s.pickups,
      avgDays: parseFloat(avgDays) || 0,
      avgVolume: `${avgVol}${avgUnit}`,
      trend: s.dates.length > 2 ? 'up' : 'down',
      color: T.chartColors[i % T.chartColors.length],
    };
  });

  // Average interval
  const avgInterval = activityData.length > 0
    ? (activityData.reduce((s, a) => s + a.daysSinceLast, 0) / activityData.length).toFixed(1)
    : 'N/A';

  // ─── Donut Chart Calculations ──────────────────────────────────────────
  const radius = 70;
  let accumulatedAngle = -90; // Start at top

  const donutSlices = usageData.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;

    const x1 = 90 + radius * Math.cos(startRad);
    const y1 = 90 + radius * Math.sin(startRad);
    const x2 = 90 + radius * Math.cos(endRad);
    const y2 = 90 + radius * Math.sin(endRad);

    const d = angle >= 360
      ? ''
      : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

    return { ...item, d, startAngle, endAngle };
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  LOADING
  // ═══════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <Page>
        <LoadingWrap>
          <SpinnerIcon size={28} color={T.primary} />
          <span style={{ fontSize: '0.8125rem', color: T.textSecondary }}>Loading analytics...</span>
        </LoadingWrap>
      </Page>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <Page>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <PageHeader>
        <TitleGroup>
          <PageTitle><FlaskConical size={22} /> Chemical Inventory Analytics</PageTitle>
          <PageDesc>Track usage, pickup patterns, and staff chemical inventory behavior</PageDesc>
        </TitleGroup>
        <HeaderActions>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            style={{
              padding: '0.4375rem 1.75rem 0.4375rem 0.625rem',
              border: `1px solid ${T.border}`,
              borderRadius: '6px',
              fontSize: '0.8125rem',
              color: T.textBody,
              background: T.surface,
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
            }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last 1 year</option>
          </select>
          <Btn onClick={() => setShowAddChem(true)}><Plus size={14} /> New Chemical</Btn>
          <Btn $variant="primary" onClick={() => setShowPickup(true)}><Beaker size={14} /> Record Pickup</Btn>
          <Btn onClick={() => window.location.reload()}><RefreshCw size={14} /> Refresh</Btn>
        </HeaderActions>
      </PageHeader>

      {/* ─── Service Error Banner ────────────────────────────────────── */}
      {serviceError && (
        <ErrorBanner>
          <ErrorIcon>
            <AlertTriangle size={20} />
          </ErrorIcon>
          <ErrorContent>
            <ErrorTitle>{serviceError.message}</ErrorTitle>
            <ErrorMessage>{serviceError.details}</ErrorMessage>
            <ErrorAction>Action: {serviceError.action}</ErrorAction>
          </ErrorContent>
          <ErrorRetryBtn onClick={handleRetry}>
            <RefreshCw size={14} /> Retry
          </ErrorRetryBtn>
        </ErrorBanner>
      )}

      {/* ─── Chemical Stock List ─────────────────────────────────────── */}
      <FullCard style={{ marginBottom: '1.25rem' }}>
        <ChartCardHeader>
          <ChartTitle>
            <Package size={15} /> Chemical Stock List
          </ChartTitle>
          <ChartSubtitle>Manage inventory and restock levels</ChartSubtitle>
        </ChartCardHeader>
        <div style={{ overflowX: 'auto' }}>
          <StaffTable>
            <thead>
              <tr>
                <StaffTH>Chemical Name</StaffTH>
                <StaffTH>Category</StaffTH>
                <StaffTH>Current Stock</StaffTH>
                <StaffTH>Min Level</StaffTH>
                <StaffTH>Reorder Level</StaffTH>
                <StaffTH>Status</StaffTH>
                <StaffTH>Action</StaffTH>
              </tr>
            </thead>
            <tbody>
              {chemicalsList.length === 0 ? (
                <tr>
                  <StaffTD colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: T.textMuted }}>
                    No chemicals in stock. Click "New Chemical" to add one.
                  </StaffTD>
                </tr>
              ) : chemicalsList.map((chem, i) => {
                const current = parseFloat(chem.current_stock) || 0;
                const min = parseFloat(chem.min_stock_level) || 0;
                const reorder = parseFloat(chem.reorder_level) || 0;
                const isLow = current <= min;
                const isBelowReorder = current <= reorder;
                return (
                  <StaffTR key={chem.id || i}>
                    <StaffTD>
                      <StaffNameCell>
                        <StaffAvatar $color={T.chartColors[i % T.chartColors.length]}>{getInitials(chem.name)}</StaffAvatar>
                        <span style={{ fontWeight: 500 }}>{chem.name}</span>
                      </StaffNameCell>
                    </StaffTD>
                    <StaffTD>{chem.category}</StaffTD>
                    <StaffTD style={{ fontWeight: 600 }}>{current} {chem.unit}</StaffTD>
                    <StaffTD>{min} {chem.unit}</StaffTD>
                    <StaffTD>{reorder} {chem.unit}</StaffTD>
                    <StaffTD>
                      {isLow ? (
                        <MetaTag $type="danger">Low Stock</MetaTag>
                      ) : isBelowReorder ? (
                        <MetaTag $type="warn">Below Reorder</MetaTag>
                      ) : (
                        <MetaTag $type="success">In Stock</MetaTag>
                      )}
                    </StaffTD>
                    <StaffTD>
                      <Btn onClick={() => { setRestockForm({ chemical_id: chem.id, quantity: '', notes: '' }); setShowRestock(true); }}>
                        <Plus size={12} /> Restock
                      </Btn>
                    </StaffTD>
                  </StaffTR>
                );
              })}
            </tbody>
          </StaffTable>
        </div>
      </FullCard>

      {/* ─── Stat Cards ──────────────────────────────────────────────── */}
      <StatsGrid>
        <StatCard>
          <StatInfo>
            <StatLabel>Total Usage (30d)</StatLabel>
            <StatValue>{totalVolume.toFixed(1)}<span style={{ fontSize: '14px', fontWeight: 600, color: T.textMuted, marginLeft: 2 }}>L</span></StatValue>
            <StatChange $up={true}>
              <ArrowUp size={12} /> From backend
            </StatChange>
          </StatInfo>
          <StatIcon $color={T.primary} $bg={T.primaryBg}><Beaker size={18} /></StatIcon>
        </StatCard>

        <StatCard>
          <StatInfo>
            <StatLabel>Total Pickups</StatLabel>
            <StatValue>{totalPickupCount}</StatValue>
            <StatChange $up={true}>
              <ArrowUp size={12} /> Recorded
            </StatChange>
          </StatInfo>
          <StatIcon $color={T.purple} $bg={T.purpleBg}><Package size={18} /></StatIcon>
        </StatCard>

        <StatCard>
          <StatInfo>
            <StatLabel>Avg. Interval</StatLabel>
            <StatValue>{avgInterval}{avgInterval !== 'N/A' ? 'd' : ''}</StatValue>
            <StatChange $up={false}>
              <ArrowDown size={12} /> Between pickups
            </StatChange>
          </StatInfo>
          <StatIcon $color={T.warning} $bg={T.warningBg}><Clock size={18} /></StatIcon>
        </StatCard>

        <StatCard>
          <StatInfo>
            <StatLabel>Low Stock Alerts</StatLabel>
            <StatValue>{lowStockCount}</StatValue>
            <StatChange $up={false}>
              <AlertTriangle size={12} /> {lowStockCount > 0 ? 'Needs attention' : 'All good'}
            </StatChange>
          </StatInfo>
          <StatIcon $color={lowStockCount > 0 ? T.danger : T.success} $bg={lowStockCount > 0 ? T.dangerBg : T.successBg}><AlertTriangle size={18} /></StatIcon>
        </StatCard>
      </StatsGrid>

      {/* ─── Charts Row 1: Donut + Goals ─────────────────────────────── */}
      <ChartGrid>
        {/* Donut Chart */}
        <ChartCard>
          <ChartCardHeader>
            <ChartTitle>
              <FlaskConical size={15} /> Usage Distribution
            </ChartTitle>
            <ChartSubtitle>{totalVolume}L total</ChartSubtitle>
          </ChartCardHeader>
          <ChartBody>
            <DonutWrap>
              <div style={{ position: 'relative' }}>
                <DonutSvg width="180" height="180" viewBox="0 0 180 180">
                  {donutSlices.map((slice, i) => (
                    <path
                      key={i}
                      d={slice.d}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="28"
                      strokeLinecap="butt"
                    />
                  ))}
                </DonutSvg>
                <DonutCenter>
                  <DonutTotal>{totalVolume}L</DonutTotal>
                  <DonutTotalLabel>Total Used</DonutTotalLabel>
                </DonutCenter>
              </div>
              <LegendList>
                {usageData.map((item, i) => (
                  <LegendItem key={i}>
                    <LegendDot $color={item.color} />
                    <LegendName>{item.name}</LegendName>
                    <LegendValue>{item.volume}</LegendValue>
                    <LegendPct>{item.percentage}%</LegendPct>
                  </LegendItem>
                ))}
              </LegendList>
            </DonutWrap>
          </ChartBody>
        </ChartCard>

        {/* Goals / Progress */}
        <ChartCard>
          <ChartCardHeader>
            <ChartTitle>
              <span style={{ fontSize: '15px' }}>🎯</span> Inventory Goals
            </ChartTitle>
            <ChartSubtitle>This period</ChartSubtitle>
          </ChartCardHeader>
          <ChartBody>
            <GoalList>
              {goalsData.map((goal, i) => (
                <GoalItem key={i}>
                  <GoalHeader>
                    <GoalLabel>{goal.label}</GoalLabel>
                    <GoalValue>{goal.current}{goal.unit}</GoalValue>
                  </GoalHeader>
                  <ProgressBarBg>
                    <ProgressBarFill $color={goal.color} $width={goal.current} />
                  </ProgressBarBg>
                </GoalItem>
              ))}
            </GoalList>
          </ChartBody>
        </ChartCard>
      </ChartGrid>

      {/* ─── Charts Row 2: Frequency + Activity ──────────────────────── */}
      <ChartGrid>
        {/* Pickup Frequency */}
        <ChartCard>
          <ChartCardHeader>
            <ChartTitle>
              <RotateCw size={15} /> Pickup Frequency
            </ChartTitle>
            <ChartSubtitle>Days between pickups</ChartSubtitle>
          </ChartCardHeader>
          <ChartBody>
            {frequencyData.map((item, i) => (
              <FreqItem key={i}>
                <FreqLabel>{item.range}</FreqLabel>
                <FreqBarBg>
                  <FreqBarFill $color={item.color} $width={item.percentage}>
                    {item.percentage > 15 && <FreqBarLabel>{item.percentage}%</FreqBarLabel>}
                  </FreqBarFill>
                </FreqBarBg>
                <FreqCount>{item.count}</FreqCount>
              </FreqItem>
            ))}
          </ChartBody>
        </ChartCard>

        {/* Recent Activity */}
        <ChartCard>
          <ChartCardHeader>
            <ChartTitle>
              <Activity size={15} /> Recent Pickups
            </ChartTitle>
            <ChartSubtitle>Last 7 days</ChartSubtitle>
          </ChartCardHeader>
          <ChartBody style={{ padding: '0.625rem 1.125rem' }}>
            <ActivityFeed>
              {activityData.slice(0, 5).map((item) => {
                const gapInfo = getDaysLabel(item.daysSinceLast);
                return (
                  <ActivityItem key={item.id}>
                    <ActivityAvatar $color={item.avatarColor}>
                      {getInitials(item.person)}
                    </ActivityAvatar>
                    <ActivityContent>
                      <ActivityTop>
                        <ActivityPerson>{item.person}</ActivityPerson>
                        <ActivityTime>{item.time}</ActivityTime>
                      </ActivityTop>
                      <ActivityDesc>{item.chemical} — {item.action}</ActivityDesc>
                      <ActivityMeta>
                        <MetaTag $type={gapInfo.type}>
                          <Clock size={9} /> {gapInfo.text}
                        </MetaTag>
                        <MetaTag $type="info">
                          <Zap size={9} /> Avg {item.avgInterval}d
                        </MetaTag>
                      </ActivityMeta>
                    </ActivityContent>
                  </ActivityItem>
                );
              })}
            </ActivityFeed>
          </ChartBody>
        </ChartCard>
      </ChartGrid>

      {/* ─── Staff Analysis Table ─────────────────────────────────────── */}
      <FullCard>
        <ChartCardHeader>
          <ChartTitle>
            <Users size={15} /> Staff Pickup Analysis
          </ChartTitle>
          <ChartSubtitle>Who picks what and how often</ChartSubtitle>
        </ChartCardHeader>
        <div style={{ overflowX: 'auto' }}>
          <StaffTable>
            <thead>
              <tr>
                <StaffTH>Staff Member</StaffTH>
                <StaffTH>Total Pickups</StaffTH>
                <StaffTH>Avg. Interval</StaffTH>
                <StaffTH>Avg. Volume</StaffTH>
                <StaffTH>Freq. Trend</StaffTH>
              </tr>
            </thead>
            <tbody>
              {staffData.map((staff, i) => (
                <StaffTR key={i}>
                  <StaffTD>
                    <StaffNameCell>
                      <StaffAvatar $color={staff.color}>{getInitials(staff.name)}</StaffAvatar>
                      <span style={{ fontWeight: 500 }}>{staff.name}</span>
                    </StaffNameCell>
                  </StaffTD>
                  <StaffTD style={{ fontWeight: 600 }}>{staff.pickups}</StaffTD>
                  <StaffTD>
                    <MetaTag $type={getDaysLabel(staff.avgDays).type}>
                      {staff.avgDays} days
                    </MetaTag>
                  </StaffTD>
                  <StaffTD>{staff.avgVolume}/pickup</StaffTD>
                  <StaffTD>
                    <TrendBadge $up={staff.trend === 'up'}>
                      {staff.trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {staff.trend === 'up' ? 'More frequent' : 'Less frequent'}
                    </TrendBadge>
                  </StaffTD>
                </StaffTR>
              ))}
            </tbody>
          </StaffTable>
        </div>
      </FullCard>

      {/* ─── Add Chemical Modal ──────────────────────────────────────── */}
      {showAddChem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: T.surface, borderRadius: 14, width: '100%', maxWidth: 500, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: T.text }}>
                <Plus size={18} color={T.primary} /> Add Chemical
              </h3>
              <button onClick={() => setShowAddChem(false)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSecondary }}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleAddChemical}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Chemical Name *</label>
                  <input value={chemForm.name} onChange={e => setChemForm({...chemForm, name: e.target.value})} placeholder="e.g. Formaldehyde" style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Category</label>
                  <input value={chemForm.category} onChange={e => setChemForm({...chemForm, category: e.target.value})} placeholder="embalming" style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Unit</label>
                  <input value={chemForm.unit} onChange={e => setChemForm({...chemForm, unit: e.target.value})} placeholder="liters" style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Initial Stock *</label>
                  <input type="number" step="0.01" value={chemForm.current_stock} onChange={e => setChemForm({...chemForm, current_stock: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Min Stock Level</label>
                  <input type="number" step="0.01" value={chemForm.min_stock_level} onChange={e => setChemForm({...chemForm, min_stock_level: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Reorder Level</label>
                  <input type="number" step="0.01" value={chemForm.reorder_level} onChange={e => setChemForm({...chemForm, reorder_level: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Notes</label>
                  <textarea value={chemForm.notes} onChange={e => setChemForm({...chemForm, notes: e.target.value})} placeholder="Optional notes..." rows={2} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button type="button" onClick={() => setShowAddChem(false)} style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: T.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? <Loader2 size={15} /> : <Save size={15} />} {submitting ? 'Saving...' : 'Save Chemical'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Record Pickup Modal ─────────────────────────────────────── */}
      {showPickup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: T.surface, borderRadius: 14, width: '100%', maxWidth: 500, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: T.text }}>
                <Beaker size={18} color={T.primary} /> Record Pickup
              </h3>
              <button onClick={() => setShowPickup(false)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSecondary }}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleRecordPickup}>
              <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Chemical *</label>
                  <select value={pickupForm.chemical_id} onChange={e => setPickupForm({...pickupForm, chemical_id: e.target.value})} required style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                    <option value="">Select chemical...</option>
                    {analyticsData.map(c => (
                      <option key={c.chemical_id} value={c.chemical_id}>{c.chemical_name} ({c.current_stock} {c.unit})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Quantity *</label>
                  <input type="number" step="0.01" value={pickupForm.quantity_used} onChange={e => setPickupForm({...pickupForm, quantity_used: e.target.value})} placeholder="0.00" required style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Picked By</label>
                  <input value={pickupForm.used_by} onChange={e => setPickupForm({...pickupForm, used_by: e.target.value})} placeholder="Staff name" style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Notes</label>
                  <textarea value={pickupForm.usage_notes} onChange={e => setPickupForm({...pickupForm, usage_notes: e.target.value})} placeholder="Optional notes..." rows={2} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button type="button" onClick={() => setShowPickup(false)} style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: T.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? <Loader2 size={15} /> : <Save size={15} />} {submitting ? 'Saving...' : 'Record Pickup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Restock Modal ────────────────────────────────────────────── */}
      {showRestock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: T.surface, borderRadius: 14, width: '100%', maxWidth: 420, maxHeight: '85vh', overflow: 'auto', padding: 24, animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: T.text }}>
                <Plus size={18} color={T.success} /> Restock Chemical
              </h3>
              <button onClick={() => setShowRestock(false)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSecondary }}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!restockForm.quantity) return toast.error('Enter quantity');
              setSubmitting(true);
              try {
                const payload = {
                  chemical_id: parseInt(restockForm.chemical_id),
                  quantity_used: parseFloat(restockForm.quantity),
                  used_by: 'System',
                  usage_notes: restockForm.notes || 'Restock',
                };
                const r = await api.post('/chemicals/usage', payload);
                if (r.data.success) {
                  toast.success('Restock recorded successfully');
                  setShowRestock(false);
                  setRestockForm({ chemical_id: '', quantity: '', notes: '' });
                  await fetchAll();
                }
              } catch (e) {
                toast.error(e.response?.data?.message || 'Failed to restock');
              }
              setSubmitting(false);
            }}>
              <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Chemical</label>
                  <input value={chemicalsList.find(c => c.id == restockForm.chemical_id)?.name || ''} disabled style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.bg, color: T.textSecondary, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Quantity to Add *</label>
                  <input type="number" step="0.01" value={restockForm.quantity} onChange={e => setRestockForm({...restockForm, quantity: e.target.value})} placeholder="0.00" required style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, display: 'block' }}>Notes</label>
                  <textarea value={restockForm.notes} onChange={e => setRestockForm({...restockForm, notes: e.target.value})} placeholder="Restock notes..." rows={2} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button type="button" onClick={() => setShowRestock(false)} style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: T.success, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? <Loader2 size={15} /> : <Save size={15} />} {submitting ? 'Saving...' : 'Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Feedback Button ──────────────────────────────────────────── */}
      <FeedbackBtn>
        <span style={{ fontSize: '15px' }}>💬</span> Feedback
      </FeedbackBtn>
    </Page>
  );
};

export default ChemicalInventoryAnalytics;
