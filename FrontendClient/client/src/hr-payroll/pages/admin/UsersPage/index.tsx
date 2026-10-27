import { ErrorState } from "@hr/components/ui/error-state";
import { ResponsiveTable } from "@hr/components/ui/responsive-table";
import {
  AdminPageCanvas,
  AdminPageHeaderCard,
  AdminSectionCard,
  AdminFilterRow,
} from "@hr/components/shared/AdminPageFrame";
import { UserPageHeader } from "@hr/components/users/UserPageHeader";
import { UserStatsCards } from "@hr/components/users/UserStatsCards";
import { UserFiltersBar } from "@hr/components/users/UserFiltersBar";
import { useUserDataInfinite } from "@hr/hooks/users/useUserDataInfinite";
import { useUserModals } from "@hr/hooks/useModalNavigation";
import { useUserFiltersWithBackend } from "@hr/hooks/users/useUserFiltersWithBackend";
import { useUserExport } from "@hr/hooks/users/useUserExport";
import { useUsersSummary, useResetPassword } from "@hr/hooks/api/useUsers";
import { createUserColumns } from "@hr/config/user-table-columns";
import { createUserMobileConfig } from "@hr/config/user-table-mobile";
import { Skeleton } from "@hr/components/ui/skeleton";
import { RefreshCw05 } from "@untitledui/icons";
import { EmptyState } from "@hr/components/shared/EmptyState";
import { useCallback } from "react";
import { useTableSorting } from "@hr/utils/sorting";
import { useInfiniteScroll } from "@hr/hooks/use-infinite-scroll";
import { useAuth } from "@hr/contexts";

const UsersPage = () => {
  const { user } = useAuth();
  const isAdvPartner = user?.role === "adv_partner";

  const filterState = useUserFiltersWithBackend();
  const { exportUsers, isExporting } = useUserExport();
  const userData = useUserDataInfinite({
    pageSize: filterState.filters.pageSize,
    sortBy: filterState.filters.sortBy,
    sortOrder: filterState.filters.sortOrder,
    search: filterState.filters.search,
    role: filterState.filters.role,
    last_login_today: filterState.filters.last_login_today,
  });
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
  } = useUsersSummary();
  const resetPasswordMutation = useResetPassword();
  const { openUserDetails, openAddUser } = useUserModals();

  const handleResetPassword = (userId: number, password: string) => {
    resetPasswordMutation.mutate({ id: userId, password });
  };

  const handleRoleSelect = useCallback(
    (role?: "admin" | "partner" | "employee" | "accountant") => {
      filterState.setRole(role);
    },
    [filterState],
  );

  const handleDropdownRoleChange = useCallback(
    (role: "admin" | "partner" | "employee" | "accountant" | undefined) => {
      filterState.setRole(role);
    },
    [filterState],
  );

  const columns = createUserColumns();
  const mobileConfig = createUserMobileConfig();

  const { sorting, onSortingChange } = useTableSorting(
    filterState.sortBy,
    filterState.sortOrder,
    filterState.onSortChange,
  );

  const { observerRef } = useInfiniteScroll({
    hasMore: !userData.error && userData.hasMore,
    isLoading: userData.isFetchingNextPage,
    onLoadMore: () => {
      userData.fetchNextPage();
    },
    threshold: 0.1,
    rootMargin: "200px",
  });

  if (userData.isLoading && userData.users.length === 0) {
    return (
      <AdminPageCanvas>
        <AdminPageHeaderCard>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </AdminPageHeaderCard>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <AdminSectionCard>
          <Skeleton className="m-3 h-11 rounded-xl sm:m-4" />
          <Skeleton className="m-3 h-96 rounded-xl sm:m-4" />
        </AdminSectionCard>
      </AdminPageCanvas>
    );
  }

  return (
    <AdminPageCanvas>
      {!isAdvPartner && (
        <AdminPageHeaderCard>
          <UserPageHeader
            onAddUser={() => openAddUser()}
            onExportUsers={() => exportUsers(filterState.filters)}
            isExporting={isExporting}
          />
        </AdminPageHeaderCard>
      )}

      {!isAdvPartner && (
        <UserStatsCards
          stats={summaryData}
          isLoading={summaryLoading}
          error={!!summaryError}
          onRoleSelect={handleRoleSelect}
          selectedRole={filterState.role}
          lastLoginToday={filterState.lastLoginToday}
        />
      )}

      <AdminSectionCard aria-label="User list">
        <AdminFilterRow>
          <p className="text-sm font-semibold text-foreground">Users</p>
          <div className="flex flex-1 items-center justify-end">
            <UserFiltersBar
              search={filterState.search}
              onSearchChange={filterState.setSearch}
              role={isAdvPartner ? undefined : filterState.role}
              onRoleChange={handleDropdownRoleChange}
              projectId={filterState.projectId}
              onProjectChange={filterState.setProjectId}
              onClearFilters={filterState.clearFilters}
              hasActiveFilters={filterState.hasActiveFilters}
              hideRoleFilter={isAdvPartner}
            />
          </div>
        </AdminFilterRow>

        {userData.error && (
          <div role="alert">
            <ErrorState
              message={userData.isFetchNextPageError
                ? "Could not load more users. The users already loaded are still available."
                : "Could not load users. Please try again."}
              onRetry={() => void (userData.isFetchNextPageError ? userData.fetchNextPage() : userData.refetch())}
              className="px-4"
            />
          </div>
        )}
        {(!userData.error || userData.users.length > 0) && <ResponsiveTable
          data={userData.users.filter((u) => u.role !== 'adv_partner')}
          columns={columns}
          mobileFields={mobileConfig.mobileFields}
          rowTitle={mobileConfig.rowTitle}
          rowSubtitle={mobileConfig.rowSubtitle}
          getRowId={(row) => String(row.id)}
          onRowClick={(user) => openUserDetails(user.id.toString())}
          sorting={sorting}
          onSortingChange={onSortingChange}
          emptyState={
            <EmptyState
              title="No users found"
              description={filterState.hasActiveFilters
                ? "No users match your filters."
                : "Create your first user to get started."}
              size="sm"
            />
          }
          accordionType="single"
          embedded
        />}

        {!userData.error && userData.hasMore && !userData.isFetchingNextPage && (
          <div ref={observerRef} className="h-px w-full" aria-hidden="true" />
        )}

        {userData.isFetchingNextPage && (
          <div className="flex items-center justify-center border-t border-utility-gray-200 py-4">
            <RefreshCw05 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading more...
            </span>
          </div>
        )}

        {!userData.error && !userData.hasMore &&
          !userData.isFetchingNextPage &&
          userData.users.length > 0 && (
            <p className="border-t border-utility-gray-200 py-3 text-center text-xs text-muted-foreground">
              {userData.users.length} users
            </p>
          )}
      </AdminSectionCard>
    </AdminPageCanvas>
  );
};

export default UsersPage;
