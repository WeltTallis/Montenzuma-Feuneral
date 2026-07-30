import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../utils/context/socketContext';
import { api, ENDPOINTS } from '../../api';
import {
  Calendar, Clock, Users, FileText, AlertCircle, CheckCircle, XCircle,
  TrendingUp, X, PlusCircle, Wallet, UserPlus, Trash2
} from '../../utils/icons/icons';

const COLORS = {
  primary: '#0A2463',
  primaryLight: '#1A3A7A',
  primaryLighter: '#EBF0FA',
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

const DEFAULT_LEAVE_DAYS = 26;

// Animations
const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;
const slideUp = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;
const modalIn = keyframes`from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}`;
const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.5}`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  animation: ${fadeIn} 0.4s ease both;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${COLORS.text};
  margin: 0;
`;

const Subtitle = styled.p`
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
  margin: 0.25rem 0 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LiveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #D1FAE5;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #065F46;
  font-weight: 600;
`;

const LiveDot = styled.span`
  width: 8px;
  height: 8px;
  background: ${COLORS.success};
  border-radius: 50%;
  display: inline-block;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${COLORS.primary};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: ${COLORS.white};
  padding: 1.25rem;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid ${COLORS.border};
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: box-shadow 0.2s, transform 0.2s;
  animation: ${fadeIn} 0.4s ease both;
  animation-delay: ${props => props.$delay || '0s'};

  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.$color || COLORS.primary};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatLabel = styled.p`
  font-size: 0.7rem;
  color: ${COLORS.textSecondary};
  margin: 0 0 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
