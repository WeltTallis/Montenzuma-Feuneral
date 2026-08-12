"use client"

import { AlertTriangle } from "lucide-react"
import {
    EVENT_META,
    dateKey,
    type BranchId,
    type EventType,
    type WeekDayCell,
} from "@/lib/funeral-data"
import { tint } from "./event-visuals"

const TYPES: EventType[] = ["intake", "release", "hearse", "coffin", "flowers", "service"]

export function WeekView({
    week,
    selected,
    branch,
    onSelect,
}: {
    week: WeekDayCell[]
    selected: Date
    branch: BranchId | "all"
    onSelect: (d: Date) => void
}) {
    const selKey = dateKey(selected)
    const max = Math.max(1, ...week.map((c) => c.summary.total))

    return (
        <div className="grid grid-cols-7 gap-2">
            {week.map((cell) => {
                const isSel = cell.key === selKey
                const total = branch === "all" ? cell.summary.total : cell.summary.byBranch[branch]
                const height = Math.round((total / max) * 100)
                return (
                    <button
                        key={cell.key}
                        onClick={() => onSelect(cell.date)}
                        className="group flex flex-col rounded-lg border bg-card p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
                        style={{
                            borderColor: isSel ? "var(--primary)" : "var(--border)",
                            boxShadow: isSel ? "0 0 0 1px var(--primary)" : undefined,
                        }}
                        aria-pressed={isSel}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {cell.label}
                            </span>
                            {cell.conflicts > 0 && (
                                <span
                                    className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-bold tabular-nums"
                                    style={{ backgroundColor: tint("var(--danger)", 14), color: "var(--danger)" }}
                                >
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                    {cell.conflicts}
                                </span>
                            )}
                        </div>

                        <div className="mt-1 flex items-baseline gap-1">
                            <span
                                className="text-lg font-semibold tabular-nums"
                                style={cell.isToday ? { color: "var(--primary)" } : undefined}
                            >
                                {cell.dayNum}
                            </span>
                            {cell.isToday && <span className="text-[10px] font-medium text-primary">today</span>}
                        </div>

                        {/* stacked mini bar by event type */}
                        <div className="mt-2 flex h-16 items-end justify-center">
                            <div
                                className="flex w-6 flex-col-reverse overflow-hidden rounded"
                                style={{ height: `${Math.max(height, 6)}%`, minHeight: 6 }}
                            >
                                {TYPES.map((t) => {
                                    const c = cell.summary.counts[t]
                                    if (!c) return null
                                    const share = (c / (cell.summary.total || 1)) * 100
                                    return (
                                        <div key={t} style={{ height: `${share}%`, backgroundColor: EVENT_META[t].color }} />
                                    )
                                })}
                            </div>
                        </div>

                        <p className="mt-2 text-center text-[11px] tabular-nums text-muted-foreground">
                            {total} event{total === 1 ? "" : "s"}
                        </p>
                    </button>
                )
            })}
        </div>
    )
}
