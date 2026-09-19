import { useMemo, useEffect, useState } from "react";
import { fetchPostmortemsFeed, fetchReleasesFeed } from "../../api/dashboardFeedApi";

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

/* ── Flower-style row tints (mirror FlowerBookingsNew STATUS_CARD_STYLES) ──
   Released-tier items get the SAME soft-red pink (#FFCCD5) flower COMPLETED
   orders use, so done/done-out records pop at a glance. */
const DBP_TINTS = [
  { re: /(released|dispatched|buried|completed|delivered)/i, bg: "#FFCCD5", border: "#F0CDCB" },
  { re: /(cancel|reject|denied)/i,                           bg: "#FFE4E6", border: "#FECDD3" },
  { re: /(admitting|ready|transferred|transit|postponed|requested|postmortem)/i, bg: "#FDF4E3", border: "#F0DDB0" },
  { re: /(pending|admitted|booked|active|confirmed)/i,       bg: "#EFF1F3", border: "#E3E0D9" },
];

const tintOfTag = (tag) =>
  DBP_TINTS.find((t) => t.re.test(String(tag || ""))) || { bg: "#FFFFFF", border: "#EAE7E2" };

/* Initial for the thumbnail — for prefixed names like "Coffin · MUMo"
   take the letter AFTER the separator so every coffin card isn't "C". */

   
const initialOfName = (n) => {
  const s = String(n || "");
  const tail = s.includes("·") ? s.split("·").pop() : s;
  return (tail.trim().charAt(0) || "?").toUpperCase();
};

/* Local YYYY-MM-DD key — Kenya wall-clock datetimes ("YYYY-MM-DD HH:mm:ss",
   Africa/Nairobi, fixed UTC+3, see shared-utils/timestamps.ts) are parsed as
   +03:00 instants and bucketed by the BROWSER-LOCAL day, so a request made
   "now" lands on the viewer's "today" instead of drifting to "tomorrow" for
   users west of Nairobi. Date-only strings stay as-is; Z/offset ISO strings
   are real instants and converted as-is. */
