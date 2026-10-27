import { Clock, DollarSign, Calendar, TrendingUp, CheckCircle, Clock3, AlertCircle, CreditCard, LucideIcon } from 'lucide-react';
import { EmployeeTimesheetSummary } from '@hr/types/api/timesheet.types';
import { formatCurrency } from '@hr/utils/formatters';

export interface TimesheetStatsConfig {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'teal' | 'gray';
}

export const createTimesheetStatsConfig = (summary: EmployeeTimesheetSummary): TimesheetStatsConfig[] => {
  const totalHoursWorked = Object.values(summary.totalHours).reduce((sum, hours) => sum + hours, 0);

  const mainStats: TimesheetStatsConfig[] = [
    {
      title: 'Total hours worked',
      value: `${totalHoursWorked} hours`,
      icon: Clock,
      description: `Average ${summary.averageHoursPerDay} hours per day`,
      color: 'blue'
    },
    {
      title: 'Total amount',
      value: formatCurrency(summary.totalAmount),
      icon: DollarSign,
      description: 'Total earnings',
      color: 'green'
    },
    {
      title: 'Working days',
      value: summary.workingDays,
      icon: Calendar,
      description: 'Days with attendance records',
      color: 'teal'
    },
    {
      title: 'Pending approval',
      value: summary.pendingEntries,
      icon: AlertCircle,
      description: 'Entries awaiting approval',
      color: summary.pendingEntries > 0 ? 'yellow' : 'gray'
    }
  ];

  return mainStats;
};

export const createHourTypeBreakdownStats = (totalHours: Record<string, number>): TimesheetStatsConfig[] => {
  const hourTypeStats: TimesheetStatsConfig[] = [];

  // Color palette for dynamic assignment (7+ colors)
  const colorPalette: Array<'blue' | 'green' | 'red' | 'yellow' | 'teal' | 'gray'> = [
    'blue', 'green', 'yellow', 'teal', 'red', 'gray'
  ];

  // Track color assignments for hour types
  const hourTypeColorMap = new Map<string, 'blue' | 'green' | 'red' | 'yellow' | 'teal' | 'gray'>();
  let colorIndex = 0;

  // Group hour types by category
  const hourTypeGroups: Record<string, { hours: number; color: 'blue' | 'green' | 'red' | 'yellow' | 'teal' | 'gray' }> = {};

  Object.entries(totalHours).forEach(([hourType, hours]) => {
    if (hours === 0) return;

    // Extract hour type from compound string (e.g., "phổ thông.ngày nghỉ.ca ngày" -> "ca ngày")
    const parts = hourType.split('.');
    const simpleHourType = parts[parts.length - 1];

    if (!hourTypeGroups[simpleHourType]) {
      // Assign color dynamically from palette
      if (!hourTypeColorMap.has(simpleHourType)) {
        const assignedColor = colorPalette[colorIndex % colorPalette.length];
        hourTypeColorMap.set(simpleHourType, assignedColor);
        colorIndex++;
      }

      const color = hourTypeColorMap.get(simpleHourType)!;
      hourTypeGroups[simpleHourType] = { hours: 0, color };
    }

    hourTypeGroups[simpleHourType].hours += hours;
  });

  // Convert to stats format
  Object.entries(hourTypeGroups).forEach(([hourType, data]) => {
    hourTypeStats.push({
      title: hourType
        .replace(/tăng ca/gi, 'Overtime')
        .replace(/ca đêm/gi, 'Night shift')
        .replace(/ca ngày/gi, 'Day shift')
        .replace(/ngày thường/gi, 'Weekday')
        .replace(/ngày nghỉ/gi, 'Day off')
        .replace(/ngày lễ/gi, 'Public holiday')
        .replace(/^./, (character) => character.toUpperCase()),
      value: `${data.hours}h`,
      icon: Clock3,
      color: data.color
    });
  });

  return hourTypeStats;
};

export const createApprovalStats = (approvalStats?: EmployeeTimesheetSummary['approvalStats']): TimesheetStatsConfig[] => {
  if (!approvalStats) return [];

  return [
    {
      title: 'Approved',
      value: approvalStats.approved,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Pending approval',
      value: approvalStats.pending,
      icon: Clock,
      color: 'yellow'
    },
    {
      title: 'Rejected',
      value: approvalStats.rejected,
      icon: AlertCircle,
      color: 'red'
    }
  ];
};

export const getPaymentStatusConfig = (paymentStatus?: string) => {
  const statusConfig = {
    pending: { color: 'yellow' as const, icon: Clock, text: 'Pending payment' },
    processing: { color: 'blue' as const, icon: TrendingUp, text: 'Processing' },
    paid: { color: 'green' as const, icon: CheckCircle, text: 'Paid' },
    overdue: { color: 'red' as const, icon: AlertCircle, text: 'Overdue' }
  };

  return statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.pending;
};
