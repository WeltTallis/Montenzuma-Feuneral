import {
  BANDS, DOWF, DOWM, MO, MOS, TYPE_C, TYPE_L, TYPE_SOLID, careCfg,
  bandOf, fmtDate, matchPill, parseKey, shortDate, weekStartOf, addDays,
  EVENT_VERB, eventsOf, periodRange, applyFilters, baseList, sortRegisters,
} from "./opsData";
import { Avatar, CountUp, StatusChip } from "./opsBits";
import { Ic } from "./opsIcons";
import BoardSchedule from "./opsBoard";

/* ══════════════════════════════════════════════════════════════════════════
   Operations views — the reference time-grid scheduler, the Today quad,
   the month table and the three registers.
   ══════════════════════════════════════════════════════════════════════════ */

/* Command-section filter test (the sidebar pills scope the command section). */
const passes = (p, filters) => !filters.length || filters.some((k) => matchPill(p, "command", k));

/* ── stat strip ─────────────────────────────────────────────────────────── */

/** The four full-bleed KPI tiles above the Today quad / month table. */
function StatStrip({ items }) {
  return (
    <div className="sr">
      {items.map((it) => (
        <div key={it.label} className={`sr-item ${it.cls}`}>
          <div className="sr-ico">
            <Ic n={it.icon} s={15} />
          </div>
          <div>
            <div className="sr-num">
              <CountUp value={it.num} />
            </div>
            <div className="sr-label">{it.label}</div>
            <div className="sr-sub">{it.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── today timeline ─────────────────────────────────────────────────────── */

/**
 * Today's operations in time order, with a live "now" marker.
 * Returns the row models plus the completed / upcoming tallies.
 */
function timelineFor(searched, today, now) {
  const evs = eventsOf(searched).filter((event) => event.date === today);
  evs.push({ t: "now", time: now, p: null });
  evs.sort((a, b) => a.time.localeCompare(b.time));

  let done = 0;
  let up = 0;
  const rows = evs.map((e) => {
    if (e.t === "now") return { kind: "now", key: "now" };
    const p = e.p;
    let st;
    if (e.t === "release") st = p.release.status === "completed" ? "done" : "up";
    else if (e.t === "intake") st = e.time <= now ? "done" : "up";
    else st = p.pm.state === "completed" ? "done" : p.pm.state === "in-progress" ? "act" : "up";
    if (st === "done") done += 1; else up += 1;

    const meta = e.t === "release"
      ? `${p.release.mode} → ${p.release.dest}`
      : e.t === "intake"
        ? `from ${p.receivedFrom} · ${p.officer}`
        : p.pm.authority;
    return { kind: "event", key: `${e.t}-${p.uid}-${e.time}`, ev: e, p, st, meta };
  });

  return { rows, done, up, has: done + up > 0 };
}

const ST_CHIP = {
  done: { cls: "tchip", style: { background: "var(--teal-bg)", color: "var(--teal)" }, label: "Completed" },
  act: { cls: "tchip", style: { background: "var(--blue-bg)", color: "var(--blue)" }, label: "In Progress" },
  up: { cls: "tchip", style: { background: "var(--gray-bg)", color: "var(--gray)" }, label: "Scheduled" },
};

/** The timeline rows themselves (shared by the card and the quad). */
function TimelineRows({ data, now, onOpenCase, endNote = true }) {
  if (!data.rows.some((r) => r.kind === "event")) {
    return <div className="empty" style={{ padding: 22 }}>No operations scheduled for today.</div>;
  }
  return (
    <>
      {data.rows.map((r) => {
        if (r.kind === "now") {
          return (
            <div key="now" className="tli now">
              <div className="tlt">{now}</div>
              <div className="tlr"><span className="tld" /></div>
              <div><span className="nowchip">NOW · LIVE</span></div>
            </div>
          );
        }
        const chip = ST_CHIP[r.st];
        const verb = EVENT_VERB[r.ev.t];
        return (
          <div key={r.key} className={`tli ${r.st}`}>
            <div className="tlt">{r.ev.time}</div>
            <div className="tlr"><span className="tld">{r.st === "done" ? "✓" : ""}</span></div>
            <div
              className="tlc"
              onClick={() => onOpenCase(r.p.uid, r.ev.t)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") onOpenCase(r.p.uid, r.ev.t); }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <span className="tlv" style={{ color: verb.c }}>{verb.verb}</span>{" "}
                <span className="tln">{r.p.name}</span>
                <div className="tlm">{r.p.adm} · {r.p.branch} · {r.meta}</div>
              </div>
              <span className={chip.cls} style={chip.style}><i />{chip.label}</span>
              <Ic n="chevR" s={12} />
            </div>
          </div>
        );
      })}
      {endNote && data.has ? (
        <div className="tlend">— end of day · no further operations scheduled —</div>
      ) : null}
    </>
  );
}

/** Wrapper card around the timeline (used by the month view). */
function TimelineCard({ data, now, today, onOpenCase }) {
  return (
    <div className="tlcard">
      <div className="tlh">
        <b><Ic n="clock" s={13} /> Today’s Operations</b>
        <div className="tchips">
          <span className="tchip" style={{ background: "var(--teal-bg)", color: "var(--teal)" }}>
            <i />{data.done} completed
          </span>
          <span className="tchip" style={{ background: "var(--gray-bg)", color: "var(--gray)" }}>
            <i />{data.up} upcoming
          </span>
          <span className="live">LIVE · {now}</span>
        </div>
      </div>
      <div className="tl">
        <TimelineRows data={data} now={now} today={today} onOpenCase={onOpenCase} />
      </div>
    </div>
  );
}

/* ── today quad ─────────────────────────────────────────────────────────── */

/** A quad card: coloured header + scrollable body. */
function QuadCard({ icon, title, tagText, tagColor, children }) {
  return (
    <div className="qcard2">
      <div className="qh">
        <b><Ic n={icon} s={13} />{title}</b>
        <span className="qtag" style={{ background: tagColor }}>{tagText}</span>
      </div>
      <div className="qbody2">{children}</div>
    </div>
  );
}

/** One scheduled operation row inside a quad card. */
function QuadRow({ ev, onOpenCase }) {
  const p = ev.p;
  const cfg = careCfg(p);
  const sub = ev.t === "release" ? p.release.dest : ev.t === "intake" ? `from ${p.receivedFrom}` : p.pm.authority;
  return (
    <div
      className="qrow2"
      onClick={() => onOpenCase(p.uid, ev.t)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpenCase(p.uid, ev.t); }}
    >
      <span className="qt">{ev.time}</span>
      <Avatar c={p} />
      <div className="qmain2">
        <div className="qm2">{p.name}</div>
        <div className="qs2">{p.adm} · {p.branch} · {sub}</div>
      </div>
      <span className="st" style={{ color: cfg.c }}><i style={{ background: cfg.c }} />{cfg.label}</span>
    </div>
  );
}

/** "Today" — live operations across all branches. */
function TodayQuad({ searched, calc, today, now, onOpenCase }) {
  const tl = timelineFor(searched, today, now);
  const evs = eventsOf(searched).filter((event) => event.date === today);
  // Newest FIRST. These were sorted ascending by time, so the body received a
  // moment ago sat at the BOTTOM of "Intake Today" while the earliest arrival of
  // the day was on top — the panel showed the least recent thing first.
  const byNewest = (a, b) => b.time.localeCompare(a.time);
  const intakes = evs.filter((e) => e.t === "intake").sort(byNewest);
  const rels = evs.filter((e) => e.t === "release").sort(byNewest);
  const pms = evs.filter((e) => e.t === "pm").sort(byNewest);

  const d = parseKey(today);
  const plural = (n, w) => `${n} ${w}${n !== 1 ? "s" : ""}`;

  return (
    <>
      <StatStrip
        items={[
          { cls: "st-blue", icon: "cal", num: intakes.length, label: "Intake Today", sub: "bodies received" },
          { cls: "st-teal", icon: "heart", num: rels.length, label: "Releases Today", sub: "handovers" },
          { cls: "st-amber", icon: "vial", num: pms.length, label: "Postmortems Today", sub: "examinations" },
          { cls: "st-indigo", icon: "bed", num: calc.inCare, label: "In Care", sub: "total held now" },
        ]}
      />

      <div className="mhead">
        <div>
          <div className="mh-t">Today — {DOWF[d.getDay()]}, {fmtDate(today)}</div>
          <div className="mh-s">
            Live operations across all branches · {plural(intakes.length, "intake")} ·{" "}
            {plural(rels.length, "release")} · {plural(pms.length, "postmortem")}
          </div>
        </div>
        <div className="tchips">
          <span className="tchip" style={{ background: "var(--teal-bg)", color: "var(--teal)" }}>
            <i />{tl.done} completed
          </span>
          <span className="tchip" style={{ background: "var(--gray-bg)", color: "var(--gray)" }}>
            <i />{tl.up} upcoming
          </span>
          <span className="live">LIVE · {now}</span>
        </div>
      </div>

      <div className="quad2">
        <QuadCard icon="clock" title="Schedule" tagText={`${tl.done + tl.up} events`} tagColor="var(--acc)">
          <div className="tl" style={{ padding: "8px 14px 12px" }}>
            <TimelineRows data={tl} now={now} onOpenCase={onOpenCase} endNote={false} />
          </div>
        </QuadCard>

        <QuadCard icon="bed" title="Intake Today" tagText={intakes.length} tagColor="var(--blue)">
          {intakes.length
            ? intakes.map((e) => <QuadRow key={`i-${e.p.uid}`} ev={e} onOpenCase={onOpenCase} />)
            : <div className="empty" style={{ padding: 26 }}>No intakes scheduled today.</div>}
        </QuadCard>

        <QuadCard icon="heart" title="Releases Today" tagText={rels.length} tagColor="var(--teal)">
          {rels.length
            ? rels.map((e) => <QuadRow key={`r-${e.p.uid}`} ev={e} onOpenCase={onOpenCase} />)
            : <div className="empty" style={{ padding: 26 }}>No releases scheduled today.</div>}
        </QuadCard>

        <QuadCard icon="vial" title="Postmortem Today" tagText={pms.length} tagColor="var(--orange)">
          {pms.length
            ? pms.map((e) => <QuadRow key={`p-${e.p.uid}`} ev={e} onOpenCase={onOpenCase} />)
            : <div className="empty" style={{ padding: 26 }}>No postmortems scheduled today.</div>}
        </QuadCard>
      </div>
    </>
  );
}

/* ── weekly view (Mon–Sun) ──────────────────────────────────────────────── */

/** Seven day columns: counts per day + the operations themselves. */
function WeekColumns({ searched, selDate, today, filters, onPickDay, onOpenCase }) {
  const ws = weekStartOf(selDate);
  const we = addDays(ws, 6);
  const evs = [];
  searched.forEach((p) => {
    if (p.admDate) evs.push({ t: "intake", time: p.admTime || "00:00", date: p.admDate, p });
    if (p.pm && p.pm.reqDate) evs.push({ t: "pm", time: p.pm.reqTime || "09:00", date: p.pm.reqDate, p });
    if (p.release && p.release.date) evs.push({ t: "release", time: p.release.time || "09:00", date: p.release.date, p });
  });

  const week = { intake: 0, release: 0, pm: 0 };
  const cols = [];

  for (let i = 0; i < 7; i += 1) {
    const key = addDays(ws, i);
    const dt = parseKey(key);
    const dayEvs = evs
      .filter((e) => e.date === key && passes(e.p, filters))
      .sort((a, b) => b.time.localeCompare(a.time));

    const cI = dayEvs.filter((e) => e.t === "intake").length;
    const cR = dayEvs.filter((e) => e.t === "release").length;
    const cP = dayEvs.filter((e) => e.t === "pm").length;
    week.intake += cI;
    week.release += cR;
    week.pm += cP;

    cols.push(
      <div className="wkcol2" key={key}>
        <button
          className={`wkh${key === today ? " today" : ""}`}
          onClick={() => onPickDay(key)}
          title={`Open ${fmtDate(key)}`}
        >
          <span className="wd">{DOWM[dt.getDay()]}</span>
          <span className="wnum">{dt.getDate()}</span>
        </button>

        <div className="wkstats">
          <div className={`wkc ${TYPE_SOLID.intake}`}><b>{cI}</b><span>Intake</span></div>
          <div className={`wkc ${TYPE_SOLID.release}`}><b>{cR}</b><span>Release</span></div>
          <div className={`wkc ${TYPE_SOLID.pm}`}><b>{cP}</b><span>PM</span></div>
        </div>

        {dayEvs.length
          ? dayEvs.map((e) => {
            const sub = e.t === "release" ? e.p.release.dest : e.t === "intake" ? e.p.receivedFrom : e.p.pm.authority;
            return (
              <div
                key={`${e.t}-${e.p.uid}-${e.time}`}
                className="wkev2"
                style={{ borderLeftColor: TYPE_C[e.t] }}
                onClick={() => onOpenCase(e.p.uid, e.t)}
                role="button"
                tabIndex={0}
                onKeyDown={(ev) => { if (ev.key === "Enter") onOpenCase(e.p.uid, e.t); }}
              >
                <div className="t" style={{ color: TYPE_C[e.t] }}>
                  <i />{e.time} · {TYPE_L[e.t]}
                </div>
                <div className="n">{e.p.name}</div>
                <div className="m">{e.p.adm} · {String(sub).slice(0, 30)}</div>
              </div>
            );
          })
          : <div className="wk-none2">No operations</div>}
      </div>
    );
  }

  const total = week.intake + week.release + week.pm;

  return (
    <>
      <div className="mhead">
        <div>
          <div className="mh-t">
            Weekly View — {shortDate(ws)} to {shortDate(we)}, {parseKey(we).getFullYear()}
          </div>
          <div className="mh-s">
            Monday to Sunday · colored cards show each day’s counts · click a day header to open its
            banded schedule · click a card to open the case file
          </div>
        </div>
        <span className="cnt-chip">{total} operations</span>
      </div>

      <div className="wgrid">{cols}</div>

      <div className="wkmeta">
        <span style={{ color: "var(--tx)", fontWeight: 700 }}>Week totals</span>
        <span className="ci"><i style={{ background: "var(--blue)" }} />Intakes <b>{week.intake}</b></span>
        <span className="ci"><i style={{ background: "var(--teal)" }} />Releases <b>{week.release}</b></span>
        <span className="ci"><i style={{ background: "var(--orange)" }} />Postmortems <b>{week.pm}</b></span>
        <span className="ci">Total <b>{total}</b></span>
      </div>
    </>
  );
}

/* ── banded day view ────────────────────────────────────────────────────── */

/** A single day, split into morning / afternoon / evening bands. */
function BandedDay({ date, searched, filters, today, onOpenCase, onClearDay }) {
  const evs = [];
  searched.forEach((p) => {
    if (p.admDate) evs.push({ t: "intake", time: p.admTime || "00:00", date: p.admDate, p });
    if (p.pm && p.pm.reqDate) evs.push({ t: "pm", time: p.pm.reqTime || "09:00", date: p.pm.reqDate, p });
    if (p.release && p.release.date) evs.push({ t: "release", time: p.release.time || "09:00", date: p.release.date, p });
  });
  const dayEvs = evs
    .filter((e) => e.date === date && passes(e.p, filters))
    .sort((a, b) => b.time.localeCompare(a.time));

  const cnt = { intake: 0, release: 0, pm: 0 };
  dayEvs.forEach((e) => { cnt[e.t] += 1; });

  const bands = BANDS.map((b) => {
    const items = dayEvs.filter((e) => bandOf(e.time).id === b.id);
    return (
      <div className="dband" key={b.id}>
        <div className="dband-h">
          <span className="bic" style={{ background: b.c }}><Ic n={b.icon} s={13} /></span>
          <b>{b.label}</b>
          <span className="cn2b">{items.length}</span>
        </div>
        {items.length ? (
          <div className="tcards">
            {items.map((e) => {
              const extra = e.t === "release" ? e.p.release.dest : e.t === "intake" ? e.p.receivedFrom : e.p.pm.authority;
              const [hh, mm] = e.time.split(":");
              return (
                <div
                  className="tcard"
                  key={`${e.t}-${e.p.uid}-${e.time}`}
                  onClick={() => onOpenCase(e.p.uid, e.t)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(ev) => { if (ev.key === "Enter") onOpenCase(e.p.uid, e.t); }}
                >
                  <div className="tct"><b>{hh}</b><span>:{mm}</span></div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="nm">{e.p.name}</div>
                    <div className="sub">{TYPE_L[e.t]} · {e.p.adm} · {extra}</div>
                  </div>
                  <span className="st" style={{ color: TYPE_C[e.t] }}>
                    <i style={{ background: TYPE_C[e.t] }} />{TYPE_L[e.t]}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="band-empty">No operations in the {b.label.toLowerCase()}.</div>
        )}
      </div>
    );
  });

  return (
    <>
      <div className="df">
        <span>
          <Ic n="cal" s={12} /> Showing: {fmtDate(date)} — {dayEvs.length} operation(s)
        </span>
        <button onClick={onClearDay}>Clear <Ic n="x" s={10} /></button>
      </div>

      <div className="mhead">
        <div>
          <div className="mh-t">
            {DOWF[parseKey(date).getDay()]}, {fmtDate(date)}{date === today ? " — Today" : ""}
          </div>
          <div className="mh-s">Banded by time of day · click any card for the case file</div>
        </div>
        <div className="mh-r">
          <span className="cnt-chip" style={{ borderColor: "var(--blue)", color: "var(--blue)" }}>
            {cnt.intake} intake
          </span>
          <span className="cnt-chip" style={{ borderColor: "var(--teal)", color: "var(--teal)" }}>
            {cnt.release} release
          </span>
          <span className="cnt-chip" style={{ borderColor: "var(--orange)", color: "var(--orange)" }}>
            {cnt.pm} PM
          </span>
        </div>
      </div>

      {bands}
    </>
  );
}

/* ── operations month table ─────────────────────────────────────────────── */

const OPS_COLS = "3px 1.5fr 1.2fr 1fr 1fr";

/** Default command view — stat strip · today's timeline · the period's events. */
function MonthTable({ searched, calc, state, now, today, onOpenCase }) {
  const { s, e } = periodRange(state.view, state.selDate);
  const list = [];
  searched.forEach((p) => {
    if (p.admDate && p.admDate >= s && p.admDate <= e) {
      list.push({ t: "intake", time: p.admTime || "00:00", date: p.admDate, p });
    }
    if (p.pm && p.pm.reqDate && p.pm.reqDate >= s && p.pm.reqDate <= e) {
      list.push({ t: "pm", time: p.pm.reqTime || "09:00", date: p.pm.reqDate, p });
    }
    if (p.release && p.release.date && p.release.date >= s && p.release.date <= e) {
      list.push({ t: "release", time: p.release.time || "09:00", date: p.release.date, p });
    }
  });
  const visible = list.filter((ev) => passes(ev.p, state.filters));
  visible.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const sel = parseKey(state.selDate);
  const periodLbl = `Month of ${MO[sel.getMonth()]} ${sel.getFullYear()}`;

  return (
    <>
      <StatStrip
        items={[
          { cls: "st-blue", icon: "cal", num: calc.monthIntakes, label: "This Month", sub: `intakes · ${MOS[state.calM]} ${state.calY}` },
          { cls: "st-indigo", icon: "bed", num: calc.inCare, label: "In Care", sub: "incl. postmortem stages" },
          { cls: "st-amber", icon: "vial", num: calc.care.pmReq, label: "PM Open", sub: "requested + in progress" },
          { cls: "st-teal", icon: "heart", num: calc.care.released, label: "Released", sub: "closed this period" },
        ]}
      />

      <TimelineCard
        data={timelineFor(searched, today, now)}
        now={now}
        today={today}
        onOpenCase={onOpenCase}
      />

      <div className="mhead">
        <div>
          <div className="mh-t">Operations</div>
          <div className="mh-s">
            {periodLbl} · click a row for the case file · use Day/Week/Month above · pick a day in
            the sidebar calendar
          </div>
        </div>
        <div className="mh-r"><span className="cnt-chip">{visible.length} events</span></div>
      </div>

      <div className="lh" style={{ gridTemplateColumns: OPS_COLS }}>
        <div />
        <div>Deceased</div>
        <div>Event</div>
        <div>Schedule</div>
        <div style={{ textAlign: "left" }}>Status</div>
      </div>

      {visible.length ? visible.map((ev) => {
        const p = ev.p;
        const sub = ev.t === "release" ? p.release.dest : ev.t === "intake" ? p.receivedFrom : p.pm.authority;
        return (
          <div
            className="row"
            key={`${ev.t}-${p.uid}-${ev.date}-${ev.time}`}
            style={{ gridTemplateColumns: OPS_COLS }}
            onClick={() => onOpenCase(p.uid, ev.t)}
            role="button"
            tabIndex={0}
            onKeyDown={(e2) => { if (e2.key === "Enter") onOpenCase(p.uid, ev.t); }}
          >
            <div className="rbar" style={{ background: TYPE_C[ev.t] }} />
            <div className="cell">
              <div className="nm">{p.name}</div>
              <div className="sub">{p.adm} · {p.branch}</div>
            </div>
            <div className="cell">
              <span className="st" style={{ color: TYPE_C[ev.t] }}>
                <i style={{ background: TYPE_C[ev.t] }} />{TYPE_L[ev.t]}
              </span>
              <div className="stdays">{String(sub).slice(0, 30)}</div>
            </div>
            <div className="cell">
              <div className="mt2">{shortDate(ev.date)}</div>
              <div className="sub"><Ic n="clock" s={9} />{ev.time}</div>
            </div>
            <div className="cell"><StatusChip c={p} /></div>
          </div>
        );
      }) : (
        <div className="empty">
          <div className="empty-ico"><Ic n="cal" s={20} /></div>
          <span style={{ fontSize: 12 }}>No operations in this period — adjust filters or pick a day.</span>
        </div>
      )}
    </>
  );
}

/* ── operations section router ──────────────────────────────────────────── */

/** Picks the right operations layout for the current view state. */
export function OperationsView({ searched, calc, state, now, today, onOpenCase, onClearDay, onPickDay, onDayTabChange }) {
  if (state.view === "day" || state.view === "week") {
    return (
      <BoardSchedule
        searched={searched}
        filters={state.filters || []}
        view={state.view}
        selDate={state.selDate}
        now={now}
        today={today}
        dayTab={state.dayTab || "all"}
        onDayTabChange={onDayTabChange}
        onOpenCase={onOpenCase}
        onPickDay={onPickDay}
      />
    );
  }
  if (state.todayMode) {
    return <TodayQuad searched={searched} calc={calc} today={today} now={now} onOpenCase={onOpenCase} />;
  }
  return (
    <MonthTable
      searched={searched}
      calc={calc}
      state={state}
      now={now}
      today={today}
      onOpenCase={onOpenCase}
    />
  );
}

/* ── registers (intake · releases · postmortems) ────────────────────────── */

const REG_META = {
  intake: { h: "Intake Register", sub: "All admissions across branches", icon: "bed" },
  release: { h: "Releases & Transfers", sub: "Handovers to family, cemeteries and partner facilities", icon: "heart" },
  pm: { h: "Postmortem Requests", sub: "Coroner & physician examination requests", icon: "vial" },
};

const REG_COLS = "3px 1.4fr 1.4fr 1fr 1fr";

const PM_STATE = {
  completed: { label: "PM Done", c: "var(--plum)" },
  "in-progress": { label: "In Progress", c: "var(--blue)" },
  requested: { label: "Requested", c: "var(--orange)" },
};

export function RegisterView({ section, people, searched, filters, sort, onSort, onOpenCase }) {
  const meta = REG_META[section] || REG_META.intake;
  const list = sortRegisters(applyFilters(baseList(section, searched), section, filters), section, sort);
  const arrow = (f) => (sort.f === f ? (sort.d === 1 ? " ↑" : " ↓") : "");
  const midHead = section === "release" ? "Destination" : section === "pm" ? "Authority" : "Received From";
  const dateHead = section === "release" ? "Released" : section === "pm" ? "Requested" : "Admitted";

  return (
    <>
      <div className="mhead">
        <div>
          <div className="mh-t">{meta.h}</div>
          <div className="mh-s">
            {meta.sub} · click a row for details · use the sidebar pills to filter
          </div>
        </div>
        <div className="mh-r">
          <span className="cnt-chip">{list.length} of {baseList(section, people).length}</span>
        </div>
      </div>

      <div className="lh" style={{ gridTemplateColumns: REG_COLS }}>
        <div />
        <div className="sortable" onClick={() => onSort("name")}>Deceased{arrow("name")}</div>
        <div>{midHead}</div>
        <div className="sortable" onClick={() => onSort("date")}>{dateHead}{arrow("date")}</div>
        <div className="sortable" onClick={() => onSort("status")}>Status{arrow("status")}</div>
      </div>

      {list.length ? list.map((p) => {
        const cfg = careCfg(p);
        const isRel = section === "release";
        const isPm = section === "pm";
        const date = isRel ? p.release.date : isPm ? p.pm.reqDate : p.admDate;
        const time = isRel ? p.release.time : isPm ? p.pm.reqTime : p.admTime;
        const main = isRel ? p.release.dest : isPm ? p.pm.authority : p.receivedFrom;
        const sub2 = isRel
          ? `${p.release.mode} · ${p.release.receiver}`
          : isPm
            ? p.pm.pathologist
            : p.officer;
        const pmState = isPm ? (PM_STATE[p.pm.state] || PM_STATE.requested) : null;

        return (
          <div
            className="row"
            key={`${section}-${p.uid}`}
            style={{ gridTemplateColumns: REG_COLS }}
            onClick={() => onOpenCase(p.uid, section)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") onOpenCase(p.uid, section); }}
          >
            <div className="rbar" style={{ background: cfg.c }} />
            <div className="cell">
              <div className="nm">{p.name}</div>
              <div className="sub">{p.adm} · {p.branch}</div>
            </div>
            <div className="cell">
              <div className="cn2">{main}</div>
              <div className="sub">{sub2}</div>
            </div>
            <div className="cell">
              <div className="mt2">{shortDate(date)}</div>
              <div className="sub"><Ic n="clock" s={9} />{time}</div>
            </div>
            <div className="cell">
              {isPm ? (
                <>
                  <span className="st" style={{ color: pmState.c }}>
                    <i style={{ background: pmState.c }} />{pmState.label}
                  </span>
                  <div className="stdays">
                    {fmtDate(p.pm.state === "completed" ? p.pm.doneDate : p.pm.reqDate)}
                  </div>
                </>
              ) : (
                <StatusChip c={p} />
              )}
            </div>
          </div>
        );
      }) : (
        <div className="empty">
          <div className="empty-ico"><Ic n="file" s={20} /></div>
          <span style={{ fontSize: 12 }}>No records match the current filters.</span>
        </div>
      )}
    </>
  );
}
