import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameWeek,
  isSameMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  subDays,
  isToday,
} from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../../api/axios";
import { getParentTenantSlug, getTenantId } from "../../utils/globalAuth";
import "bootstrap/dist/css/bootstrap.min.css";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  CheckCircle2: () => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  XCircle: () => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  DollarSign: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  CalendarDays: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4-4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  RefreshCw: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

// ─── Styled Components ──────────────────────────────────────────────────────

const Container = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: ${props => props.isDark ? '#0f172a' : '#f8fafc'};
  color: ${props => props.isDark ? '#f1f5f9' : '#0f172a'};
`;

const Header = styled.header`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid ${props => props.isDark ? '#1e293b' : '#e2e8f0'};
  background-color: ${props => props.isDark ? '#0f172a' : '#ffffff'};
`;

const BrandIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'};
  color: ${props => props.isDark ? '#818cf8' : '#4f46e5'};
`;

const ViewToggle = styled.div`
  display: flex;
  align-items: center;
  border-radius: 12px;
  padding: 4px;
  background-color: ${props => props.isDark ? '#1e293b' : '#f1f5f9'};
`;

const ViewButton = styled.button`
  padding: 6px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
  border: none;
  transition: all 0.2s;
  background: ${props => props.active ? (props.isDark ? '#0f172a' : '#ffffff') : 'transparent'};
  color: ${props => props.active ? (props.isDark ? '#f1f5f9' : '#0f172a') : (props.isDark ? '#94a3b8' : '#64748b')};
  box-shadow: ${props => props.active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
  &:hover {
    background: ${props => props.active ? (props.isDark ? '#0f172a' : '#ffffff') : (props.isDark ? '#1e293b' : '#f1f5f9')};
  }
`;

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${props => props.isDark ? '#1e293b' : '#e2e8f0'};
  background: transparent;
  color: ${props => props.isDark ? '#94a3b8' : '#64748b'};
  transition: all 0.2s;
  &:hover {
    background: ${props => props.isDark ? '#1e293b' : '#f1f5f9'};
  }
`;

const NewButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  background: #4f46e5;
  color: white;
  transition: all 0.2s;
  &:hover {
    background: #4338ca;
  }
`;

const LiveBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid ${props => props.isError ? (props.isDark ? '#b91c1c' : '#fecaca') : (props.isDark ? '#065f46' : '#a7f3d0')};
  background: transparent;
  font-size: 11px;
  font-weight: 700;
  color: ${props => props.isError ? (props.isDark ? '#f87171' : '#dc2626') : (props.isDark ? '#34d399' : '#059669')};
`;

const LiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.isError ? '#ef4444' : (props.isRefreshing ? '#34d399' : '#22c55e')};
  animation: ${props => props.isRefreshing ? 'pulse 1s infinite' : 'none'};
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const CalendarSection = styled.section`
  flex-shrink: 0;
  border-bottom: 1px solid ${props => props.isDark ? '#1e293b' : '#e2e8f0'};
  background-color: ${props => props.isDark ? '#0f172a' : '#ffffff'};
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 4px 20px;
`;

const CalendarStrip = styled.div`
  display: flex;
  padding: 0 16px 12px 16px;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const DayButton = styled.button`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 12px;
  padding: 8px 10px;
  border: none;
  background: ${props => {
    if (props.isSelected) return '#4f46e5';
    if (props.isInRange) return props.isDark ? '#1e293b' : '#eef2ff';
    if (props.isToday) return props.isDark ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff';
    return 'transparent';
  }};
  color: ${props => {
    if (props.isSelected) return 'white';
    if (props.isToday) return props.isDark ? '#818cf8' : '#4f46e5';
    return props.isDark ? '#cbd5e1' : '#334155';
  }};
  transition: all 0.2s;
  min-width: ${props => props.isWeekView ? 'auto' : '50px'};
  flex: ${props => props.isWeekView ? '1' : '0'};
  &:hover {
    background: ${props => {
      if (props.isSelected) return '#4f46e5';
      return props.isDark ? '#1e293b' : '#f1f5f9';
    }};
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
`;

const BookingsPanel = styled.div`
  width: 56%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${props => props.isDark ? '#1e293b' : '#e2e8f0'};
  background-color: ${props => props.isDark ? '#0f172a' : '#f8fafc'};
`;

