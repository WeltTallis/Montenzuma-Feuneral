export type BranchId = "nairobi" | "machakos" | "thika"

export type EventType = "intake" | "release" | "hearse" | "coffin" | "flowers" | "service"

export type CareStatus = "in-care" | "preparing" | "viewing" | "released"

export interface Branch {
    id: BranchId
    name: string
    town: string
    capacity: number
}

export interface FuneralEvent {
    id: string
    type: EventType
    branch: BranchId
    /** minutes from midnight (start) */
    minutes: number
    /** duration in minutes (for time-bound resources like hearse/service) */
    durationMin: number
    time: string
    deceasedName: string
    ref: string
    detail: string
    status: string
    amountKes?: number
    /** resource identifier for conflict detection (hearse plate, chapel id, coffin sku) */
    resource?: string
    resourceLabel?: string
}

export interface DeceasedRecord {
    id: string
    name: string
    age: number
    branch: BranchId
    ref: string
    locker: string
    status: CareStatus
    intakeMinutes: number
    intakeTime: string
    releaseTime?: string
    nextOfKin: string
}

export type ConflictKind = "hearse" | "chapel" | "coffin"

export interface Conflict {
    id: string
    kind: ConflictKind
    severity: "critical" | "warning"
    title: string
    detail: string
    resourceLabel: string
    branches: BranchId[]
    crossBranch: boolean
    events: FuneralEvent[]
    time: string
}

export const BRANCHES: Branch[] = [
    { id: "nairobi", name: "Nairobi", town: "Lang'ata", capacity: 60 },
    { id: "machakos", name: "Machakos", town: "Mumbuni", capacity: 32 },
    { id: "thika", name: "Thika", town: "Section 9", capacity: 28 },
]

export const EVENT_META: Record<
    EventType,
    { label: string; short: string; color: string }
> = {
    intake: { label: "Deceased Intake", short: "Intake", color: "var(--ev-intake)" },
    release: { label: "Deceased Release", short: "Release", color: "var(--ev-release)" },
    hearse: { label: "Hearse Booking", short: "Hearse", color: "var(--ev-hearse)" },
    coffin: { label: "Coffin / Casket", short: "Coffin", color: "var(--ev-coffin)" },
    flowers: { label: "Floral Order", short: "Flowers", color: "var(--ev-flowers)" },
    service: { label: "Chapel Service", short: "Service", color: "var(--ev-service)" },
}

export const BRANCH_COLOR: Record<BranchId, string> = {
    nairobi: "var(--branch-nairobi)",
    machakos: "var(--branch-machakos)",
    thika: "var(--branch-thika)",
}

export const BRANCH_NAME: Record<BranchId, string> = {
    nairobi: "Nairobi",
    machakos: "Machakos",
    thika: "Thika",
}

/* Shared fleet + resources — small enough that overlaps happen (creating conflicts) */
export const HEARSE_FLEET = [
    { id: "KDA-220H", label: "Mercedes Hearse KDA 220H" },
    { id: "KCX-455F", label: "Toyota Fleet KCX 455F" },
    { id: "KDG-901L", label: "Premium Limo KDG 901L" },
    { id: "KBS-118E", label: "Escort Convoy KBS 118E" },
]

export const CHAPELS: Record<BranchId, { id: string; label: string }[]> = {
    nairobi: [
        { id: "nrb-chapel-a", label: "Nairobi Chapel A" },
        { id: "nrb-chapel-b", label: "Nairobi Chapel B" },
    ],
    machakos: [{ id: "mks-chapel", label: "Machakos Memorial Hall" }],
    thika: [{ id: "tka-chapel", label: "Thika Chapel" }],
}

/* Coffin models drawn from a SHARED central warehouse — cross-branch demand collides */
export const COFFIN_MODELS = [
    { sku: "MHG-01", label: "Mahogany Premier", stock: 3 },
    { sku: "OAK-02", label: "Oak Classic", stock: 4 },
    { sku: "BRZ-03", label: "Bronze-Handle Elite", stock: 2 },
    { sku: "PIN-04", label: "Pine Standard", stock: 8 },
    { sku: "CDR-05", label: "Cedar Heritage", stock: 3 },
]

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random generator seeded by the calendar date  */
/* ------------------------------------------------------------------ */

