import { Ic } from "./opsIcons";

/**
 * The operations toolbar for navigation, search, branch, schedule, and account
 * controls.
 */
export function Header({
  showOpsToolbar,
  section,
  view,
  isBoardPeriod,
  scheduleWindow,
  scheduleEventCount,
  badges,
  NAV,
  VIEWS,
  search,
  branch,
  branchOptions,
  cases,
  today,
  setSearch,
  setBranch,
  setFilters,
  setView,
  setSection,
  setTodayMode,
  setCalY,
  setCalM,
  setSelDate,
  setClickedDay,
  setDayTab,
  goToday,
  stepPeriod,
  onNav,
  togglePill,
  setV,
  avatarText,
}) {
  const goTodayWrapped = () => {
    setTodayMode(false);
    setSelDate(today);
    setClickedDay(null);
    setDayTab("all");
    setSection("command");
    setView("day");
    setCalY(Number(today.slice(0, 4)));
    setCalM(Number(today.slice(5, 7)) - 1);
  };

  return (
    <>
      {showOpsToolbar ? (
        <header
          className={`tbar${isBoardPeriod ? " sched-mode" : ""}`}
        >
          <div className="tb-left">
            <div className="nvp">
              {NAV.map((n) => {
                const b = badges[n.id];
                return (
                  <button
                    key={n.id}
                    className={section === n.id ? "on" : ""}
                    onClick={() => onNav(n.id)}
                    title={n.full}
                    aria-label={n.full}
                  >
                    <Ic n={n.icon} s={13} /> {n.label}
                    {b > 0 ? <span className="nvb">{b}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tb-right">
            <div className="searchbox">
              <Ic n="search" s={13} />
              <input
                id="rpd-search"
                type="text"
                placeholder="Search…"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search ? (
                <button
                  className="clearx"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <Ic n="x" s={12} />
                </button>
              ) : null}
            </div>

            <div className="selwrap">
              <select
                aria-label="Branch"
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  setFilters([]);
                }}
              >
                <option value="">All Branches ({cases.length})</option>
                {branchOptions.map((b) => (
                  <option key={b} value={b}>
                    {b} ({cases.filter((c) => c.branch === b).length})
                  </option>
                ))}
              </select>
            </div>

            <div className="divider" />

            <div className="tb-sched">
              <button className="tb-btn today-hot" onClick={goTodayWrapped}>
                Today
              </button>
              <div className="navpair" aria-label="Change schedule period">
                <button
                  className="tb-btn sq"
                  onClick={() => stepPeriod(-1)}
                  title="Previous period"
                  aria-label="Previous period"
                >
                  ‹
                </button>
                <button
                  className="tb-btn sq"
                  onClick={() => stepPeriod(1)}
                  title="Next period"
                  aria-label="Next period"
                >
                  ›
                </button>
              </div>
              {isBoardPeriod ? (
                <div className="tb-period" aria-live="polite">
                  <b>{scheduleWindow.title}</b>
                  <span>{scheduleWindow.year}</span>
                </div>
              ) : null}
              {isBoardPeriod ? (
                <div className="tb-period-count">
                  <b>{scheduleEventCount}</b>
                  <span>
                    {scheduleEventCount === 1 ? "event" : "events"} {view === "week" ? "this week" : "today"}
                  </span>
                </div>
              ) : null}
              <div className="views">
                {VIEWS.map((v) => (
                  <button
                    key={v.id}
                    className={view === v.id ? "on" : ""}
                    onClick={() => setV(v.id)}
                    aria-pressed={view === v.id}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="avatar">{avatarText}</div>
          </div>
        </header>
      ) : null}
    </>
  );
}