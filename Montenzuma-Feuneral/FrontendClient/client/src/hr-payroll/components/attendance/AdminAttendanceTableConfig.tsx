import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Check, DotsHorizontal, MarkerPin01, X, Zap } from "@untitledui/icons";
import { formatCurrency } from "@hr/utils/formatters";
import { formatKenyaTime } from "@hr/utils/ke-time";
import type { AdminAttendanceResponse } from "@hr/types/api/attendance.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@hr/components/ui/dropdown-menu";
import { cn } from "@hr/lib/utils";
import {
  canApproveAttendance,
  canCreditAttendanceQuota,
  canRejectAttendance,
  getAttendanceOperationalStatus,
  getAttendanceReviewStatusLabel,
  needsAttendanceApprovalRepair,
} from "@hr/utils/attendanceReviewState";

/** Row-action callbacks wired by the page. Each is optional so the table can
 * render without them (e.g. read-only contexts). */
export interface AttendanceRowActions {
  onViewMap: (row: AdminAttendanceResponse) => void;
  onApprove: (row: AdminAttendanceResponse) => void;
  onReject: (row: AdminAttendanceResponse) => void;
  /** Admin-only "credit now": bank a completed shift's earning into the
   * advance quota immediately, skipping the post-checkout hold. Omitted by
   * pages for roles without the admin attendance endpoints. */
  onCreditQuota?: (row: AdminAttendanceResponse) => void;
}

const SYSTEM_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  checked_in: { label: "Checked in", className: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200" },
  orphaned: { label: "Missing check-out", className: "bg-red-50 text-red-700 border-red-200" },
  rejected: { label: "Rejected", className: "bg-orange-50 text-orange-700 border-orange-200" },
};

const REVIEW_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Cancelled", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

function StatusBadges({
  status,
  reviewAction,
  checkOutTime,
  quotaCreditedAt,
  earningAmount,
}: {
  status: string;
  reviewAction?: AdminAttendanceResponse["review_action"];
  checkOutTime?: string | null;
  quotaCreditedAt?: string | null;
  earningAmount?: number;
}) {
  const attendance = {
    status,
    review_action: reviewAction,
    check_out_time: checkOutTime,
    quota_credited_at: quotaCreditedAt,
    earning_amount: earningAmount,
  };
  const reviewStatusLabel = getAttendanceReviewStatusLabel(attendance);
  if (needsAttendanceApprovalRepair(attendance)) {
    return (
      <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
        {reviewStatusLabel}
      </div>
    );
  }
  if (reviewAction === "approved") {
    const review = REVIEW_BADGE_CONFIG.approved;
    return (
      <div className={cn("inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs font-semibold", review.className)}>
        <Check className="h-2.5 w-2.5" aria-hidden="true" />
        {reviewStatusLabel ?? review.label}
      </div>
    );
  }
  const operationalStatus = getAttendanceOperationalStatus(attendance);
  const sys = SYSTEM_STATUS_CONFIG[operationalStatus] ??   { label: "Unknown", className: "bg-gray-100 text-gray-600 border-gray-300" };
  const review = reviewAction ? REVIEW_BADGE_CONFIG[reviewAction] : null;
  return (
    <div className="flex flex-col items-start gap-1">
      <div className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border", sys.className)}>
        {sys.label}
      </div>
      {review && (
        <div className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold border", review.className)}>
          <X className="h-2.5 w-2.5" aria-hidden="true" />
          {reviewStatusLabel ?? review.label}
        </div>
      )}
      {canCreditAttendanceQuota(attendance) && (
        <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700">
          Pending advance credit
        </div>
      )}
    </div>
  );
}