function hashSeed(str: string): number {
    let h = 2166136261
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return h >>> 0
}

function mulberry32(seed: number) {
    return function () {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function dateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
    ).padStart(2, "0")}`
}

const FIRST_NAMES = [
    "Wanjiku", "Otieno", "Mutua", "Achieng", "Kamau", "Njeri", "Kiptoo", "Wafula",
    "Muthoni", "Omondi", "Chebet", "Barasa", "Nyambura", "Kariuki", "Adhiambo",
    "Mwangi", "Auma", "Kibet", "Wangari", "Onyango", "Mumbi", "Kipchoge", "Naliaka",
]
const LAST_NAMES = [
    "Kimani", "Ochieng", "Mwende", "Odhiambo", "Githongo", "Cheruiyot", "Simiyu",
    "Karanja", "Awuor", "Rono", "Mbugua", "Wekesa", "Njoroge", "Atieno", "Koech",
]

const FLOWER_KINDS = ["White lilies wreath", "Rose casket spray", "Chrysanthemum stand", "Orchid arrangement", "Sympathy bouquet"]

function pick<T>(rng: () => number, arr: T[]): T {
    return arr[Math.floor(rng() * arr.length)]
}

export function fmtTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    const period = h >= 12 ? "PM" : "AM"
    const hh = h % 12 === 0 ? 12 : h % 12
    return `${hh}:${String(m).padStart(2, "0")} ${period}`
}

const EVENT_TYPES: EventType[] = ["intake", "release", "hearse", "coffin", "flowers", "service"]

function personName(rng: () => number) {
    return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`
}

export function getEventsForDate(date: Date): FuneralEvent[] {
    const key = dateKey(date)
    const events: FuneralEvent[] = []

    for (const branch of BRANCHES) {
        const rng = mulberry32(hashSeed(key + branch.id))
        const dow = date.getDay()
        const weekendBoost = dow === 0 || dow === 6 ? 1.4 : 1
        const base = branch.id === "nairobi" ? 9 : branch.id === "machakos" ? 5 : 4
        const count = Math.round((base + rng() * 5) * weekendBoost)

        for (let i = 0; i < count; i++) {
            const type = pick(rng, EVENT_TYPES)
            const minutes = 7 * 60 + Math.floor(rng() * 11 * 60)
            const name = personName(rng)
            const num = 100 + Math.floor(rng() * 900)
            let detail = ""
            let status = "Scheduled"
            let amountKes: number | undefined
            let durationMin = 30
            let resource: string | undefined
            let resourceLabel: string | undefined

            switch (type) {
                case "intake":
                    detail = `Body received · Locker ${branch.id[0].toUpperCase()}-${num % 40}`
                    status = pick(rng, ["Awaiting prep", "In cold storage", "Documentation"])
                    durationMin = 20
                    break
                case "release":
                    detail = "Body released to family"
                    status = pick(rng, ["Cleared", "Pending permit", "Released"])
                    durationMin = 20
                    break
                case "hearse": {
                    const h = pick(rng, HEARSE_FLEET)
                    detail = h.label
                    resource = h.id
                    resourceLabel = h.label
                    status = pick(rng, ["Dispatched", "Scheduled", "En route"])
                    amountKes = 15000 + Math.floor(rng() * 45000)
                    durationMin = 90 + Math.floor(rng() * 60)
                    break
                }
                case "coffin": {
                    const c = pick(rng, COFFIN_MODELS)
                    detail = c.label
                    resource = c.sku
                    resourceLabel = c.label
                    status = pick(rng, ["Confirmed", "Fitting", "Delivered"])
                    amountKes = 25000 + Math.floor(rng() * 120000)
                    durationMin = 30
                    break
                }
                case "flowers":
                    detail = pick(rng, FLOWER_KINDS)
                    status = pick(rng, ["Confirmed", "Arranging", "Delivered"])
                    amountKes = 3000 + Math.floor(rng() * 22000)
                    durationMin = 30
                    break
                case "service": {
                    const ch = pick(rng, CHAPELS[branch.id])
                    detail = ch.label
                    resource = ch.id
                    resourceLabel = ch.label
                    status = pick(rng, ["Booked", "Setup", "Completed"])
                    amountKes = 20000 + Math.floor(rng() * 80000)
                    durationMin = 60 + Math.floor(rng() * 60)
                    break
                }
            }

            events.push({
                id: `${key}-${branch.id}-${i}`,
                type,
                branch: branch.id,
                minutes,
                durationMin,
                time: fmtTime(minutes),
                deceasedName: name,
                ref: `UMJ-${branch.id.slice(0, 3).toUpperCase()}-${num}`,
                detail,
                status,
                amountKes,
                resource,
                resourceLabel,
            })
        }
    }

    return events.sort((a, b) => a.minutes - b.minutes)
}

