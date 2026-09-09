import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import axios from 'axios';
import { getTenantSlug, getAuthToken } from '../../../utils/globalAuth';
import { showToast } from '../../../utils/toast';
import { ToastContainer } from 'react-toastify';
import {
  formatDate,
  daysFromNow,
  todayKey,
} from '../../../utils/dates/parseDates';
import 'react-toastify/dist/ReactToastify.css';

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
    overflow-x: hidden; /* Prevents global horizontal scroll */
    background-color: #ececec;
  }
`;

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

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
  
  // Accent / Scrollbar
  accent: '#DD2D4A',
};

// ─── Status Configuration ───────────────────────────────────────────
const STATUS_CONFIG = {
  active: { label: 'Active', color: C.cBlue, bg: 'rgba(0, 41, 107, 0.1)' },
  'in morgue': { label: 'In Morgue', color: C.cBlue, bg: 'rgba(0, 41, 107, 0.1)' },
  'postmortem requested': { label: 'Postmortem Requested', color: C.cOrange, bg: 'rgba(227, 100, 20, 0.1)' },
  'pending autopsy': { label: 'Postmortem Done', color: C.cPurple, bg: 'rgba(95, 15, 64, 0.1)' },
  'postmortem done': { label: 'Postmortem Done', color: C.cPurple, bg: 'rgba(95, 15, 64, 0.1)' },
  pending: { label: 'Pending', color: C.cPink, bg: 'rgba(221, 45, 74, 0.1)' },
  released: { label: 'Released', color: C.cNavy, bg: 'rgba(3, 7, 30, 0.1)' },
  completed: { label: 'Released', color: C.cNavy, bg: 'rgba(3, 7, 30, 0.1)' },
  complete: { label: 'Released', color: C.cNavy, bg: 'rgba(3, 7, 30, 0.1)' },
  buried: { label: 'Buried', color: C.cNavy, bg: 'rgba(3, 7, 30, 0.1)' },
  transferred: { label: 'Transferred', color: C.cNavy, bg: 'rgba(3, 7, 30, 0.1)' },
  'in care': { label: 'In Care', color: C.cBlue, bg: 'rgba(0, 41, 107, 0.1)' },
  embalmed: { label: 'In Care', color: C.cBlue, bg: 'rgba(0, 41, 107, 0.1)' },
  default: { label: 'Unknown', color: '#6b7280', bg: '#f3f4f6' }
};

const getStatusInfo = (statusStr) => {
  const s = (statusStr || 'active').toLowerCase();
  return STATUS_CONFIG[s] || STATUS_CONFIG.default;
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

// ─── Styled Components ──────
const AppContainer = styled.div`
  font-family: 'Source Sans 3', -apple-system, sans-serif;
  color: ${C.dark};
  font-size: 14px;
  line-height: 1.5;
  min-height: 100dvh;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
  max-width: 1400px;
  animation: ${fadeIn} 0.25s ease-out;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
  
  h1 {
    font-family: 'Merriweather', serif;
    font-size: 28px;
    color: ${C.black};
    font-weight: 900;
    margin: 0;
  }
  p {
    color: ${C.gray};
    font-size: 15px;
    margin-top: 4px;
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

// ─── Calendar Strip ─────────────────────────────────────────────────
const CalendarContainer = styled.div`
  background: white;
  border: 1px solid ${C.borderLight};
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden; /* Crucial: keeps it inside the box */

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
  }
`;

const CalendarControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  border-right: 1px solid ${C.border};
  padding-right: 24px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    border-right: none;
    padding-right: 0;
    padding-bottom: 12px;
    border-bottom: 1px solid ${C.borderLight};
  }
