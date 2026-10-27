// Kensyn formatters for fee-schedule rules. Used by the
// "currently active" and "upcoming" summary cards so admins can read the
// rule at a glance without parsing the schedule table.

import type {
  FeeScheduleEntry,
  FeeScheduleTier,
} from "@hr/types/api/advance-payment-fee-schedule.types";

import { formatCurrency } from "@hr/utils/formatters";

// "2" → "2%", "1.3" → "1.3%" (Kensyn decimal mark).
export function formatKensynPercent(percentage: number): string {
  const fixed = Number.isInteger(percentage)
    ? percentage.toString()
    : percentage.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${fixed}%`;
}

export interface RuleFragment {
  type: "text" | "emphasis";
  value: string;
}

// Kensyn rendering of the fee rule, returned as fragments so the
// component can bold the numerical parts.
export function describeRuleFragments(
  tiers: FeeScheduleTier[],
  minFeeVnd: number,
): RuleFragment[] {
  if (!tiers.length) {
    return [{ type: "text", value: "No tiers" }];
  }

  if (tiers.length === 1) {
    if (minFeeVnd === 0) {
      return [{ type: "emphasis", value: formatKensynPercent(tiers[0].percentage) }];
    }
    return [
      { type: "emphasis", value: formatKensynPercent(tiers[0].percentage) },
      { type: "text", value: " with minimum fee of " },
      { type: "emphasis", value: formatCurrency(minFeeVnd) },
    ];
  }

  const parts: RuleFragment[] = [];
  tiers.forEach((tier, idx) => {
    if (idx > 0) parts.push({ type: "text", value: " — " });
    parts.push({ type: "emphasis", value: formatKensynPercent(tier.percentage) });

    if (idx === 0 && tiers.length > 1) {
      parts.push({ type: "text", value: " for amounts below " });
      parts.push({
        type: "emphasis",
        value: formatCurrency(tiers[1].minAmount),
      });
    } else if (idx === tiers.length - 1) {
      parts.push({ type: "text", value: " for amounts from " });
      parts.push({
        type: "emphasis",
        value: formatCurrency(tier.minAmount),
      });
      parts.push({ type: "text", value: " and up" });
    } else {
      parts.push({ type: "text", value: " from " });
      parts.push({
        type: "emphasis",
        value: formatCurrency(tier.minAmount),
      });
      parts.push({ type: "text", value: " to " });
      parts.push({
        type: "emphasis",
        value: formatCurrency(tiers[idx + 1].minAmount),
      });
    }
  });

  if (minFeeVnd === 0) {
    return parts;
  }

  parts.push({ type: "text", value: " (minimum fee " });
  parts.push({ type: "emphasis", value: formatCurrency(minFeeVnd) });
  parts.push({ type: "text", value: ")" });
  return parts;
}

export function describeEntryFragments(entry: FeeScheduleEntry): RuleFragment[] {
  return describeRuleFragments(entry.tiers, entry.minFeeVnd);
}

// Heuristic: a single-flat 2% with min 10k VND created on/before backend
// install is the bootstrap config. We can't be sure without metadata, so
// only flag when the entry was created without a user (createdByUserId
// undefined) AND the values match the historical bootstrap defaults.
export function isLikelyBootstrap(entry: FeeScheduleEntry): boolean {
  if (entry.createdByUserId !== undefined) return false;
  if (entry.tiers.length !== 1) return false;
  const t = entry.tiers[0];
  return t.minAmount === 0 && t.percentage === 2 && entry.minFeeVnd === 10_000;
}

export function formatActiveRange(
  start: string,
  next: FeeScheduleEntry | null,
): string {
  const startDate = formatKensynDate(start);
  if (!next) return `From ${startDate} onward`;
  return `From ${startDate} to ${formatKensynDate(next.effectiveDate)}`;
}

export function formatKensynDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDaysFromNow(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days > 1) return `in ${days} days`;
  if (days === -1) return "yesterday";
  return `${Math.abs(days)} days ago`;
}
