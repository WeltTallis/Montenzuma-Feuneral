import { PageHeader } from '@hr/components/shared/PageHeader';
import { Plus, Download, PhoneOff, PhoneIncoming, Users } from 'lucide-react';
import { useAuth } from '@hr/contexts';

interface EmployeePageHeaderProps {
  totalEmployees: number;
  onAddEmployeeClick: () => void;
  onExportClick?: () => void;
  onExportNoMobileClick?: () => void;
  onImportMobilesClick?: () => void;
  onSearchFocus?: () => void;
  isExporting?: boolean;
}

export const EmployeePageHeader = ({
  totalEmployees,
  onAddEmployeeClick,
  onExportClick,
  onExportNoMobileClick,
  onImportMobilesClick,
  isExporting = false,
}: EmployeePageHeaderProps) => {
  const { user } = useAuth();

  return (
    <PageHeader
      title="Employees"
      description={`Manage ${totalEmployees} employees in the system`}
      icon={Users}
      actions={[
        ...(onExportClick && (user?.role === 'admin' || user?.role === 'partner') ? [{
          label: isExporting ? 'Exporting...' : 'Export to Excel',
          onClick: onExportClick,
          icon: Download,
          variant: 'outline' as const,
          className: isExporting ? 'opacity-50 pointer-events-none' : '',
        }] : []),
        ...(onExportNoMobileClick && user?.role === 'admin' ? [{
          label: isExporting ? 'Exporting...' : 'Employees without a phone number',
          onClick: onExportNoMobileClick,
          icon: PhoneOff,
          variant: 'outline' as const,
          className: isExporting ? 'opacity-50 pointer-events-none' : '',
        }] : []),
        ...(onImportMobilesClick && user?.role === 'admin' ? [{
          label: 'Import phone numbers',
          onClick: onImportMobilesClick,
          icon: PhoneIncoming,
          variant: 'outline' as const,
        }] : []),
        {
          label: 'Add employee',
          onClick: onAddEmployeeClick,
          icon: Plus,
          variant: 'default' as const,
        },
      ]}
    />
  );
};
