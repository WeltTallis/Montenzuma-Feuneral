"use client"

import { useEffect, useRef, useState } from "react"
import { Radio, ArrowRightLeft } from "lucide-react"
import {
    BRANCH_COLOR,
    BRANCH_NAME,
    EVENT_META,
    formatKes,
    makeLiveActivity,
    relativeTime,
    type LiveActivity,
} from "@/lib/funeral-data"
import { EVENT_ICON, tint } from "./event-visuals"

function seedFeed(now: number): LiveActivity[] {
    const out: LiveActivity[] = []
    for (let i = 6; i >= 0; i--) out.push(makeLiveActivity(now - i * 9000 - i * 1234))
    return out.reverse()
}

export function LiveFeed() {
    const [items, setItems] = useState<LiveActivity[]>([])
    const [now, setNow] = useState(() => Date.now())
    const seeded = useRef(false)

    useEffect(() => {
        if (!seeded.current) {
            seeded.current = true
            setItems(seedFeed(Date.now()))
        }
        const tick = setInterval(() => setNow(Date.now()), 1000)
        const feed = setInterval(() => {
            setItems((prev) => [makeLiveActivity(Date.now()), ...prev].slice(0, 14))
        }, 4200)
        return () => {
            clearInterval(tick)
            clearInterval(feed)
        }
    }, [])

    return (
        <section className="flex h-full flex-col rounded-xl border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                    <span
                        className="grid h-8 w-8 place-items-center rounded-md"
                        style={{ backgroundColor: tint("var(--ev-service)", 14), color: "var(--ev-service)" }}
                    >
                        <Radio className="h-4 w-4" />
                    </span>
                    <div>
                        <h2 className="text-sm font-semibold leading-none">Live Activity</h2>
                        <p className="mt-1 text-[11px] text-muted-foreground">All branches · real-time bookings</p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>
                    Live
                </span>
            </header>

            <div className="flex-1 overflow-y-auto p-2">
                <ul className="space-y-1.5">
                    {items.map((a, idx) => {
                        const meta = EVENT_META[a.type]
                        const Icon = EVENT_ICON[a.type]
                        const fresh = idx === 0 && now - a.at < 4500
                        return (
                            <li
                                key={a.id}
                                className="flex items-start gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-secondary/40"
                                style={
                                    fresh
                                        ? { backgroundColor: tint(meta.color, 8), borderColor: tint(meta.color, 30) }
                                        : undefined
                                }
                            >
                                <span
                                    className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md"
                                    style={{ backgroundColor: tint(meta.color, 14), color: meta.color }}
                                >
                                    <Icon className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-[13px] font-medium leading-tight">{a.detail}</p>
                                        {a.clash && (
                                            <span
                                                className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                                                style={{ backgroundColor: tint("var(--danger)", 14), color: "var(--danger)" }}
                                            >
                                                <ArrowRightLeft className="h-3 w-3" /> clash
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                                        <span
                                            className="inline-flex items-center gap-1 font-medium"
                                            style={{ color: BRANCH_COLOR[a.branch] }}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRANCH_COLOR[a.branch] }} />
                                            {BRANCH_NAME[a.branch]}
                                        </span>
                                        <span>·</span>
                                        <span className="truncate">{a.deceasedName}</span>
                                        <span>·</span>
                                        <span className="tabular-nums">{a.ref}</span>
                                        {a.amountKes ? (
                                            <>
                                                <span>·</span>
                                                <span className="font-medium text-foreground/70">{formatKes(a.amountKes)}</span>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                                    {relativeTime(a.at, now)}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </section>
    )
}
