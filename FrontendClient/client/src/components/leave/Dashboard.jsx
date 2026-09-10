import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { api, ENDPOINTS } from '../../api';
import { getUserId, getTenantSlug, getParentTenantSlug } from '../../utils/globalAuth';
import {
  Calendar, Clock, Users, FileText, CheckCircle, XCircle, AlertCircle,
  Loader2, RefreshCw, UserCheck, Check, Trash2, Plus, X, ChevronRight,
} from '../../utils/icons/icons';

/* ── Palette mirrors the other Leave pages ────────────────────────── */
const COLORS = {
  primaryLight: '#1A3A7A',
  textSecondary: '#6B7280',
  primary: '#0A2463',
  white: '#FFFFFF',
  bg: '#F5F7FA',
  border: '#E8ECF0',
  text: '#1A1D24',

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#E74C3C',
  info: '#3B82F6',
};

const STATUS_COLOR = {
  pending: { bg: 'rgba(245, 158, 11, 0.12)', fg: '#B45309', badge: COLORS.warning },
  approved: { bg: 'rgba(16, 185, 129, 0.12)', fg: '#047857', badge: COLORS.success },
  rejected: { bg: 'rgba(231, 76, 60, 0.12)', fg: '#B91C1C', badge: COLORS.danger },
  cancelled: { bg: '#E5E7EB', fg: COLORS.textSecondary, badge: COLORS.textSecondary },
};

const LEAVE_TYPE_LABELS = {
  annual: 'Annual',
  sick: 'Sick',
  maternity: 'Maternity',
  paternity: 'Paternity',
  compassionate: 'Compassionate',
  study: 'Study',
  unpaid: 'Unpaid',
};

const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const statusColorFor = (s) =>
  STATUS_COLOR[String(s || '').toLowerCase()] || STATUS_COLOR.cancelled;

const fmtDate = (s) =>
  !s
    ? '—'
    : new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const normList = (res) => {
  if (!res || !res.data) return [];
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data.data)) return res.data.data;
  return [];
};
const normObj = (res) => {
  if (!res || !res.data) return null;
  if (res.data.data && typeof res.data.data === 'object' && !Array.isArray(res.data.data)) {
    return res.data.data;
  }
  return res.data;
};
const safeNum = (v) => Number(v) || 0;

/* ── Styled components ────────────────────────────────────────────── */
const Page = styled.div`
  padding: 1.5rem;
  max-width: 1240px;
  margin: 0 auto;
  background: ${COLORS.white};
`;

const PageHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.7rem;
  font-weight: 700;
  color: ${COLORS.text};
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ActionBtn = styled.button`
  background: ${COLORS.primary};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.52rem 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GhostBtn = styled.button`
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 0.42rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  &:hover { background: ${COLORS.bg}; }
`;

const RefreshText = styled.span`
  font-size: 0.78rem;
  color: ${COLORS.textSecondary};
`;

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin: 1.25rem 0;
`;

const StatCard = styled.div`
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 14px;
  padding: 1.1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const StatHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const StatIcon = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: ${(p) => p.$bg || COLORS.primary};
  color: ${(p) => p.$fg || COLORS.white};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StatValue = styled.div`
  font-size: 1.55rem;
  font-weight: 800;
  color: ${COLORS.text};
  margin-top: 0.3rem;
`;

const StatLabel = styled.div`
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  color: ${COLORS.textSecondary};
`;

const Section = styled.div`
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
  overflow: hidden;
`;

const SectionHead = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${COLORS.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const SectionHeadLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: ${COLORS.text};
`;

const SectionBody = styled.div`
  padding: 1.25rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1.5rem;
  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const BarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;
const BarRow = styled.div`
  display: grid;
  grid-template-columns: 110px 1fr 55px;
  align-items: center;
  gap: 0.6rem;
`;
const BarLabel = styled.span`
  font-size: 0.8rem;
  color: ${COLORS.text};
  font-weight: 600;
`;
const BarTrack = styled.div`
  background: ${COLORS.bg};
  border-radius: 8px;
  height: 12px;
  overflow: hidden;
`;
const BarFill = styled.div`
  height: 100%;
  border-radius: 8px;
  background: ${(p) => p.$color || COLORS.primary};
  width: ${(p) => `${p.$w}%`};
`;
const BarValue = styled.span`
  font-weight: 700;
  color: ${COLORS.text};
  justify-self: end;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid ${COLORS.border};
  &:last-child { border-bottom: 0; }
`;
const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${COLORS.primary};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
`;

