import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import api from '../../api/axios';
import { useSocket } from '../../utils/context/socketContext';
import {
    Headphones, MessageSquare, Search, Send, Clock, RefreshCw,
    CheckCircle2, User, Users, AlertTriangle,
} from '../../utils/icons/icons';

/* ============================================================
   REST POINT — System Admin Console (light theme · tickets-first)
   Default tab = Support Tickets with full conversations & replies.
   Real-time via Socket.IO: ticket_updated / ticket_response
   ============================================================ */

const C = {
    white: '#ffffff', pageBg: '#f5f6f8',
    gray50: '#f5f5f5', gray100: '#f0f0f0', gray200: '#e4e4e4',
    gray300: '#d1d1d1', gray400: '#a3a3a3', gray500: '#737373',
    gray600: '#525252', gray700: '#404040', gray800: '#262626', gray900: '#171717',
    accent: '#0d9488', accentLight: '#ccfbf1', accentDark: '#0f766e',
    red: '#ef4444', redLight: '#fef2f2',
    amber: '#f59e0b', amberLight: '#fffbeb',
    green: '#22c55e', greenLight: '#f0fdf4',
    blue: '#3b82f6', blueLight: '#eff6ff',
};

const STATUS_META = {
    open: { label: 'Open', color: C.green, bg: C.greenLight },
    in_progress: { label: 'In Progress', color: C.amber, bg: C.amberLight },
    resolved: { label: 'Resolved', color: C.accent, bg: C.accentLight },
    closed: { label: 'Closed', color: C.gray400, bg: C.gray100 },
};

