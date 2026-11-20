import { UserAvatar } from '@hr/components/ui/user-avatar';
import { Calendar, Clock, Building2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '@hr/utils/formatters';
import { formatCurrency } from '@hr/utils/formatters';
import { TimesheetStatusBadge, type TimesheetStatus, type PaymentStatus } from '@hr/components/timesheet/TimesheetStatusBadge';
import type { MobileField, RowAction } from '@hr/components/ui/mobile-table';
import type { Timesheet } from '@hr/types/api/timesheet.types';

interface CreatePartnerTimesheetMobileConfigProps {
  onView?: (timesheet: Timesheet) => void;
  onEdit?: (timesheet: Timesheet) => void;
  onApprove?: (timesheet: Timesheet) => void;
  onReject?: (timesheet: Timesheet) => void;
}

export function createPartnerTimesheetMobileConfig({
  onView,
  onEdit,
  onApprove,
  onReject,
}: CreatePartnerTimesheetMobileConfigProps = {}) {
  const mobileFields: MobileField<Timesheet>[] = [
    {
      key: "project",
      label: "Projects",
      priority: 2,
      render: (timesheet) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="typography-body-small text-foreground line-clamp-1">
              {timesheet.projectName}
            </span>
          </div>
          {timesheet.projectCode && (
            <div className="typography-body-small text-muted-foreground">
              #{timesheet.projectCode}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "period",
      label: "Kỳ công",
      priority: 2,
      render: (timesheet) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 typography-body-small text-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>{timesheet.period}</span>
          </div>
          {timesheet.weekRange && (
            <div className="typography-body-small text-muted-foreground">
              {timesheet.weekRange}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "hours",
      label: "Shift",
      priority: 1,
      render: (timesheet) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="typography-data-small tabular-nums font-semibold text-foreground">
              {timesheet.totalHours}h
            </span>
          </div>
          {timesheet.regularHours !== undefined && timesheet.overtimeHours !== undefined && (
            <div className="typography-body-small text-muted-foreground">
              Thường: {timesheet.regularHours}h • TC: {timesheet.overtimeHours}h
            </div>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      label: "Total amount",
      priority: 2,
      render: (timesheet) => {
        if (!timesheet.totalAmount) return (
          <span className="typography-body-small text-muted-foreground">
            Chưa tính
          </span>
        );

        return (
          <div className="typography-data-small tabular-nums font-semibold text-foreground">
            {formatCurrency(timesheet.totalAmount)}
          </div>
        );
      },
    },
    {
      key: "paid_amount",
      label: "Số tiền đã trả",
      priority: 3,
      render: (timesheet) => {
        if (!timesheet.paid_amount) return (
          <span className="typography-body-small text-muted-foreground">
            0₫
          </span>
        );

        return (
          <div className="typography-data-small tabular-nums font-semibold text-emerald-700">
            {formatCurrency(timesheet.paid_amount)}
          </div>
        );
      },
    },
    {
      key: "paid_at",
      label: "Payment date",
      priority: 3,
      render: (timesheet) => {
        if (!timesheet.paid_at) return (
          <span className="typography-body-small text-muted-foreground">
            -
          </span>
        );

        return (
          <div className="typography-body-small text-muted-foreground">
            {formatDate(timesheet.paid_at, 'short')}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      priority: 1,
      render: (timesheet) => {
        const status = timesheet.status as TimesheetStatus;
        const paymentStatus = timesheet.payment_status as PaymentStatus | undefined;

        return (
          <TimesheetStatusBadge
            status={status}
            paymentStatus={paymentStatus}
            showTooltip={false}
          />
        );
      },
    },
  ];

  const rowActions: RowAction<Timesheet>[] = [
    {
      label: "Xem chi tiết",
      icon: <FileText className="h-4 w-4" />,
      onClick: (timesheet: Timesheet) => onView?.(timesheet),
      variant: "default",
    },
  ];

  // Add conditional actions for pending timesheets
  if (onApprove || onReject) {
    rowActions.push(
      {
        label: "Approve",
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: (timesheet: Timesheet) => onApprove?.(timesheet),
        variant: "default",
      },
      {
        label: "Loại",
        icon: <XCircle className="h-4 w-4" />,
        onClick: (timesheet: Timesheet) => onReject?.(timesheet),
        variant: "destructive",
      }
    );
  }

  const rowTitle = (timesheet: Timesheet) => (
    <div className="flex items-center gap-3">
      <UserAvatar
        name={timesheet.employeeName}
        email={timesheet.employeeEmail}
        size="md"
      />
      <div className="typography-body-medium font-medium text-foreground line-clamp-1">
        {timesheet.employeeName}
      </div>
    </div>
  );

  const rowSubtitle = (timesheet: Timesheet) => (
    <div className="flex items-center gap-2 typography-body-small text-muted-foreground">
      <span>{timesheet.period}</span>
      <span>•</span>
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span className="tabular-nums">{timesheet.totalHours} giờ</span>
      </div>
      <span>•</span>
      <span className="line-clamp-1">{timesheet.projectName}</span>
    </div>
  );

  return {
    mobileFields,
    rowActions,
    rowTitle,
    rowSubtitle,
  };
}
