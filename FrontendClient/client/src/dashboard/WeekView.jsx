import React from "react";
import { AlertTriangle } from "lucide-react";
import { dateKey, EVENT_META, tint } from "./data";

const TYPES = ["intake", "release", "hearse", "coffin", "flowers", "service"];

/** WeekView — 7 day cells, stacked mini-bars by event type, conflict chip. */
export default function WeekView({ week, selected, branch, onSelect }) {
  const max = Math.max(1, ...week.map((c) => c.summary.total));
  const selKey = selected ? dateKey(selected) : null;

  return (
    <div className="dash-week">
      {week.map((cell) => {
        const isSel = cell.key === selKey;
        const total = branch === "all" ? cell.summary.total : (cell.summary.byBranch[branch] || 0);
        const height = Math.round((total / max) * 100);

        return (
          <button
            key={cell.key}
            onClick={() => onSelect(cell.date)}
            className="dash-weekbtn"
            style={isSel ? { borderColor: "var(--d-primary)", boxShadow: "0 0 0 1px var(--d-primary)" } : undefined}
          >
            <div className="dash-week-top">
              <span className="dash-week-day">{cell.label}</span>
              {cell.conflicts > 0 && (
                <span
                  className="dash-week-conflict"
                  style={{ backgroundColor: tint("var(--d-danger)", 14) }}
                >
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {cell.conflicts}
                </span>
              )}
            </div>

            <div className="dash-week-num">
              <big style={cell.isToday ? { color: "var(--d-ring)" } : undefined}>{cell.dayNum}</big>
              {cell.isToday && <small>today</small>}
            </div>

            <div className="dash-week-bar">
              <div
                className="dash-week-bar-inner"
                style={{ height: `${Math.max(height, 6)}%`, minHeight: 6 }}
              >
                {TYPES.map((t) => {
                  const c = cell.summary.counts[t];
                  if (!c) return null;
                  const share = (c / (cell.summary.total || 1)) * 100;
                  return (
                    <div
                      key={t}
                      style={{ height: `${share}%`, backgroundColor: EVENT_META[t].color }}
                    />
                  );
                })}
              </div>
            </div>

            <p className="dash-week-count">{total} event{total === 1 ? "" : "s"}</p>
          </button>
        );
      })}
    </div>
  );
}

