"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import {
    BRANCH_COLOR,
    BRANCH_NAME,
    EVENT_META,
    formatKes,
    type Conflict,
    type EventType,
    type FuneralEvent,
} from "@/lib/funeral-data"
import { EVENT_ICON, tint } from "./event-visuals"

const FILTERS: (EventType | "all")[] = ["all", "intake", "release", "hearse", "coffin", "flowers", "service"]

export function DayTimeline({
    events,
    conflicts,
    dateLabel,
}: {
    events: FuneralEvent[]
    conflicts: Conflict[]
    dateLabel: string
}) {
    const [filter, setFilter] = useState<EventType | "all">("all")
    const [query, setQuery] = useState("")

    const conflictIds = useMemo(() => {
        const s = new Set<string>()
        for (const c of conflicts) for (const e of c.events) s.add(e.id)
        return s
    }, [conflicts])

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase()
        return events.filter((e) => {
            if (filter !== "all" && e.type !== filter) return false
            if (q && !`${e.deceasedName} ${e.ref} ${e.detail}`.toLowerCase().includes(q)) return false
            return true
        })
    }, [events, filter, query])

    return (
        <section className="flex h-full flex-col rounded-xl border border-border bg-card">
            <header className="border-b border-border px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-sm font-semibold leading-none">Day Schedule</h2>
                        <p className="mt-1 text-[11px] text-muted-foreground">{dateLabel}</p>
                    </div>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search name, ref…"
                            className="h-8 w-44 rounded-md border border-input bg-background pl-8 pr-2 text-xs outline-none focus:border-ring"
                        />
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                    {FILTERS.map((f) => {
                        const active = filter === f
                        const color = f === "all" ? "var(--primary)" : EVENT_META[f].color
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                                style={{
                                    borderColor: active ? color : "var(--border)",
                                    backgroundColor: active ? tint(color, 14) : "transparent",
                                    color: active ? color : "var(--muted-foreground)",
                                }}
                            >
                                {f === "all" ? "All" : EVENT_META[f].short}
                            </button>
                        )
                    })}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                {shown.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">No matching events.</p>
                ) : (
                    <ul className="divide-y divide-border">
                        {shown.map((e) => {
                            const meta = EVENT_META[e.type]
                            const Icon = EVENT_ICON[e.type]
                            const clash = conflictIds.has(e.id)
                            return (
                                <li
                                    key={e.id}
                                    className="flex items-center gap-3 px-4 py-2.5"
                                    style={clash ? { backgroundColor: tint("var(--danger)", 5) } : undefined}
                                >
                                    <div className="w-16 shrink-0 text-right">
                                        <p className="text-xs font-semibold tabular-nums leading-tight">{e.time}</p>
                                        <p className="text-[10px] text-muted-foreground">{e.durationMin}m</p>
                                    </div>
                                    <span
                                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md"
                                        style={{ backgroundColor: tint(meta.color, 14), color: meta.color }}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-[13px] font-medium leading-tight">{e.deceasedName}</p>
                                            {clash && (
                                                <span
                                                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                                                    style={{ backgroundColor: tint("var(--danger)", 14), color: "var(--danger)" }}
                                                >
                                                    conflict
                                                </span>
                                            )}
                                        </div>
                                        <p className="truncate text-[11px] text-muted-foreground">
                                            {meta.short} · {e.detail} · {e.status}
                                        </p>
                                    </div>
                                    <div className="hidden shrink-0 text-right sm:block">
                                        <span
                                            className="inline-flex items-center gap-1 text-[11px] font-medium"
                                            style={{ color: BRANCH_COLOR[e.branch] }}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRANCH_COLOR[e.branch] }} />
                                            {BRANCH_NAME[e.branch]}
                                        </span>
                                        {e.amountKes ? (
                                            <p className="text-[11px] tabular-nums text-foreground/70">{formatKes(e.amountKes)}</p>
                                        ) : (
                                            <p className="text-[11px] tabular-nums text-muted-foreground">{e.ref}</p>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </section>
    )
}
