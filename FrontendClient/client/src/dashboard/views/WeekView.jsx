import { Fragment } from "react";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { WEEKDAYS, WEEK_HOURS } from "../config";
import { matchesDay, safeName, hourOf } from "../utils";

/* ── High-end Week calendar ─────────────────────────────────────── */
export default function WeekView({ currentDate, bookings, mod, onSelect, onShowDay }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const SM = mod.statusMap;

  return (
    <div
      className="flex flex-col rounded-2xl border overflow-hidden shadow-xl"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)",
        borderColor: "rgba(255,255,255,0.06)",
        minWidth: 860,
        height: "100%",
      }}
    >
      {/* Day header row */}
      <div
        className="grid border-b flex-shrink-0"
        style={{
          gridTemplateColumns: "56px repeat(7, 1fr)",
          borderColor: "rgba(255,255,255,0.06)",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Empty top-left corner */}
        <div className="border-r" style={{ borderColor: "rgba(15,23,42,0.05)" }} />

        {days.map((day, i) => {
          const tod = isToday(day);
          return (
            <button
              key={i}
              onClick={() => onShowDay(day)}
              className="border-r py-3 text-center transition-colors hover:bg-white/[0.03]"
              style={{ borderColor: "rgba(15,23,42,0.05)" }}
            >
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                {format(day, "EEE")}
              </div>
              <div
                className={`text-base font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full transition-all`}
                style={tod
                  ? {
                    backgroundColor: mod.accent,
                    color: "#fff",
                    boxShadow: `0 0 16px ${mod.accent}60`,
                  }
                  : { color: "#64748B" }
                }
              >
                {format(day, "d")}
              </div>
            </button>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          {WEEK_HOURS.map((hour) => (
            <Fragment key={hour}>
              {/* Hour label */}
              <div
                className="border-r border-b py-3 px-2 text-right"
                style={{
                  borderColor: "rgba(15,23,42,0.04)",
                  backgroundColor: "rgba(255,255,255,0.01)",
                }}
              >
                <span className="text-[9px] font-mono text-slate-600">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>

              {/* Day columns */}
              {days.map((day, di) => {
                const ds = format(day, "yyyy-MM-dd");
                const tod = isToday(day);
                const hourBks = bookings.filter(
                  (b) => matchesDay(b, mod, ds) && hourOf(b) === hour
                );
                return (
                  <div
                    key={di}
                    onClick={() => onShowDay(day)}
                    className="border-r border-b p-1 min-h-[56px] cursor-pointer transition-colors hover:bg-white/[0.02]"
                    style={{
                      borderColor: "rgba(15,23,42,0.04)",
                      backgroundColor: tod
                        ? `${mod.accent}07`
                        : "transparent",
                    }}
                  >
                    {hourBks.map((bk) => {
                      const cfg = SM[bk.status] || { color: mod.accent };
                      return (
                        <button
                          key={bk[mod.idField] || bk.id}
                          className="rp-event-chip w-full text-left rounded-lg px-2 py-1 mb-0.5 border flex items-center gap-1.5 overflow-hidden"
                          onClick={(e) => { e.stopPropagation(); onSelect(bk); }}
                          style={{
                            backgroundColor: `${cfg.color}14`,
                            borderColor: `${cfg.color}28`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cfg.color }}
                          />
                          <span
                            className="text-[10px] font-semibold truncate"
                            style={{ color: cfg.color }}
                          >
                            {safeName(bk, mod).split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}