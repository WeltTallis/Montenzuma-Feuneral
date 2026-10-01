import {
  CARE, TYPE_L, ageBucketOf, ageFor, careCfg, careOf, daysInCare, fmtDate,
  isReleased, statusMeta, todayKey, MO,
} from "./opsData";
import { Avatar } from "./opsBits";
import { Ic } from "./opsIcons";
import { getTenantSlug as resolveTenantSlug } from "../utils/globalAuth";
import { useState } from "react";
import env from "../utils/config/env";
import { rebaseUploadUrl } from "../utils/tenantResolver/tenantBranding";

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
      onClick={() => onOpenCase(c.uid)}
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
        <CaseRow key={c.uid} c={c} meta={statusMeta(c)} onOpenCase={onOpenCase} />
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
            key={s.c.uid}
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
          return <CaseRow key={c.uid} c={c} meta={`${role} · ${c.cause}`} onOpenCase={onOpenCase} />;
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
          <CaseRow key={c.uid} c={c} meta={`Age ${ageFor(c)} · ${c.cause}`} onOpenCase={onOpenCase} />
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
              <CaseRow key={c.uid} c={c} meta={`Admitted ${fmtDate(c.admDate)} · ${c.receivedFrom}`} onOpenCase={onOpenCase} />
            ))
            : <div className="empty" style={{ padding: 14 }}>None.</div>}
          <div className="msect">Releases</div>
          {rel.length
            ? rel.slice(0, 10).map((c) => (
              <CaseRow
                key={c.uid}
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
          <CaseRow key={`${e.t}-${e.c.uid}`} c={e.c} meta={`${TYPE_L[e.t]} at ${e.time}`} onOpenCase={onOpenCase} />
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
              key={c.uid}
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

/* ── case-file drawer (single contextual pane) ──────────────────────────── */

/**
 * A labelled value tile inside the drawer.
 *
 * EMPTY TILES ARE NOT RENDERED. The register is a wide `SELECT *`, so most
 * mortuary fields (chamber, storage type, mortuary location, verified-by,
 * burial type, coffin status, dispatched-to, identifying marks, …) are NULL for
 * most cases. Rendering a tile per field filled every drawer with rows of "—",
 * which buried the handful of values that actually mattered. A card with no
 * value now renders nothing at all, so the drawer only shows real data.
 *
 * Pass `keepEmpty` for a field whose BLANKNESS is the message (e.g. an explicit
 * "not recorded yet" state); it then renders in the muted `is-nil` style.
 */
function Card({ l, v, hl, mono, sub, tag, tagCol, keepEmpty }) {
  const isNil = v === null || v === undefined || v === "" || v === "—";
  if (isNil && !keepEmpty) return null;
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

/** Section heading inside a pane. */
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
/** A raw API/form date that may be a full timestamp or a free-text date. */
const fRawDate = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? fmtDate(m[1]) : s;
};

/**
 * First genuinely-populated value across several sources.
 *
 * The same fact can live in more than one place — the deceased register row
 * (p.raw / p.intake) and the body_releases row (rel.raw). The two forms fill
 * in different subsets, so a field the release operator left blank is often
 * already recorded against the case itself. Reading a single source leaves
 * tiles looking empty even though the data exists.
 */
const first = (...vals) => {
  for (const v of vals) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s && s !== "—" && s !== "null" && s !== "undefined") return v;
  }
  return "";
};
const fDateTime = (d, t) => (d ? `${fmtDate(d)}${t ? ` · ${t}` : ""}` : "—");
const fBool = (b, y = "Yes", n = "No") => (b === true ? y : b === false ? n : "—");

/**
 * A captured signature image (next-of-kin or release authorisation).
 *
 * WHY THE FALLBACK CHANGED
 * -----------------------
 * This used to show "Click to view signature ↗" whenever the <img> failed to
 * load. That is a misleading label: it implies a link that works, but the file
 * was already 404/500, so clicking just produced a broken page. Operators read
 * it as "the signature is captured, tap to open" and stopped investigating —
 * which is precisely the case where the file is MISSING and the release is not
 * actually evidenced.
 *
 * It now says the file could not be loaded and offers a clearly-secondary
 * "open anyway" link, so a missing signature is visible as a missing signature.
 * The inline preview is tried FIRST; the link is a fallback, not the headline.
 *
 * The data-URI form is handled explicitly: a canvas/base64 signature is stored
 * inline and is by far the most common shape, and it must never be prefixed
 * with UPLOADS_URL.
 */
function SignatureImage({ path, label = "Signature" }) {
  const [failed, setFailed] = useState(false);

  const src = (() => {
    if (!path) return null;
    const p = String(path).trim();
    if (!p) return null;
    if (/^data:image\//i.test(p)) return p;           // inline capture — use as-is
    if (/^https?:\/\//i.test(p)) return rebaseUploadUrl(p);
    if (p.startsWith("/")) return `${env.UPLOADS_URL}${p}`;
    return `${env.UPLOADS_URL}/${p.replace(/^\/+/, "")}`;
  })();

  if (!src) return null;

  if (failed) {
    return (
      <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5 }}>
        <span style={{ color: "var(--amber, #b45309)" }}>
          ⚠ {label} image could not be loaded — the file may be missing.
        </span>{" "}
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#1a73e8", textDecoration: "underline", whiteSpace: "nowrap" }}
        >
          open anyway ↗
        </a>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={label}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        maxWidth: "100%", maxHeight: 180, marginTop: 6, background: "#fff",
        padding: 6, borderRadius: 6, objectFit: "contain",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    />
  );
}

/* ── Sub-components for Comprehensive Case Drawer ─────────────────────── */

/**
 * Intake & Admission pane.
 *
 * Reads the NORMALISED case shape produced by buildCases()/mapDeceased() in
 * opsData — not raw API keys. The deceased-register detail block lives on
 * `p.intake` (built by intakeOf()); charges are nested under `p.intake.charges`
 * and are already formatted strings, or null when nothing is recorded.
 *
 * `p.intake` is absent on cases that exist only in the release/postmortem
 * feeds, hence the empty-object fallback.
 */
function IntakePane({ p }) {
  const it = p.intake || {};
  const ch = it.charges || {};
  const nok = p.nok || {};
  // The register row is `SELECT *`, so it is the fallback source for anything
  // the normalised map does not carry.
  const raw = p.raw || {};

  return (
    <div className="cp-pane">
      <DrawerSection title="Intake & Admission" />
      <div className="cgrid">
        <Card l="Admission Number" v={p.adm} mono />
        <Card l="Admission Date & Time" v={fDateTime(p.admDate, p.admTime)} hl />
        <Card l="Receiving Branch" v={p.branch} />
        <Card l="Receiving Officer / Staff" v={p.officer} />
        <Card l="Received From" v={p.receivedFrom} hl />
        <Card l="Register Date" v={fDate(it.registeredAt)} />
        <Card l="Registered By" v={first(it.createdBy, raw.created_by)} />
        <Card l="Case Status" v={first(it.admissionStatus, raw.status)} />
        <Card l="Dispatch Date" v={fRawDate(raw.dispatch_date)} />
        <Card l="Burial Location" v={first(raw.burial_location)} />
      </div>

      <DrawerSection title="Permit &amp; Contact" />
      <div className="cgrid">
        <Card l="Burial Permit Number" v={p.permit} mono />
        {/* National ID deliberately lives ONLY in "Deceased Details" below. It was
            rendered here as well, so the same number appeared twice in one drawer. */}
        <Card l="Phone Number" v={first(it.phone, nok.phone)} mono />
        <Card l="Alternate Phone" v={first(nok.altPhone, it.altPhone)} mono />
        <Card l="Email" v={first(nok.email, it.email)} />
      </div>

      <DrawerSection title="Deceased Details" />
      <div className="cgrid">
        <Card l="Full Name" v={p.name} hl />
        <Card l="Gender" v={p.sex} />
        <Card l="Date of Birth" v={fDate(p.dob)} />
        <Card l="Date of Death" v={fDate(p.dod)} />
        <Card l="Age at Death" v={it.age != null ? `${it.age} years` : ""} />
        <Card l="Place of Death" v={p.place} />
        <Card l="Cause of Death" v={p.cause} hl />
        {/* Deceased ID is the register's own public identifier. `p.adm`
            (Admission Number) is derived from admission_number and FALLS BACK to
            deceased_id when the row has no admission_number, so both tiles used
            to show the same string (e.g. LEE-PETQVA28B4KVAYUHCC8). Read the real
            column here and only show this tile when it genuinely differs from the
            admission number, so the drawer never prints one value twice. */}
        {it.deceasedId && it.deceasedId !== p.adm ? (
          <Card l="Deceased ID" v={it.deceasedId} mono />
        ) : null}
        {/* Identity + mortuary detail. These are all on the register row and in
            intakeOf(), but were never rendered here, so the drawer looked
            emptier than the data actually was. */}
        <Card l="ID Type" v={it.idType} />
        <Card l="National ID" v={it.idNo} mono />
        <Card l="County" v={it.county} />
        <Card l="Physician" v={it.physician} />
        <Card l="Chamber Assigned" v={it.chamber} />
        <Card l="Storage Type" v={it.storage} />
        <Card l="Mortuary Location" v={it.location} />
        <Card l="Verified By" v={it.verifiedBy} />
        <Card l="Release Status" v={it.releaseStatus} />
        <Card l="Burial Type" v={it.burialType} />
        <Card l="Coffin Status" v={it.coffinStatus} />
        <Card l="Dispatched To" v={first(it.dispatchedTo, raw.dispatched_to)} />
        <Card l="Identifying Marks" v={it.marks} />
      </div>

      <DrawerSection title="Body Status" />
      <div className="cgrid">
        <Card l="Body Status" v={it.bodyStatus} hl />
        <Card l="Preservation" v={p.prepared ? "Embalmed / Prepared" : "Not yet prepared"} />
        {/* Read the NORMALISED signature first. `intakeOf()` already resolves it
            from the register row; the panel used to read `raw.signature` only,
            which is blank on most rows, so this always read "No" even when a
            signature had actually been captured. */}
        <Card
          l="Signature Captured"
          v={fBool(Boolean(first(it.signature, raw.signature)))}
        />
        {/* Mortuary tenure is the single most operationally important number
            on this panel, so it is a full-width highlight rather than a
            footnote in the hero strip. */}
        <Card
          l="Days in Morgue"
          v={p.admDate && p.admDate > todayKey() ? "Scheduled" : `${daysInCare(p) ?? 0} days`}
          hl
          sub={p.release && p.release.status === "completed" ? "Released" : "Still in our care"}
        />
      </div>

      <DrawerSection title="Next of Kin" />
      <div className="cgrid">
        <Card l="Next of Kin" v={nok.name} hl />
        <Card l="Relationship" v={nok.rel} />
        <Card l="Phone Number" v={first(nok.phone, it.phone)} mono />
        <Card l="Additional Contacts" v={it.nokCount != null ? `${it.nokCount}` : ""} />
        <Card l="Alt. Phone" v={first(nok.altPhone, it.altPhone)} mono />
        <Card l="Email" v={first(nok.email, it.email)} />
        <Card l="National ID" v={nok.id} mono />
        <Card l="Address" v={first(nok.address, raw.address)} />
      </div>

      {/* Authorisation Signature — REMOVED.
          The register row carries a `signature` column that is empty for most
          cases, so this section rendered either an empty tile or a broken image,
          and the same value was already shown under "Signature Captured" in the
          Body Status section above. If the signature is needed operationally it
          belongs on the deceased profile's Overview tab, not in the dashboard. */}

      <DrawerSection title="Charges" />
      <div className="cgrid">
        <Card l="Total Mortuary Charge" v={ch.total} hl />
        <Card l="Extra Charges" v={ch.extra} mono />
      </div>
    </div>
  );
}


/**
 * Postmortem pane.
 *
 * `pm` is the normalised request object from pmFromRequest()/pmFromRegister().
 * Only fields that object actually produces are rendered — reqDate/doneDate are
 * already YYYY-MM-DD keys (safe for fDate), while sentAt/completedAt are raw
 * API timestamps and are shown verbatim rather than run through the date parser.
 */
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
        <Card l="Request Reference No." v={pm.ref} mono />
        <Card l="Date Requested" v={fDate(pm.reqDate)} />
        <Card l="Scheduled Time" v={pm.reqTime} mono />
        <Card l="Completed On" v={fDateTime(pm.doneDate, pm.doneTime)} />
        <Card l="Requesting Authority" v={pm.authority} hl />
        <Card l="Requested By" v={pm.requestedBy} />
        <Card l="Request Status" v={pm.reqStatus} />
        <Card l="Examination Status" v={pm.examStatus} />
        <Card l="Reason / Request Note" v={pm.reason} />
      </div>

      <DrawerSection title="Medical & Pathology Personnel" />
      <div className="cgrid">
        <Card l="Lead Pathologist" v={pm.pathologist} hl />
        <Card l="Attending Officer" v={p.officer} />
        <Card l="Case File / Admission No." v={p.adm} mono />
      </div>

      <DrawerSection title="Findings & Pathological Observations" />
      <div className="cgrid">
        <Card l="Preliminary / Stated Cause" v={p.cause} hl />
        <Card l="Findings" v={pm.findings} hl />
        <Card l="Examination Summary" v={pm.summary} />
        <Card l="Postmortem Report" v={pm.report} />
        <Card l="Clinical Notes" v={pm.notes} />
      </div>

      <DrawerSection title="Timeline" />
      <div className="cgrid">
        <Card l="Sent" v={pm.sentAt} mono />
        <Card l="Completed At" v={pm.completedAt} mono />
        <Card l="Cancelled At" v={pm.cancelledAt} mono />
      </div>
    </div>
  );
}

/**
 * Release pane.
 *
 * `rel` is the normalised release object from releaseFromFeed()/releaseFromRegister().
 * `rel.date` is already a YYYY-MM-DD key (safe for fDate); `recordedAt` is a raw
 * API timestamp and is shown verbatim.
 */
function ReleasePane({ p, rel }) {
  if (!rel) return EMPTY("No body release has been recorded for this case yet.");
  // The release feed is `SELECT *`, so the raw row still carries every field the
  // Body Release form captured. Read the deceased-identity fields from there.
  const rw = rel.raw || {};
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
        <Card l="Release Reference No." v={rel.id} mono />
        <Card l="Destination Cemetery / Facility" v={rel.dest} hl />
        <Card l="Mode of Transport" v={rel.mode} />
        <Card l="Hearse / Plate Number" v={rel.plate} mono />
        <Card l="Inter-branch Transfer" v={fBool(rel.transfer)} />
        <Card l="Burial Permit Number" v={rel.permit} mono />
      </div>

      <DrawerSection title="Recipient &amp; Authorized Collector" />
      <div className="cgrid">
        <Card l="Next of Kin (as recorded)" v={first(rw.next_kin, p.nok?.name)} />
        <Card l="Received By (Authorized Collector)" v={first(rel.receiver, rw.received_by, rw.released_by)} hl />
        <Card l="Recipient National ID" v={first(rel.receiverId, rw.id_number, p.nok?.id)} mono />
        <Card l="Recipient Phone Number" v={first(rel.receiverPhone, rw.tell_number, rw.tel_number, p.nok?.phone)} mono />
        <Card l="Relationship to Deceased" v={first(rel.receiverRel, rw.relationship, p.nok?.rel)} />
        <Card l="Witness" v={rel.witness} />
      </div>

      <DrawerSection title="Clearance &amp; Handover" />
      <div className="cgrid">
        <Card l="Released By" v={first(rel.staff, rw.released_by, p.officer)} />
        <Card l="Financial Clearance" v={rel.paid ? "Cleared (Paid in full)" : "Pending Clearance"} hl />
        <Card l="Terms Accepted" v={fBool(rel.terms)} />
        <Card l="Items Returned" v={rel.items} />
        <Card l="Handover Notes" v={rel.notes} />
        <Card l="Recorded At" v={first(rel.recordedAt, p.raw?.created_at)} mono />
      </div>

      {/* The release signature. `rel` only exists when the release feed row was
          successfully matched to this case (see the name-matching fallback in
          buildCases), so an unmatched release used to render an empty tile here
          AND an empty "Release Reference No." above, which read as "no release
          recorded" even when the body had in fact been released. The section is
          now suppressed entirely when there is no signature, and the image
          falls back through every column the release form can write. */}
      {(() => {
        const sig = first(
          rel.signature, rel.staffSignature,
          rw.signature, rw.staff_signature, rw.receiver_signature,
          p.nok?.signature, p.intake?.signature, p.raw?.signature,
        );
        if (!sig) return null;
        return (
          <>
            <DrawerSection title="Release Signature" />
            <div className="cgrid">
              <div className="ccard wide" style={{ gridColumn: "1 / -1" }}>
                <div className="ccl-row">
                  <span className="ccl">Release Signature</span>
                  <span className="cctag">Authorised</span>
                </div>
                <SignatureImage path={sig} label="Release signature" />
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}

/**
 * Right-hand case file drawer.
 *
 * Shows exactly ONE pane — the one that matches the context the case was
 * opened from. There is no tab bar and no Overview pane:
 *   ctx "pm"      -> Postmortem only
 *   ctx "release" -> Release only
 *   anything else -> Intake & Admission only
 *
 * The removed Overview information (demographics, next of kin, belongings,
 * storage) is still reachable via the "Full Profile" button in the header,
 * which opens the complete deceased record in a new tab.
 */
export function CaseDrawer({ record, ctx, onClose }) {
  if (!record) return null;
  const p = record;
  const rel = p.release;
  const pm = p.pm;

  // The drawer is opened from a specific place, so show only that workflow.
  const pane = ctx === "pm" ? "pm" : ctx === "release" ? "release" : "intake";

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

  const stay = p.admDate && p.admDate > todayKey() ? "Scheduled Admission" : `${daysInCare(p) ?? 0} days in care`;

  const tenantSlug = (typeof window !== "undefined" && (
    localStorage.getItem("tenantSlug") ||
    localStorage.getItem("tenant_slug") ||
    resolveTenantSlug?.() ||
    ""
  )) || "";
  const profileUrl = p.id && tenantSlug ? `/${tenantSlug}/deceased/${p.id}` : null;

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
            {p.sex ? <span className="cp-chip">{p.sex}</span> : null}
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
              <span className="mono">{p.adm || "—"}</span>
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

        {/* Body — one pane only, chosen by the context the drawer was opened from */}
        <div className="cpb cp-tab-content">
          {pane === "intake" && <IntakePane p={p} />}
          {pane === "pm" && <PostmortemPane p={p} pm={pm} />}
          {pane === "release" && <ReleasePane p={p} rel={rel} />}
        </div>
      </aside>
    </>
  );
}
