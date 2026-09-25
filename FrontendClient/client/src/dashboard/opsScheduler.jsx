import { useEffect, useRef } from "react";
import {
  DOWF,
  MO,
  TYPE_L,
  addDays,
  eventsOf,
  matchPill,
  parseKey,
  weekStartOf,
} from "./opsData";

/* Shared by the Analytics scheduler and the Operations day/week board. */
export const START_HOUR = 6;
export const END_HOUR = 21;
export const HOUR_HEIGHT = 56;
export const DURATIONS = { intake: 90, pm: 120, release: 90 };
const DAY_TABS = [
  ["all", "All Events", "var(--brand)"],
  ["intake", "Intake", "var(--blue)"],
  ["release", "Releases", "var(--green)"],
  ["pm", "Postmortems", "var(--orange)"],
];

export const timeMinutes = (value, fallback = 9 * 60) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  return Math.min(23 * 60 + 59, Math.max(0, Number(match[1]) * 60 + Number(match[2])));
};

export const timeText = (minutes) => {
  const value = Math.max(0, Math.min(23 * 59, minutes));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
};

export const eventKey = (event) => `${event.date}-${event.t}-${event.p.adm}-${event.time}`;
const eventClass = (type) => (type === "intake" ? "evi" : type === "pm" ? "evp" : "evr");
const passes = (record, filters) => !filters.length || filters.some((key) => matchPill(record, "command", key));

/** Pack intersecting events into stable side-by-side lanes. */
export function layoutLanes(events) {
  const sorted = events.slice().sort((a, b) => {
    const byTime = timeMinutes(a.time) - timeMinutes(b.time);
    return byTime || a.t.localeCompare(b.t) || eventKey(a).localeCompare(eventKey(b));
  });
  const result = [];
  let index = 0;

  while (index < sorted.length) {
    const cluster = [sorted[index]];
    let clusterEnd = timeMinutes(sorted[index].time) + DURATIONS[sorted[index].t];
    let cursor = index + 1;

    while (cursor < sorted.length) {
      const start = timeMinutes(sorted[cursor].time);
      if (start >= clusterEnd) break;
      cluster.push(sorted[cursor]);
      clusterEnd = Math.max(clusterEnd, start + DURATIONS[sorted[cursor].t]);
      cursor += 1;
    }

    const laneEnds = [];
    const assignments = new Map();
    cluster.forEach((event) => {
      const start = timeMinutes(event.time);
      const end = start + DURATIONS[event.t];
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(end);
      } else {
        laneEnds[lane] = end;
      }
      assignments.set(eventKey(event), lane);
    });

    cluster.forEach((event) => {
      result.push({ event, lane: assignments.get(eventKey(event)), lanes: laneEnds.length });
    });
    index = cursor;
  }

  return result;
}

