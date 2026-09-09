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

// ─── Global Font Styles ─────────────────────────────────────────────
const GlobalFonts = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
`;

const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;

// ─── Color Variables ────────────────────────────────────────────────
const C = {
  black: '#0a0a0a',
  dark: '#1a1a1a',
  mid: '#444444',
  gray: '#777777',
  lightGray: '#aaaaaa',
  border: '#c8c8c8',
  borderLight: '#e0e0e0',
  bgField: '#f7f7f5',
  bgAccent: '#f0eeea',
  bgSection: '#fafaf9',
  bgApp: '#ececec',
  exportBtn: '#0F3040',
  success: '#059669',
  successBg: '#ecfdf5',
  warning: '#d97706',
  warningBg: '#fef3c7',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#2563eb',
  infoBg: '#eff6ff',
  brown: '#795548',
};

// ─── Status Configuration ───────────────────────────────────────────
const STATUS_CONFIG = {
  active: { label: 'Active', color: '#1e3a8a', bg: '#e0e7ff' },
  'in morgue': { label: 'In Morgue', color: '#1e3a8a', bg: '#e0e7ff' },
  'postmortem requested': { label: 'Postmortem Requested', color: '#6d28d9', bg: '#f3e8ff' },
  'pending autopsy': { label: 'Postmortem Done', color: '#b45309', bg: '#fffbeb' },
  'postmortem done': { label: 'Postmortem Done', color: '#b45309', bg: '#fffbeb' },
  pending: { label: 'Pending', color: '#b45309', bg: '#fffbeb' },
  released: { label: 'Released', color: '#047857', bg: '#ecfdf5' },
  completed: { label: 'Released', color: '#047857', bg: '#ecfdf5' },
  complete: { label: 'Released', color: '#047857', bg: '#ecfdf5' },
  buried: { label: 'Buried', color: '#047857', bg: '#ecfdf5' },
  transferred: { label: 'Transferred', color: '#6b7280', bg: '#f3f4f6' },
  'in care': { label: 'In Care', color: '#1e3a8a', bg: '#e0e7ff' },
  embalmed: { label: 'In Care', color: '#1e3a8a', bg: '#e0e7ff' },
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
  margin: 0;
  padding: 0;
  animation: ${fadeIn} 0.25s ease-out;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  @media (min-width: 901px) {
    margin: 0 auto;
    max-width: 1400px;
    padding: 32px;
    overflow-x: hidden;
    overflow-x: clip;
  }


  @media (max-width: 900px) {
    padding: 16px;
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
  box-sizing: border-box;
  
  h1 {
    font-family: 'Merriweather', serif;
    font-size: 24px;
    color: ${C.black};
    margin: 0;
  }
  p {
    color: ${C.gray};
    font-size: 14px;
    margin: 4px 0 0;
  }

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    h1 { font-size: 22px; }
    p { font-size: 13px; }
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  box-sizing: border-box;

  @media (max-width: 900px) {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }
`;

const Btn = styled.button`
  height: 38px;
  padding: 0 16px; 
  border-radius: 4px; 
  font-weight: 600; 
  font-size: 13px;
  cursor: pointer; 
  border: 1px solid ${C.border}; 
  background: white; 
  color: ${C.dark};
  transition: 0.15s; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  gap: 6px;
  font-family: 'Source Sans 3', sans-serif;
  white-space: nowrap;
  box-sizing: border-box;
  
  &:hover { background: ${C.bgField}; border-color: ${C.gray}; }
  
  ${p => p.$primary && `background: ${C.black}; color: white; border-color: ${C.black};
    &:hover { background: ${C.dark}; }`}
    
  ${p => p.$danger && `background: ${C.danger}; color: white; border-color: ${C.danger};
    &:hover { background: #b91c1c; }`}
    
  ${p => p.$export && `background: ${C.exportBtn}; color: white; border-color: ${C.exportBtn};
    &:hover { background: #0c2530; }`}
    
  ${p => p.$sm && `height: 30px; padding: 0 12px; font-size: 12px;`}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 900px) {
    width: 100%;
  }
