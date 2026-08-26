<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hearse Dispatch Board</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-app: #FFFFFF;
            --bg-soft: #FAFAFA;
            --bg-hover: #F5F5F5;
            --border: #EEEEEE;
            --text-main: #000000;
            --text-muted: #999999;
            --green: #2E7D32;
            --green-bg: #E8F5E9;
            --red: #D32F2F;
            --red-bg: #FFEBEE;
            --blue: #2563EB;
            --blue-bg: #EFF6FF;
            --amber: #F59E0B;
            --amber-bg: #FFFBEB;
            --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.06);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-app);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* ================= LEFT PANEL (CALENDAR) ================= */
        .cal-panel {
            flex: 1.5; /* Slightly wider to accommodate week view */
            padding: 40px;
            display: flex;
            flex-direction: column;
            border-right: 1px solid var(--border);
            overflow-y: auto;
        }

        .cal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
            flex-wrap: wrap;
            gap: 16px;
        }

        .cal-title h1 {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -1px;
            margin-bottom: 4px;
        }
        .cal-title p { color: var(--text-muted); font-size: 14px; font-weight: 500; }

        .cal-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        
        .view-toggle {
            display: flex;
            background: var(--bg-soft);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 4px;
        }
        .view-btn {
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            color: var(--text-muted);
            background: none;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .view-btn.active {
            background: var(--text-main);
            color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .btn-icon {
            width: 36px; height: 36px;
            border: 1px solid var(--border);
            background: var(--bg-app);
            border-radius: 10px;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s;
        }
        .btn-icon:hover { background: var(--text-main); color: white; border-color: var(--text-main); }
        
        .btn-text {
            padding: 0 16px; height: 36px;
            border: 1px solid var(--border);
            background: var(--bg-app);
            border-radius: 10px;
            cursor: pointer;
            font-weight: 700; font-size: 12px;
            transition: all 0.2s;
        }
        .btn-text:hover { background: var(--text-main); color: white; border-color: var(--text-main); }

        .legend {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            padding: 12px 16px;
            background: var(--bg-soft);
            border-radius: 10px;
        }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--text-muted); }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

        /* --- MONTH VIEW --- */
        .grid-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            margin-bottom: 12px;
        }
        .weekday {
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
        }

        .grid-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
        }

        .day-cell {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-top: 12px;
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }

        .day-cell:hover { background: var(--bg-hover); }
        .day-cell.outside { opacity: 0.3; }
        
        .day-num {
            font-size: 16px;
            font-weight: 600;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
        }

        .day-cell.today .day-num { background: var(--green); color: white; }
        .day-cell.selected .day-num { background: var(--text-main); color: white; transform: scale(1.05); }

        .day-events {
            display: flex;
            gap: 4px;
            margin-top: 8px;
            justify-content: center;
        }
        .event-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }

        /* --- WEEK VIEW --- */
        .week-view-container {
            display: flex;
            flex-direction: column;
            flex: 1;
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
        }
        .week-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            flex: 1;
        }
        .week-day-col {
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            cursor: pointer;
            transition: background 0.2s;
        }
        .week-day-col:last-child { border-right: none; }
        .week-day-col:hover { background: var(--bg-soft); }
        .week-day-col.selected { background: var(--bg-soft); box-shadow: inset 0 0 0 2px var(--text-main); border-radius: 12px; }

        .week-day-header {
            padding: 16px;
            text-align: center;
            border-bottom: 1px solid var(--border);
        }
        .week-day-name { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; }
        .week-day-num { 
            font-size: 20px; 
            font-weight: 700; 
            width: 32px; 
            height: 32px; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            border-radius: 50%; 
        }
        .week-day-col.today .week-day-num { background: var(--green); color: white; }
        .week-day-col.selected .week-day-num { background: var(--text-main); color: white; }

        .week-events-area {
            padding: 12px 8px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: center;
        }
        .week-event-pill {
            width: 100%;
            padding: 8px;
            border-radius: 8px;
            text-align: center;
            font-size: 10px;
            font-weight: 700;
        }
        .s-booked { background: var(--blue-bg); color: var(--blue); }
        .s-transit { background: var(--red-bg); color: var(--red); }
        .s-completed { background: var(--green-bg); color: var(--green); }
        .s-pending { background: var(--amber-bg); color: var(--amber); }

        /* ================= RIGHT PANEL (DISPATCH & DETAILS) ================= */
        .dispatch-panel {
            flex: 1;
            background: var(--bg-soft);
            padding: 40px 32px;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }

        .dispatch-header {
            margin-bottom: 32px;
        }
        .dispatch-date {
            font-size: 14px;
            font-weight: 700;
            color: var(--green);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        .dispatch-title {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 16px;
        }

        .fleet-summary {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 32px;
        }
        .fleet-card {
            background: var(--bg-app);
            padding: 16px;
            border-radius: 14px;
            border: 1px solid var(--border);
        }
        .fleet-num { font-size: 24px; font-weight: 800; }
        .fleet-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

        .timeline-list {
            position: relative;
            padding-left: 24px;
        }
        .timeline-list::before {
            content: '';
            position: absolute;
            left: 7px;
            top: 12px;
            bottom: 12px;
            width: 2px;
            background: var(--border);
        }

        .booking-item {
            position: relative;
            margin-bottom: 16px;
            background: var(--bg-app);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-card);
        }

        .booking-item:hover { transform: translateY(-2px); border-color: var(--text-main); }
        .booking-item.active { border: 2px solid var(--text-main); padding: 19px; }

        .timeline-dot {
            position: absolute;
            left: -24px;
            top: 24px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--bg-app);
            border: 3px solid var(--text-muted);
            z-index: 2;
        }
        .booking-item.active .timeline-dot { border-color: var(--text-main); }

        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }
        .item-time { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        .item-client { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
        .item-dest { font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }

        .status-badge {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .item-details {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--border);
            display: none;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        .booking-item.active .item-details { display: grid; }
        .detail-group h5 { font-size: 10px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; }
        .detail-group p { font-size: 13px; font-weight: 600; }

        .mini-timeline {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--border);
            display: none;
            flex-direction: column;
            gap: 12px;
        }
        .booking-item.active .mini-timeline { display: flex; }
        
        .mt-step { display: flex; align-items: center; gap: 12px; }
        .mt-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border); border: 2px solid var(--bg-app); }
        .mt-step.done .mt-dot { background: var(--green); }
        .mt-step.active .mt-dot { background: var(--text-main); box-shadow: 0 0 0 3px rgba(0,0,0,0.1); }
        .mt-text { font-size: 12px; font-weight: 600; color: var(--text-muted); }
        .mt-step.done .mt-text, .mt-step.active .mt-text { color: var(--text-main); }

    </style>
