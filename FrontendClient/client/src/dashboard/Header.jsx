import React from "react";
import { HeartHandshake, AlertTriangle, Clock } from "lucide-react";

/** Top sticky bar: brand mark, conflict badge, live clock. */
export default function Header({ conflictsCount, clock }) {
  const timeStr = clock
    ? clock.toLocaleTimeString("en-KE", { hour12: false })
    : "--:--:--";
  const dateStr = clock
    ? `${clock.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })} · EAT`
    : "—";

  return (
    <header className="dash-header">
      <div className="dash-header-in">
        <div className="dash-brand">
          <span className="dash-brand-mark">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div>
            <h1 className="dash-serif">Umoja Funeral Home</h1>
            <p>Operations Command Center</p>
          </div>
        </div>
        <div className="dash-head-right">
          {conflictsCount > 0 && (
            <span className="dash-conflict-pill">
              <AlertTriangle className="h-3.5 w-3.5" />
              {conflictsCount} conflict{conflictsCount === 1 ? "" : "s"}
            </span>
          )}
          <div className="dash-clock">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="dash-clock-time">{timeStr}</p>
              <p className="dash-clock-date">{dateStr}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
