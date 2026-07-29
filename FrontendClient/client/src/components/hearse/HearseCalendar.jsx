import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Truck, MapPin, Phone, User, Clock, X, ArrowLeft, Calendar, Plus } from '../../utils/icons/icons';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', bg: 'rgba(245,158,11,.12)', strong: '#b45309' },
  booked: { label: 'Booked', color: '#2563EB', bg: 'rgba(37,99,235,.12)', strong: '#1d4ed8' },
  in_transit: { label: 'In Transit', color: '#D32F2F', bg: 'rgba(211,47,47,.12)', strong: '#b71c1c' },
  completed: { label: 'Completed', color: '#2E7D32', bg: 'rgba(46,125,50,.12)', strong: '#1b5e20' },
  cancelled: { label: 'Cancelled', color: '#64748b', bg: 'rgba(100,116,139,.12)', strong: '#475569' },
};

const pad = n => String(n).padStart(2, '0');
const fmtDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = s => { const d = new Date(s); return isNaN(d) ? null : d; };
const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
const fmtTime = s => s ? new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
const fmtDateTime = s => s ? new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const HearseCalendar = ({ bookings, onItemClick, onAddForDate, selectedDate, onDateSelect, onCreateBooking }) => {
  const [calView, setCalView] = useState('month');
  const [calDate, setCalDate] = useState(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempSelectedDates, setTempSelectedDates] = useState([]);

  const getEventsForDate = useCallback((dateStr) => {
    return bookings.filter(b => {
      const start = b.start_date || fmtDateStr(new Date(b.booking_date || b.estimated_departure_time));
      const end = b.end_date || start;
      return dateStr >= start && dateStr <= end;
    }).sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));
  }, [bookings]);

  const formatDateStr = useCallback((d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }, []);

  const getBookingTime = useCallback((item) => {
    if (item.booking_date && item.booking_date.includes('T')) {
      return new Date(item.booking_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (item.estimated_departure_time) {
      return new Date(item.estimated_departure_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return '';
  }, []);

  const calNav = useCallback((dir) => {
    const d = new Date(calDate.getTime());
    if (calView === 'month') d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setCalDate(d);
  }, [calDate, calView]);

  const calToday = useCallback(() => {
    setCalDate(new Date());
    const todayStr = fmtDateStr(new Date());
    if (onDateSelect) onDateSelect(todayStr);
  }, [onDateSelect]);

  const openDayList = useCallback((dateStr) => {
    if (onDateSelect) onDateSelect(dateStr);
    setActiveBookingId(null);
    setDrawerOpen(true);
  }, [onDateSelect]);

  const viewBooking = useCallback((id) => {
    setActiveBookingId(id);
    setDrawerOpen(true);
  }, []);

  const backToList = useCallback(() => {
    setActiveBookingId(null);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveBookingId(null);
  }, []);

  const openDatePicker = () => {
    setTempSelectedDates([]);
    setShowDatePicker(true);
  };

  const toggleDateSelection = (dateStr) => {
    setTempSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr].sort();
      }
    });
  };

  const confirmDateSelection = () => {
    setSelectedDates(tempSelectedDates);
    setShowDatePicker(false);
    if (onCreateBooking && tempSelectedDates.length > 0) {
      onCreateBooking(tempSelectedDates);
    }
  };

  const cancelDateSelection = () => {
    setTempSelectedDates([]);
    setShowDatePicker(false);
  };

  const renderToolbar = () => {
    const d = calDate;
    return (
      <div style={styles.toolbar}>
        <div style={styles.nav}>
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
        <div style={styles.viewToggle}>
          <button style={styles.viewBtn(calView === 'month')} onClick={() => setCalView('month')}>Month</button>
          <button style={styles.viewBtn(calView === 'week')} onClick={() => setCalView('week')}>Week</button>
        </div>
        <div style={styles.legend}>
          {Object.keys(STATUS_CONFIG).map(s => (
            <span key={s} style={styles.legendItem}>
              <span style={styles.legendDot(STATUS_CONFIG[s].color)} />
              {STATUS_CONFIG[s].label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthGrid = () => {
    const d = calDate;
    const year = d.getFullYear(), month = d.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -startOffset);
    const days = [];
    for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));
    const todayStr = fmtDateStr(new Date());

    return (
      <div style={styles.monthGrid}>
        <div style={styles.weekdays}>
          {WEEKDAYS.map(w => <div key={w} style={styles.weekday}>{w}</div>)}
        </div>
        <div style={styles.daysGrid}>
          {days.map(day => {
            const dateStr = fmtDateStr(day);
            const outside = day.getMonth() !== month;
            const isToday = dateStr === todayStr;
            const isSelected = selectedDates.includes(dateStr);
            const events = getEventsForDate(dateStr);
            const visible = events.slice(0, 3);
            const more = events.length - visible.length;

            return (
              <div
                key={dateStr}
                style={styles.day(outside, isToday, isSelected)}
                onClick={() => toggleDateSelection(dateStr)}
              >
                <div style={styles.dayNum}>
                  <span style={isToday ? styles.todayNum : {}}>{day.getDate()}</span>
                </div>
                {visible.map(ev => renderCalEvent(ev, dateStr))}
                {more > 0 && (
                  <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, padding: '2px 6px', cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); openDayList(dateStr); }}>
                    +{more} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalEvent = (b, dateStr) => {
    const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
    const start = b.start_date || formatDateStr(b.booking_date || b.estimated_departure_time);
    const end = b.end_date || start;
    const isStart = dateStr === start;
    const isEnd = dateStr === end;
    const isMid = !isStart && !isEnd;
    const isMulti = (b.duration_days || 1) > 1;

    let pos = '';
    if (isMulti) {
      if (isStart) pos = 'start';
      else if (isEnd) pos = 'end';
      else if (isMid) pos = 'mid';
    }

    const time = getBookingTime(b);
    const timeStr = (isStart && time) ? time : '';
    const label = isMulti && isMid
      ? b.client_name?.split(' ')[0] || ''
      : `${timeStr} ${b.client_name?.split(' ')[0] || ''}`;

    return (
      <div
        key={b.booking_id || b.id}
        style={styles.event(cfg, isMulti, pos)}
        onClick={(e) => { e.stopPropagation(); viewBooking(b.booking_id || b.id); }}
        title={`${b.client_name} · ${b.destination || ''} · ${cfg.label}`}
      >
        {label}
      </div>
    );
  };

  const renderWeekGrid = () => {
    const d = calDate;
    const dow = (d.getDay() + 6) % 7;
    const weekStart = addDays(d, -dow);
    const days = [];
    for (let i = 0; i < 7; i++) days.push(addDays(weekStart, i));
    const todayStr = fmtDateStr(new Date());
    const hours = [];
    for (let i = 6; i <= 20; i++) hours.push(i);

    return (
      <div style={{ overflow: 'auto' }}>
        <div style={styles.weekGrid}>
          <div style={{ ...styles.headerCell(false), background: '#0f172a', borderRight: '1px solid #334155' }} />
          {days.map(day => {
            const dateStr = fmtDateStr(day);
            const isToday = dateStr === todayStr;
            return (
              <div key={dateStr} style={styles.headerCell(isToday)}>
                <div style={styles.headerDayName}>{WEEKDAYS[(day.getDay() + 6) % 7]}</div>
                <div style={styles.headerDayNum}>{day.getDate()}</div>
              </div>
            );
          })}

          <div style={{ ...styles.allDayCell, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', background: '#0f172a' }}>
            All Day
          </div>
          {days.map(day => {
            const dateStr = fmtDateStr(day);
            const allDayEvents = bookings.filter(b => (b.duration_days || 1) > 1 && (b.start_date || formatDateStr(b.booking_date)) <= dateStr && (b.end_date || (b.start_date || formatDateStr(b.booking_date))) >= dateStr);
            return (
              <div key={dateStr} style={styles.allDayCell}>
                {allDayEvents.map(b => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={b.booking_id || b.id} style={styles.allDayEvent(cfg)} onClick={() => viewBooking(b.booking_id || b.id)}>
                      <MapPin size={10} /> {b.client_name?.split(' ')[0] || ''} ({(b.duration_days || 1)}d)
                    </div>
                  );
                })}
              </div>
            );
          })}

          {hours.map(h => (
            <React.Fragment key={h}>
              <div style={styles.timeGutter}>{pad(h)}:00</div>
              {days.map(day => {
                const dateStr = fmtDateStr(day);
                const events = bookings.filter(b => {
                  if ((b.duration_days || 1) > 1) return false;
                  const bDate = formatDateStr(b.booking_date || b.estimated_departure_time);
                  return bDate === dateStr && new Date(b.booking_date).getHours() === h;
                });
                return (
                  <div key={dateStr} style={styles.dayCol}>
                    {events.map(b => {
                      const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                      const height = (b.duration_hours || 1) * 54 - 4;
                      return (
                        <div key={b.booking_id || b.id} style={styles.schedEvent(cfg, height)} onClick={() => viewBooking(b.booking_id || b.id)}>
                          <span style={styles.evTime}>{getBookingTime(b)}</span>
                          <div style={styles.evTitle}>{b.client_name}</div>
                          <div style={styles.evSub}>{b.destination || ''}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderDrawerContent = () => {
    if (activeBookingId) return renderBookingDetail();

    const dateStr = selectedDate || fmtDateStr(new Date());
    const events = getEventsForDate(dateStr);
    const d = parseDate(dateStr);
    if (!d) return '';

    return (
      <>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>{d.toLocaleDateString('en-US', { weekday: 'long' })}</div>
            <div style={styles.drawerSub}>
              {d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {events.length} booking{events.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button style={styles.drawerClose} onClick={closeDrawer}>
            <X size={16} />
          </button>
        </div>
        <div style={styles.drawerBody}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <Calendar size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>No bookings for this day</h4>
              <p style={{ fontSize: '12px' }}>Click a day to view or add bookings.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.map(b => {
                const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                return (
                  <div key={b.booking_id || b.id} style={styles.drawerCard} onClick={() => viewBooking(b.booking_id || b.id)}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px', background: cfg.bg, color: cfg.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Truck size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                        {b.client_name} <span style={{ color: '#64748b', fontWeight: 500, fontSize: '11px' }}>· {getBookingTime(b) || 'All day'}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#334155', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={10} /> {b.destination || ''}
                      </div>
                    </div>
                    <span style={styles.statusBadge(cfg)}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderBookingDetail = () => {
    const b = bookings.find(x => (x.booking_id || x.id) === activeBookingId);
    if (!b) return '';
    const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
    const timeline = [
      { key: 'pending', title: 'Booking Created', time: b.created_at },
      { key: 'booked', title: 'Confirmed & Booked', time: b.status === 'booked' || ['in_transit', 'completed'].includes(b.status) ? b.booking_date : null },
      { key: 'in_transit', title: 'In Transit', time: ['in_transit', 'completed'].includes(b.status) ? b.booking_date : null },
      { key: 'completed', title: 'Completed', time: b.status === 'completed' ? (b.end_date || b.booking_date) : null },
    ];
    const statusOrder = ['pending', 'booked', 'in_transit', 'completed'];
    const activeIdx = statusOrder.indexOf(b.status);

    return (
      <>
        <div style={styles.drawerHeader}>
          <div>
            <div style={styles.drawerTitle}>Booking Details</div>
            <div style={styles.drawerSub}>ID: BK-{String(1000 + (b.booking_id || b.id || 0)).padStart(4, '0')}</div>
          </div>
          <button style={styles.drawerClose} onClick={closeDrawer}>
            <X size={16} />
          </button>
        </div>
        <div style={styles.drawerBody}>
          <button style={styles.backBtn} onClick={backToList}>
            <ArrowLeft size={12} /> Back to List
          </button>

          <div style={styles.detailHero}>
            <div style={styles.heroIcon}>
              <Truck size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.heroName}>{b.hearse_name || 'Vehicle'}</div>
              <div style={styles.heroMeta}>
                <span style={{ fontSize: '10px', padding: '3px 6px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: 700, color: '#334155' }}>
                  {b.plate_number || b.number_plate || 'N/A'}
                </span>
                {(b.duration_days || 0) > 1 && <span style={{ color: '#7c3aed', fontWeight: 600 }}>{b.duration_days} Day Trip</span>}
              </div>
              <div style={styles.heroClient}>{b.client_name}</div>
            </div>
            <span style={styles.statusBadge(cfg)}>{cfg.label}</span>
          </div>

          <div style={styles.detailGrid}>
            <div style={styles.detailItem}>
              <div style={styles.detailLabel}>Client Phone</div>
              <div style={styles.detailValue}>{b.client_phone || '—'}</div>
            </div>
            <div style={styles.detailItem}>
              <div style={styles.detailLabel}>Departure Time</div>
              <div style={styles.detailValue}>{fmtDateTime(b.booking_date)}</div>
            </div>
            <div style={styles.detailItem}>
              <div style={styles.detailLabel}>From Location</div>
              <div style={styles.detailValue}>{b.from_location || '—'}</div>
            </div>
            <div style={styles.detailItem}>
              <div style={styles.detailLabel}>Destination</div>
              <div style={styles.detailValue}>{b.destination || '—'}</div>
            </div>
          </div>

          <h4 style={{ fontFamily: "'Sora', sans-serif", fontSize: '13px', marginBottom: '14px', color: '#334155' }}>Status Timeline</h4>
          <div style={styles.timeline}>
            <div style={styles.timelineLine} />
            {timeline.map((t, i) => (
              <div key={t.key} style={styles.timelineItem}>
                <div style={styles.timelineDot(i === activeIdx, i < activeIdx)} />
                <div style={styles.timelineTitle}>{t.title}</div>
                <div style={styles.timelineTime}>{t.time ? fmtDateTime(t.time) : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderDatePickerModal = () => {
    const d = calDate;
    const year = d.getFullYear(), month = d.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -startOffset);
    const days = [];
    for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));
    const todayStr = fmtDateStr(new Date());

    return (
      <div style={styles.modalOverlay} onClick={cancelDateSelection}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <div>
              <div style={styles.modalTitle}>Select Dates for Booking</div>
              <div style={styles.modalSub}>Choose one or more dates (click to toggle)</div>
            </div>
            <button style={styles.modalClose} onClick={cancelDateSelection}>
              <X size={18} />
            </button>
          </div>

          <div style={styles.modalBody}>
            <div style={styles.selectedDatesInfo}>
              <div style={styles.selectedCount}>{tempSelectedDates.length} date{tempSelectedDates.length !== 1 ? 's' : ''} selected</div>
              {tempSelectedDates.length > 0 && (
                <div style={styles.selectedDatesList}>
                  {tempSelectedDates.map(dateStr => {
                    const date = parseDate(dateStr);
                    return (
                      <span key={dateStr} style={styles.selectedDateChip}>
                        {date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={styles.miniCalendar}>
              <div style={styles.miniWeekdays}>
                {WEEKDAYS.map(w => <div key={w} style={styles.miniWeekday}>{w}</div>)}
              </div>
              <div style={styles.miniDaysGrid}>
                {days.map(day => {
                  const dateStr = fmtDateStr(day);
                  const outside = day.getMonth() !== month;
                  const isToday = dateStr === todayStr;
                  const isSelected = tempSelectedDates.includes(dateStr);
                  const isPast = day < new Date(todayStr);

                  return (
                    <div
                      key={dateStr}
                      style={styles.miniDay(outside, isToday, isSelected, isPast)}
                      onClick={() => !isPast && !outside && toggleDateSelection(dateStr)}
                    >
                      <div style={styles.miniDayNum(isSelected)}>
                        {isSelected && <div style={styles.miniCheckmark}>✓</div>}
                        {day.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={styles.modalFooter}>
            <button style={styles.cancelBtn} onClick={cancelDateSelection}>Cancel</button>
            <button
              style={styles.confirmBtn}
              onClick={confirmDateSelection}
              disabled={tempSelectedDates.length === 0}
            >
              <Plus size={16} />
              Confirm & Create Booking
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {renderToolbar()}
      <div style={{ background: '#f8fafc', position: 'relative' }}>
        {calView === 'month' ? renderMonthGrid() : renderWeekGrid()}

        {/* Floating Add Button */}
        <button style={styles.fab} onClick={openDatePicker} title="Add new booking">
          <Plus size={24} />
        </button>
      </div>

      {drawerOpen && <div style={styles.overlay} onClick={closeDrawer} />}
      <div style={styles.drawer(drawerOpen)}>
        {renderDrawerContent()}
      </div>

      {showDatePicker && renderDatePickerModal()}
    </div>
  );
};

const styles = {
  container: {
    background: '#f8fafc',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '14px',
    color: '#0f172a',
    position: 'relative',
    minHeight: '600px',
  },
  toolbar: {
    background: '#ffffff',
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontFamily: "'Sora', sans-serif",
    fontSize: '18px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#0f172a',
  },
  arrowBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
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
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    fontSize: '11px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
    transition: 'all .2s ease',
  },
  viewToggle: {
    display: 'flex',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '3px',
    gap: '2px',
  },
  viewBtn: (active) => ({
    padding: '6px 14px',
    borderRadius: '7px',
    fontSize: '11px',
    fontWeight: 600,
    color: active ? '#0d9488' : '#64748b',
    background: active ? '#ffffff' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
    transition: 'all .2s ease',
  }),
  legend: {
    display: 'flex',
    gap: '14px',
    fontSize: '10px',
    color: '#334155',
    fontWeight: 500,
    flexWrap: 'wrap',
  },
  legendDot: (color) => ({
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    background: color,
    display: 'inline-block',
  }),
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
  },
  monthGrid: {
    padding: '16px',
  },
  weekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7,1fr)',
    gap: '8px',
    marginBottom: '10px',
  },
  weekday: {
    textAlign: 'center',
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    padding: '8px 0',
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7,1fr)',
    gap: '8px',
  },
  day: (outside, isToday, isSelected) => ({
    position: 'relative',
    minHeight: '110px',
    background: isToday ? 'linear-gradient(180deg,rgba(46,125,50,.05),#fff 40%)' : '#ffffff',
    border: `1px solid ${isToday ? '#2E7D32' : '#e2e8f0'}`,
    borderRadius: '14px',
    padding: '8px',
    cursor: 'pointer',
    transition: 'all .2s ease',
    overflow: 'hidden',
    opacity: outside ? 0.3 : 1,
    background: outside ? '#f8fafc' : undefined,
    borderColor: outside ? 'transparent' : undefined,
    boxShadow: isSelected ? '0 0 0 2px rgba(46,125,50,.2), 0 4px 6px -1px rgba(0,0,0,.05)' : undefined,
  }),
  dayNum: {
    fontFamily: "'Sora', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  todayNum: {
    background: '#2E7D32',
    color: '#fff',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    boxShadow: '0 4px 10px rgba(46,125,50,.15)',
  },
  event: (cfg, isMulti, pos) => ({
    position: 'relative',
    fontSize: '10px',
    padding: '3px 6px',
    borderRadius: '6px',
    marginBottom: '3px',
    background: cfg.bg,
    color: cfg.strong,
    borderLeft: `3px solid ${cfg.color}`,
    cursor: 'pointer',
    transition: 'all .2s ease',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    ...(isMulti ? {
      background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color})`,
      color: '#fff',
      borderLeft: 'none',
      boxShadow: `0 2px 4px ${cfg.bg}`,
      borderRadius: pos === 'start' ? '6px 0 0 6px' : pos === 'end' ? '0 6px 6px 0' : '0',
    } : {}),
  }),
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: '60px repeat(7,1fr)',
    minWidth: '850px',
    background: '#ffffff',
  },
  headerCell: (isToday) => ({
    padding: '12px 6px',
    textAlign: 'center',
    borderBottom: '1px solid #334155',
    borderRight: '1px solid #334155',
    background: isToday ? '#1e40af' : '#0f172a',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    color: '#f8fafc',
  }),
  headerDayName: {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94a3b8',
  },
  headerDayNum: {
    fontFamily: "'Sora', sans-serif",
    fontSize: '18px',
    fontWeight: 700,
    color: '#f8fafc',
    marginTop: '3px',
  },
  allDayCell: {
    borderBottom: '1px solid #e2e8f0',
    borderRight: '1px solid #334155',
    background: '#1e293b',
    padding: '6px',
    minHeight: '40px',
    position: 'relative',
    color: '#f8fafc',
  },
  allDayEvent: (cfg) => ({
    background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color})`,
    color: '#fff',
    fontSize: '10px',
    fontWeight: 600,
    padding: '6px 10px',
    borderRadius: '6px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    boxShadow: `0 2px 4px ${cfg.bg}`,
    cursor: 'pointer',
    transition: 'all .2s ease',
  }),
  timeGutter: {
    padding: '6px',
    borderRight: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '10px',
    color: '#64748b',
    textAlign: 'right',
    fontWeight: 600,
    height: '54px',
    background: '#f1f5f9',
  },
  dayCol: {
    borderRight: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
    height: '54px',
    position: 'relative',
    background: '#ffffff',
    transition: 'all .2s ease',
  },
  schedEvent: (cfg, height) => ({
    position: 'absolute',
    left: '3px',
    right: '3px',
    top: '2px',
    height: `${height}px`,
    background: cfg.bg,
    borderLeft: `3px solid ${cfg.color}`,
    borderRadius: '6px',
    padding: '6px 8px',
    fontSize: '10px',
    color: '#0f172a',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'all .2s ease',
    overflow: 'hidden',
    zIndex: 1,
  }),
  evTime: {
    fontSize: '9px',
    fontWeight: 700,
    display: 'block',
    marginBottom: '2px',
  },
  evTitle: {
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#0f172a',
  },
  evSub: {
    fontSize: '9px',
    color: '#334155',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.4)',
    backdropFilter: 'blur(4px)',
    zIndex: 90,
  },
  drawer: (open) => ({
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '480px',
    maxWidth: '100%',
    background: '#ffffff',
    zIndex: 100,
    boxShadow: '-10px 0 30px -10px rgba(0,0,0,0.1)',
    transform: open ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform .35s cubic-bezier(.4,0,.2,1)',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #e2e8f0',
  }),
  drawerHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f1f5f9',
    flexShrink: 0,
  },
  drawerTitle: {
    fontFamily: "'Sora', sans-serif",
    fontSize: '17px',
    fontWeight: 700,
    color: '#0f172a',
  },
  drawerSub: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '3px',
    fontWeight: 500,
  },
  drawerClose: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all .2s ease',
  },
  drawerBody: {
    padding: '24px',
    flex: 1,
    overflowY: 'auto',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#0d9488',
    marginBottom: '16px',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    transition: 'all .2s ease',
  },
  detailHero: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
    padding: '18px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    marginBottom: '20px',
  },
  heroIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    background: 'rgba(13,148,136,.15)',
    color: '#0d9488',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroName: {
    fontSize: '15px',
    fontWeight: 700,
    fontFamily: "'Sora', sans-serif",
    color: '#0f172a',
  },
  heroMeta: {
    fontSize: '12px',
    color: '#334155',
    marginTop: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  heroClient: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0d9488',
    marginTop: '6px',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '20px',
  },
  detailItem: {
    padding: '12px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
  },
  detailLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    marginBottom: '5px',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
    wordBreak: 'break-word',
  },
  statusBadge: (cfg) => ({
    padding: '5px 12px',
    borderRadius: '8px',
    background: cfg.bg,
    color: cfg.strong,
    fontWeight: 700,
    border: `1px solid ${cfg.color}`,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    alignSelf: 'flex-start',
  }),
  timeline: {
    position: 'relative',
    paddingLeft: '26px',
    marginTop: '10px',
  },
  timelineLine: {
    position: 'absolute',
    left: '8px',
    top: '4px',
    bottom: '4px',
    width: '2px',
    background: '#e2e8f0',
  },
  timelineDot: (active, done) => ({
    position: 'absolute',
    left: '-22px',
    top: '2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: done ? '#2E7D32' : active ? '#0d9488' : '#ffffff',
    border: `2px solid ${done ? '#2E7D32' : active ? '#0d9488' : '#64748b'}`,
    boxShadow: active ? '0 0 0 4px rgba(46,125,50,.15)' : 'none',
  }),
  timelineItem: {
    position: 'relative',
    paddingBottom: '16px',
  },
  timelineTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
  },
  timelineTime: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
  },
  drawerCard: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '12px',
    background: '#f1f5f9',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all .2s ease',
  },
  fab: {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: '#000000',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'all .2s ease',
    zIndex: 10,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px',
  },
  modalContent: {
    background: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    background: '#f8fafc',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '4px',
  },
  modalSub: {
    fontSize: '13px',
    color: '#64748b',
  },
  modalClose: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all .2s ease',
    flexShrink: 0,
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
  },
  selectedDatesInfo: {
    marginBottom: '20px',
    padding: '16px',
    background: '#f1f5f9',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  selectedCount: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '8px',
  },
  selectedDatesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  selectedDateChip: {
    padding: '4px 12px',
    background: '#ffffff',
    border: '1px solid #2E7D32',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#2E7D32',
  },
  miniCalendar: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
  },
  miniWeekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7,1fr)',
    gap: '4px',
    marginBottom: '8px',
  },
  miniWeekday: {
    textAlign: 'center',
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    padding: '4px',
  },
  miniDaysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7,1fr)',
    gap: '4px',
  },
  miniDay: (outside, isToday, isSelected, isPast) => ({
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    cursor: isPast || outside ? 'not-allowed' : 'pointer',
    background: isSelected ? '#2E7D32' : isToday ? 'rgba(46,125,50,.1)' : outside ? '#f8fafc' : '#ffffff',
    border: `1px solid ${isSelected ? '#2E7D32' : isToday ? '#2E7D32' : '#e2e8f0'}`,
    opacity: outside || isPast ? 0.3 : 1,
    transition: 'all .2s ease',
    position: 'relative',
  }),
  miniDayNum: (isSelected) => ({
    fontSize: '13px',
    fontWeight: 600,
    color: isSelected ? '#ffffff' : '#0f172a',
    position: 'relative',
  }),
  miniCheckmark: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: '#ffffff',
    color: '#2E7D32',
    fontSize: '10px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #2E7D32',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    background: '#f8fafc',
  },
  cancelBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#334155',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all .2s ease',
  },
  confirmBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    background: '#000000',
    color: '#ffffff',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all .2s ease',
    opacity: 1,
  },
};

export default HearseCalendar;