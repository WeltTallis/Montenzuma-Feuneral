import { PageHeader } from '@hr/components/shared/PageHeader';
import { EditRequestBadge } from './EditRequestBadge';
import { Plus } from 'lucide-react';

interface TimesheetPageHeaderProps {
  onEditRequestClick?: () => void;
  onAddTimesheet?: () => void;
  userRole?: 'admin' | 'partner';
}

export const TimesheetPageHeader = ({ onEditRequestClick, onAddTimesheet, userRole = 'admin' }: TimesheetPageHeaderProps) => {
  const description = userRole === 'partner'
    ? 'View and manage timesheets'
    : 'View and approve timesheets';

  return (
    <PageHeader
      title="Timesheets"
      description={description}
      actions={onAddTimesheet ? [{ label: 'Add timesheet', onClick: onAddTimesheet, icon: Plus }] : []}
    >
      {onEditRequestClick && (
        <div className="flex items-center">
          <EditRequestBadge onClick={onEditRequestClick} />
        </div>
      )}
    </PageHeader>
  );
};
