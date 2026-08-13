import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateKey, detectConflicts, getEventsForDate, tint } from "./data";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** MiniCalendar — month navigation, day cells with density dots + conflict markers. */
export default function MiniCalendar({ selected, onSelect }) {
  const [view, setView] = useState(startOfMonth(selected));
  const today = new Date();
  const first = startOfMonth(view);
  const startPad = first.getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d));

  const density = (load) => (load > 22 ? 3 : load > 14 ? 2 : 1);

  return (
    <div className="dash-card" style={{ padding: 12 }}>
      <div className="dash-controls" style={{ marginBottom: 0, justifyContent: "space-between" }}>
        <p className="dash-serif" style={{ fontSize: 16, margin: 0 }}>{view.toLocaleDateString("en-KE", { month: "long", year: "numeric" })}</p>
        <div className="dash-nav">
          <button
            aria-label="Previous month"
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
            className="dash-nav-btn"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Next month"
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
            className="dash-nav-btn"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="dash-caldays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="dash-calhead">{w}</div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`pad-${i}`} />;
          const isSelected = dateKey(cell) === dateKey(selected);
          const isToday = dateKey(cell) === dateKey(today);
          const load = getEventsForDate(cell).length;
          const hasConflict = detectConflicts(getEventsForDate(cell)).length > 0;
          return (
            <button
              key={dateKey(cell)}
              type="button"
              onClick={() => { onSelect(cell); setView(startOfMonth(cell)); }}
              className="dash-calbtn"
              style={isSelected ? { background: "var(--d-primary)", color: "var(--d-primary-fg)" } : undefined}
            >
              {hasConflict && (
                <span
                  className="dash-cal-conflict"
                  style={{ background: isSelected ? "var(--d-primary-fg)" : "var(--d-danger)" }}
                  aria-label="Has conflicts"
                />
              )}
              <span className={isToday && !isSelected ? "cal-num" : undefined} style={isToday && !isSelected ? { color: "var(--d-ring)", fontWeight: 600 } : undefined}>
                {cell.getDate()}
              </span>
              <span className="dash-cal-dots">
                {Array.from({ length: density(load) }).map((_, di) => (
                  <i key={di} style={{ background: isSelected ? "var(--d-primary-fg)" : "var(--d-primary)" }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="dash-cal-foot">
        <span className="dash-legend">
          <span>Density</span>
          <span style={{ color: hasConflictColor("density") }}>●●●</span>
          <span>Conflicts</span>
        </span>
        <button
          type="button"
          onClick={() => { const now = new Date(); onSelect(now); setView(startOfMonth(now)); }}
          className="dash-jump"
        >
          Jump to today
        </button>
      </div>
    </div>
  );
}


function hasConflictColor() { return "var(--d-danger)"; }
