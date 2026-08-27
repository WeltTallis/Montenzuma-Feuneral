import { useMemo } from "react";
import { format } from "date-fns";
import MiniActivityCalendar from "./MiniCalendar";

/* ════════════════════════════════════════════════════════════════
   Deceased 2x2 Quadrant view — the DECEASED dashboard tab.

   Layout (row-major CSS grid):
     [ Calendar (top-left)      ] [ Deceased Intakes (top-right) ]
     [ Releases (bottom-left)   ] [ Postmortem Requests (bottom-right) ]

   Deceased-only. Coffin data is intentionally never received here.
   ════════════════════════════════════════════════════════════════ */

const MO = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PM_RE = /(postmortem|post-mortem|autopsy)/i;
const RELEASED_RE = /(released|dispatched|completed|buried)/i;

/* Local YYYY-MM-DD key — mirrors dashboardDataApi.toKey (no TZ shift) */
const keyOf = (v) => {
  if (v == null || v === "") return "";
  if (typeof v === "string") {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return "";
};

const todayKeyVal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const admKeyOf = (r) => keyOf(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at);
const relKeyOf = (r) => keyOf(r?.dispatch_date || r?.release_date);
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

const prettyDate = (dateKey) => {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  if (!y || !m || !d) return { day: "", short: "" };
  const dt = new Date(y, m - 1, d);
  return {
    day: WD[dt.getDay()],
    short: `${d} ${MO[m - 1]}`,
  };
};

/* Per-quadrant card tints + accents (release = flower reddish #FFCCD5). */
const QUAD = {
  intake: { title: "Deceased Intakes", accent: "#3b82f6", bg: "#EFF1F3", border: "#E3E0D9" },
  release: { title: "Releases", accent: "#e11d48", bg: "#FFCCD5", border: "#F0CDCB" },
  postmortem: { title: "Post-mortem Requests", accent: "#8b5cf6", bg: "#FDF4E3", border: "#F0DDB0" },
};

const initialOf = (name) => {
  const s = String(name || "").trim();
  if (!s) return "?";
  const tail = s.includes("\u00b7") ? s.split("\u00b7").pop() : s;
  return (tail.trim().charAt(0) || "?").toUpperCase();
};

export default function DeceasedQuad({
  events = {},
  loading = false,
  dateKey = null,
  deceased = [],
  onPickDate,
  onSelect,
}) {
  const activeKey = dateKey || todayKeyVal();
  const pd = prettyDate(activeKey);
  const onPick = typeof onPickDate === "function" ? onPickDate : () => {};

  const items = useMemo(() => {
    const intakes = deceased
      .filter((r) => admKeyOf(r) === activeKey)
      .map((r, i) => ({
        id: `in-${r?.admission_number ?? r?.id ?? i}`,
        name: r?.full_name || "Unknown",
        meta: r?.admission_number || "",
        sub: r?.branch_name || r?.place_of_death || "",
        tag: String(r?.status || r?.admission_status || "Admitted"),
      }));

    const releases = deceased
      .filter((r) => isReleased(r) && relKeyOf(r) === activeKey)
      .map((r, i) => ({
        id: `rel-${r?.admission_number ?? r?.id ?? i}`,
        name: r?.full_name || "Unknown",
        meta: r?.admission_number || "",
        sub: r?.destination || r?.release_to || r?.next_kin || "",
        tag: String(r?.status || r?.admission_status || "Released"),
      }));

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

    return { intakes, releases, postmortems };
  }, [deceased, activeKey]);

  const renderList = (key, cfg) => {
    const listItems = items[key];
    return (
      <div style={{
        background: "#FFFFFF",
        border: "1px solid rgba(15,23,42,0.08)",
        borderRadius: 16,
        boxShadow: "0 1px 0 rgba(15,23,42,0.03)",
        display: "flex", flexDirection: "column",
        minHeight: 260, overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "13px 16px", borderBottom: "1px solid rgba(15,23,42,0.07)",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.accent, flexShrink: 0, boxShadow: `0 0 8px ${cfg.accent}70` }} />
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {cfg.title}
          </span>
          <span style={{
            marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: cfg.accent,
            background: `${cfg.accent}16`, border: `1px solid ${cfg.accent}28`,
            padding: "2px 9px", borderRadius: 999, fontFamily: "monospace",
          }}>
            {listItems.length}
          </span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {listItems.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 12, padding: "26px 8px" }}>
              No {cfg.title.toLowerCase()} for {pd.short}
            </div>
          ) : listItems.map((it) => (
            <div
              key={it.id}
              onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(it, key); } : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 11,
                padding: "10px 12px", borderRadius: 16, cursor: onSelect ? "pointer" : "default",
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                boxShadow: "0 1px 3px rgba(28,26,23,0.04)",
                transition: "all .25s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 5px 14px rgba(28,26,23,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(28,26,23,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <span style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: "#1C1A17", display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "#B08D57",
              }}>
                {initialOf(it.name)}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 13.5, fontWeight: 600, color: "#1C1A17",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {it.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, minWidth: 0 }}>
                  {it.meta && <span style={{ fontSize: 10, fontWeight: 600, color: "#574F47", whiteSpace: "nowrap" }}>{it.meta}</span>}
                  {it.sub && <span style={{ fontSize: 10, color: "#9C9389", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>{it.sub}</span>}
                </div>
              </div>
              <span style={{
                flexShrink: 0, fontSize: 9, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase",
                padding: "3px 9px", borderRadius: 999,
                color: it.tagColor || cfg.accent,
                background: `${it.tagColor || cfg.accent}16`,
                border: `1px solid ${it.tagColor || cfg.accent}30`,
              }}>
                {it.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dec-quad" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, alignItems: "start" }}>
      <style>{`
        @media (max-width: 980px) {
          .dec-quad { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 700px) {
          .dec-quad { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* Q1 · Calendar (top-left) */}
      <div style={{
        background: "#FFFFFF", borderRadius: 16, border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 1px 0 rgba(15,23,42,0.03)", padding: "14px 14px 18px",
        display: "flex", flexDirection: "column", alignItems: "center", minHeight: 460,
      }}>
        <div style={{ alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: QUAD.intake.accent, boxShadow: `0 0 8px ${QUAD.intake.accent}70` }} />
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.06em" }}>Deceased Calendar</span>
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", fontFamily: "monospace" }}>{pd.day} {pd.short}</span>
        </div>
        <MiniActivityCalendar events={events} loading={loading} onPickDate={onPick} />
      </div>

      {/* Q2 · Intakes (top-right) */}
      {renderList("intakes", QUAD.intake)}

      {/* Q3 · Releases (bottom-left) */}
      {renderList("releases", QUAD.release)}

      {/* Q4 · Post-mortem Requests (bottom-right) */}
      {renderList("postmortems", QUAD.postmortem)}
    </div>
  );
}