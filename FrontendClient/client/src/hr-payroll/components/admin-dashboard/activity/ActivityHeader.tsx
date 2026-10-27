import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { Button } from '@hr/components/ui/button';

interface ActivityHeaderProps {
  activitiesCount: number;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const ActivityHeader: React.FC<ActivityHeaderProps> = ({
  activitiesCount,
  isLoading = false,
  onRefresh,
}) => {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="typography-title-medium text-foreground">
            Recent activity
          </h3>
          <span className="typography-body-small text-muted-foreground">
            ({activitiesCount})
          </span>
        </div>
        <p className="typography-body-small text-muted-foreground">
          The latest activity across the system
        </p>
      </div>

      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8 w-8 p-0"
          aria-label="Refresh recent activity"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
};
