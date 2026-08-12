"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { getWeekTrend } from "@/lib/funeral-data"

const config: ChartConfig = {
    bookings: { label: "Service bookings", color: "var(--ev-service)" },
    intakes: { label: "Intakes", color: "var(--ev-intake)" },
    releases: { label: "Releases", color: "var(--ev-release)" },
}

export function TrendChart({ date }: { date: Date }) {
    const data = getWeekTrend(date)
    return (
        <ChartContainer config={config} className="h-[260px] w-full">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                    {Object.keys(config).map((k) => (
                        <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={0.28} />
                            <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0.02} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {Object.keys(config).map((k) => (
                    <Area
                        key={k}
                        dataKey={k}
                        type="monotone"
                        stroke={`var(--color-${k})`}
                        strokeWidth={2}
                        fill={`url(#fill-${k})`}
                        stackId={undefined}
                    />
                ))}
            </AreaChart>
        </ChartContainer>
    )
}
