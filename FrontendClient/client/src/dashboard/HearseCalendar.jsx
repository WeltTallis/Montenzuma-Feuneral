import { useMemo, useState, useCallback } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Clock, Search, User, Cross, Droplets, Flower,
  Plus, X, CheckCircle, ChevronDown, MapPin, Phone, Mail, ShieldAlert, Timer, List,
} from "lucide-react";
import "./metis-design.css";

/* -------------------------------------------------------------------------
   DeceasedScheduleCalendar — searchable, cross-branch activity roster for
   the RestPoint operations dashboard. Date ranges stay in list view; the
   side rail highlights today's activity and the next scheduled events.

   Props
   -----
   events        { id, uid?, type, date, time, title, note, status, branch,
                   deceased: {id,name,age,branch,sex,hearse}, raw? }[]
   onEventSelect (ev) => void        — fired when a chip/day is opened
   initialView   "today" | "month" | "week" | "day" | "all" (default "month")
   branch        string              — optional branch filter
   ------------------------------------------------------------------------- */

const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => {
  const p = String(k || "").split("-").map(Number);
  return new Date(p[0] || 1970, (p[1] || 1) - 1, p[2] || 1);
};
const todayKey = () => toKey(new Date());
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return toKey(d); };
const weekStartOf = (k) => { const d = parseKey(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toKey(d); };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEK = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

const fmtMonthYear = (k) => { const d = parseKey(k); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtDayHeader = (k) => { const d = parseKey(k); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };
const fmtFull = (k) => { const d = parseKey(k); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };

const TYPE_META = {
  intake: { label: "Body Intake", color: "#00296B", bg: "#EFF6FF", icon: User },
  release: { label: "Body Release", color: "#132A13", bg: "#E8F5E9", icon: Cross },
  pm: { label: "Postmortem Exam", color: "#E36414", bg: "#FFEDD5", icon: ShieldAlert },
  funeral: { label: "Funeral Service", color: "#B4534B", bg: "#FBEDEC", icon: Flower },
  transfer: { label: "Hearse Transfer", color: "#7C3AED", bg: "#F3E8FF", icon: Droplets },
  viewing: { label: "Viewing / Wake", color: "#8B5CF6", bg: "#F5F3FF", icon: User },
  cremation: { label: "Cremation", color: "#9333EA", bg: "#FAF5FF", icon: Timer },
  burial: { label: "Burial", color: "#475A43", bg: "#EEF3EC", icon: Cross },
};
const STATUS_CONFIG = {
  pending: { label: "Pending", progress: 10, color: "#d97706", bg: "#FFFBEB", dotColor: "#d97706" },
  booked: { label: "Booked", progress: 25, color: "#00296B", bg: "#EFF6FF", dotColor: "#00296B" },
  confirmed: { label: "Confirmed", progress: 25, color: "#00296B", bg: "#EFF6FF", dotColor: "#00296B" },
  scheduled: { label: "Scheduled", progress: 25, color: "#E36414", bg: "#FFEDD5", dotColor: "#E36414" },
  in_transit: { label: "In Transit", progress: 60, color: "#E36414", bg: "#FFEDD5", dotColor: "#E36414" },
  in_progress: { label: "In Progress", progress: 60, color: "#0c0b0f", bg: "#F3F4F6", dotColor: "#0c0b0f" },
  postponed: { label: "Postponed", progress: 15, color: "#d97706", bg: "#FFFBEB", dotColor: "#d97706" },
  completed: { label: "Completed", progress: 100, color: "#5F0F40", bg: "#FCE7F3", dotColor: "#5F0F40" },
  delivered: { label: "Delivered", progress: 100, color: "#132A13", bg: "#E8F5E9", dotColor: "#132A13" },
  cancelled: { label: "Cancelled", progress: 0, color: "#DD2D4A", bg: "#FEE2E2", dotColor: "#DD2D4A" },
  maintenance: { label: "Maintenance", progress: 0, color: "#03071E", bg: "#E0E7FF", dotColor: "#03071E" },
};
const getStatusMeta = (status) => STATUS_CONFIG[String(status || "scheduled").toLowerCase().replace(/\s+/g, "_")] || STATUS_CONFIG.scheduled;

export const MOCK_DECEASED = [
  { id: "d-101", name: "James M. Okafor", age: 68, branch: "Westlands", hearse: "Hearse A (HX-4421)", sex: "M", status: "confirmed" },
  { id: "d-102", name: "Grace A. Njeri", age: 54, branch: "Kilimani", hearse: "Hearse B (HX-4422)", sex: "F", status: "scheduled" },
  { id: "d-103", name: "Samuel K. Mwangi", age: 73, branch: "Westlands", hearse: "Hearse A (HX-4421)", sex: "M", status: "scheduled" },
  { id: "d-104", name: "Faith W. Achieng", age: 41, branch: "Karen", hearse: "Hearse C (HX-4423)", sex: "F", status: "in_transit" },
  { id: "d-105", name: "Peter O. Otieno", age: 59, branch: "Kilimani", hearse: "Hearse B (HX-4422)", sex: "M", status: "scheduled" },
  { id: "d-106", name: "Mercy J. Wambui", age: 37, branch: "Westlands", hearse: "Hearse A (HX-4421)", sex: "F", status: "completed" },
];

const TODAY = todayKey();
export const MOCK_EVENTS = [
  { id: "e-1", uid: "d-101", type: "intake", date: TODAY, time: "09:15", title: "Body Intake", status: "confirmed", note: "Morgue intake · Chamber 4", deceased: MOCK_DECEASED[0], branch: "Westlands", raw: {} },
  { id: "e-2", uid: "d-102", type: "intake", date: addDays(TODAY, 1), time: "11:00", title: "Body Intake", status: "scheduled", note: "Reception intake", deceased: MOCK_DECEASED[1], branch: "Kilimani", raw: {} },
  { id: "e-3", uid: "d-103", type: "release", date: addDays(TODAY, 2), time: "14:00", title: "Body Release", status: "scheduled", note: "Released to next of kin", deceased: MOCK_DECEASED[2], branch: "Westlands", raw: {} },
  { id: "e-4", uid: "d-104", type: "transfer", date: addDays(TODAY, 3), time: "10:30", title: "Hearse Transfer", status: "in_transit", note: "Hearse C en route", deceased: MOCK_DECEASED[3], branch: "Karen", raw: {} },
  { id: "e-5", uid: "d-105", type: "funeral", date: addDays(TODAY, 5), time: "11:00", title: "Funeral Service", status: "scheduled", note: "St. Mary's Chapel", deceased: MOCK_DECEASED[4], branch: "Kilimani", raw: {} },
  { id: "e-6", uid: "d-106", type: "release", date: addDays(TODAY, -1), time: "15:30", title: "Body Release", status: "completed", note: "Burial — Kilimani Cemetery", deceased: MOCK_DECEASED[5], branch: "Westlands", raw: {} },
];

function normEvents(raw) {
  return (raw || []).map((e, i) => {
    const meta = TYPE_META[e.type] || TYPE_META.intake;
    const d = e.deceased || {};
    const date = e.date || (e.start ? toKey(e.start) : todayKey());
    const status = String(e.status || "scheduled").toLowerCase().replace(/\s+/g, "_");
    const statusMeta = getStatusMeta(status);
    return {
      id: e.id || `${e.type || "evt"}-${date}-${i}`,
      uid: e.uid || d.id || "",
      title: e.title || meta.label,
      type: e.type || "intake",
      date,
      time: e.time || "",
      status,
      note: e.note || "",
      color: statusMeta.color,
      bg: statusMeta.bg,
      icon: meta.icon,
      label: meta.label,
      branch: e.branch || d.branch || "",
      deceased: {
        id: d.id || "",
        recordId: d.recordId || d.record_id || "",
        admissionNumber: d.admissionNumber || d.admission_number || d.adm || "",
        name: d.name || "Unknown",
        age: d.age != null ? d.age : "",
        branch: d.branch || "",
        sex: d.sex || "",
        hearse: d.hearse || "",
      },
      receivedFrom: e.receivedFrom || (e.raw && e.raw.received_from) || "",
      officer: e.officer || (e.raw && (e.raw.receiving_officer || e.raw.received_by || e.raw.staff_name)) || "",
      dest: e.dest || (e.raw && e.raw.final_destination) || "",
      receiver: e.receiver || (e.raw && e.raw.next_kin) || "",
      staff: e.staff || (e.raw && e.raw.released_by) || "",
      permit: e.permit || "",
      total: e.total || (e.raw && e.raw.charges && e.raw.charges.total) || "",
      raw: e.raw || null,
    };
  });
}
function MonthChip({ event, onClick }) {
  const meta = TYPE_META[event.type] || TYPE_META.intake;
  return (
    <button
      className="md-btn md-btn-sm"
      style={{
        background: event.bg, color: event.color, borderColor: event.color,
        fontSize: "0.68rem", fontWeight: 700, padding: "0.18rem 0.5rem",
        marginTop: "0.2rem", display: "block", width: "fit-content",
      }}
      onClick={(ev) => { ev.stopPropagation(); onClick(event); }}
    >
      <meta.icon size={10} />
      <span style={{ marginLeft: "0.3rem", opacity: 0.9 }}>{event.time ? `${event.time} ` : ""}{event.title}</span>
    </button>
  );
}

function DayCell({ day, events, onDayClick, onEventClick, today }) {
  const key = toKey(day);
  const evs = (events || []).filter((e) => e.date === key);
  const active = key === today;
  return (
    <div
      onClick={() => onDayClick(day)}
      style={{
        border: "1px solid var(--md-border)", borderRadius: "var(--md-radius-sm)",
        padding: "0.35rem", height: "100px", display: "flex", flexDirection: "column",
        gap: "0.2rem", cursor: "pointer", background: active ? "var(--md-surface-hover)" : "var(--md-surface-panel)",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.2rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: active ? "var(--md-primary)" : "var(--md-ink-primary)" }}>
          {day.getDate()}
        </div>
        {active && (
          <span style={{ fontSize: "0.6rem", background: "var(--md-primary)", color: "#fff", padding: "0.05rem 0.35rem", borderRadius: "9px", fontWeight: 700 }}>
            Today
          </span>
        )}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.1rem", overflow: "hidden" }}>
        {evs.slice(0, 3).map((e) => (
          <MonthChip key={e.id} event={e} onClick={onEventClick} />
        ))}
        {evs.length > 3 && (
          <div style={{ fontSize: "0.6rem", color: "var(--md-ink-muted)", marginTop: "0.15rem" }}>
            +{evs.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}

function MonthGrid({ year, month, events, onDayClick, onEventClick, today }) {
  const first = new Date(year, month, 1);
  const start = weekStartOf(toKey(first));
  const weeks = [];
  let d = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let i = 0; i < 7; i++) { week.push(new Date(d)); d.setDate(d.getDate() + 1); }
    weeks.push(week);
  }
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "5px 0" }}>
        <thead>
          <tr>
            {WEEK.map((w) => (
              <th key={w} style={{ textAlign: "left", fontSize: "0.68rem", fontWeight: 700, color: "var(--md-ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.45rem 0.2rem", width: "14.28%" }}>
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi} style={{ height: "100px" }}>
              {week.map((day) => (
                <td key={toKey(day)} style={{ padding: 0 }}>
                  <DayCell day={day} events={events} onDayClick={onDayClick} onEventClick={onEventClick} today={today} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventRow({ event, onClick }) {
  const meta = TYPE_META[event.type] || TYPE_META.intake;
  const status = getStatusMeta(event.status);
  return (
    <div
      onClick={() => onClick(event)}
      style={{
        display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 0.6rem",
        border: "1px solid var(--md-border)", borderRadius: "var(--md-radius-sm)",
        background: event.bg, cursor: "pointer", marginBottom: "0.4rem",
      }}
    >
      <meta.icon size={13} style={{ color: status.color }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--md-ink-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.title}
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--md-ink-muted)" }}>
          {event.time ? `${event.time} · ` : ""}{event.deceased.name}{event.deceased.age ? ` · ${event.deceased.age} yrs` : ""}
        </div>
      </div>
      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: status.color, background: status.bg, padding: "0.1rem 0.4rem", borderRadius: "9px", whiteSpace: "nowrap" }}>
        {status.label}
      </span>
    </div>
  );
}

function WeekGrid({ weekStartKey, eventsByDay, onEventClick, today }) {
  const days = [];
  let d = parseKey(weekStartKey);
  for (let i = 0; i < 7; i++) { days.push(toKey(d)); d.setDate(d.getDate() + 1); }
  return (
    <div style={{ display: "flex", gap: "6px", width: "100%" }}>
      {days.map((key) => {
        const day = parseKey(key);
        const evs = eventsByDay[key] || [];
        const active = key === today;
        return (
          <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid var(--md-border)", borderRadius: "var(--md-radius-sm)", background: active ? "var(--md-surface-hover)" : "var(--md-surface-panel)", minHeight: "320px" }}>
            <div style={{ padding: "0.5rem 0.7rem", borderBottom: "1px solid var(--md-border)", background: "var(--md-surface-sunken)", borderRadius: "var(--md-radius-sm) var(--md-radius-sm) 0 0" }}>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: active ? "var(--md-primary)" : "var(--md-ink-muted)" }}>
                {WEEK[(day.getDay() + 6) % 7]}
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: active ? "var(--md-ink-primary)" : "var(--md-ink-secondary)" }}>
                {day.getDate()}
              </div>
              {active && <span style={{ fontSize: "0.65rem", color: "var(--md-primary)", fontWeight: 700 }}>Today</span>}
            </div>
            <div style={{ flex: 1, padding: "0.5rem 0.7rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {evs.length ? (
                evs.map((ev) => <EventRow key={ev.id} event={ev} onClick={onEventClick} />)
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--md-ink-muted)", fontSize: "0.75rem" }}>No events</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayGrid({ dayKey, events, onEventClick, today }) {
  const day = parseKey(dayKey);
  const evs = (events || []).filter((e) => e.date === dayKey).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const active = dayKey === today;
  return (
    <div style={{ border: "1px solid var(--md-border)", borderRadius: "var(--md-radius-sm)", background: "var(--md-surface-panel)", padding: "0.8rem", minHeight: "400px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "var(--md-ink-muted)" }}>
          {WEEK[(day.getDay() + 6) % 7]}
        </div>
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--md-ink-primary)" }}>{day.getDate()}</div>
        <div style={{ fontSize: "0.95rem", color: "var(--md-ink-secondary)" }}>{fmtFull(dayKey)}</div>
        {active && (
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", background: "var(--md-primary)", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "9px", fontWeight: 700 }}>
            Today
          </span>
        )}
      </div>
      {evs.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {evs.map((ev) => <EventRow key={ev.id} event={ev} onClick={onEventClick} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", color: "var(--md-ink-muted)", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem", opacity: 0.5 }}>?</div>
          <div>No events scheduled for {fmtFull(dayKey)}</div>
        </div>
      )}
    </div>
  );
}
function DetailPanel({ selected, onClose, onEventSelect }) {
  const e = selected.event;
  const d = selected.deceased || {};
  const meta = TYPE_META[e.type] || TYPE_META.intake;
  const rows = [
    { label: "Deceased", value: d.name },
    { label: "Reference", value: d.id || e.uid || "—" },
    { label: "Age / Sex", value: `${d.age ? d.age + " yrs" : "—"}${d.sex ? " · " + d.sex : ""}` },
    { label: "Branch", value: d.branch || "—" },
    { label: "Hearse / Vehicle", value: d.hearse || "—" },
    { label: "Event", value: e.label },
    { label: "Type", value: e.type },
    { label: "Status", value: e.status },
    { label: "Date", value: e.date ? fmtFull(e.date) : "—" },
    { label: "Time", value: e.time || "—" },
    { label: "Note / Location", value: e.note || "—" },
    { label: "Received from", value: e.receivedFrom || "—" },
    { label: "Officer / Staff", value: e.officer || e.staff || "—" },
    { label: "Destination / Receiver", value: e.dest || e.receiver || "—" },
    { label: "Permit", value: e.permit || "—" },
    { label: "Charges", value: e.total || "—" },
  ];
  return (
    <>
      <div className="md-sidebar-overlay open" onClick={onClose} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(460px, 94vw)", maxWidth: "94vw", background: "var(--md-surface-panel)",
        borderLeft: "1px solid var(--md-border)", boxShadow: "var(--md-shadow-lg)",
        zIndex: 60, display: "flex", flexDirection: "column", overflowY: "auto",
      }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--md-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--md-surface-sunken)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <meta.icon size={16} style={{ color: meta.color }} />
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--md-ink-primary)" }}>{e.title}</span>
          </div>
          <button className="md-btn md-btn-sm md-btn-icon-only" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ padding: "1rem 1.25rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} style={{ borderBottom: "1px solid var(--md-border)" }}>
                  <td style={{ padding: "0.55rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--md-ink-muted)", width: "34%", verticalAlign: "top" }}>{r.label}</td>
                  <td style={{ padding: "0.55rem 0.5rem", fontSize: "0.82rem", color: "var(--md-ink-primary)", verticalAlign: "top" }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
            <button className="md-btn md-btn-sm md-btn-primary" onClick={() => { onClose(); onEventSelect?.({ event: e, deceased: d }); }}>
              Open case record
            </button>
            <button className="md-btn md-btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DeceasedScheduleCalendar({ events: eventsProp = [], onEventSelect, initialView = "month", branch = "", loading = false }) {
  const events = useMemo(() => normEvents(eventsProp).filter((e) => !branch || e.branch === branch || e.deceased.branch === branch), [eventsProp, branch]);
  const [view, setView] = useState(initialView);
  const [mode, setMode] = useState("calendar");
  const [date, setDate] = useState(todayKey);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [y, mo] = date.split("-").map(Number);
  const today = todayKey();
  const monthPrefix = `${y}-${pad(mo)}-`;
  const intakesThisMonth = events.filter((e) => e.type === "intake" && e.date.startsWith(monthPrefix)).length;
  const releasesThisMonth = events.filter((e) => e.type === "release" && e.date.startsWith(monthPrefix)).length;
  const matches = (event) => [event.deceased.name, event.deceased.id, event.deceased.recordId, event.deceased.admissionNumber, event.branch, event.title, event.officer, event.deceased.age]
    .join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  const inRange = (event) => {
    if (view === "today") return event.date === today;
    if (view === "day") return event.date === date;
    if (view === "week") { const start = weekStartOf(date); return event.date >= start && event.date <= addDays(start, 6); }
    if (view === "month") return event.date.startsWith(monthPrefix);
    return true;
  };
  const listEvents = events.filter((event) => inRange(event) && matches(event)).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || "") || a.title.localeCompare(b.title));
  const gridEvents = events.filter(matches);
  const gridEventsByDay = gridEvents.reduce((days, event) => {
    (days[event.date] ||= []).push(event);
    return days;
  }, {});
  const monthDate = parseKey(date);
  const todayActivity = events.filter((event) => event.date === today).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const upcoming = events.filter((event) => event.date >= today).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || "")).slice(0, 6);
  const step = (direction) => {
    if (view === "month" || view === "all") { setView("month"); setDate(toKey(new Date(y, mo - 1 + direction, 1))); }
    else if (view === "week") setDate(addDays(date, direction * 7));
    else if (view === "today") { setView("day"); setDate(addDays(today, direction)); }
    else if (view !== "all") setDate(addDays(date, direction));
  };
  const goToday = () => { setView("today"); setDate(today); };
  const handleEventClick = useCallback((event) => setSelected({ event, deceased: event.deceased }), []);
  const rangeTitle = view === "today" ? "Today" : view === "all" ? "All dates" : view === "day" ? fmtFull(date) : view === "week" ? `${fmtDayHeader(weekStartOf(date))} – ${fmtDayHeader(addDays(weekStartOf(date), 6))}` : fmtMonthYear(date);

  return (
    <section className="md-schedule">
      <header className="md-schedule-head">
        <div className="md-schedule-title"><span className="md-schedule-mark"><Calendar size={19}/></span><div><h1>Deceased Schedule</h1><p>All branches · intake, release, postmortem and service activity</p></div></div>
        <div className="md-schedule-controls">
          <div className="md-schedule-period"><button type="button" onClick={() => step(-1)} aria-label="Previous period"><ChevronLeft size={16}/></button><strong>{rangeTitle}</strong><button type="button" onClick={() => step(1)} aria-label="Next period"><ChevronRight size={16}/></button></div>
          <button type="button" className="md-schedule-today" onClick={goToday}>Today</button>
        </div>
      </header>
      <div className="md-schedule-toolbar">
        <div className="md-schedule-tabs" role="tablist" aria-label="Calendar view">
          {["month", "week", "day"].map((item) => <button type="button" role="tab" aria-selected={view === item} className={view === item ? "active" : ""} key={item} onClick={() => setView(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}
          <button type="button" role="tab" aria-selected={view === "today"} className={view === "today" ? "active" : ""} onClick={goToday}>Today</button>
          <button type="button" role="tab" aria-selected={view === "all"} className={view === "all" ? "active" : ""} onClick={() => setView("all")}>All dates</button>
        </div>
        <div className="md-schedule-tabs md-mode-tabs" role="group" aria-label="Schedule display mode">
          <button type="button" aria-label="Show calendar" aria-pressed={mode === "calendar"} className={mode === "calendar" ? "active" : ""} onClick={() => setMode("calendar")}><Calendar size={14}/> Calendar</button>
          <button type="button" aria-label="Show list" aria-pressed={mode === "list"} className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}><List size={14}/> List</button>
        </div>
        <label className="md-schedule-search"><SearchIcon/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, ID, admission no. or receiving officer" aria-label="Search deceased schedule"/><kbd>⌕</kbd></label>
      </div>
      <div className="md-schedule-layout">
        <aside className="md-activity-panel">
          <div className="md-panel-heading"><div><span>Live roster</span><h2>Today’s activity</h2></div><b>{todayActivity.length}</b></div>
          <div className="md-month-stats"><div><b>{intakesThisMonth}</b><span>Intakes this month</span></div><div><b>{releasesThisMonth}</b><span>Releases this month</span></div></div>
          <div className="md-activity-list">{todayActivity.length ? todayActivity.map((event) => <EventListCard key={event.id} event={event} onClick={handleEventClick} compact/>) : <div className="md-activity-empty"><Calendar size={18}/><span>No activity scheduled today</span></div>}</div>
          <div className="md-upcoming-heading">Upcoming</div>
          <div className="md-upcoming-list">{upcoming.filter((event) => event.date !== today).slice(0, 4).map((event) => <button type="button" key={event.id} onClick={() => { setDate(event.date); setView("day"); handleEventClick(event); }}><i style={{ background: event.color }}/><span><b>{event.deceased.name}</b><small>{fmtFull(event.date)} · {event.title}</small></span></button>)}{!upcoming.some((event) => event.date > today) && <small className="md-no-upcoming">No upcoming events</small>}</div>
        </aside>
        <main className="md-schedule-main">
          <div className="md-list-heading">
            <div>
              <h2>{rangeTitle} {mode === "list" ? "roster" : "calendar"}</h2>
              <p>{listEvents.length} scheduled {listEvents.length === 1 ? "activity" : "activities"} · all branches</p>
            </div>
            <div className="md-event-legend">
              {["pending", "booked", "scheduled", "in_transit", "completed", "cancelled"].map((status) => {
                const config = STATUS_CONFIG[status];
                return <span key={status}><i style={{ background: config.dotColor }} /> {config.label}</span>;
              })}
            </div>
          </div>
          {loading ? <div className="md-schedule-empty"><Calendar size={24}/><b>Loading all branch schedules…</b></div> : mode === "calendar" ? (
            <div className="md-calendar-view">
              {view === "week" ? <WeekGrid weekStartKey={weekStartOf(date)} eventsByDay={gridEventsByDay} onEventClick={handleEventClick} today={today}/> : view === "day" || view === "today" ? <DayGrid dayKey={view === "today" ? today : date} events={gridEvents} onEventClick={handleEventClick} today={today}/> : <MonthGrid year={monthDate.getFullYear()} month={monthDate.getMonth()} events={gridEvents} onDayClick={(day) => { setDate(toKey(day)); setView("day"); }} onEventClick={handleEventClick} today={today}/>}
              {!listEvents.length && <div className="md-calendar-empty">No matching events in this range. Change the date or search to see more.</div>}
            </div>
          ) : listEvents.length ? <div className="md-event-list">{listEvents.map((event) => <EventListCard key={event.id} event={event} onClick={handleEventClick}/>)}</div> : <div className="md-schedule-empty"><Calendar size={24}/><b>No matching schedule activity</b><span>Try another date range or search by deceased name, ID, admission number, or receiving officer.</span></div>}
        </main>
      </div>
      {selected && <DetailPanel selected={selected} onClose={() => setSelected(null)} onEventSelect={onEventSelect} />}
    </section>
  );
}

function SearchIcon() { return <Search size={15}/>; }

function EventListCard({ event, onClick, compact = false }) {
  const meta = TYPE_META[event.type] || TYPE_META.intake;
  const Icon = meta.icon;
  const status = getStatusMeta(event.status);
  return <button type="button" className={`md-event-card${compact ? " compact" : ""}`} onClick={() => onClick(event)} style={{ "--event-color": status.color, "--event-tint": status.bg }}>
    <span className="md-event-type-icon"><Icon size={17}/></span>
    <span className="md-event-date"><b>{fmtDayHeader(event.date)}</b><small>{event.time || "Time not set"}</small></span>
    <span className="md-event-person"><b>{event.deceased.name}</b><small>{event.deceased.admissionNumber || event.deceased.id || "No admission number"} · {event.branch || "Branch not set"}</small></span>
    <span className="md-event-type"><b>{event.title}</b><small>{event.officer && event.officer !== "—" ? `Received by ${event.officer}` : "Receiving officer not recorded"}</small></span>
    <span className="md-event-status" style={{ color: status.color, backgroundColor: status.bg }}>{status.label}</span><ChevronRight className="md-event-chevron" size={16}/>
  </button>;
}
