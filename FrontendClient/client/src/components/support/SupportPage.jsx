import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { api } from '../../api';
import { useSocket } from '../../utils/context/socketContext';
import {
    Headphones, MessageSquare, Plus, Search, Send, X, Clock,
    CheckCircle2, RefreshCw, LifeBuoy, Wifi, User,
} from '../../utils/icons/icons';

/* ============================================================
   REST POINT — Support Center (Tickets only · Real-time)
   Design: DM Sans / Space Grotesk · teal accent · light theme
   Live updates via Socket.IO: ticket_updated / ticket_response
   ============================================================ */

const C = {
    white: '#ffffff', offWhite: '#fafafa',
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

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const modalIn = keyframes`
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;

const toastIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const livePulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.35; }
  50% { transform: scale(1.7); opacity: 0; }
`;

const Shell = styled.div`
  display: flex;
  height: calc(100vh - 150px);
  min-height: 600px;
  background: ${C.white};
  border: 1px solid ${C.gray200};
  border-radius: 16px;
  overflow: hidden;
  font-family: 'DM Sans', sans-serif;
  color: ${C.gray800};

  @media (max-width: 860px) {
    height: calc(100vh - 110px);
    min-height: 480px;
    border-radius: 12px;
  }
`;

const Sidebar = styled.aside`
  width: 250px;
  background: ${C.white};
  border-right: 1px solid ${C.gray200};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: 860px) { display: none; }
`;

const SidebarHeader = styled.div`
  padding: 20px 20px 16px;
  border-bottom: 1px solid ${C.gray100};
`;

const Logo = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 19px;
  font-weight: 700;
  color: ${C.gray900};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: ${C.gray900};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${C.white};
  flex-shrink: 0;
`;

const SidebarNav = styled.nav`
  padding: 12px 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const NavLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: ${C.gray400};
  padding: 12px 12px 6px;
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  color: ${C.gray600};
  transition: all 0.2s ease;
  user-select: none;

  &:hover { background: ${C.gray50}; color: ${C.gray800}; }

  ${p => p.$active && `background: ${C.accentLight}; color: ${C.accentDark};`}
`;
const NavBadge = styled.span`
  margin-left: auto;
  background: ${C.red};
  color: ${C.white};
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 99px;
  min-width: 18px;
  text-align: center;
`;

const LivePill = styled.span`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: ${p => (p.$on ? '#16a34a' : C.gray400)};
  background: ${p => (p.$on ? C.greenLight : C.gray100)};
  border-radius: 99px;
  padding: 2px 8px;
`;

const LiveDot = styled.span`
  width: 7px;
  height: 7px;
  background: ${p => (p.$on ? C.green : C.gray400)};
  border-radius: 50%;
  display: inline-block;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: ${p => (p.$on ? C.green : 'transparent')};
    opacity: 0.3;
    animation: ${livePulse} 2s ease infinite;
  }
`;

const SidebarFooter = styled.div`
  padding: 14px 16px;
  border-top: 1px solid ${C.gray100};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Avatar = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${C.gray200};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: ${C.gray600};
  flex-shrink: 0;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    background: ${p => (p.$online ? C.green : C.gray400)};
    border: 2px solid ${C.white};
    border-radius: 50%;
  }
`;

const UserInfo = styled.div`flex: 1; min-width: 0;`;
const UserName = styled.div`
  font-size: 13px; font-weight: 600; color: ${C.gray800};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const UserRole = styled.div`font-size: 11px; color: ${C.gray400};`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Topbar = styled.div`
  padding: 14px 24px;
  border-bottom: 1px solid ${C.gray200};
  display: flex;
  align-items: center;
  gap: 14px;
  background: ${C.white};
  flex-shrink: 0;
  flex-wrap: wrap;

  @media (max-width: 640px) { padding: 12px 16px; }
`;

const TopbarTitleWrap = styled.div`display: flex; flex-direction: column;`;
const TopbarTitle = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: ${C.gray900};
  line-height: 1.2;
