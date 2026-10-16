import { useMemo, useState, useCallback } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Clock, User, Cross, Droplets, Flower,
  Plus, X, CheckCircle, ChevronDown, MapPin, Phone, Mail, ShieldAlert, Timer,
} from "lucide-react";
import "./metis-design.css";

/* -------------------------------------------------------------------------
   DeceasedScheduleCalendar — intake / release / service calendar for the
   RestPoint operations dashboard.

   Default view: a full MONTH grid. Every intake & release lands on its day
   as a coloured chip, so the whole month is visible at a glance. Tapping a
   chip (or a day) opens a slide-over that shows EVERY detail of the deceased
   and the event.

   Props
   -----
   events        { id, uid?, type, date, time, title, note, status, branch,
                   deceased: {id,name,age,branch,sex,hearse}, raw? }[]
   onEventSelect (ev) => void        — fired when a chip/day is opened
   initialView   "month" | "week" | "day"   (default "month")
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

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEK = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

const fmtMonthYear = (k) => { const d = parseKey(k); return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtDayHeader = (k) => { const d = parseKey(k); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };
const fmtFull = (k) => { const d = parseKey(k); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };

const TYPE_META = {
  intake:   { label: "Body Intake",       color: "var(--md-primary)",   bg: "var(--blue-bg)",   icon: User },
  release:  { label: "Body Release",      color: "var(--md-teal)",      bg: "var(--teal-bg)",   icon: Cross },
  pm:       { label: "Postmortem Exam",   color: "var(--md-warning)",   bg: "var(--warnl)",     icon: ShieldAlert },
  funeral:  { label: "Funeral Service",   color: "var(--md-danger)",    bg: "var(--pinkl)",     icon: Flower },
  transfer: { label: "Hearse Transfer",   color: "var(--md-info)",      bg: "var(--blue-bg)",   icon: Droplets },
  viewing:  { label: "Viewing / Wake",    color: "#7c3aed",             bg: "var(--plum-bg)",   icon: User },
  cremation:{ label: "Cremation",         color: "#7c3aed",             bg: "var(--plum-bg)",   icon: Timer },
  burial:   { label: "Burial",            color: "var(--md-teal)",      bg: "var(--teal-bg)",   icon: Cross },
};
const STATUS_COLOR = {
  scheduled: "var(--md-primary)",
  confirmed: "var(--md-success)",
  in_transit: "var(--md-warning)",
  completed: "var(--md-secondary)",
  cancelled: "var(--md-danger)",
};

const MOCK_DECEASED = [
  { id: "d-101", name: "James M. Okafor", age: 68, branch: "Westlands", hearse: "Hearse A (HX-4421)", sex: "M", status: "confirmed" },
  { id: "d-102", name: "Grace A. Njeri", age: 54, branch: "Kilimani", hearse: "Hearse B (HX-4422)", sex: "F", status: "scheduled" },
  { id: "d-103", name: "Samuel K. Mwangi", age: 73, branch: "Westlands", hearse: "Hearse A (HX-4421)", sex: "M", status: "scheduled" },
  { id: "d-104", name: "Faith W. Achieng", age: 41, branch: "Karen", hearse: "Hearse C (HX-4423)", sex: "F", status: "in_transit" },
  { id: "d-105", name: "Peter O. Otieno", age: 59, branch: "Kilimani", hearse: "Hearse B (HX-4422)", sex: "M", status: "scheduled" },
  { id: "d-106", name: "Mercy J. Wambui", age: 37, branch: "Westlands", hearse: "Hearse A (HX-4421)", sex: "F", status: "completed" },
];

const TODAY = todayKey();
const MOCK_EVENTS = [
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
    return {
      id: e.id || `${e.type || "evt"}-${date}-${i}`,
      uid: e.uid || d.id || "",
      title: e.title || meta.label,
      type: e.type || "intake",
      date,
      time: e.time || "",
      status: e.status || "scheduled",
      note: e.note || "",
      color: meta.color,
      bg: meta.bg,
      icon: meta.icon,
      label: meta.label,
      branch: e.branch || d.branch || "",
      deceased: {
        id: d.id || "",
        name: d.name || "Unknown",
        age: d.age != null ? d.age : "",
        branch: d.branch || "",
        sex: d.sex || "",
        hearse: d.hearse || "",
      },
      receivedFrom: e.receivedFrom || (e.raw && e.raw.received_from) || "",
      officer: e.officer || (e.raw && e.raw.receiving_officer) || "",
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
        background: meta.bg, color: meta.color, borderColor: meta.color,
        fontSize: "0.68rem", fontWeight: 700, padding: "0.18rem 0.5rem",
        marginTop: "0.2rem", display: "block", width: "fit-content",
      }}
      onClick={(ev) => { ev.stopPropagation(); onClick(event); }}
    >
      <meta.icon size={10} />
      <span style={{ marginLeft: "0.3rem", opacity: 0.9 }}>{event.title}</span>
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
  return (
    <div
      onClick={() => onClick(event)}
      style={{
        display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 0.6rem",
        border: "1px solid var(--md-border)", borderRadius: "var(--md-radius-sm)",
        background: event.bg, cursor: "pointer", marginBottom: "0.4rem",
      }}
    >
      <meta.icon size={13} style={{ color: meta.color }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--md-ink-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.title}
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--md-ink-muted)" }}>
          {event.time ? `${event.time} · ` : ""}{event.deceased.name}{event.deceased.age ? ` · ${event.deceased.age} yrs` : ""}
        </div>
      </div>
      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: STATUS_COLOR[event.status] || "var(--md-ink-muted)", background: "rgba(0,0,0,0.06)", padding: "0.1rem 0.4rem", borderRadius: "9px", whiteSpace: "nowrap" }}>
        {event.status}
      </span>
    </div>
  );
}

function WeekGrid({ weekStartKey, eventsByDay, onEventClick, today }) {
  const days = [];
  let d = new Date(weekStartKey);
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
                {WEEK[day.getDay()]}
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
          {WEEK[day.getDay()]}
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

export default function DeceasedScheduleCalendar({ events: eventsProp = [], onEventSelect, initialView = "month", branch = "" }) {
  const events = useMemo(() => normEvents(eventsProp).filter((e) => !branch || e.branch === branch || e.deceased.branch === branch), [eventsProp, branch]);
  const eventsByDay = useMemo(() => {
    const m = {};
    events.forEach((e) => { if (!m[e.date]) m[e.date] = []; m[e.date].push(e); });
    return m;
  }, [events]);
  const [view, setView] = useState(initialView);
  const [date, setDate] = useState(() => {
    if (initialView === "week") return weekStartOf(todayKey());
    if (initialView === "day") return todayKey();
    return todayKey();
  });
  const [selected, setSelected] = useState(null);

  const [y, mo] = date.split("-").map(Number);
  const today = todayKey();

  const intakesThisMonth = events.filter((e) => e.type === "intake" && e.date.startsWith(`${y}-${pad(mo)}-`)).length;
  const releasesThisMonth = events.filter((e) => e.type === "release" && e.date.startsWith(`${y}-${pad(mo)}-`)).length;
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);

  const step = (dir) => {
    if (view === "month") { setDate(toKey(new Date(y, mo - 1 + dir, 1))); }
    else if (view === "week") { setDate(addDays(date, dir * 7)); }
    else { setDate(addDays(date, dir)); }
  };
  const goToday = () => { setDate(todayKey()); if (view === "week") setDate(weekStartOf(todayKey())); };

  const handleDayClick = useCallback((day) => { setView("day"); setDate(toKey(day)); }, []);
  const handleEventClick = useCallback((ev) => { setSelected({ event: ev, deceased: ev.deceased }); onEventSelect?.({ event: ev, deceased: ev.deceased }); }, [onEventSelect]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "420px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", padding: "0.7rem 1rem", borderBottom: "1px solid var(--md-border)", background: "var(--md-surface-panel)", borderRadius: "var(--md-radius) var(--md-radius) 0 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
          <Calendar size={18} />
          <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--md-ink-primary)" }}>Deceased Schedule</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <button className="md-btn md-btn-sm md-btn-icon-only" onClick={() => step(-1)} title="Previous"><ChevronLeft size={14} /></button>
          <button className="md-btn md-btn-sm md-btn-primary" onClick={goToday}>Today</button>
          <button className="md-btn md-btn-sm md-btn-icon-only" onClick={() => step(1)} title="Next"><ChevronRight size={14} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
          {["month", "week", "day"].map((v) => (
            <button key={v} className={`md-btn md-btn-sm ${view === v ? "md-btn-primary" : ""}`} onClick={() => { setView(v); if (v === "week") setDate(weekStartOf(date)); if (v === "day") setDate(date); }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <aside style={{ width: "260px", flex: "0 0 260px", borderRight: "1px solid var(--md-border)", background: "var(--md-surface-panel)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ padding: "0.75rem 0.9rem", borderBottom: "1px solid var(--md-border)", background: "var(--md-surface-sunken)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Calendar size={14} style={{ color: "var(--md-ink-muted)" }} />
              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--md-ink-primary)" }}>Roster</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
              <div style={{ background: "var(--blue-bg)", border: "1px solid var(--md-primary)", borderRadius: "8px", padding: "0.5rem" }}>
                <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, color: "var(--md-primary)" }}>{intakesThisMonth}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--md-ink-muted)" }}>Intakes this month</div>
              </div>
              <div style={{ background: "var(--teal-bg)", border: "1px solid var(--md-teal)", borderRadius: "8px", padding: "0.5rem" }}>
                <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, color: "var(--md-teal)" }}>{releasesThisMonth}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--md-ink-muted)" }}>Releases this month</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "0.75rem 0.9rem" }}>
            <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, color: "var(--md-ink-muted)", marginBottom: "0.5rem" }}>Upcoming</div>
            {upcoming.length ? (
              upcoming.map((ev) => {
                const Icon = TYPE_META[ev.type]?.icon || User;
                return (
                  <div key={ev.id} style={{ display: "flex", alignItems: "start", gap: "0.5rem", padding: "0.45rem", borderRadius: "8px", background: "var(--md-surface-hover)", marginBottom: "0.35rem", cursor: "pointer", onClick: () => handleEventClick(ev) }}>
                    <Icon size={12} style={{ color: TYPE_META[ev.type]?.color }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--md-ink-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--md-ink-muted)" }}>{ev.deceased.name} · {ev.date ? fmtFull(ev.date) : "—"}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: "0.72rem", color: "var(--md-ink-muted)", padding: "0.6rem 0" }}>No upcoming events</div>
            )}
          </div>
        </aside>

        <div style={{ flex: 1, minWidth: 0, background: "var(--md-surface-app)", padding: "0.8rem", overflowY: "auto" }}>
          {view === "month" ? (
            <MonthGrid year={y} month={mo - 1} events={events} onDayClick={handleDayClick} onEventClick={handleEventClick} today={today} />
          ) : view === "week" ? (
            <WeekGrid weekStartKey={date} eventsByDay={eventsByDay} onEventClick={handleEventClick} today={today} />
          ) : (
            <DayGrid dayKey={date} events={events} onEventClick={handleEventClick} today={today} />
          )}
        </div>
      </div>

      {selected && <DetailPanel selected={selected} onClose={() => setSelected(null)} onEventSelect={onEventSelect} />}
    </div>
  );
}
