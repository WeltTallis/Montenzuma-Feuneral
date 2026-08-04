import React, { useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

// --- Inline SVG Icons ---
const Icon = ({ children, size = 16, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);
const Truck = (p) => <Icon {...p}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></Icon>;
const MapPin = (p) => <Icon {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Icon>;
const X = (p) => <Icon {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
const ArrowLeft = (p) => <Icon {...p}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></Icon>;
const Calendar = (p) => <Icon {...p}><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></Icon>;
const ChevronLeft = (p) => <Icon {...p}><path d="m15 18-6-6 6-6" /></Icon>;
const ChevronRight = (p) => <Icon {...p}><path d="m9 18 6-6-6-6" /></Icon>;
const Clock = (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Icon>;
const Phone = (p) => <Icon {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Icon>;
const TrendingUp = (p) => <Icon {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Icon>;
const Layers = (p) => <Icon {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>;

// --- Your Color Palette ---
const COLORS = {
  primary: '#1a5f7a',
  primaryLight: '#2c8ac9',
  primaryDark: '#134b5f',
  white: '#FFFFFF',
  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
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
  infoLight: '#eff6ff',
  infoDark: '#2563eb',
  accent: '#3b82f6',
  accentHover: '#2563eb',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: COLORS.warning, bg: COLORS.warningLight, text: COLORS.warningDark },
  booked:     { label: 'Booked',     color: COLORS.success, bg: COLORS.successLight, text: COLORS.successDark },
  in_transit: { label: 'In Transit', color: COLORS.info, bg: COLORS.infoLight, text: COLORS.infoDark },
  completed:  { label: 'Completed',  color: COLORS.primary, bg: '#e0f2fe', text: COLORS.primaryDark },
  cancelled:  { label: 'Cancelled',  color: COLORS.danger, bg: COLORS.dangerLight, text: COLORS.dangerDark },
};

const pad = n => String(n).padStart(2, '0');
const fmtDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = s => { if(!s) return null; const d = new Date(s); return isNaN(d) ? null : d; };
const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// --- Volume Heatmap Logic (Clean Blue/Teal Scale) ---
const getVolumeStyle = (events, isToday) => {
  const count = events.length;
  
  if (count === 0) return { 
    bg: isToday ? COLORS.dangerLight : COLORS.surface, 
    headerColor: isToday ? COLORS.danger : COLORS.textMuted, 
    textColor: isToday ? COLORS.dangerDark : COLORS.textSecondary, 
    level: 0, isHot: false 
  };
  if (count === 1) return { 
    bg: COLORS.surface, headerColor: COLORS.text, textColor: COLORS.text, level: 1, isHot: false 
  };
  if (count <= 3) return { 
    bg: `linear-gradient(180deg, ${COLORS.infoLight} 0%, ${COLORS.surface} 40%)`, 
    headerColor: COLORS.infoDark, textColor: COLORS.text, level: 2, isHot: false 
  };
  return { 
    bg: `linear-gradient(160deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`, 
    headerColor: COLORS.white, textColor: COLORS.white, level: 3, isHot: true 
  };
};

// --- Animations ---
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const scaleIn = keyframes`from { transform: scale(0.98); opacity: 0; } to { transform: scale(1); opacity: 1; }`;
const slideUp = keyframes`from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; }`;

// --- Clean & Modern Styled Components ---
const CalContainer = styled.div`
  background: ${COLORS.surface};
  border-radius: 24px;
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
  color: ${COLORS.text};
  position: relative;
  overflow: hidden;
  border: none;
  box-shadow: 0 8px 30px -5px rgba(15, 23, 42, 0.08);
`;

const Toolbar = styled.div`
  display: flex; justify-content: space-between; align-items: center; gap: 1rem;
  padding: 1.5rem 2rem; flex-wrap: wrap;
  background: ${COLORS.surface};
  border-bottom: 1px solid ${COLORS.borderLight};
  @media (max-width: 640px) { padding: 1.25rem; justify-content: center; gap: 0.75rem; }
`;

const ToolGroup = styled.div`display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; justify-content: center;`;
const CalTitle = styled.h2`font-size: 1.25rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.75rem; color: ${COLORS.text}; letter-spacing: -0.02em;`;

const IconBtn = styled.button`
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  background: ${COLORS.bg}; border: none; border-radius: 10px; cursor: pointer; color: ${COLORS.textSecondary};
  transition: all 0.2s ease;
  &:hover { background: ${COLORS.borderLight}; color: ${COLORS.text}; }
  &:active { transform: scale(0.96); }
`;

const GhostBtn = styled.button`
  background: ${COLORS.danger}; border: none; border-radius: 10px; padding: 0.5rem 1.25rem;
  font-size: 0.8rem; font-weight: 600; color: ${COLORS.white}; cursor: pointer; transition: all 0.2s ease;
  box-shadow: 0 4px 12px -2px rgba(239, 68, 68, 0.3);
  &:hover { background: ${COLORS.dangerDark}; transform: translateY(-1px); }
  &:active { transform: scale(0.96); }
`;

const ViewToggle = styled.div`display: flex; background: ${COLORS.bg}; border-radius: 10px; padding: 4px; gap: 2px;`;
const ToggleBtn = styled.button`
  padding: 0.45rem 1rem; border-radius: 7px; border: none; background: transparent; font-size: 0.78rem;
  font-weight: 600; color: ${p => p.$active ? COLORS.white : COLORS.textSecondary}; cursor: pointer; transition: all 0.2s ease;
  background: ${p => p.$active ? COLORS.text : 'transparent'};
  &:hover { color: ${p => p.$active ? COLORS.white : COLORS.text}; }
`;

// --- Month View ---
const MonthGridWrapper = styled.div`padding: 1.5rem; @media (max-width: 640px) { padding: 1rem; }`;
const WeekdaysRow = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 8px; @media (max-width: 640px) { gap: 4px; }`;
const WeekdayCell = styled.div`text-align: center; font-size: 0.7rem; font-weight: 600; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.08em; padding: 8px 0;`;
const DaysGrid = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; @media (max-width: 640px) { gap: 4px; }`;

const DayCell = styled.div`
  min-height: 110px; 
  background: ${p => p.$isToday ? COLORS.dangerLight : p.$isBusy ? COLORS.infoLight : COLORS.bg};
  border: 2px solid ${p => p.$isToday ? COLORS.danger : 'transparent'};
  border-radius: 12px; padding: 8px; cursor: pointer; transition: all 0.2s ease;
  opacity: ${p => p.$outside ? 0.4 : 1}; 
  display: flex; flex-direction: column;
  &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  @media (max-width: 640px) { min-height: 56px; padding: 4px; align-items: center; justify-content: center; border-radius: 8px; }
`;

const DayHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; @media (max-width: 640px) { margin-bottom: 0; }`;
const DayNum = styled.div`font-size: 0.9rem; font-weight: 600; color: ${COLORS.text};`;
const TodayCircle = styled.span`background: ${COLORS.danger}; color: ${COLORS.white}; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;`;
const BookingCountBadge = styled.div`background: ${COLORS.surface}; color: ${COLORS.text}; font-size: 0.65rem; font-weight: 700; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);`;
const DayContent = styled.div`display: flex; flex-direction: column; gap: 4px; overflow: hidden; @media (max-width: 640px) { display: none; }`;

const EventChip = styled.div`
  display: flex; align-items: center; gap: 6px; background: ${COLORS.surface}; 
  border-radius: 6px; padding: 4px 8px; font-size: 0.7rem; cursor: pointer; transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  &:hover { transform: translateX(2px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
`;
const EventTime = styled.span`font-weight: 600; color: ${COLORS.textSecondary}; font-size: 0.65rem;`;
const EventName = styled.span`font-weight: 500; color: ${COLORS.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const MoreChip = styled.div`font-size: 0.65rem; font-weight: 600; color: ${COLORS.textSecondary}; padding: 2px 4px; cursor: pointer;`;

// --- Week View (7-Day Grid Layout - Showing ALL Bookings) ---
const WeekDashboardWrapper = styled.div`
  padding: 2rem;
  background: ${COLORS.bg};
  @media (max-width: 640px) { padding: 1rem; }
`;

const WeekHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
`;

const WeekTitleGroup = styled.div`
  h3 { margin: 0; font-size: 1.25rem; font-weight: 700; color: ${COLORS.text}; letter-spacing: -0.02em; display: flex; align-items: center; gap: 10px; }
  p { margin: 4px 0 0 26px; font-size: 0.8rem; color: ${COLORS.textSecondary}; font-weight: 500; }
`;

const IconBubble = styled.div`
  width: 32px; height: 32px; border-radius: 8px; background: ${COLORS.text};
  display: flex; align-items: center; justify-content: center; color: ${COLORS.white};
`;

const WeekStatsGroup = styled.div`display: flex; gap: 12px; flex-wrap: wrap;`;

const StatCard = styled.div`
  display: flex; align-items: center; gap: 10px; background: ${COLORS.surface};
  padding: 0.75rem 1.25rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  .icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: ${p => p.$iconBg}; color: ${p => p.$iconColor}; }
  .val { font-size: 1.25rem; font-weight: 700; color: ${COLORS.text}; line-height: 1; }
  .lbl { font-size: 0.65rem; font-weight: 600; color: ${COLORS.textSecondary}; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.05em; }
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
  min-width: 0; 
  
  @media (max-width: 1024px) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  @media (max-width: 640px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

const WeekDayCol = styled.div`
  background: ${p => p.$bg};
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-self: start; /* Prevents columns from stretching to match the tallest day */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-width: 0; 
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  
  &:hover { box-shadow: 0 8px 16px -4px rgba(0,0,0,0.08); }
`;

const WeekDayHeader = styled.div`
  padding: 16px 12px;
  text-align: center;
  color: ${p => p.$color};
  border-bottom: ${p => p.$isHot ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${COLORS.borderLight}`};
`;

const WeekDayName = styled.div`font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8;`;
const WeekDayNum = styled.div`font-size: 1.75rem; font-weight: 700; margin-top: 2px; letter-spacing: -0.03em; line-height: 1;`;
const TodayDot = styled.div`width: 6px; height: 6px; border-radius: 50%; background: ${COLORS.danger}; margin: 8px auto 0;`;

const WeekDayBody = styled.div`padding: 10px; display: flex; flex-direction: column; gap: 8px; flex: 1;`;

const WeekBookingCard = styled.div`
  background: ${p => p.$isHot ? 'rgba(255,255,255,0.12)' : COLORS.surface};
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: ${slideUp} 0.4s ease backwards;
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  &:hover { 
    transform: translateY(-1px); 
    background: ${p => p.$isHot ? 'rgba(255,255,255,0.2)' : COLORS.bg};
  }
`;

const WeekBookingTime = styled.div`
  font-size: 0.65rem; font-weight: 600; 
  color: ${p => p.$isHot ? 'rgba(255,255,255,0.7)' : COLORS.textMuted}; 
  display: flex; align-items: center; gap: 4px;
  text-transform: uppercase; letter-spacing: 0.04em;
`;
const WeekBookingName = styled.div`
  font-size: 0.85rem; font-weight: 600; 
  color: ${p => p.$isHot ? COLORS.white : COLORS.text}; 
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  display: flex; align-items: center; gap: 6px;
`;
const WeekBookingMeta = styled.div`
  font-size: 0.7rem; 
  color: ${p => p.$isHot ? 'rgba(255,255,255,0.7)' : COLORS.textSecondary}; 
  display: flex; align-items: center; gap: 4px; 
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const NoBookingsWeek = styled.div`
  text-align: center; font-size: 0.75rem; 
  color: ${p => p.$isHot ? 'rgba(255,255,255,0.5)' : COLORS.textMuted}; 
  padding: 20px 0; font-weight: 500;
`;

const StatusDot = styled.div`width: 8px; height: 8px; border-radius: 50%; background: ${p => p.$color}; flex-shrink: 0;`;

// --- Drawer Styles ---
const Overlay = styled.div`position: fixed; inset: 0; background: rgba(15,23,42,0.3); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 90; animation: ${fadeIn} 0.3s ease;`;
const Drawer = styled.div`
  position: fixed; top: 0; right: 0; bottom: 0; width: 440px; max-width: 100%;
  background: ${COLORS.surface}; z-index: 100; box-shadow: -20px 0 50px -10px rgba(0,0,0,0.1);
  transform: translateX(${p => p.open ? '0' : '100%'});
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1); display: flex; flex-direction: column;
  @media (max-width: 640px) { width: 100%; }
`;

const DrawerHeader = styled.div`
  padding: 1.75rem 1.5rem; background: ${COLORS.surface}; display: flex; justify-content: space-between; align-items: flex-start;
  border-bottom: 1px solid ${COLORS.borderLight};
`;
const DrawerDate = styled.div`font-size: 0.72rem; font-weight: 700; color: ${COLORS.danger}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.35rem;`;
const DrawerTitle = styled.h3`font-size: 1.4rem; font-weight: 700; margin: 0; color: ${COLORS.text}; line-height: 1.2; letter-spacing: -0.02em;`;
const CloseBtn = styled.button`
  width: 36px; height: 36px; border-radius: 10px; background: ${COLORS.bg}; border: none;
  color: ${COLORS.textSecondary}; display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: all 0.2s; &:hover { background: ${COLORS.borderLight}; color: ${COLORS.text}; }
`;
const DrawerBody = styled.div`padding: 0; flex: 1; overflow-y: auto; display: flex; flex-direction: column; background: ${COLORS.bg};`;
const BackBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600;
  color: ${COLORS.primary}; margin: 1.5rem 1.5rem 0.5rem; cursor: pointer; background: transparent; border: none; width: fit-content;
  padding: 6px 12px; border-radius: 8px; transition: all 0.2s;
  &:hover { background: ${COLORS.infoLight}; }
`;

const ListRow = styled.div`
  display: flex; align-items: center; gap: 1rem; padding: 1.1rem 1.5rem;
  cursor: pointer; transition: all 0.2s ease; background: ${COLORS.surface};
  margin: 4px 12px; border-radius: 12px;
  &:hover { background: ${COLORS.infoLight}; transform: translateY(-1px); }
  @media (max-width: 640px) { padding: 1rem 1.25rem; gap: 0.75rem; margin: 4px 8px; }
`;

const Avatar = styled.div`
  width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
  background: ${p => p.$bg}; color: ${p => p.$color}; 
  display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;
`;

const RowTime = styled.div`font-size: 0.8rem; font-weight: 700; color: ${p => p.$text || COLORS.text}; min-width: 52px; flex-shrink: 0; line-height: 1.2; display: flex; flex-direction: column;`;
const RowMain = styled.div`flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px;`;
const RowTitle = styled.div`font-size: 0.95rem; font-weight: 600; color: ${COLORS.text}; display: flex; align-items: center; gap: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const RowSub = styled.div`font-size: 0.75rem; color: ${COLORS.textSecondary}; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;`;
const RowStatus = styled.div`font-size: 0.65rem; font-weight: 700; color: ${p => p.$color}; background: ${p => p.$bg}; padding: 4px 10px; border-radius: 12px; flex-shrink: 0; text-transform: capitalize;`;

const DetailWrapper = styled.div`padding: 1.5rem; animation: ${scaleIn} 0.3s ease; @media (max-width: 640px) { padding: 1.25rem; }`;
const DetailName = styled.h2`font-size: 1.75rem; font-weight: 700; margin: 0; color: ${COLORS.text}; line-height: 1.2; letter-spacing: -0.02em;`;
const DetailSub = styled.p`font-size: 0.85rem; color: ${COLORS.textSecondary}; margin: 8px 0 0 0; display: flex; align-items: center; gap: 6px;`;
const DetailSection = styled.div`margin-top: 2rem;`;
const SectionTitle = styled.div`font-size: 0.72rem; font-weight: 700; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; padding: 0 4px;`;
const DetailCard = styled.div`background: ${COLORS.surface}; border-radius: 14px; padding: 6px 18px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);`;
const DetailRow = styled.div`display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid ${COLORS.borderLight}; gap: 1rem; &:last-child { border-bottom: none; }`;
const DLabel = styled.div`font-size: 0.85rem; color: ${COLORS.textSecondary}; font-weight: 500; display: flex; align-items: center; gap: 8px;`;
const DValue = styled.div`font-size: 0.9rem; color: ${COLORS.text}; font-weight: 600; text-align: right; word-break: break-word;`;

const EmptyState = styled.div`text-align: center; padding: 80px 20px; color: ${COLORS.textMuted}; display: flex; flex-direction: column; align-items: center; animation: ${scaleIn} 0.4s ease;`;

// --- Main Component ---
const HearseCalendar = ({ bookings: propBookings = [], selectedDate, onDateSelect }) => {
  const [calView, setCalView] = useState('week');
  const [calDate, setCalDate] = useState(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [drawerDate, setDrawerDate] = useState(fmtDateStr(new Date()));

  const formatDateStr = useCallback((d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }, []);

  const getEventsForDate = useCallback((dateStr) => {
    if (!dateStr) return [];
    const results = (propBookings || []).filter(b => {
      let bookingDates = [];
      try {
        if (typeof b.booking_dates === 'string') bookingDates = JSON.parse(b.booking_dates);
        else if (Array.isArray(b.booking_dates)) bookingDates = b.booking_dates;
        else if (b.booking_date) bookingDates = [formatDateStr(b.booking_date)];
        else if (b.estimated_departure_time) bookingDates = [formatDateStr(b.estimated_departure_time)];
      } catch (e) { return false; }
      return bookingDates.includes(dateStr);
    });

    return results.sort((a, b) => {
      const aTime = a.booking_date || a.estimated_departure_time || '';
      const bTime = b.booking_date || b.estimated_departure_time || '';
      return new Date(aTime) - new Date(bTime);
    });
  }, [propBookings, formatDateStr]);

  const getBookingTimeParts = useCallback((item) => {
    const timeStr = item.booking_date || item.estimated_departure_time;
    if (timeStr && timeStr.includes('T')) {
      const date = new Date(timeStr);
      const formatted = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const [time, meridiem] = formatted.split(' ');
      return { time, meridiem };
    }
    return { time: 'All Day', meridiem: '' };
  }, []);

  const calNav = useCallback((dir) => {
    const d = new Date(calDate.getTime());
    if (calView === 'month') d.setMonth(d.getMonth() + dir);
    else if (calView === 'week') d.setDate(d.getDate() + dir * 7);
    setCalDate(d);
  }, [calDate, calView]);

  const openDayList = useCallback((dateStr) => {
    setDrawerDate(dateStr);
    if (onDateSelect) onDateSelect(dateStr);
    setActiveBookingId(null);
    setDrawerOpen(true);
  }, [onDateSelect]);

  const calToday = useCallback(() => {
    const today = new Date();
    const todayStr = fmtDateStr(today);
    setCalDate(today);
    openDayList(todayStr);
  }, [openDayList]);

  // FIXED: Now opens the drawer directly when clicking a booking
  const viewBooking = useCallback((id) => {
    setActiveBookingId(id);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveBookingId(null);
  }, []);

  // --- Month View ---
  const renderMonthGrid = () => {
    const d = calDate;
    const year = d.getFullYear(), month = d.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const gridStart = addDays(first, -startOffset);
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const todayStr = fmtDateStr(new Date());

    return (
      <MonthGridWrapper>
        <WeekdaysRow>{WEEKDAYS.map(w => <WeekdayCell key={w}>{w}</WeekdayCell>)}</WeekdaysRow>
        <DaysGrid>
          {days.map(day => {
            const dateStr = fmtDateStr(day);
            const outside = day.getMonth() !== month;
            const isToday = dateStr === todayStr;
            const events = getEventsForDate(dateStr);
            const isBusy = events.length > 0;

            return (
              <DayCell
                key={dateStr}
                $outside={outside}
                $isToday={isToday}
                $isBusy={isBusy}
                onClick={() => openDayList(dateStr)}
              >
                <DayHeader>
                  {isToday ? <TodayCircle>{day.getDate()}</TodayCircle> : <DayNum>{day.getDate()}</DayNum>}
                  {isBusy && <BookingCountBadge>{events.length}</BookingCountBadge>}
                </DayHeader>
                <DayContent>
                  {events.slice(0, 2).map(ev => {
                    const ec = STATUS_CONFIG[ev.status] || STATUS_CONFIG.pending;
                    const tParts = getBookingTimeParts(ev);
                    return (
                      <EventChip
                        key={ev.booking_id || ev.id}
                        onClick={(e) => { e.stopPropagation(); viewBooking(ev.booking_id || ev.id); }}
                      >
                        <EventTime>{tParts.time}</EventTime>
                        <EventName>{ev.client_name?.split(' ')[0] || 'Unknown'}</EventName>
                      </EventChip>
                    );
                  })}
                  {events.length > 2 && (
                    <MoreChip onClick={(e) => { e.stopPropagation(); openDayList(dateStr); }}>
                      +{events.length - 2} more
                    </MoreChip>
                  )}
                </DayContent>
              </DayCell>
            );
          })}
        </DaysGrid>
      </MonthGridWrapper>
    );
  };

  // --- REDESIGNED Week View (7-Day Grid showing ALL Bookings) ---
  const renderWeekGrid = () => {
    const d = calDate;
    const dow = d.getDay();
    const weekStart = addDays(d, -dow);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const todayStr = fmtDateStr(new Date());

    const weekStats = days.map(day => {
      const dateStr = fmtDateStr(day);
      const events = getEventsForDate(dateStr);
      return { day, dateStr, events, count: events.length };
    });
    
    const totalBookings = weekStats.reduce((acc, s) => acc + s.count, 0);
    const maxBookings = Math.max(...weekStats.map(s => s.count), 1);

    return (
      <WeekDashboardWrapper>
        <WeekHeader>
          <WeekTitleGroup>
            <h3>
              <IconBubble><Layers size={18} /></IconBubble>
              Weekly Overview
            </h3>
            <p>Booking volume and daily schedule</p>
          </WeekTitleGroup>
          <WeekStatsGroup>
            <StatCard $iconBg={COLORS.infoLight} $iconColor={COLORS.infoDark}>
              <div className="icon"><TrendingUp size={16} /></div>
              <div>
                <div className="val">{totalBookings}</div>
                <div className="lbl">Total</div>
              </div>
            </StatCard>
            <StatCard $iconBg={COLORS.bg} $iconColor={COLORS.text}>
              <div className="icon"><Calendar size={16} /></div>
              <div>
                <div className="val">{maxBookings}</div>
                <div className="lbl">Busiest</div>
              </div>
            </StatCard>
          </WeekStatsGroup>
        </WeekHeader>

        <WeekGrid>
          {weekStats.map(({ day, dateStr, events }) => {
            const isToday = dateStr === todayStr;
            const vol = getVolumeStyle(events, isToday);
            
            return (
              <WeekDayCol key={dateStr} $bg={vol.bg} onClick={() => openDayList(dateStr)}>
                <WeekDayHeader $color={vol.headerColor} $isHot={vol.isHot}>
                  <WeekDayName>{WEEKDAYS[day.getDay()]}</WeekDayName>
                  <WeekDayNum>{day.getDate()}</WeekDayNum>
                  {isToday && !vol.isHot && <TodayDot />}
                </WeekDayHeader>
                
                <WeekDayBody>
                  {events.length === 0 ? (
                    <NoBookingsWeek $isHot={vol.isHot}>No bookings</NoBookingsWeek>
                  ) : (
                    events.map((b, idx) => {
                      const bc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                      const tParts = getBookingTimeParts(b);
                      return (
                        <WeekBookingCard
                          key={b.booking_id || b.id}
                          $isHot={vol.isHot}
                          style={{ animationDelay: `${idx * 0.08}s` }}
                          onClick={(e) => { e.stopPropagation(); viewBooking(b.booking_id || b.id); }}
                        >
                          <WeekBookingTime $isHot={vol.isHot}>
                            <Clock size={10} /> {tParts.time} {tParts.meridiem}
                          </WeekBookingTime>
                          <WeekBookingName $isHot={vol.isHot}>
                            <StatusDot $color={bc.color} />
                            {b.client_name || 'Unknown'}
                          </WeekBookingName>
                          <WeekBookingMeta $isHot={vol.isHot}>
                            <MapPin size={10} /> {b.destination || b.to_location || 'N/A'}
                          </WeekBookingMeta>
                        </WeekBookingCard>
                      );
                    })
                  )}
                </WeekDayBody>
              </WeekDayCol>
            );
          })}
        </WeekGrid>
      </WeekDashboardWrapper>
    );
  };

  // --- Drawer: Day List ---
  const renderDrawerList = () => {
    const dateStr = drawerDate || fmtDateStr(new Date());
    const events = getEventsForDate(dateStr);
    const d = parseDate(dateStr);
    if (!d) return null;
    const isToday = dateStr === fmtDateStr(new Date());

    return (
      <>
        <DrawerHeader>
          <div>
            <DrawerDate>{isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'long' })}</DrawerDate>
            <DrawerTitle>{d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</DrawerTitle>
          </div>
          <CloseBtn onClick={closeDrawer}><X size={18} /></CloseBtn>
        </DrawerHeader>
        <DrawerBody>
          {events.length === 0 ? (
            <EmptyState>
              <Calendar size={48} style={{ opacity: 0.15, marginBottom: '16px' }} />
              <h4 style={{ fontSize: 1.05, fontWeight: 600, marginBottom: '6px', color: COLORS.text }}>No bookings scheduled</h4>
              <p style={{ fontSize: '0.85rem' }}>Select another date or schedule a new booking.</p>
            </EmptyState>
          ) : (
            <>
              <div style={{ padding: '20px 16px 4px' }}>
                <SectionTitle>{events.length} {events.length === 1 ? 'Booking' : 'Bookings'}</SectionTitle>
              </div>
              {events.map(b => {
                const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                const tParts = getBookingTimeParts(b);
                return (
                  <ListRow
                    key={b.booking_id || b.id}
                    $color={cfg.color}
                    $bg={cfg.bg}
                    $text={cfg.text}
                    onClick={() => viewBooking(b.booking_id || b.id)}
                  >
                    <Avatar $bg={cfg.bg} $color={cfg.color}>{getInitials(b.client_name)}</Avatar>
                    <RowTime $text={cfg.text}>
                      {tParts.time}
                      <span style={{ fontSize: '0.6rem', opacity: 0.7, fontWeight: 600 }}>{tParts.meridiem}</span>
                    </RowTime>
                    <RowMain>
                      <RowTitle>{b.client_name || 'Unknown Client'}</RowTitle>
                      <RowSub>
                        <Truck size={12} /> {b.hearse_name || 'Unassigned'}
                        <span style={{ color: COLORS.border }}>|</span>
                        <MapPin size={12} /> {b.destination || b.to_location || 'N/A'}
                      </RowSub>
                    </RowMain>
                    <RowStatus $color={cfg.color} $bg={cfg.bg}>{cfg.label}</RowStatus>
                  </ListRow>
                );
              })}
            </>
          )}
        </DrawerBody>
      </>
    );
  };

  // --- Drawer: Booking Detail ---
  const renderDrawerDetail = () => {
    const b = (propBookings || []).find(x => (x.booking_id || x.id) === activeBookingId);
    if (!b) return null;
    const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
    const tParts = getBookingTimeParts(b);

    return (
      <>
        <DrawerHeader>
          <div>
            <DrawerDate>Booking Details</DrawerDate>
            <DrawerTitle>
              {b.booking_code || `BK-${String(1000 + (b.booking_id || b.id || 0)).padStart(4, '0')}`}
            </DrawerTitle>
          </div>
          <CloseBtn onClick={closeDrawer}><X size={18} /></CloseBtn>
        </DrawerHeader>
        <DrawerBody>
          <BackBtn onClick={() => setActiveBookingId(null)}><ArrowLeft size={14} /> Back to List</BackBtn>

          <DetailWrapper>
            <DetailSection style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Avatar $bg={cfg.bg} $color={cfg.color} style={{ width: '56px', height: '56px', fontSize: '1.2rem', borderRadius: '16px' }}>
                  {getInitials(b.client_name)}
                </Avatar>
                <div>
                  <DetailName style={{ fontSize: '1.4rem' }}>{b.client_name || 'Unknown Client'}</DetailName>
                  <div style={{ marginTop: '6px' }}>
                    <RowStatus $color={cfg.color} $bg={cfg.bg}>{cfg.label}</RowStatus>
                  </div>
                </div>
              </div>
              {b.client_phone && <DetailSub style={{ marginTop: '1rem' }}><Phone size={14} /> {b.client_phone}</DetailSub>}
              <DetailSub>
                <Clock size={14} /> {tParts.time} {tParts.meridiem}
                {b.booking_date && ` • ${new Date(b.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              </DetailSub>
            </DetailSection>

            <DetailSection>
              <SectionTitle>Trip Details</SectionTitle>
              <DetailCard>
                <DetailRow>
                  <DLabel><MapPin size={14} /> From</DLabel>
                  <DValue>{b.from_location || '—'}</DValue>
                </DetailRow>
                <DetailRow>
                  <DLabel><MapPin size={14} /> To</DLabel>
                  <DValue>{b.to_location || b.destination || '—'}</DValue>
                </DetailRow>
              </DetailCard>
            </DetailSection>

            <DetailSection>
              <SectionTitle>Vehicle Information</SectionTitle>
              <DetailCard>
                <DetailRow>
                  <DLabel><Truck size={14} /> Hearse</DLabel>
                  <DValue>{b.hearse_name || 'Unassigned'}</DValue>
                </DetailRow>
                <DetailRow>
                  <DLabel>Plate Number</DLabel>
                  <DValue>{b.plate_number || b.number_plate || 'N/A'}</DValue>
                </DetailRow>
              </DetailCard>
            </DetailSection>

            <DetailSection>
              <SectionTitle>Additional Information</SectionTitle>
              <DetailCard>
                {b.branch_name && (
                  <DetailRow>
                    <DLabel>Branch</DLabel>
                    <DValue>{b.branch_name}</DValue>
                  </DetailRow>
                )}
                {b.end_date && (
                  <DetailRow>
                    <DLabel><Calendar size={14} /> End Date</DLabel>
                    <DValue>{new Date(b.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</DValue>
                  </DetailRow>
                )}
                {b.booked_by && (
                  <DetailRow>
                    <DLabel>Booked By</DLabel>
                    <DValue>{b.booked_by}</DValue>
                  </DetailRow>
                )}
              </DetailCard>
            </DetailSection>
          </DetailWrapper>
        </DrawerBody>
      </>
    );
  };

  return (
    <CalContainer>
      <Toolbar>
        <ToolGroup>
          <IconBtn onClick={() => calNav(-1)} aria-label="Previous"><ChevronLeft size={18} /></IconBtn>
          <CalTitle>{MONTHS[calDate.getMonth()]} {calDate.getFullYear()}</CalTitle>
          <IconBtn onClick={() => calNav(1)} aria-label="Next"><ChevronRight size={18} /></IconBtn>
          <GhostBtn onClick={calToday}>Today</GhostBtn>
        </ToolGroup>

        <ViewToggle>
          <ToggleBtn $active={calView === 'week'} onClick={() => setCalView('week')}>Week</ToggleBtn>
          <ToggleBtn $active={calView === 'month'} onClick={() => setCalView('month')}>Month</ToggleBtn>
        </ViewToggle>
      </Toolbar>

      {calView === 'month' ? renderMonthGrid() : renderWeekGrid()}

      {drawerOpen && <Overlay onClick={closeDrawer} />}
      <Drawer open={drawerOpen}>
        {drawerOpen && (activeBookingId ? renderDrawerDetail() : renderDrawerList())}
      </Drawer>
    </CalContainer>
  );
};

export default HearseCalendar;