import { format } from "date-fns";
import { CalendarDays, CalendarRange, Clock } from "lucide-react";

const VIEW_OPTIONS = [
  { id: "month", label: "Month View", Icon: CalendarDays },
  { id: "week", label: "Week View", Icon: CalendarRange },
  { id: "day", label: "Day View", Icon: Clock },
];

/* High-end filter sidebar */
export default function FilterSidebar({ view, setView, SM, activeStatuses, toggleStatus, stats, mod, todayBks }) {
  return (
    <aside
      className="flex flex-col overflow-y-auto flex-shrink-0 border-r"
      style={{
        width: 220,
        backgroundColor: "#FFFFFF",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* View switcher */}
      <div className="p-4 border-b" style={{ borderColor: "rgba(15,23,42,0.05)" }}>
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-3 px-1">
          Calendar View
        </div>
        <div className="space-y-1">
          {VIEW_OPTIONS.map(({ id, label, Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-left transition-all"
                style={active ? {
                  background: `linear-gradient(135deg, ${mod.accent}20 0%, ${mod.accent}08 100%)`,
                  border: `1px solid ${mod.accent}28`,
                  color: mod.accent,
                } : {
                  color: "#64748b",
                  border: "1px solid transparent",
                  backgroundColor: "transparent",
                }}
              >
                <Icon size={12} />
                <span className="text-[11px] font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status filter */}
      <div className="p-4 border-b" style={{ borderColor: "rgba(15,23,42,0.05)" }}>
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-3 px-1">
          Filter by Status
        </div>
        <div className="space-y-1">
          {Object.entries(SM).map(([k, v]) => {
            const on = activeStatuses.includes(k);
            return (
              <button
                key={k}
                onClick={() => toggleStatus(k)}
                className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 transition-all border border-transparent hover:border-white/6"
                style={{ backgroundColor: on ? `${v.color}0d` : "transparent" }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: on ? v.color : "#E2E8F0",
                    boxShadow: on ? `0 0 6px ${v.color}60` : "none",
                  }}
                />
                <span
                  className="flex-1 text-[11px] font-medium text-left"
                  style={{ color: on ? "#334155" : "#475569" }}
                >
                  {v.label}
                </span>
                <span
                  className="text-[10px] font-mono font-bold"
                  style={{ color: on ? v.color : "#334155" }}
                >
                  {stats[k] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today summary */}
      <div className="p-4">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-3 px-1">
          Today · {format(new Date(), "d MMM")}
        </div>
        <div
          className="rounded-xl p-3 border mb-3"
          style={{
            background: `linear-gradient(135deg, ${mod.accent}14 0%, ${mod.accent}04 100%)`,
            borderColor: `${mod.accent}20`,
          }}
        >
          <div className="text-3xl font-bold font-mono" style={{ color: mod.accent }}>
            {todayBks.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">bookings today</div>
        </div>
        <div className="space-y-2">
          {Object.entries(SM).map(([k, v]) => {
            const cnt = todayBks.filter((b) => b.status === k).length;
            if (!cnt) return null;
            return (
              <div key={k} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: v.color }}
                  />
                  <span className="text-[11px] text-slate-400">{v.label}</span>
                </div>
                <span
                  className="text-[11px] font-bold font-mono"
                  style={{ color: v.color }}
                >
                  {cnt}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}