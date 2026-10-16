import { useMemo, useState, useCallback } from "react";
import { format, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks, isSameDay } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Cross2, Droplets, Flower } from "lucide-react";
import "./metis-design.css";

/* ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   DeceasedScheduleCalendar — big "dairy-style" calendar for deceased & service scheduling.
   ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 07:00 → 18:00

const TYPE_META = {
  funeral:   { label: "Funeral Service", color: "var(--md-danger)", icon: Cross2 },
  transfer:  { label: "Hearse Transfer", color: "var(--md-info)", icon: Droplets },
  service:   { label: "Memorial Service", color: "var(--md-primary)", icon: Flower },
  viewing:   { label: "Viewing / Wake", color: "var(--md-warning)", icon: User },
  cremation: { label: "Cremation", color: "#7c3aed", icon: null },
  burial:    { label: "Burial", color: "var(--md-teal)", icon: Cross2 },
};

const STATUS_COLOR = {
  scheduled: "var(--md-primary)",
  confirmed: "var(--md-success)",
  in_transit: "var(--md-warning)",
  completed: "var(--md-secondary)",
  cancelled: "var(--md-danger)",
};

const MOCK_DECEASED = [
  { id: "d-101", name: "James M. Okafor", age: 68, branch: "Westlands", hearse: "Hearse A (HX-4421)", status: "confirmed" },
  { id: "d-102", name: "Grace A. Njeri", age: 54, branch: "Kilimani", hearse: "Hearse B (HX-4422)", status: "scheduled" },
  { id: "d-103", name: "Samuel K. Mwangi", age: 73, branch: "Westlands", hearse: "Hearse A (HX-4421)", status: "scheduled" },
  { id: "d-104", name: "Faith W. Achieng", age: 41, branch: "Karen", hearse: "Hearse C (HX-4423)", status: "in_transit" },
  { id: "d-105", name: "Peter O. Otieno", age: 59, branch: "Kilimani", hearse: "Hearse B (HX-4422)", status: "scheduled" },
  { id: "d-106", name: "Mercy J. Wambui", age: 37, branch: "Westlands", hearse: "Hearse A (HX-4421)", status: "completed" },
];

const MOCK_EVENTS = [
  { id: "e-1", deceasedId: "d-101", title: "Funeral Service", type: "funeral", status: "confirmed", note: "St. Mary's Chapel · 11:00 AM" },
  { id: "e-2", deceasedId: "d-102", title: "Hearse Transfer", type: "transfer", status: "scheduled", note: "Morgue → Chapel · 09:30 AM" },
  { id: "e-3", deceasedId: "d-103", title: "Viewing / Wake", type: "viewing", status: "scheduled", note: "Family viewing · 04:00 PM" },
  { id: "e-4", deceasedId: "d-104", title: "Transfer to Crematorium", type: "transfer", status: "in_transit", note: "Hearse C en route · 02:15 PM" },
  { id: "e-5", deceasedId: "d-105", title: "Burial Service", type: "burial", status: "scheduled", note: "Kilimani Cemetery · 10:00 AM" },
  { id: "e-6", deceasedId: "d-106", title: "Cremation", type: "cremation", status: "completed", note: "Completed · 03:00 PM" },
];

function buildEvents(weekStart) {
  const dayOffsets = [0, 1, 2, 3, 4, 5, 6];
  return MOCK_EVENTS.map((ev, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + dayOffsets[i % 7]);
    const hour = 9 + (i % 6);
    const start = new Date(day); start.setHours(hour, 0, 0, 0);
    const end = new Date(start); end.setHours(start.getHours() + 1 + (i % 2), 0, 0, 0);
    return { ...ev, start, end };
  });
}

function DeceasedCard({ deceased, onOpen }) {
  return (
    <div className="md-card md-fade-in" style={{ marginBottom: "0.75rem" }} onClick={onOpen} role="button" tabIndex="0">
      <div className="md-card-body" style={{ padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <span className="md-badge" style={{ background: STATUS_COLOR[deceased.status] || "var(--md-primary)" }}>{deceased.status}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "var(--md-ink-primary)" }}>{deceased.name}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--md-ink-muted)" }}>{deceased.age} yrs · {deceased.branch} · {deceased.hearse}</div>
        </div>
        <span style={{ color: "var(--md-ink-muted)", fontSize: "0.75rem" }}>&gt;</span>
      </div>
    </div>
  );
}

function EventChip({ event, deceased, onClick }) {
  const meta = TYPE_META[event.type] || TYPE_META.funeral;
  const Icon = meta.icon;
  return (
    <div
      className={`md-event md-event-type-${event.type} md-fade-in`}
      style={{ borderLeft: `3px solid ${meta.color}` }}
      onClick={() => onClick(event, deceased)}
      role="button"
      tabIndex="0"
    >
      {Icon && <Icon size={11} />}
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
        {event.title}
      </span>
      {deceased && (
        <span style={{ fontSize: "0.65rem", opacity: 0.9, marginLeft: "0.35rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
          · {deceased.name}
        </span>
      )}
    </div>
  );
}

function WeekGrid({ days, eventsByDay, deceasedById, onEventSelect, onDayClick, isToday, dayLabel, dayDate }) {
  const today = new Date();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", borderBottom: "1px solid var(--md-border)", flexShrink: 0 }}>
        <div style={{ width: "56px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--md-ink-muted)", background: "var(--md-surface-sunken)", borderRight: "1px solid var(--md-border)" }}>Time</div>
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const evs = (eventsByDay[key] || []).length;
          const active = isSameDay(day, today);
          return (
            <div
              key={key}
              onClick={() => onDayClick(day)}
              role="button" tabIndex="0"
              style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--md-border)", cursor: "pointer", background: active ? "var(--md-surface-hover)" : "var(--md-surface-panel)", minHeight: "90vh" }}
            >
              <div style={{ padding: "0.625rem 0.75rem", borderBottom: "1px solid var(--md-border)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: active ? "var(--md-primary)" : "var(--md-ink-muted)" }}>{dayLabel(day)}</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: active ? "var(--md-ink-primary)" : "var(--md-ink-secondary)" }}>{dayDate(day)}</span>
                {active && <span style={{ fontSize: "0.65rem", color: "var(--md-primary)", fontWeight: 600 }}>Today</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "var(--md-ink-muted)", padding: "0.25rem" }}>{evs} scheduled</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <div style={{ width: "56px", flexShrink: 0, borderRight: "1px solid var(--md-border)", background: "var(--md-surface-sunken)" }}>
          {HOURS.map((h, i) => {
            const d = new Date(); d.setHours(h, 0, 0, 0);
            return (
              <div key={h} style={{ padding: "0.5rem", fontSize: "0.7rem", color: "var(--md-ink-muted)", textAlign: "right", borderBottom: "1px solid var(--md-border)", height: "calc(90vh / " + HOURS.length + ")" }}>{format(d, "h:mm a")}</div>
            );
          })}
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "auto", minWidth: 0 }}>
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const evs = (eventsByDay[key] || []).slice().sort((a, b) => a.start - b.start);
            return (
              <div key={key} style={{ flex: 1, borderRight: "1px solid var(--md-border)", position: "relative", minWidth: "150px", minHeight: "90vh", overflow: "visible" }}>
                {evs.map((ev) => {
                  const deceased = deceasedById[ev.deceasedId];
                  const startMin = ev.start.getHours() * 60 + ev.start.getMinutes();
                  const endMin = ev.end.getHours() * 60 + ev.end.getMinutes();
                  const dayStart = 7 * 60;
                  const dayEnd = 19 * 60;
                  const top = ((startMin - dayStart) / (dayEnd - dayStart)) * 100;
                  const height = Math.max(((endMin - startMin) / (dayEnd - dayStart)) * 100, 4);
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); onEventSelect(ev, deceased); }}
                      role="button" tabIndex="0"
                      style={{ position: "absolute", left: "6%", right: "6%", top: `${top}%`, height: `${height}%`, minHeight: "28px", zIndex: 10 }}
                    >
                      <EventChip event={ev} deceased={deceased} onClick={(e, d) => onEventSelect(e, d)} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayGrid({ day, events, deceasedById, onEventSelect }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--md-border)", background: "var(--md-surface-panel)" }}>
        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--md-ink-primary)", marginBottom: "0.25rem" }}>{format(day, "EEEE, MMMM d, yyyy")}</div>
        <div style={{ fontSize: "0.875rem", color: "var(--md-ink-muted)" }}>{events.length} scheduled service{events.length !== 1 ? "s" : ""}</div>
      </div>
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <div style={{ width: "56px", flexShrink: 0, borderRight: "1px solid var(--md-border)", background: "var(--md-surface-sunken)" }}>
          {HOURS.map((h, i) => {
            const d = new Date(); d.setHours(h, 0, 0, 0);
            return (
              <div key={h} style={{ padding: "0.5rem", fontSize: "0.7rem", color: "var(--md-ink-muted)", textAlign: "right", borderBottom: "1px solid var(--md-border)", height: "calc(100vh / " + HOURS.length + ")" }}>{format(d, "h:mm a")}</div>
            );
          })}
        </div>
        <div style={{ flex: 1, overflow: "auto", minWidth: 0, position: "relative", minHeight: "90vh" }}>
          {events.map((ev) => {
            const deceased = deceasedById[ev.deceasedId];
            const startMin = ev.start.getHours() * 60 + ev.start.getMinutes();
            const endMin = ev.end.getHours() * 60 + ev.end.getMinutes();
            const dayStart = 7 * 60;
            const dayEnd = 19 * 60;
            const top = ((startMin - dayStart) / (dayEnd - dayStart)) * 100;
            const height = Math.max(((endMin - startMin) / (dayEnd - dayStart)) * 100, 4);
            return (
              <div
                key={ev.id}
                onClick={(e) => { e.stopPropagation(); onEventSelect(ev, deceased); }}
                role="button" tabIndex="0"
                style={{ position: "absolute", left: "4%", right: "4%", top: `${top}%`, height: `${height}%`, minHeight: "32px", zIndex: 10 }}
              >
                <EventChip event={ev} deceased={deceased} onClick={(e, d) => onEventSelect(e, d)} />
              </div>
            );
          })}
          {events.length === 0 && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "var(--md-ink-muted)", textAlign: "center" }}>
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem", opacity: 0.3 }}>📭</span>
              No services scheduled for this day.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default function DeceasedScheduleCalendar({ onEventSelect }) {
  const [view, setView] = useState("week");
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const weekStart = useMemo(() => startOfWeek(date, { weekStartsOn: 1 }), [date]);
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);
  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) arr.push(addDays(weekStart, i));
    return arr;
  }, [weekStart]);

  const events = useMemo(() => buildEvents(new Date(weekStart)), [weekStart]);
  const deceasedById = useMemo(() => Object.fromEntries(MOCK_DECEASED.map(d => [d.id, d])), []);

  const eventsByDay = useMemo(() => {
    const map = {};
    days.forEach((d) => { map[format(d, "yyyy-MM-dd")] = []; });
    events.forEach((ev) => {
      const key = format(ev.start, "yyyy-MM-dd");
      if (map[key]) map[key].push(ev);
    });
    return map;
  }, [events, days]);

  const goToday = useCallback(() => setDate(new Date()), []);
  const step = useCallback((dir) => setDate(d => dir === -1 ? subWeeks(d, 1) : addWeeks(d, 1)), []);

  const headerRange = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
  const isToday = (d) => isSameDay(d, new Date());
  const dayLabel = (d) => format(d, "EEE");
  const dayDate = (d) => format(d, "dd");

  return (
    <div className="md-calendar-app md-fade-in">
      <aside className="md-calendar-sidebar">
        <div className="md-card-header" style={{ borderBottom: "1px solid var(--md-border)", background: "var(--md-surface-panel)" }}>
          <div className="md-card-title"><Calendar size={16} /> Deceased Schedule</div>
        </div>
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--md-ink-muted)" }}>Roster</span>
            <button className="md-btn md-btn-sm md-btn-primary" onClick={goToday} style={{ marginLeft: "auto", padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}>Today</button>
          </div>
          <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 260px)" }}>
            {MOCK_DECEASED.map((d) => (
              <DeceasedCard key={d.id} deceased={d} onOpen={() => setSelected({ event: null, deceased: d })} />
            ))}
          </div>
        </div>
        {selected && (
          <div style={{ padding: "1rem", borderTop: "1px solid var(--md-border)", background: "var(--md-surface-sunken)" }}>
            <div className="md-card-title" style={{ marginBottom: "0.75rem" }}>{selected.deceased ? selected.deceased.name : selected.event?.title || "Event"}</div>
            <button className="md-btn md-btn-sm md-btn-primary md-w-full" onClick={() => setSelected(null)}>Back to schedule</button>
          </div>
        )}
      </aside>

      <main className="md-calendar-main">
        <div className="md-calendar-header">
          <div className="md-calendar-nav">
            <button className="md-btn-icon md-btn-icon-only" onClick={() => step(-1)} title="Previous week"><ChevronLeft size={16} /></button>
            <div style={{ minWidth: "140px", textAlign: "center", fontWeight: 600, color: "var(--md-ink-primary)" }}>{headerRange}</div>
            <button className="md-btn-icon md-btn-icon-only" onClick={() => step(1)} title="Next week"><ChevronRight size={16} /></button>
          </div>
          <div className="md-calendar-nav" style={{ gap: "0.25rem" }}>
            <button className={`md-btn ${view === "week" ? "md-btn-primary" : ""}`} onClick={() => setView("week")}>Week</button>
            <button className={`md-btn ${view === "day" ? "md-btn-primary" : ""}`} onClick={() => setView("day")}>Day</button>
            <button className="md-btn-icon md-btn-icon-only" onClick={goToday} title="Today"><Clock size={14} /></button>
          </div>
        </div>

        <div className="md-calendar-content">
          {view === "week" ? (
            <WeekGrid days={days} eventsByDay={eventsByDay} deceasedById={deceasedById} onEventSelect={handleEventSelect} onDayClick={(d) => { setView("day"); setDate(d); }} isToday={isToday} dayLabel={dayLabel} dayDate={dayDate} />
          ) : (
            <DayGrid day={date} events={eventsByDay[format(date, "yyyy-MM-dd")] || []} deceasedById={deceasedById} onEventSelect={handleEventSelect} />
          )}
        </div>
      </main>
    </div>
  );

  function handleEventSelect(event, deceased) {
    setSelected({ event, deceased });
    onEventSelect?.({ event, deceased });
  }
}