const Center = styled.div`
  padding: 2.2rem 1rem;
  text-align: center;
  color: ${COLORS.textSecondary};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
`;
const ErrorBox = styled.div`
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid ${COLORS.danger};
  border-radius: 10px;
  padding: 0.85rem 1rem;
  color: ${COLORS.danger};
  font-size: 0.85rem;
`;

/* Requests table */
const TableWrap = styled.div`
  overflow-x: auto;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
  th, td { padding: 0.7rem 0.9rem; text-align: left; }
  th {
    background: ${COLORS.bg};
    color: ${COLORS.textSecondary};
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    border-bottom: 2px solid ${COLORS.border};
  }
  td { border-bottom: 1px solid ${COLORS.border}; }
  tr:last-child td { border-bottom: 0; }
`;
const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  color: ${(p) => statusColorFor(p.$status).fg};
  background: ${(p) => statusColorFor(p.$status).bg};
`;
const ActionCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  justify-content: flex-end;
`;
const SmallBtn = styled.button`
  border: none;
  background: none;
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  &:hover { opacity: 0.85; }
  &.approve { color: ${COLORS.success}; }
  &.reject { color: ${COLORS.danger}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
const Pill = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  background: ${COLORS.bg};
  color: ${COLORS.textSecondary};
`;

const BalanceBig = styled.div`text-align: center; margin: 0.5rem 0;`;
const BalanceNum = styled.div`font-size: 2rem; font-weight: 800; color: ${COLORS.primary};`;
const BalanceLbl = styled.div`font-size: 0.78rem; color: ${COLORS.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em;`;
const ProgressBar = styled.div`height: 9px; background: ${COLORS.bg}; border-radius: 999px; overflow: hidden; display: flex; margin: 0.8rem 0;`;
const ProgressUsed = styled.div`background: ${COLORS.primary}; width: ${(p) => `${p.$w}%`}; height: 100%;`;
const ProgressPending = styled.div`background: ${COLORS.warning}; width: ${(p) => `${p.$p}%`}; height: 100%;`;
const BalanceRow = styled.div`display: flex; justify-content: space-between; font-size: 0.82rem; color: ${COLORS.textSecondary}; margin-top: 0.4rem;`;
const Note = styled.div`font-size: 0.78rem; color: ${COLORS.textSecondary}; margin-top: 0.6rem;`;

/* ── Recent history rows + employee leave panel ────────────────────── */
const ClickRow = styled.tr`
  cursor: pointer;
  &:hover td { background: rgba(10, 36, 99, 0.04); }
`;
const ViewCell = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid ${COLORS.border};
  color: ${COLORS.primary};
  background: ${COLORS.white};
`;
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
`;
const Drawer = styled.div`
  width: min(480px, 100%);
  height: 100%;
  background: ${COLORS.white};
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
const DrawerHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid ${COLORS.border};
  background: ${COLORS.bg};
`;
const DrawerTitle = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
  color: ${COLORS.text};
`;
const DrawerSub = styled.div`
  font-size: 0.78rem;
  color: ${COLORS.textSecondary};
`;
const CloseBtn = styled.button`
  background: ${COLORS.white};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${COLORS.textSecondary};
  flex-shrink: 0;
  &:hover { color: ${COLORS.danger}; border-color: ${COLORS.danger}; }
`;
const DrawerBody = styled.div`
  padding: 1.1rem 1.25rem 2rem 1.25rem;
  overflow-y: auto;
  flex: 1;
`;
const MiniGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  margin-bottom: 0.4rem;
`;
const MiniStat = styled.div`
  border: 1px solid ${COLORS.border};
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  background: ${(p) => (p.$hl ? 'rgba(10, 36, 99, 0.06)' : COLORS.white)};
`;
const MSLabel = styled.div`
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: ${COLORS.textSecondary};
`;
const MSValue = styled.div`
  font-size: 1.15rem;
  font-weight: 800;
  color: ${(p) => (p.$hl ? COLORS.primary : COLORS.text)};
`;
const PanelSubHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${COLORS.text};
  margin: 1.2rem 0 0.6rem 0;
`;
const AddForm = styled.div`
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 0.5rem;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;
const AddInput = styled.input`
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
  font-size: 0.82rem;
  color: ${COLORS.text};
  min-width: 0;
  &:focus { outline: none; border-color: ${COLORS.primary}; }
`;
const AddBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: ${COLORS.success};
  border: none;
  color: #fff;
  border-radius: 8px;
  padding: 0.5rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
const AdjRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid ${COLORS.border};
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  margin-bottom: 0.45rem;
  background: ${COLORS.white};
