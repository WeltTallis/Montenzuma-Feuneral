/**
 * Shared query cache timings.
 *
 * Reference data (projects, banks, settings) changes rarely and every mutation
 * invalidates its keys on success, so these queries tolerate a longer
 * staleTime than the global 30s default — this skips redundant
 * focus/interval refetches of unchanged data without hiding changes.
 */
export const REFERENCE_DATA_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Auto-refresh cadence for wallet balance data.
 *
 * The wallet balance is calculated from retained historical records; this
 * interval refreshes the read-only display while it is open.
 * Both pause while the tab is hidden (TanStack refetchIntervalInBackground
 * defaults to false).
 *
 * WALLET_BALANCE hits a cheap DB aggregate (as_of, pending_out);
 * Disbursement settings are refreshed less frequently than the local balance.
 */
export const WALLET_BALANCE_REFETCH_INTERVAL_MS = 60 * 1000;
export const DISBURSEMENT_SETTINGS_REFETCH_INTERVAL_MS = 2 * 60 * 1000;