/* ------------------------------------------------------------------ */
/* Conflict detection                                                  */
/* ------------------------------------------------------------------ */

function overlaps(a: FuneralEvent, b: FuneralEvent): boolean {
    return a.minutes < b.minutes + b.durationMin && b.minutes < a.minutes + a.durationMin
}

export function detectConflicts(events: FuneralEvent[]): Conflict[] {
    const conflicts: Conflict[] = []

    // 1. Hearse fleet is SHARED across all branches → any overlap on the same
    //    vehicle is a conflict, and cross-branch overlaps are critical.
    const hearses = events.filter((e) => e.type === "hearse")
    for (const [id] of HEARSE_FLEET.map((h) => [h.id])) {
        const group = hearses.filter((e) => e.resource === id).sort((a, b) => a.minutes - b.minutes)
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                if (!overlaps(group[i], group[j])) continue
                const branches = Array.from(new Set([group[i].branch, group[j].branch]))
                const crossBranch = branches.length > 1
                conflicts.push({
                    id: `cf-hearse-${group[i].id}-${group[j].id}`,
                    kind: "hearse",
                    severity: crossBranch ? "critical" : "warning",
                    title: crossBranch ? "Hearse double-booked across branches" : "Hearse double-booked",
                    detail: `${group[i].resourceLabel} requested by ${branches.map((b) => BRANCH_NAME[b]).join(" & ")} at overlapping times.`,
                    resourceLabel: group[i].resourceLabel ?? "Hearse",
                    branches,
                    crossBranch,
                    events: [group[i], group[j]],
                    time: `${group[i].time} – ${group[j].time}`,
                })
            }
        }
    }

    // 2. Chapel/hall double-booking within a branch.
    const services = events.filter((e) => e.type === "service")
    const byChapel = new Map<string, FuneralEvent[]>()
    for (const s of services) {
        if (!s.resource) continue
        byChapel.set(s.resource, [...(byChapel.get(s.resource) ?? []), s])
    }
    for (const [, group] of byChapel) {
        const sorted = group.sort((a, b) => a.minutes - b.minutes)
        for (let i = 0; i < sorted.length; i++) {
            for (let j = i + 1; j < sorted.length; j++) {
                if (!overlaps(sorted[i], sorted[j])) continue
                conflicts.push({
                    id: `cf-chapel-${sorted[i].id}-${sorted[j].id}`,
                    kind: "chapel",
                    severity: "warning",
                    title: "Chapel slot overlap",
                    detail: `${sorted[i].resourceLabel} has two services booked at overlapping times.`,
                    resourceLabel: sorted[i].resourceLabel ?? "Chapel",
                    branches: [sorted[i].branch],
                    crossBranch: false,
                    events: [sorted[i], sorted[j]],
                    time: `${sorted[i].time} – ${sorted[j].time}`,
                })
            }
        }
    }

    // 3. Cross-branch coffin demand against SHARED warehouse stock.
    const coffins = events.filter((e) => e.type === "coffin")
    for (const model of COFFIN_MODELS) {
        const group = coffins.filter((e) => e.resource === model.sku)
        const branches = Array.from(new Set(group.map((e) => e.branch)))
        if (group.length > model.stock && branches.length > 1) {
            conflicts.push({
                id: `cf-coffin-${model.sku}`,
                kind: "coffin",
                severity: group.length - model.stock >= 2 ? "critical" : "warning",
                title: "Coffin stock shortage across branches",
                detail: `${group.length} orders for ${model.label} but only ${model.stock} in shared warehouse — ${branches.map((b) => BRANCH_NAME[b]).join(", ")} competing.`,
                resourceLabel: model.label,
                branches,
                crossBranch: true,
                events: group,
                time: `${group.length}/${model.stock} allocated`,
            })
        }
    }

    return conflicts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1))
}