const TYPE_META = {
    help: { label: 'Question', color: C.blue, bg: C.blueLight },
    bug: { label: 'Bug Report', color: C.red, bg: C.redLight },
    feature: { label: 'Suggestion', color: '#16a34a', bg: C.greenLight },
    other: { label: 'General', color: C.gray600, bg: C.gray100 },
    trial_request: { label: 'Free Trial', color: '#7c3aed', bg: '#f3e8ff' },
};

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'closed', label: 'Closed' },
];

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function clockTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getInitials(name, email) {
    const src = (name && name.trim()) || email || '?';
    const parts = src.replace(/[^\w\s@]/g, '').split(/[\s@._]+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const toastIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const livePulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.35; }
  50% { transform: scale(1.7); opacity: 0; }
`;

const spinAnim = keyframes`
  from { transform: rotate(0deg); } to { transform: rotate(360deg); }
`;

const Page = styled.div`
  min-height: 100vh;
  background: ${C.pageBg};
  font-family: 'DM Sans', sans-serif;
  color: ${C.gray800};
  padding: 20px;

  @media (max-width: 640px) { padding: 12px; }
`;

const Panel = styled.div`
  background: ${C.white};
  border: 1px solid ${C.gray200};
  border-radius: 16px;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 22px;
  border-bottom: 1px solid ${C.gray200};
  flex-wrap: wrap;
`;

const Logo = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: ${C.gray900};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoIcon = styled.div`
  width: 32px; height: 32px;
  background: ${C.gray900};
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: ${C.white}; flex-shrink: 0;
`;

const HeaderSub = styled.div`font-size: 11.5px; color: ${C.gray400}; margin-top: 2px;`;

const LivePill = styled.span`
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.6px;
  color: ${p => (p.$on ? '#16a34a' : C.gray400)};
  background: ${p => (p.$on ? C.greenLight : C.gray100)};
  border-radius: 99px; padding: 3px 9px;
`;

const LiveDot = styled.span`
  width: 7px; height: 7px; border-radius: 50%;
  background: ${p => (p.$on ? C.green : C.gray400)};
  position: relative; display: inline-block;

  &::before {
    content: ''; position: absolute; inset: -3px; border-radius: 50%;
    background: ${p => (p.$on ? C.green : 'transparent')};
    opacity: 0.3; animation: ${livePulse} 2s ease infinite;
  }
`;

const Tabs = styled.div`
  display: flex; gap: 4px; padding: 10px 16px;
  border-bottom: 1px solid ${C.gray200}; flex-wrap: wrap;
  background: ${C.gray50};
`;

const TabBtn = styled.button`
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 16px; border-radius: 8px;
  font-family: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; border: none; transition: all 0.2s ease;
  background: transparent; color: ${C.gray600};

  &:hover { background: ${C.gray100}; color: ${C.gray800}; }

  ${p => p.$active && `background:${C.white}; color:${C.accentDark}; box-shadow:0 1px 2px rgba(0,0,0,0.06); border:1px solid ${C.gray200};`}
`;

const TabBadge = styled.span`
  background: ${C.red}; color: ${C.white};
  font-size: 10px; font-weight: 700;
  min-width: 17px; text-align: center;
  padding: 1px 6px; border-radius: 99px;
`;

const Btn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 15px; border-radius: 8px;
  font-family: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; border: none; transition: all 0.2s ease; white-space: nowrap;

  ${p => p.$variant === 'accent' && `background:${C.accent}; color:${C.white}; &:hover:not(:disabled){background:${C.accentDark};}`}
  ${p => p.$variant === 'ghost' && `background:${C.white}; color:${C.gray600}; border:1px solid ${C.gray200}; &:hover:not(:disabled){background:${C.gray50};}`}
  ${p => p.$variant === 'danger' && `background:${C.white}; color:${C.red}; border:1px solid #fecaca; &:hover:not(:disabled){background:${C.redLight};}`}

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Content = styled.div`
  display: flex;
  min-height: calc(100vh - 210px);

  @media (max-width: 760px) { flex-direction: column; }
`;

const ListPane = styled.div`
  width: 400px;
  border-right: 1px solid ${C.gray200};
  display: flex; flex-direction: column; flex-shrink: 0;

  @media (max-width: 1100px) { width: 330px; }
  @media (max-width: 760px) {
    width: 100%; max-height: 45vh;
    border-right: none; border-bottom: 1px solid ${C.gray200};
  }
`;

const Filters = styled.div`
  padding: 12px 14px; display: flex; gap: 6px; align-items: center;
  border-bottom: 1px solid ${C.gray100}; flex-wrap: wrap;
`;

const FilterChip = styled.button`
  padding: 4px 12px; border-radius: 99px;
  font-family: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
  border: 1px solid ${C.gray200}; background: ${C.white}; color: ${C.gray600};
  transition: all 0.2s ease;

  &:hover { border-color: ${C.gray300}; }

  ${p => p.$active && `background:${C.gray900}; color:${C.white}; border-color:${C.gray900};`}
`;

const TicketsScroll = styled.div`
  flex: 1; overflow-y: auto; padding: 8px;

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.gray300}; border-radius: 10px; }
`;

const TicketCard = styled.div`
  padding: 14px 16px; border-radius: 12px; cursor: pointer;
  transition: all 0.2s ease; border: 1px solid transparent; margin-bottom: 2px;

  &:hover { background: ${C.gray50}; }

  ${p => p.$active && `background:${C.gray50}; border-color:${C.gray200};`}
`;

const CardHeader = styled.div`
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
`;

const TicketId = styled.span`
  font-size: 11px; font-weight: 600; color: ${C.gray400};
  font-family: 'Space Grotesk', sans-serif;
`;

const StatusDot = styled.span`
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  background: ${p => p.$color || C.gray300};
`;

const TypeBadge = styled.span`
  margin-left: auto;
  font-size: 10px; font-weight: 600; padding: 2px 8px;
  border-radius: 99px; text-transform: uppercase; letter-spacing: 0.5px;
  background: ${p => p.$bg}; color: ${p => p.$color};
`;

const CardTitle = styled.div`
  font-size: 13.5px; font-weight: 600; color: ${C.gray800};
  margin-bottom: 4px; line-height: 1.4;
`;

const CardPreview = styled.div`
  font-size: 12px; color: ${C.gray400}; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap;
`;

const MiniAvatar = styled.div`
  width: 20px; height: 20px; border-radius: 50%;
  background: ${C.gray200};
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700; color: ${C.gray500}; flex-shrink: 0;
`;

const TenantChip = styled.span`
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.4px;
  padding: 2px 7px; border-radius: 99px;
  background: ${C.gray100}; color: ${C.gray600};
  max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const Meta = styled.span`
  font-size: 11px; color: ${C.gray400};
  display: inline-flex; align-items: center; gap: 4px;

  ${p => p.$right && 'margin-left: auto;'}
`;

const DetailPane = styled.div`
  flex: 1; display: flex; flex-direction: column; min-width: 0;

  @media (max-width: 760px) { min-height: 55vh; }
`;

const DetailHeader = styled.div`
  padding: 16px 22px;
  border-bottom: 1px solid ${C.gray200}; flex-shrink: 0;
`;

const DetailRow = styled.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 4px; flex-wrap: wrap;
`;

const DetailTitle = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 19px; font-weight: 700; color: ${C.gray900}; margin-top: 2px;
`;

const DetailMeta = styled.div`
  display: flex; gap: 16px; margin-top: 8px;
  font-size: 12px; color: ${C.gray400}; flex-wrap: wrap;

  span { display: inline-flex; align-items: center; gap: 5px; }
`;

const StatusSelect = styled.select`
  padding: 4px 8px; border: 1px solid ${C.gray200}; border-radius: 6px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: ${C.gray700}; background: ${C.white};
  outline: none; cursor: pointer;

  &:focus { border-color: ${C.accent}; }
`;

const Thread = styled.div`
  flex: 1; overflow-y: auto; padding: 20px 22px;

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.gray300}; border-radius: 10px; }
`;

const Msg = styled.div`
  display: flex; gap: 12px; margin-bottom: 18px;
  animation: ${fadeInUp} 0.3s ease;
