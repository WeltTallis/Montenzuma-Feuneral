import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@hr/components/ui/badge';
import { Timesheet } from '@hr/types/api/timesheet.types';
import { getStatusBadgeClasses } from './timesheetStatusColors';

export const getStatusBadge = (status: Timesheet['status']) => {
  const variants = {
    approved: { variant: 'outline' as const, text: 'Approved', className: 'bg-blue-50 text-blue-800 border-blue-200' },
    pending_approval: { variant: 'outline' as const, text: 'Pending approval', className: 'bg-yellow-50 text-amber-800 border-yellow-200' },
    rejected: { variant: 'outline' as const, text: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
    draft: { variant: 'outline' as const, text: 'Draft', className: 'bg-muted text-foreground' }
  };

  const config = variants[status] || variants.draft;
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.text}
    </Badge>
  );
};

export const getMergedStatusBadge = (approvalStatus: Timesheet['status'], paymentStatus?: Timesheet['payment_status']) => {
  // Priority: approval status first, then payment status if approved
  if (approvalStatus === 'rejected') {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        Rejected
      </Badge>
    );
  }

  if (approvalStatus === 'pending_approval') {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-amber-800 border-yellow-200">
        Pending approval
      </Badge>
    );
  }

  if (approvalStatus === 'draft') {
    return (
      <Badge variant="outline" className="bg-muted text-foreground">
        Draft
      </Badge>
    );
  }

  // If approved, show payment status
  if (approvalStatus === 'approved') {
    const paymentVariants = {
      paid: { variant: 'outline' as const, text: 'Paid', className: 'bg-green-50 text-green-800 border-green-200' },
      pending: { variant: 'outline' as const, text: 'Approved', className: 'bg-blue-50 text-blue-800 border-blue-200' },
      failed: { variant: 'outline' as const, text: 'Failed', className: 'bg-red-50 text-red-700 border-red-200' },
      cancelled: { variant: 'outline' as const, text: 'Cancelled', className: 'bg-muted/50 text-foreground border-border' }
    };

    const config = paymentVariants[paymentStatus as keyof typeof paymentVariants] || paymentVariants.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    );
  }

  // Fallback
  return getStatusBadge(approvalStatus);
};

export const getPaytypeText = (paytype: string) => {
  if (!paytype) return '-';

  // Handle complex paytype formats like "position.dayType.hourType"
  if (paytype.includes('.')) {
    const parts = paytype.split('.');

    if (parts.length === 3) {
      // Full format: position.dayType.hourType
      const [position, dayType, hourType] = parts;
      return `${position} - ${dayType} - ${hourType}`;
    } else if (parts.length === 2) {
      // Partial format: dayType.hourType or position.hourType
      const [first, second] = parts;
      return `${first} - ${second}`;
    } else {
      // Single part with dots, return as-is
      return paytype;
    }
  }

  // Single value without dots, return as-is
  return paytype;
};

export const getKenyanWeekdayInfo = (dateInput: string | Date | null | undefined) => {
  if (!dateInput) return null;

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return null;

  const dayIndex = date.getDay(); // 0 = Sunday, 6 = Saturday
  const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

  return {
    label: labels[dayIndex],
    dayIndex,
    isSunday: dayIndex === 0,
    isSaturday: dayIndex === 6
  };
};

export const formatDate = (date: string, formatType: 'default' | 'short' = 'default') => {
  if (!date) return '-';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  const pattern = formatType === 'short' ? 'dd/MM' : 'dd/MM/yyyy';
  return format(parsed, pattern);
};

export const formatDateWithWeekday = (date: string, formatType: 'default' | 'short' = 'default') => {
  if (!date) return '-';

  const base = formatDate(date, formatType);
  const weekdayInfo = getKenyanWeekdayInfo(date);

  if (!weekdayInfo) return base;
  return `${base} • ${weekdayInfo.label}`;
};
