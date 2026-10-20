import {
  Activity,
  ArrowRight,
  CalendarDays,
  Clock3,
  DoorOpen,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { eventsOf } from "./opsData";
import "./dashboard-overview.css";

const EVENT_META = {
  intake: { label: "Body intake", color: "#3f6c4b", icon: UserRoundPlus },
  release: { label: "Body release", color: "#66866b", icon: DoorOpen },
  pm: { label: "Postmortem", color: "#9a7b45", icon: Activity },
};

function displayDate(key) {
  if (!key) return "Date not set";
  const date = new Date(`${key}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "Date not set"
    : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function countForMonth(records, field, monthKey) {
  return records.filter((record) => String(field(record) || "").startsWith(monthKey)).length;
}

function MetricCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <article className={`overview-metric ${tone}`}>
      <span className="overview-metric-icon"><Icon size={18} /></span>
      <div className="overview-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function EventRow({ event, onOpenCase }) {
  const meta = EVENT_META[event.t] || EVENT_META.intake;
  const Icon = meta.icon;
  return (
    <button
      type="button"
      className="overview-event"
      onClick={() => onOpenCase(event.p.uid, event.t)}
    >
      <span className="overview-event-icon" style={{ color: meta.color, background: `${meta.color}14` }}>
        <Icon size={16} />
      </span>
      <span className="overview-event-main">
        <strong>{event.p.name}</strong>
        <small>{meta.label} · {event.p.branch || "Branch not set"}</small>
      </span>
      <span className="overview-event-date">
        <b>{event.time || "—"}</b>
        <small>{displayDate(event.date)}</small>
      </span>
      <ArrowRight className="overview-event-arrow" size={15} />
    </button>
  );
}

function TodayOperationRow({ event, onOpenCase }) {
  const meta = EVENT_META[event.t] || EVENT_META.intake;
  const Icon = meta.icon;
  const completed = event.t === "release"
    ? event.p.release?.status === "completed"
    : event.t === "pm" && event.completed;
  return (
    <button
      type="button"
      className="overview-today-operation"
      onClick={() => onOpenCase(event.p.uid, event.t)}
    >
      <span className="overview-event-icon" style={{ color: meta.color, background: `${meta.color}14` }}>
        <Icon size={16} />
      </span>
      <span className="overview-event-main">
        <strong>{event.p.name}</strong>
        <small>{meta.label} · {event.p.branch || "Branch not set"}</small>
      </span>
      <span className="overview-operation-meta">
        <b>{event.time || "Time not set"}</b>
        <small className={completed ? "is-complete" : ""}>{completed ? "Completed" : "Today"}</small>
      </span>
      <ArrowRight className="overview-event-arrow" size={15} />
    </button>
  );
}

export default function DashboardOverview({
  cases,
  calc,
  loading,
  today,
  onNavigate,
  onOpenCase,
}) {
  const records = cases || [];
  const care = calc?.care || {};
  const month = today.slice(0, 7);
  const monthIntakes = countForMonth(records, (record) => record.admDate, month);
  const monthReleases = countForMonth(
    records,
    (record) => record.release?.status === "completed" ? record.release.date : "",
    month
  );
  const events = eventsOf(records);
  const todayEvents = events
    .filter((event) => event.date === today)
    .sort((a, b) => `${a.time || ""} ${a.t}`.localeCompare(`${b.time || ""} ${b.t}`));
  const todayIntakes = todayEvents.filter((event) => event.t === "intake").length;
  const todayReleases = todayEvents.filter((event) => event.t === "release").length;
  const todayPostmortems = todayEvents.filter((event) => event.t === "pm").length;
  const upcoming = events
    .filter((event) => event.date >= today)
    .sort((a, b) => `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`))
    .slice(0, 6);
  const flow = (calc?.last7 || []).map((day) => ({
    ...day,
    label: day.dow,
  }));

  return (
    <section className="overview-page" aria-labelledby="overview-title">
      <div className="overview-welcome">
        <div>
          <span className="overview-eyebrow"><span /> OPERATIONS OVERVIEW</span>
          <h1 id="overview-title">Good to see you.</h1>
          <p>Your mortuary activity at a glance. Here’s what needs attention today.</p>
        </div>
        <div className="overview-date">
          <CalendarDays size={16} />
          <span>{new Date(`${today}T00:00:00`).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}</span>
        </div>
      </div>

      <div className="overview-metrics">
        <MetricCard
          icon={UsersRound}
          label="Total records"
          value={calc?.total ?? records.length}
          detail="Across selected branches"
          tone="indigo"
        />
        <MetricCard
          icon={Clock3}
          label="In care"
          value={care.inCare || 0}
          detail="Currently awaiting release"
          tone="teal"
        />
        <MetricCard
          icon={UserRoundPlus}
          label="Intakes this month"
          value={monthIntakes}
          detail="New admissions"
          tone="blue"
        />
        <MetricCard
          icon={DoorOpen}
          label="Released this month"
          value={monthReleases}
          detail="Completed handovers"
          tone="green"
        />
      </div>

      <div className="overview-shortcuts" aria-label="Quick actions">
        <button type="button" onClick={() => onNavigate("intake")}>
          <span className="overview-shortcut-icon"><UserRoundPlus size={17} /></span>
          <span><b>Register a deceased</b><small>Start a new intake</small></span>
          <ArrowRight size={16} />
        </button>
        <button type="button" onClick={() => onNavigate("release-calendar")}>
          <span className="overview-shortcut-icon release"><CalendarDays size={17} /></span>
          <span><b>View release calendar</b><small>Upcoming releases and handovers</small></span>
          <ArrowRight size={16} />
        </button>
      </div>

      <article className="overview-panel overview-today">
        <div className="overview-panel-head">
          <div>
            <h2>Today’s operations</h2>
            <p>Live intake, release and postmortem activity</p>
          </div>
          <div className="overview-today-summary" aria-label="Today's operation counts">
            <span><b>{todayIntakes}</b> intakes</span>
            <span><b>{todayReleases}</b> releases</span>
            <span><b>{todayPostmortems}</b> postmortems</span>
          </div>
        </div>
        {loading && !records.length ? (
          <div className="overview-queue-empty">Loading today’s operations…</div>
        ) : todayEvents.length ? (
          <div className="overview-event-list">
            {todayEvents.map((event) => (
              <TodayOperationRow
                key={`${event.t}-${event.p.uid}-${event.date}`}
                event={event}
                onOpenCase={onOpenCase}
              />
            ))}
          </div>
        ) : (
          <div className="overview-queue-empty overview-today-empty">
            <CalendarDays size={22} />
            <strong>No operations scheduled today</strong>
            <span>Today’s deceased activity will appear here when it is recorded.</span>
          </div>
        )}
      </article>

      <div className="overview-panels">
        <article className="overview-panel overview-flow">
          <div className="overview-panel-head">
            <div>
              <h2>Recent activity</h2>
              <p>Intakes and completed releases over the last 7 days</p>
            </div>
            <span className="overview-live"><i /> LAST 7 DAYS</span>
          </div>
          {flow.length ? (
            <div className="overview-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={flow} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="#edf0f5" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#8a94a7", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "#8a94a7", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ border: "1px solid #e6eaf1", borderRadius: 10, boxShadow: "0 8px 24px rgba(25,39,68,.08)" }}
                    labelStyle={{ color: "#47546a", fontWeight: 700 }}
                  />
                  <Line type="monotone" dataKey="adm" name="Intakes" stroke="#3f6c4b" strokeWidth={2.5} dot={{ r: 3, fill: "#3f6c4b", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="rel" name="Releases" stroke="#9a7b45" strokeWidth={2.5} dot={{ r: 3, fill: "#9a7b45", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="overview-chart-empty">Activity will appear here as records are added.</div>
          )}
          <div className="overview-chart-legend">
            <span><i className="intake" /> Intakes</span>
            <span><i className="release" /> Releases</span>
          </div>
        </article>

        <article className="overview-panel overview-queue">
          <div className="overview-panel-head">
            <div>
              <h2>Next on the schedule</h2>
              <p>Upcoming activity across your branches</p>
            </div>
            <button type="button" className="overview-link" onClick={() => onNavigate("release-calendar")}>
              Calendar <ArrowRight size={14} />
            </button>
          </div>
          {loading && !records.length ? (
            <div className="overview-queue-empty">Loading the latest records…</div>
          ) : upcoming.length ? (
            <div className="overview-event-list">
              {upcoming.map((event) => (
                <EventRow key={`${event.t}-${event.p.uid}-${event.date}`} event={event} onOpenCase={onOpenCase} />
              ))}

            </div>
          ) : (
            <div className="overview-queue-empty">
              <CalendarDays size={22} />
              <strong>No scheduled activity yet</strong>
              <span>New intakes and releases will show here.</span>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
