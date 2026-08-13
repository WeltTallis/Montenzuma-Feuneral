/* ============================================================================
   data.js — deterministic, date-seeded data generator for the dashboard.
   Framework-agnostic: produces plain objects; panels style them.
   ============================================================================ */

export const BRANCHES = [
  { id: "nairobi", name: "Nairobi", town: "Lang'ata", capacity: 60 },
  { id: "machakos", name: "Machakos", town: "Mumbuni", capacity: 32 },
  { id: "thika", name: "Thika", town: "Section 9", capacity: 28 },
];

export const BRANCH_COLOR = {
  nairobi: "var(--d-branch-nairobi)",
  machakos: "var(--d-branch-machakos)",
  thika: "var(--d-branch-thika)",
};
export const BRANCH_NAME = { nairobi: "Nairobi", machakos: "Machakos", thika: "Thika" };

export const EVENT_META = {
  intake: { label: "Deceased Intake", short: "Intake", color: "var(--d-ev-intake)" },
  release: { label: "Deceased Release", short: "Release", color: "var(--d-ev-release)" },
  hearse: { label: "Hearse Booking", short: "Hearse", color: "var(--d-ev-hearse)" },
  coffin: { label: "Coffin / Casket", short: "Coffin", color: "var(--d-ev-coffin)" },
  flowers: { label: "Floral Order", short: "Flowers", color: "var(--d-ev-flowers)" },
  service: { label: "Chapel Service", short: "Service", color: "var(--d-ev-service)" },
};

export const HEARSE_FLEET = [
  { id: "KDA-220H", label: "Mercedes Hearse KDA 220H" },
  { id: "KCX-455F", label: "Toyota Fleet KCX 455F" },
  { id: "KDG-901L", label: "Premium Limo KDG 901L" },
  { id: "KBS-118E", label: "Escort Convoy KBS 118E" },
];

export const CHAPELS = {
  nairobi: [{ id: "nrb-chapel-a", label: "Nairobi Chapel A" }, { id: "nrb-chapel-b", label: "Nairobi Chapel B" }],
  machakos: [{ id: "mks-chapel", label: "Machakos Memorial Hall" }],
  thika: [{ id: "tka-chapel", label: "Thika Chapel" }],
};

export const COFFIN_MODELS = [
  { sku: "MHG-01", label: "Mahogany Premier", stock: 3 },
  { sku: "OAK-02", label: "Oak Classic", stock: 4 },
  { sku: "BRZ-03", label: "Bronze-Handle Elite", stock: 2 },
  { sku: "PIN-04", label: "Pine Standard", stock: 8 },
  { sku: "CDR-05", label: "Cedar Heritage", stock: 3 },
];

export const DRIVERS = [
  { id: "d1", name: "Peter Kamau", phone: "0722 118 204" },
  { id: "d2", name: "James Otieno", phone: "0733 540 991" },
  { id: "d3", name: "Samuel Mwangi", phone: "0721 663 015" },
  { id: "d4", name: "Daniel Kiptoo", phone: "0710 872 336" },
  { id: "d5", name: "Joseph Wafula", phone: "0759 204 118" },
  { id: "d6", name: "Michael Onyango", phone: "0700 345 782" },
];

const EVENT_TYPES = ["intake", "release", "hearse", "coffin", "flowers", "service"];

