import { memo } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { Button } from '@hr/components/ui/button';
import { EmptyState } from '@hr/components/shared/EmptyState';

export type TimesheetEmptyVariant = 'no-data' | 'no-filter-results';

interface TimesheetEmptyStateProps {
  variant: TimesheetEmptyVariant;
  onAddTimesheet?: () => void;
  onClearFilters?: () => void;
}

export const TimesheetEmptyState = memo(function TimesheetEmptyState({
  variant,
  onAddTimesheet,
  onClearFilters,
}: TimesheetEmptyStateProps) {
  if (variant === 'no-data') {
    return (
      <EmptyState
        title="No timesheet entries for this period"
        description="Start by adding employee timesheets for this period."
        className="rounded-xl border border-dashed border-border bg-muted/20 px-4"
      >
        {onAddTimesheet && (
          <Button size="sm" onClick={onAddTimesheet}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add timesheets
          </Button>
        )}
      </EmptyState>
    );
  }

  if (variant === 'no-filter-results') {
    return (
      <EmptyState
        title="No results found"
        description="Adjust or clear the filters to see more results."
        className="rounded-xl border border-dashed border-border bg-muted/20 px-4"
      >
        {onClearFilters && (
          <Button size="sm" variant="outline" onClick={onClearFilters}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Clear filters
          </Button>
        )}
      </EmptyState>
    );
  }

  return null;
});
