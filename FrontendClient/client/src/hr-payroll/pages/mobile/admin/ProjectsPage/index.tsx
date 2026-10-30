import { useState, useEffect, useMemo, useCallback } from "react";
import { MobilePageHeader } from "@hr/components/shared/MobilePageHeader";
import { MobileSearchInput } from "@hr/components/shared/MobileSearchInput";
import { useSearchParams } from "react-router-dom";
import { Button } from "@hr/components/ui/button";
import { Skeleton } from "@hr/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@hr/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hr/components/ui/select";
import { ProjectMobileList } from "@hr/components/projects/ProjectMobileList";
import { EmptyState } from "@hr/components/shared/EmptyState";
import { ErrorState } from "@hr/components/ui/error-state";
import { useProjects } from "@hr/hooks/api/useProjects";
import { useProjectFilters } from "@hr/hooks/projects/useProjectFilters";
import { useProjectModals } from "@hr/hooks/useModalNavigation";
import { getProjectStatus } from "@hr/utils/kenyan";
import { generateMonthOptions } from "@hr/utils/dateHelpers";
import { Briefcase01, ChevronLeft, ChevronRight, FilterLines, Plus, XClose } from "@untitledui/icons";
import type { Project } from "@hr/types/api/project.types";

const ITEMS_PER_PAGE = 20;

const STATUS_OPTIONS: { value: Project["status"]; label: string }[] = [
  { value: "active", label: getProjectStatus("active") },
  { value: "paused", label: getProjectStatus("paused") },
  { value: "completed", label: getProjectStatus("completed") },
  { value: "draft", label: getProjectStatus("draft") },
  { value: "cancelled", label: getProjectStatus("cancelled") },
];

