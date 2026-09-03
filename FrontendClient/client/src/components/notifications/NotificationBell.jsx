import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import api from '../../api/axios';
import { ENDPOINTS, getTenantHeaders } from '../../api/endpoints';
import { useSocket } from '../../utils/context/socketContext';
import { getTenantSlug } from '../../utils/globalAuth';
import notify from '../../utils/notify';
import {
  Bell, CheckCircle, X, Clock, Trash2,
  UserPlus, Truck, DollarSign, AlertTriangle,
  AlertCircle, CheckCheck, ChevronDown, Info,
  PlusCircle, ShoppingBag, Star, ArrowRight, Check,
  Box
} from '../../utils/icons/icons';
import './NotificationBell.css';

const MAX_NOTIFICATIONS = 50;
const NOTIFICATION_DEBOUNCE_MS = 100;
const FETCH_INTERVAL_MS = 30000;

const BellOffIcon = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.7 3A6 6 0 0 1 18 8c0 4.5 2 6.5 2 6.5H9" />
    <path d="M17 17H3s2-2 2-6.5a5.5 5.5 0 0 1 .7-2.5" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const Volume2Icon = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);


const getPriorityMeta = (type, priority) => {
  const colorMap = {
    'new_body': { cls: 'icon-red', icon: <UserPlus size={18} /> },
    'deceased-admitted': { cls: 'icon-red', icon: <UserPlus size={18} /> },
    'payment-received': { cls: 'icon-green', icon: <DollarSign size={18} /> },
    'payment': { cls: 'icon-green', icon: <DollarSign size={18} /> },
    'balance_update': { cls: 'icon-green', icon: <DollarSign size={18} /> },
    'billing-critical': { cls: 'icon-red', icon: <AlertTriangle size={18} /> },
    'billing-threshold-exceeded': { cls: 'icon-yellow', icon: <AlertTriangle size={18} /> },
    'invoice-overdue': { cls: 'icon-red', icon: <AlertTriangle size={18} /> },
    'warning': { cls: 'icon-yellow', icon: <AlertTriangle size={18} /> },
    'error': { cls: 'icon-red', icon: <AlertCircle size={18} /> },
    'success': { cls: 'icon-green', icon: <CheckCircle size={18} /> },
    'info': { cls: 'icon-navy', icon: <Info size={18} /> },
    'dispatch_created': { cls: 'icon-yellow', icon: <Truck size={18} /> },
    'body_dispatched': { cls: 'icon-green', icon: <CheckCircle size={18} /> },
    'postmortem-completed': { cls: 'icon-purple', icon: <CheckCircle size={18} /> },
    'postmortem_results': { cls: 'icon-purple', icon: <CheckCircle size={18} /> },
    'release-requested': { cls: 'icon-yellow', icon: <AlertTriangle size={18} /> },
    'invoice-created': { cls: 'icon-purple', icon: <DollarSign size={18} /> },
    'new_booking': { cls: 'icon-navy', icon: <ShoppingBag size={18} /> },
    'coffin-used': { cls: 'icon-gold', icon: <Box size={18} /> },
    'body-released': { cls: 'icon-purple', icon: <CheckCircle size={18} /> },
    'coffin-created': { cls: 'icon-gold', icon: <Box size={18} /> },
    'coffin-updated': { cls: 'icon-yellow', icon: <Info size={18} /> },
    'coffin-deleted': { cls: 'icon-red', icon: <AlertCircle size={18} /> },
    'coffin-assigned': { cls: 'icon-green', icon: <CheckCircle size={18} /> },
    'production-update': { cls: 'icon-navy', icon: <Star size={18} /> },
    'worker-assignment': { cls: 'icon-yellow', icon: <UserPlus size={18} /> },
    'store-dispatch': { cls: 'icon-yellow', icon: <Truck size={18} /> },
    'reminder': { cls: 'icon-yellow', icon: <Clock size={18} /> },
  };
  if (colorMap[type]) return colorMap[type];
  if (priority === 'high') return { cls: 'icon-red', icon: <AlertTriangle size={18} /> };
  if (priority === 'medium') return { cls: 'icon-yellow', icon: <Info size={18} /> };
  return { cls: 'icon-navy', icon: <Info size={18} /> };
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};

const formatTimeFull = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

