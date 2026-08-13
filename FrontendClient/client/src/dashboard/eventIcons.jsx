import { BedDouble, ArrowRightLeft, Truck, Package, Flower2, Church } from "lucide-react";
import { EVENT_META } from "./data";

/** Lucide icon per event type (kept here so data.js stays framework-agnostic). */
export const EVENT_ICON = {
  intake: BedDouble,
  release: ArrowRightLeft,
  hearse: Truck,
  coffin: Package,
  flowers: Flower2,
  service: Church,
};

/** Convenience: tinted 8px chip for an event type (used by several panels). */
export function typeChip(type) {
  const meta = EVENT_META[type];
  return {
    backgroundColor: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
    color: meta.color,
  };
}

export default EVENT_ICON;