/* ------------------------------------------------------------------ */
/* Summaries + aggregates                                              */
/* ------------------------------------------------------------------ */

export interface DaySummary {
    counts: Record<EventType, number>
    byBranch: Record<BranchId, number>
    revenueKes: number
    total: number
}

export function getDaySummary(events: FuneralEvent[]): DaySummary {
    const counts = { intake: 0, release: 0, hearse: 0, coffin: 0, flowers: 0, service: 0 } as Record<EventType, number>
    const byBranch = { nairobi: 0, machakos: 0, thika: 0 } as Record<BranchId, number>
    let revenueKes = 0
    for (const e of events) {
        counts[e.type]++
        byBranch[e.branch]++
        revenueKes += e.amountKes ?? 0
    }
    return { counts, byBranch, revenueKes, total: events.length }
}

export function getBranchBreakdown(events: FuneralEvent[]) {
    return BRANCHES.map((b) => {
        const row: Record<string, number | string> = { branch: b.name }
        for (const t of EVENT_TYPES) row[t] = 0
        for (const e of events) {
            if (e.branch === b.id) row[e.type] = (row[e.type] as number) + 1
        }
        return row
    })
}

export function startOfWeek(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay() // 0 Sun
    const diff = day === 0 ? -6 : 1 - day // week starts Monday
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
}

export interface WeekDayCell {
    date: Date
    key: string
    label: string
    dayNum: number
    isToday: boolean
    summary: DaySummary
    conflicts: number
    events: FuneralEvent[]
}

export function getWeek(date: Date): WeekDayCell[] {
    const start = startOfWeek(date)
    const todayKey = dateKey(new Date())
    const out: WeekDayCell[] = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const events = getEventsForDate(d)
        out.push({
            date: d,
            key: dateKey(d),
            label: d.toLocaleDateString("en-KE", { weekday: "short" }),
            dayNum: d.getDate(),
            isToday: dateKey(d) === todayKey,
            summary: getDaySummary(events),
            conflicts: detectConflicts(events).length,
            events,
        })
    }
    return out
}

export function getWeekTrend(date: Date) {
    return getWeek(date).map((c) => ({
        day: c.label,
        intakes: c.summary.counts.intake,
        releases: c.summary.counts.release,
        bookings:
            c.summary.counts.hearse + c.summary.counts.coffin + c.summary.counts.flowers + c.summary.counts.service,
    }))
}

export function getServiceDistribution(events: FuneralEvent[]) {
    const s = getDaySummary(events)
    return (["hearse", "coffin", "flowers", "service"] as EventType[]).map((t) => ({
        type: t,
        label: EVENT_META[t].short,
        value: s.counts[t],
        fill: EVENT_META[t].color,
    }))
}

export function getDeceasedRegister(date: Date): DeceasedRecord[] {
    const key = dateKey(date)
    const records: DeceasedRecord[] = []
    const statuses: CareStatus[] = ["in-care", "preparing", "viewing", "released"]

    for (const branch of BRANCHES) {
        const rng = mulberry32(hashSeed(key + branch.id + "reg"))
        const count = branch.id === "nairobi" ? 6 : 4
        for (let i = 0; i < count; i++) {
            const intakeMinutes = 6 * 60 + Math.floor(rng() * 14 * 60)
            const status = statuses[Math.floor(rng() * statuses.length)]
            const num = 100 + Math.floor(rng() * 900)
            records.push({
                id: `${key}-${branch.id}-reg-${i}`,
                name: personName(rng),
                age: 28 + Math.floor(rng() * 60),
                branch: branch.id,
                ref: `UMJ-${branch.id.slice(0, 3).toUpperCase()}-${num}`,
                locker: `${branch.id[0].toUpperCase()}-${String(1 + Math.floor(rng() * 40)).padStart(2, "0")}`,
                status,
                intakeMinutes,
                intakeTime: fmtTime(intakeMinutes),
                releaseTime: status === "released" ? fmtTime(intakeMinutes + 120 + Math.floor(rng() * 300)) : undefined,
                nextOfKin: personName(rng),
            })
        }
    }
    return records.sort((a, b) => a.intakeMinutes - b.intakeMinutes)
}

