import React, { useState, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { Truck, MapPin, X, ArrowLeft, Calendar, Plus } from '../../utils/icons/icons'; // Adjust import paths as needed

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', bg: 'rgba(245,158,11,.1)', strong: '#b45309' },
  booked: { label: 'Booked', color: '#2563EB', bg: 'rgba(37,99,235,.1)', strong: '#1d4ed8' },
  in_transit: { label: 'In Transit', color: '#D32F2F', bg: 'rgba(211,47,47,.1)', strong: '#b71c1c' },
  completed: { label: 'Completed', color: '#059669', bg: 'rgba(5,150,105,.1)', strong: '#047857' },
  cancelled: { label: 'Cancelled', color: '#64748b', bg: 'rgba(100,116,139,.1)', strong: '#475569' },
};

const pad = n => String(n).padStart(2, '0');
const fmtDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = s => { const d = new Date(s); return isNaN(d) ? null : d; };
const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
const fmtDateTime = s => s ? new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

// --- Styled Components ---
const CalContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  font-family: 'Inter', system-ui, sans-serif;
  color: #0a0a0a;
  position: relative;
  overflow: hidden;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    padding: 1rem;
    justify-content: center;
  }
`;

const ToolGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const CalTitle = styled.h2`
  font-family: 'Merriweather', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IconBtn = styled.button`
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: #ffffff; border: 1px solid #e0e0e0; border-radius: 6px;
  cursor: pointer; color: #333;
  transition: all 0.15s;

  &:hover { background: #f7f7f5; border-color: #0a0a0a; }
`;

const GhostBtn = styled.button`
  background: #ffffff; border: 1px solid #e0e0e0; border-radius: 6px;
  padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 600; color: #333;
  cursor: pointer; transition: all 0.15s;

  &:hover { background: #f7f7f5; border-color: #0a0a0a; }
`;

const ViewToggle = styled.div`
  display: flex; background: #f7f7f5; border: 1px solid #e0e0e0;
  border-radius: 6px; padding: 3px; gap: 2px;
`;

const ToggleBtn = styled.button`
  padding: 0.375rem 0.875rem; border-radius: 4px; border: none;
  background: transparent; font-size: 0.75rem; font-weight: 600;
  color: ${p => p.$active ? '#0a0a0a' : '#666'}; cursor: pointer;
  transition: all 0.15s;
  box-shadow: ${p => p.$active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'};
  background: ${p => p.$active ? '#ffffff' : 'transparent'};
`;

const Legend = styled.div`
  display: flex; gap: 1rem; font-size: 0.7rem; color: #666; font-weight: 500;
  flex-wrap: wrap; justify-content: center;
`;

const LegendItem = styled.span`display: inline-flex; align-items: center; gap: 0.25rem;`;
const LegendDot = styled.span`width: 8px; height: 8px; border-radius: 2px; background: ${p => p.color};`;

const MonthGridWrapper = styled.div`padding: 1.5rem; @media (max-width: 768px) { padding: 0.5rem; }`;
const WeekdaysRow = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 8px;`;
const WeekdayCell = styled.div`
  text-align: center; font-size: 0.7rem; font-weight: 700; color: #888;
  text-transform: uppercase; letter-spacing: 0.08em; padding: 8px 0;
`;

const DaysGrid = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; @media (max-width: 600px) { gap: 4px; }`;

const DayCell = styled.div`
  min-height: 110px;
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.15s;
  opacity: ${p => p.$outside ? 0.4 : 1};
  border-color: ${p => p.$isToday ? '#0a0a0a' : '#f0f0f0'};
  box-shadow: ${p => p.$isSelected ? '0 0 0 2px #0a0a0a' : 'none'};

  &:hover { border-color: #0a0a0a; }

  @media (max-width: 600px) {
    min-height: 70px;
    padding: 4px;
  }
`;

const DayNum = styled.div`
  font-family: 'Merriweather', Georgia, serif;
  font-size: 0.85rem; font-weight: 700; color: #0a0a0a;
  margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;
`;

const TodayCircle = styled.span`
  background: #0a0a0a; color: #fff; width: 24px; height: 24px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;
`;

const EventPill = styled.div`
  font-size: 0.7rem; padding: 3px 6px; border-radius: 4px; margin-bottom: 4px;
  background: ${p => p.bg}; color: ${p => p.strong}; border-left: 3px solid ${p => p.color};
  font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  cursor: pointer; transition: all 0.15s;

  &:hover { transform: translateY(-1px); }
`;

