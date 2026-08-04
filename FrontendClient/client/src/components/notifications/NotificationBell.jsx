import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';
import { getTenantHeaders } from '../../api/endpoints';
import { useSocket } from '../../utils/context/socketContext';
import { getTenantSlug } from '../../utils/globalAuth';
import {
  Bell, CheckCircle, X, Clock, Trash2,
  UserPlus, Truck, DollarSign, AlertTriangle,
  AlertCircle, CheckCheck, ChevronDown, Info,
  PlusCircle, ShoppingBag, Star, ArrowRight, Check,
  Box
} from '../../utils/icons/icons';
import './NotificationBell.css';

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

const NOTIFICATION_SERVICE = '/notification';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('nb_muted') === 'true');
  const dropdownRef = useRef(null);
  const audioRef = useRef(null);
  const { socket } = useSocket();

  // ─── Audio ───
  const playNotificationSound = useCallback(() => {
    try {
      if (!isMuted && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch {}
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newVal = !prev;
      localStorage.setItem('nb_muted', String(newVal));
      return newVal;
    });
  }, []);

  // ─── Toast Management ───
  const removeToast = (id) => {
    // Toast notifications removed - no-op
  };

  // ─── Icon & Priority Color Mapping ───
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
      'reminder': { cls: 'icon-yellow', icon: <Clock size={18} /> },
    };

    if (colorMap[type]) return colorMap[type];

    // Fallback by priority
    if (priority === 'high') return { cls: 'icon-red', icon: <AlertTriangle size={18} /> };
    if (priority === 'medium') return { cls: 'icon-yellow', icon: <Info size={18} /> };
    return { cls: 'icon-navy', icon: <Info size={18} /> };
  };


  // ─── API Calls ───
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const tenantSlug = getTenantSlug();
      const headers = getTenantHeaders();
      const url = `${NOTIFICATION_SERVICE}/notifications`;

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
          if (!prev || prev.length === 0) return redisNotifications;
          const redisIds = new Set(redisNotifications.map(n => String(n.id)));
          const liveOnly = prev.filter(p => !redisIds.has(String(p.id)) && !p.persisted);
          return [...redisNotifications, ...liveOnly];
        });

        setNotifications(prevNotifs => {
          const mergedUnread = prevNotifs.filter(n => !n.is_read).length;
          setUnreadCount(mergedUnread);
          return prevNotifs;
        });
      }
    } catch {
      // Keep live socket notifications on error
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      const headers = getTenantHeaders();
      await api.put(`${NOTIFICATION_SERVICE}/notifications/${id}/read`, {}, { headers });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    try {
      const headers = getTenantHeaders();
      await api.put(`${NOTIFICATION_SERVICE}/notifications/mark-all-read`, {}, { headers });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const headers = getTenantHeaders();
      await api.delete(`${NOTIFICATION_SERVICE}/notifications/${id}`, { headers });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // ─── Effects ───
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fetch notifications when socket connects (in case we missed live events)
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      fetchNotifications();
    };

    socket.on('connect', handleConnect);
    socket.on('reconnect', handleConnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('reconnect', handleConnect);
    };
  }, [socket, fetchNotifications]);

  // Real-time Socket Listener
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (eventName, data) => {
      console.log('[NotificationBell] 📨 Received socket event:', eventName, data);
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
      };

      // Hearse booking created (from socketio service)
      if (eventName === 'notification:hearse-booking-created') {
        const bookingDetails = data.booking || data;
        const detailsHtml = `
          <strong style="color: #fbbf24;">Booking Code:</strong> <span style="color: #fff;">${bookingDetails.booking_code || data.bookingId || 'N/A'}</span><br/>
          <strong style="color: #fbbf24;">Client:</strong> <span style="color: #10b981;">${bookingDetails.client_name || data.clientName || 'Unknown'}</span><br/>
          <strong style="color: #fbbf24;">Phone:</strong> <span style="color: #fff;">${bookingDetails.phone || data.phone || 'N/A'}</span><br/>
          <strong style="color: #fbbf24;">Destination:</strong> <span style="color: #8b5cf6;">${bookingDetails.destination || data.destination || 'N/A'}</span><br/>
          <strong style="color: #fbbf24;">Hearse:</strong> <span style="color: #fff;">${bookingDetails.hearse_id || data.hearseId || 'N/A'}</span>
        `;
        
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
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Hearse booking updated (from socketio service)
      if (eventName === 'notification:hearse-booking-updated') {
        formatted = {
          id: data.id || `hearse-updated-${Date.now()}`,
          type: 'booking_update',
          title: data.title || 'Hearse Booking Updated',
          message: data.message || 'Hearse booking status changed',
          fullContent: data.fullContent || 'Booking updated',
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'medium',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Hearse booking postponed (from socketio service)
      if (eventName === 'notification:hearse-booking-postponed') {
        formatted = {
          id: data.id || `hearse-postponed-${Date.now()}`,
          type: 'warning',
          title: data.title || 'Booking Postponed',
          message: data.message || 'Hearse booking has been postponed',
          fullContent: data.fullContent || 'Booking postponed',
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'high',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Raw hearse events (direct io.emit)
      if (eventName === 'new_booking') {
        formatted = {
          id: data.booking_id || data.id || Date.now(),
          type: 'new_booking',
          title: 'New Hearse Booking',
          message: data.message || `New booking for ${data.booking?.client_name || 'client'}`,
          fullContent: data.booking ? `${data.booking.client_name} - ${data.booking.destination || ''}` : 'New hearse booking created',
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: 'high',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      if (eventName === 'booking_status_updated') {
        formatted = {
          id: `status-${data.booking_id}-${Date.now()}`,
          type: 'info',
          title: 'Booking Status Update',
          message: data.message || `Booking status changed to ${data.status}`,
          fullContent: `Booking #${data.booking_id} status updated to ${data.status}`,
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: 'medium',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      if (eventName === 'booking_postponed') {
        formatted = {
          id: `postponed-${data.booking_id}-${Date.now()}`,
          type: 'warning',
          title: 'Booking Postponed',
          message: `Booking #${data.booking_id} has been postponed`,
          fullContent: `Reason: ${data.reason || 'Not provided'}`,
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: 'high',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Body released event
      if (eventName === 'body-released' || eventName === 'notification:body-released') {
        formatted = {
          id: data.id || `body-release-${Date.now()}`,
          type: 'body-released',
          title: data.title || 'Body Released',
          message: data.message || 'Body has been released',
          fullContent: data.fullContent || 'Release completed',
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'medium',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Hearse booking reminder (from getUpcomingBookings endpoint)
      if (eventName === 'hearse-booking-reminder') {
        formatted = {
          id: data.id || `reminder-${Date.now()}`,
          type: 'reminder',
          title: data.title || 'Upcoming Hearse Bookings',
          message: data.message || 'You have upcoming hearse bookings',
          fullContent: data.fullContent || 'No details available',
          is_read: 0,
          created_at: new Date().toISOString(),
          priority: data.priority || 'high',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Hearse cron notifications (from notificationCronService)
      if (eventName === 'notification:upcoming_bookings_24h') {
        formatted = {
          id: data.id || `upcoming-${Date.now()}`,
          type: 'reminder',
          title: data.title || 'Upcoming Bookings Tomorrow',
          message: data.message || 'You have upcoming bookings',
          fullContent: data.fullContent || `You have ${data.bookings?.length || 0} booking(s) scheduled for tomorrow`,
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'high',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      if (eventName === 'notification:urgent_bookings_2h') {
        formatted = {
          id: data.id || `urgent-${Date.now()}`,
          type: 'urgent_reminder',
          title: data.title || '⚠️ Urgent: Bookings in Next 2 Hours',
          message: data.message || 'Bookings starting soon!',
          fullContent: data.fullContent || `${data.bookings?.length || 0} booking(s) starting soon!`,
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: 'critical',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      if (eventName === 'notification:weekly_bookings_summary') {
        formatted = {
          id: data.id || `weekly-${Date.now()}`,
          type: 'weekly_summary',
          title: data.title || '📋 Weekly Bookings Summary',
          message: data.message || 'Weekly bookings summary',
          fullContent: data.fullContent || `You have ${data.totalBookings || 0} booking(s) scheduled for the next 7 days`,
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'medium',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Postmortem results ready
      if (eventName === 'postmortem-results-ready') {
        formatted = {
          id: data.id || `pm-results-${Date.now()}`,
          type: 'postmortem_results',
          title: data.title || 'Postmortem Results Available',
          message: data.message || 'Postmortem results are now available',
          fullContent: data.fullContent || 'No details available',
          is_read: 0,
          created_at: new Date().toISOString(),
          priority: data.priority || 'high',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Coffin events
      if (['coffin-created', 'coffin-updated', 'coffin-deleted', 'coffin-assigned'].includes(eventName)) {
        const eventMeta = {
          'coffin-created': { type: 'coffin-created', title: 'New Coffin Added', priority: 'medium' },
          'coffin-updated': { type: 'coffin-updated', title: 'Coffin Updated', priority: 'low' },
          'coffin-deleted': { type: 'coffin-deleted', title: 'Coffin Removed', priority: 'medium' },
          'coffin-assigned': { type: 'coffin-assigned', title: 'Coffin Assigned', priority: 'high' },
        };
        const meta = eventMeta[eventName];
        formatted = {
          id: data.id || `coffin-${Date.now()}`,
          type: meta.type,
          title: data.title || meta.title,
          message: data.message || 'Coffin inventory update',
          fullContent: data.fullContent || 'No details available',
          is_read: 0,
          created_at: new Date().toISOString(),
          priority: data.priority || meta.priority,
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Coffin booking created (from socketio service)
      if (eventName === 'coffin-booking-created' || eventName === 'notification:coffin-booking-created') {
        formatted = {
          id: data.id || data.booking_id || `coffin-booking-${Date.now()}`,
          type: 'new_booking',
          title: data.title || 'New Coffin Reservation',
          message: data.message || 'New coffin reservation created',
          fullContent: data.fullContent || '',
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'high',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Coffin stock request / transfer request (from socketio service)
      if (eventName === 'coffin-stock-request' || eventName === 'notification:coffin-stock-request') {
        const isClientRequest = data.req_type === 'client' || (data.data && data.data.req_type === 'client');
        formatted = {
          id: data.id || data.request_id || `coffin-request-${Date.now()}`,
          type: isClientRequest ? 'new_booking' : 'info',
          title: data.title || (isClientRequest ? 'New Coffin Transfer Request' : 'Stock Request'),
          message: data.message || 'Coffin transfer request',
          fullContent: data.fullContent || '',
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'high',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Workshop production events
      if (['production-stage-updated', 'worker-assigned', 'worker-assignment-updated'].includes(eventName)) {
        const eventMeta = {
          'production-stage-updated': { type: 'production-update', title: 'Production Stage Updated', priority: 'medium' },
          'worker-assigned': { type: 'worker-assignment', title: 'Worker Assigned', priority: 'medium' },
          'worker-assignment-updated': { type: 'worker-update', title: 'Worker Assignment Updated', priority: 'low' },
        };
        const meta = eventMeta[eventName];
        formatted = {
          id: data.id || `workshop-${Date.now()}`,
          type: meta.type,
          title: data.title || meta.title,
          message: data.message || 'Workshop update',
          fullContent: data.fullContent || 'No details available',
          is_read: 0,
          created_at: new Date().toISOString(),
          priority: data.priority || meta.priority,
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Flower booking events
      if (['flower-booking-created', 'flower-booking-updated', 'flower-booking-deleted'].includes(eventName)) {
        const eventMeta = {
          'flower-booking-created': { type: 'new_booking', title: 'New Flower Booking', priority: 'medium' },
          'flower-booking-updated': { type: 'booking_update', title: 'Booking Status Updated', priority: 'medium' },
          'flower-booking-deleted': { type: 'removal', title: 'Booking Cancelled', priority: 'low' },
        };
        const meta = eventMeta[eventName];
        formatted = {
          id: data.id || `flower-${Date.now()}`,
          type: meta.type,
          title: data.title || meta.title,
          message: data.message || 'Flower booking update',
          fullContent: data.fullContent || 'No details available',
          is_read: 0,
          created_at: new Date().toISOString(),
          priority: data.priority || meta.priority,
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Postmortem accessed via QR scan
      if (eventName === 'postmortem-accessed') {
        formatted = {
          id: data.id || `pm-access-${Date.now()}`,
          type: 'postmortem_results',
          title: 'Postmortem Results Accessed',
          message: data.deceasedName ? `Results accessed for ${data.deceasedName}` : 'Postmortem results accessed via QR scan',
          fullContent: `Accessed by: ${data.accessedBy || 'External User'}\nMethod: ${data.accessMethod || 'QR Code'}\nTime: ${new Date(data.accessTime || Date.now()).toLocaleString()}`,
          is_read: 0,
          created_at: data.accessTime || new Date().toISOString(),
          priority: data.priority || 'medium',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
        return;
      }

      // Mapped events
      const meta = eventTypeMap[eventName];
      if (meta) {
        formatted = {
          id: data.id || Date.now(),
          type: meta.type,
          title: data.title || meta.title,
          message: data.message || `New event: ${meta.title}`,
          fullContent: data.fullContent || data.details || data.message || '',
          is_read: 0,
          created_at: data.timestamp || new Date().toISOString(),
          priority: data.priority || meta.priority || 'low',
          data,
        };
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
      }
    };

    const notificationEvents = [
      'notification:deceased-admitted', 'notification:status-change',
      'notification:release-requested', 'notification:invoice-created',
      'notification:payment-received', 'alert:invoice-overdue',
      'alert:low-stock', 'notification:coffin-used',
      'notification:body-released', 'notification:postmortem-completed',
      'notification:postmortem-results-ready',
      'notification:hearse-booking-created', 'notification:hearse-booking-updated', 'notification:hearse-booking-postponed',
      'notification:upcoming_bookings_24h', 'notification:urgent_bookings_2h', 'notification:weekly_bookings_summary',
      'new_booking', 'booking_status_updated', 'booking_postponed',
      'hearse-booking-reminder',
      'coffin-created', 'coffin-updated', 'coffin-deleted', 'coffin-assigned',
      'coffin-booking-created', 'notification:coffin-booking-created',
      'coffin-stock-request', 'notification:coffin-stock-request',
      'production-stage-updated', 'worker-assigned', 'worker-assignment-updated',
      'flower-booking-created', 'flower-booking-updated', 'flower-booking-deleted',
      'body-released', // Direct event from body-release service
      'postmortem-accessed', // Postmortem results accessed via QR scan
    ];

    const handlers = {};
    notificationEvents.forEach(event => {
      const handler = (data) => handleNotification(event, data);
      handlers[event] = handler;
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [socket, playNotificationSound]);

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

  // ─── Helpers ───
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const diffMs = new Date() - date;
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
    const diffMs = new Date() - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

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
                notifications.map((notif) => {
                  const meta = getPriorityMeta(notif.type, notif.priority);
                  const shortTime = formatTime(notif.created_at);
                  const fullTime = formatTimeFull(notif.created_at);
                  return (
                    <div
                      key={notif.id}
                      className={`nb-item ${!notif.is_read ? 'nb-unread' : ''}`}
                      onClick={() => { if (!notif.is_read) markAsRead(notif.id); }}
                    >
                      <div className={`nb-item-icon ${meta.cls}`}>
                        {meta.icon}
                      </div>
                      <div className="nb-item-content">
                        <p className="nb-item-title">{notif.title}</p>
                        <p className="nb-item-message">{notif.message}</p>
                        <div className="nb-item-meta">
                          <span>{fullTime}</span>
                          <span className="nb-dot" />
                          <span>{notif.type || 'Notification'}</span>
                        </div>
                        {notif.fullContent && (
                          <div className="nb-item-full">
                            {notif.fullContent}
                          </div>
                        )}
                      </div>
                      <div className="nb-item-right">
                        <span className="nb-item-time">{shortTime}</span>
                      </div>

                      {/* Hover actions */}
                      <div className="nb-actions">
                        <button
                          className="nb-action-btn"
                          title="Dismiss"
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationBell;