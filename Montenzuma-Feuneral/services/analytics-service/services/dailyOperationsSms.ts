import { getRootPool, safeTenantQuery } from '../../../shared/dbConfig';
import { sendTransactionalSms } from '../../app-global/utils/sendTransactionalSms';
import { logger } from '@montezuma/shared-logger';

type BranchRecord = {
  branchId: string;
  branchSlug: string;
  branchName: string;
  branchDbName: string;
  parentBranchId: string | null;
  tenantId: string;
  tenantSlug: string;
  tenantDbName: string;
};

type Recipient = {
  full_name: string;
  phone: string;
};

type BranchSummary = {
  branchName: string;
  intakesToday: number | null;
  releasesToday: number | null;
  coffinBookingsToday: number | null;
  hearseOperationsToday: number | null;
  plannedIntakesTomorrow: number | null;
  plannedReleasesTomorrow: number | null;
  coffinBookingsTomorrow: number | null;
  hearseBookingsTomorrow: number | null;
  fleetBooked: number | null;
  fleetAvailable: number | null;
  fullyBookedDates: string[];
  futureHearseBookings: Record<string, number>;
};

const timezone = process.env.DAILY_OPERATIONS_SMS_TIMEZONE || 'Africa/Nairobi';
const roleAliases = [
  'director',
  'funeral_director',
  'operations_manager',
  'ops_manager',
  'operation_manager',
];

export function getReportDateKeys(now = new Date(), timeZone = timezone): { today: string; tomorrow: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const today = `${values.year}-${values.month}-${values.day}`;
  const [year, month, day] = today.split('-').map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  const tomorrow = [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, '0'),
    String(nextDate.getUTCDate()).padStart(2, '0'),
  ].join('-');
  return { today, tomorrow };
}

function countValue(rows: any[]): number | null {
  if (!rows.length || rows[0]?.count == null) return null;
  const count = Number(rows[0].count);
  return Number.isFinite(count) ? count : null;
}

