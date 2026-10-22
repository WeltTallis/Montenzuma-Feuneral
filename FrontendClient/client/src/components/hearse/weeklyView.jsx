import React, { useMemo, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toDateKey } from '../../utils/dates/parseDates';
import styled from 'styled-components';

// ===== SHARED CONSTANTS =====
export const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB', textColor: '#92400E' },
  booked: { label: 'Booked', color: '#2563EB', bg: '#EFF6FF', textColor: '#1E40AF' },
  in_transit: { label: 'In Transit', color: '#D32F2F', bg: '#FFEBEE', textColor: '#B71C1C' },
  completed: { label: 'Completed', color: '#2E7D32', bg: '#E8F5E9', textColor: '#1B5E20' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2', textColor: '#991B1B' },
  confirmed: { label: 'Confirmed', color: '#2563EB', bg: '#EFF6FF', textColor: '#1E40AF' },
};

// ===== STYLED COMPONENTS =====
const WeeklyWrapper = styled.div`
  height: 100%;
  width: 100%;
  position: relative;

  .fc {
    height: 100% !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  }

  .fc .fc-timegrid-body {
    background: #FFFFFF;
  }

  .fc .fc-timegrid-body table {
    border-collapse: collapse !important;
  }

  .fc .fc-timegrid-axis {
    background: #FAFAFA !important;
    border-right: 1px solid #EEEEEE !important;
  }

  .fc .fc-timegrid-axis-cushion {
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #999999 !important;
    padding: 4px 8px !important;
  }

  .fc .fc-timegrid-slot-label {
    background: #FAFAFA !important;
    border-bottom: 1px solid #EEEEEE !important;
  }

  .fc .fc-timegrid-slot-label-cushion {
    font-size: 11px !important;
    font-weight: 600 !important;
    color: #999999 !important;
  }

  .fc .fc-timegrid-col {
    border-right: 1px solid #EEEEEE !important;
    background: #FFFFFF;
  }

  .fc .fc-timegrid-col.fc-day-today {
    background: #FAFAFA !important;
  }

  .fc .fc-col-header-cell {
    padding: 12px 0 !important;
    background: #FFFFFF !important;
    border-bottom: 2px solid #EEEEEE !important;
  }

  .fc .fc-col-header-cell-cushion {
    font-size: 13px !important;
    font-weight: 700 !important;
    color: #000000 !important;
    text-decoration: none !important;
  }

  .fc .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion {
    color: #2E7D32 !important;
  }

  .fc .fc-timegrid-event {
    border-radius: 8px !important;
    border: none !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    padding: 4px 8px !important;
    margin: 1px 2px !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
  }

  .fc .fc-timegrid-event:hover {
    transform: scale(1.02) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    z-index: 10 !important;
  }

  .fc .fc-timegrid-event .fc-event-time {
    font-size: 10px !important;
    font-weight: 600 !important;
    opacity: 0.9 !important;
    display: block !important;
  }

  .fc .fc-timegrid-event .fc-event-title {
    font-weight: 700 !important;
    font-size: 12px !important;
    display: block !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .fc .fc-timegrid-event .fc-event-destination {
    font-size: 10px !important;
    opacity: 0.8 !important;
    display: block !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .fc .fc-timegrid-now-indicator-line {
    border-color: #D32F2F !important;
    border-width: 2px !important;
  }

  .fc .fc-timegrid-now-indicator-arrow {
    border-color: #D32F2F !important;
    border-width: 5px !important;
  }

  .fc .fc-timegrid-now-indicator-line::before {
    content: '● ' !important;
    color: #D32F2F !important;
    font-size: 12px !important;
    position: absolute !important;
    left: -20px !important;
    top: -6px !important;
  }

  .fc .fc-daygrid-day-bottom {
    font-size: 11px !important;
    font-weight: 600 !important;
    color: #999999 !important;
    padding: 4px !important;
  }

  .fc .fc-popover {
    border-radius: 12px !important;
    border: 1px solid #EEEEEE !important;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08) !important;
    background: #FFFFFF !important;
  }

  .fc .fc-popover-header {
    padding: 12px 16px !important;
    background: #FAFAFA !important;
    border-bottom: 1px solid #EEEEEE !important;
    border-radius: 12px 12px 0 0 !important;
  }

  .fc .fc-popover-title {
    font-size: 14px !important;
    font-weight: 700 !important;
    color: #000000 !important;
  }

  .fc .fc-popover-body {
    padding: 8px 12px !important;
  }

  .fc .fc-popover-body .fc-event {
    border-radius: 6px !important;
    padding: 6px 10px !important;
    margin: 4px 0 !important;
  }

  .fc .fc-timegrid-bg-harness {
    background: #FFFFFF !important;
  }

  .fc .fc-timegrid-col-events {
    padding: 2px !important;
  }

  /* All-day row styling */
  .fc .fc-timegrid-axis-frame {
    background: #FAFAFA !important;
  }

  .fc .fc-timegrid-axis-frame .fc-timegrid-axis-cushion {
    font-size: 10px !important;
    font-weight: 700 !important;
    color: #999999 !important;
    text-transform: uppercase !important;
  }

  .fc .fc-timegrid-all-day-events {
    min-height: 40px !important;
    background: #FFFFFF !important;
  }

  .fc .fc-timegrid-all-day-event {
    border-radius: 6px !important;
    border: none !important;
    padding: 4px 8px !important;
    margin: 2px 4px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
  }

  /* More link styling */
  .fc .fc-daygrid-more-link {
    font-size: 11px !important;
    font-weight: 600 !important;
    color: #2563EB !important;
    cursor: pointer !important;
    padding: 2px 4px !important;
    border-radius: 4px !important;
  }

  .fc .fc-daygrid-more-link:hover {
    background: #EFF6FF !important;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .fc .fc-col-header-cell-cushion {
      font-size: 11px !important;
    }

    .fc .fc-timegrid-event .fc-event-title {
      font-size: 10px !important;
    }

    .fc .fc-timegrid-event .fc-event-time {
      font-size: 9px !important;
    }

    .fc .fc-timegrid-event .fc-event-destination {
      font-size: 9px !important;
    }
  }

  @media (max-width: 640px) {
    .fc .fc-col-header-cell {
      padding: 8px 0 !important;
    }

    .fc .fc-col-header-cell-cushion {
      font-size: 10px !important;
    }

    .fc .fc-timegrid-axis-cushion {
      font-size: 10px !important;
    }

    .fc .fc-timegrid-event {
      padding: 2px 4px !important;
    }

    .fc .fc-timegrid-event .fc-event-title {
      font-size: 9px !important;
    }

    .fc .fc-timegrid-now-indicator-line::before {
      display: none !important;
    }
  }
`;

