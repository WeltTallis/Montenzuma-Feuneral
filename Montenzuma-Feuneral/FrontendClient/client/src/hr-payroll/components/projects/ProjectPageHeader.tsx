import { PageHeader } from '@hr/components/shared/PageHeader';
import { Plus, Briefcase } from 'lucide-react';

interface ProjectPageHeaderProps {
  onCreateProject: () => void;
  onAssignEmployees?: () => void;
  onGenerateReport?: () => void;
}

export const ProjectPageHeader = ({ onCreateProject }: ProjectPageHeaderProps) => {
  return (
    <PageHeader
      title="Projects"
      description="View and manage all company projects"
      icon={Briefcase}
      actions={[
        {
          label: 'Create project',
          onClick: onCreateProject,
          icon: Plus,
          variant: 'default' as const,
        },
      ]}
    />
  );
};
