import { baseList, DOWM, eventsOf, matchPill, MO, pad, pillsFor, TYPE_C } from "./opsData";
import { tipProps } from "./opsBits";
import { Ic } from "./opsIcons";
import { Donut } from "./opsAnalytics";

/**
 * The operations sidebar rail. Renders a column of panel cards:
 * schedule calendar, filter pills, "At a Glance" KPIs, status breakdown
 * donut, load-by-branch, days-in-morgue, body storage, and financials.
 */
export function Sidebar({
  calc,
  scoped,
  section,
  filters,
  onTogglePill,
  onOpenModal,
  calY,
  calM,
  calendarDots,
  selDay,
  today,
  onPickDay,
  view,
  onViewChange,
  period,
  eventCount,
  onToday,
  onStep,
}) {
  const dim = new Date(calY, calM + 1, 0).getDate();
  const firstDow = (new Date(calY, calM, 1).getDay() + 6) % 7;
  const prevDim = new Date(calY, calM, 0).getDate();

  const cells = [];
  DOWM.forEach((d) => cells.push(<div className="smc-dow" key={`dow-${d}`}>{d}</div>));
  for (let i = firstDow - 1; i >= 0; i -= 1) {
    cells.push(<div className="smc-day other" key={`p${i}`}>{prevDim - i}</div>);
  }
  for (let dn = 1; dn <= dim; dn += 1) {
    const key = `${calY}-${pad(calM + 1)}-${pad(dn)}`;
    const types = calendarDots[key] || [];
    let cls = "smc-day";
    if (key === today) cls += " today";
    if (key === selDay) cls += " sel";
    cells.push(
      <div
        className={cls}
        key={key}
        onClick={() => onPickDay(key)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") onPickDay(key);
        }}
      >
        {dn}
        <span className="smc-dots">
          {types.slice(0, 3).map((t) => (
            <span className="smc-dot" key={t} style={{ background: TYPE_C[t] }} />
          ))}
        </span>
      </div>
    );
  }
  const trail = (7 - ((firstDow + dim) % 7)) % 7;
  for (let t = 1; t <= trail; t += 1) {
    cells.push(<div className="smc-day other" key={`t${t}`}>{t}</div>);
  }

  const base = baseList(section, scoped);
  const segs = [
    { k: "in-care", c: "var(--blue)", v: calc.care.inCare, l: "In Care" },
    { k: "pm-req", c: "var(--orange)", v: calc.care.pmReq, l: "PM Requested" },
    { k: "pm-done", c: "var(--plum)", v: calc.care.pmDone, l: "PM Done" },
    { k: "released", c: "var(--teal)", v: calc.care.released, l: "Released" },
  ];
  const bMax = Math.max(...calc.bmix.map((b) => b.n), 1);

  const pillList = pillsFor(section);
  const activeCount = filters.length;

  const ccy = calc.charges?.currency || "KES";
  const money = (n) => {
    const v = Number(n) || 0;
    return v > 0 ? `${ccy} ${v.toLocaleString("en-KE", { maximumFractionDigits: 0 })}` : "—";
  };
  const morgue = calc.morgue || { held: 0, avg: 0, median: 0, longest: 0, top: [] };

  const careTotal = Math.max(
    calc.care.inCare + calc.care.pmReq + calc.care.pmDone + calc.care.released,
    1
  );
  const kpis = [
    { id: "in-care", label: "In Care", v: calc.care.inCare, c: "var(--blue)" },
    { id: "pm-req", label: "PM Open", v: calc.care.pmReq, c: "var(--orange)" },
    { id: "pm-done", label: "PM Done", v: calc.care.pmDone, c: "var(--plum)" },
    { id: "released", label: "Released", v: calc.care.released, c: "var(--teal)" },
  ].map((k) => ({ ...k, pct: Math.round((k.v / careTotal) * 100) }));

  const isPeriod = view === "day" || view === "week";
  const stepLbl = (dir) => `${dir < 0 ? "Previous" : "Next"} ${view}`;

  return (
    <>
      <div className="sidebar">
      {/* The pills are hidden entirely when a section has none, so an empty
          "Filters" card never appears. */}
      {pillList.length ? (
        <div className="sfilters">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="clip" s={12} /></span>
            <span>Filters</span>
            <em>{activeCount ? `${activeCount} active` : `${base.length} total`}</em>
          </div>
          {pillList.map(([key, label, color]) => {
            const n = base.filter((p) => matchPill(p, section, key)).length;
            const on = filters.includes(key);
            return (
              <div
                className={`fc${on ? " on" : ""}`}
                key={key}
                onClick={() => onTogglePill(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onTogglePill(key);
                }}
              >
                <span className="fc-dot" style={{ background: color }} /> {label}
                <span className="fc-ct">{n}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="san">
        <div className="san-card">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="grid" s={12} /></span>
            <span>At a Glance</span>
            <em>{calc.total} total</em>
          </div>
          <div className="skpis">
            {kpis.map((k) => (
              <button
                className="skpi"
                key={k.id}
                onClick={() => onOpenModal(`status:${k.id}`)}
                title={`${k.label} — ${k.v} case${k.v === 1 ? "" : "s"} (${k.pct}%)`}
              >
                <b>{k.v}</b>
                <span className="skpi-lbl">{k.label}</span>
                <span className="skpi-bar">
                  <span className="skpi-fill" style={{ width: `${k.pct}%`, background: k.c }} />
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="san-card">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="grid" s={12} /></span>
            <span>Status Breakdown</span>
            <em>{calc.total} total</em>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <Donut segs={segs} size={104} stroke={16} onOpenModal={onOpenModal} />
            <div className="san-leg" style={{ flex: 1 }}>
              {segs.map((s) => {
                const pct = Math.round((s.v / (calc.total || 1)) * 100);
                return (
                  <div
                    className="san-lr"
                    key={s.k}
                    onClick={() => onOpenModal(`status:${s.k}`)}
                    {...tipProps(s.l, `${s.v} cases · ${pct}%`, "Click for the case list")}
                  >
                    <span className="san-ld" style={{ background: s.c }} />
                    <span className="san-ll">{s.l}</span>
                    <span className="san-lv">{s.v}</span>
                    <span className="san-lp">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="san-card">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="bed" s={12} /></span>
            <span>Load by Branch</span>
            <em>{calc.bmix.length} {calc.bmix.length === 1 ? "branch" : "branches"}</em>
          </div>
          {calc.bmix.length ? (
            calc.bmix.map((b, i) => (
              <div
                className="hb"
                key={b.b}
                onClick={() => onOpenModal(`branch:${b.b}`)}
                {...tipProps(b.b, `${b.n} cases`, "Click for the branch breakdown")}
              >
                <span className="hl">{b.b}</span>
                <div className="ht">
                  <div
                    className="hf"
                    style={{
                      width: `${Math.max(3, (b.n / bMax) * 100)}%`,
                      background: "var(--acc)",
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                </div>
                <span className="hn">{b.n}</span>
              </div>
            ))
          ) : (
            <div className="bigsub">No branch data.</div>
          )}
        </div>
        <div className="san-card">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="clock" s={12} /></span>
            <span>Days in Morgue</span>
            <em>{morgue.held} held</em>
          </div>
          <div className="sgrid3">
            <div className="sstat"><b>{morgue.avg}</b><span>Avg days</span></div>
            <div className="sstat"><b>{morgue.median}</b><span>Median</span></div>
            <div className="sstat"><b>{morgue.longest}</b><span>Longest</span></div>
          </div>
          {morgue.top.length ? (
            <div className="stop">
              {morgue.top.map(({ p, d }) => (
                <div
                  className="srow"
                  key={p.uid || p.adm}
                  {...tipProps(p.name || "—", `${d} ${d === 1 ? "day" : "days"} in morgue`, "Click to open the case")}
                >
                  <span className="sn">{p.name || "—"}</span>
                  <b className={d >= morgue.avg && d > 0 ? "warn" : ""}>{d}d</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="bigsub">No bodies currently in the morgue.</div>
          )}
        </div>
        <div className="san-card">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="file" s={12} /></span>
            <span>Body Storage</span>
            <em>{morgue.held} in storage</em>
          </div>
          <div className="stop">
            {segs.map((s) => (
              <div
                className="srow"
                key={s.k}
                onClick={() => onOpenModal(`status:${s.k}`)}
                {...tipProps(s.l, `${s.v} cases`, "Click for the case list")}
              >
                <span className="sd" style={{ background: s.c }} />
                <span className="sn">{s.l}</span>
                <b>{s.v}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="san-card">
          <div className="side-h">
            <span className="side-h-ic"><Ic n="clip" s={12} /></span>
            <span>Financials</span>
            <em>{ccy}</em>
          </div>
          <div className="stop">
            <div className="srow">
              <span className="sn">Storage accrued</span>
              <b>{money(calc.charges?.accrued)}</b>
            </div>
            <div className="srow srow-sum">
              <span className="sn">Total so far</span>
              <b className="tot">
                {money((calc.charges?.billed || 0) + (calc.charges?.accrued || 0))}
              </b>
            </div>
          </div>
          <p className="snote">
            {calc.charges?.unbilled
              ? `${calc.charges.unbilled} held ${calc.charges.unbilled === 1 ? "body has" : "bodies have"} no daily rate — storage for ${calc.charges.unbilled === 1 ? "it is" : "them is"} estimated at the standard rate.`
              : "Every held body carries a configured daily rate."}
          </p>
        </div>
      </div>
    </div>
    </>
  );
}