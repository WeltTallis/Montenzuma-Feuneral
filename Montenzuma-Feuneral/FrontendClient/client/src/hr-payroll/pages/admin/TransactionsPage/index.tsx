import { useState, useCallback } from 'react';
// UU PRO restyle (W13c): page chrome on the UU bridge; header icons swapped
// in TransactionPageHeader. Table/filter machinery stays with W13b.
import {
  AdminPageCanvas,
  AdminPageHeaderCard,
  AdminSectionCard,
  AdminFilterRow,
} from '@hr/components/shared/AdminPageFrame';
import { TransactionPageHeader } from '@hr/components/transaction/TransactionPageHeader';
import { TransactionSummaryCard } from '@hr/components/transaction/TransactionSummaryCard';
import { CapitalContributionsCard } from '@hr/components/transaction/CapitalContributionsCard';
import { TransactionTable } from '@hr/components/transaction/TransactionTable';
import { TransactionFilters } from '@hr/components/transaction/TransactionFilters';
import { SettlementResultUploadDialog } from '@hr/components/transaction/SettlementResultUploadDialog';
import { SettlementSimulationDialog } from '@hr/components/ledger/SettlementSimulationDialog';
import { PayrollReportEmailDialog, type PayrollReportEmailParams } from '@hr/components/timesheet/PayrollReportEmailDialog';
import { AdvancePaymentEmailDialog, type AdvancePaymentEmailParams } from '@hr/components/advance-payment/AdvancePaymentEmailDialog';
import { SaoKeHistoryDialog } from '@hr/components/transaction/SaoKeHistoryDialog';
import { ExportSaoKeDialog } from '@hr/components/transaction/ExportSaoKeDialog';
import { AdvancePaymentExportDialog } from '@hr/components/advance-payment/AdvancePaymentExportDialog';
import { useTransactions } from '@hr/hooks/transactions/useTransactions';
import { useLedgerSummary } from '@hr/hooks/ledger/useLedgerBalance';
import { useLedgerManagement } from '@hr/hooks/ledger/useLedgerManagement';
import { useGeneralModals } from '@hr/hooks/useModalNavigation';
import { useSendPayrollReportEmail } from '@hr/hooks/api/usePayrolls';
import { useSendReconciliationEmail } from '@hr/hooks/api/useAdvancePaymentReconciliation';
import { useTableSorting } from '@hr/utils/sorting';
import type { TransactionFilters as FiltersType, Transaction } from '@hr/services/api/transaction.service';
import { getInitialDateRange } from './utils';
import { DEFAULT_FILTERS, SORT_FIELD_MAP } from './constants';