const MoreLink = styled.div`
  font-size: 0.65rem; color: #666; font-weight: 700; padding: 2px 6px; cursor: pointer;
  &:hover { color: #0a0a0a; }
`;

const WeekScroll = styled.div`overflow-x: auto; padding: 1rem; &::-webkit-scrollbar { height: 8px; } &::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; } `;
const WeekGrid = styled.div`display: grid; grid-template-columns: 60px repeat(7, 1fr); min-width: 800px; gap: 1px; background: #f0f0f0; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden;`;

const WeekHeaderCell = styled.div`
  padding: 12px 6px; text-align: center; background: ${p => p.$isToday ? '#0a0a0a' : '#ffffff'};
  color: ${p => p.$isToday ? '#fff' : '#0a0a0a'};
`;
const TimeGutter = styled.div`padding: 6px; font-size: 0.7rem; color: #888; text-align: right; height: 54px; background: #ffffff;`;
const WeekCell = styled.div`
  height: 54px; background: #ffffff; position: relative; border-top: 1px solid #f0f0f0;
  &:hover { background: #fafafa; }
`;

const SchedEvent = styled.div`
  position: absolute; left: 3px; right: 3px; top: 2px; height: ${p => p.height}px;
  background: ${p => p.bg}; border-left: 3px solid ${p => p.color}; border-radius: 4px;
  padding: 4px 6px; font-size: 0.65rem; color: #0a0a0a; overflow: hidden; cursor: pointer;
  z-index: 1; transition: all 0.15s;
  &:hover { z-index: 2; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
`;

const FAB = styled.button`
  position: absolute; bottom: 24px; right: 24px; width: 56px; height: 56px;
  border-radius: 50%; background: #0a0a0a; color: #fff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.2s; z-index: 10;

  &:hover { transform: scale(1.05); background: #333; }
`;

// Drawer & Modals
const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 90;
`;

const Drawer = styled.div`
  position: fixed; top: 0; right: 0; bottom: 0; width: 480px; max-width: 100%;
  background: #ffffff; z-index: 100; box-shadow: -10px 0 30px -10px rgba(0,0,0,0.1);
  transform: translateX(${p => p.open ? '0' : '100%'});
  transition: transform 0.3s ease; display: flex; flex-direction: column;

  @media (max-width: 600px) { width: 100%; }
`;

const DrawerHeader = styled.div`
  padding: 1.5rem; border-bottom: 1px solid #f0f0f0; display: flex;
  justify-content: space-between; align-items: center; background: #ffffff;
`;

const DrawerTitle = styled.h3`font-family: 'Merriweather', Georgia, serif; font-size: 1.1rem; font-weight: 700; margin: 0;`;
const DrawerSub = styled.p`font-size: 0.8rem; color: #666; margin: 0.25rem 0 0 0;`;

const CloseBtn = styled.button`
  width: 36px; height: 36px; border-radius: 6px; background: #fff; border: 1px solid #e0e0e0;
  color: #333; display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: all 0.15s; &:hover { border-color: #0a0a0a; color: #0a0a0a; }
`;

const DrawerBody = styled.div`padding: 1.5rem; flex: 1; overflow-y: auto;`;

const BackBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600;
  color: #0a0a0a; margin-bottom: 1rem; cursor: pointer; background: transparent; border: none;