// ─── Booking detail helpers ───
const getBookingField = (b, ...keys) => {
  if (!b || typeof b !== 'object') return null;
  for (const k of keys) {
    const v = b[k];
    if (v !== undefined && v !== null && String(v).trim() !== '' && v !== 'N/A') return v;
  }
  return null;
};

// booking_dates arrives as a JSON array string, e.g. ["2026-08-31"]
const formatBookingDates = (raw) => {
  if (!raw) return null;
  let dates = raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) dates = parsed;
    } catch { /* plain string date */ }
  }
  const fmt = (d) => {
    const dt = new Date(d);
    return isNaN(dt.getTime())
      ? String(d)
      : dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };
  return Array.isArray(dates) ? dates.map(fmt).join(', ') : fmt(dates);
};

// "John Doe, Jane Roe +2 more" for the collapsed message line
const buildClientSummary = (bookings) => {
  if (!Array.isArray(bookings) || bookings.length === 0) return null;
  const names = bookings
    .map(b => getBookingField(b, 'clientName', 'client_name'))
    .filter(Boolean);
  if (names.length === 0) return null;
  const shown = names.slice(0, 3).join(', ');
  return names.length > 3 ? `${shown} +${names.length - 3} more` : shown;
};

// Rich per-booking rows: client, code, destination, hearse, dates, branch
const BookingDetailsList = ({ bookings }) => {
  if (!Array.isArray(bookings) || bookings.length === 0) return null;
  return (
    <div className="nb-booking-details">
      {bookings.map((b, i) => {
        if (!b || typeof b !== 'object') return null;
        const client = getBookingField(b, 'clientName', 'client_name') || 'Unknown client';
        const code = getBookingField(b, 'bookingCode', 'booking_code');
        const destination = getBookingField(b, 'destination', 'to_location');
        const hearse = getBookingField(b, 'hearseName', 'hearse_name');
        const plate = getBookingField(b, 'plateNumber', 'plate_number');
        const phone = getBookingField(b, 'clientPhone', 'client_phone', 'phone');
        const when = formatBookingDates(getBookingField(b, 'bookingDates', 'booking_dates'));
        const branch = getBookingField(b, 'branchCode', 'branch_code');
        return (
          <div className="nb-booking-row" key={code || `booking-${i}`}>
            <div className="nb-booking-main">
              <span className="nb-booking-client">{client}</span>
              {code && <span className="nb-booking-code">{code}</span>}
            </div>
            <div className="nb-booking-meta">
              {destination && <span><span className="nb-booking-label">To:</span> {destination}</span>}
              {hearse && <span><span className="nb-booking-label">Hearse:</span> {hearse}{plate ? ` (${plate})` : ''}</span>}
              {when && <span><span className="nb-booking-label">When:</span> {when}</span>}
              {phone && <span><span className="nb-booking-label">Tel:</span> {phone}</span>}
              {branch && <span><span className="nb-booking-label">Branch:</span> {branch}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Memoized Notification Item ───
const NotificationItem = memo(({ notif, onMarkRead, onDelete }) => {
  const meta = useMemo(() => getPriorityMeta(notif.type, notif.priority), [notif.type, notif.priority]);

  const handleClick = useCallback(() => {
    if (!notif.is_read) onMarkRead(notif.id);
  }, [notif.id, notif.is_read, onMarkRead]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(notif.id);
  }, [notif.id, onDelete]);

  // Rich details: structured booking rows first, then HTML content, then plain text
  const renderDetails = () => {
    const bookings = notif.bookings || notif.data?.bookings;
    if (Array.isArray(bookings) && bookings.length > 0) {
      return <BookingDetailsList bookings={bookings} />;
    }
    if (!notif.fullContent) return null;
    if (typeof notif.fullContent === 'string' && /<\/?[a-z][\s\S]*>/i.test(notif.fullContent)) {
      // HTML built by our own handlers (label/value markup)
      return <div className="nb-item-full" dangerouslySetInnerHTML={{ __html: notif.fullContent }} />;
    }
    return <div className="nb-item-full">{notif.fullContent}</div>;
  };

  return (
    <div className={`nb-item ${!notif.is_read ? 'nb-unread' : ''}`} onClick={handleClick}>
      <div className={`nb-item-icon ${meta.cls}`}>{meta.icon}</div>
      <div className="nb-item-content">
        <p className="nb-item-title">{notif.title}</p>
        <p className="nb-item-message">{notif.message}</p>
        <div className="nb-item-meta">
          <span>{formatTimeFull(notif.created_at)}</span>
          <span className="nb-dot" />
          <span>{notif.type || 'Notification'}</span>
        </div>
        {renderDetails()}
      </div>
      <div className="nb-item-right"><span className="nb-item-time">{formatTime(notif.created_at)}</span></div>
      <div className="nb-actions">
        <button className="nb-action-btn" title="Dismiss" onClick={handleDelete}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
});


NotificationItem.displayName = 'NotificationItem';

// ─── Main Component ───
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('nb_muted') === 'true');
  const dropdownRef = useRef(null);
  const audioRef = useRef(null);
  const { socket } = useSocket();

  // Performance: Debounce rapid notifications to prevent excessive re-renders
  const pendingNotificationsRef = useRef([]);
  const debounceTimerRef = useRef(null);

  const playNotificationSound = useCallback(() => {
    try {
      if (!isMuted && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => { });
      }
    } catch { }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newVal = !prev;
      localStorage.setItem('nb_muted', String(newVal));
      return newVal;
    });
  }, []);

  // ─── API Calls ───
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const tenantSlug = getTenantSlug();
      const headers = getTenantHeaders();
      const url = `${ENDPOINTS.NOTIFICATION.BASE}/notifications`;
      const response = await api.get(url, {
        headers: { ...headers, 'x-tenant-slug': tenantSlug },
        params: { _t: Date.now() }
      });

      if (response.data?.notifications && response.data.notifications.length > 0) {
        const redisNotifications = response.data.notifications.map(notif => ({
          id: notif.id,
          type: notif.type || 'info',
          message: notif.message || notif.title || '',
          fullContent: notif.fullContent || notif.message || 'No additional details provided.',
          is_read: notif.read ? 1 : 0,
          created_at: notif.createdAt || new Date().toISOString(),
          title: notif.title || 'Notification',
          priority: notif.priority || 'low',
          data: notif.data || null,
        }));

        setNotifications(prev => {
          if (!prev || prev.length === 0) return redisNotifications.slice(0, MAX_NOTIFICATIONS);
          const redisIds = new Set(redisNotifications.map(n => String(n.id)));
          const liveOnly = prev.filter(p => !redisIds.has(String(p.id)) && !p.persisted);
          const combined = [...redisNotifications, ...liveOnly];
          return combined.slice(0, MAX_NOTIFICATIONS);
        });
      }
    } catch {
      // Keep live socket notifications on error
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      const headers = getTenantHeaders();
      await api.put(`${ENDPOINTS.NOTIFICATION.BASE}/notifications/${id}/read`, {}, { headers });
    } catch { }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const headers = getTenantHeaders();
      await api.put(`${ENDPOINTS.NOTIFICATION.BASE}/notifications/mark-all-read`, {}, { headers });
    } catch { }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      const headers = getTenantHeaders();
      await api.delete(`${ENDPOINTS.NOTIFICATION.BASE}/notifications/${id}`, { headers });
    } catch { }
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // ─── Effects ───
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, FETCH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fetch notifications when socket connects
  useEffect(() => {
    if (!socket) return;
    const handleConnect = () => fetchNotifications();
    socket.on('connect', handleConnect);
    socket.on('reconnect', handleConnect);
    return () => {
      socket.off('connect', handleConnect);
      socket.off('reconnect', handleConnect);
    };
  }, [socket, fetchNotifications]);

  // Performance: Batch and debounce notifications to prevent excessive re-renders
  const flushNotifications = useCallback(() => {
    if (pendingNotificationsRef.current.length === 0) return;
    const batch = [...pendingNotificationsRef.current];
    pendingNotificationsRef.current = [];

    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => String(n.id)));
      const newNotifs = batch.filter(n => !existingIds.has(String(n.id)));
      if (newNotifs.length === 0) return prev;
      const combined = [...newNotifs, ...prev];
      return combined.slice(0, MAX_NOTIFICATIONS);
    });

    setUnreadCount(prev => {
      const newUnread = batch.filter(n => !n.is_read).length;
      return prev + newUnread;
    });

    if (batch.some(n => !n.is_read)) playNotificationSound();
  }, [playNotificationSound]);

  // ─── Real-time Socket Listener ───
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (eventName) => (data) => {
      let formatted;
      const eventTypeMap = {
        'notification:deceased-admitted': { type: 'new_body', title: 'New Admission', priority: 'high' },
        'notification:status-change': { type: 'info', title: 'Status Update', priority: 'low' },
        'notification:release-requested': { type: 'release-requested', title: 'Release Requested', priority: 'high' },
        'notification:invoice-created': { type: 'invoice-created', title: 'Invoice Created', priority: 'medium' },
        'notification:payment-received': { type: 'payment-received', title: 'Payment Received', priority: 'high' },
        'alert:invoice-overdue': { type: 'invoice-overdue', title: 'Invoice Overdue', priority: 'critical' },
        'alert:low-stock': { type: 'warning', title: 'Low Stock Alert', priority: 'high' },
        'notification:coffin-used': { type: 'coffin-used', title: 'Coffin Used', priority: 'low' },
        'notification:body-released': { type: 'body-released', title: 'Body Released', priority: 'medium' },
        'notification:postmortem-completed': { type: 'postmortem-completed', title: 'Postmortem Completed', priority: 'medium' },
        'notification:store-dispatch': { type: 'store-dispatch', title: 'Store Item Dispatched', priority: 'medium' },
      };

      // Hearse booking created
      if (eventName === 'notification:hearse-booking-created') {
        const bookingDetails = data.booking || data;
        const detailsHtml = `
          <strong style="color: #fbbf24;">Booking Code:</strong> <span style="color: #fff;">${bookingDetails.booking_code || data.bookingId || 'N/A'}</span><br/>
          <strong style="color: #fbbf24;">Client:</strong> <span style="color: #10b981;">${bookingDetails.client_name || data.clientName || 'Unknown'}</span><br/>
          <strong style="color: #fbbf24;">Phone:</strong> <span style="color: #fff;">${bookingDetails.phone || data.phone || 'N/A'}</span><br/>
          <strong style="color: #fbbf24;">Destination:</strong> <span style="color: #8b5cf6;">${bookingDetails.destination || data.destination || 'N/A'}</span><br/>
          <strong style="color: #fbbf24;">Hearse:</strong> <span style="color: #fff;">${bookingDetails.hearse_id || data.hearseId || 'N/A'}</span>`;
        formatted = {
          id: data.id || data.bookingId || `hearse-booking-${Date.now()}`,
          type: 'new_booking',
          title: data.title || 'New Hearse Booking',
          message: data.message || `New hearse booking: ${bookingDetails.client_name || 'Client'} to ${bookingDetails.destination || 'destination'}`,
          fullContent: detailsHtml,
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'high',
          data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      // Hearse booking updated
      else if (eventName === 'notification:hearse-booking-updated') {
        formatted = {
          id: data.id || `hearse-updated-${Date.now()}`,
          type: 'booking_update', title: data.title || 'Hearse Booking Updated',
          message: data.message || 'Hearse booking status changed',
          fullContent: data.fullContent || 'Booking updated',
          is_read: 0, created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'medium', data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      // Hearse booking postponed
      else if (eventName === 'notification:hearse-booking-postponed') {
        formatted = {
          id: data.id || `hearse-postponed-${Date.now()}`,
          type: 'warning', title: data.title || 'Booking Postponed',
          message: data.message || 'Hearse booking has been postponed',
          fullContent: data.fullContent || 'Booking postponed',
          is_read: 0, created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'high', data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      // Raw hearse events (direct io.emit)
      else if (eventName === 'new_booking') {
        formatted = {
          id: data.booking_id || data.id || Date.now(),
          type: 'new_booking', title: 'New Hearse Booking',
          message: data.message || `New booking for ${data.booking?.client_name || 'client'}`,
          fullContent: data.booking ? `${data.booking.client_name} - ${data.booking.destination || ''}` : 'New hearse booking created',
          is_read: 0, created_at: data.timestamp || new Date().toISOString(), priority: 'high', data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      else if (eventName === 'booking_status_updated') {
        formatted = {
          id: `status-${data.booking_id}-${Date.now()}`,
          type: 'info', title: 'Booking Status Update',
          message: data.message || `Booking status changed to ${data.status}`,
          fullContent: `Booking #${data.booking_id} status updated to ${data.status}`,
          is_read: 0, created_at: data.timestamp || new Date().toISOString(),
          priority: 'medium', data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      else if (eventName === 'booking_postponed') {
        formatted = {
          id: `postponed-${data.booking_id}-${Date.now()}`,
          type: 'warning', title: 'Booking Postponed',
          message: `Booking #${data.booking_id} has been postponed`,
          fullContent: `Reason: ${data.reason || 'Not provided'}`,
          is_read: 0, created_at: data.timestamp || new Date().toISOString(),
          priority: 'high', data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      // Body released event
      else if (eventName === 'body-released' || eventName === 'notification:body-released') {
        formatted = {
          id: data.id || `body-release-${Date.now()}`,
          type: 'body-released', title: data.title || 'Body Released',
          message: data.message || 'Body has been released',
          fullContent: data.fullContent || 'Release completed',
          is_read: 0, created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'medium', data,
        };
        pendingNotificationsRef.current.push(formatted);

      }

      // Hearse booking reminder
      else if (eventName === 'hearse-booking-reminder') {
        const clientSummary = buildClientSummary(data.bookings);
        formatted = {
          id: data.id || `reminder-${Date.now()}`,
          type: 'reminder', title: data.title || 'Upcoming Hearse Bookings',
          message: data.message || (clientSummary ? `Upcoming bookings: ${clientSummary}` : 'You have upcoming hearse bookings'),
          bookings: Array.isArray(data.bookings) ? data.bookings : undefined,
          fullContent: data.fullContent || 'No details available',
          is_read: 0, created_at: new Date().toISOString(),
          priority: data.priority || 'high', data,
        };
        pendingNotificationsRef.current.push(formatted);
      }


      else if (eventName === 'notification:upcoming_bookings_24h') {
        const clientSummary = buildClientSummary(data.bookings);
        formatted = {
          id: data.id || `upcoming-${Date.now()}`,
          type: 'reminder', title: data.title || 'Upcoming Bookings Tomorrow',
          message: data.message || (clientSummary ? `Tomorrow: ${clientSummary}` : 'You have upcoming bookings'),
          bookings: Array.isArray(data.bookings) ? data.bookings : undefined,
          fullContent: data.fullContent || (clientSummary
            ? `Tomorrow's schedule: ${clientSummary}`
            : `You have ${data.bookings?.length || 0} booking(s) scheduled for tomorrow`),
          is_read: 0, created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'high', data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      else if (eventName === 'notification:urgent_bookings_2h') {
        const clientSummary = buildClientSummary(data.bookings);
        formatted = {
          id: data.id || `urgent-${Date.now()}`,
          type: 'urgent_reminder', title: data.title || 'Urgent: Bookings in 2h',
          message: data.message || (clientSummary ? `Starting soon: ${clientSummary}` : 'Bookings starting soon!'),
          bookings: Array.isArray(data.bookings) ? data.bookings : undefined,
          fullContent: data.fullContent || (clientSummary
            ? `Starting soon: ${clientSummary}`
            : `${data.bookings?.length || 0} booking(s) starting soon!`),
          is_read: 0, created_at: data.timestamp || new Date().toISOString(), priority: 'critical', data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      else if (eventName === 'notification:weekly_bookings_summary') {
        const clientSummary = buildClientSummary(data.bookings);
        formatted = {
          id: data.id || `weekly-${Date.now()}`,
          type: 'weekly_summary', title: data.title || 'Weekly Bookings Summary',
          message: data.message || (clientSummary ? `Next 7 days: ${clientSummary}` : 'Weekly bookings summary'),
          bookings: Array.isArray(data.bookings) ? data.bookings : undefined,
          fullContent: data.fullContent || (clientSummary
            ? `Next 7 days: ${clientSummary}`
            : `You have ${data.totalBookings || 0} booking(s) scheduled for the next 7 days`),
          is_read: 0, created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'medium', data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      // Postmortem results ready
      else if (eventName === 'postmortem-results-ready') {
        formatted = {
          id: data.id || `pm-results-${Date.now()}`,
          type: 'postmortem_results', title: data.title || 'Postmortem Results Available',
          message: data.message || 'Postmortem results are now available',
          fullContent: data.fullContent || 'No details available',
          is_read: 0, created_at: new Date().toISOString(),
          priority: data.priority || 'high', data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      // Coffin events (the socketio-service /emit endpoint prefixes event names
      // with "notification:", so accept both the raw and the prefixed variant)
      else if (['coffin-created', 'coffin-updated', 'coffin-deleted', 'coffin-assigned'].includes(eventName.replace(/^notification:/, ''))) {
        const eventMeta = {
          'coffin-created': { type: 'coffin-created', title: 'New Coffin Added', priority: 'medium' },
          'coffin-updated': { type: 'coffin-updated', title: 'Coffin Updated', priority: 'low' },
          'coffin-deleted': { type: 'coffin-deleted', title: 'Coffin Removed', priority: 'medium' },
          'coffin-assigned': { type: 'coffin-assigned', title: 'Coffin Assigned', priority: 'high' },
        };
        const meta = eventMeta[eventName.replace(/^notification:/, '')];
        formatted = {
          id: data.id || `coffin-${Date.now()}`,
          type: meta.type, title: data.title || meta.title,
          message: data.message || 'Coffin inventory update',
          fullContent: data.fullContent || '',
          is_read: 0, created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || meta.priority, data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      // Coffin booking/stock request events
      else if (['coffin-booking-created', 'notification:coffin-booking-created', 'coffin-stock-request', 'notification:coffin-stock-request'].includes(eventName)) {
        formatted = {
          id: data.id || `coffin-booking-${Date.now()}`,
          type: 'coffin-booking', title: data.title || 'Coffin Booking Update',
          message: data.message || 'Coffin booking or stock request received',
          fullContent: data.fullContent || '', is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'high', data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      // Postmortem results ready (prefixed from socketio-service or raw)
      else if (eventName === 'postmortem-results-ready' || eventName === 'notification:postmortem-results-ready') {
        const who = data.deceasedName || data.fullName || '';
        formatted = {
          // Stable id per deceased — repeat deliveries collapse instead of duplicating
          id: `pm-results-${data.deceasedId || data.id || Date.now()}`,
          type: 'postmortem_results',
          title: data.title || 'Postmortem Results Available',
          message: who
            ? `Postmortem results for ${who} (${data.deceasedId || ''}) are now available`
            : (data.message || 'Postmortem results are now available'),
          fullContent: data.fullContent || 'No details available',
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'high',
          data,
        };
        pendingNotificationsRef.current.push(formatted);

        // Visible toast popup with the full details
        try {
          notify.success(
            formatted.title,
            [
              who && `Deceased: ${who}`,
              data.pathologistName && `Pathologist: ${data.pathologistName}`,
              data.causeOfDeath && `Cause of Death: ${data.causeOfDeath}`,
              data.mannerOfDeath && `Manner: ${data.mannerOfDeath}`,
            ].filter(Boolean).join(' · ') || formatted.message
          );
        } catch { /* toast optional */ }
      }

      // Postmortem completed — recorded in the list only. The results-ready
      // toast above already announces completion, so no second popup here.
      else if (eventName === 'postmortem-completed' || eventName === 'notification:postmortem-completed') {
        const who = data.deceasedName || data.fullName || '';
        formatted = {
          id: `pm-completed-${data.deceasedId || data.id || Date.now()}`,
          type: 'postmortem-completed',
          title: data.title || 'Postmortem Completed',
          message: who
            ? `Postmortem examination completed for ${who}`
            : (data.message || 'Postmortem examination completed'),
          fullContent: data.fullContent || '',
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'medium',
          data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      // Postmortem request initiated / sent / status change (from deceased-service)
      else if (
        eventName === 'notification:postmortem-request-created' ||
        eventName === 'postmortem-request-created' ||
        eventName === 'notification:postmortem-request-sent' ||
        eventName === 'postmortem-request-sent' ||
        eventName === 'notification:postmortem-request-status'
      ) {
        formatted = {
          id: data.id || `pm-request-${Date.now()}`,
          type: 'postmortem_results',
          title: data.title || 'Postmortem Request',
          message: data.message || 'Postmortem request update',
          fullContent: data.fullContent || '',
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'high',
          data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      // General fallback for any other registered notification event
      else {
        const meta = eventTypeMap[eventName];
        formatted = {
          id: data.id || `notif-${Date.now()}`,
          type: meta?.type || 'info',
          title: meta?.title || data.title || 'Notification',
          priority: meta?.priority || data.priority || 'low',
          message: data.message || data.title || 'New notification',
          fullContent: data.fullContent || '',
          is_read: data.is_read ? 1 : 0,
          created_at: data.timestamp || data.createdAt || new Date().toISOString(),
          data,
        };
        pendingNotificationsRef.current.push(formatted);
      }

      // Debounce the batched flush to avoid excessive re-renders
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(flushNotifications, NOTIFICATION_DEBOUNCE_MS);
    };

    // Register all real-time notification events
    const notificationEvents = [
      'notification:deceased-admitted', 'notification:status-change',
      'notification:release-requested', 'notification:invoice-created',
      'notification:payment-received', 'alert:invoice-overdue',
      'alert:low-stock', 'notification:coffin-used',
      'notification:body-released', 'notification:postmortem-completed',
      'notification:store-dispatch',
      'notification:postmortem-results-ready',
      'notification:hearse-booking-created', 'notification:hearse-booking-updated', 'notification:hearse-booking-postponed',
      'notification:upcoming_bookings_24h', 'notification:urgent_bookings_2h', 'notification:weekly_bookings_summary',
      'new_booking', 'booking_status_updated', 'booking_postponed',
      'hearse-booking-reminder',
      'coffin-created', 'notification:coffin-created',
      'coffin-updated', 'notification:coffin-updated',
      'coffin-deleted', 'notification:coffin-deleted',
      'coffin-assigned', 'notification:coffin-assigned',
      'coffin-booking-created', 'notification:coffin-booking-created',
      'coffin-stock-request', 'notification:coffin-stock-request',
      'body-released', 'postmortem-results-ready',
      'postmortem-completed',
      'notification:postmortem-request-created', 'postmortem-request-created',
      'notification:postmortem-request-sent', 'postmortem-request-sent',
      'notification:postmortem-request-status',
      // Workshop / store service notifications (pushed through socketio-service /emit,
      // which prefixes them with "notification:")
      'notification:production-stage-updated', 'notification:worker-assigned',
      'notification:worker-assignment-updated',
    ];
    const uniqueEvents = Array.from(new Set(notificationEvents));

    const handlers = {};
    uniqueEvents.forEach(event => {
      const handler = handleNotification(event);
      handlers[event] = handler;
      socket.on(event, handler);
    });

    // CATCH-ALL: the socketio-service prefixes EVERY /emit/<event> with
    // "notification:" (or "alert:"), and backend services add new events over
    // time. Listening only to the fixed list above silently drops every event
    // that is not listed, which is why the bell missed notifications. Listen to
    // everything and render whatever looks like a notification through the
    // generic formatter. Events with a specific handler above are skipped so
    // nothing is ever shown twice.
    const registeredEvents = new Set(uniqueEvents);
    const serverControlEvents = new Set([
      'connected', 'joined', 'joined-deceased', 'error',
      'connect', 'disconnect', 'reconnect', 'ping', 'pong',
    ]);
    const onAnyNotification = (eventName, ...args) => {
      if (registeredEvents.has(eventName)) return;
      if (serverControlEvents.has(eventName)) return;
      const isNotificationEvent =
        eventName.startsWith('notification:') ||
        eventName.startsWith('alert:') ||
        eventName.startsWith('booking_') ||
        eventName === 'new_booking';
      if (!isNotificationEvent) return;
      const data = args.find(a => a && typeof a === 'object') || {};
      handleNotification(eventName)(data);
    };
    socket.onAny(onAnyNotification);

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
      socket.offAny(onAnyNotification);
    };
  }, [socket, flushNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <audio ref={audioRef} src="/audio/alert.mp3" preload="auto" />

      {/* ─── Floating Bell & Glass Dropdown ─── */}
      <div className="nb-container" ref={dropdownRef}>
        <div className="nb-bell-wrap">
          <button
            className={`nb-bell-btn ${isOpen ? 'nb-active' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="nb-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
        </div>

        <div className={`nb-dropdown ${isOpen ? 'nb-open' : ''}`}>
          <div className="nb-panel">
            {/* Simple Header */}
            <div className="nb-header">
              <h3 className="nb-title">Notifications</h3>
              <div className="nb-header-actions">
                {unreadCount > 0 && (
                  <button className="nb-mark-all" onClick={markAllAsRead}>
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
                <button
                  className="nb-mute-header-btn"
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
                >
                  {isMuted ? <BellOffIcon size={14} /> : <Volume2Icon size={14} />}
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="nb-list">
              {loading && notifications.length === 0 ? (
                <div className="nb-empty">
                  <Bell size={28} strokeWidth={1.5} />
                  <p className="nb-empty-title">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="nb-empty">
                  <Bell size={28} strokeWidth={1.5} />
                  <p className="nb-empty-title">All caught up!</p>
                  <span>No notifications to show</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationBell;