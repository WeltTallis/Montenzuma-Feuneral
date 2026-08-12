"use client"

import { BRANCHES, type BranchId, type CareStatus, type DeceasedRecord } from "@/lib/funeral-data"

const STATUS_COLOR: Record<CareStatus, string> = {
    "in-care": "var(--ev-intake)",
    preparing: "var(--ev-coffin)",
    viewing: "var(--ev-flowers)",
    released: "var(--primary)",
}

function statusStyle(status: CareStatus): React.CSSProperties {
    const c = STATUS_COLOR[status]
    return {
        backgroundColor: `color-mix(in oklch, ${c} 14%, transparent)`,
        color: c,
    }
}

const STATUS_LABEL: Record<CareStatus, string> = {
    "in-care": "In care",
    preparing: "Preparing",
    viewing: "Viewing",
    released: "Released",
}

function branchName(id: BranchId) {
    return BRANCHES.find((b) => b.id === id)!.name
}

export function DeceasedRegister({ records }: { records: DeceasedRecord[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Deceased</th>
                        <th className="px-4 py-3 font-medium">Ref</th>
                        <th className="px-4 py-3 font-medium">Branch</th>
                        <th className="px-4 py-3 font-medium">Locker</th>
                        <th className="px-4 py-3 font-medium">Intake</th>
                        <th className="px-4 py-3 font-medium">Release</th>
                        <th className="px-4 py-3 font-medium">Next of kin</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((r) => (
                        <tr key={r.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50">
                            <td className="px-4 py-3">
                                <span className="font-medium text-card-foreground">{r.name}</span>
                                <span className="ml-1.5 text-xs text-muted-foreground">· {r.age} yrs</span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground tabular-nums">{r.ref}</td>
                            <td className="px-4 py-3 text-muted-foreground">{branchName(r.branch)}</td>
                            <td className="px-4 py-3 font-medium text-card-foreground tabular-nums">{r.locker}</td>
                            <td className="px-4 py-3 text-muted-foreground tabular-nums">{r.intakeTime}</td>
                            <td className="px-4 py-3 text-muted-foreground tabular-nums">{r.releaseTime ?? "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{r.nextOfKin}</td>
                            <td className="px-4 py-3">
                                <span
                                    className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                                    style={statusStyle(r.status)}
                                >
                                    {STATUS_LABEL[r.status]}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
