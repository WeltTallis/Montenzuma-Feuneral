import { useMemo, useState, useCallback } from "react";
import styled from "styled-components";
import {
  isSameMonth,
} from "date-fns";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, User, Cross,
  Droplets, Flower, X, ShieldAlert, Timer, List, Plus, Sun, Moon,
} from "lucide-react";
import "./deceased-calendar.css";

/* -------------------------------------------------------------------------
   DeceasedScheduleCalendar — clean modern calendar for deceased activity.
   Matches the coffin calendar look: day view with a 6am–10pm time spine,
   week view with 7 days side-by-side, status-coloured chips.

   Props
   -----
   events        { id, uid?, type, date, time, title, note, status, branch,
                   deceased: {id,name,age,branch,sex,hearse}, raw? }[]
   branch        string              — optional branch filter
   loading       boolean
   onEventSelect ({ event }) => void — fired when a chip/day is opened
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
  intake:    { label: "Body Intake",    color: "#2563eb", tint: "#eff6ff", icon: User },
  release:   { label: "Body Release",   color: "#16804a", tint: "#edf8f0", icon: Cross },
  pm:        { label: "Postmortem",     color: "#c46a12", tint: "#fff5e8", icon: ShieldAlert },
  funeral:   { label: "Funeral Service",color: "#B4534B", tint: "#FBEDEC", icon: Flower },
  transfer:  { label: "Hearse Transfer",color: "#7C3AED", tint: "#F3E8FF", icon: Droplets },
  viewing:   { label: "Viewing / Wake", color: "#8B5CF6", tint: "#F5F3FF", icon: User },
  cremation: { label: "Cremation",      color: "#9333EA", tint: "#FAF5FF", icon: Timer },
  burial:    { label: "Burial",         color: "#475A43", tint: "#EEF3EC", icon: Cross },
};
const typeOf = (e) => TYPE_META[String(e?.type || "intake").toLowerCase()] || TYPE_META.intake;

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "#d97706", tint: "#FFFBEB" },
  booked:    { label: "Booked",    color: "#00296B", tint: "#EFF6FF" },
  confirmed: { label: "Confirmed", color: "#0f766e", tint: "#ecfeff" },
  scheduled: { label: "Scheduled", color: "#E36414", tint: "#FFEDD5" },
  in_transit:{ label: "In Transit",color: "#E36414", tint: "#FFEDD5" },
  in_progress:{label: "In Progress",color: "#0c0b0f", tint: "#F3F4F6" },
  postponed: { label: "Postponed", color: "#d97706", tint: "#FFFBEB" },
  completed: { label: "Completed", color: "#15803d", tint: "#ecfdf5" },
  delivered: { label: "Delivered", color: "#132A13", tint: "#E8F5E9" },
  cancelled: { label: "Cancelled", color: "#dc2626", tint: "#fef2f2" },
  maintenance:{label: "Maintenance",color: "#03071E", tint: "#E0E7FF" },
};
const statusOf = (e) => STATUS_CONFIG[String(e?.status || "scheduled").toLowerCase().replace(/\s+/g, "_")] || STATUS_CONFIG.scheduled;

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
    const d = e.deceased || {};
    const date = e.date || (e.start ? toKey(e.start) : todayKey());
    const status = String(e.status || "scheduled").toLowerCase().replace(/\s+/g, "_");
    const statusMeta = statusOf({ status });
    const meta = typeOf(e);
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
      tint: statusMeta.tint,
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

const Chip = styled.button.attrs({ type: 'button' })`
  border: 0; border-left: 3px solid ${({ $color }) => $color};
  background: ${({ $tint }) => $tint}; color: #111827; border-radius: 7px;
  padding: 4px 7px; font-family: inherit; font-size: 11px; text-align: left;
  cursor: pointer; display: flex; flex-direction: column; gap: 1px;
  min-width: 0; transition: all 0.15s ease; outline: none;
  &:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
  .t { font-size: 10px; font-weight: 700; color: #6b7280; }
  .n { font-size: 11px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .m { font-size: 10px; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

function MonthChip({ event, onClick }) {
  const s = statusOf(event);
  const t = typeOf(event);
  return (
    <Chip
      $color={t.color}
      $tint={t.tint}
      className="deceased-schedule-month-chip"
      style={{ "--month-chip": t.color }}
      onClick={(ev) => { ev.stopPropagation(); onClick(event); }}
      title={`${event.deceased.name} · ${s.label}`}
    >
      {event.time && <span className="t">{event.time}</span>}
      <span className="n">{t.label}</span>
      <span className="m">{event.deceased.name}</span>
    </Chip>
  );
}

const SH = 6;
const EH = 22;
const HOURS = [];
for (let h = SH; h < EH; h++) HOURS.push(h);

const parseHour = (t) => {
  if (!t) return null;
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h + min / 60;
};

const shiftDateOf = (event, shift) => {
  const hour = parseHour(event.time);
  return shift === "night" && hour != null && hour < 6
    ? addDays(event.date, -1)
    : event.date;
};

const isInShift = (event, shift) => {
  if (shift === "all") return true;
  const hour = parseHour(event.time);
  if (hour == null) return true;
  return shift === "day" ? hour >= 6 && hour < 18 : hour >= 18 || hour < 6;
};

const fmtHour = (h) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const ap = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ap}`;
};

function EventRow({ event, onClick }) {
  const t = typeOf(event);
  const s = statusOf(event);
  return (
    <Chip
      $color={t.color}
      $tint={t.tint}
      onClick={(ev) => { ev.stopPropagation(); onClick(event); }}
      title={`${event.deceased.name} · ${s.label}`}
      className={`deceased-schedule-event deceased-schedule-event-${event.type}`}
      style={{ cursor: "pointer", marginBottom: "8px", flex: 1 }}
    >
      <span className="t">{event.time || "Unscheduled"} · {s.label}</span>
      <span className="n">{t.label}</span>
      <span className="m">{event.deceased.name}{event.deceased.age ? ` · ${event.deceased.age} yrs` : ""}</span>
    </Chip>
  );
}

function WeekGrid({ weekStartKey, eventsByDay, onEventClick, today }) {
  const days = [];
  let d = parseKey(weekStartKey);
  for (let i = 0; i < 7; i++) { days.push(toKey(d)); d.setDate(d.getDate() + 1); }
  return (
    <div style={{ display: "flex", gap: "8px", width: "100%" }}>
      {days.map((key) => {
        const day = parseKey(key);
        const evs = eventsByDay[key] || [];
        const unscheduled = evs.filter((event) => parseHour(event.time) == null);
        const timed = evs.filter((event) => parseHour(event.time) != null);
        const active = key === today;
        return (
          <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid #e2e8f0", borderRadius: "10px", background: "#ffffff", minHeight: "520px", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", background: "#ffffff", borderRadius: "10px 10px 0 0" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: active ? "#0f766e" : "#94a3b8" }}>
                {WEEK[(day.getDay() + 6) % 7]}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: active ? "#0f766e" : "#1e293b", lineHeight: 1 }}>
                {day.getDate()}
              </div>
              {active && <span style={{ fontSize: "0.7rem", color: "#fff", fontWeight: 700, background: "#0f766e", padding: "0.1rem 0.5rem", borderRadius: "20px", marginTop: "0.25rem", display: "inline-block" }}>Today</span>}
            </div>
            <div className="deceased-schedule-week-events">
              {unscheduled.length > 0 && (
                <div className="deceased-schedule-unscheduled">
                  <strong>Unscheduled</strong>
                  {unscheduled.map((event) => <EventRow key={event.id} event={event} onClick={onEventClick} />)}
                </div>
              )}
              {timed.length ? (
                timed.map((ev) => <EventRow key={ev.id} event={ev} onClick={onEventClick} />)
              ) : (
                !unscheduled.length && <div className="deceased-schedule-no-day-events">No events</div>
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
  const evs = (events || []).filter((e) => (e.shiftDate || e.date) === dayKey).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const unscheduled = evs.filter((event) => parseHour(event.time) == null);
  const timed = evs.filter((event) => parseHour(event.time) != null);
  const active = dayKey === today;
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", background: "#ffffff", padding: "1.2rem", minHeight: "600px", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.2rem" }}>
        <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 800, color: "#94a3b8" }}>
          {WEEK[(day.getDay() + 6) % 7]}
        </div>
        <div style={{ fontSize: "32px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{day.getDate()}</div>
        <div style={{ fontSize: "0.95rem", color: "#64748b" }}>{fmtFull(dayKey)}</div>
        {active && (
          <span style={{ marginLeft: "auto", fontSize: "11px", background: "#0f766e", color: "#fff", padding: "0.15rem 0.6rem", borderRadius: "20px", fontWeight: 800 }}>
            Today
          </span>
        )}
      </div>
      {evs.length ? (
        <div className="deceased-schedule-day-events-list">
          {unscheduled.length > 0 && (
            <div className="deceased-schedule-unscheduled">
              <strong>Unscheduled</strong>
              {unscheduled.map((event) => <EventRow key={event.id} event={event} onClick={onEventClick} />)}
            </div>
          )}
          {timed.map((ev) => <EventRow key={ev.id} event={ev} onClick={onEventClick} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", color: "#94a3b8", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem", opacity: 0.5 }}>?</div>
          <div>No events scheduled for {fmtFull(dayKey)}</div>
        </div>
      )}
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
    <div className="deceased-schedule-month">
      <div className="deceased-schedule-month-head">
        {WEEK.map((day) => <div key={day}>{day}</div>)}
      </div>
      <div className="deceased-schedule-month-grid">
        {weeks.flat().map((day) => {
          const key = toKey(day);
          const active = key === today;
          const dayEvents = (events || []).filter((event) => event.date === key)
            .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              aria-label={`${fmtFull(key)}${dayEvents.length ? `, ${dayEvents.length} scheduled activities` : ""}`}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onDayClick(day);
                }
              }}
              onClick={() => onDayClick(day)}
              className={`deceased-schedule-day${active ? " today" : ""}${isSameMonth(day, first) ? "" : " other"}`}
            >
              <div className="deceased-schedule-day-heading">
                <span>{day.getDate()}</span>
                {active && <span className="deceased-schedule-today">Today</span>}
              </div>
              <div className="deceased-schedule-day-events">
                {dayEvents.slice(0, 4).map((event) => (
                  <MonthChip key={event.id} event={event} onClick={onEventClick} />
                ))}
                {dayEvents.length > 4 && <div className="deceased-schedule-more">+{dayEvents.length - 4} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailPanel({ selected, onClose, onEventSelect }) {
  const e = selected.event;
  const d = selected.deceased || {};
  const t = typeOf(e);
  const s = statusOf(e);
  const rows = [
    { label: "Deceased", value: d.name },
    { label: "Reference", value: d.id || e.uid || "—" },
    { label: "Age / Sex", value: `${d.age ? d.age + " yrs" : "—"}${d.sex ? " · " + d.sex : ""}` },
    { label: "Branch", value: d.branch || "—" },
    { label: "Hearse / Vehicle", value: d.hearse || "—" },
    { label: "Event", value: t.label },
    { label: "Type", value: e.type },
    { label: "Status", value: s.label },
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
      <div style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 50, backdropFilter: "blur(2px)",
      }} onClick={onClose} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(460px, 94vw)", maxWidth: "94vw", background: "#ffffff",
        borderLeft: "1px solid #e2e8f0", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
        zIndex: 60, display: "flex", flexDirection: "column", overflowY: "auto",
      }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <t.icon size={16} style={{ color: t.color }} />
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>{e.title}</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "1rem 1.25rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.55rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", width: "34%", verticalAlign: "top" }}>{r.label}</td>
                  <td style={{ padding: "0.55rem 0.5rem", fontSize: "0.82rem", color: "#0f172a", verticalAlign: "top" }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
            <button type="button" className="primary" onClick={() => { onClose(); onEventSelect?.({ event: e, deceased: d }); }} style={{ background: "#0f766e", color: "#fff", border: "none", padding: "0.55rem 1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
              Open case record
            </button>
            <button type="button" onClick={onClose} style={{ background: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", padding: "0.55rem 1rem", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DeceasedScheduleCalendar({ events: eventsProp = [], onEventSelect, onCreateIntake, initialView = "month", branch = "", loading = false }) {
  const events = useMemo(() => normEvents(eventsProp).filter((e) => !branch || e.branch === branch || e.deceased.branch === branch), [eventsProp, branch]);
  const [view, setView] = useState(initialView);
  const [mode, setMode] = useState("calendar");
  const [date, setDate] = useState(todayKey);
  const [query, setQuery] = useState("");
  const [activeStatuses, setActiveStatuses] = useState([]);
  const [shift, setShift] = useState("all");
  const [selected, setSelected] = useState(null);
  const [y, mo] = date.split("-").map(Number);
  const today = todayKey();
  const monthPrefix = `${y}-${pad(mo)}-`;
  const monthEvents = events.filter((event) => event.date.startsWith(monthPrefix));
  const intakesThisMonth = monthEvents.filter((e) => e.type === "intake").length;
  const releasesThisMonth = monthEvents.filter((e) => e.type === "release").length;
  const postmortemsThisMonth = monthEvents.filter((e) => e.type === "pm").length;
  const statusCounts = events.reduce((counts, event) => {
    const key = statusKeyOf(event);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const availableStatuses = Object.keys(STATUS_CONFIG).filter((status) => statusCounts[status]);
  const toggleStatus = (status) => {
    setActiveStatuses((current) => current.includes(status)
      ? current.filter((item) => item !== status)
      : [...current, status]);
  };
  const matches = (event) => [event.deceased.name, event.deceased.id, event.deceased.recordId, event.deceased.admissionNumber, event.branch, event.title, event.officer, event.deceased.age]
    .join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  const isShiftView = view === "day" || view === "today" || view === "week";
  const eventShiftDate = (event) => shiftDateOf(event, shift);
  const inRange = (event) => {
    const shiftDate = isShiftView ? eventShiftDate(event) : event.date;
    if (view === "today") return shiftDate === today;
    if (view === "day") return shiftDate === date;
    if (view === "week") { const start = weekStartOf(date); return shiftDate >= start && shiftDate <= addDays(start, 6); }
    if (view === "month") return event.date.startsWith(monthPrefix);
    return true;
  };
  const isVisible = (event) => matches(event)
    && (!activeStatuses.length || activeStatuses.includes(statusKeyOf(event)))
    && (!isShiftView || isInShift(event, shift));
  const listEvents = events.filter((event) => inRange(event) && isVisible(event)).sort((a, b) => {
    const aDate = isShiftView ? eventShiftDate(a) : a.date;
    const bDate = isShiftView ? eventShiftDate(b) : b.date;
    return aDate.localeCompare(bDate)
      || (a.time || "").localeCompare(b.time || "")
      || a.title.localeCompare(b.title);
  });
  const gridEvents = events.filter(isVisible).map((event) => isShiftView
    ? { ...event, shiftDate: eventShiftDate(event) }
    : event);
  const gridEventsByDay = gridEvents.reduce((days, event) => {
    (days[event.shiftDate || event.date] ||= []).push(event);
    return days;
  }, {});
  const monthDate = parseKey(date);
  const todayActivity = events.filter((event) => event.date === today).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
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
    <section className="deceased-schedule">
      <header className="deceased-schedule-header">
        <div className="deceased-schedule-brand">
          <div className="deceased-schedule-mark">
            <CalendarIcon size={16} />
          </div>
          <div>
            <h1>RestPoint <span>Deceased schedule</span></h1>
            <p>{branch || "All branches"} · Intake, release and postmortem schedule</p>
          </div>
        </div>
        {onCreateIntake && <button type="button" className="deceased-schedule-create" onClick={onCreateIntake}><Plus size={14} /> Register intake</button>}
      </header>
      <div className="deceased-schedule-toolbar">
        <div className="deceased-schedule-toolbar-left">
          <label className="deceased-schedule-search">
            <SearchIcon />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search deceased records..." aria-label="Search deceased schedule" />
          </label>
          <span className="deceased-schedule-divider" />
          <div className="deceased-schedule-filters" aria-label="Filter by status">
            {availableStatuses.map((status) => {
              const config = STATUS_CONFIG[status];
              const active = !activeStatuses.length || activeStatuses.includes(status);
              return (
                <button type="button" key={status} className={`deceased-schedule-filter${active ? " active" : ""}`} aria-pressed={active} onClick={() => toggleStatus(status)}>
                  <i style={{ background: config.color }} />{config.label}<small>{statusCounts[status]}</small>
                </button>
              );
            })}
          </div>
        </div>
        <div className="deceased-schedule-toolbar-right">
          <div className="deceased-schedule-period-control">
            <button type="button" onClick={() => step(-1)} aria-label="Previous period"><ChevronLeft size={15} /></button>
            <strong>{rangeTitle}</strong>
            <button type="button" onClick={() => step(1)} aria-label="Next period"><ChevronRight size={15} /></button>
          </div>
          <button type="button" className="deceased-schedule-today-button" onClick={goToday}>Today</button>
          <span className="deceased-schedule-divider" />
          <div className="deceased-schedule-views" role="tablist" aria-label="Calendar view">
            {["day", "week", "month"].map((item) => (
              <button type="button" role="tab" aria-selected={view === item} key={item} onClick={() => { setView(item); setMode("calendar"); }}>{item[0].toUpperCase() + item.slice(1)}</button>
            ))}
            <button type="button" role="tab" aria-selected={mode === "list"} onClick={() => setMode("list")}><List size={12} /> List</button>
          </div>
        </div>
      </div>
      <div className="deceased-schedule-summary">
        <article className="month-stat"><CalendarIcon /><div><strong>{monthEvents.length}</strong><span>All activity</span></div></article>
        <article className="intake-stat"><User /><div><strong>{intakesThisMonth}</strong><span>Intakes</span></div></article>
        <article className="release-stat"><Cross /><div><strong>{releasesThisMonth}</strong><span>Releases</span></div></article>
        <article className="postmortem-stat"><ShieldAlert /><div><strong>{postmortemsThisMonth}</strong><span>Postmortems</span></div></article>
        <article className="today-stat"><CalendarIcon /><div><strong>{todayActivity.length}</strong><span>Today</span></div></article>
      </div>
      {mode === "calendar" && isShiftView && (
        <div className="deceased-schedule-shift-toolbar" role="group" aria-label="Filter calendar by shift">
          <div className="deceased-schedule-shift-copy">
            {shift === "night" ? <Moon size={16} /> : <Sun size={16} />}
            <span><strong>{shift === "all" ? "All shifts" : shift === "day" ? "Day shift" : "Night shift"}</strong>
              <small>{shift === "day" ? "6:00 AM – 6:00 PM" : shift === "night" ? "6:00 PM – 6:00 AM" : "Showing every scheduled hour"}</small>
            </span>
          </div>
          <div className="deceased-schedule-shift-options">
            {[
              ["all", "All shifts"],
              ["day", "Day shift"],
              ["night", "Night shift"],
            ].map(([key, label]) => (
              <button key={key} type="button" data-shift={key} className={shift === key ? "active" : ""} aria-pressed={shift === key} onClick={() => setShift(key)}>
                {key === "night" ? <Moon size={13} /> : key === "day" ? <Sun size={13} /> : null}{label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="deceased-schedule-legend">
        <strong>Activity type</strong>
        {["intake", "release", "pm"].map((type) => {
          const meta = TYPE_META[type];
          return <span key={type}><i style={{ background: meta.color }} /> {meta.label}</span>;
        })}
        <span className="deceased-schedule-result-count">{listEvents.length} {listEvents.length === 1 ? "activity" : "activities"}</span>
      </div>
      <main className="deceased-schedule-content">
          {loading ? (
            <div className="deceased-schedule-empty">
              <CalendarIcon size={24} />
              <b>Loading branch schedules…</b>
            </div>
          ) : mode === "calendar" ? (
            <div className="deceased-schedule-grid">
              {view === "week" ? <WeekGrid weekStartKey={weekStartOf(date)} eventsByDay={gridEventsByDay} onEventClick={handleEventClick} today={today} /> : view === "day" || view === "today" ? <DayGrid dayKey={view === "today" ? today : date} events={gridEvents} onEventClick={handleEventClick} today={today} /> : <MonthGrid year={monthDate.getFullYear()} month={monthDate.getMonth()} events={gridEvents} onDayClick={(day) => { setDate(toKey(day)); setView("day"); }} onEventClick={handleEventClick} today={today} />}
              {!listEvents.length && <div className="deceased-schedule-no-events">No matching events in this range. Change the date or search to see more.</div>}
            </div>
          ) : listEvents.length ? (
            <div className="deceased-schedule-list">
              {listEvents.map((event) => <EventListCard key={event.id} event={event} onClick={handleEventClick} />)}
            </div>
          ) : (
            <div className="deceased-schedule-empty">
              <CalendarIcon size={24} />
              <b>No matching schedule activity</b>
              <span>Try another date range or search by deceased name, ID, admission number, or receiving officer.</span>
            </div>
          )}
      </main>
      {selected && <DetailPanel selected={selected} onClose={() => setSelected(null)} onEventSelect={onEventSelect} />}
    </section>
  );
}

function statusKeyOf(event) {
  const status = String(event?.status || "scheduled").toLowerCase().replace(/\s+/g, "_");
  return STATUS_CONFIG[status] ? status : "scheduled";
}

function SearchIcon() { return <Search size={15}/>; }

function EventListCard({ event, onClick }) {
  const t = typeOf(event);
  const s = statusOf(event);
  return (
    <Chip
      $color={s.color}
      $tint={s.tint}
      onClick={(ev) => { ev.stopPropagation(); onClick(event); }}
      title={`${event.deceased.name} · ${s.label}`}
      style={{ cursor: "pointer", marginBottom: "8px", display: "flex", width: "100%" }}
    >
      {event.time && <span className="t">{event.time}</span>}
      <span className="n">{t.label}</span>
      <span className="m">{event.deceased.name} · {event.deceased.admissionNumber || event.deceased.id || "No admission number"} · {event.branch || "Branch not set"}</span>
    </Chip>
  );
}
