import React, { useState, useMemo, useCallback } from "react";
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
  Truck,
  ArrowRight,
  User,
  Building,
  Clock,
  FileText,
} from "lucide-react";
import "./deceased-calendar.css";

/* ============================================================
   TYPE & STATUS CONFIGS (Matches Coffin Full Calendar Palette)
   ============================================================ */
const TYPE_STYLES = {
  intake:   { label: "INTAKE",      color: "#16a34a", bg: "#ecfdf5", border: "#bbf7d0", mark: "INTAKE" },
  release:  { label: "RELEASE",     color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", mark: "RELEASE" },
  pm:       { label: "POSTMORTEM",  color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff", mark: "PM" },
  funeral:  { label: "FUNERAL",     color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4", mark: "FUNERAL" },
  transfer: { label: "TRANSFER",    color: "#d97706", bg: "#fffbeb", border: "#fde68a", mark: "TRANSFER" },
};

const STATUS_STYLES = {
  pending:    { label: "Pending",     color: "#d97706", bg: "#fffbeb" },
  completed:  { label: "Completed",   color: "#16a34a", bg: "#ecfdf5" },
  scheduled:  { label: "Scheduled",   color: "#0284c7", bg: "#f0f9ff" },
  in_transit: { label: "In Transit",  color: "#ea580c", bg: "#fff7ed" },
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

function fmtTime(d, fallbackTime = "") {
  if (!d) return fallbackTime || "";
  try {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return fallbackTime || "";
  }
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

  return new Date(y || new Date().getFullYear(), (m || 1) - 1, d || 1, hours, minutes);
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
  const [selectedType, setSelectedType] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Normalize incoming event objects into uniform calendar events (REAL DATA ONLY - no mock events!)
  const allEvents = useMemo(() => {
    if (!eventsProp || !Array.isArray(eventsProp) || eventsProp.length === 0) {
      return [];
    }

    return eventsProp.map((e, index) => {
      const d = e.deceased || {};
      const p = e.p || {};
      const name = d.name || p.name || e.name || e.title || "Record";
      const branch = e.branch || d.branch || p.branch || "";
      const type = (e.type || e.t || "intake").toLowerCase();
      const status = (e.status || (e.release && e.release.status) || "completed").toLowerCase();
      const officer =
        e.officer ||
        p.officer ||
        d.officer ||
        e.raw?.receiving_officer ||
        e.raw?.received_by ||
        p.raw?.receiving_officer ||
        p.raw?.received_by ||
        "";
      const admissionNumber = d.admissionNumber || p.adm || e.admissionNumber || e.id || "";
      const receivedFrom = e.receivedFrom || p.receivedFrom || d.receivedFrom || "";
      const dateObj = parseToDate(e.date || e.start, e.time);

      return {
        id: e.id || e.uid || `EVT-${index + 1}`,
        uid: e.uid || d.id || p.uid || "",
        admissionNumber,
        name,
        branch,
        officer,
        receivedFrom,
        type: TYPE_STYLES[type] ? type : "intake",
        status: STATUS_STYLES[status] ? status : "completed",
        date: dateObj,
        time: e.time || "",
        raw: e,
      };
    });
  }, [eventsProp]);

  // Extract available branch options from actual real data
  const branchOptions = useMemo(() => {
    const set = new Set();
    allEvents.forEach((e) => {
      if (e.branch && String(e.branch).trim() !== "") {
        set.add(String(e.branch).trim());
      }
    });
    return Array.from(set).sort();
  }, [allEvents]);

  // Filter events based on search (ID, name, receiving officer), branch, type, and date
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // 1. Text (ID, Name, Officer, Received From), Branch, and Type filters
    const matched = allEvents.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        String(e.admissionNumber || "").toLowerCase().includes(q) ||
        String(e.id || "").toLowerCase().includes(q) ||
        String(e.officer || "").toLowerCase().includes(q) ||
        String(e.receivedFrom || "").toLowerCase().includes(q) ||
        e.branch.toLowerCase().includes(q);

      const matchBranch = selectedBranch === "all" || e.branch.toLowerCase() === selectedBranch.toLowerCase();
      const matchType = selectedType === "all" || e.type === selectedType;

      return matchSearch && matchBranch && matchType;
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
    if (view === "month") {
      const monthFirst = new Date(viewYear, viewMonth, 1);
      return matched.filter((e) => isSameMonth(e.date, monthFirst));
    }
    // List view shows matched events
    return matched;
  }, [allEvents, searchQuery, selectedBranch, selectedType, view, selectedDate, viewYear, viewMonth]);

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
    setSelectedType("all");
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
        weekday: "short",
        month: "short",
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

  const todayDate = useMemo(() => new Date(), []);

  return (
    <div className="deceased-schedule">
      {/* ─── COFFIN-STYLE TOOLBAR (NO DUPLICATE HEADER) ─── */}
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

          <div className="cb-divider" />

          {/* Search by ID, Name, Receiving Officer */}
          <div className="cb-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search ID, name, or receiving officer…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--ink4)" }}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Branch filter */}
          {branchOptions.length > 0 && (
            <select
              className="cb-branch-select"
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
          )}

          {/* Type filter chips (Coffin style) */}
          <div className="cb-filter-chips">
            <button
              type="button"
              className={`cb-fc ${selectedType === "all" ? "on" : ""}`}
              onClick={() => setSelectedType("all")}
            >
              All <span className="cb-fc-ct">{allEvents.length}</span>
            </button>
            <button
              type="button"
              className={`cb-fc ${selectedType === "intake" ? "on" : ""}`}
              onClick={() => setSelectedType(selectedType === "intake" ? "all" : "intake")}
            >
              <span className="cb-fc-dot" style={{ background: "#16a34a" }} />
              Intake <span className="cb-fc-ct">{allEvents.filter((e) => e.type === "intake").length}</span>
            </button>
            <button
              type="button"
              className={`cb-fc ${selectedType === "release" ? "on" : ""}`}
              onClick={() => setSelectedType(selectedType === "release" ? "all" : "release")}
            >
              <span className="cb-fc-dot" style={{ background: "#0284c7" }} />
              Release <span className="cb-fc-ct">{allEvents.filter((e) => e.type === "release").length}</span>
            </button>
            <button
              type="button"
              className={`cb-fc ${selectedType === "pm" ? "on" : ""}`}
              onClick={() => setSelectedType(selectedType === "pm" ? "all" : "pm")}
            >
              <span className="cb-fc-dot" style={{ background: "#7c3aed" }} />
              Postmortem <span className="cb-fc-ct">{allEvents.filter((e) => e.type === "pm").length}</span>
            </button>
          </div>
        </div>

        <div className="cb-tb-right">
          {/* View switcher */}
          <div className="cb-tb-views">
            <button
              type="button"
              className={`cb-tb-v ${view === "month" ? "on" : ""}`}
              onClick={() => setView("month")}
            >
              Month
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
              className={`cb-tb-v ${view === "day" ? "on" : ""}`}
              onClick={() => setView("day")}
            >
              Day
            </button>
            <button
              type="button"
              className={`cb-tb-v ${view === "list" ? "on" : ""}`}
              onClick={() => setView("list")}
            >
              List
            </button>
          </div>

          <button
            type="button"
            className="cb-tb-btn sq"
            onClick={handleRefresh}
            title="Reset filters & go to today"
          >
            <RotateCw size={13} />
          </button>

          {onCreateIntake && (
            <button
              type="button"
              className="cb-btn-primary"
              onClick={onCreateIntake}
              title="Register a new deceased intake"
            >
              <Plus size={14} />
              <span>Register Intake</span>
            </button>
          )}
        </div>
      </div>

      <div className="app">
        {/* ─── COFFIN-STYLE STAT STRIP ─── */}
        <div className="cb-sr">
          <div className="cb-sr-item" style={{ background: "#0f766e" }}>
            <div className="cb-sr-ico">
              <CalendarIcon size={16} />
            </div>
            <div className="cb-sr-info">
              <div className="cb-sr-num">{stats.total}</div>
              <div className="cb-sr-label">Total Operations</div>
            </div>
          </div>
          <div className="cb-sr-item" style={{ background: "#16a34a" }}>
            <div className="cb-sr-ico">
              <UserRoundPlus size={16} />
            </div>
            <div className="cb-sr-info">
              <div className="cb-sr-num">{stats.intakes}</div>
              <div className="cb-sr-label">Intakes</div>
            </div>
          </div>
          <div className="cb-sr-item" style={{ background: "#0284c7" }}>
            <div className="cb-sr-ico">
              <DoorOpen size={16} />
            </div>
            <div className="cb-sr-info">
              <div className="cb-sr-num">{stats.releases}</div>
              <div className="cb-sr-label">Releases</div>
            </div>
          </div>
          <div className="cb-sr-item" style={{ background: "#7c3aed" }}>
            <div className="cb-sr-ico">
              <Activity size={16} />
            </div>
            <div className="cb-sr-info">
              <div className="cb-sr-num">{stats.pms}</div>
              <div className="cb-sr-label">Postmortems</div>
            </div>
          </div>
        </div>

        {/* ─── MAIN CONTENT AREA (COFFIN GRID SYSTEM) ─── */}
        <main className="cb-main">
          {loading && allEvents.length === 0 ? (
            <div className="cb-empty-state">
              <div className="cb-spinner" />
              <p>Loading real deceased records…</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="cb-empty-state">
              <CalendarIcon size={36} style={{ color: "var(--ink4)", marginBottom: 10 }} />
              <h3>No operations found</h3>
              <p>
                {searchQuery || selectedBranch !== "all" || selectedType !== "all"
                  ? "No deceased records match your search or filter criteria."
                  : "No deceased intakes or releases scheduled for this period."}
              </p>
              {(searchQuery || selectedBranch !== "all" || selectedType !== "all") && (
                <button
                  type="button"
                  className="cb-tb-btn"
                  onClick={handleRefresh}
                  style={{ marginTop: 12 }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : view === "day" || view === "week" ? (
            /* 1. Day & Week View (Coffin Week Grid) */
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
                      <div className="day-count">{dayEvents.length} records</div>
                    </div>
                    <div className="board-col-body">
                      {dayEvents.length === 0 ? (
                        <div className="col-empty">No events</div>
                      ) : (
                        dayEvents.map((e) => {
                          const style = TYPE_STYLES[e.type] || TYPE_STYLES.intake;
                          return (
                            <button
                              type="button"
                              key={e.id}
                              className="fc-chip"
                              style={{
                                "--chip-c": style.color,
                                "--chip-bg": style.bg,
                                "--chip-b": style.border,
                              }}
                              onClick={() => setSelectedEvent(e)}
                            >
                              <div className="chip-time">{fmtTime(e.date, e.time)}</div>
                              <div className="chip-name">{e.name}</div>
                              <div className="chip-meta">
                                {e.admissionNumber && <span className="chip-id">{e.admissionNumber}</span>}
                                {e.officer && <span className="chip-officer">Rec: {e.officer}</span>}
                              </div>
                              <span className="chip-badge" style={{ color: style.color, background: "#fff" }}>
                                {style.mark}
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
            /* 2. Month Grid View (Exact Coffin Month Grid) */
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
                                In: {intakeCount}
                              </span>
                            )}
                            {releaseCount > 0 && (
                              <span className="count-badge release" title={`${releaseCount} Releases`}>
                                Out: {releaseCount}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mg-chips">
                          {dayEvents.slice(0, 4).map((e) => {
                            const style = TYPE_STYLES[e.type] || TYPE_STYLES.intake;
                            return (
                              <button
                                type="button"
                                key={e.id}
                                className="fc-chip"
                                style={{
                                  "--chip-c": style.color,
                                  "--chip-bg": style.bg,
                                  "--chip-b": style.border,
                                }}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setSelectedEvent(e);
                                }}
                                title={`${e.name} (${e.admissionNumber || e.id}) - ${style.label} ${e.officer ? `| Rec: ${e.officer}` : ""}`}
                              >
                                <span className="chip-time">{fmtTime(e.date, e.time)}</span>
                                <span className="chip-name">{e.name}</span>
                                <span className="chip-badge" style={{ color: style.color, background: "#fff" }}>
                                  {style.mark}
                                </span>
                              </button>
                            );
                          })}
                          {dayEvents.length > 4 && (
                            <div className="fc-more">+{dayEvents.length - 4} more</div>
                          )}
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
                <div>Date & Time</div>
                <div>Admission No</div>
                <div>Deceased Name</div>
                <div>Receiving Officer</div>
                <div>Branch</div>
                <div>Operation</div>
                <div>Status</div>
                <div style={{ textAlign: "right" }}>Action</div>
              </div>
              <div className="list-body">
                {filteredEvents.map((e) => {
                  const typeStyle = TYPE_STYLES[e.type] || TYPE_STYLES.intake;
                  const statusStyle = STATUS_STYLES[e.status] || STATUS_STYLES.completed;
                  return (
                    <div
                      key={e.id}
                      className="list-row"
                      onClick={() => setSelectedEvent(e)}
                    >
                      <div>
                        <div className="list-nm">{fmtMDY(e.date)}</div>
                        <div className="list-sub">{fmtTime(e.date, e.time)}</div>
                      </div>
                      <div className="list-id-badge">
                        {e.admissionNumber || e.id || "—"}
                      </div>
                      <div>
                        <div className="list-nm" style={{ fontWeight: 700 }}>{e.name}</div>
                        {e.receivedFrom && <div className="list-sub">From: {e.receivedFrom}</div>}
                      </div>
                      <div className="list-val">
                        {e.officer || "—"}
                      </div>
                      <div className="list-val">{e.branch || "—"}</div>
                      <div>
                        <span
                          className="status-badge"
                          style={{
                            background: typeStyle.bg,
                            color: typeStyle.color,
                            border: `1px solid ${typeStyle.border}`,
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
                      <div style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="cb-tb-btn"
                          style={{ padding: "4px 10px", height: 28, fontSize: 11 }}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setSelectedEvent(e);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── DETAIL PANEL / SLIDE-IN MODAL (COFFIN STYLE) ─── */}
      {selectedEvent && (
        <>
          <div className="cb-ov" onClick={() => setSelectedEvent(null)} />
          <div className="cb-panel">
            <div className="cb-ph">
              <div
                className="status-badge"
                style={{
                  background: (TYPE_STYLES[selectedEvent.type] || TYPE_STYLES.intake).bg,
                  color: (TYPE_STYLES[selectedEvent.type] || TYPE_STYLES.intake).color,
                  border: `1px solid ${(TYPE_STYLES[selectedEvent.type] || TYPE_STYLES.intake).border}`,
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {(TYPE_STYLES[selectedEvent.type] || TYPE_STYLES.intake).label}
              </div>
              <button
                type="button"
                className="cb-ph-close"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close panel"
              >
                <X size={16} />
              </button>
            </div>
            <div className="cb-pb">
              <div className="cb-pb-client">{selectedEvent.name}</div>
              <div className="cb-pb-code">
                Admission No: <b>{selectedEvent.admissionNumber || selectedEvent.id}</b>
              </div>
              <div className="cb-pb-grid">
                <div className="cb-pb-card">
                  <div className="cb-pb-card-l">Branch</div>
                  <div className="cb-pb-card-v">{selectedEvent.branch || "Main"}</div>
                </div>
                <div className="cb-pb-card">
                  <div className="cb-pb-card-l">Receiving Officer</div>
                  <div className="cb-pb-card-v" style={{ color: "#0f766e", fontWeight: 700 }}>
                    {selectedEvent.officer || "—"}
                  </div>
                </div>
                <div className="cb-pb-card">
                  <div className="cb-pb-card-l">Date & Time</div>
                  <div className="cb-pb-card-v">
                    {fmtMDY(selectedEvent.date)} · {fmtTime(selectedEvent.date, selectedEvent.time)}
                  </div>
                </div>
                <div className="cb-pb-card">
                  <div className="cb-pb-card-l">Status</div>
                  <div
                    className="cb-pb-card-v"
                    style={{
                      color: (STATUS_STYLES[selectedEvent.status] || STATUS_STYLES.completed).color,
                      fontWeight: 800,
                    }}
                  >
                    {(STATUS_STYLES[selectedEvent.status] || STATUS_STYLES.completed).label}
                  </div>
                </div>
                {selectedEvent.receivedFrom && (
                  <div className="cb-pb-card wide">
                    <div className="cb-pb-card-l">Received From / Referral Source</div>
                    <div className="cb-pb-card-v">{selectedEvent.receivedFrom}</div>
                  </div>
                )}
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
                      "Verified intake record. Standard identification, tags, and mortuary storage protocol active."}
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