const PanelHeader = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid ${props => props.isDark ? '#1e293b' : '#e2e8f0'};
  background-color: ${props => props.isDark ? '#0f172a' : '#ffffff'};
`;

const BookingList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BookingCard = styled.div`
  background-color: ${props => props.isDark ? '#0f172a' : '#ffffff'};
  border-radius: 12px;
  border: 1px solid ${props => props.isDark ? '#1e293b' : '#e2e8f0'};
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const AnalyticsPanel = styled.div`
  width: 44%;
  min-width: 0;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: ${props => props.isDark ? '#0f172a' : '#f8fafc'};
`;

const StatCard = styled.div`
  background-color: ${props => props.isDark ? '#0f172a' : '#ffffff'};
  border-radius: 12px;
  border: 1px solid ${props => props.isDark ? '#1e293b' : '#e2e8f0'};
  padding: 16px;
`;

const ChartCard = styled.div`
  background-color: ${props => props.isDark ? '#0f172a' : '#ffffff'};
  border-radius: 12px;
  border: 1px solid ${props => props.isDark ? '#1e293b' : '#e2e8f0'};
  padding: 16px;
`;

// ─── Modal Component ──────────────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${props => props.isDark ? '#1e293b' : '#ffffff'};
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${props => props.isDark ? '#334155' : '#e2e8f0'};
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  color: ${props => props.isDark ? '#94a3b8' : '#64748b'};
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s;
  &:hover {
    background: ${props => props.isDark ? '#334155' : '#f1f5f9'};
  }
`;

const ModalDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid ${props => props.isDark ? '#1e293b' : '#f1f5f9'};
  &:last-child {
    border-bottom: none;
  }
`;

const ModalLabel = styled.span`
  color: ${props => props.isDark ? '#94a3b8' : '#64748b'};
  font-size: 13px;
  font-weight: 500;
`;

const ModalValue = styled.span`
  color: ${props => props.isDark ? '#f1f5f9' : '#0f172a'};
  font-size: 13px;
  font-weight: 600;
`;

// ─── Status config ──────────────────────────────────────────────────────────

const STATUS_CFG = {
  confirmed: {
    label: "Confirmed",
    lightCls: "bg-success bg-opacity-10 text-success border-success",
    darkCls: "bg-success bg-opacity-20 text-success border-success",
    dot: "bg-success",
    icon: <Icons.CheckCircle2 />,
  },
  pending: {
    label: "Pending",
    lightCls: "bg-warning bg-opacity-10 text-warning border-warning",
    darkCls: "bg-warning bg-opacity-20 text-warning border-warning",
    dot: "bg-warning",
    icon: <Icons.Clock />,
  },
  completed: {
    label: "Completed",
    lightCls: "bg-secondary bg-opacity-10 text-secondary border-secondary",
    darkCls: "bg-secondary bg-opacity-20 text-secondary border-secondary",
    dot: "bg-secondary",
    icon: <Icons.CheckCircle2 />,
  },
  cancelled: {
    label: "Cancelled",
    lightCls: "bg-danger bg-opacity-10 text-danger border-danger",
    darkCls: "bg-danger bg-opacity-20 text-danger border-danger",
    dot: "bg-danger",
    icon: <Icons.XCircle />,
  },
};

const PIE_COLORS = ["#10b981", "#f59e0b", "#94a3b8", "#f87171"];

// ─── Helpers ────────────────────────────────────────────────────────────────

const mapStatus = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "booked":
    case "approved":
      return "confirmed";
    case "completed":
    case "delivered":
      return "completed";
    case "cancelled":
    case "rejected":
      return "cancelled";
    case "pending":
    case "transferring":
    default:
      return "pending";
  }
};

