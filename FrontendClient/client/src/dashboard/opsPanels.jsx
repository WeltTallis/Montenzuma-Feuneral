import {
  CARE, TYPE_L, ageAt, ageBucketOf, ageFor, careCfg, careOf, daysInCare, fmtDate,
  isReleased, statusMeta, todayKey, MO,
} from "./opsData";
import { Avatar } from "./opsBits";
import { Ic } from "./opsIcons";

/* ══════════════════════════════════════════════════════════════════════════
   Overlays — the analytics drill-down modal and the case-file drawer.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── shared row ─────────────────────────────────────────────────────────── */

/** One case line inside a modal; the coloured spine shows its care state. */
function CaseRow({ c, meta, right, onOpenCase }) {
  const cfg = careCfg(c);
  return (
    <button
      className="mrow mlink"
      style={{ boxShadow: `inset 3px 0 0 ${cfg.c}` }}
      onClick={() => onOpenCase(c.adm)}
    >
      <Avatar c={c} />
      <div className="mmain">
        <div className="mnm">{c.name}</div>
        <div className="mmeta">{c.adm} · {c.branch} · {meta}</div>
      </div>
      {right}
    </button>
  );
}

/** Cap a long case list at 20 rows, then say how many more there are. */
function listCap(list, onOpenCase) {
  if (!list.length) return <div className="empty" style={{ padding: 24 }}>No cases.</div>;
  return (
    <>
      {list.slice(0, 20).map((c) => (
        <CaseRow key={c.adm} c={c} meta={statusMeta(c)} onOpenCase={onOpenCase} />
      ))}
      {list.length > 20 ? <div className="mfoot">+{list.length - 20} more cases…</div> : null}
    </>
  );
}

/* ── turnaround distribution (median KPI drill-down) ────────────────────── */

function StaysBody({ people, median, avg, onOpenCase }) {
  const stays = people
    .filter(isReleased)
    .map((c) => ({ c, d: daysInCare(c) }))
    .filter((s) => s.d != null);
  const bks = [
    ["0–3 days", 0, 3], ["4–7 days", 4, 7], ["8–14 days", 8, 14],
    ["15–21 days", 15, 21], ["22+ days", 22, 9999],
  ];
  const counts = bks.map((b) => stays.filter((s) => s.d >= b[1] && s.d <= b[2]).length);
  const maxB = Math.max(...counts, 1);
  const longest = stays.slice().sort((a, b) => b.d - a.d).slice(0, 6);

  return (
    <>
      <div className="mstats">
        <div><span>Median</span><b>{median} d</b></div>
        <div><span>Average</span><b>{avg} d</b></div>
        <div><span>Released</span><b>{stays.length}</b></div>
      </div>
      <div className="msect">Stay distribution</div>
      {bks.map((b, i) => (
        <div className="hbar" style={{ cursor: "default" }} key={b[0]}>
          <span className="hl">{b[0]}</span>
          <div className="ht">
            <div
              className="hf"
              style={{ width: `${counts[i] ? Math.max(4, (counts[i] / maxB) * 100) : 0}%`, background: "var(--acc)" }}
            />
          </div>
          <span className="hn">{counts[i]}</span>
        </div>
      ))}
      <div className="msect">Longest stays</div>
      {longest.length
        ? longest.map((s) => (
          <CaseRow
            key={s.c.adm}
            c={s.c}
            meta={`${s.d} days in care · released ${fmtDate(s.c.release?.date)}`}
            onOpenCase={onOpenCase}
          />
        ))
        : <div className="empty" style={{ padding: 20 }}>No released cases yet.</div>}
    </>
  );
}

const PM_LABEL = { completed: "Completed", "in-progress": "In Progress", requested: "Requested" };
const PM_COLOR = { completed: "var(--plum)", "in-progress": "var(--blue)", requested: "var(--orange)" };

/* ── modal content factory ──────────────────────────────────────────────── */

