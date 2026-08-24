import { format } from "date-fns";
import { X, Calendar } from "lucide-react";
import { matchesDay, safeName, hourOf } from "../utils";
import StatusPill from "./StatusPill";

/* High-end slide-in panel listing every event on a specific day */
export default function DayEventsPanel({ date, bookings, mod, onSelect, onClose }) {
  const ds = format(date, "yyyy-MM-dd");
  const SM = mod.statusMap;
  const dayBks = bookings
    .filter((b) => matchesDay(b, mod, ds))
    .sort((a, b) => {
      const ha = hourOf(a);
      const hb = hourOf(b);
      if (ha !== hb) return ha - hb;
      return String(safeName(a, mod)).localeCompare(String(safeName(b, mod)));
    });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[180] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-[190] flex flex-col border-l shadow-2xl"
        style={{
          width: 420,
          maxWidth: "100vw",
          backgroundColor: "#FFFFFF",
          borderColor: "rgba(15,23,42,0.08)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-5 border-b flex items-start justify-between gap-3"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${mod.accent}28 0%, ${mod.accent}08 100%)`,
                border: `1px solid ${mod.accent}28`,
              }}
            >
              <Calendar size={16} color={mod.accent} />
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-600 mb-0.5">
                {ds} · {mod.label}
              </div>
              <div className="text-base font-semibold text-slate-200">
                {format(date, "EEEE, d MMMM")}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">
                {dayBks.length} event{dayBks.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/8 border border-transparent hover:border-white/10 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {dayBks.length > 0 && (
            dayBks.map((bk) => {
              const cfg = SM[bk.status] || { label: bk.status, color: "#64748B" };
              const sub = bk.branch || bk.branch_name || bk.coffin_type || bk.arrangement_type;
              const hr = hourOf(bk);
              return (
                <button
                  key={bk[mod.idField] || bk.id}
                  className="rp-event-chip w-full text-left rounded-xl p-4 border transition-all"
                  onClick={() => onSelect(bk)}
                  style={{
                    background: `linear-gradient(135deg, ${cfg.color}14 0%, rgba(7,12,24,0.8) 100%)`,
                    borderColor: `${cfg.color}28`,
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: cfg.color,
                        boxShadow: `0 0 8px ${cfg.color}80`,
                      }}
                    />
                    <span className="flex-1 text-sm font-semibold text-slate-200 truncate">
                      {safeName(bk, mod)}
                    </span>
                    <StatusPill status={bk.status} mod={mod} />
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    <span className="text-[10px] font-mono text-slate-600">
                      {bk[mod.idField] || bk.id}
                    </span>
                    {hr != null && (
                      <span className="text-[10px] font-mono text-slate-500">
                        {String(hr).padStart(2, "0")}:00
                      </span>
                    )}
                    {sub && (
                      <span className="text-[10px] text-slate-500 truncate">
                        {sub}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}