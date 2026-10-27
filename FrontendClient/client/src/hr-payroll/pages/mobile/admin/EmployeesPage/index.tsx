import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MobileSearchInput } from "@hr/components/shared/MobileSearchInput";
import { Button } from "@hr/components/ui/button";
import { Badge } from "@hr/components/ui/badge";
import { Skeleton } from "@hr/components/ui/skeleton";
import { Input } from "@hr/components/ui/input";
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
import { SearchableSelect } from "@hr/components/ui/searchable-select";
import { EmployeeMobileCard } from "@hr/components/employees/EmployeeMobileCard";
import { EmployeeEmptyStates } from "@hr/components/employees/EmployeeEmptyStates";
import { MissingBankDetailsSection } from "@hr/components/employees/MissingBankDetailsSection";
import { ExportEmployeesModal } from "@hr/components/modals/ExportEmployeesModal";
import { MobilePageHeader } from "@hr/components/shared/MobilePageHeader";
import { useEmployeeDataInfinite } from "@hr/hooks/employees/useEmployeeDataInfinite";
import { useEmployeesSummary } from "@hr/hooks/api/useEmployees";
import { useEmployeeModals } from "@hr/hooks/useModalNavigation";
import { useEmployeeExport } from "@hr/hooks/employees/useEmployeeExport";
import { useAssignableProjects } from "@hr/hooks/api/useProjects";
import { EMPLOYEE_SORT_FIELD_MAP } from "@hr/pages/admin/EmployeesPage/constants";
import {
  ArrowDown,
  ArrowUp,
  Download01,
  FilterLines,
  Plus,
  XClose,
} from "@untitledui/icons";
import { MobileStatStrip } from "@hr/components/shared/MobileStatStrip";
import type { Employee } from "@hr/types/api/employee.types";

const getMonthOptions = () => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("en-KE", {
      month: "short",
      year: "numeric",
    }).format(date);
    options.push({ value, label });
  }
  return options;
};

const monthOptions = getMonthOptions();

