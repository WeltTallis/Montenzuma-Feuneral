import { useMemo } from "react";
import { GroupedStatCard } from "@hr/components/shared/GroupedStatCard";
import { useProjectsSummary } from "@hr/hooks/api/useProjects";
import { formatBudgetDisplay } from "@hr/utils/projectHelpers";
import { Briefcase } from "lucide-react";

export const ProjectStats = () => {
  const { data: summary, isLoading } = useProjectsSummary();

  const stats = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Active", value: summary.total_active_projects },
      { label: "Tổng đã nhận", value: formatBudgetDisplay(summary.total_received_vnd) },
      { label: "Tổng đã chi", value: formatBudgetDisplay(summary.total_payout_vnd) },
      { label: "Chờ chi", value: formatBudgetDisplay(summary.total_pending_payable_vnd) },
      { label: "Chờ thu", value: formatBudgetDisplay(summary.total_pending_receivable_vnd) },
    ];
  }, [summary]);

  return (
    <GroupedStatCard
      title="Projects"
      icon={Briefcase}
      stats={stats}
      isLoading={isLoading}
    />
  );
};
