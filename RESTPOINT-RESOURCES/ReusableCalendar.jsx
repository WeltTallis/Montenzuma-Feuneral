import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import './ReusableCalendar.css';


/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

const defaultQuickFilters = [
  { key: 'thisMonth', label: 'This Month' },
  { key: 'today',     label: 'Today' },
  { key: 'tomorrow',  label: 'Tomorrow' },
  { key: 'thisWeek',  label: 'This Week' },
  { key: 'nextWeek',  label: 'Next Week' },
  { key: 'nextMonth', label: 'Next Month' },
];

const resolveQuickFilter = (key) => {
  const now = new Date();
  const todayStr = toDateString(now);
  const dow = now.getDay();
  switch (key) {
    case 'today':
      return { date: todayStr, month: now.getMonth(), year: now.getFullYear(), clearSel: false };
    case 'tomorrow': {
      const d = new Date(now); d.setDate(d.getDate() + 1);
      return { date: toDateString(d), month: d.getMonth(), year: d.getFullYear(), clearSel: false };
    }
    case 'thisWeek': {
      const mon = new Date(now); mon.setDate(now.getDate() - ((dow + 6) % 7));
      return { date: todayStr, month: mon.getMonth(), year: mon.getFullYear(), clearSel: false };
    }
    case 'nextWeek': {
      const nm = new Date(now); nm.setDate(now.getDate() + (7 - ((dow + 6) % 7)));
      return { date: toDateString(nm), month: nm.getMonth(), year: nm.getFullYear(), clearSel: false };
    }
    case 'thisMonth':
      return { date: null, month: now.getMonth(), year: now.getFullYear(), clearSel: true };
    case 'nextMonth': {
      const m = now.getMonth() + 1;
      const y = m > 11 ? now.getFullYear() + 1 : now.getFullYear();
      const mo = m > 11 ? 0 : m;
      return { date: `${y}-${String(mo + 1).padStart(2, '0')}-01`, month: mo, year: y, clearSel: false };
    }
    default:
      return null;
  }
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
  quickFilters = defaultQuickFilters,
  showQuickFilters = true,
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
  accentColor = '#2563eb',
  locale = 'en-US',
  className = '',
}) => {
  const today = new Date();
  const todayStr = toDateString(today);
  const [internalDate, setInternalDate] = useState(todayStr);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [activeFilter, setActiveFilter] = useState(null);
  
  // Mobile date strip ref for auto-scrolling
  const dateStripRef = useRef(null);

  const isControlled = controlledDate !== undefined;
  const selectedDate = isControlled ? controlledDate : internalDate;
  const setSelectedDate = useCallback((d) => {
    if (onDateSelect) onDateSelect(d);
    if (!isControlled) setInternalDate(d);
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

  /* Calculate Upcoming Bookings (Next 5) */
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

  /* Build calendar cells */
  const cells = useMemo(() => {
    const dim = new Date(viewYear, viewMonth + 1, 0).getDate();
    const fdow = new Date(viewYear, viewMonth, 1).getDay();
    const pmd = new Date(viewYear, viewMonth, 0).getDate();
    const total = Math.ceil((fdow + dim) / 7) * 7;
    const out = [];
    for (let i = 0; i < total; i++) {
      let day, mo = viewMonth, yr = viewYear, other = false;
      if (i < fdow) {
        day = pmd - fdow + 1 + i; mo = viewMonth - 1;
        if (mo < 0) { mo = 11; yr--; }
        other = true;
      } else if (i >= fdow + dim) {
        day = i - fdow - dim + 1; mo = viewMonth + 1;
        if (mo > 11) { mo = 0; yr++; }
        other = true;
      } else {
        day = i - fdow + 1;
      }
      const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const arr = itemsByDate[ds] || [];
      const colors = getStatusColor
        ? [...new Set(arr.map(getStatusColor).filter(Boolean))]
        : [];
      out.push({
        day, mo, yr, other, ds,
        isToday: ds === todayStr,
        isSelected: ds === selectedDate,
        isPast: new Date(ds + 'T23:59:59') < today,
        isWeekend: (i % 7 === 0) || (i % 7 === 6),
        items: arr,
        count: arr.length,
        hasUrgent: getIsUrgent ? arr.some(getIsUrgent) : false,
        colors,
      });
    }
    return out;
  }, [viewYear, viewMonth, itemsByDate, todayStr, selectedDate, today, getStatusColor, getIsUrgent]);

  /* Generate mobile date strip data - all days in current month */
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
    if (dateStripRef.current) {
      const selectedIndex = mobileDateStrip.findIndex(
        d => d.isSelected || d.isToday
      );
      if (selectedIndex >= 0) {
        const scrollContainer = dateStripRef.current;
        const cardWidth = 72; // Approximate card width including gap
        const scrollPos = Math.max(0, selectedIndex * cardWidth - scrollContainer.clientWidth / 2 + 36);
        scrollContainer.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }
  }, [mobileDateStrip, selectedDate]);

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
    setActiveFilter(null);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
    setActiveFilter(null);
  };
  const applyQuickFilter = (key) => {
    const resolved = resolveQuickFilter(key);
    if (!resolved) return;
    setViewYear(resolved.year);
    setViewMonth(resolved.month);
    setActiveFilter(key);
    setSelectedDate(resolved.clearSel ? null : resolved.date);
  };
  const isFilterActive = (key) => activeFilter === key;

  const getFilterPeriodItems = useCallback(() => {
    if (activeFilter === 'thisWeek' || activeFilter === 'nextWeek') {
      const now = new Date();
      const dow = now.getDay();
      let monday;
      if (activeFilter === 'thisWeek') {
        monday = new Date(now);
        monday.setDate(now.getDate() - ((dow + 6) % 7));
      } else {
        monday = new Date(now);
        monday.setDate(now.getDate() + (7 - ((dow + 6) % 7)));
      }
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const items = [];
      for (let d = new Date(monday); d <= sunday; d.setDate(d.getDate() + 1)) {
        const ds = toDateString(d);
        const dayItems = itemsByDate[ds] || [];
        dayItems.forEach(it => items.push(it));
      }
      return items;
    }
    if (activeFilter === 'thisMonth' || activeFilter === 'nextMonth') {
      let mo = viewMonth, yr = viewYear;
      if (activeFilter === 'nextMonth') {
        mo = viewMonth === 11 ? 0 : viewMonth + 1;
        yr = viewMonth === 11 ? viewYear + 1 : viewYear;
      }
      const dim = new Date(yr, mo + 1, 0).getDate();
      const items = [];
      for (let d = 1; d <= dim; d++) {
        const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayItems = itemsByDate[ds] || [];
        dayItems.forEach(it => items.push(it));
      }
      return items;
    }
    if (activeFilter === 'today' || activeFilter === 'tomorrow') {
      const now = new Date();
      const ds = activeFilter === 'today' ? toDateString(now) : toDateString(new Date(now.getTime() + 86400000));
      return itemsByDate[ds] || [];
    }
    return null;
  }, [activeFilter, viewMonth, viewYear, itemsByDate]);

  const filterPeriodItems = useMemo(() => getFilterPeriodItems(), [getFilterPeriodItems]);
  const showFilterView = activeFilter && !selectedDate && filterPeriodItems !== null;

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

  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
  const hasAmount = getItemAmount != null;

  const defaultRenderItem = (item, idx) => {
    const title = getItemTitle ? getItemTitle(item) : 'Item';
    const subtitle = getItemSubtitle ? getItemSubtitle(item) : '';
    const meta = getItemMeta ? getItemMeta(item) : '';
    const amount = getItemAmount ? getItemAmount(item) : null;
    const status = getItemStatus ? getItemStatus(item) : null;
    const urgent = getIsUrgent ? getIsUrgent(item) : false;
    const statusColor = getStatusColor ? getStatusColor(item) : null;

    const cardStyle = statusColor 
      ? { borderLeft: `3px solid ${statusColor}` } 
      : { borderLeft: `3px solid var(--rc-border)` };

    return (
      <div 
        key={item[idKey] ?? idx} 
        className="rc-day-card" 
        onClick={() => onItemClick?.(item)}
        style={cardStyle}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
          background: statusColor ? `${statusColor}15` : 'var(--rc-bg-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: statusColor || 'var(--rc-text-muted)'
        }}>
          {I('road', 18)}
        </div>
        <div className="rc-day-card-body">
          <div className="rc-day-card-top">
            <span className="rc-day-card-title">{title}</span>
            {urgent && <span className="rc-urgent-tag" style={statusColor ? { background: `${statusColor}15`, color: statusColor } : undefined}>Urgent</span>}
          </div>
          {subtitle && <div className="rc-day-card-sub">{subtitle}</div>}
          {meta && <div className="rc-day-card-meta">{meta}</div>}
          <div className="rc-day-card-bot">
            {status && <span className="rc-day-card-status">{status}</span>}
            {amount != null && (
              <span className="rc-day-card-amt">
                {typeof amount === 'number' ? `$${amount.toFixed(2)}` : amount}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderItem = renderDayItem || defaultRenderItem;
  const thisMonthFilterActive = !selectedDate && activeFilter === 'thisMonth'
    && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  /* Helper to format upcoming dates */
  const formatUpcomingDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`rc-root ${className}`} style={{ '--rc-accent': accentColor }}>
      {/* ── Left: Calendar Grid ── */}
      <div className="rc-left">
        
        {/* ─── MOBILE HORIZONTAL DATE STRIP ─── */}
        <div className="rc-mobile-strip-container" ref={dateStripRef}>
          <div className="rc-mobile-date-strip">
            {mobileDateStrip.map((d) => (
              <button
                key={d.ds}
                className={[
                  'rc-mobile-date-card',
                  d.isToday && 'rc-mobile-date-today',
                  d.isSelected && 'rc-mobile-date-sel',
                  d.count > 0 && 'rc-mobile-date-has',
                  d.isWeekend && 'rc-mobile-date-we',
                  d.hasUrgent && 'rc-mobile-date-urgent',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedDate(d.ds)}
              >
                <span className="rc-mobile-date-weekday">{d.weekday}</span>
                <span className="rc-mobile-date-num">{d.day}</span>
                {d.count > 0 && (
                  <span className="rc-mobile-date-dots">
                    <span className={`rc-dot ${d.hasUrgent ? 'rc-dot-urgent' : ''}`} />
                    {d.count > 1 && <span className="rc-mobile-date-count-sm">{d.count}</span>}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings Strip (Desktop) */}
        {upcomingItems.length > 0 && (
          <div className="rc-upcoming-section rc-desktop-only">
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

        {/* Month Navigation */}
        <div className="rc-nav-row">
          <div className="rc-nav-arrows">
            <button className="rc-arrow-btn" onClick={goPrev} aria-label="Previous month">{I('chevL', 18)}</button>
            <h3 className="rc-month-label">{monthLabel}</h3>
            <button className="rc-arrow-btn" onClick={goNext} aria-label="Next month">{I('chevR', 18)}</button>
          </div>
          <div className="rc-month-summary">
            <span><strong>{monthSummary.count}</strong> {monthSummary.count === 1 ? 'item' : 'items'}</span>
            {hasAmount && monthSummary.total > 0 && (
              <>
                <span className="rc-sep">·</span>
                <span><strong>${monthSummary.total.toLocaleString()}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        {showQuickFilters && (
          <div className="rc-quick-row">
            {quickFilters.map((qf) => (
              <button
                key={qf.key}
                className={`rc-quick-btn ${qf.key === 'thisMonth' ? (thisMonthFilterActive ? 'rc-quick-on' : '') : (isFilterActive(qf.key) ? 'rc-quick-on' : '')}`}
                onClick={() => applyQuickFilter(qf.key)}
              >
                {qf.label}
              </button>
            ))}
          </div>
        )}

        {/* Weekday Headers (Desktop only) */}
        <div className="rc-weekday-row">
          {WEEKDAY_SHORT.map((w, i) => (
            <div key={w} className="rc-weekday-hdr">{w}</div>
          ))}
        </div>

        {/* Calendar Grid (Desktop only) */}
        <div className="rc-grid">
          {cells.map((c, i) => (
            <div
              key={i}
              className={[
                'rc-cell',
                c.other && 'rc-cell-other',
                c.isToday && 'rc-cell-today',
                c.isSelected && 'rc-cell-sel',
                c.count > 0 && 'rc-cell-has',
                c.isWeekend && !c.other && 'rc-cell-we',
              ].filter(Boolean).join(' ')}
              onClick={() => setSelectedDate(c.ds)}
              role="button"
              tabIndex={0}
              aria-label={`${c.ds}, ${c.count} items`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDate(c.ds); } }}
            >
              <div className="rc-cell-top">
                <span className="rc-cell-num">{c.day}</span>
                {c.hasUrgent && !c.other && <span className="rc-urgent-badge">!</span>}
              </div>
              {c.count > 0 && !c.other && (
                <>
                  <div className="rc-cell-dots">
                    {c.colors.slice(0, 4).map((col, j) => (
                      <span key={j} className="rc-dot" style={{ background: col }} />
                    ))}
                    {c.count > 4 && <span className="rc-dot-more">+{c.count - 4}</span>}
                  </div>
                  <span className="rc-cell-count">{c.count}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Day Detail / Filter Period Panel ── */}
      <div className="rc-right">
        {showFilterView ? (
          <>
            <div className="rc-day-hdr">
              <div className="rc-day-hdr-text">
                <h3 className="rc-day-title">
                  {activeFilter === 'thisWeek' && 'This Week'}
                  {activeFilter === 'nextWeek' && 'Next Week'}
                  {activeFilter === 'thisMonth' && 'This Month'}
                  {activeFilter === 'nextMonth' && 'Next Month'}
                  {activeFilter === 'today' && 'Today'}
                  {activeFilter === 'tomorrow' && 'Tomorrow'}
                </h3>
                <p className="rc-day-sub">{filterPeriodItems.length} {filterPeriodItems.length === 1 ? 'booking' : 'bookings'}</p>
              </div>
            </div>
            {filterPeriodItems.length === 0 ? (
              <div className="rc-day-empty">
                <span className="rc-day-empty-icon">{I('calendar', 28)}</span>
                <p>No bookings for this period</p>
              </div>
            ) : (
              <div className="rc-day-list">
                {[...filterPeriodItems].sort((a, b) => {
                  const dA = a[dateKey] || '';
                  const dB = b[dateKey] || '';
                  return dA.localeCompare(dB);
                }).map((item, idx) => renderItem(item, idx))}
              </div>
            )}
          </>
        ) : selectedDate ? (
          <>
            <div className="rc-day-hdr">
              <div className="rc-day-hdr-text">
                <h3 className="rc-day-title">{toDisplayDate(selectedDate)}</h3>
                <p className="rc-day-sub">{selItems.length} {selItems.length === 1 ? 'item' : 'items'}</p>
              </div>
              {showAddButton && onAddForDate && (
                <button className="rc-add-btn" onClick={() => onAddForDate(selectedDate)}>
                  {I('plus', 14)} {addButtonText}
                </button>
              )}
            </div>

            {selItems.length === 0 ? (
              renderDayEmpty ? renderDayEmpty(selectedDate) : (
                <div className="rc-day-empty">
                  <span className="rc-day-empty-icon">{I('calendar', 28)}</span>
                  <p>No items for this date</p>
                  {showAddButton && onAddForDate && (
                    <button className="rc-add-btn rc-add-btn-outline" onClick={() => onAddForDate(selectedDate)}>
                      {I('plus', 14)} {addButtonText}
                    </button>
                  )}
                </div>
              )
            ) : (
              <div className="rc-day-list">
                {selItems.map((item, idx) => renderItem(item, idx))}
                {hasAmount && (
                  <div className="rc-day-total">
                    <span>Total</span>
                    <strong>
                      ${selItems.reduce((s, item) => {
                        const a = getItemAmount(item);
                        return s + (typeof a === 'string' ? parseFloat(a.replace(/[^0-9.-]/g, '')) || 0 : a || 0);
                      }, 0).toFixed(2)}
                    </strong>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          renderDayEmpty?.(null) || (
            <div className="rc-day-empty rc-day-prompt">
              <span className="rc-day-prompt-icon">{I('calendar', 36)}</span>
              <p className="rc-day-prompt-title">Select a date</p>
              <p className="rc-day-prompt-sub">Click any day to view items</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ReusableCalendar;