</head>
<body>

    <!-- LEFT: CALENDAR PANEL -->
    <div class="cal-panel">
        <div class="cal-header">
            <div class="cal-title">
                <h1 id="calMonthTitle">December 2023</h1>
                <p>Hearse Dispatch & Booking Board</p>
            </div>
            <div class="cal-controls">
                <div class="view-toggle">
                    <button class="view-btn active" id="btnMonth" onclick="changeView('month')">Month</button>
                    <button class="view-btn" id="btnWeek" onclick="changeView('week')">Week</button>
                </div>
                <button class="btn-text" onclick="goToToday()">Today</button>
                <button class="btn-icon" id="btnPrev" onclick="navDate(-1)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button class="btn-icon" id="btnNext" onclick="navDate(1)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
        </div>

        <div class="legend">
            <div class="legend-item"><div class="legend-dot" style="background: var(--amber);"></div>Pending</div>
            <div class="legend-item"><div class="legend-dot" style="background: var(--blue);"></div>Booked</div>
            <div class="legend-item"><div class="legend-dot" style="background: var(--red);"></div>In Transit</div>
            <div class="legend-item"><div class="legend-dot" style="background: var(--green);"></div>Completed</div>
        </div>

        <!-- Dynamic View Container -->
        <div id="viewContainer"></div>
    </div>

    <!-- RIGHT: DISPATCH & DETAILS PANEL -->
    <div class="dispatch-panel">
        <div class="dispatch-header">
            <div class="dispatch-date" id="dispatchDateLabel">TODAY · MONDAY, DEC 18</div>
            <div class="dispatch-title" id="dispatchTitleText">Daily Schedule</div>
            
            <div class="fleet-summary">
                <div class="fleet-card">
                    <div class="fleet-num" id="activeBookingsCount">3</div>
                    <div class="fleet-label">Active Bookings</div>
                </div>
                <div class="fleet-card">
                    <div class="fleet-num">1</div>
                    <div class="fleet-label">Hearse Available</div>
                </div>
            </div>
        </div>

        <div class="timeline-list" id="bookingList"></div>
    </div>

    <script>
        // --- STATE & MOCK DATA ---
        let currentView = 'month';
        let displayDate = new Date(2023, 11, 18); // Dec 18, 2023
        let selectedDate = new Date(2023, 11, 18);
        const todayDate = new Date(2023, 11, 18); // Mocking today as Dec 18

        const bookings = [
            { id: 1, day: 18, time: '09:00 AM', client: 'John Doe', dest: 'Greenwood Cemetery', status: 'booked', phone: '555-0100', plate: 'LF-001', from: 'City Mortuary' },
            { id: 2, day: 18, time: '01:00 PM', client: 'Sarah Smith', dest: 'Hillside Vaults', status: 'transit', phone: '555-0101', plate: 'LF-002', from: 'City Mortuary' },
            { id: 3, day: 18, time: '04:30 PM', client: 'Acme Corp', dest: 'State Mausoleum', status: 'completed', phone: '555-0102', plate: 'LF-003', from: 'General Hospital' },
            { id: 4, day: 15, time: '10:00 AM', client: 'James Bond', dest: 'Private Estate', status: 'pending', phone: '555-0103', plate: 'LF-004', from: 'City Mortuary' },
            { id: 5, day: 20, time: '11:00 AM', client: 'Clark Kent', dest: 'Metropolis Cemetery', status: 'pending', phone: '555-0104', plate: 'LF-005', from: 'Daily Planet' },
            { id: 6, day: 21, time: '02:00 PM', client: 'Bruce Wayne', dest: 'Wayne Manor Crypt', status: 'booked', phone: '555-0105', plate: 'LF-006', from: 'Gotham General' },
        ];

        const statusMap = {
            pending: { color: '#F59E0B', class: 's-pending' },
            booked: { color: '#2563EB', class: 's-booked' },
            transit: { color: '#D32F2F', class: 's-transit' },
            completed: { color: '#059669', class: 's-completed' },
        };

        const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

        // --- CALENDAR RENDERING ---
        function renderCalendar() {
            const container = document.getElementById('viewContainer');
            const title = document.getElementById('calMonthTitle');
            
            if (currentView === 'month') {
                title.innerText = `${MONTHS[displayDate.getMonth()]} ${displayDate.getFullYear()}`;
                container.innerHTML = renderMonthGrid();
            } else {
                // Calculate week range
                const start = new Date(displayDate);
                start.setDate(start.getDate() - start.getDay()); // Jump to Sunday
                const end = new Date(start);
                end.setDate(end.getDate() + 6);
                title.innerText = `${MONTHS[start.getMonth()].slice(0,3)} ${start.getDate()} - ${MONTHS[end.getMonth()].slice(0,3)} ${end.getDate()}`;
                container.innerHTML = renderWeekGrid(start);
            }
        }

        function renderMonthGrid() {
            let html = `
                <div class="grid-weekdays">
                    ${WEEKDAYS.map(w => `<div class="weekday">${w}</div>`).join('')}
                </div>
                <div class="grid-days">
            `;

            const year = displayDate.getFullYear();
            const month = displayDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const prevMonthDays = new Date(year, month, 0).getDate();

            // Previous month's overlapping days
            for (let i = firstDay - 1; i >= 0; i--) {
                html += `<div class="day-cell outside"><div class="day-num">${prevMonthDays - i}</div></div>`;
            }

            // Current month days
            for (let i = 1; i <= daysInMonth; i++) {
                const isToday = i === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();
                const isSelected = i === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
                const dayBookings = bookings.filter(b => b.day === i);

                let dotsHtml = '<div class="day-events">';
                dayBookings.forEach(b => {
                    dotsHtml += `<div class="event-dot" style="background: ${statusMap[b.status].color};"></div>`;
                });
                dotsHtml += '</div>';

                html += `
                    <div class="day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" onclick="selectDay(${i})">
                        <div class="day-num">${i}</div>
                        ${dotsHtml}
                    </div>
                `;
            }

            html += `</div>`;
            return html;
        }

        function renderWeekGrid(startDate) {
            let html = `<div class="week-view-container"><div class="week-grid">`;
            
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                
                const dayNum = currentDate.getDate();
                const isToday = currentDate.toDateString() === todayDate.toDateString();
                const isSelected = currentDate.toDateString() === selectedDate.toDateString();
                const dayBookings = bookings.filter(b => b.day === dayNum);

                let eventsHtml = '<div class="week-events-area">';
                dayBookings.forEach(b => {
                    eventsHtml += `<div class="week-event-pill ${statusMap[b.status].class}">${b.time.split(' ')[0]} ${b.client.split(' ')[0]}</div>`;
                });
                eventsHtml += '</div>';

                html += `
                    <div class="week-day-col ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" onclick="selectDayExact(${dayNum}, ${currentDate.getMonth()}, ${currentDate.getFullYear()})">
                        <div class="week-day-header">
                            <div class="week-day-name">${WEEKDAYS[i]}</div>
                            <div class="week-day-num">${dayNum}</div>
                        </div>
                        ${eventsHtml}
                    </div>
                `;
            }
            
            html += `</div></div>`;
            return html;
        }

        // --- BOOKING LIST RENDERING ---
        function renderBookings(day) {
            const list = document.getElementById('bookingList');
            const dayBookings = bookings.filter(b => b.day === day);
            list.innerHTML = '';

            document.getElementById('activeBookingsCount').innerText = dayBookings.length;

            if(dayBookings.length === 0) {
                list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px; font-weight: 500;">No bookings scheduled for this day.</div>`;
                return;
            }

            dayBookings.forEach((b, index) => {
                const s = statusMap[b.status];
                const isActive = index === 0; // Expand first item by default

                list.innerHTML += `
                    <div class="booking-item ${isActive ? 'active' : ''}" onclick="expandCard(this)">
                        <div class="timeline-dot" style="border-color: ${s.color};"></div>
                        
                        <div class="item-header">
                            <div>
                                <div class="item-time">${b.time}</div>
                                <div class="item-client">${b.client}</div>
                                <div class="item-dest">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    ${b.dest}
                                </div>
                            </div>
                            <span class="status-badge ${s.class}">${b.status}</span>
                        </div>

                        <div class="item-details">
                            <div class="detail-group"><h5>Vehicle Plate</h5><p>${b.plate}</p></div>
                            <div class="detail-group"><h5>Client Phone</h5><p>${b.phone}</p></div>
                            <div class="detail-group"><h5>Departure From</h5><p>${b.from}</p></div>
                            <div class="detail-group"><h5>Trip Type</h5><p>Single Day</p></div>
                        </div>

                        <div class="mini-timeline">
                            <div class="mt-step done"><div class="mt-dot"></div><div class="mt-text">Booking Created</div></div>
                            <div class="mt-step done"><div class="mt-dot"></div><div class="mt-text">Confirmed & Dispatched</div></div>
                            <div class="mt-step ${b.status === 'transit' ? 'active' : b.status === 'completed' ? 'done' : ''}"><div class="mt-dot"></div><div class="mt-text">In Transit / Active</div></div>
                            <div class="mt-step ${b.status === 'completed' ? 'done' : ''}"><div class="mt-dot"></div><div class="mt-text">Completed</div></div>
                        </div>
                    </div>
                `;
            });
        }

        // --- INTERACTION LOGIC ---
        function expandCard(el) {
            document.querySelectorAll('.booking-item').forEach(item => item.classList.remove('active'));
            el.classList.add('active');
        }

        function selectDay(day) {
            selectedDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
            updateDispatchPanel();
            renderCalendar();
        }

        // Used for week view because the month might differ
        function selectDayExact(day, month, year) {
            selectedDate = new Date(year, month, day);
            displayDate = new Date(year, month, day); // Sync display date
            updateDispatchPanel();
            renderCalendar();
        }

        function changeView(view) {
            currentView = view;
            document.getElementById('btnMonth').classList.toggle('active', view === 'month');
            document.getElementById('btnWeek').classList.toggle('active', view === 'week');
            renderCalendar();
        }

        function navDate(dir) {
            if (currentView === 'month') {
                displayDate.setMonth(displayDate.getMonth() + dir);
            } else {
                displayDate.setDate(displayDate.getDate() + (dir * 7));
            }
            renderCalendar();
        }

        function goToToday() {
            displayDate = new Date(todayDate);
            selectedDate = new Date(todayDate);
            updateDispatchPanel();
            renderCalendar();
        }

        function updateDispatchPanel() {
            const isToday = selectedDate.toDateString() === todayDate.toDateString();
            const day = selectedDate.getDate();
            
            document.getElementById('dispatchDateLabel').innerText = isToday ? 
                `TODAY · ${WEEKDAYS[selectedDate.getDay()].toUpperCase()}, ${MONTHS[selectedDate.getMonth()].toUpperCase()} ${day}` : 
                `${WEEKDAYS[selectedDate.getDay()].toUpperCase()}, ${MONTHS[selectedDate.getMonth()].toUpperCase()} ${day}`;
            
            renderBookings(day);
        }

        // Initialize
        renderCalendar();
        updateDispatchPanel();

    </script>
</body>
</html>