/* ---- deterministic RNG (seeded by calendar date) ---- */
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed) {
  seed |= 0;
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

const FIRST_NAMES = ["Wanjiku", "Otieno", "Mutua", "Achieng", "Kamau", "Njeri", "Kiptoo", "Wafula", "Muthoni", "Omondi", "Chebet", "Barasa", "Nyambura", "Kariuki", "Adhiambo", "Mwangi", "Auma", "Kibet", "Wangari", "Onyango", "Mumbi", "Kipchoge", "Naliaka"];
const LAST_NAMES = ["Kimani", "Ochieng", "Mwende", "Odhiambo", "Githongo", "Cheruiyot", "Simiyu", "Karanja", "Awuor", "Rono", "Mbugua", "Wekesa", "Njoroge", "Atieno", "Koech"];
function personName(rng) { return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`; }

export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fmtTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${period}`;
}

/** translucent tint of a CSS color token — used for chip backgrounds. */
export function tint(colorVar, pct = 12) {
  return `color-mix(in srgb, ${colorVar} ${pct}%, transparent)`;
}
/* ---- FuneralEvent generation (one operation slice per branch/day) ---- */
export function getEventsForDate(date) {
  const key = dateKey(date);
  const events = [];
  const dow = date.getDay();
  const weekendBoost = dow === 0 || dow === 6 ? 1.4 : 1;
  const slotChoices = [8 * 60, 9 * 60, 11 * 60, 13 * 60, 14 * 60];

  for (const branch of BRANCHES) {
    const rng = mulberry32(hashSeed(key + branch.id));
    const base = branch.id === "nairobi" ? 9 : branch.id === "machakos" ? 5 : 4;
    const count = Math.round((base + rng() * 5) * weekendBoost);

    for (let i = 0; i < count; i++) {
      const type = pick(rng, EVENT_TYPES);
      const minutes = 7 * 60 + Math.floor(rng() * 11 * 60);
      const durationMin = type === "intake" || type === "release" ? 45 : type === "service" ? 90 : 30;
      const name = personName(rng);
      const num = 100 + Math.floor(rng() * 900);
      const ref = `UMJ-${branch.id.slice(0, 3).toUpperCase()}-${num}`;
      let detail = "";
      let status = "Scheduled";
      let amountKes;
      let resource;
      let resourceLabel;

      switch (type) {
        case "intake":
          detail = `${name} · arrived via ${pick(rng, ["Kenyatta NHIF", "Mama Lucy Hosp", "Lang'ata Mortuary"])}`;
          status = rng() > 0.4 ? "In progress" : "Scheduled";
          break;
        case "release":
          detail = `${name} · releasing to ${pick(rng, ["Langata Cemetery", "Holy Cross Burial", "Nairobi Memorial Park"])}`;
          status = rng() > 0.3 ? "Completed" : "Ongoing";
          amountKes = 8000 + Math.floor(rng() * 25000);
          break;
        case "hearse": {
          const h = pick(rng, HEARSE_FLEET);
          detail = `Hearse booked · ${h.label}`;
          resource = `hearse:${h.id}`;
          resourceLabel = h.label;
          amountKes = 15000 + Math.floor(rng() * 45000);
          break;
        }
        case "coffin": {
          const c = pick(rng, COFFIN_MODELS);
          detail = `Coffin order · ${c.label}`;
          resource = `coffin:${c.sku}`;
          resourceLabel = c.label;
          amountKes = 25000 + Math.floor(rng() * 120000);
          break;
        }
        case "flowers":
          detail = `Floral order · ${pick(rng, ["White lilies wreath", "Rose casket spray", "Orchid arrangement", "Sympathy bouquet"])}`;
          amountKes = 3000 + Math.floor(rng() * 22000);
          break;
        case "service": {
          const ch = pick(rng, CHAPELS[branch.id]);
          detail = `Service booked · ${ch.label}`;
          resource = `chapel:${ch.id}`;
          resourceLabel = ch.label;
          amountKes = 20000 + Math.floor(rng() * 80000);
          break;
        }
      }

      // Force overlaps on busy shared slots so conflicts surface naturally.
      let eventMinutes = minutes;
      if (resource && rng() > 0.68) eventMinutes = pick(rng, slotChoices);

      events.push({
        id: `${key}-${branch.id}-${i}`,
        type,
        branch: branch.id,
        minutes: eventMinutes,
        time: fmtTime(eventMinutes),
        durationMin,
        deceasedName: name,
        ref,
        detail,
        status,
        amountKes,
        resource,
        resourceLabel,
      });
    }
  }

  events.sort((a, b) => a.minutes - b.minutes);
  return events;
}
/* ---- Summary / week / register helpers ---- */
export function getDaySummary(events) {
  const counts = {};
  const byBranch = {};
  events.forEach((e) => {
    counts[e.type] = (counts[e.type] || 0) + 1;
    byBranch[e.branch] = (byBranch[e.branch] || 0) + 1;
  });
  return {
    counts,
    byBranch,
    total: events.length,
    services: events.filter((e) => e.type === "hearse" || e.type === "coffin" || e.type === "flowers" || e.type === "service").length,
  };
}

export function getWeek(date) {
  const today = new Date();
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  const cells = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const evs = getEventsForDate(d);
    cells.push({
      key: dateKey(d),
      date: d,
      label: d.toLocaleDateString("en-KE", { weekday: "short" }),
      dayNum: d.getDate(),
      isToday: dateKey(d) === dateKey(today),
      summary: getDaySummary(evs),
      conflicts: detectConflicts(evs).length,
    });
  }
  return cells;
}

