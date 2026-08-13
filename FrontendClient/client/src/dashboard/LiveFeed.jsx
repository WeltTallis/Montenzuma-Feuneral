import React, { useEffect, useRef, useState } from "react";
import { Radio, ArrowRightLeft } from "lucide-react";
import {
  BRANCH_COLOR, BRANCH_NAME, EVENT_META,
  makeLiveActivity, relativeTime, tint,
} from "./data";
import { EVENT_ICON } from "./eventIcons";

/** LiveFeed — continuously refreshed stream of booking activity. */
export default function LiveFeed() {
  const [items, setItems] = useState([]);
  const [now, setNow] = useState(Date.now());
  const seeded = useRef(false);

  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      setItems(seedFeed(Date.now()));
    }
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const feed = setInterval(() => {
      setItems((prev) => [makeLiveActivity(Date.now()), ...prev].slice(0, 14));
    }, 4200);
    return () => { clearInterval(tick); clearInterval(feed); };
  }, []);

  return (
    <div className="dash-section" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="dash-section-head">
        <div className="dash-brand">
          <span
            className="dash-ico"
            style={{ width: 32, height: 32, backgroundColor: tint("var(--d-ev-service)", 14), color: "var(--d-ev-service)" }}
          >
            <Radio className="h-4 w-4" />
          </span>
          <div>
            <h2>Live Activity</h2>
            <span className="sub">All branches · real-time bookings</span>
          </div>
        </div>
        <span
          className="dash-tag"
          style={{
            background: "var(--d-secondary)",
            color: "var(--d-primary)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span className="dash-dot" style={{
            background: "var(--d-ring)",
            boxShadow: "0 0 0 0 rgba(52,152,219,.4)",
            animation: "dash-pulse 2s infinite",
          }} />
          Live
        </span>
      </div>

      <div className="dash-scroll">
        <ul className="dash-list">
          {items.map((a, idx) => {
            const meta = EVENT_META[a.type];
            const Icon = EVENT_ICON[a.type];
            const fresh = idx === 0 && now - a.at < 4500;
            const style = fresh
              ? { backgroundColor: tint(meta.color, 8), borderColor: tint(meta.color, 35) }
              : undefined;
            return (
              <li key={a.id} className="dash-rowitem" style={style}>
                <span
                  className="dash-ico"
                  style={{ backgroundColor: tint(meta.color, 14), color: meta.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="dash-rowbody">
                  <div className="dash-rowtitle" style={{ gap: 6 }}>
                    <p>{a.detail}</p>
                    {a.clash && (
                      <span className="dash-tag" style={{ backgroundColor: tint("var(--d-danger)", 14), color: "var(--d-danger)" }}>
                        <ArrowRightLeft className="h-3 w-3" /> clash
                      </span>
                    )}
                  </div>
                  <div className="dash-rowsub" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <span className="dash-branch-pill" style={{ color: BRANCH_COLOR[a.branch] || "var(--d-muted-fg)" }}>
                      <span className="dash-dot" style={{ background: BRANCH_COLOR[a.branch] || "var(--d-muted-fg)" }} />
                      {BRANCH_NAME[a.branch] || a.branch}
                    </span>
                    <span>·</span>
                    <span className="dash-mono" style={{ fontSize: 11 }}>{a.deceasedName}</span>
                    <span>·</span>
                    <span className="dash-num">{a.ref}</span>
                    {a.amountKes && (
                      <>
                        <span>·</span>
                        <span>{a.amountKes.toLocaleString("en-KE")}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="dash-mono" style={{ fontSize: 11, color: "var(--d-muted-fg)", minWidth: 64, textAlign: "right" }}>
                  {relativeTime(a.at, now)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* seed the feed with a few minutes of history */
function seedFeed(now) {
  const out = [];
  for (let i = 6; i >= 0; i--) out.push(makeLiveActivity(now - i * 9000 - i * 1234));
  return out.reverse();
}