/* ------------------------------------------------------------------ */
/* Live activity stream (simulated real-time bookings across branches) */
/* ------------------------------------------------------------------ */

export interface LiveActivity {
    id: string
    type: EventType
    branch: BranchId
    deceasedName: string
    ref: string
    detail: string
    resourceLabel?: string
    amountKes?: number
    /** ms epoch when it "arrived" */
    at: number
    /** true if this arrival creates/relates to a resource clash */
    clash?: boolean
}

let liveCounter = 0

/** Generate a single synthetic incoming booking, biased toward branches/resources
 *  so cross-branch resource clashes appear frequently. */
export function makeLiveActivity(now: number): LiveActivity {
    const rng = mulberry32(hashSeed(String(now) + String(liveCounter++)))
    const type = pick(rng, ["hearse", "coffin", "flowers", "service", "intake", "release"] as EventType[])
    const branch = pick(rng, BRANCHES).id
    const num = 100 + Math.floor(rng() * 900)
    let detail = ""
    let resourceLabel: string | undefined
    let amountKes: number | undefined
    let clash = false

    switch (type) {
        case "hearse": {
            const h = pick(rng, HEARSE_FLEET)
            detail = `Hearse booked · ${h.label}`
            resourceLabel = h.label
            amountKes = 15000 + Math.floor(rng() * 45000)
            clash = rng() > 0.55
            break
        }
        case "coffin": {
            const c = pick(rng, COFFIN_MODELS)
            detail = `Coffin order · ${c.label}`
            resourceLabel = c.label
            amountKes = 25000 + Math.floor(rng() * 120000)
            clash = rng() > 0.6
            break
        }
        case "flowers":
            detail = `Floral order · ${pick(rng, FLOWER_KINDS)}`
            amountKes = 3000 + Math.floor(rng() * 22000)
            break
        case "service": {
            const ch = pick(rng, CHAPELS[branch])
            detail = `Service booked · ${ch.label}`
            resourceLabel = ch.label
            amountKes = 20000 + Math.floor(rng() * 80000)
            break
        }
        case "intake":
            detail = "New deceased intake"
            break
        case "release":
            detail = "Body released to family"
            break
    }

    return {
        id: `live-${now}-${liveCounter}`,
        type,
        branch,
        deceasedName: personName(rng),
        ref: `UMJ-${branch.slice(0, 3).toUpperCase()}-${num}`,
        detail,
        resourceLabel,
        amountKes,
        at: now,
        clash,
    }
}

export function formatKes(n: number): string {
    return "KSh " + n.toLocaleString("en-KE")
}

export function relativeTime(from: number, now: number): string {
    const s = Math.max(0, Math.round((now - from) / 1000))
    if (s < 5) return "just now"
    if (s < 60) return `${s}s ago`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    return `${h}h ago`
}

/* ================================================================== */
/* FLEET / DRIVERS / JOURNEYS — vehicle command center                */
/* ================================================================== */

export interface Driver {
    id: string
    name: string
    phone: string
}

export const DRIVERS: Driver[] = [
    { id: "d1", name: "Peter Kamau", phone: "0722 118 204" },
    { id: "d2", name: "James Otieno", phone: "0733 540 991" },
    { id: "d3", name: "Samuel Mwangi", phone: "0721 663 015" },
    { id: "d4", name: "Daniel Kiptoo", phone: "0710 872 336" },
    { id: "d5", name: "Joseph Wafula", phone: "0759 204 118" },
    { id: "d6", name: "Michael Onyango", phone: "0700 345 782" },
]

export type VehicleClass = "hearse" | "limousine" | "van" | "bus"

export interface Vehicle {
    id: string
    label: string
    model: string
    plate: string
    vClass: VehicleClass
    homeBranch: BranchId
    seats: number
    /** vehicles that are off the road today */
    maintenance?: boolean
}

