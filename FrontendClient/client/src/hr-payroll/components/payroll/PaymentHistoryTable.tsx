import { useMemo, useCallback } from 'react';
import { Skeleton } from '@hr/components/ui/skeleton';
import { DataTable } from '@hr/components/ui/data-table';
import { EmptyState } from '@hr/components/shared/EmptyState';
import { formatDateTime, formatCurrency } from '@hr/utils/formatters';
import type { ColumnDef, SortingState, OnChangeFn } from '@tanstack/react-table';
import type { PaymentHistory } from '@hr/types/api/payroll.types';

interface PaymentHistoryTableProps {
  data: PaymentHistory[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  } | null;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
}

export function PaymentHistoryTable({ data, isLoading, pagination, sorting, onSortingChange }: PaymentHistoryTableProps) {
  const columns: ColumnDef<PaymentHistory>[] = useMemo(() => [
    {
      id: 'stt',
      header: 'STT',
      enableSorting: false,
      size: 44,
      cell: ({ row }) => {
        const pageOffset = ((pagination?.page || 1) - 1) * (pagination?.pageSize || 20);
        return (
          <div className="text-center typography-data-medium">
            {pageOffset + row.index + 1}
          </div>
        );
      },
    },
    {
      accessorKey: 'employee_name',
      header: 'Employees',
      size: 160,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.employee_name}</span>
      ),
    },
    {
      accessorKey: 'employee_cccd',
      header: 'CCCD',
      size: 130,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.employee_cccd}</span>
      ),
    },
    {
      accessorKey: 'project_name',
      header: 'Projects',
      size: 140,
      cell: ({ row }) => row.original.project_name,
    },
    {
      accessorKey: 'position',
      header: 'Position',
      enableSorting: true,
      size: 130,
      cell: ({ row }) => row.original.position,
    },
    {
      accessorKey: 'total_paid_amount',
      header: 'Amount',
      size: 130,
      cell: ({ row }) => (
        <div className="text-right font-semibold text-emerald-700">
          {formatCurrency(row.original.total_paid_amount)}
        </div>
      ),
    },
    {
      accessorKey: 'paid_date',
      header: 'Payment date',
      size: 150,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDateTime(row.original.paid_date)}</span>
      ),
    },
  ], [pagination?.page, pagination?.pageSize]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <EmptyState
        title="No payment history found"
        description="There are no payments in this date range."
        size="sm"
      />
    );
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      sorting={sorting}
      onSortingChange={onSortingChange}
      showPagination={false}
      caption="Payment history"
    />
  );
}
