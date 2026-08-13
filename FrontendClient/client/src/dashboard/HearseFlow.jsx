import React from "react";
import { FLOW_STAGES, stageIndex } from "./data";

const STAGE_COLOR = "var(--d-ring)";
const DONE = "#059669";
const PENDING = "var(--d-muted-fg)";

/** HearseFlow — vertical stage tracker for a single booking. */
export default function HearseFlow({ stage, stageTimes }) {
  const cur = stageIndex(stage);
  return (
    <ol className="dash-flow" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
      {FLOW_STAGES.map((s, i) => {
        const reached = cur >= i;
        const color = reached ? DONE : PENDING;
        const time = stageTimes && stageTimes[s];
        return (
          <li key={s} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <span
              style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: reached ? color : "transparent",
                border: reached ? "none" : `2px solid ${PENDING}`,
                boxShadow: s === stage ? `0 0 0 3px ${STAGE_COLOR}22` : undefined,
              }}
            />
            <span
              style={{
                fontSize: 12, fontWeight: s === stage ? 600 : 500,
                color: reached ? "var(--d-card-fg)" : PENDING, textTransform: "capitalize", flex: 1,
              }}
            >
              {s.replace("-", " ")}
              {s === stage && (
                <span style={{ marginLeft: 6, fontSize: 10, background: `${DONE}22`, color: DONE, borderRadius: 999, padding: "1px 6px" }}>
                  current
                </span>
              )}
            </span>
            {time && time !== "—" ? (
              <span className="dash-mono" style={{ fontSize: 11, color: PENDING }}>{time}</span>
            ) : (
              <span className="dash-mono" style={{ fontSize: 11, color: "var(--d-muted-fg)" }}>—</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
