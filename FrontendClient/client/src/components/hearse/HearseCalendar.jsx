import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Truck, MapPin, X, ArrowLeft, Calendar, ChevronLeft, ChevronRight, Clock } from '../../utils/icons/icons';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#d97706', bg: '#fffbeb', strong: '#b45309' },
  booked: { label: 'Booked', color: '#059669', bg: '#ecfdf5', strong: '#047857' },
  in_transit: { label: 'In Transit', color: '#7c3aed', bg: '#f5f3ff', strong: '#6d28d9' },
  completed: { label: 'Completed', color: '#64748b', bg: '#f1f5f9', strong: '#475569' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fef2f2', strong: '#b91c1c' },
};

const pad = n => String(n).padStart(2, '0');
const fmtDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = s => { const d = new Date(s); return isNaN(d) ? null : d; };
const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
const fmtDateTime = s => s ? new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

// --- Styled Components ---
const CalContainer = styled.div`
  background: #ffffff;
  border-radius: 16px;
  font-family: 'Inter', system-ui, sans-serif;
  color: #0f172a;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 15px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    padding: 1rem;
    justify-content: center;
    gap: 0.75rem;
  }
`;

const ToolGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const CalTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #0f172a;
`;

const IconBtn = styled.button`
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;
  cursor: pointer; color: #64748b;
  transition: all 0.15s;

  &:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
`;

const GhostBtn = styled.button`
  background: #ffffff; border: 1px solid #e2e8e0; border-radius: 8px;
  padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 600; color: #64748b;
  cursor: pointer; transition: all 0.15s;

  &:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
`;

const ViewToggle = styled.div`
  display: flex; background: #f8fafc; border: 1px solid #e2e8e0;
  border-radius: 8px; padding: 3px; gap: 2px;
