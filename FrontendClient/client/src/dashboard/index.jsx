import React, { useMemo } from "react";
import "./theme.css";
import useClock from "./useClock";
import {
  dateKey, getEventsForDate,
  getDaySummary, getWeek, getDeceasedRegister, detectConflicts,
} from "./data";
import Header from "./Header";
import Controls from "./Controls";
import KpiBar from "./KpiBar";
import StatCards from "./StatCards";
import WeekView from "./WeekView";
import MiniCalendar from "./MiniCalendar";
import ServiceDonut from "./ServiceDonut";
import DayTimeline from "./DayTimeline";
import ConflictMonitor from "./ConflictMonitor";
import LiveFeed from "./LiveFeed";
import BranchBarChart from "./BranchBarChart";
import TrendChart from "./TrendChart";
import FleetCommand from "./FleetCommand";
import Activity from "./Activity";
import ResourceCapacity from "./ResourceCapacity";
import DeceasedRegister from "./DeceasedRegister";

/** Dashboard — composed of the section files in this folder.
 *  Real data is consumed by KpiBar (API); every other panel derives from
 *  the deterministic date-seeded generator, so the dashboard is always vivid. */
export default function Dashboard() {
  const [selected, setSelected] = React.useState(() => new Date());
  const [branch, setBranch] = React.useState("all");
  const [view, setView] = React.useState("day");
  const clock = useClock();

  const selKey = selected ? dateKey(selected) : dateKey(new Date());

  const allEvents = useMemo(() => getEventsForDate(selected), [selKey]);
  const register = useMemo(() => getDeceasedRegister(selected), [selKey]);
  const week = useMemo(() => getWeek(selected), [selKey]);

  const branchEvents = useMemo(
    () => (branch === "all" ? allEvents : allEvents.filter((e) => e.branch === branch)),
    [allEvents, branch]
  );
  const branchRegister = useMemo(
    () => (branch === "all" ? register : register.filter((r) => r.branch === branch)),
    [register, branch]
  );
  const summary = useMemo(() => getDaySummary(branchEvents), [branchEvents]);

  const allConflicts = useMemo(() => detectConflicts(allEvents), [allEvents]);
  const conflicts = useMemo(
    () => (branch === "all" ? allConflicts : allConflicts.filter((c) => c.branches.includes(branch))),
    [allConflicts, branch]
  );

  const revenue = useMemo(
    () => branchEvents.reduce((a, e) => a + (e.amountKes || 0), 0),
    [branchEvents]
  );

  const dateLabel = selected.toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  return (
    <div className="dash-root">
      <header className="dash-header">
        <Header conflictsCount={conflicts.length} clock={clock} />
      </header>

      <main className="dash-main">
        <Controls
          selected={selected}
          view={view}
          branch={branch}
          onView={setView}
          onBranch={setBranch}
          onShift={setSelected}
          onSelected={setSelected}
        />

        {/* Live financial / operational strip */}
        <div className="dash-row first">
          <KpiBar date={selected} />
        </div>

        {/* Stat cards */}
        <div className="dash-row first">
          <StatCards summary={summary} revenue={revenue} />
        </div>

        {/* Week view (only when selected) */}
        {view === "week" && (
          <section className="dash-section dash-row first">
            <div className="dash-section-head">
              <h2>Weekly overview</h2>
              <span className="sub">Click a day to drill in</span>
            </div>
            <div style={{ padding: 12 }}>
              <WeekView week={week} selected={selected} branch={branch} onSelect={setSelected} />
            </div>
          </section>
        )}

        {/* Real-time row: conflicts + live feed */}
        <div className="dash-grid dash-2col dash-row first">
          <div className="dash-span7" style={{ minHeight: 380 }}>
            <ConflictMonitor conflicts={conflicts} />
          </div>
          <div className="dash-span5" style={{ minHeight: 380 }}>
            <LiveFeed />
          </div>
        </div>

        {/* Schedule + calendar + service mix */}
        <div className="dash-grid dash-12 dash-row first">
          <div className="dash-span7" style={{ minHeight: 520 }}>
            <DayTimeline events={branchEvents} conflicts={conflicts} dateLabel={dateLabel} />
          </div>
          <div className="dash-span5" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <section className="dash-section">
              <div className="dash-section-head">
                <h2>Operations calendar</h2>
                <span className="sub">Click any date</span>
              </div>
              <div style={{ padding: 8 }}>
                <MiniCalendar selected={selected} onSelect={setSelected} />
              </div>
            </section>
            <section className="dash-section">
              <div className="dash-section-head">
                <h2>Service mix</h2>
                <span className="sub">Hearse, coffin, floral &amp; chapel bookings</span>
              </div>
              <div style={{ padding: 8 }}>
                <ServiceDonut events={branchEvents} />
              </div>
            </section>
          </div>
        </div>

        {/* Charts row */}
        <div className="dash-grid dash-2col dash-row first">
          <div style={{ minHeight: 320 }}>
            <BranchBarChart events={allEvents} />
          </div>
          <div style={{ minHeight: 320 }}>
            <TrendChart date={selected} />
          </div>
        </div>

        {/* Hearse fleet command */}
        <div className="dash-row first">
          <FleetCommand />
        </div>

        {/* Recent activity + resource capacity */}
        <div className="dash-grid dash-2col dash-row first">
          <div>
            <Activity />
          </div>
          <div>
            <ResourceCapacity />
          </div>
        </div>

        {/* Deceased register */}
        <div className="dash-row first">
          <DeceasedRegister records={branchRegister} />
        </div>

        <footer className="dash-footer dash-serif">
          Umoja Funeral Home · Nairobi · Machakos · Thika — real-time operations in East Africa Time (EAT)
        </footer>
      </main>
    </div>);
}


