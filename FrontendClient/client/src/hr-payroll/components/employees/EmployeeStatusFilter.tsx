import { FilterPill } from '@hr/components/shared/FilterPill';

interface EmployeeStatusFilterProps {
  value?: 'working' | 'unassigned';
  onValueChange: (value: 'working' | 'unassigned' | undefined) => void;
  className?: string;
}

export const EmployeeStatusFilter = ({
  value,
  onValueChange,
  className,
}: EmployeeStatusFilterProps) => {
  return (
    <FilterPill
      value={value ?? 'all'}
      onChange={(v) => onValueChange(v === 'all' ? undefined : v as 'working' | 'unassigned')}
      placeholder="Status"
      options={[
        { value: 'working', label: 'Đang làm việc' },
        { value: 'unassigned', label: 'Chưa phân công' },
      ]}
      className={className}
    />
  );
};
