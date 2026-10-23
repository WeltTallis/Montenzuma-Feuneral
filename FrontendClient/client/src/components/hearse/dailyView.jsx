import React, { useMemo, useState } from 'react';

const Icon = ({ name, size = 18 }) => {
  const paths = {
    calendar: (
      <>
        <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
      </>
    ),
    'chevron-left': <path d="m15 18-6-6 6-6" />,
    'chevron-right': <path d="m9 18 6-6-6-6" />,
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    list: (
      <>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="3" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 15.5 21 17l-4 4-1.5-2a8 8 0 0 1-3.5 1l-.5 2h-5l-.5-2a8 8 0 0 1-3.5-2L1 17l3-3a8 8 0 0 1 0-4L1 7l4-4 2 2a8 8 0 0 1 4 0l2-2 4 4-2 2a8 8 0 0 1 0 4l2 2.5Z" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 8M18 15a6 6 0 0 1 4 6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
};

export default function HearseDailyView({
  bookings = [],
  fleet = [],
  drivers = [],
  selectedDate,
  onDateChange,
  onBookingClick,
  onBookingUpdate,
  onBookingDelete,
  onVehicleSelect,
  onDriverSelect,
  branchName = 'Operations',
  branchLocation = 'Main Branch',
}) {
  const [view, setView] = useState('schedule');
  const [activeDayIndex, setActiveDayIndex] = useState(2);
  const [query, setQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [notice, setNotice] = useState('');

  const today = new Date();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = useMemo(() => {
    const arr = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        label: dayLabels[d.getDay()],
        date: d.getDate(),
        isToday: i === 0,
      });
    }
    return arr;
  }, []);

  const activeDay = days[activeDayIndex] || days[2];

  const filteredBookings = useMemo(() => {
    const value = query.toLowerCase().trim();
    if (!value) return bookings;
    return bookings.filter((booking) =>
      [
        booking.client,
        booking.driver,
        booking.vehicle,
        booking.plate,
        booking.from,
        booking.dest,
      ]
        .join(' ')
        .toLowerCase()
        .includes(value),
    );
  }, [query, bookings]);

  const activeDayLabel = () => {
    const d = new Date(activeDay.key);
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const dayBookings = filteredBookings.filter((b) => {
    const bd = b.date || b.booking_date || b.created_at || b.start_time;
    if (!bd) return true;
    const bKey = String(bd).slice(0, 10);
    return bKey === activeDay.key;
  });

  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 2800);
  };

  const statusColor = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('confirm'))
      return { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' };
    if (s.includes('pending') || s.includes('assign'))
      return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
    if (s.includes('transit'))
      return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' };
    if (s.includes('mainten') || s.includes('out') || s.includes('disabled'))
      return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
    return { bg: '#E5E7EB', text: '#4B5563', border: '#D1D5DB' };
  };

  const avatarColor = (name) => {
    const colors = ['#1E3A8A', '#15803D', '#B45309', '#7C3AED', '#DB2777', '#0891B2'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="hdv">
      <style>{`
        .hdv{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#F8FAFC;color:#0F172A;min-height:100vh}
        .hdv *{box-sizing:border-box}
        .hdv .shell{display:flex;height:100vh;overflow:hidden}
        .hdv .rail{width:56px;flex-shrink:0;background:#FFF;border-right:1px solid #E2E8F0;display:flex;flex-direction:column;padding:16px 4px;position:sticky;top:0;z-index:10}
        .hdv .logo{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#2563EB 0%,#7C3AED 100%);color:#FFF;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;margin:0 auto 24px}
        .hdv nav{display:flex;flex-direction:column;gap:6px}
        .hdv nav button{width:40px;height:40px;border-radius:10px;border:none;background:transparent;color:#64748B;cursor:pointer;display:flex;align-items:center;justify-content:center;margin:0 auto;transition:all 0.2s}
        .hdv nav button.active{background:#EFF6FF;color:#2563EB}
        .hdv nav button:hover:not(.active){background:#F1F5F9;color:#0F172A}
        .hdv .rail-spacer{flex:1}
        .hdv .rail-bottom{margin-top:auto}
        .hdv .rail-settings,.hdv .avatar-button{width:40px;height:40px;border-radius:10px;border:none;background:transparent;color:#64748B;cursor:pointer;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;transition:all 0.2s}
        .hdv .rail-settings:hover{background:#F1F5F9}
        .hdv .avatar-button{background:#E2E8F0;color:#334155;font-weight:700;font-size:13px;border-radius:50%}
        .hdv .avatar-button:hover{background:#CBD5E1}
        .hdv .page{flex:1;display:flex;flex-direction:column;overflow:hidden}
        .hdv .topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:#FFF;border-bottom:1px solid #E2E8F0;flex-shrink:0}
        .hdv .branch{display:flex;align-items:center;gap:8px}
        .hdv .branch span{font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.05em}
        .hdv .branch strong{font-size:15px;font-weight:700;color:#0F172A}
        .hdv .topbar-actions{display:flex;align-items:center;gap:10px}
        .hdv .search{position:relative;display:flex;align-items:center}
        .hdv .search svg{position:absolute;left:10px;color:#94A3B8;width:16px;height:16px}
        .hdv .search input{padding:7px 10px 7px 32px;height:34px;border:1px solid #E2E8F0;border-radius:20px;font-size:13px;color:#0F172A;outline:none;width:240px;transition:all 0.2s}
        .hdv .search input:focus{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,0.1)}
        .hdv .btn-primary{display:flex;align-items:center;gap:7px;padding:7px 16px;height:34px;border:none;border-radius:10px;background:#0F172A;color:#FFF;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s}
        .hdv .btn-primary:hover{background:#1E293B}
        .hdv main{flex:1;overflow-y:auto;padding:20px 24px}
        .hdv .heading{margin-bottom:16px}
        .hdv .heading p{font-size:12px;color:#64748B;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em}
        .hdv .heading h1{font-size:20px;font-weight:700;margin:0 0 4px;color:#0F172A}
        .hdv .heading span{font-size:13px;color:#64748B}
        .hdv .view-switch{display:flex;gap:4px;margin-top:8px}
        .hdv .view-switch button{padding:6px 12px;border-radius:8px;border:1px solid #E2E8F0;background:#FFF;color:#64748B;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all 0.2s}
        .hdv .view-switch button.active{border-color:#2563EB;background:#EFF6FF;color:#2563EB}
        .hdv .view-switch button:hover:not(.active){border-color:#CBD5E1;background:#F8FAFC}
        .hdv .date-bar{display:flex;align-items:center;gap:10px;margin-bottom:20px}
        .hdv .date-arrow{width:34px;height:34px;border-radius:10px;border:1px solid #E2E8F0;background:#FFF;color:#334155;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0}
        .hdv .date-arrow:hover{border-color:#2563EB;color:#2563EB;background:#EFF6FF}
        .hdv .dates{display:flex;gap:8px;flex:1;overflow-x:auto;padding:2px 0}
        .hdv .dates button{min-width:56px;padding:8px 6px;border-radius:10px;border:none;background:transparent;color:#64748B;font-size:12px;font-weight:600;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all 0.2s;white-space:nowrap}
        .hdv .dates button:hover{background:#F1F5F9;color:#0F172A}
        .hdv .dates button.active{background:#2563EB;color:#FFF}
        .hdv .dates button.active span{color:#FFF}
        .hdv .dates button.active strong{color:#FFF}
        .hdv .dates button .today-tag{font-size:9px;font-weight:800;margin-top:1px;opacity:0.9}
        .hdv .dates button span{font-size:11px}
        .hdv .dates button strong{font-size:15px;font-weight:800}
        .hdv .schedule-layout{display:grid;grid-template-columns:1fr 300px;gap:20px}
        .hdv .list-panel{background:#FFF;border-radius:12px;border:1px solid #E2E8F0;display:flex;flex-direction:column;min-height:420px;overflow:hidden}
        .hdv .panel-title{padding:14px 18px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;background:#FAFAFA;border-radius:12px 12px 0 0}
        .hdv .panel-title > div{display:flex;flex-direction:column;gap:3px}
        .hdv .panel-title h2{font-size:14px;font-weight:700;margin:0;color:#0F172A}
        .hdv .panel-title p{font-size:12px;color:#64748B;margin:0}
        .hdv .panel-title .count{font-size:12px;font-weight:700;color:#2563EB}
        .hdv .panel-title .text-button{display:flex;align-items:center;gap:5px;padding:5px 10px;border:1px solid #E2E8F0;border-radius:8px;background:transparent;color:#64748B;font-size:12px;cursor:pointer;transition:all 0.2s}
        .hdv .panel-title .text-button:hover{border-color:#2563EB;color:#2563EB}
        .hdv .booking-columns{padding:10px 18px;display:flex;font-size:10px;font-weight:700;color:#94A3B8;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid #F8FAFC}
        .hdv .booking-columns span{flex:1}
        .hdv .booking-rows{display:flex;flex-direction:column;border-top:1px solid #F8FAFC}
        .hdv .booking-row{display:flex;align-items:center;padding:12px 18px;border:none;background:transparent;cursor:pointer;transition:all 0.15s;text-align:left;border-bottom:1px solid #F8FAFC}
        .hdv .booking-row:hover{background:#F8FAFC}
        .hdv .booking-row:last-child{border-bottom:none}
        .hdv .booking-row.empty{justify-content:center;color:#94A3B8;font-size:13px;cursor:default}
        .hdv .booking-time{display:flex;flex-direction:column;min-width:70px}
        .hdv .booking-time strong{font-size:13px;font-weight:700;color:#0F172A}
        .hdv .booking-time small{font-size:11px;color:#94A3B8}
        .hdv .booking-details{flex:1;min-width:0}
        .hdv .booking-details strong{font-size:13px;font-weight:600;color:#0F172A;display:block;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hdv .booking-details small{font-size:12px;color:#334155;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hdv .booking-details em{font-size:11px;color:#64748B;font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hdv .booking-assignment{min-width:130px}
        .hdv .booking-assignment strong{font-size:13px;font-weight:600;color:#0F172A;display:block;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hdv .booking-assignment small{font-size:11px;color:#94A3B8;margin-bottom:2px}
        .hdv .booking-assignment em{font-size:11px;color:#64748B;font-style:normal}
        .hdv .status{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;min-width:70px;text-align:center;white-space:nowrap}
        .hdv .status i{width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block}
        .hdv .fleet-list-panel{background:#FFF;border-radius:12px;border:1px solid #E2E8F0;display:flex;flex-direction:column;min-height:420px;overflow:hidden}
        .hdv .fleet-rows{display:flex;flex-direction:column;padding:14px 18px;flex:1;overflow-y:auto}
        .hdv .fleet-row{display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;border:1px solid transparent;background:transparent;cursor:pointer;transition:all 0.15s;margin-bottom:6px}
        .hdv .fleet-row:hover{background:#F8FAFC;border-color:#E2E8F0}
        .hdv .fleet-row.selected{background:#EFF6FF;border-color:#2563EB}
        .hdv .fleet-status{width:9px;height:9px;border-radius:50%;background:#10B981;flex-shrink:0}
        .hdv .fleet-row > span:nth-child(2){min-width:0;flex:1}
        .hdv .fleet-row strong{font-size:13px;font-weight:600;color:#0F172A;display:block}
        .hdv .fleet-row small{font-size:11px;color:#64748B}
        .hdv .fleet-row em{font-size:11px;color:#94A3B8;font-style:normal;margin-left:auto}
        .hdv .fleet-action{width:100%;padding:10px;margin:0 18px 18px;border:1px solid #E2E8F0;border-radius:8px;background:#FFF;color:#2563EB;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s}
        .hdv .fleet-action:hover{background:#EFF6FF;border-color:#2563EB}
        .hdv .lineup-panel{background:#FFF;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden}
        .hdv .lineup-title{padding:14px 18px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;background:#FAFAFA;border-radius:12px 12px 0 0}
        .hdv .lineup-title > div{display:flex;flex-direction:column;gap:3px}
        .hdv .updated{font-size:11px;color:#64748B;font-weight:500}
        .hdv .standby-row{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #E2E8F0;background:#FEF3C7}
        .hdv .standby-accent{width:3px;flex-shrink:0;background:#F59E0B;border-radius:0 4px 4px 0}
        .hdv .driver-avatar.standby{width:32px;height:32px;border-radius:50%;background:#F59E0B;color:#FFF;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0}
        .hdv .standby-row .driver-name{flex:1;min-width:0}
        .hdv .standby-row .driver-name em{font-size:11px;color:#92400E;font-style:normal;font-weight:600;display:block;margin-bottom:2px}
        .hdv .standby-row .driver-name strong{font-size:14px;font-weight:700;color:#0F172A;display:block}
        .hdv .standby-row .driver-name small{font-size:11px;color:#64748B}
        .hdv .standby-copy{min-width:140px}
        .hdv .standby-copy strong{font-size:12px;font-weight:700;color:#0F172A;display:block}
        .hdv .standby-copy small{font-size:11px;color:#64748B}
        .hdv .assistant-cell{min-width:120px;text-align:right}
        .hdv .assistant-cell small{font-size:11px;color:#64748B;display:block;margin-bottom:2px}
        .hdv .assistant-cell strong{font-size:12px;font-weight:700;color:#0F172A}
        .hdv .assistant-button{display:flex;align-items:center;gap:5px;padding:5px 10px;border:1px solid #E2E8F0;border-radius:8px;background:#FFF;color:#334155;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.2s;margin-left:auto}
        .hdv .assistant-button:hover{border-color:#2563EB;color:#2563EB}
        .hdv .assistant-button.standby-button{background:#FEF3C7;border-color:#F59E0B;color:#92400E}
        .hdv .driver-columns{display:flex;padding:10px 18px;font-size:10px;font-weight:700;color:#94A3B8;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid #F8FAFC}
        .hdv .driver-columns span{flex:1}
        .hdv .driver-columns span:last-child{flex:0}
        .hdv .driver-rows{display:flex;flex-direction:column;border-top:1px solid #F8FAFC}
        .hdv .driver-row{display:flex;align-items:center;padding:12px 18px;border-bottom:1px solid #F8FAFC;background:transparent}
        .hdv .driver-row:last-child{border-bottom:none}
        .hdv .driver-profile{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
        .hdv .driver-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#FFF;font-weight:800;font-size:13px;flex-shrink:0}
        .hdv .driver-name{min-width:0}
        .hdv .driver-name strong{font-size:13px;font-weight:600;color:#0F172A;display:block}
        .hdv .driver-name small{font-size:11px;color:#64748B}
        .hdv .driver-name em{font-size:11px;color:#94A3B8;font-style:normal}
        .hdv .driver-booking,.hdv .driver-vehicle{min-width:130px}
        .hdv .driver-booking strong,.hdv .driver-vehicle strong{font-size:13px;font-weight:600;color:#0F172A;display:block}
        .hdv .driver-booking small,.hdv .driver-vehicle small{font-size:11px;color:#64748B}
        .hdv .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:8px 16px;border-radius:8px;background:#0F172A;color:#FFF;font-size:13px;font-weight:500;z-index:50;box-shadow:0 10px 15px -3px rgba(0,0,0,0.2);animation:slideUp 0.3s ease}
        @keyframes slideUp{from{transform:translate(-50%,20px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
        @media (max-width:900px){.hdv .schedule-layout{grid-template-columns:1fr}.hdv .topbar{padding:14px 16px}.hdv main{padding:16px 16px}}
        @media (max-width:640px){.hdv .rail{display:none}.hdv .search input{width:140px}.hdv .date-bar{flex-direction:column;align-items:stretch;gap:12px}.hdv .dates{overflow-x:auto}}
      `}</style>

      <div className="shell">
        <aside className="rail">
          <div className="logo">P</div>
          <nav aria-label="Primary">
            <button
              className={view === 'schedule' ? 'active' : ''}
              onClick={() => setView('schedule')}
              aria-label="Booking schedule"
            >
              <Icon name="list" />
            </button>
            <button
              className={view === 'lineup' ? 'active' : ''}
              onClick={() => setView('lineup')}
              aria-label="Driver lineup"
            >
              <Icon name="users" />
            </button>
            <button aria-label="Calendar">
              <Icon name="calendar" />
            </button>
          </nav>
          <div className="rail-spacer" />
          <div className="rail-bottom">
            <button className="rail-settings" aria-label="Settings">
              <Icon name="settings" />
            </button>
            <button className="avatar-button" aria-label="Profile">
              {getInitials(branchName)}
            </button>
          </div>
        </aside>

        <div className="page">
          <header className="topbar">
            <div className="branch">
              <span>{branchLocation}</span>
              <strong>{branchName}</strong>
            </div>
            <div className="topbar-actions">
              <label className="search">
                <Icon name="search" size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search bookings"
                />
              </label>
              <button
                className="btn-primary"
                onClick={() => flash('New booking draft opened')}
              >
                <Icon name="plus" size={16} />
                New booking
              </button>
            </div>
          </header>

          <main>
            <section className="heading">
              <div>
                <p>{activeDayLabel()}</p>
                <h1>
                  {view === 'schedule' ? 'Booking schedule' : 'Driver lineup'}
                </h1>
                <span>
                  {view === 'schedule'
                    ? "Today's services and available fleet."
                    : 'Every driver, assigned booking, vehicle and assistant.'}
                </span>
              </div>
              <div className="view-switch" aria-label="Choose view">
                <button
                  className={view === 'schedule' ? 'active' : ''}
                  onClick={() => setView('schedule')}
                >
                  <Icon name="list" size={15} />
                  Schedule
                </button>
                <button
                  className={view === 'lineup' ? 'active' : ''}
                  onClick={() => setView('lineup')}
                >
                  <Icon name="users" size={15} />
                  Driver lineup
                </button>
              </div>
            </section>

            <section className="date-bar">
              <button
                className="date-arrow"
                onClick={() => setActiveDayIndex((p) => Math.max(0, p - 1))}
                aria-label="Previous day"
              >
                <Icon name="chevron-left" size={17} />
              </button>
              <div className="dates">
                {days.map((item, index) => (
                  <button
                    key={item.key}
                    className={activeDayIndex === index ? 'active' : ''}
                    onClick={() => setActiveDayIndex(index)}
                  >
                    <span>{item.label}</span>
                    <strong>{item.date}</strong>
                    {item.isToday && <span className="today-tag">Today</span>}
                  </button>
                ))}
              </div>
              <button
                className="date-arrow"
                onClick={() =>
                  setActiveDayIndex((p) => Math.min(days.length - 1, p + 1))
                }
                aria-label="Next day"
              >
                <Icon name="chevron-right" size={17} />
              </button>
            </section>

            {view === 'schedule' ? (
              <div className="schedule-layout">
                <section className="list-panel">
                  <div className="panel-title">
                    <div>
                      <h2>Services</h2>
                      <p>{dayBookings.length} bookings today</p>
                    </div>
                    <button className="text-button">
                      <Icon name="filter" size={15} />
                      Filter
                    </button>
                  </div>
                  <div className="booking-columns">
                    <span>Time</span>
                    <span>Booking</span>
                    <span>Vehicle &amp; driver</span>
                    <span>Status</span>
                  </div>
                  <div className="booking-rows">
                    {dayBookings.length > 0 ? (
                      dayBookings.map((booking) => {
                        const meta = statusColor(booking.status);
                        return (
                          <button
                            className="booking-row"
                            key={
                              booking.id ||
                              `${booking.time}-${booking.client}`
                            }
                            onClick={() =>
                              onBookingClick
                                ? onBookingClick(booking)
                                : flash(`${booking.client} booking opened`)
                            }
                          >
                            <span className="booking-time">
                              <strong>{booking.time || '—'}</strong>
                              <small>{booking.end || ''}</small>
                            </span>
                            <span className="booking-details">
                              <strong>{booking.client || '—'}</strong>
                              <small>{booking.service || '—'}</small>
                              <em>
                                {(booking.from || '—')} →
                                {(booking.dest || '—')}
                              </em>
                            </span>
                            <span className="booking-assignment">
                              <strong>{booking.vehicle || '—'}</strong>
                              <small>{booking.plate || '—'}</small>
                              <em>{booking.driver || '—'}</em>
                            </span>
                            <span className="status" style={meta}>
                              <i />
                              {booking.status || '—'}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <button className="booking-row empty" disabled>
                        No bookings scheduled for this day
                      </button>
                    )}
                  </div>
                </section>

                <aside className="fleet-list-panel">
                  <div className="panel-title">
                    <div>
                      <h2>Available hearses</h2>
                      <p>For {activeDayLabel()}</p>
                    </div>
                    <span className="count">{fleet.length} free</span>
                  </div>
                  <div className="fleet-rows">
                    {fleet.length > 0 ? (
                      fleet.map((vehicle) => (
                        <button
                          key={vehicle.plate || vehicle.id}
                          className={
                            selectedVehicle ===
                            (vehicle.plate || vehicle.id)
                              ? 'fleet-row selected'
                              : 'fleet-row'
                          }
                          onClick={() => {
                            setSelectedVehicle(
                              vehicle.plate || vehicle.id,
                            );
                            if (onVehicleSelect) onVehicleSelect(vehicle);
                            else
                              flash(
                                `${vehicle.name || 'Vehicle'} selected`,
                              );
                          }}
                        >
                          <span className="fleet-status" />
                          <span>
                            <strong>{vehicle.name || '—'}</strong>
                            <small>
                              {(vehicle.plate || '—')} ·
                              {(vehicle.seats || '—')}
                            </small>
                          </span>
                          <em>{vehicle.availability || '—'}</em>
                          <Icon name="chevron-right" size={15} />
                        </button>
                      ))
                    ) : (
                      <div className="booking-row empty">
                        No vehicles available
                      </div>
                    )}
                  </div>
                  <button className="fleet-action">
                    View complete fleet
                  </button>
                </aside>
              </div>
            ) : (
              <section className="lineup-panel">
                <div className="panel-title lineup-title">
                  <div>
                    <h2>{activeDayLabel()} driver lineup</h2>
                    <p>
                      {drivers.length} assigned driver · 1 standby
                    </p>
                  </div>
                  <span className="updated">Live</span>
                </div>

                <div className="standby-row">
                  <span className="standby-accent" />
                  <span className="driver-avatar standby">DW</span>
                  <span className="driver-name">
                    <em>Standby driver · Free now</em>
                    <strong>Standby Driver</strong>
                    <small>Shift 08:00–16:30</small>
                  </span>
                  <span className="standby-copy">
                    <strong>Ready for assignment</strong>
                    <small>No booking or vehicle assigned</small>
                  </span>
                  <span className="assistant-cell">
                    <small>Assistant</small>
                    <strong>None</strong>
                  </span>
                  <button
                    className="assistant-button standby-button"
                    onClick={() => flash('Assistant assigned')}
                  >
                    <Icon name="plus" size={15} />
                    Add assistant
                  </button>
                </div>

                <div className="driver-columns">
                  <span>Driver</span>
                  <span>Assigned booking</span>
                  <span>Vehicle</span>
                  <span>Assistant</span>
                  <span />
                </div>
                <div className="driver-rows">
                  {drivers.length > 0 ? (
                    drivers.map((driver) => {
                      const color = avatarColor(driver.name || 'Driver');
                      return (
                        <article
                          className="driver-row"
                          key={driver.name || driver.id}
                        >
                          <div className="driver-profile">
                            <span
                              className="driver-avatar"
                              style={{ background: color }}
                            >
                              {getInitials(driver.name || 'Driver')}
                            </span>
                            <span className="driver-name">
                              <strong>{driver.name || '—'}</strong>
                              <small>{driver.shift || '—'}</small>
                              <em>{driver.status || '—'}</em>
                            </span>
                          </div>
                          <div className="driver-booking">
                            <strong>{driver.family || '—'}</strong>
                            <small>{driver.time || '—'}</small>
                          </div>
                          <div className="driver-vehicle">
                            <strong>{driver.vehicle || '—'}</strong>
                            <small>{driver.plate || '—'}</small>
                          </div>
                          <div className="assistant-cell">
                            <strong>Not assigned</strong>
                            <small>No assistant</small>
                          </div>
                          <button
                            className="assistant-button"
                            onClick={() => flash('Assistant added')}
                          >
                            <Icon name="plus" size={15} />
                            Add assistant
                          </button>
                        </article>
                      );
                    })
                  ) : (
                    <div className="booking-row empty">
                      No drivers scheduled
                    </div>
                  )}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {notice && (
        <div className="toast">{notice}</div>
      )}
    </div>
  );
}