function displayCount(value: number | null): string {
  return value == null ? 'n/a' : String(value);
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + days));
  return [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, '0'),
    String(nextDate.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function formatReportDate(date: string): string {
  const parsedDate = new Date(`${date}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).formatToParts(parsedDate);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.weekday} ${values.day} ${values.month}`;
}

export function makeReportMessage(
  tenantSlug: string,
  reportDate: string,
  branches: BranchSummary[],
  summary: BranchSummary,
): string {
  const dashboardUrl = `https://restpoint.co.ke/${encodeURIComponent(tenantSlug)}/dashboard`;
  const todayLines = branches.map((branch) =>
    `${branch.branchName}: ${displayCount(branch.intakesToday)} intakes | ${displayCount(branch.releasesToday)} releases | ${displayCount(branch.coffinBookingsToday)} coffin bookings`
  );
  const tomorrowLines = branches.map((branch) => {
    const dispatches = branch.hearseBookingsTomorrow;
    const dispatchLabel = dispatches === 1 ? 'planned dispatch' : 'planned dispatches';
    return `${branch.branchName}: ${displayCount(dispatches)} ${dispatchLabel}`;
  });
  const fleetWatchLines = summary.fullyBookedDates.map(
    (date) => `${formatReportDate(date)} is fully booked.`,
  );

  return [
    `Here is today's operations at a glance - ${formatReportDate(reportDate)}:`,
    '',
    ...todayLines,
    `Fleet: ${displayCount(summary.hearseOperationsToday)} operated | ${displayCount(summary.fleetBooked)} booked | ${displayCount(summary.fleetAvailable)} available`,
    '',
    'FLEET WATCH',
    ...(fleetWatchLines.length > 0 ? fleetWatchLines : ['No fully booked days detected in the next 7 days.']),
    '',
    "TOMORROW'S OUTLOOK",
    ...tomorrowLines,
    '',
    'Stay ahead with live operational insights:',
    dashboardUrl,
  ].join('\n');
}

async function getTenantBranches(): Promise<BranchRecord[]> {
  const rootPool = await getRootPool();
  const [rows] = await rootPool.query(`
    SELECT
      b.id AS branchId,
      b.branch_slug AS branchSlug,
      b.branch_name AS branchName,
      b.branch_db_name AS branchDbName,
      b.parent_branch_id AS parentBranchId,
      b.tenant_id AS tenantId,
      b.tenant_slug AS tenantSlug,
      t.db_name AS tenantDbName
    FROM branches b
    INNER JOIN tenants t ON t.id = b.tenant_id
    WHERE b.is_active = 1 AND t.status = 'active'
      AND b.branch_db_name IS NOT NULL AND b.branch_db_name <> ''
    ORDER BY t.tenant_slug, b.branch_name
  `);
  return rows as BranchRecord[];
}

async function getRecipients(tenantDbName: string): Promise<Recipient[]> {
  const placeholders = roleAliases.map(() => '?').join(', ');
  return safeTenantQuery(
    tenantDbName,
    `SELECT full_name, phone
       FROM users
      WHERE is_active = 1
        AND phone IS NOT NULL AND TRIM(phone) <> ''
        AND LOWER(REPLACE(REPLACE(TRIM(role), ' ', '_'), '-', '_')) IN (${placeholders})`,
    roleAliases,
  ) as Promise<Recipient[]>;
}

async function getBranchSummary(
  branch: BranchRecord,
  today: string,
  tomorrow: string,
  fleetCheckDates: string[],
  operationsDatabase: string,
): Promise<BranchSummary> {
  const availableTables = await safeTenantQuery(
    branch.branchDbName,
    `SELECT TABLE_NAME AS tableName
       FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('deceased', 'body_releases', 'hearse_bookings', 'hearses')`,
  );
  const tables = new Set(availableTables.map((row: any) => String(row.tableName)));
  const summary: BranchSummary = {
    branchName: branch.branchName,
    intakesToday: null,
    releasesToday: null,
    coffinBookingsToday: null,
    hearseOperationsToday: null,
    plannedIntakesTomorrow: null,
    plannedReleasesTomorrow: null,
    coffinBookingsTomorrow: null,
    hearseBookingsTomorrow: null,
    fleetBooked: null,
    fleetAvailable: null,
    fullyBookedDates: [],
    futureHearseBookings: {},
  };
  const count = async (sql: string, date: string): Promise<number | null> =>
    countValue(await safeTenantQuery(branch.branchDbName, sql, [date]));

  if (tables.has('deceased')) {
    summary.intakesToday = await count(
      'SELECT COUNT(*) AS count FROM deceased WHERE DATE(date_admitted) = ?',
      today,
    );
    summary.plannedIntakesTomorrow = await count(
      'SELECT COUNT(*) AS count FROM deceased WHERE DATE(date_admitted) = ?',
      tomorrow,
    );
  }
  if (tables.has('body_releases')) {
    summary.releasesToday = await count(
      'SELECT COUNT(*) AS count FROM body_releases WHERE DATE(date_of_removal) = ?',
      today,
    );
    summary.plannedReleasesTomorrow = await count(
      'SELECT COUNT(*) AS count FROM body_releases WHERE DATE(date_of_removal) = ?',
      tomorrow,
    );
  }
  if (tables.has('hearse_bookings')) {
    const activeStatuses = "LOWER(COALESCE(status, '')) IN ('pending', 'confirmed', 'booked', 'in_progress', 'completed')";
    summary.hearseOperationsToday = countValue(await safeTenantQuery(
      branch.branchDbName,
      `SELECT COUNT(DISTINCT hearse_id) AS count
         FROM hearse_bookings
        WHERE DATE(booking_date) = ? AND ${activeStatuses}`,
      [today],
    ));
    summary.hearseBookingsTomorrow = countValue(await safeTenantQuery(
      branch.branchDbName,
      `SELECT COUNT(*) AS count
         FROM hearse_bookings
        WHERE DATE(booking_date) = ? AND ${activeStatuses}`,
      [tomorrow],
    ));
  }
  if (tables.has('hearses')) {
    summary.fleetBooked = 0;
    summary.fleetAvailable = 0;
    const statuses = await safeTenantQuery(
      branch.branchDbName,
      `SELECT LOWER(COALESCE(status, 'unknown')) AS status, COUNT(*) AS count
         FROM hearses GROUP BY LOWER(COALESCE(status, 'unknown'))`,
    );
    for (const row of statuses) {
      const count = Number(row.count);
      if (String(row.status) === 'booked') summary.fleetBooked = (summary.fleetBooked || 0) + count;
      if (String(row.status) === 'available') summary.fleetAvailable = (summary.fleetAvailable || 0) + count;
    }

    if (tables.has('hearse_bookings')) {
      const activeStatuses = "LOWER(COALESCE(status, '')) IN ('pending', 'confirmed', 'booked', 'in_progress')";
      const datesToCheck = fleetCheckDates.filter((date) => date !== today);
      if (datesToCheck.length > 0) {
        const bookingRows = await safeTenantQuery(
          branch.branchDbName,
          `SELECT DATE_FORMAT(booking_date, '%Y-%m-%d') AS bookingDate,
                  COUNT(DISTINCT hearse_id) AS count
             FROM hearse_bookings
            WHERE booking_date IN (${datesToCheck.map(() => '?').join(', ')})
              AND ${activeStatuses}
            GROUP BY DATE(booking_date)`,
          datesToCheck,
        );
        summary.futureHearseBookings = Object.fromEntries(
          bookingRows.map((row: any) => [String(row.bookingDate).slice(0, 10), Number(row.count)]),
        );
      }
    }
  }

  const safeOperationsDatabase = operationsDatabase.trim();
  if (!/^[a-zA-Z0-9_]+$/.test(safeOperationsDatabase)) {
    throw new Error('OPERATIONS_DATABASE must be a valid database identifier');
  }
  const rootPool = await getRootPool();
  const qualifiedBookings = `\`${safeOperationsDatabase}\`.\`coffin_bookings\``;
  try {
    const [tableRows] = await rootPool.query(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1',
      [safeOperationsDatabase, 'coffin_bookings'],
    );
    if ((tableRows as any[]).length > 0) {
      const branchScope = branch.parentBranchId == null
        ? '(branch_id = ? OR (branch_id IS NULL AND tenant_slug IN (?, ?)))'
        : '(branch_id = ? OR (branch_id IS NULL AND tenant_slug = ?))';
      const scopeValues = branch.parentBranchId == null
        ? [branch.branchId, branch.branchSlug, branch.tenantSlug]
        : [branch.branchId, branch.branchSlug];
      const [todayRows] = await rootPool.query(
        `SELECT COUNT(*) AS count FROM ${qualifiedBookings}
          WHERE ${branchScope} AND DATE(created_at) = ?
            AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'canceled', 'rejected')`,
        [...scopeValues, today],
      );
      const [tomorrowRows] = await rootPool.query(
        `SELECT COUNT(*) AS count FROM ${qualifiedBookings}
          WHERE ${branchScope} AND DATE(service_date) = ?
            AND LOWER(COALESCE(status, '')) NOT IN ('cancelled', 'canceled', 'rejected')`,
        [...scopeValues, tomorrow],
      );
      summary.coffinBookingsToday = countValue(todayRows as any[]);
      summary.coffinBookingsTomorrow = countValue(tomorrowRows as any[]);
    }
  } catch (error) {
    logger.warn({
      msg: 'Daily operations SMS could not read coffin bookings',
      tenantSlug: branch.tenantSlug,
      branchSlug: branch.branchSlug,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return summary;
}

function aggregateBranchSummaries(branches: BranchSummary[]): BranchSummary {
  const sum = (field: keyof BranchSummary): number | null => {
    const values = branches
      .map((branch) => branch[field])
      .filter((value): value is number => typeof value === 'number');
    return values.length ? values.reduce((total, value) => total + value, 0) : null;
  };
  const fleetBooked = sum('fleetBooked');
  const fleetAvailable = sum('fleetAvailable');
  const futureHearseBookings = branches.reduce<Record<string, number>>((totals, branch) => {
    for (const [date, count] of Object.entries(branch.futureHearseBookings)) {
      totals[date] = (totals[date] || 0) + count;
    }
    return totals;
  }, {});
  const fleetSize = (fleetBooked || 0) + (fleetAvailable || 0);
  return {
    branchName: 'All branches',
    intakesToday: sum('intakesToday'),
    releasesToday: sum('releasesToday'),
    coffinBookingsToday: sum('coffinBookingsToday'),
    hearseOperationsToday: sum('hearseOperationsToday'),
    plannedIntakesTomorrow: sum('plannedIntakesTomorrow'),
    plannedReleasesTomorrow: sum('plannedReleasesTomorrow'),
    coffinBookingsTomorrow: sum('coffinBookingsTomorrow'),
    hearseBookingsTomorrow: sum('hearseBookingsTomorrow'),
    fleetBooked,
    fleetAvailable,
    fullyBookedDates: fleetSize > 0
      ? Object.entries(futureHearseBookings)
        .filter(([, count]) => count >= fleetSize)
        .map(([date]) => date)
        .sort()
      : [],
    futureHearseBookings,
  };
}

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function sendWithRetry(
  recipient: Recipient,
  message: string,
  tenantSlug: string,
): Promise<boolean> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const sent = await sendTransactionalSms({
      phone: recipient.phone,
      message,
      tenantSlug,
      event: 'daily-operations-report',
    });
    if (sent) return true;
    if (attempt < 3) await delay(attempt * 1000);
  }
  return false;
}

export async function sendDailyOperationsReports(): Promise<{ tenants: number; messagesSent: number }> {
  const { today, tomorrow } = getReportDateKeys();
  const fleetCheckDates = Array.from({ length: 8 }, (_, index) => addDays(today, index));
  const branches = await getTenantBranches();
  const byTenant = new Map<string, BranchRecord[]>();
  for (const branch of branches) {
    const list = byTenant.get(branch.tenantId) || [];
    list.push(branch);
    byTenant.set(branch.tenantId, list);
  }

  const operationsDatabase = process.env.OPERATIONS_DATABASE || 'restpoint_operations';
  let messagesSent = 0;
  let tenantsProcessed = 0;

  for (const tenantBranches of byTenant.values()) {
    const tenant = tenantBranches[0];
    if (!tenant) continue;

    let recipients: Recipient[];
    try {
      recipients = await getRecipients(tenant.tenantDbName);
    } catch (error) {
      logger.error({
        msg: 'Daily operations SMS could not load tenant recipients',
        tenantSlug: tenant.tenantSlug,
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
    if (recipients.length === 0) {
      logger.warn({
        msg: 'Daily operations SMS skipped: no director or operations-manager phone numbers',
        tenantSlug: tenant.tenantSlug,
      });
      continue;
    }

    const summaries: BranchSummary[] = [];
    for (const branch of tenantBranches) {
      try {
        summaries.push(await getBranchSummary(branch, today, tomorrow, fleetCheckDates, operationsDatabase));
      } catch (error) {
        logger.error({
          msg: 'Daily operations SMS could not load branch metrics',
          tenantSlug: tenant.tenantSlug,
          branchSlug: branch.branchSlug,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    if (summaries.length === 0) continue;

    const reportSummary = aggregateBranchSummaries(summaries);
    tenantsProcessed++;
    for (const recipient of recipients) {
      const message = makeReportMessage(tenant.tenantSlug, today, summaries, reportSummary);
      if (await sendWithRetry(recipient, message, tenant.tenantSlug)) {
        messagesSent++;
      } else {
        logger.error({
          msg: 'Daily operations SMS delivery failed after retries',
          tenantSlug: tenant.tenantSlug,
        });
      }
    }
  }

  logger.info({ msg: 'Daily operations SMS run completed', tenantsProcessed, messagesSent });
  return { tenants: tenantsProcessed, messagesSent };
}
