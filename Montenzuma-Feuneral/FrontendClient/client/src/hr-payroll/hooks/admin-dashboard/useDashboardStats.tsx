import { useMemo } from 'react';

// Types
import { StatItem } from '@hr/components/shared/GroupedStatCard';

interface DashboardSummary {
  total_employees: number;
  total_working_employees: number;
  employees_hired_this_month: number;
  pending_salary_this_month: number;
  paid_salary_this_month: number;
  avg_weekly_salary: number;
  avg_monthly_salary: number;
  total_weekly_salary_employees: number;
  total_monthly_salary_employees: number;
  total_profit_this_month: number;
  total_profit: number;
  total_paid_salary: number;
  total_revenue: number;
  total_revenue_this_month: number;
}

interface DashboardNavigation {
  navigateToActiveEmployees: () => void;
  navigateToNewEmployees: () => void;
  navigateToSalaryLedger: () => void;
  navigateToPendingApprovals: () => void;
}

interface UseDashboardStatsParams {
  dashboardSummary: DashboardSummary | null;
  totalPendingApprovals: number;
  dashboardNav: DashboardNavigation;
  activityStats?: {
    active_weekly: number;
    active_monthly: number;
    active_flexible: number;
    active_total: number;
    active_by_project?: { project_id: number; project_name: string; count: number }[];
  } | null;
  onActivityClick?: (schedule: 'weekly' | 'monthly' | 'flexible') => void;
}

interface UseDashboardStatsReturn {
  employeeStats: StatItem[];
  salaryStats: StatItem[];
  profitStats: StatItem[];
  activityStats: StatItem[];
  activityProjectStats: StatItem[];
}

export const useDashboardStats = ({
  dashboardSummary,
  totalPendingApprovals,
  dashboardNav,
  activityStats,
  onActivityClick,
}: UseDashboardStatsParams): UseDashboardStatsReturn => {
  // Employee statistics
  const employeeStats = useMemo(() => {
    if (!dashboardSummary) return [];
    return [
      {
        label: 'Total staff',
        value: dashboardSummary.total_employees,
        onClick: dashboardNav.navigateToActiveEmployees,
      },
      {
        label: 'Active',
        value: dashboardSummary.total_working_employees,
        onClick: dashboardNav.navigateToActiveEmployees,
      },
      {
        label: 'New this period',
        value: dashboardSummary.employees_hired_this_month,
        onClick: dashboardNav.navigateToNewEmployees,
      },
    ] as StatItem[];
  }, [dashboardSummary, dashboardNav]);

  // Combined salary statistics
  const salaryStats = useMemo(() => {
    const stats: StatItem[] = [];

    if (dashboardSummary) {
      stats.push(
        {
          label: 'Awaiting payment',
          value: dashboardSummary.pending_salary_this_month,
          unit: ' ₫',
          onClick: dashboardNav.navigateToSalaryLedger,
        },
        {
          label: 'Paid this period',
          value: dashboardSummary.paid_salary_this_month,
          unit: ' ₫',
          onClick: dashboardNav.navigateToSalaryLedger,
        },
        {
          label: 'Total paid',
          value: dashboardSummary.total_paid_salary,
          unit: ' ₫',
          onClick: dashboardNav.navigateToSalaryLedger,
        }
      );
    }

    stats.push({
      label: 'Pending approval',
      value: totalPendingApprovals,
      onClick: dashboardNav.navigateToPendingApprovals,
    });

    return stats;
  }, [dashboardSummary, totalPendingApprovals, dashboardNav]);

  // Profit & Revenue statistics
  const profitStats = useMemo(() => {
    if (!dashboardSummary) return [];
    return [
      {
        label: 'Revenue this month',
        value: dashboardSummary.total_revenue_this_month,
        unit: ' ₫',
      },
      {
        label: 'Profit this month',
        value: dashboardSummary.total_profit_this_month,
        unit: ' ₫',
      },
      {
        label: 'Total revenue',
        value: dashboardSummary.total_revenue,
        unit: ' ₫',
      },
      {
        label: 'Total profit',
        value: dashboardSummary.total_profit,
        unit: ' ₫',
      },
    ] as StatItem[];
  }, [dashboardSummary]);

  // Employee activity stats (logins by schedule type for selected month)
  const activityStatItems = useMemo(() => {
    if (!activityStats) return [];
    return [
      {
        label: 'Weekly payroll',
        value: activityStats.active_weekly,
        onClick: onActivityClick ? () => onActivityClick('weekly') : undefined,
      },
      {
        label: 'Monthly payroll',
        value: activityStats.active_monthly,
        onClick: onActivityClick ? () => onActivityClick('monthly') : undefined,
      },
      {
        label: 'Flexible payroll',
        value: activityStats.active_flexible,
        onClick: onActivityClick ? () => onActivityClick('flexible') : undefined,
      },
    ] as StatItem[];
  }, [activityStats, onActivityClick]);

  // Active logins per project (same month/window as the schedule rows).
  const activityProjectStatItems = useMemo(() => {
    return (activityStats?.active_by_project ?? []).map((project) => ({
      label: project.project_name,
      value: project.count,
    })) as StatItem[];
  }, [activityStats]);

  return {
    employeeStats,
    salaryStats,
    profitStats,
    activityStats: activityStatItems,
    activityProjectStats: activityProjectStatItems,
  };
};
