/**
 * Table column definitions and mobile fields for the Loans page.
 * Extracted from LoansPage.tsx to keep the page component focused on layout/state.
 */
import type { ColumnDef } from "@tanstack/react-table";
import type { MobileField } from "@hr/components/ui/responsive-table";
import type { Loan } from "@hr/types/api/loan.types";
import { format } from "date-fns";
// W13c: lucide → verified @untitledui/icons.
import { Bank } from "@untitledui/icons";
import { EmptyState } from "@hr/components/shared/EmptyState";
import { formatVND, daysUntil, getPaymentUrgencyColor } from "@hr/utils/loanHelpers";

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

export const loanColumns: ColumnDef<Loan>[] = [
  {
    accessorKey: "loan_code",
    header: "Loan code",
    cell: ({ row }) => (
      <div className="font-mono typography-body-medium font-medium">
        {row.original.loan_code}
      </div>
    ),
  },
  {
    accessorKey: "lender",
    header: "Lender",
    cell: ({ row }) => (
      <div className="typography-body-medium">{row.original.lender.name}</div>
    ),
  },
  {
    accessorKey: "principal_amount",
    header: "Principal",
    cell: ({ row }) => (
      <div className="typography-body-medium">
        {formatVND(row.original.principal_amount)}
      </div>
    ),
  },
  {
    accessorKey: "interest_rate_bps",
    header: "Interest rate (% per year)",
    cell: ({ row }) => (
      <div className="typography-body-medium">
        {row.original.interest_rate_bps !== null &&
        row.original.interest_rate_bps !== undefined ? (
          `${row.original.interest_rate_bps / 100}%`
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "next_payment_date",
    header: "Next payment date",
    cell: ({ row }) => {
      const nextPaymentDate = row.original.next_payment_date;
      if (!nextPaymentDate) {
        return <span className="typography-body-small text-muted-foreground">-</span>;
      }
      const urgencyColor = getPaymentUrgencyColor(daysUntil(nextPaymentDate));
      return (
        <div className={`typography-body-small font-semibold ${urgencyColor}`}>
          {format(new Date(nextPaymentDate), 'dd/MM/yyyy')}
        </div>
      );
    },
  },
  {
    accessorKey: "next_payment_amount",
    header: "Next payment amount",
    cell: ({ row }) => {
      const nextPaymentAmount = row.original.next_payment_amount;
      if (!nextPaymentAmount) {
        return <span className="typography-body-small text-muted-foreground">-</span>;
      }
      return (
        <div className="typography-body-medium font-semibold">
          {formatVND(nextPaymentAmount)}
        </div>
      );
    },
  },
  {
    accessorKey: "disbursement_date",
    header: "Disbursement date",
    cell: ({ row }) => {
      const disbursementDate = row.original.disbursement_date;
      return (
        <div className="typography-body-small">
          {disbursementDate ? (
            format(new Date(disbursementDate), 'dd/MM/yyyy')
          ) : (
            <span className="text-muted-foreground italic">Not disbursed</span>
          )}
        </div>
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Mobile fields
// ---------------------------------------------------------------------------

export const loanMobileFields: MobileField<Loan>[] = [
  {
    key: "loan_code",
    label: "Loan code",
    priority: 1,
    render: (row) => (
      <div className="font-mono typography-body-medium font-medium">
        {row.loan_code}
      </div>
    ),
  },
  {
    key: "lender",
    label: "Lender",
    priority: 1,
    render: (row) => (
      <div className="typography-body-medium">{row.lender.name}</div>
    ),
  },
  {
    key: "principal_amount",
    label: "Principal",
    priority: 2,
    render: (row) => (
      <div className="typography-body-medium">{formatVND(row.principal_amount)}</div>
    ),
  },
  {
    key: "interest_rate_bps",
    label: "Interest rate",
    priority: 2,
    render: (row) => (
      <div className="typography-body-medium">
        {row.interest_rate_bps !== null && row.interest_rate_bps !== undefined ? (
          `${row.interest_rate_bps / 100}%`
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    ),
  },
  {
    key: "next_payment_date",
    label: "Next payment",
    priority: 2,
    render: (row) => {
      const nextPaymentDate = row.next_payment_date;
      if (!nextPaymentDate) {
        return <span className="typography-body-small text-muted-foreground">-</span>;
      }
      const urgencyColor = getPaymentUrgencyColor(daysUntil(nextPaymentDate));
      return (
        <div className={`typography-body-small font-semibold ${urgencyColor}`}>
          {format(new Date(nextPaymentDate), 'dd/MM/yyyy')}
        </div>
      );
    },
  },
  {
    key: "next_payment_amount",
    label: "Next payment amount",
    priority: 2,
    render: (row) => (
      <div className="typography-body-medium font-semibold">
        {row.next_payment_amount ? (
          formatVND(row.next_payment_amount)
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    ),
  },
  {
    key: "disbursement_date",
    label: "Disbursement date",
    priority: 2,
    render: (row) => (
      <div className="typography-body-small">
        {row.disbursement_date ? (
          format(new Date(row.disbursement_date), 'dd/MM/yyyy')
        ) : (
          <span className="text-muted-foreground italic">Not disbursed</span>
        )}
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Lender mobile fields
// ---------------------------------------------------------------------------

import type { Lender } from "@hr/types/api/loan.types";

export const lenderMobileFields: MobileField<Lender>[] = [
  {
    key: "name",
    label: "Lender name",
    priority: 1,
    render: (row) => (
      <div className="typography-body-medium font-medium">{row.name}</div>
    ),
  },
  {
    key: "cccd",
    label: "CCCD",
    priority: 2,
    render: (row) => (
      <div className="typography-body-small text-muted-foreground font-mono">
        {row.cccd || "-"}
      </div>
    ),
  },
  {
    key: "email",
    label: "Email",
    priority: 2,
    render: (row) => (
      <div className="typography-body-small text-muted-foreground">
        {row.email || "-"}
      </div>
    ),
  },
  {
    key: "mobile",
    label: "Phone number",
    priority: 2,
    render: (row) => (
      <div className="typography-body-small text-muted-foreground">
        {row.mobile || "-"}
      </div>
    ),
  },
  {
    key: "created_at",
    label: "Created on",
    priority: 2,
    render: (row) => (
      <div className="typography-body-small">
        {format(new Date(row.created_at), "dd/MM/yyyy")}
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export const loansEmptyState = (
  <EmptyState
    title="No loans yet"
    description="Create your first loan to get started."
    size="sm"
  />
);

// ---------------------------------------------------------------------------
// Column sort field mapping
// ---------------------------------------------------------------------------

export const loanSortFieldMap: Record<string, string> = {
  loan_code: "loan_code",
  lender: "lender_id",
  principal_amount: "principal_amount",
  interest_rate_bps: "interest_rate_bps",
  next_payment_date: "next_payment_date",
  next_payment_amount: "next_payment_amount",
  disbursement_date: "disbursement_date",
  created_at: "created_at",
};
