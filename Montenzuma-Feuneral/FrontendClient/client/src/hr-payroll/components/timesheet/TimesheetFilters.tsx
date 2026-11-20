import { useMemo } from 'react';
import { FilterPill } from '@hr/components/shared/FilterPill';
import { SearchBar } from '@hr/components/shared/SearchBar';
import { SearchableDropdown } from '@hr/components/ui/searchable-dropdown';
import { EmployeeDropdownAdapter } from '@hr/components/timesheet/EmployeeDropdownAdapter';
import type { Employee } from '@hr/types/api/employee.types';
import { Badge } from '@hr/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@hr/components/ui/sheet';
import { Label } from '@hr/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hr/components/ui/select';
import { SlidersHorizontal } from 'lucide-react';
import { useIsMobile } from '@hr/hooks/useBreakpoint';
import { useTimesheetContext } from '@hr/components/timesheet/TimesheetContext';

const STATUS_OPTIONS = [
  { value: 'pending_approval', label: 'Pending approval' },
  { value: 'pending_payment', label: 'Awaiting payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
];

export const TimesheetFilters = () => {
  const { filters } = useTimesheetContext();
  const {
    selectedMonth,
    onMonthChange,
    selectedProject,
    onProjectChange,
    selectedEmployee,
    onEmployeeChange,
    statusFilter,
    onStatusChange,
    projects,
    projectEmployees,
    searchTerm = '',
    onSearchChange,
    userRole = 'admin',
  } = filters;

  const isMobile = useIsMobile();

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: `${d.getMonth() + 1}/${d.getFullYear()}`,
      };
    });
  }, []);

  const projectOptions = useMemo(() =>
    projects.map(p => {
      const parts = p.name.split(' - ');
      return { value: p.id.toString(), label: `${parts[0]} (${p.code})` };
    }), [projects]);

  const shouldUseProjectEmployees = selectedProject !== 'all' && projectEmployees && projectEmployees.length > 0;

  const activeFilterCount = [
    selectedMonth !== 'all',
    statusFilter !== 'all',
    selectedProject !== 'all',
    selectedEmployee !== 'all',
  ].filter(Boolean).length;

  // ── Mobile ─────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex flex-col gap-1.5">
        {onSearchChange && (
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            placeholder="Search..."
            className="w-full"
          />
        )}
        <div className="flex items-center gap-1.5">
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger aria-label="Filter timesheet month" className="h-11 w-[112px] shrink-0 text-xs border-border/60">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {monthOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              aria-label="Filters"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {activeFilterCount > 1 && (
                <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 p-0 text-xs flex items-center justify-center rounded-full">
                  {activeFilterCount - 1}
                </Badge>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[85dvh] overflow-y-auto px-4 pt-4">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-base">Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 pb-4" style={{ paddingBottom: "max(16px, calc(16px + env(safe-area-inset-bottom)))" }}>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={onStatusChange}>
                  <SelectTrigger aria-label="Filter timesheet status" className="h-11"><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Projects</Label>
                <SearchableDropdown
                  value={selectedProject} onValueChange={onProjectChange}
                  options={projectOptions}
                  placeholder="All projects" searchPlaceholder="Search projects..."
                  emptyMessage="No projects found." className="w-full"
                  allOption={{ value: 'all', label: 'All projects' }}
                  mobileTitle="Select a project"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Employees</Label>
                <EmployeeDropdownAdapter
                  value={selectedEmployee} onChange={onEmployeeChange}
                  selectedProject={selectedProject} placeholder="All employees"
                  className="w-full"
                  availableEmployees={(shouldUseProjectEmployees ? projectEmployees : []) as unknown as Employee[]}
                  includeAvailableOnly={shouldUseProjectEmployees}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>
    );
  }

  // ── Desktop ────────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {onSearchChange && (
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          placeholder="Search employees or projects..."
          className="w-64"
        />
      )}

      <div className="h-5 w-px bg-border/50 shrink-0 hidden sm:block" />

      {userRole !== 'partner' && (
        <FilterPill
          value={selectedMonth}
          onChange={onMonthChange}
          placeholder="Month"
          options={monthOptions}
          className="bg-card"
        />
      )}

      <FilterPill
        value={statusFilter}
        onChange={onStatusChange}
        placeholder="Status"
        options={STATUS_OPTIONS}
        className="bg-card"
      />

      <SearchableDropdown
        value={selectedProject}
        onValueChange={onProjectChange}
        options={projectOptions}
        placeholder="Projects"
        searchPlaceholder="Search projects..."
        emptyMessage="No projects found."
        className="h-11 min-h-11 rounded-xl bg-card px-3 text-sm sm:h-9 sm:min-h-9 sm:px-2.5"
        allOption={{ value: 'all', label: 'All projects' }}
        pillStyle
      />

      <EmployeeDropdownAdapter
        value={selectedEmployee}
        onChange={onEmployeeChange}
        selectedProject={selectedProject}
        placeholder="All employees"
        className="inline-flex h-11 min-h-11 items-center gap-1 rounded-xl border border-border/60 bg-card px-3 py-0 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors duration-100 hover:border-border hover:bg-accent/40 hover:text-foreground sm:h-9 sm:min-h-9 sm:px-2.5 [&>svg]:h-3.5 [&>svg]:w-3.5"
        availableEmployees={(shouldUseProjectEmployees ? projectEmployees : []) as unknown as Employee[]}
        includeAvailableOnly={shouldUseProjectEmployees}
        pillStyle
      />
    </div>
  );
};
