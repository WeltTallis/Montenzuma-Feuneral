import { useState, useMemo } from "react";
import {
  CARE, TYPE_L, ageAt, ageBucketOf, ageFor, careCfg, careOf, daysInCare, fmtDate,
  isReleased, statusMeta, todayKey, MO,
} from "./opsData";
import { Avatar } from "./opsBits";
import { Ic } from "./opsIcons";
import { getTenantSlug as resolveTenantSlug } from "../utils/globalAuth";

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

/* ── case-file drawer (comprehensive multi-tab profile) ─────────────────── */

/** A labelled value tile inside the drawer. */
function Card({ l, v, hl, mono, sub, tag, tagCol }) {
  const isNil = v === null || v === undefined || v === "" || v === "—";
  return (
    <div className={`ccard${hl ? " wide" : ""}${isNil ? " is-nil" : ""}`}>
      <div className="ccl-row">
        <span className="ccl">{l}</span>
        {tag ? (
          <span className="cctag" style={tagCol ? { color: tagCol, borderColor: tagCol } : null}>
            {tag}
          </span>
        ) : null}
      </div>
      <div className={`ccv${hl ? " hl" : ""}`}>
        {mono ? <span className="mono" style={{ fontSize: 12 }}>{v || "—"}</span> : (v || "—")}
      </div>
      {sub ? <div className="ccsub">{sub}</div> : null}
    </div>
  );
}

/** Section heading inside a tab. */
function DrawerSection({ title, action }) {
  return (
    <div className="cp-sect">
      <span className="cp-sect-title">{title}</span>
      {action ? <div className="cp-sect-act">{action}</div> : null}
    </div>
  );
}

const EMPTY = (msg) => <div className="empty" style={{ padding: 24, textAlign: "center" }}>{msg}</div>;
const fDate = (d) => (d ? fmtDate(d) : "—");
const fDateTime = (d, t) => (d ? `${fmtDate(d)}${t ? ` · ${t}` : ""}` : "—");
const fBool = (b, y = "Yes", n = "No") => (b === true ? y : b === false ? n : "—");

/* ── Sub-components for Comprehensive Case Drawer ─────────────────────── */

function OverviewPane({ p, age, nokList }) {
  return (
    <div className="cp-pane">
      <DrawerSection title="Identity & Demographics" />
      <div className="cgrid">
        <Card l="Full Name" v={p.name} hl />
        <Card l="Admission Number" v={p.adm} mono />
        <Card l="Tag / Tag Number" v={p.tagNumber || p.adm} mono />
        <Card l="Gender" v={p.gender} />
        <Card l="Date of Birth" v={fDate(p.dob)} />
        <Card l="Date of Death" v={fDate(p.dod)} />
        <Card l="Time of Death" v={p.tod} mono />
        <Card l="Age at Death" v={age != null ? `${age} years` : (p.age ? `${p.age} years` : "—")} />
        <Card l="National / ID Number" v={p.idNumber} mono />
        <Card l="Marital Status" v={p.maritalStatus} />
        <Card l="Nationality" v={p.nationality} />
        <Card l="Religion / Faith" v={p.religion} />
      </div>

      <DrawerSection title="Passing & Circumstances" />
      <div className="cgrid">
        <Card l="Place of Death" v={p.place} hl />
        <Card l="Cause of Death" v={p.cause} hl />
        <Card l="Death Type / Manner" v={p.deathType} />
        <Card l="Burial Permit Number" v={p.permit} mono />
        <Card l="Body Condition at Intake" v={p.bodyCondition || (p.prepared ? "Prepared / Embalmed" : "Intact")} />
        <Card l="Preservation Method" v={p.preservationMethod || (p.prepared ? "Embalmed" : "Refrigerated")} />
      </div>

      <DrawerSection title="Storage & Physical Location" />
      <div className="cgrid">
        <Card l="Assigned Unit / Cold Room" v={p.storageLocation || p.coldRoom || (p.fridgeId ? `Unit ${p.fridgeId}` : "—")} hl />
        <Card l="Shelf / Tray" v={p.shelfNumber ? `Shelf ${p.shelfNumber}` : "—"} mono />
        <Card l="Storage Type" v={p.storageType || "Cold Storage"} />
        <Card l="Status" v={p.isReleased ? "Released / Discharged" : "In Storage"} />
      </div>

      {p.belongingsSummary || (p.belongings && p.belongings.length > 0) ? (
        <>
          <DrawerSection title="Personal Belongings / Inventory" />
          <div className="cgrid">
            <Card
              l="Inventory Summary"
              v={p.belongingsSummary || `${p.belongings?.length || 0} item(s) logged`}
              hl
            />
          </div>
        </>
      ) : null}

      <DrawerSection title="Next of Kin & Family Contacts" />
      {nokList.length > 0 ? (
        nokList.map((k, idx) => (
          <div key={idx} className="cp-nok-card">
            <div className="cp-nok-head">
              <span className="cp-nok-role">{k.tag || "Contact"}</span>
              {k.rel ? <span className="cp-nok-rel">{k.rel}</span> : null}
            </div>
            <div className="cgrid">
              <Card l="Contact Name" v={k.name} hl />
              <Card l="Relationship" v={k.rel} />
              <Card l="Phone Number" v={k.phone} mono />
              <Card l="Alternate Phone" v={k.alternatePhone} mono />
              <Card l="National ID" v={k.id || k.idNumber} mono />
              <Card l="Email" v={k.email} />
              <Card l="Physical Address" v={k.address} hl />
            </div>
          </div>
        ))
      ) : (
        EMPTY("No next of kin recorded for this case.")
      )}
    </div>
  );
}

