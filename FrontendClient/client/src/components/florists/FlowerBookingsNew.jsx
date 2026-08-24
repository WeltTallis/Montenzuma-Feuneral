import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Flower2, MapPin, User, Calendar, Clock, ChevronLeft, ChevronRight, X, Check, Truck, Home, Package, AlertTriangle } from '../../utils/icons/icons';
import api from '../../api/axios'
import { useSocket } from '../../utils/context/socketContext'
import ReusableCalendar from '../../utils/calender/calender';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const STATUS_FLOW = ['pending', 'sourced', 'transit', 'completed'];
const STATUS_LABELS = {
  pending: 'Order Placed',
  sourced: 'Flowers Sourced',
  transit: 'Out for Delivery',
  completed: 'Delivered'
};
const STATUS_DESC = {
  pending: 'We have received your order details.',
  sourced: 'Florist has prepared the arrangement.',
  transit: 'The delivery is en route to the funeral home.',
  completed: 'Successfully delivered to the specified location.'
};

const pad = n => String(n).padStart(2, '0');
const fmtDateStr = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseDate = s => { const d = new Date(s); return isNaN(d) ? null : d; };
const addDays = (d,n) => { const x = new Date(d.getTime()); x.setDate(x.getDate()+n); return x; };
const fmtTime = s => s ? new Date(s).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}) : '';
const fmtDateTime = s => s ? new Date(s).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : 'N/A';
const fmtDateOnly = s => s ? new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'N/A';