`;

// ─── Sleek Calendar Components ──────────────────────────────────────
const CalendarContainer = styled.div`
  background: white;
  border: 1px solid ${C.borderLight};
  border-radius: 10px;
  padding: 8px 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
  gap: 16px;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
  }
`;

const CalendarControls = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  border-right: 1px solid ${C.borderLight};
  padding-right: 16px;

  @media (max-width: 900px) {
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
  font-size: 13px;
  font-weight: 700;
  color: ${C.black};
  cursor: pointer;
  border-radius: 6px;
  padding: 6px 8px;
  transition: 0.2s;
  &:hover { background: ${C.borderLight}; }
  &:focus { outline: none; border-color: ${C.gray}; }
`;



const CalendarDates = styled.div`
  display: flex;
  /* Big screens: wrap the days into tidy rows so EVERY date fits — no
     horizontal overflow, nothing clipped by the card. Small screens keep
     the classic single-line scroll strip. */
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 6px;
  padding: 4px 2px 6px;
  flex: 1;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  align-items: center;

  @media (max-width: 900px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: ${C.border} transparent;

    &::-webkit-scrollbar { height: 6px; }
    &::-webkit-scrollbar-track { background: ${C.bgField}; border-radius: 10px; }
    &::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; }
    &::-webkit-scrollbar-thumb:hover { background: ${C.gray}; }
  }
`;



const CalDateBtn = styled.div`
  flex: 0 0 auto;
  min-width: 42px;
  padding: 6px 4px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  &:hover { background: ${C.bgField}; }

  ${p => p.$active && `
    background: ${C.black};
    color: white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  `}

  @media (max-width: 600px) {
    min-width: 34px;
    padding: 4px 2px;
  }
`;

const CalWeekday = styled.div`
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.6;
  line-height: 1;
`;

const CalDayNum = styled.div`
  font-size: 15px;
  font-weight: 700;
  font-family: 'Merriweather', serif;
  line-height: 1;
`;

const EventDot = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${p => p.$active ? '#fca5a5' : C.danger};
  box-shadow: 0 0 5px rgba(220, 38, 38, 0.55);
  position: absolute;
  bottom: 3px;
  opacity: 1;
`;

// ─── List Components ────────────────────────────────────────────────
const ListCard = styled.div`
  background: white;
  border: 1px solid ${C.borderLight};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
`;

const ListHeader = styled.div`
  background: ${C.bgSection};
  padding: 16px 24px;
  border-bottom: 1px solid ${C.borderLight};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  box-sizing: border-box;
  h2 { 
    font-family: 'Merriweather', serif;
    font-size: 16px; 
    font-weight: 700; 
    color: ${C.black}; 
    margin: 0; 
  }

  @media (max-width: 900px) {
    padding: 16px;
  }
`;

const FilterToolbar = styled.div`
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid ${C.borderLight};
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  box-sizing: border-box;

  @media (max-width: 900px) {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    
    > * {
      width: 100% !important;
      flex: 1 1 100% !important;
      min-width: 100% !important;
    }
  }
`;

const FormInput = styled.input`
  height: 38px; 
  border: 1px solid ${C.border};
  border-radius: 4px;
  padding: 0 12px;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 13px;
  color: ${C.dark};
  background: ${p => p.$search ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23777' stroke-width='2' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cpath d='m21 21-4.35-4.35'%3E%3C/path%3E%3C/svg%3E") no-repeat 10px center, ${C.bgField}` : C.bgField};
  background-size: ${p => p.$search ? '16px, auto' : 'auto'};
  padding-left: ${p => p.$search ? '34px' : '12px'};
  transition: border-color 0.15s;
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${C.black}; background-color: white; }
`;

const FormSelect = styled.select`
  height: 38px; 
  border: 1px solid ${C.border};
  border-radius: 4px;
  padding: 0 12px;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 13px; 
  color: ${C.dark};
  background: ${C.bgField};
  transition: border-color 0.15s;
  cursor: pointer;
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${C.black}; background-color: white; }
`;

const TableWrap = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 900px) {
    display: none;
  }
`;

