import React from 'react';

/* ============================================================================
   ReservationToolbar — search, status filters, date navigation, view tabs.
   ============================================================================ */
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function ReservationToolbar({
  searchQuery,
  onSearchChange,
  filters,
  filterCounts,
  activeFilters,
  onToggleFilter,
  onPrev,
  onNext,
  onToday,
  view,
  onViewChange,
}) {
  return (
    <div className="cb-tb">
      <div className="cb-tb-left">
        <div className="cb-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="cb-divider" />
        <div className="cb-filter-chips">
          {filters.map((s) => {
            const isActive = activeFilters.indexOf(s.key) !== -1;
            return (
              <div
                key={s.key}
                className={'cb-fc' + (isActive ? ' on' : '')}
                onClick={() => onToggleFilter(s.key)}
              >
                <span className="cb-fc-dot" style={{ background: s.color }} />
                {s.label}
                <span className="cb-fc-ct">{filterCounts[s.key]}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="cb-tb-right">
        <button className="cb-tb-btn sq" onClick={onPrev} title="Previous">
          <ChevronLeftIcon />
        </button>
        <button className="cb-tb-btn sq" onClick={onNext} title="Next">
          <ChevronRightIcon />
        </button>
        <button className="cb-tb-btn" onClick={onToday}>Today</button>
        <div className="cb-divider" />
        <div className="cb-tb-views">
          {['day', 'week', 'month', 'full'].map((v) => (
            <button
              key={v}
              className={'cb-tb-v' + (view === v ? ' on' : '')}
              onClick={() => onViewChange(v)}
            >
              {v === 'full' ? 'Full' : v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReservationToolbar;