`;

const StatValue = styled.p`
  font-size: 1.75rem;
  font-weight: 800;
  color: ${COLORS.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Section = styled.div`
  background: ${COLORS.white};
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid ${COLORS.border};
  margin-bottom: 2rem;
  overflow: hidden;
  animation: ${slideUp} 0.45s ease both;
  animation-delay: ${props => props.$delay || '0s'};
`;

const SectionHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${COLORS.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${COLORS.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${COLORS.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${COLORS.bg};
  border-bottom: 1px solid ${COLORS.border};
`;

const Td = styled.td`
  padding: 1rem 1.5rem;
  font-size: 0.9rem;
  color: ${COLORS.text};
  border-bottom: 1px solid ${COLORS.border};
`;

const Tr = styled.tr`
  &:hover {
    background: ${COLORS.bg};
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => {
    switch (props.$status) {
      case 'approved': return '#D1FAE5';
      case 'rejected': return '#FEE2E2';
      case 'pending': return '#FEF3C7';
      case 'cancelled': return '#F3F4F6';
      default: return COLORS.bg;
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'approved': return '#065F46';
      case 'rejected': return '#991B1B';
      case 'pending': return '#92400E';
      case 'cancelled': return '#6B7280';
      default: return COLORS.textSecondary;
    }
  }};
`;

const LeaveTypeBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => {
    switch (props.$type) {
      case 'sick': return '#FEE2E2';
      case 'maternity': return '#FCE7F3';
      case 'paternity': return '#DBEAFE';
      case 'annual': return '#D1FAE5';
      case 'compensatory': return '#EDE9FE';
      case 'manual': return '#EBF0FA';
      default: return COLORS.bg;
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'sick': return '#991B1B';
      case 'maternity': return '#9D174D';
      case 'paternity': return '#1E40AF';
      case 'annual': return '#065F46';
      case 'compensatory': return '#5B21B6';
      case 'manual': return COLORS.primary;
      default: return COLORS.textSecondary;
    }
  }};
`;

const ActionIcon = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: ${COLORS.textSecondary};
  border-radius: 6px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${COLORS.bg};
    color: ${props => props.$danger ? COLORS.danger : COLORS.primary};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${COLORS.textSecondary};
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: ${COLORS.white};
  border-radius: 14px;
  padding: 2rem;
  max-width: ${props => props.$wide ? '620px' : '500px'};
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${modalIn} 0.25s ease both;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${COLORS.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${COLORS.text};
  }
`;

const ModalTextarea = styled.textarea`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  font-size: 0.9rem;
  color: ${COLORS.text};
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 1.5rem;

  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
  }
`;

const ModalButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: inherit;

  ${props => props.$variant === 'primary' ? `
    background: ${COLORS.primary};
    color: ${COLORS.white};

    &:hover:not(:disabled) {
      background: ${COLORS.primaryLight};
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  ` : `
    background: ${COLORS.white};
    color: ${COLORS.text};
    border: 1px solid ${COLORS.border};

    &:hover {
      background: ${COLORS.bg};
    }
  `}
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: ${COLORS.bg};
  border-radius: 8px;
  font-size: 0.9rem;
`;

const InfoLabel = styled.span`
  color: ${COLORS.textSecondary};
`;

const InfoValue = styled.span`
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TabButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  background: ${COLORS.white};
  color: ${COLORS.textSecondary};
  cursor: pointer;
  font-size: 0.85rem;
  text-transform: capitalize;
  font-family: inherit;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: ${COLORS.primary};
    color: ${COLORS.primary};
  }

  ${props => props.$active && `
    background: ${COLORS.primary};
    color: ${COLORS.white};
    border-color: ${COLORS.primary};
  `}
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  font-size: 0.9rem;
  color: ${COLORS.text};
  font-family: inherit;
  transition: border-color 0.2s;
  outline: none;

  &:focus {
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px rgba(10,36,99,0.08);
  }
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${COLORS.text};
  margin-bottom: 0.375rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  font-size: 0.9rem;
  color: ${COLORS.text};
  font-family: inherit;
  transition: border-color 0.2s;
  outline: none;
  background: ${COLORS.white};

  &:focus {
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px rgba(10,36,99,0.08);
  }
`;

const AdditionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.375rem;
  background: ${COLORS.primaryLighter};
  font-size: 0.85rem;
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Toast = styled.div`
  padding: 12px 20px;
  border-radius: 10px;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  transform: translateX(120%);
  transition: transform 0.35s cubic-bezier(0.22,1,0.36,1);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  font-family: inherit;
`;

const LeaveDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [usersOnLeave, setUsersOnLeave] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [rejectModal, setRejectModal] = useState({ show: false, leaveId: null, reason: '' });
  const [approveModal, setApproveModal] = useState({ show: false, leaveId: null });
  const [detailModal, setDetailModal] = useState({ show: false, leave: null });
  const [addDaysModal, setAddDaysModal] = useState({ show: false, employeeId: '', days: '', reason: '' });
  const [toasts, setToasts] = useState([]);
  const { socket, connected } = useSocket();
  const tenantSlug = localStorage.getItem('tenantSlug') || 'default';

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleLeaveCreated = (leave) => {
      if (leave) setLeaves(prev => [leave, ...(prev || [])]);
      showToast('New leave request received', 'success');
    };

    const handleLeaveUpdated = (leave) => {
      if (leave) setLeaves(prev => (prev || []).map(l => l && l.id === leave.id ? leave : l));
    };

    const handleDaysAdded = (data) => {
      showToast(`Leave days added successfully`, 'success');
      fetchData();
    };

    const handleHolidayRecorded = (data) => {
      showToast(`Holiday compensation recorded`, 'success');
      fetchData();
    };

    socket.on('leave:created', handleLeaveCreated);
    socket.on('leave:updated', handleLeaveUpdated);
    socket.on('leave:days_added', handleDaysAdded);
    socket.on('leave:holiday_recorded', handleHolidayRecorded);

    return () => {
      socket.off('leave:created', handleLeaveCreated);
      socket.off('leave:updated', handleLeaveUpdated);
      socket.off('leave:days_added', handleDaysAdded);
      socket.off('leave:holiday_recorded', handleHolidayRecorded);
    };
  }, [socket]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const fetchData = async () => {
    try {
      const [statsRes, leavesRes, onLeaveRes, balancesRes] = await Promise.all([
        api.get(ENDPOINTS.LEAVE.STATS).catch((err) => {
          console.error('Stats API error:', err);
          return { data: null };
        }),
        api.get(ENDPOINTS.LEAVE.ALL).catch((err) => {
          console.error('All leaves API error:', err);
          return { data: { data: [] } };
        }),
        api.get(ENDPOINTS.LEAVE.USERS_ON_LEAVE).catch((err) => {
          console.error('Users on leave API error:', err);
          return { data: { data: [] } };
        }),
        api.get(ENDPOINTS.LEAVE.BALANCES).catch((err) => {
          console.error('Balances API error:', err);
          return { data: { data: [] } };
        }),
      ]);

      const statsData = statsRes?.data?.data || statsRes?.data || null;
      const leavesData = leavesRes?.data?.data || leavesRes?.data || [];
      const usersOnLeaveData = onLeaveRes?.data?.data || onLeaveRes?.data || [];
      const balancesData = balancesRes?.data?.data || balancesRes?.data || [];

      setStats(statsData);
      setLeaves(Array.isArray(leavesData) ? leavesData : []);
      setUsersOnLeave(Array.isArray(usersOnLeaveData) ? usersOnLeaveData : []);
      setLeaveBalances(Array.isArray(balancesData) ? balancesData : []);
    } catch (error) {
      console.error('Error fetching leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (leaveId) => {
    setApproveModal({ show: true, leaveId });
  };

  const handleApproveConfirm = async () => {
    try {
      await api.patch(ENDPOINTS.LEAVE.UPDATE_STATUS(approveModal.leaveId), {
        status: 'approved',
        approved_by: 1
      });
      setApproveModal({ show: false, leaveId: null });
      fetchData();
      showToast('Leave request approved', 'success');
    } catch (error) {
      console.error('Error approving leave:', error);
      showToast('Failed to approve leave', 'error');
    }
  };

  const handleViewDetails = (leave) => {
    setDetailModal({ show: true, leave });
  };

  const handleReject = (leaveId) => {
    setRejectModal({ show: true, leaveId, reason: '' });
  };

  const submitRejection = async () => {
    if (!rejectModal.reason.trim()) {
      showToast('Please provide a rejection reason', 'warning');
      return;
    }

    try {
      await api.patch(ENDPOINTS.LEAVE.UPDATE_STATUS(rejectModal.leaveId), {
        status: 'rejected',
        rejection_reason: rejectModal.reason,
        approved_by: 1
      });
      setRejectModal({ show: false, leaveId: null, reason: '' });
      fetchData();
      showToast('Leave request rejected', 'warning');
    } catch (error) {
      console.error('Error rejecting leave:', error);
      showToast('Failed to reject leave', 'error');
    }
  };

  const openAddDays = () => {
    setAddDaysModal({ show: true, employeeId: '', days: '', reason: '' });
  };

  const openAddDaysFor = (employeeId) => {
    setAddDaysModal({ show: true, employeeId: String(employeeId), days: '', reason: '' });
  };

  const closeAddDays = () => {
    setAddDaysModal({ show: false, employeeId: '', days: '', reason: '' });
  };

  const submitAddDays = async () => {
    const { employeeId, days, reason } = addDaysModal;
    if (!employeeId || !days || days < 1) {
      showToast('Please select an employee and enter valid days', 'error');
      return;
    }
    if (!reason.trim()) {
      showToast('Please provide a reason', 'error');
      return;
    }

    try {
      await api.post(ENDPOINTS.LEAVE.ADD_DAYS, {
        user_id: employeeId,
        days: parseInt(days),
        reason,
        added_by: 1
      });
      closeAddDays();
      fetchData();
      showToast(`Added ${days} leave days successfully`, 'success');
    } catch (error) {
      console.error('Error adding days:', error);
      showToast('Failed to add leave days', 'error');
    }
  };

  const removeAddition = async (additionId) => {
    try {
      await api.delete(ENDPOINTS.LEAVE.REMOVE_DAYS(additionId));
      fetchData();
      showToast('Leave days addition removed', 'warning');
    } catch (error) {
      console.error('Error removing addition:', error);
      showToast('Failed to remove addition', 'error');
    }
  };

  const recordHoliday = async (employeeId) => {
    const holidayName = prompt('Enter holiday name:');
    if (!holidayName) return;

    const holidayDate = prompt('Enter holiday date (YYYY-MM-DD):');
    if (!holidayDate) return;

    const note = prompt('Enter note (optional):') || '';

    try {
      await api.post(ENDPOINTS.LEAVE.HOLIDAY_COMPENSATION, {
        user_id: employeeId,
        holiday_date: holidayDate,
        holiday_name: holidayName,
        note,
        recorded_by: 1
      });
      fetchData();
      showToast('Holiday compensation recorded', 'success');
    } catch (error) {
      console.error('Error recording holiday:', error);
      showToast('Failed to record holiday compensation', 'error');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} color={COLORS.success} />;
      case 'rejected': return <XCircle size={16} color={COLORS.danger} />;
      case 'pending': return <Clock size={16} color={COLORS.warning} />;
      default: return null;
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateShort = (date) => {
    if (!date) return '-';
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??';
  };

  const getAvatarColor = (id) => {
    const colors = ['#0A2463', '#1A3A7A', '#10B981', '#F59E0B', '#E74C3C', '#3B82F6', '#8B5CF6', '#EC4899'];
    return colors[(id - 1) % colors.length];
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '3rem', color: COLORS.textSecondary }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTop: '3px solid #C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p>Loading leave data...</p>
        </div>
      </Container>
    );
  }

  const safeStats = stats || {};
  const safeLeaves = leaves || [];
  const safeBalances = leaveBalances || [];

  return (
    <Container>
      <Header>
        <div>
          <Title>Leave Management Dashboard</Title>
          <Subtitle>Admin dashboard for managing employee leave requests and approvals</Subtitle>
        </div>
        <HeaderActions>
          <button
            onClick={openAddDays}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: COLORS.info,
              color: COLORS.white,
              fontFamily: 'inherit'
            }}
          >
            <PlusCircle size={16} /> Add Leave Days
          </button>
          <LiveIndicator>
            <LiveDot /> Live
          </LiveIndicator>
          <Avatar>AD</Avatar>
        </HeaderActions>
      </Header>

      {!connected && (
        <div style={{
          padding: '0.75rem 1rem',
          background: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '8px',
          marginBottom: '1rem',
          color: '#92400E',
          fontSize: '0.9rem'
        }}>
          ⚠️ Real-time updates disconnected. Changes may not sync automatically.
        </div>
      )}

      {/* Stats */}
      <StatsGrid>
        <StatCard $delay="0.05s">
          <StatIcon $color={COLORS.info}><FileText size={24} /></StatIcon>
          <StatContent>
            <StatLabel>Total Requests</StatLabel>
            <StatValue>{safeStats.total || 0}</StatValue>
          </StatContent>
        </StatCard>

        <StatCard $delay="0.1s">
          <StatIcon $color={COLORS.warning}><Clock size={24} /></StatIcon>
          <StatContent>
            <StatLabel>Pending Approval</StatLabel>
            <StatValue>{safeStats.pending || 0}</StatValue>
          </StatContent>
        </StatCard>

        <StatCard $delay="0.15s">
          <StatIcon $color={COLORS.success}><Users size={24} /></StatIcon>
          <StatContent>
            <StatLabel>On Leave Today</StatLabel>
            <StatValue>{safeStats.on_leave || 0}</StatValue>
          </StatContent>
        </StatCard>

        <StatCard $delay="0.2s">
          <StatIcon $color={COLORS.primary}><TrendingUp size={24} /></StatIcon>
          <StatContent>
            <StatLabel>This Month</StatLabel>
            <StatValue>{safeLeaves.filter(l => {
              const date = new Date(l.created_at);
              const now = new Date();
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length}</StatValue>
          </StatContent>
        </StatCard>
      </StatsGrid>

      {/* Users On Leave Today */}
      {usersOnLeave.length > 0 && (
        <Section $delay="0.25s">
          <SectionHeader>
            <SectionTitle>
              <AlertCircle size={20} color={COLORS.warning} />
              Currently On Leave
              <Badge $status="pending" style={{ marginLeft: '4px' }}>{usersOnLeave.length}</Badge>
            </SectionTitle>
          </SectionHeader>
          <Table>
            <thead>
              <tr>
                <Th>Employee</Th>
                <Th>Department</Th>
                <Th>Leave Type</Th>
                <Th>Dates</Th>
                <Th>Contact</Th>
              </tr>
            </thead>
            <tbody>
              {usersOnLeave.map((leave) => (
                <Tr key={leave.id}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: getAvatarColor(leave.user_id),
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {getInitials(leave.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{leave.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.8rem', color: COLORS.textSecondary }}>{leave.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td style={{ color: COLORS.textSecondary }}>{leave.department || '-'}</Td>
                  <Td>
                    <LeaveTypeBadge $type={leave.leave_type}>
                      {leave.leave_type}
                    </LeaveTypeBadge>
                  </Td>
                  <Td style={{ fontSize: '0.85rem' }}>
                    {formatDateShort(leave.start_date)} — {formatDateShort(leave.end_date)}
                  </Td>
                  <Td style={{ color: COLORS.textSecondary }}>{leave.email}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>
      )}

      {/* Leave Requests */}
      <Section $delay="0.3s">
        <SectionHeader>
          <SectionTitle>
            <Calendar size={20} />
            Leave Requests
          </SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['all', 'pending', 'approved', 'rejected'].map((tab) => (
              <TabButton
                key={tab}
                $active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab} {safeLeaves.filter(l => l.status === tab).length > 0 ? `(${safeLeaves.filter(l => l.status === tab).length})` : ''}
              </TabButton>
            ))}
          </div>
        </SectionHeader>

        {safeLeaves.length === 0 ? (
          <EmptyState>
            <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>No leave requests found.</p>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Employee</Th>
                <Th>Leave Type</Th>
                <Th>Dates</Th>
                <Th>Days</Th>
                <Th>Balance</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {safeLeaves
                .filter(leave => activeTab === 'all' || leave.status === activeTab)
                .map((leave) => {
                  const emp = leaveBalances.find(b => b.user_id === leave.user_id);
                  const balance = emp ? emp.currentBalance : DEFAULT_LEAVE_DAYS;
                  const balColor = balance <= 5 ? COLORS.danger : balance <= 10 ? COLORS.warning : COLORS.text;

                  return (
                    <Tr key={leave.id}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: getAvatarColor(leave.user_id),
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {getInitials(leave.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{leave.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.8rem', color: COLORS.textSecondary }}>{leave.email}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <LeaveTypeBadge $type={leave.leave_type}>
                          {leave.leave_type}
                        </LeaveTypeBadge>
                      </Td>
                      <Td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {formatDateShort(leave.start_date)} — {formatDateShort(leave.end_date)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: COLORS.textSecondary, marginTop: '2px' }}>
                          Filed {formatDateShort(leave.created_at)}
                        </div>
                      </Td>
                      <Td style={{ fontWeight: 600 }}>{leave.days}</Td>
                      <Td style={{ fontWeight: 600, color: balColor }}>{balance}</Td>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getStatusIcon(leave.status)}
                          <Badge $status={leave.status}>
                            {leave.status}
                          </Badge>
                        </div>
                      </Td>
                      <Td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <ActionIcon title="View Details" onClick={() => handleViewDetails(leave)}>
                            <FileText size={16} />
                          </ActionIcon>
                          {leave.status === 'pending' && (
                            <>
                              <ActionIcon title="Approve" onClick={() => handleApproveClick(leave.id)}>
                                <CheckCircle size={16} color={COLORS.success} />
                              </ActionIcon>
                              <ActionIcon title="Reject" $danger onClick={() => handleReject(leave.id)}>
                                <XCircle size={16} color={COLORS.danger} />
                              </ActionIcon>
                            </>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
            </tbody>
          </Table>
        )}
      </Section>

      {/* Leave Balance Overview */}
      <Section $delay="0.35s">
        <SectionHeader>
          <SectionTitle>
            <Wallet size={20} />
            Leave Balance Overview
          </SectionTitle>
          <div style={{ fontSize: '0.8rem', color: COLORS.textSecondary }}>
            Every employee starts with {DEFAULT_LEAVE_DAYS} days/year. Admin can add extra days.
          </div>
        </SectionHeader>
        <Table>
          <thead>
            <tr>
              <Th>Employee</Th>
              <Th>Initial</Th>
              <Th>Added</Th>
              <Th>Taken</Th>
              <Th>Holiday Comp</Th>
              <Th>Pending</Th>
              <Th>Balance</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {safeBalances.map((emp) => {
              const balColor = emp.currentBalance <= 5 ? COLORS.danger : emp.currentBalance <= 10 ? COLORS.warning : COLORS.text;
              return (
                <Tr key={emp.user_id}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: getAvatarColor(emp.user_id),
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {getInitials(emp.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{emp.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.8rem', color: COLORS.textSecondary }}>{emp.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td style={{ fontWeight: 600 }}>{emp.initial}</Td>
                  <Td style={{ fontWeight: 600, color: emp.manualAdditions > 0 ? COLORS.info : COLORS.textSecondary }}>
                    {emp.manualAdditions > 0 ? `+${emp.manualAdditions}` : '0'}
                  </Td>
                  <Td style={{ fontWeight: 600, color: emp.leaveTaken > 0 ? COLORS.danger : COLORS.textSecondary }}>
                    -{emp.leaveTaken}
                  </Td>
                  <Td style={{ fontWeight: 600, color: emp.holidayCompensations > 0 ? COLORS.success : COLORS.textSecondary }}>
                    {emp.holidayCompensations > 0 ? `+${emp.holidayCompensations}` : '0'}
                  </Td>
                  <Td style={{ fontWeight: 600, color: emp.pendingDays > 0 ? COLORS.warning : COLORS.textSecondary }}>
                    {emp.pendingDays}
                  </Td>
                  <Td style={{ fontWeight: 700, color: balColor, fontSize: '1rem' }}>
                    {emp.currentBalance}
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <ActionIcon title="Add Days" onClick={() => openAddDaysFor(emp.user_id)}>
                        <PlusCircle size={16} color={COLORS.info} />
                      </ActionIcon>
                      <ActionIcon title="Record Holiday" onClick={() => recordHoliday(emp.user_id)}>
                        <Calendar size={16} color={COLORS.success} />
                      </ActionIcon>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Section>

      {/* Rejection Modal */}
      {rejectModal.show && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Reject Leave Request</ModalTitle>
              <CloseButton onClick={() => setRejectModal({ show: false, leaveId: null, reason: '' })}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <p style={{ marginBottom: '1rem', color: COLORS.textSecondary }}>
              Please provide a reason for rejecting this leave request:
            </p>
            <ModalTextarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Enter rejection reason..."
              autoFocus
            />
            <ModalButtonGroup>
              <Button type="button" onClick={() => setRejectModal({ show: false, leaveId: null, reason: '' })}>
                Cancel
              </Button>
              <Button type="button" $variant="primary" onClick={submitRejection} disabled={!rejectModal.reason.trim()}>
                Reject Leave
              </Button>
            </ModalButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {/* Approve Confirmation Modal */}
      {approveModal.show && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Approve Leave Request</ModalTitle>
              <CloseButton onClick={() => setApproveModal({ show: false, leaveId: null })}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <p style={{ marginBottom: '1.5rem', color: COLORS.textSecondary }}>
              Are you sure you want to approve this leave request?
            </p>
            <ModalButtonGroup>
              <Button type="button" onClick={() => setApproveModal({ show: false, leaveId: null })}>
                Cancel
              </Button>
              <Button type="button" $variant="primary" onClick={handleApproveConfirm}>
                Approve Leave
              </Button>
            </ModalButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {/* Leave Details Modal */}
      {detailModal.show && detailModal.leave && (
        <Modal>
          <ModalContent $wide>
            <ModalHeader>
              <ModalTitle>Leave Request Details</ModalTitle>
              <CloseButton onClick={() => setDetailModal({ show: false, leave: null })}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: COLORS.text }}>
                Employee Information
              </h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <InfoRow>
                  <span className={InfoLabel}>Name:</span>
                  <span className={InfoValue}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: getAvatarColor(detailModal.leave.user_id),
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 700
                    }}>
                      {getInitials(detailModal.leave.name)}
                    </span>
                    {detailModal.leave.name || 'Unknown'}
                  </span>
                </InfoRow>
                <InfoRow>
                  <span className={InfoLabel}>Email:</span>
                  <span className={InfoValue}>{detailModal.leave.email || '-'}</span>
                </InfoRow>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: COLORS.text }}>
                Leave Details
              </h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <InfoRow>
                  <span className={InfoLabel}>Leave Type:</span>
                  <span className={InfoValue}>
                    <LeaveTypeBadge $type={detailModal.leave.leave_type}>
                      {detailModal.leave.leave_type}
                    </LeaveTypeBadge>
                  </span>
                </InfoRow>
                <InfoRow>
                  <span className={InfoLabel}>Start Date:</span>
                  <span className={InfoValue}>{formatDate(detailModal.leave.start_date)}</span>
                </InfoRow>
                <InfoRow>
                  <span className={InfoLabel}>End Date:</span>
                  <span className={InfoValue}>{formatDate(detailModal.leave.end_date)}</span>
                </InfoRow>
                <InfoRow>
                  <span className={InfoLabel}>Total Days:</span>
                  <span className={InfoValue}>{detailModal.leave.days} working day{detailModal.leave.days > 1 ? 's' : ''}</span>
                </InfoRow>
                <InfoRow>
                  <span className={InfoLabel}>Status:</span>
                  <span className={InfoValue} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getStatusIcon(detailModal.leave.status)}
                    <Badge $status={detailModal.leave.status}>{detailModal.leave.status}</Badge>
                  </span>
                </InfoRow>
                <InfoRow>
                  <span className={InfoLabel}>Submitted:</span>
                  <span className={InfoValue}>{formatDate(detailModal.leave.created_at)}</span>
                </InfoRow>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: COLORS.text }}>
                Reason
              </h3>
              <div style={{
                padding: '0.75rem',
                background: COLORS.bg,
                borderRadius: '8px',
                fontSize: '0.9rem',
                lineHeight: '1.6'
              }}>
                {detailModal.leave.reason || 'No reason provided'}
              </div>
            </div>

            {detailModal.leave.rejection_reason && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: COLORS.danger }}>
                  Rejection Reason
                </h3>
                <div style={{
                  padding: '0.75rem',
                  background: '#FEE2E2',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  color: '#991B1B'
                }}>
                  {detailModal.leave.rejection_reason}
                </div>
              </div>
            )}

            {detailModal.leave.status === 'pending' && (
              <ModalButtonGroup style={{ justifyContent: 'stretch' }}>
                <Button style={{ flex: 1, justifyContent: 'center' }} $variant="outline" onClick={() => { setDetailModal({ show: false, leave: null }); handleReject(detailModal.leave.id); }}>
                  <XCircle size={16} color={COLORS.danger} /> Reject
                </Button>
                <Button style={{ flex: 1, justifyContent: 'center' }} $variant="primary" onClick={() => { setDetailModal({ show: false, leave: null }); handleApproveClick(detailModal.leave.id); }}>
                  <CheckCircle size={16} /> Approve
                </Button>
              </ModalButtonGroup>
            )}
          </ModalContent>
        </Modal>
      )}

      {/* Add Days Modal */}
      {addDaysModal.show && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                <PlusCircle size={20} color={COLORS.info} />
                Add Leave Days
              </ModalTitle>
              <CloseButton onClick={closeAddDays}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <p style={{ marginBottom: '1.25rem', color: COLORS.textSecondary, fontSize: '0.9rem' }}>
              Manually add extra leave days to an employee's balance. This is in addition to their default {DEFAULT_LEAVE_DAYS} annual allocation.
            </p>
            <FormGroup>
              <FormLabel>Employee</FormLabel>
              <FormSelect
                value={addDaysModal.employeeId}
                onChange={(e) => setAddDaysModal({ ...addDaysModal, employeeId: e.target.value })}
              >
                <option value="">Select employee...</option>
                {safeBalances.map(emp => (
                  <option key={emp.user_id} value={emp.user_id}>
                    {emp.name} — {emp.email} (Current: {emp.currentBalance} days)
                  </option>
                ))}
              </FormSelect>
            </FormGroup>
            <FormGroup>
              <FormLabel>Number of Days</FormLabel>
              <FormInput
                type="number"
                min="1"
                max="365"
                value={addDaysModal.days}
                onChange={(e) => setAddDaysModal({ ...addDaysModal, days: e.target.value })}
                placeholder="e.g. 3"
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Reason</FormLabel>
              <ModalTextarea
                value={addDaysModal.reason}
                onChange={(e) => setAddDaysModal({ ...addDaysModal, reason: e.target.value })}
                placeholder="e.g. Carry-over from previous year, special allowance, adjustment..."
                style={{ marginBottom: 0 }}
              />
            </FormGroup>
            <ModalButtonGroup>
              <Button type="button" onClick={closeAddDays}>Cancel</Button>
              <Button type="button" $variant="primary" onClick={submitAddDays} disabled={!addDaysModal.employeeId || !addDaysModal.days || !addDaysModal.reason.trim()}>
                <PlusCircle size={16} /> Add Days
              </Button>
            </ModalButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {/* Toast Notifications */}
      <ToastContainer>
        {toasts.map(toast => (
          <Toast key={toast.id} className={`toast-${toast.type}`} style={{
            background: toast.type === 'success' ? COLORS.success :
              toast.type === 'error' ? COLORS.danger : COLORS.warning
          }}>
            {toast.type === 'success' && <CheckCircle size={16} />}
            {toast.type === 'error' && <XCircle size={16} />}
            {toast.type === 'warning' && <AlertCircle size={16} />}
            {toast.message}
          </Toast>
        ))}
      </ToastContainer>
    </Container>
  );
};

export default LeaveDashboard;