export default function SchedulerView({ searched, state, now, today, onOpenCase, onPickDay, onDayTabChange, reference = false }) {
  const scrollRef = useRef(null);
  const isWeek = state.view === "week";
  const days = isWeek
    ? Array.from({ length: 7 }, (_, index) => addDays(weekStartOf(state.selDate), index))
    : [state.selDate];
  const columns = reference
    ? (isWeek ? "64px repeat(7, minmax(110px, 1fr))" : "64px minmax(0, 1fr)")
    : `60px repeat(${days.length}, minmax(0, 1fr))`;
  const allEvents = eventsOf(searched).filter((event) => passes(event.p, state.filters));
  const eventsByDay = Object.fromEntries(days.map((day) => [day, allEvents.filter((event) => event.date === day)]));
  const counts = { intake: 0, release: 0, pm: 0 };
  let total = 0;

  days.forEach((day) => {
    eventsByDay[day].forEach((event) => {
      counts[event.t] += 1;
      total += 1;
    });
  });

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !days.includes(today)) return undefined;
    const frame = requestAnimationFrame(() => {
      const top = ((timeMinutes(now) - START_HOUR * 60) * HOUR_HEIGHT) / 60;
      node.scrollTop = Math.max(0, top - node.clientHeight / 3);
    });
    return () => cancelAnimationFrame(frame);
  }, [state.view, state.selDate]);

  const periodTitle = isWeek
    ? `${MO[parseKey(days[0]).getMonth()]} ${parseKey(days[0]).getDate()} – ${MO[parseKey(days[6]).getMonth()]} ${parseKey(days[6]).getDate()}, ${parseKey(days[6]).getFullYear()}`
    : `${DOWF[parseKey(state.selDate).getDay()]}, ${MO[parseKey(state.selDate).getMonth()]} ${parseKey(state.selDate).getDate()}`;
  const periodSubtitle = isWeek
    ? "Monday to Sunday · overlapping items sit side by side · click a day header to zoom in"
    : `${parseKey(state.selDate).getFullYear()} · overlapping items sit side by side · use the tabs to filter by type`;

  const futureItemsFor = (day) => searched.filter((record) => passes(record, state.filters) && (
    (record.admDate === day && record.admDate > today)
    || (record.release && record.release.date === day && record.release.status === "scheduled")
  ));
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
  const dayTab = state.dayTab || "all";
  const selectedDayEvents = eventsByDay[state.selDate] || [];
  const dayCounts = {
    all: selectedDayEvents.length,
    intake: selectedDayEvents.filter((event) => event.t === "intake").length,
    release: selectedDayEvents.filter((event) => event.t === "release").length,
    pm: selectedDayEvents.filter((event) => event.t === "pm").length,
  };

  const renderEvent = ({ event, lane, lanes }) => {
    const start = timeMinutes(event.time);
    const end = start + DURATIONS[event.t];
    const gridHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;
    let top = ((start - START_HOUR * 60) * HOUR_HEIGHT) / 60;
    let height = ((end - start) * HOUR_HEIGHT) / 60;
    if (top < 0) {
      height += top;
      top = 0;
    }
    if (top >= gridHeight || height <= 0) return null;
    height = Math.min(height - 2, gridHeight - top);
    const width = 100 / lanes;
    const location = event.t === "release"
      ? event.p.release ? event.p.release.dest : null
      : event.t === "intake"
        ? event.p.branch
        : event.p.pm ? event.p.pm.authority : null;
    const title = `${event.p.name} — ${TYPE_L[event.t]}`;
    const detail = `${event.time}–${timeText(end)} · ${event.p.adm} · ${location || "—"}`;
    return (
      <div
        key={eventKey(event)}
        className={`evc ${eventClass(event.t)}${(event.t === "pm" && event.completed) || (event.t === "release" && event.p.release?.status === "completed") ? " done" : ""}${height < 36 ? " compact" : ""}`}
        style={{
          top: `${top}px`,
          height: `${Math.max(20, height)}px`,
          left: `calc(${lane * width}% + 4px)`,
          width: `calc(${width}% - 8px)`,
        }}
        title={`${title}\n${detail}`}
        onClick={() => onOpenCase(event.p.adm, event.t)}
        role="button"
        tabIndex={0}
        onKeyDown={(keyEvent) => {
          if (keyEvent.key === "Enter" || keyEvent.key === " ") onOpenCase(event.p.adm, event.t);
        }}
      >
        <div className="et">{event.time} – {timeText(end)}</div>
        <div className="en">{reference ? title : event.p.name}</div>
        {height >= 36 ? <div className="el">{location || "—"}</div> : null}
      </div>
    );
  };

  return (
    <>
      <div className={`sch${reference ? ` reference ${isWeek ? "week" : "day"}` : ""}`} aria-label={`${isWeek ? "Weekly" : "Daily"} operations schedule`}>
        <div className="sch-top">
          <div>
            <div className="pl">{periodTitle}</div>
            <div className="ps">{periodSubtitle}</div>
          </div>
          <div className="sch-meta">
            <span className="ci" style={{ color: "var(--blue)" }}><i></i>Intake</span>
            <span className="ci" style={{ color: "var(--orange)" }}><i></i>Postmortem</span>
            <span className="ci" style={{ color: "var(--green)" }}><i></i>Release</span>
          </div>
        </div>

        <div className="sch-ad" style={{ gridTemplateColumns: columns }}>
          <div className="adt">{reference ? "All Day" : "Scheduled"}</div>
          {days.map((day) => (
            <div className="adc" key={`all-day-${day}`}>
              {futureItemsFor(day).map((record) => {
                const isIntake = record.admDate === day;
                const time = isIntake ? record.admTime : (record.release ? record.release.time : "");
                return (
                  <span
                    className={`adchip ${isIntake ? "adi" : "adr"}`}
                    key={`${record.adm}-${isIntake ? "arrival" : "handover"}`}
                    onClick={() => onOpenCase(record.adm, isIntake ? "intake" : "release")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(keyEvent) => {
                      if (keyEvent.key === "Enter") onOpenCase(record.adm, isIntake ? "intake" : "release");
                    }}
                  >
                    {isIntake ? "Arrival" : "Handover"} · {record.name.split(" ")[0]} {time || ""}
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sch-dh" style={{ gridTemplateColumns: columns }}>
          <div className="sch-corner" />
          {days.map((day) => {
            const date = parseKey(day);
            return (
              <div
                className={`sch-dhc${day === today ? " today" : ""}${!isWeek ? " day-mode" : ""}`}
                key={`header-${day}`}
                onClick={isWeek ? () => onPickDay(day) : undefined}
                role={isWeek ? "button" : undefined}
                tabIndex={isWeek ? 0 : undefined}
                onKeyDown={isWeek ? (event) => { if (event.key === "Enter") onPickDay(day); } : undefined}
              >
                {isWeek ? (
                  <>
                    <div className="dh-n">{["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()]}</div>
                    <div className="dh-d">{date.getDate()}</div>
                  </>
                ) : (
                  <>
                    <div className="dh-n">{DOWF[date.getDay()]}</div>
                    <div className="dh-d">{date.getDate()} {MO[date.getMonth()].slice(0, 3)}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="sch-scroll" ref={scrollRef}>
          <div className="sch-grid" style={{ gridTemplateColumns: columns }}>
            <div className="sch-times">
              {hours.map((hour) => (
                <div className="sch-slot" key={`slot-${hour}`}>
                  <span>{hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}</span>
                </div>
              ))}
            </div>
            {days.map((day) => {
              const dayEvents = eventsByDay[day] || [];
              const visibleEvents = dayTab === "all"
                ? dayEvents
                : dayEvents.filter((event) => event.t === dayTab);
              const isToday = day === today;
              return (
                <div className={`sch-col${isToday ? " today" : ""}`} key={`column-${day}`}>
                  {hours.map((hour) => <div className="sch-hc" key={`cell-${day}-${hour}`} />)}
                  {!visibleEvents.length ? <div className="sch-empty">No operations</div> : null}
                  {layoutLanes(visibleEvents).map(renderEvent)}
                  {isToday ? (() => {
                    const nowTop = ((timeMinutes(now) - START_HOUR * 60) * HOUR_HEIGHT) / 60;
                    const gridHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;
                    return nowTop >= 0 && nowTop <= gridHeight
                      ? <div className="nowline" style={{ top: `${nowTop}px` }} />
                      : null;
                  })() : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!isWeek && !reference ? (
        <div className="dtabs">
          {DAY_TABS.map(([key, label, color]) => (
            <button
              className={`dtab${dayTab === key ? " on" : ""}`}
              key={key}
              onClick={() => onDayTabChange(key)}
            >
              <i style={{ background: color }}></i>{label}
              <span className="dn2">{dayCounts[key]}</span>
            </button>
          ))}
        </div>
      ) : null}

      {!reference ? (
        <div className="wksum">
          <span style={{ color: "var(--tx)", fontWeight: 700 }}>{isWeek ? "Week totals" : "Day totals"}</span>
          <span className="ci"><i style={{ background: "var(--blue)" }}></i>Intakes <b>{counts.intake}</b></span>
          <span className="ci"><i style={{ background: "var(--green)" }}></i>Releases <b>{counts.release}</b></span>
          <span className="ci"><i style={{ background: "var(--orange)" }}></i>Postmortems <b>{counts.pm}</b></span>
          <span className="ci">Total <b>{total}</b></span>
          {isWeek ? <span style={{ marginLeft: "auto" }}>Today's column is tinted — the red line marks {now}</span> : null}
        </div>
      ) : null}
    </>
  );
}