// src/components/analysis/compDashboardLive.jsx — Comprehensive Dashboard (live data edition)
import React, { useState, useMemo, useEffect } from "react";

import HorizontalCalendar from "./horizontalCalender";
import KpiCards from "./kpiCards";
import LiveHearseOperations from "./HearseOperations";
import BranchPerformance from "./BranchPerformance";
import CoffinInventory from "./CoffinInventory";
import BranchRequests from "./coffinRequests";
import RecentActivity from "./Actiivity";
import RecentDeceasedRecords from "./deceased";
import NeedsAttentionPanel from "./NeedsAttentionPanel";
import ResourceCapacity from "./ResourceCapacity";
import StaffPanel from "./StaffPanel";
import HearseFleetGrid from "./HearseFleetGrid";
import CasePipeline from "./CasePipeline";
import LiveFeed from "./LiveFeed";
import PredictiveInsights from "./PredictiveInsights";
import BranchNetwork from "./BranchNetwork";
import InventorySummary from "./InventorySummary";
import FinanceStrip from "./FinanceStrip";

// Chart sections (previously defined but never mounted)
import AnalyticsCharts from "./charts";
import MortuaryCharts from "./MortuaryCharts";
import { analyticsApi } from "../../api/analyticsApi";
import { todayKey, parseBookingDates } from "./fleetUtil";

import "./Dashboard.css";

const EMPTY_RECORDS = { deceased: [], hearses: [], coffins: [], branchNames: [] };

const Ic = ({ children, size = 18, sw = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}>
    {children}
  </svg>
);

const ComprehensiveDashboard = () => {
  const [selDate, setSelDate] = useState(null);
  const [records, setRecords] = useState(EMPTY_RECORDS);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch REAL records + aggregate stats from the analytics service on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [recs, stats] = await Promise.all([
          analyticsApi.fetchAllDashboardRecords().catch(() => EMPTY_RECORDS),
          analyticsApi.getComprehensiveDashboard().catch(() => null),
        ]);
        if (!mounted) return;
        setRecords(recs || EMPTY_RECORDS);
        setDashboardStats(stats?.data || stats || null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const calendarEvents = useMemo(() => {
    const events = [
      ...(records.deceased || []).map((r) => ({
        date: r?.date_key || r?.adm_date || r?.date_admitted,
        type: "deceased",
      })),
      ...(records.hearses || []).flatMap((r) =>
        parseBookingDates(r?.booking_dates || r?.dates || r?.date).map((d) => ({ date: d, type: "hearse" }))
      ),
      ...(records.coffins || []).map((r) => ({
        date: r?.date_key || r?.created_at || r?.createdOn,
        type: "coffin",
      })),
    ];
    return events.filter((ev) => ev.date);
  }, [records.deceased, records.hearses, records.coffins]);

  // Today's REAL bookings & consumption numbers
  const todayBookings = useMemo(() => {
    const tKey = todayKey();
    return (records.hearses || []).filter((b) => {
      if (!b || String(b.status || "").toLowerCase() === "cancelled") return false;
      const dates = parseBookingDates(b?.booking_dates || b?.dates || b?.date);
      if (dates.length) return dates.some((d) => d.slice(0, 10) === tKey);
      if (b.booking_date) return String(b.booking_date).slice(0, 10) === tKey;
      return false;
    });
  }, [records.hearses]);

  const bookingsStats = dashboardStats?.bookings || {};
  const fleetCounts = bookingsStats.fleet || {};
  const fleetTotal = fleetCounts.total || 0;

  const bookedToday = todayBookings.length || bookingsStats.today || 0;
  const consumedToday =
    new Set(todayBookings.map((b) => b?.hearse_id || b?.id || b?.plate_number || b?.hearse_name).filter(Boolean)).size ||
    fleetCounts.booked || 0;
  const completedToday = todayBookings.filter((b) => String(b.status || "").toLowerCase() === "completed").length;
  const activeToday = Math.max(0, Number(bookedToday) - completedToday);
  const fleetAvailable = fleetCounts.available || 0;
  const fleetMaintenance = fleetCounts.maintenance || 0;

  const todayMetrics = [
    { icon: "calendar", label: "Already Booked Today", value: String(bookedToday), sub: `${activeToday} active · ${completedToday} completed`, color: "primary" },
    { icon: "clock", label: "Consumption Today", value: fleetTotal > 0 ? `${consumedToday} / ${fleetTotal}` : String(consumedToday), sub: "hearses in use today", color: "warning" },
    { icon: "check", label: "Completed Today", value: String(completedToday), sub: bookedToday > 0 ? `${Math.round((completedToday / Number(bookedToday)) * 100)}% completion rate` : "no trips finished yet", color: "success" },
    { icon: "truck", label: "Fleet Available", value: String(fleetAvailable), sub: fleetMaintenance > 0 ? `${fleetMaintenance} in maintenance` : "all hearses ready", color: "info" },
  ];

  const getIconColor = (color) => {
    const colors = {
      success: "text-success",
      warning: "text-warning",
      danger: "text-danger",
      primary: "text-primary",
      info: "text-info",
    };
    return colors[color] || "text-primary";
  };

  const getIcon = (name) => {
    const icons = {
      calendar: <Ic><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Ic>,
      clock: <Ic><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Ic>,
      check: <Ic><path d="M20 6 9 17l-5-5" /></Ic>,
      truck: <Ic><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2m10 0H9m10 0h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></Ic>,
    };
    return icons[name] || null;
  };
return (
    <div className="operations-command-center">
      {loading && <div className="dashboard-loading">Loading live operations data…</div>}
      <main className="dashboard-main">
        <div className="dash-container">
          <section className="dashboard-section">
            <HorizontalCalendar eventsData={calendarEvents} selectedDate={selDate} onDateSelect={setSelDate} />
          </section>

          <section className="dashboard-section">
            <KpiCards />
          </section>

          <section className="dashboard-section">
            <FinanceStrip />
          </section>

          {/* Today's real bookings & fleet consumption (live data from the API) */}
          <section className="dashboard-section">
            <div className="finance-strip">
              {todayMetrics.map((metric, idx) => (
                <div key={idx} className="finance-item">
                  <div className={`finance-icon ${getIconColor(metric.color)}`}>{getIcon(metric.icon)}</div>
                  <div className="finance-content">
                    <div className="finance-value">{metric.value}</div>
                    <div className="finance-label">{metric.label}</div>
                    <div className={`finance-sub ${getIconColor(metric.color)}`}>{metric.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
{/* ===== ANALYTICS CHARTS SECTIONS ===== */}
          <section className="dashboard-section">
            <AnalyticsCharts />
          </section>

          <section className="dashboard-section">
            <MortuaryCharts />
          </section>

          <div className="dash-grid dash-grid--2">
            <section className="dash-card">
              <NeedsAttentionPanel />
            </section>
            <div className="dash-grid-vertical">
              <section className="dash-card">
                <ResourceCapacity />
              </section>
              <section className="dash-card">
                <StaffPanel />
              </section>
            </div>
          </div>

          <section className="dashboard-section">
            <div className="dash-card dash-card--flush">
              <HearseFleetGrid bookings={records.hearses} fleet={bookingsStats} />
            </div>
          </section>

          <div className="dash-grid dash-grid--2">
            <section className="dash-card">
              <CasePipeline />
            </section>
            <section className="dash-card">
              <LiveFeed />
            </section>
          </div>

          <div className="dash-grid dash-grid--3">
            <section className="dash-card">
              <PredictiveInsights />
            </section>
            <section className="dash-card">
              <BranchNetwork />
            </section>
            <section className="dash-card">
              <InventorySummary />
            </section>
          </div>

          <div className="dash-grid dash-grid--2">
            <section className="dash-card">
              <BranchPerformance />
            </section>
            <section className="dash-card">
              <CoffinInventory />
            </section>
          </div>

          <section className="dashboard-section">
            <div className="dash-card dash-card--flush">
              <LiveHearseOperations />
            </div>
          </section>

          <div className="dash-grid dash-grid--2">
            <section className="dash-card">
              <BranchRequests />
            </section>
            <section className="dash-card">
              <RecentActivity />
            </section>
          </div>

          <section className="dashboard-section">
            <div className="dash-card dash-card--flush">
              <RecentDeceasedRecords />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ComprehensiveDashboard;