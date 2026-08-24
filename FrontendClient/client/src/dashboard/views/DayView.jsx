import { format } from "date-fns";
import { DAY_START, DAY_TOTAL, HOUR_PX } from "../config";
import { matchesDay, safeName } from "../utils";
import { Truck } from "lucide-react";

/* Day view — a Gantt-style timeline grouped by branch / category. */
export default function DayView({ currentDate, bookings, mod, onSelect }) {
  const ds = format(currentDate, "yyyy-MM-dd");
  const dayBks = bookings.filter(b => matchesDay(b, mod, ds));
  const SM = mod.statusMap;
  const timelineW = DAY_TOTAL * HOUR_PX;

  // Group by some category (branch for hearse, type for others)
  const groups = {};
  dayBks.forEach(bk => {
    const key = bk.branch || bk.coffin_type || bk.arrangement_type || bk.branch_name || "General";
    if (!groups[key]) groups[key] = [];
    groups[key].push(bk);
  });
  const allGroups = Object.entries(groups);
  if (allGroups.length === 0) allGroups.push(["—", []]);

  return (
    <div className="rounded-2xl border border-[#E2E8F0] flex flex-col overflow-auto h-full min-h-full shadow-lg" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Sticky time header */}
      <div className="flex shrink-0 border-b border-[#E2E8F0]" style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "#FFFFFF" }}>
        <div className="shrink-0 border-r border-[#E2E8F0] p-3 flex items-end" style={{ width: 144 }}>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {mod.id === 'hearse' ? 'Fleet' : mod.label} · {format(currentDate, "d MMM")}
          </span>
        </div>
        <div style={{ width: timelineW, position: "relative", height: 44 }}>
          {Array.from({ length: DAY_TOTAL + 1 }, (_, i) => i + DAY_START).map(h => (
            <div key={h} className="absolute top-0 bottom-0 flex items-end pb-1.5" style={{ left: (h - DAY_START) * HOUR_PX }}>
              <div className="absolute top-0 bottom-0 left-0 w-px bg-[#E2E8F0]" />
              <span className="text-[10px] font-mono pl-1.5 text-slate-500">{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>
      </div>

      {/* Groups */}
      {allGroups.map(([grpName, grpBks]) => {
        const live = grpBks.find(b => b.status === "in_transit" || b.status === "delayed" || b.status === "in_progress");
        
        return (
          <div key={grpName} className="flex border-b border-[#E2E8F0]" style={{ minHeight: 70 }}>
            {/* Sticky left label */}
            <div className="shrink-0 border-r border-[#E2E8F0] p-3 flex flex-col justify-center" style={{ width: 144, position: "sticky", left: 0, backgroundColor: "#FFFFFF", zIndex: 5 }}>
              <div className="flex items-center gap-1.5">
                {mod.id === 'hearse' && <Truck size={12} className="text-indigo-400" />}
                <span className="text-xs font-mono font-semibold text-slate-400">{grpName}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{grpBks.length} booking{grpBks.length !== 1 ? "s" : ""}</div>
              {live && (
                <div className="text-[10px] font-semibold mt-1" style={{ color: SM[live.status]?.color || mod.accent }}>
                  ● {SM[live.status]?.label || live.status}
                </div>
              )}
            </div>
            
            {/* Timeline area */}
            <div style={{ width: timelineW, position: "relative", minHeight: 70 }}>
              {/* Hour grid lines */}
              {Array.from({ length: DAY_TOTAL }, (_, i) => (
                <div key={i} className="absolute top-0 bottom-0 w-px bg-[#E2E8F0]/50" style={{ left: (i + 1) * HOUR_PX }} />
              ))}
              
              {/* Booking blocks */}
              {grpBks.map((bk, bi) => {
                const cfg = SM[bk.status] || { color: mod.accent, label: bk.status };
                const startH = bk.start_hour || bk.pickup_hour || 8;
                const dur = bk.duration || bk.duration_hours || 2;
                const left = (startH - DAY_START) * HOUR_PX + 2;
                const width = Math.max(dur * HOUR_PX - 4, 30);
                
                return (
                  <button key={bk[mod.idField] || bi} onClick={() => onSelect(bk)}
                    className="absolute hover:opacity-75 transition-opacity text-left overflow-hidden rounded-lg px-2 py-1 flex flex-col justify-center"
                    style={{
                      top: 8, bottom: 8, left, width,
                      backgroundColor: `${cfg.color}1a`, border: `1px solid ${cfg.color}40`
                    }}>
                    <div className="font-semibold text-[10px] truncate" style={{ color: cfg.color }}>{cfg.label}</div>
                    <div className="text-[10px] truncate mt-0.5 text-slate-300">{safeName(bk, mod).split(" ")[0]}</div>
                    <div className="text-[9px] font-mono text-slate-500 mt-0.5 truncate">
                      {String(startH).padStart(2, "0")}–{String(startH + dur).padStart(2, "0")}
                    </div>
                  </button>
                );
              })}
              
              {grpBks.length === 0 && (
                <div className="absolute inset-0 flex items-center px-4">
                  <span className="text-[10px] text-slate-600">Free today</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}