`;
const TopbarSubtitle = styled.div`
  font-size: 11.5px;
  color: ${C.gray400};
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${C.gray50};
  border: 1px solid ${C.gray200};
  border-radius: 8px;
  padding: 7px 12px;
  width: 240px;
  transition: all 0.2s ease;
  margin-left: auto;

  &:focus-within {
    border-color: ${C.accent};
    background: ${C.white};
    box-shadow: 0 0 0 3px rgba(13,148,136,0.08);
  }

  input {
    border: none; background: transparent; outline: none;
    font-size: 13px; color: ${C.gray800}; width: 100%; font-family: inherit;
    &::placeholder { color: ${C.gray400}; }
  }

  @media (max-width: 640px) { width: 150px; }
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
  user-select: none;

  ${p => p.$variant === 'accent' && `background: ${C.accent}; color: ${C.white}; &:hover:not(:disabled){background:${C.accentDark};}`}

  ${p => p.$variant === 'ghost' && `background: transparent; color: ${C.gray600}; border: 1px solid ${C.gray200}; &:hover:not(:disabled){background:${C.gray50};border-color:${C.gray300};}`}

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
const Content = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
`;

const ListPane = styled.div`
  width: 400px;
  border-right: 1px solid ${C.gray200};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: 860px) { width: 320px; }
  @media (max-width: 640px) {
    width: 100%;
    max-height: 40%;
    border-right: none;
    border-bottom: 1px solid ${C.gray200};
  }
`;

const Filters = styled.div`
  padding: 12px 14px;
  display: flex;
  gap: 6px;
  border-bottom: 1px solid ${C.gray100};
  flex-shrink: 0;
  flex-wrap: wrap;
`;

const FilterChip = styled.div`
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid ${C.gray200};
  background: ${C.white};
  color: ${C.gray600};
  transition: all 0.2s ease;
  user-select: none;

  &:hover { border-color: ${C.gray300}; }

  ${p => p.$active && `background:${C.gray900}; color:${C.white}; border-color:${C.gray900};`}
`;

const TicketsScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.gray300}; border-radius: 10px; }
`;

const TicketCard = styled.div`
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  margin-bottom: 2px;

  &:hover { background: ${C.gray50}; }

  ${p => p.$active && `background:${C.gray50}; border-color:${C.gray200}; box-shadow:0 1px 2px rgba(0,0,0,0.04);`}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const TicketId = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${C.gray400};
  font-family: 'Space Grotesk', sans-serif;
`;

const StatusDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${p => p.$color || C.gray300};
`;

const TypeBadge = styled.span`
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${p => p.$bg};
  color: ${p => p.$color};
`;

const CardTitle = styled.div`
  font-size: 13.5px;
  font-weight: 600;
  color: ${C.gray800};
  margin-bottom: 4px;
  line-height: 1.4;
`;

const CardPreview = styled.div`
  font-size: 12px;
  color: ${C.gray400};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
`;

const MiniAvatar = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${C.gray200};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: ${C.gray500};
  flex-shrink: 0;
`;

const Meta = styled.span`
  font-size: 11px;
  color: ${C.gray400};
  display: inline-flex;
  align-items: center;
  gap: 4px;

  ${p => p.$right && 'margin-left: auto;'}
`;
const DetailPane = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const DetailHeader = styled.div`
  padding: 16px 22px;
  border-bottom: 1px solid ${C.gray200};
  flex-shrink: 0;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
  flex-wrap: wrap;
`;

const DetailTitle = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 19px;
  font-weight: 700;
  color: ${C.gray900};
  margin-top: 2px;
`;

const DetailMeta = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: ${C.gray400};
  flex-wrap: wrap;

  span { display: inline-flex; align-items: center; gap: 5px; }
`;

const StatusSelect = styled.select`
  padding: 4px 8px;
  border: 1px solid ${C.gray200};
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  font-weight: 600;
  color: ${C.gray700};
  background: ${C.white};
  outline: none;
  cursor: pointer;

  &:focus { border-color: ${C.accent}; }
`;

const Thread = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px;

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.gray300}; border-radius: 10px; }
`;

const Msg = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
  animation: ${fadeInUp} 0.3s ease;
`;

const MsgAvatar = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${p => (p.$staff ? C.accentLight : C.gray200)};
  color: ${p => (p.$staff ? C.accentDark : C.gray600)};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
