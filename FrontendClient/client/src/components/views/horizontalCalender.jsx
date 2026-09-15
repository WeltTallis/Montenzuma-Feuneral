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
    const [visibleCount, setVisibleCount] = useState(30);
    const calendarRef = useRef(null);

    const eventMeta = useMemo(() => {
        const map = {};
        eventsData.forEach((ev) => {
            const date = new Date(ev.date);
            const key = dk(date.getFullYear(), date.getMonth(), date.getDate());
            if (!map[key]) map[key] = [];
            map[key].push({ color: ev.color || '#a9762d', title: ev.title || 'Event' });
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
                events: eventMeta[key] || [],
                isToday: key === todayKey,
                isSelected: selectedDate != null && key === dk(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()),
            });
        }
        return arr;
    }, [viewStart, eventMeta, todayKey, selectedDate]);

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
            setVisibleCount(30);
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
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e4e0d6',
            fontFamily: 'IBM Plex Sans, sans-serif',
            width: '100%',
            maxWidth: 2200,
            margin: '0 auto',
        }}>
            {/* Sleek Nav */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #e4e0d6',
            }}>
                <button
                    onClick={prevWeek}
                    style={{
                        width: 30,
                        height: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e5e7eb',
                        borderRadius: 7,
                        background: '#fff',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '18px',
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
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    padding: 0,
                    gap: 0,
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    minHeight: 144,
                }}
                className="ds-scroll-hide"
            >
                {days.slice(0, visibleCount).map((day, index) => {
                    const { isToday, isSelected } = day;
                    const eventTypes = [...new Map(day.events.map((event) => [event.color, event])).values()];

                    let bg = (day.date.getDay() === 0 || day.date.getDay() === 6) ? '#f7f6f3' : 'transparent';
                    let border = 'none';
                    let shadow = 'none';
                    let textColor = '#1c1b18';
                    let dayNameColor = '#a89c85';

                    if (isToday && !isSelected) {
                        bg = '#fbf6ea';
                    }
                    if (isSelected) {
                        bg = '#1c1b18';
                        textColor = '#fff';
                        dayNameColor = 'rgba(255,255,255,0.8)';
                    }

                    return (
                        <button
                            key={day.key}
                            id={`dc-${day.key}`}
                            onClick={() => pickDate(day.date)}
                            style={{
                                flex: '0 0 108px',
                                minHeight: 144,
                                padding: '20px 0',
                                borderRadius: 0,
                                border,
                                background: bg,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: shadow,
                                outline: 'none',
                                position: 'relative',
                                minWidth: 108,
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
                                marginBottom: 2,
                                opacity: isSelected ? 1 : 0.7,
                            }}>
                                {day.dayName}
                            </div>
                            <div style={{
                                fontFamily: 'Fraunces, Georgia, serif',
                                fontSize: '25px',
                                fontWeight: 600,
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: textColor,
                                background: isToday ? (isSelected ? '#ffffff' : '#1c1b18') : 'transparent',
                                ...(isToday && isSelected ? { color: '#1c1b18' } : {}),
                                lineHeight: 1.2,
                            }}>
                                {day.dayNum}
                            </div>
                            <div style={{ display: 'flex', gap: 3, height: 6 }}>
                                {eventTypes.map((event) => <span key={event.color} title={event.title} style={{ width: 5, height: 5, borderRadius: '50%', background: event.color }} />)}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div style={{
                display: 'flex', alignItems: 'center', gap: 18, padding: '12px 20px',
                borderTop: '1px solid #e4e0d6', fontSize: 11, color: '#867c6a', flexWrap: 'wrap'
            }}>
                {[['#a9762d', 'Intake'], ['#4f6b52', 'Release'], ['#7d3b3b', 'Postmortem']].map(([color, label]) => (
                    <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i style={{ width: 6, height: 6, borderRadius: '50%', background: color }} /> {label}
                    </span>
                ))}
                <span style={{ marginLeft: 'auto', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11.5 }}>
                    Selected - <b style={{ color: '#1c1b18' }}>{selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : title}</b>
                </span>
            </div>

            <style>{`.ds-scroll-hide::-webkit-scrollbar{display:none}`}</style>
        </div>
    );
}