export function getAdminAttendanceColumns(actions?: AttendanceRowActions): ColumnDef<AdminAttendanceResponse>[] {
  const cols: ColumnDef<AdminAttendanceResponse>[] = [
    {
      accessorKey: "employee_name",
      header: "Employee",
      size: 150,
      cell: ({ row }) => (
        <div>
          <div className="text-xs font-medium leading-tight">{row.original.employee_name}</div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[140px]">
            {row.original.project_name || "-"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      size: 100,
      cell: ({ row }) => {
        try {
          return <span className="text-xs font-medium">{format(new Date(row.original.date), "dd/MM/yyyy")}</span>;
        } catch {
          return <span className="text-xs">{row.original.date}</span>;
        }
      },
    },
    {
      id: "check_in",
      header: "Clock in",
      size: 130,
      cell: ({ row }) => {
        if (!row.original.check_in_time) return <span className="text-xs text-muted-foreground">-</span>;
        try {
          return (
            <div>
              <div className="text-xs font-medium text-fg-secondary">{formatKenyaTime(row.original.check_in_time) || "-"}</div>
              <div className="text-xs text-muted-foreground truncate max-w-[120px]">{row.original.check_in_gate || "Not specified"}</div>
            </div>
          );
        } catch {
          return <span className="text-xs">{row.original.check_in_time}</span>;
        }
      }
    },
    {
      id: "check_out",
      header: "Clock out",
      size: 130,
      cell: ({ row }) => {
        if (!row.original.check_out_time) return <span className="text-xs text-muted-foreground">-</span>;
        try {
          return (
            <div>
              <div className="text-xs font-medium text-fg-secondary">{formatKenyaTime(row.original.check_out_time) || "-"}</div>
              <div className="text-xs text-muted-foreground truncate max-w-[120px]">{row.original.check_out_gate || "Not specified"}</div>
            </div>
          );
        } catch {
          return <span className="text-xs">{row.original.check_out_time}</span>;
        }
      }
    },
    {
      accessorKey: "earning_amount",
      header: "Earnings",
      size: 110,
      cell: ({ row }) => {
        const amount = row.original.earning_amount;
        if (amount == null) return <span className="text-xs text-muted-foreground">-</span>;
        return <span className="text-xs font-bold text-success">{formatCurrency(amount)}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 120,
      cell: ({ row }) => (
        <StatusBadges
          status={row.original.status}
          reviewAction={row.original.review_action}
          checkOutTime={row.original.check_out_time}
          quotaCreditedAt={row.original.quota_credited_at}
          earningAmount={row.original.earning_amount}
        />
      ),
    },
  ];

  // Actions column: a kebab menu with View map (always) + Approve/Credit/Reject.
  // The review actions are hidden once the attendance reaches a terminal state:
  // Approve is hidden on completed or approved records; Reject is hidden on
  // rejected records or after the quota is credited; Credit now shows only on
  // completed shifts that have not yet been credited.
  // waiting out their quota-credit hold, and only when the page supplies the
  // (admin-only) callback. Omitted entirely when no callbacks are provided so
  // the table stays read-only in contexts that don't need it.
  if (actions) {
    cols.push({
      id: "actions",
      header: "",
      size: 48,
      cell: ({ row }) => {
        const att = row.original;
        const showApprove = canApproveAttendance(att);
        const showReject = canRejectAttendance(att);
        const onCreditQuota = actions.onCreditQuota;
        const showCreditQuota = onCreditQuota != null && canCreditAttendanceQuota(att);
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Actions"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DotsHorizontal className="h-4 w-4" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => actions.onViewMap(att)}>
                  <MarkerPin01 className="mr-2 h-4 w-4" aria-hidden="true" />
                  View map
                </DropdownMenuItem>
                {showApprove && (
                  <DropdownMenuItem onClick={() => actions.onApprove(att)}>
                    <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                    {needsAttendanceApprovalRepair(att) ? "Review again" : "Approve"}
                  </DropdownMenuItem>
                )}
                {showCreditQuota && (
                  <DropdownMenuItem onClick={() => onCreditQuota(att)}>
                    <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
                    Credit now
                  </DropdownMenuItem>
                )}
                {showReject && (
                  <DropdownMenuItem
                    onClick={() => actions.onReject(att)}
                    className="text-rose-700 focus:text-rose-700"
                  >
                    <X className="mr-2 h-4 w-4" aria-hidden="true" />
                    Reject
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    });
  }

  return cols;
}

export const attendanceMobileFields = [
  {
    key: "date",
    label: "Date",
    render: (row: AdminAttendanceResponse) => {
      try {
        return format(new Date(row.date), "dd/MM/yyyy");
      } catch {
        return row.date;
      }
    }
  },
  {
    key: "check_in_time",
    label: "Check-in",
    render: (row: AdminAttendanceResponse) => row.check_in_time ? formatKenyaTime(row.check_in_time) || "-" : "-"
  },
  {
    key: "check_out_time",
    label: "Check-out",
    render: (row: AdminAttendanceResponse) => row.check_out_time ? formatKenyaTime(row.check_out_time) || "-" : "-"
  },
  {
    key: "earning_amount",
    label: "Earnings",
    render: (row: AdminAttendanceResponse) => row.earning_amount != null ? formatCurrency(row.earning_amount) : "-"
  }
];

export const attendanceEmptyState = {
  title: "No attendance records",
  description: "No attendance records match the current filters.",
};