`;

const CalSelect = styled.select`
  border: 1px solid transparent;
  background: ${C.bgField};
  font-family: 'Source Sans 3', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: ${C.black};
  cursor: pointer;
  border-radius: 6px;
  padding: 8px 12px;
  transition: 0.2s;
  &:hover { background: #eaeae6; }
  &:focus { outline: none; border-color: ${C.gray}; }
`;

const CalendarDates = styled.div`
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start;
  gap: 8px;
  padding: 4px 2px 8px;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0; /* Crucial: allows flex child to shrink and scroll */
  max-width: 100%;
  align-items: center;
  scroll-behavior: smooth;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: ${C.accent} ${C.bgField};

  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-track { background: ${C.bgField}; border-radius: 10px; }
  &::-webkit-scrollbar-thumb { background: ${C.accent}; border-radius: 10px; }
  &::-webkit-scrollbar-thumb:hover { background: #b71f38; }
`;

const CalDateBtn = styled.div`
  flex: 0 0 auto;
  min-width: 52px;
  padding: 8px 6px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  &:hover { background: ${C.bgField}; }

  ${p => p.$active && `
    background: ${C.accent};
    color: white;
    box-shadow: 0 4px 12px rgba(221, 45, 74, 0.4);
  `}
`;

const CalWeekday = styled.div`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.6;
  line-height: 1;
`;

const CalDayNum = styled.div`
  font-size: 18px;
  font-weight: 700;
  font-family: 'Merriweather', serif;
  line-height: 1;
`;

const EventDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${p => p.$active ? 'white' : p.$color || C.gray};
  box-shadow: 0 0 6px ${p => p.$active ? 'rgba(255,255,255,0.8)' : `rgba(${p.$rgb || '0,0,0'}, 0.6)`};
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
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
  overflow-x: auto; /* Allows table to scroll internally */
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    display: none; /* Hide table on mobile, show cards instead */
  }
`;

const StyledTable = styled.table`
  width: 100%; 
  border-collapse: collapse; 
  min-width: 900px; /* Ensures it doesn't squish too much, scrolls instead */
  
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

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
  background: ${p => p.$bg};
  color: ${p => p.$color};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${p => p.$color};
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

// ─── Modal Components ───────────────────────────────────────────────
const ModalOverlay = styled.div`
  display: ${p => p.$open ? 'flex' : 'none'};
  position: fixed; 
  inset: 0; 
  background: rgba(0,0,0,0.5); 
  z-index: 1000;
  justify-content: center; 
  align-items: center; 
  padding: 20px;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
  }
`;

const ModalContent = styled.div`
  background: white; 
  border-radius: 16px; 
  width: 100%; 
  max-width: 700px;
  max-height: 90dvh;
  overflow-y: auto; 
  -webkit-overflow-scrolling: touch;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);

  @media (max-width: 768px) {
    max-width: 100%;
    max-height: 90dvh;
    border-radius: 16px 16px 0 0;
    margin-top: auto;
    margin-bottom: 0;
  }