`;

const BookingCard = styled.div`
  display: flex; gap: 12px; align-items: center; padding: 12px; background: #ffffff;
  border: 1px solid #f0f0f0; border-radius: 8px; cursor: pointer; margin-bottom: 8px;
  transition: all 0.15s; &:hover { border-color: #0a0a0a; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
`;

const IconBox = styled.div`
  width: 40px; height: 40px; border-radius: 8px; background: ${p => p.bg}; color: ${p => p.color};
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;

const StatusBadge = styled.span`
  padding: 4px 10px; border-radius: 4px; background: ${p => p.bg}; color: ${p => p.strong};
  font-weight: 700; border: 1px solid ${p => p.color}; font-size: 0.7rem; display: inline-flex; align-items: center; gap: 4px;
`;

const DetailHero = styled.div`
  display: flex; gap: 1rem; align-items: center; padding: 1.25rem; background: #ffffff;
  border: 1px solid #f0f0f0; border-radius: 8px; margin-bottom: 1.5rem;
`;

const DetailGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; @media (max-width: 480px) { grid-template-columns: 1fr; }`;
const DetailBox = styled.div`padding: 1rem; background: #ffffff; border: 1px solid #f0f0f0; border-radius: 8px;`;
const DetailLabel = styled.div`font-size: 0.7rem; font-weight: 700; color: #888; text-transform: uppercase; margin-bottom: 0.25rem;`;
const DetailValue = styled.div`font-size: 0.9rem; font-weight: 600; color: #0a0a0a;`;

const Timeline = styled.div`position: relative; padding-left: 24px; margin-top: 8px;`;
const TimelineLine = styled.div`position: absolute; left: 7px; top: 4px; bottom: 4px; width: 2px; background: #e0e0e0;`;
const TimelineItem = styled.div`position: relative; padding-bottom: 1.25rem; &:last-child { padding-bottom: 0; }`;
const TimelineDot = styled.div`
  position: absolute; left: -22px; top: 2px; width: 12px; height: 12px; border-radius: 50%;
  background: ${p => p.done ? '#0a0a0a' : p.active ? '#0a0a0a' : '#fff'};
  border: 2px solid ${p => p.done || p.active ? '#0a0a0a' : '#ccc'};
  box-shadow: ${p => p.active ? '0 0 0 4px rgba(10,10,10,0.1)' : 'none'};
`;
const TimelineTitle = styled.div`font-size: 0.85rem; font-weight: 600; color: #0a0a0a;`;
const TimelineTime = styled.div`font-size: 0.75rem; color: #666; margin-top: 2px;`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px;
`;

const ModalContent = styled.div`
  background: #ffffff; border-radius: 12px; width: 100%; max-width: 500px;
  max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  display: flex; flex-direction: column;
`;

const ModalHeader = styled.div`padding: 1.5rem; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;`;
const ModalBody = styled.div`padding: 1.5rem; overflow-y: auto; flex: 1;`;
const ModalFooter = styled.div`padding: 1rem 1.5rem; border-top: 1px solid #f0f0f0; display: flex; gap: 12px; justify-content: flex-end;`;

const BtnPrimary = styled.button`
  padding: 0.625rem 1.25rem; border-radius: 6px; background: #0a0a0a; color: #fff; border: none;
  font-size: 0.85rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
  transition: all 0.15s; &:hover { background: #333; }
`;

const BtnSecondary = styled.button`
  padding: 0.625rem 1.25rem; border-radius: 6px; background: #fff; color: #333; border: 1px solid #e0e0e0;
  font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
  &:hover { background: #f7f7f5; border-color: #0a0a0a; }
`;

const SelectedDatesWrap = styled.div`margin-bottom: 1.5rem; padding: 1rem; background: #f7f7f5; border-radius: 6px; border: 1px solid #e0e0e0;`;
const DateChip = styled.span`padding: 4px 10px; background: #fff; border: 1px solid #0a0a0a; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: #0a0a0a; margin-right: 4px;`;


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
      if (prev.includes(dateStr)) return prev.filter(d => d !== dateStr);
      return [...prev, dateStr].sort();
    });
  };

  const confirmDateSelection = () => {
    setSelectedDates(tempSelectedDates);
    setShowDatePicker(false);
    if (onCreateBooking && tempSelectedDates.length > 0) onCreateBooking(tempSelectedDates);
  };

  const renderCalEvent = (b, dateStr) => {
    const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
    const time = getBookingTime(b);
    const label = `${time ? time + ' ' : ''}${b.client_name?.split(' ')[0] || ''}`;
    return (
      <EventPill key={b.booking_id || b.id} bg={cfg.bg} color={cfg.color} strong={cfg.strong}
        onClick={(e) => { e.stopPropagation(); viewBooking(b.booking_id || b.id); }}>
        {label}
      </EventPill>
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
            const isSelected = selectedDates.includes(dateStr);
            const events = getEventsForDate(dateStr);
            const visible = events.slice(0, 3);
            const more = events.length - visible.length;

            return (
              <DayCell key={dateStr} $outside={outside} $isToday={isToday} $isSelected={isSelected} onClick={() => toggleDateSelection(dateStr)}>
                <DayNum>
                  {isToday ? <TodayCircle>{day.getDate()}</TodayCircle> : <span>{day.getDate()}</span>}
                </DayNum>
                {visible.map(ev => renderCalEvent(ev, dateStr))}
                {more > 0 && <MoreLink onClick={(e) => { e.stopPropagation(); openDayList(dateStr); }}>+{more} more</MoreLink>}
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
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isToday ? '#aaa' : '#888' }}>{WEEKDAYS[day.getDay()]}</div>
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
                          <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.destination || ''}</div>
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

    return (
      <>
        <DrawerHeader>
          <div>
            <DrawerTitle>{d.toLocaleDateString('en-US', { weekday: 'long' })}</DrawerTitle>
            <DrawerSub>{d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {events.length} booking{events.length !== 1 ? 's' : ''}</DrawerSub>
          </div>
          <CloseBtn onClick={closeDrawer}><X size={16} /></CloseBtn>
        </DrawerHeader>
        <DrawerBody>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
              <Calendar size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px' }}>No bookings for this day</h4>
            </div>
          ) : (
            events.map(b => {
              const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
              return (
                <BookingCard key={b.booking_id || b.id} onClick={() => viewBooking(b.booking_id || b.id)}>
                  <IconBox bg={cfg.bg} color={cfg.color}><Truck size={20} /></IconBox>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{b.client_name} <span style={{ color: '#888', fontWeight: 500, fontSize: '0.75rem' }}>· {getBookingTime(b) || 'All day'}</span></div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={10} /> {b.destination || 'N/A'}
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
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>{b.plate_number || b.number_plate || 'N/A'}</div>
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

          <h4 style={{ fontSize: '0.85rem', marginBottom: '1rem', color: '#333' }}>Status Timeline</h4>
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

  const renderDatePickerModal = () => {
    const d = calDate;
    const year = d.getFullYear(), month = d.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const gridStart = addDays(first, -startOffset);
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const todayStr = fmtDateStr(new Date());

    return (
      <ModalOverlay onClick={() => setShowDatePicker(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Select Dates for Booking</div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Choose one or more dates (click to toggle)</div>
            </div>
            <CloseBtn onClick={() => setShowDatePicker(false)}><X size={18} /></CloseBtn>
          </ModalHeader>

          <ModalBody>
            <SelectedDatesWrap>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>{tempSelectedDates.length} date{tempSelectedDates.length !== 1 ? 's' : ''} selected</div>
              {tempSelectedDates.map(dateStr => {
                const date = parseDate(dateStr);
                return <DateChip key={dateStr}>{date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</DateChip>;
              })}
            </SelectedDatesWrap>

            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px' }}>
              <WeekdaysRow style={{ marginBottom: '4px' }}>
                {WEEKDAYS.map(w => <WeekdayCell key={w} style={{ fontSize: '0.65rem', padding: '4px' }}>{w}</WeekdayCell>)}
              </WeekdaysRow>
              <DaysGrid style={{ gap: '4px' }}>
                {days.map(day => {
                  const dateStr = fmtDateStr(day);
                  const outside = day.getMonth() !== month;
                  const isToday = dateStr === todayStr;
                  const isSelected = tempSelectedDates.includes(dateStr);
                  const isPast = day < new Date(todayStr);

                  return (
                    <div key={dateStr} style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '6px', cursor: isPast || outside ? 'not-allowed' : 'pointer',
                      background: isSelected ? '#0a0a0a' : isToday ? 'rgba(10,10,10,0.05)' : '#fff',
                      border: `1px solid ${isSelected ? '#0a0a0a' : isToday ? '#0a0a0a' : '#e0e0e0'}`,
                      opacity: outside || isPast ? 0.3 : 1, color: isSelected ? '#fff' : '#0a0a0a',
                      fontWeight: 600, fontSize: '0.8rem'
                    }} onClick={() => !isPast && !outside && toggleDateSelection(dateStr)}>
                      {day.getDate()}
                    </div>
                  );
                })}
              </DaysGrid>
            </div>
          </ModalBody>

          <ModalFooter>
            <BtnSecondary onClick={() => setShowDatePicker(false)}>Cancel</BtnSecondary>
            <BtnPrimary onClick={confirmDateSelection} disabled={tempSelectedDates.length === 0} style={{ opacity: tempSelectedDates.length === 0 ? 0.5 : 1 }}>
              <Plus size={16} /> Confirm & Create
            </BtnPrimary>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    );
  };

  return (
    <CalContainer>
      <Toolbar>
        <ToolGroup>
          <CalTitle>
            <IconBtn onClick={() => calNav(-1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></IconBtn>
            {MONTHS[calDate.getMonth()]} {calDate.getFullYear()}
            <IconBtn onClick={() => calNav(1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></IconBtn>
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

      <FAB onClick={openDatePicker}>
        <Plus size={24} />
      </FAB>

      {drawerOpen && <Overlay onClick={closeDrawer} />}
      <Drawer open={drawerOpen}>
        {drawerOpen && (activeBookingId ? renderDrawerDetail() : renderDrawerList())}
      </Drawer>

      {showDatePicker && renderDatePickerModal()}
    </CalContainer>
  );
};

export default HearseCalendar;