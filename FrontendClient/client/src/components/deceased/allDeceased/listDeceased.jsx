import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { getTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import { showToast } from '../../../utils/toast';
import { ToastContainer } from 'react-toastify';
import {
  formatDate,
  daysFromNow,
  todayKey,
} from '../../../utils/dates/parseDates';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const API_GATEWAY_URL = import.meta.env.VITE_API_URL || '/api/v1/restpoint';
const BASE_URL = `${API_GATEWAY_URL}/deceased`;

// ─── Global Font Styles & Body Reset ────────────────────────────────
const GlobalFonts = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
  
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    background-color: #ececec;
  }
`;

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// ─── Color Variables ────────────────────────────────────────────────
const C = {
  black: '#0a0a0a',
  dark: '#1a1a1a',
  mid: '#444444',
  gray: '#777777',
  lightGray: '#aaaaaa',
  border: '#e0e0e0',
  borderLight: '#efefef',
  bgField: '#f7f7f5',
  bgSection: '#fafaf9',
  bgApp: '#ececec',
  exportBtn: '#0F3040',
  success: '#047857',
  successBg: '#ecfdf5',
  warning: '#b45309',
  warningBg: '#fffbeb',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#1e3a8a',
  infoBg: '#e0e7ff',
  brown: '#795548',

  // Bright Status Colors
  cBlue: '#00296B',
  cOrange: '#E36414',
  cPurple: '#5F0F40',
  cPink: '#DD2D4A',
  cNavy: '#03071E',

  // Flat glossy status palette (approved status-button design)
  stPending: '#d97706',
  stBooked: '#00296B',
  stScheduled: '#E36414',
  stInProgress: '#0c0b0f',
  stCompleted: '#5F0F40',
  stDelivered: '#132A13',
  stCancelled: '#DD2D4A',
  stMaintenance: '#03071E',

  // Accent / Scrollbar
  accent: '#DD2D4A',
};

// ─── Status Configuration ───────────────────────────────────────────
/* Every status renders as a flat glossy status button: sharp corners, white
   label, white LED dot and a diagonal light sweep (matches the approved
   status-button design). `filter` keeps the toolbar dropdown working even
   when two statuses share one colour. */
const STATUS_CONFIG = {
  'under care': { label: 'Under Care', color: '#ffffff', bg: C.stInProgress, filter: 'under care' },
  admitted: { label: 'Admitted', color: '#ffffff', bg: C.stBooked, filter: 'admitted' },
  postmortem: { label: 'Postmortem Requested', color: '#ffffff', bg: C.stScheduled, filter: 'under care' },
  pending: { label: 'Pending', color: '#ffffff', bg: C.stPending, filter: 'under care' },
  released: { label: 'Released', color: '#ffffff', bg: C.stDelivered, filter: 'released' },
  completed: { label: 'Completed', color: '#ffffff', bg: C.stCompleted, filter: 'completed' },
  cancelled: { label: 'Cancelled', color: '#ffffff', bg: C.stCancelled, filter: 'other' },
  maintenance: { label: 'Maintenance', color: '#ffffff', bg: C.stMaintenance, filter: 'other' },
  default: { label: 'Under Care', color: '#ffffff', bg: C.stInProgress, filter: 'under care' },
};

/* Read a raw status string back to the operator. Used for values the alias
   map has not seen yet (e.g. a status written by another service) so the
   register stays readable. */
const humanizeStatus = (raw) => String(raw || '')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()
  .replace(/\b[a-z]/g, (ch) => ch.toUpperCase());

const getStatusInfo = (statusStr) => {
  const raw = String(statusStr ?? '').trim();
  // A record carrying no status at all is a body under our care.
  if (!raw) return STATUS_CONFIG['under care'];

  const normalized = raw
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const aliases = {
    // Under Care / In care
    active: STATUS_CONFIG['under care'],
    received: STATUS_CONFIG['under care'],
    'under care': STATUS_CONFIG['under care'],
    'in care': STATUS_CONFIG['under care'],
    'in morgue': STATUS_CONFIG['under care'],
    morgue: STATUS_CONFIG['under care'],
    embalmed: STATUS_CONFIG['under care'],
    // Pending
    pending: STATUS_CONFIG.pending,
    'pending release': STATUS_CONFIG.pending,
    'awaiting release': STATUS_CONFIG.pending,
    // Admitted / Booked
    admitted: STATUS_CONFIG.admitted,
    booked: STATUS_CONFIG.admitted,
    // Postmortem requested (still under care)
    postmortem: STATUS_CONFIG.postmortem,
    'postmortem requested': STATUS_CONFIG.postmortem,
    'post mortem requested': STATUS_CONFIG.postmortem,
    'pending autopsy': STATUS_CONFIG.postmortem,
    'postmortem done': STATUS_CONFIG.postmortem,
    'post mortem done': STATUS_CONFIG.postmortem,
    // Released
    released: STATUS_CONFIG.released,
    'released to family': STATUS_CONFIG.released,
    transferred: STATUS_CONFIG.released,
    transfer: STATUS_CONFIG.released,
    dispatched: STATUS_CONFIG.released,
    buried: STATUS_CONFIG.released,
    'ready for collection': STATUS_CONFIG.released,
    ready: STATUS_CONFIG.released,
    // Completed
    completed: STATUS_CONFIG.completed,
    complete: STATUS_CONFIG.completed,
    // Cancelled / Maintenance
    cancelled: STATUS_CONFIG.cancelled,
    canceled: STATUS_CONFIG.cancelled,
    maintenance: STATUS_CONFIG.maintenance,
    'out of service': STATUS_CONFIG.maintenance,
    'in maintenance': STATUS_CONFIG.maintenance,
    default: STATUS_CONFIG.default,
  };

  if (aliases[normalized]) return aliases[normalized];

  // Loose match for compound values, guarded against short strings.
  const fallback = normalized.length >= 3
    ? Object.entries(STATUS_CONFIG).find(([key]) => {
      if (key === 'default') return false;
      return normalized.includes(key) || key.includes(normalized);
    })
    : null;

  if (fallback?.[1]) return fallback[1];

  // Unrecognised but non-empty: default to Under Care.
  return STATUS_CONFIG['under care'];
};

// ─── Helper: Format Date to YYYY-MM-DD ──────────────────────────────
const toDateString = (dateObj) => {
  if (!dateObj || isNaN(new Date(dateObj).getTime())) return null;
  const d = new Date(dateObj);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ─── Styled Components ──────────────────────────────────────────────
const AppContainer = styled.div`
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  color: ${C.dark};
  font-size: 14px;
  line-height: 1.5;
  min-height: 100dvh;
  margin: 0 auto;
  padding: 10px;
  width: 100%;
  max-width: 2200px;
  animation: ${fadeIn} 0.25s ease-out;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 6px;
  }
