import { formatDate, toDateKey, todayKey } from '../../utils/dates/parseDates';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import HorizontalCalendar from '../views/horizontalCalender';
import { useSocket } from '../../utils/context/socketContext';
import ReservationDashboard from './ReservationDashboard';
import { toast, ToastContainer } from 'react-toastify';
import CoffinTransfers from './coffinTransfers';
import { ENDPOINTS } from '../../api/endpoints';
import 'react-toastify/dist/ReactToastify.css';
import WeeklyView from '../views/weeklyView';
import DailyView from '../views/dailyView';
import env from '../../utils/config/env';
import api from '../../api/axios';
import {
  detectColorRGB,
  loadCoffinTypesCatalog,
  saveCoffinTypesCatalog,
  loadRegisteredColors,
  saveRegisteredColors,
  addRegisteredColor,
  removeRegisteredColor,
  addCoffinType,
  removeCoffinType,
  formatBranchDisplayName,
  COFFIN_POPULAR_PALETTE,
  generateVariantSku,
} from './coffinColorUtils';

import {
  getTenantSlug, getParentTenantSlug, getTenantId, getBranchId, getBranches,
} from '../../utils/globalAuth';

const API = env.FULL_API_URL;

const S = {
  primary: '#0f766e',
  primaryLight: '#f0fdfa',
  primaryDark: '#115e59',
  bg: '#f9fafb',
  cardBg: '#ffffff',
  text: '#111827',
  textMuted: '#64748b',
  textLight: '#374151',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  success: '#16a34a',
  successLight: '#f0fdf4',
  warning: '#d97706',
  warningLight: '#fffbeb',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  info: '#00296b',
  // Width of the right-hand drawer. "Find Stock in Other Branches" puts a
  // branch filter and a stacked result card per coffin in here, and at the
  // previous 520px the result rows were squeezed: the coffin name ellipsised
  // early and the stock chip + Request button had to compete for the same
  // horizontal space, wrapping into an unreadable two-line block on a laptop.
  // 640 gives the row room to breathe while still leaving the page visible
  // behind it. The drawer is `width:100%` with this as maxWidth, so phones
  // are unaffected — they already take the full screen.
  drawerWidth: 640,
  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.04)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.06)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.08)',
  shadowXl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease',
};


const getStockStatus = (stock) => {
  if (stock <= 0) return { label: 'Out of Stock', cls: 'tag-ou', color: '#dc2626' };
  if (stock <= 2) return { label: 'Low Stock', cls: 'tag-lo', color: '#d97706' };
  return { label: 'Available', cls: 'tag-ok', color: '#059669' };
};

const getCoffinStock = (coffin) =>
  Math.max(0, parseInt(coffin?.stock ?? coffin?.quantity, 10) || 0);

const getCoffinImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  const cleanPath = imagePath.trim();
  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${env.API_GATEWAY_URL}${normalizedPath}`;
};

const getBookingStatus = (status) => {
  const map = {
    pending: { label: 'Pending', cls: 'tag-pe' },
    booked: { label: 'Approved', cls: 'tag-bo' },
    completed: { label: 'Completed', cls: 'tag-co' },
    cancelled: { label: 'Cancelled', cls: 'tag-ca' },
    approved: { label: 'Approved', cls: 'tag-ar' },
    rejected: { label: 'Rejected', cls: 'tag-ou' },
    delivered: { label: 'Delivered', cls: 'tag-de' },
  };
  // 2-status flow: legacy "transferring/In Transit" rows render as Approved.
  const normalized = ['transferring', 'transit', 'in-transit', 'in_transit'].includes(status)
    ? 'approved'
    : status;
  return map[normalized] || map.pending;
};

const getReqStatus = (status) => {
  const map = {
    pending: { label: 'Pending', cls: 'tag-pe' },
    approved: { label: 'Approved', cls: 'tag-ar' },
    rejected: { label: 'Rejected', cls: 'tag-ou' },
    delivered: { label: 'Delivered', cls: 'tag-de' },
  };
  const normalized = ['transferring', 'transit', 'in-transit', 'in_transit'].includes(status)
    ? 'approved'
    : status;
  return map[normalized] || map.pending;
};

const getBookingDotColor = (b) => {
  switch (b.status) {
    case 'pending':
      return S.warning;
    case 'booked':
    case 'approved':
      return S.info;
    case 'completed':
      return S.success;
    case 'cancelled':
    case 'rejected':
      return S.danger;
    default:
      return S.primary;
  }
};

const getCoffinName = (coffinId, coffinsList = []) => {
  const c = coffinsList.find((x) => (x.coffin_id || x.id) == coffinId);
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
    delivered: '#0D9488',
  };
  const normalized = ['transferring', 'transit', 'in-transit', 'in_transit'].includes(status)
    ? 'approved'
    : status;
  return map[normalized] || S.primary;
};

const formatKES = (n) => 'KES ' + parseFloat(n || 0).toLocaleString();

//  Inline Styles Object

const styles = {
  W: {
    maxWidth: 2200,
    margin: '0 auto',

    fontFamily: S.font,
    color: S.text,

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
    background: 'transparent',
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
    background: 'transparent',
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
    background: 'transparent',
    color: S.textMuted,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: S.transition,
    fontFamily: 'inherit',
  },
  fnActive: { background: S.primaryLight, color: S.primary, borderColor: S.primary },
  tableWrap: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: S.textMuted,
    background: 'transparent',
    fontWeight: 700,
    borderBottom: `1px solid ${S.border}`,
    whiteSpace: 'nowrap',
  },
  td: {
    // 16px horizontal padding instead of 24px. Seven columns at 24px put ~340px
    // of pure padding into a row, which squeezed "Details" down to a 4-line
    // stack and made the table feel cramped even on a laptop. 16px keeps the
    // columns readable while giving the content columns real width.
    padding: '14px 16px',
    fontSize: 14,
    borderBottom: `1px solid ${S.borderLight}`,
    color: S.text,
    verticalAlign: 'middle',
  },
  ci: { display: 'flex', alignItems: 'center', gap: 12 },
  // Details used to be a 4-row flex column (Size / Color / Material / Category),
  // making every row 4 lines tall regardless of how much data was present. These
  // soft inline chips wrap onto as many lines as they need and read as a single
  // tidy group, so a row with one attribute stays one line.
  cdetail: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px 6px',
    maxWidth: 260,
  },
  cchip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderRadius: 6,
    background: S.bg,
    border: `1px solid ${S.borderLight}`,
    fontSize: 11.5,
    color: S.textMuted,
    whiteSpace: 'nowrap',
  },
  cchipKey: { color: S.text, fontWeight: 600 },
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
    background: 'transparent',
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

  // -- Side panel chrome (New Reservation + Register Coffin) ------------------
  // Matches the deceased Charge Settings / Scanner Bridge sidebars: dark-teal
  // gradient header, white scrollable body, pinned footer.
  bkOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,10,10,0.38)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    zIndex: 199,
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease-out',
  },
  bkOverlayOpen: { opacity: 1, pointerEvents: 'auto' },
  bkSidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    height: '100vh',
    width: '100%',
    maxWidth: 520,
    background: '#fff',
    borderLeft: `1px solid ${S.border}`,
    boxShadow: '-18px 0 44px -18px rgba(10,10,10,0.35)',
    transform: 'translateX(100%)',
    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  bkSidebarOpen: { transform: 'translateX(0)' },
  bkHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: '18px 24px',
    flexShrink: 0,
    background: 'linear-gradient(135deg, #0f3040 0%, #163f52 100%)',
    borderBottom: '1px solid #0b2936',
    boxShadow: '0 8px 18px rgba(15,48,64,0.16)',
  },
  bkHeaderH2: {
    fontFamily: "'Merriweather', Georgia, serif",
    fontSize: 17,
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  bkHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 auto',
    fontSize: 17,
  },
  bkHeaderSub: {
    display: 'block',
    margin: '4px 0 0 52px',
    color: 'rgba(255,255,255,0.72)',
    font: "11px 'Source Sans 3', -apple-system, sans-serif",
    letterSpacing: '0.04em',
  },
  bkClose: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.28)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    flex: '0 0 auto',
    fontSize: 16,
    lineHeight: 1,
  },
  // The <form> wrapper is a flex column so bkBody can scroll on its own while
  // the header/footer stay pinned to the top and bottom of the panel.
  bkForm: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  bkBody: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: '20px 24px',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  bkSectionHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: S.textMuted,
  },
  bkSectionRule: { flex: 1, height: 1, background: S.borderLight },
  bkFile: {
    width: '100%',
    padding: '10px 12px',
    border: `1px dashed ${S.border}`,
    borderRadius: 8,
    background: '#f7f7f5',
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  bkField: { display: 'grid', gap: 6 },
  bkInput: {
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
  bkFooter: {
    padding: '14px 24px',
    borderTop: `1px solid ${S.borderLight}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    flexShrink: 0,
    background: '#fff',
  },
  bkFooterBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 116,
    padding: '12px 18px',
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: S.transition,
  },
  bkFooterGhost: {
    background: '#fff',
    border: `1px solid ${S.border}`,
    color: '#1a1a1a',
  },
  bkFooterPrimary: {
    background: '#0a0a0a',
    border: 'none',
    color: '#fff',
  },

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
  detailSection: {
    marginBottom: 24,
    background: '#fff',
    border: `1px solid ${S.border}`,
    borderRadius: 12,
    padding: 20,
  },
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
  tracker: {
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
    margin: '24px 0 32px',
  },
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
  trackerStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
    textAlign: 'center',
    width: '25%',
  },
  trackerLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: S.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  historyLog: {
    background: S.bg,
    border: `1px solid ${S.border}`,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  historyItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 16,
    position: 'relative',
  },
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

// Tag helpers 
const Tag = ({ cls, children }) => {
  const tagStyles = {
    'tag-ok': { background: S.successLight, color: S.success },
    'tag-lo': { background: S.warningLight, color: S.warning },
    'tag-ou': { background: S.dangerLight, color: S.danger },
    'tag-pe': { background: S.warningLight, color: S.warning },
    'tag-bo': { background: '#eff6ff', color: '#00296b' },
    'tag-co': { background: '#fce7f3', color: '#5f0f40' },
    'tag-ca': { background: '#fee2e2', color: '#dd2d4a' },
    'tag-ar': { background: '#eff6ff', color: '#00296b' },
    'tag-tr': { background: S.warningLight, color: S.warning },
    'tag-de': { background: S.successLight, color: S.success },
  };
  return (
    <span style={{ ...styles.tag, ...(tagStyles[cls] || tagStyles['tag-ok']) }}>{children}</span>
  );
};