const StyledTable = styled.table`
  width: 100%; 
  border-collapse: collapse; 
  min-width: 800px;
  
  thead th {
    text-align: left; 
    padding: 12px 24px; 
    font-size: 11px; 
    font-weight: 700;
    text-transform: uppercase; 
    letter-spacing: 0.08em; 
    color: ${C.gray};
    border-bottom: 1px solid ${C.borderLight}; 
    background: ${C.bgSection}; 
    white-space: nowrap;
  }
  
  tbody tr {
    border-bottom: 1px solid ${C.borderLight}; 
    cursor: pointer; 
    transition: background 0.1s;
    &:last-child { border-bottom: none; }
    &:hover { background: ${C.bgField}; }
  }
  
  td { 
    padding: 16px 24px; 
    font-size: 14px; 
    color: ${C.dark}; 
    vertical-align: middle; 
  }
`;

const MobileCardContainer = styled.div`
  display: none;
  
  @media (max-width: 900px) {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
`;

const MobileCard = styled.div`
  background: white;
  border: 1px solid ${C.borderLight};
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: 0.2s;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;

  &:active {
    transform: scale(0.98);
    background: ${C.bgField};
  }

  @media (max-width: 600px) {
    padding: 12px;
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
`;

const MobileCardDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid ${C.borderLight};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 10px;
    padding-top: 12px;
  }

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

const AvatarSm = styled.div`
  width: 36px; 
  height: 36px; 
  border-radius: 50%; 
  color: white;
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-weight: 700; 
  font-size: 14px; 
  flex-shrink: 0;
  background: ${p => p.$female ? C.brown : C.black};
`;

const NameCell = styled.div`
  display: flex; 
  align-items: center; 
  gap: 12px;
  .meta { font-size: 12px; color: ${C.gray}; margin-top: 2px; }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
  white-space: nowrap;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  border: 1px solid ${p => p.$border};

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
    border-top-color: ${C.black}; 
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
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

  @media (max-width: 900px) {
    padding: 0;
    align-items: flex-end;
  }
`;

const ModalContent = styled.div`
  background: white; 
  border-radius: 8px; 
  width: 100%; 
  max-width: 700px;
  max-height: 90dvh;
  overflow-y: auto; 
  -webkit-overflow-scrolling: touch;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);

  @media (max-width: 900px) {
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
  box-sizing: border-box;
  h2 { 
    font-family: 'Merriweather', serif; 
    font-size: 18px; 
    color: ${C.black}; 
    margin: 0; 
  }

  @media (max-width: 900px) {
    padding: 16px;
    h2 { font-size: 16px; }
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  box-sizing: border-box;

  @media (max-width: 900px) {
    padding: 16px;
  }
`;

const ModalFooter = styled.div`
  padding: 16px 24px; 
  border-top: 1px solid ${C.borderLight}; 
  text-align: right; 
  display: flex; 
  gap: 8px; 
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  background: white;
  box-sizing: border-box;

  @media (max-width: 900px) {
    padding: 16px;
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

  @media (max-width: 900px) {
    padding: 8px 12px;
    font-size: 11px;
    margin-bottom: 16px;
    ${p => p.$mt4 && 'margin-top: 24px;'}
  }
`;

