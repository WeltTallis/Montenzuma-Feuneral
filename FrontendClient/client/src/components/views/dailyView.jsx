import React, { useState, useEffect, useRef, useCallback } from 'react';

import { BR, HH, MAX_H, SC, SM, VIEWER_CSS, dk, ft, layout } from './viewerShared';


// --- Constants ---
const DF = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Full 24-hour range — always show 0 to 24
const START_HOUR = 0;
const END_HOUR = 24;

// Default operational window shown for date-only (untimed / all-day) bookings.
const START_DEFAULT = 6;
const END_DEFAULT = 22;

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
    const gridWrapRef = useRef(null);

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
        }
    }, [selectedDate]);

    const findB = useCallback((id) => {
        for (const k in bookings) {
            const f = bookings[k].find(b => b.id === id);
            if (f) return f;
        }
        return null;
    }, [bookings]);

    const getDayRange = useCallback((bks) => {
        // Always return full 24-hour range
        return { sh: START_HOUR, eh: END_HOUR };
    }, []);

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

    const renderFloats = useCallback(() => {
        const k = dk(curDay);
        const rawBks = bookings[k] || [];
        const bks = rawBks.map(b => normalizeBooking(b));

        const tr = bks.filter(b => b.status === 'transit' || b.status === 'in_transit').length;
        const pn = bks.filter(b => b.status === 'pending').length;
        let items = [];
        if (bks.length) items.push(<div className="fb" style={{ animationDelay: '0s' }} key="nb"><div className="fp" style={{ background: '#2563EB', color: '#2563EB' }}></div><span style={{ color: '#2563EB' }}>{bks.length} Booking{bks.length !== 1 ? 's' : ''} Today</span></div>);
        if (tr > 0) items.push(<div className="fb" style={{ animationDelay: '.1s' }} key="tr"><div className="fp" style={{ background: '#DC2626', color: '#DC2626' }}></div><span style={{ color: '#DC2626' }}>{tr} In Transit</span></div>);
        if (pn > 0) items.push(<div className="fb" style={{ animationDelay: '.2s' }} key="pn"><div className="fp" style={{ background: '#D97706', color: '#D97706' }}></div><span style={{ color: '#D97706' }}>{pn} Pending Confirmation</span></div>);
        if (!bks.length) items.push(<div className="fb" style={{ animationDelay: '0s' }} key="clr"><div className="fp" style={{ background: '#2563EB', color: '#2563EB' }}></div><span style={{ color: '#2563EB' }}>All Clear Today</span></div>);
        return <div className="fl">{items}</div>;
    }, [curDay, bookings, normalizeBooking]);

    const renderDayHeader = useCallback(() => {
        const td = new Date(); td.setHours(0, 0, 0, 0);
        const isToday = curDay.getTime() === td.getTime();
        const k = dk(curDay);
        const rawBks = bookings[k] || [];
        const bks = rawBks.map(b => normalizeBooking(b));
        const cnt = bks.length;

        // Calculate actual booking activity range for display (not for view window)
        let actSh = 24, actEh = 0;
        bks.forEach(b => {
            const start = b.start || 0;
            const end = b.end || 24;
            if (start < actSh) actSh = start;
            if (end > actEh) actEh = end;
        });
        if (actSh === 24) actSh = 0;
        if (actEh === 0) actEh = 24;

        return (
            <div className="dh">
                <div className="dhs"></div>
                <div className="dhc">
                    <span className="dn">{isToday ? 'Today' : DF[curDay.getDay()]}</span>
                    <span className={`dd ${isToday ? 'tm' : ''}`}>{curDay.getDate()}</span>
                    <span className="db">{cnt} booking{cnt !== 1 ? 's' : ''}</span>
                    <span className="dr">{ft(Math.floor(actSh))} — {ft(Math.ceil(actEh))}</span>
                    <span className="dr" style={{ color: '#94A3B8', fontWeight: 400 }}>24h view</span>
                </div>
            </div>
        );
    }, [curDay, bookings, normalizeBooking]);


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

        const handleEdit = () => {
            const bk = findB(viewingId);
            setSidebarOpen(false);
            if (bk) setTimeout(() => openEditModal(bk), 250);
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
                        <button className="sbb sbg" onClick={handleEdit}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>Edit</button>
                        <button className="sbb sbp" onClick={() => { setSidebarOpen(false); setViewingId(null); }}>Close</button>
                    </div>
                </aside>
            </>
        );
    }, [viewingId, findB, bookings, curDay, sidebarOpen, onBookingDelete, onBookingUpdate]);

    const openEditModal = useCallback((b) => {
        setEditingId(b.id);
        document.getElementById('mTitle').textContent = 'Edit Booking';
        document.getElementById('mSave').textContent = 'Update Booking';
        populateForm();
        document.getElementById('fStart').value = b.start;
        document.getElementById('fEnd').value = b.end;
        document.getElementById('fClient').value = b.client;
        document.getElementById('fDest').value = b.dest;
        document.getElementById('fFrom').value = b.from;
        document.getElementById('fPlate').value = b.plate;
        document.getElementById('fPhone').value = b.phone;
        setSelBr(b.branch);
        setSelSt(b.status);
        document.querySelectorAll('#brPick .brc').forEach(c => c.classList.toggle('sel', c.dataset.br === b.branch));
        document.querySelectorAll('#stPick .brc').forEach(c => c.classList.toggle('sel', c.dataset.st === b.status));
        setModalOpen(true);
        setTimeout(() => document.getElementById('fClient').focus(), 100);
    }, []);

    const populateForm = useCallback(() => {
        const ss = document.getElementById('fStart'), se = document.getElementById('fEnd');
        ss.innerHTML = ''; se.innerHTML = '';
        for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15) {
            const t = h + m / 60;
            const l = ft(t);
            ss.innerHTML += `<option value="${t}">${l}</option>`;
            se.innerHTML += `<option value="${t}">${l}</option>`;
        }
        se.innerHTML += `<option value="24">12:00 AM</option>`;
        ss.value = 9; se.value = 10;

        const brPick = document.getElementById('brPick');
        brPick.innerHTML = Object.entries(BR).map(([k, v]) => `<div class="brc${selBr === k ? ' sel' : ''}" style="background:${v.color}" data-br="${k}">${v.name}</div>`).join('');
        brPick.querySelectorAll('.brc').forEach(c => c.onclick = () => {
            brPick.querySelectorAll('.brc').forEach(x => x.classList.remove('sel'));
            c.classList.add('sel');
            setSelBr(c.dataset.br);
        });

        const stPick = document.getElementById('stPick');
        stPick.innerHTML = Object.entries(SM).map(([k, v]) => `<div class="brc${selSt === k ? ' sel' : ''}" style="background:${SC[k]}" data-st="${k}">${v}</div>`).join('');
        stPick.querySelectorAll('.brc').forEach(c => c.onclick = () => {
            stPick.querySelectorAll('.brc').forEach(x => x.classList.remove('sel'));
            c.classList.add('sel');
            setSelSt(c.dataset.st);
        });
    }, [selBr, selSt]);

    const renderModal = useCallback(() => {
        if (!modalOpen) return null;
        return (
            <div className={`mov ${modalOpen ? 'op' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
                <div className="mod" role="dialog" aria-label="Add booking">
                    <div className="moh"><h3 id="mTitle">New Booking</h3><button className="cbtn" onClick={() => setModalOpen(false)} aria-label="Close"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button></div>
                    <div className="fg"><label>Client Name</label><input type="text" id="fClient" placeholder="e.g. John Doe" /></div>
                    <div className="fr"><div className="fg"><label>Destination</label><input type="text" id="fDest" placeholder="e.g. Greenwood Cemetery" /></div><div className="fg"><label>Departure From</label><input type="text" id="fFrom" placeholder="e.g. City Mortuary" /></div></div>
                    <div className="fr"><div className="fg"><label>Start Time</label><select id="fStart"></select></div><div className="fg"><label>End Time</label><select id="fEnd"></select></div></div>
                    <div className="fr"><div className="fg"><label>Vehicle Plate</label><input type="text" id="fPlate" placeholder="e.g. HF-001" /></div><div className="fg"><label>Client Phone</label><input type="text" id="fPhone" placeholder="e.g. 555-0100" /></div></div>
                    <div className="fg"><label>Branch</label><div className="brpk" id="brPick"></div></div>
                    <div className="fg"><label>Status</label><div className="brpk" id="stPick"></div></div>
                    <div className="moa"><button className="sbb sbg" style={{ flex: 'none', padding: '7px 16px' }} onClick={() => setModalOpen(false)}>Cancel</button><button className="sbb sbp" style={{ flex: 'none', padding: '7px 20px' }} id="mSave" onClick={saveBooking}>Save Booking</button></div>
                </div>
            </div>
        );
    }, [modalOpen, selBr, selSt, populateForm]);

    const saveBooking = useCallback(() => {
        const client = document.getElementById('fClient').value.trim();
        const dest = document.getElementById('fDest').value.trim();
        const from = document.getElementById('fFrom').value.trim() || 'TBD';
        const plate = document.getElementById('fPlate').value.trim() || 'TBD';
        const phone = document.getElementById('fPhone').value.trim() || '—';
        const start = parseFloat(document.getElementById('fStart').value);
        const end = parseFloat(document.getElementById('fEnd').value);
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

        setModalOpen(false);
        setEditingId(null);
    }, [curDay, bookings, editingId, selSt, selBr, onBookingUpdate]);

    const toast = useCallback((msg) => {
        const id = Date.now();
        const el = document.createElement('div');
        el.className = 'tm';
        el.innerHTML = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>${msg}`;
        document.getElementById('toastArea').appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 3000);
    }, []);

    const scrollToNow = useCallback(() => {
        const now = new Date();
        const nh = now.getHours() + now.getMinutes() / 60;
        const td = new Date(); td.setHours(0, 0, 0, 0);
        const isToday = td.getTime() === curDay.getTime();
        if (isToday && gridWrapRef.current) {
            gridWrapRef.current.scrollTo({ top: Math.max(0, (nh - START_HOUR - 1.5) * HH), behavior: 'smooth' });
        } else {
            // Scroll to 6 AM (start of typical business day) for non-today dates
            if (gridWrapRef.current) {
                gridWrapRef.current.scrollTo({ top: Math.max(0, 6 * HH), behavior: 'smooth' });
            }
        }
    }, [curDay]);

    useEffect(() => {
        if (modalOpen) populateForm();
    }, [modalOpen, populateForm]);

    useEffect(() => {
        const timer = setTimeout(scrollToNow, 250);
        return () => clearTimeout(timer);
    }, [scrollToNow]);

    useEffect(() => {
        const interval = setInterval(() => {
            setBookings(prev => ({ ...prev }));
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const openAddModal = useCallback((hour) => {
        setEditingId(null);
        document.getElementById('mTitle').textContent = 'New Booking';
        document.getElementById('mSave').textContent = 'Save Booking';
        populateForm();
        if (hour !== undefined) {
            document.getElementById('fStart').value = hour;
            document.getElementById('fEnd').value = Math.min(24, hour + 1);
        }
        document.getElementById('fClient').value = '';
        document.getElementById('fDest').value = '';
        document.getElementById('fFrom').value = '';
        document.getElementById('fPlate').value = '';
        document.getElementById('fPhone').value = '';
        setSelBr('nairobi');
        setSelSt('booked');
        document.querySelectorAll('#brPick .brc').forEach((c, i) => c.classList.toggle('sel', i === 0));
        document.querySelectorAll('#stPick .brc').forEach((c, i) => c.classList.toggle('sel', i === 0));
        setModalOpen(true);
        setTimeout(() => document.getElementById('fClient').focus(), 100);
    }, [populateForm]);

    const handleGridClick = useCallback((e) => {
        const cell = e.target.closest('.hc');
        if (cell) openAddModal(parseFloat(cell.dataset.hour));
    }, [openAddModal]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') {
                setModalOpen(false);
                setSidebarOpen(false);
            }
            if (e.key === 'Enter' && modalOpen) saveBooking();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [modalOpen, saveBooking]);

    // Generate time label for each hour
    const getTimeLabel = (h) => {
        if (h === 0) return '12 AM';
        if (h < 12) return `${h} AM`;
        if (h === 12) return '12 PM';
        return `${h - 12} PM`;
    };

    return (
        <div className="dispatch-board">
            <style>{VIEWER_CSS}</style>

            {/* Inline styles for breakpoint lines */}
            <style>{`
                /* Hour breakpoint lines */
                .hour-breakpoint {
                    position: absolute;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, #E2E8F0 8%, #E2E8F0 92%, transparent 100%);
                    pointer-events: none;
                    z-index: 1;
                }
                .hour-breakpoint.major {
                    height: 1.5px;
                    background: linear-gradient(90deg, transparent 0%, #CBD5E1 8%, #CBD5E1 92%, transparent 100%);
                }
                .hour-breakpoint.midnight-top {
                    height: 2px;
                    background: linear-gradient(90deg, transparent 0%, #94A3B8 8%, #94A3B8 92%, transparent 100%);
                }
                /* Hour cell bottom border for grid lines */
                .hc::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: #E2E8F0;
                    pointer-events: none;
                }
                /* Half-hour dashed line inside cell */
                .hc::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 4px;
                    right: 4px;
                    height: 0;
                    border-top: 1px dashed #F1F5F9;
                    pointer-events: none;
                    z-index: 0;
                }
                /* Highlight business hours zone */
                .biz-zone {
                    position: absolute;
                    left: 0;
                    right: 0;
                    background: rgba(241, 245, 249, 0.5);
                    pointer-events: none;
                    z-index: 0;
                    border-top: 1px dashed #CBD5E1;
                    border-bottom: 1px dashed #CBD5E1;
                }
                .biz-label {
                    position: absolute;
                    right: 8px;
                    top: 4px;
                    font-size: 9px;
                    color: #94A3B8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    pointer-events: none;
                    z-index: 1;
                }
                /* Night zone subtle tint */
                .night-zone-top {
                    position: absolute;
                    left: 0;
                    right: 0;
                    background: linear-gradient(180deg, rgba(15, 23, 42, 0.03) 0%, transparent 100%);
                    pointer-events: none;
                    z-index: 0;
                }
                .night-zone-bottom {
                    position: absolute;
                    left: 0;
                    right: 0;
                    background: linear-gradient(0deg, rgba(15, 23, 42, 0.03) 0%, transparent 100%);
                    pointer-events: none;
                    z-index: 0;
                }
            `}</style>

            <div className="main">
                <div className={`cal ${sidebarOpen ? 'sh' : ''}`}>
                    <div className="gw" onClick={handleGridClick} ref={gridWrapRef}>
                        {renderFloats()}
                        {renderDayHeader()}
                        <div className="tg" id="timeGrid">
                            {(() => {
                                const k = dk(curDay);
                                const rawBks = bookings[k] || [];
                                const dayBks = rawBks.map(b => normalizeBooking(b));

                                // Always use full 24-hour range
                                const sh = START_HOUR;
                                const eh = END_HOUR;

                                const laid = layout(dayBks);

                                // Build hour rows with breakpoint lines
                                let rows = [];
                                for (let h = sh; h < eh; h++) {
                                    const l = getTimeLabel(h);

                                    // Determine breakpoint style based on hour
                                    let bpClass = 'hour-breakpoint';
                                    if (h === 0) {
                                        bpClass += ' midnight-top';
                                    } else if (h % 6 === 0) {
                                        bpClass += ' major';
                                    }

                                    rows.push(
                                        <React.Fragment key={h}>
                                            <div className="tl">{l}</div>
                                            <div className="dc" style={{ position: 'relative' }}>
                                                <div className="hc" data-hour={h} style={{ position: 'relative' }}></div>
                                                {/* Horizontal breakpoint line at the TOP of each hour row */}
                                                <div className={bpClass} style={{ top: 0 }}></div>
                                            </div>
                                        </React.Fragment>
                                    );
                                }

                                const now = new Date();
                                const td = new Date(); td.setHours(0, 0, 0, 0);
                                const isToday = td.getTime() === curDay.getTime();
                                const nh = now.getHours() + now.getMinutes() / 60;
                                const showLine = isToday && nh >= sh && nh < eh;

                                // Booking elements
                                let bookingElements = [];
                                if (laid.length) {
                                    laid.forEach((b, i) => {
                                        const top = Math.min((b.start - sh) * HH, eh * HH - MAX_H);
                                        const height = Math.min(MAX_H, Math.max(HH * 0.2, (Math.min(b.end, eh) - Math.max(b.start, sh)) * HH));
                                        const wp = 100 / b._t;
                                        const lp = b._c * wp;
                                        const br = BR[b.branch] || BR.nairobi;
                                        const showTm = height > 30;
                                        const showDs = height > 48;
                                        const showDt = height > 66;
                                        const showPl = height > 42;
                                        bookingElements.push(
                                            <div
                                                key={b.id}
                                                className="bb"
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                    left: `calc(${lp}% + 2px)`,
                                                    width: `calc(${wp}% - 4px)`,
                                                    background: br.color,
                                                    animationDelay: `${i * 0.04}s`
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onBookingClick) { onBookingClick(b); return; }
                                                    setViewingId(b.id);
                                                    setSidebarOpen(true);
                                                }}
                                            >
                                                <div className="bb-sp">{SM[b.status] || b.status}</div>
                                                <div className="bb-br">{b.branchName || br.name}</div>
                                                <div className="bb-cl">{b.client}</div>
                                                {showTm && <div className="bb-tm">{b.allDay ? 'All Day' : `${ft(b.start)} – ${ft(b.end)}`}</div>}
                                                {showDs && <div className="bb-ds">{b.dest}</div>}
                                                {showDt && <div className="bb-dt">{b.from}</div>}
                                                {showPl && <div className="bb-pl">{b.plate}</div>}
                                            </div>
                                        );
                                    });
                                }

                                // Zone overlays for visual context
                                const nightTopHeight = 6 * HH;  // 12 AM to 6 AM
                                const nightBottomTop = 22 * HH; // 10 PM onwards
                                const nightBottomHeight = 2 * HH;
                                const bizTop = 6 * HH;
                                const bizHeight = 16 * HH; // 6 AM to 10 PM

                                return (
                                    <>
                                        {rows}
                                        <div className="tg-ov">
                                            {/* Night zone: midnight to 6 AM */}
                                            <div className="night-zone-top" style={{ top: 0, height: `${nightTopHeight}px` }}></div>

                                            {/* Business hours zone: 6 AM to 10 PM */}
                                            <div className="biz-zone" style={{ top: `${bizTop}px`, height: `${bizHeight}px` }}>
                                                <span className="biz-label">Business Hours</span>
                                            </div>

                                            {/* Night zone: 10 PM to midnight */}
                                            <div className="night-zone-bottom" style={{ top: `${nightBottomTop}px`, height: `${nightBottomHeight}px` }}></div>

                                            {bookingElements}

                                            {showLine && (
                                                <div className="nl" style={{ top: (nh - sh) * HH + 'px' }}>
                                                    <span className="nl-l">{ft(nh)}</span>
                                                </div>
                                            )}

                                            {!laid.length && (
                                                <div className="empty-ctr">
                                                    <div style={{ textAlign: 'center' }}>
                                                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                        <p style={{ marginTop: '8px' }}>No bookings for this day</p>
                                                        <p style={{ marginTop: '4px', fontSize: '11px', color: '#94A3B8' }}>Click any hour to add one</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {renderSidebar()}
            {renderModal()}
            <div className="ta" id="toastArea"></div>
        </div>
    );
}