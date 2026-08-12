"use client"

import { useMemo, useState } from "react"
import {
    Activity,
    AlertTriangle,
    CalendarRange,
    ChevronLeft,
    ChevronRight,
    Clock,
    HeartHandshake,
    LayoutList,
    TrendingUp,
    Users,
} from "lucide-react"
import { MiniCalendar } from "./mini-calendar"
import { WeekView } from "./week-view"
import { StatCards } from "./stat-cards"
import { BranchBarChart } from "./branch-bar-chart"
import { TrendChart } from "./trend-chart"
import { ServiceDonut } from "./service-donut"
import { DayTimeline } from "./day-timeline"
import { DeceasedRegister } from "./deceased-register"
import { ConflictMonitor } from "./conflict-monitor"
import { LiveFeed } from "./live-feed"
import { useClock } from "./use-clock"
import {
    BRANCHES,
    BRANCH_COLOR,
    dateKey,
    detectConflicts,
    formatKes,
    getDaySummary,
    getDeceasedRegister,
    getEventsForDate,
    getWeek,
    type BranchId,
} from "@/lib/funeral-data"
import { cn } from "@/lib/utils"
import { tint } from "./event-visuals"

type ViewMode = "day" | "week"

export function Dashboard() {
    const [selected, setSelected] = useState(() => new Date())
    const [branch, setBranch] = useState<BranchId | "all">("all")
    const [view, setView] = useState<ViewMode>("day")
    const now = useClock()

    const allEvents = useMemo(() => getEventsForDate(selected), [selected])
    const register = useMemo(() => getDeceasedRegister(selected), [selected])
    const week = useMemo(() => getWeek(selected), [selected])

    const branchEvents = useMemo(
        () => (branch === "all" ? allEvents : allEvents.filter((e) => e.branch === branch)),
        [allEvents, branch],
    )
    const branchRegister = useMemo(
        () => (branch === "all" ? register : register.filter((r) => r.branch === branch)),
        [register, branch],
    )

    // Conflicts are computed across ALL branches (that is the whole point of
    // cross-branch clash detection), then optionally narrowed for display.
    const allConflicts = useMemo(() => detectConflicts(allEvents), [allEvents])
    const conflicts = useMemo(
        () => (branch === "all" ? allConflicts : allConflicts.filter((c) => c.branches.includes(branch))),
        [allConflicts, branch],
    )

    const summary = useMemo(() => getDaySummary(branchEvents), [branchEvents])
    const inCare = branchRegister.filter((r) => r.status !== "released").length

    const dateLabel = selected.toLocaleDateString("en-KE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    })

    const shift = (days: number) => {
        const d = new Date(selected)
        d.setDate(d.getDate() + (view === "week" ? days * 7 : days))
        setSelected(d)
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
                <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-4 py-3 md:px-6">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
                            <HeartHandshake className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="font-serif text-xl leading-none text-foreground">Umoja Funeral Home</h1>
                            <p className="mt-1 text-xs text-muted-foreground">Operations Command Center</p>
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        {allConflicts.length > 0 && (
                            <span
                                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:inline-flex"
                                style={{ backgroundColor: tint("var(--danger)", 14), color: "var(--danger)" }}
                            >
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {allConflicts.length} conflict{allConflicts.length === 1 ? "" : "s"}
                            </span>
                        )}
                        <div className="flex items-center gap-2 text-right">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-mono text-sm font-medium leading-none text-foreground tabular-nums">
                                    {now ? now.toLocaleTimeString("en-KE", { hour12: false }) : "--:--:--"}
                                </p>
                                <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                                    {now ? now.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" }) : "—"} · EAT
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1500px] px-4 py-5 md:px-6">
                {/* Controls row */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => shift(-1)}
                                aria-label="Previous"
                                className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => shift(1)}
                                aria-label="Next"
                                className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {view === "week" ? "Week of" : "Operations for"}
                            </p>
                            <p className="font-serif text-xl leading-tight text-foreground">{dateLabel}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* view toggle */}
                        <div className="inline-flex rounded-lg border border-border bg-card p-1">
                            <ToggleBtn active={view === "day"} onClick={() => setView("day")} icon={LayoutList}>
                                Day
                            </ToggleBtn>
                            <ToggleBtn active={view === "week"} onClick={() => setView("week")} icon={CalendarRange}>
                                Week
                            </ToggleBtn>
                        </div>
                        {/* branch control */}
                        <div className="inline-flex rounded-lg border border-border bg-card p-1">
                            <BranchTab active={branch === "all"} onClick={() => setBranch("all")}>
                                All
                            </BranchTab>
                            {BRANCHES.map((b) => (
                                <BranchTab key={b.id} active={branch === b.id} onClick={() => setBranch(b.id)} color={BRANCH_COLOR[b.id]}>
                                    {b.name}
                                </BranchTab>
                            ))}
                        </div>
                    </div>
                </div>

                {/* KPI cards */}
                <StatCards summary={summary} revenue={summary.revenueKes} />

                {/* Secondary KPI strip */}
                <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <MetaStat icon={Activity} label="Events today" value={String(summary.total)} />
                    <MetaStat icon={Users} label="Currently in care" value={String(inCare)} />
                    <MetaStat
                        icon={AlertTriangle}
                        label="Open conflicts"
                        value={String(conflicts.length)}
                        danger={conflicts.length > 0}
                    />
                    <MetaStat icon={TrendingUp} label="Service revenue" value={formatKes(summary.revenueKes)} />
                </div>

                {/* Week strip (only in week view) */}
                {view === "week" && (
                    <section className="mt-6 rounded-xl border border-border bg-card p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <CalendarRange className="h-4 w-4 text-primary" />
                            <h2 className="text-sm font-semibold text-card-foreground">Weekly overview</h2>
                            <span className="ml-auto text-xs text-muted-foreground">Click a day to drill in</span>
                        </div>
                        <WeekView week={week} selected={selected} branch={branch} onSelect={(d) => setSelected(d)} />
                    </section>
                )}

                {/* Real-time row: conflicts + live feed */}
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="h-[380px]">
                        <ConflictMonitor conflicts={conflicts} />
                    </div>
                    <div className="h-[380px]">
                        <LiveFeed />
                    </div>
                </div>

                {/* Schedule + calendar row */}
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <div className="h-[520px]">
                            <DayTimeline events={branchEvents} conflicts={conflicts} dateLabel={dateLabel} />
                        </div>
                    </div>
                    <div className="space-y-6 lg:col-span-5">
                        <section className="rounded-xl border border-border bg-card p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <CalendarRange className="h-4 w-4 text-primary" />
                                <h2 className="text-sm font-semibold text-card-foreground">Operations calendar</h2>
                                <span className="ml-auto text-xs text-muted-foreground">Click any date</span>
                            </div>
                            <MiniCalendar selected={selected} onSelect={setSelected} />
                        </section>
                        <section className="rounded-xl border border-border bg-card p-4">
                            <h2 className="mb-1 text-sm font-semibold text-card-foreground">Service mix</h2>
                            <p className="mb-2 text-xs text-muted-foreground">Hearse, coffin, floral & chapel bookings</p>
                            <ServiceDonut events={branchEvents} />
                        </section>
                    </div>
                </div>

                {/* Charts row */}
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <section className="rounded-xl border border-border bg-card p-5">
                        <h2 className="mb-1 text-sm font-semibold text-card-foreground">Bookings by branch</h2>
                        <p className="mb-4 text-xs text-muted-foreground">
                            Stacked activity across Nairobi, Machakos and Thika on the selected day
                        </p>
                        <BranchBarChart events={allEvents} />
                    </section>
                    <section className="rounded-xl border border-border bg-card p-5">
                        <h2 className="mb-1 text-sm font-semibold text-card-foreground">7-day operations trend</h2>
                        <p className="mb-4 text-xs text-muted-foreground">
                            Intakes, releases and service bookings across the week
                        </p>
                        <TrendChart date={selected} />
                    </section>
                </div>

                {/* Deceased register */}
                <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
                    <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-4">
                        <h2 className="text-sm font-semibold text-card-foreground">Deceased register — intakes &amp; releases</h2>
                        <span className="ml-auto text-xs text-muted-foreground">
                            {branchRegister.length} records · {inCare} in care
                        </span>
                    </div>
                    <DeceasedRegister records={branchRegister} />
                </section>

                <footer className="py-8 text-center text-xs text-muted-foreground">
                    Umoja Funeral Home · Nairobi · Machakos · Thika — real-time operations in East Africa Time (EAT)
                </footer>
            </main>
        </div>
    )
}

function ToggleBtn({
    active,
    onClick,
    icon: Icon,
    children,
}: {
    active: boolean
    onClick: () => void
    icon: typeof Activity
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
        >
            <Icon className="h-4 w-4" />
            {children}
        </button>
    )
}

function BranchTab({
    active,
    onClick,
    children,
    color,
}: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
    color?: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
        >
            {color && (
                <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: active ? "var(--primary-foreground)" : color }}
                />
            )}
            {children}
        </button>
    )
}

function MetaStat({
    icon: Icon,
    label,
    value,
    danger,
}: {
    icon: typeof Activity
    label: string
    value: string
    danger?: boolean
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md"
                style={
                    danger
                        ? { backgroundColor: tint("var(--danger)", 14), color: "var(--danger)" }
                        : { backgroundColor: "var(--secondary)", color: "var(--primary)" }
                }
            >
                <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{label}</p>
                <p
                    className="truncate font-semibold"
                    style={danger ? { color: "var(--danger)" } : undefined}
                >
                    {value}
                </p>
            </div>
        </div>
    )
}
