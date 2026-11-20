import { PageHeader } from "@hr/components/shared/PageHeader";
import { Download, Plus, UserCog } from "lucide-react";

interface UserPageHeaderProps {
  onAddUser: () => void;
  onExportUsers: () => void;
  isExporting?: boolean;
}

export const UserPageHeader = ({ onAddUser, onExportUsers, isExporting = false }: UserPageHeaderProps) => {
  return (
    <PageHeader
      title="Users"
      description="Manage user accounts and system access"
      icon={UserCog}
      actions={[
        {
          label: isExporting ? 'Exporting...' : 'Export to Excel',
          onClick: onExportUsers,
          icon: Download,
          variant: 'outline' as const,
          className: isExporting ? 'opacity-50 pointer-events-none' : '',
        },
        {
          label: 'Add user',
          onClick: onAddUser,
          icon: Plus,
          variant: 'default' as const,
        },
      ]}
    />
  );
};
