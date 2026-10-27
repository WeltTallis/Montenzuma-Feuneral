import { Button } from '@hr/components/ui/button';
import { Plus } from 'lucide-react';
import { EmptyState } from '@hr/components/shared/EmptyState';
import { NoEmployeesFound, NoSearchResults } from '@hr/components/ui/loading-states';

interface EmployeeEmptyStatesProps {
  searchTerm: string;
  onClearSearch: () => void;
  onAddEmployee: () => void;
}

export const EmployeeEmptyStates = ({
  searchTerm,
  onClearSearch,
  onAddEmployee,
}: EmployeeEmptyStatesProps) => {
  if (searchTerm) {
    return (
      <NoSearchResults
        query={searchTerm}
        onClearSearch={onClearSearch}
      />
    );
  }

  return <NoEmployeesFound onAddEmployee={onAddEmployee} />;
};

export const EmployeeTableEmptyState = ({ onAddEmployee }: { onAddEmployee: () => void }) => {
  return (
    <EmptyState
      title="No employees yet"
      description="Add your first employee to get started."
      className="py-8"
    >
      <Button onClick={onAddEmployee} variant="default">
        <Plus className="mr-2 h-4 w-4" />
        Add employee
      </Button>
    </EmptyState>
  );
};