`;
const HistItem = styled.div`
  border: 1px solid ${COLORS.border};
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.45rem;
  background: ${COLORS.white};
`;
const HistLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

/* ── Main component (HR Dashboard) ──────────────────────────────────── */
const LeaveDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, on_leave: 0, by_status: [], by_type: [] });
  const [requests, setRequests] = useState([]);   // all PENDING requests needing HR action
  const [onLeaveUsers, setOnLeaveUsers] = useState([]);
  const [balance, setBalance] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [actingId, setActingId] = useState(null); // row id currently being actioned
  const [recent, setRecent] = useState([]);       // latest requests across the tenant (every status)
  // ── Employee leave panel (click a user to open their leave dashboard) ──
  const [selectedUser, setSelectedUser] = useState(null);   // employee currently open in the panel
  const [userDetail, setUserDetail] = useState(null);       // { balance, leaves, additions }
  const [detailLoading, setDetailLoading] = useState(false);
  const [addDaysForm, setAddDaysForm] = useState({ days: '', reason: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [detailActionId, setDetailActionId] = useState(null);

  // ── Multi-tenant: leave data lives in the PARENT tenant's main DB ──
  // Send the parent slug explicitly (same pattern as ApplyLeave/MyLeaves) so
  // that branch users see the right company-wide leave records.
  const me = getUserId();
  const parentSlug = getParentTenantSlug() || getTenantSlug();
  const tenantHeaders = useMemo(() => {
    const h = { 'x-tenant-slug': parentSlug };
    if (me) h['x-user-id'] = me.toString();
    return { headers: h };
  }, [parentSlug, me]);

  const load = useCallback(async (abortSignal) => {
    setError('');

    // 1) Aggregate stats
    const statsRes = await api.get(ENDPOINTS.LEAVE.STATS, { ...tenantHeaders, signal: abortSignal });
    setStats(statsRes.data?.data || { total: 0, pending: 0, on_leave: 0, by_status: [], by_type: [] });

    // 2) FULL leave history (every status — feeds BOTH "Recent history" and the
    //    pending approval queue) + on-leave staff (parallel, tolerant of failure)
    const [allRes, onLeaveRes] = await Promise.all([
      api.get(ENDPOINTS.LEAVE.ALL, { ...tenantHeaders, signal: abortSignal }),
      api.get(ENDPOINTS.LEAVE.USERS_ON_LEAVE, { ...tenantHeaders, signal: abortSignal }),
    ]);
    const allLeaves = normList(allRes);
    setRecent(allLeaves.slice(0, 12));
    setRequests(allLeaves.filter((l) => String(l.status || '').toLowerCase() === 'pending'));
    setOnLeaveUsers(normList(onLeaveRes));

    if (me) {
      try {
        const balRes = await api.get(ENDPOINTS.LEAVE.BALANCE(me), { ...tenantHeaders, signal: abortSignal });
        setBalance(normObj(balRes));
      } catch (e) {
        setBalance(null);
      }
    }

    // 3) All registered employees + their leave balances (tolerant of failure)
    try {
      const empRes = await api.get(ENDPOINTS.LEAVE.BALANCES, { ...tenantHeaders, signal: abortSignal });
      const emps = empRes?.data?.data || empRes?.data || [];
      setEmployees(Array.isArray(emps) ? emps : []);
    } catch (e) {
      setEmployees([]);
    }
    setLoading(false);
  }, [tenantHeaders, me]);

  useEffect(() => {
    const ctrl = new AbortController();
    let ignore = false;
    (async () => {
      try {
        await load(ctrl.signal);
      } catch (e) {
        if (!ignore) setError(e?.friendlyMessage || 'Failed to load HR leave dashboard. Please try again.');
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; ctrl.abort(); };
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const ctrl = new AbortController();
      await load(ctrl.signal);
    } catch (e) {
      setError(e?.friendlyMessage || 'Failed to refresh data.');
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  // Approve / Reject a leave request (HR action) — optimistic + re-fetch after.
  const actionOn = useCallback(async (id, newStatus, notes) => {
    setActingId(id);
    const prev = requests.slice();
    setRequests((prev2) => prev2.map((r) =>
      (r.id === id ? { ...r, status: newStatus, rejection_reason: notes || r.rejection_reason } : r)
    ));
    try {
      // The status update is the authoritative operation. If it succeeds, the
      // row IS approved/rejected even if the follow-up refresh below fails, so
      // we must not roll the optimistic update back in that case.
      await api.patch(ENDPOINTS.LEAVE.UPDATE_STATUS(id), { status: newStatus, rejection_reason: notes, approved_by: me }, tenantHeaders);
    } catch (e) {
      setRequests(prev);
      setError(e?.friendlyMessage || 'Could not update that request. It may have already been processed.');
      setActingId(null);
      return;
    }
    // Refresh is best-effort: a failure here must not undo a successful action.
    try {
      await refresh();
    } catch (e) {
      setError(e?.friendlyMessage || 'Request updated, but the dashboard could not be refreshed.');
    } finally {
      setActingId(null);
    }
  }, [requests, refresh, tenantHeaders]);

  const approve = (id) => actionOn(id, 'approved', null);
  const reject = (id) => {
    const notes = window.prompt('Rejection reason (optional):') ?? '';
    if (notes === null) return;
    actionOn(id, 'rejected', notes.trim() || 'Not specified');
  };

  // ── Employee leave panel: load one employee's balance + history + adjustments ──
  const loadUserDetail = useCallback(async (user) => {
    if (!user?.user_id) return;
    setDetailLoading(true);
    const [balRes, leavesRes, addRes] = await Promise.all([
      api.get(ENDPOINTS.LEAVE.BALANCE(user.user_id), tenantHeaders).catch(() => null),
      api.get(ENDPOINTS.LEAVE.ALL, { ...tenantHeaders, params: { user_id: user.user_id } }).catch(() => null),
      api.get(ENDPOINTS.LEAVE.ADDITIONS(user.user_id), tenantHeaders).catch(() => null),
    ]);
    setUserDetail({
      balance: normObj(balRes),
      leaves: normList(leavesRes),
      additions: normList(addRes),
    });
    setDetailLoading(false);
  }, [tenantHeaders]);

  const openUser = useCallback((emp) => {
    setSelectedUser(emp);
    setUserDetail(null);
    setAddDaysForm({ days: '', reason: '' });
    loadUserDetail(emp);
  }, [loadUserDetail]);

  const closeUser = () => {
    setSelectedUser(null);
    setUserDetail(null);
  };

  // HR adds extra annual leave days for this employee (carry-over, bonus days…)
  const submitAddDays = async () => {
    if (!selectedUser) return;
    const n = Number(addDaysForm.days);
    if (!n || n < 1) {
      setError('Enter at least 1 day to add.');
      return;
    }
    if (!String(addDaysForm.reason).trim()) {
      setError('A reason is required when adding leave days.');
      return;
    }
    setAddSaving(true);
    try {
      await api.post(
        ENDPOINTS.LEAVE.ADD_DAYS,
        {
          user_id: selectedUser.user_id,
          days: n,
          reason: String(addDaysForm.reason).trim(),
          added_by: me || undefined,
        },
        tenantHeaders
      );
      setAddDaysForm({ days: '', reason: '' });
      setError('');
      await Promise.all([loadUserDetail(selectedUser), refresh()]);
    } catch (e) {
      setError(e?.friendlyMessage || 'Could not add leave days. Please try again.');
    } finally {
      setAddSaving(false);
    }
  };

  // Undo a manual day adjustment (deletes the addition record, balance recalculates)
  const removeAddition = async (id) => {
    setRemovingId(id);
    try {
      await api.delete(ENDPOINTS.LEAVE.REMOVE_DAYS(id), tenantHeaders);
      setError('');
      if (selectedUser) await Promise.all([loadUserDetail(selectedUser), refresh()]);
    } catch (e) {
      setError(e?.friendlyMessage || 'Could not remove that adjustment.');
    } finally {
      setRemovingId(null);
    }
  };

  // Approve / reject from inside the employee panel (same endpoint as the queue)
  const decideInPanel = async (id, newStatus, notes) => {
    setDetailActionId(id);
    try {
      await api.patch(
        ENDPOINTS.LEAVE.UPDATE_STATUS(id),
        { status: newStatus, rejection_reason: notes, approved_by: me },
        tenantHeaders
      );
    } catch (e) {
      setError(e?.friendlyMessage || 'Could not update that request.');
      setDetailActionId(null);
      return;
    }
    try {
      await refresh();
      if (selectedUser) await loadUserDetail(selectedUser);
    } finally {
      setDetailActionId(null);
    }
  };

  const rejectInPanel = (id) => {
    const notes = window.prompt('Rejection reason (optional):');
    if (notes === null) return;
    decideInPanel(id, 'rejected', notes.trim() || 'Not specified');
  };

  // Derived
  const byStatus = Array.isArray(stats.by_status) ? stats.by_status : [];
  const statusCounts = {};
  byStatus.forEach((r) => { statusCounts[String(r.status).toLowerCase()] = safeNum(r.count); });
  const statusTotals = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const total = safeNum(stats.total) || statusTotals;
  const pending = safeNum(stats.pending) || statusCounts.pending || 0;
  const approved = statusCounts.approved || 0;
  const rejected = statusCounts.rejected || 0;
  const onLeaveToday = safeNum(stats.on_leave) || 0;

  const byType = Array.isArray(stats.by_type) ? stats.by_type : [];
  const maxType = byType.reduce((m, t) => (safeNum(t.count) > m ? safeNum(t.count) : m), 0);

  const entitlement = balance ? safeNum(balance.initial) : 0;
  const taken = balance ? safeNum(balance.leaveTaken) : 0;
  const pendingBal = balance ? safeNum(balance.pendingDays) : 0;
  const available = balance ? safeNum(balance.currentBalance) : 0;
  const usedPct = entitlement ? Math.min(100, (taken / entitlement) * 100) : 0;
  const pendingPct = entitlement ? Math.min(100, (pendingBal / entitlement) * 100) : 0;

  const statCards = [
    { label: 'Total Leaves', value: total, icon: FileText, bg: COLORS.primary, fg: COLORS.white },
    { label: 'Pending Review', value: pending, icon: Clock, bg: COLORS.warning, fg: '#78350f' },
    { label: 'On Leave Today', value: onLeaveToday, icon: UserCheck, bg: COLORS.info, fg: COLORS.white },
    { label: 'Approved', value: approved, icon: CheckCircle, bg: COLORS.success, fg: '#065f46' },
    { label: 'Rejected', value: rejected, icon: XCircle, bg: COLORS.danger, fg: COLORS.white },
  ];

  const pendingQueue = Array.isArray(requests) ? requests : [];

  return (
    <Page>
      <PageHeader>
        <div>
          <Title>HR Leaves Dashboard</Title>
          <Subtitle>Tenant-wide overview, pending approvals, and who is out today.</Subtitle>
        </div>
        <Toolbar>
          <ActionBtn onClick={refresh} disabled={refreshing}>
            {refreshing ? <Loader2 size={16} /> : <RefreshCw size={16} />}
            Refresh
          </ActionBtn>
          <RefreshText>Per-tenant • live</RefreshText>
        </Toolbar>
      </PageHeader>

      {error && <ErrorBox>{error}</ErrorBox>}

      {loading ? (
        <Center>
          <Loader2 size={28} />
          <span>Loading HR leave dashboard…</span>
        </Center>
      ) : (
        <>
          <TopGrid>
            {statCards.map((c) => (
              <StatCard key={c.label}>
                <StatHead>
                  <StatIcon $bg={c.bg} $fg={c.fg}>{c.icon && <c.icon size={18} />}</StatIcon>
                  <StatValue>{c.value}</StatValue>
                </StatHead>
                <StatLabel>{c.label}</StatLabel>
              </StatCard>
            ))}
          </TopGrid>

          <ContentGrid>
            {/* Left: by type + pending approvals table */}
            <div>
              <Section>
                <SectionHead>
                  <SectionHeadLeft><Calendar size={18} />Leaves by type</SectionHeadLeft>
                </SectionHead>
                <SectionBody>
                  {byType.length === 0 ? (
                    <Center style={{ padding: '1.6rem 1rem' }}>No leave types recorded yet.</Center>
                  ) : (
                    <BarList>
                      {byType.map((t) => {
                        const w = maxType ? (safeNum(t.count) / maxType) * 100 : 0;
                        return (
                          <BarRow key={t.leave_type || 'row'}>
                            <BarLabel>{LEAVE_TYPE_LABELS[t.leave_type] || t.leave_type || '—'}</BarLabel>
                            <BarTrack><BarFill $color={COLORS.primary} $w={w} /></BarTrack>
                            <BarValue>{safeNum(t.count)}</BarValue>
                          </BarRow>
                        );
                      })}
                    </BarList>
                  )}
                </SectionBody>
              </Section>

              <Section>
                <SectionHead>
                  <SectionHeadLeft><Clock size={18} />Pending approvals ({pendingQueue.length})</SectionHeadLeft>
                </SectionHead>
                <SectionBody style={{ padding: 0 }}>
                  {pendingQueue.length === 0 ? (
                    <Center style={{ padding: '1.6rem 1rem' }}>No pending leave requests for your tenant.</Center>
                  ) : (
                    <TableWrap>
                      <Table>
                        <thead>
                          <tr>
                            <th>Requester</th>
                            <th>Type</th>
                            <th>Dates</th>
                            <th>Days</th>
                            <th>Reason</th>
                            <th style={{ width: 120 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingQueue.map((l) => (
                            <tr key={l.id}>
                              <td>
                                <Row style={{ padding: 0, borderBottom: 0 }}><Avatar>{l.name ? String(l.name)[0] : '?'}</Avatar>{l.name || l.email || 'User'}</Row>
                              </td>
                              <td>{LEAVE_TYPE_LABELS[l.leave_type] || l.leave_type || '—'}</td>
                              <td>{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</td>
                              <td>{safeNum(l.days)}</td>
                              <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.reason || ''}>{l.reason || <Pill>No reason</Pill>}</td>
                              <td>
                                <ActionCell>
                                  <SmallBtn className="approve" onClick={() => approve(l.id)} disabled={actingId === l.id}>
                                    {actingId === l.id ? <Loader2 size={12} /> : <Check size={14} />} Approve
                                  </SmallBtn>
                                  <SmallBtn className="reject" onClick={() => reject(l.id)} disabled={actingId === l.id}>
                                    {actingId === l.id ? <Loader2 size={12} /> : <XCircle size={14} />} Reject
                                  </SmallBtn>
                                </ActionCell>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </TableWrap>
                  )}
                </SectionBody>
              </Section>
            </div>

            {/* Right: my balance + who is out today */}
            <div>
              <Section>
                <SectionHead>
                  <SectionHeadLeft><UserCheck size={18} />My leave balance</SectionHeadLeft>
                </SectionHead>
                <SectionBody>
                  {balance ? (
                    <>
                      <BalanceBig>
                        <BalanceNum>{available}</BalanceNum>
                        <BalanceLbl>days available</BalanceLbl>
                      </BalanceBig>
                      <ProgressBar>
                        <ProgressUsed $w={usedPct} />
                        <ProgressPending $p={pendingPct} />
                      </ProgressBar>
                      <BalanceRow>
                        <span>Entitlement: {entitlement}</span>
                        <span>Used: {taken}</span>
                      </BalanceRow>
                      <BalanceRow>
                        <span>Pending: {pendingBal}</span>
                        <span>Holiday credit: {balance.holidayCompensations || 0}</span>
                      </BalanceRow>
                    </>
                  ) : (
                    <Note>Sign in to load your personal leave balance.</Note>
                  )}
                </SectionBody>
              </Section>

              <Section>
                <SectionHead>
                  <SectionHeadLeft><Users size={18} />Out today ({onLeaveUsers.length})</SectionHeadLeft>
                </SectionHead>
                <SectionBody style={{ padding: 0 }}>
                  {onLeaveUsers.length === 0 ? (
                    <Center style={{ padding: '1.4rem 1rem' }}>Nobody is on leave today.</Center>
                  ) : (
                    onLeaveUsers.map((u) => (
                      <Row key={u.id || u.user_id || u.email}>
                        <Avatar>{u.full_name ? String(u.full_name)[0] : '?'}</Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: COLORS.text }}>{u.full_name || u.email || 'User'}</div>
                          <div style={{ fontSize: 0.8, color: COLORS.textSecondary }}>
                            {LEAVE_TYPE_LABELS[u.leave_type] || u.leave_type || 'Leave'} • {fmtDate(u.start_date)} → {fmtDate(u.end_date)}
                          </div>
                        </div>
                        <StatusPill $status="approved">Approved</StatusPill>
                      </Row>
                    ))
                  )}
                </SectionBody>
              </Section>
            </div>
          </ContentGrid>

          {/* Recent history — newest requests across the company, every status */}
          <Section>
            <SectionHead>
              <SectionHeadLeft><Clock size={18} />Recent history</SectionHeadLeft>
              <Pill>Latest {recent.length} requests — approve or reject pending ones right here</Pill>
            </SectionHead>
            <SectionBody style={{ padding: 0 }}>
              {recent.length === 0 ? (
                <Center style={{ padding: '1.6rem 1rem' }}>No leave requests submitted yet.</Center>
              ) : (
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Days</th>
                        <th>Reason</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th style={{ width: 160 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((l) => {
                        const st = String(l.status || '').toLowerCase();
                        return (
                          <tr key={l.id}>
                            <td>
                              <Row style={{ padding: 0, borderBottom: 0 }}>
                                <Avatar>{l.name ? String(l.name)[0] : '?'}</Avatar>
                                <div>
                                  <div style={{ fontWeight: 600, color: COLORS.text }}>{l.name || '—'}</div>
                                  <div style={{ fontSize: 0.72, color: COLORS.textSecondary }}>{l.email || ''}</div>
                                </div>
                              </Row>
                            </td>
                            <td>{LEAVE_TYPE_LABELS[l.leave_type] || l.leave_type || '—'}</td>
                            <td>{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</td>
                            <td>{safeNum(l.days)}</td>
                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.reason || ''}>
                              {l.reason || <Pill>No reason</Pill>}
                            </td>
                            <td>{fmtDate(l.created_at)}</td>
                            <td><StatusPill $status={st}>{STATUS_LABEL[st] || st}</StatusPill></td>
                            <td>
                              {st === 'pending' ? (
                                <ActionCell>
                                  <SmallBtn className="approve" onClick={() => approve(l.id)} disabled={actingId === l.id}>
                                    {actingId === l.id ? <Loader2 size={12} /> : <Check size={14} />} Approve
                                  </SmallBtn>
                                  <SmallBtn className="reject" onClick={() => reject(l.id)} disabled={actingId === l.id}>
                                    {actingId === l.id ? <Loader2 size={12} /> : <XCircle size={14} />} Reject
                                  </SmallBtn>
                                </ActionCell>
                              ) : (
                                <GhostBtn onClick={() => openUser({ user_id: l.user_id, name: l.name, email: l.email })}>
                                  View <ChevronRight size={13} />
                                </GhostBtn>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </SectionBody>
          </Section>

          {/* All registered employees + their leave balances */}
          <Section style={{ marginTop: '1.5rem' }}>
            <SectionHead>
              <SectionHeadLeft><Users size={18} />All employees ({employees.length})</SectionHeadLeft>
              <Pill>Click an employee to open their leave dashboard &amp; add days</Pill>
            </SectionHead>
            <SectionBody style={{ padding: 0 }}>
              {employees.length === 0 ? (
                <Center style={{ padding: '1.6rem 1rem' }}>
                  No employees found yet. Employees registered in the system appear here with their leave balances.
                </Center>
              ) : (
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Email</th>
                        <th>Entitlement</th>
                        <th>Taken</th>
                        <th>Pending</th>
                        <th>Available</th>
                        <th style={{ width: 60 }} aria-label="Open" />
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((e) => (
                        <ClickRow
                          key={e.user_id || e.id || e.email || `emp-${e.name}`}
                          onClick={() => openUser(e)}
                          title="Open this employee's leave dashboard"
                        >
                          <td style={{ fontWeight: 600, color: COLORS.text }}>{e.name || e.full_name || '—'}</td>
                          <td>{e.email || '—'}</td>
                          <td>{safeNum(e.initial)} days</td>
                          <td>{safeNum(e.leaveTaken)} days</td>
                          <td>{safeNum(e.pendingDays)} days</td>
                          <td style={{ fontWeight: 700, color: COLORS.primary }}>{safeNum(e.currentBalance)} days</td>
                          <td><ViewCell><ChevronRight size={14} /></ViewCell></td>
                        </ClickRow>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </SectionBody>
          </Section>
        </>
      )}

      {/* ── Employee leave panel (slide-in): balance, history, add days ── */}
      {selectedUser && (
        <Overlay onClick={closeUser}>
          <Drawer onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Employee leave dashboard">
            <DrawerHead>
              <Avatar style={{ width: 42, height: 42, fontSize: '1rem' }}>
                {(selectedUser.name || selectedUser.full_name || '?').charAt(0)}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <DrawerTitle>{selectedUser.name || selectedUser.full_name || 'Employee'}</DrawerTitle>
                <DrawerSub>{selectedUser.email || '—'}</DrawerSub>
              </div>
              <CloseBtn onClick={closeUser} aria-label="Close panel"><X size={16} /></CloseBtn>
            </DrawerHead>

            <DrawerBody>
              {detailLoading || !userDetail ? (
                <Center style={{ padding: '2.2rem 0' }}>
                  <Loader2 size={22} />
                  <span>Loading leave dashboard…</span>
                </Center>
              ) : (
                <>
                  {/* Balance snapshot */}
                  <MiniGrid>
                    <MiniStat><MSLabel>Entitlement</MSLabel><MSValue>{safeNum(userDetail.balance?.initial)}</MSValue></MiniStat>
                    <MiniStat><MSLabel>Manual adds</MSLabel><MSValue>{safeNum(userDetail.balance?.manualAdditions)}</MSValue></MiniStat>
                    <MiniStat><MSLabel>Holiday credit</MSLabel><MSValue>{safeNum(userDetail.balance?.holidayCompensations)}</MSValue></MiniStat>
                    <MiniStat><MSLabel>Taken</MSLabel><MSValue>{safeNum(userDetail.balance?.leaveTaken)}</MSValue></MiniStat>
                    <MiniStat><MSLabel>Pending</MSLabel><MSValue>{safeNum(userDetail.balance?.pendingDays)}</MSValue></MiniStat>
                    <MiniStat $hl><MSLabel>Available</MSLabel><MSValue>{safeNum(userDetail.balance?.currentBalance)}</MSValue></MiniStat>
                  </MiniGrid>

                  {/* Add leave days */}
                  <PanelSubHead><Plus size={15} /> Add leave days</PanelSubHead>
                  <AddForm>
                    <AddInput
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Days"
                      value={addDaysForm.days}
                      onChange={(e) => setAddDaysForm((f) => ({ ...f, days: e.target.value }))}
                    />
                    <AddInput
                      type="text"
                      placeholder="Reason (e.g. 2025 carry-over)"
                      value={addDaysForm.reason}
                      onChange={(e) => setAddDaysForm((f) => ({ ...f, reason: e.target.value }))}
                    />
                    <AddBtn onClick={submitAddDays} disabled={addSaving}>
                      {addSaving ? <Loader2 size={14} /> : <Plus size={14} />} Add days
                    </AddBtn>
                  </AddForm>

                  {/* Manual day adjustments (undoable) */}
                  <PanelSubHead><Clock size={15} /> Day adjustments ({userDetail.additions.length})</PanelSubHead>
                  {userDetail.additions.length === 0 ? (
                    <Note>No manual day adjustments for this employee yet.</Note>
                  ) : (
                    userDetail.additions.map((a) => (
                      <AdjRow key={a.id}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: COLORS.success }}>+{safeNum(a.days)} days</div>
                          <div style={{ fontSize: 0.75, color: COLORS.textSecondary }}>
                            {fmtDate(a.created_at)} &middot; {a.reason || 'No reason recorded'}
                          </div>
                        </div>
                        <SmallBtn className="reject" onClick={() => removeAddition(a.id)} disabled={removingId === a.id}>
                          {removingId === a.id ? <Loader2 size={12} /> : <Trash2 size={13} />} Undo
                        </SmallBtn>
                      </AdjRow>
                    ))
                  )}

                  {/* Their full leave history */}
                  <PanelSubHead><FileText size={15} /> Leave history ({userDetail.leaves.length})</PanelSubHead>
                  {userDetail.leaves.length === 0 ? (
                    <Note>This employee has not applied for leave yet.</Note>
                  ) : (
                    userDetail.leaves.map((l) => {
                      const st = String(l.status || '').toLowerCase();
                      return (
                        <HistItem key={l.id}>
                          <HistLine>
                            <span style={{ fontWeight: 700, color: COLORS.text }}>
                              {LEAVE_TYPE_LABELS[l.leave_type] || l.leave_type || 'Leave'}
                            </span>
                            <StatusPill $status={st}>{STATUS_LABEL[st] || st}</StatusPill>
                          </HistLine>
                          <div style={{ fontSize: 0.76, color: COLORS.textSecondary, marginTop: 2 }}>
                            {fmtDate(l.start_date)} → {fmtDate(l.end_date)} &middot; {safeNum(l.days)} day(s)
                          </div>
                          {l.reason && (
                            <div style={{ fontSize: 0.76, color: COLORS.textSecondary, marginTop: 4 }}>{l.reason}</div>
                          )}
                          {st === 'rejected' && l.rejection_reason && (
                            <div style={{ fontSize: 0.74, color: COLORS.danger, marginTop: 4 }}>
                              Rejected: {l.rejection_reason}
                            </div>
                          )}
                          {st === 'pending' && (
                            <ActionCell style={{ justifyContent: 'flex-start', marginTop: 6 }}>
                              <SmallBtn
                                className="approve"
                                onClick={() => decideInPanel(l.id, 'approved', null)}
                                disabled={detailActionId === l.id}
                              >
                                {detailActionId === l.id ? <Loader2 size={12} /> : <Check size={13} />} Approve
                              </SmallBtn>
                              <SmallBtn className="reject" onClick={() => rejectInPanel(l.id)} disabled={detailActionId === l.id}>
                                {detailActionId === l.id ? <Loader2 size={12} /> : <XCircle size={13} />} Reject
                              </SmallBtn>
                            </ActionCell>
                          )}
                        </HistItem>
                      );
                    })
                  )}
                </>
              )}
            </DrawerBody>
          </Drawer>
        </Overlay>
      )}
    </Page>
  );
};

export default LeaveDashboard;
