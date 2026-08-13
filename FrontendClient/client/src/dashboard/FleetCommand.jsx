import React, { useEffect, useMemo, useState } from "react";
import { Truck, MapPin, Gauge, Wrench, Navigation } from "lucide-react";
import { BRANCH_COLOR, BRANCH_NAME, FLEET, generateHearseBookings, dateKey, tint } from "./data";
import FuelGauge from "./FuelGauge";
import HearseFlow from "./HearseFlow";
import HearseMiniCalendar from "./HearseMiniCalendar";

const STATUS_META = {
  "in-transit": { label: "In Transit", dot: "#059669", text: "#047857", bg: "rgba(5,150,105,.10)" },
  booked: { label: "Booked", dot: "#2563eb", text: "#1d4ed8", bg: "rgba(37,99,235,.10)" },
  available: { label: "Available", dot: "var(--d-muted-fg)", text: "var(--d-muted-fg)", bg: "var(--d-muted)" },
  maintenance: { label: "Maintenance", dot: "#d97706", text: "#b45309", bg: "rgba(217,119,6,.10)" },
};

function etaToNum(eta) {
  if (!eta) return null;
  const n = Number.parseInt(eta, 10);
  return Number.isNaN(n) ? null : n;
}

/** FleetCommand — live hearse fleet: status cards, per-hearse booking calendar, telemetry. */
export default function FleetCommand() {
  const today = useMemo(() => new Date(), []);
  const bookings = useMemo(() => generateHearseBookings(today, FLEET), [today]);
  const [fleet, setFleet] = useState(() => FLEET);
  const [selectedId, setSelectedId] = useState(() => FLEET[0].id);

  useEffect(() => {
    const t = setInterval(() => {
      setFleet((prev) =>
        prev.map((h) => {
          let next = { ...h };
          if (h.status === "in-transit") {
            const n = etaToNum(h.eta);
            if (n !== null && n > 1) next.eta = `${n - 1} min`;
            else if (n !== null && n <= 1) {
              next = { ...next, status: "booked", eta: undefined, route: undefined, assignment: "On-site service" };
            }
            next.fuel = Math.max(3, h.fuel - 1);
          }
          return next;
        })
      );
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const selected = fleet.find((h) => h.id === selectedId) ?? fleet[0];
  const brColor = BRANCH_COLOR[selected.branch] || "var(--d-ring)";
  const selBookings = bookings.filter((b) => b.hearseId === selected.id);
  const todayKey = dateKey(today);
  const activeBooking =
    selBookings.find((b) => b.date === todayKey) ??
    selBookings.find((b) => b.stage !== "released") ??
    selBookings[0];

  const summary = ["in-transit", "booked", "available", "maintenance"].map((s) => ({
    s,
    count: fleet.filter((h) => h.status === s).length,
  }));

  return (
    <section className="dash-section">
      <div className="dash-section-head" style={{ flexWrap: "wrap" }}>
        <div className="dash-brand" style={{ gap: 10 }}>
          <span className="dash-ico" style={{ width: 32, height: 32, backgroundColor: tint("var(--d-ev-hearse)", 14), color: "var(--d-ev-hearse)" }}>
            <Truck className="h-4 w-4" />
          </span>
          <div>
            <h2>Fleet Command</h2>
            <span className="sub">Hearse bookings · per-vehicle calendars</span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {summary.map(({ s, count }) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span className="dash-dot" style={{ background: STATUS_META[s].dot }} />
              <span className="dash-num" style={{ fontWeight: 600 }}>{count}</span>
              <span style={{ color: "var(--d-muted-fg)" }}>{STATUS_META[s].label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: 16 }}>
        {fleet.map((h) => {
          const meta = STATUS_META[h.status];
          const isSel = h.id === selected.id;
          const bColor = BRANCH_COLOR[h.branch] || "var(--d-muted-fg)";
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => setSelectedId(h.id)}
              style={{
                width: 220, flexShrink: 0, display: "flex", flexDirection: "column",
                textAlign: "left", border: isSel ? `2px solid ${bColor}` : "1px solid var(--d-border)",
                borderRadius: 10, padding: 12, background: "var(--d-card)", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span className="dash-mono" style={{ fontSize: 13, fontWeight: 700 }}>{h.plate}</span>
                  <span style={{ marginLeft: 6, borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 600, background: `${bColor}14`, color: bColor }}>
                    {BRANCH_NAME[h.branch] || h.branch}
                  </span>
                </div>
                <FuelGauge value={h.fuel} size={52} />
              </div>
              <span style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 600, background: meta.bg, color: meta.text, width: "fit-content" }}>
                <span className="dash-dot" style={{ background: meta.dot }} />
                {meta.label}
              </span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--d-muted-fg)", marginTop: 8 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.driver}</span>
                {h.eta && <span className="dash-num" style={{ fontWeight: 600, color: "#047857" }}>ETA {h.eta}</span>}
              </div>
              {h.route ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--d-muted-fg)", marginTop: 4 }}>
                  <MapPin className="h-3 w-3" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.route}</span>
                </div>
              ) : (
                <p style={{ marginTop: 4, fontSize: 11, color: "var(--d-muted-fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {h.assignment ?? "No active assignment"}
                </p>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16, borderTop: "1px solid var(--d-border)", padding: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Navigation className="h-4 w-4" style={{ color: brColor }} />
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{selected.plate} — Status Flow</h3>
          </div>
          {activeBooking ? (
            <>
              <div style={{ marginBottom: 10, borderRadius: 8, background: "var(--d-muted)", padding: 9, fontSize: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span className="dash-mono" style={{ color: "var(--d-muted-fg)" }}>{activeBooking.reference}</span>
                  <span style={{ fontWeight: 600 }}>{activeBooking.deceasedName}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--d-muted-fg)", marginTop: 4 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeBooking.from}</span>
                  <span>→</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: "var(--d-card-fg)" }}>{activeBooking.to}</span>
                </div>
              </div>
              <HearseFlow stage={activeBooking.stage} stageTimes={activeBooking.stageTimes} />
            </>
          ) : (
            <p style={{ fontSize: 13, color: "var(--d-muted-fg)" }}>No active cortège for this unit.</p>
          )}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Gauge className="h-4 w-4" style={{ color: "var(--d-muted-fg)" }} />
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Booking Calendar</h3>
          </div>
          <HearseMiniCalendar bookings={selBookings} color={brColor} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Wrench className="h-4 w-4" style={{ color: "var(--d-muted-fg)" }} />
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Telemetry</h3>
          </div>
          <dl style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, margin: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--d-border)", paddingBottom: 8 }}>
              <dt style={{ color: "var(--d-muted-fg)" }}>Fuel level</dt>
              <dd className="dash-num" style={{ fontWeight: 700, margin: 0 }}>{selected.fuel}%</dd>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--d-border)", paddingBottom: 8 }}>
              <dt style={{ color: "var(--d-muted-fg)" }}>Odometer</dt>
              <dd className="dash-num" style={{ fontWeight: 700, margin: 0 }}>{selected.odometer.toLocaleString()} km</dd>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--d-border)", paddingBottom: 8 }}>
              <dt style={{ color: "var(--d-muted-fg)" }}>Next service in</dt>
              <dd
                className="dash-num"
                style={{
                  fontWeight: 700, margin: 0,
                  color: selected.nextServiceKm === 0 ? "#dc2626" : selected.nextServiceKm < 1000 ? "#b45309" : "var(--d-card-fg)",
                }}
              >
                {selected.nextServiceKm === 0 ? "Due now" : `${selected.nextServiceKm.toLocaleString()} km`}
              </dd>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <dt style={{ color: "var(--d-muted-fg)" }}>Driver</dt>
              <dd style={{ fontWeight: 700, margin: 0 }}>{selected.driver}</dd>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <dt style={{ color: "var(--d-muted-fg)" }}>Branch</dt>
              <dd style={{ fontWeight: 700, margin: 0 }}>{BRANCH_NAME[selected.branch] || selected.branch}</dd>
            </div>
          </dl>
          {selected.fuel <= 20 && (
            <p style={{ marginTop: 10, borderRadius: 8, background: "rgba(220,38,38,.10)", padding: "8px 10px", fontSize: 11, fontWeight: 600, color: "#dc2626" }}>
              Low fuel — refuel before next dispatch.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