/** Build the title / blurb / count / body for a modal key. */
function modalFor(key, people, calc, onOpenCase, onOpenModal) {
  const idx = key.indexOf(":");
  const kind = key.slice(0, idx);
  const arg = key.slice(idx + 1);

  if (kind === "status") {
    if (arg === "scheduled") {
      const list = people.filter((c) => c.admDate && c.admDate > todayKey());
      return {
        title: "Scheduled Admissions",
        def: "Admissions booked for a future date — slot reserved, body not yet received.",
        count: list.length,
        body: listCap(list, onOpenCase),
      };
    }
    if (arg === "released") {
      const list = people.filter(isReleased);
      return {
        title: "Released / Transferred",
        def: "Bodies handed to family, burial site or partner facility — closed operations-side.",
        count: list.length,
        body: listCap(list, onOpenCase),
      };
    }
    const list = people.filter((c) => careOf(c) === arg);
    const def = arg === "in-care"
      ? "Admitted, no postmortem on file — occupies storage and accrues daily holding fees."
      : arg === "pm-req"
        ? "Postmortem requested — awaiting exam or the pathologist’s report."
        : "Examination completed and report filed.";
    return {
      title: CARE[arg]?.label || "Cases",
      def,
      count: list.length,
      body: listCap(list, onOpenCase),
    };
  }

  if (kind === "branch") {
    const list = people.filter((c) => c.branch === arg);
    const s = { care: 0, pm: 0, rel: 0 };
    list.forEach((c) => {
      const k = careOf(c);
      if (k === "in-care") s.care += 1;
      else if (k === "pm-req" || k === "pm-done") s.pm += 1;
      else s.rel += 1;
    });
    return {
      title: arg,
      def: "All cases at this branch — holding, postmortem workload and completed handovers.",
      count: list.length,
      body: (
        <>
          <div className="mstats">
            <div><span>In care</span><b>{s.care}</b></div>
            <div><span>Postmortem</span><b>{s.pm}</b></div>
            <div><span>Released</span><b>{s.rel}</b></div>
            <div><span>Total</span><b>{list.length}</b></div>
          </div>
          {listCap(list, onOpenCase)}
        </>
      ),
    };
  }

  if (kind === "staff") {
    const list = people.filter((c) => c.officer === arg || c.pm?.pathologist === arg);
    return {
      title: arg,
      def: "Cases handled by this staff member.",
      count: list.length,
      body: list.length
        ? list.slice(0, 20).map((c) => {
          const role = c.pm?.pathologist === arg && c.officer !== arg ? "Pathologist" : "Officer";
          return <CaseRow key={c.adm} c={c} meta={`${role} · ${c.cause}`} onOpenCase={onOpenCase} />;
        })
        : <div className="empty" style={{ padding: 20 }}>No cases.</div>,
    };
  }

  if (kind === "age") {
    const list = people.filter((c) => ageBucketOf(ageFor(c)) === arg);
    return {
      title: `Age ${arg}`,
      def: "Deceased in this age bracket at time of death.",
      count: list.length,
      body: list.length
        ? list.slice(0, 20).map((c) => (
          <CaseRow key={c.adm} c={c} meta={`Age ${ageFor(c)} · ${c.cause}`} onOpenCase={onOpenCase} />
        ))
        : <div className="empty" style={{ padding: 20 }}>No cases.</div>,
    };
  }

  if (kind === "month") {
    const adm = people.filter((c) => String(c.admDate || "").startsWith(arg));
    const rel = people.filter(
      (c) => c.release?.status === "completed" && String(c.release.date || "").startsWith(arg)
    );
    const lab = `${MO[Number(arg.slice(5, 7)) - 1]} ${arg.slice(0, 4)}`;
    const net = adm.length - rel.length;
    return {
      title: `Month Detail — ${lab}`,
      def: "Admissions and releases for the month; net change drives the morgue population trend.",
      count: adm.length + rel.length,
      body: (
        <>
          <div className="mstats">
            <div><span>Intakes</span><b>{adm.length}</b></div>
            <div><span>Releases</span><b>{rel.length}</b></div>
            <div><span>Net change</span><b>{net >= 0 ? "+" : ""}{net}</b></div>
          </div>
          <div className="msect">Intakes</div>
          {adm.length
            ? adm.slice(0, 10).map((c) => (
              <CaseRow key={c.adm} c={c} meta={`Admitted ${fmtDate(c.admDate)} · ${c.receivedFrom}`} onOpenCase={onOpenCase} />
            ))
            : <div className="empty" style={{ padding: 14 }}>None.</div>}
          <div className="msect">Releases</div>
          {rel.length
            ? rel.slice(0, 10).map((c) => (
              <CaseRow
                key={c.adm}
                c={c}
                meta={`Released ${fmtDate(c.release.date)} → ${String(c.release.dest).slice(0, 30)}`}
                onOpenCase={onOpenCase}
              />
            ))
            : <div className="empty" style={{ padding: 14 }}>None.</div>}
        </>
      ),
    };
  }

  if (kind === "day") {
    const evs = [];
    people.forEach((c) => {
      if (c.admDate === arg) evs.push({ t: "intake", time: c.admTime, c });
      if (c.pm && c.pm.reqDate === arg) evs.push({ t: "pm", time: c.pm.reqTime, c });
      if (c.release && c.release.date === arg) evs.push({ t: "release", time: c.release.time, c });
    });
    evs.sort((a, b) => String(a.time).localeCompare(String(b.time)));
    return {
      title: `Activity — ${fmtDate(arg)}`,
      def: "Every operation recorded on this day, in order.",
      count: evs.length,
      body: evs.length
        ? evs.map((e) => (
          <CaseRow key={`${e.t}-${e.c.adm}`} c={e.c} meta={`${TYPE_L[e.t]} at ${e.time}`} onOpenCase={onOpenCase} />
        ))
        : <div className="empty" style={{ padding: 20 }}>No activity.</div>,
    };
  }

  if (kind === "kpi") {
    if (arg === "total") {
      const counts = [
        ["in-care", people.filter((c) => careOf(c) === "in-care").length],
        ["pm-req", people.filter((c) => careOf(c) === "pm-req").length],
        ["pm-done", people.filter((c) => careOf(c) === "pm-done").length],
        ["released", people.filter(isReleased).length],
      ];
      return {
        title: "Total Cases Handled",
        def: "Every case this period by current status. Click a row for its cases.",
        count: people.length,
        body: counts.map(([k, n]) => {
          const cfg = CARE[k];
          return (
            <button key={k} className="mrow mlink" onClick={() => onOpenModal(`status:${k}`)}>
              <span className="msq" style={{ background: cfg.c }} />
              <div className="mmain"><div className="mnm">{cfg.label}</div></div>
              <span className="mmeta">{n} · {Math.round((n / (people.length || 1)) * 100)}%</span>
              <span style={{ color: "var(--tx4)" }}><Ic n="chevR" s={12} /></span>
            </button>
          );
        }),
      };
    }
    if (arg === "incare") {
      const held = people.filter((c) => {
        const k = careOf(c);
        return k !== "released" && k !== "transferred";
      });
      return {
        title: "Currently in Care",
        def: "Every body physically held right now.",
        count: held.length,
        body: listCap(held, onOpenCase),
      };
    }
    if (arg === "median") {
      const released = people.filter(isReleased);
      return {
        title: "Median Turnaround",
        def: "Half of released cases departed within this many days.",
        count: released.length,
        body: <StaysBody people={people} median={calc.medianStay} avg={calc.avgStay} onOpenCase={onOpenCase} />,
      };
    }
    if (arg === "pmrate") {
      const list = people.filter((c) => c.pm);
      return {
        title: "Postmortem Completion",
        def: "Completed exams ÷ all requests. Open rows await exam or report.",
        count: `${calc.pmRate}%`,
        body: list.length
          ? list.slice(0, 20).map((c) => (
            <CaseRow
              key={c.adm}
              c={c}
              meta={`${c.pm.authority} · ${c.pm.pathologist}`}
              right={(
                <span className="st" style={{ color: PM_COLOR[c.pm.state] }}>
                  <i style={{ background: PM_COLOR[c.pm.state] }} />{PM_LABEL[c.pm.state]}
                </span>
              )}
              onOpenCase={onOpenCase}
            />
          ))
          : <div className="empty" style={{ padding: 20 }}>No requests.</div>,
      };
    }
  }

  return {
    title: "Detail",
    def: "",
    count: null,
    body: <div className="empty" style={{ padding: 20 }}>Nothing to show.</div>,
  };
}

