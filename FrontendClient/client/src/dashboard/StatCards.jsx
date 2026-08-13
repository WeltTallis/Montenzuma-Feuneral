import React from "react";
import { BedDouble, ArrowRightLeft, Truck, Package, Flower2, Church } from "lucide-react";
import { EVENT_META, formatKes, tint } from "./data";

const ORDER = ["intake", "release", "hearse", "coffin", "flowers", "service"];

const metaIcons = {
  intake: BedDouble, release: ArrowRightLeft, hearse: Truck,
  coffin: Package, flowers: Flower2, service: Church,
};

/**
 * StatCards — high-level day counts per event type + revenue.
 * `summary` comes from getDaySummary(); `revenue` is the day's total value.
 */
export default function StatCards({ summary, revenue }) {
  return (
    <div className="dash-stats">
      {ORDER.map((t) => {
        const meta = EVENT_META[t];
        const Icon = metaIcons[t];
        return (
          <div key={t} className="dash-stat">
            <div className="dash-stat-top">
              <span
                className="dash-stat-ico"
                style={{ backgroundColor: tint(meta.color, 14), color: meta.color }}
              >
                <Icon className="h-4 w-4" />
              </span>
                            <span className="dash-stat-val dash-num">{summary?.counts?.[t] ?? 0}</span>
            </div>
            <p className="dash-stat-txt">{meta.short}</p>
          </div>
        );
      })}
      <div className="dash-stat-rev">
        <p>Day revenue</p>
        <strong>{formatKes(revenue ?? 0)}</strong>
      </div>
    </div>
  );
}
