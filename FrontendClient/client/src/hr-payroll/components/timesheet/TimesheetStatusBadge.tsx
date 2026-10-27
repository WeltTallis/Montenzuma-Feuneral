import { Badge } from '@hr/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@hr/components/ui/tooltip';
import { Clock, CheckCircle, XCircle, AlertCircle, DollarSign } from 'lucide-react';
import { cn } from '@hr/lib/utils';
import { getStatusBadgeClasses } from './utils/timesheetStatusColors';

export type TimesheetStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | undefined;

interface TimesheetStatusBadgeProps {
  status: TimesheetStatus;
  paymentStatus?: PaymentStatus;
  className?: string;
  showTooltip?: boolean;
}

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    icon: AlertCircle,
    variant: 'secondary' as const,
    className: 'bg-muted text-foreground hover:bg-gray-200',
    tooltip: 'Timesheet has not been submitted for approval'
  },
  pending_approval: {
    label: 'Pending approval',
    icon: Clock,
    variant: 'outline' as const,
    className: 'bg-yellow-50 text-amber-800 border-yellow-200 hover:bg-yellow-100',
    tooltip: 'Waiting for an approver to review'
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    variant: 'default' as const,
    className: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
    tooltip: 'Timesheet has been approved'
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    tooltip: 'Timesheet has been rejected'
  }
};

const PAYMENT_STATUS_CONFIG = {
  pending: {
    label: 'Awaiting payment',
    icon: Clock,
    className: 'bg-orange-50 text-orange-700 border-orange-200',
    tooltip: 'Approved and awaiting payment'
  },
  paid: {
    label: 'Paid',
    icon: DollarSign,
    className: 'bg-green-50 text-green-800 border-green-200',
    tooltip: 'Payment completed'
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 border-red-200',
    tooltip: 'Payment failed'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-muted/50 text-foreground border-border',
    tooltip: 'Payment was cancelled'
  }
};

export function TimesheetStatusBadge({
  status,
  paymentStatus,
  className,
  showTooltip = true
}: TimesheetStatusBadgeProps) {
  // Determine the display status - only show payment status if timesheet is approved
  const getDisplayStatus = () => {
    // Only show payment status if timesheet is approved AND payment status exists
    if (status === 'approved' && paymentStatus) {
      return {
        config: PAYMENT_STATUS_CONFIG[paymentStatus],
        isPaymentStatus: true
      };
    }
    // For all other cases (draft, pending_approval, rejected), show approval status
    return {
      config: STATUS_CONFIG[status],
      isPaymentStatus: false
    };
  };

  const { config } = getDisplayStatus();
  const Icon = config.icon;

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1 typography-body-small border',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-48">
          <div className="typography-body-medium">{config.tooltip}</div>
          {status === 'approved' && paymentStatus && (
            <div className="typography-body-small text-muted-foreground mt-1">
              Trạng thái: {STATUS_CONFIG[status].label} → {config.label}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper function to get status color for other components
export function getTimesheetStatusColor(status: TimesheetStatus, paymentStatus?: PaymentStatus) {
  // Only consider payment status if timesheet is approved
  if (status === 'approved' && paymentStatus) {
    return PAYMENT_STATUS_CONFIG[paymentStatus]?.className || STATUS_CONFIG[status].className;
  }
  return STATUS_CONFIG[status].className;
}

// Helper function to get status label
export function getTimesheetStatusLabel(status: TimesheetStatus, paymentStatus?: PaymentStatus) {
  // Only consider payment status if timesheet is approved
  if (status === 'approved' && paymentStatus) {
    return PAYMENT_STATUS_CONFIG[paymentStatus]?.label || STATUS_CONFIG[status].label;
  }
  return STATUS_CONFIG[status].label;
}
