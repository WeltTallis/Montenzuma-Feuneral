/* ══════════════════════════════════════════════════════════════════════════
   Operations Dashboard — data layer.

   Two jobs:
     1. Turn the REAL API payloads (deceased register · body-release feed ·
        postmortem-request feed) into the flat "case" model the dashboard
        renders.
     2. All derived figures — care status, day/week/month grouping, the
        analytics aggregates and the automated insights.

   Nothing here touches React; the components import these helpers so the
   visual layer stays declarative.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── calendar constants ─────────────────────────────────────────────────── */
export const MO = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MOS = MO.map((m) => m.slice(0, 3));
const DOWS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const DOWM = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
export const DOWF = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* Storage holding fee used for the accrual figure (KES / body / day).
   Kept as a single constant so the business rate is easy to change. */
const STORAGE_FEE_PER_DAY = 500;

/* ── date helpers ───────────────────────────────────────────────────────── */
export const pad = (n) => (String(n).length < 2 ? `0${n}` : String(n));

/** Anything date-ish → local `YYYY-MM-DD` (no timezone shift), else null. */
function keyOf(v) {
  if (v == null || v === "") return null;
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Anything time-ish → `HH:MM`, else "". */
function timeOf(v) {
  const s = String(v ?? "");
  if (!/\d{1,2}:\d{2}/.test(s)) return "";
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return "";
  return `${pad(Math.min(23, Number(m[1])))}:${m[2]}`;
}

export function parseKey(k) {
  const p = String(k || "").split("-").map(Number);
  return new Date(p[0] || 1970, (p[1] || 1) - 1, p[2] || 1);
}

const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => toKey(new Date());

export function addDays(k, n) {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
}
const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);

export function weekStartOf(k) {
  const d = parseKey(k);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toKey(d);
}

