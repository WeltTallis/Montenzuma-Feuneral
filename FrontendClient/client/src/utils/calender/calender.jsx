import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './ReusableCalendar.css';

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const toDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toDisplayDate = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
};

const Ic = ({ p, s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {p}
  </svg>
);
const IconPaths = {
  chevL: <path d="M15 18l-6-6 6-6" />,
  chevR: <path d="M9 18l6-6-6-6" />,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  road: <><path d="M4 19h16M4 15h16M4 11h16M4 7h16" /></>,
};
const I = (name, size) => <Ic p={IconPaths[name]} s={size} />;

/* Get Monday of the current week */
const getWeekMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
};

const ReusableCalendar = ({
  items = [],
  dateKey = 'date',
  idKey = 'id',
  selectedDate: controlledDate,
  onDateSelect,
  onItemClick,
  onAddForDate,
  showAddButton = true,
  addButtonText = 'Add',
  renderDayItem,
  renderDayEmpty,
  getStatusColor,
  getIsUrgent,
  getSortKey,
  getItemTitle,
  getItemSubtitle,
  getItemMeta,
  getItemAmount,
  getItemStatus,
  getItemImage,
  getItemTime,
  getItemDestination,
  getItemPlate,
  accentColor = '#0f172a',
  locale = 'en-US',
  className = '',
}) => {
  const today = new Date();
  const todayStr = toDateString(today);
  const [internalDate, setInternalDate] = useState(todayStr);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [showWeekView, setShowWeekView] = useState(false);
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  
  const dateStripRef = useRef(null);
  const calendarRef = useRef(null);

  const isControlled = controlledDate !== undefined;
  const selectedDate = isControlled ? controlledDate : internalDate;
  const setSelectedDate = useCallback((d) => {
    if (onDateSelect) onDateSelect(d);
    if (!isControlled) setInternalDate(d);
    setShowWeekView(false);
  }, [onDateSelect, isControlled]);

  /* Group items by date */
  const itemsByDate = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      const d = item[dateKey];
      if (!d) return;
      if (!map[d]) map[d] = [];
      map[d].push(item);
    });
    return map;
  }, [items, dateKey]);

  /* Convert items to FullCalendar events */
  const events = useMemo(() => {
    return items
      .map((item) => {
        const dateStr = item[dateKey];
        if (!dateStr) return null;
        
        const status = getItemStatus ? getItemStatus(item) : null;
        const statusColors = {
          pending: '#F59E0B',
          booked: '#2563EB',
          'in_transit': '#D32F2F',
          transit: '#D32F2F',
          completed: '#2E7D32',
          cancelled: '#ef4444',
          confirmed: '#2563EB',
        };
        const color = statusColors[status?.toLowerCase()] || getStatusColor?.(item) || accentColor;
        const title = getItemTitle ? getItemTitle(item) : 'Item';
        const time = getItemTime ? getItemTime(item) : null;

        let startDate = new Date(dateStr + 'T00:00:00');
        let endDate = new Date(dateStr + 'T23:59:59');
        
        // If time is provided, use it
        if (time) {
          const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const meridiem = timeMatch[3]?.toUpperCase();
            
            if (meridiem === 'PM' && hours < 12) hours += 12;
            if (meridiem === 'AM' && hours === 12) hours = 0;
            
            startDate = new Date(dateStr);
            startDate.setHours(hours, minutes, 0, 0);
            
            endDate = new Date(startDate);
            endDate.setHours(hours + 1, minutes, 0, 0);
          }
        }

        return {
          id: item[idKey] || `item-${Math.random()}`,
          title: title,
          start: startDate,
          end: endDate,
          allDay: !time,
          backgroundColor: color,
          borderColor: color,
          textColor: '#FFFFFF',
          extendedProps: {
            ...item,
            status: status,
            statusColor: color,
            time: time,
            destination: getItemDestination ? getItemDestination(item) : null,
            plate: getItemPlate ? getItemPlate(item) : null,
            amount: getItemAmount ? getItemAmount(item) : null,
            subtitle: getItemSubtitle ? getItemSubtitle(item) : '',
            meta: getItemMeta ? getItemMeta(item) : '',
            urgent: getIsUrgent ? getIsUrgent(item) : false,
          }
        };
      })
      .filter(e => e !== null);
  }, [items, dateKey, getItemStatus, getStatusColor, getItemTitle, getItemTime, 
      getItemDestination, getItemPlate, getItemAmount, getItemSubtitle, getItemMeta, getIsUrgent, accentColor, idKey]);

  /* Upcoming Bookings (Next 5) */
  const upcomingItems = useMemo(() => {
    return items
      .filter(item => item[dateKey] >= todayStr)
      .sort((a, b) => (a[dateKey] || '').localeCompare(b[dateKey] || ''))
      .slice(0, 5);
  }, [items, dateKey, todayStr]);

  /* Month summary */
  const monthSummary = useMemo(() => {
    let count = 0;
    let total = 0;
    const dim = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const arr = itemsByDate[ds] || [];
      count += arr.length;
      arr.forEach((item) => {
        const amt = getItemAmount ? getItemAmount(item) : null;
        if (amt != null) total += typeof amt === 'string' ? parseFloat(amt.replace(/[^0-9.-]/g, '')) || 0 : amt;
      });
    }
    return { count, total };
  }, [viewYear, viewMonth, itemsByDate, getItemAmount]);

  /* Mobile date strip data */
  const mobileDateStrip = useMemo(() => {
    const dim = new Date(viewYear, viewMonth + 1, 0).getDate();
    const strip = [];
    for (let d = 1; d <= dim; d++) {
      const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const arr = itemsByDate[ds] || [];
      const dateObj = new Date(ds + 'T12:00:00');
      strip.push({
        day: d,
        ds,
        weekday: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: ds === todayStr,
        isSelected: ds === selectedDate,
        isWeekend: dateObj.getDay() === 0 || dateObj.getDay() === 6,
        items: arr,
        count: arr.length,
        hasUrgent: getIsUrgent ? arr.some(getIsUrgent) : false,
      });
    }
    return strip;
  }, [viewYear, viewMonth, itemsByDate, todayStr, selectedDate, getIsUrgent]);

  /* Auto-scroll to selected/today date on mobile */
  useEffect(() => {
    if (dateStripRef.current && !showWeekView && window.innerWidth < 768) {
      const selectedIndex = mobileDateStrip.findIndex(
        d => d.isSelected || d.isToday
      );
      if (selectedIndex >= 0) {
        const scrollContainer = dateStripRef.current;
        const cardWidth = 60;
        const scrollPos = Math.max(0, selectedIndex * cardWidth - scrollContainer.clientWidth / 2 + 30);
        scrollContainer.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }
  }, [mobileDateStrip, selectedDate, showWeekView]);

  /* Selected date items */
  const selItems = selectedDate
    ? [...(itemsByDate[selectedDate] || [])].sort((a, b) => {
        if (getSortKey) {
          const ka = getSortKey(a), kb = getSortKey(b);
          if (typeof ka === 'number' && typeof kb === 'number') return ka - kb;
          return String(ka).localeCompare(String(kb));
        }
        return 0;
      })
    : [];

  /* Google Calendar-like rich item renderer */
  const defaultRenderItem = (item, idx) => {
    const title = getItemTitle ? getItemTitle(item) : 'Item';
    const subtitle = getItemSubtitle ? getItemSubtitle(item) : '';
    const meta = getItemMeta ? getItemMeta(item) : '';
    const amount = getItemAmount ? getItemAmount(item) : null;
    const status = getItemStatus ? getItemStatus(item) : null;
    const urgent = getIsUrgent ? getIsUrgent(item) : false;
    const statusColor = getStatusColor ? getStatusColor(item) : accentColor;
    const time = getItemTime ? getItemTime(item) : null;
    const destination = getItemDestination ? getItemDestination(item) : null;
    const plate = getItemPlate ? getItemPlate(item) : null;

    const statusColors = {
      pending: '#F59E0B',
      booked: '#2563EB',
      'in_transit': '#D32F2F',
      transit: '#D32F2F',
      completed: '#2E7D32',
      cancelled: '#ef4444',
      confirmed: '#2563EB',
    };

    const finalColor = statusColors[status?.toLowerCase()] || statusColor || accentColor;

    return (
      <div 
        key={item[idKey] ?? idx} 
        className="rc-day-card rc-day-card-google" 
        onClick={() => onItemClick?.(item)}
        style={{ 
          borderLeft: `4px solid ${finalColor}`,
          background: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '12px 16px',
          marginBottom: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {time && (
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#666', marginBottom: '2px' }}>
                🕐 {time}
              </span>
            )}
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#000000', marginBottom: '2px' }}>
              {title}
            </span>
            {destination && (
              <span style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                📍 {destination}
              </span>
            )}
            {subtitle && (
              <span style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{subtitle}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            {status && (
              <span style={{ 
                fontSize: '10px', fontWeight: 700, padding: '2px 10px', borderRadius: '12px',
                background: `${finalColor}15`, color: finalColor, textTransform: 'uppercase', letterSpacing: '0.3px'
              }}>
                {status}
              </span>
            )}
            {amount != null && (
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#000000' }}>
                {typeof amount === 'number' ? `$${amount.toFixed(2)}` : amount}
              </span>
            )}
          </div>
        </div>
        {plate && (
          <div style={{ fontSize: '10px', color: '#999', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            🚗 {plate}
          </div>
        )}
        {urgent && (
          <div style={{ 
            fontSize: '10px', fontWeight: 700, color: '#D32F2F', background: '#FFEBEE',
            padding: '1px 8px', borderRadius: '4px', alignSelf: 'flex-start'
          }}>
            ⚠️ URGENT
          </div>
        )}
        {meta && (
          <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{meta}</div>
        )}
      </div>
    );
  };

  const renderItem = renderDayItem || defaultRenderItem;

  const formatUpcomingDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getWeekRangeLabel = () => {
    const monday = getWeekMonday(selectedDate ? new Date(selectedDate + 'T12:00:00') : today);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const monStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const sunStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${monStr} - ${sunStr}`;
  };

  // FullCalendar event renderer
  const renderEventContent = (eventInfo) => {
    const props = eventInfo.event.extendedProps;
    const isMonthView = calendarView === 'dayGridMonth';
    
    if (isMonthView) {
      return null;
    }

    return (
      <div style={{ 
        padding: '2px 6px', 
        fontSize: '11px',
        fontWeight: 600,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: '100%'
      }}>
        <span className="fc-event-time" style={{ fontSize: '10px', opacity: 0.8, marginRight: '4px' }}>
          {eventInfo.timeText}
        </span>
        <span className="fc-event-title">{eventInfo.event.title}</span>
      </div>
    );
  };

  // FullCalendar date click handler
  const handleDateClick = (info) => {
    const dateStr = info.dateStr.split('T')[0];
    setSelectedDate(dateStr);
  };

  // FullCalendar event click handler
  const handleEventClick = (info) => {
    const item = info.event.extendedProps;
    if (onItemClick) onItemClick(item);
  };

  // FullCalendar view change handler
  const handleViewChange = (view) => {
    setCalendarView(view.type);
  };

  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
  const hasAmount = getItemAmount != null;

  return (
    <div className={`rc-root ${className}`} style={{ '--rc-accent': accentColor }}>
      
      {/* ══════════════════════════════════════════
          MOBILE VIEW (< 768px)
          ══════════════════════════════════════════ */}
      <div className="rc-mobile-view">
        
        <div className="rc-mobile-header">
          <button 
            className={`rc-this-week-btn ${showWeekView ? 'rc-week-active' : ''}`}
            onClick={handleThisWeekClick}
          >
            <span className="rc-week-icon">📅</span>
            This Week
          </button>
          
          <div className="rc-mobile-nav">
            <button className="rc-arrow-btn" onClick={goPrev}>{I('chevL', 16)}</button>
            <span className="rc-mobile-month-label">{monthLabel}</span>
            <button className="rc-arrow-btn" onClick={goNext}>{I('chevR', 16)}</button>
          </div>
        </div>

        {showWeekView ? (
          <div className="rc-week-container">
            <div className="rc-week-header">
              <h3>{getWeekRangeLabel()}</h3>
              <button className="rc-close-week-btn" onClick={() => setShowWeekView(false)}>✕</button>
            </div>
            
            <div className="rc-week-days-strip">
              {weekDaysData.map((wd, idx) => (
                <div
                  key={idx}
                  className={[
                    'rc-week-day-card',
                    wd.isToday && 'rc-week-today',
                    wd.isSelected && 'rc-week-selected',
                    wd.isWeekend && 'rc-weekend-day',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedDate(wd.ds)}
                >
                  <span className="rc-week-day-name">{wd.dayShort}</span>
                  <span className="rc-week-day-num">{wd.dayNum}</span>
                  {wd.count > 0 && (
                    <span className="rc-week-item-count">{wd.count}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="rc-week-content">
              {selectedDate ? (
                selItems.length > 0 ? (
                  <div className="rc-day-list">
                    {selItems.map((item, idx) => renderItem(item, idx))}
                    {hasAmount && (
                      <div className="rc-day-total-google">
                        <span>Total</span>
                        <strong>${selItems.reduce((s, item) => {
                          const a = getItemAmount(item);
                          return s + (typeof a === 'string' ? parseFloat(a.replace(/[^0-9.-]/g, '')) || 0 : a || 0);
                        }, 0).toFixed(2)}</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rc-day-empty-google">
                    <span className="rc-day-empty-icon">{I('calendar', 32)}</span>
                    <p>No items for this day</p>
                    {showAddButton && onAddForDate && (
                      <button className="rc-add-btn-google" onClick={() => onAddForDate(selectedDate)}>
                        {I('plus', 14)} {addButtonText}
                      </button>
                    )}
                  </div>
                )
              ) : (
                <div className="rc-day-empty-google rc-day-prompt">
                  <p className="rc-day-prompt-title">Tap a day above</p>
                  <p className="rc-day-prompt-sub">to see its items</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="rc-date-strip-container" ref={dateStripRef}>
              <div className="rc-date-strip">
                {mobileDateStrip.map((d) => (
                  <button
                    key={d.ds}
                    className={[
                      'rc-date-card',
                      d.isToday && 'rc-date-today',
                      d.isSelected && 'rc-date-sel',
                      d.count > 0 && 'rc-date-has-items',
                      d.isWeekend && 'rc-date-weekend',
                      d.hasUrgent && 'rc-date-urgent',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedDate(d.ds)}
                  >
                    <span className="rc-date-weekday">{d.weekday}</span>
                    <span className="rc-date-num">{d.day}</span>
                    {d.count > 0 && (
                      <span className="rc-date-indicator">
                        <span className={`rc-dot ${d.hasUrgent ? 'rc-dot-urgent' : ''}`} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="rc-mobile-details">
              {selectedDate ? (
                <>
                  <div className="rc-mobile-detail-hdr">
                    <h3>{toDisplayDate(selectedDate)}</h3>
                    {showAddButton && onAddForDate && (
                      <button className="rc-add-btn-google" onClick={() => onAddForDate(selectedDate)}>
                        {I('plus', 14)} {addButtonText}
                      </button>
                    )}
                  </div>
                  
                  {selItems.length > 0 ? (
                    <div className="rc-day-list">
                      {selItems.map((item, idx) => renderItem(item, idx))}
                      {hasAmount && (
                        <div className="rc-day-total-google">
                          <span>Total</span>
                          <strong>${selItems.reduce((s, item) => {
                            const a = getItemAmount(item);
                            return s + (typeof a === 'string' ? parseFloat(a.replace(/[^0-9.-]/g, '')) || 0 : a || 0);
                          }, 0).toFixed(2)}</strong>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rc-day-empty-google">
                      <span className="rc-day-empty-icon">{I('calendar', 28)}</span>
                      <p>No items for this date</p>
                      {showAddButton && onAddForDate && (
                        <button className="rc-add-btn-google" onClick={() => onAddForDate(selectedDate)}>
                          {I('plus', 14)} {addButtonText}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="rc-day-empty-google rc-day-prompt">
                  <span className="rc-day-prompt-icon">{I('calendar', 36)}</span>
                  <p className="rc-day-prompt-title">Select a date</p>
                  <p className="rc-day-prompt-sub">Scroll and tap any date above</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP VIEW (>= 768px) - FullCalendar
          ══════════════════════════════════════════ */}
      <div className="rc-desktop-view">
        <div className="rc-left">
          
          {upcomingItems.length > 0 && (
            <div className="rc-upcoming-section">
              <div className="rc-upcoming-hdr">
                <span className="rc-upcoming-title">Upcoming</span>
                <span className="rc-upcoming-count">{upcomingItems.length} Next</span>
              </div>
              <div className="rc-upcoming-strip">
                {upcomingItems.map((item, idx) => {
                  const title = getItemTitle ? getItemTitle(item) : 'Booking';
                  const dateStr = item[dateKey];
                  return (
                    <div 
                      key={idx} 
                      className="rc-upcoming-card" 
                      onClick={() => {
                        const d = new Date(dateStr + 'T12:00:00');
                        setViewMonth(d.getMonth());
                        setViewYear(d.getFullYear());
                        setSelectedDate(dateStr);
                      }}
                    >
                      <span className="rc-upcoming-date">{formatUpcomingDate(dateStr)}</span>
                      <span className="rc-upcoming-name">{title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FullCalendar */}
          <div className="rc-fullcalendar-wrapper">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
              }}
              views={{
                dayGridMonth: {
                  titleFormat: { year: 'numeric', month: 'long' },
                  dayHeaderFormat: { weekday: 'short' },
                  dayMaxEvents: 3,
                },
                timeGridWeek: {
                  titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
                  dayHeaderFormat: { weekday: 'short', month: 'short', day: 'numeric' },
                  slotMinTime: '05:00:00',
                  slotMaxTime: '23:00:00',
                }
              }}
              events={events}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              viewDidMount={handleViewChange}
              eventContent={renderEventContent}
              height="100%"
              contentHeight="100%"
              firstDay={0}
              weekends={true}
              nowIndicator={true}
              selectable={true}
              dayMaxEvents={3}
              moreLinkText="+%d more"
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
              }}
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
              }}
              buttonText={{
                today: 'Today',
                month: 'Month',
                week: 'Week'
              }}
              eventMinHeight={20}
              expandRows={true}
              stickyHeaderDates={true}
              weekNumbers={false}
            />
          </div>
        </div>

        <div className="rc-right">
          {selectedDate ? (
            <>
              <div className="rc-day-hdr-google">
                <div className="rc-day-hdr-text">
                  <h3 className="rc-day-title-google">{toDisplayDate(selectedDate)}</h3>
                  <p className="rc-day-sub-google">{selItems.length} {selItems.length === 1 ? 'item' : 'items'}</p>
                </div>
                {showAddButton && onAddForDate && (
                  <button className="rc-add-btn-google" onClick={() => onAddForDate(selectedDate)}>
                    {I('plus', 14)} {addButtonText}
                  </button>
                )}
              </div>

              {selItems.length === 0 ? (
                renderDayEmpty ? renderDayEmpty(selectedDate) : (
                  <div className="rc-day-empty-google">
                    <span className="rc-day-empty-icon">{I('calendar', 28)}</span>
                    <p>No items for this date</p>
                    {showAddButton && onAddForDate && (
                      <button className="rc-add-btn-google" onClick={() => onAddForDate(selectedDate)}>
                        {I('plus', 14)} {addButtonText}
                      </button>
                    )}
                  </div>
                )
              ) : (
                <div className="rc-day-list-google">
                  {selItems.map((item, idx) => renderItem(item, idx))}
                  {hasAmount && (
                    <div className="rc-day-total-google">
                      <span>Total</span>
                      <strong>${selItems.reduce((s, item) => {
                        const a = getItemAmount(item);
                        return s + (typeof a === 'string' ? parseFloat(a.replace(/[^0-9.-]/g, '')) || 0 : a || 0);
                      }, 0).toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            renderDayEmpty?.(null) || (
              <div className="rc-day-empty-google rc-day-prompt">
                <span className="rc-day-prompt-icon">{I('calendar', 36)}</span>
                <p className="rc-day-prompt-title">Select a date</p>
                <p className="rc-day-prompt-sub">Click any day to view items</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ReusableCalendar;