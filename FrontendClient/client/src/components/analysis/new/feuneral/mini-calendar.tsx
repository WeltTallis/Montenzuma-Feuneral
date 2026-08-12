"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { dateKey, detectConflicts, getEventsForDate } from "@/lib/funeral-data"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function MiniCalendar({
    selected,
    onSelect,
}: {
    selected: Date
    onSelect: (d: Date) => void
}) {
    const [view, setView] = useState(() => startOfMonth(selected))
    const today = new Date()

    const first = startOfMonth(view)
    const startPad = first.getDay()
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()

    const cells: (Date | null)[] = []
    for (let i = 0; i < startPad; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d))

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <p className="font-serif text-lg text-card-foreground">
                    {view.toLocaleDateString("en-KE", { month: "long", year: "numeric" })}
                </p>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        aria-label="Previous month"
                        onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
                        className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next month"
                        onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
                        className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((w) => (
                    <div
                        key={w}
                        className="pb-1 text-center text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground"
                    >
                        {w}
                    </div>
                ))}

                {cells.map((cell, i) => {
                    if (!cell) return <div key={`pad-${i}`} />
                    const isSelected = dateKey(cell) === dateKey(selected)
                    const isToday = dateKey(cell) === dateKey(today)
                    const dayEvents = getEventsForDate(cell)
                    const load = dayEvents.length
                    const density = load > 22 ? 3 : load > 14 ? 2 : 1
                    const hasConflict = detectConflicts(dayEvents).length > 0

                    return (
                        <button
                            key={dateKey(cell)}
                            type="button"
                            onClick={() => onSelect(cell)}
                            className={cn(
                                "relative flex aspect-square flex-col items-center justify-center rounded-md text-sm transition-colors",
                                isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "text-card-foreground hover:bg-secondary",
                                isToday && !isSelected && "ring-1 ring-inset ring-primary/40",
                            )}
                        >
                            {hasConflict && (
                                <span
                                    className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                                    style={{ backgroundColor: isSelected ? "var(--primary-foreground)" : "var(--danger)" }}
                                    aria-label="Has conflicts"
                                />
                            )}
                            <span className={cn(isToday && !isSelected && "font-semibold text-primary")}>
                                {cell.getDate()}
                            </span>
                            <span className="mt-0.5 flex gap-0.5">
                                {Array.from({ length: density }).map((_, di) => (
                                    <span
                                        key={di}
                                        className={cn(
                                            "h-1 w-1 rounded-full",
                                            isSelected ? "bg-primary-foreground/70" : "bg-primary/45",
                                        )}
                                    />
                                ))}
                            </span>
                        </button>
                    )
                })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <span className="flex gap-0.5">
                            <span className="h-1 w-1 rounded-full bg-primary/45" />
                            <span className="h-1 w-1 rounded-full bg-primary/45" />
                            <span className="h-1 w-1 rounded-full bg-primary/45" />
                        </span>
                        Density
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--danger)" }} />
                        Conflicts
                    </span>
                </span>
                <button
                    type="button"
                    onClick={() => {
                        onSelect(new Date())
                        setView(startOfMonth(new Date()))
                    }}
                    className="rounded-md px-2 py-1 font-medium text-primary transition-colors hover:bg-secondary"
                >
                    Jump to today
                </button>
            </div>
        </div>
    )
}
