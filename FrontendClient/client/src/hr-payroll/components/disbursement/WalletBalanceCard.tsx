import { useQuery } from "@tanstack/react-query";
import { cn } from "@hr/lib/utils";
import { Skeleton } from "@hr/components/ui/skeleton";
import { walletService } from "@hr/services/api/wallet.service";
import { formatCurrency } from "@hr/utils/formatters";
import {
  WALLET_BALANCE_REFETCH_INTERVAL_MS,
} from "@hr/lib/cache/queryCacheTimes";
import { formatKenyanDateTime } from "@hr/utils/kenyan";
import type { WalletBalance } from "@hr/types/api/wallet.types";

interface WalletBalanceCardProps {
  className?: string;
  compact?: boolean;
}

export function WalletBalanceCard({ className, compact = false }: WalletBalanceCardProps) {
  const { data: walletBalance, isLoading } = useQuery<WalletBalance>({
    queryKey: ["wallet", "balance"],
    queryFn: () => walletService.getBalance(),
    refetchInterval: WALLET_BALANCE_REFETCH_INTERVAL_MS,
  });
  const available = walletBalance?.available ?? 0;

  return (
    <section
      aria-label="Historical wallet balance"
      className={cn(
        "treasury-panel--dark relative h-full overflow-hidden text-white",
        "bg-[radial-gradient(130%_130%_at_0%_0%,#0C7A50_0%,#06452E_48%,#032B1D_100%)]",
        "ring-1 ring-inset ring-white/[0.08]",
        compact ? "p-3.5" : "px-4 py-3 sm:px-6",
        className
      )}
    >
      {/* Aurora — slow emerald drift behind the HUD grid, keeps the panel alive
          without competing with the balance figure. */}
      <div className="treasury-aurora" aria-hidden />

      {/* Grid pattern overlay — masked so the HUD grid is strongest at the
          top-left corner and dissolves toward the bottom-right. */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backgroundImage: 'linear-gradient(rgba(183,228,202,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(183,228,202,0.10) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(140% 110% at 0% 0%, black 25%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(140% 110% at 0% 0%, black 25%, transparent 78%)',
        }}
      />

      {/* Light sweep across the glass — same primitive the mobile band uses. */}
      <div className="band-sheen band-sheen--glass pointer-events-none absolute inset-0 z-[1]" aria-hidden />

      <div className="relative z-[2]">
        {isLoading ? (
          compact ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                <div className="h-7 w-7 animate-pulse rounded-lg bg-white/10" />
              </div>
              <div className="h-9 w-44 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-36 animate-pulse rounded bg-white/10" />
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="h-12 animate-pulse rounded-lg bg-white/10" />
                <div className="h-12 animate-pulse rounded-lg bg-white/10" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
                <div className="h-8 w-44 animate-pulse rounded bg-white/10" />
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-5">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-40 animate-pulse rounded bg-white/10" />
                  <div className="h-2.5 w-28 animate-pulse rounded bg-white/10" />
                </div>
                <div className="h-11 w-11 animate-pulse rounded-lg bg-white/10" />
              </div>
            </div>
          )
        ) : walletBalance ? (
          compact ? (
            <>
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="led-pulse h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(110,231,183,0.18)]" />
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-utility-success-200">
                      Historical wallet balance
                    </span>
                  </div>
                </div>

                {/* Main Balance */}
                <div className={cn(
                  "treasury-value mt-1.5 max-w-full break-words font-financial font-semibold leading-[1.08] tracking-normal tabular-nums",
                  "text-[clamp(1.375rem,7.5vw,1.5rem)]",
                  "text-white [text-shadow:0_0_36px_rgba(110,231,183,0.30)]"
                )}>
                  {formatCurrency(available, walletBalance.currency)}
                </div>

                <div className="mt-1.5 text-xs text-white/60">
                  Legacy records retained for historical reference.
                </div>
              </div>

              {/* Pending amounts are derived from retained historical records. */}
              <div className="treasury-rail treasury-rail--dark mt-3 pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/60">
                    Recorded pending payments
                  </span>
                  <span className="break-words font-financial text-[13px] font-medium leading-snug tabular-nums text-white">
                    {formatCurrency(walletBalance.pending_out, walletBalance.currency)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Historical balance and pending totals are read-only. */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                {/* Balance cluster */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="led-pulse h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(110,231,183,0.18)]" />
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-utility-success-200">
                      Historical wallet balance
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className={cn(
                      "treasury-value max-w-full break-words font-financial font-semibold leading-none tracking-normal tabular-nums",
                      "text-[clamp(1.5rem,3vw,1.75rem)]",
                      "text-white [text-shadow:0_0_36px_rgba(110,231,183,0.30)]"
                    )}>
                      {formatCurrency(available, walletBalance.currency)}
                    </div>
                  </div>
                </div>

                {/* Historical update metadata */}
                <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-5">
                  <div className="min-w-0 leading-tight">
                    {walletBalance?.as_of && (
                      <p className="text-xs tabular-nums tracking-wide text-white/55">
                        Updated {formatKenyanDateTime(walletBalance.as_of)}
                      </p>
                    )}
                    <p className={cn("flex items-baseline gap-2", walletBalance?.as_of && "mt-1")}>
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/60">
                        Pending disbursements
                      </span>
                      <span className="font-financial text-[15px] font-medium leading-snug tabular-nums text-white">
                        {formatCurrency(walletBalance.pending_out, walletBalance.currency)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )
        ) : (
          <div className="flex h-24 items-center justify-center">
            <p className="text-sm text-white/50">Unable to load balance</p>
          </div>
        )}
      </div>
    </section>
  );
}