`;

const MsgAvatar = styled.div`
  width: 34px; height: 34px; border-radius: 50%;
  background: ${p => (p.$staff ? C.accentLight : C.gray200)};
  color: ${p => (p.$staff ? C.accentDark : C.gray600)};
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0; margin-top: 2px;
`;

const MsgBody = styled.div`flex: 1; min-width: 0;`;
const MsgHeader = styled.div`display: flex; align-items: center; gap: 8px; margin-bottom: 4px;`;
const MsgName = styled.span`font-size: 13px; font-weight: 600; color: ${C.gray800};`;

const StaffTag = styled.span`
  font-size: 10px; font-weight: 600; padding: 1px 6px;
  border-radius: 4px; background: ${C.accentLight}; color: ${C.accentDark};
`;

const MsgTime = styled.span`font-size: 11px; color: ${C.gray400}; margin-left: auto; white-space: nowrap;`;

const MsgText = styled.div`
  font-size: 13.5px; color: ${C.gray700}; line-height: 1.7;
  word-break: break-word; white-space: pre-wrap;
`;

const ReplyBox = styled.div`
  padding: 14px 22px 16px;
  border-top: 1px solid ${C.gray200}; flex-shrink: 0; background: ${C.gray50};
`;

const ReplyArea = styled.div`
  border: 1px solid ${C.gray200}; border-radius: 12px; overflow: hidden;
  transition: all 0.2s ease; background: ${C.white};

  &:focus-within {
    border-color: ${C.accent};
    box-shadow: 0 0 0 3px rgba(13,148,136,0.08);
  }

  textarea {
    width: 100%; padding: 12px 14px;
    border: none; outline: none;
    font-family: inherit; font-size: 13.5px; resize: none;
    color: ${C.gray800}; line-height: 1.6;
    min-height: 56px; max-height: 120px;
    &::placeholder { color: ${C.gray400}; }
  }
`;

const ReplyToolbar = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 10px; border-top: 1px solid ${C.gray100};
`;

const ReplyHint = styled.span`font-size: 11px; color: ${C.gray400};`;

const EmptyState = styled.div`
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: ${C.gray400}; padding: 40px; text-align: center;

  p { font-size: 14px; margin-top: 4px; }
`;

const Spinner = styled(RefreshCw)`
  animation: ${spinAnim} 1s linear infinite;
`;

/* ─── Tenants / Overview ─── */

const TabContent = styled.div`padding: 20px 22px; overflow-y: auto;`;

const StatsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px; margin-bottom: 22px;
`;

const StatCard = styled.div`
  background: ${C.white}; border: 1px solid ${C.gray200};
  border-radius: 12px; padding: 16px 18px;

  .label { font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase; color: ${C.gray400}; }
  .value { font-family: 'Space Grotesk', sans-serif;
    font-size: 26px; font-weight: 700; color: ${C.gray900}; margin-top: 6px; }
