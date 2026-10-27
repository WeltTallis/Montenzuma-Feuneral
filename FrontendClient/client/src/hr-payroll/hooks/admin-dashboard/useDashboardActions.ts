import { toast } from '@hr/components/ui/sonner';
import type { NewEmployee } from '@hr/types/api/dashboard.types';
import { useEmployeeModals } from '@hr/hooks/useModalNavigation';

export const useDashboardActions = () => {
  const { openEmployeeDetails } = useEmployeeModals();

  const handleExport = () => {
    toast({
      title: "Report exported",
      description: "The Excel file has been downloaded.",
    });
  };

  const handleAddEmployee = () => {
    toast({
      title: "Add staff",
      description: "This feature will be available soon.",
    });
  };

  const handleCreateProject = () => {
    toast({
      title: "Create project",
      description: "This feature will be available soon.",
    });
  };

  const handleViewAllActivities = () => {
    toast({
      title: "View all activity",
      description: "Opening the detailed activity page.",
    });
  };

  const handleNotificationSettings = () => {
    toast({
      title: "Notification settings",
      description: "Opening system notification settings.",
    });
  };

  const handleTaskAction = (taskId: number, taskAction: string) => {
    toast({
      title: `${taskAction} completed`,
      description: `The action was completed for task ID ${taskId}.`,
    });
  };

  const handleEmployeeClick = (employee: NewEmployee) => {
    openEmployeeDetails(employee.id.toString());
  };

  const handleProjectClick = (projectId: number) => {
    toast({
      title: "View project details",
      description: `Opening project ID ${projectId}.`,
    });
  };

  const handleNavigateToActivities = () => {
    toast({
      title: "View all activity",
      description: "Opening the detailed activity page.",
    });
  };

  const handleRefresh = () => {
    toast({
      title: "Data refreshed",
      description: "The dashboard data has been updated.",
    });
  };

  return {
    handleExport,
    handleAddEmployee,
    handleCreateProject,
    handleViewAllActivities,
    handleNotificationSettings,
    handleTaskAction,
    handleEmployeeClick,
    handleProjectClick,
    handleNavigateToActivities,
    handleRefresh
  };
};