`;

// ─── Sleek Top Toolbar ──────────────────────────────────────────────
const Toolbar = styled.div`
  background: white;
  border: 1px solid ${C.borderLight};
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.04);
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
`;

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1 1 100%;
  
  @media (min-width: 992px) {
    flex: 1;
  }
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 100%;
  
  @media (min-width: 992px) {
    flex: 0 0 auto;
    margin-left: auto;
    justify-content: flex-end;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 200px;
  min-width: 150px;
  
  @media (min-width: 992px) {
    flex: 0 1 280px;
    max-width: 280px;
  }
`;

const SearchIcon = styled.i`
  position: absolute;
  left: 16px;
  color: ${C.gray};
  font-size: 14px;
  pointer-events: none;
  transition: color 0.2s;
`;

const SearchInput = styled.input`
  height: 42px;
  width: 100%;
  border-radius: 10px;
  border: 1px solid ${C.border};
  background: ${C.bgField};
  padding: 0 16px 0 42px;
  font-size: 14px;
  font-family: 'Source Sans 3', sans-serif;
  color: ${C.dark};
  transition: all 0.25s ease;
  outline: none;
  box-sizing: border-box;

  &::placeholder { color: #aaa; }

  &:focus {
    background: white;
    border-color: ${C.accent};
    box-shadow: 0 0 0 4px rgba(221, 45, 74, 0.1);

    & + ${SearchIcon} {
      color: ${C.accent};
    }
  }
`;

const FilterWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 150px;
  min-width: 120px;
  
  @media (min-width: 992px) {
    flex: 0 1 170px;
    max-width: 170px;
  }
`;

const FilterSelect = styled.select`
  height: 42px;
  width: 100%;
  border-radius: 10px;
  border: 1px solid ${C.border};
  background: ${C.bgField};
  padding: 0 36px 0 16px;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Source Sans 3', sans-serif;
  color: ${C.dark};
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  transition: all 0.25s ease;
  box-sizing: border-box;

  &:focus {
    background: white;
    border-color: ${C.accent};
    box-shadow: 0 0 0 4px rgba(221, 45, 74, 0.1);
  }
`;

const SelectArrow = styled.i`
  position: absolute;
  right: 14px;
  color: ${C.gray};
  pointer-events: none;
  font-size: 12px;
  transition: color 0.2s;
  
  ${FilterWrapper}:hover & {
    color: ${C.dark};
  }
`;

// ─── Buttons ────────────────────────────────────────────────────────
const Btn = styled.button`
  height: 42px;
  padding: 0 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Source Sans 3', sans-serif;
  white-space: nowrap;
  box-sizing: border-box;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${p => p.$ghost && `
    background: ${C.bgField};
    border: 1px solid ${C.border};
    color: ${C.mid};
    &:hover { background: #eef2f6; border-color: ${C.gray}; color: ${C.black}; }
  `}

  ${p => p.$danger && `
    background: #dc2626;
    color: white;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
    &:hover:not(:disabled) { background: #b91c1c; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3); }
  `}

  ${p => p.$export && `
    background: ${C.exportBtn};
    color: white;
    box-shadow: 0 4px 12px rgba(15, 48, 64, 0.2);
    &:hover:not(:disabled) { background: #0c2530; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15, 48, 64, 0.3); }
  `}

  ${p => p.$primary && `
    background: ${C.black};
    color: white;
    &:hover:not(:disabled) { background: ${C.dark}; }
  `}

  ${p => p.$sm && `
    height: 32px;
    padding: 0 16px;
    font-size: 13px;
    border-radius: 8px;
  `}
`;

// ─── List Components ────────────────────────────────────────────────
const ListCard = styled.div`
  background: white;
  border: 1px solid ${C.borderLight};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
`;

const ListHeader = styled.div`
  background: ${C.bgSection};
  padding: 20px 24px;
  border-bottom: 1px solid ${C.borderLight};
  
  h2 { 
    font-family: 'Merriweather', serif;
    font-size: 18px; 
    font-weight: 700; 
    color: ${C.black}; 
    margin: 0; 
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const StyledTable = styled.table`
  width: 100%; 
  border-collapse: collapse; 
  min-width: 900px;
  
  thead th {
    text-align: left; 
    padding: 14px 24px; 
    font-size: 11px; 
    font-weight: 700;
    text-transform: uppercase; 
    letter-spacing: 0.08em; 
    color: ${C.gray};
    border-bottom: 1px solid ${C.borderLight}; 
    background: ${C.bgSection}; 
    white-space: nowrap;
    
    &:last-child { text-align: right; }
  }
  
  tbody tr {
    border-bottom: 1px solid ${C.borderLight}; 
    cursor: pointer; 
    transition: background 0.15s;
    &:last-child { border-bottom: none; }
    &:hover { background: ${C.bgField}; }
  }
  
  td { 
    padding: 16px 24px; 
    font-size: 14px; 
    color: ${C.dark}; 
    vertical-align: middle; 
    
    &:last-child { text-align: right; }
  }
`;

const NameCell = styled.div`
  display: flex; 
  align-items: center; 
  gap: 12px;
  
  .meta { font-size: 12px; color: ${C.gray}; margin-top: 2px; }
`;

const AvatarSm = styled.div`
  width: 38px; 
  height: 38px; 
  border-radius: 50%; 
  color: white;
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-weight: 700; 
  font-size: 14px; 
  flex-shrink: 0;
  background: ${p => p.$female ? C.cPurple : C.black};
`;

/* Flat glossy status button — sharp corners, diagonal light sweep and a
   glowing white LED dot (matches the approved status-button design). */
const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: none;
  border-radius: 0;
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: capitalize;
  white-space: nowrap;
  /* base colour + the glossy diagonal sweep layered on top of it */
  background-color: ${p => p.$bg};
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 40%, rgba(0, 0, 0, 0.15) 100%);
  color: ${p => p.$color};
  transition: filter 0.2s ease;

  &:hover {
    filter: brightness(1.1);
  }

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
  }
`;

const EmptyRow = styled.td`
  text-align: center; 
  padding: 40px; 
  color: ${C.gray};
`;

const LoadingState = styled.div`
  text-align: center; 
  padding: 60px; 
  color: ${C.gray};
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 12px;
  .spinner {
    width: 24px; 
    height: 24px; 
    border: 2px solid ${C.borderLight};
    border-top-color: ${C.accent}; 
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ─── Mobile Cards ───────────────────────────────────────────────────
const MobileCardContainer = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    width: 100%;
  }
`;

const MobileCard = styled.div`
  background: white;
  border: 1px solid ${C.borderLight};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
  box-sizing: border-box;

  &:active {
    transform: scale(0.98);
    background: ${C.bgField};
  }
`;

const MobileCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
`;

const MobileCardNameWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  
  div div:first-child {
    font-size: 16px;
    font-weight: 700;
    color: ${C.black};
  }
  div div:last-child {
    font-size: 13px;
    color: ${C.gray};
  }
`;

const MobileCardDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid ${C.borderLight};

  div {
    display: flex;
    flex-direction: column;
  }

  span {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    color: ${C.gray};
    letter-spacing: 0.08em;
    margin-bottom: 4px;
  }

  strong {
    font-size: 14px;
    color: ${C.dark};
    font-weight: 600;
  }
`;

const MobileCardFooter = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
`;

// ─── Modal Components (side drawer) ─────────────────────────────────
const ModalOverlay = styled.div`
  display: ${p => p.$open ? 'flex' : 'none'};
  position: fixed; 
  inset: 0; 
  background: rgba(15, 23, 42, 0.55); 
  z-index: 1000;
  justify-content: flex-end; 
  align-items: stretch;
  animation: ${fadeIn} 0.2s ease-out;

  @media (max-width: 768px) {
    padding: 0;
    align-items: stretch;
  }
`;

const ModalContent = styled.div`
  background: white; 
  width: 100%;
  max-width: 560px;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35);
  animation: ${slideInRight} 0.25s ease-out;

  @media (max-width: 768px) {
    max-width: 100%;
    width: 100%;
    border-radius: 0;
  }
`;

const ModalHeader = styled.div`
  padding: 18px 24px; 
  border-bottom: 1px solid ${C.borderLight};
  display: flex; 
  justify-content: space-between; 
  align-items: flex-start;
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, ${C.exportBtn} 0%, ${C.cNavy} 100%);
  z-index: 10;
  
  h2 { 
    font-family: 'Merriweather', serif; 
    font-size: 17px; 
    color: white;
    margin: 0; 
    display: flex;
    align-items: center;
    gap: 10px;
  }

  p {
    margin: 4px 0 0 0;
    font-size: 11px;
    color: rgba(255,255,255,0.75);
    letter-spacing: 0.04em;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20px 24px;
`;

const ModalFooter = styled.div`
  padding: 14px 24px; 
  border-top: 1px solid ${C.borderLight}; 
  display: flex; 
  gap: 10px; 
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  background: white;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    
    button {
      width: 100%;
    }
  }
`;

const CloseBtn = styled.button`
  background: none; 
  border: none; 
  font-size: 24px; 
  color: ${C.gray}; 
  cursor: pointer; 
  line-height: 1;
  &:hover { color: ${C.black}; }
`;

// ─── Export Result Notification Modal ────────────────────────────────
const NotifyOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: ${fadeIn} 0.2s ease-out;
`;

const NotifyCard = styled.div`
  background: white;
  border-radius: 14px;
  width: 100%;
  max-width: 430px;
  padding: 28px 24px 20px;
  text-align: center;
  box-sizing: border-box;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  animation: ${fadeIn} 0.25s ease-out;

  @media (max-width: 768px) {
    max-width: 100%;
    padding: 22px 16px 16px;
  }
`;

const NotifyIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
`;

const NotifyTitle = styled.div`
  font-family: 'Merriweather', serif;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
`;

const NotifyMessage = styled.div`
  font-size: 13.5px;
  color: ${C.gray};
  line-height: 1.6;
  margin-bottom: 18px;
  overflow-wrap: anywhere;
`;

const NotifyActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;

  & + & { margin-top: 10px; }

  @media (max-width: 480px) {
    flex-direction: column-reverse;
    button { width: 100%; }
  }
`;

const NotifyHint = styled.div`
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid ${C.borderLight};
  font-size: 11px;
  color: ${C.lightGray};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const HistorySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
`;

const HistoryItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid ${C.borderLight};
  border-radius: 8px;
  background: white;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${C.border};
    background: ${C.bgSection};
  }

  .h-file { flex: 1; min-width: 0; }
  .h-name { font-size: 12.5px; font-weight: 600; color: ${C.dark}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .h-meta { font-size: 11px; color: ${C.gray}; margin-top: 3px; }
  .h-link { font-size: 11px; color: ${C.exportBtn}; text-decoration: none; font-weight: 600; margin-top: 2px; display: inline-flex; align-items: center; gap: 4px; }
  .h-link:hover { text-decoration: underline; color: ${C.black}; }
`;

const EmptyHistory = styled.div`
  padding: 18px;
  border: 1px dashed ${C.border};
  border-radius: 8px;
  text-align: center;
  color: ${C.gray};
  font-size: 12px;
  line-height: 1.6;
`;

const SectionHead = styled.div`
  background: ${C.black}; 
  color: white; 
  padding: 8px 16px;
  font-size: 12px; 
  font-weight: 700; 
  letter-spacing: 0.1em;
  text-transform: uppercase; 
  margin-bottom: 24px; 
  border-radius: 2px;
  display: flex; 
  align-items: center; 
  gap: 8px;
  
  span { opacity: 0.5; font-size: 10px; }
  ${p => p.$mt0 && 'margin-top: 0;'}
  ${p => p.$mt4 && 'margin-top: 32px;'}
`;

const FormRow = styled.div`
  display: flex; 
  gap: 16px; 
  margin-bottom: 16px; 
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
  }
`;

const FormGroup = styled.div`flex: 1; min-width: 150px; box-sizing: border-box;`;

const FormLabel = styled.label`
  display: block; 
  font-size: 10px; 
  font-weight: 700; 
  letter-spacing: 0.12em;
  text-transform: uppercase; 
  color: ${C.gray}; 
  margin-bottom: 6px;
`;

const ModalInput = styled.input`
  height: 42px; 
  width: 100%; 
  border: 1px solid ${C.border}; 
  border-radius: 10px;
  padding: 0 12px; 
  font-family: 'Source Sans 3', sans-serif; 
  font-size: 14px;
  color: ${C.dark}; 
  background: ${C.bgField}; 
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${C.accent}; background: white; box-shadow: 0 0 0 4px rgba(221, 45, 74, 0.1); }
`;

const DataTable = styled.table`
  width: 100%; 
  border-collapse: collapse; 
  margin-top: 0;
  border: 1px solid ${C.borderLight};
  border-radius: 6px;
  overflow: hidden;
  
  th { 
    text-align: left; 
    font-size: 11px; 
    text-transform: uppercase; 
    color: ${C.gray}; 
    padding: 8px 12px; 
    border-bottom: 2px solid ${C.borderLight}; 
    background: ${C.bgSection}; 
    white-space: nowrap; 
  }
  td { 
    padding: 12px; 
    font-size: 13px; 
    border-bottom: 1px solid ${C.borderLight}; 
    vertical-align: middle; 
  }
  tr:last-child td { border-bottom: none; }