`;

const ToggleBtn = styled.button`
  padding: 0.375rem 0.875rem; border-radius: 6px; border: none;
  background: transparent; font-size: 0.75rem; font-weight: 600;
  color: ${p => p.$active ? '#0f172a' : '#64748b'}; cursor: pointer;
  transition: all 0.15s;
  box-shadow: ${p => p.$active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'};
  background: ${p => p.$active ? '#ffffff' : 'transparent'};
`;

const Legend = styled.div`
  display: flex; gap: 0.75rem; font-size: 0.7rem; color: #64748b; font-weight: 600;
  flex-wrap: wrap; justify-content: center;
  @media (max-width: 768px) { display: none; }
`;

const LegendItem = styled.span`display: inline-flex; align-items: center; gap: 0.25rem;`;
const LegendDot = styled.span`width: 8px; height: 8px; border-radius: 50%; background: ${p => p.color};`;

const MonthGridWrapper = styled.div`
  padding: 1.5rem; 
  @media (max-width: 768px) { padding: 0.5rem; }
`;

const WeekdaysRow = styled.div`
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 8px;
  @media (max-width: 600px) { gap: 4px; }
`;

const WeekdayCell = styled.div`
  text-align: center; font-size: 0.7rem; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 0;
  @media (max-width: 600px) { font-size: 0.6rem; padding: 4px 0; }
`;

const DaysGrid = styled.div`
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; 
  @media (max-width: 600px) { gap: 4px; }
`;

const DayCell = styled.div`
  min-height: 120px;
  background: ${p => p.$isSensitive ? '#fff5f5' : p.$isBusy ? '#f8fafc' : '#ffffff'};
  border: 1px solid ${p => p.$isToday ? '#dc2626' : p.$isSensitive ? '#fca5a5' : '#e2e8f0'};
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.15s;
  opacity: ${p => p.$outside ? 0.4 : 1};
  box-shadow: ${p => p.$isSelected ? '0 0 0 2px #0f172a' : 'none'};
  display: flex;
  flex-direction: column;

  &:hover { 
    border-color: ${p => p.$isSensitive ? '#dc2626' : '#94a3b8'}; 
    background: ${p => p.$isSensitive ? '#fee2e2' : '#f8fafc'}; 
  }

  @media (max-width: 600px) {
    min-height: 60px;
    padding: 4px;
    align-items: center;
    justify-content: center;
  }
`;

const DayHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; 
  margin-bottom: 0.5rem;
  @media (max-width: 600px) { margin-bottom: 0; }
`;

const DayNum = styled.div`
  font-size: 0.9rem; font-weight: 700; color: ${p => p.$isSensitive ? '#dc2626' : '#0f172a'};
  @media (max-width: 600px) { font-size: 0.75rem; }
`;

const TodayCircle = styled.span`
  background: #dc2626; color: #fff; width: 24px; height: 24px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
`;

const BookingCountBadge = styled.div`
  background: ${p => p.$isSensitive ? '#dc2626' : '#0f172a'}; color: #fff; 
  font-size: 0.65rem; font-weight: 700; 
  min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  @media (max-width: 600px) { display: none; }
`;

const MobileStatusDot = styled.div`
  display: none; 
  width: 6px; height: 6px; border-radius: 50%; background: ${p => p.color};
  margin-top: 2px;
  @media (max-width: 600px) { display: block; }
`;

const DayContent = styled.div`
  display: flex; flex-direction: column; gap: 4px; overflow: hidden;
  @media (max-width: 600px) { display: none; }
`;

const EventChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border-left: 3px solid ${p => p.color};
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.15s;
  
  &:hover { 
    background: ${p => p.bg}; 
    transform: translateX(2px); 
  }
`;

const EventTime = styled.span`
  font-weight: 700;
  color: ${p => p.color};
  font-size: 0.65rem;
`;

const EventName = styled.span`
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MoreLink = styled.div`
  font-size: 0.65rem; color: #64748b; font-weight: 700; padding: 2px 6px; cursor: pointer;
  &:hover { color: #0f172a; }
`;

const WeekScroll = styled.div`
  overflow-x: auto; padding: 1rem; 
  &::-webkit-scrollbar { height: 8px; } 
  &::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; } 
`;
const WeekGrid = styled.div`
  display: grid; grid-template-columns: 60px repeat(7, 1fr); min-width: 800px; 
  gap: 1px; background: #e2e8f0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;
`;

const WeekHeaderCell = styled.div`
  padding: 12px 6px; text-align: center; background: ${p => p.$isToday ? '#dc2626' : '#ffffff'};
  color: ${p => p.$isToday ? '#fff' : '#0f172a'};
`;
const TimeGutter = styled.div`padding: 6px; font-size: 0.7rem; color: #64748b; text-align: right; height: 54px; background: #ffffff;`;
const WeekCell = styled.div`
  height: 54px; background: #ffffff; position: relative; border-top: 1px solid #e2e8f0;
  &:hover { background: #f8fafc; }
`;

const SchedEvent = styled.div`
  position: absolute; left: 3px; right: 3px; top: 2px; height: ${p => p.height}px;
  background: ${p => p.bg}; border-left: 3px solid ${p => p.color}; border-radius: 4px;
  padding: 4px 6px; font-size: 0.65rem; color: #0f172a; overflow: hidden; cursor: pointer;
  z-index: 1; transition: all 0.15s;
  &:hover { z-index: 2; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
`;

// Drawer & Modals
const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(15,23,42,0.5); backdrop-filter: blur(4px); z-index: 90;
`;

const Drawer = styled.div`
  position: fixed; top: 0; right: 0; bottom: 0; width: 480px; max-width: 100%;
  background: #f8fafc; z-index: 100; box-shadow: -10px 0 30px -10px rgba(0,0,0,0.1);
  transform: translateX(${p => p.open ? '0' : '100%'});
  transition: transform 0.3s ease; display: flex; flex-direction: column;

  @media (max-width: 600px) { width: 100%; }
`;

const DrawerHeader = styled.div`
  padding: 1.25rem 1.5rem; 
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0; 
  display: flex;
  justify-content: space-between; 
  align-items: center;
`;

const DrawerTitle = styled.h3`font-size: 1.125rem; font-weight: 700; margin: 0; color: #0f172a;`;
const DrawerSub = styled.p`font-size: 0.8rem; color: #64748b; margin: 0.25rem 0 0 0; display: flex; align-items: center; gap: 6px;`;

const CloseBtn = styled.button`
  width: 36px; height: 36px; border-radius: 8px; background: #fff; border: 1px solid #e2e8f0;
  color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: all 0.15s; &:hover { border-color: #cbd5e1; color: #0f172a; }
`;

const DrawerBody = styled.div`
  padding: 1.5rem; 
  flex: 1; 
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const BackBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600;
  color: #dc2626; margin-bottom: 0.5rem; cursor: pointer; background: transparent; border: none;
  width: fit-content;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 8px;
`;

const SummaryCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
`;

const SummaryValue = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: ${p => p.color || '#0f172a'};
`;

const SummaryLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  margin-top: 4px;
`;

const BookingCard = styled.div`
  display: flex; 
  gap: 12px; 
  align-items: center; 
  padding: 16px; 
  background: #ffffff;
  border: 1px solid #e2e8f0; 
  border-left: 4px solid ${p => p.color};
  border-radius: 10px; 
  cursor: pointer; 
  transition: all 0.15s; 
  
  &:hover { 
    border-color: #cbd5e1; 
    border-left-color: ${p => p.color};
    box-shadow: 0 4px 12px rgba(0,0,0,0.05); 
    transform: translateY(-1px);
  }
`;

const IconBox = styled.div`
  width: 40px; height: 40px; border-radius: 8px; background: ${p => p.bg}; color: ${p => p.color};
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;

const StatusBadge = styled.span`
  padding: 4px 10px; border-radius: 6px; background: ${p => p.bg}; color: ${p => p.strong};
  font-weight: 700; border: 1px solid ${p => p.color}; font-size: 0.7rem; display: inline-flex; align-items: center; gap: 4px;
`;

const DetailHero = styled.div`
  display: flex; gap: 1rem; align-items: center; padding: 1.25rem; background: #ffffff;
  border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 1.5rem;
`;

const DetailGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; @media (max-width: 480px) { grid-template-columns: 1fr; }`;
const DetailBox = styled.div`padding: 1rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;`;
const DetailLabel = styled.div`font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;`;
const DetailValue = styled.div`font-size: 0.9rem; font-weight: 600; color: #0f172a;`;

const Timeline = styled.div`position: relative; padding-left: 24px; margin-top: 8px;`;
const TimelineLine = styled.div`position: absolute; left: 7px; top: 4px; bottom: 4px; width: 2px; background: #e2e8f0;`;
const TimelineItem = styled.div`position: relative; padding-bottom: 1.25rem; &:last-child { padding-bottom: 0; }`;
const TimelineDot = styled.div`
  position: absolute; left: -22px; top: 2px; width: 12px; height: 12px; border-radius: 50%;
  background: ${p => p.done ? '#0f172a' : p.active ? '#dc2626' : '#fff'};
  border: 2px solid ${p => p.done ? '#0f172a' : p.active ? '#dc2626' : '#cbd5e1'};
  box-shadow: ${p => p.active ? '0 0 0 4px rgba(220, 38, 38, 0.1)' : 'none'};
`;
const TimelineTitle = styled.div`font-size: 0.85rem; font-weight: 600; color: #0f172a;`;
const TimelineTime = styled.div`font-size: 0.75rem; color: #64748b; margin-top: 2px;`;


const HearseCalendar = ({ bookings, onItemClick, selectedDate, onDateSelect }) => {
  const [calView, setCalView] = useState('month');
  const [calDate, setCalDate] = useState(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState(null);

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

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveBookingId(null);
  }, []);

  const renderCalEvent = (b, dateStr) => {
    const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
    const time = getBookingTime(b);
    return (
      <EventChip 
        key={b.booking_id || b.id} 
        bg={cfg.bg} 
        color={cfg.color}
        onClick={(e) => { e.stopPropagation(); viewBooking(b.booking_id || b.id); }}
      >
        <EventTime color={cfg.color}>{time || 'All'}</EventTime>
        <EventName>{b.client_name?.split(' ')[0] || 'Unknown'}</EventName>
      </EventChip>
    );
  };

  const renderMonthGrid = () => {
    const d = calDate;
    const year = d.getFullYear(), month = d.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const gridStart = addDays(first, -startOffset);
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const todayStr = fmtDateStr(new Date());

    return (
      <MonthGridWrapper>
        <WeekdaysRow>
          {WEEKDAYS.map(w => <WeekdayCell key={w}>{w}</WeekdayCell>)}
        </WeekdaysRow>
        <DaysGrid>
          {days.map(day => {
            const dateStr = fmtDateStr(day);
            const outside = day.getMonth() !== month;
            const isToday = dateStr === todayStr;
            const isSelected = selectedDate === dateStr;
            const events = getEventsForDate(dateStr);
            const isBusy = events.length > 0;
            const isSensitive = events.length > 2; // "Sensitive" threshold
            const dominantStatus = isBusy ? (STATUS_CONFIG[events[0].status] || STATUS_CONFIG.pending) : null;
            
            return (
              <DayCell 
                key={dateStr} 
                $outside={outside} 
                $isToday={isToday} 
                $isSelected={isSelected} 
                $isBusy={isBusy}
                $isSensitive={isSensitive}
                onClick={() => openDayList(dateStr)}
              >
                <DayHeader>
                  {isToday ? <TodayCircle>{day.getDate()}</TodayCircle> : <DayNum $isSensitive={isSensitive}>{day.getDate()}</DayNum>}
                  {isBusy && <BookingCountBadge $isSensitive={isSensitive}>{events.length}</BookingCountBadge>}
                  {isBusy && <MobileStatusDot color={dominantStatus?.color} />}
                </DayHeader>
                
                <DayContent>
                  {events.slice(0, 2).map(ev => renderCalEvent(ev, dateStr))}
                  {events.length > 2 && <MoreLink onClick={(e) => { e.stopPropagation(); openDayList(dateStr); }}>+{events.length - 2} more</MoreLink>}
                </DayContent>
              </DayCell>
            );
          })}
        </DaysGrid>
      </MonthGridWrapper>
    );
  };

  const renderWeekGrid = () => {
    const d = calDate;
    const dow = d.getDay();
    const weekStart = addDays(d, -dow);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const todayStr = fmtDateStr(new Date());
    const hours = Array.from({ length: 15 }, (_, i) => i + 6);

    return (
      <WeekScroll>
        <WeekGrid>
          <WeekHeaderCell></WeekHeaderCell>
          {days.map(day => {
            const dateStr = fmtDateStr(day);
            const isToday = dateStr === todayStr;
            return (
              <WeekHeaderCell key={dateStr} $isToday={isToday}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isToday ? '#fff' : '#64748b' }}>{WEEKDAYS[day.getDay()]}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{day.getDate()}</div>
              </WeekHeaderCell>
            );
          })}

          {hours.map(h => (
            <React.Fragment key={h}>
              <TimeGutter>{pad(h)}:00</TimeGutter>
              {days.map(day => {
                const dateStr = fmtDateStr(day);
                const events = bookings.filter(b => {
                  const bDate = formatDateStr(b.booking_date || b.estimated_departure_time);
                  return bDate === dateStr && new Date(b.booking_date).getHours() === h;
                });
                return (
                  <WeekCell key={dateStr}>
                    {events.map(b => {
                      const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                      const height = (b.duration_hours || 1) * 54 - 4;
                      return (
                        <SchedEvent key={b.booking_id || b.id} bg={cfg.bg} color={cfg.color} height={height} onClick={() => viewBooking(b.booking_id || b.id)}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '2px' }}>{getBookingTime(b)}</span>
                          <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.client_name}</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.destination || ''}</div>
                        </SchedEvent>
                      );
                    })}
                  </WeekCell>
                );
              })}
            </React.Fragment>
          ))}
        </WeekGrid>
      </WeekScroll>
    );
  };

  const renderDrawerList = () => {
    const dateStr = selectedDate || fmtDateStr(new Date());
    const events = getEventsForDate(dateStr);
    const d = parseDate(dateStr);
    if (!d) return null;

    const inTransitCount = events.filter(e => e.status === 'in_transit').length;
    const completedCount = events.filter(e => e.status === 'completed').length;

    return (
      <>
        <DrawerHeader>
          <div>
            <DrawerTitle>{d.toLocaleDateString('en-US', { weekday: 'long' })}</DrawerTitle>
            <DrawerSub>
              <Calendar size={12} /> {d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </DrawerSub>
          </div>
          <CloseBtn onClick={closeDrawer}><X size={16} /></CloseBtn>
        </DrawerHeader>
        <DrawerBody>
          <SummaryGrid>
            <SummaryCard>
              <SummaryValue color="#0f172a">{events.length}</SummaryValue>
              <SummaryLabel>Total</SummaryLabel>
            </SummaryCard>
            <SummaryCard>
              <SummaryValue color="#7c3aed">{inTransitCount}</SummaryValue>
              <SummaryLabel>In Transit</SummaryLabel>
            </SummaryCard>
            <SummaryCard>
              <SummaryValue color="#64748b">{completedCount}</SummaryValue>
              <SummaryLabel>Completed</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>

          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <Calendar size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>No bookings for this day</h4>
            </div>
          ) : (
            events.map(b => {
              const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
              return (
                <BookingCard 
                  key={b.booking_id || b.id} 
                  color={cfg.color}
                  onClick={() => viewBooking(b.booking_id || b.id)}
                >
                  <IconBox bg={cfg.bg} color={cfg.color}><Truck size={20} /></IconBox>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {b.client_name} 
                      <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} /> {getBookingTime(b) || 'All day'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {b.destination || 'N/A'}
                    </div>
                  </div>
                  <StatusBadge bg={cfg.bg} strong={cfg.strong} color={cfg.color}>{cfg.label}</StatusBadge>
                </BookingCard>
              );
            })
          )}
        </DrawerBody>
      </>
    );
  };

  const renderDrawerDetail = () => {
    const b = bookings.find(x => (x.booking_id || x.id) === activeBookingId);
    if (!b) return null;
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
        <DrawerHeader>
          <div>
            <DrawerTitle>Booking Details</DrawerTitle>
            <DrawerSub>ID: BK-{String(1000 + (b.booking_id || b.id || 0)).padStart(4, '0')}</DrawerSub>
          </div>
          <CloseBtn onClick={closeDrawer}><X size={16} /></CloseBtn>
        </DrawerHeader>
        <DrawerBody>
          <BackBtn onClick={() => setActiveBookingId(null)}><ArrowLeft size={12} /> Back to List</BackBtn>

          <DetailHero>
            <IconBox bg={cfg.bg} color={cfg.color} style={{ width: '52px', height: '52px', borderRadius: '8px' }}><Truck size={24} /></IconBox>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>{b.hearse_name || 'Vehicle'}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>{b.plate_number || b.number_plate || 'N/A'}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '6px' }}>{b.client_name}</div>
            </div>
            <StatusBadge bg={cfg.bg} strong={cfg.strong} color={cfg.color}>{cfg.label}</StatusBadge>
          </DetailHero>

          <DetailGrid>
            <DetailBox><DetailLabel>Client Phone</DetailLabel><DetailValue>{b.client_phone || '—'}</DetailValue></DetailBox>
            <DetailBox><DetailLabel>Departure</DetailLabel><DetailValue>{fmtDateTime(b.booking_date)}</DetailValue></DetailBox>
            <DetailBox><DetailLabel>From</DetailLabel><DetailValue>{b.from_location || '—'}</DetailValue></DetailBox>
            <DetailBox><DetailLabel>Destination</DetailLabel><DetailValue>{b.destination || '—'}</DetailValue></DetailBox>
          </DetailGrid>

          <h4 style={{ fontSize: '0.85rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 700 }}>Status Timeline</h4>
          <Timeline>
            <TimelineLine />
            {timeline.map((t, i) => (
              <TimelineItem key={t.key}>
                <TimelineDot active={i === activeIdx} done={i < activeIdx} />
                <TimelineTitle>{t.title}</TimelineTitle>
                <TimelineTime>{t.time ? fmtDateTime(t.time) : '—'}</TimelineTime>
              </TimelineItem>
            ))}
          </Timeline>
        </DrawerBody>
      </>
    );
  };

  return (
    <CalContainer>
      <Toolbar>
        <ToolGroup>
          <CalTitle>
            <IconBtn onClick={() => calNav(-1)}><ChevronLeft size={16} /></IconBtn>
            {MONTHS[calDate.getMonth()]} {calDate.getFullYear()}
            <IconBtn onClick={() => calNav(1)}><ChevronRight size={16} /></IconBtn>
          </CalTitle>
          <GhostBtn onClick={calToday}>Today</GhostBtn>
        </ToolGroup>

        <ViewToggle>
          <ToggleBtn $active={calView === 'month'} onClick={() => setCalView('month')}>Month</ToggleBtn>
          <ToggleBtn $active={calView === 'week'} onClick={() => setCalView('week')}>Week</ToggleBtn>
        </ViewToggle>

        <Legend>
          {Object.keys(STATUS_CONFIG).map(s => (
            <LegendItem key={s}>
              <LegendDot color={STATUS_CONFIG[s].color} />
              {STATUS_CONFIG[s].label}
            </LegendItem>
          ))}
        </Legend>
      </Toolbar>

      {calView === 'month' ? renderMonthGrid() : renderWeekGrid()}

      {drawerOpen && <Overlay onClick={closeDrawer} />}
      <Drawer open={drawerOpen}>
        {drawerOpen && (activeBookingId ? renderDrawerDetail() : renderDrawerList())}
      </Drawer>
    </CalContainer>
  );
};

export default HearseCalendar;