import { useMemo, useState, useCallback } from "react";
import styled from "styled-components";
import {
  startOfWeek, addDays as dateAddDays, isSameDay, isSameMonth, isToday, format,
} from "date-fns";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Search, User, Cross,
  Droplets, Flower, Plus, X, ShieldAlert, Timer, MapPin, Phone, Mail, List,
} from "lucide-react";

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
  intake:    { label: "Body Intake",    color: "#00296B", tint: "#EFF6FF", icon: User },
  release:   { label: "Body Release",   color: "#132A13", tint: "#E8F5E9", icon: Cross },
  pm:        { label: "Postmortem",     color: "#E36414", tint: "#FFEDD5", icon: ShieldAlert },
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
      $color={s.color}
      $tint={s.tint}
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
      $color={s.color}
      $tint={s.tint}
      onClick={(ev) => { ev.stopPropagation(); onClick(event); }}
      title={`${event.deceased.name} · ${s.label}`}
      style={{ cursor: "pointer", marginBottom: "8px", flex: 1 }}
    >
      {event.time && <span className="t">{event.time}</span>}
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
        const active = key === today;
        return (
          <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid #e2e8f0", borderRadius: "10px", background: active ? "#f0fdff" : "#ffffff", minHeight: "520px", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", borderRadius: "10px 10px 0 0" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: active ? "#0f766e" : "#94a3b8" }}>
                {WEEK[(day.getDay() + 6) % 7]}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: active ? "#0f766e" : "#1e293b", lineHeight: 1 }}>
                {day.getDate()}
              </div>
              {active && <span style={{ fontSize: "0.7rem", color: "#fff", fontWeight: 700, background: "#0f766e", padding: "0.1rem 0.5rem", borderRadius: "20px", marginTop: "0.25rem", display: "inline-block" }}>Today</span>}
            </div>
            <div style={{ flex: 1, padding: "0.85rem 0.9rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {evs.length ? (
                evs.map((ev) => <EventRow key={ev.id} event={ev} onClick={onEventClick} />)
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.75rem" }}>No events</div>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {evs.map((ev) => <EventRow key={ev.id} event={ev} onClick={onEventClick} />)}
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
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "5px 0" }}>
        <thead>
          <tr>
            {WEEK.map((w) => (
              <th key={w} style={{ textAlign: "left", fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", padding: "6px 0", width: "14.28%" }}>
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi} style={{ height: "90px" }}>
              {week.map((day) => {
                const key = toKey(day);
                const active = key === today;
                const evs = (events || []).filter((e) => e.date === key);
                return (
                  <td key={key} style={{ padding: 0 }}>
                    <div
                      onClick={() => onDayClick(day)}
                      style={{
                        border: active ? "2px solid #0f766e" : "1px solid #e2e8f0",
                        borderRadius: "8px", padding: "6px", height: "100%",
                        display: "flex", flexDirection: "column", gap: "4px",
                        cursor: "pointer", background: active ? "#f0fdff" : "#ffffff",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: active ? "#0f766e" : "#0f172a" }}>
                          {day.getDate()}
                        </div>
                        {active && (
                          <span style={{ fontSize: "9px", color: "#fff", fontWeight: 700, background: "#0f766e", padding: "1px 5px", borderRadius: "10px" }}>
                            Today
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
                        {evs.slice(0, 2).map((e) => (
                          <Chip key={e.id} $color={statusOf(e).color} $tint={statusOf(e).tint} onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }} style={{ padding: "2px 6px", fontSize: "9px" }}>
                            <span className="t">{e.time}</span>
                            <span className="n">{typeOf(e).label}</span>
                            <span className="m">{e.deceased.name}</span>
                          </Chip>
                        ))}
                        {evs.length > 2 && (
                          <div style={{ fontSize: "8px", color: "#94a3b8", marginTop: "1px" }}>{evs.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
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
    <section style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: 0 }}>
      <header style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfeff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f766e" }}>
            <CalendarIcon size={16} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Deceased Schedule</h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>All branches · intake, release, postmortem and service activity</p>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
            <button type="button" onClick={() => step(-1)} aria-label="Previous period" style={{ padding: "6px 10px", fontSize: "13px", fontWeight: 700, color: "#64748b", background: "transparent", border: "none", cursor: "pointer" }}><ChevronLeft size={14} /></button>
            <strong style={{ padding: "6px 12px", fontSize: "13px", color: "#0f172a", borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>{rangeTitle}</strong>
            <button type="button" onClick={() => step(1)} aria-label="Next period" style={{ padding: "6px 10px", fontSize: "13px", fontWeight: 700, color: "#64748b", background: "transparent", border: "none", cursor: "pointer" }}><ChevronRight size={14} /></button>
          </div>
          <button type="button" onClick={goToday} style={{ padding: "6px 12px", fontSize: "13px", fontWeight: 700, color: "#0f766e", background: "#ecfeff", border: "1px solid #0f766e", borderRadius: 8, cursor: "pointer" }}>Today</button>
        </div>
      </header>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e2e8f0", background: "#ffffff", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {["month", "week", "day"].map((item) => (
            <button type="button" role="tab" aria-selected={view === item} key={item} onClick={() => setView(item)} style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 700, color: view === item ? "#fff" : "#64748b", background: view === item ? "#0f766e" : "transparent", border: "none", borderRadius: 8, cursor: "pointer" }}>{item[0].toUpperCase() + item.slice(1)}</button>
          ))}
          <button type="button" aria-selected={view === "today"} onClick={goToday} style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 700, color: view === "today" ? "#fff" : "#64748b", background: view === "today" ? "#0f766e" : "transparent", border: "none", borderRadius: 8, cursor: "pointer" }}>Today</button>
          <button type="button" aria-selected={view === "all"} onClick={() => setView("all")} style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 700, color: view === "all" ? "#fff" : "#64748b", background: view === "all" ? "#0f766e" : "transparent", border: "none", borderRadius: 8, cursor: "pointer" }}>All dates</button>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <button type="button" aria-label="Show calendar" aria-pressed={mode === "calendar"} onClick={() => setMode("calendar")} style={{ padding: "6px 10px", fontSize: "12px", fontWeight: 700, color: mode === "calendar" ? "#fff" : "#64748b", background: mode === "calendar" ? "#0f766e" : "transparent", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}><CalendarIcon size={13} /> Calendar</button>
          <button type="button" aria-label="Show list" aria-pressed={mode === "list"} onClick={() => setMode("list")} style={{ padding: "6px 10px", fontSize: "12px", fontWeight: 700, color: mode === "list" ? "#fff" : "#64748b", background: mode === "list" ? "#0f766e" : "transparent", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}><List size={13} /> List</button>
        </div>
        <label style={{ position: "relative", marginLeft: "auto", width: 260 }}>
          <SearchIcon style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, ID, admission no. or receiving officer" aria-label="Search deceased schedule" style={{ width: "100%", padding: "7px 10px 7px 32px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", background: "#fff" }} />
        </label>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0, gap: "12px", overflow: "hidden" }}>
        <aside style={{ width: 340, minWidth: 300, display: "flex", flexDirection: "column", border: "1px solid #e2e8f0", borderRadius: 10, background: "#ffffff", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.03)", overflow: "hidden", minHeight: 0 }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#94a3b8" }}>Live roster</span>
                <h2 style={{ margin: "2px 0 0 0", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Today’s activity</h2>
              </div>
              <b style={{ fontSize: "13px", color: "#0f172a" }}>{todayActivity.length}</b>
            </div>
          </div>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: "12px" }}>
            <div style={{ flex: 1, padding: "10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#94a3b8" }}>Intakes this month</div>
              <b style={{ fontSize: "16px", color: "#0f172a" }}>{intakesThisMonth}</b>
            </div>
            <div style={{ flex: 1, padding: "10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#94a3b8" }}>Releases this month</div>
              <b style={{ fontSize: "16px", color: "#0f172a" }}>{releasesThisMonth}</b>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
            {todayActivity.length ? (
              todayActivity.map((event) => <EventListCard key={event.id} event={event} onClick={handleEventClick} compact />)
            ) : (
              <div style={{ padding: "30px 14px", textAlign: "center", color: "#94a3b8" }}>
                <CalendarIcon size={18} style={{ marginBottom: 8, opacity: 0.5 }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>No activity scheduled today</span>
              </div>
            )}
          </div>
          <div style={{ padding: "10px 14px", borderTop: "1px solid #f1f5f9", fontSize: "11px", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#94a3b8" }}>Upcoming</div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
            {upcoming.filter((event) => event.date !== today).slice(0, 4).map((event) => (
              <button type="button" key={event.id} onClick={() => { setDate(event.date); setView("day"); handleEventClick(event); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", marginBottom: 6, cursor: "pointer", fontSize: "12px" }}>
                <i style={{ background: event.color, width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, color: "#334155" }}>
                  <b>{event.deceased.name}</b>
                  <span style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginTop: 2 }}>{fmtFull(event.date)} · {event.title}</span>
                </span>
              </button>
            ))}
            {!upcoming.some((event) => event.date > today) && <div style={{ padding: "14px 10px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>No upcoming events</div>}
          </div>
        </aside>
        <main style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>{rangeTitle} {mode === "list" ? "roster" : "calendar"}</h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>{listEvents.length} scheduled {listEvents.length === 1 ? "activity" : "activities"} · all branches</p>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["pending", "booked", "scheduled", "in_transit", "completed", "cancelled"].map((status) => {
                const config = STATUS_CONFIG[status];
                return (
                  <span key={status} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: config.color, background: config.tint, padding: "3px 8px", borderRadius: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: config.color }} /> {config.label}
                  </span>
                );
              })}
            </div>
          </div>
          {loading ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px", color: "#94a3b8" }}>
              <CalendarIcon size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
              <b style={{ fontSize: "14px", color: "#64748b" }}>Loading all branch schedules…</b>
            </div>
          ) : mode === "calendar" ? (
            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              {view === "week" ? <WeekGrid weekStartKey={weekStartOf(date)} eventsByDay={gridEventsByDay} onEventClick={handleEventClick} today={today} /> : view === "day" || view === "today" ? <DayGrid dayKey={view === "today" ? today : date} events={gridEvents} onEventClick={handleEventClick} today={today} /> : <MonthGrid year={monthDate.getFullYear()} month={monthDate.getMonth()} events={gridEvents} onDayClick={(day) => { setDate(toKey(day)); setView("day"); }} onEventClick={handleEventClick} today={today} />}
              {!listEvents.length && <div style={{ padding: "30px 16px", textAlign: "center", color: "#94a3b8" }}>No matching events in this range. Change the date or search to see more.</div>}
            </div>
          ) : listEvents.length ? (
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "0 16px 16px 16px" }}>
              {listEvents.map((event) => <EventListCard key={event.id} event={event} onClick={handleEventClick} />)}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px", color: "#94a3b8" }}>
              <CalendarIcon size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
              <b style={{ fontSize: "14px", color: "#64748b" }}>No matching schedule activity</b>
              <span style={{ fontSize: "12px", marginTop: 4 }}>Try another date range or search by deceased name, ID, admission number, or receiving officer.</span>
            </div>
          )}
        </main>
      </div>
      {selected && <DetailPanel selected={selected} onClose={() => setSelected(null)} onEventSelect={onEventSelect} />}
    </section>
  );
}

function SearchIcon() { return <Search size={15}/>; }

function EventListCard({ event, onClick, compact = false }) {
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









