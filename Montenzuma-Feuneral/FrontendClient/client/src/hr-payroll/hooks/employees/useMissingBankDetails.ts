import { useEmployeesWithMissingBankDetails } from '@hr/hooks/api/useEmployees';
import type { EmployeeFilters } from '@hr/types/api/employee.types';

export interface UseMissingBankDetailsOptions {
  filters?: EmployeeFilters;
  enabled?: boolean;
}

export const useMissingBankDetails = (options: UseMissingBankDetailsOptions = {}) => {
  const { filters, enabled = true } = options;

  const {
    data,
    isLoading,
    error,
    refetch
  } = useEmployeesWithMissingBankDetails(
    enabled ? filters : undefined
  );

  return {
    employees: data?.data || [],
    totalCount: data?.pagination?.totalRecords || 0,
    isLoading,
    error: error ? 'Failed to load danh sách nhân viên thiếu thông tin ngân hàng' : null,
    refetch,
  };
};