const FormRow = styled.div`
  display: flex; 
  gap: 16px; 
  margin-bottom: 16px; 
  flex-wrap: wrap;

  @media (max-width: 900px) {
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
  height: 38px; 
  width: 100%; 
  border: 1px solid ${C.border}; 
  border-radius: 4px;
  padding: 0 12px; 
  font-family: 'Source Sans 3', sans-serif; 
  font-size: 14px;
  color: ${C.dark}; 
  background: ${C.bgField}; 
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${C.black}; background: white; }
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
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border: 1px solid ${C.borderLight};
  z-index: 2000;
  min-width: 320px;
  animation: ${fadeIn} 0.3s ease-out;
  box-sizing: border-box;

  @media (max-width: 900px) {
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
    // The URL is the source of truth for the year (?year=2026) so a
    // shared/bookmarked link reopens the exact same view.
    const y = Number(searchParams.get('year'));
    return Number.isInteger(y) && y >= 1900 && y <= 2200 ? y : today.getFullYear();
  });

  // Stable handle for URL sync inside callbacks (prevents refetch loops —
  // react-router's setSearchParams identity can change across navigations).
  const setSearchParamsRef = useRef(null);
  setSearchParamsRef.current = setSearchParams;
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD'
  const activeDateRef = useRef(null);

  const [showExport, setShowExport] = useState(false);
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [exportJobId, setExportJobId] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);

  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState('');

  const exportCleanupRef = useRef(null);

  // ─── Fetch Deceased (per selected calendar year) ─────────────────
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

      // Pull the whole selected year page by page so the calendar dots
      // and the list reflect every record of that year (not just 50).
      const collected = [];
      let pageNum = 1;
      const pageSize = 200;
      let totalPages = 2;

      while (pageNum <= totalPages && pageNum <= 12) {
        const params = { year: calYear, page: pageNum, limit: pageSize };
        if (search) params.search = search;

        // Append the plain query to the browser URL (year/page/limit only —
        // no search text, so no special characters for crawlers to choke on):
        // /all-deceased?year=2026&page=1&limit=100
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
      console.error('Error fetching deceased:', err);
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

  // ─── Manual Refresh (red header button) ─────────────────────────
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

  // Scroll active date into view
  useEffect(() => {
    if (activeDateRef.current) {
      activeDateRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedDate, calMonth, calYear]);

  // ─── Filters ─────────────────────────────────────────────────────
  // Year scoping — belt & braces: the API filters server-side via ?year=,
  // but an older deceased-service build may ignore that param. Filtering
  // here as well guarantees the list + calendar dots ALWAYS reflect the
  // selected year.
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
      if (statusFilter === 'active' && statusInfo.label !== 'active' && statusInfo.label !== 'pending') return false;
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

  const resetExportState = () => {
    setExporting(false);
    setShowExport(false);
    setExportStatus('');
    setExportProgress(0);
    setExportJobId(null);
  };

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

      // Fallback path: the server generated the file synchronously
      if (isFileResponse(contentType)) {
        setExportStatus('Download started...');
        downloadExportBlob(response.data, `Deceased_Records_${todayKey()}.xlsx`);
        showToast('Export completed successfully!', 'success');
        setTimeout(resetExportState, 1500);
        return;
      }

      // Normal path: JSON response with a job id to poll
      const data = await parseBlobJson(response.data);

      if (data?.success && data?.jobId) {
        setExportJobId(data.jobId);
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
      setTimeout(resetExportState, 1500);
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
      setTimeout(() => {
        resetExportState();
      }, 2000);
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

        // Completed: the server streams the generated file
        if (isFileResponse(contentType)) {
          cleanup();
          downloadExportBlob(response.data, `Deceased_Records_${todayKey()}.zip`);
          showToast('Export completed successfully!', 'success');
          setTimeout(resetExportState, 1500);
          return;
        }

        // Still processing: the status JSON arrives wrapped in a blob — parse it
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

  // ─── Export History ──────────────────────────────────────────────
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

  // Map of 'YYYY-MM-DD' → admission count for that day (drives the red dots)
  const eventCountByDate = useMemo(() => {
    const map = {};
    yearRecords.forEach(r => {
      const admitted = r.created_at || r.date_admitted || r.admission_date;
      const key = toDateString(admitted);
      if (key) map[key] = (map[key] || 0) + 1;
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

        {/* Page Header */}
        <PageHeader>
          <div>
            <h1>Deceased Records</h1>
            <p>Manage and track all deceased records across your facility</p>
          </div>
          <Actions>
            <Btn $danger onClick={handleRefresh} disabled={refreshing || loading} title="Reload deceased records">
              <i className={`fas fa-sync-alt${refreshing ? ' fa-spin' : ''}`} style={{ fontSize: 12 }}></i>
              {refreshing ? 'Refreshing...' : 'Refresh Records'}
            </Btn>
            <Btn $export onClick={() => setShowExport(true)}>
              <i className="fas fa-file-export" style={{ fontSize: 12 }}></i> Export Data to Excel
            </Btn>
            {/* "New Admission" button removed */}
          </Actions>
        </PageHeader>

        {/* Sleek Horizontal Calendar */}
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
              style={{ minWidth: '38px' }}
            >
              <CalWeekday>View</CalWeekday>
              <CalDayNum style={{ fontSize: '11px', marginTop: '1px' }}>All</CalDayNum>
            </CalDateBtn>

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const loopDate = new Date(calYear, calMonth, day);
              const dateStr = toDateString(loopDate);
              const weekday = loopDate.toLocaleDateString('en-US', { weekday: 'short' });
              const eventCount = eventCountByDate[dateStr] || 0;
              const hasEvents = eventCount > 0;
              const isActive = selectedDate === dateStr;

              return (
                <CalDateBtn
                  key={day}
                  $active={isActive}
                  onClick={() => handleDateClick(dateStr)}
                  ref={isActive ? activeDateRef : null}
                  title={hasEvents ? `${eventCount} record${eventCount > 1 ? 's' : ''} admitted on this day` : undefined}
                >
                  <CalWeekday>{weekday}</CalWeekday>
                  <CalDayNum>{day}</CalDayNum>
                  {hasEvents && <EventDot $active={isActive} />}
                </CalDateBtn>
              );
            })}
          </CalendarDates>
        </CalendarContainer>

        {/* Main Card */}
        <ListCard>
          <ListHeader>
            <h2>
              {selectedDate ? `Deceased for ${formatDate(selectedDate)}` : `All Deceased · ${calYear}`} ({filteredRecords.length})
            </h2>
          </ListHeader>

          {/* Filters */}
          <FilterToolbar>
            <FormInput
              $search
              type="text"
              placeholder="Search name or ID..."
              style={{ flex: 1, minWidth: 200 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <FormSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active / In Morgue</option>
              <option value="Postmortem Requested">Postmortem Requested</option>
              <option value="Postmortem Done">Postmortem Done</option>
              <option value="Released">Released / Transferred</option>
            </FormSelect>
            <FormSelect value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </FormSelect>
          </FilterToolbar>

          {/* Service Unavailable Message */}
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

          {/* Desktop Table Layout */}
          <TableWrap>
            <StyledTable>
              <thead>
                <tr>
                  <th>Deceased Name</th>
                  <th>Admission No.</th>
                  <th>Date Admitted</th>
                  <th>Days in Morgue</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
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
                        <StatusBadge
                          $bg={statusInfo.bg}
                          $color={statusInfo.color}
                          $border={statusInfo.color + '40'}
                        >
                          {statusInfo.label}
                        </StatusBadge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Btn $sm onClick={(e) => { e.stopPropagation(); openProfile(id); }}>View Profile</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </StyledTable>
          </TableWrap>

          {/* Mobile Sleek Card Layout */}
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
                          <div style={{ fontWeight: 700, fontSize: 16, color: C.black }}>{name}</div>
                          <div style={{ fontSize: 13, color: C.gray }}>
                            {sex ? `${sex}, ` : ''}{r.age || '—'} yrs
                          </div>
                        </div>
                      </MobileCardNameWrap>
                      <StatusBadge
                        $bg={statusInfo.bg}
                        $color={statusInfo.color}
                        $border={statusInfo.color + '40'}
                      >
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
                      <Btn $sm onClick={(e) => { e.stopPropagation(); openProfile(id); }}>
                        View Profile
                      </Btn>
                    </MobileCardFooter>
                  </MobileCard>
                );
              })
            )}
          </MobileCardContainer>
        </ListCard>

        {/* ─── Export Modal ───────────────────────────────────────── */}
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
              <Btn onClick={() => setShowExport(false)} disabled={exporting}>Cancel</Btn>
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
                background: exportStatus === 'Completed' ? C.success : C.exportBtn,
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