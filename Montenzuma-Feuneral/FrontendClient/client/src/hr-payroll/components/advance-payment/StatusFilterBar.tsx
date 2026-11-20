import { memo } from "react";
import { cn } from "@hr/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hr/components/ui/select";
import type { AdvancePaymentRequestStatus } from "@hr/types/api/advance-payment.types";

interface StatusOption {
  value: AdvancePaymentRequestStatus | "all";
  label: string;
  dotClass: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: "all",       label: "All",    dotClass: "" },
  { value: "pending",   label: "Chờ xử lý", dotClass: "bg-amber-400" },
  { value: "completed", label: "Completed",  dotClass: "bg-emerald-500" },
  { value: "failed",    label: "Failed",  dotClass: "bg-red-400" },
  { value: "cancelled", label: "Cancelled",    dotClass: "bg-gray-400" },
];

export interface StatusCounts {
  all?: number;
  pending?: number;
  completed?: number;
  failed?: number;
  cancelled?: number;
}

interface StatusFilterBarProps {
  value: AdvancePaymentRequestStatus | "all";
  onChange: (value: string) => void;
  counts?: StatusCounts;
  triggerClassName?: string;
}

export const StatusFilterBar = memo(function StatusFilterBar({
  value,
  onChange,
  counts,
  triggerClassName,
}: StatusFilterBarProps) {
  const selected = STATUS_OPTIONS.find((o) => o.value === value) ?? STATUS_OPTIONS[0];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={`Status ứng lương: ${selected.label}`} className={cn("h-9 w-auto min-w-32 shrink-0 gap-1.5 text-sm", triggerClassName)}>
        {selected.dotClass && (
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", selected.dotClass)} />
        )}
        <SelectValue>{selected.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => {
          const count = counts?.[opt.value as keyof StatusCounts];
          return (
            <SelectItem key={opt.value} value={opt.value} className="text-sm">
              <div className="flex items-center gap-2">
                {opt.dotClass ? (
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", opt.dotClass)} />
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0" />
                )}
                <span>{opt.label}</span>
                {count !== undefined && count > 0 && (
                  <span className="ml-auto pl-3 text-xs tabular-nums text-muted-foreground font-medium">
                    {count}
                  </span>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
});
