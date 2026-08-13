import React from "react";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import { BRANCHES, BRANCH_COLOR, dateKey } from "./data";

export default function Controls({ selected, view, branch, onView, onBranch, onShift, onSelected }) {
  const shift = (days) => {
    const d = new Date(selected);
    d.setDate(d.getDate() + (view === "week" ? days * 7 : days));
    onShift(d);
  };

  const viewLabel = view === "week" ? "Week of" : "Operations for";
  const dateLabel = selected.toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const today = new Date();

  const toggleView = (v) => onView(v);
  return (
    <div className="dash-controls">
      <div className="dash-nav">
        <button aria-label="Previous" onClick={() => shift(-1)} className="dash-nav-btn">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button aria-label="Next" onClick={() => shift(1)} className="dash-nav-btn">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="dash-date-label">
        <p>{viewLabel}</p>
        <h2 className="dash-serif">{dateLabel}</h2>
      </div>
      <div className="dash-toggle">
        <button
          className={view === "day" ? "active" : ""}
          onClick={() => toggleView("day")}
        >
          <CalendarRange className="h-4 w-4" /> Day
        </button>
        <button
          className={view === "week" ? "active" : ""}
          onClick={() => toggleView("week")}
        >
          <CalendarRange className="h-4 w-4" /> Week
        </button>
      </div>
      <div className="dash-btabs">
        <button
          className={branch === "all" ? "dash-btab active" : "dash-btab"}
          onClick={() => onBranch("all")}
        >
          <span className="bt-dot" style={{ background: "var(--d-primary)" }} />
          All branches
        </button>
        {BRANCHES.map((b) => (
          <button
            key={b.id}
            className={branch === b.id ? "dash-btab active" : "dash-btab"}
            onClick={() => onBranch(b.id)}
          >
            <span className="bt-dot" style={{ background: BRANCH_COLOR[b.id] }} />
            {b.name}
          </button>
        ))}
      </div>
      <button
        className="dash-jump"
        onClick={() => { onSelected(today); onShift(today); }}
      >
        Jump to today
      </button>
    </div>
  );
}

// re-export to avoid an unused import warning if extended later
export const _dateKey = dateKey;
