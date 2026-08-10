// src/components/analysis/comprehensiveDashboard.jsx
// Memorial Management - Professional Operations Command Center
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

import "./Dashboard.css";
import { analyticsApi } from "../../api/analyticsApi";
import { todayKey, parseBookingDates } from "./fleetUtil";

const EMPTY_RECORDS = { deceased: [], hearses: [], coffins: [], branchNames: [] };

const Ic = ({ children, size = 18, sw = 2.5 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}>
    {children}
  </svg>
);

// Live dashboard records + aggregate stats (fetched on mount below)
const DATA = { deceased: [], hearses: [], coffins: [] };

const ComprehensiveDashboard = () => {
  const [selDate, setSelDate] = useState(null);

  const calendarEvents = useMemo(
    () =>
      [
        ...(DATA.deceased || []).map((r) => ({
          date: r.date_key || r.adm_date,
          type: "deceased",
        })),
        ...(DATA.hearses || []).map((r) => ({ date: r.date_key, type: "hearse" })),
        ...(DATA.coffins || []).map((r) => ({ date: r.date_key, type: "coffin" })),
      ].filter((ev) => ev.date),
    [DATA.deceased, DATA.hearses, DATA.coffins]
  );

  return (
    <div className="operations-command-center">
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
              <HearseFleetGrid />
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
