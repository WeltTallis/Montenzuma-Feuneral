import React, { useState, useMemo } from "react";
import { Search, BedDouble, ArrowRightLeft, Truck, Package, Flower2, Church } from "lucide-react";
import { EVENT_META, BRANCH_COLOR, BRANCH_NAME, tint } from "./data";

const eventIcons = {
  intake: BedDouble, release: ArrowRightLeft, hearse: Truck,
  coffin: Package, flowers: Flower2, service: Church,
};

const FILTERS = ["all", "intake", "release", "hearse", "coffin", "flowers", "service"];

/** DayTimeline — sorted schedule of events for the selected day, filterable + searchable. */
export default function DayTimeline({ events, conflicts, dateLabel }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const conflictIds = useMemo(() => {
    const s = new Set();
    for (const c of conflicts) for (const e of c.events) s.add(e.id);
    return s;
  }, [conflicts]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (filter !== "all" && e.type !== filter) return false;
      if (q && !`${e.deceasedName} ${e.ref} ${e.detail}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, filter, query]);


  return (
    <div className="dash-section">
      <div className="dash-section-head">
        <h2>Day Schedule</h2>
        <span className="sub">{dateLabel}</span>
      </div>
      <div style={{ padding: 14, paddingBottom: 8 }}>
        <div className="dash-search">
          <Search className="h-3.5 w-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ref…"
          />
        </div>
        <div className="dash-filters" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {FILTERS.map((f) => {
            const active = filter === f;
            const color = f === "all" ? "var(--d-ring)" : EVENT_META[f].color;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={active ? "dash-filterbtn active" : "dash-filterbtn"}
                style={active ? { borderColor: color, backgroundColor: tint(color, 14), color } : undefined}
              >
                {f === "all" ? "All" : EVENT_META[f].short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="dash-scroll">
        <ul className="dash-list">
          {shown.map((e, i) => {
            const Icon = eventIcons[e.type];
            const meta = EVENT_META[e.type];
            const clash = conflictIds.has(e.id);
            const brColor = BRANCH_COLOR[e.branch] || "var(--d-muted-fg)";
            const bg = clash ? tint("var(--d-danger)", 5) : undefined;
            const border = clash ? tint("var(--d-danger)", 35) : undefined;

            return (
              <li
                key={`${e.id}-${i}`}
                className={`dash-rowitem ${clash ? "clash" : ""}`}
                style={{ backgroundColor: bg, borderColor: border }}
              >
                <div className="dash-time">
                  <b>{e.time}</b>
                  <small>{e.durationMin}m</small>
                </div>
                <span
                  className="dash-ico"
                  style={{ backgroundColor: tint(meta.color, 14), color: meta.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="dash-rowbody">
                  <div className="dash-rowtitle">
                    <p>{e.deceasedName}</p>
                    {clash && (
                      <span
                        className="dash-tag"
                        style={{ backgroundColor: tint("var(--d-danger)", 14), color: "var(--d-danger)" }}
                      >
                        conflict
                      </span>
                    )}
                  </div>
                  <p className="dash-rowsub">{meta.short} · {e.detail} · {e.status}</p>
                </div>
                <div className="dash-branch-pill" style={{ color: brColor }}>
                  <span className="dash-dot" style={{ background: brColor }} />
                  {BRANCH_NAME[e.branch] || e.branch}
                </div>
              </li>
            );
          })}
          {shown.length === 0 && (
            <div className="dash-empty">
              <p>No events match this filter.</p>
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}