export const fmtDate = (k) => {
  if (!k) return "—";
  const d = parseKey(k);
  return `${MOS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};
export const shortDate = (k) => {
  const d = parseKey(k);
  return `${MOS[d.getMonth()]} ${d.getDate()}`;
};

export function ageAt(dob, dod) {
  if (!dob || !dod) return null;
  const b = parseKey(dob);
  const d = parseKey(dod);
  let a = d.getFullYear() - b.getFullYear();
  if (d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())) a -= 1;
  return a;
}

export const initials = (n) =>
  String(n || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

export function fmtK(n) {
  if (n >= 1000) return `KES ${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}K`;
  return `KES ${Math.round(n)}`;
}

/** Current wall-clock `HH:MM` — the timeline's LIVE marker. */
export function nowClock() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ── status model ───────────────────────────────────────────────────────── */

/* Care-state palette (CSS custom properties so dark mode swaps them). */
export const CARE = {
  "in-care": { label: "In Care", c: "var(--blue)", bg: "var(--blue-bg)" },
  "pm-req": { label: "PM Requested", c: "var(--orange)", bg: "var(--orange-bg)" },
  "pm-done": { label: "PM Done", c: "var(--plum)", bg: "var(--plum-bg)" },
  released: { label: "Released", c: "var(--teal)", bg: "var(--teal-bg)" },
  transferred: { label: "Transferred", c: "var(--gray)", bg: "var(--gray-bg)" },
};
const SCHED = { label: "Scheduled", c: "var(--gray)", bg: "var(--gray-bg)" };

/* Event palette — intake · release · postmortem. */
export const TYPE_C = { intake: "var(--blue)", release: "var(--teal)", pm: "var(--orange)" };
export const TYPE_L = { intake: "Intake", release: "Release", pm: "Postmortem" };
export const TYPE_SOLID = { intake: "st-blue", release: "st-teal", pm: "st-amber" };

export const EVENT_VERB = {
  intake: { verb: "Body received", c: "var(--blue)" },
  release: { verb: "Body released", c: "var(--teal)" },
  pm: { verb: "Postmortem exam", c: "var(--orange)" },
};

/* ── register → case mapping ────────────────────────────────────────────── */

/* `status` is a legacy column that stays 'active' forever, so it must never be
   read first — it masks body_status / admission_status, the fields that
   actually flip when a body is released. */
const signalOf = (r) =>
  [r?.body_status, r?.admission_status, r?.release_status, r?.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
const releasedSignal = (r) => /(released|dispatched|completed|buried)/.test(signalOf(r));
const pmRequestedSignal = (r) => {
  const pm = r?.postmortem || null;
  return (
    r?.postmortem_requested === true ||
    r?.postmortem_requested === 1 ||
    Boolean(pm?.requested_at || pm?.created_at) ||
    /(postmortem|post-mortem|autopsy)/.test(`${r?.body_status || ""} ${r?.admission_status || ""}`.toLowerCase())
  );
};
const pmCompletedSignal = (r) => {
  const pm = r?.postmortem || null;
  return (
    r?.postmortem_completed === true ||
    r?.postmortem_completed === 1 ||
    /^(completed|complete|done)$/i.test(String(pm?.status || "")) ||
    Boolean(pm?.completed_at || pm?.completion_date) ||
    /done|complete/i.test(String(r?.postmortem_report || ""))
  );
};

const admNoOf = (r) =>
  String(r?.admission_number || r?.admission_no || r?.deceased_id || (r?.id ? `DC-${r.id}` : "") || "");
const nameOf = (r) => r?.full_name || r?.name_of_deceased || r?.deceased_name || "Unknown";
const branchOf = (r) => r?.branch_name || r?.branch || "Main Branch";
const admKeyOf = (r) => keyOf(r?.date_key || r?.adm_date || r?.date_admitted || r?.created_at);
const admTimeOf = (r) => timeOf(r?.time_key || r?.time_admitted || r?.adm_time || r?.created_at);

const pmFromRequest = (q) => {
  if (!q) return null;
  const requestStatus = String(q?.status || "").toLowerCase();
  const examStatus = String(q?.exam_status || q?.examStatus || "").toLowerCase();
  const statusText = `${examStatus} ${requestStatus}`;
  const state = /complete|done|report/.test(statusText) || q?.exam_completed_at || q?.completed_at
    ? "completed"
    : /progress|pending|exam|acknowledge|sent/.test(statusText)
      ? "in-progress"
      : "requested";
  return {
    reqDate: keyOf(q?.created_at || q?.requested_at || q?.scheduled_date || q?.request_date),
    reqTime: timeOf(q?.scheduled_time || q?.requested_time || q?.created_at || q?.requested_at) || "09:00",
    authority: q?.requesting_authority || q?.requested_by || q?.reason || "—",
    state,
    doneDate: keyOf(q?.exam_completed_at || q?.completed_at || q?.completion_date),
    doneTime: timeOf(q?.exam_completed_at || q?.completed_at || q?.completion_date),
    pathologist: q?.pathologist || q?.exam_pathologist || q?.pathologist_name || q?.requested_by || "—",
    ref: q?.request_ref || q?.id || "",
    raw: q,
  };
};

const pmFromRegister = (r) => {
  if (!pmRequestedSignal(r)) return null;
  const completed = pmCompletedSignal(r);
  return {
    reqDate: keyOf(r?.postmortem?.requested_at || r?.postmortem_date || r?.date_admitted || r?.created_at),
    reqTime: timeOf(r?.postmortem?.requested_time || r?.postmortem?.requested_at || r?.created_at) || "09:00",
    authority: r?.postmortem?.requesting_authority || "—",
    state: completed ? "completed" : "requested",
    doneDate: completed ? keyOf(r?.postmortem?.completed_at || r?.postmortem_date) : null,
    doneTime: completed ? timeOf(r?.postmortem?.completed_at || r?.postmortem_date) : "",
    pathologist: r?.postmortem?.pathologist || r?.postmortem?.pathologist_name || "—",
    ref: "",
    raw: r?.postmortem || null,
  };
};

const releaseFromFeed = (q) => {
  if (!q) return null;
  const date = keyOf(q?.date_of_removal || q?.release_date || q?.date_released || q?.created_at);
  const dest = q?.final_destination || q?.destination || q?.release_to || q?.next_kin || "—";
  return {
    date,
    time: timeOf(q?.time_of_removal || q?.created_at) || "—",
    dest,
    mode: q?.mode_of_transport || "—",
    receiver: q?.received_by || q?.next_kin || "—",
    status: date && date > todayKey() ? "scheduled" : "completed",
    transfer: /transfer|inter-branch/i.test(String(dest)),
    raw: q,
  };
};

const releaseFromRegister = (r) => {
  if (!releasedSignal(r)) return null;
  const date = keyOf(r?.dispatch_date || r?.release_date || r?.date_released);
  return {
    date,
    time: "—",
    dest: r?.final_destination || r?.destination || "—",
    mode: "—",
    receiver: r?.next_kin || r?.contact_person || "—",
    status: date && date > todayKey() ? "scheduled" : "completed",
    transfer: /transfer|inter-branch/i.test(String(r?.final_destination || "")),
    raw: r,
  };
};

/** One deceased-register row → a dashboard case. */
function mapDeceased(r) {
  const body = String(r?.body_status || "").toLowerCase();
  return {
    adm: admNoOf(r),
    name: nameOf(r),
    sex: r?.gender || r?.sex || "",
    dob: keyOf(r?.date_of_birth || r?.dob),
    dod: keyOf(r?.date_of_death || r?.dod),
    branch: branchOf(r),
    admDate: admKeyOf(r),
    admTime: admTimeOf(r) || "00:00",
    receivedFrom: r?.received_from || r?.referral_source || "—",
    officer: r?.receiving_officer || r?.received_by || "—",
    cause: r?.cause_of_death || "Undetermined",
    place: r?.place_of_death || "—",
    permit: r?.permit_number || "—",
    prepared: Boolean(r?.prepared || r?.embalmed) || /embalm|prepared/.test(body),
    pm: null,
    release: null,
    nok: {
      name: r?.next_kin || r?.contact_person || r?.kin_name || "—",
      rel: r?.relationship || r?.kin_relationship || "—",
      phone: r?.kin_telephone || r?.kin_phone || r?.phone_number || "—",
      id: r?.kin_id_number || r?.national_id || "—",
    },
    notes: r?.notes || r?.remarks || "",
    raw: r,
  };
}

/** One body-release feed row → a case (used when the register row is missing,
 *  e.g. a handover recorded for a case outside the fetched register pages). */
function mapReleaseRow(q) {
  return {
    adm: String(q?.admission_number || q?.admission_no || ""),
    name: nameOf(q),
    sex: q?.gender || "",
    dob: keyOf(q?.date_of_birth),
    dod: keyOf(q?.date_of_death),
    branch: branchOf(q),
    admDate: keyOf(q?.date_admitted || q?.created_at),
    admTime: timeOf(q?.created_at) || "00:00",
    receivedFrom: q?.received_from || "—",
    officer: q?.staff_name || q?.received_by || "—",
    cause: q?.cause_of_death || "—",
    place: q?.place_of_death || "—",
    permit: q?.permit_number || "—",
    prepared: true,
    pm: null,
    release: releaseFromFeed(q),
    nok: {
      name: q?.next_kin || "—",
      rel: q?.relationship || "—",
      phone: q?.kin_phone || q?.phone_number || "—",
      id: q?.kin_id_number || "—",
    },
    notes: "",
    raw: q,
  };
}

/**
 * Merge the three feeds into one case list.
 *
 * The deceased register is the spine; release and postmortem feed rows are
 * attached by admission number. A feed row with no matching register row still
 * becomes a visible case, so a handover or a request never disappears just
 * because its register page was not fetched.
 */
export function buildCases(deceasedRows = [], releaseRows = [], pmRows = []) {
  const byAdm = new Map();
  const order = [];

  const put = (adm, c) => {
    if (!adm) return null;
    if (!byAdm.has(adm)) {
      byAdm.set(adm, c);
      order.push(adm);
    }
    return byAdm.get(adm);
  };

  deceasedRows.forEach((r) => put(admNoOf(r), mapDeceased(r)));

  releaseRows.forEach((q, i) => {
    const adm = String(q?.admission_number || q?.admission_no || "");
    const rel = releaseFromFeed(q);
    const existing = adm ? byAdm.get(adm) : null;
    if (existing) existing.release = rel;
    else put(adm || `REL-${q?.release_id || q?.id || i}`, mapReleaseRow(q));
  });

  pmRows.forEach((q) => {
    const adm = String(q?.admission_number || q?.admission_no || q?.deceased_id || "");
    if (!adm) return;
    const pm = pmFromRequest(q);
    const existing = byAdm.get(adm);
    if (existing) {
      existing.pm = pm;
      return;
    }
    const created = put(adm, {
      adm,
      name: nameOf(q),
      sex: "",
      dob: null,
      dod: keyOf(q?.date_of_death),
      branch: branchOf(q),
      admDate: keyOf(q?.date_admitted),
      admTime: "00:00",
      receivedFrom: "—",
      officer: q?.requested_by || "—",
      cause: q?.reason || "—",
      place: "—",
      permit: "—",
      prepared: true,
      pm,
      release: null,
      nok: { name: "—", rel: "—", phone: "—", id: "—" },
      notes: "",
      raw: q,
    });
    return created;
  });

  /* register-only rows still carry enough signal for a derived release / pm */
  byAdm.forEach((c) => {
    if (!c.release) c.release = releaseFromRegister(c.raw);
    if (!c.pm) c.pm = pmFromRegister(c.raw);
  });

  return order.map((k) => byAdm.get(k)).filter((c) => c && (c.adm || c.name !== "Unknown"));
}

/** True when a case has a completed postmortem, including legacy/raw API shapes. */
export const pmCompleted = (p) => {
  const pm = p?.pm;
  if (!pm) return false;
  const rawStatus = [
    pm.raw?.exam_status,
    pm.raw?.status,
    pm.raw?.postmortem?.status,
  ].filter(Boolean).join(" ");
  return pm.state === "completed"
    || Boolean(pm.doneDate)
    || /(^|\b)(completed|complete|done)(\b|$)/i.test(rawStatus);
};

/* ── derived case state ─────────────────────────────────────────────────── */

/** in-care · pm-req · pm-done · released · transferred */
export function careOf(p) {
  if (p.release && p.release.status === "completed") return p.release.transfer ? "transferred" : "released";
  if (p.pm) return pmCompleted(p) ? "pm-done" : "pm-req";
  return "in-care";
}
export const isReleased = (p) => {
  const c = careOf(p);
  return c === "released" || c === "transferred";
};

/** Days held so far (null for a future-dated admission). */
export function daysInCare(p) {
  const today = todayKey();
  if (!p.admDate || p.admDate > today) return null;
  const end = p.release && p.release.status === "completed" && p.release.date ? p.release.date : today;
  return Math.max(0, daysBetween(p.admDate, end));
}

/** Status chip config — future-dated admissions show as "Scheduled". */
export const careCfg = (p) => (p.admDate && p.admDate > todayKey() ? SCHED : CARE[careOf(p)]);

/* ── search ─────────────────────────────────────────────────────────────── */
export function searchMatch(p, q) {
  const needle = String(q || "").trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    p.name, p.adm, p.cause, p.branch, p.officer,
    p.nok?.name, p.nok?.phone, p.receivedFrom, p.place, p.permit,
    p.release?.dest, p.release?.receiver,
    p.pm?.authority, p.pm?.pathologist,
  ];
  return hay.join(" ").toLowerCase().includes(needle);
}

/* ── section pills (sidebar filters) ────────────────────────────────────── */
export function pillsFor(section) {
  if (section === "pm") {
    return [
      ["pm-req", "Requested", "var(--orange)"],
      ["pm-prog", "In Progress", "var(--blue)"],
      ["pm-done", "Completed", "var(--plum)"],
    ];
  }
  if (section === "release") {
    return [
      ["released", "Released", "var(--teal)"],
      ["transferred", "Transferred", "var(--gray)"],
      ["scheduled", "Scheduled", "var(--gray)"],
    ];
  }
  return [
    ["in-care", "In Care", "var(--blue)"],
    ["pm-req", "PM Requested", "var(--orange)"],
    ["pm-done", "PM Done", "var(--plum)"],
    ["released", "Released", "var(--teal)"],
    ["transferred", "Transferred", "var(--gray)"],
    ["scheduled", "Scheduled", "var(--gray)"],
  ];
}

export function matchPill(p, section, key) {
  if (section === "pm") {
    if (!p.pm) return false;
    if (key === "pm-req") return p.pm.state === "requested";
    if (key === "pm-prog") return p.pm.state === "in-progress";
    return p.pm.state === "completed";
  }
  if (section === "release") {
    if (!p.release) return false;
    if (key === "scheduled") return p.release.status === "scheduled";
    return careOf(p) === key;
  }
  if (key === "scheduled") return Boolean(p.admDate && p.admDate > todayKey());
  return careOf(p) === key;
}

/** The records a section lists before pills are applied. */
export function baseList(section, people) {
  if (section === "release") return people.filter((p) => p.release);
  if (section === "pm") return people.filter((p) => p.pm);
  return people.slice();
}

export function applyFilters(list, section, filters) {
  if (!filters.length) return list;
  return list.filter((p) => filters.some((k) => matchPill(p, section, k)));
}

/* ── events ─────────────────────────────────────────────────────────────── */
/** The date on which a postmortem operation should appear. Completed exams
 * belong on their completion date; open requests remain on their request date. */
export function pmEventOf(p) {
  if (!p?.pm) return null;
  const completed = p.pm.state === "completed" && p.pm.doneDate;
  const date = completed ? p.pm.doneDate : p.pm.reqDate;
  if (!date) return null;
  return {
    p,
    t: "pm",
    time: (completed ? p.pm.doneTime : p.pm.reqTime) || "09:00",
    date,
    completed: Boolean(completed),
  };
}

/** Every operation (intake · release · postmortem) across a case list. */
export function eventsOf(people) {
  const evs = [];
  people.forEach((p) => {
    if (p.admDate) evs.push({ p, t: "intake", time: p.admTime || "00:00", date: p.admDate });
    const pmEvent = pmEventOf(p);
    if (pmEvent) evs.push(pmEvent);
    if (p.release && p.release.date) {
      evs.push({ p, t: "release", time: p.release.time || "09:00", date: p.release.date });
    }
  });
  return evs;
}

export function periodRange(view, selDate) {
  if (view === "day") return { s: selDate, e: selDate };
  if (view === "week") {
    const ws = weekStartOf(selDate);
    return { s: ws, e: addDays(ws, 6) };
  }
  const d = parseKey(selDate);
  return { s: toKey(new Date(d.getFullYear(), d.getMonth(), 1)), e: toKey(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
}

/* ── day bands ──────────────────────────────────────────────────────────── */
export const BANDS = [
  { id: "morn", label: "Morning", icon: "sun", c: "var(--orange)" },
  { id: "aft", label: "Afternoon", icon: "sunset", c: "var(--blue)" },
  { id: "eve", label: "Evening", icon: "moon", c: "var(--plum)" },
];
export const bandOf = (time) => {
  if (time >= "05:00" && time <= "11:59") return BANDS[0];
  if (time >= "12:00" && time <= "16:59") return BANDS[1];
  return BANDS[2];
};

/* ── register sorting ───────────────────────────────────────────────────── */
export function sortRegisters(list, section, sort) {
  const dir = sort.d;
  return list.slice().sort((a, b) => {
    if (sort.f === "name") return dir * a.name.localeCompare(b.name);
    if (sort.f === "status") return dir * careOf(a).localeCompare(careOf(b));
    const ka = section === "release"
      ? `${a.release?.date || ""}${a.release?.time || ""}`
      : section === "pm"
        ? `${a.pm?.reqDate || ""}${a.pm?.reqTime || ""}`
        : `${a.admDate || ""}${a.admTime || ""}`;
    const kb = section === "release"
      ? `${b.release?.date || ""}${b.release?.time || ""}`
      : section === "pm"
        ? `${b.pm?.reqDate || ""}${b.pm?.reqTime || ""}`
        : `${b.admDate || ""}${b.admTime || ""}`;
    return dir * ka.localeCompare(kb);
  });
}

/* ── analytics aggregates ───────────────────────────────────────────────── */

/** Age used by the distribution + the age modal (date of death, else admission). */
export const ageFor = (p) => ageAt(p.dob, p.dod || p.admDate);

/**
 * Every derived figure the dashboard shows.
 *
 * @param scoped   branch-scoped cases (drives the care split + month intake)
 * @param searched `scoped` narrowed by the search box (drives every chart)
 * @param calM     sidebar month index (0-11)
 * @param calY     sidebar year
 */
export function calcStats(scoped, searched, calM, calY) {
  const care = { inCare: 0, pmReq: 0, pmDone: 0, released: 0 };
  scoped.forEach((p) => {
    const c = careOf(p);
    if (c === "in-care") care.inCare += 1;
    else if (c === "pm-req") care.pmReq += 1;
    else if (c === "pm-done") care.pmDone += 1;
    else care.released += 1;
  });

  const monthKey = `${calY}-${pad(calM + 1)}`;
  const monthIntakes = scoped.filter((p) => String(p.admDate || "").startsWith(monthKey)).length;

  const today = todayKey();

  /* last 7 days — intake vs completed releases */
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    last7.push({
      key: d,
      dow: DOWS[parseKey(d).getDay()],
      adm: searched.filter((p) => p.admDate === d).length,
      rel: searched.filter((p) => p.release?.status === "completed" && p.release.date === d).length,
    });
  }

  /* full-year trend — January to December of the year on screen */
  const flow = [];
  for (let mi = 0; mi < 12; mi++) {
    const mk = `${calY}-${pad(mi + 1)}`;
    flow.push({
      key: mk,
      label: MOS[mi],
      adm: searched.filter((p) => String(p.admDate || "").startsWith(mk)).length,
      rel: searched.filter(
        (p) => p.release?.status === "completed" && String(p.release.date || "").startsWith(mk)
      ).length,
    });
  }

  /* admission → release turnaround */
  const stays = searched.filter(isReleased).map(daysInCare).filter((n) => n != null);
  const avgStay = stays.length ? Math.round(stays.reduce((a, b) => a + b, 0) / stays.length) : 0;
  const sorted = stays.slice().sort((a, b) => a - b);
  const medianStay = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;

  /* postmortem workload */
  const pmAll = searched.filter((p) => p.pm);
  const pmDone = pmAll.filter(pmCompleted).length;
  const pmRate = pmAll.length ? Math.round((pmDone / pmAll.length) * 100) : 0;

  /* load by branch (derived from the data, busiest first) */
  const branchNames = [];
  searched.forEach((p) => {
    if (p.branch && !branchNames.includes(p.branch)) branchNames.push(p.branch);
  });
  const bmix = branchNames
    .map((b) => ({ b, n: searched.filter((p) => p.branch === b).length }))
    .sort((a, b) => b.n - a.n);

  /* caseload by officer + pathologist */
  const staffMap = {};
  searched.forEach((p) => {
    if (p.officer && p.officer !== "—") staffMap[p.officer] = (staffMap[p.officer] || 0) + 1;
    const path = p.pm?.pathologist;
    if (path && path !== "—") staffMap[path] = (staffMap[path] || 0) + 1;
  });
  const staff = Object.keys(staffMap).map((k) => [k, staffMap[k]]).sort((a, b) => b[1] - a[1]);

  /* age at death brackets */
  const buckets = [["<50", 0], ["50s", 0], ["60s", 0], ["70s", 0], ["80s", 0], ["90+", 0]];
  searched.forEach((p) => {
    const a = ageFor(p);
    if (a == null) return;
    const idx = a < 50 ? 0 : a < 60 ? 1 : a < 70 ? 2 : a < 80 ? 3 : a < 90 ? 4 : 5;
    buckets[idx][1] += 1;
  });

  /* storage fees still accruing on every body held */
  const accrual = searched
    .filter((p) => {
      const c = careOf(p);
      return c !== "released" && c !== "transferred" && p.admDate && p.admDate <= today;
    })
    .reduce((sum, p) => sum + (daysInCare(p) || 0) * STORAGE_FEE_PER_DAY, 0);

  /* busiest weekday + busiest month */
  const dowCount = {};
  searched.forEach((p) => {
    if (!p.admDate) return;
    const w = parseKey(p.admDate).getDay();
    dowCount[w] = (dowCount[w] || 0) + 1;
  });
  let peakDow = null;
  Object.keys(dowCount).forEach((k) => {
    if (peakDow == null || dowCount[k] > dowCount[peakDow]) peakDow = k;
  });
  const peakM = flow.slice().sort((a, b) => b.adm - a.adm)[0];
  const yearTotal = flow.reduce((s, f) => s + f.adm, 0);
  const yearRel = flow.reduce((s, f) => s + f.rel, 0);

  /* insights — strings render as text, { b } segments render bold */
  const insights = [];
  if (peakDow != null) {
    insights.push([
      "Peak admissions fall on ", { b: DOWF[Number(peakDow)] }, ` — ${dowCount[peakDow]} cases this period.`,
    ]);
  }
  if (peakM && peakM.adm > 0) {
    insights.push(["Busiest intake month so far: ", { b: peakM.label }, ` with ${peakM.adm} intakes.`]);
  }
  insights.push([
    "Full-year trend: ", { b: `${yearTotal} intakes` }, " vs ", { b: `${yearRel} releases` },
    ` across January–December ${calY}.`,
  ]);
  insights.push(["Postmortem completion at ", { b: `${pmRate}%` }, ` across ${pmAll.length} requests.`]);
  insights.push(["Median admit-to-release turnaround: ", { b: `${medianStay} days` }, ` (avg ${avgStay}).`]);

  return {
    care,
    monthIntakes,
    last7,
    flow,
    yearTotal,
    yearRel,
    avgStay,
    medianStay,
    pmAll,
    pmDone,
    pmRate,
    bmix,
    staff,
    buckets,
    accrual,
    insights,
    total: searched.length,
    inCare: care.inCare + care.pmReq + care.pmDone,
    scopedCount: scoped.length,
  };
}

/* ── shared label helpers ───────────────────────────────────────────────── */

/** One-line status description used by the analytics modal rows. */
export function statusMeta(p) {
  const c = careOf(p);
  if (p.admDate && p.admDate > todayKey()) return `Scheduled ${fmtDate(p.admDate)} ${p.admTime}`;
  if (c === "released" || c === "transferred") {
    return `Released ${fmtDate(p.release?.date)} → ${String(p.release?.dest || "").slice(0, 34)}`;
  }
  const d = daysInCare(p);
  return d == null ? "In care" : `${d} days in care`;
}

/** Age-bracket key used by the distribution chart and its drill-down modal. */
export function ageBucketOf(age) {
  if (age == null) return null;
  return age < 50 ? "<50" : age < 60 ? "50s" : age < 70 ? "60s" : age < 80 ? "70s" : age < 90 ? "80s" : "90+";
}
