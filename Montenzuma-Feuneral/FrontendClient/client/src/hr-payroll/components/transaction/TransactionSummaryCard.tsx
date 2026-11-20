import { Skeleton } from '@hr/components/ui/skeleton';
import { formatCurrency } from '@hr/utils/formatters';
import type { LedgerSummary } from '@hr/types/api/financial.types';
import { useMemo, type ReactNode } from 'react';
import { cn } from '@hr/lib/utils';

interface SupportingMetric {
  label: string;
  value: string;
  valueClassName?: string;
}

interface KpiTile {
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
  wide?: boolean;
  valueClassName?: string;
}

function KpiTileView({ tile }: { tile: KpiTile }) {
  return (
    <article className={cn('overflow-hidden rounded-xl border border-border/70 bg-card px-4 py-3', tile.wide && 'sm:col-span-2', tile.emphasis && 'bg-primary/5')}>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {tile.label}
      </h3>
      <p className={cn('mt-1.5 break-words font-financial font-semibold tabular-nums tracking-tight', tile.emphasis ? 'text-2xl text-primary sm:text-3xl' : 'text-lg text-foreground', tile.valueClassName)}>
        {tile.value}
      </p>
      {tile.emphasis && tile.sub && (
        <p className="mt-0.5 text-xs text-muted-foreground">{tile.sub}</p>
      )}
    </article>
  );
}

function SummarySkeleton({ showCapital }: { showCapital: boolean }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading financial overview">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Skeleton className="h-[84px] rounded-xl sm:col-span-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[84px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Skeleton className="h-[124px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[124px] rounded-xl" />
      </div>
      {showCapital && <div className="hidden" aria-hidden="true" />}
    </div>
  );
}

interface TransactionSummaryCardProps {
  ledgerSummary?: LedgerSummary;
  isLoading: boolean;
  className?: string;
  renderCapitalCard?: () => ReactNode;
}

export function TransactionSummaryCard({ ledgerSummary, isLoading, className, renderCapitalCard }: TransactionSummaryCardProps) {
  const liabilityItems = useMemo<SupportingMetric[]>(() => {
    if (!ledgerSummary) return [];
    const { by_account } = ledgerSummary;
    const payable = by_account.payable?.net_amount ?? 0;
    return [
      { label: 'Receivables', value: formatCurrency(by_account.receivable?.net_amount ?? 0) },
      { label: 'Payables', value: formatCurrency(payable), valueClassName: payable < 0 ? 'text-red-700' : undefined },
      { label: 'Loans', value: formatCurrency(by_account.loan?.net_amount ?? 0) },
    ];
  }, [ledgerSummary]);

  const perf = useMemo(() => {
    if (!ledgerSummary) return null;
    const { by_account } = ledgerSummary;
    const revenue = by_account.revenue?.net_amount ?? 0;
    const expense = by_account.expense?.net_amount ?? 0;
    const cash = by_account.cash?.net_amount ?? 0;
    return {
      cash: formatCurrency(cash),
      revenue: formatCurrency(revenue),
      expense: formatCurrency(expense),
      profit: formatCurrency(revenue - expense),
      margin: revenue > 0 ? `${((revenue - expense) / revenue * 100).toLocaleString('en-KE', { maximumFractionDigits: 1 })}%` : '—',
    };
  }, [ledgerSummary]);

  if (isLoading) {
    return (
      <div className={cn(className)}>
        <SummarySkeleton showCapital={Boolean(renderCapitalCard)} />
      </div>
    );
  }

  if (!ledgerSummary || !perf) return null;

  // KPI strip: cash position leads (2 tiles wide, emphasized); liabilities
  // rows become tiles so receivables/payables sit beside cash where they
  // drive action.
  const kpis: KpiTile[] = [
    { label: 'Current liquidity', value: perf.cash, sub: 'Available cash in the ledger', emphasis: true, wide: true },
    ...liabilityItems,
  ];

  const perfStats = [
    { label: 'Revenue', value: perf.revenue },
    { label: 'Expenses', value: perf.expense },
    { label: 'Profit', value: perf.profit, highlight: true },
    { label: 'Profit margin', value: perf.margin },
  ];

  return (
    <section aria-label="Financial overview" className={cn('space-y-3', className)}>
      <h2 className="sr-only">Financial overview</h2>

      {/* KPI strip — cash (2 tiles wide) plus receivables, payables and loans */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpis.map((tile) => (
          <KpiTileView key={tile.label} tile={tile} />
        ))}
      </div>

      {/* P&L story (2/3) + capital structure (1/3) */}
      <div className="grid gap-3 lg:grid-cols-3">
        <article className="overflow-hidden rounded-xl border border-border/70 bg-card lg:col-span-2">
          <div className="border-b border-border/60 px-4 py-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Business performance
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Revenue minus expenses in the ledger for this period
            </p>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 sm:divide-x sm:divide-border/60">
            {perfStats.map((item) => (
              <div key={item.label} className="px-4 py-3">
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd
                  className={cn(
                    'mt-1 break-words font-financial text-base font-semibold tabular-nums text-foreground',
                    item.highlight && 'text-primary',
                  )}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </article>

        <div className="lg:col-span-1">{renderCapitalCard?.()}</div>
      </div>
    </section>
  );
}
