import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getWeekTrend, EVENT_META } from "./data";

/** TrendChart — 7-day operation trend (areas). */
export default function TrendChart({ date }) {
  const data = useMemo(() => getWeekTrend(date), [date]);
  const keys = [
    { k: "bookings", color: EVENT_META.service.color, label: "Service bookings" },
    { k: "intakes", color: EVENT_META.intake.color, label: "Intakes" },
    { k: "releases", color: EVENT_META.release.color, label: "Releases" },
  ];

  return (
    <div className="dash-card" style={{ padding: 0 }}>
      <div className="dash-card-head">
        <h3>7-day operations trend</h3>
        <span className="dash-muted-fg" style={{ fontSize: 12 }}>
          Intakes, releases and service bookings across the week
        </span>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              {keys.map((kk) => (
                <linearGradient key={kk.k} id={`fill-${kk.k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={kk.color} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={kk.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {keys.map((kk) => (
              <Area
                key={kk.k}
                type="monotone"
                dataKey={kk.k}
                stroke={kk.color}
                strokeWidth={2}
                fill={`url(#fill-${kk.k})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
