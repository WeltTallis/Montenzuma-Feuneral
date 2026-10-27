import { ReactNode } from 'react';
import { SearchBar } from '@hr/components/shared/SearchBar';
import { FilterPill } from '@hr/components/shared/FilterPill';
import { useAllProjects } from '@hr/hooks/api/useProjects';
import { cn } from '@hr/lib/utils';

type UserRoleFilter = 'admin' | 'partner' | 'employee' | 'accountant';

interface UserFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  role: UserRoleFilter | undefined;
  onRoleChange: (role: UserRoleFilter | undefined) => void;
  projectId: number | undefined;
  onProjectChange: (projectId: number | undefined) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  hideRoleFilter?: boolean;
  extra?: ReactNode;
  className?: string;
}

export const UserFiltersBar = ({
  search,
  onSearchChange,
  role,
  onRoleChange,
  projectId,
  onProjectChange,
  hideRoleFilter = false,
  extra,
  className,
}: UserFiltersBarProps) => {
  const { data: projects } = useAllProjects();

  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      <SearchBar
        searchTerm={search}
        onSearchChange={onSearchChange}
        placeholder="Search by name or email..."
        className={hideRoleFilter ? 'flex-1 min-w-[200px] max-w-md' : 'w-48'}
      />
      {!hideRoleFilter && (
        <FilterPill
          value={role ?? 'all'}
          onChange={(v) => onRoleChange(v === 'all' ? undefined : v as UserRoleFilter)}
          placeholder="Role"
          options={[
            { value: 'admin', label: 'Administrator' },
            { value: 'partner', label: 'Management' },
            { value: 'employee', label: 'Employees' },
            { value: 'accountant', label: 'Accountant' },
          ]}
        />
      )}
      <FilterPill
        value={projectId !== undefined ? String(projectId) : 'all'}
        onChange={(v) => onProjectChange(v === 'all' ? undefined : Number(v))}
        placeholder="Projects"
        options={(projects ?? []).map((project) => ({
          value: String(project.id),
          label: project.name,
        }))}
      />
      {extra}
    </div>
  );
};
