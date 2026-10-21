import { useState, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCw,
  Plus,
  X,
  UserRoundPlus,
  DoorOpen,
  Activity,
} from "lucide-react";
import "./deceased-calendar.css";

/* ============================================================
   TYPE & STATUS CONFIGS
   ============================================================ */
const TYPE_STYLES = {
  intake:  { label: "INTAKE",  color: "#FFC107", textColor: "#111827" },
  release: { label: "RELEASE", color: "#FF4757", textColor: "#FFFFFF" },
  pm:      { label: "POSTMORTEM", color: "#111827", textColor: "#FFFFFF" },
  funeral: { label: "FUNERAL", color: "#7C3AED", textColor: "#FFFFFF" },
  transfer:{ label: "TRANSFER", color: "#0284C7", textColor: "#FFFFFF" },
};

const STATUS_STYLES = {
  pending:   { label: "Pending",   color: "#d97706", bg: "#FFFBEB" },
  completed: { label: "Completed", color: "#16a34a", bg: "#f0fdf4" },
  scheduled: { label: "Scheduled", color: "#0f172a", bg: "#f1f5f9" },
  in_transit:{ label: "In Transit",color: "#ea580c", bg: "#fff7ed" },
};

/* ============================================================
   DATE UTILITIES
   ============================================================ */
