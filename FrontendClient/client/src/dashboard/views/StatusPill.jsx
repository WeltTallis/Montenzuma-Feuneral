export default function StatusPill({ status, mod }) {
  const cfg = mod.statusMap[status] || { label: status, color: "#64748b" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
      style={{
        backgroundColor: `${cfg.color}18`,
        color: cfg.color,
        borderColor: `${cfg.color}28`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.color}80` }}
      />
      {cfg.label}
    </span>
  );
}