function IntakePane({ p }) {
  return (
    <div className="cp-pane">
      <DrawerSection title="Intake & Admission" />
      <div className="cgrid">
        <Card l="Admission Number" v={p.adm} mono />
        <Card l="Admission Date & Time" v={fDateTime(p.admDate, p.admTime)} hl />
        <Card l="Receiving Branch" v={p.branch} />
        <Card l="Receiving Officer / Staff" v={p.officer} />
        <Card l="Received From" v={p.receivedFrom} hl />
        <Card l="Brought In By" v={p.broughtInBy || p.receivedFrom} />
        <Card l="Driver / Collector Name" v={p.driverName} />
        <Card l="Vehicle Registration" v={p.vehicleReg} mono />
        <Card l="Body Source / Origin" v={p.bodySource || p.place} />
        <Card l="Tag Number" v={p.tagNumber || p.adm} mono />
      </div>

      <DrawerSection title="Documentation & Permits" />
      <div className="cgrid">
        <Card l="Burial Permit Number" v={p.permit} mono />
        <Card l="Permit Issued By" v={p.permitIssuedBy} />
        <Card l="Permit Issue Date" v={fDate(p.permitIssueDate)} />
        <Card l="Police Station / OB Number" v={p.policeObNumber} mono />
        <Card l="Death Certificate No." v={p.deathCertNumber} mono />
        <Card l="Certifying Doctor / Facility" v={p.certifyingDoctor} />
      </div>

      <DrawerSection title="Clinical Intake Assessment" />
      <div className="cgrid">
        <Card l="Body Condition" v={p.bodyCondition || (p.prepared ? "Prepared" : "Intact")} />
        <Card l="Visible Marks / Trauma" v={p.visibleMarks || "None reported"} hl />
        <Card l="Infectious / Hazard Precautions" v={p.hazardPrecautions || "Standard precautions"} />
        <Card l="Weight / Est. Weight" v={p.weight ? `${p.weight} kg` : "—"} mono />
        <Card l="Embalming Required" v={fBool(p.embalmingRequired)} />
        <Card l="Embalming Status" v={p.prepared ? "Completed" : "Not yet prepared"} />
      </div>

      <DrawerSection title="Financial & Billing Intake" />
      <div className="cgrid">
        <Card l="Billing Plan / Package" v={p.billingPlan || "Standard Daily Rate"} />
        <Card l="Daily Rate (KES)" v={p.dailyRate ? p.dailyRate.toLocaleString() : "—"} mono />
        <Card l="Deposit Paid (KES)" v={p.depositPaid ? p.depositPaid.toLocaleString() : "—"} mono />
        <Card l="Payer Name" v={p.payerName || p.nok?.name} />
      </div>
    </div>
  );
}


