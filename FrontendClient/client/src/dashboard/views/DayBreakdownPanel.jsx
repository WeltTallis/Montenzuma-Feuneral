import { useMemo } from "react";

/* ════════════════════════════════════════════════════════════════
   Day Breakdown Panel — rendered beside the Mini Activity Calendar
   on the Coffin / Deceased dashboard tabs.

   Shows EVERY event of the selected day grouped into dedicated
   panels: Deceased Intakes, Releases, Postmortem / Body Requests,
   and Coffin Bookings. Falls back to TODAY when no day is picked.

   Props:
     dateKey  'YYYY-MM-DD' | null (null → today)
     sources  { coffins: [...orders], deceased: [...records] }
     loading  boolean
     onClose  () => void  (deselect picked day)
   ════════════════════════════════════════════════════════════════ */

const MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WD = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const PM_RE = /(postmortem|post-mortem|autopsy)/i;
const RELEASED_RE = /(released|dispatched|completed|buried)/i;

/* Local YYYY-MM-DD key — mirrors dashboardDataApi.toKey (no TZ shift) */
const keyOf = (v) => {
  if (v == null || v === "") return "";
  if (typeof v === "string") {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const dt = new Date(v);
    if (!Number.isNaN(dt.getTime())) {
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    }
    return "";
  }
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  }
  return "";
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/* Deceased field helpers (mirror dashboardDataApi.js conventions) */
const admKeyOf = (r) =>
  keyOf(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at);

const relKeyOf = (r) =>
  keyOf(r?.dispatch_date || r?.release_date);

const isReleased = (r) =>
  RELEASED_RE.test(String(r?.status || r?.admission_status || "").toLowerCase());

const pmMetaOf = (r) => {
  const pm = r?.postmortem || null;
  const bodyStr = `${r?.body_status || ""} ${r?.admission_status || ""}`.toLowerCase();
  const requested =
    r?.postmortem_requested === true ||
    r?.postmortem_requested === 1 ||
    Boolean(pm?.requested_at || pm?.created_at) ||
    PM_RE.test(bodyStr);
  if (!requested) return null;
  const completed =
    r?.postmortem_completed === true ||
    r?.postmortem_completed === 1 ||
    pm?.status === "completed" ||
    /done|complete/i.test(String(r?.postmortem_report || ""));
  return {
    key: keyOf(pm?.requested_at || pm?.created_at || r?.postmortem_date || r?.adm_date || r?.date_admitted || r?.created_at),
    completed,
  };
};

const coffinKeyOf = (o) =>
  keyOf(o?.service_date || o?.order_date || o?.created_at);

