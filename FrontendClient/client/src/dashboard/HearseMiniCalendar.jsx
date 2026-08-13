import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateKey } from "./data";

const WEEK_HEADS = ["M", "T", "W", "T", "F", "S", "S"];

/** HearseMiniCalendar — a small per-hearse calendar showing which days it is booked. */
export default function HearseMiniCalendar({ bookings, color }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(() => dateKey(today));

  const bookedKeys = useMemo(() => new Set((bookings || []).map((b) => b.date)), [bookings]);
  const todayKey = today ? dateKey(today) : "";

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startDow = (first.getDay() + 6) % 7; // Mon-first
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < startDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    return arr;
  }, [cursor]);

  const selectedBookings = (bookings || []).filter((b) => b.date === selected);
  const colorTint = `color-mix(in srgb, ${color} 14%, transparent)`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{cursor.toLocaleDateString("en-KE", { month: "long", year: "numeric" })}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button" aria-label="Previous month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            style={navBtn}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button" aria-label="Next month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            style={navBtn}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, textAlign: "center" }}>
        {WEEK_HEADS.map((d, i) => (
          <span key={i} style={{ fontSize: 9, fontWeight: 600, color: "var(--d-muted-fg)" }}>{d}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const key = dateKey(d);
          const booked = bookedKeys.has(key);
          const isToday = key === todayKey;
          const isSel = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              style={{
                position: "relative", height: 24, borderRadius: 6, fontSize: 10, fontVariantNumeric: "tabular-nums",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                fontFamily: "inherit", border: "none",
                background: isSel ? color : "transparent",
                color: isSel ? "#fff" : isToday ? "var(--d-ring)" : "var(--d-card-fg)",
                fontWeight: isToday || isSel ? 700 : 400,
              }}
            >
              {d.getDate()}
              {booked && !isSel && <span style={{ position: "absolute", bottom: 2, width: 4, height: 4, borderRadius: "50%", background: color }} />}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 10, borderTop: "1px solid var(--d-border)", paddingTop: 8 }}>
        {selectedBookings.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--d-muted-fg)", margin: 0 }}>No bookings on this day.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {selectedBookings.map((b) => (
              <li key={b.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, background: colorTint, borderRadius: 6, padding: "4px 6px" }}>
                <span className="dash-mono" style={{ color: "var(--d-muted-fg)" }}>{b.start}–{b.end}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{b.to}</span>
                <span className="dash-mono" style={{ color: "var(--d-muted-fg)" }}>{b.reference}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const navBtn = {
  display: "grid", placeItems: "center", width: 22, height: 22, borderRadius: 6,
  border: "1px solid var(--d-border)", background: "var(--d-card)", color: "var(--d-muted-fg)", cursor: "pointer",
};
