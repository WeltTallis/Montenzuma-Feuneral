import { useState, useMemo } from "react";
import {
  Activity,
  CalendarDays,
  DoorOpen,
  Truck,
  UserRoundPlus,
} from "lucide-react";
import { eventsOf, isReleased, addDays, parseKey, pad, todayKey } from "./opsData";
import { formatBranchDisplayName } from "../components/coffins/coffinColorUtils";
import { getBranches } from "../utils/globalAuth";
import "./dashboard-overview.css";

export default function DashboardOverview({
  cases = [],
  calc = {},
  loading = false,
  today = "",
  onNavigate,
  onOpenIntake,
  onOpenCase,
  onOpenFleet,
}) {
  const [shiftFilter, setShiftFilter] = useState("all");

  const records = cases || [];
  const events = useMemo(() => eventsOf(records), [records]);

  // Today's computed operations
  const todayEvents = useMemo(() => {
    return events
      .filter((e) => e.date === today)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [events, today]);

  const todayIntakes = todayEvents.filter((e) => e.t === "intake").length;
  const todayReleases = todayEvents.filter((e) => e.t === "release").length;
  const todayPostmortems = todayEvents.filter((e) => e.t === "pm").length;

  // Yesterday comparison for trend
  const yesterdayIntakes = useMemo(() => {
    if (!today) return 0;
    const yKey = addDays(today, -1);
    return events.filter((e) => e.date === yKey && e.t === "intake").length;
  }, [events, today]);

  const intakeDiff = todayIntakes - yesterdayIntakes;

  // Displayed live feed items using real deceased data
  const displayLiveList = useMemo(() => {
    const sourceList = todayEvents.length > 0 ? todayEvents : events;
    return sourceList.slice(0, 6).map((e) => ({
      id: `${e.t}-${e.p?.uid || Math.random()}-${e.time || e.date}`,
      t: e.t,
      time: e.time || "—",
      name: e.p?.name || "Record",
      branch: formatBranchDisplayName(e.p?.branch) || "Main Branch",
      statusNote:
        e.t === "intake"
          ? "Intake registered"
          : e.t === "release"
          ? (e.p?.release?.status === "completed" ? "Completed handover" : "Family arrived")
          : (e.completed ? "Report ready" : "Pathologist on site"),
      p: e.p,
    }));
  }, [todayEvents, events]);

  // Real Branch capacity data
  const branchData = useMemo(() => {
    let cached = [];
    try {
      cached = getBranches();
    } catch {
      // fallback
    }

    const branchesFromCases = [...new Set(records.map((c) => c.branch).filter(Boolean))];

    const branchMap = new Map();
    if (Array.isArray(cached) && cached.length > 0) {
      cached.forEach((b) => {
        const raw = b.branchName || b.branch_name || b.name || b.branchSlug || b.branch_slug || "";
        const clean = formatBranchDisplayName(raw);
        if (clean && !branchMap.has(clean)) {
          branchMap.set(clean, { id: b.id || b.branchId, raw, name: clean });
        }
      });
    }

    branchesFromCases.forEach((raw) => {
      const clean = formatBranchDisplayName(raw);
      if (clean && !branchMap.has(clean)) {
        branchMap.set(clean, { id: raw, raw, name: clean });
      }
    });

    if (branchMap.size === 0) {
      branchMap.set("Main Branch", { id: "main", raw: "main", name: "Main Branch" });
    }

    const colorSchemes = ["black", "yellow", "red", "blue"];
    let idx = 0;

    return Array.from(branchMap.values()).map((b) => {
      const realInCare = records.filter(
        (c) =>
          !isReleased(c) &&
          (formatBranchDisplayName(c.branch) === b.name ||
            String(c.branch_id) === String(b.id) ||
            String(c.branch || "").toLowerCase() === b.name.toLowerCase())
      ).length;

      const capacity = 20;
      const pct = Math.min(100, Math.round((realInCare / capacity) * 100));
      const status = pct >= 80 ? "NEAR FULL" : pct >= 50 ? "BUSY" : "OK";
      const colorScheme = colorSchemes[idx % colorSchemes.length];
      idx++;

      return {
        name: b.name,
        colorScheme,
        capacity,
        inCare: realInCare,
        pct,
        status,
      };
    });
  }, [records]);

  // Operations list with shift filtering
  const displayOps = useMemo(() => {
    const sourceList = todayEvents.length > 0 ? todayEvents : events;
    return sourceList.slice(0, 10).map((e) => {
      const timeStr = e.time || "12:00";
      const hour = parseInt(timeStr.slice(0, 2), 10) || 12;
      const shift = hour >= 6 && hour < 18 ? "day" : "night";
      return {
        id: `${e.t}-${e.p?.uid || Math.random()}-${e.time || e.date}`,
        shift,
        time: timeStr,
        name: e.p?.name || "Deceased Record",
        branch: formatBranchDisplayName(e.p?.branch) || "Main Branch",
        t: e.t,
        p: e.p,
      };
    });
  }, [todayEvents, events]);

  const filteredOps = useMemo(() => {
    if (shiftFilter === "all") return displayOps;
    return displayOps.filter((op) => op.shift === shiftFilter);
  }, [displayOps, shiftFilter]);

  // Calendar generation (current month aligned Mon-Sun)
  const { calendarDays, monthTitle } = useMemo(() => {
    const dateObj = today ? parseKey(today) : new Date();
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();

    const title = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const firstDay = new Date(year, month, 1);
    const startDayIndex = (firstDay.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = startDayIndex - 1; i >= 0; i--) {
      days.push({
        dayNum: daysInPrevMonth - i,
        muted: true,
      });
    }

    // Event date set for fast lookup
    const eventDateSet = new Set(events.map((e) => e.date));

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
      const isToday = today ? dateKey === today : false;
      const hasEvent = eventDateSet.has(dateKey);

      days.push({
        dayNum: d,
        dateKey,
        isToday,
        hasEvent,
        muted: false,
      });
    }

    // Next month padding to fill grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dayNum: i,
        muted: true,
      });
    }

    return { calendarDays: days, monthTitle: title };
  }, [today, events]);

  // 7-day flow for weekly trend chart (real values)
  const chartData = useMemo(() => {
    const last7 = calc?.last7 || [];
    if (last7.length === 7) {
      const intakes = last7.map((d) => d.adm || 0);
      const releases = last7.map((d) => d.rel || 0);
      const dows = last7.map((d) => d.dow || "");
      return {
        intakes,
        releases,
        dows,
      };
    }

    const dows = [];
    const intakes = [];
    const releases = [];
    for (let i = 6; i >= 0; i--) {
      const dKey = addDays(today || todayKey(), -i);
      const dObj = parseKey(dKey);
      const dayName = dObj.toLocaleDateString("en-US", { weekday: "short" });
      dows.push(dayName);
      const dayEvents = events.filter((e) => e.date === dKey);
      intakes.push(dayEvents.filter((e) => e.t === "intake").length);
      releases.push(dayEvents.filter((e) => e.t === "release").length);
    }

    return {
      intakes,
      releases,
      dows,
    };
  }, [calc, events, today]);

  // SVG Chart path calculation
  const { intakePath, intakeAreaPath, releasePath, intakePoints, releasePoints } = useMemo(() => {
    const xCoords = [30, 170, 310, 450, 590, 730, 970];
    const maxVal = Math.max(...chartData.intakes, ...chartData.releases, 10);

    const getY = (val) => {
      const ratio = val / maxVal;
      return Math.round(170 - ratio * 130);
    };

    const inPoints = chartData.intakes.map((val, idx) => ({ x: xCoords[idx], y: getY(val), val }));
    const relPoints = chartData.releases.map((val, idx) => ({ x: xCoords[idx], y: getY(val), val }));

    // Build smooth cubic bezier curve
    const buildPath = (points) => {
      return points.reduce((acc, pt, i, arr) => {
        if (i === 0) return `M ${pt.x} ${pt.y}`;
        const prev = arr[i - 1];
        const cp1x = prev.x + (pt.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = prev.x + (pt.x - prev.x) / 2;
        const cp2y = pt.y;
        return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
      }, "");
    };

    const inPath = buildPath(inPoints);
    const inArea = `${inPath} L 970 200 L 30 200 Z`;
    const relPath = buildPath(relPoints);

    return {
      intakePath: inPath,
      intakeAreaPath: inArea,
      releasePath: relPath,
      intakePoints: inPoints,
      releasePoints: relPoints,
    };
  }, [chartData]);

  return (
    <main className="dashboard" aria-labelledby="overview-title">
      {/* HEADER TITLE & QUICK ACTIONS */}
      <div className="header-title">
        <div className="header-title-copy">
          <h1 id="overview-title">Operations Overview</h1>
          <p>Real-time summary of all branches, shifts, and capacity.</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="header-action-btn primary"
            onClick={onOpenIntake}
            title="Register a new deceased intake"
          >
            <UserRoundPlus size={16} />
            <span>Register Intake</span>
          </button>
          <button
            type="button"
            className="header-action-btn"
            onClick={() => onNavigate?.("release-calendar")}
            title="View deceased calendar"
          >
            <CalendarDays size={16} />
            <span>Schedule</span>
          </button>
          <button
            type="button"
            className="header-action-btn"
            onClick={onOpenFleet}
            title="Manage hearse fleet"
          >
            <Truck size={16} />
            <span>Fleet</span>
          </button>
        </div>
      </div>

      {/* 1. TOP 3 KPI CARDS */}
      <div className="kpi-row">
        <div className="kpi-card intake">
          <div className="kpi-icon">
            <UserRoundPlus size={28} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Today's Intakes</span>
            <div className="kpi-value">{todayIntakes}</div>
            <div className={`kpi-trend ${intakeDiff >= 0 ? "up" : "neutral"}`}>
              {intakeDiff >= 0 ? `↑ ${intakeDiff} vs yesterday` : `${todayIntakes} registered today`}
            </div>
          </div>
        </div>

        <div className="kpi-card release">
          <div className="kpi-icon">
            <DoorOpen size={28} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Today's Releases</span>
            <div className="kpi-value">{todayReleases}</div>
            <div className="kpi-trend neutral">
              {todayReleases > 0 ? `${todayReleases} pending handover` : "None scheduled today"}
            </div>
          </div>
        </div>

        <div className="kpi-card pm">
          <div className="kpi-icon">
            <Activity size={28} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Postmortems</span>
            <div className="kpi-value">{todayPostmortems}</div>
            <div className="kpi-trend neutral">
              {todayPostmortems > 0 ? `${todayPostmortems} scheduled today` : "None scheduled today"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. LIVE FEED & BRANCH COUNTS */}
      <div className="main-grid">
        {/* Live Dispatch Feed */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Live Dispatch Feed</div>
            <div className="live-badge">
              <div className="live-dot" /> REAL-TIME
            </div>
          </div>
          <div className="live-list">
            {displayLiveList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted, #64748b)", fontSize: 13 }}>
                No active operations recorded
              </div>
            ) : (
              displayLiveList.map((item) => (
              <div
                key={item.id}
                className={`live-item ${item.t}`}
                onClick={() => item.p?.uid && onOpenCase?.(item.p.uid, item.t)}
                title={item.p?.uid ? "Click to view case record" : undefined}
              >
                <div className="live-left">
                  <span className="live-time">{item.time}</span>
                  <div className="live-info">
                    <h4>{item.name}</h4>
                    <p>{item.branch} · {item.statusNote}</p>
                  </div>
                </div>
                <span className={`live-tag ${item.t}`}>
                  {item.t === "intake"
                    ? "INTAKE"
                    : item.t === "release"
                    ? "RELEASE"
                    : "POSTMORTEM"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Counts */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Branch Capacity</div>
          </div>
          <div className="branch-list">
            {branchData.map((b) => (
              <div key={b.name} className={`branch-card ${b.colorScheme}`}>
                <div className="branch-top">
                  <span className="branch-name">{b.name}</span>
                  <span className="branch-status">{b.status}</span>
                </div>
                <div className="branch-value">{b.inCare}</div>
                <div className="branch-label">Bodies In Care</div>
                <div className="branch-bottom">
                  <span>{b.inCare} / {b.capacity} Beds</span>
                  <span>{b.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. OPERATIONS & CALENDAR */}
      <div className="bottom-grid">
        {/* Operations Panel */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Today's Operations</div>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${shiftFilter === "all" ? "active" : ""}`}
                onClick={() => setShiftFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`toggle-btn ${shiftFilter === "day" ? "active" : ""}`}
                onClick={() => setShiftFilter("day")}
              >
                Day
              </button>
              <button
                type="button"
                className={`toggle-btn ${shiftFilter === "night" ? "active" : ""}`}
                onClick={() => setShiftFilter("night")}
              >
                Night
              </button>
            </div>
          </div>

          <div className="ops-list">
            {filteredOps.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted, #64748b)", fontSize: 13 }}>
                No operations scheduled for this shift
              </div>
            ) : (
              filteredOps.map((op) => (
              <div
                key={op.id}
                className="op-row"
                onClick={() => op.p?.uid && onOpenCase?.(op.p.uid, op.t)}
                title={op.p?.uid ? "Click to view case record" : undefined}
              >
                <div className="op-left">
                  <span className="op-time">{op.time}</span>
                  <div className="op-info">
                    <h4>{op.name}</h4>
                    <p>{op.branch}</p>
                  </div>
                </div>
                <span className={`op-tag ${op.t}`}>
                  {op.t === "intake" ? "INTAKE" : op.t === "pm" ? "PM" : "RELEASE"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Minimal Calendar */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">{monthTitle}</div>
          </div>
          <div className="cal-grid">
            <div className="cal-dow">M</div>
            <div className="cal-dow">T</div>
            <div className="cal-dow">W</div>
            <div className="cal-dow">T</div>
            <div className="cal-dow">F</div>
            <div className="cal-dow">S</div>
            <div className="cal-dow">S</div>

            {calendarDays.map((d, index) => (
              <div
                key={index}
                className={`cal-day ${d.muted ? "muted" : ""} ${d.isToday ? "active" : ""} ${d.hasEvent ? "has-event" : ""}`}
                title={d.dateKey || undefined}
                onClick={() => !d.muted && onNavigate?.("release-calendar")}
                style={{ cursor: d.muted ? "default" : "pointer" }}
              >
                {d.dayNum}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. LINE CHART */}
      <div className="panel chart-panel">
        <div className="panel-header">
          <div className="panel-title">Weekly Operations Trend</div>
          <div className="chart-legend">
            <span><i className="intake" /> Intakes</span>
            <span><i className="release" /> Releases</span>
          </div>
        </div>
        <div className="svg-wrap">
          <svg viewBox="0 0 1000 200" preserveAspectRatio="none">
            {/* Grid */}
            <line x1="0" y1="40" x2="1000" y2="40" stroke="var(--border)" strokeWidth="1" strokeDasharray="6 6" />
            <line x1="0" y1="100" x2="1000" y2="100" stroke="var(--border)" strokeWidth="1" strokeDasharray="6 6" />
            <line x1="0" y1="160" x2="1000" y2="160" stroke="var(--border)" strokeWidth="1" strokeDasharray="6 6" />

            {/* Intake Area Fill */}
            <path d={intakeAreaPath} fill="var(--yellow)" opacity="0.12" />

            {/* Intake Line */}
            <path
              d={intakePath}
              fill="none"
              stroke="var(--yellow)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Intake Points */}
            {intakePoints.map((pt, i) => (
              <circle
                key={`in-pt-${i}`}
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill="var(--yellow)"
                stroke="#fff"
                strokeWidth="2"
              >
                <title>{`Intakes: ${pt.val}`}</title>
              </circle>
            ))}

            {/* Release Line */}
            <path
              d={releasePath}
              fill="none"
              stroke="var(--red)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="8 6"
            />
            {/* Release Points */}
            {releasePoints.map((pt, i) => (
              <circle
                key={`rel-pt-${i}`}
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="var(--red)"
                stroke="#fff"
                strokeWidth="2"
              >
                <title>{`Releases: ${pt.val}`}</title>
              </circle>
            ))}
          </svg>
        </div>
        {/* X Axis Labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "16px",
            padding: "0 20px",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--muted)",
          }}
        >
          {chartData.dows.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
      </div>
    </main>
  );
}
