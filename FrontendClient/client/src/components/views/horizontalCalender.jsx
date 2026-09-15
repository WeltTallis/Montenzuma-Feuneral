import React, { useState, useRef, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const DOWS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MOS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dk(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function toMonday(d) {
    const r = new Date(d);
    const day = r.getDay();
    r.setDate(r.getDate() - ((day + 6) % 7));
    return r;
}

export default function HorizontalCalendar({ eventsData = [], selectedDate, onDateSelect }) {
    const [viewStart, setViewStart] = useState(() => toMonday(new Date()));
    const stripRef = useRef(null);
    const [visibleCount, setVisibleCount] = useState(7);
    const calendarRef = useRef(null);

    const eventCounts = useMemo(() => {
        const map = {};
        eventsData.forEach((ev) => {
            const date = new Date(ev.date);
            const key = dk(date.getFullYear(), date.getMonth(), date.getDate());
            map[key] = (map[key] || 0) + 1;
        });
        return map;
    }, [eventsData]);

    const todayKey = dk(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    // Convert events to FullCalendar format
    const events = useMemo(() => {
        return eventsData.map((ev) => {
            const date = new Date(ev.date);
            return {
                id: ev.id || `ev-${Math.random()}`,
                title: ev.title || 'Event',
                start: date,
                allDay: true,
                backgroundColor: ev.color || '#2563EB',
                borderColor: ev.color || '#2563EB',
                textColor: '#FFFFFF',
                extendedProps: {
                    ...ev,
                    count: 1
                }
            };
        });
    }, [eventsData]);

    const days = useMemo(() => {
        const arr = [];
        for (let i = 0; i < 30; i++) {
            const d = addDays(viewStart, i);
            const key = dk(d.getFullYear(), d.getMonth(), d.getDate());
            arr.push({
                date: d,
                key,
                dayName: DOWS[(d.getDay() + 6) % 7],
                dayNum: d.getDate(),
                count: eventCounts[key] || 0,
                isToday: key === todayKey,
                isSelected: selectedDate != null && key === dk(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()),
            });
        }
        return arr;
    }, [viewStart, eventCounts, todayKey, selectedDate]);

    useEffect(() => {
        const targetKey = selectedDate
            ? dk(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
            : todayKey;
        const el = document.getElementById(`dc-${targetKey}`);
        if (el) {
            setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 50);
        }
    }, [selectedDate, viewStart, todayKey, visibleCount]);

    useEffect(() => {
        const el = stripRef.current;
        if (!el) return;
        const measure = () => {
            const available = Math.max(el.clientWidth - 28, 40);
            const count = Math.max(1, Math.floor(available / 44));
            setVisibleCount(Math.min(count, 30));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const title = useMemo(() => {
        const s = addDays(viewStart, 0);
        const e = addDays(viewStart, 29);
        const sm = s.getMonth(), sy = s.getFullYear();
        const em = e.getMonth(), ey = e.getFullYear();
        if (sm === em && sy === ey) return `${MOS_SHORT[sm]} ${sy}`;
        if (sy === ey) return `${MOS_SHORT[sm]}–${MOS_SHORT[em]} ${sy}`;
        return `${MOS_SHORT[sm]} ${sy}–${MOS_SHORT[em]} ${ey}`;
    }, [viewStart]);

    const prevWeek = () => {
        setViewStart((v) => addDays(v, -7));
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.prev();
        }
    };
    
    const nextWeek = () => {
        setViewStart((v) => addDays(v, 7));
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.next();
        }
    };
    
    const goToday = () => {
        const now = new Date();
        setViewStart(toMonday(now));
        if (onDateSelect) onDateSelect(now);
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.today();
        }
    };

    const pickDate = (date) => {
        if (onDateSelect) onDateSelect(date);
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.gotoDate(date);
        }
    };

    // Custom event renderer for FullCalendar
    const renderEventContent = (eventInfo) => {
        return (
            <div style={{
                fontSize: '8px',
                fontWeight: 600,
                padding: '1px 3px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
            }}>
                {eventInfo.event.title}
            </div>
        );
    };

    // Handle date click in FullCalendar
    const handleDateClick = (info) => {
        const date = info.date;
        pickDate(date);
    };

    // Handle event click in FullCalendar
    const handleEventClick = (info) => {
        const event = info.event.extendedProps;
        if (onDateSelect) {
            onDateSelect(event.date);
        }
    };

    return (
        <div style={{
            background: 'transparent',
            borderRadius: 10,
            border: 'none',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            width: '100%',
            maxWidth: 2200,
            margin: '0 auto',
        }}>
            {/* Sleek Nav */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0 6px 0',
            }}>
                <button
                    onClick={prevWeek}
                    style={{
                        width: 26,
                        height: 26,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e5e7eb',
                        borderRadius: 7,
                        background: '#fff',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '12px',
                        lineHeight: 1,
                        transition: 'all 0.15s',
                        outline: 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                    title="Previous week"
                >
                    ←
                </button>

                <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#6b7280',
                    letterSpacing: '0.3px',
                }}>
                    {title}
                </span>

                <button
                    onClick={nextWeek}
                    style={{
                        width: 26,
                        height: 26,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e5e7eb',
                        borderRadius: 7,
                        background: '#fff',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '12px',
                        lineHeight: 1,
                        transition: 'all 0.15s',
                        outline: 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                    title="Next week"
                >
                    →
                </button>
            </div>

            {/* FullCalendar Hidden - Used for data management */}
            <div style={{ display: 'none' }}>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    height="auto"
                />
            </div>

            {/* Compact Scrollable Strip - Same as before */}
            <div
                ref={stripRef}
                style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                    padding: '2px 0',
                    gap: 3,
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    minHeight: 70,
                }}
                className="ds-scroll-hide"
            >
                {days.slice(0, visibleCount).map((day) => {
                    const { isToday, isSelected } = day;

                    let bg = 'transparent';
                    let border = '1.5px solid transparent';
                    let shadow = 'none';
                    let textColor = '#111827';
                    let dayNameColor = '#9ca3af';
                    let badgeBg = '#e5e7eb';
                    let badgeColor = '#6b7280';

                    if (isToday && !isSelected) {
                        border = '1.5px solid #d80505';
                        bg = 'transparent';
                    }
                    if (isSelected) {
                        bg = 'rgb(244, 0, 0)';
                        textColor = '#fff';
                        dayNameColor = 'rgba(255,255,255,0.8)';
                        badgeBg = 'rgba(255,255,255,0.2)';
                        badgeColor = '#fff';
                    }

                    return (
                        <button
                            key={day.key}
                            id={`dc-${day.key}`}
                            onClick={() => pickDate(day.date)}
                            style={{
                                flex: '1 0 36px',
                                padding: '4px 2px 3px',
                                borderRadius: 7,
                                border,
                                background: bg,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: shadow,
                                outline: 'none',
                                position: 'relative',
                                minWidth: 30,
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected && !isToday) {
                                    e.currentTarget.style.background = '#f3f4f6';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = isToday ? 'transparent' : 'transparent';
                                    e.currentTarget.style.transform = 'none';
                                }
                            }}
                        >
                            <div style={{
                                fontSize: '9px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: dayNameColor,
                                marginBottom: 1,
                                opacity: isSelected ? 1 : 0.7,
                            }}>
                                {day.dayName}
                            </div>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: isSelected ? 700 : 600,
                                color: textColor,
                                lineHeight: 1.2,
                            }}>
                                {day.dayNum}
                            </div>
                            {day.count > 0 && (
                                <div style={{
                                    display: 'inline-block',
                                    marginTop: 1,
                                    fontSize: '7px',
                                    fontWeight: 700,
                                    padding: '0px 4px',
                                    borderRadius: 3,
                                    background: badgeBg,
                                    color: badgeColor,
                                    lineHeight: 1.5,
                                    letterSpacing: '0.02em',
                                }}>
                                    {day.count}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <style>{`.ds-scroll-hide::-webkit-scrollbar{display:none}`}</style>
        </div>
    );
}