/**
 * Leave Dashboard — Redesigned with elegant "official document" aesthetic.
 * Retains the existing Nexus OS color palette from leaveTheme.js.
 * Features: sidebar nav, stat cards, team calendar, leave application form,
 * team directory with detail panel, pending requests with approve/reject.
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { COLORS, LEAVE_TYPES, leaveTypeLabel, typeStyle, statusLabel, statusStyle, MONTH_NAMES, DAY_NAMES, toDateStr, formatDate, countBusinessDays } from './leaveTheme';

// Sample data for demonstration
const EMPLOYEES = [
  { id: 'e1', name: 'Sarah Mitchell', role: 'Senior Designer', department: 'Product', avatar: 'SM', email: 's.mitchell@corp.com', totalLeave: 26, usedLeave: 8, pendingLeave: 3, leaveHistory: [
    { id: 'l1', employeeId: 'e1', type: 'annual', startDate: '2026-01-15', endDate: '2026-01-17', days: 3, reason: 'Family vacation', status: 'approved', appliedOn: '2026-01-08', approvedBy: 'James Park' },
    { id: 'l2', employeeId: 'e1', type: 'sick', startDate: '2026-03-04', endDate: '2026-03-05', days: 2, reason: 'Flu recovery', status: 'approved', appliedOn: '2026-03-04', approvedBy: 'James Park' },
    { id: 'l3', employeeId: 'e1', type: 'annual', startDate: '2026-07-21', endDate: '2026-07-23', days: 3, reason: 'Summer holiday', status: 'approved', appliedOn: '2026-07-01', approvedBy: 'James Park' },
    { id: 'l4', employeeId: 'e1', type: 'annual', startDate: '2026-09-10', endDate: '2026-09-12', days: 3, reason: 'Personal time', status: 'pending', appliedOn: '2026-08-28' },
  ]},
  { id: 'e2', name: 'James Park', role: 'Engineering Manager', department: 'Engineering', avatar: 'JP', email: 'j.park@corp.com', totalLeave: 26, usedLeave: 12, pendingLeave: 0, leaveHistory: [
    { id: 'l5', employeeId: 'e2', type: 'annual', startDate: '2026-02-10', endDate: '2026-02-14', days: 5, reason: 'Winter break', status: 'approved', appliedOn: '2026-01-20', approvedBy: 'CEO' },
    { id: 'l6', employeeId: 'e2', type: 'study', startDate: '2026-04-07', endDate: '2026-04-09', days: 3, reason: 'AWS certification', status: 'approved', appliedOn: '2026-03-25', approvedBy: 'CEO' },
    { id: 'l7', employeeId: 'e2', type: 'annual', startDate: '2026-08-03', endDate: '2026-08-06', days: 4, reason: 'Family trip', status: 'approved', appliedOn: '2026-07-15', approvedBy: 'CEO' },
  ]},
  { id: 'e3', name: 'Amara Osei', role: 'Product Manager', department: 'Product', avatar: 'AO', email: 'a.osei@corp.com', totalLeave: 26, usedLeave: 5, pendingLeave: 5, leaveHistory: [
    { id: 'l8', employeeId: 'e3', type: 'maternity', startDate: '2026-10-01', endDate: '2026-10-31', days: 5, reason: 'Maternity leave (partial)', status: 'approved', appliedOn: '2026-08-01', approvedBy: 'James Park' },
    { id: 'l9', employeeId: 'e3', type: 'annual', startDate: '2026-09-15', endDate: '2026-09-19', days: 5, reason: 'Pre-maternity break', status: 'pending', appliedOn: '2026-08-25' },
  ]},
  { id: 'e4', name: 'Liam Torres', role: 'Backend Engineer', department: 'Engineering', avatar: 'LT', email: 'l.torres@corp.com', totalLeave: 26, usedLeave: 18, pendingLeave: 2, leaveHistory: [
    { id: 'l10', employeeId: 'e4', type: 'annual', startDate: '2026-01-02', endDate: '2026-01-10', days: 7, reason: 'New year break', status: 'approved', appliedOn: '2025-12-20', approvedBy: 'James Park' },
    { id: 'l11', employeeId: 'e4', type: 'sick', startDate: '2026-05-12', endDate: '2026-05-14', days: 3, reason: 'Surgery recovery', status: 'approved', appliedOn: '2026-05-11', approvedBy: 'James Park', document: 'medical_cert.pdf' },
    { id: 'l12', employeeId: 'e4', type: 'annual', startDate: '2026-06-22', endDate: '2026-06-26', days: 5, reason: 'Summer vacation', status: 'approved', appliedOn: '2026-06-01', approvedBy: 'James Park' },
    { id: 'l13', employeeId: 'e4', type: 'unpaid', startDate: '2026-09-05', endDate: '2026-09-06', days: 2, reason: 'Family emergency', status: 'pending', appliedOn: '2026-09-01' },
  ]},
  { id: 'e5', name: 'Nadia Cheung', role: 'QA Lead', department: 'Engineering', avatar: 'NC', email: 'n.cheung@corp.com', totalLeave: 26, usedLeave: 4, pendingLeave: 0, leaveHistory: [
    { id: 'l14', employeeId: 'e5', type: 'annual', startDate: '2026-03-20', endDate: '2026-03-23', days: 2, reason: 'Easter break', status: 'approved', appliedOn: '2026-03-10', approvedBy: 'James Park' },
    { id: 'l15', employeeId: 'e5', type: 'study', startDate: '2026-07-14', endDate: '2026-07-15', days: 2, reason: 'Testing conference', status: 'approved', appliedOn: '2026-07-01', approvedBy: 'James Park' },
  ]},
  { id: 'e6', name: 'Omar Al-Rashid', role: 'Data Scientist', department: 'Analytics', avatar: 'OA', email: 'o.alrashid@corp.com', totalLeave: 26, usedLeave: 9, pendingLeave: 4, leaveHistory: [
    { id: 'l16', employeeId: 'e6', type: 'annual', startDate: '2026-04-14', endDate: '2026-04-17', days: 4, reason: 'Eid celebration', status: 'approved', appliedOn: '2026-04-01', approvedBy: 'James Park' },
    { id: 'l17', employeeId: 'e6', type: 'study', startDate: '2026-08-18', endDate: '2026-08-19', days: 2, reason: 'ML conference', status: 'approved', appliedOn: '2026-08-05', approvedBy: 'James Park' },
    { id: 'l18', employeeId: 'e6', type: 'annual', startDate: '2026-09-22', endDate: '2026-09-25', days: 4, reason: 'Family visit', status: 'pending', appliedOn: '2026-08-30' },
  ]},
  { id: 'e7', name: 'Priya Sharma', role: 'HR Manager', department: 'People Ops', avatar: 'PS', email: 'p.sharma@corp.com', totalLeave: 26, usedLeave: 6, pendingLeave: 0, leaveHistory: [
    { id: 'l19', employeeId: 'e7', type: 'annual', startDate: '2026-05-25', endDate: '2026-05-29', days: 5, reason: 'Holiday', status: 'approved', appliedOn: '2026-05-10', approvedBy: 'CEO' },
    { id: 'l20', employeeId: 'e7', type: 'sick', startDate: '2026-08-11', endDate: '2026-08-11', days: 1, reason: 'Medical appointment', status: 'approved', appliedOn: '2026-08-11', approvedBy: 'CEO' },
  ]},
  { id: 'e8', name: 'Felix Brandt', role: 'DevOps Engineer', department: 'Infrastructure', avatar: 'FB', email: 'f.brandt@corp.com', totalLeave: 26, usedLeave: 14, pendingLeave: 0, leaveHistory: [
    { id: 'l21', employeeId: 'e8', type: 'annual', startDate: '2026-07-06', endDate: '2026-07-17', days: 10, reason: 'Extended summer holiday', status: 'approved', appliedOn: '2026-06-01', approvedBy: 'James Park' },
    { id: 'l22', employeeId: 'e8', type: 'unpaid', startDate: '2026-05-07', endDate: '2026-05-08', days: 2, reason: 'Pipe burst at home', status: 'approved', appliedOn: '2026-05-07', approvedBy: 'James Park' },
    { id: 'l23', employeeId: 'e8', type: 'sick', startDate: '2026-08-24', endDate: '2026-08-25', days: 2, reason: 'Back pain', status: 'approved', appliedOn: '2026-08-24', approvedBy: 'James Park' },
  ]},
];

const ALL_LEAVE_RECORDS = EMPLOYEES.flatMap(e => e.leaveHistory);
const PENDING_REQUESTS = ALL_LEAVE_RECORDS.filter(r => r.status === 'pending');
const CURRENT_USER = EMPLOYEES[0];

// Helpers
function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
function dateInRange(dateStr, start, end) { const d = new Date(dateStr).getTime(); return d >= new Date(start).getTime() && d <= new Date(end).getTime(); }

function Avatar({ initials, size = 'md' }) {
  const colors = ['bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700'];
  const colorIdx = initials.charCodeAt(0) % colors.length;
  const sizeClass = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }[size];
  return <div className={`${sizeClass} ${colors[colorIdx]} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>{initials}</div>;
}

function LeaveBadge({ type }) {
  const s = typeStyle(type);
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: s.bg, color: s.fg }}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fg }} />
      {leaveTypeLabel(type)}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = statusStyle(status);
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize" style={{ backgroundColor: s.bg, color: s.fg }}>
      {statusLabel(status)}
    </span>
  );
}

function LeaveBar({ used, pending, total }) {
  const usedPct = (used / total) * 100;
  const pendingPct = (pending / total) * 100;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.border }}>
      <div className="h-full flex">
        <div className="h-full" style={{ width: `${usedPct}%`, backgroundColor: COLORS.success }} />
        <div className="h-full" style={{ width: `${pendingPct}%`, backgroundColor: COLORS.warning }} />
      </div>
    </div>
  );
}

function CalendarView({ records, compact = false, selectable = false, onRangeSelect }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const pad = Array.from({ length: firstDay });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const toDateStrLocal = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  function getRecordsForDay(day) {
    const ds = toDateStrLocal(day);
    return records.filter(r => dateInRange(ds, r.startDate, r.endDate) && r.status !== 'cancelled');
  }

  function isInDragRange(day) {
    if (!dragStart || !dragEnd) return false;
    const ds = toDateStrLocal(day);
    const a = dragStart < dragStart ? dragStart : dragEnd;
    const b = dragStart < dragEnd ? dragEnd : dragStart;
    return ds >= a && ds <= b;
  }

  function handleMouseDown(day) {
    if (!selectable) return;
    const ds = toDateStrLocal(day);
    setDragStart(ds);
    setDragEnd(ds);
    setIsDragging(true);
  }

  function handleMouseEnter(day) {
    if (!isDragging || !selectable) return;
    setDragEnd(toDateStrLocal(day));
  }

  function handleMouseUp(day) {
    if (!selectable || !dragStart) return;
    const end = toDateStrLocal(day);
    setIsDragging(false);
    const a = dragStart < end ? dragStart : end;
    const b = dragStart < end ? end : dragStart;
    onRangeSelect?.(a, b);
    setDragStart(null);
    setDragEnd(null);
  }

  const cellH = compact ? 'h-14' : 'h-24';
  const todayStr = toDateStr(today);

  return (
    <div className="select-none" onMouseLeave={() => { if (isDragging) setIsDragging(false); }}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
          &larr;
        </button>
        <span className="font-serif text-lg" style={{ color: COLORS.text }}>{MONTH_NAMES[month]} {year}</span>
        <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
          &rarr;
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => <div key={d} className="text-center text-xs font-medium py-1" style={{ color: COLORS.textSecondary }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-px gap-px rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.border, border: `1px solid ${COLORS.border}` }}>
        {pad.map((_, i) => <div key={`p${i}`} className="bg-white" />)}
        {days.map(day => {
          const ds = toDateStrLocal(day);
          const dayRecords = getRecordsForDay(day);
          const isToday = ds === todayStr;
          const inRange = isInDragRange(day);
          const isWeekend = ((firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6);
          return (
            <div key={day} onMouseDown={() => handleMouseDown(day)} onMouseEnter={() => handleMouseEnter(day)} onMouseUp={() => handleMouseUp(day)}
              className={`bg-white ${cellH} p-1 overflow-hidden transition-colors ${selectable ? 'cursor-pointer' : ''} ${isWeekend ? 'bg-gray-50' : ''}`}
              style={{ backgroundColor: inRange ? 'rgba(10, 36, 99, 0.06)' : undefined }}>
              <div className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1"
                style={{ backgroundColor: isToday ? COLORS.primary : 'transparent', color: isToday ? '#fff' : COLORS.text }}>
                {day}
              </div>
              {!compact && dayRecords.slice(0, 2).map(r => {
                const c = typeStyle(r.type);
                const emp = EMPLOYEES.find(e => e.id === r.employeeId);
                return (
                  <div key={r.id} className="text-xs px-1 py-0.5 rounded mb-0.5 truncate leading-tight" style={{ backgroundColor: c.bg, color: c.fg }}>
                    {emp?.name.split(' ')[0]} &middot; {leaveTypeLabel(r.type)}
                  </div>
                );
              })}
              {!compact && dayRecords.length > 2 && <div className="text-xs px-1" style={{ color: COLORS.textSecondary }}>+{dayRecords.length - 2} more</div>}
              {compact && dayRecords.length > 0 && (
                <div className="flex gap-0.5 flex-wrap">
                  {dayRecords.slice(0, 3).map(r => <span key={r.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: typeStyle(r.type).fg }} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selectable && <p className="text-xs mt-3 text-center" style={{ color: COLORS.textSecondary }}>Click and drag to select your leave dates</p>}
    </div>
  );
}

function DashboardView({ onNavigate }) {
  const totalEmployees = EMPLOYEES.length;
  const onLeaveToday = ALL_LEAVE_RECORDS.filter(r => { const today = '2026-09-01'; return r.status === 'approved' && dateInRange(today, r.startDate, r.endDate); }).length;

  const stats = [
    { label: 'Total Employees', value: totalEmployees, sub: 'Active headcount', icon: '👥' },
    { label: 'On Leave Today', value: onLeaveToday, sub: 'Sep 1, 2026', icon: '🏖️' },
    { label: 'Pending Requests', value: PENDING_REQUESTS.length, sub: 'Awaiting approval', icon: '⏳' },
    { label: 'Avg. Leave Used', value: '9.5', sub: 'Days per employee', icon: '📊' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow" style={{ border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: COLORS.textSecondary }}>{s.label}</p>
                <p className="font-serif text-3xl" style={{ color: COLORS.text }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>{s.sub}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm" style={{ border: `1px solid ${COLORS.border}` }}>
          <h3 className="font-serif text-lg mb-4" style={{ color: COLORS.text }}>Team Calendar Overview</h3>
          <CalendarView records={ALL_LEAVE_RECORDS} compact={false} />
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: `1px solid ${COLORS.border}` }}>
            <h3 className="font-medium text-sm mb-3" style={{ color: COLORS.text }}>Leave Types</h3>
            {LEAVE_TYPES.filter(t => ['annual', 'sick', 'maternity', 'study', 'unpaid'].includes(t)).map(type => (
              <div key={type} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: COLORS.border }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: typeStyle(type).fg }} />
                  <span className="text-sm" style={{ color: COLORS.text }}>{leaveTypeLabel(type)}</span>
                </div>
                <span className="text-xs font-mono" style={{ color: COLORS.textSecondary }}>
                  {ALL_LEAVE_RECORDS.filter(r => r.type === type && r.status === 'approved').reduce((a, r) => a + r.days, 0)}d
                </span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm" style={{ color: COLORS.text }}>Pending Approval</h3>
              <button onClick={() => onNavigate('requests')} className="text-xs hover:underline" style={{ color: COLORS.info }}>View all</button>
            </div>
            <div className="space-y-2">
              {PENDING_REQUESTS.slice(0, 4).map(r => {
                const emp = EMPLOYEES.find(e => e.id === r.employeeId);
                return (
                  <div key={r.id} className="flex items-center gap-2 py-2 border-b last:border-0" style={{ borderColor: COLORS.border }}>
                    <Avatar initials={emp?.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: COLORS.text }}>{emp?.name.split(' ')[0]}</p>
                      <p className="text-xs" style={{ color: COLORS.textSecondary }}>{r.days}d &middot; {leaveTypeLabel(r.type)}</p>
                    </div>
                    <StatusBadge status="pending" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamView() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const depts = ['All', ...Array.from(new Set(EMPLOYEES.map(e => e.department)))];
  const filtered = EMPLOYEES.filter(e => (deptFilter === 'All' || e.department === deptFilter) && e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex gap-4 h-full">
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..."
          className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 bg-white"
          style={{ border: `1px solid ${COLORS.border}`, '--tw-ring-color': COLORS.info }} />
        <div className="flex gap-1.5 flex-wrap">
          {depts.map(d => (
            <button key={d} onClick={() => setDeptFilter(d)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{ backgroundColor: deptFilter === d ? COLORS.primary : '#fff', color: deptFilter === d ? '#fff' : COLORS.text, border: `1px solid ${deptFilter === d ? COLORS.primary : COLORS.border}` }}>
              {d}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filtered.map(emp => {
            const remaining = emp.totalLeave - emp.usedLeave - emp.pendingLeave;
            const isSelected = selected?.id === emp.id;
            return (
              <button key={emp.id} onClick={() => setSelected(emp)}
                className="w-full text-left p-3 rounded-xl transition-all"
                style={{ backgroundColor: isSelected ? 'rgba(10, 36, 99, 0.06)' : '#fff', border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}` }}>
                <div className="flex items-center gap-2.5">
                  <Avatar initials={emp.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: COLORS.text }}>{emp.name}</p>
                    <p className="text-xs truncate" style={{ color: COLORS.textSecondary }}>{emp.role}</p>
                  </div>
                  <span className="text-xs font-mono font-semibold" style={{ color: remaining < 5 ? COLORS.danger : COLORS.success }}>{remaining}d</span>
                </div>
                <div className="mt-2"><LeaveBar used={emp.usedLeave} pending={emp.pendingLeave} total={emp.totalLeave} /></div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {selected ? <EmployeeDetail employee={selected} /> : (
          <div className="h-full flex items-center justify-center" style={{ color: COLORS.textSecondary }}>
            <div className="text-center"><div className="text-4xl mb-3">👈</div><p className="text-sm">Select an employee to view their leave details</p></div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmployeeDetail({ employee: emp }) {
  const remaining = emp.totalLeave - emp.usedLeave - emp.pendingLeave;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center gap-4">
          <Avatar initials={emp.avatar} size="lg" />
          <div>
            <h2 className="font-serif text-2xl" style={{ color: COLORS.text }}>{emp.name}</h2>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>{emp.role} &middot; {emp.department}</p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>{emp.email}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-3">
          {[
            { label: 'Total Entitlement', value: emp.totalLeave, color: COLORS.text },
            { label: 'Used', value: emp.usedLeave, color: COLORS.success },
            { label: 'Pending', value: emp.pendingLeave, color: COLORS.warning },
            { label: 'Remaining', value: remaining, color: remaining < 5 ? COLORS.danger : COLORS.success },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: COLORS.bg }}>
              <p className="font-serif text-2xl" style={{ color: item.color }}>{item.value}</p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1"><span style={{ color: COLORS.textSecondary }}>Leave usage</span><span style={{ color: COLORS.textSecondary }}>{Math.round((emp.usedLeave / emp.totalLeave) * 100)}% used</span></div>
          <LeaveBar used={emp.usedLeave} pending={emp.pendingLeave} total={emp.totalLeave} />
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: `1px solid ${COLORS.border}` }}>
        <h3 className="font-medium text-sm mb-4" style={{ color: COLORS.text }}>Leave Calendar</h3>
        <CalendarView records={emp.leaveHistory} compact />
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: `1px solid ${COLORS.border}` }}>
        <h3 className="font-medium text-sm mb-4" style={{ color: COLORS.text }}>Leave History</h3>
        <table className="w-full">
          <thead><tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            {['Type', 'Period', 'Days', 'Status', 'Applied', 'Approved By'].map(h => <th key={h} className="text-left text-xs font-medium pb-2 pr-3" style={{ color: COLORS.textSecondary }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {emp.leaveHistory.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td className="py-2.5 pr-3"><LeaveBadge type={r.type} /></td>
                <td className="py-2.5 pr-3 text-xs" style={{ color: COLORS.text }}>{formatDate(r.startDate)} &ndash; {formatDate(r.endDate)}</td>
                <td className="py-2.5 pr-3 text-xs font-mono" style={{ color: COLORS.text }}>{r.days}d</td>
                <td className="py-2.5 pr-3"><StatusBadge status={r.status} /></td>
                <td className="py-2.5 pr-3 text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(r.appliedOn)}</td>
                <td className="py-2.5 text-xs" style={{ color: COLORS.textSecondary }}>{r.approvedBy || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MyLeaveView() {
  const [showForm, setShowForm] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [form, setForm] = useState({ type: 'annual', reason: '', document: '' });
  const [submitted, setSubmitted] = useState(false);
  const emp = CURRENT_USER;
  const remaining = emp.totalLeave - emp.usedLeave - emp.pendingLeave;

  function handleRangeSelect(start, end) { setSelectedRange({ start, end }); setShowForm(true); setSubmitted(false); }
  const businessDays = selectedRange ? countBusinessDays(selectedRange.start, selectedRange.end) : 0;
  function handleSubmit() { setSubmitted(true); setTimeout(() => { setShowForm(false); setSelectedRange(null); setSubmitted(false); setForm({ type: 'annual', reason: '', document: '' }); }, 2000); }

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 space-y-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg" style={{ color: COLORS.text }}>My Leave Calendar</h3>
            <button onClick={() => { setShowForm(true); setSelectedRange(null); }}
              className="text-white text-sm px-4 py-2 rounded-xl transition-colors hover:opacity-90"
              style={{ backgroundColor: COLORS.primary }}>+ Apply for Leave</button>
          </div>
          <CalendarView records={emp.leaveHistory} selectable onRangeSelect={handleRangeSelect} />
        </div>
        {showForm && (
          <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: `1px solid ${COLORS.info}` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: COLORS.text }}>Leave Application</h3>
              <button onClick={() => setShowForm(false)} style={{ color: COLORS.textSecondary }}>✕</button>
            </div>
            {submitted ? (
              <div className="text-center py-8"><div className="text-4xl mb-2">✅</div><p className="font-medium" style={{ color: COLORS.success }}>Application submitted!</p><p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>Your manager will review it shortly.</p></div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>Date Range</label>
                  {selectedRange ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'rgba(10, 36, 99, 0.06)', border: `1px solid ${COLORS.primary}` }}>
                      <span className="text-sm font-medium" style={{ color: COLORS.primary }}>{formatDate(selectedRange.start)}</span>
                      <span style={{ color: COLORS.textSecondary }}>→</span>
                      <span className="text-sm font-medium" style={{ color: COLORS.primary }}>{formatDate(selectedRange.end)}</span>
                      <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(10, 36, 99, 0.1)', color: COLORS.primary }}>{businessDays} working day{businessDays !== 1 ? 's' : ''}</span>
                    </div>
                  ) : (
                    <p className="text-sm italic p-3 rounded-xl" style={{ color: COLORS.textSecondary, border: `1px dashed ${COLORS.border}` }}>Drag on the calendar above to select dates</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>Leave Type</label>
                  <div className="grid grid-cols-5 gap-2">
                    {LEAVE_TYPES.filter(t => ['annual', 'sick', 'maternity', 'study', 'unpaid'].includes(t)).map(type => {
                      const s = typeStyle(type);
                      return (
                        <button key={type} onClick={() => setForm(f => ({ ...f, type }))}
                          className="py-2 px-1 rounded-xl text-xs font-medium transition-all"
                          style={{ backgroundColor: form.type === type ? s.bg : '#fff', color: form.type === type ? s.fg : COLORS.textSecondary, border: `1px solid ${form.type === type ? s.fg : COLORS.border}` }}>
                          {leaveTypeLabel(type)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>Reason</label>
                  <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3}
                    placeholder="Briefly describe your reason for leave..."
                    className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 resize-none"
                    style={{ border: `1px solid ${COLORS.border}`, '--tw-ring-color': COLORS.info }} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm transition-colors hover:bg-gray-50"
                    style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}>Cancel</button>
                  <button disabled={!selectedRange || !form.reason} onClick={handleSubmit}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: COLORS.primary }}>Submit Application</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="w-64 flex-shrink-0 space-y-4 overflow-y-auto">
        <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: `1px solid ${COLORS.border}` }}>
          <h3 className="font-medium text-sm mb-4" style={{ color: COLORS.text }}>My Balance</h3>
          <div className="text-center mb-4"><p className="font-serif text-5xl" style={{ color: COLORS.text }}>{remaining}</p><p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>days remaining</p></div>
          <LeaveBar used={emp.usedLeave} pending={emp.pendingLeave} total={emp.totalLeave} />
          <div className="mt-3 space-y-2">
            {[
              { label: 'Entitlement', value: emp.totalLeave, cls: COLORS.text },
              { label: 'Used', value: emp.usedLeave, cls: COLORS.success },
              { label: 'Pending', value: emp.pendingLeave, cls: COLORS.warning },
              { label: 'Remaining', value: remaining, cls: remaining < 5 ? COLORS.danger : COLORS.success },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-xs" style={{ color: COLORS.textSecondary }}>{item.label}</span>
                <span className="text-sm font-mono" style={{ color: item.cls }}>{item.value}d</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: `1px solid ${COLORS.border}` }}>
          <h3 className="font-medium text-sm mb-3" style={{ color: COLORS.text }}>My Requests</h3>
          <div className="space-y-2">
            {emp.leaveHistory.map(r => (
              <div key={r.id} className="p-2.5 rounded-xl" style={{ backgroundColor: COLORS.bg }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <LeaveBadge type={r.type} />
                  <span className="ml-auto"><StatusBadge status={r.status} /></span>
                </div>
                <p className="text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(r.startDate)} &middot; {r.days}d</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.textSecondary }}>{r.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestsView() {
  const [filter, setFilter] = useState('pending');
  const [requests, setRequests] = useState(ALL_LEAVE_RECORDS);
  const [expanded, setExpanded] = useState(null);
  const filtered = requests.filter(r => filter === 'all' || r.status === filter);
  const counts = { all: requests.length, pending: requests.filter(r => r.status === 'pending').length, approved: requests.filter(r => r.status === 'approved').length, rejected: requests.filter(r => r.status === 'rejected').length };

  function handleAction(id, action) { setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action, approvedBy: 'Priya Sharma' } : r)); }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['pending', 'all', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize flex items-center gap-2"
            style={{ backgroundColor: filter === s ? COLORS.primary : '#fff', color: filter === s ? '#fff' : COLORS.text, border: `1px solid ${filter === s ? COLORS.primary : COLORS.border}` }}>
            {s}
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: filter === s ? 'rgba(255,255,255,0.2)' : COLORS.bg, color: filter === s ? '#fff' : COLORS.textSecondary }}>{counts[s]}</span>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(r => {
          const emp = EMPLOYEES.find(e => e.id === r.employeeId);
          const isOpen = expanded === r.id;
          return (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all" style={{ border: `1px solid ${isOpen ? COLORS.info : COLORS.border}` }}>
              <button className="w-full text-left p-4" onClick={() => setExpanded(isOpen ? null : r.id)}>
                <div className="flex items-center gap-3">
                  <Avatar initials={emp?.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm" style={{ color: COLORS.text }}>{emp?.name}</p>
                      <span style={{ color: COLORS.textSecondary }}>·</span>
                      <p className="text-xs" style={{ color: COLORS.textSecondary }}>{emp?.role}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <LeaveBadge type={r.type} />
                      <span className="text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(r.startDate)} → {formatDate(r.endDate)}</span>
                      <span className="text-xs font-mono" style={{ color: COLORS.text }}>{r.days} days</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span style={{ color: COLORS.textSecondary }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div><p className="text-xs font-medium mb-1" style={{ color: COLORS.textSecondary }}>Reason</p><p className="text-sm" style={{ color: COLORS.text }}>{r.reason}</p></div>
                    <div><p className="text-xs font-medium mb-1" style={{ color: COLORS.textSecondary }}>Applied On</p><p className="text-sm" style={{ color: COLORS.text }}>{formatDate(r.appliedOn)}</p></div>
                    {r.document && <div><p className="text-xs font-medium mb-1" style={{ color: COLORS.textSecondary }}>Document</p><div className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.info }}><span>📎</span> {r.document}</div></div>}
                    <div><p className="text-xs font-medium mb-1" style={{ color: COLORS.textSecondary }}>Employee Balance</p><div className="flex items-center gap-2"><LeaveBar used={emp.usedLeave} pending={emp.pendingLeave} total={emp.totalLeave} /><span className="text-xs font-mono whitespace-nowrap" style={{ color: COLORS.textSecondary }}>{emp.totalLeave - emp.usedLeave - emp.pendingLeave}d left</span></div></div>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleAction(r.id, 'rejected')}
                        className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-red-50"
                        style={{ border: `1px solid ${COLORS.danger}`, color: COLORS.danger }}>Reject</button>
                      <button onClick={() => handleAction(r.id, 'approved')}
                        className="flex-1 py-2 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: COLORS.success }}>Approve</button>
                    </div>
                  )}
                  {r.status !== 'pending' && r.approvedBy && <p className="text-xs mt-3" style={{ color: COLORS.textSecondary }}>{r.status === 'approved' ? 'Approved' : 'Rejected'} by {r.approvedBy}</p>}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12" style={{ color: COLORS.textSecondary }}><div className="text-3xl mb-2">📭</div><p className="text-sm">No {filter} requests</p></div>}
      </div>
    </div>
  );
}

function FullCalendarView() {
  const [deptFilter, setDeptFilter] = useState('All');
  const depts = ['All', ...Array.from(new Set(EMPLOYEES.map(e => e.department)))];
  const filteredEmployees = deptFilter === 'All' ? EMPLOYEES : EMPLOYEES.filter(e => e.department === deptFilter);
  const filteredRecords = ALL_LEAVE_RECORDS.filter(r => filteredEmployees.some(e => e.id === r.employeeId));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: COLORS.textSecondary }}>Department:</span>
        {depts.map(d => (
          <button key={d} onClick={() => setDeptFilter(d)}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ backgroundColor: deptFilter === d ? COLORS.primary : '#fff', color: deptFilter === d ? '#fff' : COLORS.text, border: `1px solid ${deptFilter === d ? COLORS.primary : COLORS.border}` }}>
            {d}
          </button>
        ))}
        <div className="ml-auto flex gap-3">
          {LEAVE_TYPES.filter(t => ['annual', 'sick', 'maternity', 'study', 'unpaid'].includes(t)).map(type => (
            <div key={type} className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.textSecondary }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: typeStyle(type).fg }} />
              {leaveTypeLabel(type)}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: `1px solid ${COLORS.border}` }}>
        <CalendarView records={filteredRecords} />
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◻' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'my-leave', label: 'My Leave', icon: '🏖️' },
  { id: 'team', label: 'Team', icon: '👥' },
  { id: 'requests', label: 'Requests', icon: '📋' },
];

export default function Dashboard() {
  const [view, setView] = useState('dashboard');
  const pending = PENDING_REQUESTS.length;

  return (
    <div className="h-full flex" style={{ backgroundColor: COLORS.bg }}>
      <aside className="w-56 flex-shrink-0 flex flex-col bg-white" style={{ borderRight: `1px solid ${COLORS.border}` }}>
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <h1 className="font-serif text-xl" style={{ color: COLORS.text }}>LeaveOS</h1>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>HR Management</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{ backgroundColor: view === item.id ? 'rgba(10, 36, 99, 0.06)' : 'transparent', color: view === item.id ? COLORS.primary : COLORS.textSecondary }}>
              <span className="text-base">{item.icon}</span>
              {item.label}
              {item.id === 'requests' && pending > 0 && (
                <span className="ml-auto text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-mono"
                  style={{ backgroundColor: COLORS.warning }}>{pending}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
            <Avatar initials={CURRENT_USER.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: COLORS.text }}>{CURRENT_USER.name}</p>
              <p className="text-xs truncate" style={{ color: COLORS.textSecondary }}>{CURRENT_USER.role}</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div>
            <h2 className="font-serif text-xl" style={{ color: COLORS.text }}>{NAV_ITEMS.find(n => n.id === view)?.label}</h2>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>September 2026 · Fiscal Year 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs px-3 py-1.5 rounded-lg font-mono" style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary }}>
              {CURRENT_USER.totalLeave - CURRENT_USER.usedLeave - CURRENT_USER.pendingLeave}d remaining
            </div>
            <button onClick={() => setView('my-leave')}
              className="text-white text-sm px-4 py-2 rounded-xl transition-colors hover:opacity-90 font-medium"
              style={{ backgroundColor: COLORS.primary }}>+ Apply Leave</button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {view === 'dashboard' && <DashboardView onNavigate={setView} />}
          {view === 'calendar' && <FullCalendarView />}
          {view === 'my-leave' && <MyLeaveView />}
          {view === 'team' && <TeamView />}
          {view === 'requests' && <RequestsView />}
        </div>
      </main>
    </div>
  );
}
