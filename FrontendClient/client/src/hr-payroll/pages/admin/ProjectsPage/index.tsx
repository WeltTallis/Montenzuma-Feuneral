import { useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ResponsiveTable } from "@hr/components/ui/responsive-table";
import {
  AdminPageCanvas,
  AdminPageHeaderCard,
  AdminSectionCard,
  AdminFilterRow,
} from "@hr/components/shared/AdminPageFrame";
import { ProjectPageHeader } from "@hr/components/projects/ProjectPageHeader";
import { ProjectFilters } from "@hr/components/projects/ProjectFilters";
import { useProjects } from "@hr/hooks/api/useProjects";
import { useProjectFilters } from "@hr/hooks/projects/useProjectFilters";
import { useProjectModals } from "@hr/hooks/useModalNavigation";
import { createProjectColumns } from "@hr/config/project-table-columns";
import { createProjectMobileConfig } from "@hr/config/project-table-mobile";
import { Skeleton } from "@hr/components/ui/skeleton";
import { EmptyState } from "@hr/components/shared/EmptyState";
import { ErrorState } from "@hr/components/ui/error-state";
import { useTableSorting } from "@hr/utils/sorting";

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterControls = useProjectFilters({
    initialFilters: {
      page: 1,
      pageSize: 10,
    }
  });

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      newParams.set('modal', 'project_create');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { setStatusFilter } = filterControls;
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'active') {
      setStatusFilter(['active']);
    }
  }, [searchParams, setStatusFilter]);

  const { data: response, isLoading, isError, refetch } = useProjects(filterControls.apiFilters);
  const projects = response?.data || [];

  const handleSortChange = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    filterControls.setSortBy(newSortBy);
    filterControls.setSortOrder(newSortOrder);
  }, [filterControls]);

  const { sorting, onSortingChange } = useTableSorting(
    filterControls.sortBy,
    filterControls.sortOrder,
    handleSortChange,
  );

  const { openCreateProject, openProjectDetails } = useProjectModals();

  const columns = useMemo(() => createProjectColumns({
    pagination: response?.pagination
  }), [response?.pagination]);

  const mobileConfig = createProjectMobileConfig({});

  if (isLoading && projects.length === 0) {
    return (
      <AdminPageCanvas>
        <AdminPageHeaderCard>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-72" />
        </AdminPageHeaderCard>
        <AdminSectionCard>
          <Skeleton className="m-3 h-11 rounded-xl sm:m-4" />
          <div className="border-t border-utility-gray-200">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-utility-gray-200 px-4 py-4 last:border-b-0">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))}
          </div>
        </AdminSectionCard>
      </AdminPageCanvas>
    );
  }

  return (
    <AdminPageCanvas>
      <AdminPageHeaderCard>
        <ProjectPageHeader onCreateProject={() => openCreateProject()} />
      </AdminPageHeaderCard>

      <AdminSectionCard aria-label="Project list">
        <AdminFilterRow>
          <p className="text-sm font-semibold text-foreground">Projects</p>
          <div className="flex flex-1 items-center justify-end">
            <ProjectFilters
              searchTerm={filterControls.searchTerm}
              onSearchChange={filterControls.setSearchTerm}
              statusFilter={filterControls.statusFilter}
              onStatusChange={filterControls.setStatusFilter}
              monthFilter={filterControls.monthFilter}
              onMonthFilterChange={filterControls.setMonthFilter}
              hasFilters={filterControls.hasFilters}
              onClearFilters={filterControls.clearFilters}
              className="rounded-none border-0 bg-transparent px-0 py-0 backdrop-blur-none"
            />
          </div>
        </AdminFilterRow>

        {isError ? (
          <div role="alert">
            <ErrorState message="Could not load projects. Please try again." onRetry={() => void refetch()} className="px-4" />
          </div>
        ) : (
        <ResponsiveTable
          data={projects}
          columns={columns}
          mobileFields={mobileConfig.mobileFields}
          rowTitle={mobileConfig.rowTitle}
          rowSubtitle={mobileConfig.rowSubtitle}
          getRowId={(row) => row.id.toString()}
          onRowClick={(project) => openProjectDetails(project.id.toString())}
          pagination={response?.pagination}
          onPageChange={filterControls.setPage}
          onPageSizeChange={filterControls.setPageSize}
          sorting={sorting}
          onSortingChange={onSortingChange}
          emptyState={
            <EmptyState
              title="No projects found"
              description={filterControls.hasFilters
                ? "No projects match your search. Try changing your search or clearing the filters."
                : "Create your first project to start managing employees and payroll."}
              action={filterControls.hasFilters
                ? { label: "Clear filters", onClick: filterControls.clearFilters }
                : { label: "Create project", onClick: () => openCreateProject() }}
              className="py-8"
            />
          }
          accordionType="single"
          embedded
        />
        )}
      </AdminSectionCard>
    </AdminPageCanvas>
  );
};

export default ProjectsPage;
