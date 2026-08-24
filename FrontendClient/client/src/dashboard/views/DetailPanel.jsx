import { X, Clock, Hash, Tag, Info, MapPin, User } from "lucide-react";
import StatusPill from "./StatusPill";

function safeName(booking, mod) {
  return booking[mod.clientField] || booking.client_name || booking.name || booking.id || "—";
}

function FieldRow({ icon: Icon, label, value }) {
  if (!value || value === "—" || value === "null") return null;
  return (
    <div className="flex gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center mt-0.5">
        <Icon size={11} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-0.5">
          {label.replace(/_/g, " ")}
        </div>
        <div className="text-[13px] text-slate-300 break-words">{String(value)}</div>
      </div>
    </div>
  );
}

export default function DetailPanel({ booking, mod, onClose }) {
  const SM = mod.statusMap;
  const cfg = SM[booking.status] || { label: booking.status, color: "#64748B" };
  const fields = Object.entries(booking).filter(
    ([k]) => !["id", mod.idField, "status"].includes(k) && typeof booking[k] !== "object"
  );

  const iconMap = (key) => {
    if (key.includes("date") || key.includes("time")) return Clock;
    if (key.includes("name") || key.includes("client")) return User;
    if (key.includes("location") || key.includes("address")) return MapPin;
    if (key.includes("id") || key.includes("number")) return Hash;
    if (key.includes("type") || key.includes("status")) return Tag;
    return Info;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[190] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-[200] flex flex-col shadow-2xl border-l"
        style={{
          width: 380,
          backgroundColor: "#FFFFFF",
          borderColor: "rgba(15,23,42,0.08)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex-1 pr-3">
            <div className="text-[10px] font-mono text-slate-600 mb-1.5">
              #{booking[mod.idField] || booking.id}
            </div>
            <h3 className="text-lg font-semibold text-slate-100 leading-snug mb-3">
              {safeName(booking, mod)}
            </h3>
            <StatusPill status={booking.status} mod={mod} />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-colors border border-transparent hover:border-white/10"
          >
            <X size={15} />
          </button>
        </div>

        {/* Module badge */}
        <div
          className="flex items-center gap-3 mx-5 mt-4 mb-2 p-3 rounded-xl border"
          style={{
            backgroundColor: `${mod.accent}0d`,
            borderColor: `${mod.accent}22`,
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${mod.accent}18` }}
          >
            <mod.icon size={15} color={mod.accent} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-300">{mod.label}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {booking.branch || booking.branch_name || booking.location || "—"}
            </div>
          </div>
          <div className="ml-auto">
            <div
              className="text-xs font-bold px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${cfg.color}18`,
                color: cfg.color,
                border: `1px solid ${cfg.color}28`,
              }}
            >
              {cfg.label}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 py-3">
            Details
          </div>
          <div
            className="rounded-xl border p-1"
            style={{
              backgroundColor: "rgba(255,255,255,0.02)",
              borderColor: "rgba(15,23,42,0.05)",
            }}
          >
            {fields.map(([k, v]) => (
              <FieldRow
                key={k}
                icon={iconMap(k)}
                label={k}
                value={String(v || "—")}
              />
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="flex gap-2 px-5 py-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
            style={{
              backgroundColor: `${mod.accent}18`,
              color: mod.accent,
              borderColor: `${mod.accent}30`,
            }}
          >
            View Full Record
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/8 text-slate-400 hover:text-slate-200 hover:bg-white/6 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}