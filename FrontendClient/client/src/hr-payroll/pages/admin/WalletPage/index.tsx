import { Wallet01 } from '@untitledui/icons';
import { AdminPageCanvas } from '@hr/components/shared/AdminPageFrame';
import { PageHeader } from '@hr/components/shared/PageHeader';
import WalletTransactionsList from '@hr/components/wallet/WalletTransactionsList';

export default function WalletPage() {
  return (
    <AdminPageCanvas>
      <PageHeader
        icon={Wallet01}
        title="Wallet transaction history"
        description="Historical payment records are retained for review. New payroll payments are prepared for manual bank transfer."
      />
      <WalletTransactionsList />
    </AdminPageCanvas>
  );
}