/* ── modal host ─────────────────────────────────────────────────────────── */

export function ModalHost({ modalKey, people, calc, onClose, onOpenCase, onOpenModal }) {
  if (!modalKey) return null;
  const m = modalFor(modalKey, people, calc, onOpenCase, onOpenModal);
  return (
    <>
      <div className="mscrim" onClick={onClose} />
      <div className="mmodal" role="dialog" aria-modal="true">
        <div className="mhead2">
          <div style={{ minWidth: 0 }}>
            <div className="msub">Analytics Detail</div>
            <div className="mtitle">{m.title}</div>
            {m.def ? <div className="mdef">{m.def}</div> : null}
            {m.count != null ? (
              <span className="mcount">{m.count} item{m.count !== 1 ? "s" : ""}</span>
            ) : null}
          </div>
          <button className="cph-close" onClick={onClose} aria-label="Close"><Ic n="x" s={13} /></button>
        </div>
        <div className="mbody">{m.body}</div>
      </div>
    </>
  );
}

/* ── case-file drawer ───────────────────────────────────────────────────── */

/** A labelled value tile inside the drawer. */
function Card({ l, v, hl, mono }) {
  return (
    <div className={`ccard${hl ? " wide" : ""}`}>
      <div className="ccl">{l}</div>
      <div className={`ccv${hl ? " hl" : ""}`}>
        {mono ? <span className="mono" style={{ fontSize: 12 }}>{v}</span> : v}
      </div>
    </div>
  );
}

