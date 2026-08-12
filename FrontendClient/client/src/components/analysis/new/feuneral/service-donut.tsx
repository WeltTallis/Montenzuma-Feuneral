"use client"

import { useMemo } from "react"
import { Label, Pie, PieChart } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { getServiceDistribution, type FuneralEvent } from "@/lib/funeral-data"

const config: ChartConfig = {
    Hearse: { label: "Hearse" },
    Coffin: { label: "Coffin" },
    Flowers: { label: "Flowers" },
    Service: { label: "Service" },
}

export function ServiceDonut({ events }: { events: FuneralEvent[] }) {
    const data = getServiceDistribution(events)
    const total = useMemo(() => data.reduce((a, d) => a + d.value, 0), [data])

    return (
        <div>
            <ChartContainer config={config} className="mx-auto aspect-square h-[220px]">
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                    <Pie data={data} dataKey="value" nameKey="label" innerRadius={62} outerRadius={92} strokeWidth={2} paddingAngle={2}>
                        <Label
                            content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                    return (
                                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground font-serif text-3xl tabular-nums">
                                                {total}
                                            </tspan>
                                            <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground text-xs">
                                                bookings
                                            </tspan>
                                        </text>
                                    )
                                }
                                return null
                            }}
                        />
                    </Pie>
                </PieChart>
            </ChartContainer>
            <div className="mt-2 grid grid-cols-2 gap-2">
                {data.map((d) => (
                    <div key={d.type} className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                        <span className="text-muted-foreground">{d.label}</span>
                        <span className="ml-auto font-medium text-card-foreground tabular-nums">{d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