`;

const MsgBody = styled.div`flex: 1; min-width: 0;`;
const MsgHeader = styled.div`display: flex; align-items: center; gap: 8px; margin-bottom: 4px;`;
const MsgName = styled.span`font-size: 13px; font-weight: 600; color: ${C.gray800};`;

const StaffTag = styled.span`
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  background: ${C.accentLight};
  color: ${C.accentDark};
`;

const MsgTime = styled.span`font-size: 11px; color: ${C.gray400}; margin-left: auto; white-space: nowrap;`;

const MsgText = styled.div`
  font-size: 13.5px;
  color: ${C.gray700};
  line-height: 1.7;
  word-break: break-word;
  white-space: pre-wrap;
`;

const ReplyBox = styled.div`
  padding: 14px 22px 16px;
  border-top: 1px solid ${C.gray200};
  flex-shrink: 0;
  background: ${C.white};
`;

const ReplyArea = styled.div`
  border: 1px solid ${C.gray200};
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: ${C.accent};
    box-shadow: 0 0 0 3px rgba(13,148,136,0.08);
  }

  textarea {
    width: 100%;
    padding: 12px 14px;
    border: none;
    outline: none;
    font-size: 13.5px;
    font-family: inherit;
    resize: none;
    color: ${C.gray800};
    background: transparent;
    line-height: 1.6;
    min-height: 56px;
    max-height: 120px;
    &::placeholder { color: ${C.gray400}; }
  }
`;

const ReplyToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-top: 1px solid ${C.gray100};
  background: ${C.gray50};
`;

const ReplyHint = styled.span`font-size: 11px; color: ${C.gray400};`;
const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${C.gray400};
  padding: 40px;
  text-align: center;

  p { font-size: 14px; margin-top: 4px; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
`;

const Modal = styled.div`
  background: ${C.white};
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.08);
  width: 520px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${modalIn} 0.25s ease;
  font-family: 'DM Sans', sans-serif;
`;

const ModalHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${C.gray100};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: ${C.gray900};
`;

const ModalClose = styled.button`
  width: 30px; height: 30px;
  border-radius: 8px; border: none;
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: ${C.gray400}; transition: all 0.2s ease;

  &:hover { background: ${C.gray100}; color: ${C.gray600}; }
`;

const ModalBody = styled.div`padding: 20px 24px;`;
const FormGroup = styled.div`margin-bottom: 16px;`;

const FormLabel = styled.label`
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: ${C.gray700};
  margin-bottom: 6px;
`;

const inputStyle = `
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #e4e4e4;
  border-radius: 8px;
  font-size: 13.5px;
  font-family: inherit;
  color: #262626;
  background: #ffffff;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: #0d9488;
    box-shadow: 0 0 0 3px rgba(13,148,136,0.08);
  }
`;

const FormInput = styled.input`${inputStyle}`;
const FormSelect = styled.select`${inputStyle}`;

const FormTextarea = styled.textarea`
  ${inputStyle}
  resize: vertical;
  min-height: 110px;
  line-height: 1.6;
`;

const ModalFooter = styled.div`
  padding: 16px 24px 20px;
  border-top: 1px solid ${C.gray100};
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Toast = styled.div`
  padding: 12px 18px;
  background: ${C.gray900};
  color: ${C.white};
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  animation: ${toastIn} 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 360px;
`;

const Spinner = styled(RefreshCw)`
  animation: spin 1s linear infinite;
  @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
