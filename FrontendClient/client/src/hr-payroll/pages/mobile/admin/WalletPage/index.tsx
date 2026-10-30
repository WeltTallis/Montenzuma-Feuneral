import { Wallet01 } from '@untitledui/icons';
import WalletTransactionsList from '@hr/components/wallet/WalletTransactionsList';
import { MobilePageHeader } from '@hr/components/shared/MobilePageHeader';

export default function WalletPageMobile() {
  return (
    <div className="min-h-dvh bg-background">
      <MobilePageHeader
        title="Wallet transaction history"
        icon={Wallet01}
        subtitle="Historical payment records are retained for review. New payroll payments use a manual bank transfer process."
      />
      <div className="space-y-4 px-4 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <WalletTransactionsList />
      </div>
    </div>
  );
}