const ProjectsPageMobile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const filterControls = useProjectFilters({ initialFilters: { page: 1, pageSize: ITEMS_PER_PAGE } });
  const { data: response, isLoading, isError, isFetching, refetch } = useProjects(filterControls.apiFilters);
  const projects = response?.data || [];
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const { openCreateProject, openProjectDetails } = useProjectModals();

  const pagination = response?.pagination;
  const currentPage = pagination?.page ?? filterControls.page;
  const totalPages = pagination?.totalPages ?? 1;
  const { setStatusFilter } = filterControls;

  // Handle URL params from dashboard
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "add") {
      const p = new URLSearchParams(searchParams);
      p.delete("action");
      p.set("modal", "project_create");
      setSearchParams(p, { replace: true });
    }
    const status = searchParams.get("status");
    if (status === "active") setStatusFilter(["active"]);
  }, [searchParams, setSearchParams, setStatusFilter]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filterControls.statusFilter !== "all") c++;
    if (filterControls.monthFilter) c++;
    return c;
  }, [filterControls.statusFilter, filterControls.monthFilter]);

  const currentStatusLabel = useMemo(() => {
    if (filterControls.statusFilter === "all" || !Array.isArray(filterControls.statusFilter)) return null;
    return filterControls.statusFilter.map((s) => getProjectStatus(s)).join(", ");
  }, [filterControls.statusFilter]);

  const currentMonthLabel = useMemo(
    () => monthOptions.find((m) => m.value === filterControls.monthFilter)?.label ?? null,
    [monthOptions, filterControls.monthFilter],
  );

  const handleProjectClick = useCallback(
    (project: Project) => openProjectDetails(project.id.toString()),
    [openProjectDetails],
  );

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <MobilePageHeader
        title="Projects"
        icon={Briefcase01}
        actionsLayout="inline"
        actions={
          <Button
            size="sm"
            className="h-11 min-h-11 shrink-0 rounded-xl px-3 shadow-sm"
            onClick={() => openCreateProject()}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create project
          </Button>
        }
      />

      {/* Search + filter */}
      <div className="flex gap-2 px-4 py-3">
        <MobileSearchInput
          value={filterControls.searchTerm}
          onSearch={filterControls.setSearchTerm}
          placeholder="Search projects..."
        />
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border bg-card shrink-0 relative" onClick={() => setFilterSheetOpen(true)} aria-label="Filters">
          <FilterLines className="h-4 w-4" aria-hidden="true" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-white flex items-center justify-center font-bold">{activeFilterCount}</span>
          )}
        </Button>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          {currentStatusLabel && (
            <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-secondary px-3 text-xs font-semibold text-secondary-foreground" onClick={() => filterControls.setStatusFilter("all")} aria-label={`Remove status filter ${currentStatusLabel}`}>
              {currentStatusLabel}<XClose className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
          {currentMonthLabel && (
            <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-secondary px-3 text-xs font-semibold text-secondary-foreground" onClick={() => filterControls.setMonthFilter(undefined)} aria-label={`Remove month filter ${currentMonthLabel}`}>
              {currentMonthLabel}<XClose className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
          <button onClick={filterControls.clearFilters} className="min-h-11 px-1 text-xs text-muted-foreground underline underline-offset-2">Clear all</button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 px-4">
        {isError ? (
          <div role="alert">
            <ErrorState message="Could not load projects. Please try again." onRetry={() => void refetch()} />
          </div>
        ) : (
        <ProjectMobileList
          projects={projects}
          onRowClick={handleProjectClick}
          emptyState={
            <EmptyState
              title="No projects found"
              description={filterControls.hasFilters
                ? "No projects match your search. Try changing your search or clearing the filters."
                : "Create your first project to get started."}
              action={filterControls.hasFilters
                ? { label: "Clear filters", onClick: filterControls.clearFilters }
                : { label: "Create project", onClick: () => openCreateProject() }}
              size="sm"
            />
          }
        />
        )}
        {!isError && pagination && pagination.totalRecords > pagination.pageSize && (
          <nav aria-label="Project pagination" className="mt-3 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-11 min-w-11 rounded-xl px-3"
              onClick={() => filterControls.setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1 || isFetching}
              aria-label="Previous projects page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only min-[360px]:not-sr-only">Previous</span>
            </Button>
            <p className="text-center text-xs text-muted-foreground tabular-nums" aria-live="polite">
              Trang {currentPage} / {totalPages}
              <span className="block">{pagination.totalRecords} projects</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-11 min-w-11 rounded-xl px-3"
              onClick={() => filterControls.setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages || isFetching}
              aria-label="Next projects page"
            >
              <span className="sr-only min-[360px]:not-sr-only">Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </nav>
        )}
        {!isError && projects.length > 0 && (!pagination || pagination.totalRecords <= pagination.pageSize) && (
          <p className="text-center py-3 text-xs text-muted-foreground">{pagination?.totalRecords ?? projects.length} projects</p>
        )}
      </div>

      {/* Filter sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-2xl px-4 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="pb-4"><SheetTitle>Filters</SheetTitle></SheetHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                {STATUS_OPTIONS.map((option) => {
                  const selected =
                    Array.isArray(filterControls.statusFilter) &&
                    filterControls.statusFilter.includes(option.value);
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      aria-pressed={selected}
                      className="min-h-11 justify-start"
                      onClick={() => {
                        const current = Array.isArray(filterControls.statusFilter)
                          ? filterControls.statusFilter
                          : [];
                        const next = selected
                          ? current.filter((status) => status !== option.value)
                          : [...current, option.value];
                        filterControls.setStatusFilter(
                          next.length === 0 ? "all" : next,
                        );
                      }}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Month</label>
              <Select value={filterControls.monthFilter ?? "all"} onValueChange={(v) => filterControls.setMonthFilter(v === "all" ? undefined : v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="All months" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {monthOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sort</label>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Select
                  value={filterControls.sortBy}
                  onValueChange={filterControls.setSortBy}
                >
                  <SelectTrigger className="h-11 min-w-0">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Project name</SelectItem>
                    <SelectItem value="client_name">Client</SelectItem>
                    <SelectItem value="created_at">Created on</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 min-w-20"
                  onClick={() =>
                    filterControls.setSortOrder(
                      filterControls.sortOrder === "asc" ? "desc" : "asc",
                    )
                  }
                >
                  {filterControls.sortOrder === "asc" ? "Ascending" : "Descending"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 pt-2 min-[380px]:grid-cols-2">
              <Button variant="outline" className="flex-1 h-11" onClick={() => { filterControls.clearFilters(); setFilterSheetOpen(false); }}>Clear filters</Button>
              <Button className="flex-1 h-11 btn-admin-primary" onClick={() => setFilterSheetOpen(false)}>Apply</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProjectsPageMobile;