const EMPTY = (msg) => <div className="empty" style={{ padding: 30 }}>{msg}</div>;

/**
 * Right-hand case file. `ctx` is the surface the case was opened from
 * (intake · release · pm) so only the relevant record is shown.
 */
export function CaseDrawer({ record, ctx, onClose }) {
  if (!record) return null;
  const p = record;
  const rel = p.release;
  const pm = p.pm;

  let statusLbl;
  let pulseCol;
  let body;

  if (ctx === "release") {
    statusLbl = rel ? (rel.status === "completed" ? "Released" : "Release Scheduled") : "No Release Yet";
    pulseCol = "var(--teal)";
    body = rel ? (
      <>
        <Card l="Release Date" v={`${fmtDate(rel.date)} · ${rel.time}`} />
        <Card l="Destination" v={rel.dest} hl />
        <Card l="Mode of Transport" v={rel.mode} />
        <Card l="Received By" v={rel.receiver} />
        <Card l="Status" v={rel.status === "completed" ? "Completed" : "Scheduled"} />
        <Card l="Inter-branch Transfer" v={rel.transfer ? "Yes" : "No"} />
      </>
    ) : EMPTY("No body release has been recorded for this case yet.");
  } else if (ctx === "pm") {
    if (!pm) {
      statusLbl = "No Postmortem";
      pulseCol = "var(--gray)";
      body = EMPTY("No postmortem request is on file for this case.");
    } else {
      const stLbl = PM_LABEL[pm.state] || "Requested";
      statusLbl = `Postmortem · ${stLbl}`;
      pulseCol = PM_COLOR[pm.state] || PM_COLOR.requested;
      body = (
        <>
          <Card l="Requested On" v={`${fmtDate(pm.reqDate)} · ${pm.reqTime}`} />
          <Card l="Requesting Authority" v={pm.authority} />
          <Card l="Pathologist" v={pm.pathologist} />
          <Card l="Status" v={stLbl} />
          {pm.state === "completed" ? <Card l="Completed On" v={fmtDate(pm.doneDate)} /> : null}
          <Card l="Date of Death" v={fmtDate(p.dod)} />
          <Card l="Preliminary Cause" v={p.cause} hl />
        </>
      );
    }
  } else {
    statusLbl = "Intake Record";
    pulseCol = "var(--blue)";
    const age = ageAt(p.dob, p.dod);
    body = (
      <>
        <Card l="Admission No." v={p.adm} mono />
        <Card l="Date Admitted" v={`${fmtDate(p.admDate)} · ${p.admTime}`} />
        <Card l="Received From" v={p.receivedFrom} />
        <Card l="Receiving Officer" v={p.officer} />
        <Card l="Permit No." v={p.permit} mono />
        <Card l="Body Condition" v={p.prepared ? "Prepared / Embalmed" : "Awaiting preparation"} />
        <Card l="Date of Death" v={fmtDate(p.dod)} />
        <Card l="Age at Death" v={age == null ? "—" : `${age} years`} />
        <Card l="Place of Death" v={p.place} hl />
        <Card l="Cause of Death" v={p.cause} hl />
        <Card l="Next of Kin" v={`${p.nok.name} (${p.nok.rel})`} hl />
        <Card l="Telephone" v={p.nok.phone} mono />
        <Card l="National ID" v={p.nok.id} mono />
      </>
    );
  }

  const stay = p.admDate && p.admDate > todayKey() ? "scheduled" : `${daysInCare(p) ?? 0} days in care`;

  return (
    <>
      <div className="cov" onClick={onClose} />
      <aside className="cpanel">
        <div className="cph">
          <span className="cph-status" style={{ color: pulseCol }}>
            <span className="cph-pulse" style={{ background: pulseCol }} />{statusLbl}
          </span>
          <button className="cph-close" onClick={onClose} aria-label="Close"><Ic n="x" s={13} /></button>
        </div>
        <div className="cpb">
          <div className="cname">{p.name}</div>
          <div className="ccode">{p.adm} · {p.branch} · {stay}</div>
          <div className="cgrid">{body}</div>
        </div>
      </aside>
    </>
  );
}
