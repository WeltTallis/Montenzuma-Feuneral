import { useEffect, useMemo, useRef, useState } from "react";
import {
  DOWF, MO, TYPE_L, addDays, eventsOf, matchPill, parseKey, weekStartOf,
} from "./opsData";
import {
  DURATIONS, END_HOUR, HOUR_HEIGHT, START_HOUR, eventKey, timeMinutes, timeText,
} from "./opsScheduler";
import { Ic } from "./opsIcons";

/* ══════════════════════════════════════════════════════════════════════════
   Operations · Day / Week board — a 1:1 port of the "Operations Schedule"
   design: the view the sidebar calendar's Day / Week buttons open.

   Anatomy, top to bottom:
     All-Day strip  →  day headers  →  scrolling hour grid
   Solid status-coloured event cards with white text, the serif "today" badge,
   the live now-line and the italic empty state. Inside a day the cards always
   run **downwards** — busier days push each card below the previous one, so
   nothing is ever hidden behind anything else (even at identical start times).
   The Day view adds the type tabs (Intake · Releases · Postmortems) below.
   ══════════════════════════════════════════════════════════════════════════ */

const DAY_TABS = [
  ["all", "All Events", "var(--brand)"],
  ["intake", "Intake", "var(--blue)"],
  ["release", "Releases", "var(--green)"],
  ["pm", "Postmortems", "var(--orange)"],
];

const passes = (record, filters) =>
  !filters.length || filters.some((key) => matchPill(record, "command", key));

/** Card tint — the design's status palette, keyed to our operation types. */
const statusClass = (event) => {
  if (event.t === "pm") return event.completed ? "bd-st-completed" : "bd-st-scheduled";
  if (event.t === "release") return "bd-st-delivered";
  return "bd-st-booked";
};

/** Time order for one day (start time, then type, then admission number). */
const byTime = (a, b) => {
  const diff = a.shiftOffset - b.shiftOffset;
  return diff || a.t.localeCompare(b.t) || eventKey(a).localeCompare(eventKey(b));
};

/**
 * Lay a day's operations out **downwards**, in time order.
 *
 * Several operations can start at the same moment (three collections at 09:00,
 * say). Instead of squeezing them side by side — which leaves cards too narrow
 * to read — each one drops below the previous, so every event keeps the full
 * column width and nothing is ever covered up. When a day is so busy that the
 * list would run past the last row, every card is shrunk by the same factor so
 * the whole day still fits on screen.
 */
function stackDown(events, gridHeight) {
  const sorted = events.slice().sort(byTime);
  if (!sorted.length) return [];

  const topOf = (event) => Math.max(0, (event.shiftOffset * HOUR_HEIGHT) / 60);
  const tallOf = (event) => (DURATIONS[event.t] * HOUR_HEIGHT) / 60;
  const GAP = 3;
  const MIN_H = 22;
  const start = topOf(sorted[0]);

  let natural = 0;
  sorted.forEach((event, index) => { natural += tallOf(event) + (index ? GAP : 0); });
  const room = Math.max(0, gridHeight - start);
  const fit = natural > room && natural > 0 ? room / natural : 1;

  let cursor = start;
  return sorted.map((event) => {
    const height = Math.max(MIN_H, tallOf(event) * fit - GAP);
    const top = Math.min(Math.max(cursor, topOf(event)), gridHeight - MIN_H);
    cursor = top + height + GAP;
    return { event, top, height: Math.max(MIN_H, Math.min(height, gridHeight - top)) };
  });
}

