import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getBranchBreakdown, EVENT_META } from "./data";

/** BranchBarChart — stacked activity by branch for the selected day. */
export default function BranchBarChart({ events }) {
  const data = useMemo(() => getBranchBreakdown(events), [events]);
  const keys = ["intake", "release", "hearse", "coffin", "flowers", "service"];

  return (
    <div className="dash-card" style={{ padding: 0 }}>
      <div className="dash-card-head">
        <h3>Bookings by branch</h3>
        <span className="dash-muted-fg" style={{ fontSize: 12 }}>
          Stacked activity across Nairobi, Machakos and Thika
        </span>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <XAxis dataKey="branch" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {keys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                stackId="a"
                fill={EVENT_META[k].color}
                radius={i === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