const FlowerBookingsNew = () => {
  const { socket, connected } = useSocket()
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [newBooking, setNewBooking] = useState({
    arrangement_id: null,
    arrangement_name: '',
    arrangement_price: '',
    deceased_name: '',
    booked_by: '',
    funeral_home: '',
    date: '',
    time: '10:00',
    priority: 'Normal'
  });
  const [toasts, setToasts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArrangementPicker, setShowArrangementPicker] = useState(false);
  const [arrangements, setArrangements] = useState([]);

  const loadArrangements = useCallback(async () => {
    try {
      const res = await api.get('/florist/flower-samples/');
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
      const res = await api.get('/florist/bookings');
      setBookings(res.data.data || []);
    } catch (e) {
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

  const getEventsForDate = useCallback((dateStr) => {
    return bookings.filter(b => b.delivery_date === dateStr);
  }, [bookings]);

  const getBookingDotColor = (b) => {
    switch (b.status) {
      case 'pending': return '#d97706';
      case 'confirmed': return '#0284c7';
      case 'preparing': return '#6366f1';
      case 'completed': return '#059669';
      case 'cancelled': return '#dc2626';
      default: return '#1d4ed8';
    }
  };

  const calendarItems = useMemo(() => {
    return bookings.map(b => {
      let ds = b.delivery_date;
      if (!ds) return { ...b, _calDate: null };
      if (ds instanceof Date) {
        ds = `${ds.getFullYear()}-${String(ds.getMonth() + 1).padStart(2, '0')}-${String(ds.getDate()).padStart(2, '0')}`;
      }
      return { ...b, _calDate: ds };
    });
  }, [bookings]);

  const calNav = useCallback((dir) => {
    const d = new Date(calDate.getTime());
    d.setMonth(d.getMonth() + dir);
    setCalDate(d);
  }, [calDate]);

  const calToday = useCallback(() => {
    setCalDate(new Date());
    setSelectedDate(fmtDateStr(new Date()));
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
    if (!newBooking.arrangement_name || !newBooking.deceased_name || !newBooking.funeral_home || !newBooking.date) {
      return showToast('Please fill all required fields', 'error');
    }

    try {
      // Find the selected arrangement to get its slug
      const selectedArrangement = arrangements.find(a => a.arrangement_id === newBooking.arrangement_id);
      const flowerTypeSlug = selectedArrangement?.arrangement_id || selectedArrangement?.title || newBooking.arrangement_name;

      const payload = {
        arrangement_name: newBooking.arrangement_name,
        arrangement_price: newBooking.arrangement_price,
        deceased_name: newBooking.deceased_name,
        booked_by: newBooking.booked_by,
        funeral_home: newBooking.funeral_home,
        date: newBooking.date,
        time: newBooking.time,
        priority: newBooking.priority,
        arrangement_id: newBooking.arrangement_id,
        flower_type: flowerTypeSlug,
        amount: parseFloat(newBooking.arrangement_price) || 0
      };
      await api.post('/florist/bookings', payload);

      showToast('Booking placed successfully!');
      await loadBookings();
      setView('list');
      setNewBooking({
        arrangement_id: null,
        arrangement_name: '',
        arrangement_price: '',
        deceased_name: '',
        booked_by: '',
        funeral_home: '',
        date: '',
        time: '10:00',
        priority: 'Normal'
      });
    } catch (e) {
      showToast(e.friendlyMessage || 'Failed to create booking', 'error');
    }
  }, [newBooking, arrangements, showToast, loadBookings]);

  const selectArrangement = useCallback((arrangement) => {
    setNewBooking(prev => ({
      ...prev,
      arrangement_id: arrangement.arrangement_id,
      arrangement_name: arrangement.title,
      arrangement_price: arrangement.price || ''
    }));
    setShowArrangementPicker(false);
  }, []);

  const updateStatus = useCallback(async (id, nextStatus) => {
    try {
      await api.put(`/florist/bookings/${id}/status`, { status: nextStatus });
      showToast(`Status updated to ${STATUS_LABELS[nextStatus]}`);
      await loadBookings();
    } catch (e) {
      showToast(e.friendlyMessage || 'Failed to update status', 'error');
    }
  }, [showToast, loadBookings]);

  const handleCreateArrangement = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
      const res = await api.post('/florist/flower-samples', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const data = res.data;
      if (data.success) {
        showToast('Arrangement created successfully!');
        setShowCreateModal(false);
        form.reset();
      } else {
        showToast(data.message || 'Failed to create arrangement', 'error');
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Failed to create arrangement', 'error');
    }
  };

  const renderToolbar = () => {
    const d = calDate;
    return (
      <div style={styles.toolbar}>
        <div style={styles.nav}>
          <div style={styles.title}>
            <button style={styles.arrowBtn} onClick={() => calNav(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            {MONTHS[d.getMonth()]} {d.getFullYear()}
            <button style={styles.arrowBtn} onClick={() => calNav(1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
          <button style={styles.todayBtn} onClick={calToday}>Today</button>
        </div>
        <div style={styles.viewToggle}>
          <button style={styles.viewBtn(view === 'list')} onClick={() => setView('list')}>List</button>
          <button style={styles.viewBtn(view === 'calendar')} onClick={() => setView('calendar')}>Calendar</button>
          <button style={styles.viewBtn(view === 'samples')} onClick={() => setView('samples')}>Samples</button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            style={{
              ...styles.placeBookingBtn,
              background: '#475A43',
              boxShadow: '0 4px 12px rgba(71,90,67,0.25)'
            }}
            onClick={() => setShowCreateModal(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Arrangement
          </button>
          <button style={styles.placeBookingBtn} onClick={() => openNewBookingForm('')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Place Booking
          </button>
        </div>
      </div>
    );
  };

  const renderList = () => {
    const sorted = [...bookings].sort((a, b) => new Date(a.delivery_date) - new Date(b.delivery_date));
    const groups = {};
    sorted.forEach(b => {
      if (!groups[b.delivery_date]) groups[b.delivery_date] = [];
      groups[b.delivery_date].push(b);
    });

    if (Object.keys(groups).length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9C9389' }}>
          <Flower2 size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#574F47', marginBottom: '6px' }}>No bookings yet</h3>
          <p style={{ fontSize: '14px' }}>Click "Place Booking" to create your first one.</p>
        </div>
      );
    }

    return Object.entries(groups).map(([date, dayBookings]) => {
      const dateObj = new Date(date + 'T00:00:00');
      return (
        <div key={date} style={{ marginBottom: '32px' }}>
          <div style={styles.feedDateHeader}>
            <Calendar size={14} />
            {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          {dayBookings.map(b => renderBookingCard(b))}
        </div>
      );
    });
  };

  const renderBookingCard = (b) => {
    // Match booking with arrangement by name (flower_type stores the arrangement name)
    const product = arrangements.find(a => a.title === b.flower_type) || arrangements[0] || {
      title: b.flower_type || 'Custom Arrangement',
      price: b.amount || 0,
      images: [],
      types: ['Custom']
    };
    const statusCfg = STATUS_FLOW.indexOf(b.status) >= 0 ? { label: STATUS_LABELS[b.status], color: '#2F4F3E', bg: '#f0f7f4' } : { label: b.status, color: '#64748b', bg: '#f1f5f9' };

    return (
      <div style={styles.bookingCard} onClick={() => viewBooking(b.id)}>
        <div style={styles.mediaThumb}>
          {product.images?.length > 0 ? (
            <img src={product.images[0]?.url || product.images[0]} alt={product.title} />
          ) : (
            <div style={styles.mediaThumbPlaceholder}>{product.title?.charAt(0) || 'F'}</div>
          )}
        </div>
        <div style={styles.bookingInfo}>
          <div style={styles.bookingName}>{product.title}</div>
          <div style={styles.bookingMeta}>
            <div><User size={12} /> {b.deceased_name}</div>
            <div><MapPin size={12} /> {b.funeral_home} - {b.delivery_time}</div>
          </div>
        </div>
        <div style={styles.bookingRight}>
          <div style={styles.bookingPrice}>${b.amount?.toFixed(2) || '---'}</div>
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
    const todayStr = fmtDateStr(new Date());

    return (
      <div>
        <div style={styles.calHeader}>
          <div style={styles.calTitle}>{MONTHS[month]} {year}</div>
          <div style={styles.calNav}>
            <button style={styles.calArrow} onClick={() => calNav(-1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button style={styles.calArrow} onClick={() => calNav(1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
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
                  const product = arrangements.find(a => a.title === b.flower_type) || arrangements[0] || {
                    title: b.flower_type || 'Custom Arrangement',
                    price: b.amount || 0,
                    images: [],
                    types: ['Custom']
                  };
                  return (
                    <div key={b.id} style={styles.calEvent}>
                      {b.delivery_time} - {product.title.split(' ')[0]}
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
                    {arrangement.types?.[0] || 'Custom'} · ${arrangement.price || '0.00'}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    selectArrangement(arrangement);
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
    return (
      <div style={styles.formContainer}>
        <div style={styles.formHeader}>
          <button style={styles.calArrow} onClick={() => setView('list')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h2 style={styles.formTitle}>Place Order</h2>
        </div>

        <div style={styles.formSection}>
          <label style={styles.formLabel}>1. Select Arrangement</label>
          
          {/* Arrangement Picker Button */}
          <button 
            style={{
              ...styles.inputIcon,
              cursor: 'pointer',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: '12px'
            }}
            onClick={() => setShowArrangementPicker(!showArrangementPicker)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Flower2 size={18} />
              <span style={{ color: newBooking.arrangement_id ? '#1C1A17' : '#9C9389' }}>
                {newBooking.arrangement_id ? `${newBooking.arrangement_name} (ID: ${newBooking.arrangement_id})` : 'Choose from available arrangements'}
              </span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showArrangementPicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          {/* Arrangement Picker Dropdown */}
          {showArrangementPicker && (
            <div style={{
              background: '#fff',
              border: '1px solid #EAE7E2',
              borderRadius: '14px',
              padding: '12px',
              marginBottom: '12px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {arrangements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9C9389', fontSize: '13px' }}>
                  No arrangements available. Create one first.
                </div>
              ) : (
                <div style={styles.productGrid}>
                  {arrangements.map(arrangement => (
                    <div
                      key={arrangement.arrangement_id}
                      style={{
                        ...styles.productCard,
                        border: newBooking.arrangement_id === arrangement.arrangement_id 
                          ? '2px solid #2F4F3E' 
                          : '1px solid #EAE7E2',
                        background: newBooking.arrangement_id === arrangement.arrangement_id 
                          ? '#f0f7f4' 
                          : '#fff'
                      }}
                      onClick={() => selectArrangement(arrangement)}
                    >
                      {newBooking.arrangement_id === arrangement.arrangement_id && (
                        <div style={styles.productCheck}>
                          <Check size={14} />
                        </div>
                      )}
                      <div style={styles.productMedia}>
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
                      <div style={styles.productName}>{arrangement.title}</div>
                      <div style={styles.productPrice}>
                        {arrangement.types?.[0] || 'Custom'} · ID: {arrangement.arrangement_id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manual Entry (if no arrangement selected) */}
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <div style={styles.inputIcon}>
                <Flower2 size={18} />
                <input
                  type="text"
                  placeholder="Arrangement Name (or type custom)"
                  value={newBooking.arrangement_name}
                  onChange={e => setNewBooking(prev => ({ ...prev, arrangement_name: e.target.value, arrangement_id: null }))}
                  required
                />
              </div>
            </div>
            <div style={styles.inputGroup}>
              <div style={styles.inputIcon}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#9C9389' }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Price"
                  value={newBooking.arrangement_price}
                  onChange={e => setNewBooking(prev => ({ ...prev, arrangement_price: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          {/* Show selected arrangement slug */}
          {newBooking.arrangement_id && (
            <div style={{
              background: '#f0f7f4',
              border: '1px solid #2F4F3E',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '11px',
              color: '#2F4F3E',
              fontWeight: 600,
              marginTop: '8px'
            }}>
              ✓ Using arrangement slug: <strong>{newBooking.arrangement_id}</strong>
            </div>
          )}
        </div>

        <div style={styles.formSection}>
          <label style={styles.formLabel}>2. Booking Details</label>
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <div style={styles.inputIcon}>
                <Flower2 size={18} />
                <input
                  type="text"
                  placeholder="Deceased Name"
                  value={newBooking.deceased_name}
                  onChange={e => setNewBooking(prev => ({ ...prev, deceased_name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div style={styles.inputGroup}>
              <div style={styles.inputIcon}>
                <User size={18} />
                <input
                  type="text"
                  placeholder="Booked By (Your Name)"
                  value={newBooking.booked_by}
                  onChange={e => setNewBooking(prev => ({ ...prev, booked_by: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div style={styles.inputGroup}>
            <div style={styles.inputIcon}>
              <MapPin size={18} />
              <input
                type="text"
                placeholder="Funeral Home Location"
                value={newBooking.funeral_home}
                onChange={e => setNewBooking(prev => ({ ...prev, funeral_home: e.target.value }))}
                required
              />
            </div>
          </div>
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <div style={styles.inputIcon}>
                <Calendar size={18} />
                <input
                  type="date"
                  value={newBooking.date}
                  onChange={e => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div style={styles.inputGroup}>
              <div style={styles.inputIcon}>
                <Clock size={18} />
                <input
                  type="time"
                  value={newBooking.time}
                  onChange={e => setNewBooking(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={styles.formSection}>
          <label style={styles.formLabel}>3. Priority Level</label>
          <div style={styles.priorityGroup}>
            {['High', 'Normal', 'Low'].map(p => (
              <button
                key={p}
                style={{
                  ...styles.priorityBtn,
                  background: newBooking.priority === p ? '#1C1A17' : '#fff',
                  color: newBooking.priority === p ? '#fff' : '#574F47',
                  border: `1px solid ${newBooking.priority === p ? '#1C1A17' : '#EAE7E2'}`
                }}
                onClick={() => setNewBooking(prev => ({ ...prev, priority: p }))}
              >
                {p === 'High' && <AlertTriangle size={14} />}
                {p}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryTotal}>Total Amount</div>
          <div style={styles.summaryPrice}>${parseFloat(newBooking.arrangement_price) ? parseFloat(newBooking.arrangement_price).toFixed(2) : '0.00'}</div>
        </div>

        <button style={styles.submitBtn} onClick={submitBooking}>
          <Check size={18} />
          Confirm & Place Booking
        </button>
      </div>
    );
  };

  const renderDetail = () => {
    const b = bookings.find(x => x.id === activeBookingId);
    if (!b) return '';
    const product = arrangements.find(a => a.title === b.flower_type) || arrangements[0] || {
      title: b.flower_type || 'Custom Arrangement',
      price: b.amount || 0,
      images: [],
      types: ['Custom']
    };
    const currentStatusIdx = STATUS_FLOW.indexOf(b.status);
    const timelineHtml = STATUS_FLOW.map((status, idx) => {
      let stepClass = '';
      if (idx < currentStatusIdx) stepClass = 'done';
      else if (idx === currentStatusIdx) stepClass = 'active';

      return (
        <div key={status} style={styles.tlStep}>
          <div style={styles.tlStepContent}>
            <div style={styles.tlStepInfo}>
              <div style={styles.tlStepTitle}>{STATUS_LABELS[status]}</div>
              <div style={styles.tlStepDesc}>{STATUS_DESC[status]}</div>
            </div>
          </div>
        </div>
      );
    });

    let actionBtnHtml = '';
    if (currentStatusIdx < STATUS_FLOW.length - 1) {
      const nextStatus = STATUS_FLOW[currentStatusIdx + 1];
      actionBtnHtml = (
        <button style={styles.actionBtn} onClick={() => updateStatus(b.id, nextStatus)}>
          {nextStatus === 'transit' && <Truck size={18} />}
          {nextStatus === 'sourced' && <Package size={18} />}
          {nextStatus === 'completed' && <Home size={18} />}
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

    return (
      <div style={styles.detailContainer}>
          <div style={styles.detailHero}>
            <div style={styles.carouselTrack}>
              {product.images?.map((img, idx) => (
                <div key={idx} style={styles.carouselSlide}>
                  <img src={img.url || img} alt={product.title} />
                </div>
              ))}
            </div>
          <button style={styles.detailBack} onClick={backToList}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
        </div>
        <div style={styles.detailBody}>
          <div style={styles.chipRow}>
            <div style={styles.chipPrimary}>{b.booking_id}</div>
            <div style={styles.chip}>{product.types?.[0] || 'Custom'}</div>
            <div style={styles.chip}>{b.delivery_time}</div>
            <span style={{ ...styles.priorityPill, fontSize: '12px', padding: '6px 12px' }}>{b.priority} Priority</span>
          </div>

          <h2 style={styles.detailTitle}>{product.title}</h2>
          <p style={styles.detailSubtitle}>Sympathy Floral Tribute · ${b.amount?.toFixed(2) || '0.00'}</p>

          <div style={styles.trackingCard}>
            <div style={styles.trackingHeader}>
              <div style={styles.trackingTitle}>Live Delivery Tracking</div>
              <div style={styles.trackingStatus}>
                <Truck size={14} />
                {STATUS_LABELS[b.status] || b.status}
              </div>
            </div>
            <div style={styles.timeline}>
              <div style={styles.timelineLine} />
              {timelineHtml}
            </div>
          </div>

          <div style={styles.detailGrid}>
            <div style={styles.detailItem}>
              <div style={styles.detailItemIcon}><Flower2 size={22} /></div>
              <div style={styles.detailItemInfo}>
                <div style={styles.detailLabel}>Deceased Name</div>
                <div style={styles.detailValue}>{b.deceased_name}</div>
              </div>
            </div>
            <div style={styles.detailItem}>
              <div style={styles.detailItemIcon}><User size={22} /></div>
              <div style={styles.detailItemInfo}>
                <div style={styles.detailLabel}>Booked By</div>
                <div style={styles.detailValue}>{b.booked_by || b.customer}</div>
              </div>
            </div>
            <div style={styles.detailItem}>
              <div style={styles.detailItemIcon}><MapPin size={22} /></div>
              <div style={styles.detailItemInfo}>
                <div style={styles.detailLabel}>Funeral Home</div>
                <div style={styles.detailValue}>{b.funeral_home || b.branch}</div>
              </div>
            </div>
            <div style={styles.detailItem}>
              <div style={styles.detailItemIcon}><Calendar size={22} /></div>
              <div style={styles.detailItemInfo}>
                <div style={styles.detailLabel}>Service Date</div>
                <div style={styles.detailValue}>{fmtDateOnly(b.delivery_date)}</div>
              </div>
            </div>
          </div>

          <div style={styles.detailActions}>
            {actionBtnHtml}
          </div>
        </div>
      </div>
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

      <div style={styles.content}>
        {view === 'list' && renderList()}
        {view === 'calendar' && renderCalendar()}
        {view === 'samples' && renderSamples()}
        {view === 'new' && renderNewBooking()}
      </div>

      {view === 'detail' && renderDetail()}

      <div style={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} style={styles.toast}>
            <Check size={18} style={{ color: '#10B981' }} />
            {t.message}
          </div>
        ))}
      </div>

      {/* Create Arrangement Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            background: '#0a0b0c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '24px',
                fontWeight: 600,
                color: '#fff',
                margin: 0
              }}>Create New Arrangement</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '28px',
                  cursor: 'pointer',
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
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '8px'
                }}>Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: 'rgba(255,255,255,0.02)',
                    color: '#fff',
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
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '8px'
                }}>Description *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: 'rgba(255,255,255,0.02)',
                    color: '#fff',
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
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '8px'
                }}>Price (USD)</label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: 'rgba(255,255,255,0.02)',
                    color: '#fff',
                    outline: 'none'
                  }}
                  placeholder="e.g., 45.00"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '8px'
                }}>Types (comma-separated)</label>
                <input
                  type="text"
                  name="types"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: 'rgba(255,255,255,0.02)',
                    color: '#fff',
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
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '8px'
                }}>Colors (comma-separated)</label>
                <input
                  type="text"
                  name="colors"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: 'rgba(255,255,255,0.02)',
                    color: '#fff',
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
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '8px'
                }}>Sizes (comma-separated)</label>
                <input
                  type="text"
                  name="sizes"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: 'rgba(255,255,255,0.02)',
                    color: '#fff',
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
                  color: 'rgba(255,255,255,0.35)',
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
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: 'rgba(255,255,255,0.02)',
                    color: '#fff'
                  }}
                />
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                  You can select multiple images for this arrangement
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.06)'
              }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', system-ui, sans-serif"
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
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
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', system-ui, sans-serif"
                  }}
                >
                  Create Arrangement
                </button>
              </div>
            </form>
          </div>
        </div>
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
    background: 'rgba(245, 244, 241, 0.9)',
    backdropFilter: 'blur(20px)',
    padding: '16px 24px',
    borderBottom: '1px solid #EAE7E2',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '18px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#1C1A17',
  },
  arrowBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all .2s ease',
  },
  todayBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    background: '#fff',
    border: '1px solid #cbd5e1',
    fontSize: '11px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
  },
  viewToggle: {
    display: 'flex',
    background: '#FAF9F7',
    border: '1px solid #EAE7E2',
    borderRadius: '99px',
    padding: '3px',
    gap: '2px',
  },
  viewBtn: (active) => ({
    padding: '6px 14px',
    borderRadius: '99px',
    fontSize: '11px',
    fontWeight: 600,
    color: active ? '#fff' : '#9C9389',
    background: active ? '#1C1A17' : 'transparent',
    border: 'none',
    cursor: 'pointer',
  }),
  placeBookingBtn: {
    background: '#2F4F3E',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '99px',
    fontSize: '13px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 8px 20px rgba(47,79,62,.15)',
  },
  content: {
    padding: '32px 24px',
    maxWidth: '1100px',
    margin: '0 auto',
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
    maxWidth: '700px',
    margin: '0 auto',
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