//  Main Component 
const CoffinDashboard = () => {
  const { socket } = useSocket();
  // Reservations ("bookings") is always the landing tab when Coffins opens.
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
  const [invTypeFilter, setInvTypeFilter] = useState('all');
  const [invColorFilter, setInvColorFilter] = useState('all');
  const [bkFilter, setBkFilter] = useState('all');
  const [invQuery, setInvQuery] = useState('');
  const [bkQuery, setBkQuery] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');

  // Coffin Types & Colors Catalogs (synced with localStorage & variants)
  const [typesCatalog, setTypesCatalog] = useState(() => loadCoffinTypesCatalog());
  const [registeredColors, setRegisteredColors] = useState(() => loadRegisteredColors());

  // Reservations calendar/list state now lives inside <ReservationDashboard />

  // Drawer / Modal
  const [drawer, setDrawer] = useState({ open: false, title: '', content: '' });
  const [modal, setModal] = useState({ open: false, type: '', data: {} });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Dropdown menus for actions/management to prevent crowded navigation
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);
  const [invMenuOpen, setInvMenuOpen] = useState(false);
  const invMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setHeaderMenuOpen(false);
      }
      if (invMenuRef.current && !invMenuRef.current.contains(e.target)) {
        setInvMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  useEffect(() => {
    if (modal.open && modal.type === 'booking') {
      setBookingSearch('');
    }
  }, [modal.open, modal.type]);

  // API Calls 
  const fetchAllData = useCallback(async (requestedBranchId) => {
    setLoading(true);
    setError(null);
    try {
      const tenantSlug = getTenantSlug();
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      // Fix: Use logged-in user's actual branch ID (UUID from localStorage) instead of
      // defaulting to branchList[0]. getBranchId() reads localStorage 'branchId' first,
      // then the user object - both are the exact UUID (e.g. '55e1190b-...').
      const userBranchId = user?.branchId || user?.branch_id || getBranchId();

      // Fetch branches using PARENT tenant slug ONLY (never branch slug)
      // Read parentTenantSlug DIRECTLY from user object in localStorage
      let branchList = [];
      try {
        const userObj = JSON.parse(userStr || '{}');
        const parentTenantSlug = userObj.parentTenantSlug;

        console.log('[COFFIN UI] Branch slug (current):', tenantSlug);
        console.log('[COFFIN UI] Parent slug (from user object):', parentTenantSlug);

        if (!parentTenantSlug) {
          console.error(
            '[COFFIN UI] No parentTenantSlug in user object! User must log out and log back in.',
          );
          throw new Error('No parentTenantSlug found. Please log out and log back in.');
        }

        // Use parentTenantSlug - NEVER use branch slug for fetching branches
        console.log('[COFFIN UI] Fetching branches from:', `/tenant/${parentTenantSlug}/branches`);

        const branchesRes = await api.get(`/tenant/${parentTenantSlug}/branches`);
        if (branchesRes.data?.success && branchesRes.data?.data) {
          const rawBranches = Array.isArray(branchesRes.data.data) ? branchesRes.data.data : [];
          branchList = rawBranches.map((b) => ({
            id: String(b.branch_id ?? b.id ?? ''),
            name: formatBranchDisplayName(b.branch_name || b.name, b.branch_slug || b.branch_db_name),
            branch_slug: b.branch_slug || b.branch_db_name || '',
            branch_db_name: b.branch_db_name || '',
          })).filter((branch) => branch.id);
          console.log('[COFFIN UI] Fetched branches from API:', branchList.length);
        }
      } catch (e) {
        console.error('[COFFIN UI] Error fetching branches:', e);
      }

      if (branchList.length === 0) {
        // Fallback: use the branches cached at login (localStorage `branches` array) so we
        // keep the real UUID branch ids (e.g. '55e1190b-...') instead of a fake numeric 1.
        const cachedBranches = getBranches();
        if (cachedBranches.length > 0) {
          branchList = cachedBranches
            .map((b) => ({
              id: String(b.branchId || b.branch_id || b.id || ''),
              name: formatBranchDisplayName(b.branchName || b.branch_name || b.name, b.branchSlug || b.branch_slug || b.branchDbName),
              branch_slug: b.branchSlug || b.branch_slug || b.branchDbName || '',
              branch_db_name: b.branchDbName || b.branch_db_name || '',
            }))
            .filter((b) => b.id);
          console.log('[COFFIN UI] Using localStorage branches fallback:', branchList.length);
        }
      }

      if (branchList.length === 0 && userBranchId) {
        // Keep a known, authenticated branch usable if the branch directory is
        // temporarily unavailable; never invent a numeric branch ID.
        branchList = [
          {
            id: String(userBranchId),
            name: formatBranchDisplayName(user?.branchName || user?.branch_name, tenantSlug) || 'Main Branch',
            branch_slug: tenantSlug,
            branch_db_name: tenantSlug,
          },
        ];
      }

      const requestedBranch = typeof requestedBranchId === 'string'
        ? branchList.find((branch) => String(branch.id) === requestedBranchId)
        : null;
      const storedBranch = branchList.find((branch) => String(branch.id) === String(getBranchId()));
      const defaultBranch = requestedBranch?.id
        || storedBranch?.id
        || branchList.find((branch) => String(branch.id) === String(userBranchId))?.id
        || branchList[0]?.id
        || null;

      setBranches(branchList);
      setCurrentBranch(defaultBranch);

      // Persist branch info to localStorage so axios interceptor sends correct x-branch-* headers
      const resolvedBranch = branchList.find((b) => b.id == defaultBranch);
      if (resolvedBranch) {
        localStorage.setItem('branchId', String(resolvedBranch.id));
        localStorage.setItem('branchSlug', resolvedBranch.branch_slug || '');
        localStorage.setItem('branchDbName', resolvedBranch.branch_db_name || '');
      }

      try {
        // Fetch coffins from ALL branch DBs (each row includes its branch_id/branch_name).
        // This mirrors the working "Find in Other Branches" query (/coffins/all-branches) and
        // keeps the current branch's coffins visible in the Inventory tab + Reservation dropdown.
        // The old /coffins/list endpoint is branch-agnostic and can resolve to the wrong DB (or
        // wrong tenant_slug) for a branch user, which is why the dropdown used to say "no coffins".
        const parentSlug = getParentTenantSlug();
        const tenantId = getTenantId();
        const allBranchRes = await api.get('/coffins/all-branches', {
          params: { parent_slug: parentSlug, tenant_id: tenantId || undefined },
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
        const bookingRes = await api.get('/coffins/orders');
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

  // Re-fetch the live transfer/stock-request data when a real-time socket event
  // arrives (a station CREATED a transfer, or another station APPROVED /
  // REJECTED / DELIVERED one). This keeps every branch's Incoming/Outgoing
  // list up to date WITHOUT the full-page spinner that fetchAllData triggers.
  const refreshLiveTransfers = useCallback(async () => {
    try {
      const [stockRes, coffinRes, bookingRes] = await Promise.all([
        api.get('/coffins/stock-requests'),
        api.get('/coffins/all-branches', {
          params: { parent_slug: getParentTenantSlug(), tenant_id: getTenantId() || undefined },
        }),
        api.get('/coffins/orders'),
      ]);
      if (stockRes.data?.success && Array.isArray(stockRes.data?.data)) {
        setStockRequests(stockRes.data.data);
      }
      if (coffinRes.data?.success && Array.isArray(coffinRes.data?.data)) {
        setCoffins(coffinRes.data.data);
      }
      if (bookingRes.data?.success && Array.isArray(bookingRes.data?.data)) {
        setBookings(bookingRes.data.data);
      }
    } catch (e) {
      console.error('[COFFIN UI] Error refreshing live transfer data:', e);
    }
  }, []);

  // Subscribe to coffin transfer/stock-request events. The coffin-service emits
  // these as `notification:coffin-stock-request` via the socketio-service; we
  // also listen for the un-prefixed name for robustness.
  useEffect(() => {
    if (!socket) return;
    const handleTransfer = () => refreshLiveTransfers();
    socket.on('notification:coffin-stock-request', handleTransfer);
    socket.on('coffin-stock-request', handleTransfer);
    socket.on('notification:coffin-booking-created', handleTransfer);
    socket.on('coffin-booking-created', handleTransfer);
    return () => {
      socket.off('notification:coffin-stock-request', handleTransfer);
      socket.off('coffin-stock-request', handleTransfer);
      socket.off('notification:coffin-booking-created', handleTransfer);
      socket.off('coffin-booking-created', handleTransfer);
    };
  }, [socket, refreshLiveTransfers]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  //  Inject Font Awesome CDN (Fix for missing icons) 

  //  CRUD Handl”
  const handleCreateCoffin = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const data = modal.data;
      const formData = new FormData();
      // Tag the coffin with the active branch so it only appears in this
      // branch's inventory. The backend also reads this from the x-branch-id
      // header, but sending it in the body is deterministic and prevents the
      // coffin from being stored unbranched (which would leak it to all branches).
      // The branch id is a UUID string (e.g. '55e1190b-...') - never an int.
      let branchIdForCreate = currentBranch;
      // If the branch list fell back to the fake numeric '1' (branches API
      // unavailable), prefer the real UUID branch id from localStorage.
      if (!branchIdForCreate || branchIdForCreate === 1 || String(branchIdForCreate) === '1') {
        branchIdForCreate = getBranchId() || branchIdForCreate;
      }
      if (branchIdForCreate) {
        formData.append('branch_id', String(branchIdForCreate));
      }
      // Always tag the coffin with the tenant id (UUID) so the backend can scope
      // the row to the tenant - this is what lets a tenant fetch coffins from ALL
      // of its branches regardless of which branch slug wrote the row.
      const tenantId = getTenantId();
      if (tenantId) {
        formData.append('tenant_id', String(tenantId));
      }
      formData.append('name', data.name);
      formData.append('type', data.name);
      formData.append('exact_price', parseFloat(data.price));
      formData.append('quantity', parseInt(data.stock) || 0);
      if (data.size) formData.append('size', data.size);
      if (data.color) formData.append('color', data.color);
      if (data.notes) formData.append('description', data.notes);
      if (data.images && data.images.length > 0) {
        Array.from(data.images).forEach((file) => formData.append('images', file));
      }

      // Content-Type: null lets the browser add the multipart boundary (hand-setting
      // 'multipart/form-data' omitted it -> multer 400 "Boundary not found").
      const res = await api.post('/coffins/create', formData, {
        headers: { 'Content-Type': null },
      });
      if (res.data?.success) {
        toast.success('Coffin created successfully');
        setModal({ open: false, type: '', data: {} });
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coffin');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Coffin Type Registration Handlers
  const handleSaveCoffinType = (e) => {
    e.preventDefault();
    const typeName = (modal.data.name || '').trim();
    if (!typeName) {
      toast.error('Coffin type name is required');
      return;
    }
    const description = (modal.data.description || '').trim();
    const selectedColorNames = modal.data.selectedColors || [];
    const colors = selectedColorNames.map((colName) => {
      const foundReg = registeredColors.find((rc) => rc.name.toLowerCase() === colName.toLowerCase());
      const det = detectColorRGB(colName);
      return {
        name: foundReg?.name || det.resolvedName || colName,
        hex: foundReg?.hex || det.hex,
        rgb: foundReg?.rgb || det.rgbStr,
      };
    });

    const updatedCatalog = addCoffinType({ name: typeName, description, colors });
    setTypesCatalog(updatedCatalog);
    toast.success(`Coffin type "${typeName}" registered successfully!`);
    setModal({
      open: true,
      type: 'registerTypes',
      data: { name: '', description: '', selectedColors: [] },
    });
  };

  const handleDeleteCoffinType = (typeId, typeName) => {
    if (!window.confirm(`Are you sure you want to remove coffin type "${typeName}"?`)) return;
    const updated = removeCoffinType(typeId);
    setTypesCatalog(updated);
    toast.success(`Removed coffin type "${typeName}"`);
  };

  // Color Registration Handlers
  const handleSaveColor = (e) => {
    e.preventDefault();
    const rawColor = (modal.data.colorName || '').trim();
    if (!rawColor) {
      toast.error('Color name is required');
      return;
    }
    const customHex = modal.data.customHex || null;
    const updated = addRegisteredColor(rawColor, customHex);
    setRegisteredColors(updated);
    const resolved = detectColorRGB(customHex || rawColor).resolvedName || rawColor;
    toast.success(`Color "${resolved}" registered successfully!`);
    setModal({
      open: true,
      type: 'registerColors',
      data: { colorName: '', customHex: '#111111' },
    });
  };

  const handleDeleteColor = (colorName) => {
    if (!window.confirm(`Are you sure you want to remove color "${colorName}"?`)) return;
    const updated = removeRegisteredColor(colorName);
    setRegisteredColors(updated);
    toast.success(`Removed color "${colorName}"`);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (submitLoading) return;
    const selectedCoffin = coffins.find(
      (coffin) => (coffin.coffin_id || coffin.id) == modal.data.coffin_id
    );
    const d = modal.data;
    const stock = getCoffinStock(selectedCoffin);
    const coffinName = String(d.coffin_name || selectedCoffin?.type || selectedCoffin?.name || '').trim();
    const coffinColor = String(d.color || selectedCoffin?.color || '').trim();
    const requestedSize = String(d.size !== undefined ? d.size : selectedCoffin?.size || '').trim();
    if (!coffinName) {
      toast.error('Coffin type is required');
      return;
    }
    if (!coffinColor) {
      toast.error('Coffin color is required');
      return;
    }
    const clientName = String(d.client_name || '').trim();
    const serviceDate = String(d.service_date || '').trim() || todayKey();
    if (!clientName) { toast.error('Client name is required'); return; }
    if (!serviceDate) { toast.error('Service date is required'); return; }
    const today = todayKey();
    if (serviceDate < today) {
      toast.error('Service date cannot be in the past');
      return;
    }
    const requestedQuantity = parseInt(d.quantity, 10) || 1;
    if (requestedQuantity <= 0) { toast.error('Quantity must be at least 1'); return; }
    const selectedMatchesSize = selectedCoffin && (
      requestedSize
        ? String(selectedCoffin.size || '').trim().toLowerCase() === requestedSize.toLowerCase()
        : !String(selectedCoffin.size || '').trim()
    );
    const stockBacked = selectedMatchesSize && stock >= requestedQuantity;
    if (requestedSize && selectedMatchesSize && requestedQuantity > stock) {
      toast.error(`Only ${stock} of this coffin variant are available`);
      return;
    }
    setSubmitLoading(true);
    try {
      const selectedBranchId = d.branch_id || currentBranch;
      const isInterBranch = !!stockBacked && selectedBranchId != currentBranch;

      const res = await api.post('/coffins/bookings', {
        client_name: d.client_name,
        client_phone: d.client_phone,
        deceased_name: d.deceased_name,
        coffin_id: d.coffin_id || undefined,
        coffin_name: coffinName,
        color: coffinColor,
        size: requestedSize || '',
        quantity: d.quantity || 1,
        service_date: serviceDate,
        service_time: d.service_time || '',
        amount: d.amount != null ? Number(d.amount) : 0,
        deposit: d.deposit != null ? Number(d.deposit) : 0,
        notes: d.notes,
        paid: d.paid || false,
        specifications: d.specifications || [],
        branch_id: selectedBranchId,
      });

      if (res.data?.success) {
        // Auto-deduct variant stock line upon booking
        if (d.coffin_id && selectedCoffin) {
          const currentStock = parseInt(selectedCoffin.quantity ?? selectedCoffin.stock) || 0;
          const reqQty = parseInt(d.quantity) || 1;
          const remaining = Math.max(0, currentStock - reqQty);
          try {
            await api.put(`/coffins/${d.coffin_id}`, { quantity: remaining });
          } catch (deductErr) {
            console.warn('Variant auto-deduct notice:', deductErr);
          }
        }

        if (isInterBranch) {
          try {
            const selBranchRec = branches.find((b) => b.id == selectedBranchId);
            const curBranchRec = branches.find((b) => b.id == currentBranch);
            await api.post('/coffins/stock-requests', {
              from_branch_id: selectedBranchId,
              to_branch_id: currentBranch,
              from_branch_name: selBranchRec?.name || null,
              to_branch_name: curBranchRec?.name || null,
              coffin_id: d.coffin_id,
              quantity: 1,
              client_name: d.client_name,
              client_phone: d.client_phone,
              deceased_name: d.deceased_name,
              service_date: serviceDate,
              notes: d.notes || 'Inter-branch reservation - transfer required',
              req_type: 'client',
            });
            const branchName =
              branches.find((b) => b.id == selectedBranchId)?.name || 'other branch';
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
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreateStockRequest = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const d = modal.data;
      // Direction semantics: the branch picked in the modal is the SOURCE that owns
      // the stock; MY branch is the requester/receiver. Never allow requesting from
      // my own branch.
      const sourceBranchId = d.from_branch_id || d.to_branch_id;
      if (!sourceBranchId || sourceBranchId == currentBranch) {
        toast.error('Please select a different branch to request from');
        setSubmitLoading(false);
        return;
      }
      const fromBranchRec = branches.find((b) => b.id == sourceBranchId); // Source branch
      const toBranchRec = branches.find((b) => b.id == currentBranch); // My branch (receiver)
      const res = await api.post('/coffins/stock-requests', {
        from_branch_id: sourceBranchId,
        to_branch_id: currentBranch,
        from_branch_name: fromBranchRec?.name || null,
        to_branch_name: toBranchRec?.name || null,
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
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStockAction = async (id, action) => {
    // -- Role guards --------------------------------------------------
    // from_branch_id = source/dispatcher · to_branch_id = requester/receiver.
    // 2-status flow: ONLY the SOURCE branch may approve; ONLY the
    // REQUESTING (receiving) branch may confirm "Delivered". No "In Transit".
    const req = stockRequests.find((r) => r.id === id || String(r.id) === String(id));
    if (req) {
      const isSource = req.from_branch_id == currentBranch;
      const isReceiver = req.to_branch_id == currentBranch;
      if (action === 'approve' && !isSource) {
        toast.error('Only the source branch can approve and dispatch this transfer');
        return;
      }
      if (action === 'delivered' && !isReceiver) {
        toast.error('Only the requesting branch can confirm delivery');
        return;
      }
    }
    try {
      const res = await api.post(`/coffins/stock-requests/${id}/${action}`);
      if (res.data?.success) {
        toast.success(
          action === 'delivered' ? 'Transfer received & Delivered' : action === 'approve' ? 'Request Approved & Dispatched' : `Request ${action}ed successfully`,
        );
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

  const openAdjustCoffinStock = (coffinId, mode = 'add') => {
    const coffin = coffins.find((item) => (item.coffin_id || item.id) == coffinId);
    if (!coffin) return;
    setModal({
      open: true,
      type: 'stockAdjust',
      data: {
        coffin_id: coffinId,
        name: coffin.name,
        current_stock: parseInt(coffin.stock) || 0,
        quantity: 1,
        mode,
      },
    });
  };

  const handleAdjustCoffinStock = async (e) => {
    e.preventDefault();
    const stockData = modal.data || {};
    const coffinId = stockData.coffin_id;
    const currentStock = parseInt(stockData.current_stock) || 0;
    const qty = parseInt(stockData.quantity) || 0;
    const mode = stockData.mode === 'remove' ? 'remove' : 'add';

    if (!coffinId) {
      toast.error('Coffin not selected');
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity greater than zero');
      return;
    }

    const nextStock = mode === 'add' ? currentStock + qty : currentStock - qty;
    if (nextStock < 0) {
      toast.error('Stock cannot go below zero');
      return;
    }

    try {
      const res = await api.put(`/coffins/${coffinId}`, { quantity: nextStock });
      if (res.data?.success) {
        toast.success(
          mode === 'add'
            ? `Added ${qty} unit${qty > 1 ? 's' : ''} to ${stockData.name || 'coffin'}`
            : `Removed ${qty} unit${qty > 1 ? 's' : ''} from ${stockData.name || 'coffin'}`,
        );
        setModal({ open: false, type: '', data: {} });
        fetchAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update coffin stock');
    }
  };

  // â”€â”€â”€ Filtered Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Coffins registered without a per-branch id (branch_id undefined) belong to the
  // current branch, so keep them visible. Otherwise match the selected branch.
  const branchCoffins = coffins.filter(
    (c) =>
      !currentBranch ||
      !c.branch_id ||
      c.branch_id === currentBranch ||
      c.branch_id == currentBranch,
  );
  const catalogTypeNames = typesCatalog.map((t) => t.name).filter(Boolean);
  const catalogColors = registeredColors.map((c) => c.name).filter(Boolean);

  const inventoryTypes = [...new Set([...catalogTypeNames, ...coffins.map((c) => c.type || c.name).filter(Boolean)])].sort();
  const inventoryColors = [...new Set([...catalogColors, ...coffins.map((c) => c.color).filter(Boolean)])].sort();

  // Cross-branch inventory metrics
  const branchInventoryStats = (branches || []).map((b) => {
    const branchItems = coffins.filter(
      (c) => String(c.branch_id) === String(b.id)
    );
    const totalUnits = branchItems.reduce((acc, c) => acc + getCoffinStock(c), 0);
    const lowStock = branchItems.filter((c) => getCoffinStock(c) > 0 && getCoffinStock(c) <= 2).length;
    const outOfStock = branchItems.filter((c) => getCoffinStock(c) <= 0).length;
    return {
      id: b.id,
      name: b.name,
      totalUnits,
      variantCount: branchItems.length,
      lowStock,
      outOfStock,
      items: branchItems,
    };
  });

  // Most booked coffin types analytics
  const mostBookedTypes = (() => {
    const counts = {};
    bookings.forEach((b) => {
      const matchedCoffin = coffins.find((c) => (c.coffin_id || c.id) == b.coffin_id);
      const typeName = String(
        b.coffin_name || b.coffin_type || b.type || matchedCoffin?.type || matchedCoffin?.name || 'Standard Casket'
      ).trim();
      const qty = parseInt(b.quantity, 10) || 1;
      counts[typeName] = (counts[typeName] || 0) + qty;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .map(([type, count]) => ({
        type,
        count,
        percent: Math.min(100, Math.round((count / total) * 100)),
      }))
      .sort((a, b) => b.count - a.count);
  })();

  // Most booked colors analytics
  const mostBookedColors = (() => {
    const counts = {};
    bookings.forEach((b) => {
      const matchedCoffin = coffins.find((c) => (c.coffin_id || c.id) == b.coffin_id);
      const colorName = String(
        b.color || matchedCoffin?.color || 'Classic Finish'
      ).trim();
      const qty = parseInt(b.quantity, 10) || 1;
      counts[colorName] = (counts[colorName] || 0) + qty;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .map(([color, count]) => {
        const det = detectColorRGB(color);
        return {
          color,
          hex: det.hex,
          rgbStr: det.rgbStr,
          isDark: det.isDark,
          count,
          percent: Math.min(100, Math.round((count / total) * 100)),
        };
      })
      .sort((a, b) => b.count - a.count);
  })();
  const bookableCoffins = coffins.filter((coffin) => {
    const matchesBranch = !coffin.branch_id || coffin.branch_id == (modal.data.branch_id || currentBranch);
    return matchesBranch;
  });
  const filteredBookingCoffins = bookableCoffins.filter((coffin) => {
    const query = bookingSearch.trim().toLowerCase();
    return !query || [coffin.name, coffin.type, coffin.color, coffin.size, coffin.custom_id, coffin.coffin_id]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });
  const selectedBookingCoffin = bookableCoffins.find(
    (coffin) => (coffin.coffin_id || coffin.id) == modal.data.coffin_id
  );
  // Mirrors `branchCoffins` above: a booking registered without a per-branch id
  // (branch_id NULL) is shared central inventory and must stay visible everywhere.
  // The server already scopes /coffins/orders to the current branch OR NULL, so we
  // must NOT re-filter out the NULL-branch rows client-side or every central booking
  // vanishes from the dashboard.
  const branchBookings = bookings.filter(
    (b) =>
      !currentBranch ||
      !b.branch_id ||
      b.branch_id === currentBranch ||
      b.branch_id == currentBranch,
  );

  const filteredCoffins = branchCoffins.filter((c) => {
    const stock = getCoffinStock(c);
    if (invQuery) {
      const ql = invQuery.toLowerCase();
      if (
        !c.name?.toLowerCase().includes(ql) &&
        !c.type?.toLowerCase().includes(ql) &&
        !(c.custom_id || c.coffin_id)?.toLowerCase().includes(ql) &&
        !c.size?.toLowerCase().includes(ql) &&
        !c.color?.toLowerCase().includes(ql) &&
        !c.material?.toLowerCase().includes(ql)
      )
        return false;
    }
    if (invTypeFilter !== 'all' && (c.type || c.name) !== invTypeFilter) return false;
    if (invColorFilter !== 'all' && c.color !== invColorFilter) return false;
    if (invFilter === 'available') return stock > 2;
    if (invFilter === 'low') return stock > 0 && stock <= 2;
    if (invFilter === 'out') return stock <= 0;
    return true;
  });

  const filteredBookings = branchBookings.filter((b) => {
    if (bkQuery) {
      const ql = bkQuery.toLowerCase();
      if (
        !b.client_name?.toLowerCase().includes(ql) &&
        !b.deceased_name?.toLowerCase().includes(ql)
      )
        return false;
    }
    if (bkFilter === 'unpaid') return !b.paid;
    if (bkFilter !== 'all') return b.status === bkFilter;
    return true;
  });

  const incomingRequests = stockRequests.filter((r) => r.to_branch_id == currentBranch);
  const outgoingRequests = stockRequests.filter((r) => r.from_branch_id == currentBranch);

  const totalStock = branchCoffins.reduce((s, c) => s + getCoffinStock(c), 0);
  const lowStockCount = branchCoffins.filter((c) => getCoffinStock(c) > 0 && getCoffinStock(c) <= 2).length;
  const outOfStockCount = branchCoffins.filter((c) => getCoffinStock(c) <= 0).length;
  const pendingBookingsCount = branchBookings.filter((b) => b.status === 'pending').length;

  // â”€â”€â”€ Drawer Views â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openDrawer = (title, content) => setDrawer({ open: true, title, content });
  const closeDrawer = () => setDrawer({ open: false, title: '', content: '' });

  const viewCoffin = (id) => {
    const c = coffins.find((x) => (x.coffin_id || x.id) == id);
    if (!c) return;
    const st = getStockStatus(c.stock);
    const reserved = bookings.filter(
      (b) => b.coffin_id == id && (b.status === 'pending' || b.status === 'booked'),
    ).length;
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
            ${branches
        .filter((b) => b.id != currentBranch)
        .map((b) => {
          const stock = coffins
            .filter((co) => co.branch_id == b.id && co.name === c.name)
            .reduce((sum, co) => sum + (parseInt(co.stock) || 0), 0);
          const color = stock > 2 ? S.success : stock > 0 ? S.warning : S.danger;
          return `<div style="${objToStr(styles.otherBranchItem)}">
                <span style="${objToStr(styles.branchTag)}"><span style="width:8px; height:8px; border-radius:50%; background:${color}; display:inline-block"></span>${b.name}</span>
                <strong>${stock} Available</strong>
              </div>`;
        })
        .join('')}
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-top:24px;">
          ${c.stock > 0 ? `<button class="drawer-btn btn-s" onclick="window.__openBookingModal('${c.coffin_id || c.id}')"><i class="fa-solid fa-calendar-plus"></i> Book Locally</button>` : ''}
          <button class="drawer-btn btn-w" onclick="window.__openFindStock('${c.name?.replace(/'/g, "\\'") || ''}')"><i class="fa-solid fa-network-wired"></i> Find Stock Elsewhere</button>
          <button class="drawer-btn btn-d" onclick="window.__deleteCoffin('${c.coffin_id || c.id}')"><i class="fa-solid fa-trash"></i> Delete Coffin</button>
          <button class="drawer-btn btn-g" onclick="window.__closeDrawer()">Close</button>
        </div>
      </div>`;
    openDrawer(c.name || 'Coffin Details', content);
  };

  const viewBooking = (id) => {
    const b = bookings.find((x) => x.id === id);
    if (!b) return;

    const c = b.coffin_id ? coffins.find((x) => (x.coffin_id || x.id) == b.coffin_id) : null;
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
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Unit Price</span><strong style="${objToStr(styles.detailRowStrong)}">${formatKES(c?.price || 0)}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Quantity</span><strong style="${objToStr(styles.detailRowStrong)}">${b.quantity || 1}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Total Price</span><strong style="${objToStr(styles.detailRowStrong)}">${formatKES((parseFloat(c?.price || 0) || 0) * (b.quantity || 1))}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Payment Status</span><strong><span class="inline-tag ${b.paid ? 'tag-ok' : 'tag-ou'}">${b.paid ? 'Paid' : 'Unpaid'}</span></strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Booking Status</span><strong><span class="inline-tag ${bs.cls}">${bs.label}</span></strong></div>
      </div>
      <div style="${objToStr(styles.detailSection)}">
        <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-sticky-note"></i> Notes</h4>
        <div style="background:${S.bg}; padding:12px; border-radius:8px; font-size:13px; color:#334155; border:1px solid ${S.border};">${b.notes || 'No notes provided'}</div>
      </div>
      <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-top:24px;">
        ${b.status === 'pending' ? `<button class="drawer-btn btn-s" onclick="window.__handleBookingStatus('${b.id}','booked')"><i class="fa-solid fa-check"></i> Approve Reservation</button>` : ''}
        ${b.status === 'pending' ? `<button class="drawer-btn btn-d" onclick="window.__handleBookingStatus('${b.id}','cancelled')"><i class="fa-solid fa-times"></i> Cancel Reservation</button>` : ''}
        ${b.status === 'booked' ? `<button class="drawer-btn btn-s" onclick="window.__handleBookingStatus('${b.id}','completed')"><i class="fa-solid fa-check-double"></i> Mark Completed</button>` : ''}
        ${!b.paid && b.status !== 'cancelled' ? `<button class="drawer-btn btn-w" onclick="window.__markPaid('${b.id}')"><i class="fa-solid fa-coins"></i> Mark as Paid</button>` : ''}
        <button class="drawer-btn btn-g" onclick="window.__closeDrawer()">Close</button>
      </div>`;
    openDrawer(`Reservation #${b.id}`, content);
  };

  const viewRequest = (id) => {
    const r = stockRequests.find((x) => x.id === id);
    if (!r) return;
    const c = coffins.find((x) => (x.coffin_id || x.id) == r.coffin_id);

    const stages = ['pending', 'approved', 'delivered'];
    const normReqStatus = ['transferring', 'transit', 'in-transit', 'in_transit'].includes(r.status)
      ? 'approved'
      : r.status;
    const currentStageIdx = stages.indexOf(normReqStatus);
    const stageLabels = ['Requested', 'Approved', 'Delivered'];
    const stageWidth = `${(100 / stageLabels.length).toFixed(2)}%`;

    let trackerHtml = `<div style="position:relative; margin:24px 0 32px;">
      <div style="position:absolute; top:16px; left:16px; right:16px; height:3px; background:${S.border}; z-index:0; border-radius:2px;"></div>
      <div style="display:flex; justify-content:space-between;">`;
    stageLabels.forEach((label, idx) => {
      let icon = (idx + 1).toString();
      if (idx < currentStageIdx) {
        icon = '<i class="fa-solid fa-check" style="font-size:12px"></i>';
      }
      const dotBg =
        idx < currentStageIdx ? S.success : idx === currentStageIdx ? S.primary : '#fff';
      const dotBorder =
        idx < currentStageIdx ? S.success : idx === currentStageIdx ? S.primary : S.border;
      const dotColor = idx < currentStageIdx || idx === currentStageIdx ? '#fff' : S.textMuted;
      const labelColor = idx <= currentStageIdx ? S.text : S.textMuted;
      trackerHtml += `<div style="display:flex; flex-direction:column; align-items:center; gap:8px; z-index:1; text-align:center; width:${stageWidth};">
        <div style="width:32px; height:32px; border-radius:50%; background:${dotBg}; border:3px solid ${dotBorder}; color:${dotColor}; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; transition:all 0.3s; ${idx === currentStageIdx ? 'transform:scale(1.1);' : ''}">${icon}</div>
        <div style="font-size:11px; font-weight:600; color:${labelColor}; text-transform:uppercase; letter-spacing:0.05em;">${label}</div>
      </div>`;
    });
    trackerHtml += `</div></div>`;

    let historyHtml = `<div style="background:${S.bg}; border:1px solid ${S.border}; border-radius:12px; padding:16px; margin-top:16px;">`;
    if (r.history && r.history.length > 0) {
      r.history.forEach((h, idx) => {
        const time = new Date(r.created_at || Date.now()).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
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

    const storedUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || '{}');
      } catch {
        return {};
      }
    })();
    const currentUserName =
      [storedUser.firstName, storedUser.lastName, storedUser.name, storedUser.fullName]
        .filter(Boolean)
        .join(' ') ||
      storedUser.email ||
      'Current user';
    const requestorName =
      r.requested_by_name ||
      r.requester_name ||
      r.requested_by ||
      r.requestedBy ||
      r.client_name ||
      currentUserName;
    const expectedDateRaw = r.expected_by || r.service_date || r.created_at;
    const fromBranchName =
      r.from_branch_name || branches.find((b) => b.id == r.from_branch_id)?.name || 'N/A';
    const toBranchName =
      r.to_branch_name || branches.find((b) => b.id == r.to_branch_id)?.name || 'N/A';
    const sameBranchRequest = String(r.from_branch_id || '') === String(r.to_branch_id || '');
    const routeLabel = sameBranchRequest
      ? 'Self / Internal request'
      : `${fromBranchName} â†’ ${toBranchName}`;

    const isIncoming = String(r.to_branch_id || '') === String(currentBranch || '');
    const isOutgoing = String(r.from_branch_id || '') === String(currentBranch || '');
    const directionLabel = isIncoming ? 'Incoming' : isOutgoing ? 'Outgoing' : 'Internal';
    const directionColor = isIncoming ? '#dcfce7' : '#dbeafe';
    const directionText = isIncoming ? '#166534' : '#1d4ed8';

    const content = `
      <div style="margin-bottom:20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="display:inline-flex; align-items:center; gap:6px; padding:7px 12px; border-radius:999px; background:${directionColor}; color:${directionText}; border:1px solid ${directionText}22; font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase;">${directionLabel}</span>
            <span style="display:inline-flex; align-items:center; gap:6px; padding:7px 12px; border-radius:999px; background:#f8fafc; color:#475569; border:1px solid ${S.border}; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">${sameBranchRequest ? 'Self Request' : 'Inter-branch'}</span>
          </div>
          <span style="font-size:11px; color:${S.textMuted}; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;">${r.request_id || r.id}</span>
        </div>

        <div style="background:linear-gradient(135deg, #111827 0%, #1f2937 100%); color:#fff; border-radius:18px; padding:18px 18px 14px; border:1px solid rgba(148,163,184,0.25); box-shadow:0 16px 30px rgba(15,23,42,0.18); margin-bottom:18px;">
          <div style="font-size:11px; color:rgba(255,255,255,0.7); font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:8px;">Coffin</div>
          <div style="font-size:22px; font-weight:800; letter-spacing:-0.04em; margin:0;">${c ? c.name : 'N/A'}</div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:12px; margin-top:18px; flex-wrap:wrap;">
            <div>
              <div style="font-size:11px; color:rgba(255,255,255,0.7); font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:4px;">Request</div>
              <div style="font-size:13px; font-weight:700;">${r.request_id || r.id}</div>
            </div>
            <div style="padding:8px 10px; border-radius:10px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#fff; font-size:12px; font-weight:700;">${getReqStatus(r.status).label}</div>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; margin-bottom:18px;">
        <div style="background:linear-gradient(135deg, #eff6ff, #dbeafe); border:1px solid #bfdbfe; border-radius:14px; padding:14px 16px;">
          <div style="font-size:11px; color:#1d4ed8; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:6px;">Requested By</div>
          <div style="font-size:15px; font-weight:700; color:#0f172a; line-height:1.3;">${requestorName}</div>
        </div>
        <div style="background:linear-gradient(135deg, #f8fafc, #e2e8f0); border:1px solid #cbd5e1; border-radius:14px; padding:14px 16px;">
          <div style="font-size:11px; color:#475569; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:6px;">Expected Date</div>
          <div style="font-size:15px; font-weight:700; color:#0f172a;">${formatDate(expectedDateRaw)}</div>
        </div>
        <div style="background:linear-gradient(135deg, #ecfdf5, #d1fae5); border:1px solid #a7f3d0; border-radius:14px; padding:14px 16px;">
          <div style="font-size:11px; color:#047857; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:6px;">Status</div>
          <div style="font-size:15px; font-weight:700; color:#065f46;">${getReqStatus(r.status).label}</div>
        </div>
      </div>

      <div style="${objToStr(styles.detailSection)}">
        <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-route"></i> Route</h4>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; background:${S.bg}; border:1px solid ${S.border}; border-radius:12px; margin-bottom:12px;">
          <div>
            <div style="font-size:11px; color:${S.textMuted}; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:4px;">Transfer</div>
            <div style="font-size:15px; font-weight:800; color:${S.text};">${routeLabel}</div>
          </div>
          <div style="padding:8px 10px; background:#fff; border:1px solid ${S.border}; border-radius:8px; color:${S.primary}; font-weight:700; font-size:12px;">${sameBranchRequest ? 'Self request' : 'Inter-branch'}</div>
        </div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Origin</span><strong style="${objToStr(styles.detailRowStrong)}">${sameBranchRequest ? `${fromBranchName} (self)` : fromBranchName}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Destination</span><strong style="${objToStr(styles.detailRowStrong)}">${sameBranchRequest ? `${toBranchName} (self)` : toBranchName}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Receiver / To</span><strong style="${objToStr(styles.detailRowStrong)}">${sameBranchRequest ? `${toBranchName} (self)` : toBranchName}</strong></div>
      </div>

      <div style="${objToStr(styles.detailSection)}">
        <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-box"></i> Shipment Details</h4>
        <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px;">
          <div style="padding:12px; background:${S.bg}; border:1px solid ${S.border}; border-radius:10px;">
            <div style="font-size:11px; color:${S.textMuted}; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:4px;">Quantity</div>
            <div style="font-size:14px; font-weight:700; color:${S.text};">${r.quantity || 1} Unit</div>
          </div>
          <div style="padding:12px; background:${S.bg}; border:1px solid ${S.border}; border-radius:10px;">
            <div style="font-size:11px; color:${S.textMuted}; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:4px;">Coffin</div>
            <div style="font-size:14px; font-weight:700; color:${S.text};">${c ? c.name : 'N/A'}</div>
          </div>
          <div style="padding:12px; background:${S.bg}; border:1px solid ${S.border}; border-radius:10px;">
            <div style="font-size:11px; color:${S.textMuted}; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:4px;">From</div>
            <div style="font-size:14px; font-weight:700; color:${S.text};">${sameBranchRequest ? `${fromBranchName} (self)` : fromBranchName}</div>
          </div>
          <div style="padding:12px; background:${S.bg}; border:1px solid ${S.border}; border-radius:10px;">
            <div style="font-size:11px; color:${S.textMuted}; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:4px;">To</div>
            <div style="font-size:14px; font-weight:700; color:${S.text};">${sameBranchRequest ? `${toBranchName} (self)` : toBranchName}</div>
          </div>
        </div>
      </div>

      <div style="${objToStr(styles.detailSection)}">
        <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-exchange-alt"></i> Transfer Info</h4>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Type</span><strong style="${objToStr(styles.detailRowStrong)}">${r.req_type === 'client' ? 'Client Reservation' : 'Stock Replenishment'}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Request ID</span><strong style="${objToStr(styles.detailRowStrong)}">${r.request_id || r.id}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Requested By</span><strong style="${objToStr(styles.detailRowStrong)}">${requestorName}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Expected Date</span><strong style="${objToStr(styles.detailRowStrong)}">${formatDate(expectedDateRaw)}</strong></div>
        <div style="${objToStr(styles.detailRow)}"><span style="${objToStr(styles.detailRowSpan)}">Status</span><strong><span class="inline-tag ${getReqStatus(r.status).cls}">${getReqStatus(r.status).label}</span></strong></div>
      </div>

      <div style="${objToStr(styles.detailSection)}">
        <h4 style="${objToStr(styles.detailSectionH4)}"><i class="fa-solid fa-sticky-note"></i> Reason</h4>
        <div style="background:${S.bg}; padding:12px; border-radius:8px; font-size:13px; color:#334155; border:1px solid ${S.border};">${r.notes || 'No reason provided'}</div>
      </div>
      <h4 style="font-size:13px; font-weight:700; margin-top:24px; margin-bottom:12px; color:${S.textMuted}; text-transform:uppercase; letter-spacing:0.05em;">Timeline</h4>
      ${trackerHtml}
      ${historyHtml}
      <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-top:24px;">
        ${r.status === 'pending' && r.from_branch_id == currentBranch ? `<button class="drawer-btn btn-s" onclick="window.__handleStockAction('${r.id}','approve')"><i class="fa-solid fa-check"></i> Approve & Dispatch</button>` : ''}
        ${r.status === 'pending' && r.from_branch_id == currentBranch ? `<button class="drawer-btn btn-d" onclick="window.__handleStockAction('${r.id}','rejected')"><i class="fa-solid fa-times"></i> Reject</button>` : ''}
        ${r.status === 'approved' && r.to_branch_id == currentBranch ? `<button class="drawer-btn btn-s" onclick="window.__handleStockAction('${r.id}','delivered')"><i class="fa-solid fa-check-double"></i> Delivered Now</button>` : ''}
        ${r.status === 'approved' && r.from_branch_id == currentBranch ? `<div style="font-size:12px; color:#64748b; font-style:italic; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-hourglass-half"></i> Approved — awaiting ${r.to_branch_name || 'the requesting branch'} to confirm delivery</div>` : ''}
        <button class="drawer-btn btn-g" onclick="window.__closeDrawer()">Close</button>
      </div>`;
    openDrawer(`Transfer Request #${r.id}`, content);
  };

  // â”€â”€â”€ Find Stock in Other Branches â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [interSearch, setInterSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const openFindStock = async (searchQuery = '') => {
    setInterSearch(searchQuery);
    setSelectedBranch('');

    const parentSlug = getParentTenantSlug();
    const otherBranches = branches.filter((b) => b.id != currentBranch);

    console.log(
      '[FindStock] Current branch:',
      currentBranch,
      'Other branches:',
      otherBranches.length,
      'Parent slug:',
      parentSlug,
    );

    // Show loading state
    openDrawer(
      'Find Stock in Other Branches',
      `
      <div style="text-align:center; padding:40px 20px;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size:32px; color:${S.primary};"></i>
        <p style="margin-top:16px; color:${S.textMuted}; font-size:14px;">Loading inventory from all branches...</p>
      </div>
    `,
    );

    try {
      // Fetch coffins from ALL branch databases using parent slug + tenant id (UUID).
      // Tenant id guarantees branch rows (written with tenant_slug = <branch slug>)
      // are included alongside head-office rows for the same tenant.
      const tenantId = getTenantId();
      const res = await api.get('/coffins/all-branches', {
        params: { parent_slug: parentSlug, tenant_id: tenantId || undefined },
      });

      if (res.data?.success && res.data?.data) {
        const allCoffins = res.data.data;
        // Cache it globally for the render function
        window.__interBranchCoffins = allCoffins;
        console.log(
          '[FindStock] Loaded',
          allCoffins.length,
          'coffins from',
          res.data.branches,
          'branches',
        );

        if (allCoffins.length === 0) {
          openDrawer(
            'Find Stock in Other Branches',
            `
            <div style="text-align:center; padding: 0px;">
              <i class="fa-solid fa-box-open" style="font-size:48px; color:${S.textMuted}; margin-bottom:16px; opacity:0.5;"></i>
              <h3 style="font-size:16px; font-weight:700; color:${S.text}; margin:0 0 8px;">No Coffins Found</h3>
              <p style="font-size:14px; color:${S.textMuted}; margin:0;">No coffins available in other branches.</p>
              <p style="font-size:12px; color:${S.textMuted}; margin:8px 0 0;">Checked ${otherBranches.length} branches</p>
            </div>
          `,
          );
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
                ${otherBranches.map((b) => `<option value="${b.id}">${b.name}</option>`).join('')}
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
        openDrawer(
          'Find Stock in Other Branches',
          `
          <div style="text-align:center; padding:40px 20px;">
            <i class="fa-solid fa-circle-exclamation" style="font-size:48px; color:${S.warning}; margin-bottom:16px;"></i>
            <h3 style="font-size:16px; font-weight:700; color:${S.text}; margin:0 0 8px;">Unable to Load</h3>
            <p style="font-size:14px; color:${S.textMuted}; margin:0;">Failed to load branch inventory. Please try again.</p>
          </div>
        `,
        );
      }
    } catch (err) {
      console.error('[FindStock] Error:', err);
      openDrawer(
        'Find Stock in Other Branches',
        `
        <div style="text-align:center; padding:40px 20px;">
          <i class="fa-solid fa-circle-exclamation" style="font-size:48px; color:${S.danger}; margin-bottom:16px;"></i>
          <h3 style="font-size:16px; font-weight:700; color:${S.text}; margin:0 0 8px;">Error Loading Inventory</h3>
          <p style="font-size:14px; color:${S.textMuted}; margin:0;">${err.response?.data?.message || err.message || 'Please try again later.'}</p>
        </div>
      `,
      );
    }
  };

  const renderInterResults = (query, branchFilter) => {
    const coffinsToSearch = window.__interBranchCoffins || [];

    const results = coffinsToSearch.filter((c) => {
      // "Find in Other Branches" must not surface the CURRENT branch's own stock —
      // that stock is already shown in the Inventory tab / Reservation dropdown.
      if (c.branch_id && c.branch_id == currentBranch) return false;
      if (branchFilter && String(c.branch_id || '') != String(branchFilter)) return false;
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
      html += results
        .map((c) => {
          const stock = parseInt(c.stock) || 0;
          const stockColor = stock > 2 ? S.success : stock > 0 ? S.warning : S.danger;
          const stockBg = stock > 2 ? S.successLight : stock > 0 ? S.warningLight : S.dangerLight;
          const stockLabel = stock > 2 ? 'Available' : stock > 0 ? 'Low Stock' : 'Out of Stock';

          // Resolve the owning branch from the live branch list first — the row
          // may only carry a generic branch_name.
          const br = branches.find((x) => x && (x.id == c.branch_id || x.branch_id == c.branch_id
            || x.branch_slug === c.branch_slug || x.slug === c.branch_slug));
          const branchLabel = br?.name || br?.branch_name || c.branch_name || c.branch_slug || 'Unknown';

          // One soft chip per attribute instead of a "|"-separated run-on line.
          const meta = [
            `<span style="display:inline-flex; align-items:center; gap:5px;"><i class="fa-solid fa-building" style="font-size:10px; opacity:0.7;"></i>${branchLabel}</span>`,
            `<span style="display:inline-flex; align-items:center; gap:5px; font-weight:600; color:${S.text};"><i class="fa-solid fa-tag" style="font-size:10px; opacity:0.7;"></i>${formatKES(c.price)}</span>`,
            c.size ? `<span style="display:inline-flex; align-items:center; gap:5px;"><i class="fa-solid fa-ruler" style="font-size:10px; opacity:0.7;"></i>${c.size}</span>` : '',
            c.color ? `<span style="display:inline-flex; align-items:center; gap:5px;"><i class="fa-solid fa-palette" style="font-size:10px; opacity:0.7;"></i>${c.color}</span>` : '',
          ].filter(Boolean).join('');

          return `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; padding:14px 16px; border:1px solid ${S.border}; border-radius:10px; background:#fff; transition:all 0.2s; flex-wrap:wrap;">
            <div style="display:flex; gap:14px; align-items:center; min-width:0; flex:1 1 240px;">
              <div style="width:40px; height:40px; background:${S.primaryLight}; border-radius:10px; display:flex; align-items:center; justify-content:center; color:${S.primary}; font-weight:800; font-size:16px; flex-shrink:0;">
                ${c.name?.charAt(0) || '?'}
              </div>
              <div style="min-width:0;">
                <div style="font-weight:600; color:${S.text}; font-size:14px; margin-bottom:5px; overflow-wrap:anywhere;">${c.name}</div>
                <div style="font-size:12px; color:${S.textMuted}; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                  ${meta}
                </div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:12px; flex-shrink:0; margin-left:auto;">
              <span style="display:inline-flex; align-items:center; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; background:${stockBg}; color:${stockColor}; white-space:nowrap;">
                ${stock} ${stockLabel}
              </span>
              ${stock > 0
              ? `<button class="drawer-btn btn-p btn-sm" style="width:auto; padding:8px 14px; white-space:nowrap;" onclick="window.__reserveInterBranch('${c.coffin_id || c.id}')">
                  <i class="fa-solid fa-paper-plane"></i> Request
                </button>`
              : `<span style="font-size:12px; color:${S.textMuted}; font-weight:600; white-space:nowrap;">Unavailable</span>`
            }
            </div>
          </div>
        `;
        })
        .join('');
    }

    const el = document.getElementById('interResults');
    if (el) el.innerHTML = html;
  };

  // â”€â”€â”€ Expose to window for drawer HTML buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    window.__closeDrawer = closeDrawer;
    window.__openBookingModal = (coffinId) => {
      closeDrawer();
      setModal({
        open: true,
        type: 'booking',
        data: {
          coffin_id: coffinId,
          service_date: todayKey(),
          service_time: String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0'),
        },
      });
    };
    window.__openFindStock = (query) => {
      closeDrawer();
      setTimeout(() => openFindStock(query), 300);
    };
    window.__deleteCoffin = handleDeleteCoffin;
    window.__handleBookingStatus = handleBookingStatus;
    window.__handleStockAction = handleStockAction;
    window.__markPaid = async (id) => {
      const b = bookings.find((x) => x.id === id);
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
      const c = (window.__interBranchCoffins || []).find((x) => (x.coffin_id || x.id) == cid);
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
                From <strong>${branches.find((b) => b.id == c.branch_id)?.name || c.branch_name || 'other branch'}</strong> • ${formatKES(c.price)}
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
        
        <button class="drawer-btn btn-p btn-w-full" onclick="window.__submitInterReserve('${c.coffin_id || c.id}')" style="margin-top:8px; padding:14px; font-size:14px;">
          <i class="fa-solid fa-paper-plane"></i> Send Transfer Request
        </button>
      `;
      openDrawer('Request Coffin Transfer', content);
    };

    window.__submitInterReserve = async (cid) => {
      const c = (window.__interBranchCoffins || []).find((x) => (x.coffin_id || x.id) == cid);
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

        if (c.branch_id && c.branch_id == currentUserBranchId) {
          toast.error('This coffin is already in your branch - no transfer needed');
          return;
        }

        // Direction semantics: the branch OWNING the coffin is the SOURCE
        // (from_branch_id); MY branch is the requester/destination
        // (to_branch_id) and is the only side that can confirm delivery.
        const fromBranch = branches.find((b) => b.id == c.branch_id);
        const toBranch = branches.find((b) => b.id == currentUserBranchId);

        const res = await api.post('/coffins/stock-requests', {
          from_branch_id: fromBranch?.id || c.branch_id, // Source branch ID (FK)
          to_branch_id: toBranch?.id || currentUserBranchId, // My branch receives (FK)
          from_branch_name: fromBranch?.name || c.branch_name || null, // Friendly name e.g. "Machakos"
          to_branch_name: toBranch?.name || null, // Friendly name e.g. "Nairobi"
          coffin_id: cid,
          quantity: parseInt(quantity) || 1,
          client_name: client,
          client_phone: phone,
          service_date: expectedDate || null,
          notes: reason || 'Inter-branch stock request',
          req_type: 'client',
          requested_by: userEmail, // Auto-populate from logged-in user
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

  // â”€â”€â”€ Render Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pendingReqCount = stockRequests.filter(
    (r) =>
      r.status === 'pending' &&
      (r.from_branch_id == currentBranch || r.to_branch_id == currentBranch),
  ).length;

  // â”€â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) {
    return (
      <div style={styles.W}>
        <div style={styles.loading}>
          <div
            style={{
              width: 20,
              height: 20,
              border: '2px solid #e8ecf1',
              borderTopColor: S.primary,
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          ></div>
          Loading coffin inventory...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // â”€â”€â”€ Error State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (error) {
    return (
      <div style={styles.W}>
        <div style={styles.es}>
          <i
            className="fa-solid fa-exclamation-triangle"
            style={{ ...styles.esIcon, color: S.danger, opacity: 1 }}
          ></i>
          <p style={styles.esP}>Error loading coffin inventory</p>
          <p style={{ fontSize: 12, color: S.textMuted, marginTop: 8 }}>{error}</p>
          <button style={{ ...styles.btn, ...styles.btnP, marginTop: 16 }} onClick={() => fetchAllData()}>
            <i className="fa-solid fa-redo"></i> Retry
          </button>
        </div>
      </div>
    );
  }
  const renderInventory = () => (
    <>
      {/* Quick Action Toolbar for Coffin Types, Colors & Stock */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          background: '#ffffff',
          border: `1px solid ${S.border}`,
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: S.text, display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fa-solid fa-boxes-stacked" style={{ color: S.primary }}></i>
            Coffin Inventory &amp; Variant Management
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: S.textMuted }}>
            Register coffin types, color finishes with RGB detection, track branch distribution, and view booking trends
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() =>
              setModal({ open: true, type: 'coffin', data: { stock: 0, price: 0 } })
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 15px',
              borderRadius: 8,
              border: 'none',
              background: S.primary,
              color: '#ffffff',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15,118,110,0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <i className="fa-solid fa-plus"></i>
            Add Coffin Variant
          </button>

          {/* Manage & Register Dropdown */}
          <div ref={invMenuRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              onClick={() => setInvMenuOpen(!invMenuOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 15px',
                borderRadius: 8,
                border: `1px solid ${invMenuOpen ? S.primary : S.border}`,
                background: invMenuOpen ? '#f1f5f9' : '#f8fafc',
                color: S.text,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="fa-solid fa-sliders" style={{ color: S.primary }}></i>
              <span>Register &amp; Manage</span>
              <i className={`fa-solid fa-chevron-${invMenuOpen ? 'up' : 'down'}`} style={{ fontSize: 10, color: S.textMuted }}></i>
            </button>

            {invMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: '#ffffff',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                  minWidth: 240,
                  zIndex: 100,
                  padding: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 7,
                    border: 'none',
                    background: 'transparent',
                    color: '#0f172a',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => {
                    setInvMenuOpen(false);
                    setModal({
                      open: true,
                      type: 'registerTypes',
                      data: { name: '', description: '', selectedColors: [] },
                    });
                  }}
                >
                  <i className="fa-solid fa-shapes" style={{ color: S.primary, width: 16 }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Register Types</div>
                    <div style={{ fontSize: 11, color: S.textMuted }}>{typesCatalog.length} models registered</div>
                  </div>
                </button>

                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 7,
                    border: 'none',
                    background: 'transparent',
                    color: '#0f172a',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => {
                    setInvMenuOpen(false);
                    setModal({
                      open: true,
                      type: 'registerColors',
                      data: { colorName: '', customHex: '#111111' },
                    });
                  }}
                >
                  <i className="fa-solid fa-palette" style={{ color: '#8b5cf6', width: 16 }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Register Colors</div>
                    <div style={{ fontSize: 11, color: S.textMuted }}>{registeredColors.length} color finishes</div>
                  </div>
                </button>

                <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 7,
                    border: 'none',
                    background: 'transparent',
                    color: '#0f172a',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => {
                    setInvMenuOpen(false);
                    openFindStock();
                  }}
                >
                  <i className="fa-solid fa-network-wired" style={{ color: '#2563eb', width: 16 }}></i>
                  <span>Find in Other Branches</span>
                </button>

                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 7,
                    border: 'none',
                    background: 'transparent',
                    color: '#0f172a',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => {
                    setInvMenuOpen(false);
                    fetchAllData();
                  }}
                >
                  <i className="fa-solid fa-arrows-rotate" style={{ color: S.textMuted, width: 16 }}></i>
                  <span>Refresh Inventory</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Stat Cards */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, background: '#1e3a8a' }}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Total Stock</span>
            <div style={styles.statIcon}>
              <i className="fa-solid fa-boxes-stacked"></i>
            </div>
          </div>
          <div style={styles.statValue}>{totalStock}</div>
          <div style={styles.statSubtext}>Units available</div>
        </div>

        <div style={{ ...styles.statCard, background: '#15803d' }}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Coffin Variants</span>
            <div style={styles.statIcon}>
              <i className="fa-solid fa-tags"></i>
            </div>
          </div>
          <div style={styles.statValue}>{branchCoffins.length}</div>
          <div style={styles.statSubtext}>Types, colors and sizes</div>
        </div>

        <div style={{ ...styles.statCard, background: '#d97706' }}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Low Stock</span>
            <div style={styles.statIcon}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
          <div style={styles.statValue}>{lowStockCount}</div>
          <div style={styles.statSubtext}>Needs restocking</div>
        </div>

        <div style={{ ...styles.statCard, background: '#b91c1c' }}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Out of Stock</span>
            <div style={styles.statIcon}>
              <i className="fa-solid fa-times-circle"></i>
            </div>
          </div>
          <div style={styles.statValue}>{outOfStockCount}</div>
          <div style={styles.statSubtext}>Unavailable items</div>
        </div>
      </div>

      {branchCoffins.length === 0 && coffins.length > 0 && (
        <div
          style={{
            background: S.warningLight,
            border: '1px solid #fcd34d',
            color: '#92400e',
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <i className="fa-solid fa-info-circle" style={{ fontSize: 20 }}></i>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
              No coffins in {branches.find((b) => b.id == currentBranch)?.name || 'this branch'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>
              There are {coffins.length} coffins in other branches. Use "Find in Other Branches" to
              search and request stock.
            </p>
          </div>
          <button
            style={{ ...styles.btn, ...styles.btnP, ...styles.btnSm, whiteSpace: 'nowrap' }}
            onClick={() => openFindStock()}
          >
            <i className="fa-solid fa-network-wired"></i> Find Stock
          </button>
        </div>
      )}

      {/* Cross-Branch Inventory Distribution */}
      <div
        style={{
          background: '#ffffff',
          border: `1px solid ${S.border}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {branchInventoryStats.map((bStat) => {
            const isCurrent = String(bStat.id) === String(currentBranch);
            return (
              <div
                key={bStat.id}
                style={{
                  background: isCurrent ? '#f0fdfa' : '#f8fafc',
                  border: `1.5px solid ${isCurrent ? S.primary : '#e2e8f0'}`,
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong style={{ fontSize: 14, color: S.text }}>{bStat.name}</strong>
                    {isCurrent ? (
                      <span style={{ background: S.primary, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                        Current
                      </span>
                    ) : (
                      <span style={{ background: '#e2e8f0', color: '#475569', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>
                        Remote
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: isCurrent ? S.primary : S.text }}>
                      {bStat.totalUnits}
                    </span>
                    <span style={{ fontSize: 12, color: S.textMuted, fontWeight: 500 }}>units in stock</span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: S.textMuted, marginBottom: 12 }}>
                    <span><i className="fa-solid fa-tags"></i> {bStat.variantCount} models</span>
                    {bStat.lowStock > 0 && (
                      <span style={{ color: S.warning, fontWeight: 600 }}>
                        <i className="fa-solid fa-triangle-exclamation"></i> {bStat.lowStock} low
                      </span>
                    )}
                    {bStat.outOfStock > 0 && (
                      <span style={{ color: S.danger, fontWeight: 600 }}>
                        <i className="fa-solid fa-circle-xmark"></i> {bStat.outOfStock} out
                      </span>
                    )}
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => fetchAllData(bStat.id)}
                    style={{
                      background: '#fff',
                      border: `1px solid ${S.border}`,
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: S.text,
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <i className="fa-solid fa-arrow-right"></i> View Branch Inventory
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* Most Booked Popularity Insights (Types & Colors) */}
      <div
        style={{
          background: '#ffffff',
          border: `1px solid ${S.border}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: S.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-chart-simple" style={{ color: '#ec4899' }}></i>
            Most Booked Coffin Types &amp; Colors Analytics
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: S.textMuted }}>
            Real booking trends showing the most preferred casket models and color finishes
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Most Booked Types */}
          <div style={{ background: '#f8fafc', border: `1px solid ${S.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: S.text, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span><i className="fa-solid fa-shapes" style={{ color: S.primary, marginRight: 6 }}></i> Most Booked Types</span>
              <span style={{ fontSize: 11, color: S.textMuted }}>Total {bookings.length} reservations</span>
            </div>

            {mostBookedTypes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: S.textMuted, fontSize: 12 }}>
                No coffin bookings recorded yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {mostBookedTypes.slice(0, 5).map((item, idx) => (
                  <div key={item.type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: idx === 0 ? '#fef08a' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#fed7aa' : '#f1f5f9',
                            color: idx === 0 ? '#854d0e' : '#475569',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10.5,
                            fontWeight: 800,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <strong style={{ fontSize: 13, color: S.text }}>{item.type}</strong>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: S.text }}>
                        {item.count} {item.count === 1 ? 'booked' : 'booked'} ({item.percent}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${item.percent}%`,
                          height: '100%',
                          background: idx === 0 ? S.primary : idx === 1 ? '#0ea5e9' : '#6366f1',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most Booked Colors */}
          <div style={{ background: '#f8fafc', border: `1px solid ${S.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: S.text, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span><i className="fa-solid fa-palette" style={{ color: '#8b5cf6', marginRight: 6 }}></i> Most Booked Colors</span>
              <span style={{ fontSize: 11, color: S.textMuted }}>Popular finishes</span>
            </div>

            {mostBookedColors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: S.textMuted, fontSize: 12 }}>
                No color selections recorded yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {mostBookedColors.slice(0, 5).map((item, idx) => (
                  <div key={item.color}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: item.hex,
                            border: '1.5px solid rgba(0,0,0,0.2)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            flexShrink: 0,
                          }}
                        />
                        <strong style={{ fontSize: 13, color: S.text }}>{item.color}</strong>
                        <span style={{ fontSize: 10, color: S.textMuted, fontFamily: 'monospace' }}>
                          {item.hex}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: S.text }}>
                        {item.count} {item.count === 1 ? 'booked' : 'booked'} ({item.percent}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${item.percent}%`,
                          height: '100%',
                          background: item.hex || '#8b5cf6',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={styles.tw}>
        <div style={styles.tt}>
          <div style={styles.sbox}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: S.textMuted }}></i>
            <input
              style={styles.sboxInput}
              placeholder="Search coffin type, color, name, or ID..."
              value={invQuery}
              onChange={(e) => setInvQuery(e.target.value)}
            />
          </div>
          <select
            style={{ ...styles.fs, width: 'auto', minWidth: 145 }}
            aria-label="Filter inventory by coffin type"
            value={invTypeFilter}
            onChange={(e) => setInvTypeFilter(e.target.value)}
          >
            <option value="all">All types</option>
            {inventoryTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select
            style={{ ...styles.fs, width: 'auto', minWidth: 135 }}
            aria-label="Filter inventory by color"
            value={invColorFilter}
            onChange={(e) => setInvColorFilter(e.target.value)}
          >
            <option value="all">All colors</option>
            {inventoryColors.map((color) => <option key={color} value={color}>{color}</option>)}
          </select>
          <div style={styles.ff}>
            {[
              ['all', 'All'],
              ['available', 'Available'],
              ['low', 'Low'],
              ['out', 'Out'],
            ].map((f) => (
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
                <th style={styles.th}>Available stock</th>
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
                          <i className="fa-solid fa-network-wired"></i> Find "{invQuery}" in other
                          branches
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCoffins.map((coffin) => {
                  const stock = getCoffinStock(coffin);
                  const st = getStockStatus(stock);
                  const id = coffin.coffin_id || coffin.id;
                  return (
                    <tr key={id}>
                      <td style={styles.td}>
                        <div style={styles.ci}>
                          <div style={styles.thumb}>
                            {coffin.primary_image ? (
                              <img
                                src={getCoffinImageUrl(coffin.primary_image)}
                                alt={`${coffin.type || coffin.name || 'Coffin'} variant`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                              />
                            ) : (
                              (coffin.type || coffin.name)?.charAt(0) || '?'
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ ...styles.cname, overflowWrap: 'anywhere' }}>{coffin.type || coffin.name}</div>
                            <div style={styles.sku}>
                              {coffin.color && (
                                <span
                                  title={`${coffin.color} (${detectColorRGB(coffin.color).rgbStr})`}
                                  style={{
                                    display: 'inline-block',
                                    width: 9,
                                    height: 9,
                                    borderRadius: '50%',
                                    background: detectColorRGB(coffin.color).hex,
                                    marginRight: 6,
                                    border: '1px solid rgba(0,0,0,0.25)',
                                    verticalAlign: 'middle',
                                  }}
                                />
                              )}
                              {coffin.color || 'Color not set'}{coffin.size ? ` · ${coffin.size}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          fontSize: 12,
                          fontWeight: 600,
                          color: S.textMuted,
                          fontFamily: 'monospace',
                        }}
                      >
                        {coffin.custom_id || coffin.coffin_id || '—'}
                      </td>
                      <td style={styles.td}>
                        {(() => {
                          // Built as chips rather than the previous fixed
                          // column of rows: a coffin with only a size used to
                          // render the same 4-line-tall cell as one with all
                          // four attributes, so the table had a ragged,
                          // low-density rhythm. These wrap to fit the data.
                          const details = [
                            coffin.type ? ['Type', coffin.type] : null,
                            coffin.size ? ['Size', coffin.size] : null,
                            coffin.color ? ['Color', coffin.color] : null,
                            coffin.material ? ['Material', coffin.material] : null,
                            coffin.category ? ['Category', coffin.category] : null,
                          ].filter(Boolean);
                          if (details.length === 0) {
                            return (
                              <span style={{ color: S.textLight, fontStyle: 'italic', fontSize: 12.5 }}>
                                No additional details
                              </span>
                            );
                          }
                          return (
                            <div style={styles.cdetail}>
                              {details.map(([k, v]) => (
                                <span key={k} style={styles.cchip} title={`${k}: ${v}`}>
                                  <span style={styles.cchipKey}>{k}</span>
                                  {k === 'Color' && (
                                    <span style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      background: detectColorRGB(v).hex,
                                      marginRight: 4,
                                      border: '1px solid rgba(0,0,0,0.2)',
                                      display: 'inline-block',
                                      verticalAlign: 'middle'
                                    }} />
                                  )}
                                  {v}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{formatKES(coffin.price)}</td>
                      <td
                        style={{
                          ...styles.td,
                          fontWeight: 700,
                          color:
                            stock <= 0
                              ? S.danger
                              : stock <= 2
                                ? S.warning
                                : S.success,
                        }}
                      >
                        <div>{stock}</div>
                        <div style={{ color: S.textMuted, fontSize: 11, fontWeight: 500, marginTop: 3 }}>
                          On hand {Math.max(0, Number(coffin.quantity_on_hand ?? stock + (Number(coffin.quantity_reserved) || 0)) || 0)}
                          {' · '}Reserved {Math.max(0, Number(coffin.quantity_reserved) || 0)}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <Tag cls={st.cls}>{st.label}</Tag>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            style={{ ...styles.btn, ...styles.btnS, ...styles.btnSm, background: '#059669' }}
                            onClick={() => openAdjustCoffinStock(id, 'add')}
                            title="Add stock"
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                          <button
                            style={{ ...styles.btn, ...styles.btnD, ...styles.btnSm, background: '#dc2626' }}
                            onClick={() => openAdjustCoffinStock(id, 'remove')}
                            title="Subtract stock"
                            disabled={stock <= 0}
                          >
                            <i className="fa-solid fa-minus"></i>
                          </button>
                          {stock > 0 && (
                            <button
                              style={{ ...styles.btn, ...styles.btnS, ...styles.btnSm }}
                              onClick={() =>
                                setModal({
                                  open: true,
                                  type: 'booking',
                                  data: {
                                    coffin_id: id,
                                    service_date: todayKey(),
                                    service_time: String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0'),
                                  },
                                })
                              }
                            >
                              Book
                            </button>
                          )}
                          {stock <= 0 && (
                            <button
                              style={{ ...styles.btn, ...styles.btnW, ...styles.btnSm }}
                              onClick={() => openFindStock(coffin.name)}
                            >
                              Find Stock
                            </button>
                          )}
                          {stock > 0 && (
                            <button
                              style={{
                                ...styles.btn,
                                ...styles.btnW,
                                ...styles.btnSm,
                                padding: '6px 10px',
                              }}
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

      // â”€â”€â”€ Render sections via shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // Transfers tab UI extracted into ./coffinTransfers.jsx (rendered inside the ReservationDashboard shell below)

      // â”€â”€â”€ Main Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        .inline-tag.tag-bo { background: #eff6ff; color: #00296b; }
        .inline-tag.tag-co { background: #fce7f3; color: #5f0f40; }
        .inline-tag.tag-ca { background: #fee2e2; color: #dd2d4a; }
        .inline-tag.tag-ar { background: #eff6ff; color: #00296b; }
        .inline-tag.tag-tr { background: ${S.warningLight}; color: ${S.warning}; }
        .inline-tag.tag-de { background: ${S.successLight}; color: ${S.success}; }
        tr:hover td { background: #f1f5f9; }
      `}</style>

        <ToastContainer position="top-center" autoClose={3000} />


        {/* Tab content: ReservationDashboard IS the page shell - its hoisted toolbar hosts the top navigation */}
        {/* Full-height, uncapped: the shell always fills the entire screen and scrolls internally. */}
        <div
          style={{
            height: '100vh',
            minHeight: 0,
            overflow: 'hidden',
            borderRadius: 0,
            border: 'none',
            boxShadow: 'none',
            background: 'transparent',
          }}
        >
          <ReservationDashboard
            bookings={branchBookings}
            coffins={coffins}
            branches={branches}
            formatPrice={formatKES}
            onNewReservation={(selectedDate) => {
              const now = new Date();
              const hh = String(now.getHours()).padStart(2, '0');
              const mm = String(now.getMinutes()).padStart(2, '0');
              setModal({
                open: true,
                type: 'booking',
                data: {
                  service_date: selectedDate ? toDateKey(selectedDate) : todayKey(),
                  service_time: hh + ':' + mm,
                },
              });
            }}
            onViewBooking={(id) => viewBooking(id)}
            navTabs={[
              { key: 'bookings', icon: 'fa-calendar-check', label: 'Reservations' },
              { key: 'inventory', icon: 'fa-boxes-stacked', label: 'Inventory' },
              {
                key: 'transfers',
                icon: 'fa-right-left',
                label: 'Transfers',
                badge: pendingReqCount,
              },
            ]}
            activeNav={tab}
            onNavChange={setTab}
            branchSelector={
              branches.length > 0
                ? {
                  value: currentBranch || '',
                  onChange: (e) => {
                    // Branch ids are strings/UUIDs - do NOT parseInt() (that yields NaN).
                    fetchAllData(e.target.value);
                  },
                  options: branches.map((b) => ({ value: b.id, label: b.name })),
                }
                : null
            }
            headerActions={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Unified Inventory & Registration Dropdown */}
                <div ref={headerMenuRef} style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    type="button"
                    className="cb-tb-btn"
                    onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                    style={{
                      fontWeight: 700,
                      borderColor: headerMenuOpen ? S.primary : '#cbd5e1',
                      background: headerMenuOpen ? '#f1f5f9' : '#ffffff',
                      color: headerMenuOpen ? S.primary : '#0f172a',
                    }}
                    title="Inventory actions, register types and colors"
                  >
                    <i className="fa-solid fa-boxes-stacked" style={{ color: S.primary }}></i>
                    <span>Inventory &amp; Register</span>
                    <i
                      className={`fa-solid fa-chevron-${headerMenuOpen ? 'up' : 'down'}`}
                      style={{ fontSize: 9, marginLeft: 2, color: S.textMuted }}
                    ></i>
                  </button>

                  {headerMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        background: '#ffffff',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                        minWidth: 260,
                        zIndex: 1000,
                        padding: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: 'none',
                          background: tab === 'inventory' ? '#f0fdfa' : 'transparent',
                          color: tab === 'inventory' ? S.primary : '#0f172a',
                          fontSize: 13,
                          fontWeight: 600,
                          textAlign: 'left',
                          width: '100%',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (tab !== 'inventory') e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          if (tab !== 'inventory') e.currentTarget.style.background = 'transparent';
                        }}
                        onClick={() => {
                          setHeaderMenuOpen(false);
                          setTab('inventory');
                        }}
                      >
                        <i className="fa-solid fa-boxes-stacked" style={{ color: S.primary, width: 16 }}></i>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>Coffin Inventory</div>
                          <div style={{ fontSize: 11, color: S.textMuted }}>{coffins.length} variants in stock</div>
                        </div>
                        {tab === 'inventory' && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: S.primary, background: '#ccfbf1', padding: '2px 6px', borderRadius: 4 }}>
                            Active
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: 'none',
                          background: 'transparent',
                          color: '#0f172a',
                          fontSize: 13,
                          fontWeight: 600,
                          textAlign: 'left',
                          width: '100%',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => {
                          setHeaderMenuOpen(false);
                          setModal({ open: true, type: 'coffin', data: { stock: 0, price: 0 } });
                        }}
                      >
                        <i className="fa-solid fa-circle-plus" style={{ color: '#16a34a', width: 16 }}></i>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>Add Coffin Variant</div>
                          <div style={{ fontSize: 11, color: S.textMuted }}>Add new stock or casket model</div>
                        </div>
                      </button>

                      <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                      <button
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: 'none',
                          background: 'transparent',
                          color: '#0f172a',
                          fontSize: 13,
                          fontWeight: 600,
                          textAlign: 'left',
                          width: '100%',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => {
                          setHeaderMenuOpen(false);
                          setModal({
                            open: true,
                            type: 'registerTypes',
                            data: { name: '', description: '', selectedColors: [] },
                          });
                        }}
                      >
                        <i className="fa-solid fa-shapes" style={{ color: S.primary, width: 16 }}></i>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>Register Types</div>
                          <div style={{ fontSize: 11, color: S.textMuted }}>{typesCatalog.length} models registered</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: 'none',
                          background: 'transparent',
                          color: '#0f172a',
                          fontSize: 13,
                          fontWeight: 600,
                          textAlign: 'left',
                          width: '100%',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => {
                          setHeaderMenuOpen(false);
                          setModal({
                            open: true,
                            type: 'registerColors',
                            data: { colorName: '', customHex: '#111111' },
                          });
                        }}
                      >
                        <i className="fa-solid fa-palette" style={{ color: '#8b5cf6', width: 16 }}></i>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>Register Colors</div>
                          <div style={{ fontSize: 11, color: S.textMuted }}>{registeredColors.length} color finishes</div>
                        </div>
                      </button>

                      <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                      <button
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: 'none',
                          background: 'transparent',
                          color: '#0f172a',
                          fontSize: 13,
                          fontWeight: 600,
                          textAlign: 'left',
                          width: '100%',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => {
                          setHeaderMenuOpen(false);
                          openFindStock();
                        }}
                      >
                        <i className="fa-solid fa-network-wired" style={{ color: '#2563eb', width: 16 }}></i>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>Find in Other Branches</div>
                          <div style={{ fontSize: 11, color: S.textMuted }}>Cross-branch stock check</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: 'none',
                          background: 'transparent',
                          color: '#0f172a',
                          fontSize: 13,
                          fontWeight: 600,
                          textAlign: 'left',
                          width: '100%',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => {
                          setHeaderMenuOpen(false);
                          fetchAllData();
                        }}
                      >
                        <i className="fa-solid fa-arrows-rotate" style={{ color: S.textMuted, width: 16 }}></i>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>Refresh Data</div>
                          <div style={{ fontSize: 11, color: S.textMuted }}>Reload all stock &amp; orders</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Add Coffin Button */}
                <button
                  type="button"
                  className="cb-tb-btn"
                  onClick={() =>
                    setModal({ open: true, type: 'coffin', data: { stock: 0, price: 0 } })
                  }
                  title="Quick add coffin variant"
                  style={{
                    background: S.primary,
                    color: '#ffffff',
                    borderColor: S.primary,
                    fontWeight: 700,
                  }}
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Add Coffin</span>
                </button>

                {/* Quick Refresh Icon Button */}
                <button
                  type="button"
                  className="cb-tb-btn sq"
                  onClick={() => fetchAllData()}
                  title="Refresh"
                >
                  <i className="fa-solid fa-arrows-rotate"></i>
                </button>
              </div>
            }
          >
            {tab === 'inventory' && renderInventory()}
            {tab === 'transfers' && (
              <CoffinTransfers
                stockRequests={stockRequests}
                coffins={coffins}
                branches={branches}
                currentBranch={currentBranch}
                onStockAction={handleStockAction}
                onRefresh={fetchAllData}
              />
            )}
          </ReservationDashboard>
        </div>




        {/* Register Coffin Types Sidebar */}
        <div
          style={{
            ...styles.bkOverlay,
            ...(modal.open && modal.type === 'registerTypes' ? styles.bkOverlayOpen : {}),
          }}
          onClick={() => setModal({ open: false, type: '', data: {} })}
        ></div>
        <div
          style={{
            ...styles.bkSidebar,
            maxWidth: 580,
            ...(modal.open && modal.type === 'registerTypes' ? styles.bkSidebarOpen : {}),
          }}
        >
          <div style={styles.bkHeader}>
            <div style={{ minWidth: 0 }}>
              <h2 style={styles.bkHeaderH2}>
                <span style={styles.bkHeaderIcon}>
                  <i className="fa-solid fa-shapes"></i>
                </span>
                Register Coffin Types
              </h2>
              <span style={styles.bkHeaderSub}>
                Define coffin models and assign their available color finishes
              </span>
            </div>
            <button
              style={styles.bkClose}
              onClick={() => setModal({ open: false, type: '', data: {} })}
              title="Close"
            >
              &times;
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: S.bg }}>
            {/* Add New Type Form Card */}
            <form
              onSubmit={handleSaveCoffinType}
              style={{
                background: '#fff',
                border: `1px solid ${S.border}`,
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginBottom: 24,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, color: S.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-circle-plus" style={{ color: S.primary }}></i>
                Add New Coffin Type
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={styles.fl}>Coffin Type Name *</label>
                <input
                  style={styles.fi}
                  required
                  value={modal.data.name || ''}
                  onChange={(e) =>
                    setModal({ ...modal, data: { ...modal.data, name: e.target.value } })
                  }
                  placeholder="e.g. Doom, Presidential Heritage, Executive Oak, Cathedral"
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={styles.fl}>Description / Build Specifications</label>
                <input
                  style={styles.fi}
                  value={modal.data.description || ''}
                  onChange={(e) =>
                    setModal({ ...modal, data: { ...modal.data, description: e.target.value } })
                  }
                  placeholder="e.g. Solid mahogany with velvet lining and gold-accent swing bars"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...styles.fl, margin: 0 }}>Assign Available Colors to this Type</label>
                  <button
                    type="button"
                    onClick={() =>
                      setModal({
                        open: true,
                        type: 'registerColors',
                        data: { colorName: '', customHex: '#111111' },
                      })
                    }
                    style={{
                      background: 'none',
                      border: 'none',
                      color: S.primary,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    + Add new color
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, maxHeight: 150, overflowY: 'auto', padding: 8, background: '#f8fafc', borderRadius: 8, border: `1px solid ${S.border}` }}>
                  {registeredColors.map((color) => {
                    const isSelected = (modal.data.selectedColors || []).includes(color.name);
                    return (
                      <button
                        type="button"
                        key={color.name}
                        onClick={() => {
                          const cur = modal.data.selectedColors || [];
                          const next = isSelected
                            ? cur.filter((c) => c !== color.name)
                            : [...cur, color.name];
                          setModal({ ...modal, data: { ...modal.data, selectedColors: next } });
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 10px',
                          borderRadius: 16,
                          border: `1px solid ${isSelected ? S.primary : S.border}`,
                          background: isSelected ? S.primaryLight : '#fff',
                          color: isSelected ? S.primary : S.text,
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: color.hex,
                            border: '1px solid rgba(0,0,0,0.2)',
                          }}
                        />
                        {color.name}
                        {isSelected && <i className="fa-solid fa-check" style={{ fontSize: 10 }}></i>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: S.textMuted, marginTop: 4 }}>
                  Selected colors will be offered when adding inventory or taking bookings for this type.
                </div>
              </div>

              <button
                type="submit"
                style={{
                  ...styles.btn,
                  ...styles.btnP,
                  width: '100%',
                  padding: '11px',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <i className="fa-solid fa-check"></i> Save Coffin Type
              </button>
            </form>

            {/* List of Registered Coffin Types */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: S.text }}>
                  Registered Coffin Models ({typesCatalog.length})
                </div>
                <span style={{ fontSize: 12, color: S.textMuted }}>Synced with variants &amp; booking</span>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {typesCatalog.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: S.textMuted, background: '#fff', borderRadius: 8 }}>
                    No coffin types registered yet. Add one above!
                  </div>
                ) : (
                  typesCatalog.map((type) => (
                    <div
                      key={type.id || type.name}
                      style={{
                        background: '#fff',
                        border: `1px solid ${S.border}`,
                        borderRadius: 10,
                        padding: '14px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: S.text }}>
                          {type.name}
                        </div>
                        {type.description && (
                          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>
                            {type.description}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                          {(type.colors && type.colors.length > 0) ? (
                            type.colors.map((c) => (
                              <span
                                key={c.name}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  background: '#f1f5f9',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 12,
                                  padding: '3px 8px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: '#334155',
                                }}
                              >
                                <span
                                  style={{
                                    width: 9,
                                    height: 9,
                                    borderRadius: '50%',
                                    background: c.hex,
                                    border: '1px solid rgba(0,0,0,0.2)',
                                  }}
                                />
                                {c.name}
                                <span style={{ color: '#94a3b8', fontSize: 10 }}>({c.sku})</span>
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 11, color: S.textMuted }}>No colors assigned</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCoffinType(type.id || type.name, type.name)}
                        title={`Remove ${type.name}`}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: S.danger,
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontSize: 12,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Register Coffin Colors Sidebar with Live RGB Detection */}
        <div
          style={{
            ...styles.bkOverlay,
            ...(modal.open && modal.type === 'registerColors' ? styles.bkOverlayOpen : {}),
          }}
          onClick={() => setModal({ open: false, type: '', data: {} })}
        ></div>
        <div
          style={{
            ...styles.bkSidebar,
            maxWidth: 580,
            ...(modal.open && modal.type === 'registerColors' ? styles.bkSidebarOpen : {}),
          }}
        >
          <div style={styles.bkHeader}>
            <div style={{ minWidth: 0 }}>
              <h2 style={styles.bkHeaderH2}>
                <span style={styles.bkHeaderIcon}>
                  <i className="fa-solid fa-palette"></i>
                </span>
                Register Coffin Colors
              </h2>
              <span style={styles.bkHeaderSub}>
                Real-time RGB detection, Hex resolution, and color variant catalog
              </span>
            </div>
            <button
              style={styles.bkClose}
              onClick={() => setModal({ open: false, type: '', data: {} })}
              title="Close"
            >
              &times;
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: S.bg }}>
            {/* Add Color Card */}
            <form
              onSubmit={handleSaveColor}
              style={{
                background: '#fff',
                border: `1px solid ${S.border}`,
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginBottom: 24,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, color: S.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-droplet" style={{ color: '#8b5cf6' }}></i>
                Register New Color Finish
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={styles.fl}>Color Name / Typo / Shade *</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    style={{ ...styles.fi, flex: 1 }}
                    required
                    value={modal.data.colorName || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const det = detectColorRGB(val);
                      setModal({
                        ...modal,
                        data: {
                          ...modal.data,
                          colorName: val,
                          customHex: det.isValid ? det.hex : modal.data.customHex,
                        },
                      });
                    }}
                    placeholder="Type any color e.g. Midnight Black, balck, Rosewood, Mahogany"
                  />
                  <input
                    type="color"
                    value={modal.data.customHex || '#111111'}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, customHex: e.target.value } })
                    }
                    title="Pick exact custom shade"
                    style={{ width: 42, height: 42, borderRadius: 8, border: `1px solid ${S.border}`, padding: 2, cursor: 'pointer' }}
                  />
                </div>
                <div style={{ fontSize: 11, color: S.textMuted, marginTop: 4 }}>
                  Instant auto-correction: typing "balck" automatically resolves to Black with true casket RGB.
                </div>
              </div>

              {/* Live RGB Detection Swatch & Readout */}
              {(() => {
                const det = detectColorRGB(modal.data.customHex || modal.data.colorName || '');
                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: modal.data.customHex || det.hex,
                        border: '2px solid rgba(0,0,0,0.15)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ color: S.text, fontSize: 13 }}>
                          {det.resolvedName || modal.data.colorName || 'Awaiting input...'}
                        </strong>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 10,
                            background: det.isDark ? '#334155' : '#e2e8f0',
                            color: det.isDark ? '#fff' : '#0f172a',
                            fontWeight: 600,
                          }}
                        >
                          {det.isDark ? 'Dark Tone' : 'Light Tone'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2, fontFamily: 'monospace' }}>
                        HEX: {modal.data.customHex || det.hex} · RGB: {det.rgbStr}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                style={{
                  ...styles.btn,
                  ...styles.btnP,
                  width: '100%',
                  padding: '11px',
                  fontSize: 13,
                  fontWeight: 700,
                  background: '#8b5cf6',
                }}
              >
                <i className="fa-solid fa-plus"></i> Register Color
              </button>
            </form>

            {/* Quick Add From Recommended Funeral Palette */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: S.text, marginBottom: 8 }}>
                Quick-Add From Classic Casket Palette
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {COFFIN_POPULAR_PALETTE.map((pal) => {
                  const alreadyRegistered = registeredColors.some(
                    (rc) => rc.name.toLowerCase() === pal.name.toLowerCase()
                  );
                  if (alreadyRegistered) return null;
                  return (
                    <button
                      type="button"
                      key={pal.name}
                      onClick={() => {
                        const updated = addRegisteredColor(pal.name, pal.hex);
                        setRegisteredColors(updated);
                        toast.success(`Added ${pal.name} to registered colors`);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 9px',
                        borderRadius: 14,
                        border: `1px solid ${S.border}`,
                        background: '#fff',
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: pal.hex,
                          border: '1px solid rgba(0,0,0,0.2)',
                        }}
                      />
                      + {pal.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Registered Colors Grid */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: S.text }}>
                  Registered Casket Colors ({registeredColors.length})
                </div>
                <span style={{ fontSize: 12, color: S.textMuted }}>Used in inventory variants</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {registeredColors.map((color) => (
                  <div
                    key={color.name}
                    style={{
                      background: '#fff',
                      border: `1px solid ${S.border}`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: color.hex,
                          border: '1px solid rgba(0,0,0,0.2)',
                          flexShrink: 0,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: S.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {color.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: S.textMuted, fontFamily: 'monospace' }}>
                          {color.hex}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteColor(color.name)}
                      title={`Remove ${color.name}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 4,
                        fontSize: 13,
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.color = S.danger)}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Register Coffin Sidebar — same beautiful chrome as New Reservation */}
        <div
          style={{
            ...styles.bkOverlay,
            ...(modal.open && modal.type === 'coffin' ? styles.bkOverlayOpen : {}),
          }}
          onClick={() => setModal({ open: false, type: '', data: {} })}
        ></div>
        <div
          style={{
            ...styles.bkSidebar,
            ...(modal.open && modal.type === 'coffin' ? styles.bkSidebarOpen : {}),
          }}
        >
          <div style={styles.bkHeader}>
            <div style={{ minWidth: 0 }}>
              <h2 style={styles.bkHeaderH2}>
                <span style={styles.bkHeaderIcon}>
                  <i className="fa-solid fa-box-open"></i>
                </span>
                Register Coffin
              </h2>
              <span style={styles.bkHeaderSub}>Add a new coffin to this branch's inventory</span>
            </div>
            <button
              style={styles.bkClose}
              onClick={() => setModal({ open: false, type: '', data: {} })}
              title="Close"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleCreateCoffin} style={styles.bkForm}>
            <div style={styles.bkBody}>
              <div style={styles.bkSectionHead}>
                <span>Design and color variant</span>
                <span style={styles.bkSectionRule} />
              </div>
              <div style={{ ...styles.fr, gridTemplateColumns: '1fr' }}>
                <div style={styles.fg}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={styles.fl}>Coffin type / name *</label>
                    <button
                      type="button"
                      onClick={() =>
                        setModal({
                          open: true,
                          type: 'registerTypes',
                          data: { name: '', description: '', selectedColors: [] },
                        })
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        color: S.primary,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      + Manage Types
                    </button>
                  </div>
                  <input
                    style={styles.fi}
                    required
                    list="coffin-inventory-types"
                    value={modal.data.name || ''}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, name: e.target.value } })
                    }
                    placeholder="e.g. Doom, Presidential, Classic, Heritage Oak"
                  />
                  <datalist id="coffin-inventory-types">
                    {inventoryTypes.map((type) => <option key={type} value={type} />)}
                  </datalist>

                  {/* Quick Select from Registered Coffin Types */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                    {catalogTypeNames.map((tName) => {
                      const isSelected = (modal.data.name || '').toLowerCase() === tName.toLowerCase();
                      return (
                        <button
                          type="button"
                          key={tName}
                          onClick={() => setModal({ ...modal, data: { ...modal.data, name: tName } })}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            border: `1px solid ${isSelected ? S.primary : S.border}`,
                            background: isSelected ? S.primaryLight : '#fff',
                            color: isSelected ? S.primary : S.textLight,
                            fontSize: 11,
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {tName}
                        </button>
                      );
                    })}
                  </div>

                  {/* Registered color variant chips for this design */}
                  {(() => {
                    const matchedType = typesCatalog.find(
                      (t) => t.name.toLowerCase() === (modal.data.name || '').toLowerCase()
                    );
                    if (!matchedType || !matchedType.colors?.length) return null;
                    return (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: S.textMuted }}>
                          Registered colors for {matchedType.name}:
                        </span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          {matchedType.colors.map((c) => (
                            <button
                              type="button"
                              key={c.name}
                              onClick={() => setModal({ ...modal, data: { ...modal.data, color: c.name } })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 9px',
                                borderRadius: 14,
                                border: `1px solid ${modal.data.color === c.name ? S.primary : S.border}`,
                                background: modal.data.color === c.name ? S.primaryLight : '#fff',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,0.2)' }} />
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div style={{ ...styles.fr, gridTemplateColumns: '1fr' }}>
                <div style={styles.fg}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={styles.fl}>Color variant * — inventory and bookings depend on this</label>
                    <button
                      type="button"
                      onClick={() =>
                        setModal({
                          open: true,
                          type: 'registerColors',
                          data: { colorName: '', customHex: '#111111' },
                        })
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#8b5cf6',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      + Manage Colors
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      style={{ ...styles.fi, flex: 1 }}
                      required
                      list="coffin-inventory-colors"
                      value={modal.data.color || ''}
                      onChange={(e) =>
                        setModal({ ...modal, data: { ...modal.data, color: e.target.value } })
                      }
                      placeholder="Type color e.g. Black, balck, White, Gold, Mahogany"
                    />
                    <input
                      type="color"
                      value={detectColorRGB(modal.data.color || '#000000').hex}
                      onChange={(e) =>
                        setModal({ ...modal, data: { ...modal.data, color: e.target.value } })
                      }
                      title="Pick exact shade"
                      style={{ width: 38, height: 38, borderRadius: 8, border: `1px solid ${S.border}`, padding: 2, cursor: 'pointer' }}
                    />
                  </div>
                  <datalist id="coffin-inventory-colors">
                    {inventoryColors.map((color) => <option key={color} value={color} />)}
                  </datalist>

                  {/* Quick Select from Registered Colors */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                    {catalogColors.slice(0, 10).map((cName) => {
                      const isSelected = (modal.data.color || '').toLowerCase() === cName.toLowerCase();
                      const det = detectColorRGB(cName);
                      return (
                        <button
                          type="button"
                          key={cName}
                          onClick={() => setModal({ ...modal, data: { ...modal.data, color: cName } })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 12,
                            border: `1px solid ${isSelected ? S.primary : S.border}`,
                            background: isSelected ? S.primaryLight : '#fff',
                            color: isSelected ? S.primary : S.textLight,
                            fontSize: 11,
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: det.hex }} />
                          {cName}
                        </button>
                      );
                    })}
                  </div>

                  {/* Live RGB Detection Swatch & Readout */}
                  {(() => {
                    const det = detectColorRGB(modal.data.color || '');
                    return (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 6,
                        padding: '6px 10px',
                        background: S.bg,
                        borderRadius: 8,
                        border: `1px solid ${S.border}`,
                        fontSize: 11.5
                      }}>
                        <span style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: det.hex,
                          border: '1px solid rgba(0,0,0,0.2)',
                          flexShrink: 0
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ color: S.text }}>{det.resolvedName || modal.data.color || 'Type color...'}</strong>
                          <span style={{ color: S.textMuted, marginLeft: 8, fontFamily: 'monospace' }}>
                            RGB: {det.rgbStr} · HEX: {det.hex}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Add Palette buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                    {COFFIN_POPULAR_PALETTE.slice(0, 8).map((pal) => (
                      <button
                        type="button"
                        key={pal.name}
                        onClick={() => setModal({ ...modal, data: { ...modal.data, color: pal.name } })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 7px',
                          borderRadius: 12,
                          background: '#fff',
                          border: `1px solid ${S.border}`,
                          fontSize: 10.5,
                          cursor: 'pointer',
                          color: S.textLight,
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: pal.hex }} />
                        {pal.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={styles.fr}>
                <div style={styles.fg}>
                  <label style={styles.fl}>Size (ft)</label>
                  <input
                    style={styles.fi}
                    value={modal.data.size ?? selectedBookingCoffin?.size ?? ''}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, size: e.target.value } })
                    }
                    placeholder="e.g. 6ft, 7ft"
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
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, price: e.target.value } })
                    }
                  />
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Stock</label>
                  <input
                    style={styles.fi}
                    type="number"
                    value={modal.data.stock || 0}
                    onChange={(e) =>
                      setModal({
                        ...modal,
                        data: { ...modal.data, stock: parseInt(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
              </div>
              <div style={styles.bkSectionHead}>
                <span>Media &amp; notes</span>
                <span style={styles.bkSectionRule} />
              </div>
              <div style={styles.fg}>
                <label style={styles.fl}>Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 10) {
                      toast.error('Select no more than 10 images');
                      e.target.value = '';
                      return;
                    }
                    const oversized = files.find((file) => file.size > 10 * 1024 * 1024);
                    if (oversized) {
                      toast.error(`${oversized.name} exceeds the 10 MB limit`);
                      e.target.value = '';
                      return;
                    }
                    setModal({ ...modal, data: { ...modal.data, images: files } });
                  }}
                  style={styles.bkFile}
                />
                <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>
                  Upload up to 10 images, 10 MB each. {modal.data.images?.length ? `${modal.data.images.length} selected.` : ''}
                </div>
              </div>
              <div style={styles.fg}>
                <label style={styles.fl}>Notes</label>
                <textarea
                  style={{ ...styles.fi, minHeight: 80, resize: 'vertical' }}
                  value={modal.data.notes || ''}
                  onChange={(e) =>
                    setModal({ ...modal, data: { ...modal.data, notes: e.target.value } })
                  }
                  placeholder="Any notes..."
                />
              </div>
            </div>

            <div style={styles.bkFooter}>
              <button
                type="button"
                style={{ ...styles.bkFooterBtn, ...styles.bkFooterGhost }}
                onClick={() => setModal({ open: false, type: '', data: {} })}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ ...styles.bkFooterBtn, ...styles.bkFooterPrimary }}
                disabled={submitLoading}
              >
                {submitLoading ? 'Saving...' : 'Save Coffin'}
              </button>
            </div>
          </form>
        </div>

        {/* Stock Adjustment Modal */}
        <div
          style={{
            ...styles.moOverlay,
            ...(modal.open && modal.type === 'stockAdjust' ? styles.moOpen : {}),
          }}
          onClick={() => setModal({ open: false, type: '', data: {} })}
        >
          <div style={styles.md} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mh}>
              <h2 style={styles.mh2}>
                {modal.data.mode === 'remove' ? 'Subtract Inventory' : 'Add Inventory'}
              </h2>
              <button style={styles.mx} onClick={() => setModal({ open: false, type: '', data: {} })}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAdjustCoffinStock}>
              <div style={styles.mb}>
                <div style={{ ...styles.detailSection, marginBottom: 16 }}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailRowSpan}>Coffin</span>
                    <strong style={styles.detailRowStrong}>{modal.data.name || 'N/A'}</strong>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailRowSpan}>Current Stock</span>
                    <strong style={styles.detailRowStrong}>{modal.data.current_stock ?? 0}</strong>
                  </div>
                </div>

                <div style={styles.fg}>
                  <label style={styles.fl}>Action</label>
                  <select
                    style={styles.fs}
                    value={modal.data.mode || 'add'}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, mode: e.target.value } })
                    }
                  >
                    <option value="add">Add Inventory</option>
                    <option value="remove">Subtract Inventory</option>
                  </select>
                </div>

                <div style={styles.fg}>
                  <label style={styles.fl}>
                    {modal.data.mode === 'remove' ? 'Quantity to remove' : 'Quantity to add'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    style={styles.fi}
                    value={modal.data.quantity || 1}
                    onChange={(e) =>
                      setModal({
                        ...modal,
                        data: { ...modal.data, quantity: parseInt(e.target.value) || 1 },
                      })
                    }
                  />
                </div>

                <div style={styles.fg}>
                  <label style={styles.fl}>New Stock Total</label>
                  <input
                    type="number"
                    style={styles.fi}
                    readOnly
                    value={Math.max(
                      0,
                      (parseInt(modal.data.current_stock) || 0) +
                      ((modal.data.mode || 'add') === 'add'
                        ? (parseInt(modal.data.quantity) || 0)
                        : -(parseInt(modal.data.quantity) || 0)),
                    )}
                  />
                </div>
              </div>
              <div style={styles.mf}>
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnG }}
                  onClick={() => setModal({ open: false, type: '', data: {} })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.btn, ...styles.btnP }}
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Updating...' : modal.data.mode === 'remove' ? 'Save Reduction' : 'Save Addition'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Booking Sidebar - New Reservation */}
        <div
          style={{
            ...styles.bkOverlay,
            ...(modal.open && modal.type === 'booking' ? styles.bkOverlayOpen : {}),
          }}
          onClick={() => setModal({ open: false, type: '', data: {} })}
        ></div>
        <div
          style={{
            ...styles.bkSidebar,
            ...(modal.open && modal.type === 'booking' ? styles.bkSidebarOpen : {}),
          }}
        >
          <div style={styles.bkHeader}>
            <div style={{ minWidth: 0 }}>
              <h2 style={styles.bkHeaderH2}>
                <span style={styles.bkHeaderIcon}>
                  <i className="fa-solid fa-calendar-plus"></i>
                </span>
                New Reservation
              </h2>
              <span style={styles.bkHeaderSub}>Reserve a coffin and lock the service date</span>
            </div>
            <button
              style={styles.bkClose}
              onClick={() => setModal({ open: false, type: '', data: {} })}
              title="Close"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleCreateBooking} style={styles.bkForm}>
            <div style={styles.bkBody}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={styles.bkSectionHead}>
                  <span>Schedule</span>
                  <span style={styles.bkSectionRule} />
                </div>

                {/* Service Date + Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 14 }}>
                  <div>
                    <label style={styles.fl}>Service Date *</label>
                    <input
                      type="date"
                      style={styles.fi}
                      required
                      value={modal.data.service_date || todayKey()}
                      onChange={(e) =>
                        setModal({ ...modal, data: { ...modal.data, service_date: e.target.value } })
                      }
                    />
                  </div>
                  <div>
                    <label style={styles.fl}>Time</label>
                    <input
                      type="time"
                      style={styles.fi}
                      value={modal.data.service_time || ''}
                      onChange={(e) =>
                        setModal({ ...modal, data: { ...modal.data, service_time: e.target.value } })
                      }
                    />
                  </div>
                </div>

                <div style={styles.bkSectionHead}>
                  <span>Client</span>
                  <span style={styles.bkSectionRule} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={styles.fl}>Client Name *</label>
                    <input
                      style={styles.fi}
                      required
                      value={modal.data.client_name || ''}
                      onChange={(e) =>
                        setModal({ ...modal, data: { ...modal.data, client_name: e.target.value } })
                      }
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label style={styles.fl}>Client Phone</label>
                    <input
                      style={styles.fi}
                      value={modal.data.client_phone || ''}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          data: { ...modal.data, client_phone: e.target.value },
                        })
                      }
                      placeholder="0712-345-678"
                    />
                  </div>
                </div>

                <div style={styles.bkSectionHead}>
                  <span>Booking details</span>
                  <span style={styles.bkSectionRule} />
                </div>

                <div>
                  <label style={styles.fl}>Deceased (optional)</label>
                  <input
                    style={styles.fi}
                    value={modal.data.deceased_name || ''}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, deceased_name: e.target.value } })
                    }
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label style={styles.fl}>Search available coffin types and colors</label>
                  <input
                    style={styles.fi}
                    type="search"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search by coffin name, type, color, or size"
                  />
                </div>

                <div>
                  <label style={styles.fl}>Choose a coffin color variant (optional)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10, marginTop: 7 }}>
                    <button
                      type="button"
                      aria-pressed={!modal.data.coffin_id}
                      onClick={() => setModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, coffin_id: '', size: '' },
                      }))}
                      style={{
                        textAlign: 'left',
                        padding: 12,
                        borderRadius: 10,
                        border: `1px solid ${!modal.data.coffin_id ? S.primary : S.border}`,
                        background: !modal.data.coffin_id ? S.primaryLight : '#fff',
                        color: S.text,
                        cursor: 'pointer',
                        font: 'inherit',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: 13 }}>Made to order</strong>
                      <span style={{ color: S.textMuted, fontSize: 11 }}>No inventory variant selected</span>
                    </button>
                    {filteredBookingCoffins.map((coffin) => {
                      const variantId = coffin.coffin_id || coffin.id;
                      const selected = String(modal.data.coffin_id || '') === String(variantId);
                      const stock = getCoffinStock(coffin);
                      return (
                        <button
                          type="button"
                          key={variantId}
                          aria-pressed={selected}
                          onClick={() => setModal((prev) => ({
                            ...prev,
                            data: {
                              ...prev.data,
                              coffin_id: variantId,
                              coffin_name: coffin.type || coffin.name || '',
                              color: coffin.color || '',
                              size: coffin.size || '',
                              quantity: stock > 0
                                ? Math.min(parseInt(prev.data.quantity, 10) || 1, stock)
                                : prev.data.quantity,
                              amount: coffin.price ?? coffin.exact_price ?? prev.data.amount,
                            },
                          }))}
                          style={{
                            textAlign: 'left',
                            padding: 12,
                            borderRadius: 10,
                            border: `1px solid ${selected ? S.primary : S.border}`,
                            background: selected ? S.primaryLight : '#fff',
                            color: S.text,
                            cursor: 'pointer',
                            font: 'inherit',
                          }}
                        >
                          <strong style={{ display: 'block', fontSize: 13 }}>
                            {[coffin.type || coffin.name, coffin.color].filter(Boolean).join(' · ')}
                          </strong>
                          <span style={{ display: 'block', color: S.textMuted, fontSize: 11, marginTop: 4 }}>
                            {[coffin.size, `${stock} available`].filter(Boolean).join(' · ')}
                          </span>
                          <span style={{ display: 'block', color: S.textMuted, fontSize: 11, marginTop: 2 }}>
                            {formatKES(coffin.price ?? coffin.exact_price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {filteredBookingCoffins.length === 0 && (
                    <div style={{ color: S.textMuted, fontSize: 12, marginTop: 8 }}>
                      No matching inventory variants. Enter the coffin type and color below for a made-to-order booking.
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={styles.fl}>Coffin type *</label>
                      <span style={{ fontSize: 11, color: S.textMuted }}>Model</span>
                    </div>
                    <input
                      style={styles.fi}
                      required
                      list="booking-coffin-types"
                      value={modal.data.coffin_name ?? selectedBookingCoffin?.type ?? selectedBookingCoffin?.name ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, coffin_name: val, coffin_id: '' },
                        }));
                      }}
                      placeholder="e.g. Doom, Presidential"
                    />
                    <datalist id="booking-coffin-types">
                      {inventoryTypes.map((type) => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>

                    {/* Registered Types Quick Pills */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                      {catalogTypeNames.slice(0, 6).map((tName) => {
                        const isCurrent = (modal.data.coffin_name || '').toLowerCase() === tName.toLowerCase();
                        return (
                          <button
                            type="button"
                            key={tName}
                            onClick={() => {
                              setModal((prev) => ({
                                ...prev,
                                data: { ...prev.data, coffin_name: tName, coffin_id: '' },
                              }));
                            }}
                            style={{
                              padding: '3px 8px',
                              borderRadius: 12,
                              border: `1px solid ${isCurrent ? S.primary : S.border}`,
                              background: isCurrent ? S.primaryLight : '#fff',
                              color: isCurrent ? S.primary : S.textLight,
                              fontSize: 11,
                              fontWeight: isCurrent ? 700 : 500,
                              cursor: 'pointer',
                            }}
                          >
                            {tName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={styles.fl}>Color *</label>
                      <span style={{ fontSize: 11, color: S.textMuted }}>Finish</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        style={{ ...styles.fi, flex: 1 }}
                        required
                        list="booking-coffin-colors"
                        value={modal.data.color ?? selectedBookingCoffin?.color ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, color: val, coffin_id: '' },
                          }));
                        }}
                        placeholder="e.g. White, Black, Mahogany"
                      />
                      <span
                        title="Color preview"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: detectColorRGB(modal.data.color || selectedBookingCoffin?.color || '#cccccc').hex,
                          border: '1.5px solid rgba(0,0,0,0.2)',
                          flexShrink: 0,
                        }}
                      />
                    </div>
                    <datalist id="booking-coffin-colors">
                      {inventoryColors.map((color) => (
                        <option key={color} value={color} />
                      ))}
                    </datalist>

                    {/* Registered Colors Quick Pills */}
                    {(() => {
                      const currentType = typesCatalog.find(
                        (t) => t.name.toLowerCase() === (modal.data.coffin_name || '').toLowerCase()
                      );
                      const suggestedColors = (currentType?.colors?.length)
                        ? currentType.colors.map((c) => c.name)
                        : catalogColors.slice(0, 6);

                      return (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                          {suggestedColors.map((cName) => {
                            const isCurrent = (modal.data.color || '').toLowerCase() === cName.toLowerCase();
                            const det = detectColorRGB(cName);
                            return (
                              <button
                                type="button"
                                key={cName}
                                onClick={() => {
                                  setModal((prev) => ({
                                    ...prev,
                                    data: { ...prev.data, color: cName, coffin_id: '' },
                                  }));
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '3px 8px',
                                  borderRadius: 12,
                                  border: `1px solid ${isCurrent ? S.primary : S.border}`,
                                  background: isCurrent ? S.primaryLight : '#fff',
                                  color: isCurrent ? S.primary : S.textLight,
                                  fontSize: 11,
                                  fontWeight: isCurrent ? 700 : 500,
                                  cursor: 'pointer',
                                }}
                              >
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: det.hex }} />
                                {cName}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Real-time Inventory Matching Badge */}
                {(() => {
                  const currentName = String(modal.data.coffin_name || selectedBookingCoffin?.type || selectedBookingCoffin?.name || '').trim().toLowerCase();
                  const currentColor = String(modal.data.color || selectedBookingCoffin?.color || '').trim().toLowerCase();

                  if (!currentName || !currentColor) return null;

                  const matchedVariant = branchCoffins.find((c) => {
                    const tMatch = String(c.type || c.name || '').trim().toLowerCase() === currentName;
                    const cMatch = String(c.color || '').trim().toLowerCase() === currentColor;
                    return tMatch && cMatch;
                  });

                  if (matchedVariant) {
                    const stock = getCoffinStock(matchedVariant);
                    const isLinked = String(modal.data.coffin_id || '') === String(matchedVariant.coffin_id || matchedVariant.id);
                    return (
                      <div
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #86efac',
                          borderRadius: 8,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <i className="fa-solid fa-circle-check" style={{ color: '#16a34a', fontSize: 16 }}></i>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 12.5, color: '#166534' }}>
                              Variant In Stock Locally ({stock} available)
                            </div>
                            <div style={{ fontSize: 11, color: '#15803d' }}>
                              {branches.find((b) => b.id == currentBranch)?.name || 'Current Branch'} · SKU: {generateVariantSku(matchedVariant.type || matchedVariant.name, matchedVariant.color)} · {formatKES(matchedVariant.price ?? matchedVariant.exact_price)}
                            </div>
                          </div>
                        </div>
                        {!isLinked && (
                          <button
                            type="button"
                            onClick={() => {
                              setModal((prev) => ({
                                ...prev,
                                data: {
                                  ...prev.data,
                                  coffin_id: matchedVariant.coffin_id || matchedVariant.id,
                                  amount: matchedVariant.price ?? matchedVariant.exact_price ?? prev.data.amount,
                                  size: matchedVariant.size || prev.data.size,
                                },
                              }));
                            }}
                            style={{
                              background: '#16a34a',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '4px 10px',
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Lock Stock
                          </button>
                        )}
                      </div>
                    );
                  }

                  // Check other branches
                  const otherBranchMatch = coffins.find((c) => {
                    const tMatch = String(c.type || c.name || '').trim().toLowerCase() === currentName;
                    const cMatch = String(c.color || '').trim().toLowerCase() === currentColor;
                    return tMatch && cMatch && c.branch_id != currentBranch;
                  });

                  if (otherBranchMatch) {
                    const otherBranchName = branches.find((b) => b.id == otherBranchMatch.branch_id)?.name || 'another branch';
                    return (
                      <div
                        style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: 8,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <i className="fa-solid fa-arrow-right-arrow-left" style={{ color: '#2563eb', fontSize: 16 }}></i>
                        <div style={{ fontSize: 12, color: '#1e40af' }}>
                          <strong>Available in {otherBranchName}</strong> ({getCoffinStock(otherBranchMatch)} units). You can book as custom or request an inter-branch transfer.
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: 8,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <i className="fa-solid fa-tools" style={{ color: '#d97706', fontSize: 16 }}></i>
                      <div style={{ fontSize: 12, color: '#92400e' }}>
                        <strong>Made-to-Order Booking:</strong> This variant is not currently stocked locally. It will be scheduled for production/workshop fulfillment.
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label style={styles.fl}>Size (optional)</label>
                  <input
                    style={styles.fi}
                    value={modal.data.size || ''}
                    onChange={(e) =>
                      setModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, size: e.target.value },
                      }))
                    }
                    placeholder="Leave blank and let the workshop decide"
                  />
                  <div style={{ fontSize: 12, color: S.textMuted, marginTop: 5 }}>
                    Leave blank for a made-to-order booking. If a matching no-size variant has stock, it will be reserved.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16 }}>
                  <div>
                    <label style={styles.fl}>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedBookingCoffin ? getCoffinStock(selectedBookingCoffin) : undefined}
                      style={styles.fi}
                      value={modal.data.quantity || 1}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, quantity: parseInt(e.target.value) || 1 },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label style={styles.fl}>Paid</label>
                    <select
                      style={styles.fs}
                      value={modal.data.paid ? 'yes' : 'no'}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, paid: e.target.value === 'yes' },
                        }))
                      }
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={styles.fl}>Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      style={styles.fi}
                      value={modal.data.amount || ''}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, amount: e.target.value },
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label style={styles.fl}>Deposit</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      style={styles.fi}
                      value={modal.data.deposit || ''}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, deposit: e.target.value },
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.fl}>Notes</label>
                  <textarea
                    style={{ ...styles.fi, minHeight: 80 }}
                    value={modal.data.notes || ''}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, notes: e.target.value } })
                    }
                  />
                </div>
              </div>
            </div>

            <div style={styles.bkFooter}>
              <button
                type="button"
                style={{ ...styles.bkFooterBtn, ...styles.bkFooterGhost }}
                onClick={() => setModal({ open: false, type: '', data: {} })}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ ...styles.bkFooterBtn, ...styles.bkFooterPrimary }}
                disabled={submitLoading}
              >
                {submitLoading ? 'Saving...' : 'Create Reservation'}
              </button>
            </div>
          </form>
        </div>

        {/* Stock Request Modal */}
        <div
          style={{
            ...styles.moOverlay,
            ...(modal.open && modal.type === 'stockRequest' ? styles.moOpen : {}),
          }}
          onClick={() => setModal({ open: false, type: '', data: {} })}
        >
          <div style={styles.md} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mh}>
              <h2 style={styles.mh2}>New Stock Request</h2>
              <button style={styles.mx} onClick={() => setModal({ open: false, type: '', data: {} })}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateStockRequest}>
              <div style={styles.mb}>
                <div style={styles.fr}>
                  <div style={styles.fg}>
                    <label style={styles.fl}>Request From *</label>
                    <select
                      style={styles.fs}
                      required
                      value={modal.data.from_branch_id || modal.data.to_branch_id || ''}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          data: { ...modal.data, from_branch_id: e.target.value },
                        })
                      }
                    >
                      <option value="">Select source branch</option>
                      {branches
                        .filter((b) => b.id != currentBranch)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div style={styles.fg}>
                    <label style={styles.fl}>Coffin *</label>
                    <select
                      style={styles.fs}
                      required
                      value={modal.data.coffin_id || ''}
                      onChange={(e) =>
                        setModal({ ...modal, data: { ...modal.data, coffin_id: e.target.value } })
                      }
                    >
                      <option value="">Select coffin</option>
                      {(() => {
                        // Only offer coffins stocked at the SOURCE branch being
                        // requested from (plus shared central stock without a
                        // branch assignment) — never my own branch's stock.
                        const sourceBranchId =
                          modal.data.from_branch_id || modal.data.to_branch_id || '';
                        const sourceCoffins = coffins.filter((c) => {
                          const matchesSource =
                            !c.branch_id || c.branch_id == sourceBranchId;
                          const hasStock = (parseInt(c.stock) || 0) > 0;
                          return sourceBranchId && matchesSource && hasStock;
                        });
                        return sourceCoffins.length > 0 ? (
                          sourceCoffins.map((c) => (
                            <option key={c.coffin_id || c.id} value={c.coffin_id || c.id}>
                              {c.name} ({c.stock} left)
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            {sourceBranchId
                              ? 'No coffins available at this branch'
                              : 'Select a source branch first'}
                          </option>
                        );
                      })()}
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
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          data: { ...modal.data, quantity: parseInt(e.target.value) || 1 },
                        })
                      }
                    />
                  </div>
                  <div style={styles.fg}>
                    <label style={styles.fl}>Client Name</label>
                    <input
                      style={styles.fi}
                      value={modal.data.client_name || ''}
                      onChange={(e) =>
                        setModal({ ...modal, data: { ...modal.data, client_name: e.target.value } })
                      }
                    />
                  </div>
                </div>
                <div style={styles.fr}>
                  <div style={styles.fg}>
                    <label style={styles.fl}>Client Phone</label>
                    <input
                      style={styles.fi}
                      value={modal.data.client_phone || ''}
                      onChange={(e) =>
                        setModal({ ...modal, data: { ...modal.data, client_phone: e.target.value } })
                      }
                    />
                  </div>
                  <div style={styles.fg}>
                    <label style={styles.fl}>Deceased Name</label>
                    <input
                      style={styles.fi}
                      value={modal.data.deceased_name || ''}
                      onChange={(e) =>
                        setModal({ ...modal, data: { ...modal.data, deceased_name: e.target.value } })
                      }
                    />
                  </div>
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Expected Date (optional)</label>
                  <input
                    type="date"
                    style={styles.fi}
                    value={modal.data.service_date || ''}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, service_date: e.target.value } })
                    }
                  />
                </div>
                <div style={styles.fg}>
                  <label style={styles.fl}>Notes</label>
                  <textarea
                    style={{ ...styles.fi, minHeight: 80, resize: 'vertical' }}
                    value={modal.data.notes || ''}
                    onChange={(e) =>
                      setModal({ ...modal, data: { ...modal.data, notes: e.target.value } })
                    }
                  />
                </div>
              </div>
              <div style={styles.mf}>
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnG }}
                  onClick={() => setModal({ open: false, type: '', data: {} })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.btn, ...styles.btnP }}
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>


        <div
          style={{ ...styles.drawerOverlay, ...(drawer.open ? styles.drawerOverlayOpen : {}) }}
          onClick={closeDrawer}
        ></div>
        <div style={{ ...styles.drawer, ...(drawer.open ? styles.drawerOpen : {}) }}>
          <div style={styles.drawerHeader}>
            <h2 style={styles.drawerHeaderH2}>{drawer.title}</h2>
            <button style={styles.mx} onClick={closeDrawer}>
              &times;
            </button>
          </div>
          <div style={styles.drawerBody} dangerouslySetInnerHTML={{ __html: drawer.content }} />
        </div>
      </div>
      );
};


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
