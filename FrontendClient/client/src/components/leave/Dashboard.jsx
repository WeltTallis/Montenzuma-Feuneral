import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { api, ENDPOINTS } from '../../api';
import { getUserId } from '../../utils/globalAuth';
import {
  Calendar, Clock, Users, FileText, CheckCircle, XCircle,
  Loader2, PlusCircle, UserCheck,
} from '../../utils/icons/icons';

/* ── Palette mirrors the other Leave pages ────────────────────────── */
const COLORS = {
  primary: '#0A2463',
  primaryLight: '#1A3A7A',
  white: '#FFFFFF',
  bg: '#F5F7FA',
  border: '#E8ECF0',
  text: '#1A1D24',
  textSecondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#E74C3C',
  info: '#3B82F6',
};

const STATUS_COLOR = {
  pending: { bg: 'rgba(245, 158, 11, 0.12)', fg: '#B45309' },
  approved: { bg: 'rgba(16, 185, 129, 0.12)', fg: '#047857' },
  rejected: { bg: 'rgba(231, 76, 60, 0.12)', fg: '#B91C1C' },
  cancelled: { bg: '#E5E7EB', fg: COLORS.textSecondary },
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

/* ── Styled components ────────────────────────────────────────────── */
const Page = styled.div`
  padding: 1.5rem;
  max-width: 1240px;
  margin: 0 auto;
  background: ${COLORS.bg};
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
  grid-template-columns: 1.1fr 0.9fr;
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
  position: relative;
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
  &:last-child {
    border-bottom: 0;
  }
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

const ReqType = styled.span`
  font-weight: 600;
  color: ${COLORS.text};
`;

const ReqMeta = styled.span`
  font-size: 0.8rem;
  color: ${COLORS.textSecondary};
`;

const StatusBadge = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
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

const BalanceBig = styled.div`
  text-align: center;
  margin: 0.5rem 0;
`;

const BalanceNum = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: ${COLORS.primary};
`;

const BalanceLbl = styled.div`
  font-size: 0.78rem;
  color: ${COLORS.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ProgressBar = styled.div`
  height: 9px;
  background: ${COLORS.bg};
  border-radius: 999px;
  overflow: hidden;
  display: flex;
  margin: 0.8rem 0;
`;

const ProgressUsed = styled.div`
  background: ${COLORS.primary};
  width: ${(p) => `${p.$w}%`};
  height: 100%;
`;

const ProgressPending = styled.div`
  background: ${COLORS.warning};
  width: ${(p) => `${p.$p}%`};
  height: 100%;
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: ${COLORS.textSecondary};
  margin-top: 0.4rem;
`;

const Mini = styled.div`
  font-size: 0.82rem;
  color: ${COLORS.textSecondary};
`;/* ── Main component ───────────────────────────────────────────────────── */
const LeaveDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    on_leave: 0,
    by_status: [],
    by_type: [],
  });
  const [balance, setBalance] = useState(null);
  const [myLeaves, setMyLeaves] = useState([]);
  const [onLeaveUsers, setOnLeaveUsers] = useState([]);

  const safeNum = (v) => Number(v) || 0;

  const load = useCallback(async (abortSignal) => {
    setError('');

    // 1) Aggregate stats (tenant scoped via the api axios interceptor).
    const statsRes = await api.get(ENDPOINTS.LEAVE.STATS, { signal: abortSignal });
    const statsData = statsRes.data?.data || statsRes.data || {};
    setStats(statsData);

    // 2) Personal data — only when the current user id is known locally.
    const userId = getUserId();
    if (userId) {
      const results = await Promise.allSettled([
        api.get(ENDPOINTS.LEAVE.BALANCE(userId), { signal: abortSignal }),
        api.get(ENDPOINTS.LEAVE.MY_LEAVES, { signal: abortSignal }),
        api.get(ENDPOINTS.LEAVE.USERS_ON_LEAVE, { signal: abortSignal }),
      ]);
      const [bal, mine, onLeave] = results;
      if (bal.status === 'fulfilled') setBalance(bal.value.data?.data || null);
      if (mine.status === 'fulfilled')
        setMyLeaves((mine.value.data?.data) || mine.value.data || []);
      if (onLeave.status === 'fulfilled')
        setOnLeaveUsers((onLeave.value.data?.data) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    let ignore = false;
    (async () => {
      try {
        await load(ctrl.signal);
      } catch (e) {
        if (!ignore) setError(e?.friendlyMessage || 'Failed to load leave dashboard data. Please try again.');
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
      ctrl.abort();
    };
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

  // Derived values — computed strictly from fetched data, no dummy values.
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

  const recentRequests = myLeaves
    .slice()
    .sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date))
    .slice(0, 5);

  const entitlement = balance ? safeNum(balance.initial) : 0;
  const taken = balance ? safeNum(balance.leaveTaken) : 0;
  const pendingBal = balance ? safeNum(balance.pendingDays) : 0;
  const available = balance ? safeNum(balance.currentBalance) : 0;
  const usedPct = entitlement ? Math.min(100, (taken / entitlement) * 100) : 0;
  const pendingPct = entitlement ? Math.min(100, (pendingBal / entitlement) * 100) : 0;

  const statCards = [
    { label: 'Total Leaves', value: total, icon: FileText, bg: COLORS.primary, fg: COLORS.white },
    { label: 'Pending', value: pending, icon: Clock, bg: COLORS.warning, fg: '#78350f' },
    { label: 'On Leave Today', value: onLeaveToday, icon: UserCheck, bg: COLORS.info, fg: COLORS.white },
    { label: 'Approved', value: approved, icon: CheckCircle, bg: COLORS.success, fg: '#065f46' },
    { label: 'Rejected', value: rejected, icon: XCircle, bg: COLORS.danger, fg: COLORS.white },
  ];

  return (
    <Page>
      <PageHeader>
        <div>
          <Title>Leaves Dashboard</Title>
          <Subtitle>Leave overview — totals, balance, and today's on-leave staff for your tenant.</Subtitle>
        </div>
        <Toolbar>
          <ActionBtn onClick={refresh} disabled={refreshing}>
            {refreshing ? <Loader2 size={16} /> : <PlusCircle size={16} />}
            Refresh
          </ActionBtn>
          <RefreshText>Live • per-tenant</RefreshText>
        </Toolbar>
      </PageHeader>

      {error && <ErrorBox>{error}</ErrorBox>}

      {loading ? (
        <Center>
          <Loader2 size={28} />
          <span>Loading leave dashboard…</span>
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
            {/* Left: leaves-by-type + my recent requests */}
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
                            <BarTrack>
                              <BarFill $color={COLORS.primary} $w={w} />
                            </BarTrack>
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
                  <SectionHeadLeft><FileText size={18} />My recent requests</SectionHeadLeft>
                </SectionHead>
                <SectionBody style={{ padding: 0 }}>
                  {!getUserId() ? (
                    <Mini style={{ padding: '1rem 1.25rem' }}>No user context — sign in to view your leave requests.</Mini>
                  ) : recentRequests.length === 0 ? (
                    <Center style={{ padding: '1.6rem 1rem' }}>No leave requests yet — apply for your first one here.</Center>
                  ) : (
                    recentRequests.map((l) => (
                      <Row key={l.id || `${l.start_date}-${l.end_date}`}>
                        <Avatar>{l.leave_type?.[0] || '?'}</Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <ReqType>
                            {LEAVE_TYPE_LABELS[l.leave_type] || l.leave_type || 'Leave'} — {l.days ?? ''} day(s)
                          </ReqType>
                          <ReqMeta>{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</ReqMeta>
                          {l.reason && <ReqMeta style={{ marginTop: 2 }}>{l.reason}</ReqMeta>}
                        </div>
                        <StatusBadge style={statusColorFor(l.status)}>{STATUS_LABEL[l.status?.toLowerCase()] || l.status}</StatusBadge>
                      </Row>
                    ))
                  )}
                </SectionBody>
              </Section>
            </div>

            {/* Right: my balance + today's on-leave staff */}
            <div>
              <Section>
                <SectionHead>
                  <SectionHeadLeft><UserCheck size={18} />My leave balance</SectionHeadLeft>
                </SectionHead>
                <SectionBody>
                  {!getUserId() ? (
                    <Mini>No user context — cannot load a personal balance.</Mini>
                  ) : balance ? (
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
                    <Center style={{ padding: '1.4rem 1rem' }}>No balance data available.</Center>
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
                        <Avatar>{u.full_name ? u.full_name[0] : '?'}</Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <ReqType>{u.full_name || u.email || 'User'}</ReqType>
                          <ReqMeta>
                            {LEAVE_TYPE_LABELS[u.leave_type] || u.leave_type || 'Leave'} • {fmtDate(u.start_date)} → {fmtDate(u.end_date)}
                          </ReqMeta>
                        </div>
                        <StatusBadge style={statusColorFor('approved')}>{STATUS_LABEL.approved}</StatusBadge>
                      </Row>
                    ))
                  )}
                </SectionBody>
              </Section>
            </div>
          </ContentGrid>
        </>
      )}
    </Page>
  );
};

export default LeaveDashboard;