const keyOf = (v) => {
  if (v == null || v === "") return "";
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return "";
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  }
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?/);
    if (m) {
      const [, y, mo, d, hh, mm, ss] = m;
      /* date-only (adm_date, dispatch_date …): already a plain calendar day */
      if (hh == null) return `${y}-${mo}-${d}`;
      /* explicit UTC marker (Z) or ±hh:mm offset → real instant, use as-is */
      const dt = /Z$|[+-]\d{2}:\d{2}$/i.test(v.trim())
        ? new Date(v.trim())
        : /* naive Kenya wall-clock → exact instant (fixed UTC+3) */
          new Date(`${y}-${mo}-${d}T${hh}:${mm}:${ss || "00"}+03:00`);
      if (!Number.isNaN(dt.getTime())) {
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      }
      return `${y}-${mo}-${d}`;
    }
  }
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

  /* ── Real postmortem REQUESTS — same feed as the profile tab.
     Legacy derivation only matched embedded `postmortem` fields,
     which real rows don't carry, so this section stayed empty. */
  const [pmRequests, setPmRequests] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchPostmortemsFeed()
      .then((rows) => { if (alive) setPmRequests(Array.isArray(rows) ? rows : []); })
      .catch(() => { /* optional feed */ });
    return () => { alive = false; };
  }, []);

  /* ── Real RELEASES — same body-checkout feed as the quad / Releases panel.
     Released bodies live in the body_releases table, so deriving handovers
     only from register rows (status / dispatch_date / release_date) left the
     section almost always empty. */
  const [releaseFeed, setReleaseFeed] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchReleasesFeed()
      .then((rows) => { if (alive) setReleaseFeed(Array.isArray(rows) ? rows : []); })
      .catch(() => { /* optional feed */ });
    return () => { alive = false; };
  }, []);

  const relFeedItems = useMemo(() => releaseFeed.map((q) => {
    const adm = q?.admission_number || q?.admission_no || "";
    return {
      id: adm ? `rel-${adm}` : `rel-feed-${q?.release_id || q?.id}`,
      name: q?.name_of_deceased || q?.deceased_name || q?.full_name || q?.received_by || "Unknown",
      meta: adm,
      sub: q?.next_kin || q?.received_by || q?.mode_of_transport || "",
      tag: "Released",
      _key: keyOf(q?.date_of_removal || q?.release_date || q?.created_at),
      ...(q || {}),
    };
  }), [releaseFeed]);
  const relFeedNums = useMemo(() => new Set(relFeedItems.map((r) => String(r.meta)).filter(Boolean)), [relFeedItems]);

  const dIndex = useMemo(() => {
    const m = new Map();
    (Array.isArray(sources?.deceased) ? sources.deceased : []).forEach((r) => {
      if (r?.deceased_id != null) m.set(String(r.deceased_id), r);
      if (r?.id != null) m.set(String(r.id), r);
      if (r?.admission_number) m.set(String(r.admission_number), r);
    });
    return m;
  }, [sources]);

  const pmReqItems = useMemo(() => pmRequests.map((q) => {
    const rec = dIndex.get(String(q?.deceased_id)) || null;
    const num = rec?.admission_number || "";
    const status = String(q?.status || "initiated").toLowerCase();
    /* exam_status comes from the official postmortem table (joined by the API) —
       a request whose exam has been completed must show Completed, not Awaiting */
    const exam = String(q?.exam_status || "").toLowerCase();
    const completed = exam === "completed";
    return {
      id: num ? `pm-${num}` : `pm-req-${q?.id}`,
      name: rec?.full_name || q?.requested_by || "Unknown",
      meta: num || q?.request_ref || "",
      sub: [q?.reason, q?.requesting_authority].filter(Boolean).join(" · ") || `Requested by ${q?.requested_by || "—"}`,
      tag: status === "cancelled" ? "Cancelled" : completed ? "Completed" : status === "sent" ? "Awaiting Exam" : "Requested",
      _key: keyOf(q?.created_at || q?.updated_at),
      /* raw tracker payload — carried to the side panel for full details */
      pm_request: {
        id: q?.id,
        request_ref: q?.request_ref,
        reason: q?.reason,
        requesting_authority: q?.requesting_authority,
        requested_by: q?.requested_by,
        status: q?.status || "initiated",
        created_at: q?.created_at,
        sent_at: q?.sent_at,
        exam_status: q?.exam_status || null,
        exam_completed_at: q?.exam_completed_at || null,
      },
    };
  }), [pmRequests, dIndex]);

  const pmReqNums = useMemo(() => new Set(pmReqItems.map((p) => String(p.meta)).filter(Boolean)), [pmReqItems]);

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

    /* Releases — real handovers from the body-checkout feed first, with
       legacy derived rows only where no feed row covers them */
    const releases = [
      ...relFeedItems
        .filter((r) => r._key === activeKey)
        .map(({ _key, ...rest }) => rest),
      ...deceased
        .filter((r) => isReleased(r) && relKeyOf(r) === activeKey && !relFeedNums.has(String(r?.admission_number || "")))
        .map((r, i) => ({
          id: `rel-${r?.admission_number ?? r?.id ?? i}`,
          name: r?.full_name || "Unknown",
          meta: r?.admission_number || "",
          sub: r?.destination || r?.release_to || r?.next_kin || "",
          tag: String(r?.status || r?.admission_status || "Released"),
        })),
    ];

    /* Postmortem / Body requests — real tracked requests first,
       legacy derived rows only where no request covers them */
    const postmortems = [
      ...pmReqItems
        .filter((p) => p._key === activeKey)
        .map(({ _key, ...rest }) => rest),
      ...deceased
        .map((r, i) => ({ r, i, pm: pmMetaOf(r) }))
        .filter(({ r, pm }) => pm && pm.key === activeKey && !pmReqNums.has(String(r?.admission_number || "")))
        .map(({ r, i, pm }) => ({
          id: `pm-${r?.admission_number ?? r?.id ?? i}`,
          name: r?.full_name || "Unknown",
          meta: r?.admission_number || "",
          sub: r?.cause_of_death || r?.body_status || "",
          tag: pm.completed ? "Completed" : "Pending",
          tagColor: pm.completed ? "#22c55e" : "#f59e0b",
        })),
    ];

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
        /* coffin bookings are stored as 'active' (live reservation) — show the
           same friendly labels the Reservation Dashboard uses */
        tag: (function (s) {
          const v = String(s || "").toLowerCase();
          if (v === "active" || v === "booked" || v === "approved" || v === "confirmed" || v === "reserved") return "Confirmed";
          if (v === "completed" || v === "delivered" || v === "done") return "Completed";
          if (v === "cancelled" || v === "canceled" || v === "rejected") return "Cancelled";
          if (v === "pending") return "Pending";
          return s ? String(s) : "Booking";
        })(o?.status),
      }));

    return [
      { key: "intakes", title: "Deceased Intakes", color: "#3b82f6", items: intakes },
      { key: "releases", title: "Releases", color: "#22c55e", items: releases },
      { key: "postmortems", title: "Postmortem / Body Requests", color: "#8b5cf6", items: postmortems },
      { key: "bookings", title: "Coffin Bookings", color: "#f59e0b", items: bookings },
    ];
  }, [sources, activeKey, pmReqItems, pmReqNums, relFeedItems, relFeedNums]);

  const total = sections.reduce((s, sec) => s + sec.items.length, 0);

  /* Category descriptor built from only the sections that actually carry
     items — a tab whose coffins source is empty never advertises
     "bookings" (and an empty day says so plainly). */
  const CAT_LABELS = {
    intakes: "intakes",
    releases: "releases",
    postmortems: "postmortem requests",
    bookings: "coffin bookings",
  };
  const presentCats = sections
    .filter((sec) => sec.items.length)
    .map((sec) => CAT_LABELS[sec.key] || sec.title.toLowerCase());
  const catsLabel =
    presentCats.length === 0
      ? "no activity"
      : presentCats.length === 1
        ? presentCats[0]
        : `${presentCats.slice(0, -1).join(", ")} & ${presentCats[presentCats.length - 1]}`;

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
              : `${total} event${total !== 1 ? "s" : ""} · ${catsLabel}`}
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
              Pick another day on the calendar — the activity for that day will appear here.
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
                                    {sec.items.map((it) => {
                      const rowTint = tintOfTag(it.tag);
                      return (
                      <div
                        key={it.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 12px", borderRadius: 16,
                          background: rowTint.bg,
                          border: `1px solid ${rowTint.border}`,
                          boxShadow: "0 1px 3px rgba(28,26,23,0.04)",
                          transition: "all .25s ease",
                          cursor: onSelect ? "pointer" : "default",
                        }}
                        onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(it, sec.key); } : undefined}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 5px 14px rgba(28,26,23,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(28,26,23,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
                      >
                        {/* Initials thumb — flower-card media slot */}
                        <span style={{
                          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                          background: "#1C1A17",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 15, fontWeight: 700, color: "#B08D57",
                        }}>
                          {initialOfName(it.name)}
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 13.5, fontWeight: 600, color: "#1C1A17",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {it.name}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, minWidth: 0 }}>
                            {it.meta && (
                              <span style={{
                                fontSize: 10, fontWeight: 600, color: "#574F47",
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              }}>
                                {it.meta}
                              </span>
                            )}
                            {it.sub && (
                              <span style={{
                                fontSize: 10, color: "#9C9389", whiteSpace: "nowrap",
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
                          padding: "3px 9px", borderRadius: 999,
                          color: it.tagColor || sec.color,
                          background: `${it.tagColor || sec.color}18`,
                          border: `1px solid ${it.tagColor || sec.color}30`,
                        }}>
                          {it.tag}
                        </span>
                      </div>
                      );
                    })}
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



