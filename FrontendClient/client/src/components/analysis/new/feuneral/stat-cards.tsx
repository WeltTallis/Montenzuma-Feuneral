import { EVENT_META, formatKes, type DaySummary, type EventType } from "@/lib/funeral-data"
import { EVENT_ICON, tint } from "./event-visuals"

const ORDER: EventType[] = ["intake", "release", "hearse", "coffin", "flowers", "service"]

export function StatCards({ summary, revenue }: { summary: DaySummary; revenue: number }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
            {ORDER.map((t) => {
                const meta = EVENT_META[t]
                const Icon = EVENT_ICON[t]
                return (
                    <div key={t} className="rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30">
                        <div className="flex items-center justify-between">
                            <span
                                className="grid h-8 w-8 place-items-center rounded-md"
                                style={{ backgroundColor: tint(meta.color, 14), color: meta.color }}
                            >
                                <Icon className="h-4 w-4" />
                            </span>
                            <span className="text-2xl font-semibold tabular-nums leading-none">{summary.counts[t]}</span>
                        </div>
                        <p className="mt-2 text-xs font-medium text-muted-foreground">{meta.short}</p>
                    </div>
                )
            })}
            <div
                className="col-span-2 rounded-xl border p-3 sm:col-span-3 xl:col-span-1"
                style={{ borderColor: tint("var(--primary)", 35), backgroundColor: tint("var(--primary)", 6) }}
            >
                <p className="text-xs font-medium text-muted-foreground">Day revenue</p>
                <p className="mt-1 text-lg font-semibold leading-tight text-primary">{formatKes(revenue)}</p>
            </div>
        </div>
    )
}
