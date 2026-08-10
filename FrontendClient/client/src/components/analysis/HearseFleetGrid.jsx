// src/components/analysis/HearseFleetGrid.jsx
// Hearse fleet timeline command view — driven by TODAY'S REAL bookings.
// Props:
//   bookings: Array of hearse bookings from GET /hearse-bookings
//   fleet:    Aggregate booking stats from the comprehensive dashboard API,
//             i.e. { total, thisWeek, today, booked, completed, fleet: { available, booked, maintenance, total } }
// When used without props the panel falls back to the built-in demo timeline.
import React, { useMemo } from "react";
import { todayKey as getTodayKey, parseBookingDates } from "./fleetUtil";

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

// Real DB booking statuses -> timeline statuses
const STATUS_KEY = {
  completed: "completed",
  in_transit: "in-transit",
  "in-transit": "in-transit",
  in_progress: "in-transit",
  dispatched: "in-transit",
  en_route: "in-transit",
  booked: "scheduled",
  pending: "scheduled",
  postponed: "scheduled",
  scheduled: "scheduled",
};

const STATUS_CONFIG = {
  completed: { bg: "bg-success-bg", border: "border-success", text: "text-success", label: "Completed" },
  "in-transit": { bg: "bg-info-bg", border: "border-info", text: "text-info", label: "In Transit" },
  scheduled: { bg: "bg-secondary", border: "border-primary", text: "text-primary", label: "Scheduled" },
  conflict: { bg: "bg-danger-bg", border: "border-danger", text: "text-danger", label: "Conflict" },
};