function PostmortemPane({ p, pm }) {
  if (!pm) return EMPTY("No postmortem request is on file for this case.");
  return (
    <div className="cp-pane">
      <DrawerSection
        title="Postmortem Request & Status"
        action={(
          <span className="cp-badge-state" style={{ background: PM_COLOR[pm.state] || PM_COLOR.requested }}>
            {PM_LABEL[pm.state] || pm.state}
          </span>
        )}
      />
      <div className="cgrid">
        <Card l="Status" v={PM_LABEL[pm.state] || pm.state} hl />
        <Card l="Request Reference No." v={pm.requestNumber || pm.id} mono />
        <Card l="Date Requested" v={fDate(pm.reqDate)} />
        <Card l="Scheduled Time" v={pm.reqTime} mono />
        <Card l="Completed On" v={fDateTime(pm.doneDate, pm.doneTime)} />
        <Card l="Requesting Authority" v={pm.authority || pm.type} hl />
        <Card l="Authority Type" v={pm.type || "Family Request"} />
        <Card l="Case File / OB Number" v={pm.caseNumber || pm.policeCaseNo || p.policeObNumber} mono />
      </div>

      <DrawerSection title="Medical & Pathology Personnel" />
      <div className="cgrid">
        <Card l="Lead Pathologist" v={pm.pathologist} hl />
        <Card l="Pathologist Reg. / License No." v={pm.pathologistLicense} mono />
        <Card l="Assisting Technician" v={pm.technician || p.officer} />
        <Card l="Attending Investigating Officer" v={pm.investigatingOfficer} />
        <Card l="Family Representative Present" v={pm.familyRep || p.nok?.name} />
      </div>

      <DrawerSection title="Findings & Pathological Observations" />
      <div className="cgrid">
        <Card l="Preliminary / Stated Cause" v={p.cause} hl />
        <Card l="Final Cause of Death" v={pm.finalCause || pm.findings || "Pending autopsy report"} hl />
        <Card l="External Examination Notes" v={pm.externalNotes || "Logged in clinical file"} />
        <Card l="Internal Examination Notes" v={pm.internalNotes || "Logged in clinical file"} />
        <Card l="Specimens Collected" v={pm.specimens || (pm.toxicologyRequested ? "Toxicology / Histology" : "None")} />
        <Card l="Toxicology Requested" v={fBool(pm.toxicologyRequested)} />
        <Card l="Histology Requested" v={fBool(pm.histologyRequested)} />
      </div>

      <DrawerSection title="Sign-off & Report Filing" />
      <div className="cgrid">
        <Card l="Report Signed By" v={pm.signedBy || pm.pathologist} />
        <Card l="Report Signed Date" v={fDate(pm.signedDate || pm.doneDate)} />
        <Card l="Form D10 Issued" v={fBool(pm.formD10Issued)} />
        <Card l="Burial Clearance Granted" v={fBool(pm.clearanceGranted, "Granted", "Withheld")} hl />
      </div>
    </div>
  );
}