// ===== STATS BAR =====
const StatsBar = styled.div`
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #FAFAFA;
  border-radius: 10px;
  flex-wrap: wrap;
  border: 1px solid #EEEEEE;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.color || '#000000'};
`;

const StatDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.color};
`;

// ===== WEEKLY VIEW COMPONENT =====
export default function WeeklyView({
  currentDate,
  bookings = {},
  getEvents,
  openDay,
  openBookingDetails,
  onRefresh
}) {
  const calendarRef = useRef(null);
  const fmtDS = toDateKey;

  // Get week range for stats
  const weekStats = useMemo(() => {
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());

    const allBookings = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const ds = fmtDS(d);
      const dayBookings = getEvents ? getEvents(ds) : (bookings[ds] || []);
      allBookings.push(...dayBookings);
    }

    const total = allBookings.length;
    const transit = allBookings.filter(b => b.status === 'in_transit' || b.status === 'transit').length;
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const completed = allBookings.filter(b => b.status === 'completed').length;
    const booked = allBookings.filter(b => b.status === 'booked' || b.status === 'confirmed').length;

    return { total, transit, pending, completed, booked };
  }, [currentDate, bookings, getEvents]);

  // Convert bookings to FullCalendar events
  const events = useMemo(() => {
    const allEvents = [];
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      const ds = fmtDS(day);
      const dayBookings = getEvents ? getEvents(ds) : (bookings[ds] || []);

      dayBookings.forEach((b) => {
        const status = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
        
        // Determine if all-day event
        const isAllDay = b.allDay || false;
        
        let startDate, endDate;
        
        if (isAllDay) {
          // All-day event
          startDate = new Date(day);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(day);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Timed event
          startDate = new Date(day);
          const startHour = Math.floor(b.start || 9);
          const startMin = Math.round((b.start % 1) * 60);
          startDate.setHours(startHour, startMin, 0, 0);

          endDate = new Date(day);
          const endHour = Math.floor(b.end || 10);
          const endMin = Math.round((b.end % 1) * 60);
          endDate.setHours(endHour, endMin, 0, 0);

          // If end time is before start time, add a day
          if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
          }
        }

        allEvents.push({
          id: b.id || `${ds}-${Math.random()}`,
          title: b.client || 'Unknown Client',
          start: startDate,
          end: endDate,
          allDay: isAllDay,
          backgroundColor: status.color,
          borderColor: status.color,
          textColor: '#FFFFFF',
          extendedProps: {
            ...b,
            status: b.status,
            statusLabel: status.label,
            statusColor: status.color,
            statusBg: status.bg,
            dest: b.dest || '—',
            from: b.from || '—',
            plate: b.plate || '—',
            branchName: b.branchName || '',
            phone: b.phone || '',
            clientName: b.client || 'Unknown Client',
          }
        });
      });
    }

    return allEvents;
  }, [currentDate, bookings, getEvents]);

  // Handle date click - opens day view
  const handleDateClick = (info) => {
    if (openDay) {
      const dateStr = info.dateStr.split('T')[0];
      openDay(dateStr);
    }
  };

  // Handle event click - shows booking details
  const handleEventClick = (info) => {
    if (openBookingDetails) {
      openBookingDetails(info.event.extendedProps);
    }
  };

  // Handle event mouse enter for tooltips
  const handleEventMouseEnter = (info) => {
    const props = info.event.extendedProps;
    const tooltip = document.createElement('div');
    tooltip.className = 'fc-event-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      background: #FFFFFF;
      border: 1px solid #EEEEEE;
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      pointer-events: none;
      z-index: 1000;
      max-width: 250px;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #000000;
    `;
    tooltip.innerHTML = `
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${props.clientName}</div>
      <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 4px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${props.statusColor};"></span>
        <span style="font-weight: 600; color: ${props.statusColor};">${props.statusLabel}</span>
      </div>
      ${props.dest ? `<div style="color: #666;">📍 ${props.dest}</div>` : ''}
      ${props.from ? `<div style="color: #666;">🔄 ${props.from}</div>` : ''}
      ${props.plate ? `<div style="color: #666;">🚗 ${props.plate}</div>` : ''}
      ${props.phone ? `<div style="color: #666;">📞 ${props.phone}</div>` : ''}
    `;
    document.body.appendChild(tooltip);

    const updateTooltip = (e) => {
      tooltip.style.left = (e.clientX + 15) + 'px';
      tooltip.style.top = (e.clientY - 10) + 'px';
    };

    info.el.addEventListener('mousemove', updateTooltip);
    
    info.el.addEventListener('mouseleave', () => {
      tooltip.remove();
      info.el.removeEventListener('mousemove', updateTooltip);
    });
  };

  // Custom event renderer
  const renderEventContent = (eventInfo) => {
    const props = eventInfo.event.extendedProps;
    const isAllDay = eventInfo.event.allDay;

    return (
      <div style={{ 
        padding: isAllDay ? '2px 8px' : '4px 8px',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {!isAllDay && (
          <div style={{ 
            fontSize: '10px', 
            fontWeight: 600, 
            opacity: 0.9,
            marginBottom: '2px'
          }}>
            {eventInfo.timeText}
          </div>
        )}
        <div style={{ 
          fontWeight: 700, 
          fontSize: isAllDay ? '12px' : '12px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {eventInfo.event.title}
        </div>
        {props.dest && props.dest !== '—' && !isAllDay && (
          <div style={{ 
            fontSize: '10px', 
            opacity: 0.8,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {props.dest}
          </div>
        )}
      </div>
    );
  };

  // Day cell mount for styling
  const dayCellDidMount = (info) => {
    const dateStr = info.date.toISOString().split('T')[0];
    const dayBookings = getEvents ? getEvents(dateStr) : (bookings[dateStr] || []);
    
    if (dayBookings.length > 0) {
      const status = STATUS_CONFIG[dayBookings[0].status] || STATUS_CONFIG.pending;
      info.el.style.borderLeft = `3px solid ${status.color}`;
    }
  };

  // Navigate to a specific date
  const goToDate = (date) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(date);
    }
  };

  // Re-render when currentDate changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(currentDate);
    }
  }, [currentDate]);

  // Keep FullCalendar properly sized on mount and container layout
  useEffect(() => {
    const update = () => {
      if (calendarRef.current) {
        try {
          calendarRef.current.getApi()?.updateSize();
        } catch (e) {}
      }
    };
    const frame = requestAnimationFrame(update);
    const timers = [
      setTimeout(update, 60),
      setTimeout(update, 180),
      setTimeout(update, 400),
      setTimeout(update, 800),
    ];
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <WeeklyWrapper>
      <StatsBar>
        <StatItem color="#2563EB">
          <StatDot color="#2563EB" />
          {weekStats.total} Total
        </StatItem>
        {weekStats.booked > 0 && (
          <StatItem color="#2563EB">
            <StatDot color="#2563EB" />
            {weekStats.booked} Booked
          </StatItem>
        )}
        {weekStats.transit > 0 && (
          <StatItem color="#D32F2F">
            <StatDot color="#D32F2F" />
            {weekStats.transit} In Transit
          </StatItem>
        )}
        {weekStats.pending > 0 && (
          <StatItem color="#F59E0B">
            <StatDot color="#F59E0B" />
            {weekStats.pending} Pending
          </StatItem>
        )}
        {weekStats.completed > 0 && (
          <StatItem color="#2E7D32">
            <StatDot color="#2E7D32" />
            {weekStats.completed} Completed
          </StatItem>
        )}
        {weekStats.total === 0 && (
          <StatItem color="#999999">
            <StatDot color="#999999" />
            No Bookings This Week
          </StatItem>
        )}
      </StatsBar>

      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={false}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventMouseEnter={handleEventMouseEnter}
        eventContent={renderEventContent}
        dayCellDidMount={dayCellDidMount}
        height="100%"
        aspectRatio={1.8}
        firstDay={0}
        weekends={true}
        nowIndicator={true}
        selectable={true}
        unselectAuto={true}
        slotMinTime="05:00:00"
        slotMaxTime="23:00:00"
        slotDuration="01:00:00"
        allDaySlot={true}
        dayHeaders={true}
        weekNumbers={false}
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
        views={{
          timeGridWeek: {
            titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
            dayHeaderFormat: { weekday: 'short', month: 'short', day: 'numeric' }
          }
        }}
        eventMinHeight={20}
        eventMaxStack={5}
        moreLinkContent="+%d more"
        nowIndicatorClassNames={['fc-timegrid-now-indicator']}
        viewClassNames={['fc-week-view']}
        eventOverlap={true}
        slotEventOverlap={true}
        expandRows={true}
        stickyHeaderDates={true}
        dayMaxEvents={true}
      />
    </WeeklyWrapper>
  );
}