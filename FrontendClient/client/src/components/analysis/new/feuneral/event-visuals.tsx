import {
    ArrowRightLeft,
    BedDouble,
    Church,
    Flower2,
    Package,
    Truck,
    type LucideIcon,
} from "lucide-react"
import type { EventType } from "@/lib/funeral-data"

export const EVENT_ICON: Record<EventType, LucideIcon> = {
    intake: BedDouble,
    release: ArrowRightLeft,
    hearse: Truck,
    coffin: Package,
    flowers: Flower2,
    service: Church,
}

/** translucent tint of a color token for backgrounds */
export function tint(colorVar: string, pct = 12): string {
    return `color-mix(in oklch, ${colorVar} ${pct}%, transparent)`
}