`;

const SearchRow = styled.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap;
`;

const SearchBox = styled.div`
  display: flex; align-items: center; gap: 8px;
  background: ${C.white}; border: 1px solid ${C.gray200};
  border-radius: 8px; padding: 8px 12px; width: 280px;

  &:focus-within {
    border-color: ${C.accent};
    box-shadow: 0 0 0 3px rgba(13,148,136,0.08);
  }

  input {
    border: none; background: transparent; outline: none;
    font-size: 13px; color: ${C.gray800}; width: 100%; font-family: inherit;
    &::placeholder { color: ${C.gray400}; }
  }
`;

const TenantRow = styled.div`
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px; border: 1px solid ${C.gray200};
  border-radius: 12px; margin-bottom: 8px; background: ${C.white};
  flex-wrap: wrap;
`;

const TenantName = styled.div`
  font-size: 13.5px; font-weight: 600; color: ${C.gray800};
`;

const TenantSub = styled.div`
  font-size: 11.5px; color: ${C.gray400};
`;

const StatusPill = styled.span`
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  padding: 3px 9px; border-radius: 99px;

  ${p => p.$status === 'active' && `background:${C.greenLight}; color:#16a34a;`}
  ${p => p.$status === 'suspended' && `background:${C.amberLight}; color:${C.amber};`}
  ${p => p.$status === 'stopped' && `background:${C.redLight}; color:${C.red};`}
  ${p => !['active', 'suspended', 'stopped'].includes(p.$status) && `background:${C.gray100}; color:${C.gray600};`}
`;

const ToastContainer = styled.div`
  position: fixed; top: 20px; right: 20px; z-index: 3000;
  display: flex; flex-direction: column; gap: 8px;
`;

const Toast = styled.div`
  padding: 12px 18px; border-radius: 8px;
  font-size: 13px; font-weight: 500;
  animation: ${toastIn} 0.3s ease;
  display: flex; align-items: center; gap: 8px; max-width: 380px;

  ${p => p.$type === 'error' && `background:${C.redLight}; color:#991b1b; border:1px solid #fecaca;`}
  ${p => p.$type === 'warning' && `background:${C.amberLight}; color:#92400e; border:1px solid #fde68a;`}
  ${p => (!p.$type || p.$type === 'success') && `background:${C.gray900}; color:${C.white};`}