const parseServiceDate = (raw) => {
  if (!raw) return null;
  const s = String(raw);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const extractTime = (raw) => {
  if (!raw) return "";
  const s = String(raw);
  const m = s.match(/T(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}`;
  if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 5);
  return "";
};

const defaultMoney = (n) => `$${Number(n || 0).toLocaleString()}`;

const REFRESH_INTERVAL_MS = 15000;

// ─── Component ──────────────────────────────────────────────────────────────

export default function ReservationDashboard({
  bookings = [],
  coffins = [],
  branches = [],
  formatPrice,
  onNewReservation,
  onViewBooking,
}) {
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const [liveBookings, setLiveBookings] = useState(bookings);
  const [liveCoffins, setLiveCoffins] = useState(coffins);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [liveError, setLiveError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const refreshInFlight = useRef(false);

  // ── Sync with parent props ──
  useEffect(() => { setLiveBookings(bookings); }, [bookings]);
  useEffect(() => { setLiveCoffins(coffins); }, [coffins]);

  // ── Fetch live data ──
  const fetchLiveData = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setRefreshing(true);
    try {
      const parentSlug = getParentTenantSlug();
      const tenantId = getTenantId();
      const [ordersRes, coffinsRes] = await Promise.all([
        api.get("/coffins/orders"),
        api.get("/coffins/all-branches", {
          params: { parent_slug: parentSlug || undefined, tenant_id: tenantId || undefined },
        }),
      ]);
      if (ordersRes.data?.success && Array.isArray(ordersRes.data.data)) {
        setLiveBookings(ordersRes.data.data);
      }
      if (coffinsRes.data?.success && Array.isArray(coffinsRes.data.data)) {
        setLiveCoffins(coffinsRes.data.data);
      }
      setLastUpdated(new Date());
      setLiveError(null);
    } catch (err) {
      setLiveError(err?.response?.data?.message || err?.message || "Live refresh failed");
    } finally {
      refreshInFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  // ── Polling ──
  useEffect(() => {
    fetchLiveData();
    const t = setInterval(() => { if (isLive) fetchLiveData(); }, REFRESH_INTERVAL_MS);
    const onVis = () => { if (document.visibilityState === "visible") fetchLiveData(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchLiveData, isLive]);

  const money = typeof formatPrice === "function" ? formatPrice : defaultMoney;

  // ── Map bookings ──
  const mappedBookings = useMemo(() => {
    return (liveBookings || [])
      .map((b) => {
        const date = parseServiceDate(b.service_date);
        const c = (liveCoffins || []).find((x) => (x.coffin_id || x.id) == b.coffin_id);
        return {
          id: b.id,
          clientName: b.client_name || "—",
          phone: b.client_phone || b.phone || "—",
          coffinType: c ? c.name : "—",
          date: date || new Date(),
          time: extractTime(b.service_time || b.time || b.service_date),
          status: mapStatus(b.status),
          price: Number(b.coffin_price || b.price || 0),
          paid: !!b.paid,
          notes: b.notes || "",
          rawData: b,
        };
      })
      .sort((a, b2) => a.date.getTime() - b2.date.getTime());
  }, [liveBookings, liveCoffins]);

  // ── Navigation ──
  function navigate(dir) {
    if (view === "day") setSelectedDate((d) => addDays(d, dir * 7));
    else if (view === "week")
      setSelectedDate((d) => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)));
    else setSelectedDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
  }

  // ── Calendar days ──
  const calendarDays = useMemo(() => {
    if (view === "week") {
      return eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      });
    }
    if (view === "month") {
      return eachDayOfInterval({
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate),
      });
    }
    return eachDayOfInterval({
      start: subDays(selectedDate, 10),
      end: addDays(selectedDate, 20),
    });
  }, [view, selectedDate]);

  // ── Visible bookings ──
  const visibleBookings = useMemo(() => {
    return mappedBookings.filter((b) => {
      if (view === "day") return isSameDay(b.date, selectedDate);
      if (view === "week") return isSameWeek(b.date, selectedDate, { weekStartsOn: 1 });
      return isSameMonth(b.date, selectedDate);
    });
  }, [view, selectedDate, mappedBookings]);

  // ── Labels ──
  const periodLabel = useMemo(() => {
    if (view === "day") return format(selectedDate, "EEEE, MMMM d, yyyy");
    if (view === "week") {
      const s = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const e = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`;
    }
    return format(selectedDate, "MMMM yyyy");
  }, [view, selectedDate]);

  const stripLabel = useMemo(() => {
    if (view === "week") {
      const s = startOfWeek(selectedDate, { weekStartsOn: 1 });
      return `Week of ${format(s, "MMM d, yyyy")}`;
    }
    return format(selectedDate, "MMMM yyyy");
  }, [view, selectedDate]);

  // ── Bookings per day ──
  const bookingsPerDay = useMemo(() => {
    const map = {};
    mappedBookings.forEach((b) => {
      const key = format(b.date, "yyyy-MM-dd");
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [mappedBookings]);

  // ── Stats ──
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = mappedBookings.filter((b) => isSameMonth(b.date, now));
    return {
      total: thisMonth.length,
      pending: mappedBookings.filter((b) => b.status === "pending").length,
      revenue: thisMonth
        .filter((b) => b.status === "completed")
        .reduce((s, b) => s + b.price, 0),
      today: mappedBookings.filter((b) => isToday(b.date)).length,
    };
  }, [mappedBookings]);

  // ── Chart data ──
  const typeChartData = useMemo(() => {
    const counts = {};
    mappedBookings.forEach((b) => {
      const key = b.coffinType || "Other";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.split(" ")[0], full: name, value }))
      .sort((a, b2) => b2.value - a.value);
  }, [mappedBookings]);

  const statusChartData = useMemo(() => {
    const counts = { confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
    mappedBookings.forEach((b) => counts[b.status]++);
    return ["confirmed", "pending", "completed", "cancelled"].map((s, i) => ({
      name: STATUS_CFG[s].label,
      value: counts[s],
      color: PIE_COLORS[i],
    }));
  }, [mappedBookings]);

  // ── Modal handlers ──
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
    if (onViewBooking) onViewBooking(booking.id);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  const tooltipStyle = {
    background: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
    borderRadius: "8px",
    fontSize: "11px",
    color: isDark ? "#e2e8f0" : "#0f172a",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Container isDark={isDark}>
      {/* HEADER */}
      <Header isDark={isDark}>
        <div className="d-flex align-items-center gap-2">
          <BrandIcon isDark={isDark}>
            <Icons.CalendarDays />
          </BrandIcon>
          <div>
            <p className="fw-bold fs-6 lh-1 mb-0">CoffinBook</p>
            <p className="small text-muted lh-1 mt-1 mb-0">Arrangement Manager</p>
          </div>
        </div>

        <ViewToggle isDark={isDark}>
          {["day", "week", "month"].map((v) => (
            <ViewButton
              key={v}
              active={view === v}
              isDark={isDark}
              onClick={() => setView(v)}
            >
              {v}
            </ViewButton>
          ))}
        </ViewToggle>

        <div className="d-flex align-items-center gap-2">
          <LiveBadge isDark={isDark} isError={!!liveError}>
            <LiveDot isError={!!liveError} isRefreshing={refreshing} />
            <span className="text-nowrap">
              {liveError
                ? "Offline"
                : lastUpdated
                ? `Live · ${format(lastUpdated, "HH:mm:ss")}`
                : "Live · syncing"}
            </span>
          </LiveBadge>

          <ActionButton
            isDark={isDark}
            onClick={() => setIsLive((p) => !p)}
            title={isLive ? "Pause auto-refresh" : "Resume auto-refresh"}
            style={{
              borderColor: isLive
                ? isDark ? "#065f46" : "#a7f3d0"
                : isDark ? "#b91c1c" : "#fcd34d",
              color: isLive
                ? isDark ? "#34d399" : "#059669"
                : isDark ? "#fbbf24" : "#d97706",
            }}
          >
            {isLive ? "Auto" : "Paused"}
          </ActionButton>

          <ActionButton
            isDark={isDark}
            onClick={fetchLiveData}
            title="Refresh now"
          >
            <div style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}>
              <Icons.RefreshCw />
            </div>
          </ActionButton>

          <ActionButton
            isDark={isDark}
            onClick={() => setSelectedDate(new Date())}
          >
            <span className="small fw-bold">Today</span>
          </ActionButton>

          {typeof onNewReservation === "function" && (
            <NewButton onClick={onNewReservation}>
              <Icons.Plus />
              New
            </NewButton>
          )}

          <ActionButton
            isDark={isDark}
            onClick={() => setIsDark((p) => !p)}
          >
            {isDark ? <Icons.Sun /> : <Icons.Moon />}
          </ActionButton>
        </div>
      </Header>

      {/* CALENDAR */}
      <CalendarSection isDark={isDark}>
        <CalendarHeader>
          <span className="text-muted text-uppercase fw-bold" style={{ fontSize: "11px", letterSpacing: "0.12em" }}>
            {stripLabel}
          </span>
          <div className="d-flex gap-1">
            <ActionButton isDark={isDark} onClick={() => navigate(-1)}>
              <Icons.ChevronLeft />
            </ActionButton>
            <ActionButton isDark={isDark} onClick={() => navigate(1)}>
              <Icons.ChevronRight />
            </ActionButton>
          </div>
        </CalendarHeader>

        <CalendarStrip>
          {calendarDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const count = bookingsPerDay[key] || 0;
            const isSel = isSameDay(day, selectedDate);
            const isT = isToday(day);
            const inRange =
              !isSel &&
              (view === "week"
                ? isSameWeek(day, selectedDate, { weekStartsOn: 1 })
                : view === "month"
                ? isSameMonth(day, selectedDate)
                : false);

            return (
              <DayButton
                key={key}
                isSelected={isSel}
                isInRange={inRange}
                isToday={isT}
                isDark={isDark}
                isWeekView={view === "week"}
                onClick={() => setSelectedDate(day)}
              >
                <span className={`small fw-bold text-uppercase lh-1 mb-1 ${isSel ? "text-light" : "text-muted"}`}>
                  {format(day, "EEE")}
                </span>
                <span className={`fs-6 fw-bold lh-1 ${isSel ? "text-light" : isT ? "text-primary" : ""}`}>
                  {format(day, "d")}
                </span>
                <div className="mt-1" style={{ height: "16px" }}>
                  {count > 0 ? (
                    <span className={`px-1 py-0 rounded-pill small fw-bold ${isSel ? "bg-white bg-opacity-25 text-white" : isDark ? "bg-secondary bg-opacity-25 text-light" : "bg-secondary bg-opacity-10 text-secondary"}`}>
                      {count}
                    </span>
                  ) : isT && !isSel ? (
                    <span className={`d-inline-block rounded-circle ${isDark ? "bg-primary" : "bg-primary"}`} style={{ width: "6px", height: "6px" }} />
                  ) : null}
                </div>
              </DayButton>
            );
          })}
        </CalendarStrip>
      </CalendarSection>

      {/* MAIN CONTENT */}
      <MainContent>
        {/* Bookings Panel */}
        <BookingsPanel isDark={isDark}>
          <PanelHeader isDark={isDark}>
            <div>
              <p className="fw-bold fs-6 mb-0">{periodLabel}</p>
              <p className="small text-muted mb-0">
                {visibleBookings.length} {visibleBookings.length === 1 ? "booking" : "bookings"}
              </p>
            </div>
            <div className="d-flex gap-3">
              {["confirmed", "pending", "completed", "cancelled"].map((s) => {
                const n = visibleBookings.filter((b) => b.status === s).length;
                if (!n) return null;
                const c = STATUS_CFG[s];
                return (
                  <div key={s} className="d-flex align-items-center gap-1">
                    <span className={`d-inline-block rounded-circle ${c.dot}`} style={{ width: "8px", height: "8px" }} />
                    <span className="small fw-semibold text-muted">{n}</span>
                  </div>
                );
              })}
            </div>
          </PanelHeader>

          <BookingList>
            {visibleBookings.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted" style={{ minHeight: "200px" }}>
                <Icons.CalendarDays />
                <p className="small mt-2">No bookings for this period</p>
              </div>
            ) : (
              visibleBookings.map((b) => {
                const cfg = STATUS_CFG[b.status];
                return (
                  <BookingCard
                    key={b.id}
                    isDark={isDark}
                    onClick={() => handleBookingClick(b)}
                  >
                    <div className="d-flex align-items-start gap-3">
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                          <span className={`small fw-bold font-monospace px-1 py-0 rounded ${isDark ? "bg-secondary bg-opacity-25 text-light" : "bg-secondary bg-opacity-10 text-secondary"}`}>
                            {b.id}
                          </span>
                          <span className={`d-inline-flex align-items-center gap-1 small fw-bold px-2 py-0 rounded-pill border ${isDark ? cfg.darkCls : cfg.lightCls}`}>
                            <span className={`d-inline-block rounded-circle ${cfg.dot}`} style={{ width: "6px", height: "6px" }} />
                            {cfg.label}
                          </span>
                          <span className={`small fw-bold px-2 py-0 rounded-pill border ${b.paid ? (isDark ? "bg-success bg-opacity-20 text-success border-success" : "bg-success bg-opacity-10 text-success border-success") : (isDark ? "bg-danger bg-opacity-20 text-danger border-danger" : "bg-danger bg-opacity-10 text-danger border-danger")}`}>
                            {b.paid ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                        <p className="fw-bold fs-6 lh-sm mb-0">{b.clientName}</p>
                        <p className="small text-muted mb-0">{b.coffinType}</p>
                      </div>

                      <div className="text-end flex-shrink-0">
                        <p className="fw-bold fs-6 mb-0">{money(b.price)}</p>
                        <p className="small text-muted mb-0">
                          {format(b.date, "MMM d")}
                          {b.time ? ` · ${b.time}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-top d-flex align-items-center gap-4 flex-wrap">
                      <span className="d-flex align-items-center gap-1 small text-muted">
                        <Icons.Phone />
                        {b.phone}
                      </span>
                      {b.notes && (
                        <span className="small fst-italic text-muted text-truncate" style={{ maxWidth: "220px" }}>
                          {b.notes}
                        </span>
                      )}
                    </div>
                  </BookingCard>
                );
              })
            )}
          </BookingList>
        </BookingsPanel>

        {/* Analytics Panel */}
        <AnalyticsPanel isDark={isDark}>
          <div className="row g-3">
            {[
              {
                label: "This Month",
                value: stats.total,
                sub: "bookings total",
                icon: <Icons.Users />,
                color: isDark ? "text-primary" : "text-primary",
              },
              {
                label: "Pending",
                value: stats.pending,
                sub: "require action",
                icon: <Icons.AlertCircle />,
                color: isDark ? "text-warning" : "text-warning",
              },
              {
                label: "Revenue",
                value: money(stats.revenue),
                sub: "from completed",
                icon: <Icons.DollarSign />,
                color: isDark ? "text-success" : "text-success",
              },
              {
                label: "Today",
                value: stats.today,
                sub: "scheduled",
                icon: <Icons.TrendingUp />,
                color: isDark ? "text-info" : "text-info",
              },
            ].map((s) => (
              <div key={s.label} className="col-6">
                <StatCard isDark={isDark}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="small fw-medium text-muted">{s.label}</span>
                    <div className={`d-flex align-items-center justify-content-center rounded-3 ${isDark ? "bg-primary bg-opacity-10" : "bg-primary bg-opacity-10"}`} style={{ width: "32px", height: "32px" }}>
                      <span className={s.color}>{s.icon}</span>
                    </div>
                  </div>
                  <p className={`h4 fw-bold mb-0 ${isDark ? "text-light" : ""}`}>{s.value}</p>
                  <p className="small text-muted mb-0">{s.sub}</p>
                </StatCard>
              </div>
            ))}
          </div>

          <ChartCard isDark={isDark}>
            <p className="fw-bold fs-6 mb-3">Bookings by Coffin Type</p>
            {typeChartData.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ height: "156px" }}>
                <Icons.CalendarDays />
                <p className="small mt-2">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={156}>
                <BarChart
                  data={typeChartData}
                  margin={{ top: 0, right: 4, bottom: 0, left: -28 }}
                  barSize={20}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "#1e293b" : "#f1f5f9"}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                      fill: isDark ? "#94a3b8" : "#64748b",
                      fontWeight: 500,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, _name, props) => [
                      value,
                      (props && props.payload && props.payload.full) || _name,
                    ]}
                    cursor={{
                      fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill={isDark ? "#6366f1" : "#4f46e5"}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard isDark={isDark}>
            <p className="fw-bold fs-6 mb-3">Status Breakdown</p>
            <div className="d-flex align-items-center gap-4">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={54}
                      dataKey="value"
                      strokeWidth={0}
                      paddingAngle={2}
                    >
                      {statusChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-grow-1">
                {statusChartData.map((s) => (
                  <div key={s.name} className="d-flex align-items-center justify-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="d-inline-block rounded" style={{ width: "10px", height: "10px", backgroundColor: s.color }} />
                      <span className="small text-muted">{s.name}</span>
                    </div>
                    <span className="small fw-bold">{s.value}</span>
                  </div>
                ))}
                <div className="pt-2 mt-1 border-top d-flex justify-content-between align-items-center">
                  <span className="small fw-medium text-muted">Total</span>
                  <span className="fw-bold">{mappedBookings.length}</span>
                </div>
              </div>
            </div>
          </ChartCard>
        </AnalyticsPanel>
      </MainContent>

      {/* ─── MODAL ────────────────────────────────────────────────────────── */}
      {showModal && selectedBooking && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent isDark={isDark} onClick={(e) => e.stopPropagation()}>
            <ModalHeader isDark={isDark}>
              <h5 className="fw-bold mb-0">Booking Details</h5>
              <ModalClose isDark={isDark} onClick={handleCloseModal}>
                <Icons.X />
              </ModalClose>
            </ModalHeader>

            <div>
              <ModalDetailRow isDark={isDark}>
                <ModalLabel isDark={isDark}>Booking ID</ModalLabel>
                <ModalValue isDark={isDark}>#{selectedBooking.id}</ModalValue>
              </ModalDetailRow>
              <ModalDetailRow isDark={isDark}>
                <ModalLabel isDark={isDark}>Client Name</ModalLabel>
                <ModalValue isDark={isDark}>{selectedBooking.clientName}</ModalValue>
              </ModalDetailRow>
              <ModalDetailRow isDark={isDark}>
                <ModalLabel isDark={isDark}>Phone</ModalLabel>
                <ModalValue isDark={isDark}>{selectedBooking.phone}</ModalValue>
              </ModalDetailRow>
              <ModalDetailRow isDark={isDark}>
                <ModalLabel isDark={isDark}>Coffin Type</ModalLabel>
                <ModalValue isDark={isDark}>{selectedBooking.coffinType}</ModalValue>
              </ModalDetailRow>
              <ModalDetailRow isDark={isDark}>
                <ModalLabel isDark={isDark}>Date</ModalLabel>
                <ModalValue isDark={isDark}>{format(selectedBooking.date, "MMMM d, yyyy")}</ModalValue>
              </ModalDetailRow>
              <ModalDetailRow isDark={isDark}>
                <ModalLabel isDark={isDark}>Time</ModalLabel>
                <ModalValue isDark={isDark}>{selectedBooking.time || "—"}</ModalValue>
              </ModalDetailRow>
              <ModalDetailRow isDark={isDark}>
                <ModalLabel isDark={isDark}>Status</ModalLabel>
                <ModalValue isDark={isDark}>
                  <span className={`badge ${isDark ? STATUS_CFG[selectedBooking.status].darkCls : STATUS_CFG[selectedBooking.status].lightCls}`}>
                    {STATUS_CFG[selectedBooking.status].label}
                  </span>
                </ModalValue>
              </ModalDetailRow>
              <ModalDetailRow isDark={isDark}>
                <ModalLabel isDark={isDark}>Price</ModalLabel>
                <ModalValue isDark={isDark}>{money(selectedBooking.price)}</ModalValue>
              </ModalDetailRow>
              <ModalDetailRow isDark={isDark}>
                <ModalLabel isDark={isDark}>Payment Status</ModalLabel>
                <ModalValue isDark={isDark}>
                  <span className={`badge ${selectedBooking.paid ? (isDark ? "bg-success bg-opacity-20 text-success" : "bg-success bg-opacity-10 text-success") : (isDark ? "bg-danger bg-opacity-20 text-danger" : "bg-danger bg-opacity-10 text-danger")}`}>
                    {selectedBooking.paid ? "Paid" : "Unpaid"}
                  </span>
                </ModalValue>
              </ModalDetailRow>
              {selectedBooking.notes && (
                <ModalDetailRow isDark={isDark}>
                  <ModalLabel isDark={isDark}>Notes</ModalLabel>
                  <ModalValue isDark={isDark}>{selectedBooking.notes}</ModalValue>
                </ModalDetailRow>
              )}
            </div>

            <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCloseModal}
              >
                Close
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  handleCloseModal();
                  if (onViewBooking) onViewBooking(selectedBooking.id);
                }}
              >
                View Full Details
              </button>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}