function ReleasePane({ p, rel }) {
  if (!rel) return EMPTY("No body release has been recorded for this case yet.");
  return (
    <div className="cp-pane">
      <DrawerSection
        title="Body Release Details"
        action={(
          <span className="cp-badge-state" style={{ background: rel.status === "completed" ? "var(--green, #10b981)" : "var(--teal, #0d9488)" }}>
            {rel.status === "completed" ? "Completed" : "Scheduled"}
          </span>
        )}
      />
      <div className="cgrid">
        <Card l="Release Status" v={rel.status === "completed" ? "Completed / Discharged" : "Scheduled"} hl />
        <Card l="Release Date & Time" v={fDateTime(rel.date, rel.time)} hl />
        <Card l="Release Reference No." v={rel.releaseNumber || rel.id} mono />
        <Card l="Destination Cemetery / Facility" v={rel.dest} hl />
        <Card l="Destination County / Town" v={rel.destCounty || rel.destTown} />
        <Card l="Mode of Transport" v={rel.mode} />
        <Card l="Hearse / Vehicle Reg." v={rel.vehicleReg || rel.hearseNumber} mono />
        <Card l="Driver / Carrier Name" v={rel.driverName} />
      </div>

      <DrawerSection title="Recipient & Authorized Collector" />
      <div className="cgrid">
        <Card l="Received By (Authorized Collector)" v={rel.receiver || rel.collectorName} hl />
        <Card l="Recipient National ID" v={rel.receiverId || rel.collectorId} mono />
        <Card l="Recipient Phone Number" v={rel.receiverPhone || rel.collectorPhone} mono />
        <Card l="Relationship to Deceased" v={rel.receiverRel || p.nok?.rel} />
        <Card l="Authority / Authorization Letter" v={rel.authLetter || "Family Authorization on file"} />
      </div>

      <DrawerSection title="Discharge Clearance & Handover" />
      <div className="cgrid">
        <Card l="Releasing Mortuary Officer" v={rel.officer || rel.releasingOfficer} />
        <Card l="Inter-branch Transfer" v={fBool(rel.transfer)} />
        <Card l="Transfer To Branch" v={rel.targetBranch || "N/A"} />
        <Card l="Financial Clearance Status" v={rel.billingCleared ? "Cleared (Paid in full)" : (rel.invoiceStatus || "Pending Clearance")} hl />
        <Card l="Burial Permit Handed Over" v={fBool(rel.permitHandedOver ?? true)} />
        <Card l="Belongings Handed Over" v={fBool(rel.belongingsHandedOver ?? true)} />
        <Card l="Gate Pass Number" v={rel.gatePassNumber} mono />
      </div>
    </div>
  );
}

/**
 * Right-hand case file drawer.
 * Comprehensive multi-tab profile mirroring the Deceased profile:
 *  - Overview (Demographics, admission, storage/fridge, belongings, condition, NOK)
 *  - Intake (Full admission & transfer trail, collection, transport, docs, fees)
 *  - Postmortem (Request details, authority, doctor, findings, specimens, toxicology, sign-off)
 *  - Release (Release status, clearance, recipient, destination, transport, permits)
 *
 * `ctx` ("intake" | "release" | "pm") pre-selects the most relevant tab,
 * but all tabs remain accessible so the operator can inspect any detail.
 */
