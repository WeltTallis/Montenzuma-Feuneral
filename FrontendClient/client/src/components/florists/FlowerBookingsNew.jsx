import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { getBranchSlug, getBranchId, getBranches, getTenantId } from '../../utils/globalAuth';
import ReusableCalendar from '../../utils/calender/calender';
import { useSocket } from '../../utils/context/socketContext'
import api from '../../api/axios'
import { Flower2, MapPin, User, Calendar, Clock, ChevronLeft, ChevronRight, X, Check, Truck, Home, Package, AlertTriangle } from '../../utils/icons/icons';
import { toDateKey, todayKey, parseDate as parseUtilDate } from '../../utils/dates/parseDates';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Flower orders have exactly TWO statuses — nothing else.
const STATUS_FLOW = ['booked', 'completed'];

const STATUS_LABELS = {
  booked: 'Booked',
  completed: 'Completed',
  // Older rows may still carry these — they simply display as Booked
  pending: 'Booked',
  sourced: 'Booked',
  preparing: 'Booked',
  confirmed: 'Booked',
  transit: 'Booked'
};
// Normalise ANY historical status onto the two-value flow
const normStatus = s => {
  const v = String(s || '').toLowerCase();
  if (v === 'completed') return 'completed';
  if (v === 'cancelled') return 'cancelled';
  return 'booked';
};

const STATUS_DESC = {
  pending: 'We have received your order details.',
  sourced: 'Florist has prepared the arrangement.',
  transit: 'The delivery is en route to the funeral home.',
  completed: 'Successfully delivered to the specified location.'
};

// Distinct card tint per order status — exactly TWO statuses for flowers
const STATUS_CARD_STYLES = {
  booked: { bg: '#EFF1F3', border: '#EFF1F3' },      // soft amber
  pending: { bg: '#EFF1F3', border: '#EFF1F3' },     // legacy aliases → Booked
  sourced: { bg: '#FDF4E3', border: '#F0DDB0' },
  preparing: { bg: '#FDF4E3', border: '#F0DDB0' },
  confirmed: { bg: '#FDF4E3', border: '#F0DDB0' },
  transit: { bg: '#FDF4E3', border: '#F0DDB0' },
  completed: { bg: '#FFCCD5', border: '#E3E0D9' },   // muted neutral
  cancelled: { bg: '#FFCCD5', border: '#F0CDCB' },   // soft red
};

