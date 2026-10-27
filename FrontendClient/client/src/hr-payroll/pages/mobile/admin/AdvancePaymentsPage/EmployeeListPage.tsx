import { useNavigate } from "react-router-dom";
// W13c: lucide → verified @untitledui/icons.
import { ArrowLeft, Calendar, Download01, Users01 } from "@untitledui/icons";
import { Button } from "@hr/components/ui/button";
import { MobilePageHeader } from "@hr/components/shared/MobilePageHeader";
import { MobileSearchInput } from "@hr/components/shared/MobileSearchInput";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@hr/components/ui/select";
import { AdvancePaymentMobileEmployeeList } from "@hr/components/advance-payment/AdvancePaymentMobileEmployeeList";
import { useAdvancePaymentsPage } from "@hr/hooks/advance-payment/useAdvancePaymentsPage";
import { formatMonthDisplay } from "@hr/utils/advancePaymentHelpers";
import type { FlexPayEmployeeListItem } from "@hr/types/api/advance-payment.types";
import { useState, useCallback } from "react";
import { EmployeeDetailSheet } from "./EmployeeDetailSheet";

const EmployeeListPage = () => {
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] =
    useState<FlexPayEmployeeListItem | null>(null);

  const page = useAdvancePaymentsPage({ employeesTabActive: true });

  const handleViewEmployeeDetail = useCallback(
    (emp: FlexPayEmployeeListItem) => {
      setSelectedEmployee(emp);
    },
    [],
  );

  return (
    <div className="flex min-h-full flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <MobilePageHeader
        title="Employees"
        subtitle="Monthly salary advance limits"
        icon={Users01}
        sticky={false}
        bordered={false}
        actions={
          <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Back" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      {/* Content */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {/* Search + export */}
        <div className="flex gap-2">
          <MobileSearchInput
            value={page.flexPaySearchInput}
            onSearch={page.handleFlexPaySearch}
            placeholder="Search by name or ID..."
            className="h-11"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-11 min-w-11 px-3 shrink-0"
            onClick={page.handleExportFlexPayEmployees}
            disabled={page.exportFlexPayMutation.isPending}
            aria-label="Export danh sách"
          >
            <Download01 className="h-4 w-4" />
          </Button>
        </div>

        {/* Month selector */}
        <Select
          value={page.selectedViewMonth ?? ""}
          onValueChange={(v) => page.setSelectedViewMonth(v || undefined)}
        >
          <SelectTrigger           aria-label="Salary advance month" className="h-11">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {page.availableMonths.length === 0 ? (
              <SelectItem value="none" disabled>
                No data available
              </SelectItem>
            ) : (
              page.availableMonths.map((m) => (
                <SelectItem key={m.forMonth} value={m.forMonth}>
                  {formatMonthDisplay(m.forMonth)} ({m.employeeCount} employees)
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <Select
            value={page.flexPayFilters.sortBy ?? "max_advance_amount"}
            onValueChange={page.handleFlexPaySort}
          >
            <SelectTrigger aria-label="Sort employees" className="h-11 min-w-0">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="max_advance_amount">Limit</SelectItem>
              <SelectItem value="utilized_amount">Used</SelectItem>
              <SelectItem value="pending_amount">Pending</SelectItem>
              <SelectItem value="available_amount">Available</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            className="h-11 min-w-20"
            onClick={() =>
              page.handleFlexPaySort(
                page.flexPayFilters.sortBy ?? "max_advance_amount",
              )
            }
          >
            {page.flexPayFilters.sortOrder === "ASC" ? "Ascending" : "Descending"}
          </Button>
        </div>

        {/* Employee list */}
        <AdvancePaymentMobileEmployeeList
          employees={page.flexPayEmployees}
          onEmployeePress={handleViewEmployeeDetail}
          pagination={page.flexPayPagination}
          onPageChange={page.handleFlexPayPageChange}
        />
      </div>

      {/* Employee detail sheet (stays as sheet since it's a detail overlay) */}
      <EmployeeDetailSheet
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
};

export default EmployeeListPage;
