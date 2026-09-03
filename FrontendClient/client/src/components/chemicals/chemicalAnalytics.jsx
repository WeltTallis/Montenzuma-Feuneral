import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const slideInRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
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

const panelFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// ═══════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
};

const getDaysLabel = (days) => {
  if (days == null || isNaN(days)) return { text: '\u2014', type: 'info' };
  if (days <= 3) return { text: `${days}d gap`, type: 'success' };
  if (days <= 7) return { text: `${days}d gap`, type: 'info' };
  if (days <= 14) return { text: `${days}d gap`, type: 'warn' };
  return { text: `${days}d gap`, type: 'danger' };
};

const timeAgo = (date) => {
  if (!date) return '\u2014';
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
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

// ─── Stat Cards (colored backgrounds) ──────────────────────────────────────

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
  background: ${props => props.$bg || T.surface};
  border-radius: 10px;
  padding: 1rem 1.125rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.15s ease;
  animation: ${fadeIn} 0.3s ease-out;

  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transform: translateY(-1px);
  }
`;

const StatInfo = styled.div``;

const StatLabel = styled.div`
  font-size: 0.6875rem;
  font-weight: 500;
  color: ${props => props.$light ? 'rgba(255,255,255,0.75)' : T.textSecondary};
  margin-bottom: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.$light ? '#fff' : T.text};
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
  color: ${props => props.$light ? 'rgba(255,255,255,0.7)' : props.$up ? T.success : T.danger};
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.$light ? 'rgba(255,255,255,0.2)' : props.$bg};
  color: ${props => props.$light ? '#fff' : props.$color};
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
  max-height: 340px;
  overflow-y: auto;
  padding-right: 4px;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
  &::-webkit-scrollbar-thumb:hover { background: ${T.textMuted}; }
  scrollbar-width: thin;
  scrollbar-color: ${T.border} transparent;
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
  &:hover { background: ${T.danger}; color: white; }
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

// ─── Side Panel ────────────────────────────────────────────────────────────

const PanelOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
  animation: ${panelFadeIn} 0.15s ease;
`;

const Panel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 480px;
  max-width: 92vw;
  background: ${T.surface};
  border-left: 1px solid ${T.border};
  box-shadow: -8px 0 30px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  animation: ${slideInRight} 0.25s cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
`;

const PanelHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${T.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${T.text};
`;

const PanelClose = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid ${T.border};
  background: ${T.surface};
  color: ${T.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
  &:hover { border-color: ${T.danger}; color: ${T.danger}; background: ${T.dangerBg}; }
`;

const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
`;

const PanelFooter = styled.div`
  padding: 14px 24px;
  border-top: 1px solid ${T.border};
  background: ${T.bg};
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

const PanelBtn = styled.button`
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.12s;
  text-align: center;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: inherit;
  ${props => props.$variant === 'primary' && css`
    background: ${T.primary}; color: white;
    &:hover { background: #1D4ED8; }
  `}
  ${props => props.$variant === 'ghost' && css`
    background: ${T.surface}; color: ${T.textSecondary}; border: 1px solid ${T.border};
    &:hover { color: ${T.text}; border-color: ${T.textMuted}; }
  `}
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

// ─── Form Elements ─────────────────────────────────────────────────────────

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`;

const FormRowFull = styled.div`
  margin-bottom: 16px;
`;

const FormLabel = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${T.text};
  margin-bottom: 4px;
  display: block;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${T.border};
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  color: ${T.text};
  background: ${T.surface};
  &:focus { border-color: ${T.primary}; box-shadow: 0 0 0 3px ${T.primaryBg}; }
  &::placeholder { color: ${T.textFaint}; }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${T.border};
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  color: ${T.text};
  background: ${T.surface};
  cursor: pointer;
  &:focus { border-color: ${T.primary}; box-shadow: 0 0 0 3px ${T.primaryBg}; }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${T.border};
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  color: ${T.text};
  background: ${T.surface};
  resize: vertical;
  min-height: 60px;
  &:focus { border-color: ${T.primary}; box-shadow: 0 0 0 3px ${T.primaryBg}; }
`;

const SectionTitle = styled.div`
  font-size: 0.6875rem;
  font-weight: 700;
  color: ${T.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid ${T.borderLight};
`;

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

// ─── Low stock alert banner ──────────────────────────────────────────────
const LowStockBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${T.dangerBg};
  border: 1px solid ${T.dangerLight};
  border-left: 4px solid ${T.danger};
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const LowStockBannerText = styled.div`
  flex: 1;
  min-width: 200px;
  font-size: 13px;
  line-height: 1.55;
  color: #7F1D1D;

  strong { font-weight: 800; }
`;

const LowStockBannerBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: ${T.danger};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;

  &:hover { background: #B91C1C; }
`;

const LowStockBannerClose = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #B91C1C;
  padding: 2px;
  display: flex;
  align-items: center;

  &:hover { color: #7F1D1D; }
`;

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
  const [restockForm, setRestockForm] = useState({ chemical_id: '', quantity: '', received_by: '', notes: '' });
  const [showLowStockBanner, setShowLowStockBanner] = useState(true);
  const lowStockToastShownRef = useRef(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setServiceError(null);
    try {
      const [analyticsRes, listRes] = await Promise.allSettled([
        api.get('/chemicals/dashboard/summary'),
        api.get('/chemicals'),
      ]);
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data?.success) {
        setDashboardSummary(analyticsRes.value.data.data);
      }
      if (listRes.status === 'fulfilled' && listRes.value?.data?.success) {
        const mapped = (listRes.value.data.data || []).map(c => ({ ...c, id: c.chemical_id || c.id, name: c.chemical_name || c.name }));
        setChemicalsList(mapped);
        const low = mapped.filter(c => Number(c.is_low_stock) === 1 || parseFloat(c.current_stock) <= parseFloat(c.min_stock_level));
        if (low.length > 0 && !lowStockToastShownRef.current) {
          lowStockToastShownRef.current = true;
          const names = low.slice(0, 4).map(c => `${c.name} (${parseFloat(c.current_stock)}${c.unit === 'liters' ? 'L' : ' ' + c.unit})`).join(', ');
          toast.warning(`⚠ ${low.length} chemical${low.length > 1 ? 's are' : ' is'} LOW on stock: ${names}${low.length > 4 ? '…' : ''}. Please restock!`, { autoClose: 8000 });
        }
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

  const handleRetry = () => { setServiceError(null); fetchAll(); };

  const handleAddChemical = async (e) => {
    e.preventDefault();
    if (!chemForm.name) return toast.error('Chemical name is required');
    setSubmitting(true);
    try {
      const payload = { name: chemForm.name, category: chemForm.category.toLowerCase(), unit: chemForm.unit, current_stock: parseFloat(chemForm.current_stock) || 0, min_stock_level: parseFloat(chemForm.min_stock_level) || 0, reorder_level: parseFloat(chemForm.reorder_level) || 0, unit_cost: parseFloat(chemForm.unit_cost) || 0, hazard_level: chemForm.hazard_level.toLowerCase(), notes: chemForm.notes || null };
      const r = await api.post('/chemicals', payload);
      if (r.data.success) { toast.success('Chemical added successfully'); setShowAddChem(false); setChemForm({ name: '', category: 'embalming', unit: 'liters', current_stock: '', min_stock_level: '', reorder_level: '', unit_cost: '', hazard_level: 'low', notes: '' }); await fetchAll(); }
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to add chemical'); }
    setSubmitting(false);
  };

  const handleRecordPickup = async (e) => {
    e.preventDefault();
    if (!pickupForm.chemical_id || !pickupForm.quantity_used) return toast.error('Select chemical and enter quantity');
    setSubmitting(true);
    try {
      const payload = { chemical_id: parseInt(pickupForm.chemical_id), quantity_used: parseFloat(pickupForm.quantity_used), used_by: pickupForm.used_by || 'Staff', usage_notes: pickupForm.usage_notes || null };
      const r = await api.post('/chemicals/usage', payload);
      if (r.data.success) { toast.success('Pickup recorded successfully'); setShowPickup(false); setPickupForm({ chemical_id: '', quantity_used: '', used_by: '', usage_notes: '' }); await fetchAll(); }
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to record pickup'); }
    setSubmitting(false);
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockForm.chemical_id || !restockForm.quantity) return toast.error('Enter quantity to restock');
    setSubmitting(true);
    try {
      const payload = { chemical_id: parseInt(restockForm.chemical_id), quantity: parseFloat(restockForm.quantity), received_by: restockForm.received_by || 'Staff', notes: restockForm.notes || null };
      const r = await api.post('/chemicals/restock', payload);
      if (r.data.success) { toast.success('Restock recorded successfully'); setShowRestock(false); setRestockForm({ chemical_id: '', quantity: '', received_by: '', notes: '' }); await fetchAll(); }
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to record restock'); }
    setSubmitting(false);
  };

  /* ─── Derived data ─────────────────────────────────────────────────── */
  const data = dashboardSummary || {};
  const recentTransactions = data.recent_transactions || [];
  const topUsedChemicals = data.top_used_chemicals || [];

  const resolvePerformer = (t) => { const name = String(t.performed_by || t.used_by || '').trim(); return name || 'Unknown'; };
  const parseTxnDate = (t) => { const raw = t.transaction_date || t.created_at; if (!raw) return null; const d = new Date(raw); if (isNaN(d.getTime()) || d.getFullYear() < 2000) return null; return d; };

  const totalChemicals = data.total_chemicals || 0;
  const lowStockCount = data.low_stock_count || 0;
  const lowStockItems = chemicalsList.filter(c => Number(c.is_low_stock) === 1 || parseFloat(c.current_stock) <= parseFloat(c.min_stock_level));
  const totalUsage30d = parseFloat(data.total_usage_30d) || 0;
  const pickupTransactions = recentTransactions.filter(t => t.transaction_type === 'consumed');
  const totalPickupCount = pickupTransactions.length;

  const totalVolume = topUsedChemicals.reduce((sum, c) => sum + (parseFloat(c.total_used) || 0), 0);
  const usageData = topUsedChemicals.filter(c => parseFloat(c.total_used) > 0).map((c, i) => ({
    name: c.name, percentage: totalVolume > 0 ? Math.round((parseFloat(c.total_used) / totalVolume) * 100) : 0,
    volume: `${parseFloat(c.total_used).toFixed(1)}${c.unit === 'liters' ? 'L' : c.unit}`, color: T.chartColors[i % T.chartColors.length],
  }));

  const stockHealth = totalChemicals > 0 ? Math.round(((totalChemicals - lowStockCount) / totalChemicals) * 100) : 100;
  const goalsData = [
    { label: 'Stock Health', current: stockHealth, target: 100, unit: '%', color: T.primary },
    { label: 'Total Usage (30d)', current: totalUsage30d, target: 100, unit: 'L', color: T.success },
    { label: 'Low Stock Alerts', current: lowStockCount, target: 0, unit: '', color: T.warning },
    { label: 'Total Chemicals', current: totalChemicals, target: 10, unit: '', color: T.purple },
  ];

  const personHistory = {};
  pickupTransactions.forEach(t => {
    const name = resolvePerformer(t);
    if (!personHistory[name]) personHistory[name] = { name, unit: t.unit, pickups: 0, totalVolume: 0, dates: [] };
    const h = personHistory[name]; h.pickups++; h.totalVolume += parseFloat(t.quantity) || 0;
    const d = parseTxnDate(t); if (d) h.dates.push(d.getTime());
  });
  Object.values(personHistory).forEach(h => h.dates.sort((a, b) => a - b));
  const gapsOf = (dates) => { const gaps = []; for (let j = 1; j < dates.length; j++) gaps.push((dates[j] - dates[j - 1]) / 86400000); return gaps; };
  const avgOf = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  const activityData = recentTransactions.map((t, i) => {
    const date = parseTxnDate(t); const hist = personHistory[resolvePerformer(t)];
    const idx = date && hist ? hist.dates.indexOf(date.getTime()) : -1;
    const gapDays = idx > 0 ? Math.round((hist.dates[idx] - hist.dates[idx - 1]) / 86400000) : null;
    const personAvg = hist && hist.dates.length > 1 ? avgOf(gapsOf(hist.dates)) : null;
    return { id: t.id, person: resolvePerformer(t), chemical: `${t.chemical_name} (${parseFloat(t.quantity).toFixed(1)}${t.unit === 'liters' ? 'L' : t.unit})`, action: t.transaction_type === 'received' ? 'Received' : t.transaction_type === 'consumed' ? 'Consumed' : t.transaction_type, time: date ? timeAgo(date) : '\u2014', date, gapDays, avgInterval: personAvg != null ? personAvg.toFixed(1) : null, avatarColor: T.chartColors[i % T.chartColors.length], type: t.transaction_type };
  });

  const freqBuckets = { '0-3 days': 0, '4-7 days': 0, '8-14 days': 0, '15+ days': 0 };
  let datedPickups = 0;
  pickupTransactions.forEach(t => { const d = parseTxnDate(t); if (!d) return; datedPickups++; const days = Math.floor((Date.now() - d.getTime()) / 86400000); if (days <= 3) freqBuckets['0-3 days']++; else if (days <= 7) freqBuckets['4-7 days']++; else if (days <= 14) freqBuckets['8-14 days']++; else freqBuckets['15+ days']++; });
  const totalDatedPickups = datedPickups || 1;
  const frequencyData = [
    { range: '0-3 days', count: freqBuckets['0-3 days'], percentage: Math.round((freqBuckets['0-3 days'] / totalDatedPickups) * 100), color: T.success },
    { range: '4-7 days', count: freqBuckets['4-7 days'], percentage: Math.round((freqBuckets['4-7 days'] / totalDatedPickups) * 100), color: T.primary },
    { range: '8-14 days', count: freqBuckets['8-14 days'], percentage: Math.round((freqBuckets['8-14 days'] / totalDatedPickups) * 100), color: T.warning },
    { range: '15+ days', count: freqBuckets['15+ days'], percentage: Math.round((freqBuckets['15+ days'] / totalDatedPickups) * 100), color: T.danger },
  ];

  const staffData = Object.values(personHistory).map((s, i) => {
    const avgVol = s.pickups > 0 ? (s.totalVolume / s.pickups).toFixed(1) : '0.0';
    const avgUnit = s.unit === 'liters' ? 'L' : 'units';
    const gaps = gapsOf(s.dates); const avgDays = avgOf(gaps);
    const trend = gaps.length >= 2 ? (gaps[gaps.length - 1] <= gaps[gaps.length - 2] ? 'up' : 'down') : null;
    return { name: s.name, pickups: s.pickups, avgDays: avgDays != null ? parseFloat(avgDays.toFixed(1)) : null, avgVolume: `${avgVol}${avgUnit}`, trend, color: T.chartColors[i % T.chartColors.length] };
  });

  const allPersonalGaps = Object.values(personHistory).flatMap(h => gapsOf(h.dates));
  const overallAvgGap = avgOf(allPersonalGaps);
  const avgInterval = overallAvgGap != null ? overallAvgGap.toFixed(1) : 'N/A';

  // Donut chart
  const radius = 70; let accumulatedAngle = -90;
  const donutSlices = usageData.map((item) => {
    const angle = (item.percentage / 100) * 360; const startAngle = accumulatedAngle; const endAngle = accumulatedAngle + angle; accumulatedAngle = endAngle;
    const startRad = (startAngle * Math.PI) / 180; const endRad = (endAngle * Math.PI) / 180; const largeArc = angle > 180 ? 1 : 0;
    const x1 = 90 + radius * Math.cos(startRad); const y1 = 90 + radius * Math.sin(startRad);
    const x2 = 90 + radius * Math.cos(endRad); const y2 = 90 + radius * Math.sin(endRad);
    const d = angle >= 360 ? '' : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    return { ...item, d, startAngle, endAngle };
  });

  // Close any panel on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') { setShowAddChem(false); setShowPickup(false); setShowRestock(false); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

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
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} style={{ padding: '0.4375rem 1.75rem 0.4375rem 0.625rem', border: `1px solid ${T.border}`, borderRadius: '6px', fontSize: '0.8125rem', color: T.textBody, background: T.surface, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}>
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
          <ErrorIcon><AlertTriangle size={20} /></ErrorIcon>
          <ErrorContent>
            <ErrorTitle>{serviceError.message}</ErrorTitle>
            <ErrorMessage>{serviceError.details}</ErrorMessage>
            <ErrorAction>Action: {serviceError.action}</ErrorAction>
          </ErrorContent>
          <ErrorRetryBtn onClick={handleRetry}><RefreshCw size={14} /> Retry</ErrorRetryBtn>
        </ErrorBanner>
      )}

      {/* ─── Low Stock Alert Banner ───────────────────────────────────── */}
      {showLowStockBanner && lowStockItems.length > 0 && (
        <LowStockBanner>
          <AlertTriangle size={16} color={T.danger} />
          <LowStockBannerText>
            <strong>⚠ Low stock alert ({lowStockItems.length}):</strong>{' '}
            {lowStockItems.map(c => `${c.name} — ${parseFloat(c.current_stock)}${c.unit === 'liters' ? 'L' : ' ' + c.unit} left (min ${parseFloat(c.min_stock_level)})`).join(' · ')}
          </LowStockBannerText>
          <LowStockBannerBtn onClick={() => setShowRestock(true)}>
            <Plus size={12} /> Restock now
          </LowStockBannerBtn>
          <LowStockBannerClose onClick={() => setShowLowStockBanner(false)}>
            <X size={14} />
          </LowStockBannerClose>
        </LowStockBanner>
      )}

      {/* ─── Chemical Stock List ─────────────────────────────────────── */}
      <FullCard>
        <ChartCardHeader>
          <ChartTitle><Package size={15} /> Chemical Stock List</ChartTitle>
          <ChartSubtitle>Manage inventory and restock levels</ChartSubtitle>
        </ChartCardHeader>
        <div style={{ overflowX: 'auto' }}>
          <StaffTable>
            <thead><tr>
              <StaffTH>Chemical Name</StaffTH><StaffTH>Category</StaffTH><StaffTH>Current Stock</StaffTH><StaffTH>Min Level</StaffTH><StaffTH>Reorder Level</StaffTH><StaffTH>Status</StaffTH><StaffTH>Action</StaffTH>
            </tr></thead>
            <tbody>
              {chemicalsList.length === 0 ? (
                <tr><StaffTD colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: T.textMuted }}>No chemicals in stock. Click "New Chemical" to add one.</StaffTD></tr>
              ) : chemicalsList.map((chem, i) => {
                const current = parseFloat(chem.current_stock) || 0; const min = parseFloat(chem.min_stock_level) || 0; const reorder = parseFloat(chem.reorder_level) || 0;
                const isLow = current <= min; const isBelowReorder = current <= reorder;
                return (
                  <StaffTR key={chem.id || i}>
                    <StaffTD><StaffNameCell><StaffAvatar $color={T.chartColors[i % T.chartColors.length]}>{getInitials(chem.name)}</StaffAvatar><span style={{ fontWeight: 500 }}>{chem.name}</span></StaffNameCell></StaffTD>
                    <StaffTD>{chem.category}</StaffTD>
                    <StaffTD style={{ fontWeight: 600 }}>{current} {chem.unit}</StaffTD>
                    <StaffTD>{min} {chem.unit}</StaffTD>
                    <StaffTD>{reorder} {chem.unit}</StaffTD>
                    <StaffTD>{isLow ? <MetaTag $type="danger">Low Stock</MetaTag> : isBelowReorder ? <MetaTag $type="warn">Below Reorder</MetaTag> : <MetaTag $type="success">In Stock</MetaTag>}</StaffTD>
                    <StaffTD><Btn onClick={() => { setRestockForm({ chemical_id: chem.id, quantity: '', received_by: '', notes: '' }); setShowRestock(true); }}><Plus size={12} /> Restock</Btn></StaffTD>
                  </StaffTR>
                );
              })}
            </tbody>
          </StaffTable>
        </div>
      </FullCard>

      {/* ─── Stat Cards (colored backgrounds) ─────────────────────────── */}
      <StatsGrid>
        <StatCard $bg="#2563EB">
          <StatInfo>
            <StatLabel $light>Total Usage (30d)</StatLabel>
            <StatValue $light>{totalUsage30d.toFixed(1)}<span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginLeft: 2 }}>L</span></StatValue>
            <StatChange $light><ArrowUp size={12} /> From backend</StatChange>
          </StatInfo>
          <StatIcon $light><Beaker size={18} /></StatIcon>
        </StatCard>

        <StatCard $bg="#7C3AED">
          <StatInfo>
            <StatLabel $light>Total Pickups</StatLabel>
            <StatValue $light>{totalPickupCount}</StatValue>
            <StatChange $light><ArrowUp size={12} /> Recorded</StatChange>
          </StatInfo>
          <StatIcon $light><Package size={18} /></StatIcon>
        </StatCard>

        <StatCard $bg="#D97706">
          <StatInfo>
            <StatLabel $light>Avg. Interval</StatLabel>
            <StatValue $light>{avgInterval}{avgInterval !== 'N/A' ? 'd' : ''}</StatValue>
            <StatChange $light><ArrowDown size={12} /> Between pickups</StatChange>
          </StatInfo>
          <StatIcon $light><Clock size={18} /></StatIcon>
        </StatCard>

        <StatCard $bg={lowStockCount > 0 ? '#DC2626' : '#059669'}>
          <StatInfo>
            <StatLabel $light>Low Stock Alerts</StatLabel>
            <StatValue $light>{lowStockCount}</StatValue>
            <StatChange $light><AlertTriangle size={12} /> {lowStockCount > 0 ? 'Needs attention' : 'All good'}</StatChange>
          </StatInfo>
          <StatIcon $light><AlertTriangle size={18} /></StatIcon>
        </StatCard>
      </StatsGrid>

      {/* ─── Charts Row 1: Donut + Goals ─────────────────────────────── */}
      <ChartGrid>
        <ChartCard>
          <ChartCardHeader><ChartTitle><FlaskConical size={15} /> Usage Distribution</ChartTitle><ChartSubtitle>{totalVolume}L total</ChartSubtitle></ChartCardHeader>
          <ChartBody>
            <DonutWrap>
              <div style={{ position: 'relative' }}>
                <DonutSvg width="180" height="180" viewBox="0 0 180 180">
                  {donutSlices.map((slice, i) => <path key={i} d={slice.d} fill="none" stroke={slice.color} strokeWidth="28" strokeLinecap="butt" />)}
                </DonutSvg>
                <DonutCenter><DonutTotal>{totalVolume}L</DonutTotal><DonutTotalLabel>Total Used</DonutTotalLabel></DonutCenter>
              </div>
              <LegendList>
                {usageData.map((item, i) => <LegendItem key={i}><LegendDot $color={item.color} /><LegendName>{item.name}</LegendName><LegendValue>{item.volume}</LegendValue><LegendPct>{item.percentage}%</LegendPct></LegendItem>)}
              </LegendList>
            </DonutWrap>
          </ChartBody>
        </ChartCard>

        <ChartCard>
          <ChartCardHeader><ChartTitle><span style={{ fontSize: '15px' }}>🎯</span> Inventory Goals</ChartTitle><ChartSubtitle>This period</ChartSubtitle></ChartCardHeader>
          <ChartBody>
            <GoalList>
              {goalsData.map((goal, i) => (
                <GoalItem key={i}>
                  <GoalHeader><GoalLabel>{goal.label}</GoalLabel><GoalValue>{goal.current}{goal.unit}</GoalValue></GoalHeader>
                  <ProgressBarBg><ProgressBarFill $color={goal.color} $width={goal.current} /></ProgressBarBg>
                </GoalItem>
              ))}
            </GoalList>
          </ChartBody>
        </ChartCard>
      </ChartGrid>

      {/* ─── Charts Row 2: Frequency + Activity ──────────────────────── */}
      <ChartGrid>
        <ChartCard>
          <ChartCardHeader><ChartTitle><RotateCw size={15} /> Pickup Frequency</ChartTitle><ChartSubtitle>Days between pickups</ChartSubtitle></ChartCardHeader>
          <ChartBody>
            {frequencyData.map((item, i) => (
              <FreqItem key={i}>
                <FreqLabel>{item.range}</FreqLabel>
                <FreqBarBg><FreqBarFill $color={item.color} $width={item.percentage}>{item.percentage > 15 && <FreqBarLabel>{item.percentage}%</FreqBarLabel>}</FreqBarFill></FreqBarBg>
                <FreqCount>{item.count}</FreqCount>
              </FreqItem>
            ))}
          </ChartBody>
        </ChartCard>

        <ChartCard>
          <ChartCardHeader><ChartTitle><Activity size={15} /> Recent Pickups</ChartTitle><ChartSubtitle>Last 7 days</ChartSubtitle></ChartCardHeader>
          <ChartBody style={{ padding: '0.625rem 1.125rem' }}>
            <ActivityFeed>
              {activityData.slice(0, 5).map((item) => (
                <ActivityItem key={item.id}>
                  <ActivityAvatar $color={item.avatarColor}>{getInitials(item.person)}</ActivityAvatar>
                  <ActivityContent>
                    <ActivityTop><ActivityPerson>{item.person}</ActivityPerson><ActivityTime>{item.time}</ActivityTime></ActivityTop>
                    <ActivityDesc>{item.chemical} — {item.action}</ActivityDesc>
                    <ActivityMeta>
                      {item.gapDays != null && <MetaTag $type={getDaysLabel(item.gapDays).type}><Clock size={9} /> {getDaysLabel(item.gapDays).text}</MetaTag>}
                      {item.avgInterval != null && <MetaTag $type="info"><Zap size={9} /> Avg {item.avgInterval}d</MetaTag>}
                    </ActivityMeta>
                  </ActivityContent>
                </ActivityItem>
              ))}
            </ActivityFeed>
          </ChartBody>
        </ChartCard>
      </ChartGrid>

      {/* ─── Staff Analysis Table ─────────────────────────────────────── */}
      <FullCard>
        <ChartCardHeader><ChartTitle><Users size={15} /> Staff Pickup Analysis</ChartTitle><ChartSubtitle>Who picks what and how often</ChartSubtitle></ChartCardHeader>
        <div style={{ overflowX: 'auto' }}>
          <StaffTable>
            <thead><tr><StaffTH>Staff Member</StaffTH><StaffTH>Total Pickups</StaffTH><StaffTH>Avg. Interval</StaffTH><StaffTH>Avg. Volume</StaffTH><StaffTH>Freq. Trend</StaffTH></tr></thead>
            <tbody>
              {staffData.map((staff, i) => (
                <StaffTR key={i}>
                  <StaffTD><StaffNameCell><StaffAvatar $color={staff.color}>{getInitials(staff.name)}</StaffAvatar><span style={{ fontWeight: 500 }}>{staff.name}</span></StaffNameCell></StaffTD>
                  <StaffTD style={{ fontWeight: 600 }}>{staff.pickups}</StaffTD>
                  <StaffTD>{staff.avgDays != null ? <MetaTag $type={getDaysLabel(staff.avgDays).type}>{staff.avgDays} days</MetaTag> : <span style={{ color: T.textMuted, fontSize: 12 }}>\u2014</span>}</StaffTD>
                  <StaffTD>{staff.avgVolume}/pickup</StaffTD>
                  <StaffTD>{staff.trend ? <TrendBadge $up={staff.trend === 'up'}>{staff.trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{staff.trend === 'up' ? 'More frequent' : 'Less frequent'}</TrendBadge> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.6875rem', fontWeight: 600, color: T.textMuted }}><Clock size={12} /> Not enough data</span>}</StaffTD>
                </StaffTR>
              ))}
            </tbody>
          </StaffTable>
        </div>
      </FullCard>

      {/* ═══════════════════════════════════════════════════════════════
          SIDE PANEL: Add Chemical
          ═══════════════════════════════════════════════════════════════ */}
      {showAddChem && (
        <>
          <PanelOverlay onClick={() => setShowAddChem(false)} />
          <Panel>
            <PanelHeader>
              <PanelTitle><Plus size={18} color={T.primary} /> Add Chemical</PanelTitle>
              <PanelClose onClick={() => setShowAddChem(false)}><X size={15} /></PanelClose>
            </PanelHeader>
            <PanelBody>
              <form onSubmit={handleAddChemical}>
                <SectionTitle>Chemical Details</SectionTitle>
                <FormRowFull>
                  <FormLabel>Chemical Name *</FormLabel>
                  <FormInput value={chemForm.name} onChange={e => setChemForm({ ...chemForm, name: e.target.value })} placeholder="e.g. Formaldehyde" required />
                </FormRowFull>
                <FormRow>
                  <div><FormLabel>Category</FormLabel><FormSelect value={chemForm.category} onChange={e => setChemForm({ ...chemForm, category: e.target.value })}><option value="embalming">Embalming</option><option value="disinfectant">Disinfectant</option><option value="preservative">Preservative</option><option value="cosmetic">Cosmetic</option><option value="other">Other</option></FormSelect></div>
                  <div><FormLabel>Unit</FormLabel><FormSelect value={chemForm.unit} onChange={e => setChemForm({ ...chemForm, unit: e.target.value })}><option value="liters">Liters</option><option value="ml">Milliliters</option><option value="kg">Kilograms</option><option value="grams">Grams</option><option value="packets">Packets</option><option value="pieces">Pieces</option></FormSelect></div>
                </FormRow>
                <SectionTitle>Stock Levels</SectionTitle>
                <FormRow>
                  <div><FormLabel>Initial Stock *</FormLabel><FormInput type="number" step="any" value={chemForm.current_stock} onChange={e => setChemForm({ ...chemForm, current_stock: e.target.value })} placeholder="0" required /></div>
                  <div><FormLabel>Min Stock Level</FormLabel><FormInput type="number" step="any" value={chemForm.min_stock_level} onChange={e => setChemForm({ ...chemForm, min_stock_level: e.target.value })} placeholder="0" /></div>
                </FormRow>
                <FormRow>
                  <div><FormLabel>Reorder Level</FormLabel><FormInput type="number" step="any" value={chemForm.reorder_level} onChange={e => setChemForm({ ...chemForm, reorder_level: e.target.value })} placeholder="0" /></div>
                  <div><FormLabel>Unit Cost</FormLabel><FormInput type="number" step="any" value={chemForm.unit_cost} onChange={e => setChemForm({ ...chemForm, unit_cost: e.target.value })} placeholder="0.00" /></div>
                </FormRow>
                <SectionTitle>Safety</SectionTitle>
                <FormRowFull>
                  <FormLabel>Hazard Level</FormLabel>
                  <FormSelect value={chemForm.hazard_level} onChange={e => setChemForm({ ...chemForm, hazard_level: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></FormSelect>
                </FormRowFull>
                <FormRowFull>
                  <FormLabel>Notes</FormLabel>
                  <FormTextarea value={chemForm.notes} onChange={e => setChemForm({ ...chemForm, notes: e.target.value })} placeholder="Optional notes..." />
                </FormRowFull>
                <div style={{ height: 1 }} />
              </form>
            </PanelBody>
            <PanelFooter>
              <PanelBtn $variant="primary" onClick={handleAddChemical} disabled={submitting}>{submitting ? 'Saving...' : <><Save size={14} /> Save Chemical</>}</PanelBtn>
              <PanelBtn $variant="ghost" onClick={() => setShowAddChem(false)}>Cancel</PanelBtn>
            </PanelFooter>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SIDE PANEL: Record Pickup
          ═══════════════════════════════════════════════════════════════ */}
      {showPickup && (
        <>
          <PanelOverlay onClick={() => setShowPickup(false)} />
          <Panel>
            <PanelHeader>
              <PanelTitle><Beaker size={18} color={T.primary} /> Record Pickup</PanelTitle>
              <PanelClose onClick={() => setShowPickup(false)}><X size={15} /></PanelClose>
            </PanelHeader>
            <PanelBody>
              <form onSubmit={handleRecordPickup}>
                <SectionTitle>Pickup Details</SectionTitle>
                <FormRowFull>
                  <FormLabel>Chemical *</FormLabel>
                  <FormSelect value={pickupForm.chemical_id} onChange={e => setPickupForm({ ...pickupForm, chemical_id: e.target.value })}>
                    <option value="">Select chemical...</option>
                    {chemicalsList.map(c => <option key={c.id} value={c.id}>{c.name} ({parseFloat(c.current_stock || 0)} {c.unit} available)</option>)}
                  </FormSelect>
                </FormRowFull>
                <FormRow>
                  <div><FormLabel>Quantity Used *</FormLabel><FormInput type="number" step="any" value={pickupForm.quantity_used} onChange={e => setPickupForm({ ...pickupForm, quantity_used: e.target.value })} placeholder="0" required /></div>
                  <div><FormLabel>Used By</FormLabel><FormInput value={pickupForm.used_by} onChange={e => setPickupForm({ ...pickupForm, used_by: e.target.value })} placeholder="Staff name" /></div>
                </FormRow>
                <FormRowFull>
                  <FormLabel>Usage Notes</FormLabel>
                  <FormTextarea value={pickupForm.usage_notes} onChange={e => setPickupForm({ ...pickupForm, usage_notes: e.target.value })} placeholder="Optional notes about this usage..." />
                </FormRowFull>
                <div style={{ height: 1 }} />
              </form>
            </PanelBody>
            <PanelFooter>
              <PanelBtn $variant="primary" onClick={handleRecordPickup} disabled={submitting}>{submitting ? 'Saving...' : <><Beaker size={14} /> Record Pickup</>}</PanelBtn>
              <PanelBtn $variant="ghost" onClick={() => setShowPickup(false)}>Cancel</PanelBtn>
            </PanelFooter>
          </Panel>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SIDE PANEL: Restock
          ═══════════════════════════════════════════════════════════════ */}
      {showRestock && (
        <>
          <PanelOverlay onClick={() => setShowRestock(false)} />
          <Panel>
            <PanelHeader>
              <PanelTitle><Package size={18} color={T.success} /> Restock Chemical</PanelTitle>
              <PanelClose onClick={() => setShowRestock(false)}><X size={15} /></PanelClose>
            </PanelHeader>
            <PanelBody>
              <form onSubmit={handleRestock}>
                <SectionTitle>Restock Details</SectionTitle>
                <FormRowFull>
                  <FormLabel>Chemical</FormLabel>
                  <FormSelect value={restockForm.chemical_id} onChange={e => setRestockForm({ ...restockForm, chemical_id: e.target.value })}>
                    <option value="">Select chemical...</option>
                    {chemicalsList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </FormSelect>
                </FormRowFull>
                <FormRow>
                  <div><FormLabel>Quantity to Add *</FormLabel><FormInput type="number" step="any" value={restockForm.quantity} onChange={e => setRestockForm({ ...restockForm, quantity: e.target.value })} placeholder="0" required /></div>
                  <div><FormLabel>Received By</FormLabel><FormInput value={restockForm.received_by} onChange={e => setRestockForm({ ...restockForm, received_by: e.target.value })} placeholder="Staff name" /></div>
                </FormRow>
                <FormRowFull>
                  <FormLabel>Notes</FormLabel>
                  <FormTextarea value={restockForm.notes} onChange={e => setRestockForm({ ...restockForm, notes: e.target.value })} placeholder="Optional notes..." />
                </FormRowFull>
                <div style={{ height: 1 }} />
              </form>
            </PanelBody>
            <PanelFooter>
              <PanelBtn $variant="primary" style={{ background: T.success, ':hover': { background: '#047857' } }} onClick={handleRestock} disabled={submitting}>{submitting ? 'Saving...' : <><Package size={14} /> Record Restock</>}</PanelBtn>
              <PanelBtn $variant="ghost" onClick={() => setShowRestock(false)}>Cancel</PanelBtn>
            </PanelFooter>
          </Panel>
        </>
      )}
    </Page>
  );
};

export default ChemicalInventoryAnalytics;