const pad = n => String(n).padStart(2, '0');
// Delegate to the central date utility — no UTC shift, one format app-wide
const fmtDateStr = d => toDateKey(d) || '';
const parseDate = s => { const d = new Date(s); return isNaN(d) ? null : d; };
const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
const fmtTime = s => {
  if (!s) return '';
  const raw = String(s).trim();
  // Raw HH:mm / HH:mm:ss strings (as stored in TIME columns) can't be parsed
  // by new Date() — handle them directly to avoid "Invalid Date".
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(raw);
  if (m) {
    let h = parseInt(m[1], 10);
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m[2]} ${ap}`;
  }
  const d = new Date(raw);
  return isNaN(d) ? '' : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};
const fmtDateTime = s => s ? new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
const fmtDateOnly = s => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
// Normalise a JSON/array field (types, colors, sizes…) into a plain array —
// older rows may store them as JSON strings.
const asList = v => {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string' && v.trim()) {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p.filter(Boolean) : [p];
    } catch { return v.split(',').map(s => s.trim()).filter(Boolean); }
  }
  return [];
};
// Normalise ANY date-ish value (DATE, DATETIME, ISO, Date obj) → 'YYYY-MM-DD'
// via the central util — handles naive datetimes & instants without shifting.
const toDateOnly = v => toDateKey(v);
// Parse an order's flower-type line items. Priority:
//   1) `arrangements` JSON column (new backend)
//   2) [TYPES:a|b|c] token embedded in notes (works on ANY backend version)
//   3) legacy single flower_type
const parseLineItems = (b) => {
  let arr = null;
  try {
    arr = typeof b?.arrangements === 'string' ? JSON.parse(b.arrangements) : b?.arrangements;
  } catch { arr = null; }
  if (Array.isArray(arr) && arr.length > 0) {
    return arr.filter(Boolean).map(x =>
      typeof x === 'string' ? { name: x } : { name: x.name || x.title || 'Flower', arrangement_id: x.arrangement_id ?? null }
    );
  }
  const tok = /\[TYPES:([^\]]+)\]/i.exec(String(b?.notes || ''));
  if (tok) {
    return tok[1].split('|').map(s => s.trim()).filter(Boolean).map(name => ({ name }));
  }
  return [{ name: b?.flower_type || 'Custom Arrangement', arrangement_id: b?.arrangement_id || null }];
};
// The EXACT date/time the user picked rides back inside notes as
// [WHEN:YYYY-MM-DD HH:mm] — immune to server-side timezone conversions that
// otherwise shift bookings a day forward/backward between write and read.
const parseWhen = (b) => {
  const m = /\[WHEN\s*:\s*(\d{4}-\d{2}-\d{2})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?\s*\]/i.exec(String(b?.notes || ''));
  if (m) return { date: m[1], time: m[2] ? toTimeOnly(m[2]) : '' };
  return { date: null, time: '' };
};
const toTimeOnly = v => {
  const d = parseUtilDate(v);
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
};

// Resolve a branch name from a branch reference (id, slug, or name).
// Used to convert the raw branch_id stored on bookings back to a
// human-readable branch name. If no argument is given it returns the
// name of the branch the logged-in user belongs to.
const resolveBranchName = (branchRef) => {
  const branches = getBranches();

  // No argument → resolve the current user's own branch.
  if (!branchRef) {
    const slug = getBranchSlug();
    const bid = getBranchId();
    const match = branches.find(b =>
      (b.branchSlug || b.branch_slug) === slug ||
      String(b.branchId || b.branch_id) === String(bid || '')
    );
    return (match && (match.branchName || match.branch_name)) || slug || '';
  }

  // Caller passed an explicit branch reference — resolve it to a name.
  const ref = String(branchRef);

  // 1) It's already a plain name (not a UUID/slug).
  if (branches.find(b => (b.branchName || b.branch_name || b.name) === branchRef)) {
    return branchRef;
  }

  // 2) Match against branch id or slug.
  const match = branches.find(b =>
    String(b.branchId || b.branch_id || b.id) === ref ||
    String(b.branchSlug || b.branch_slug) === ref
  );
  if (match) {
    return match.branchName || match.branch_name || match.name || branchRef;
  }

  // 3) Fallback — return the original value (it may already be a name).
  return branchRef;
};

// Convert a raw DB booking_id (usually a UUID) into a short, readable code
// like:  BK-M-Kariuki-20250815-A3F9K
// so users can recognise it in toasts, detail crumbs, etc.
const shortBookingCode = (b) => {
  if (!b || !b.booking_id) return '—';
  if (b.booking_code) return b.booking_code; // already provided by backend

  const parts = [];
  if (b.branch && typeof b.branch === 'string' && b.branch.length >= 1) {
    parts.push(b.branch.charAt(0).toUpperCase());
  } else if (b.deceased_name) {
    parts.push(b.deceased_name.charAt(0).toUpperCase());
  }
  if (b.deceased_name) {
    parts.push(b.deceased_name.replace(/\s+/g, '').slice(0, 12));
  }
  const d = parseDate(b.date || b.delivery_date);
  if (d) {
    parts.push(fmtDateStr(d)); // YYYYMMDD
  }
  // 5-char random suffix
  parts.push(Math.random().toString(36).slice(2, 7).toUpperCase());
  return `BK-${parts.join('-')}`;
};

// Real logged-in username straight from localStorage (`user` is written at
// login with { username, fullName, email, ... }). Used to auto-fill the
// "Booked By" field instead of asking the user to type their own name.
const getLocalUserName = () => {
  try {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    const u = raw ? JSON.parse(raw) : {};
    return u?.fullName || u?.full_name || u?.username || u?.name || u?.email || '';
  } catch { return ''; }
};

const FlowerBookingsNew = () => {
  const { socket, connected } = useSocket()
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  // Deep-link support: ?view=samples opens this page straight on the uploaded
  // arrangements grid. LEGACY — the ReceptionPortal's "Flower Arrangements" tile
  // now links to the standalone user-facing gallery at
  // /tenant/<slug>/flower-samples (florists/Samples.jsx). This param is kept
  // only so older bookmarks / cached builds still land somewhere sensible.
  const [view, setView] = useState(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    return v === 'samples' ? 'samples' : 'list';
  });
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [newBooking, setNewBooking] = useState({
    flower_details: '',     // EVERY detail typed by hand — no preset selections
    ribbon: '',             // ribbon colour chosen for this order
    size: '',               // flower size chosen for this order
    remarks: '',            // special remarks / instructions
    deceased_name: '',
    booked_by: getLocalUserName(),
    date: fmtDateStr(new Date()),   // Expected By — required so calendar tracks every order
    time: '10:00',
    priority: 'Normal'
  });
  const [toasts, setToasts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Upload-in-flight flag — multi-image phone photos can take a while; without
  // this the Create button looks idle, users click again, and the parallel
  // requests race (or the aborted first request still lands as a duplicate).
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  const [arrangements, setArrangements] = useState([]);
  // Guards against double-click / double-submit creating duplicate orders
  const [placingOrder, setPlacingOrder] = useState(false);
  const placingRef = useRef(false);
  // Auto-scrolls the mobile date strip so today's chip is in view
  const stripRef = useRef(null);

  const loadArrangements = useCallback(async () => {
    try {
      // Explicit tenant scoping — the florist service filters flower_samples by
      // the x-tenant-id header (also sent) and the tenant_id query param.

      const res = await api.get('/florist/flower-samples/', {
        params: { tenant_id: getTenantId() || undefined },
      });
      setArrangements(res.data.data || []);
    } catch (e) {
      console.error('Failed to load arrangements:', e);
    }
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message: msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {

      // TENANT-WIDE fetch: scoped by tenant id ONLY (never branch), so ALL
      // flower bookings from every branch appear together in this one space.

      const res = await api.get('/florist/bookings', {
        params: { tenant_id: getTenantId() || undefined },
      });
      setBookings(res.data.data || []);
    } catch (e) {
      console.error('[FlowerBookings] Failed to load bookings:', e?.response?.status, e?.response?.data || e.message);
      showToast(e.friendlyMessage || 'Failed to load bookings', 'error');
    }
    setLoading(false);
  }, [showToast]);

  // Real-time socket listeners for flower bookings
  useEffect(() => {
    if (!socket || !connected) return;

    console.log('[FlowerBookings] Setting up real-time listeners');

    const handleNewBooking = (data) => {
      console.log('[FlowerBookings] New booking received:', data);
      showToast(`New booking: ${data.flowerType || 'Flower booking'} for ${data.deceasedName || 'customer'}`, 'success');
      loadBookings();
    };

    const handleBookingUpdated = (data) => {
      console.log('[FlowerBookings] Booking updated:', data);
      showToast(`Booking ${data.bookingId} status changed to ${data.status}`, 'info');
      loadBookings();
    };

    const handleBookingDeleted = (data) => {
      console.log('[FlowerBookings] Booking deleted:', data);
      showToast(`Booking ${data.bookingId} has been cancelled`, 'error');
      loadBookings();
    };

    socket.on('notification:flower-booking-created', handleNewBooking);
    socket.on('notification:flower-booking-updated', handleBookingUpdated);
    socket.on('notification:flower-booking-deleted', handleBookingDeleted);

    return () => {
      console.log('[FlowerBookings] Cleaning up socket listeners');
      socket.off('notification:flower-booking-created', handleNewBooking);
      socket.off('notification:flower-booking-updated', handleBookingUpdated);
      socket.off('notification:flower-booking-deleted', handleBookingDeleted);
    };
  }, [socket, connected, showToast, loadBookings]);

  useEffect(() => {
    loadArrangements();
    loadBookings();
  }, [loadBookings, loadArrangements]);

  // Auto-scroll the mobile date strip so today's chip is centred in view
  useEffect(() => {
    if (view !== 'list') return;
    const t = setTimeout(() => {
      const el = stripRef.current?.querySelector('[data-today="1"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 80);
    return () => clearTimeout(t);
  }, [view, calDate]);

  // The API returns the expected date in `date` (older rows may carry it as
  // `delivery_date`, sometimes as a full DATETIME) — always normalise to a
  // clean YYYY-MM-DD key so list, cards and calendar agree. The [WHEN:…]
  // token stamped at booking time wins over anything the server shifted.
  const bookingDateKey = (b) => parseWhen(b).date || toDateOnly(b?.delivery_date || b?.date);

  const getEventsForDate = useCallback((dateStr) => {
    // Full Calendar: an order appears under the day it was BOOKED (created),
    // never under its Expected-By delivery deadline.
    return bookings.filter(b => (toDateOnly(b?.created_at) || bookingDateKey(b)) === dateStr);
  }, [bookings]);

  const getBookingDotColor = (b) => {
    switch (normStatus(b.status)) {
      case 'completed': return '#059669';
      case 'cancelled': return '#dc2626';
      default: return '#d97706';   // Booked / any pre-completion state
    }
  };

  const calendarItems = useMemo(() => {
    // Full Calendar places each order on the day it was BOOKED (created) —
    // never on its Expected-By delivery deadline.
    return bookings.map(b => ({
      ...b,
      _calDate: toDateOnly(b?.created_at) || bookingDateKey(b),
    }));
  }, [bookings]);

  // Order-count per date — powers the mini-calendar dots & mobile date strip
  const evCountByDate = useMemo(() => {
    const m = {};
    bookings.forEach(b => {
      const k = bookingDateKey(b);
      if (k) m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [bookings]);

  const calNav = useCallback((dir) => {
    const d = new Date(calDate.getTime());
    d.setMonth(d.getMonth() + dir);
    setCalDate(d);
  }, [calDate]);

  const calToday = useCallback(() => {
    setCalDate(new Date());
    setSelectedDate(todayKey());
  }, []);

  const openDayList = useCallback((dateStr) => {
    setSelectedDate(dateStr);
    setActiveBookingId(null);
    setView('list');
  }, []);

  const viewBooking = useCallback((id) => {
    setActiveBookingId(id);
    setView('detail');
  }, []);

  const backToList = useCallback(() => {
    setActiveBookingId(null);
    setView('list');
  }, []);

  const openNewBookingForm = useCallback((dateStr) => {
    setNewBooking(prev => ({ ...prev, date: dateStr || fmtDateStr(new Date()) }));
    setView('new');
  }, []);

  const submitBooking = useCallback(async (e) => {
    e.preventDefault();
    // Re-entry guard — a double-click must NEVER place the order twice
    if (placingRef.current) return;
    if (!newBooking.deceased_name?.trim()) return showToast('Please enter the deceased name', 'error');
    if (!newBooking.date || !newBooking.time) return showToast('Expected By date and time are required', 'error');
    placingRef.current = true;
    setPlacingOrder(true);

    // Everything is typed by hand — split the details into individual flower
    // types on commas / new lines. No picking from preset arrangements.
    const typedTypes = String(newBooking.flower_details || '')
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (typedTypes.length === 0) return showToast('Please type the flower details (e.g. CASKET SPRAY, MUM WREATH)', 'error');
    const items = typedTypes.map(name => ({ arrangement_id: null, name }));

    try {
      // ONE row = ONE order containing ALL its flower types. The full list is
      // stored as JSON in the `arrangements` column; ribbon gets its dedicated
      const clean = s => String(s || '').replace(/\|/g, '/').replace(/[[\]]/g, '').trim();
      // [TYPES:…] keeps every flower name · [WHEN:…] pins the exact chosen
      // date+time so server timezone handling can never shift it a day.
      const notesValue = [
        `[TYPES:${items.map(i => clean(i.name)).join('|')}]`,
        `[WHEN:${newBooking.date} ${newBooking.time}]`,
        newBooking.size?.trim() ? `Size: ${newBooking.size.trim()}` : '',
        newBooking.priority?.trim() ? `Priority: ${newBooking.priority.trim()}` : '',
        newBooking.remarks?.trim() || ''
      ].filter(Boolean).join(' ');
      await api.post('/florist/bookings', {
        arrangement_name: items[0].name.slice(0, 255),
        arrangement_id: null,
        flower_type: items[0].name.slice(0, 255),
        flower_description: String(newBooking.flower_details || '').trim(),
        arrangements: items,
        ribbon_color: newBooking.ribbon?.trim() || null,
        size: newBooking.size?.trim() || null,
        deceased_name: newBooking.deceased_name.trim(),
        booked_by: newBooking.booked_by || getLocalUserName() || 'System',
        branch: resolveBranchName() || undefined,
        funeral_home: resolveBranchName() || undefined,
        date: newBooking.date,
        time: newBooking.time,
        priority: newBooking.priority,
        notes: notesValue.trim() || null
      });

      showToast(items.length > 1 ? `${items.length} flower orders placed!` : 'Booking placed successfully!');
      await loadBookings();
      setView('list');
      setNewBooking({
        flower_details: '',
        ribbon: '',
        size: '',
        remarks: '',
        deceased_name: '',
        booked_by: getLocalUserName(),
        date: fmtDateStr(new Date()),
        time: '10:00',
        priority: 'Normal'
      });
    } catch (e) {
      console.error('[FlowerBookings] Place order FAILED:', e?.response?.status, e?.response?.data || e.message);
      showToast(e.response?.data?.message || e.friendlyMessage || 'Failed to create booking', 'error');
    } finally {
      placingRef.current = false;
      setPlacingOrder(false);
    }
  }, [newBooking, showToast, loadBookings]);

  const updateStatus = useCallback(async (id, nextStatus) => {
    const url = `/florist/bookings/${id}/status`;
    console.info(`[FlowerBookings] PATCH ${url} →`, nextStatus);
    try {
      await api.patch(url, { status: nextStatus });
      showToast(`Status updated to ${STATUS_LABELS[nextStatus] || nextStatus}`);
      await loadBookings();
    } catch (e) {
      // Full diagnostics in the console so failures are never silent
      console.error('[FlowerBookings] Status update FAILED:', {
        url,
        nextStatus,
        httpStatus: e?.response?.status,
        serverSaid: e?.response?.data,
        message: e?.message
      });
      showToast(
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.friendlyMessage ||
        `Failed to update status${e?.response ? ` (HTTP ${e.response.status})` : ''}`,
        'error'
      );
    }
  }, [showToast, loadBookings]);

  const handleCreateArrangement = async (e) => {
    e.preventDefault();
    // Guard against double clicks while an upload is in flight
    if (creatingRef.current) return;
    const form = e.target;
    const fd = new FormData(form);

    // Build the payload explicitly with trimmed values so a spaces-only input
    // can't slip past HTML validation and trip the server's non-empty checks.
    const title = String(fd.get('title') || '').trim();
    const description = String(fd.get('description') || '').trim();
    const types = String(fd.get('types') || '').trim();
    const colors = String(fd.get('colors') || '').trim();
    const sizes = String(fd.get('sizes') || '').trim();

    // Client-side validation with SPECIFIC messages — the backend's 400s
    // ("Missing required fields…", "Types must be a non-empty array") would
    // otherwise be swallowed by the generic catch toast below. Whitespace-only
    // or comma-only values pass HTML `required` but produce empty arrays
    // server-side, so trim and check everything here.
    if (!title) return showToast('Please enter an arrangement title', 'error');
    if (!description) return showToast('Please enter a description', 'error');
    if (!types) return showToast('Please enter at least one flower type (comma-separated)', 'error');
    if (!colors) return showToast('Please enter at least one color (comma-separated)', 'error');
    if (!sizes) return showToast('Please enter at least one size (comma-separated)', 'error');

    const payload = new FormData();
    payload.append('title', title);
    payload.append('description', description);
    payload.append('types', types);
    payload.append('colors', colors);
    payload.append('sizes', sizes);
    const files = fd.getAll('images').filter(f => f && f.size > 0);
    files.forEach(f => payload.append('images', f));

    creatingRef.current = true;
    setCreating(true);
    try {
      // NOTE: explicitly null the Content-Type so the BROWSER generates the
      // multipart boundary itself. Hand-setting 'multipart/form-data' (the
      // old code) sent the body WITHOUT a boundary= parameter → multer failed
      // with 400 "Multipart: Boundary not found" every single time. Passing
      // null also overrides the api instance's default 'application/json',
      // which would otherwise make axios JSON-serialize the FormData (files
      // lost, no multipart at all).
      //
      // The per-request timeout override matters just as much: the global
      // axios timeout is 30s, and a set of full-quality phone photos on a slow
      // uplink routinely takes longer. Without this, axios aborted the request
      // client-side (error toast) while the server still finished creating the
      // record — the classic "first try fails, retry works" + duplicates bug.
      // Images are uploaded at ORIGINAL quality — no client-side compression.
      const res = await api.post('/florist/flower-samples', payload, {
        headers: { 'Content-Type': null },
        timeout: 180000,
      });

      const data = res.data;
      if (data.success) {
        showToast('Arrangement created successfully!');
        setShowCreateModal(false);
        form.reset();
        // Refresh the list IN PLACE — no page reload. The new sample appears
        // immediately in whichever view (bookings/samples) is active.
        await loadArrangements();
      } else {
        showToast(data.message || 'Failed to create arrangement', 'error');
      }
    } catch (err) {
      console.error('[FlowerBookings] Create arrangement FAILED:', {
        status: err?.response?.status,
        serverSaid: err?.response?.data,
        message: err?.message
      });
      // Surface the server's actual validation message (e.g. "Types must be a
      // non-empty array") instead of hiding it behind a generic toast.
      showToast(
        err.response?.data?.message ||
        err.friendlyMessage ||
        'Failed to create arrangement',
        'error'
      );
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  };

  const renderToolbar = () => {
    const d = calDate;
    return (
      <div className="flx-toolbar" style={styles.toolbar}>
        <div className="flx-nav" style={styles.nav}>
          <div style={styles.title}>
            <button style={styles.arrowBtn} onClick={() => calNav(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            {MONTHS[d.getMonth()]} {d.getFullYear()}
            <button style={styles.arrowBtn} onClick={() => calNav(1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
          <button style={styles.todayBtn} onClick={calToday}>Today</button>
        </div>
        <div className="flx-toggle" style={styles.viewToggle}>
          <button style={styles.viewBtn(view === 'list')} onClick={() => setView('list')}>List</button>
          <button style={styles.viewBtn(view === 'calendar')} onClick={() => setView('calendar')}>Calendar</button>
          <button style={styles.viewBtn(view === 'samples')} onClick={() => setView('samples')}>Samples</button>
        </div>
        <div className="flx-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            style={{
              ...styles.placeBookingBtn,
              background: '#475A43',
              boxShadow: 'none'
            }}
            onClick={() => setShowCreateModal(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Create Arrangement
          </button>
          <button style={styles.placeBookingBtn} onClick={() => openNewBookingForm('')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Place Booking
          </button>
        </div>
      </div>
    );
  };

  const renderList = () => {
    // Group orders by their "Expected By" date (normalised key). Orders without
    // a deadline land in the "Awaiting Date" group at the end.
    const sorted = [...bookings].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : Infinity;
      const db = b.date ? new Date(b.date).getTime() : Infinity;
      return da - db;
    });
    const groups = {};
    sorted.forEach(b => {
      const key = bookingDateKey(b) || 'unscheduled';
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });

    // A tapped mini-calendar / strip date narrows the feed to that day only
    let entries = Object.entries(groups);
    if (selectedDate) entries = entries.filter(([date]) => date === selectedDate);

    if (entries.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9C9389' }}>
          <Flower2 size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#574F47', marginBottom: '6px' }}>
            {selectedDate ? `Nothing on ${fmtDateOnly(selectedDate)}` : 'No bookings yet'}
          </h3>
          <p style={{ fontSize: '14px' }}>
            {selectedDate ? 'Pick another date, or view every order.' : 'Click "Place Booking" to create your first one.'}
          </p>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              style={{
                marginTop: '14px', padding: '8px 16px', borderRadius: 0,
                border: '1px solid #E3DFD8', background: '#fff', cursor: 'pointer',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: '#574F47'
              }}
            >
              Show All Dates
            </button>
          )}
        </div>
      );
    }

    return (
      <>
        {selectedDate && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '10px', background: '#f0f7f4', border: '1px solid #CBE0D4',
            padding: '10px 14px', borderRadius: 0, marginBottom: '18px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#2F4F3E' }}>
              Filtered · {fmtDateOnly(selectedDate)}
            </span>
            <button
              onClick={() => setSelectedDate(null)}
              style={{ background: 'none', border: 'none', color: '#2F4F3E', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}
            >
              Clear ✕
            </button>
          </div>
        )}
        {entries.map(([date, dayBookings]) => {
          const dateObj = date === 'unscheduled' ? null : new Date(date + 'T00:00:00');
          return (
            <div key={date} style={{ marginBottom: '32px' }}>
              <div style={styles.feedDateHeader}>
                <Calendar size={14} />
                {dateObj
                  ? dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : 'No Expected Date Yet'}
              </div>
              {dayBookings.map(bk => renderBookingCard(bk))}
            </div>
          );
        })}
      </>
    );
  };

  /* ── Mini calendar rail (desktop) ── compact month grid beside the list ── */
  const renderMiniCalendar = () => {
    const d = calDate;
    const y = d.getFullYear(), mo = d.getMonth();
    const first = new Date(y, mo, 1);
    const startOff = (first.getDay() + 6) % 7;
    const days = [];
    for (let i = 0; i < 42; i++) days.push(addDays(first, -startOff + i));
    const todayStr = todayKey();

    return (
      <div>
        <div style={styles.mcHead}>
          <strong style={styles.mcTitle}>{MONTHS[mo].slice(0, 3)} {y}</strong>
          <div style={styles.mcNav}>
            <button style={styles.arrowBtn} onClick={() => calNav(-1)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button style={styles.arrowBtn} onClick={() => calNav(1)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        </div>
        <div style={styles.mcWkRow}>
          {WEEKDAYS.map(w => <span key={w} style={styles.mcWk}>{w}</span>)}
        </div>
        <div style={styles.mcGrid}>
          {days.map(day => {
            const ds = fmtDateStr(day);
            const out = day.getMonth() !== mo;
            const cnt = evCountByDate[ds] || 0;
            const sel = selectedDate === ds;
            const isT = ds === todayStr;
            const cell = { ...styles.mcCell };
            if (out && !sel) cell.color = '#D8D2C8';
            if (cnt > 0 && !sel) cell.background = '#f0f7f4';
            if (isT && !sel) { cell.borderColor = '#2F4F3E'; cell.color = '#2F4F3E'; }
            if (sel) { cell.background = '#2F4F3E'; cell.color = '#fff'; cell.borderColor = '#2F4F3E'; }
            return (
              <button
                key={ds}
                type="button"
                title={`${ds}${cnt ? ` · ${cnt} order${cnt > 1 ? 's' : ''}` : ''}`}
                onClick={() => setSelectedDate(sel ? null : ds)}
                style={cell}
              >
                {day.getDate()}
                {cnt > 0 && !sel && <span style={styles.mcDot} />}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: '10px', fontSize: '10px', color: '#9C9389', letterSpacing: '0.04em' }}>
          Tap a date to filter the list
        </div>
      </div>
    );
  };

  /* ── Horizontal date strip (phones) ── ALWAYS starts at the current date ── */
  const renderDateStrip = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const strip = [];
    for (let i = 0; i < 45; i++) strip.push(addDays(start, i));
    // Today's key comes from the central date utility (no UTC shift)
    const todayStr = todayKey();
    return (
      <div className="flx-strip" ref={stripRef}>
        {strip.map(day => {
          const ds = fmtDateStr(day);
          const cnt = evCountByDate[ds] || 0;
          const sel = selectedDate === ds;
          const isT = ds === todayStr;
          const chip = { ...styles.stripDay };
          if (isT) { chip.borderColor = '#2F4F3E'; }
          if (sel) { chip.background = '#2F4F3E'; chip.color = '#fff'; chip.borderColor = '#2F4F3E'; }
          return (
            <button
              key={ds}
              type="button"
              data-today={isT ? '1' : undefined}
              onClick={() => setSelectedDate(sel ? null : ds)}
              style={chip}
            >
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: sel ? 0.85 : 0.6 }}>
                {WEEKDAYS[(day.getDay() + 6) % 7]}
              </span>
              <span style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1 }}>{day.getDate()}</span>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: cnt > 0 ? (sel ? '#fff' : getBookingDotColor({ status: bookings.find(x => bookingDateKey(x) === ds)?.status })) : 'transparent'
              }} />
            </button>
          );
        })}
      </div>
    );
  };

  const renderBookingCard = (b) => {
    const lineItems = parseLineItems(b);
    const firstName = lineItems[0]?.name || b.flower_type || '';
    // Match the arrangement ONLY by exact title — never fall back to a random
    // sample. Custom-typed orders (e.g. "CASKET SPRAY") must show their own
    // typed name, not some unrelated arrangement's data.
    const matchedSample = arrangements.find(a => a.title === firstName);
    const product = matchedSample || {
      title: firstName || 'Custom Arrangement',
      images: [],
      types: [],
      colors: [],
      sizes: []
    };
    const statusCfg = STATUS_FLOW.indexOf(normStatus(b.status)) >= 0 ? { label: STATUS_LABELS[normStatus(b.status)] || b.status, color: '#2F4F3E', bg: '#f0f7f4' } : { label: b.status, color: '#64748b', bg: '#f1f5f9' };

    // ── Expected By deadline ── (the [WHEN:…] stamp beats server-side shifts)
    const when = parseWhen(b);
    const dateKey = when.date || bookingDateKey(b);
    const timeVal = when.time || toTimeOnly(b.time || b.delivery_time);
    const expectedTs = dateKey ? new Date(`${dateKey}T${timeVal || '00:00'}:00`).getTime() : null;
    const isDone = b.status === 'completed';
    const overdue = expectedTs && !isDone && expectedTs < Date.now();

    // ── Card background by status ──
    // Every order status gets its own distinct tint so the list can be read
    // at a glance without opening a single card.
    const cardStyle = STATUS_CARD_STYLES[b.status] || { bg: '#fff', border: '#EAE7E2' };
    let cardBg = cardStyle.bg;
    let cardBorder = cardStyle.border;

    return (
      <div
        className="fb-card"
        style={{
          ...styles.bookingCard,
          background: cardBg,
          borderColor: cardBorder,
        }}
        onClick={() => viewBooking(b.id)}
      >
        <div className="fb-card-thumb" style={styles.mediaThumb}>
          {product.images?.length > 0 ? (
            <img
              src={product.images[0]?.url || product.images[0]}
              alt={product.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={styles.mediaThumbPlaceholder}>{product.title?.charAt(0) || 'F'}</div>
          )}
        </div>
        <div style={styles.bookingInfo}>
          <div className="fb-booking-name" style={styles.bookingName}>
            {product.title}{lineItems.length > 1 ? ` +${lineItems.length - 1} more` : ''}
          </div>
          <div className="fb-card-meta" style={styles.bookingMeta}>
            {lineItems.length > 1 && (
              <div style={styles.metaRow}>Flowers: {lineItems.map(i => i.name).join(' · ')}</div>
            )}
            <div style={styles.metaRow}><User size={12} /> {b.deceased_name}</div>
            <div style={styles.metaRow}><User size={12} /> Booked by {b.booked_by || b.customer}</div>
            <div style={styles.metaRow}><Home size={12} /> Flowers from: {resolveBranchName(b.branch) || resolveBranchName(b.funeral_home) || 'Not specified'}</div>
          </div>
        </div>
        <div className="flx-card-right" style={styles.bookingRight}>
          <div className="flx-expected" style={{ ...styles.expectedBy, ...(overdue ? { color: '#B91C1C' } : null) }}>
            <Clock size={11} /> {dateKey
              ? `Expected by ${fmtDateOnly(dateKey)}${timeVal ? `, ${fmtTime(timeVal)}` : ''}`
              : 'No deadline set'}
            {overdue ? ' · OVERDUE' : ''}
          </div>
          <div style={styles.pillsRow}>
            <span style={{ ...styles.priorityPill, background: b.priority === 'High' ? '#FEE2E2' : b.priority === 'Low' ? '#DCFCE7' : '#F1F5F9', color: b.priority === 'High' ? '#B91C1C' : b.priority === 'Low' ? '#166534' : '#475569' }}>
              {b.priority}
            </span>
            <span style={{ ...styles.statusPill, background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    const d = calDate;
    const year = d.getFullYear(), month = d.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -startOffset);
    const days = [];
    for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));
    const todayStr = todayKey();

    return (
      <div>
        <div style={styles.calHeader}>
          <div style={styles.calTitle}>{MONTHS[month]} {year}</div>
          <div style={styles.calNav}>
            <button style={styles.calArrow} onClick={() => calNav(-1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button style={styles.calArrow} onClick={() => calNav(1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        </div>
        <div style={styles.calWeekdays}>
          {WEEKDAYS.map(w => <div key={w} style={styles.calWeekday}>{w}</div>)}
        </div>
        <div style={styles.calDays}>
          {days.map(day => {
            const dateStr = fmtDateStr(day);
            const outside = day.getMonth() !== month;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const events = getEventsForDate(dateStr);
            const visible = events.slice(0, 2);
            const more = events.length - visible.length;

            return (
              <div
                key={dateStr}
                style={{
                  ...styles.calDay,
                  background: outside ? '#FAF9F7' : isToday ? 'linear-gradient(180deg,rgba(47,79,62,.05),#fff 40%)' : '#fff',
                  border: `1px solid ${isToday ? '#2F4F3E' : '#EAE7E2'}`,
                  opacity: outside ? 0.5 : 1,
                }}
                onClick={() => openDayList(dateStr)}
              >
                <div style={styles.calDayNum}>
                  <span style={isToday ? styles.todayNum : {}}>{day.getDate()}</span>
                </div>
                {visible.map(b => {
                  // Exact name only — never substitute another arrangement
                  const matchedSample = arrangements.find(a => a.title === b.flower_type);
                  const evTitle = matchedSample?.title || b.flower_type || 'Order';
                  const evColor = getBookingDotColor(b);
                  return (
                    <div key={b.id} style={{ ...styles.calEvent, background: `${evColor}1A`, color: evColor }}>
                      {b.time ? String(b.time).slice(0, 5) : ''} {evTitle.split(' ')[0]}
                    </div>
                  );
                })}
                {more > 0 && (
                  <div style={{ fontSize: '9px', color: '#9C9389', fontWeight: 700, padding: '2px 6px' }}>
                    +{more} more
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedDate && (
          <div style={styles.selectedDayPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={styles.sectionTitle}>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} Bookings</h2>
              <button style={styles.addBookingBtn} onClick={() => openNewBookingForm(selectedDate)}>
                <Check size={14} /> Add Booking
              </button>
            </div>
            {getEventsForDate(selectedDate).length === 0 ? (
              <p style={{ color: '#9C9389', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>No bookings scheduled.</p>
            ) : (
              getEventsForDate(selectedDate).map(b => renderBookingCard(b))
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSamples = () => {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={styles.sectionTitle}>Available Flower Samples</h2>
        </div>
        {arrangements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9C9389' }}>
            <Flower2 size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#574F47', marginBottom: '6px' }}>No samples uploaded</h3>
            <p style={{ fontSize: '14px' }}>Click "Create Arrangement" to upload your first sample.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '24px'
          }}>
            {arrangements.map(arrangement => (
              <div key={arrangement.arrangement_id} style={{
                background: '#fff',
                border: '1px solid #EAE7E2',
                borderRadius: '20px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <div style={{
                  width: '100%',
                  height: '180px',
                  borderRadius: '14px',
                  marginBottom: '12px',
                  overflow: 'hidden',
                  background: '#1C1A17'
                }}>
                  {arrangement.images?.length > 0 ? (
                    <img
                      src={arrangement.images[0]?.url || arrangement.images[0]}
                      alt={arrangement.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={styles.productMediaPlaceholder}>
                      {arrangement.title?.charAt(0) || 'F'}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: "'Playfair Display', serif", marginBottom: '4px' }}>
                    {arrangement.title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#9C9389', marginBottom: '12px' }}>
                    {arrangement.types?.[0] || 'Custom'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Booking is always free-text — open the blank order form
                    setView('new');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    background: '#2F4F3E',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Book This
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNewBooking = () => {
    // Shared styling tokens — mirror the Create Arrangement panel exactly
    const lbl = { display: 'block', fontSize: '9px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9C9389', marginBottom: '8px' };
    const inp = { width: '100%', padding: '12px 14px', border: '1px solid #EAE7E2', borderRadius: '8px', fontSize: '13px', fontFamily: "'DM Sans', system-ui, sans-serif", background: '#FAF9F7', color: '#1C1A17', outline: 'none' };

    return (
      <div style={styles.formContainer}>
        {/* Header — same pattern as Create Arrangement */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #EAE7E2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 600, color: '#1C1A17', margin: 0 }}>Place Flower Order</h2>
          <button
            type="button"
            onClick={() => setView('list')}
            style={{ background: 'none', border: 'none', color: '#9C9389', fontSize: '28px', cursor: 'pointer', padding: 0, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>

        <form onSubmit={submitBooking} style={{ padding: '24px 28px 40px' }}>
          {/* ── 1 · Flower Types ── */}
          <label style={{ ...lbl, marginBottom: '12px' }}>Flower Details *</label>
          <textarea
            rows={3}
            required
            style={{ ...inp, resize: 'vertical', marginBottom: '22px' }}
            placeholder="Type every detail yourself, one flower type per line or comma-separated. e.g. CASKET SPRAY, MUM WREATH, HAND HELD FLOWER"
            value={newBooking.flower_details}
            onChange={e => setNewBooking(prev => ({ ...prev, flower_details: e.target.value }))}
          />

          {/* ── 2 · Ribbon Colour ── */}
          <label style={lbl}>Ribbon Colour</label>
          <input
            type="text"
            style={{ ...inp, marginBottom: '22px' }}
            placeholder="Type the ribbon colour — e.g. ivory white, gold, deep red"
            value={newBooking.ribbon}
            onChange={e => setNewBooking(prev => ({ ...prev, ribbon: e.target.value }))}
          />

          {/* ── Flower Size ── */}
          <label style={lbl}>Flower Size</label>
          <input
            type="text"
            style={{ ...inp, marginBottom: '22px' }}
            placeholder="Type the size — e.g. Large wreath, 60cm spray, table centrepiece"
            value={newBooking.size}
            onChange={e => setNewBooking(prev => ({ ...prev, size: e.target.value }))}
          />

          {/* ── 3 · Special Remarks ── */}
          <label style={lbl}>Special Remarks</label>
          <textarea
            rows={3}
            style={{ ...inp, resize: 'vertical', marginBottom: '22px' }}
            placeholder="e.g., Add a small gold cross, deliver to the chapel entrance…"
            value={newBooking.remarks}
            onChange={e => setNewBooking(prev => ({ ...prev, remarks: e.target.value }))}
          />

          {/* ── 4 · Booking Details ── */}
          <label style={lbl}>Deceased Name *</label>
          <input
            type="text"
            style={{ ...inp, marginBottom: '16px' }}
            placeholder="Name of the deceased"
            value={newBooking.deceased_name}
            onChange={e => setNewBooking(prev => ({ ...prev, deceased_name: e.target.value }))}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>Expected By Date *</label>
              <input type="date" style={inp} value={newBooking.date} onChange={e => setNewBooking(prev => ({ ...prev, date: e.target.value }))} required />
            </div>
            <div>
              <label style={lbl}>Ready At Time *</label>
              <input type="time" style={inp} value={newBooking.time} onChange={e => setNewBooking(prev => ({ ...prev, time: e.target.value }))} required />
            </div>
          </div>

          <label style={{ ...lbl, marginTop: '6px' }}>Booked By</label>
          <input
            type="text"
            readOnly
            title="Auto-filled from your account"
            style={{ ...inp, marginBottom: '22px', color: '#574F47' }}
            value={newBooking.booked_by || getLocalUserName()}
          />

          {/* ── 5 · Priority Level ── */}
          <label style={lbl}>Priority Level</label>
          <input
            type="text"
            style={{ ...inp, marginBottom: '22px' }}
            placeholder="Type it — e.g. Normal, Urgent, needed by 10am"
            value={newBooking.priority}
            onChange={e => setNewBooking(prev => ({ ...prev, priority: e.target.value }))}
          />

          {/* Footer actions — mirrors Create Arrangement */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', marginTop: '24px', borderTop: '1px solid #EAE7E2' }}>
            <button
              type="button"
              onClick={() => setView('list')}
              style={{
                padding: '11px 20px',
                borderRadius: '8px',
                background: 'transparent',
                color: '#574F47',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: '1px solid #EAE7E2',
                cursor: 'pointer',
                fontFamily: "'DM Sans', system-ui, sans-serif"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={placingOrder}
              style={{
                padding: '11px 24px',
                borderRadius: '8px',
                background: '#475A43',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: placingOrder ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: placingOrder ? 0.65 : 1
              }}
            >
              <Check size={14} />
              {placingOrder ? 'Placing Order…' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderDetail = () => {
    const b = bookings.find(x => x.id === activeBookingId);
    if (!b) return '';
    const dKey = parseWhen(b).date || bookingDateKey(b);
    const tStr = parseWhen(b).time || toTimeOnly(b.time || b.delivery_time);
    const lineItems = parseLineItems(b);
    // Exact match only — a custom-typed type must NEVER borrow another
    // arrangement's name/photos. The booking's own fields are the truth.
    const matchedSample = arrangements.find(a => a.title === b.flower_type);
    const productName = b.flower_type || b.arrangement_name || matchedSample?.title || 'Custom Arrangement';
    const product = matchedSample || { title: productName, images: [], types: [], colors: [], sizes: [] };
    // Notes carry machine tokens ([TYPES:…], "Size: …") plus human text.
    // Strip the TYPES token FIRST — it contains '|' separators that would
    // otherwise shatter the remark parsing.
    const humanNotes = String(b.notes || '').replace(/\[TYPES:[^\]]*\]/gi, '');
    const noteParts = humanNotes.split('|').map(s => s.trim()).filter(Boolean);
    let sizeNote = '';
    const remarksList = [];
    noteParts.forEach(p => {
      const sm = /^size\s*:\s*(.+)$/i.exec(p);
      if (sm) { sizeNote = sm[1].trim(); return; }
      if (/^ribbon\s*:/i.test(p)) return;   // legacy rows only
      remarksList.push(p);
    });
    const ribbonNote = (noteParts.find(p => /^ribbon\s*:/i.test(p)) || '').replace(/^ribbon\s*:\s*/i, '');
    const ribbonVal = (b.ribbon_color && b.ribbon_color !== 'None') ? b.ribbon_color : ribbonNote;
    const colourText = [...asList(product.colors), ...(ribbonVal ? [ribbonVal] : [])].join(', ');
    const currentStatusIdx = STATUS_FLOW.indexOf(normStatus(b.status));

    let actionBtnHtml = '';
    if (normStatus(b.status) === 'cancelled') {
      actionBtnHtml = (
        <button style={styles.actionBtnOutline} disabled>
          <X size={18} style={{ color: '#ef4444' }} />
          Order Cancelled
        </button>
      );
    } else if (currentStatusIdx < STATUS_FLOW.length - 1) {
      const nextStatus = STATUS_FLOW[currentStatusIdx + 1];
      actionBtnHtml = (
        <button style={styles.actionBtn} onClick={() => updateStatus(b.id, nextStatus)}>
          {nextStatus === 'completed' ? <Home size={18} /> : <Check size={18} />}
          Mark as {STATUS_LABELS[nextStatus]}
        </button>
      );
    } else {
      actionBtnHtml = (
        <button style={styles.actionBtnOutline} disabled>
          <Check size={18} style={{ color: '#10B981' }} />
          Delivery Completed
        </button>
      );
    }

    const hasImages = product.images?.length > 0;
    return (
      <>
        <div style={styles.panelScrim} onClick={backToList} />
        <aside style={{ ...styles.formContainer, padding: 0, width: 'min(540px, 100vw)' }}>
          {/* Sticky header — Back + Close always visible */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '14px 18px', borderBottom: '1px solid #EAE7E2', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
            <button style={styles.backPill} onClick={backToList}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              Back to Orders
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={styles.detailCrumb}>{shortBookingCode(b)}</span>
              <button onClick={backToList} aria-label="Close details" style={{ background: 'none', border: 'none', color: '#9C9389', fontSize: '26px', lineHeight: 1, cursor: 'pointer', padding: 0 }}>×</button>
            </div>
          </div>
          {hasImages && (
            <div style={styles.detailHero}>
              <div style={styles.carouselTrack}>
                {product.images.map((img, idx) => (
                  <div key={idx} style={styles.carouselSlide}>
                    <img src={img.url || img} alt={product.title} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={styles.detailBody}>
            <div style={styles.chipRow}>
              <div style={styles.chipPrimary}>{shortBookingCode(b)}</div>
              <span style={{ ...styles.priorityPill, fontSize: '12px', padding: '6px 12px' }}>{b.priority} Priority</span>
            </div>

            <h2 style={styles.detailTitle}>{product.title}</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#9C9389' }}>
              {asList(product.types).join(' · ') || 'Custom Arrangement'}
            </p>

            {/* Compact horizontal status tracker — replaces the tall vertical card */}
            <div style={styles.trackRow}>
              {STATUS_FLOW.map((status, idx) => {
                const done = idx < currentStatusIdx;
                const active = idx === currentStatusIdx;
                return (
                  <React.Fragment key={status}>
                    {idx > 0 && <div style={styles.trackArrow}>›</div>}
                    <div style={{
                      ...styles.trackStep,
                      background: active ? '#2F4F3E' : done ? '#EAF2EC' : '#FAF9F7',
                      color: active ? '#fff' : done ? '#2F4F3E' : '#B9B2A8',
                      borderColor: active ? '#2F4F3E' : done ? '#CBE0D4' : '#EAE7E2',
                    }}>
                      {done ? <Check size={11} strokeWidth={3} /> : <span style={styles.trackNum}>{idx + 1}</span>}
                      {STATUS_LABELS[status]}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* ── Flower types in this order (line items) ── */}
            <div style={{ background: '#fff', border: '1px solid #EAE7E2', borderRadius: '14px', padding: '14px 16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9C9389', marginBottom: '10px' }}>
                Flower Types in this Order ({lineItems.length})
              </div>
              {lineItems.map((li, i) => {
                const s = arrangements.find(a => a.title === li.name);
                return (
                  <div
                    key={`${li.name}-${i}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0',
                      borderBottom: i < lineItems.length - 1 ? '1px solid #F3F1EC' : 'none'
                    }}
                  >
                    <div style={{ ...styles.mediaThumb, width: '44px', height: '44px', borderRadius: '10px' }}>
                      {s?.images?.length > 0 ? (
                        <img src={s.images[0]?.url || s.images[0]} alt={li.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ ...styles.mediaThumbPlaceholder, fontSize: '16px' }}>{(li.name || 'F').charAt(0)}</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1A17' }}>{li.name}</div>
                      <div style={{ fontSize: '11px', color: '#9C9389' }}>
                        {[asList(s?.colors).slice(0, 3).join(', '), asList(s?.sizes)[0] ? `${asList(s?.sizes)[0]} size` : ''].filter(Boolean).join(' · ') || 'Custom arrangement'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={styles.detailGrid}>
              <div style={styles.detailItem}>
                <div style={styles.detailItemIcon}><Flower2 size={22} /></div>
                <div style={styles.detailItemInfo}>
                  <div style={styles.detailLabel}>Colours / Ribbon</div>
                  <div style={styles.detailValue}>{colourText || '—'}</div>
                </div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailItemIcon}><Package size={22} /></div>
                <div style={styles.detailItemInfo}>
                  <div style={styles.detailLabel}>Flower Size</div>
                  <div style={styles.detailValue}>{b.size || asList(product.sizes).join(', ') || sizeNote || '—'}</div>
                </div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailItemIcon}><User size={22} /></div>
                <div style={styles.detailItemInfo}>
                  <div style={styles.detailLabel}>Deceased Name</div>
                  <div style={styles.detailValue}>{b.deceased_name || '—'}</div>
                </div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailItemIcon}><Calendar size={22} /></div>
                <div style={styles.detailItemInfo}>
                  <div style={styles.detailLabel}>Expected By</div>
                  <div style={styles.detailValue}>{dKey ? `${fmtDateOnly(dKey)}${tStr ? ' · ' + fmtTime(tStr) : ''}` : 'Awaiting scheduling'}</div>
                </div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailItemIcon}><MapPin size={22} /></div>
                <div style={styles.detailItemInfo}>
                  <div style={styles.detailLabel}>Flowers Coming From</div>
                  <div style={styles.detailValue}>{resolveBranchName(b.branch) || resolveBranchName(b.funeral_home) || 'Not specified'}</div>
                </div>
              </div>
              <div style={styles.detailItem}>
                <div style={styles.detailItemIcon}><User size={22} /></div>
                <div style={styles.detailItemInfo}>
                  <div style={styles.detailLabel}>Booked By</div>
                  <div style={styles.detailValue}>{b.booked_by || b.customer || '—'}</div>
                </div>
              </div>
              {remarksList.length > 0 && (
                <div style={{ ...styles.detailItem, gridColumn: '1 / -1', alignItems: 'flex-start' }}>
                  <div style={styles.detailItemIcon}><Flower2 size={22} /></div>
                  <div style={styles.detailItemInfo}>
                    <div style={styles.detailLabel}>Special Remarks</div>
                    <div style={{ ...styles.detailValue, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                      {remarksList.join('\n')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.detailActions}>
              {actionBtnHtml}
            </div>
          </div>
        </aside>
      </>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F5F4F1' }}>
        <div style={{ color: '#2F4F3E', fontSize: '14px', fontWeight: 500 }}>Loading flower bookings...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {renderToolbar()}

      {view === 'list' && (
        <>
          {/* Phones: horizontal date strip · Desktop: mini calendar rail */}
          {renderDateStrip()}
          <div className="flx-split" style={styles.splitWrap}>
            <aside className="flx-rail flx-minical" style={styles.railInner}>
              {renderMiniCalendar()}
            </aside>
            <div style={{ minWidth: 0 }}>
              {renderList()}
            </div>
          </div>
        </>
      )}
      {view === 'calendar' && (
        <div className="flx-content" style={styles.content}>
          {renderCalendar()}
        </div>
      )}
      {view === 'samples' && (
        <div className="flx-content" style={styles.content}>
          {renderSamples()}
        </div>
      )}
      {view === 'new' && (
        <>
          <div style={styles.panelScrim} onClick={() => setView('list')} />
          {renderNewBooking()}
        </>
      )}

      {view === 'detail' && renderDetail()}

      <div style={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} style={styles.toast}>
            <Check size={18} style={{ color: '#10B981' }} />
            {t.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floristPanelIn { from { transform: translateX(48px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes floristFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes floristSpin { to { transform: rotate(360deg); } }

        /* ── Small-phone guards: kill every horizontal overflow source ── */
        .flx-toolbar { row-gap: 8px; }
        @media (max-width: 720px) {
          .flx-toolbar { padding: 10px 12px !important; gap: 8px; }
          .flx-nav { width: 100%; justify-content: space-between; margin-right: 0 !important; }
          .flx-toggle { flex: 1 1 100%; }
          .flx-toggle button { flex: 1; padding-left: 4px !important; padding-right: 4px !important; }
          .flx-actions { width: 100%; }
          .flx-actions > button { flex: 1 1 auto; min-width: 0; padding-left: 6px !important; padding-right: 6px !important; font-size: 10px !important; }
          .flx-content { padding: 18px 12px !important; }
          .flx-card-right { align-items: flex-start !important; }
          .flx-expected { white-space: normal !important; }
          .fb-booking-name { white-space: normal !important; }
          .fb-booking-meta { flex-direction: column !important; }

          /* Compact order cards on phones */
          .fb-card { padding: 10px !important; gap: 10px !important; border-radius: 14px !important; }
          .fb-card-thumb { width: 52px !important; height: 52px !important; border-radius: 12px !important; }
          .fb-card-name { font-size: 14px !important; }
          .fb-card-meta { font-size: 11px !important; gap: 1px !important; }
          .flx-card-right { gap: 5px !important; }
        }

        /* ── Split layout: sticky mini-calendar rail beside the list ── */
        .flx-split { display: grid; grid-template-columns: 290px minmax(0, 1fr); gap: 22px; align-items: start; }
        .flx-rail { position: sticky; top: 74px; }
        .flx-strip { display: none; }
        @media (max-width: 1180px) {
          .flx-split { grid-template-columns: 250px minmax(0, 1fr); gap: 16px; }
        }
        @media (max-width: 1023px) {
          .flx-split { display: block; }
          .flx-rail { display: none !important; }
          .flx-strip {
            display: flex; gap: 8px; overflow-x: auto;
            padding: 2px 2px 14px; margin-bottom: 8px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .flx-strip::-webkit-scrollbar { display: none; }
        }
      `}</style>

      {/* Create Arrangement Side Panel */}
      {showCreateModal && (
        <>
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28,26,23,0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 1000,
            animation: 'floristFadeIn .2s ease'
          }} onClick={() => { if (!creating) setShowCreateModal(false); }} />
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 'min(520px, 100vw)',
            background: '#fff',
            zIndex: 1001,
            overflowY: 'auto',
            boxShadow: '-24px 0 60px rgba(28,26,23,0.14)',
            animation: 'floristPanelIn .32s cubic-bezier(0.16,1,0.3,1)'
          }}>
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid #EAE7E2',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '24px',
                fontWeight: 600,
                color: '#1C1A17',
                margin: 0
              }}>Create New Arrangement</h2>
              <button
                onClick={() => { if (!creating) setShowCreateModal(false); }}
                disabled={creating}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9C9389',
                  fontSize: '28px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  padding: 0,
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >×</button>
            </div>

            <form onSubmit={handleCreateArrangement} style={{ padding: '28px' }}>
              {creating && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#F3F1EC',
                  border: '1px solid #EAE7E2',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '20px',
                  fontSize: '12px',
                  color: '#574F47',
                  fontWeight: 600,
                  fontFamily: "'DM Sans', system-ui, sans-serif"
                }}>
                  <span style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid #D8D2C8',
                    borderTopColor: '#475A43',
                    borderRadius: '50%',
                    display: 'inline-block',
                    flexShrink: 0,
                    animation: 'floristSpin 0.8s linear infinite'
                  }} />
                  Creating your arrangement at full quality — this can take a moment. Please keep this panel open…
                </div>
              )}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#9C9389',
                  marginBottom: '8px'
                }}>Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #EAE7E2',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: '#FAF9F7',
                    color: '#1C1A17',
                    outline: 'none'
                  }}
                  placeholder="e.g., White Rose Wreath"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#9C9389',
                  marginBottom: '8px'
                }}>Description *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #EAE7E2',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: '#FAF9F7',
                    color: '#1C1A17',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  placeholder="Describe the arrangement..."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#9C9389',
                  marginBottom: '8px'
                }}>Types (comma-separated)</label>
                <input
                  type="text"
                  name="types"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #EAE7E2',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: '#FAF9F7',
                    color: '#1C1A17',
                    outline: 'none'
                  }}
                  placeholder="e.g., Wreath, Spray, Bouquet"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#9C9389',
                  marginBottom: '8px'
                }}>Colors (comma-separated)</label>
                <input
                  type="text"
                  name="colors"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #EAE7E2',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: '#FAF9F7',
                    color: '#1C1A17',
                    outline: 'none'
                  }}
                  placeholder="e.g., White, Red, Pink"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#9C9389',
                  marginBottom: '8px'
                }}>Sizes (comma-separated)</label>
                <input
                  type="text"
                  name="sizes"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #EAE7E2',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: '#FAF9F7',
                    color: '#1C1A17',
                    outline: 'none'
                  }}
                  placeholder="e.g., Small, Medium, Large"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#9C9389',
                  marginBottom: '8px'
                }}>Images (multiple)</label>
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #EAE7E2',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: '#FAF9F7',
                    color: '#1C1A17'
                  }}
                />
                <p style={{ fontSize: '11px', color: '#B9B3AA', marginTop: '6px' }}>
                  You can select multiple images for this arrangement
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                paddingTop: '20px',
                borderTop: '1px solid #EAE7E2'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: '#574F47',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    border: '1px solid #EAE7E2',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.5 : 1,
                    fontFamily: "'DM Sans', system-ui, sans-serif"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '11px 24px',
                    borderRadius: '8px',
                    background: '#475A43',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.75 : 1,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {creating && (
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255,255,255,0.35)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'floristSpin 0.8s linear infinite'
                      }}
                    />
                  )}
                  {creating ? 'Creating…' : 'Create Arrangement'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#F5F4F1',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    color: '#1C1A17',
    position: 'relative',
  },
  toolbar: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(245, 244, 241, 0.92)',
    backdropFilter: 'blur(16px)',
    padding: '10px 14px',
    borderBottom: '1px solid #EAE7E2',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    rowGap: '8px',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginRight: 'auto',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '15px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#1C1A17',
    whiteSpace: 'nowrap',
  },
  arrowBtn: {
    width: '28px',
    height: '28px',
    borderRadius: 0,
    border: '1px solid #E3DFD8',
    background: '#fff',
    color: '#574F47',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all .15s ease',
  },
  todayBtn: {
    padding: '7px 12px',
    borderRadius: 0,
    background: '#fff',
    border: '1px solid #E3DFD8',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#574F47',
    cursor: 'pointer',
  },
  viewToggle: {
    display: 'flex',
    background: '#fff',
    border: '1px solid #E3DFD8',
    borderRadius: 0,
    padding: 0,
    gap: 0,
  },
  viewBtn: (active) => ({
    padding: '8px 16px',
    borderRadius: 0,
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: active ? '#fff' : '#9C9389',
    background: active ? '#2F4F3E' : 'transparent',
    border: 'none',
    cursor: 'pointer',
  }),
  placeBookingBtn: {
    background: '#2F4F3E',
    color: '#fff',
    padding: '9px 14px',
    borderRadius: 0,
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
  },
  content: {
    padding: '24px 16px',
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  feedDateHeader: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#9C9389',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bookingCard: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    padding: '14px',
    background: '#fff',
    border: '1px solid #EAE7E2',
    borderRadius: '20px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all .3s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  mediaThumb: {
    width: '72px',
    height: '72px',
    borderRadius: '16px',
    flexShrink: 0,
    overflow: 'hidden',
    background: '#1C1A17',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaThumbPlaceholder: {
    color: '#B08D57',
    fontFamily: "'Playfair Display', serif",
    fontSize: '24px',
    fontWeight: 700,
  },
  bookingInfo: {
    flex: 1,
    minWidth: 0,
  },
  bookingName: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#1C1A17',
    marginBottom: '4px',
    fontFamily: "'Playfair Display', serif",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  bookingMeta: {
    fontSize: '13px',
    color: '#9C9389',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
  },
  expectedBy: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#574F47',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    whiteSpace: 'nowrap',
  },
  bookingRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
  },
  bookingPrice: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '18px',
    fontWeight: 600,
    color: '#1C1A17',
  },
  pillsRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  statusPill: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '99px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  priorityPill: {
    fontSize: '10px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '99px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: '1px solid transparent',
  },
  calHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  calTitle: {
    fontSize: '26px',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 600,
  },
  calNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  calArrow: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: '#fff',
    border: '1px solid #EAE7E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#574F47',
    cursor: 'pointer',
    transition: 'all .2s ease',
  },
  calWeekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
    marginBottom: '12px',
  },
  calWeekday: {
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: 700,
    color: '#9C9389',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  calDays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
  },
  calDay: {
    minHeight: '110px',
    borderRadius: '12px',
    padding: '8px',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all .2s ease',
  },
  calDayNum: {
    fontFamily: "'Sora', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    color: '#1C1A17',
    marginBottom: '6px',
  },
  todayNum: {
    background: '#2F4F3E',
    color: '#fff',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
  },
  calEvent: {
    fontSize: '10px',
    padding: '3px 6px',
    borderRadius: '6px',
    marginBottom: '3px',
    background: 'rgba(47,79,62,.1)',
    color: '#2F4F3E',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  selectedDayPanel: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #EAE7E2',
  },
  sectionTitle: {
    fontSize: '22px',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 600,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  addBookingBtn: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
    background: '#2F4F3E',
    border: 'none',
    borderRadius: '99px',
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  formContainer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 'min(560px, 100vw)',
    background: '#fff',
    zIndex: 1001,
    overflowY: 'auto',
    padding: '28px 28px 40px',
    boxShadow: '-24px 0 60px rgba(28,26,23,0.14)',
    animation: 'floristPanelIn .32s cubic-bezier(0.16,1,0.3,1)',
  },
  panelScrim: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28,26,23,0.45)',
    backdropFilter: 'blur(2px)',
    zIndex: 1000,
    animation: 'floristFadeIn .2s ease',
  },
  formHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
  },
  formTitle: {
    fontSize: '28px',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 600,
    flex: 1,
    margin: 0,
  },
  formSection: {
    marginBottom: '28px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: '#9C9389',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '16px',
  },
  productCard: {
    borderRadius: '20px',
    padding: '8px',
    cursor: 'pointer',
    transition: 'all .2s ease',
    position: 'relative',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  productCheck: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '24px',
    height: '24px',
    background: '#2F4F3E',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productMedia: {
    width: '100%',
    height: '140px',
    borderRadius: '14px',
    marginBottom: '8px',
    overflow: 'hidden',
    background: '#1C1A17',
  },
  productMediaPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#B08D57',
    fontFamily: "'Playfair Display', serif",
    fontSize: '32px',
  },
  productName: {
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: "'Playfair Display', serif",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  productPrice: {
    fontSize: '12px',
    color: '#9C9389',
    marginTop: '2px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  inputIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: '#fff',
    border: '1px solid #EAE7E2',
    borderRadius: '14px',
    color: '#9C9389',
  },
  priorityGroup: {
    display: 'flex',
    gap: '8px',
  },
  priorityBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: '14px',
    border: '1px solid #EAE7E2',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all .2s ease',
  },
  summaryCard: {
    background: '#fff',
    border: '1px solid #EAE7E2',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  summaryTotal: {
    fontSize: '15px',
    color: '#9C9389',
    fontWeight: 600,
  },
  summaryPrice: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '28px',
    fontWeight: 700,
    color: '#1C1A17',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    background: '#2F4F3E',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(47,79,62,.15)',
  },
  detailContainer: {
    position: 'fixed',
    inset: 0,
    background: '#F5F4F1',
    zIndex: 1000,
    overflowY: 'auto',
  },
  detailHero: {
    position: 'relative',
    height: '360px',
    background: '#1C1A17',
    overflow: 'hidden',
  },
  carouselTrack: {
    width: '100%',
    height: '100%',
    display: 'flex',
    transition: 'transform 0.4s ease',
  },
  carouselSlide: {
    minWidth: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBack: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '44px',
    height: '44px',
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1C1A17',
    cursor: 'pointer',
    border: 'none',
    zIndex: 2,
  },
  detailBody: {
    padding: '32px 24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  chipRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  chip: {
    padding: '6px 12px',
    borderRadius: '99px',
    fontSize: '12px',
    fontWeight: 600,
    background: '#fff',
    color: '#574F47',
    border: '1px solid #EAE7E2',
  },
  chipPrimary: {
    padding: '6px 12px',
    borderRadius: '99px',
    fontSize: '12px',
    fontWeight: 600,
    background: '#2F4F3E',
    color: '#fff',
    border: 'none',
  },
  detailTitle: {
    fontSize: '32px',
    fontFamily: "'Playfair Display', serif",
    fontWeight: 600,
    marginBottom: '8px',
    lineHeight: 1.2,
  },
  detailSubtitle: {
    fontSize: '16px',
    color: '#9C9389',
    marginBottom: '32px',
    fontStyle: 'italic',
  },
  trackingCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '20px',
    marginBottom: '24px',
    border: '1px solid #EAE7E2',
  },
  trackingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  trackingTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1C1A17',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  trackingStatus: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#2F4F3E',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '28px',
  },
  timelineLine: {
    position: 'absolute',
    left: '7px',
    top: '8px',
    bottom: '8px',
    width: '2px',
    background: '#EAE7E2',
  },
  tlStep: {
    position: 'relative',
    paddingBottom: '28px',
  },
  tlDot: {
    position: 'absolute',
    left: '-28px',
    top: '2px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tlStepContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  tlStepInfo: {
    flex: 1,
  },
  tlStepTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#574F47',
    marginBottom: '2px',
  },
  tlStepDesc: {
    fontSize: '13px',
    color: '#9C9389',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '24px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #EAE7E2',
  },
  detailItemIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: '#FAF9F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#2F4F3E',
    border: '1px solid #EAE7E2',
  },
  detailItemInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: '11px',
    color: '#9C9389',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '2px',
  },
  detailValue: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1C1A17',
  },
  detailActions: {
    display: 'flex',
    gap: '12px',
    paddingBottom: '40px',
  },
  actionBtn: {
    flex: 1,
    background: '#2F4F3E',
    color: '#fff',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(47,79,62,.15)',
  },
  actionBtnOutline: {
    flex: 1,
    background: 'transparent',
    color: '#1C1A17',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    border: '1px solid #EAE7E2',
    cursor: 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    opacity: 0.6,
  },
  trackRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px',
    rowGap: '8px',
    background: '#fff',
    border: '1px solid #EAE7E2',
    borderRadius: '14px',
    padding: '12px 14px',
    marginBottom: '24px',
  },
  trackStep: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 11px',
    borderRadius: '99px',
    border: '1px solid #EAE7E2',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  },
  trackNum: {
    fontSize: '10px',
    fontWeight: 800,
  },
  trackArrow: {
    color: '#C9C2B8',
    fontWeight: 800,
    fontSize: '15px',
    lineHeight: 1,
  },
  detailTopBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
  },
  splitWrap: {
    width: '100%',
    boxSizing: 'border-box',
  },
  railInner: {
    background: '#fff',
    border: '1px solid #EAE7E2',
    borderRadius: '14px',
    padding: '14px',
    position: 'sticky',
    top: '74px',
  },
  mcHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  mcTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '15px',
    fontWeight: 600,
    color: '#1C1A17',
  },
  mcNav: {
    display: 'flex',
    gap: '6px',
  },
  mcWkRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    marginBottom: '4px',
  },
  mcWk: {
    textAlign: 'center',
    fontSize: '9px',
    fontWeight: 700,
    color: '#B9B2A8',
    textTransform: 'uppercase',
  },
  mcGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  },
  mcCell: {
    position: 'relative',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
    color: '#574F47',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all .15s ease',
    padding: 0,
  },
  mcDot: {
    position: 'absolute',
    bottom: '5px',
    left: '50%',
    marginLeft: '-2px',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: '#2F4F3E',
  },
  stripDay: {
    flex: '0 0 auto',
    minWidth: '54px',
    padding: '10px 10px 12px',
    borderRadius: 0,
    border: '1px solid #EAE7E2',
    background: '#fff',
    textAlign: 'center',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    color: '#574F47',
    transition: 'all .15s ease',
  },
  backPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 16px',
    borderRadius: '99px',
    background: '#fff',
    border: '1px solid #EAE7E2',
    color: '#574F47',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all .15s ease',
  },
  detailCrumb: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: 600,
    color: '#9C9389',
    letterSpacing: '0.05em',
  },
  toastContainer: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1100,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    pointerEvents: 'none',
  },
  toast: {
    background: '#1C1A17',
    color: '#fff',
    padding: '16px 20px',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: 500,
    fontSize: '14px',
    animation: 'slideUp .3s ease',
  },
};

export default FlowerBookingsNew;