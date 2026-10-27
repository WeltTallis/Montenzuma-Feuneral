import { useSecureModal } from "@hr/hooks/useSecureModal";
import { useProjectData } from "@hr/hooks/projects/useProjectData";
import { AddProjectSheet } from "@hr/components/sheets/AddProjectSheet";
import { CreateProjectData } from "@hr/types/api/project.types";
import { toast } from "@hr/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { useCreateProject } from "@hr/hooks/api/useProjects";

/**
 * Route-based AddProject Modal
 * Integrates with the secure modal system for deep-linking
 */
export function AddProjectModal() {
  const navigate = useNavigate();
  const projectData = useProjectData();
  const createProjectMutation = useCreateProject();

  const modal = useSecureModal('project_create', {
    requiresAuth: true,
    onError: (error) => {
      console.error('AddProjectModal error:', error);
      toast({
        title: "Error",
        description: "An error occurred khi tải modal.",
        variant: "destructive"
      });
    }
  });

  const handleProjectCreate = async (projectData: CreateProjectData) => {
    createProjectMutation.mutate(projectData, {
      onSuccess: () => {
        // Close modal by navigating back
        modal.close();
      }
    });
  };

  const handleClose = () => {
    modal.close();
    navigate(-1); // Go back in history
  };

  return (
    <AddProjectSheet
      isOpen={modal.isOpen}
      onClose={handleClose}
      onProjectCreate={handleProjectCreate}
    />
  );
}