/* Superset of HEARSE_FLEET (bookable pool) + support vehicles */
export const VEHICLES: Vehicle[] = [
    { id: "KDA-220H", label: "Mercedes Hearse", model: "Mercedes-Benz E-Class", plate: "KDA 220H", vClass: "hearse", homeBranch: "nairobi", seats: 2 },
    { id: "KCX-455F", label: "Toyota Fleet Van", model: "Toyota Hiace", plate: "KCX 455F", vClass: "van", homeBranch: "nairobi", seats: 12 },
    { id: "KDG-901L", label: "Premium Limousine", model: "Lincoln Town Car", plate: "KDG 901L", vClass: "limousine", homeBranch: "machakos", seats: 5 },
    { id: "KBS-118E", label: "Escort Convoy", model: "Land Cruiser Prado", plate: "KBS 118E", vClass: "hearse", homeBranch: "thika", seats: 4 },
    { id: "KDD-770M", label: "Ford Hearse", model: "Ford Transit Hearse", plate: "KDD 770M", vClass: "hearse", homeBranch: "nairobi", seats: 2 },
    { id: "KCA-330T", label: "Family Coaster", model: "Isuzu Coaster", plate: "KCA 330T", vClass: "bus", homeBranch: "machakos", seats: 28, maintenance: true },
]

export const VEHICLE_BY_ID: Record<string, Vehicle> = Object.fromEntries(VEHICLES.map((v) => [v.id, v]))

const DESTINATIONS: Record<BranchId, string[]> = {
    nairobi: ["Lang'ata Cemetery", "Langata Muslim Cemetery", "Kariokor Cemetery", "PCEA Kikuyu", "Holy Family Basilica"],
    machakos: ["Machakos Public Cemetery", "Mumbuni Catholic Church", "Kola Home", "Kathiani Grounds"],
    thika: ["Thika Cemetery", "Kiganjo Home", "Blue Post AICI", "Gatanga Home"],
}

const DELAY_REASONS = [
    "Family running late",
    "Heavy traffic on Mombasa Road",
    "Grave not yet ready",
    "Burial permit pending",
    "Body preparation overran",
    "Church service overrunning",
    "Vehicle rerouted for escort",
]

export type JourneyStatus = "scheduled" | "loading" | "en-route" | "at-service" | "returning" | "completed"

export interface Delay {
    minutes: number
    reason: string
}

export interface Journey {
    id: string
    vehicleId: string
    vehicle: Vehicle
    driverId: string
    driverName: string
    driverPhone: string
    branch: BranchId
    deceasedName: string
    ref: string
    origin: string
    destination: string
    departMinutes: number
    serviceMinutes: number
    returnMinutes: number
    /** effective (delay-shifted) times */
    effDepart: number
    effService: number
    effReturn: number
    status: JourneyStatus
    location: string
    delay?: Delay
    progressPct: number
    overlap?: boolean
}

export const JOURNEY_STATUS_META: Record<JourneyStatus, { label: string; color: string }> = {
    scheduled: { label: "Scheduled", color: "var(--st-pending)" },
    loading: { label: "Loading", color: "var(--st-hold)" },
    "en-route": { label: "En route", color: "var(--st-enroute)" },
    "at-service": { label: "At service", color: "var(--ev-service)" },
    returning: { label: "Returning", color: "var(--st-progress)" },
    completed: { label: "Completed", color: "var(--st-done)" },
}

function computeJourneyStatus(j: { effDepart: number; effService: number; effReturn: number }, now: number): JourneyStatus {
    if (now >= j.effReturn) return "completed"
    if (now >= j.effReturn - 25) return "returning"
    if (now >= j.effService) return "at-service"
    if (now >= j.effDepart) return "en-route"
    if (now >= j.effDepart - 25) return "loading"
    return "scheduled"
}

/** Build today's hearse journeys from the date's hearse events, enriched
 *  with drivers, routes, delays and live status derived from nowMinutes. */
