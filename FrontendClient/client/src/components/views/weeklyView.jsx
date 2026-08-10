import React, { useMemo, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const SH = 5;
const EH = 22;
const DS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const dk = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const ft = (h) => {
  const hour = Math.floor(h);
  const min = Math.round((h % 1) * 60);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return min === 0 ? `${h12} ${ampm}` : `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
};

const wsOf = d => { const t = new Date(d); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - t.getDay()); return t; };

export default function WeeklyView({
  currentDate,
  bookings = {},
  getEvents,
  openDay,
  openBookingDetails,
  onRefresh
}) {
  const calendarRef = useRef(null);
  
  const dayOfWeek = currentDate.getDay();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  const todayStr = dk(new Date());

  // Resolve bookings for every day of the week
  const weekBookings = {};
  weekDays.forEach(day => {
    const ds = dk(day);
    weekBookings[ds] = getEvents ? getEvents(ds) : (bookings[ds] || []);
  });

  const allBookings = Object.values(weekBookings).flat();
  const tr = allBookings.filter(b => b.status === 'transit' || b.status === 'in_transit').length;
  const pn = allBookings.filter(b => b.status === 'pending').length;

  // Convert bookings to FullCalendar events
  const events = useMemo(() => {
    const eventList = [];
    
    weekDays.forEach((day, dayIndex) => {
      const ds = dk(day);
      const dayBookings = weekBookings[ds] || [];
      
      dayBookings.forEach((booking) => {
        const start = booking.start || 9;
        const end = booking.end || 10;
        
        const startDate = new Date(day);
        startDate.setHours(Math.floor(start), (start % 1) * 60, 0, 0);
        
        const endDate = new Date(day);
        endDate.setHours(Math.floor(end), (end % 1) * 60, 0, 0);
        
        // If end time is before start time, add a day
        if (endDate < startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
        
        // Status colors
        const statusColors = {
          pending: '#F59E0B',
          booked: '#2563EB',
          in_transit: '#D32F2F',
          transit: '#D32F2F',
          completed: '#2E7D32',
          cancelled: '#ef4444',
          confirmed: '#2563EB',
        };
        
        const color = statusColors[booking.status?.toLowerCase()] || '#2563EB';
        
        eventList.push({
          id: booking.id || `${ds}-${Math.random()}`,
          title: booking.client || 'Unknown Client',
          start: startDate,
          end: endDate,
          allDay: booking.allDay || false,
          backgroundColor: color,
          borderColor: color,
          textColor: '#FFFFFF',
          extendedProps: {
            ...booking,
            status: booking.status,
            statusColor: color,
            dest: booking.dest || '—',
            from: booking.from || '—',
            plate: booking.plate || '—',
            branchName: booking.branchName || '',
            branch: booking.branch || 'nairobi',
            phone: booking.phone || '',
            clientName: booking.client || 'Unknown Client',
            dayIndex: dayIndex,
          }
        });
      });
    });
    
    return eventList;
  }, [weekBookings, weekDays]);

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

  // Custom event renderer
  const renderEventContent = (eventInfo) => {
    const props = eventInfo.event.extendedProps;
    const isAllDay = eventInfo.event.allDay;
    
    return (
      <div style={{
        padding: isAllDay ? '2px 6px' : '4px 6px',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
        fontSize: '11px',
        fontWeight: 600,
      }}>
        {!isAllDay && (
          <span style={{ fontSize: '9px', opacity: 0.8 }}>
            {eventInfo.timeText}
          </span>
        )}
        <span style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontWeight: 700,
        }}>
          {eventInfo.event.title}
        </span>
        {props.dest && props.dest !== '—' && !isAllDay && (
          <span style={{
            fontSize: '9px',
            opacity: 0.7,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {props.dest}
          </span>
        )}
      </div>
    );
  };

  // Sync calendar with currentDate
  useEffect(() => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.gotoDate(currentDate);
    }
  }, [currentDate]);

  // Stats bar component
  const StatsBar = () => (
    <div style={{
      display: 'flex',
      gap: '16px',
      padding: '8px 16px',
      marginBottom: '12px',
      background: '#FAFAFA',
      borderRadius: '8px',
      flexWrap: 'wrap',
      border: '1px solid #EEEEEE',
    }}>
      {allBookings.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#2563EB' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }}></span>
          {allBookings.length} Booking{allBookings.length !== 1 ? 's' : ''} This Week
        </div>
      )}
      {tr > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#D32F2F' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D32F2F' }}></span>
          {tr} In Transit
        </div>
      )}
      {pn > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#D97706' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706' }}></span>
          {pn} Pending
        </div>
      )}
      {allBookings.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#2563EB' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }}></span>
          All Clear This Week
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#FFFFFF',
    }}>
      <StatsBar />
      
      <div style={{ flex: 1, minHeight: '400px', position: 'relative' }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          height="100%"
          contentHeight="100%"
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
          // Custom styling via CSS
          dayHeaderClassNames={['fc-week-day-header']}
          eventClassNames={['fc-week-event']}
        />
      </div>
      
      {/* Custom styles to match your design */}
      <style>{`
        .fc-week-view .fc-timegrid-event {
          border-radius: 6px !important;
          border: none !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          padding: 2px 6px !important;
          margin: 1px 2px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        }
        
        .fc-week-view .fc-timegrid-event:hover {
          transform: scale(1.02) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          z-index: 10 !important;
        }
        
        .fc-week-view .fc-timegrid-event .fc-event-time {
          font-size: 9px !important;
          font-weight: 600 !important;
          opacity: 0.8 !important;
        }
        
        .fc-week-view .fc-timegrid-event .fc-event-title {
          font-weight: 700 !important;
          font-size: 11px !important;
        }
        
        .fc-week-view .fc-timegrid-col.fc-day-today {
          background: #FAFAFA !important;
        }
        
        .fc-week-view .fc-col-header-cell {
          padding: 8px 0 !important;
          background: #FFFFFF !important;
          border-bottom: 2px solid #EEEEEE !important;
        }
        
        .fc-week-view .fc-col-header-cell-cushion {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #999999 !important;
          text-transform: uppercase !important;
          text-decoration: none !important;
        }
        
        .fc-week-view .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion {
          color: #2E7D32 !important;
        }
        
        .fc-week-view .fc-timegrid-axis-cushion,
        .fc-week-view .fc-timegrid-slot-label-cushion {
          font-size: 11px !important;
          font-weight: 600 !important;
          color: #999999 !important;
        }
        
        .fc-week-view .fc-timegrid-now-indicator-line {
          border-color: #D32F2F !important;
          border-width: 2px !important;
        }
        
        .fc-week-view .fc-timegrid-now-indicator-arrow {
          border-color: #D32F2F !important;
          border-width: 5px !important;
        }
        
        .fc-week-view .fc-timegrid-all-day-events {
          min-height: 30px !important;
          background: #FFFFFF !important;
        }
        
        .fc-week-view .fc-timegrid-all-day-event {
          border-radius: 4px !important;
          border: none !important;
          padding: 2px 6px !important;
          margin: 1px 2px !important;
          font-size: 10px !important;
          font-weight: 600 !important;
        }
        
        .fc-week-view .fc-daygrid-more-link {
          font-size: 10px !important;
          font-weight: 600 !important;
          color: #2563EB !important;
          cursor: pointer !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
        }
        
        .fc-week-view .fc-daygrid-more-link:hover {
          background: #EFF6FF !important;
        }
        
        .fc-week-view .fc-popover {
          border-radius: 12px !important;
          border: 1px solid #EEEEEE !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08) !important;
          background: #FFFFFF !important;
        }
        
        .fc-week-view .fc-popover-header {
          padding: 12px 16px !important;
          background: #FAFAFA !important;
          border-bottom: 1px solid #EEEEEE !important;
          border-radius: 12px 12px 0 0 !important;
        }
        
        .fc-week-view .fc-popover-title {
          font-size: 14px !important;
          font-weight: 700 !important;
          color: #000000 !important;
        }
        
        .fc-week-view .fc-popover-body {
          padding: 8px 12px !important;
        }
        
        .fc-week-view .fc-popover-body .fc-event {
          border-radius: 6px !important;
          padding: 6px 10px !important;
          margin: 4px 0 !important;
        }
        
        /* Mobile responsive */
        @media (max-width: 640px) {
          .fc-week-view .fc-col-header-cell-cushion {
            font-size: 9px !important;
          }
          
          .fc-week-view .fc-timegrid-event .fc-event-title {
            font-size: 9px !important;
          }
          
          .fc-week-view .fc-timegrid-event {
            padding: 1px 4px !important;
          }
        }
      `}</style>
    </div>
  );
}