const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;

  const DEMO_FLEET = [
    {
      id: "H-01",
      driver: "Peter",
      status: "success",
      assignments: [
        { caseId: "FN-2044", location: "Langata Cem.", start: 0, width: 22.2, status: "completed" },
        { caseId: "FN-2049", location: "PCEA Westlands", start: 38.9, width: 22.2, status: "scheduled" },
        { caseId: "FN-2053", location: "Memorial", start: 77.8, width: 22.2, status: "scheduled" },
      ],
    },
    {
      id: "H-02",
      driver: "Ali",
      status: "danger",
      assignments: [
        { caseId: "FN-2050", location: "Upper Hill", start: 5.6, width: 27.8, status: "in-transit" },
        { caseId: "FN-2051", location: "Nairobi Mem.", start: 22.2, width: 22.2, status: "conflict" },
        { caseId: "FN-2054", location: "Lang'ata", start: 66.7, width: 27.8, status: "scheduled" },
      ],
    },
    {
      id: "H-03",
      driver: "James",
      status: "info",
      assignments: [
        { caseId: "FN-2048", location: "Memorial", start: 16.7, width: 22.2, status: "in-transit" },
        { caseId: "FN-2052", location: "Kariokor", start: 55.6, width: 22.2, status: "scheduled" },
      ],
    },
    {
      id: "H-04",
      driver: "Grace",
      status: "success",
      assignments: [
        { caseId: "FN-2046", location: "Githurai Cem.", start: 44.4, width: 27.8, status: "scheduled" },
        { caseId: "FN-2055", location: "Ruiru Cem.", start: 77.8, width: 22.2, status: "scheduled" },
      ],
    },
  ];

  const HearseFleetGrid = ({ bookings, fleet }) => {
  // Real bookings whose booked date includes today (already booked today)
  const hasLiveData = Array.isArray(bookings);

  const todayBookings = useMemo(() => {
    if (!hasLiveData) return [];
    const tKey = getTodayKey();
    return bookings.filter((b) => {
      if (!b || String(b.status || "").toLowerCase() === "cancelled") return false;
      const dates = parseBookingDates(b.booking_dates || b.dates || b.date);
      if (dates.length) return dates.some((d) => d.slice(0, 10) === tKey);
      if (b.booking_date) return String(b.booking_date).slice(0, 10) === tKey;
      if (b.created_at) return String(b.created_at).slice(0, 10) === tKey;
      return false;
    });
  }, [bookings, hasLiveData]);

  // Build the timeline rows — one row per hearse used today.
  const rows = useMemo(() => {
    if (!hasLiveData) return DEMO_FLEET;
    const sorted = [...todayBookings].sort(
      (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
    );
    const total = sorted.length;
    const bands = sorted.map((booking, i) => {
      // Spread today's trips chronologically across the 08:00–17:00 window.
      const start = total === 1 ? 8 : 4 + (i / (total - 1)) * 78;
      const width = total === 1 ? 24 : Math.max(16, 78 / total);
      return { booking, start, width };
    });

    const byHearse = new Map();
    bands.forEach(({ booking, start, width }) => {
      const key = String(
        booking.hearse_id || booking.id || booking.plate_number || booking.hearse_name || "Unassigned"
      );
      if (!byHearse.has(key)) byHearse.set(key, []);
      byHearse.get(key).push({ ...booking, start, width });
    });

    return Array.from(byHearse.entries())
      .map(([key, list]) => {
        const first = list[0];
        const active = list.some((a) => STATUS_KEY[a.status] === "in-transit");
        return {
          id: key,
          label: first.hearse_name || `Hearse ${key}`,
          sub: first.plate_number || first.hearse_code || first.branch_name || "",
          status: active ? "info" : "success",
          assignments: list.map((a) => ({
            caseId: a.booking_code || `BK-${a.booking_id || a.id}`,
            location: a.destination || a.to_location || "—",
            start: a.start,
            width: a.width,
            status: STATUS_KEY[a.status] || "scheduled",
          })),
        };
      })
      .sort((a, b) => (a.id < b.id ? -1 : 1));
  }, [todayBookings, hasLiveData]);

  // ── Today's headline numbers ─────────────────────────────────────────────
  const bookedToday = hasLiveData
    ? todayBookings.length
    : DEMO_FLEET.reduce((n, v) => n + v.assignments.length, 0);
  const consumedToday =
    new Set(todayBookings.map((b) => b.hearse_id || b.id || b.plate_number || b.hearse_name).filter(Boolean)).size ||
    DEMO_FLEET.length;

  const fleetCounts = fleet?.fleet || {};
  const fleetTotal = fleetCounts.total || 0;
  const fleetAvailable = fleetCounts.available || 0;
  const fleetMaintenance = fleetCounts.maintenance || 0;

  return (
    <div className="fleet-grid">
      <div className="panel-header">
        <div className="panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m10 0H9m10 0h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
          <span>Hearse Fleet Command</span>
        </div>
        <div className="panel-header-right">
          <span className="conflict-badge primary">
            {hasLiveData ? `${bookedToday} booked today` : "Live"}
          </span>
          <span className="conflict-badge success">{consumedToday} hearses in use</span>
          <div className="legend">
            <div className="legend-item"><div className="legend-dot success"></div>Completed</div>
            <div className="legend-item"><div className="legend-dot info"></div>In Transit</div>
            <div className="legend-item"><div className="legend-dot primary"></div>Scheduled</div>
            <div className="legend-item"><div className="legend-dot danger"></div>Conflict</div>
          </div>
          <button className="view-all-link">Manage Fleet</button>
        </div>
      </div>
      <div className="fleet-timeline">
        <div className="timeline-header">
          <div className="timeline-label-column"></div>
          <div className="timeline-slots">
            {TIME_SLOTS.map((time, idx) => (
              <div key={idx} className="timeline-slot">{time}</div>
            ))}
          </div>
        </div>
        <div className="timeline-body">
          {hasLiveData && rows.length === 0 ? (
            <div className="timeline-empty">
              <strong>No hearses booked today</strong>
              <span>
                {fleetTotal > 0
                  ? `${fleetAvailable} of ${fleetTotal} hearses available${fleetMaintenance ? ` · ${fleetMaintenance} in maintenance` : ""}`
                  : "The fleet is clear — no trips scheduled for today."}
              </span>
            </div>
          ) : (
            rows.map((vehicle, idx) => (
            <div key={idx} className="timeline-row">
              <div className="timeline-label-column">
                <div className="vehicle-info">
                  <div className={`status-indicator ${vehicle.status}`}></div>
                  <span className="vehicle-id">{vehicle.label || vehicle.id}</span>
                  <span className="vehicle-driver">{vehicle.sub || vehicle.driver}</span>
                </div>
              </div>
              <div className="timeline-track">
                {vehicle.assignments.map((assignment, aIdx) => {
                  const statusConfig = getStatusConfig(assignment.status);
                  return (
                    <div
                      key={aIdx}
                      className={`timeline-assignment ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}
                      style={{
                        left: `${assignment.start}%`,
                        width: `${assignment.width}%`,
                      }}
                    >
                      <div className="assignment-case">{assignment.caseId}</div>
                      <div className="assignment-location">{assignment.location}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HearseFleetGrid;