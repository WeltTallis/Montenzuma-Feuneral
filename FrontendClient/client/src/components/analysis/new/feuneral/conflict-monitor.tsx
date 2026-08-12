"use client"

import { AlertTriangle, ArrowRightLeft, Church, Package, Truck, ShieldCheck } from "lucide-react"
import {
    BRANCH_COLOR,
    BRANCH_NAME,
    type Conflict,
    type ConflictKind,
} from "@/lib/funeral-data"
import { tint } from "./event-visuals"

const KIND_ICON: Record<ConflictKind, typeof Truck> = {
    hearse: Truck,
    chapel: Church,
    coffin: Package,
}

function BranchDot({ id }: { id: keyof typeof BRANCH_COLOR }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRANCH_COLOR[id] }} />
            {BRANCH_NAME[id]}
        </span>
    )
}

export function ConflictMonitor({ conflicts }: { conflicts: Conflict[] }) {
    const critical = conflicts.filter((c) => c.severity === "critical").length

    return (
        <section className="flex h-full flex-col rounded-xl border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                    <span
                        className="grid h-8 w-8 place-items-center rounded-md"
                        style={{ backgroundColor: tint("var(--danger)", 14), color: "var(--danger)" }}
                    >
                        <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div>
                        <h2 className="text-sm font-semibold leading-none">Resource Conflicts</h2>
                        <p className="mt-1 text-[11px] text-muted-foreground">Live cross-branch clash detection</p>
                    </div>
                </div>
                {conflicts.length > 0 ? (
                    <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
                        style={{ backgroundColor: tint("var(--danger)", 14), color: "var(--danger)" }}
                    >
                        {conflicts.length} open{critical ? ` · ${critical} critical` : ""}
                    </span>
                ) : (
                    <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: tint("var(--primary)", 12), color: "var(--primary)" }}
                    >
                        <ShieldCheck className="h-3.5 w-3.5" /> All clear
                    </span>
                )}
            </header>

            <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
                {conflicts.length === 0 && (
                    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                        <ShieldCheck className="h-8 w-8 opacity-40" />
                        <p className="text-sm">No scheduling conflicts for this day.</p>
                    </div>
                )}

                {conflicts.map((c) => {
                    const Icon = KIND_ICON[c.kind]
                    const color = c.severity === "critical" ? "var(--danger)" : "var(--warn)"
                    return (
                        <article
                            key={c.id}
                            className="rounded-lg border bg-card p-3"
                            style={{ borderColor: tint(color, 45), backgroundColor: tint(color, 5) }}
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md"
                                    style={{ backgroundColor: tint(color, 16), color }}
                                >
                                    <Icon className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold leading-tight">{c.title}</h3>
                                        {c.crossBranch && (
                                            <span
                                                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                                style={{ backgroundColor: tint(color, 16), color }}
                                            >
                                                <ArrowRightLeft className="h-3 w-3" /> cross-branch
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.detail}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        <span className="text-[11px] font-medium text-foreground/70">{c.time}</span>
                                        <span className="text-border">·</span>
                                        {c.branches.map((b) => (
                                            <BranchDot key={b} id={b} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </article>
                    )
                })}
            </div>
        </section>
    )
}
