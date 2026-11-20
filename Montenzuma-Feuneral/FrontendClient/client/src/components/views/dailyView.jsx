import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// --- Constants ---
const DF = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const START_DEFAULT = 7;
const END_DEFAULT = 22;
const HH = 60;

const BR = {
    nairobi: { name: 'Nairobi', color: '#2563EB' },
    thika: { name: 'Thika', color: '#7C3AED' },
    mombasa: { name: 'Mombasa', color: '#059669' },
    nakuru: { name: 'Nakuru', color: '#D97706' },
    kisumu: { name: 'Kisumu', color: '#DC2626' },
};

const SM = {
    pending: 'Pending',
    booked: 'Booked',
    in_transit: 'In Transit',
    transit: 'In Transit',
    completed: 'Completed',
    cancelled: 'Cancelled',
    confirmed: 'Confirmed',
    reserved: 'Reserved',
    standby: 'Standby',
};

const SC = {
    pending: '#D97706',
    booked: '#2563EB',
    in_transit: '#DC2626',
    transit: '#DC2626',
    completed: '#059669',
    cancelled: '#6B7280',
    confirmed: '#2563EB',
    reserved: '#7C3AED',
    standby: '#F59E0B',
};

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

// --- Main Component ---
export default function DispatchBoard({
    bookings: externalBookings = {},
    onBookingClick,
    onBookingUpdate,
    onBookingDelete,
    selectedDate,
    onDateChange
}) {
    const [curDay, setCurDay] = useState(() => {
        const d = selectedDate ? new Date(selectedDate) : new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const [bookings, setBookings] = useState(() => {
        return externalBookings || {};
    });

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [viewingId, setViewingId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selBr, setSelBr] = useState('nairobi');
    const [selSt, setSelSt] = useState('booked');
    const calendarRef = useRef(null);

    useEffect(() => {
        if (externalBookings) {
            setBookings(externalBookings);
        }
    }, [externalBookings]);

    useEffect(() => {
        if (selectedDate) {
            const d = new Date(selectedDate);
            d.setHours(0, 0, 0, 0);
            setCurDay(d);
            if (calendarRef.current) {
                const api = calendarRef.current.getApi();
                api.gotoDate(d);
            }
        }
    }, [selectedDate]);

    const findB = useCallback((id) => {
        for (const k in bookings) {
            const f = bookings[k].find(b => b.id === id);
            if (f) return f;
        }
        return null;
    }, [bookings]);

    const normalizeBooking = useCallback((b) => {
        return {
            id: b.id || b.booking_id,
            client: b.client || b.client_name || b.booking_code || '—',
            dest: b.dest || b.destination || b.to_location || '—',
            from: b.from || b.from_location || b.branch_name || '—',
            start: b.start || (typeof b.start_time === 'number' ? b.start_time : START_DEFAULT),
            end: b.end || (typeof b.end_time === 'number' ? b.end_time : END_DEFAULT),
            allDay: b.allDay === true || (!b.start && !b.start_time && !b.estimated_departure_time && !b.end && !b.end_time && !b.estimated_arrival_time),
            status: b.status || b.booking_status || 'booked',
            phone: b.phone || b.client_phone || '',
            plate: b.plate || b.plate_number || b.hearse_plate || '—',
            branch: b.branch || b.branch_name || 'nairobi',
            branchName: b.branchName || b.branch_name || ''
        };
    }, []);

    // Convert bookings to FullCalendar events
    const events = useMemo(() => {
        const k = dk(curDay);
        const rawBks = bookings[k] || [];
        const dayBks = rawBks.map(b => normalizeBooking(b));
        const eventList = [];

        dayBks.forEach((booking) => {
            const start = booking.start || START_DEFAULT;
            const end = booking.end || END_DEFAULT;
            
            const startDate = new Date(curDay);
            const startHour = Math.floor(start);
            const startMin = Math.round((start % 1) * 60);
            startDate.setHours(startHour, startMin, 0, 0);
            
            let endDate = new Date(curDay);
            const endHour = Math.floor(end);
            const endMin = Math.round((end % 1) * 60);
            
            if (endHour < startHour || (endHour === startHour && endMin <= startMin)) {
                endDate.setDate(endDate.getDate() + 1);
            }
            endDate.setHours(endHour, endMin, 0, 0);
            
            const br = BR[booking.branch] || BR.nairobi;
            
            eventList.push({
                id: booking.id || `${k}-${Math.random()}`,
                title: booking.client || 'Unknown Client',
                start: startDate,
                end: endDate,
                allDay: booking.allDay || false,
                backgroundColor: br.color,
                borderColor: br.color,
                textColor: '#FFFFFF',
                extendedProps: {
                    ...booking,
                    branchColor: br.color,
                    branchName: br.name,
                }
            });
        });

        return eventList;
    }, [bookings, curDay, normalizeBooking]);

    const renderFloats = useCallback(() => {
        const k = dk(curDay);
        const rawBks = bookings[k] || [];
        const bks = rawBks.map(b => normalizeBooking(b));

        const tr = bks.filter(b => b.status === 'transit' || b.status === 'in_transit').length;
        const pn = bks.filter(b => b.status === 'pending').length;
        let items = [];
        if (bks.length) items.push(
            <div className="fb" style={{ animationDelay: '0s' }} key="nb">
                <div className="fp" style={{ background: '#2563EB', color: '#2563EB' }}></div>
                <span style={{ color: '#2563EB' }}>{bks.length} Booking{bks.length !== 1 ? 's' : ''} Today</span>
            </div>
        );
        if (tr > 0) items.push(
            <div className="fb" style={{ animationDelay: '.1s' }} key="tr">
                <div className="fp" style={{ background: '#DC2626', color: '#DC2626' }}></div>
                <span style={{ color: '#DC2626' }}>{tr} In Transit</span>
            </div>
        );
        if (pn > 0) items.push(
            <div className="fb" style={{ animationDelay: '.2s' }} key="pn">
                <div className="fp" style={{ background: '#D97706', color: '#D97706' }}></div>
                <span style={{ color: '#D97706' }}>{pn} Pending Confirmation</span>
            </div>
        );
        if (!bks.length) items.push(
            <div className="fb" style={{ animationDelay: '0s' }} key="clr">
                <div className="fp" style={{ background: '#2563EB', color: '#2563EB' }}></div>
                <span style={{ color: '#2563EB' }}>All Clear Today</span>
            </div>
        );
        return <div className="fl">{items}</div>;
    }, [curDay, bookings, normalizeBooking]);

    // Handle date click
    const handleDateClick = (info) => {
        const date = info.date;
        const newDay = new Date(date);
        newDay.setHours(0, 0, 0, 0);
        setCurDay(newDay);
        if (onDateChange) onDateChange(dk(newDay));
    };

    // Handle event click
    const handleEventClick = (info) => {
        const booking = info.event.extendedProps;
        if (onBookingClick) {
            onBookingClick(booking);
            return;
        }
        setViewingId(booking.id);
        setSidebarOpen(true);
    };

    // Handle slot click for adding bookings
    const handleSlotClick = (info) => {
        const hour = info.date.getHours() + info.date.getMinutes() / 60;
        openAddModal(hour);
    };

    // Custom event renderer - Google Calendar style
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
                        📍 {props.dest}
                    </span>
                )}
                {props.plate && props.plate !== '—' && (
                    <span style={{
                        fontSize: '8px',
                        opacity: 0.6,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        🚗 {props.plate}
                    </span>
                )}
                {props.status && (
                    <span style={{
                        fontSize: '8px',
                        fontWeight: 700,
                        display: 'inline-block',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        marginTop: '1px',
                        alignSelf: 'flex-start',
                        background: `${props.branchColor}30`,
                        color: props.branchColor,
                    }}>
                        {SM[props.status] || props.status}
                    </span>
                )}
            </div>
        );
    };

    const openAddModal = useCallback((hour) => {
        setEditingId(null);
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'mod';
        modalContent.innerHTML = `
            <div class="moh"><h3 id="mTitle">New Booking</h3><button class="cbtn" onclick="document.getElementById('modalContainer').style.display='none'"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button></div>
            <div class="fg"><label>Client Name</label><input type="text" id="fClient" placeholder="e.g. John Doe" /></div>
            <div class="fr"><div class="fg"><label>Destination</label><input type="text" id="fDest" placeholder="e.g. Greenwood Cemetery" /></div><div class="fg"><label>Departure From</label><input type="text" id="fFrom" placeholder="e.g. City Mortuary" /></div></div>
            <div class="fr"><div class="fg"><label>Start Time</label><select id="fStart"></select></div><div class="fg"><label>End Time</label><select id="fEnd"></select></div></div>
            <div class="fr"><div class="fg"><label>Vehicle Plate</label><input type="text" id="fPlate" placeholder="e.g. HF-001" /></div><div class="fg"><label>Client Phone</label><input type="text" id="fPhone" placeholder="e.g. 555-0100" /></div></div>
            <div class="fg"><label>Branch</label><div class="brpk" id="brPick"></div></div>
            <div class="fg"><label>Status</label><div class="brpk" id="stPick"></div></div>
            <div class="moa"><button class="sbb sbg" style="flex:none;padding:7px 16px" onclick="document.getElementById('modalContainer').style.display='none'">Cancel</button><button class="sbb sbp" style="flex:none;padding:7px 20px" id="mSave">Save Booking</button></div>
        `;
        
        // Populate form
        const ss = modalContent.querySelector('#fStart');
        const se = modalContent.querySelector('#fEnd');
        for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15) {
            const t = h + m / 60;
            const l = ft(t);
            ss.innerHTML += `<option value="${t}">${l}</option>`;
            se.innerHTML += `<option value="${t}">${l}</option>`;
        }
        se.innerHTML += `<option value="24">12:00 AM</option>`;
        ss.value = hour !== undefined ? hour : 9;
        se.value = hour !== undefined ? Math.min(24, hour + 1) : 10;

        // Populate branches
        const brPick = modalContent.querySelector('#brPick');
        brPick.innerHTML = Object.entries(BR).map(([k, v]) => 
            `<div class="brc${selBr === k ? ' sel' : ''}" style="background:${v.color}" data-br="${k}">${v.name}</div>`
        ).join('');

        // Populate statuses
        const stPick = modalContent.querySelector('#stPick');
        stPick.innerHTML = Object.entries(SM).map(([k, v]) => 
            `<div class="brc${selSt === k ? ' sel' : ''}" style="background:${SC[k]}" data-st="${k}">${v}</div>`
        ).join('');

        // Show modal
        const container = document.getElementById('modalContainer');
        container.innerHTML = '';
        container.appendChild(modalContent);
        container.style.display = 'flex';
        
        // Set up event listeners
        brPick.querySelectorAll('.brc').forEach(c => {
            c.onclick = () => {
                brPick.querySelectorAll('.brc').forEach(x => x.classList.remove('sel'));
                c.classList.add('sel');
                setSelBr(c.dataset.br);
            };
        });
        
        stPick.querySelectorAll('.brc').forEach(c => {
            c.onclick = () => {
                stPick.querySelectorAll('.brc').forEach(x => x.classList.remove('sel'));
                c.classList.add('sel');
                setSelSt(c.dataset.st);
            };
        });

        modalContent.querySelector('#mSave').onclick = saveBooking;
        
        setTimeout(() => modalContent.querySelector('#fClient')?.focus(), 100);
    }, [selBr, selSt]);

    const saveBooking = useCallback(() => {
        const container = document.getElementById('modalContainer');
        const fClient = container.querySelector('#fClient');
        const fDest = container.querySelector('#fDest');
        const fFrom = container.querySelector('#fFrom');
        const fPlate = container.querySelector('#fPlate');
        const fPhone = container.querySelector('#fPhone');
        const fStart = container.querySelector('#fStart');
        const fEnd = container.querySelector('#fEnd');

        const client = fClient?.value?.trim();
        const dest = fDest?.value?.trim();
        const from = fFrom?.value?.trim() || 'TBD';
        const plate = fPlate?.value?.trim() || 'TBD';
        const phone = fPhone?.value?.trim() || '—';
        const start = parseFloat(fStart?.value || 9);
        const end = parseFloat(fEnd?.value || 10);
        
        if (!client) { toast('Enter client name'); return; }
        if (!dest) { toast('Enter destination'); return; }
        if (end <= start) { toast('End must be after start'); return; }

        const k = dk(curDay);
        const bookingData = {
            id: editingId || `${k}-${Date.now()}`,
            client,
            dest,
            from,
            start,
            end,
            status: selSt,
            phone,
            plate,
            branch: selBr
        };

        if (onBookingUpdate && !editingId) {
            onBookingUpdate(bookingData, 'create');
        } else {
            const updated = { ...bookings };
            if (!updated[k]) updated[k] = [];
            if (editingId) {
                for (const x in updated) updated[x] = updated[x].filter(b => b.id !== editingId);
                updated[k].push(bookingData);
                toast('Booking updated');
            } else {
                updated[k].push(bookingData);
                toast('Booking created');
            }
            setBookings(updated);
        }

        container.style.display = 'none';
        setEditingId(null);
    }, [curDay, bookings, editingId, selSt, selBr, onBookingUpdate]);

    const toast = useCallback((msg) => {
        const el = document.createElement('div');
        el.className = 'tm';
        el.innerHTML = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>${msg}`;
        document.getElementById('toastArea')?.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 3000);
    }, []);

    const renderSidebar = useCallback(() => {
        if (!viewingId) return null;
        const b = findB(viewingId);
        if (!b) return null;
        const br = BR[b.branch] || BR.nairobi;
        const dur = b.end - b.start;
        const dh = Math.floor(dur), dm = Math.round((dur - dh) * 60);
        const ds = `${dh > 0 ? dh + 'h ' : ''}${dm > 0 ? dm + 'm' : ''}`.trim() || '0m';
        const steps = [
            { l: 'Booking Created', dn: true },
            { l: 'Confirmed & Assigned', dn: ['booked', 'transit', 'completed', 'reserved', 'standby'].includes(b.status) },
            { l: 'Hearse Dispatched', dn: ['transit', 'completed'].includes(b.status), ac: b.status === 'transit' },
            { l: 'Arrived at Destination', dn: b.status === 'completed' },
            { l: 'Service Completed', dn: b.status === 'completed', ac: b.status === 'completed' },
        ];

        const handleDelete = () => {
            if (!viewingId) return;
            if (onBookingDelete) {
                onBookingDelete(viewingId);
            } else {
                const updated = { ...bookings };
                for (const k in updated) updated[k] = updated[k].filter(bk => bk.id !== viewingId);
                setBookings(updated);
            }
            setSidebarOpen(false);
            setViewingId(null);
            toast('Booking deleted');
        };

        return (
            <>
                <div className={`sov ${sidebarOpen ? 'op' : ''}`} onClick={() => { setSidebarOpen(false); setViewingId(null); }}></div>
                <aside className={`sb ${sidebarOpen ? 'op' : ''}`} role="dialog" aria-label="Booking details">
                    <div className="sbh"><h3>Booking Details</h3><button className="cbtn" onClick={() => { setSidebarOpen(false); setViewingId(null); }} aria-label="Close"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button></div>
                    <div className="sbd">
                        <div className="scb" style={{ background: br.color }}></div>
                        <div className="sbs"><div className="sbst">Client Information</div><div className="sig"><div className="sic"><div className="sil">Client</div><div className="siv">{b.client}</div></div><div className="sic"><div className="sil">Phone</div><div className="siv">{b.phone}</div></div></div></div>
                        <div className="sbs"><div className="sbst">Schedule</div>
                            <div className="sdr"><span className="sdl">Date</span><span className="sdvl">{DF[curDay.getDay()]}, {MN[curDay.getMonth()]} {curDay.getDate()}</span></div>
                            <div className="sdr"><span className="sdl">Time</span><span className="sdvl">{ft(b.start)} — {ft(b.end)}</span></div>
                            <div className="sdr"><span className="sdl">Duration</span><span className="sdvl">{ds}</span></div>
                            <div className="sdr"><span className="sdl">Status</span><span className="sdvl" style={{ color: SC[b.status] || '#000' }}>{SM[b.status] || b.status}</span></div>
                            <div className="sdr"><span className="sdl">Branch</span><span className="sdvl" style={{ color: br.color }}>{br.name}</span></div>
                        </div>
                        <div className="sbs"><div className="sbst">Route</div><div className="srt"><div className="srl"><div className="srdt" style={{ borderColor: br.color }}></div><div className="srdsh"></div><div className="srdt" style={{ borderColor: br.color }}></div></div><div className="sri"><div><div className="srpt">{b.from}</div><div className="srsb">Departure Point</div></div><div><div className="srpt">{b.dest}</div><div className="srsb">Destination</div></div></div></div></div>
                        <div className="sbs"><div className="sbst">Vehicle</div><div className="sig"><div className="sic"><div className="sil">Plate</div><div className="siv">{b.plate}</div></div><div className="sic"><div className="sil">Type</div><div className="siv">Hearse</div></div></div></div>
                        <div className="sbs"><div className="sbst">Progress</div><div className="stl">{steps.map((s, i) => <div className={`sts${s.dn ? ' dn' : ''}${s.ac ? ' ac' : ''}`} key={i}><div className="std"></div><div className="stt">{s.l}</div></div>)}</div></div>
                    </div>
                    <div className="sbf">
                        <button className="sbb sbdn" onClick={handleDelete}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>Delete</button>
                        <button className="sbb sbg" onClick={() => { setSidebarOpen(false); setViewingId(null); openAddModal(); }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>Edit</button>
                        <button className="sbb sbp" onClick={() => { setSidebarOpen(false); setViewingId(null); }}>Close</button>
                    </div>
                </aside>
            </>
        );
    }, [viewingId, findB, bookings, curDay, sidebarOpen, onBookingDelete, onBookingUpdate, openAddModal, toast]);

    return (
        <div className="dispatch-board">
            <style>{`
                .dispatch-board { height: 100%; width: 100%; display: flex; flex-direction: column; background: #FFFFFF; }
                .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .cal { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .gw { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
                .fl { display: flex; gap: 12px; padding: 8px 16px; flex-wrap: wrap; background: #FAFAFA; border-radius: 8px; margin-bottom: 8px; border: 1px solid #EEEEEE; }
                .fb { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
                .fp { width: 8px; height: 8px; border-radius: 50%; }
                .fc-container { flex: 1; min-height: 400px; position: relative; overflow: hidden; }
                .fc { height: 100% !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
                .fc .fc-timegrid-event { border-radius: 6px !important; border: none !important; cursor: pointer !important; transition: all 0.2s ease !important; padding: 2px 6px !important; margin: 1px 2px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important; }
                .fc .fc-timegrid-event:hover { transform: scale(1.02) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; z-index: 10 !important; }
                .fc .fc-timegrid-col.fc-day-today { background: #FAFAFA !important; }
                .fc .fc-col-header-cell { padding: 8px 0 !important; background: #FFFFFF !important; border-bottom: 2px solid #EEEEEE !important; }
                .fc .fc-col-header-cell-cushion { font-size: 16px !important; font-weight: 700 !important; color: #000000 !important; text-decoration: none !important; }
                .fc .fc-timegrid-axis-cushion, .fc .fc-timegrid-slot-label-cushion { font-size: 12px !important; font-weight: 600 !important; color: #999999 !important; }
                .fc .fc-timegrid-now-indicator-line { border-color: #D32F2F !important; border-width: 2px !important; }
                .fc .fc-timegrid-now-indicator-arrow { border-color: #D32F2F !important; border-width: 5px !important; }
                .fc .fc-timegrid-now-indicator-line::before { content: '● ' !important; color: #D32F2F !important; font-size: 12px !important; position: absolute !important; left: -20px !important; top: -6px !important; }
                .fc .fc-popover { border-radius: 12px !important; border: 1px solid #EEEEEE !important; box-shadow: 0 4px 24px rgba(0,0,0,0.08) !important; background: #FFFFFF !important; }
                .fc .fc-popover-header { padding: 12px 16px !important; background: #FAFAFA !important; border-bottom: 1px solid #EEEEEE !important; border-radius: 12px 12px 0 0 !important; }
                .fc .fc-popover-title { font-size: 14px !important; font-weight: 700 !important; color: #000000 !important; }
                .fc .fc-popover-body { padding: 8px 12px !important; }
                .fc .fc-timegrid-all-day-events { min-height: 30px !important; background: #FFFFFF !important; }
                .fc .fc-timegrid-all-day-event { border-radius: 4px !important; border: none !important; padding: 2px 6px !important; margin: 1px 2px !important; font-size: 11px !important; font-weight: 600 !important; }
                .fc .fc-daygrid-more-link { font-size: 10px !important; font-weight: 600 !important; color: #2563EB !important; cursor: pointer !important; padding: 2px 4px !important; border-radius: 4px !important; }
                .fc .fc-daygrid-more-link:hover { background: #EFF6FF !important; }
                @media (max-width: 640px) { .fc .fc-col-header-cell-cushion { font-size: 13px !important; } .fc .fc-timegrid-event { padding: 1px 4px !important; } .fc .fc-timegrid-event .fc-event-title { font-size: 9px !important; } }
                .sov { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 99; display: none; }
                .sov.op { display: block; }
                .sb { position: fixed; top: 0; right: -400px; width: 380px; max-width: 90%; height: 100%; background: #FFFFFF; z-index: 100; transition: right 0.3s ease; box-shadow: -4px 0 24px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
                .sb.op { right: 0; }
                .sbh { padding: 16px 20px; border-bottom: 1px solid #EEEEEE; display: flex; justify-content: space-between; align-items: center; }
                .sbh h3 { margin: 0; font-size: 16px; font-weight: 700; }
                .cbtn { width: 28px; height: 28px; border: none; background: #F5F5F5; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #666; }
                .sbd { flex: 1; overflow-y: auto; padding: 16px 20px; }
                .scb { height: 4px; border-radius: 2px; margin-bottom: 16px; }
                .sbs { margin-bottom: 16px; }
                .sbst { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #999; margin-bottom: 8px; letter-spacing: 0.5px; }
                .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .sic { background: #FAFAFA; padding: 8px 12px; border-radius: 6px; }
                .sil { font-size: 10px; color: #999; }
                .siv { font-size: 13px; font-weight: 600; margin-top: 2px; }
                .sdr { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #F5F5F5; }
                .sdl { font-size: 12px; color: #999; }
                .sdvl { font-size: 13px; font-weight: 600; }
                .srt { display: flex; gap: 12px; align-items: stretch; }
                .srl { display: flex; flex-direction: column; align-items: center; padding: 4px 0; }
                .srdt { width: 10px; height: 10px; border-radius: 50%; border: 2px solid; flex-shrink: 0; }
                .srdsh { flex: 1; width: 2px; background: #EEEEEE; margin: 2px 0; }
                .sri { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
                .srpt { font-weight: 600; font-size: 13px; }
                .srsb { font-size: 10px; color: #999; margin-top: 2px; }
                .stl { display: flex; flex-direction: column; gap: 6px; }
                .sts { display: flex; align-items: center; gap: 10px; opacity: 0.4; }
                .sts.dn { opacity: 1; }
                .sts.ac .std { background: #2563EB; border-color: #2563EB; }
                .sts.ac .stt { color: #2563EB; font-weight: 700; }
                .std { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #DDD; flex-shrink: 0; }
                .sts.dn .std { border-color: #2563EB; background: #2563EB; }
                .stt { font-size: 12px; }
                .sbf { padding: 12px 20px; border-top: 1px solid #EEEEEE; display: flex; gap: 8px; justify-content: flex-end; }
                .sbb { padding: 8px 16px; border: none; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
                .sbdn { background: #FEE2E2; color: #DC2626; }
                .sbg { background: #EFF6FF; color: #2563EB; }
                .sbp { background: #F5F5F5; color: #666; }
                #modalContainer { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: none; align-items: center; justify-content: center; }
                .mod { background: #FFFFFF; border-radius: 12px; max-width: 520px; width: 90%; max-height: 90vh; overflow-y: auto; padding: 24px; }
                .moh { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .moh h3 { margin: 0; font-size: 18px; font-weight: 700; }
                .fg { margin-bottom: 12px; }
                .fg label { display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px; }
                .fg input, .fg select { width: 100%; padding: 8px 12px; border: 1px solid #DDD; border-radius: 6px; font-size: 13px; box-sizing: border-box; }
                .fr { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .brpk { display: flex; gap: 6px; flex-wrap: wrap; }
                .brc { padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; color: white; cursor: pointer; opacity: 0.6; transition: all 0.2s; }
                .brc:hover { opacity: 0.8; }
                .brc.sel { opacity: 1; box-shadow: 0 0 0 2px #000, 0 0 0 4px rgba(0,0,0,0.1); }
                .moa { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #EEEEEE; }
                .ta { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 300; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none; }
                .tm { background: #1E293B; color: white; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideUp 0.3s ease; pointer-events: auto; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .empty-ctr { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #999; pointer-events: none; }
                .empty-ctr p { margin: 4px 0; font-size: 14px; }
            `}</style>

            <div className="main">
                <div className={`cal ${sidebarOpen ? 'sh' : ''}`}>
                    <div className="gw">
                        {renderFloats()}
                        <div className="fc-container">
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[timeGridPlugin, interactionPlugin]}
                                initialView="timeGridDay"
                                headerToolbar={false}
                                events={events}
                                dateClick={handleDateClick}
                                eventClick={handleEventClick}
                                selectable={true}
                                select={handleSlotClick}
                                eventContent={renderEventContent}
                                height="100%"
                                contentHeight="100%"
                                slotMinTime="05:00:00"
                                slotMaxTime="23:00:00"
                                slotDuration="01:00:00"
                                allDaySlot={true}
                                dayHeaders={true}
                                nowIndicator={true}
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
                                eventMinHeight={20}
                                eventMaxStack={5}
                                expandRows={true}
                                stickyHeaderDates={true}
                                dayMaxEvents={true}
                                selectMirror={true}
                                unselectAuto={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {renderSidebar()}
            <div id="modalContainer"></div>
            <div className="ta" id="toastArea"></div>
        </div>
    );
}