import { useMemo } from "react";

import { Badge } from "@hr/components/ui/badge";
import { Skeleton } from "@hr/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@hr/components/ui/table";
import { EmptyState } from "@hr/components/shared/EmptyState";

import { formatCurrency, formatDate } from "@hr/utils/formatters";
import type { FeeScheduleEntry } from "@hr/types/api/advance-payment-fee-schedule.types";

interface Props {
  entries: FeeScheduleEntry[];
  isLoading: boolean;
}

export const FeeScheduleList = ({
  entries,
  isLoading,
}: Props) => {
  const sorted = useMemo(
    () =>
      [...entries].sort((a, b) =>
        a.effectiveDate < b.effectiveDate ? 1 : -1,
      ),
    [entries],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <EmptyState
        title="Chưa có cấu hình phí"
        description="Thêm cấu hình đầu tiên để bắt đầu áp dụng cho các giao dịch ứng lương"
      />
    );
  }

  return (
    <div tabIndex={0} role="region" aria-label="Lịch sử cấu hình phí ứng lương" className="rounded-lg border overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ngày hiệu lực</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cấu trúc phí</TableHead>
            <TableHead>Phí tối thiểu</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {formatDate(entry.effectiveDate)}
                </TableCell>
                <TableCell>
                  {entry.isCurrentlyActive && (
                    <Badge>Active</Badge>
                  )}
                  {entry.isPending && (
                    <Badge variant="secondary">Đang chờ</Badge>
                  )}
                  {!entry.isCurrentlyActive && !entry.isPending && (
                    <Badge variant="outline">Đã hết hạn</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{entry.summary}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatCurrency(entry.minFeeVnd)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                  {entry.notes ?? ""}
                </TableCell>
              </TableRow>
            ))}

        </TableBody>
      </Table>
    </div>
  );
};
