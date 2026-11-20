import { useEffect, useState } from "react";
import { CountUp, InsightText, tipProps } from "./opsBits";
import { Ic } from "./opsIcons";
import { fmtK, parseKey, shortDate } from "./opsData";
import SchedulerView from "./opsScheduler";




/** Segmented ring; each segment eases in and opens its case list on click. */
export function Donut({ segs, size = 110, stroke = 17, label, onOpenModal }) {
  const [on, setOn] = useState(false);

  /* Animate when the segment VALUES change — keyed off a signature so a new
     array identity on every parent render can't restart the animation. */
  const sig = segs.map((s) => `${s.k}:${s.v}`).join("|");

  useEffect(() => {
    setOn(false);
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
    return () => cancelAnimationFrame(raf);
  }, [sig]);

  const r = (size - stroke) / 2 - 2;
  const C = 2 * Math.PI * r;
  const total = segs.reduce((s, x) => s + x.v, 0) || 1;

  let off = 0;
  const circles = segs.map((s, i) => {
    const dash = (s.v / total) * C;
    const pct = Math.round((s.v / total) * 100);
    const el = (
      <circle
        key={s.k}
        className="dn"
        {...tipProps(s.l, `${s.v} · ${pct}%`, "Click for the case list")}
        onClick={() => onOpenModal(`status:${s.k}`)}
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={s.c}
        strokeWidth={stroke}
        strokeDasharray={on ? `${dash} ${C - dash}` : `0 ${C}`}
        strokeDashoffset={-off}
        style={{ transition: `stroke-dasharray .9s cubic-bezier(.4,0,.2,1) ${i * 100}ms` }}
      />
    );
    off += dash;
    return el;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>{circles}</g>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        fontFamily="Inter"
        fontWeight="800"
        fontSize={size > 150 ? 26 : 18}
        fill="var(--tx)"
      >
        <CountUp value={total} />
      </text>
      {label ? (
        <text
          x="50%"
          y="63%"
          textAnchor="middle"
          fontFamily="IBM Plex Mono"
          fontSize="9"
          letterSpacing="1.5"
          fill="var(--tx4)"
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
}

/* ── horizontal bars ────────────────────────────────────────────────────── */

/** Labelled proportion bar used by the branch + staff cards. */
export function HBar({ label, value, max, color, delay = 0, modalKey, onClickModal, light = false }) {
  return (
    <div
      className={light ? "hb" : "hbar"}
      {...tipProps(label, `${value} ${light ? "cases" : "assignments"}`, "Click for detail")}
      onClick={modalKey ? () => onClickModal(modalKey) : undefined}
    >
      <span className="hl">{label}</span>
      <div className="ht">
        <div
          className="hf"
          style={{ width: `${Math.max(3, (value / (max || 1)) * 100)}%`, background: color, animationDelay: `${delay}s` }}
        />
      </div>
      <span className="hn">{value}</span>
    </div>
  );
}

/* ── last 7 days ────────────────────────────────────────────────────────── */

/** Paired intake / release columns for the trailing week. */
function Last7Bars({ last7, today, onOpenModal }) {
  let max = 1;
  last7.forEach((d) => { max = Math.max(max, d.adm, d.rel); });

  return (
    <div className="g7">
      {last7.map((d, i) => (
        <div
          key={d.key}
          className={`g7col${d.key === today ? " todaycol" : ""}`}
          {...tipProps(
            shortDate(d.key),
            `${d.adm} intake${d.adm !== 1 ? "s" : ""} · ${d.rel} release${d.rel !== 1 ? "s" : ""}`,
            "Click for full day activity"
          )}
          onClick={() => onOpenModal(`day:${d.key}`)}
        >
          <div className="g7bars">
            <div
              className="gb"
              style={{ height: `${Math.max(4, (d.adm / max) * 100)}%`, background: "var(--blue)", animationDelay: `${i * 0.06}s` }}
            />
            <div
              className="gb"
              style={{ height: `${Math.max(4, (d.rel / max) * 100)}%`, background: "var(--dng)", animationDelay: `${i * 0.06 + 0.05}s` }}
            />
          </div>
          <span>{d.dow}</span>
        </div>
      ))}
    </div>
  );
}

/* ── KPI card ───────────────────────────────────────────────────────────── */

function Kpi({ label, value, raw, suffix, sub, def, tip = [], modalKey, onOpenModal, tone = "" }) {
  const clickable = Boolean(modalKey && onOpenModal);
  return (
    <div
      className={`kpi${tone ? ` kpi-${tone}` : ""}`}
      {...tipProps(tip[0], tip[1], tip[2])}
      onClick={clickable ? () => onOpenModal(modalKey) : undefined}
    >
      <div className="lbl">{label}</div>
      <div className="big">
        {raw !== undefined ? raw : <><CountUp value={value} />{suffix}</>}
      </div>
      <div className="sub">{sub}</div>
      <div className="def">{def}</div>
    </div>
  );
}

/* ── annual trend line chart ────────────────────────────────────────────── */

/** Hand-built SVG line chart: intakes vs releases, January → December. */
function TrendChart({ flow, onOpenModal }) {
  const w = 760;
  const h = 270;
  const pl = 40;
  const pr = 16;
  const pt = 18;
  const pb = 30;
  const iw = w - pl - pr;
  const ih = h - pt - pb;

  let max = 1;
  flow.forEach((f) => { max = Math.max(max, f.adm, f.rel); });
  const nice = [5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60].filter((s) => max <= s)[0]
    || Math.ceil(max / 10) * 10;

  const X = (i) => pl + (i * iw) / (flow.length - 1);
  const Y = (v) => pt + ih - (v / nice) * ih;

  const curve = (vals) => {
    const pts = vals.map((v, i) => [X(i), Y(v)]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i += 1) {
      const mx = (pts[i - 1][0] + pts[i][0]) / 2;
      d += ` C${mx},${pts[i - 1][1]} ${mx},${pts[i][1]} ${pts[i][0]},${pts[i][1]}`;
    }
    return d;
  };

  const grid = [];
  const axis = [];
  for (let i = 0; i <= 4; i += 1) {
    const v = Math.round((nice * i) / 4);
    const y = Y(v);
    grid.push(<line key={`g${i}`} x1={pl} y1={y} x2={w - pr} y2={y} stroke="var(--brdl)" />);
    axis.push(
      <text
        key={`y${i}`}
        x={pl - 8}
        y={y + 3}
        textAnchor="end"
        fontSize="9.5"
        fill="var(--tx4)"
        fontFamily="IBM Plex Mono"
      >
        {v}
      </text>
    );
  }
  flow.forEach((f, i) => {
    axis.push(
      <text
        key={`x${f.key}`}
        x={X(i)}
        y={h - 8}
        textAnchor="middle"
        fontSize="9.5"
        fill="var(--tx4)"
        fontFamily="IBM Plex Mono"
      >
        {f.label}
      </text>
    );
  });

  const adm = flow.map((f) => f.adm);
  const rel = flow.map((f) => f.rel);
  const bottom = pt + ih;

  const dots = (vals, color) =>
    vals.map((v, i) => (
      <circle
        key={`d${color}${i}`}
        cx={X(i)}
        cy={Y(v)}
        r="4"
        fill="var(--card)"
        stroke={color}
        strokeWidth="2.5"
        className="apop"
        style={{ "--d": `${0.6 + i * 0.06}s`, pointerEvents: "none" }}
      />
    ));

  const hits = [];
  flow.forEach((f, i) => {
    const title = `${f.label} ${f.key.slice(0, 4)}`;
    const val = `${f.adm} intake${f.adm !== 1 ? "s" : ""} · ${f.rel} release${f.rel !== 1 ? "s" : ""}`;
    hits.push(
      <circle
        key={`ha${f.key}`}
        className="apop"
        style={{ "--d": `${0.6 + i * 0.06}s` }}
        cx={X(i)}
        cy={Y(f.adm)}
        r="11"
        fill="transparent"
        {...tipProps(title, val, "Click for the full month detail")}
        onClick={() => onOpenModal(`month:${f.key}`)}
      />,
      <circle
        key={`hr${f.key}`}
        className="apop"
        style={{ "--d": `${0.64 + i * 0.06}s` }}
        cx={X(i)}
        cy={Y(f.rel)}
        r="11"
        fill="transparent"
        {...tipProps(title, val, "Click for the full month detail")}
        onClick={() => onOpenModal(`month:${f.key}`)}
      />
    );
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="rpdGradA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--blue)", stopOpacity: 0.18 }} />
          <stop offset="1" style={{ stopColor: "var(--blue)", stopOpacity: 0 }} />
        </linearGradient>
        <linearGradient id="rpdGradR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--dng)", stopOpacity: 0.14 }} />
          <stop offset="1" style={{ stopColor: "var(--dng)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {grid}
      {axis}

      <path className="areafill" d={`${curve(rel)} L${X(flow.length - 1)},${bottom} L${pl},${bottom} Z`} fill="url(#rpdGradR)" />
      <path className="areafill" d={`${curve(adm)} L${X(flow.length - 1)},${bottom} L${pl},${bottom} Z`} fill="url(#rpdGradA)" />

      <path
        className="draw"
        style={{ "--d": ".1s" }}
        pathLength="1"
        d={curve(adm)}
        fill="none"
        stroke="var(--blue)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        className="draw"
        style={{ "--d": ".35s" }}
        pathLength="1"
        d={curve(rel)}
        fill="none"
        stroke="var(--dng)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {dots(adm, "var(--blue)")}
      {dots(rel, "var(--dng)")}
      {hits}
    </svg>
  );
}

/* ── analytics view ─────────────────────────────────────────────────────── */

const AGE_COLS = ["var(--tx4)", "var(--tx3)", "var(--blue)", "var(--blue)", "var(--plum)", "var(--tx)"];
const INSIGHT_DOTS = ["var(--blue)", "var(--dng)", "var(--orange)", "var(--plum)", "var(--teal)"];

/** Section shell: header row + optional intro note + body. */
function ACard({ title, right, note, children, span }) {
  return (
    <div className={`acard${span ? " span2" : ""}`}>
      <div className="ach">
        <b>{title}</b>
        {right}
      </div>
      {note ? <div className="achint">{note}</div> : null}
      {children}
    </div>
  );
}

function PeriodAnalytics({ people, view, selDate, dayTab, now, today, onOpenCase, onPickDay, onDayTabChange }) {
  return (
    <SchedulerView
      searched={people}
      state={{ view, selDate, dayTab: dayTab || "all", filters: [] }}
      now={now}
      today={today}
      onOpenCase={onOpenCase}
      onPickDay={onPickDay}
      onDayTabChange={onDayTabChange}
      reference
    />
  );
}

export function AnalyticsView({
  calc, people, branch, calY, view = "month", selDate, dayTab, now, today,
  onOpenModal, onOpenCase, onPickDay, onDayTabChange,
}) {
  /* The charts used to be REPLACED by the day/week scheduler (an early return
     above every card below), so switching the calendar to Day or Week made the
     whole analytics section lose its donut, trend line, 7-day bars and branch
     mix. Analytics is the one section whose Day/Week control is a drill-down,
     not a different page — so the scheduler is now rendered ABOVE the charts and
     the charts always stay. */
  const periodScheduler =
    view === "day" || view === "week" ? (
      <PeriodAnalytics
        people={people || []}
        view={view}
        selDate={selDate || today}
        dayTab={dayTab}
        now={now}
        today={today}
        onOpenCase={onOpenCase}
        onPickDay={onPickDay}
        onDayTabChange={onDayTabChange}
      />
    ) : null;

  const donutSegs = [
    { k: "in-care", c: "var(--blue)", v: calc.care.inCare, l: "In Care" },
    { k: "pm-req", c: "var(--orange)", v: calc.care.pmReq, l: "PM Requested" },
    { k: "pm-done", c: "var(--plum)", v: calc.care.pmDone, l: "PM Done" },
    { k: "released", c: "var(--teal)", v: calc.care.released, l: "Released / Transferred" },
  ];
  const bMax = Math.max(...calc.bmix.map((b) => b.n), 1);
  // `sMax` removed with the "Caseload by Staff" card — it had no other reader.
  const aMax = Math.max(...calc.buckets.map((b) => b[1]), 1);
  const legend = (
    <span className="chartlegend">
      <span><i style={{ background: "var(--blue)" }} />Intakes</span>
      <span><i style={{ background: "var(--dng)" }} />Releases</span>
    </span>
  );

  return (
    <>
      <div className="mhead">
        <div>
          <div className="mh-t">Operations Analytics</div>
          <div className="mh-s">
            Full-year trends January – December {calY} · {branch || "all branches"} · every figure is
            explained on the card — click to drill in
          </div>
        </div>
      </div>

      {/* Day/Week drill-down, then the full set of charts — never instead of them. */}
      {periodScheduler}

      <div className="kgrid">
        <Kpi
          tone="brand"
          label="Total Cases Handled"
          value={calc.total}
          sub="admissions this period"
          def="Every admission recorded this year, across all dispositions."
          tip={["Total Cases Handled", "", "Click for the status breakdown"]}
          modalKey="kpi:total"
          onOpenModal={onOpenModal}
        />
        <Kpi
          tone="blue"
          label="Currently in Care"
          value={calc.inCare}
          sub={`${calc.care.pmReq + calc.care.pmDone} tied to postmortem`}
          def="Bodies physically held in storage right now."
          tip={["Currently in Care", "", "Click to see every held case"]}
          modalKey="kpi:incare"
          onOpenModal={onOpenModal}
        />
        <Kpi
          tone="plum"
          label="Median Turnaround"
          value={calc.medianStay}
          suffix=" d"
          sub="admission → release"
          def="Half of released cases departed within this many days."
          tip={["Median Turnaround", "", "Click for the stay distribution"]}
          modalKey="kpi:median"
          onOpenModal={onOpenModal}
        />
        <Kpi
          tone="orange"
          label="PM Completion"
          value={calc.pmRate}
          suffix="%"
          sub={`${calc.pmDone} of ${calc.pmAll.length} requests`}
          def="Share of requests with a completed examination."
          tip={["PM Completion", "", "Click for the request list"]}
          modalKey="kpi:pmrate"
          onOpenModal={onOpenModal}
        />
        <Kpi
          tone="green"
          label="Storage Accrual"
          raw={fmtK(calc.accrual)}
          sub="holding fees to date"
          def="Daily storage fees accrued by bodies currently held."
          tip={["Storage Accrual", "KES 500 / body / day", "Click to see held cases"]}
          modalKey="kpi:incare"
          onOpenModal={onOpenModal}
        />
      </div>

      <div className="agrid">
        <ACard
          span
          title={`Annual Intake & Release Trend — January to December ${calY}`}
          right={legend}
          note={`Twelve-month trend of intakes vs releases. ${calc.yearTotal} intakes and ${calc.yearRel} releases recorded so far — where the blue line rises above the red, the morgue population is growing. Hover any point for the month’s figures; click to open the full month detail.`}
        >
          <div style={{ padding: "10px 16px 14px" }} className="lchart">
            <TrendChart flow={calc.flow} onOpenModal={onOpenModal} />
          </div>
        </ACard>

        <ACard
          title="Case Status Share"
          note={`How the ${calc.total} cases split by status. Click a segment or legend row.`}
        >
          <div style={{ padding: "10px 16px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Donut segs={donutSegs} size={170} stroke={26} label="TOTAL CASES" onOpenModal={onOpenModal} />
            <div className="san-leg" style={{ width: "100%" }}>
              {donutSegs.map((s) => {
                const pct = Math.round((s.v / (calc.total || 1)) * 100);
                return (
                  <div className="san-lr" key={s.k} onClick={() => onOpenModal(`status:${s.k}`)}>
                    <span className="san-ld" style={{ background: s.c }} />
                    <span className="san-ll">{s.l}</span>
                    <span className="san-lv">{s.v}</span>
                    <span className="san-lp">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </ACard>

        <ACard title="Last 7 Days" right={legend} note="Daily counts — click a column for that day’s activity.">
          <div style={{ padding: "10px 16px 14px" }}>
            <Last7Bars
              last7={calc.last7}
              today={calc.last7[calc.last7.length - 1]?.key}
              onOpenModal={onOpenModal}
            />
          </div>
        </ACard>

        <ACard title="Load by Branch" note="Total cases per branch — click a row for the breakdown.">
          <div style={{ padding: "14px 16px" }}>
            {calc.bmix.length ? calc.bmix.map((b, i) => (
              <HBar
                key={b.b}
                label={b.b}
                value={b.n}
                max={bMax}
                color="var(--acc)"
                delay={i * 0.1}
                modalKey={`branch:${b.b}`}
                onClickModal={onOpenModal}
              />
            )) : <div className="empty" style={{ padding: 18 }}>No branch data.</div>}
          </div>
        </ACard>

        {/* "Caseload by Staff" was removed from here by request. It was the only
            consumer of the `staff:` modal key and of the `sMax` scale, both of
            which are gone with it — see opsPanels.modalFor for the now-unreachable
            `kind === "staff"` branch. `calc.staff` itself is still computed in
            opsData because nothing else reads it yet either; say the word and I
            will strip that too. */}

        <ACard title="Age at Death Distribution" note="Deceased by age bracket — click a column for its cases.">
          <div style={{ padding: "14px 16px" }}>
            <div className="vbars">
              {calc.buckets.map((b, i) => (
                <div
                  key={b[0]}
                  className="vbcol"
                  {...tipProps(`Age ${b[0]}`, `${b[1]} case(s)`)}
                  onClick={() => onOpenModal(`age:${b[0]}`)}
                >
                  <b>{b[1]}</b>
                  <div
                    className="vb"
                    style={{
                      height: `${Math.max(4, (b[1] / aMax) * 100)}%`,
                      background: AGE_COLS[i],
                      animationDelay: `${i * 0.07}s`,
                    }}
                  />
                  <span>{b[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </ACard>

        <ACard title="Automated Insights" note="Patterns detected in the current dataset.">
          <div style={{ padding: "8px 16px 14px" }}>
            {calc.insights.map((parts, i) => (
              <div className="insight" key={i}>
                <span className="idot" style={{ background: INSIGHT_DOTS[i % 5] }} />
                <span><InsightText parts={parts} /></span>
              </div>
            ))}
          </div>
        </ACard>
      </div>
    </>
  );
}
