import { shouldShowNotificationBell, BELL_HIDDEN_ROUTES } from './FrontendClient/client/src/components/notifications/bellVisibility.js';

const cases = [
  // Hidden: workshop + mini store (slug-first and legacy shapes)
  ['/acme/workshop', false],
  ['/acme/workshop/store-journal', false],
  ['/acme/mini-store', false],
  ['/acme/store', false],
  ['/tenant/acme/workshop', false],
  ['/tenant/acme/mini-store', false],
  ['/tenant/acme/store', false],
  // Previously hidden entries still hidden
  ['/acme/dashboard', false],
  ['/acme/analytics', false],
  ['/acme/flowers', false],
  ['/acme/flowers/order/9', false],
  ['/acme/deceased/register', false],
  ['/acme/driver-portal', false],
  ['/acme/release-form/3', false],
  ['/acme/receptionist', false],
  ['/acme/flower-samples', false],
  // Still visible elsewhere
  ['/acme/all-deceased', true],
  ['/acme/dashboard-analytics-thing', true],
  ['/acme/workshopish', true],
  ['/acme/mini-store2', true],
  ['/acme/storeroom', true],
  ['/acme/support', true],
  ['/acme/deceased', true],
  // NOTE: bare-slug edge cases (/workshop/all-deceased) mirror the PRE-EXISTING
  // behavior of /dashboard/all-deceased (hidden even before this change).
];

let failed = 0;
for (const [path, expected] of cases) {
  const actual = shouldShowNotificationBell(path);
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  show=${String(actual).padEnd(5)} ${path}`);
}
console.log(`\nHidden routes: ${BELL_HIDDEN_ROUTES.join(', ')}`);
console.log(failed === 0 ? `ALL ${cases.length} PASS` : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
