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

const NOTIFICATION_SERVICE = '/notification';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const dropdownRef = useRef(null);
  const audioRef = useRef(null);
  const { socket } = useSocket();

  // ─── Audio ───
  const playNotificationSound = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch {}
  }, []);

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

  // ─── Toast Management ───
  const addToast = useCallback((notification) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...notification, toastId: id }]);
    playNotificationSound();
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.toastId !== id));
    }, 6000);
  }, [playNotificationSound]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.toastId !== id));
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
    // Fetch notifications immediately and on interval
    console.log('[NotificationBell] Initial fetch');
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fetch notifications when socket connects (in case we missed live events)
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('[NotificationBell] Socket connected, fetching notifications');
      fetchNotifications();
    };

    socket.on('connect', handleConnect);
    socket.on('reconnect', handleConnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('reconnect', handleConnect);
    };
  }, [socket, fetchNotifications]);

  // Log socket connection status for debugging
  useEffect(() => {
    if (!socket) {
      console.warn('[NotificationBell] Socket not available - notifications will only work via polling');
      return;
    }

    const logConnection = () => {
      console.log('[NotificationBell] Socket status:', {
        connected: socket.connected,
        id: socket.id,
        hasListeners: socket.hasListeners('notification:body-released')
      });
    };

    logConnection();
    const interval = setInterval(logConnection, 10000); // Log every 10 seconds
    return () => clearInterval(interval);
  }, [socket]);

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

      // Raw hearse events
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
        addToast(formatted);
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
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
        addToast(formatted);
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
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
        addToast(formatted);
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
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
        addToast(formatted);
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
        return;
      }

      // Hearse booking reminder
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
        addToast(formatted);
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
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
        addToast(formatted);
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
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
        addToast(formatted);
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
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
        addToast(formatted);
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
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
        addToast(formatted);
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
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
        addToast(formatted);
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
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
        addToast(formatted);
        setNotifications(prev => [formatted, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    };

    const notificationEvents = [
      'notification:deceased-admitted', 'notification:status-change',
      'notification:release-requested', 'notification:invoice-created',
      'notification:payment-received', 'alert:invoice-overdue',
      'alert:low-stock', 'notification:coffin-used',
      'notification:body-released', 'notification:postmortem-completed',
      'notification:postmortem-results-ready',
      'new_booking', 'booking_status_updated', 'booking_postponed',
      'hearse-booking-reminder',
      'coffin-created', 'coffin-updated', 'coffin-deleted', 'coffin-assigned',
      'production-stage-updated', 'worker-assigned', 'worker-assignment-updated',
      'flower-booking-created', 'flower-booking-updated', 'flower-booking-deleted',
      'body-released', // Direct event from body-release service
      'postmortem-accessed', // Postmortem results accessed via QR scan
    ];

    console.log('[NotificationBell] Setting up listeners for', notificationEvents.length, 'events');

    const handlers = {};
    notificationEvents.forEach(event => {
      const handler = (data) => handleNotification(event, data);
      handlers[event] = handler;
      socket.on(event, handler);
    });

    console.log('[NotificationBell] All socket listeners registered');

    return () => {
      console.log('[NotificationBell] Cleaning up socket listeners');
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [socket, addToast]);

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

      {/* ─── Real-Time Toast Popups ─── */}
      <div className="nb-toast-container">
        {toasts.map((toast) => {
          const meta = getPriorityMeta(toast.type, toast.priority);
          return (
            <div key={toast.toastId} className="nb-toast" onClick={() => removeToast(toast.toastId)}>
              <div className={`nb-toast-icon ${meta.cls}`}>
                {meta.icon}
              </div>
              <div className="nb-toast-content">
                <p className="nb-toast-title">{toast.title}</p>
                <p className="nb-toast-message">{toast.message}</p>
                <span className="nb-toast-time"><Clock size={10} /> {formatTimeFull(toast.created_at)}</span>
              </div>
              <button className="nb-toast-close" onClick={(e) => { e.stopPropagation(); removeToast(toast.toastId); }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ─── Bell & Glass Dropdown ─── */}
      <div className="nb-container" ref={dropdownRef}>
        <button
          className={`nb-bell-btn ${isOpen ? 'nb-active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="nb-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        <div className={`nb-dropdown ${isOpen ? 'nb-open' : ''}`}>
          <div className="nb-panel">
            {/* Simple Header */}
            <div className="nb-header">
              <h3 className="nb-title">Notifications</h3>
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