function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function startOfWeek(d) {
  const r = new Date(d);
  const day = r.getDay();
  const diff = r.getDate() - day + (day === 0 ? -6 : 1); // Monday is start of week
  r.setDate(diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtMDY(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtMD(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtTime(d) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function parseToDate(dateVal, timeVal) {
  if (dateVal instanceof Date) return dateVal;
  if (!dateVal) return new Date();
  
  const [y, m, d] = String(dateVal).split("-").map(Number);
  let hours = 9;
  let minutes = 0;
  
  if (timeVal) {
    const parts = String(timeVal).match(/(\d{1,2}):(\d{2})/);
    if (parts) {
      hours = parseInt(parts[1], 10);
      minutes = parseInt(parts[2], 10);
    }
  }
  
  return new Date(y || 2026, (m || 1) - 1, d || 1, hours, minutes);
}

/* ============================================================
   FALLBACK EVENTS WHEN PROPS ARE EMPTY
   ============================================================ */
function getMockEvents() {
  const now = new Date();
  const Y = now.getFullYear();
  const M = now.getMonth();
  const D = now.getDate();

  return [
    { id: "EV-001", name: "Margaret A. Whitfield", branch: "Riverside", type: "intake",  status: "completed", date: new Date(Y, M, D, 8, 15) },
    { id: "EV-002", name: "Harold J. Mensah",      branch: "Northgate", type: "pm",      status: "completed", date: new Date(Y, M, D, 9, 40) },
    { id: "EV-003", name: "Eleanor R. Boateng",    branch: "Riverside", type: "release", status: "completed", date: new Date(Y, M, D, 11, 0) },
    { id: "EV-004", name: "Samuel K. Owusu",       branch: "Eastfield", type: "intake",  status: "scheduled", date: new Date(Y, M, D, 13, 30) },
    { id: "EV-005", name: "Beatrice N. Adeyemi",   branch: "Northgate", type: "release", status: "pending",   date: new Date(Y, M, D + 1, 8, 0) },
    { id: "EV-006", name: "Daniel O. Asante",      branch: "Eastfield", type: "intake",  status: "scheduled", date: new Date(Y, M, D + 1, 9, 0) },
    { id: "EV-007", name: "Ruth A. Nyarko",        branch: "Riverside", type: "intake",  status: "scheduled", date: new Date(Y, M, D + 1, 10, 0) },
    { id: "EV-008", name: "Kofi B. Danso",         branch: "Northgate", type: "intake",  status: "scheduled", date: new Date(Y, M, D + 1, 11, 0) },
    { id: "EV-009", name: "Grace M. Adjei",        branch: "Northgate", type: "intake",  status: "scheduled", date: new Date(Y, M, D + 1, 12, 0) },
    { id: "EV-010", name: "Joseph T. Appiah",      branch: "Eastfield", type: "intake",  status: "scheduled", date: new Date(Y, M, D + 1, 13, 0) },
    { id: "EV-011", name: "Comfort E. Sarpong",    branch: "Riverside", type: "intake",  status: "scheduled", date: new Date(Y, M, D + 1, 14, 0) },
    { id: "EV-012", name: "William A. Osei",       branch: "Eastfield", type: "intake",  status: "scheduled", date: new Date(Y, M, D + 1, 15, 0) },
    { id: "EV-016", name: "David K. Boateng",      branch: "Riverside", type: "intake",  status: "scheduled", date: new Date(Y, M, D + 1, 16, 0) },
    { id: "EV-017", name: "Sarah A. Mensah",       branch: "Northgate", type: "release", status: "scheduled", date: new Date(Y, M, D + 1, 17, 0) },
    { id: "EV-013", name: "Victoria M. Ansah",     branch: "Northgate", type: "release", status: "completed", date: new Date(Y, M, D - 1, 10, 0) },
    { id: "EV-014", name: "Kwame A. Mensah",       branch: "Riverside", type: "intake",  status: "completed", date: new Date(Y, M, D - 2, 14, 0) },
    { id: "EV-015", name: "Abena O. Serwaa",       branch: "Eastfield", type: "release", status: "pending",   date: new Date(Y, M, D + 3, 11, 0) },
  ];
}

/* ============================================================
   MAIN COMPONENT: DeceasedScheduleCalendar
   ============================================================ */
export default function DeceasedScheduleCalendar({
  events: eventsProp = [],
  onEventSelect,
  onCreateIntake,
  initialView = "month",
  branch: initialBranch = "",
  loading = false,
}) {
  const [view, setView] = useState(initialView);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(initialBranch || "all");
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Normalize incoming event objects into uniform calendar events
  const allEvents = useMemo(() => {
    if (eventsProp && eventsProp.length > 0) {
      return eventsProp.map((e, index) => {
        const d = e.deceased || {};
        const p = e.p || {};
        const name = d.name || p.name || e.name || e.title || "Record";
        const branch = e.branch || d.branch || p.branch || "Riverside";
        const type = (e.type || e.t || "intake").toLowerCase();
        const status = (e.status || (e.release && e.release.status) || "scheduled").toLowerCase();
        const dateObj = parseToDate(e.date || e.start, e.time);

        return {
          id: e.id || e.uid || `EVT-${index + 1}`,
          uid: e.uid || d.id || p.uid || "",
          name,
          branch,
          type: TYPE_STYLES[type] ? type : "intake",
          status: STATUS_STYLES[status] ? status : "scheduled",
          date: dateObj,
          raw: e,
        };
      });
    }
    return getMockEvents();
  }, [eventsProp]);

  // Extract available branch options
  const branchOptions = useMemo(() => {
    const set = new Set();
    allEvents.forEach((e) => {
      if (e.branch) set.add(e.branch);
    });
    return Array.from(set);
  }, [allEvents]);

  // Filter events based on search, branch, and current view date
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // 1. Text & Branch filters
    const matched = allEvents.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.branch.toLowerCase().includes(q) ||
        String(e.id).toLowerCase().includes(q);

      const matchBranch = selectedBranch === "all" || e.branch === selectedBranch;

      return matchSearch && matchBranch;
    });

    // 2. Date filters based on view
    if (view === "day") {
      return matched.filter((e) => isSameDay(e.date, selectedDate));
    }
    if (view === "week") {
      const ws = startOfWeek(selectedDate);
      const we = addDays(ws, 7);
      return matched.filter((e) => e.date >= ws && e.date < we);
    }
    // Month or List
    const monthFirst = new Date(viewYear, viewMonth, 1);
    return matched.filter((e) => isSameMonth(e.date, monthFirst));
  }, [allEvents, searchQuery, selectedBranch, view, selectedDate, viewYear, viewMonth]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = filteredEvents.length;
    const intakes = filteredEvents.filter((e) => e.type === "intake").length;
    const releases = filteredEvents.filter((e) => e.type === "release").length;
    const pms = filteredEvents.filter((e) => e.type === "pm").length;
    return { total, intakes, releases, pms };
  }, [filteredEvents]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (view === "day") {
      setSelectedDate((d) => addDays(d, -1));
    } else if (view === "week") {
      setSelectedDate((d) => addDays(d, -7));
    } else {
      setViewMonth((m) => {
        if (m === 0) {
          setViewYear((y) => y - 1);
          return 11;
        }
        return m - 1;
      });
    }
  }, [view]);

  const handleNext = useCallback(() => {
    if (view === "day") {
      setSelectedDate((d) => addDays(d, 1));
    } else if (view === "week") {
      setSelectedDate((d) => addDays(d, 7));
    } else {
      setViewMonth((m) => {
        if (m === 11) {
          setViewYear((y) => y + 1);
          return 0;
        }
        return m + 1;
      });
    }
  }, [view]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  }, []);

  const handleRefresh = useCallback(() => {
    setSearchQuery("");
    setSelectedBranch("all");
    handleToday();
  }, [handleToday]);

  const handleJumpToDay = useCallback((d) => {
    setSelectedDate(d);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
    setView("day");
  }, []);

  // Title calculation for toolbar
  const currentDateLabel = useMemo(() => {
    if (view === "day") {
      return selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (view === "week") {
      const ws = startOfWeek(selectedDate);
      const we = addDays(ws, 6);
      return `${fmtMD(ws)} – ${fmtMD(we)}, ${ws.getFullYear()}`;
    }
    return new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [view, selectedDate, viewYear, viewMonth]);

  // Today marker
  const todayDate = useMemo(() => new Date(), []);

  return (
    <div className="deceased-schedule">
      {/* ─── TOPBAR ─── */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-mark">MO</div>
          <div className="topbar-brand-text">
            <h2>Mortuary OS</h2>
            <p>Deceased Schedule & Hearse Dispatch</p>
          </div>
        </div>

        <div className="topbar-center">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search name, branch, or record ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="all">All Branches</option>
            {branchOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="topbar-right">
          {onCreateIntake && (
            <button
              type="button"
              className="btn-create-intake"
              onClick={onCreateIntake}
              title="Register a new deceased intake"
            >
              <Plus size={15} />
              <span>Register Intake</span>
            </button>
          )}
          <button type="button" className="btn-refresh" onClick={handleRefresh} title="Reset filters">
            <RotateCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <div className="app">
        {/* ─── TOOLBAR (DATES & VIEWS) ─── */}
        <div className="cb-tb">
          <div className="cb-tb-left">
            <button type="button" className="cb-tb-btn sq" onClick={handlePrev} title="Previous period">
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="cb-tb-btn sq" onClick={handleNext} title="Next period">
              <ChevronRight size={16} />
            </button>
            <button type="button" className="cb-tb-btn" onClick={handleToday}>
              Today
            </button>
            <div className="current-date-label">{currentDateLabel}</div>
          </div>

          <div className="cb-tb-right">
            <div className="cb-tb-views">
              <button
                type="button"
                className={`cb-tb-v ${view === "day" ? "on" : ""}`}
                onClick={() => setView("day")}
              >
                Day
              </button>
              <button
                type="button"
                className={`cb-tb-v ${view === "week" ? "on" : ""}`}
                onClick={() => setView("week")}
              >
                Week
              </button>
              <button
                type="button"
                className={`cb-tb-v ${view === "month" ? "on" : ""}`}
                onClick={() => setView("month")}
              >
                Month
              </button>
              <button
                type="button"
                className={`cb-tb-v ${view === "list" ? "on" : ""}`}
                onClick={() => setView("list")}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* ─── STAT STRIP ─── */}
        <div className="cb-sr">
          <div className="cb-sr-item" style={{ background: "#3b82f6" }}>
            <div className="cb-sr-ico">
              <CalendarIcon size={18} />
            </div>
            <div className="cb-sr-info">
              <div className="cb-sr-num">{stats.total}</div>
              <div className="cb-sr-label">Total Events</div>
            </div>
          </div>
          <div className="cb-sr-item" style={{ background: "#eab308" }}>
            <div className="cb-sr-ico">
              <UserRoundPlus size={18} />
            </div>
            <div className="cb-sr-info">
              <div className="cb-sr-num">{stats.intakes}</div>
              <div className="cb-sr-label">Intakes</div>
            </div>
          </div>
          <div className="cb-sr-item" style={{ background: "#ef4444" }}>
            <div className="cb-sr-ico">
              <DoorOpen size={18} />
            </div>
            <div className="cb-sr-info">
              <div className="cb-sr-num">{stats.releases}</div>
              <div className="cb-sr-label">Releases</div>
            </div>
          </div>
          <div className="cb-sr-item" style={{ background: "#111827" }}>
            <div className="cb-sr-ico">
              <Activity size={18} />
            </div>
            <div className="cb-sr-info">
              <div className="cb-sr-num">{stats.pms}</div>
              <div className="cb-sr-label">Postmortems</div>
            </div>
          </div>
        </div>

        {/* ─── MAIN CONTENT AREA ─── */}
        <main className="cb-main">
          {filteredEvents.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "var(--ink4)",
                fontWeight: 600,
                fontSize: "15px",
              }}
            >
              No events match your search or filters.
            </div>
          ) : view === "day" || view === "week" ? (
            /* 1. Board View (Day & Week) */
            <div className="board-frame">
              {(view === "week"
                ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i))
                : [selectedDate]
              ).map((d, i) => {
                const dayEvents = filteredEvents
                  .filter((e) => isSameDay(e.date, d))
                  .sort((a, b) => a.date - b.date);
                const isTd = isSameDay(d, todayDate);

                return (
                  <div key={i} className="board-col">
                    <div className={`board-col-header ${isTd ? "today" : ""}`}>
                      <div>
                        <div className="day-name">
                          {d.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div className="day-date">{d.getDate()}</div>
                      </div>
                      <div className="day-count">{dayEvents.length} events</div>
                    </div>
                    <div className="board-col-body">
                      {dayEvents.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "var(--ink4)",
                            fontSize: "12px",
                          }}
                        >
                          No events
                        </div>
                      ) : (
                        dayEvents.map((e) => {
                          const style = TYPE_STYLES[e.type] || TYPE_STYLES.intake;
                          return (
                            <button
                              type="button"
                              key={e.id}
                              className="event-chip"
                              style={{
                                "--chip-c": style.color,
                                color: style.textColor,
                              }}
                              onClick={() => setSelectedEvent(e)}
                            >
                              <span className="time">{fmtTime(e.date)}</span>
                              <span className="name">{e.name}</span>
                              <span className="meta">
                                {e.branch}
                                <span
                                  className="type-badge"
                                  style={{
                                    background:
                                      style.textColor === "#111827"
                                        ? "rgba(0,0,0,0.15)"
                                        : "rgba(255,255,255,0.2)",
                                  }}
                                >
                                  {style.label}
                                </span>
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : view === "month" ? (
            /* 2. Month Grid View */
            <div className="mg-frame">
              <div className="mg-header">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="mg-header-cell">
                    {d}
                  </div>
                ))}
              </div>
              <div className="mg-grid">
                {(() => {
                  const firstOfMonth = new Date(viewYear, viewMonth, 1);
                  const start = startOfWeek(firstOfMonth);
                  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));

                  return days.map((d, index) => {
                    const isOther = !isSameMonth(d, firstOfMonth);
                    const isTd = isSameDay(d, todayDate);
                    const dayEvents = filteredEvents
                      .filter((e) => isSameDay(e.date, d))
                      .sort((a, b) => a.date - b.date);

                    const intakeCount = dayEvents.filter((e) => e.type === "intake").length;
                    const releaseCount = dayEvents.filter((e) => e.type === "release").length;

                    return (
                      <div
                        key={index}
                        className={`mg-day ${isOther ? "other" : ""} ${isTd ? "today" : ""}`}
                        onClick={() => handleJumpToDay(d)}
                      >
                        <div className="mg-day-header">
                          <div className="mg-day-num">{d.getDate()}</div>
                          <div className="mg-day-counts">
                            {intakeCount > 0 && (
                              <span className="count-badge intake" title={`${intakeCount} Intakes`}>
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="7" y1="7" x2="17" y2="17" />
                                  <polyline points="17 7 17 17 7 17" />
                                </svg>
                                {intakeCount}
                              </span>
                            )}
                            {releaseCount > 0 && (
                              <span className="count-badge release" title={`${releaseCount} Releases`}>
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="7" y1="17" x2="17" y2="7" />
                                  <polyline points="7 7 17 7 17 17" />
                                </svg>
                                {releaseCount}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mg-chips">
                          {dayEvents.map((e) => {
                            const style = TYPE_STYLES[e.type] || TYPE_STYLES.intake;
                            return (
                              <button
                                type="button"
                                key={e.id}
                                className="event-chip"
                                style={{
                                  "--chip-c": style.color,
                                  color: style.textColor,
                                  padding: "8px 10px",
                                  boxShadow: "none",
                                }}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setSelectedEvent(e);
                                }}
                              >
                                <span className="time">{fmtTime(e.date)}</span>
                                <span className="name" style={{ fontSize: "13px" }}>
                                  {e.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : (
            /* 3. List View */
            <div className="list-frame">
              <div className="list-header">
                <div>Deceased Name</div>
                <div>Branch</div>
                <div>Date & Time</div>
                <div>Event Type</div>
                <div>Status</div>
              </div>
              <div className="list-body">
                {filteredEvents.map((e) => {
                  const typeStyle = TYPE_STYLES[e.type] || TYPE_STYLES.intake;
                  const statusStyle = STATUS_STYLES[e.status] || STATUS_STYLES.scheduled;
                  return (
                    <div
                      key={e.id}
                      className="list-row"
                      onClick={() => setSelectedEvent(e)}
                    >
                      <div>
                        <div className="list-nm">{e.name}</div>
                        <div className="list-sub">{e.id}</div>
                      </div>
                      <div className="list-val">{e.branch}</div>
                      <div>
                        <div className="list-val">{fmtMDY(e.date)}</div>
                        <div className="list-sub">{fmtTime(e.date)}</div>
                      </div>
                      <div>
                        <span
                          className="status-badge"
                          style={{
                            background: typeStyle.color,
                            color: typeStyle.textColor,
                          }}
                        >
                          {typeStyle.label}
                        </span>
                      </div>
                      <div>
                        <span
                          className="status-badge"
                          style={{
                            color: statusStyle.color,
                            background: statusStyle.bg,
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: statusStyle.color,
                            }}
                          />
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── DETAIL PANEL / SLIDE-IN MODAL ─── */}
      {selectedEvent && (
        <>
          <div className="cb-ov" onClick={() => setSelectedEvent(null)} />
          <div className="cb-panel">
            <div className="cb-ph">
              <div
                className="status-badge"
                style={{
                  background: (TYPE_STYLES[selectedEvent.type] || TYPE_STYLES.intake).color,
                  color: (TYPE_STYLES[selectedEvent.type] || TYPE_STYLES.intake).textColor,
                  fontSize: "12px",
                }}
              >
                {(TYPE_STYLES[selectedEvent.type] || TYPE_STYLES.intake).label}
              </div>
              <button
                type="button"
                className="cb-ph-close"
                onClick={() => setSelectedEvent(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="cb-pb">
              <div className="cb-pb-client">{selectedEvent.name}</div>
              <div className="cb-pb-code">Record ID: {selectedEvent.id}</div>
              <div className="cb-pb-grid">
                <div className="cb-pb-card">
                  <div className="cb-pb-card-l">Branch</div>
                  <div className="cb-pb-card-v">{selectedEvent.branch}</div>
                </div>
                <div className="cb-pb-card">
                  <div className="cb-pb-card-l">Date</div>
                  <div className="cb-pb-card-v">{fmtMDY(selectedEvent.date)}</div>
                </div>
                <div className="cb-pb-card">
                  <div className="cb-pb-card-l">Time</div>
                  <div className="cb-pb-card-v">{fmtTime(selectedEvent.date)}</div>
                </div>
                <div className="cb-pb-card">
                  <div className="cb-pb-card-l">Status</div>
                  <div
                    className="cb-pb-card-v"
                    style={{
                      color: (STATUS_STYLES[selectedEvent.status] || STATUS_STYLES.scheduled).color,
                      fontWeight: 800,
                    }}
                  >
                    {(STATUS_STYLES[selectedEvent.status] || STATUS_STYLES.scheduled).label}
                  </div>
                </div>
                <div className="cb-pb-card wide">
                  <div className="cb-pb-card-l">Operational Notes</div>
                  <div
                    className="cb-pb-card-v"
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--ink3)",
                      lineHeight: "1.5",
                    }}
                  >
                    {selectedEvent.raw?.note ||
                      "Standard mortuary dispatch protocol applies. Ensure identification tags, release authorization, and vehicle transfer logs are verified prior to handover."}
                  </div>
                </div>
              </div>

              <div className="cb-pb-actions">
                {onEventSelect && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      const ev = selectedEvent;
                      setSelectedEvent(null);
                      onEventSelect({ event: ev, deceased: ev.raw?.deceased || ev });
                    }}
                  >
                    Open Case Record
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