export function getDeceasedRegister(date) {
  const evs = getEventsForDate(date).filter((e) => e.type === "intake" || e.type === "release");
  const rng = mulberry32(hashSeed(dateKey(date) + "register"));
  return evs.map((e, i) => ({
    id: `DC-${String(100 + i).padStart(4, "0")}`,
    name: e.deceasedName,
    age: 32 + Math.floor(rng() * 58),
    branch: e.branch,
    ref: e.ref,
    locker: `L-${e.branch.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(2, "0")}`,
    status: e.type === "intake" ? "in-care" : "released",
    intakeTime: e.time,
    releaseTime: e.type === "release" ? e.time : null,
    nextOfKin: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)} — family`,
  }));
}
/* ---- Conflict detection (shared resources overlapping in time) ---- */
function resourceKind(type) {
  if (type === "hearse") return "hearse";
  if (type === "service") return "chapel";
  if (type === "coffin") return "coffin";
  return "hearse";
}

export function detectConflicts(events) {
  const byResource = {};
  events.forEach((e) => {
    if (!e.resource) return;
    if (!byResource[e.resource]) byResource[e.resource] = [];
    byResource[e.resource].push(e);
  });

  const conflicts = [];
  let ci = 0;
  Object.keys(byResource).forEach((res) => {
    const evs = byResource[res].slice().sort((a, b) => a.minutes - b.minutes);
    for (let i = 0; i < evs.length; i++) {
      for (let j = i + 1; j < evs.length; j++) {
        const a = evs[i], b = evs[j];
        const aEnd = a.minutes + a.durationMin;
        const overlaps = a.minutes < b.minutes + b.durationMin && b.minutes < aEnd;
        if (!overlaps) break;
        const branches = [...new Set([a.branch, b.branch])];
        const crossBranch = branches.length > 1;
        const kind = resourceKind(a.type);
        conflicts.push({
          id: `c-${ci++}`,
          kind,
          severity: crossBranch ? "critical" : "warning",
          title: `${EVENT_META[a.type].short} conflict on ${a.resourceLabel || res}`,
          detail: `${a.deceasedName} (${BRANCH_NAME[a.branch]}) and ${b.deceasedName} (${BRANCH_NAME[b.branch]}) overlap for the same ${EVENT_META[a.type].short.toLowerCase()}.`,
          resourceLabel: a.resourceLabel || res,
          branches,
          crossBranch,
          events: [a, b],
          time: fmtTime(Math.max(a.minutes, b.minutes)),
        });
      }
    }
  });
  return conflicts;
}

/* ---- Chart helpers ---- */
export function getBranchBreakdown(events) {
  const byBranch = {};
  BRANCHES.forEach((b) => { byBranch[b.id] = { branch: b.name, intake: 0, release: 0, hearse: 0, coffin: 0, flowers: 0, service: 0 }; });
  events.forEach((e) => {
    if (!byBranch[e.branch]) byBranch[e.branch] = { branch: e.branch, intake: 0, release: 0, hearse: 0, coffin: 0, flowers: 0, service: 0 };
    byBranch[e.branch][e.type] = (byBranch[e.branch][e.type] || 0) + 1;
  });
  return Object.values(byBranch);
}

export function getServiceDistribution(events) {
  const serviceTypes = ["hearse", "coffin", "flowers", "service"];
  const colors = { hearse: "var(--d-ev-hearse)", coffin: "var(--d-ev-coffin)", flowers: "var(--d-ev-flowers)", service: "var(--d-ev-service)" };
  return serviceTypes.map((t) => ({
    type: t,
    label: EVENT_META[t].short,
    value: events.filter((e) => e.type === t).length,
    fill: colors[t],
  }));
}

export function getWeekTrend(date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() - 6); // last 7 days incl. today
  const data = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const evs = getEventsForDate(d);
    data.push({
      day: d.toLocaleDateString("en-KE", { weekday: "short" }),
      bookings: evs.filter((e) => e.type === "service").length,
      intakes: evs.filter((e) => e.type === "intake").length,
      releases: evs.filter((e) => e.type === "release").length,
    });
  }
  return data;
}
/* ---- Live activity feed ---- */
let liveCounter = 0;
export function makeLiveActivity(now) {
  const rng = mulberry32(hashSeed(String(now) + String(liveCounter++)));
  const type = pick(rng, ["hearse", "coffin", "flowers", "service", "intake", "release"]);
  const branch = pick(rng, BRANCHES).id;
  const name = personName(rng);
  const num = 100 + Math.floor(rng() * 900);
  let detail = "";
  let resourceLabel;
  let amountKes;
  let clash = false;
  switch (type) {
    case "hearse": {
      const h = pick(rng, HEARSE_FLEET);
      detail = `Hearse booked · ${h.label}`;
      resourceLabel = h.label;
      amountKes = 15000 + Math.floor(rng() * 45000);
      clash = rng() > 0.55;
      break;
    }
    case "coffin": {
      const c = pick(rng, COFFIN_MODELS);
      detail = `Coffin order · ${c.label}`;
      resourceLabel = c.label;
      amountKes = 25000 + Math.floor(rng() * 120000);
      clash = rng() > 0.6;
      break;
    }
    case "flowers":
      detail = `Floral order · ${pick(rng, ["White lilies wreath", "Rose casket spray", "Orchid arrangement", "Sympathy bouquet"])}`;
      amountKes = 3000 + Math.floor(rng() * 22000);
      break;
    case "service": {
      const ch = pick(rng, CHAPELS[branch]);
      detail = `Service booked · ${ch.label}`;
      resourceLabel = ch.label;
      amountKes = 20000 + Math.floor(rng() * 80000);
      break;
    }
    case "intake":
      detail = `New deceased intake · ${name}`;
      break;
    case "release":
      detail = `Body released to family · ${name}`;
      amountKes = 8000 + Math.floor(rng() * 25000);
      break;
  }
  return {
    id: `live-${now}-${liveCounter}`,
    type,
    branch,
    deceasedName: name,
    ref: `UMJ-${branch.slice(0, 3).toUpperCase()}-${num}`,
    detail,
    resourceLabel,
    amountKes,
    at: now,
    clash,
  };
}

export function seedFeed(now) {
  const out = [];
  for (let i = 6; i >= 0; i--) out.push(makeLiveActivity(now - i * 9000 - i * 1234));
  return out.reverse();
}

export function formatKes(n) {
  return "KSh " + Number(n).toLocaleString("en-KE");
}

export function relativeTime(from, now) {
  const s = Math.max(0, Math.round((now - from) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

/* ============================================================================
   Hearse fleet + booking generation (FleetCommand panel)
   ============================================================================ */
export const FLOW_STAGES = ["assigned", "dispatched", "en-route", "on-site", "returning", "released"];
export const stageIndex = (s) => FLOW_STAGES.indexOf(s);

export const FLEET = [
  { id: "h1", plate: "KDA 220H", branch: "nairobi", driver: "Peter Kamau", fuel: 72, odometer: 182400, nextServiceKm: 2400, status: "in-transit", eta: "9 min", route: "Lang'ata → Holy Cross Cemetery" },
  { id: "h2", plate: "KCX 455F", branch: "nairobi", driver: "James Otieno", fuel: 55, odometer: 120610, nextServiceKm: 1200, status: "available", assignment: "On standby — Nairobi HQ" },
  { id: "h3", plate: "KDG 901L", branch: "machakos", driver: "Samuel Mwangi", fuel: 38, odometer: 96500, nextServiceKm: 0, status: "maintenance" },
  { id: "h4", plate: "KBS 118E", branch: "thika", driver: "Daniel Kiptoo", fuel: 81, odometer: 73300, nextServiceKm: 4100, status: "booked", assignment: "Thika — Section 9 funeral" },
  { id: "h5", plate: "KCN 640T", branch: "nairobi", driver: "Joseph Wafula", fuel: 18, odometer: 150230, nextServiceKm: 3000, status: "in-transit", eta: "4 min", route: "Nairobi City ➜ Langata Cemetery" },
  { id: "h6", plate: "KDF 772M", branch: "machakos", driver: "Michael Onyango", fuel: 64, odometer: 88750, nextServiceKm: 1900, status: "available", assignment: "On standby — Machakos" },
];

const FLEET_ROUTES = {
  nairobi: ["Lang'ata Mortuary", "Holy Cross Cemetery", "Forest Road Chapel", "Nairobi City Mortuary", "Kariokor"],
  machakos: ["Mumbuni", "Machakos Referral", "Shibuye Grounds", "Machakos Funeral Grounds"],
  thika: ["Section 9", "Thika Level 5", "Uhuru Grounds", "Del Monte"],
};

/** Deterministic hearse bookings around a given date (for the per-hearse calendar). */
export function generateHearseBookings(today, fleet = FLEET) {
  const key = dateKey(today);
  const d = new Date(today);
  // one shared RNG seed per month so dates stay stable within the month
  const monthSeed = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const bookings = [];
  let bi = 0;

  for (const h of fleet) {
    const rng = mulberry32(hashSeed(monthSeed + h.id));
    const branch = BRANCHES.find((b) => b.id === h.branch);
    const routes = FLEET_ROUTES[h.branch] || FLEET_ROUTES.nairobi;
    const count = 4 + Math.floor(rng() * 5); // 4..8 per hearse per month
    const used = new Set();

    for (let i = 0; i < count; i++) {
      // spread bookings across this month + a small spill into neighbours
      let dayOffset = Math.floor(rng() * 60) - 25; // -25..+34
      if (used.has(dayOffset)) dayOffset += 1;
      used.add(dayOffset);
      const dd = new Date(today);
      dd.setDate(today.getDate() + dayOffset);
      const bk = dateKey(dd);

      const startH = 8 + Math.floor(rng() * 10); // 08:00..17:00
      const endH = startH + 1 + Math.floor(rng() * 2);
      const stage =
        bk < key ? "released"
        : bk === key ? FLOW_STAGES[1 + Math.floor(rng() * 4)]
        : "assigned";

      const stageTimes = {};
      const times = { assigned: `${startH}:00`, dispatched: `${startH}:15`, "en-route": `${startH}:20`, "on-site": `${startH + 1}:00`, returning: `${startH + 2}:10`, released: `${endH}:00` };
      FLOW_STAGES.forEach((s) => {
        if (stageIndex(s) <= stageIndex(stage)) stageTimes[s] = times[s] || "—";
      });

      const from = pick(rng, routes);
      let to = pick(rng, routes);
      if (to === from) to = pick(rng, routes);
      bookings.push({
        id: `fb-${h.id}-${bi++}`,
        hearseId: h.id,
        date: bk,
        start: `${String(startH).padStart(2, "0")}:00`,
        end: `${String(endH).padStart(2, "0")}:00`,
        from,
        to,
        deceasedName: personName(rng),
        reference: `UMJ-H-${100 + Math.floor(rng() * 900)}`,
        stage,
        stageTimes,
        branch: h.branch,
      });
    }
  }
  return bookings;
}

export const HEARSE_STATUS = {
  "in-transit": { label: "In Transit" },
  booked: { label: "Booked" },
  available: { label: "Available" },
  maintenance: { label: "Maintenance" },
};


/* ============================================================================
   Calendar + analytics helpers (reference layout)
   ============================================================================ */
function startOfWeek(d) {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7; // Monday = 0
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

/** events across a 6-week window around `cursor`, tagged with `date` + `title`. */
export function getCalendarEvents(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first);
  const out = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dateKey(d);
    getEventsForDate(d).forEach((e) => out.push({
      ...e, date: key, title: EVENT_META[e.type].short,
    }));
  }
  return out;
}

/** branch utilization % for a date (events vs branch capacity). */
export function getBranchUtilization(date) {
  const evs = getEventsForDate(date);
  return BRANCHES.map((b) => {
    const count = evs.filter((e) => e.branch === b.id).length;
    const capacity = b.capacity || 30;
    return { branch: b.id, name: b.name, value: Math.min(100, Math.round((count / capacity) * 100)) };
  });
}

/** average fleet fuel %, optionally per branch. */
export function fleetFuelAvg(branchId) {
  const list = branchId ? FLEET.filter((h) => h.branch === branchId) : FLEET;
  if (!list.length) return 0;
  return Math.round(list.reduce((a, h) => a + h.fuel, 0) / list.length);
}

/** coffin stock summary with reorder flags. */
export function getCoffinInventory() {
  return COFFIN_MODELS.map((c) => ({
    sku: c.sku, label: c.label, stock: c.stock,
    low: c.stock <= 2, out: c.stock === 0,
  }));
}