export function getJourneys(date: Date, nowMinutes: number): Journey[] {
    const key = dateKey(date)
    const hearseEvents = getEventsForDate(date)
        .filter((e) => e.type === "hearse")
        .sort((a, b) => a.minutes - b.minutes)

    const journeys: Journey[] = hearseEvents.map((e, i) => {
        const rng = mulberry32(hashSeed(key + e.id + "journey"))
        const vehicle = VEHICLE_BY_ID[e.resource ?? "KDA-220H"] ?? VEHICLES[0]
        const driver = DRIVERS[Math.floor(rng() * DRIVERS.length)]
        const destination = pick(rng, DESTINATIONS[e.branch])
        const departMinutes = e.minutes
        const serviceMinutes = e.minutes + Math.round(e.durationMin * 0.4)
        const returnMinutes = e.minutes + e.durationMin
        const hasDelay = rng() < 0.24
        const delay: Delay | undefined = hasDelay
            ? { minutes: 10 + Math.floor(rng() * 45), reason: pick(rng, DELAY_REASONS) }
            : undefined
        const shift = delay?.minutes ?? 0
        const effDepart = departMinutes + shift
        const effService = serviceMinutes + shift
        const effReturn = returnMinutes + shift
        const status = computeJourneyStatus({ effDepart, effService, effReturn }, nowMinutes)
        const branchName = BRANCH_NAME[e.branch]
        const location =
            status === "scheduled" || status === "loading"
                ? `${branchName} Mortuary`
                : status === "en-route"
                    ? `En route → ${destination}`
                    : status === "at-service"
                        ? `At ${destination}`
                        : status === "returning"
                            ? `Returning → ${branchName} base`
                            : `Back at ${branchName} base`
        const span = effReturn - effDepart
        const progressPct = Math.max(0, Math.min(100, span > 0 ? ((nowMinutes - effDepart) / span) * 100 : 0))

        return {
            id: `jny-${key}-${i}`,
            vehicleId: vehicle.id,
            vehicle,
            driverId: driver.id,
            driverName: driver.name,
            driverPhone: driver.phone,
            branch: e.branch,
            deceasedName: e.deceasedName,
            ref: e.ref,
            origin: `${branchName} Mortuary`,
            destination,
            departMinutes,
            serviceMinutes,
            returnMinutes,
            effDepart,
            effService,
            effReturn,
            status,
            location,
            delay,
            progressPct,
        }
    })

    // mark overlaps on the same vehicle
    for (let i = 0; i < journeys.length; i++) {
        for (let j = i + 1; j < journeys.length; j++) {
            if (journeys[i].vehicleId !== journeys[j].vehicleId) continue
            if (journeys[i].effDepart < journeys[j].effReturn && journeys[j].effDepart < journeys[i].effReturn) {
                journeys[i].overlap = true
                journeys[j].overlap = true
            }
        }
    }

    return journeys.sort((a, b) => a.effDepart - b.effDepart)
}

export type VehicleState = "available" | "loading" | "en-route" | "at-service" | "returning" | "maintenance"

export interface FleetVehicleStatus {
    vehicle: Vehicle
    state: VehicleState
    location: string
    current?: Journey
    next?: Journey
    todaysJourneys: Journey[]
    hasOverlap: boolean
}

export function getFleetStatus(date: Date, nowMinutes: number): FleetVehicleStatus[] {
    const journeys = getJourneys(date, nowMinutes)
    return VEHICLES.map((vehicle) => {
        const todaysJourneys = journeys.filter((j) => j.vehicleId === vehicle.id)
        const current = todaysJourneys.find((j) => j.status !== "completed" && j.status !== "scheduled")
        const next = todaysJourneys.find((j) => j.status === "scheduled")
        const hasOverlap = todaysJourneys.some((j) => j.overlap)
        let state: VehicleState
        let location: string
        if (vehicle.maintenance) {
            state = "maintenance"
            location = `${BRANCH_NAME[vehicle.homeBranch]} workshop`
        } else if (current) {
            state = current.status as VehicleState
            location = current.location
        } else {
            state = "available"
            location = `${BRANCH_NAME[vehicle.homeBranch]} base`
        }
        return { vehicle, state, location, current, next, todaysJourneys, hasOverlap }
    })
}

export const VEHICLE_STATE_META: Record<VehicleState, { label: string; color: string }> = {
    available: { label: "Available", color: "var(--st-done)" },
    loading: { label: "Loading", color: "var(--st-hold)" },
    "en-route": { label: "En route", color: "var(--st-enroute)" },
    "at-service": { label: "At service", color: "var(--ev-service)" },
    returning: { label: "Returning", color: "var(--st-progress)" },
    maintenance: { label: "Maintenance", color: "var(--st-cancel)" },
}

/* ================================================================== */
/* TODAY OPERATIONS TIMELINE                                          */
/* ================================================================== */

export type EventPhase = "done" | "active" | "upcoming"