const EmployeesPageMobile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const {
    employees,
    loading,
    searchEmployees,
    searchTerm: employeeSearchTerm,
    updateFilters,
    clearFilters,
    currentFilters,
    pagination,
    hasMore,
    isFetchingNextPage,
    fetchNextPage,
  } = useEmployeeDataInfinite();

  const { data: employeesSummary, isLoading: summaryLoading } =
    useEmployeesSummary();
  const { data: projectsData } = useAssignableProjects();
  const { exportEmployees, isExporting } = useEmployeeExport();
  const { openEmployeeDetails, openAddEmployee } = useEmployeeModals();

  useEffect(() => {
    const action = searchParams.get("action");
    const status = searchParams.get("status") as
      | "working"
      | "unassigned"
      | null;

    const nextParams = new URLSearchParams(searchParams);
    let paramsChanged = false;

    if (action === "add") {
      nextParams.delete("action");
      nextParams.set("modal", "add_employee");
      paramsChanged = true;
    }

    if (status) {
      updateFilters({ status });
      nextParams.delete("status");
      paramsChanged = true;
    }

    if (paramsChanged) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, updateFilters, setSearchParams]);

  const handleEmployeeClick = useCallback(
    (employee: Employee) => openEmployeeDetails(employee.id.toString()),
    [openEmployeeDetails],
  );

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasMore, isFetchingNextPage, fetchNextPage]);

  const statusFilter = currentFilters.status as
    | "working"
    | "unassigned"
    | undefined;
  const month = currentFilters.month as string | undefined;
  const projectId = currentFilters.projectId as number | undefined;
  const sortBy = currentFilters.sortBy as string | undefined;
  const sortOrder = currentFilters.sortOrder as "asc" | "desc" | undefined;
  const fromDate = currentFilters.fromDate as string | undefined;
  const toDate = currentFilters.toDate as string | undefined;

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (statusFilter) c++;
    if (month) c++;
    if (projectId) c++;
    if (fromDate) c++;
    if (toDate) c++;
    return c;
  }, [statusFilter, month, projectId, fromDate, toDate]);

  /** Project list shared by the filter sheet and the export modal. */
  const projectsForExport = useMemo(
    () =>
      projectsData?.data?.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
      })) ?? [],
    [projectsData],
  );

  const handleExportConfirm = useCallback(
    (projectIds?: number[]) => {
      exportEmployees(projectIds);
    },
    [exportEmployees],
  );

  const projects = useMemo(
    () =>
      projectsData?.data?.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
      })) ?? [],
    [projectsData],
  );

  const stats = useMemo(() => {
    if (!employeesSummary) return [];
    return [
      {
        label: "Total",
        value: employeesSummary.total_employees,
        filter: null as "working" | "unassigned" | null,
      },
      {
        label: "Active",
        value: employeesSummary.total_working_employees,
        filter: "working" as const,
      },
      {
        label: "Unassigned",
        value:
          employeesSummary.total_employees -
          employeesSummary.total_working_employees,
        filter: "unassigned" as const,
      },
      {
        label: "Hired this month",
        value: employeesSummary.employees_hired_this_month,
        filter: null as "working" | "unassigned" | null,
      },
    ];
  }, [employeesSummary]);

  if (loading && employees.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <MobilePageHeader
        title="Employees"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-11 px-3"
              onClick={() => setExportModalOpen(true)}
              aria-label="Export employee list"
              disabled={isExporting}
            >
              <Download01 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              className="h-11 px-3 btn-admin-primary"
              onClick={() => openAddEmployee()}
            >
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Add
            </Button>
          </>
        }
      />

      {/* Stats strip — one bordered surface, matching the other mobile pages. */}
      {!summaryLoading && stats.length > 0 && (
        <div className="px-4 pb-3">
          <MobileStatStrip
            items={stats.map((stat) => ({
              key: stat.label,
              label: stat.label,
              value: stat.value.toLocaleString("en-KE"),
              active: stat.filter !== null && statusFilter === stat.filter,
              onClick: stat.filter
                ? () =>
                    updateFilters({
                      status:
                        statusFilter === stat.filter ? undefined : stat.filter,
                    })
                : undefined,
            }))}
          />
        </div>
      )}
      {summaryLoading && (
        <div className="grid grid-cols-4 gap-1.5 px-4 pb-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      <div className="flex gap-3 px-4 pb-3">
        <MobileSearchInput
          value={employeeSearchTerm}
          onSearch={searchEmployees}
          placeholder="Search employees..."
        />
        <Button
          variant="outline"
          size="icon"
          className="relative h-11 w-11 shrink-0 rounded-lg border-border bg-card"
          onClick={() => setFilterSheetOpen(true)}
          aria-label="Filters"
        >
          <FilterLines className="h-4 w-4" aria-hidden="true" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-white flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          {statusFilter && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => updateFilters({ status: undefined })}
            >
              {statusFilter === "working" ? "Active" : "Unassigned"}
              <XClose className="h-3 w-3" aria-hidden="true" />
            </Badge>
          )}
          {month && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => updateFilters({ month: undefined })}
            >
              {monthOptions.find((m) => m.value === month)?.label ?? month}
              <XClose className="h-3 w-3" aria-hidden="true" />
            </Badge>
          )}
          {projectId && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => updateFilters({ projectId: undefined })}
            >
              {projects.find((p) => p.id === projectId)?.name ?? "Projects"}
              <XClose className="h-3 w-3" aria-hidden="true" />
            </Badge>
          )}
          <button
            onClick={() => {
              clearFilters();
              searchEmployees("");
            }}
            className="min-h-11 px-1 text-xs text-muted-foreground underline underline-offset-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Padded to the page's block rhythm — this page has no page-level
          padding, so a bare render sat wider than the list and touched it. */}
      <div className="px-4 pb-3">
        <MissingBankDetailsSection onEmployeeClick={handleEmployeeClick} />
      </div>
      <div className="flex-1 px-4">
        {employees.length === 0 ? (
          <EmployeeEmptyStates
            searchTerm={employeeSearchTerm}
            onClearSearch={() => searchEmployees("")}
            onAddEmployee={() => openAddEmployee()}
          />
        ) : (
          <>
            <div className="space-y-2">
              {employees.map((employee) => (
                <EmployeeMobileCard
                  key={employee.id}
                  employee={employee}
                  onClick={handleEmployeeClick}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
            {isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!hasMore && !isFetchingNextPage && employees.length > 0 && (
              <p className="text-center py-3 text-xs text-muted-foreground">
                {pagination?.totalRecords ?? employees.length} employees
              </p>
            )}
          </>
        )}
      </div>

      {/* Filter sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-2xl px-4 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="pb-4">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusFilter ?? "all"}
                onValueChange={(v) =>
                  updateFilters({
                    status:
                      v === "all" ? undefined : (v as "working" | "unassigned"),
                  })
                }
              >
                <SelectTrigger aria-label="Filter employees by status" className="h-11">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="working">Active</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Month</label>
              <Select
                value={month ?? "all"}
                onValueChange={(v) =>
                  updateFilters({ month: v === "all" ? undefined : v })
                }
              >
                <SelectTrigger aria-label="Filter employees by month" className="h-11">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {projects.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Projects</label>
                <SearchableSelect
                  value={projectId ? projectId.toString() : "all"}
                  onChange={(v) =>
                    updateFilters({
                      projectId: v === "all" ? undefined : parseInt(v),
                    })
                  }
                  searchPlaceholder="Search projects..."
                  options={[
                    { value: "all", label: "All projects" },
                    ...projects.map((p) => ({
                      value: p.id.toString(),
                      label: p.name,
                    })),
                  ]}
                />
              </div>
            )}
            {/* Sort lives with the other filters: keeping it off the page body
                leaves one readable toolbar row instead of two crammed ones. */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sort by</label>
              <div className="flex gap-2">
                <Select
                  value={sortBy ?? "created_at"}
                  onValueChange={(v) => updateFilters({ sortBy: v })}
                >
                  <SelectTrigger
                    aria-label="Sort employees"
                    className="h-11 flex-1"
                  >
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created on</SelectItem>
                    <SelectItem value="fullname">Name</SelectItem>
                    <SelectItem value="bank_name">Bank</SelectItem>
                    <SelectItem value="project_name">Projects</SelectItem>
                    <SelectItem value="date_of_birth">Date of birth</SelectItem>
                    <SelectItem value="mobile">Phone number</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl border-border bg-card"
                  onClick={() =>
                    updateFilters({
                      sortOrder: sortOrder === "asc" ? "desc" : "asc",
                    })
                  }
                  aria-label={
                    sortOrder === "asc"
                      ? "Sort ascending"
                      : "Sort descending"
                  }
                >
                  {sortOrder === "asc" ? (
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
            {/* Date-range filter — restores desktop capability */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Hire date (from — to)</label>
              <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-[1fr_auto_1fr] min-[380px]:items-center">
                <Input
                  type="date"
                  value={fromDate ?? ""}
                  onChange={(e) =>
                    updateFilters({
                      fromDate: e.target.value || undefined,
                    })
                  }
                  className="h-11 flex-1 text-sm"
                />
                <span className="hidden text-center text-xs text-muted-foreground min-[380px]:block">—</span>
                <Input
                  type="date"
                  value={toDate ?? ""}
                  onChange={(e) =>
                    updateFilters({
                      toDate: e.target.value || undefined,
                    })
                  }
                  className="h-11 flex-1 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 pt-2 min-[380px]:grid-cols-2">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => {
                  clearFilters();
                  searchEmployees("");
                  setFilterSheetOpen(false);
                }}
              >
                Clear filters
              </Button>
              <Button
                className="flex-1 h-11 btn-admin-primary"
                onClick={() => setFilterSheetOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Export modal — matches desktop's project-selection export flow */}
      <ExportEmployeesModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExportConfirm}
        projects={projectsForExport}
        isExporting={isExporting}
      />
    </div>
  );
};

export default EmployeesPageMobile;