const prettyDate = (dateKey) => {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  if (!y || !m || !d) return { day: dateKey, short: dateKey };
  const dt = new Date(y, m - 1, d);
  return {
    day: WD[dt.getDay()],
    short: `${d} ${MO[m - 1]}${y !== new Date().getFullYear() ? ` ${y}` : ""}`,
  };
};
export default function DayBreakdownPanel({
  dateKey = null,
  sources = { coffins: [], deceased: [] },
  loading = false,
  onClose,
  onSelect,
}) {
  const tk = todayKey();
  const activeKey = dateKey || tk;

  const sections = useMemo(() => {
    const deceased = Array.isArray(sources?.deceased) ? sources.deceased : [];
    const coffins = Array.isArray(sources?.coffins) ? sources.coffins : [];

    /* Deceased Intakes — admitted on the selected day */
    const intakes = deceased
      .filter((r) => admKeyOf(r) === activeKey)
      .map((r, i) => ({
        id: `in-${r?.admission_number ?? r?.id ?? i}`,
        name: r?.full_name || "Unknown",
        meta: r?.admission_number || "",
        sub: r?.branch_name || r?.place_of_death || "",
        tag: String(r?.status || r?.admission_status || "Admitted"),
      }));

    /* Releases — released / dispatched / buried on the selected day */
    const releases = deceased
      .filter((r) => isReleased(r) && relKeyOf(r) === activeKey)
      .map((r, i) => ({
        id: `rel-${r?.admission_number ?? r?.id ?? i}`,
        name: r?.full_name || "Unknown",
        meta: r?.admission_number || "",
        sub: r?.destination || r?.release_to || r?.next_kin || "",
        tag: String(r?.status || r?.admission_status || "Released"),
      }));

    /* Postmortem / Body requests */
    const postmortems = deceased
      .map((r, i) => ({ r, i, pm: pmMetaOf(r) }))
      .filter(({ pm }) => pm && pm.key === activeKey)
      .map(({ r, i, pm }) => ({
        id: `pm-${r?.admission_number ?? r?.id ?? i}`,
        name: r?.full_name || "Unknown",
        meta: r?.admission_number || "",
        sub: r?.cause_of_death || r?.body_status || "",
        tag: pm.completed ? "Completed" : "Pending",
        tagColor: pm.completed ? "#22c55e" : "#f59e0b",
      }));

    /* Coffin bookings for the day */
    const bookings = coffins
      .filter((o) => coffinKeyOf(o) === activeKey)
      .map((o, i) => ({
        id: `cf-${o?.order_id ?? o?.id ?? i}`,
        name: o?.deceased_name
          ? `Coffin · ${o.deceased_name}`
          : `Coffin order · ${o?.client_name || o?.coffin_name || "booking"}`,
        meta: o?.order_id || o?.id || "",
        sub: o?.coffin_name || o?.branch_name || "",
        tag: String(o?.status || "Booking"),
      }));

    return [
      { key: "intakes", title: "Deceased Intakes", color: "#3b82f6", items: intakes },
      { key: "releases", title: "Releases", color: "#22c55e", items: releases },
      { key: "postmortems", title: "Postmortem / Body Requests", color: "#8b5cf6", items: postmortems },
      { key: "bookings", title: "Coffin Bookings", color: "#f59e0b", items: bookings },
    ];
  }, [sources, activeKey]);

  const total = sections.reduce((s, sec) => s + sec.items.length, 0);
  const pd = prettyDate(activeKey);
  const isToday = activeKey === tk;
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      background: "#FFFFFF", borderRadius: 14,
      border: "1px solid rgba(15,23,42,0.08)",
      boxShadow: "0 1px 0 rgba(15,23,42,0.03)",
      padding: "16px 18px", height: "100%", minHeight: 320,
      boxSizing: "border-box", overflow: "hidden",
      fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        paddingBottom: 12, borderBottom: "1px solid rgba(15,23,42,0.07)",
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.2px" }}>
              {pd.day}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "#475569" }}>
              {pd.short}
            </span>
            {isToday && (
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
                color: "#FFFFFF", background: "#6366f1",
                padding: "2px 8px", borderRadius: 999,
                boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
              }}>
                TODAY
              </span>
            )}
          </div>
          <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 3 }}>
            {loading
              ? "Loading day activity…"
              : `${total} event${total !== 1 ? "s" : ""} · intakes, releases, postmortem requests & bookings`}
          </div>
        </div>
        {!loading && !isToday && (
          <span style={{
            fontSize: 9.5, fontWeight: 700, fontFamily: "monospace",
            color: total ? "#0F172A" : "#94A3B8",
            background: total ? "rgba(99,102,241,0.10)" : "rgba(15,23,42,0.05)",
            border: "1px solid rgba(99,102,241,0.22)",
            padding: "3px 9px", borderRadius: 999, flexShrink: 0,
          }}>
            {total}
          </span>
        )}
        {dateKey && onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Back to today"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 26, height: 26, borderRadius: 8, cursor: "pointer",
              background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)",
              color: "#64748B", flexShrink: 0, transition: "all 0.12s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(15,23,42,0.08)"; e.currentTarget.style.color = "#0F172A"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(15,23,42,0.04)"; e.currentTarget.style.color = "#64748B"; }}
          >
            ✕
          </button>
        )}
      </div>
      {/* Panels */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 12, paddingRight: 2 }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                height: 58, borderRadius: 12,
                background: "linear-gradient(90deg,#F1F5F9 25%,#E9EEF5 50%,#F1F5F9 75%)",
                backgroundSize: "200% 100%",
                animation: "dbp-shimmer 1.4s ease infinite",
                animationDelay: `${i * 0.12}s`,
              }} />
            ))}
          </div>
        ) : total === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 6, padding: "44px 10px", textAlign: "center",
          }}>
            <span style={{ fontSize: 26 }}>🗓️</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}>
              No activity on this day
            </span>
            <span style={{ fontSize: 11, color: "#64748B", maxWidth: 280 }}>
              Pick another day on the calendar — intakes, releases, postmortem requests and coffin bookings will appear here.
            </span>
          </div>
        ) : (
          sections.map((sec) => {
            if (!sec.items.length) return null;
            return (
              <div key={sec.key} style={{ marginBottom: 14 }}>
                {/* Section head */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: sec.color, flexShrink: 0,
                    boxShadow: `0 0 8px ${sec.color}70`,
                  }} />
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: "#334155",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                  }}>
                    {sec.title}
                  </span>
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, fontFamily: "monospace",
                    color: sec.color, background: `${sec.color}16`,
                    padding: "1px 7px", borderRadius: 999,
                  }}>
                    {sec.items.length}
                  </span>
                  <span style={{ flex: 1, height: 1, background: "rgba(15,23,42,0.07)" }} />
                </div>
                {/* Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {sec.items.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 11px", borderRadius: 11,
                        border: "1px solid rgba(15,23,42,0.05)", background: "#FBFCFE",
                        transition: "background 0.12s ease",
                        cursor: onSelect ? "pointer" : "default",
                      }}
                      onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(it, sec.key); } : undefined}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#FBFCFE"; }}
                    >
                      <span style={{
                        width: 4, alignSelf: "stretch", minHeight: 32, borderRadius: 4,
                        background: sec.color, flexShrink: 0,
                      }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: 12.5, fontWeight: 700, color: "#0F172A",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {it.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          {it.meta && (
                            <span style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>
                              {it.meta}
                            </span>
                          )}
                          {it.sub && (
                            <span style={{
                              fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap",
                              overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150,
                            }}>
                              {it.sub}
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{
                        flexShrink: 0, fontSize: 9, fontWeight: 800,
                        letterSpacing: "0.05em", textTransform: "uppercase",
                        padding: "3px 8px", borderRadius: 999,
                        color: it.tagColor || sec.color,
                        background: `${it.tagColor || sec.color}16`,
                        border: `1px solid ${it.tagColor || sec.color}30`,
                      }}>
                        {it.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes dbp-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}