`;

const ModalHeader = styled.div`
  padding: 20px 24px; 
  border-bottom: 1px solid ${C.borderLight};
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  
  h2 { 
    font-family: 'Merriweather', serif; 
    font-size: 18px; 
    color: ${C.black}; 
    margin: 0; 
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const ModalFooter = styled.div`
  padding: 16px 24px; 
  border-top: 1px solid ${C.borderLight}; 
  display: flex; 
  gap: 8px; 
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

const ProgressWidget = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border: 1px solid ${C.borderLight};
  z-index: 2000;
  min-width: 320px;
  animation: ${fadeIn} 0.3s ease-out;

  @media (max-width: 768px) {
    left: 16px;
    right: 16px;
    bottom: 16px;
    min-width: auto;
    width: calc(100% - 32px);
    padding: 16px;
  }
`;

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

  // Calendar State
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(() => {
    const y = Number(searchParams.get('year'));
    return Number.isInteger(y) && y >= 1900 && y <= 2200 ? y : today.getFullYear();
  });

  const setSearchParamsRef = useRef(null);
  setSearchParamsRef.current = setSearchParams;
  const [selectedDate, setSelectedDate] = useState(null);
  const activeDateRef = useRef(null);

  const [showExport, setShowExport] = useState(false);
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);

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
    } catch (err) {
      console.error("Error fetching deceased:", err);
      setRecords([]);
      if (err.friendlyMessage) {
        setServiceUnavailable(true);
        setUnavailableMessage(err.friendlyMessage);
      }
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
      await fetchDeceased();
      showToast('Deceased records refreshed', 'success');
    } catch (err) {
      showToast('Failed to refresh records. Please try again.', 'error');
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

  useEffect(() => {
    if (activeDateRef.current) {
      activeDateRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedDate, calMonth, calYear]);

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
      const statusInfo = getStatusInfo(r.body_status || r.status);
      if (statusFilter === 'Active' && statusInfo.label !== 'Active' && statusInfo.label !== 'Pending') return false;
      if (statusFilter === 'Postmortem Requested' && statusInfo.label !== 'Postmortem Requested') return false;
      if (statusFilter === 'Postmortem Done' && statusInfo.label !== 'Postmortem Done' && statusInfo.label !== 'Pending Autopsy') return false;
      if (statusFilter === 'Released' && statusInfo.label !== 'Released' && statusInfo.label !== 'Transferred' && statusInfo.label !== 'Buried') return false;
    }

    if (genderFilter) {
      const sex = (r.sex || r.gender || '').toLowerCase();
      if (genderFilter.toLowerCase() !== sex) return false;
    }

    if (selectedDate) {
      const admitted = r.created_at || r.date_admitted || r.admission_date;
      const recordDateStr = toDateString(admitted);
      if (recordDateStr !== selectedDate) return false;
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
  const downloadExportBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const resetExportState = useCallback(() => {
    setExporting(false);
    setShowExport(false);
    setExportStatus('');
    setExportProgress(0);
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

    setExporting(true);
    setShowExport(false); 
    setExportProgress(0);
    setExportStatus('Queuing export job...');

    try {
      const tenantSlug = getTenantSlug();
      const token = getAuthToken ? getAuthToken() : localStorage.getItem('token') || '';

      const response = await axios.post(
        `${BASE_URL}/export-excel`,
        {
          startDate: exportStart || undefined,
          endDate: exportEnd || undefined,
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
        setExportStatus('Download started...');
        downloadExportBlob(response.data, `Deceased_Records_${todayKey()}.xlsx`);
        showToast('Export completed successfully!', 'success');
        setTimeout(resetExportState, 1500);
        return;
      }

      const data = await parseBlobJson(response.data);

      if (data?.success && data?.jobId) {
        setExportStatus('Processing export...');
        pollExportStatus(data.jobId);
      } else {
        throw new Error(data?.message || 'No job ID returned');
      }
    } catch (err) {
      console.error('Export error:', err);

      let message = 'Failed to start export. Please try again.';
      if (err?.response?.data && typeof err.response.data.text === 'function') {
        try {
          message = (await parseBlobJson(err.response.data))?.message || message;
        } catch { /* keep default message */ }
      }

      showToast(message, 'error');
      resetExportState();
    }
  };

  const pollExportStatus = async (jobId) => {
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
      showToast(msg, 'error');
      resetExportState();
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
          downloadExportBlob(response.data, `Deceased_Records_${todayKey()}.zip`);
          showToast('Export completed successfully!', 'success');
          setTimeout(resetExportState, 1500);
          return;
        }

        let data;
        try {
          data = await parseBlobJson(response.data);
        } catch {
          throw new Error('Unexpected status response');
        }

        if (data?.success && data?.status) {
          setExportProgress(data.progress || 0);
          setExportStatus(data.message || `Processing export... (${data.status})`);

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
            showToast('Connection hiccup - retrying...', 'warning');
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

  useEffect(() => {
    const fetchExportHistory = async () => {
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

        if (response.data?.success && response.data?.data) {
          setExportHistory(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch export history:', err);
      }
    };

    if (showExport) {
      fetchExportHistory();
    }
  }, [showExport]);

  // ─── Calendar Helpers ────────────────────────────────────────────
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Array.from({ length: 7 }, (_, i) => today.getFullYear() - 5 + i);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  const eventColorByDate = useMemo(() => {
    const map = {};
    yearRecords.forEach(r => {
      const admitted = r.created_at || r.date_admitted || r.admission_date;
      const key = toDateString(admitted);
      if (key) {
        const statusInfo = getStatusInfo(r.body_status || r.status);
        map[key] = { color: statusInfo.color, rgb: hexToRgb(statusInfo.color) };
      }
    });
    return map;
  }, [yearRecords]);

  const handleMonthChange = (e) => {
    setCalMonth(parseInt(e.target.value));
    setSelectedDate(null);
  };

  const handleYearChange = (e) => {
    setCalYear(parseInt(e.target.value));
    setSelectedDate(null);
  };

  const handleDateClick = (dateStr) => {
    setSelectedDate(prev => prev === dateStr ? null : dateStr);
  };

  return (
    <>
      <GlobalFonts />
      <AppContainer>
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Header */}
        <PageHeader>
          <h1>Deceased Records</h1>
          <p>Manage and track all deceased records across your facility</p>
        </PageHeader>

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
                <option value="Active">Active / In Morgue</option>
                <option value="Postmortem Requested">Postmortem Requested</option>
                <option value="Postmortem Done">Postmortem Done</option>
                <option value="Released">Released / Transferred</option>
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
          </ToolbarLeft>
          
          <ToolbarRight>
            <Btn $export onClick={() => setShowExport(true)}>
              <i className="fas fa-file-export"></i> Export Data
            </Btn>
          </ToolbarRight>
        </Toolbar>

        {/* Calendar */}
        <CalendarContainer>
          <CalendarControls>
            <CalSelect value={calMonth} onChange={handleMonthChange}>
              {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </CalSelect>
            <CalSelect value={calYear} onChange={handleYearChange}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </CalSelect>
          </CalendarControls>
          <CalendarDates>
            <CalDateBtn
              $active={!selectedDate}
              onClick={() => setSelectedDate(null)}
              style={{ minWidth: '40px', alignSelf: 'center' }}
            >
              <CalWeekday>View</CalWeekday>
              <CalDayNum style={{ fontSize: '13px', fontFamily: 'Source Sans 3, sans-serif' }}>All</CalDayNum>
            </CalDateBtn>

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const loopDate = new Date(calYear, calMonth, day);
              const dateStr = toDateString(loopDate);
              const weekday = loopDate.toLocaleDateString('en-US', { weekday: 'short' });
              const eventData = eventColorByDate[dateStr];
              const isActive = selectedDate === dateStr;

              return (
                <CalDateBtn
                  key={day}
                  $active={isActive}
                  onClick={() => handleDateClick(dateStr)}
                  ref={isActive ? activeDateRef : null}
                  title={eventData ? `Records admitted on this day` : undefined}
                >
                  <CalWeekday>{weekday}</CalWeekday>
                  <CalDayNum>{day}</CalDayNum>
                  {eventData && <EventDot $active={isActive} $color={eventData.color} $rgb={eventData.rgb} />}
                </CalDateBtn>
              );
            })}
          </CalendarDates>
        </CalendarContainer>

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
                  const statusInfo = getStatusInfo(r.body_status || r.status);
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
                const statusInfo = getStatusInfo(r.body_status || r.status);
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

        {/* Export Modal */}
        <ModalOverlay $open={showExport} onClick={() => !exporting && setShowExport(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <h2>Export Data to Excel</h2>
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

              <SectionHead $mt4><span>02</span> Export History</SectionHead>
              <div style={{ border: `1px solid ${C.borderLight}`, borderRadius: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <DataTable>
                  <thead>
                    <tr>
                      <th>Date Generated</th>
                      <th>Time Range</th>
                      <th>Format</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: C.gray, padding: '24px' }}>
                          No export history available.
                        </td>
                      </tr>
                    ) : (
                      exportHistory.map((h, i) => (
                        <tr key={i}>
                          <td>{h.date}</td>
                          <td>{h.range}</td>
                          <td>{h.format}</td>
                          <td><StatusTag $success>{h.status}</StatusTag></td>
                          <td><Btn $sm>Download</Btn></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </DataTable>
              </div>
            </ModalBody>
            <ModalFooter>
              <Btn $ghost onClick={() => setShowExport(false)} disabled={exporting}>Cancel</Btn>
              <Btn $export onClick={handleExport} disabled={exporting}>
                {exporting ? 'Exporting...' : 'Generate Export'}
              </Btn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>

        {/* Export Progress Widget */}
        {exporting && (
          <ProgressWidget>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: C.bgField,
                color: C.exportBtn,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <i className="fas fa-file-export" style={{ fontSize: 14 }}></i>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, fontFamily: 'Merriweather' }}>
                Export Progress
              </div>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              background: C.bgField,
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{
                width: `${exportProgress}%`,
                height: '100%',
                background: exportStatus === 'Completed' ? C.success : C.accent,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: '4px' }}>
              {exportStatus}
            </div>
            <div style={{ fontSize: 11, color: C.lightGray }}>
              {exportProgress < 100 ? `Attempt ${Math.ceil(exportProgress / 10)} of 10` : 'Complete'}
            </div>
            {exportProgress >= 80 && exportProgress < 100 && (
              <div style={{
                fontSize: 11,
                color: C.warning,
                marginTop: '8px',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <i className="fas fa-exclamation-triangle"></i> Taking longer than expected...
              </div>
            )}
          </ProgressWidget>
        )}
      </AppContainer>
    </>
  );
};

export default DeceasedListPage;