`;

/* ============================================================
   Component
   ============================================================ */

const AdminSysConsole = () => {
    const { socket, connected } = useSocket();

    const [activeTab, setActiveTab] = useState('support'); // tickets FIRST
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Tickets
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [replies, setReplies] = useState([]);
    const [repliesLoading, setRepliesLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    // Tenants / stats
    const [tenants, setTenants] = useState([]);
    const [stats, setStats] = useState(null);
    const [tenantsLoading, setTenantsLoading] = useState(true);
    const [tenantSearch, setTenantSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const [toasts, setToasts] = useState([]);
    const toastSeq = useRef(0);
    const selectedIdRef = useRef(null);
    const threadEndRef = useRef(null);

    selectedIdRef.current = selectedId;

    const pushToast = useCallback((message, type = 'success') => {
        const id = ++toastSeq.current;
        setToasts(prev => [...prev.slice(-3), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    /* ---------- Data ---------- */

    const fetchTickets = useCallback(async () => {
        try {
            const res = await api.get('/support/tickets/all');
            if (res.data?.success && Array.isArray(res.data.tickets)) {
                setTickets(res.data.tickets);
            }
        } catch (err) {
            console.warn('[AdminSys] tickets:', err?.message);
        } finally {
            setLoading(false);
            setLastUpdated(new Date());
        }
    }, []);

    const fetchReplies = useCallback(async (ticketId) => {
        if (!ticketId) return;
        try {
            const res = await api.get(`/support/tickets/${ticketId}/replies`);
            if (res.data?.success && Array.isArray(res.data.replies)
                && String(selectedIdRef.current) === String(ticketId)) {
                setReplies(res.data.replies);
            }
        } catch (err) {
            console.warn('[AdminSys] replies:', err?.message);
        }
    }, []);

    const fetchTenants = useCallback(async () => {
        setTenantsLoading(true);
        try {
            const res = await api.get('/system-admin/tenants');
            if (res.data?.success) setTenants(Array.isArray(res.data.data) ? res.data.data : []);
        } catch (err) {
            console.warn('[AdminSys] tenants:', err?.message);
        } finally {
            setTenantsLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get('/system-admin/dashboard');
            if (res.data?.success) setStats(res.data.data || null);
        } catch (err) {
            console.warn('[AdminSys] dashboard:', err?.message);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
        fetchTenants();
        fetchStats();
    }, [fetchTickets, fetchTenants, fetchStats]);

    // Live: socket events + polling fallback while the console is open
    useEffect(() => {
        const i = setInterval(fetchTickets, 15000);
        return () => clearInterval(i);
    }, [fetchTickets]);

    useEffect(() => {
        if (!socket) return;
        const refresh = (data = {}) => {
            fetchTickets();
            const tid = data.ticketId;
            if (!tid || String(tid) === String(selectedIdRef.current)) {
                if (selectedIdRef.current) fetchReplies(selectedIdRef.current);
            }
        };
        socket.on('ticket_updated', refresh);
        socket.on('ticket_response', refresh);
        return () => {
            socket.off('ticket_updated', refresh);
            socket.off('ticket_response', refresh);
        };
    }, [socket, fetchTickets, fetchReplies]);

    /* ---------- Actions ---------- */

    const openTicket = (ticket) => {
        setSelectedId(ticket.ticket_id);
        setReplies([]);
        setReplyText('');
        setRepliesLoading(true);
        fetchReplies(ticket.ticket_id).finally(() => setRepliesLoading(false));
    };

    const sendReply = async () => {
        const text = replyText.trim();
        if (!text || !selectedId || sendingReply) return;
        setSendingReply(true);
        try {
            const ticket = tickets.find(t => String(t.ticket_id) === String(selectedId));
            await api.post(`/support/tickets/${selectedId}/reply`, {
                message: text,
                userType: 'admin',
            }, { headers: { 'x-tenant-slug': ticket?.tenant_slug || 'system_shared' } });
            setReplyText('');
            pushToast('Reply sent — the user sees it instantly');
            await fetchReplies(selectedId);
            fetchTickets();
        } catch (err) {
            pushToast('Failed to send reply', 'error');
        } finally {
            setSendingReply(false);
        }
    };

    const handleReplyKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
    };

    const changeStatus = async (ticketId, status) => {
        try {
            const ticket = tickets.find(t => String(t.ticket_id) === String(ticketId));
            await api.patch(`/support/tickets/${ticketId}`, { status }, {
                headers: { 'x-tenant-slug': ticket?.tenant_slug || 'system_shared' },
            });
            pushToast(`Ticket #${ticketId} marked as ${STATUS_META[status]?.label || status}`);
            fetchTickets();
        } catch (err) {
            pushToast('Failed to update status', 'error');
        }
    };

    const tenantAction = async (tenant, action) => {
        const label = action === 'suspend' ? 'SUSPEND' : 'ACTIVATE';
        if (!window.confirm(`Are you sure you want to ${label} "${tenant.tenant_name}"?`)) return;
        setActionLoading(tenant.id || tenant.tenant_id);
        try {
            await api.post(`/system-admin/tenants/${tenant.id || tenant.tenant_id}/${action}`);
            pushToast(`"${tenant.tenant_name}" ${action === 'suspend' ? 'suspended' : 'activated'}`,
                action === 'suspend' ? 'warning' : 'success');
            fetchTenants();
            fetchStats();
        } catch (err) {
            pushToast(`Failed to ${action} tenant`, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    /* ---------- Derived ---------- */

    const openCount = tickets.filter(t => t.status === 'open').length;

    const visibleTickets = tickets.filter(t => {
        if (filter !== 'all' && t.status !== filter) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            String(t.ticket_id).includes(q) ||
            (t.subject || '').toLowerCase().includes(q) ||
            (t.message || '').toLowerCase().includes(q) ||
            (t.user_name || '').toLowerCase().includes(q) ||
            (t.tenant_name || '').toLowerCase().includes(q)
        );
    });

    // Auto-select the first ticket so the conversation is visible right away
    useEffect(() => {
        if (!selectedId && visibleTickets.length > 0) openTicket(visibleTickets[0]);
    }, [visibleTickets.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedTicket = tickets.find(t => String(t.ticket_id) === String(selectedId)) || null;

    const thread = [];
    if (selectedTicket) {
        thread.push({
            key: 'ticket-body',
            name: selectedTicket.user_name || selectedTicket.user_email || 'Customer',
            staff: false,
            text: selectedTicket.message,
            time: selectedTicket.created_at,
        });
        replies.forEach(r => thread.push({
            key: `reply-${r.reply_id}`,
            name: r.user_type === 'admin' ? 'Support Team' : (selectedTicket.user_name || 'Customer'),
            staff: r.user_type === 'admin',
            text: r.message,
            time: r.created_at,
        }));
    }

    useEffect(() => {
        const el = threadEndRef.current;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [replies.length, selectedId]);

    const filteredTenants = tenants.filter(t => {
        const term = tenantSearch.toLowerCase();
        if (!term) return true;
        return (
            (t.tenant_name || '').toLowerCase().includes(term) ||
            (t.email || '').toLowerCase().includes(term) ||
            (t.tenant_slug || '').toLowerCase().includes(term)
        );
    });

    const overview = stats?.overview || {};

    /* ---------- Render ---------- */

    return (
        <Page>
            <GlobalStyle />
            <Panel>
                <Header>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Logo>
                            <LogoIcon><Headphones size={15} /></LogoIcon>
                            System Administrator
                        </Logo>
                        <LivePill $on={connected}>
                            <LiveDot $on={connected} />
                            {connected ? 'LIVE' : 'OFFLINE'}
                        </LivePill>
                    </div>
                    <HeaderSub style={{ marginLeft: 'auto' }}>
                        Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                        {' '}· auto-refresh every 15s
                    </HeaderSub>
                    <Btn $variant="ghost" onClick={() => { fetchTickets(); fetchTenants(); fetchStats(); }}>
                        <RefreshCw size={13} /> Refresh
                    </Btn>
                </Header>

                <Tabs>
                    <TabBtn $active={activeTab === 'support'} onClick={() => setActiveTab('support')}>
                        <MessageSquare size={14} /> Support Tickets
                        {openCount > 0 && <TabBadge>{openCount}</TabBadge>}
                    </TabBtn>
                    <TabBtn $active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')}>
                        <Users size={14} /> Tenants ({tenants.length})
                    </TabBtn>
                    <TabBtn $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                        📊 Overview
                    </TabBtn>
                </Tabs>

                {/* ═══ SUPPORT TICKETS (default) ═══ */}
                {activeTab === 'support' && (
                    <Content>
                        <ListPane>
                            <Filters>
                                {FILTERS.map(f => (
                                    <FilterChip key={f.id} $active={filter === f.id} onClick={() => setFilter(f.id)}>
                                        {f.label}
                                    </FilterChip>
                                ))}
                            </Filters>
                            <Filters>
                                <SearchBox style={{ width: '100%' }}>
                                    <Search size={13} />
                                    <input placeholder="Search tickets, tenants, users..." value={search}
                                        onChange={(e) => setSearch(e.target.value)} />
                                </SearchBox>
                            </Filters>
                            <TicketsScroll>
                                {loading ? (
                                    <EmptyState><Spinner size={26} /><p>Loading tickets...</p></EmptyState>
                                ) : visibleTickets.length === 0 ? (
                                    <EmptyState>
                                        <MessageSquare size={38} />
                                        <p>No support tickets found</p>
                                        <p style={{ fontSize: 12 }}>New tickets from tenants appear here instantly.</p>
                                    </EmptyState>
                                ) : visibleTickets.map(t => {
                                    const st = STATUS_META[t.status] || STATUS_META.open;
                                    const tp = TYPE_META[t.type] || TYPE_META.help;
                                    return (
                                        <TicketCard key={t.ticket_id}
                                            $active={String(selectedId) === String(t.ticket_id)}
                                            onClick={() => openTicket(t)}>
                                            <CardHeader>
                                                <StatusDot $color={st.color} />
                                                <TicketId>#{t.ticket_id}</TicketId>
                                                <TypeBadge $bg={tp.bg} $color={tp.color}>{tp.label}</TypeBadge>
                                            </CardHeader>
                                            <CardTitle>{t.subject}</CardTitle>
                                            <CardPreview>{t.message}</CardPreview>
                                            <CardFooter>
                                                <MiniAvatar>{getInitials(t.user_name, t.user_email)}</MiniAvatar>
                                                <Meta><User size={10} /> {t.user_name || t.user_email || 'User'}</Meta>
                                                {t.tenant_name && <TenantChip>{t.tenant_name}</TenantChip>}
                                                <Meta $right><Clock size={10} /> {timeAgo(t.created_at)}</Meta>
                                            </CardFooter>
                                        </TicketCard>
                                    );
                                })}
                            </TicketsScroll>
                        </ListPane>

                        {/* Conversation */}
                        <DetailPane>
                            {!selectedTicket ? (
                                <EmptyState>
                                    <MessageSquare size={40} />
                                    <p>Select a ticket to view the conversation</p>
                                </EmptyState>
                            ) : (
                                <>
                                    <DetailHeader>
                                        <DetailRow>
                                            <StatusDot $color={(STATUS_META[selectedTicket.status] || STATUS_META.open).color} />
                                            <TicketId style={{ fontSize: 13 }}>#{selectedTicket.ticket_id}</TicketId>
                                            <TypeBadge
                                                $bg={(TYPE_META[selectedTicket.type] || TYPE_META.help).bg}
                                                $color={(TYPE_META[selectedTicket.type] || TYPE_META.help).color}>
                                                {(TYPE_META[selectedTicket.type] || TYPE_META.help).label}
                                            </TypeBadge>
                                            {selectedTicket.tenant_name && <TenantChip>{selectedTicket.tenant_name}</TenantChip>}
                                            <StatusSelect
                                                style={{ marginLeft: 'auto' }}
                                                value={selectedTicket.status || 'open'}
                                                onChange={(e) => changeStatus(selectedTicket.ticket_id, e.target.value)}>
                                                <option value="open">Open</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </StatusSelect>
                                        </DetailRow>
                                        <DetailTitle>{selectedTicket.subject}</DetailTitle>
                                        <DetailMeta>
                                            <span><User size={11} /> {selectedTicket.user_name || 'User'}</span>
                                            {selectedTicket.user_email && <span>✉ {selectedTicket.user_email}</span>}
                                            <span><Clock size={11} /> {timeAgo(selectedTicket.created_at)}</span>
                                            <span><MessageSquare size={11} /> {replies.length} repl{replies.length === 1 ? 'y' : 'ies'}</span>
                                        </DetailMeta>
                                    </DetailHeader>

                                    <Thread>
                                        {repliesLoading && thread.length <= 1 ? (
                                            <EmptyState style={{ padding: 20 }}><Spinner size={20} /><p>Loading conversation...</p></EmptyState>
                                        ) : (
                                            <>
                                                {thread.map(m => (
                                                    <Msg key={m.key}>
                                                        <MsgAvatar $staff={m.staff}>{getInitials(m.name)}</MsgAvatar>
                                                        <MsgBody>
                                                            <MsgHeader>
                                                                <MsgName>{m.name}</MsgName>
                                                                {m.staff && <StaffTag>SUPPORT</StaffTag>}
                                                                <MsgTime>{clockTime(m.time)} · {timeAgo(m.time)}</MsgTime>
                                                            </MsgHeader>
                                                            <MsgText>{m.text}</MsgText>
                                                        </MsgBody>
                                                    </Msg>
                                                ))}
                                                <div ref={threadEndRef} />
                                            </>
                                        )}
                                    </Thread>

                                    <ReplyBox>
                                        <ReplyArea>
                                            <textarea
                                                placeholder="Reply as Support Team... (Enter to send, Shift+Enter for new line)"
                                                rows={2}
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                onKeyDown={handleReplyKey}
                                            />
                                            <ReplyToolbar>
                                                <ReplyHint>The tenant is notified instantly via live updates</ReplyHint>
                                                <Btn $variant="accent" onClick={sendReply} disabled={!replyText.trim() || sendingReply}>
                                                    {sendingReply ? 'Sending...' : (<> Reply <Send size={12} /></>)}
                                                </Btn>
                                            </ReplyToolbar>
                                        </ReplyArea>
                                    </ReplyBox>
                                </>
                            )}
                        </DetailPane>
                    </Content>
                )}

                {/* ═══ TENANTS ═══ */}
                {activeTab === 'tenants' && (
                    <TabContent>
                        <SearchRow>
                            <SearchBox>
                                <Search size={13} />
                                <input placeholder="Search tenants..." value={tenantSearch}
                                    onChange={(e) => setTenantSearch(e.target.value)} />
                            </SearchBox>
                            <span style={{ fontSize: 12, color: C.gray400 }}>{filteredTenants.length} of {tenants.length}</span>
                        </SearchRow>
                        {tenantsLoading ? (
                            <EmptyState><Spinner size={24} /><p>Loading tenants...</p></EmptyState>
                        ) : filteredTenants.length === 0 ? (
                            <EmptyState><Users size={38} /><p>No tenants found</p></EmptyState>
                        ) : filteredTenants.map(t => {
                            const id = t.id ?? t.tenant_id;
                            const status = (t.status || '').toLowerCase();
                            return (
                                <TenantRow key={id}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: C.accentLight, color: C.accentDark,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: 13, flexShrink: 0,
                                    }}>
                                        {getInitials(t.tenant_name)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 150 }}>
                                        <TenantName>{t.tenant_name}</TenantName>
                                        <TenantSub>{t.email} · {t.tenant_slug} · {t.country || '—'}</TenantSub>
                                    </div>
                                    <StatusPill $status={status}>{status || 'unknown'}</StatusPill>
                                    {actionLoading === id ? (
                                        <Spinner size={14} />
                                    ) : status === 'active' ? (
                                        <Btn $variant="danger" onClick={() => tenantAction(t, 'suspend')}>Suspend</Btn>
                                    ) : (
                                        <Btn $variant="accent" onClick={() => tenantAction(t, 'activate')}>Activate</Btn>
                                    )}
                                </TenantRow>
                            );
                        })}
                    </TabContent>
                )}

                {/* ═══ OVERVIEW ═══ */}
                {activeTab === 'overview' && (
                    <TabContent>
                        <StatsGrid>
                            <StatCard><div className="label">Total Tenants</div>
                                <div className="value">{overview.totalTenants ?? tenants.length}</div></StatCard>
                            <StatCard><div className="label">Active</div>
                                <div className="value">{overview.activeTenants ?? tenants.filter(t => (t.status || '').toLowerCase() === 'active').length}</div></StatCard>
                            <StatCard><div className="label">Suspended</div>
                                <div className="value">{overview.suspendedTenants ?? tenants.filter(t => (t.status || '').toLowerCase() === 'suspended').length}</div></StatCard>
                            <StatCard><div className="label">Open Tickets</div>
                                <div className="value" style={{ color: openCount > 0 ? C.amber : C.gray900 }}>{openCount}</div></StatCard>
                            <StatCard><div className="label">Total Tickets</div>
                                <div className="value">{tickets.length}</div></StatCard>
                            <StatCard><div className="label">Resolved</div>
                                <div className="value">{tickets.filter(t => t.status === 'resolved').length}</div></StatCard>
                        </StatsGrid>
                        {!stats && (
                            <div style={{
                                display: 'flex', gap: 10, alignItems: 'flex-start',
                                padding: '14px 16px', borderRadius: 12,
                                background: C.amberLight, border: '1px solid #fde68a',
                                fontSize: 13, color: '#92400e', marginBottom: 14,
                            }}>
                                <AlertTriangle size={16} />
                                <span>Live platform stats are unavailable right now ({'/system-admin/dashboard'} did not respond). Ticket counts above come directly from the support database and are always live.</span>
                            </div>
                        )}
                    </TabContent>
                )}
            </Panel>

            {/* Toasts */}
            <ToastContainer>
                {toasts.map(t => (
                    <Toast key={t.id} $type={t.type}>
                        {t.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                        {t.message}
                    </Toast>
                ))}
            </ToastContainer>
        </Page>
    );
};

export default AdminSysConsole;








