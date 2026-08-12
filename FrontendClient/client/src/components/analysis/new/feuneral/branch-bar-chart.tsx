"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { EVENT_META, type FuneralEvent, getBranchBreakdown } from "@/lib/funeral-data"

const config: ChartConfig = {
    intake: { label: EVENT_META.intake.short, color: "var(--ev-intake)" },
    release: { label: EVENT_META.release.short, color: "var(--ev-release)" },
    hearse: { label: EVENT_META.hearse.short, color: "var(--ev-hearse)" },
    coffin: { label: EVENT_META.coffin.short, color: "var(--ev-coffin)" },
    flowers: { label: EVENT_META.flowers.short, color: "var(--ev-flowers)" },
    service: { label: EVENT_META.service.short, color: "var(--ev-service)" },
}

const KEYS = ["intake", "release", "hearse", "coffin", "flowers", "service"] as const

export function BranchBarChart({ events }: { events: FuneralEvent[] }) {
    const data = getBranchBreakdown(events)
    return (
        <ChartContainer config={config} className="h-[260px] w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="branch" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {KEYS.map((k, i) => (
                    <Bar
                        key={k}
                        dataKey={k}
                        stackId="a"
                        fill={`var(--color-${k})`}
                        radius={i === KEYS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                ))}
            </BarChart>
        </ChartContainer>
    )
}