export interface TimelineItem {
    event: FuneralEvent
    phase: EventPhase
    delay?: Delay
    effStart: number
    effEnd: number
    isNext: boolean
}

export interface AttentionItem {
    id: string
    severity: "critical" | "warning" | "info"
    kind: "conflict" | "delay" | "reassign"
    title: string
    detail: string
    branch?: BranchId
    time?: string
}

export interface TodayOps {
    nowMinutes: number
    items: TimelineItem[]
    completed: TimelineItem[]
    active: TimelineItem[]
    next: TimelineItem[]
    upcoming: TimelineItem[]
    delayed: TimelineItem[]
    attention: AttentionItem[]
    counts: { done: number; active: number; upcoming: number; delayed: number }
}

/** Attach deterministic delays to time-bound events (hearse + service). */
function delayForEvent(key: string, e: FuneralEvent): Delay | undefined {
    if (e.type !== "hearse" && e.type !== "service") return undefined
    const rng = mulberry32(hashSeed(key + e.id + "delay"))
    if (rng() >= 0.22) return undefined
    return { minutes: 10 + Math.floor(rng() * 45), reason: pick(rng, DELAY_REASONS) }
}

export function getTodayOps(date: Date, nowMinutes: number): TodayOps {
    const key = dateKey(date)
    const events = getEventsForDate(date)
    const conflicts = detectConflicts(events)

    const items: TimelineItem[] = events.map((event) => {
        const delay = delayForEvent(key, event)
        const shift = delay?.minutes ?? 0
        const effStart = event.minutes + shift
        const effEnd = effStart + event.durationMin
        let phase: EventPhase
        if (effEnd <= nowMinutes) phase = "done"
        else if (effStart <= nowMinutes && nowMinutes < effEnd) phase = "active"
        else phase = "upcoming"
        return { event, phase, delay, effStart, effEnd, isNext: false }
    })

    items.sort((a, b) => a.effStart - b.effStart)

    const completed = items.filter((i) => i.phase === "done")
    const active = items.filter((i) => i.phase === "active")
    const upcomingAll = items.filter((i) => i.phase === "upcoming")

    // the next 4 upcoming (soonest) are flagged as "next"
    const next = upcomingAll.slice(0, 4)
    next.forEach((i) => (i.isNext = true))
    const upcoming = upcomingAll.slice(4)

    const delayed = items.filter((i) => i.delay && i.phase !== "done")

    // ---- attention feed ----
    const attention: AttentionItem[] = []
    for (const c of conflicts) {
        attention.push({
            id: `att-${c.id}`,
            severity: c.severity,
            kind: c.kind === "hearse" ? "reassign" : "conflict",
            title: c.title,
            detail: c.detail,
            branch: c.branches[0],
            time: c.time,
        })
    }
    for (const i of delayed) {
        if (i.phase === "done") continue
        attention.push({
            id: `att-delay-${i.event.id}`,
            severity: i.phase === "active" ? "warning" : "info",
            kind: "delay",
            title: `${EVENT_META[i.event.type].short} delayed ${i.delay!.minutes}m`,
            detail: `${i.event.deceasedName} · ${i.delay!.reason}${i.event.resourceLabel ? ` · ${i.event.resourceLabel}` : ""
                }`,
            branch: i.event.branch,
            time: fmtTime(i.effStart),
        })
    }

    const severityRank = { critical: 0, warning: 1, info: 2 }
    attention.sort((a, b) => severityRank[a.severity] - severityRank[b.severity])

    return {
        nowMinutes,
        items,
        completed,
        active,
        next,
        upcoming,
        delayed,
        attention,
        counts: {
            done: completed.length,
            active: active.length,
            upcoming: upcomingAll.length,
            delayed: delayed.length,
        },
    }
}

/** Reference "clock minutes" for a selected date:
 *  - today  → real current minutes
 *  - past   → end of day (everything completed)
 *  - future → before dawn (everything upcoming) */
export function referenceMinutes(selected: Date, now: Date): number {
    const selKey = dateKey(selected)
    const todayKey = dateKey(now)
    if (selKey === todayKey) return now.getHours() * 60 + now.getMinutes()
    if (selected < now) return 24 * 60 + 60 // past: everything done
    return -120 // future: nothing started
}
