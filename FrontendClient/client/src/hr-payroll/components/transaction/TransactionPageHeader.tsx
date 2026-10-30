// UU PRO restyle (W13c): lucide → verified @untitledui/icons; behavior and
// Loading01 replaces lucide's Loader2 spinner.
import {
  BarChart03,
  BookOpen01,
  ChevronDown,
  ClipboardCheck,
  ClockRewind,
  Download01,
  DotsHorizontal,
  Loading01,
  Mail01,
  Plus,
  Wallet01,
  Zap,
} from '@untitledui/icons';
import { Button } from '@hr/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@hr/components/ui/dropdown-menu';
import { PageHeader } from '@hr/components/shared/PageHeader';

interface TransactionPageHeaderProps {
  onAddTransaction: () => void;
  onSendSaoKePayroll: () => void;
  onSendSaoKeAdvance: () => void;
  onViewSaoKeHistory: () => void;
  onExportSaoKePayroll: () => void;
  onExportSaoKeAdvance: () => void;
  isSendingSaoKe?: boolean;
  onRunWalletSettlement?: () => void;
  isRunningWalletSettlement?: boolean;
  onSimulateSettlement?: () => void;
}

export function TransactionPageHeader({
  onAddTransaction,
  onSendSaoKePayroll,
  onSendSaoKeAdvance,
  onViewSaoKeHistory,
  onExportSaoKePayroll,
  onExportSaoKeAdvance,
  isSendingSaoKe = false,
  onRunWalletSettlement,
  isRunningWalletSettlement = false,
  onSimulateSettlement,
}: TransactionPageHeaderProps) {
  return (
    <PageHeader title="Ledger" description="Manage income, expenses and cash flow" icon={BookOpen01}>
      <div className="hidden max-w-full flex-wrap items-center justify-end gap-2 min-[1800px]:flex">
        <div className="flex max-w-full items-center divide-x divide-border overflow-hidden rounded-xl border border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-none border-0 gap-1.5"
              >
                <Download01 className="w-4 h-4" />
                Export statement
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportSaoKePayroll}>
                <BarChart03 className="w-4 h-4 mr-2" />
                Timesheets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportSaoKeAdvance}>
                <Wallet01 className="w-4 h-4 mr-2" />
                Salary advance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-none border-0 gap-1.5"
                disabled={isSendingSaoKe}
              >
                <Mail01 className="w-4 h-4" />
                {isSendingSaoKe ? 'Sending...' : 'Send statement'}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSendSaoKePayroll}>
                <BarChart03 className="w-4 h-4 mr-2" />
                Timesheets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSendSaoKeAdvance}>
                <Wallet01 className="w-4 h-4 mr-2" />
                Salary advance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            className="rounded-none border-0 gap-1.5"
            onClick={onViewSaoKeHistory}
          >
            <ClockRewind className="w-4 h-4" />
            Reconciliation
          </Button>
        </div>
        {onSimulateSettlement && (
          <Button variant="outline" onClick={onSimulateSettlement}>
            <ClipboardCheck className="w-4 h-4" />
            Simulate reconciliation
          </Button>
        )}
        {onRunWalletSettlement && (
          <Button
            variant="outline"
            onClick={onRunWalletSettlement}
            disabled={isRunningWalletSettlement}
          >
            {isRunningWalletSettlement ? (
              <Loading01 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Run payroll settlement
          </Button>
        )}
        <Button onClick={onAddTransaction}>
          <Plus />
          Add transaction
        </Button>
      </div>

      <div className="flex items-center gap-2 min-[1800px]:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="More options"
            >
              <DotsHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Download01 className="mr-2 h-4 w-4" />
                Export statement
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={onExportSaoKePayroll}>
                  <BarChart03 className="mr-2 h-4 w-4" />
                  Timesheets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportSaoKeAdvance}>
                  <Wallet01 className="mr-2 h-4 w-4" />
                  Salary advance
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={isSendingSaoKe}>
                {isSendingSaoKe ? (
                  <Loading01 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail01 className="mr-2 h-4 w-4" />
                )}
                {isSendingSaoKe ? 'Sending...' : 'Send statement'}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={onSendSaoKePayroll}>
                  <BarChart03 className="mr-2 h-4 w-4" />
                  Timesheets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSendSaoKeAdvance}>
                  <Wallet01 className="mr-2 h-4 w-4" />
                  Salary advance
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onViewSaoKeHistory}>
              <ClockRewind className="mr-2 h-4 w-4" />
              Reconciliation
            </DropdownMenuItem>
            {onSimulateSettlement && (
              <DropdownMenuItem className="lg:hidden" onClick={onSimulateSettlement}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Simulate reconciliation
              </DropdownMenuItem>
            )}
            {onRunWalletSettlement && (
              <DropdownMenuItem
                onClick={onRunWalletSettlement}
                disabled={isRunningWalletSettlement}
              >
                {isRunningWalletSettlement ? (
                  <Loading01 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                {isRunningWalletSettlement ? 'Running settlement...' : 'Run wallet settlement'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {onSimulateSettlement && (
          <Button
            data-testid="compact-settlement-simulation-button"
            variant="outline"
            onClick={onSimulateSettlement}
            className="hidden h-9 lg:inline-flex"
          >
            <ClipboardCheck className="h-4 w-4" />
            Simulate reconciliation
          </Button>
        )}

        <Button onClick={onAddTransaction} size="sm" className="h-9 px-3 text-sm">
          <Plus className="h-4 w-4" />
          Add transaction
        </Button>
      </div>
    </PageHeader>
  );
}