`;
const SupportPage = () => {
    const { slug } = useParams();
    const tenantSlug = slug || localStorage.getItem('tenantSlug') || localStorage.getItem('tenant_slug') || 'system_shared';
    const { socket, connected } = useSocket();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const [selectedId, setSelectedId] = useState(null);
    const [replies, setReplies] = useState([]);
    const [repliesLoading, setRepliesLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ subject: '', type: 'help', message: '' });
    const [submitting, setSubmitting] = useState(false);

    const [toasts, setToasts] = useState([]);
    const toastSeq = useRef(0);
    const selectedIdRef = useRef(null);
    const threadEndRef = useRef(null);

    selectedIdRef.current = selectedId;

    const pushToast = useCallback((message) => {
        const id = ++toastSeq.current;
        setToasts(prev => [...prev.slice(-3), { id, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    /* ---------- Data fetching ---------- */

    const fetchTickets = useCallback(async () => {
        try {
            const res = await api.get(`/support/tickets?tenant=${encodeURIComponent(tenantSlug)}`, {
                headers: { 'x-tenant-slug': tenantSlug },
            });
            if (res.data?.success && Array.isArray(res.data.tickets)) {
                setTickets(res.data.tickets);
            } else if (Array.isArray(res.data)) {
                setTickets(res.data);
            }
        } catch (err) {
            console.warn('[Support] Failed to fetch tickets:', err?.message);
        } finally {
            setLoading(false);
        }
    }, [tenantSlug]);

    const fetchReplies = useCallback(async (ticketId) => {
        if (!ticketId) return;
        try {
            const res = await api.get(`/support/tickets/${ticketId}/replies`, {
                headers: { 'x-tenant-slug': tenantSlug },
            });
            if (res.data?.success && Array.isArray(res.data.replies)) {
                // Only apply if this ticket is still the one open
                if (String(selectedIdRef.current) === String(ticketId)) {
                    setReplies(res.data.replies);
                }
            }
        } catch (err) {
            console.warn('[Support] Failed to fetch replies:', err?.message);
        }
    }, [tenantSlug]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    // Polling fallback keeps the view fresh even if the socket drops
    useEffect(() => {
        const i = setInterval(fetchTickets, 30000);
        return () => clearInterval(i);
    }, [fetchTickets]);
    /* ---------- Real-time updates via Socket.IO ---------- */

    useEffect(() => {
        if (!socket) return;

        const handleUpdated = (data = {}) => {
            fetchTickets();
            const tid = data.ticketId;
            if (!tid || String(tid) === String(selectedIdRef.current)) {
                if (selectedIdRef.current) fetchReplies(selectedIdRef.current);
            }
        };

        const handleResponse = (data = {}) => {
            // Toast only when support staff replied (not our own replies)
            if (data.userType === 'admin') {
                pushToast(data.message || 'New response from the support team');
                fetchTickets();
                if (!data.ticketId || String(data.ticketId) === String(selectedIdRef.current)) {
                    if (selectedIdRef.current) fetchReplies(selectedIdRef.current);
                }
            }
        };

        socket.on('ticket_updated', handleUpdated);
        socket.on('ticket_response', handleResponse);
        return () => {
            socket.off('ticket_updated', handleUpdated);
            socket.off('ticket_response', handleResponse);
        };
    }, [socket, fetchTickets, fetchReplies, pushToast]);

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
            await api.post(`/support/tickets/${selectedId}/reply`, {
                message: text,
                userType: 'tenant',
            }, { headers: { 'x-tenant-slug': tenantSlug } });
            setReplyText('');
            pushToast('Reply sent');
            await fetchReplies(selectedId);
            fetchTickets();
        } catch (err) {
            console.warn('[Support] Reply failed:', err?.message);
            pushToast('Failed to send reply. Please try again.');
        } finally {
            setSendingReply(false);
        }
    };

    const handleReplyKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendReply();
        }
    };

    const createTicket = async () => {
        const subject = form.subject.trim();
        const message = form.message.trim();
        if (!subject) { pushToast('Please enter a subject'); return; }
        if (!message) { pushToast('Please describe your issue'); return; }
        setSubmitting(true);
        try {
            const user = getCurrentUser();
            const tenantName = localStorage.getItem('tenantName')
                || (() => { try { return JSON.parse(localStorage.getItem('tenantData') || '{}').name; } catch { return null; } })()
                || 'Unknown Tenant';

            const res = await api.post('/support/tickets', {
                type: form.type,
                subject: subject.substring(0, 200),
                message,
                tenantName,
                userEmail: user.email || '',
                userName: user.full_name || user.name || '',
            }, { headers: { 'x-tenant-slug': tenantSlug } });

            setShowModal(false);
            setForm({ subject: '', type: 'help', message: '' });
            pushToast(`Ticket #${res.data?.ticketId ?? ''} created`);
            await fetchTickets();
            if (res.data?.ticketId) setSelectedId(res.data.ticketId);
        } catch (err) {
            console.warn('[Support] Create failed:', err?.message);
            pushToast(err?.response?.data?.message || 'Failed to submit ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const changeStatus = async (ticketId, status) => {
        try {
            await api.request({
                method: 'PATCH',
                url: `/support/tickets/${ticketId}`,
                data: { status },
                headers: { 'x-tenant-slug': tenantSlug },
            });
            pushToast(`Ticket #${ticketId} marked as ${STATUS_META[status]?.label || status}`);
            fetchTickets();
        } catch (err) {
            console.warn('[Support] Status update failed:', err?.message);
            pushToast('Failed to update status');
        }
    };
    /* ---------- Derived data ---------- */

    const user = getCurrentUser();
    const displayName = user.full_name || user.name || user.email || 'You';
    const initials = getInitials(user.full_name || user.name, user.email);

    const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

    const visibleTickets = tickets.filter(t => {
        if (filter !== 'all' && t.status !== filter) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            String(t.ticket_id).includes(q) ||
            (t.subject || '').toLowerCase().includes(q) ||
            (t.message || '').toLowerCase().includes(q) ||
            (t.user_name || '').toLowerCase().includes(q)
        );
    });

    const selectedTicket = tickets.find(t => String(t.ticket_id) === String(selectedId)) || null;

    const thread = [];
    if (selectedTicket) {
        thread.push({
            key: 'ticket-body',
            name: selectedTicket.user_name || selectedTicket.user_email || 'User',
            staff: false,
            text: selectedTicket.message,
            time: selectedTicket.created_at,
        });
        replies.forEach(r => {
            const isStaff = r.user_type === 'admin';
            thread.push({
                key: `reply-${r.reply_id}`,
                name: isStaff ? 'Support Team' : (selectedTicket.user_name || 'You'),
                staff: isStaff,
                text: r.message,
                time: r.created_at,
            });
        });
    }

    useEffect(() => {
        const el = threadEndRef.current;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [replies.length, selectedId]);

    /* ---------- Render ---------- */

    return (
        <div style={{ padding: '4px 2px' }}>
            <GlobalStyle />
            <Shell>
                <Sidebar>
                    <SidebarHeader>
                        <Logo>
                            <LogoIcon><Headphones size={15} /></LogoIcon>
                            SupportHub
                        </Logo>
                    </SidebarHeader>
                    <SidebarNav>
                        <NavLabel>Support</NavLabel>
                        <NavItem $active>
                            <MessageSquare size={14} /> Tickets
                            {openCount > 0 && <NavBadge>{openCount}</NavBadge>}
                        </NavItem>
                        <NavLabel style={{ marginTop: 8 }}>Actions</NavLabel>
                        <NavItem onClick={() => setShowModal(true)}>
                            <Plus size={14} /> New Ticket
                        </NavItem>
                        <NavItem onClick={fetchTickets}>
                            <RefreshCw size={14} /> Refresh
                        </NavItem>
                    </SidebarNav>
                    <SidebarFooter>
                        <Avatar $online={connected}>{initials}</Avatar>
                        <UserInfo>
                            <UserName>{displayName}</UserName>
                            <UserRole>Tenant Account</UserRole>
                        </UserInfo>
                    </SidebarFooter>
                </Sidebar>

                <Main>
                    <Topbar>
                        <TopbarTitleWrap>
                            <TopbarTitle>Tickets</TopbarTitle>
                            <TopbarSubtitle>
                                {visibleTickets.length} ticket{visibleTickets.length !== 1 ? 's' : ''}
                                {' '}· updates in real time
                            </TopbarSubtitle>
                        </TopbarTitleWrap>
                        <SearchBox>
                            <Search size={13} />
                            <input
                                placeholder="Search tickets..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </SearchBox>
                        <LivePill $on={connected}>
                            <LiveDot $on={connected} />
                            {connected ? 'LIVE' : 'OFFLINE'}
                        </LivePill>
                        <Btn $variant="accent" onClick={() => setShowModal(true)}>
                            <Plus size={13} /> New Ticket
                        </Btn>
                    </Topbar>
                    <Content>
                        {/* Tickets list */}
                        <ListPane>
                            <Filters>
                                {FILTERS.map(f => (
                                    <FilterChip
                                        key={f.id}
                                        $active={filter === f.id}
                                        onClick={() => setFilter(f.id)}
                                    >
                                        {f.label}
                                    </FilterChip>
                                ))}
                            </Filters>
                            <TicketsScroll>
                                {loading ? (
                                    <EmptyState><Spinner size={26} /><p>Loading tickets...</p></EmptyState>
                                ) : visibleTickets.length === 0 ? (
                                    <EmptyState>
                                        <LifeBuoy size={38} />
                                        <p>No tickets found</p>
                                        <p style={{ fontSize: 12 }}>Create a new ticket to get help from our team.</p>
                                    </EmptyState>
                                ) : visibleTickets.map(t => {
                                    const st = STATUS_META[t.status] || STATUS_META.open;
                                    const tp = TYPE_META[t.type] || TYPE_META.help;
                                    return (
                                        <TicketCard
                                            key={t.ticket_id}
                                            $active={String(selectedId) === String(t.ticket_id)}
                                            onClick={() => openTicket(t)}
                                        >
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
                                                <Meta $right><Clock size={10} /> {timeAgo(t.created_at)}</Meta>
                                            </CardFooter>
                                        </TicketCard>
                                    );
                                })}
                            </TicketsScroll>
                        </ListPane>

                        {/* Ticket detail */}
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
                                                $color={(TYPE_META[selectedTicket.type] || TYPE_META.help).color}
                                            >
                                                {(TYPE_META[selectedTicket.type] || TYPE_META.help).label}
                                            </TypeBadge>
                                            <StatusSelect
                                                style={{ marginLeft: 'auto' }}
                                                value={selectedTicket.status || 'open'}
                                                onChange={(e) => changeStatus(selectedTicket.ticket_id, e.target.value)}
                                            >
                                                <option value="open">Open</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </StatusSelect>
                                        </DetailRow>
                                        <DetailTitle>{selectedTicket.subject}</DetailTitle>
                                        <DetailMeta>
                                            <span><User size={11} /> {selectedTicket.user_name || selectedTicket.user_email || 'User'}</span>
                                            <span><Clock size={11} /> {timeAgo(selectedTicket.created_at)}</span>
                                            <span><MessageSquare size={11} /> {replies.length} repl{replies.length === 1 ? 'y' : 'ies'}</span>
                                            {connected && <span style={{ color: '#16a34a' }}><Wifi size={11} /> Live</span>}
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
                                                                {m.staff && <StaffTag>STAFF</StaffTag>}
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
                                                placeholder="Write a reply... (Enter to send, Shift+Enter for a new line)"
                                                rows={2}
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                onKeyDown={handleReplyKey}
                                            />
                                            <ReplyToolbar>
                                                <ReplyHint>Replies reach the support team instantly</ReplyHint>
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
                </Main>
            </Shell>

            {/* New Ticket Modal */}
            {showModal && (
                <ModalOverlay onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <Modal>
                        <ModalHeader>
                            <ModalTitle>Create New Ticket</ModalTitle>
                            <ModalClose onClick={() => setShowModal(false)}><X size={15} /></ModalClose>
                        </ModalHeader>
                        <ModalBody>
                            <FormGroup>
                                <FormLabel>Subject</FormLabel>
                                <FormInput
                                    placeholder="Brief description of the issue"
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                />
                            </FormGroup>
                            <FormGroup>
                                <FormLabel>Type</FormLabel>
                                <FormSelect value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                    <option value="help">Question</option>
                                    <option value="bug">Bug Report</option>
                                    <option value="feature">Suggestion</option>
                                    <option value="other">General</option>
                                </FormSelect>
                            </FormGroup>
                            <FormGroup>
                                <FormLabel>Description</FormLabel>
                                <FormTextarea
                                    placeholder="Detailed description of your question or issue..."
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                />
                            </FormGroup>
                        </ModalBody>
                        <ModalFooter>
                            <Btn $variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
                            <Btn $variant="accent" onClick={createTicket} disabled={submitting}>
                                {submitting ? 'Creating...' : (<> Create Ticket <CheckCircle2 size={13} /></>)}
                            </Btn>
                        </ModalFooter>
                    </Modal>
                </ModalOverlay>
            )}

            {/* Toasts */}
            <ToastContainer>
                {toasts.map(t => (
                    <Toast key={t.id}><CheckCircle2 size={14} /> {t.message}</Toast>
                ))}
            </ToastContainer>
        </div>
    );
};

export default SupportPage;