export function CaseDrawer({ record, ctx, onClose }) {
  if (!record) return null;
  const p = record;
  const rel = p.release;
  const pm = p.pm;

  const initialTab = ctx === "release" ? "release" : ctx === "pm" ? "pm" : ctx === "intake" ? "intake" : "overview";
  const [tab, setTab] = useState(initialTab);

  let statusLbl = "Active in Care";
  let pulseCol = "var(--blue)";
  if (p.isReleased || (rel && rel.status === "completed")) {
    statusLbl = "Released";
    pulseCol = "var(--green, #10b981)";
  } else if (pm) {
    const stLbl = PM_LABEL[pm.state] || "Requested";
    statusLbl = `Postmortem · ${stLbl}`;
    pulseCol = PM_COLOR[pm.state] || PM_COLOR.requested;
  } else if (rel) {
    statusLbl = "Release Scheduled";
    pulseCol = "var(--teal, #0d9488)";
  }

  const age = ageAt(p.dob, p.dod);
  const stay = p.admDate && p.admDate > todayKey() ? "Scheduled Admission" : `${daysInCare(p) ?? 0} days in care`;

  const tenantSlug = (typeof window !== "undefined" && (
    localStorage.getItem("tenantSlug") ||
    localStorage.getItem("tenant_slug") ||
    resolveTenantSlug?.() ||
    ""
  )) || "";
  const profileUrl = p.id && tenantSlug ? `/tenant/${tenantSlug}/deceased/${p.id}` : null;

  const nokList = useMemo(() => {
    const list = [];
    if (p.nok && (p.nok.name || p.nok.phone)) {
      list.push({ ...p.nok, tag: "Primary Next of Kin" });
    }
    if (p.secondaryNok && (p.secondaryNok.name || p.secondaryNok.phone)) {
      list.push({ ...p.secondaryNok, tag: "Secondary Contact" });
    }
    return list;
  }, [p.nok, p.secondaryNok]);

  return (
    <>
      <div className="cov" onClick={onClose} />
      <aside className="cpanel cp-comprehensive">
        {/* Drawer Header */}
        <div className="cph">
          <div className="cph-left">
            <span className="cph-status" style={{ color: pulseCol }}>
              <span className="cph-pulse" style={{ background: pulseCol }} />
              {statusLbl}
            </span>
            {p.gender ? <span className="cp-chip">{p.gender}</span> : null}
            {p.branch ? <span className="cp-chip">{p.branch}</span> : null}
          </div>
          <div className="cph-actions">
            {profileUrl ? (
              <a
                href={profileUrl}
                target="_blank"
                rel="noreferrer"
                className="cph-ext-link"
                title="Open full profile in new tab"
              >
                <span>Full Profile</span>
                <Ic n="ext" s={12} />
              </a>
            ) : null}
            <button className="cph-close" onClick={onClose} aria-label="Close">
              <Ic n="x" s={13} />
            </button>
          </div>
        </div>

        {/* Identity banner */}
        <div className="cp-hero">
          <div className="cp-hero-main">
            <div className="cname">{p.name || "Unnamed Case"}</div>
            <div className="ccode">
              <span className="mono">{p.adm || p.tagNumber || "—"}</span>
              <span className="dot-sep">·</span>
              <span>{p.branch || "Main"}</span>
              <span className="dot-sep">·</span>
              <span className="cp-stay">{stay}</span>
            </div>
          </div>
          {p.storageLocation || p.fridgeId ? (
            <div className="cp-badge-storage" title="Cold Storage Assignment">
              <span className="cp-badge-icon">❄</span>
              <span className="cp-badge-text">
                {p.storageLocation || `Unit ${p.fridgeId}${p.shelfNumber ? ` / Shelf ${p.shelfNumber}` : ""}`}
              </span>
            </div>
          ) : null}
        </div>

        {/* Tabs */}
        <div className="cp-tabs">
          <button
            type="button"
            className={`cp-tab${tab === "overview" ? " active" : ""}`}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            className={`cp-tab${tab === "intake" ? " active" : ""}`}
            onClick={() => setTab("intake")}
          >
            Intake & Admission
          </button>
          <button
            type="button"
            className={`cp-tab${tab === "pm" ? " active" : ""}`}
            onClick={() => setTab("pm")}
          >
            Postmortem {pm ? `(${PM_LABEL[pm.state] || "1"})` : ""}
          </button>
          <button
            type="button"
            className={`cp-tab${tab === "release" ? " active" : ""}`}
            onClick={() => setTab("release")}
          >
            Release {rel ? (rel.status === "completed" ? "✓" : "•") : ""}
          </button>
        </div>

        {/* Tab Body */}
        <div className="cpb cp-tab-content">
          {tab === "overview" && <OverviewPane p={p} age={age} nokList={nokList} />}
          {tab === "intake" && <IntakePane p={p} />}
          {tab === "pm" && <PostmortemPane p={p} pm={pm} />}
          {tab === "release" && <ReleasePane p={p} rel={rel} />}
        </div>
      </aside>
    </>
  );
}