export default function BoardSchedule({
  searched = [],
  filters = [],
  view = "week",
  selDate,
  now,
  today,
  dayTab = "all",
  onDayTabChange,
  onOpenCase,
  onPickDay,
}) {
  const scrollRef = useRef(null);
  const [shift, setShift] = useState("all");
  const isWeek = view === "week";
  const days = isWeek
    ? Array.from({ length: 7 }, (_, index) => addDays(weekStartOf(selDate), index))
    : [selDate];
  const columns = isWeek ? "64px repeat(7, minmax(110px, 1fr))" : "64px minmax(0, 1fr)";
  const hours = shift === "night"
    ? [...Array.from({ length: 6 }, (_, index) => index + 18), ...Array.from({ length: 6 }, (_, index) => index)]
    : shift === "day"
      ? Array.from({ length: 12 }, (_, index) => index + 6)
      : Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
  const gridHeight = hours.length * HOUR_HEIGHT;
  const timeLabel = (hour) => (
    hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`
  );

  const shiftEvents = useMemo(() => eventsOf(searched)
    .filter((event) => passes(event.p, filters))
    .flatMap((event) => {
      const minutes = timeMinutes(event.time);
      const hour = Math.floor(minutes / 60);
      if (shift === "day" && (hour < 6 || hour >= 18)) return [];
      if (shift === "night" && hour >= 6 && hour < 18) return [];
      const nightEarly = shift === "night" && hour < 6;
      return [{
        ...event,
        shiftDate: nightEarly ? addDays(event.date, -1) : event.date,
        shiftOffset: shift === "night"
          ? (nightEarly ? minutes + 6 * 60 : minutes - 18 * 60)
          : minutes - 6 * 60,
      }];
    }), [searched, filters, shift]);

  /* The Day view's tabs are a type filter; the Week view always shows all. */
  const boardEvents = shiftEvents;
  const allEvents = dayTab === "all" ? boardEvents : boardEvents.filter((event) => event.t === dayTab);
  const eventsByDay = Object.fromEntries(
    days.map((day) => [day, allEvents.filter((event) => event.shiftDate === day)])
  );
  /* Tab counters ignore the type filter, so every tab reports its own total. */
  const selectedDayAll = boardEvents.filter((event) => event.shiftDate === selDate);
  const shiftCount = shift === "all"
    ? "All scheduled hours"
    : shift === "day"
      ? "6:00 AM – 6:00 PM"
      : "6:00 PM – 6:00 AM";

  /* The strip carries what has no clock time: future arrivals and the
     scheduled handovers to the family. */
  const stripItemsFor = (day) => searched.filter((record) => passes(record, filters) && (
    (record.admDate === day && record.admDate > today)
    || (record.release && record.release.date === day && record.release.status === "scheduled")
  ));

  useEffect(() => {
    const node = scrollRef.current;
    const currentMinutes = timeMinutes(now);
    const currentHour = Math.floor(currentMinutes / 60);
    const nowShiftDate = shift === "night" && currentHour < 6 ? addDays(today, -1) : today;
    const inShift = shift === "all"
      ? currentHour >= START_HOUR && currentHour <= END_HOUR
      : shift === "day"
        ? currentHour >= 6 && currentHour < 18
        : currentHour >= 18 || currentHour < 6;
    if (!node || !inShift || !days.includes(nowShiftDate)) return undefined;
    const frame = requestAnimationFrame(() => {
      const offset = shift === "night"
        ? (currentHour < 6 ? currentMinutes + 6 * 60 : currentMinutes - 18 * 60)
        : currentMinutes - 6 * 60;
      const top = (offset * HOUR_HEIGHT) / 60;
      node.scrollTop = Math.max(0, top - node.clientHeight / 3);
    });
    return () => cancelAnimationFrame(frame);
  }, [view, selDate, shift]);


  const renderCard = ({ event, top, height }) => {
    const end = (timeMinutes(event.time) + DURATIONS[event.t]) % (24 * 60);
    const compact = height < 38;
    const location = event.t === "release"
      ? event.p.release ? event.p.release.dest : null
      : event.t === "intake"
        ? event.p.branch
        : event.p.pm ? event.p.pm.authority : null;
    const done = (event.t === "pm" && event.completed)
      || (event.t === "release" && event.p.release?.status === "completed");
    const title = `${event.p.name} — ${TYPE_L[event.t]}`;
    return (
      <div
        key={eventKey(event)}
        className={`bd-event ${statusClass(event)}${done ? " done" : ""}${compact ? " compact" : ""}`}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          left: "3px",
          right: "3px",
        }}
        title={`${title}\n${event.time}–${timeText(end)} · ${event.p.adm} · ${location || "—"}`}
        onClick={() => onOpenCase(event.p.uid, event.t)}
        role="button"
        tabIndex={0}
        onKeyDown={(keyEvent) => {
          if (keyEvent.key === "Enter" || keyEvent.key === " ") onOpenCase(event.p.uid, event.t);
        }}
      >
        <div className="bd-t">{event.time}–{timeText(end)}</div>
        <div className="bd-n">{title}</div>
        {!compact ? <div className="bd-l">{location || "—"}</div> : null}
      </div>
    );
  };

  return (
    <>
      <div className="shift-toolbar" aria-label="Filter operations by work shift">
        <div className="shift-intro">
          <span className="shift-icon"><Ic n={shift === "night" ? "moon" : "sun"} s={16} /></span>
          <div>
            <b>Shift schedule</b>
            <span>{shiftCount} · {shiftEvents.filter((event) => days.includes(event.shiftDate)).length} operations</span>
          </div>
        </div>
        <div className="shift-switch" role="group" aria-label="Shift">
          {[
            ["all", "All shifts"],
            ["day", "Day shift"],
            ["night", "Night shift"],
          ].map(([key, label]) => (
            <button
              type="button"
              className={shift === key ? "on" : ""}
              data-shift={key}
              key={key}
              onClick={() => setShift(key)}
              aria-pressed={shift === key}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className={`bd ${isWeek ? "week" : "day"}`} aria-label={`${isWeek ? "Weekly" : "Daily"} operations schedule`}>
        <div className="bd-allday" style={{ gridTemplateColumns: columns }}>
          <div className="bd-adlabel">All Day</div>
          {days.map((day) => (
            <div className="bd-adcell" key={`allday-${day}`}>
              {stripItemsFor(day).map((record) => {
                const isIntake = record.admDate === day;
                const time = isIntake ? record.admTime : (record.release ? record.release.time : "");
                return (
                  <span
                    className={`bd-chip ${isIntake ? "bd-chip-in" : "bd-chip-out"}`}
                    key={`${record.uid}-${isIntake ? "arrival" : "handover"}`}
                    onClick={() => onOpenCase(record.uid, isIntake ? "intake" : "release")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(keyEvent) => {
                      if (keyEvent.key === "Enter") onOpenCase(record.uid, isIntake ? "intake" : "release");
                    }}
                  >
                    {isIntake ? "Arrival" : "Handover"} · {record.name.split(" ")[0]} {time || ""}
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        <div className="bd-headers" style={{ gridTemplateColumns: columns }}>
          <div className="bd-corner" />
          {days.map((day) => {
            const date = parseKey(day);
            return (
              <div
                className={`bd-day${day === today ? " is-today" : ""}${isWeek ? "" : " day-mode"}`}
                key={`head-${day}`}
                onClick={isWeek ? () => onPickDay(day) : undefined}
                role={isWeek ? "button" : undefined}
                tabIndex={isWeek ? 0 : undefined}
                onKeyDown={isWeek ? (keyEvent) => { if (keyEvent.key === "Enter") onPickDay(day); } : undefined}
              >
                <div className="bd-day-name">{isWeek ? DOWF[date.getDay()].slice(0, 3) : DOWF[date.getDay()]}</div>
                <div className="bd-day-num">
                  {isWeek ? date.getDate() : `${date.getDate()} ${MO[date.getMonth()].slice(0, 3)}`}
                </div>
              </div>
            );
          })}
        </div>


        <div className="bd-scroll" ref={scrollRef}>
          <div className="bd-grid" style={{ gridTemplateColumns: columns }}>
            <div className="bd-times">
              {hours.map((hour) => (
                <div className="bd-slot" key={`slot-${hour}`}><span>{timeLabel(hour)}</span></div>
              ))}
            </div>
            {days.map((day) => {
              const dayEvents = eventsByDay[day] || [];
              return (
                <div className={`bd-col${day === today ? " is-today" : ""}`} key={`col-${day}`}>
                  {hours.map((hour) => <div className="bd-hour" key={`cell-${day}-${hour}`} />)}
                  {!dayEvents.length ? <div className="bd-empty">No events scheduled</div> : null}
                  {stackDown(dayEvents, gridHeight).map(renderCard)}
                  {(() => {
                    const currentMinutes = timeMinutes(now);
                    const currentHour = Math.floor(currentMinutes / 60);
                    const nowShiftDate = shift === "night" && currentHour < 6 ? addDays(today, -1) : today;
                    const inShift = shift === "all"
                      ? currentHour >= START_HOUR && currentHour <= END_HOUR
                      : shift === "day"
                        ? currentHour >= 6 && currentHour < 18
                        : currentHour >= 18 || currentHour < 6;
                    if (day !== nowShiftDate || !inShift) return null;
                    const nowOffset = shift === "night"
                      ? (currentHour < 6 ? currentMinutes + 6 * 60 : currentMinutes - 18 * 60)
                      : currentMinutes - 6 * 60;
                    const nowTop = (nowOffset * HOUR_HEIGHT) / 60;
                    return nowTop >= 0 && nowTop <= gridHeight
                      ? <div className="bd-now" style={{ top: `${nowTop}px` }} />
                      : null;
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!isWeek && onDayTabChange ? (
        <div className="dtabs">
          {DAY_TABS.map(([key, label, color]) => (
            <button
              className={`dtab${dayTab === key ? " on" : ""}`}
              key={key}
              onClick={() => onDayTabChange(key)}
            >
              <i style={{ background: color }}></i>{label}
              <span className="dn2">
                {key === "all"
                  ? selectedDayAll.length
                  : selectedDayAll.filter((event) => event.t === key).length}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