`;

const StatusTag = styled.span`
  display: inline-flex; 
  align-items: center; 
  gap: 6px; 
  padding: 6px 12px;
  border-radius: 4px; 
  font-size: 12px; 
  font-weight: 700;
  background: ${p => p.$success ? C.successBg : p.$warning ? C.warningBg : p.$info ? C.infoBg : C.bgField};
  color: ${p => p.$success ? C.success : p.$warning ? C.warning : p.$info ? C.info : C.gray};
  border: 1px solid ${p => p.$success ? '#a7f3d0' : p.$warning ? '#fde68a' : p.$info ? '#bfdbfe' : C.borderLight};
`;

// ─── HorizontalCalendar Component (copied and adapted) ─────────────
// Simple helpers
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toMonday(d) {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - ((day + 6) % 7));
  return r;
}

function dk(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const DOWS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MOS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function HorizontalCalendar({ eventsData = [], selectedDate, onDateSelect }) {
  const [viewStart, setViewStart] = useState(() => toMonday(new Date()));
  const stripRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(7);

  const eventCounts = useMemo(() => {
    const map = {};
    eventsData.forEach((ev) => {
      const date = new Date(ev.date);
      const key = dk(date.getFullYear(), date.getMonth(), date.getDate());
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [eventsData]);

  const todayKey = dk(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 30; i++) {
      const d = addDays(viewStart, i);
      const key = dk(d.getFullYear(), d.getMonth(), d.getDate());
      arr.push({
        date: d,
        key,
        dayName: DOWS[(d.getDay() + 6) % 7],
        dayNum: d.getDate(),
        count: eventCounts[key] || 0,
        isToday: key === todayKey,
        isSelected: selectedDate != null && key === dk(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()),
      });
    }
    return arr;
  }, [viewStart, eventCounts, todayKey, selectedDate]);

  useEffect(() => {
    const targetKey = selectedDate
      ? dk(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
      : todayKey;
    const el = document.getElementById(`dc-${targetKey}`);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 50);
    }
  }, [selectedDate, viewStart, todayKey]);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const measure = () => {
      const available = Math.max(el.clientWidth - 28, 40);
      const count = Math.max(1, Math.floor(available / 44));
      setVisibleCount(Math.min(count, 30));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const title = useMemo(() => {
    const s = addDays(viewStart, 0);
    const e = addDays(viewStart, 29);
    const sm = s.getMonth(), sy = s.getFullYear();
    const em = e.getMonth(), ey = e.getFullYear();
    if (sm === em && sy === ey) return `${MOS_SHORT[sm]} ${sy}`;
    if (sy === ey) return `${MOS_SHORT[sm]}–${MOS_SHORT[em]} ${sy}`;
    return `${MOS_SHORT[sm]} ${sy}–${MOS_SHORT[em]} ${ey}`;
  }, [viewStart]);

  const prevWeek = () => setViewStart((v) => addDays(v, -7));
  const nextWeek = () => setViewStart((v) => addDays(v, 7));
  const goToday = () => {
    const now = new Date();
    setViewStart(toMonday(now));
    if (onDateSelect) onDateSelect(now);
  };

  const pickDate = (date) => {
    if (onDateSelect) onDateSelect(date);
  };

  return (
    <div style={{
      background: 'transparent',
      borderRadius: 10,
      border: 'none',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      width: '100%',
      maxWidth: 2200,
      margin: '0 auto',
    }}>
      {/* Sleek Nav */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 6px 0',
      }}>
        <button
          onClick={prevWeek}
          style={{
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e5e7eb',
            borderRadius: 7,
            background: '#fff',
            color: '#374151',
            cursor: 'pointer',
            fontSize: '12px',
            lineHeight: 1,
            transition: 'all 0.15s',
            outline: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          title="Previous week"
        >
          ←
        </button>

        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#6b7280',
          letterSpacing: '0.3px',
        }}>
          {title}
        </span>

        <button
          onClick={nextWeek}
          style={{
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e5e7eb',
            borderRadius: 7,
            background: '#fff',
            color: '#374151',
            cursor: 'pointer',
            fontSize: '12px',
            lineHeight: 1,
            transition: 'all 0.15s',
            outline: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          title="Next week"
        >
          →
        </button>
      </div>

      {/* Compact Scrollable Strip */}
      <div
        ref={stripRef}
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          overflowX: 'hidden',
          overflowY: 'hidden',
          padding: '2px 0',
          gap: 3,
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          minHeight: 70,
        }}
        className="ds-scroll-hide"
      >
        {days.slice(0, visibleCount).map((day) => {
          const { isToday, isSelected } = day;

          let bg = 'transparent';
          let border = '1.5px solid transparent';
          let shadow = 'none';
          let textColor = '#111827';
          let dayNameColor = '#9ca3af';
          let badgeBg = '#e5e7eb';
          let badgeColor = '#6b7280';

          if (isToday && !isSelected) {
            border = '1.5px solid #d80505';
            bg = 'transparent';
          }
          if (isSelected) {
            bg = 'rgb(244, 0, 0)';
            textColor = '#fff';
            dayNameColor = 'rgba(255,255,255,0.8)';
            badgeBg = 'rgba(255,255,255,0.2)';
            badgeColor = '#fff';
          }

          return (
            <button
              key={day.key}
              id={`dc-${day.key}`}
              onClick={() => pickDate(day.date)}
              style={{
                flex: '1 0 36px',
                padding: '4px 2px 3px',
                borderRadius: 7,
                border,
                background: bg,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: shadow,
                outline: 'none',
                position: 'relative',
                minWidth: 30,
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !isToday) {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = isToday ? 'transparent' : 'transparent';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              <div style={{
                fontSize: '9px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: dayNameColor,
                marginBottom: 1,
                opacity: isSelected ? 1 : 0.7,
              }}>
                {day.dayName}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: isSelected ? 700 : 600,
                color: textColor,
                lineHeight: 1.2,
              }}>
                {day.dayNum}
              </div>
              {day.count > 0 && (
                <div style={{
                  display: 'inline-block',
                  marginTop: 1,
                  fontSize: '7px',
                  fontWeight: 700,
                  padding: '0px 4px',
                  borderRadius: 3,
                  background: badgeBg,
                  color: badgeColor,
                  lineHeight: 1.5,
                  letterSpacing: '0.02em',
                }}>
                  {day.count}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <style>{`.ds-scroll-hide::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
const DeceasedListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = new Date();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState(() => {
    const s = searchParams.get('search');
    return s ? String(s) : '';
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Year filter for fetching
  const [calYear, setCalYear] = useState(() => {
    const y = Number(searchParams.get('year'));
    return Number.isInteger(y) && y >= 1900 && y <= 2200 ? y : today.getFullYear();
  });

  // Selected date for filtering
  const [selectedDate, setSelectedDate] = useState(null);

  const setSearchParamsRef = useRef(null);
  setSearchParamsRef.current = setSearchParams;

  const [showExport, setShowExport] = useState(false);
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [exportPin, setExportPin] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  // Export result notification modal → { type: 'success' | 'error', message, blob, fileName }
  const [exportNotify, setExportNotify] = useState(null);

  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState('');

  const exportCleanupRef = useRef(null);

  // ─── Fetch Deceased ─────────────────────────────────────────────
  const fetchDeceased = useCallback(async () => {
    setLoading(true);
    setServiceUnavailable(false);
    setUnavailableMessage('');
    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-tenant-slug': tenantSlug,
      };

      const collected = [];
      let pageNum = 1;
      const pageSize = 200;
      let totalPages = 2;

      while (pageNum <= totalPages && pageNum <= 12) {
        const params = { year: calYear, page: pageNum, limit: pageSize };
        if (search) params.search = search;

        if (setSearchParamsRef.current) {
          setSearchParamsRef.current(
            { year: calYear, page: pageNum, limit: pageSize },
            { replace: true }
          );
        }

        const res = await axios.get(`${BASE_URL}/deceased-all`, { params, headers });
        const data = res.data?.data || res.data || [];
        const rows = Array.isArray(data) ? data : [];
        collected.push(...rows);

        const pagination = res.data?.pagination;
        if (pagination?.totalPages) {
          totalPages = Math.min(Number(pagination.totalPages) || 1, 12);
        }
        if (rows.length < pageSize) break;
        pageNum += 1;
      }

      setRecords(collected);
      return true;
    } catch (err) {
      console.error("Error fetching deceased:", err);
      setRecords([]);
      if (err.friendlyMessage) {
        setServiceUnavailable(true);
        setUnavailableMessage(err.friendlyMessage);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [search, calYear]);

  useEffect(() => {
    fetchDeceased();
  }, [fetchDeceased]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const ok = await fetchDeceased();
      if (ok) {
        showToast.success('Deceased records refreshed');
      } else {
        showToast.error('Failed to refresh records. Please try again.');
      }
    } catch (err) {
      console.error('Error refreshing deceased records:', err);
      showToast.error('Failed to refresh records. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchDeceased, refreshing]);

  useEffect(() => {
    return () => {
      if (exportCleanupRef.current) {
        exportCleanupRef.current();
      }
    };
  }, []);

  // ─── Filters ─────────────────────────────────────────────────────
  const yearRecords = useMemo(() => {
    if (!calYear) return records;
    return records.filter(r => {
      const admitted = r.created_at || r.date_admitted || r.admission_date;
      const d = new Date(admitted);
      return !isNaN(d.getTime()) && d.getFullYear() === Number(calYear);
    });
  }, [records, calYear]);

  const filteredRecords = yearRecords.filter(r => {
    const name = (r.full_name || r.name || '').toLowerCase();
    const id = (r.deceased_id || r.id || '').toLowerCase();
    const adm = (r.admission_number || r.admission_no || '').toLowerCase();
    const searchTerm = search.toLowerCase();

    if (search && !name.includes(searchTerm) && !id.includes(searchTerm) && !adm.includes(searchTerm)) return false;

        if (statusFilter) {
      const { filter } = getStatusInfo(r.body_status || r.status);
      // Under Care and Admitted overlap by design — a body in our care is
      // tracked in both groups (same behaviour as before).
      if (statusFilter === 'under care') {
        if (filter !== 'under care' && filter !== 'admitted') return false;
      } else if (statusFilter === 'admitted') {
        if (filter !== 'admitted' && filter !== 'under care') return false;
      } else if (statusFilter === 'other') {
        if (filter !== 'other') return false;
      } else if (statusFilter !== filter) {
        return false;
      }
    }

    if (genderFilter) {
      const sex = (r.sex || r.gender || '').toLowerCase();
      if (genderFilter.toLowerCase() !== sex) return false;
    }

    if (selectedDate) {
      const admitted = r.created_at || r.date_admitted || r.admission_date;
      const recordDateStr = toDateString(admitted);
      const selectedDateStr = toDateString(selectedDate);
      if (recordDateStr !== selectedDateStr) return false;
    }

    return true;
  });

  const getInitials = (name) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getDaysInMorgue = (admittedDate) => {
    if (!admittedDate) return 0;
    const days = daysFromNow(admittedDate);
    return days != null ? Math.abs(days) : 0;
  };

  const openProfile = (id) => {
    const tenantSlug = getTenantSlug();
    navigate(`/tenant/${tenantSlug}/deceased?id=${encodeURIComponent(id)}`);
  };

  // ─── Export Functions ───────────────────────────────────────────
  const filenameFromDisposition = (response, fallback) => {
    const disp = String(response?.headers?.['content-disposition'] || '');
    const match = disp.match(/filename="?([^";]+)"?/i);
    return match ? match[1] : fallback;
  };

  // Open the actual generated .xlsx file in the browser (keeps its real name).
  const downloadExportBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Origin where the shared /uploads folder is served from. The global
  // uploader saves exports at /uploads/<slug>/exports/deceased-reports/… —
  // absolute URLs are needed when the API lives on a different origin.
  const uploadsOrigin = () => {
    const api = import.meta.env.VITE_API_URL || '';
    if (/^https?:\/\//i.test(api)) {
      try { return new URL(api).origin; } catch { /* fall through */ }
    }
    return window.location.origin;
  };

  // Download a server-saved export (the /uploads/... URL returned by the
  // export API) straight to the user's device — no browser preview tab.
  // Fetches it as a blob first so the file keeps its real name even when the
  // uploads origin differs from the app origin; falls back to a plain anchor
  // (browsers always download .xlsx — they can't render it) if fetch fails.
  const downloadExportFile = async (fileUrl, fileName) => {
    if (!fileUrl) return false;
    const absFileUrl = /^https?:\/\//i.test(fileUrl)
      ? fileUrl
      : `${uploadsOrigin()}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    try {
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';
      const res = await fetch(absFileUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      downloadExportBlob(await res.blob(), fileName || 'export.xlsx');
      return true;
    } catch {
      // CORS/network fallback — point a plain anchor at the file; the
      // spreadsheet content type makes every browser download it.
      const link = document.createElement('a');
      link.href = absFileUrl;
      link.download = fileName || 'export.xlsx';
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
  };

  // Close the export result notification modal.
  const closeExportNotify = useCallback(() => {
    setExportNotify(null);
  }, []);

  // "Download to device" action from the notify modal — re-saves the file
  // from the server /uploads URL, or re-downloads the streamed blob.
  const downloadExportCopy = useCallback(() => {
    if (exportNotify?.fileUrl) {
      downloadExportFile(exportNotify.fileUrl, exportNotify.fileName);
      return;
    }
    const blob = exportNotify?.blob;
    if (!blob) return;
    downloadExportBlob(blob, exportNotify?.fileName || `Deceased_Records_${todayKey()}.xlsx`);
  }, [exportNotify]);

  const showExportFailed = useCallback((message) => {
    setExporting(false);
    setShowExport(false);
    setExportNotify({
      type: 'error',
      message: message || 'The export could not be completed. Please try again.',
      blob: null,
      fileUrl: null,
      fileName: '',
    });
  }, []);

  const showExportSuccess = useCallback((blob, fileName, pinProtected = false, fileUrl = null) => {
    setExporting(false);
    setShowExport(false);
    setExportNotify({
      type: 'success',
      message: `${fileName || 'Deceased records export'} was generated successfully and saved to your device.${pinProtected ? ' It is PIN-protected — Excel will ask for the PIN when you open it.' : ''}`,
      blob: blob || null,
      fileUrl: fileUrl || null,
      fileName: fileName || '',
    });
  }, []);

  const isFileResponse = (contentType = '') =>
    contentType.includes('spreadsheetml') ||
    contentType.includes('zip') ||
    contentType.includes('octet-stream');

  const parseBlobJson = async (blob) => {
    const text = await blob.text();
    return JSON.parse(text);
  };

  const handleExport = async () => {
    if (exportCleanupRef.current) {
      exportCleanupRef.current();
      exportCleanupRef.current = null;
    }

    // Keep the export panel open while generating — its buttons show the
    // in-progress state and a notify modal reports the result afterwards.
    setExporting(true);
    setExportNotify(null);

    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';

      // Optional 4-digit security PIN — encrypts the .xlsx so only someone
      // with the PIN can open it (Excel / Google Sheets prompt for it).
      const pin = exportPin.trim();
      if (pin && !/^\d{4}$/.test(pin)) {
        showExportFailed('The security PIN must be exactly 4 digits. Please correct it and try again.');
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/export-excel`,
        {
          startDate: exportStart || undefined,
          endDate: exportEnd || undefined,
          exportPin: pin || undefined,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-slug': tenantSlug,
          },
          responseType: 'blob',
          timeout: 30000,
        }
      );

      const contentType = (response.headers?.['content-type'] || '').toLowerCase();

      if (isFileResponse(contentType)) {
        loadExportHistory();
        const fileName = filenameFromDisposition(response, `Deceased_Records_${todayKey()}.xlsx`);
        showExportSuccess(response.data, fileName, pin.length > 0);
        downloadExportBlob(response.data, fileName);
        return;
      }

      const data = await parseBlobJson(response.data);

      // Synchronous export: the backend PIN-encrypts (when requested), saves
      // the workbook to the shared global uploads folder via the global
      // uploader and hands back its /uploads/... URL. Download it straight
      // to the device — no polling, no browser preview.
      if (data?.success && data?.fileUrl) {
        loadExportHistory();
        showExportSuccess(null, data.fileName, !!data.pinProtected, data.fileUrl);
        downloadExportFile(data.fileUrl, data.fileName);
        return;
      }

      // Legacy queue flow (job id → poll until the file is ready).
      if (data?.success && data?.jobId) {
        pollExportStatus(data.jobId, pin.length > 0);
      } else {
        throw new Error(data?.message || 'No export file URL returned');
      }
    } catch (err) {
      console.error('Export error:', err);

      let message = 'Failed to start export. Please try again.';
      if (err?.response?.data && typeof err.response.data.text === 'function') {
        try {
          message = (await parseBlobJson(err.response.data))?.message || message;
        } catch { /* keep default message */ }
      }

      showExportFailed(message);
    }
  };

  const pollExportStatus = async (jobId, pinProtected = false) => {
    const maxAttempts = 90;
    const pollInterval = 2000;
    let attempts = 0;
    let timeoutId;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const fail = (msg) => {
      cleanup();
      showExportFailed(msg);
    };

    const poll = async () => {
      try {
        const tenantSlug = getTenantSlug();
        const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';

        const response = await axios.get(
          `${BASE_URL}/export-status/${jobId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-tenant-slug': tenantSlug,
            },
            responseType: 'blob',
            timeout: 15000,
          }
        );

        const contentType = (response.headers?.['content-type'] || '').toLowerCase();

        if (isFileResponse(contentType)) {
          cleanup();
          loadExportHistory();
          showExportSuccess(response.data, filenameFromDisposition(response, `Deceased_Records_${todayKey()}.xlsx`), pinProtected);
          return;
        }

        let data;
        try {
          data = await parseBlobJson(response.data);
        } catch {
          throw new Error('Unexpected status response');
        }

        if (data?.success && data?.status) {
          attempts++;
          if (attempts < maxAttempts) {
            timeoutId = setTimeout(poll, pollInterval);
          } else {
            cleanup();
            fail('Export is taking longer than expected. Please try again later.');
          }
          return;
        }

        cleanup();
        throw new Error(data?.message || 'Unknown status');
      } catch (err) {
        cleanup();
        console.error('Poll error:', err);

        let serverMessage = '';
        if (err?.response?.data && typeof err.response.data.text === 'function') {
          try {
            serverMessage = (await parseBlobJson(err.response.data))?.message || '';
          } catch { /* ignore parse issues */ }
        }

        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          attempts++;
          if (attempts < maxAttempts) {
            timeoutId = setTimeout(poll, pollInterval);
          } else {
            fail('Export timed out. Please try again.');
          }
          return;
        }

        if (err.response?.status === 404) {
          fail('Export job expired or was not found. Please start a new export.');
          return;
        }

        fail(serverMessage || 'Export failed. Please try again.');
      }
    };

    poll();
    exportCleanupRef.current = cleanup;
    return cleanup;
  };

  // ─── Export History (last 10 files) ─────────────────────────────
  const loadExportHistory = useCallback(async () => {
    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';

      const response = await axios.get(
        `${BASE_URL}/export-history`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-slug': tenantSlug,
          },
        }
      );

      if (response.data?.success && Array.isArray(response.data?.data)) {
        setExportHistory(response.data.data.slice(0, 10));
      } else {
        setExportHistory([]);
      }
    } catch (err) {
      console.error('Failed to fetch export history:', err);
      setExportHistory([]);
    }
  }, []);

  useEffect(() => {
    if (showExport) {
      loadExportHistory();
    }
  }, [showExport, loadExportHistory]);

  const formatGeneratedAt = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '—';
    const kb = Number(bytes) / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const historyCount = () => (Array.isArray(exportHistory) ? exportHistory.length : 0);

  // ─── Calendar event data ────────────────────────────────────────
  // Build events from yearRecords (only admission dates)
  const eventsData = useMemo(() => {
    return yearRecords.map(r => {
      const admitted = r.created_at || r.date_admitted || r.admission_date;
      if (!admitted) return null;
      const date = new Date(admitted);
      if (isNaN(date.getTime())) return null;
      return {
        date: date,
        // Optionally add title for tooltip (we don't display titles)
        title: r.full_name || r.name || 'Deceased',
      };
    }).filter(Boolean);
  }, [yearRecords]);

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <>
      <GlobalFonts />
      <AppContainer>
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Sleek Toolbar */}
        <Toolbar>
          <ToolbarLeft>
            <Btn $danger onClick={handleRefresh} disabled={refreshing || loading}>
              <i className={`fas fa-sync-alt${refreshing ? ' fa-spin' : ''}`}></i> Refresh
            </Btn>

            <SearchWrapper>
              <SearchInput
                type="text"
                placeholder="Search name or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <SearchIcon className="fas fa-search" />
            </SearchWrapper>

            <FilterWrapper>
                            <FilterSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="under care">Under Care</option>
                <option value="admitted">Admitted</option>
                <option value="released">Released</option>
                <option value="completed">Completed</option>
                <option value="other">Cancelled / Maintenance</option>
              </FilterSelect>
              <SelectArrow className="fas fa-chevron-down" />
            </FilterWrapper>

            <FilterWrapper>
              <FilterSelect value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </FilterSelect>
              <SelectArrow className="fas fa-chevron-down" />
            </FilterWrapper>

            {/* Year filter */}
            <FilterWrapper style={{ maxWidth: '120px' }}>
              <FilterSelect value={calYear} onChange={e => setCalYear(Number(e.target.value))}>
                {Array.from({ length: 7 }, (_, i) => today.getFullYear() - 3 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </FilterSelect>
              <SelectArrow className="fas fa-chevron-down" />
            </FilterWrapper>
          </ToolbarLeft>

          <ToolbarRight>
            <Btn $export onClick={() => { setExportPin(''); setShowExport(true); }}>
              <i className="fas fa-file-export"></i> Export Data
            </Btn>
          </ToolbarRight>
        </Toolbar>

        {/* Calendar – HorizontalCalendar */}
        <div style={{ marginBottom: '24px' }}>
          <HorizontalCalendar
            eventsData={eventsData}
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              // If the same date is clicked again, deselect it
              if (selectedDate && toDateString(date) === toDateString(selectedDate)) {
                setSelectedDate(null);
              } else {
                setSelectedDate(date);
              }
            }}
          />
        </div>

        {/* List Card */}
        <ListCard>
          <ListHeader>
            <h2>
              {selectedDate ? `Deceased for ${formatDate(selectedDate)}` : `All Deceased · ${calYear}`} ({filteredRecords.length})
            </h2>
          </ListHeader>

          {serviceUnavailable && (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              background: C.warningBg,
              borderBottom: `1px solid #fde68a`
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 24px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: C.warningBg,
                  color: C.warning,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '700',
                  flexShrink: 0
                }}>
                  <i className="fas fa-exclamation"></i>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: C.dark, marginBottom: '4px' }}>
                    Service Temporarily Unavailable
                  </div>
                  <div style={{ fontSize: '13px', color: C.gray }}>
                    {unavailableMessage}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table */}
          <TableWrap>
            <StyledTable>
              <thead>
                <tr>
                  <th>Deceased Name</th>
                  <th>Admission No.</th>
                  <th>Date Admitted</th>
                  <th>Days in Morgue</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}><LoadingState><div className="spinner" /> Loading records...</LoadingState></td></tr>
                ) : serviceUnavailable ? (
                  <tr><td colSpan={6}><EmptyRow>Unable to load records at this time. Please try again later.</EmptyRow></td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={6}><EmptyRow>No records found matching your filters.</EmptyRow></td></tr>
                ) : filteredRecords.map(r => {
                  const name = r.full_name || r.name || 'Unknown';
                  const id = r.deceased_id || r.id;
                  const adm = r.admission_number || r.admission_no || '—';
                  const admitted = r.created_at || r.date_admitted || r.admission_date;
                  const days = getDaysInMorgue(admitted);
                                    const statusInfo = getStatusInfo(
                    r.body_status || r.admission_status || r.release_status || r.status || 'active'
                  );
                  const sex = r.sex || r.gender || '';
                  const isFemale = sex.toLowerCase() === 'female';
                  return (
                    <tr key={id} onClick={() => openProfile(id)}>
                      <td>
                        <NameCell>
                          <AvatarSm $female={isFemale}>{getInitials(name)}</AvatarSm>
                          <div>
                            <div style={{ fontWeight: 600 }}>{name}</div>
                            <div className="meta">{sex ? `${sex}, ` : ''}{r.age || '—'} yrs</div>
                          </div>
                        </NameCell>
                      </td>
                      <td>{adm}</td>
                      <td>{formatDate(admitted)}</td>
                      <td>{days} days</td>
                      <td>
                        <StatusBadge $bg={statusInfo.bg} $color={statusInfo.color}>
                          {statusInfo.label}
                        </StatusBadge>
                      </td>
                      <td>
                        <Btn $sm $primary onClick={(e) => { e.stopPropagation(); openProfile(id); }}>View Profile</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </StyledTable>
          </TableWrap>

          {/* Mobile Cards */}
          <MobileCardContainer>
            {loading ? (
              <LoadingState><div className="spinner" /> Loading records...</LoadingState>
            ) : serviceUnavailable ? (
              <MobileCard style={{ cursor: 'default', textAlign: 'center' }}>
                Unable to load records at this time. Please try again later.
              </MobileCard>
            ) : filteredRecords.length === 0 ? (
              <MobileCard style={{ cursor: 'default', textAlign: 'center' }}>
                No records found matching your filters.
              </MobileCard>
            ) : (
              filteredRecords.map(r => {
                const name = r.full_name || r.name || 'Unknown';
                const id = r.deceased_id || r.id;
                const adm = r.admission_number || r.admission_no || '—';
                const admitted = r.created_at || r.date_admitted || r.admission_date;
                const days = getDaysInMorgue(admitted);
                                const statusInfo = getStatusInfo(
                  r.body_status || r.admission_status || r.release_status || r.status || 'active'
                );
                const sex = r.sex || r.gender || '';
                const isFemale = sex.toLowerCase() === 'female';

                return (
                  <MobileCard key={id} onClick={() => openProfile(id)}>
                    <MobileCardHeader>
                      <MobileCardNameWrap>
                        <AvatarSm $female={isFemale}>{getInitials(name)}</AvatarSm>
                        <div>
                          <div>{name}</div>
                          <div>{sex ? `${sex}, ` : ''}{r.age || '—'} yrs</div>
                        </div>
                      </MobileCardNameWrap>
                      <StatusBadge $bg={statusInfo.bg} $color={statusInfo.color}>
                        {statusInfo.label}
                      </StatusBadge>
                    </MobileCardHeader>

                    <MobileCardDetails>
                      <div>
                        <span>Admission No.</span>
                        <strong>{adm}</strong>
                      </div>
                      <div>
                        <span>Days in Morgue</span>
                        <strong>{days} days</strong>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <span>Date Admitted</span>
                        <strong>{formatDate(admitted)}</strong>
                      </div>
                    </MobileCardDetails>

                    <MobileCardFooter>
                      <Btn $sm $primary onClick={(e) => { e.stopPropagation(); openProfile(id); }}>
                        View Profile
                      </Btn>
                    </MobileCardFooter>
                  </MobileCard>
                );
              })
            )}
          </MobileCardContainer>
        </ListCard>

        {/* Export Side Panel */}
        <ModalOverlay $open={showExport} onClick={() => !exporting && setShowExport(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <div>
                <h2><i className="fas fa-file-export"></i> Export Data to Excel</h2>
                <p>Generates the official deceased intake register (.xlsx)</p>
              </div>
              <CloseBtn onClick={() => !exporting && setShowExport(false)}>&times;</CloseBtn>
            </ModalHeader>

            <ModalBody>
              <SectionHead $mt0><span>01</span> Select Time Range</SectionHead>
              <FormRow>
                <FormGroup>
                  <FormLabel>Start Date</FormLabel>
                  <ModalInput type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} disabled={exporting} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>End Date</FormLabel>
                  <ModalInput type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} disabled={exporting} />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <FormLabel>Security PIN (optional)</FormLabel>
                <ModalInput
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  placeholder="Enter a 4-digit PIN to encrypt the file"
                  maxLength={4}
                  value={exportPin}
                  onChange={e => setExportPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  disabled={exporting}
                />
                <div style={{ fontSize: 11, color: C.gray, marginTop: 6 }}>
                  <i className="fas fa-lock" style={{ marginRight: 5 }}></i>
                  The file will be encrypted — Excel or Google Sheets will ask for this PIN to open it. Leave blank to export without protection.
                </div>
              </FormGroup>

              <SectionHead $mt4>
                <span>02</span> Export History
                <em style={{ marginLeft: 8, opacity: 0.6 }}>limit: 10 most recent</em>
              </SectionHead>
              {historyCount() === 0 ? (
                <EmptyHistory>
                  <div style={{ fontSize: 22, opacity: 0.5, marginBottom: 6 }}><i className="fas fa-folder-open"></i></div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>No exports yet</div>
                  <div>Your last 10 exported files will appear here.</div>
                </EmptyHistory>
              ) : (
                <HistorySection>
                  {exportHistory.slice(0, 10).map(h => (
                    <HistoryItem key={h.id || h.fileName}>
                      <StatusTag
                        $success={h.status === 'success'}
                        $warning={h.status !== 'success'}
                        style={{ padding: '4px 8px', fontSize: 10 }}
                      >
                        {h.status === 'success' ? '✓' : '✕'}
                      </StatusTag>
                      <div className="h-file">
                        <div className="h-name">
                          <i className="fas fa-file-excel" style={{ fontSize: 11, marginRight: 5 }}></i>
                          {h.fileName}
                        </div>
                        <div className="h-meta">
                          {formatGeneratedAt(h.generatedAt)} • {h.recordCount || 0} records • {formatFileSize(h.fileSize)}
                        </div>
                        {h.trackingId && (
                          <div className="h-meta" style={{ color: C.export, fontFamily: 'monospace', fontWeight: 700 }}>
                            Tracking ID: {h.trackingId}
                          </div>
                        )}
                        {h.fileUrl ? (
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <a
                              className="h-link"
                              href="#download"
                              onClick={(e) => {
                                e.preventDefault();
                                downloadExportFile(h.fileUrl, h.fileName);
                              }}
                            >
                              <i className="fas fa-download"></i> Download to device
                            </a>
                          </div>
                        ) : (
                          <span className="h-meta" style={{ color: C.gray }}>
                            Saved to global uploads
                          </span>
                        )}
                      </div>
                    </HistoryItem>
                  ))}
                </HistorySection>
              )}
            </ModalBody>
            <ModalFooter>
              <div style={{ fontSize: 11, color: C.gray, marginRight: 'auto' }}>
                {exporting ? (exportPin ? 'Encrypting & uploading via global uploader…' : 'Generating & uploading via global uploader…') : 'Exports download straight to your device — no browser preview'}
              </div>
              <Btn $ghost onClick={() => setShowExport(false)} disabled={exporting}>Cancel</Btn>
              <Btn $export onClick={handleExport} disabled={exporting}>
                {exporting ? 'Exporting...' : (<><i className="fas fa-file-excel"></i> Generate Export</>)}
              </Btn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>

        {/* Export Result Notification Modal */}
        {exportNotify && (
          <NotifyOverlay onClick={closeExportNotify}>
            <NotifyCard onClick={e => e.stopPropagation()}>
              <NotifyIcon
                style={{
                  background: exportNotify.type === 'success' ? C.successBg : C.dangerBg,
                  color: exportNotify.type === 'success' ? C.success : C.danger,
                }}
              >
                <i className={exportNotify.type === 'success' ? 'fas fa-check' : 'fas fa-xmark'}></i>
              </NotifyIcon>
              <NotifyTitle style={{ color: exportNotify.type === 'success' ? C.success : C.danger }}>
                {exportNotify.type === 'success' ? 'Success' : 'Failed'}
              </NotifyTitle>
              <NotifyMessage>
                {exportNotify.type === 'success'
                  ? (exportNotify.message || 'Your export was generated successfully.')
                  : (exportNotify.message || 'The export could not be completed. Please try again.')}
              </NotifyMessage>
              {exportNotify.type === 'success' && (exportNotify.blob || exportNotify.fileUrl) && (
                <NotifyActions>
                  <Btn
                    $export
                    onClick={downloadExportCopy}
                    style={{ whiteSpace: 'normal', height: 'auto', minHeight: 42, padding: '10px 18px' }}
                  >
                    <i className="fas fa-download"></i>
                    Download to device
                  </Btn>
                </NotifyActions>
              )}
              <NotifyActions>
                <Btn $ghost onClick={closeExportNotify}>Close</Btn>
              </NotifyActions>
              <NotifyHint>
                <i className="fas fa-circle-info"></i>
                {exportNotify.type === 'success'
                  ? 'A copy of this file is also saved in Documents.'
                  : 'Nothing was downloaded. Please try again.'}
              </NotifyHint>
            </NotifyCard>
          </NotifyOverlay>
        )}
      </AppContainer>
    </>
  );
};

export default DeceasedListPage;