const TransactionsPage = () => {
  const initialDateRange = getInitialDateRange();

  const [filters, setFilters] = useState<FiltersType>(() => ({
    page: 1,
    pageSize: 50,
    sortBy: 'created_at',
    sortOrder: 'desc',
    fromDate: initialDateRange.fromDate,
    toDate: initialDateRange.toDate,
  }));

  const [showSettlementDialog, setShowSettlementDialog] = useState(false);
  const [payrollEmailDialogOpen, setPayrollEmailDialogOpen] = useState(false);
  const [advanceEmailDialogOpen, setAdvanceEmailDialogOpen] = useState(false);
  const [saoKeHistoryDialogOpen, setSaoKeHistoryDialogOpen] = useState(false);
  const [exportSaoKeDialogOpen, setExportSaoKeDialogOpen] = useState(false);
  const [exportAdvanceDialogOpen, setExportAdvanceDialogOpen] = useState(false);
  const [simulationDialogOpen, setSimulationDialogOpen] = useState(false);

  const sendPayrollEmailMutation = useSendPayrollReportEmail();
  const sendAdvanceEmailMutation = useSendReconciliationEmail();
  const {
    runWalletSettlement,
    isRunningWalletSettlement,
  } = useLedgerManagement();

  const { data: transactionsData } = useTransactions(filters);

  const transactions = transactionsData?.data || [];
  const pagination = transactionsData?.pagination || null;
  const totalRecords = pagination?.totalRecords || 0;

  const { data: ledgerSummary, isLoading: isLoadingSummary } = useLedgerSummary(
    filters.fromDate || initialDateRange.fromDate,
    filters.toDate || initialDateRange.toDate
  );

  const { openTransactionDetails, openAddLedgerEntry } = useGeneralModals();

  const handleAddTransaction = () => {
    openAddLedgerEntry();
  };

  const handleUploadSettlementResult = () => {
    setShowSettlementDialog(true);
  };

  const handleRunWalletSettlement = async () => {
    try {
      await runWalletSettlement();
    } catch {
      // Error is handled by the hook
    }
  };

  const handleRowClick = (transaction: Transaction) => {
    openTransactionDetails(transaction.id.toString());
  };

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 50,
      sortBy: 'created_at',
      sortOrder: 'desc',
      fromDate: initialDateRange.fromDate,
      toDate: initialDateRange.toDate,
    });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters(prev => ({ ...prev, pageSize, page: 1 }));
  };

  const hasFilters = !!(filters.search || filters.transaction_type || filters.status || filters.party || filters.created_by);

  const { sorting, onSortingChange } = useTableSorting(
    filters.sortBy,
    filters.sortOrder as 'desc' | 'asc',
    useCallback((sortBy, sortOrder) => {
      setFilters(prev => ({ ...prev, sortBy, sortOrder }));
    }, []),
    SORT_FIELD_MAP,
  );

  const handleSendPayrollEmail = useCallback(async (params: PayrollReportEmailParams) => {
    try {
      await sendPayrollEmailMutation.mutateAsync(params);
      setPayrollEmailDialogOpen(false);
    } catch { /* handled by mutation */ }
  }, [sendPayrollEmailMutation]);

  const handleSendAdvanceEmail = useCallback(async (params: AdvancePaymentEmailParams) => {
    try {
      await sendAdvanceEmailMutation.mutateAsync(params);
      setAdvanceEmailDialogOpen(false);
    } catch { /* handled by mutation */ }
  }, [sendAdvanceEmailMutation]);

  return (
    <AdminPageCanvas>
      <AdminPageHeaderCard>
        <TransactionPageHeader
          onAddTransaction={handleAddTransaction}
          onSendSaoKePayroll={() => setPayrollEmailDialogOpen(true)}
          onSendSaoKeAdvance={() => setAdvanceEmailDialogOpen(true)}
          onViewSaoKeHistory={() => setSaoKeHistoryDialogOpen(true)}
          onExportSaoKePayroll={() => setExportSaoKeDialogOpen(true)}
          onExportSaoKeAdvance={() => setExportAdvanceDialogOpen(true)}
          isSendingSaoKe={sendPayrollEmailMutation.isPending || sendAdvanceEmailMutation.isPending}
          onRunWalletSettlement={handleRunWalletSettlement}
          isRunningWalletSettlement={isRunningWalletSettlement}
          onSimulateSettlement={() => setSimulationDialogOpen(true)}
        />
      </AdminPageHeaderCard>

      <TransactionSummaryCard
        ledgerSummary={ledgerSummary}
        isLoading={isLoadingSummary}
        renderCapitalCard={() => (
          <CapitalContributionsCard
            contributions={ledgerSummary?.by_owners}
            isLoading={isLoadingSummary}
          />
        )}
      />

      <AdminSectionCard aria-label="List bút toán">
        <AdminFilterRow>
          <p className="text-sm font-semibold text-fg-primary">Bút toán</p>
          <div className="flex flex-1 items-center justify-end">
            <TransactionFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              hasFilters={hasFilters}
              totalResults={totalRecords}
            />
          </div>
        </AdminFilterRow>

        <TransactionTable
          transactions={transactions}
          onRowClick={handleRowClick}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          sorting={sorting}
          onSortingChange={onSortingChange}
          embedded
        />
      </AdminSectionCard>

      <SettlementResultUploadDialog
        open={showSettlementDialog}
        onOpenChange={setShowSettlementDialog}
      />

      <PayrollReportEmailDialog
        open={payrollEmailDialogOpen}
        onOpenChange={setPayrollEmailDialogOpen}
        onSendEmail={handleSendPayrollEmail}
        isLoading={sendPayrollEmailMutation.isPending}
      />
      <AdvancePaymentEmailDialog
        open={advanceEmailDialogOpen}
        onOpenChange={setAdvanceEmailDialogOpen}
        onSendEmail={handleSendAdvanceEmail}
        isLoading={sendAdvanceEmailMutation.isPending}
      />
      <SaoKeHistoryDialog
        open={saoKeHistoryDialogOpen}
        onOpenChange={setSaoKeHistoryDialogOpen}
      />
      <ExportSaoKeDialog
        open={exportSaoKeDialogOpen}
        onOpenChange={setExportSaoKeDialogOpen}
      />
      <AdvancePaymentExportDialog
        open={exportAdvanceDialogOpen}
        onOpenChange={setExportAdvanceDialogOpen}
      />
      <SettlementSimulationDialog
        open={simulationDialogOpen}
        onOpenChange={setSimulationDialogOpen}
      />
    </AdminPageCanvas>
  );
};

export default TransactionsPage;
