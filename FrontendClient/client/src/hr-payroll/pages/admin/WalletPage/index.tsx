import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
// UU PRO restyle (W13c): lucide → verified @untitledui/icons.
import {
  SearchMd,
  SwitchHorizontal02,
  Upload01,
  Wallet01,
} from "@untitledui/icons";

import { Button } from "@hr/components/ui/button";
import {
  AdminPageCanvas,
} from "@hr/components/shared/AdminPageFrame";
import { PageHeader } from "@hr/components/shared/PageHeader";
import WalletTransactionsList from "@hr/components/wallet/WalletTransactionsList";
import CreateManualDisbursementDialog from "@hr/components/wallet/CreateManualDisbursementDialog";
import { EmployeeAccountLookupDialog } from "@hr/components/wallet/EmployeeAccountLookupDialog";
import { BulkTransferBatchList } from "@hr/components/wallet/BulkTransferBatchList";
import { BulkTransferUploadDialog } from "@hr/components/wallet/BulkTransferUploadDialog";
import { WalletBalanceCard } from "@hr/components/disbursement/WalletBalanceCard";
import type { DisbursementRecipientPrefill } from "@hr/pages/admin/ManualDisbursementPage/helpers";

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function WalletPage() {
  const queryClient = useQueryClient();
  const [disbursementOpen, setDisbursementOpen] = useState(false);
  const [employeeAccountLookupOpen, setEmployeeAccountLookupOpen] = useState(false);
  const [bulkTransferDialogOpen, setBulkTransferDialogOpen] = useState(false);
  const [selectedBulkTransferBatchId, setSelectedBulkTransferBatchId] =
    useState<number | null>(null);
  // Recipient carried from a valid account lookup into the transfer dialog.
  const [transferRecipient, setTransferRecipient] =
    useState<DisbursementRecipientPrefill | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
  };

  const handleDisbursementOpenChange = (nextOpen: boolean) => {
    setDisbursementOpen(nextOpen);
    // Drop the handoff as soon as the transfer dialog closes so a later manual
    // A manual transfer starts with a blank form rather than the previous lookup.
    if (!nextOpen) setTransferRecipient(null);
  };

  const handleSendToAccount = (recipient: DisbursementRecipientPrefill) => {
    setTransferRecipient(recipient);
    setEmployeeAccountLookupOpen(false);
    setDisbursementOpen(true);
  };

  return (
    <AdminPageCanvas>
      {/* Page header — slim bar: title left, actions right */}
      <PageHeader
        icon={Wallet01}
        title="Wallet"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEmployeeAccountLookupOpen(true)}
        >
          <SearchMd className="size-3.5" aria-hidden="true" />
          Search account
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBulkTransferDialogOpen(true)}
        >
          <Upload01 className="h-3.5 w-3.5" aria-hidden="true" />
          Bulk transfer
        </Button>
        <Button
          size="sm"
          onClick={() => setDisbursementOpen(true)}
        >
          <SwitchHorizontal02 className="h-3.5 w-3.5" aria-hidden="true" />
          Send money
        </Button>
      </PageHeader>

      {/* Hero balance — the treasury dark panel owns sync, the as-of meta
          line, the pending-out companion on its rail, and mismatch
          reconciliation. Zone ownership: pending out lives ONLY here. */}
      <WalletBalanceCard className="rounded-2xl" />

      {/* Transactions */}
      <WalletTransactionsList />

      {/* Wallet Bulk Transfer Pipeline — Stage 2 history */}
      <BulkTransferBatchList
        selectedBatchId={selectedBulkTransferBatchId}
        onSelectedBatchIdChange={setSelectedBulkTransferBatchId}
      />

      {/* Dialogs */}
      <CreateManualDisbursementDialog
        open={disbursementOpen}
        onOpenChange={handleDisbursementOpenChange}
        onSuccess={invalidateAll}
        initialRecipient={transferRecipient}
      />
      <EmployeeAccountLookupDialog
        open={employeeAccountLookupOpen}
        onOpenChange={setEmployeeAccountLookupOpen}
        onSendToAccount={handleSendToAccount}
      />

      <BulkTransferUploadDialog
        open={bulkTransferDialogOpen}
        onOpenChange={setBulkTransferDialogOpen}
        onViewProgress={setSelectedBulkTransferBatchId}
      />
    </AdminPageCanvas>
  );
}
