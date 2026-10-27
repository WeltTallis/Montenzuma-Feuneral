import { format } from "date-fns";
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@hr/components/ui/badge';
import { Button } from '@hr/components/ui/button';
import { Calendar, Users, Building2, Trash2 } from 'lucide-react';
import { formatDateForDisplay } from '@hr/utils/dateHelpers';
import { getKensynProjectStatus, getProjectStatusVariant } from '@hr/utils/kenyan';
import { getEmployeeCountColor, formatEmployeeCount } from '@hr/utils/projectHelpers';
import type { Project } from '@hr/types/api/project.types';

interface CreatePartnerProjectColumnsProps {
  onRowClick?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  pagination?: {
    page: number;
    pageSize: number;
  };
}

export function createPartnerProjectColumns({
  onRowClick,
  onDelete,
  pagination,
}: CreatePartnerProjectColumnsProps = {}): ColumnDef<Project>[] {
  return [
    {
      id: "stt",
      header: "No.",
      cell: ({ row }) => {
        const baseIndex = pagination
          ? (pagination.page - 1) * pagination.pageSize
          : 0;
        return (
          <div className="typography-body-medium text-center font-medium tabular-nums">
            {baseIndex + row.index + 1}
          </div>
        );
      },
      size: 60,
    },
    {
      id: "name",
      accessorKey: "name",
      header: "Project name",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div 
            className="space-y-1 cursor-pointer group"
            onClick={() => onRowClick?.(project)}
          >
            <div className="typography-body-medium font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {project.name}
            </div>
            <div className="typography-body-small text-muted-foreground line-clamp-1">
              #{project.code}
            </div>
          </div>
        );
      },
    },
    {
      id: "client",
      accessorKey: "client_name",
      header: "Client",
      cell: ({ row }) => {
        const project = row.original;
        const clientName = project.client_name;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="typography-body-medium text-foreground line-clamp-1">
              {clientName || "No information"}
            </span>
          </div>
        );
      },
    },
    {
      id: "dates",
      accessorKey: "start_date",
      header: "Period",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 typography-body-small text-muted-foreground">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>Bắt đầu: {format(new Date(project.start_date), 'dd/MM/yyyy')}</span>
            </div>
            {project.end_date && (
              <div className="flex items-center gap-1 typography-body-small text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>End: {format(new Date(project.end_date), 'dd/MM/yyyy')}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "team_size",
      accessorKey: "employee_count",
      header: "Team size",
      cell: ({ row }) => {
        const project = row.original;
        const count = project.employee_count || 0;
        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className={`typography-data-medium tabular-nums font-semibold ${getEmployeeCountColor(count)}`}>
              {formatEmployeeCount(count)} {count !== 0 ? 'people' : ''}
            </span>
          </div>
        );
      },
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        
        const statusText = getKensynProjectStatus(status as 'draft' | 'active' | 'paused' | 'completed' | 'cancelled') || status || 'Not specified';
        const statusVariant = getProjectStatusVariant(status);

        return (
          <Badge
            variant={statusVariant}
            className="typography-label-small whitespace-nowrap"
          >
            {statusText}
          </Badge>
        );
      },
    },
    ...(onDelete ? [{
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
              className="h-8 w-8 p-0 text-red-700 hover:text-red-700 hover:bg-red-50"
              title="Delete project"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      size: 80,
    }] : []),
  ];
}