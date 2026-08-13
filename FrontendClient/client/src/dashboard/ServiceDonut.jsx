import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getServiceDistribution } from "./data";

/** ServiceDonut — share of hearse/coffin/flowers/chapel bookings for the day. */
export default function ServiceDonut({ events }) {
  const data = useMemo(() => getServiceDistribution(events), [events]);
  const total = useMemo(() => data.reduce((a, d) => a + d.value, 0), [data]);

  return (
    <div className="dash-card" style={{ padding: 0 }}>
      <div className="dash-card-head">
        <h3>Service mix</h3>
        <span className="dash-muted-fg" style={{ fontSize: 12 }}>
          Hearse, coffin, floral &amp; chapel bookings
        </span>
      </div>
      <div
        className="dash-chart-legend"
        style={{ flexDirection: "row", justifyContent: "space-around" }}
      >
        <div style={{ position: "relative", width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={58}
                outerRadius={88}
                strokeWidth={2}
                paddingAngle={2}
              >
                {data.map((d, i) => (
                  <Cell key={`cell-${i}`} fill={d.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--d-card-fg)" }}>{total}</div>
            <div style={{ fontSize: 11, color: "var(--d-muted-fg)" }}>bookings</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.map((d) => (
            <div key={d.type} className="dash-branch-pill">
              <span className="dash-dot" style={{ background: d.fill }} />
              <span style={{ color: "var(--d-muted-fg)" }}>{d.label}</span>
              <strong className="dash-num">{d.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
