import { Request, Response } from 'express';
import { safeTenantQuery, resolveDatabase, lookupTenantDatabase } from '../../../shared/dbConfig';
import { logger } from '@montezuma/shared-logger';
import {
  DeceasedAnalyticsData, DeceasedAnalyticsQuery
} from '../types/analytics.types';

// Helper to format date for display
const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Helper to normalize a DB row into the shape consumed by the DeceasedAnalytics frontend component.
const mapRecord = (r: any) => {
  const admission = String(r.admission_status || r.status || '').toLowerCase();
  const released = admission === 'released' || admission === 'buried' || admission === 'completed' || admission === 'dispatched';
  const pmRequested = r.pm_pending === 1 || r.pm_completed === 1;
  const pmCompleted = r.pm_completed === 1;
  // Derive the human-friendly body_status used by the frontend from the DB admission_status / postmortem state.
  const body_status = released
    ? 'Released'
    : (pmRequested && !pmCompleted ? 'Pending Autopsy' : 'In Morgue');

  const rawDate = (v: any): string => (!v ? '' : String(v).slice(0, 10));
  return {
    id: r.id,
    admission_number: r.admission_number || '',
    full_name: r.full_name || 'Unknown',
    gender: r.gender || 'Other',
    age: r.age != null && !isNaN(Number(r.age)) ? Number(r.age) : 0,
    date_admitted: rawDate(r.date_admitted),
    time_received: r.time_received || '',
    cause_of_death: r.cause_of_death || '',
    body_status,
    postmortem_requested: pmRequested,
    postmortem_completed: pmCompleted,
    postmortem_report: pmCompleted ? 'Report filed — available for collection' : '',
    contact_person: r.receiving_officer || r.contact_person || '',
    id_number: r.national_id || r.id_number || '',
    tel_number: r.phone_number || r.tel_number || '',
    received_from: r.received_from || '',
    dispatch_date: rawDate(r.dispatch_date),
    dispatch_time: r.dispatch_time || '',
    dispatched_to: released ? (r.dispatched_to || 'Family — Burial') : (r.dispatched_to || ''),
  };
};

/**
 * Get comprehensive deceased analytics data
 * Matches the frontend DeceasedAnalytics component requirements
 */
export const getDeceasedAnalytics = async (req: any, res: any): Promise<void> => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  // Extract query parameters
  const query: DeceasedAnalyticsQuery = {
    timeRange: ((req as any).query.timeRange as '3m' | '6m' | '12m') || '3m',
    startDate: (req as any).query.startDate as string | undefined,
    endDate: (req as any).query.endDate as string | undefined,
    status: (req as any).query.status as string | undefined,
    pmFilter: (req as any).query.pMFilter as string | undefined,
    searchQuery: (req as any).query.searchQuery as string | undefined,
    selectedDate: (req as any).query.selectedDate as string | undefined
  };

  const tenantSlug = (req as any).headers['x-tenant-slug'] as string || (req as any).headers['x-tenant-id'] as string || 'system_shared';
  const branchId = (req as any).headers['x-branch-id'] as string || (req as any).query.branchId as string || null;

  // Resolve database
  const resolveSlug = branchId ? `${tenantSlug}-${branchId}` : tenantSlug;
  const dbName = await resolveDatabase(resolveSlug) || await lookupTenantDatabase(tenantSlug);

  if (!dbName) {
    res.status(200).json({
      success: true,
      data: getEmptyAnalyticsData(requestId),
      metadata: { requestId, timestamp: new Date().toISOString(), executionTime: Date.now() - startTime, timeRange: query.timeRange }
}
    return;
  }

  try {
    (logger as any).info(`[${requestId}] Fetching deceased analytics for tenant: ${tenantSlug}, branch: ${branchId}`);

    // Calculate date range based on timeRange
    const monthsBack = query.timeRange === '3m' ? 3 : query.timeRange === '6m' ? 6 : 12;
    const dateFilter = query.startDate && query.endDate
      ? `AND date_admitted BETWEEN '${query.startDate}' AND '${query.endDate}'`
      : `AND date_admitted >= DATE_SUB(NOW(), INTERVAL ${monthsBack} MONTH)`;

    // Fetch ALL deceased records (full list) with a gracefu fallback if the postmortem table is missing.
    const fetchAllRecords = async (): Promise<any[]> => {
      try {
        const rows = await safeTenantQuery(dbName, `
          SELECT
            d.id, d.deceased_id, d.admission_number, d.full_name, d.gender, d.age,
            DATE(d.date_of_birth) as date_of_birth, DATE(d.date_of_death) as date_of_death,
            DATE(d.date_admitted) as date_admitted, d.time_received, d.cause_of_death,
            d.national_id, d.phone_number, d.received_from, d.receiving_officer,
            d.body_status, d.admission_status, d.status, d.dispatch_date, d.dispatch_time, d.dispatched_to,
            p.pending as pm_pending, p.completed as pm_completed
          FROM deceased d
          LEFT JOIN (
            SELECT deceased_id,
              MAX(CASE WHEN status IN ('pending') THEN 1 ELSE 0 END) as pending,
              MAX(CASE WHEN status IN ('completed','approved','released') THEN 1 ELSE 0 END) as completed
            FROM postmortem
            GROUP BY deceased_id
          ) p ON p.deceased_id = d.deceased_id
          WHERE d.tenant_slug = ? AND d.is_deleted = FALSE
          ORDER BY d.date_admitted DESC
          LIMIT 500
        `, [tenantSlug]);
        return Array.isArray(rows) ? rows : [];
      } catch (err) {
        // Fallback: postmortem table may be missing in some tenant DBs — fetch without the join.
        try {
          const rows = await safeTenantQuery(dbName, `
            SELECT
              id, deceased_id, admission_number, full_name, gender, age,
              DATE(date_of_birth) as date_of_birth, DATE(date_of_death) as date_of_death,
              DATE(date_admitted) as date_admitted, time_received, cause_of_death,
              national_id, phone_number, received_from, receiving_officer,
              body_status, admission_status, status, dispatch_date
            FROM deceased
            WHERE tenant_slug = ? AND is_deleted = FALSE
            ORDER BY date_admitted DESC
            LIMIT 500
          `, [tenantSlug]);
          return Array.isArray(rows) ? rows : [];
        } catch (err2) {
          return [];
        }
      }
    };

    // Fetch all data in parallel using Promise.allSettled for resilience
    const [
      statsResult,
      statusResult,
      monthlyTrendsResult,
      genderResult,
      pmTrackingResult,
      stayDurationResult,
      calendarResult,
      awaitingAutopsyResult,
      awaitingDispatchResult,
      dispatchedResult,
      recordsResult
    ] = await Promise.allSettled([
      // 1. Overall statistics
      safeTenantQuery(dbName, `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN MONTH(date_admitted) = MONTH(CURDATE()) AND YEAR(date_admitted) = YEAR(CURDATE()) THEN 1 END) as this_month,
          COUNT(CASE WHEN WEEK(date_admitted) = WEEK(CURDATE()) AND YEAR(date_admitted) = YEAR(CURDATE()) THEN 1 END) as this_week,
          COUNT(CASE WHEN DATE(date_admitted) = CURDATE() THEN 1 END) as today,
          COUNT(CASE WHEN admission_status IN ('admitted', 'embalmed') THEN 1 END) as active,
          COUNT(CASE WHEN admission_status IN ('released', 'buried') THEN 1 END) as released,
          COUNT(CASE WHEN admission_status IN ('admitted', 'embalmed') THEN 1 END) as in_morgue,
          COUNT(CASE WHEN release_status = 'pending' AND admission_status != 'released' THEN 1 END) as pending_autopsy
        FROM deceased
        WHERE tenant_slug = ? AND is_deleted = FALSE ${dateFilter}
      `, [tenantSlug]),

      // 2. Status distribution
      safeTenantQuery(dbName, `
        SELECT 
          COALESCE(admission_status, 'Unknown') as status,
          COUNT(*) as count
        FROM deceased
        WHERE tenant_slug = ? AND is_deleted = FALSE ${dateFilter}
        GROUP BY admission_status
        ORDER BY count DESC
      `, [tenantSlug]),

      // 3. Monthly trends
      safeTenantQuery(dbName, `
        SELECT 
          DATE_FORMAT(date_admitted, '%b %Y') as month,
          COUNT(*) as count
        FROM deceased
        WHERE tenant_smitted >= DATE_SUB(NOW(), INTERVAL ${monthsBack} MONTH)
          AND tenant_slug = ? AND is_deleted = FALSE
        GROUP BY DATE_FORMAT(date_admitted, '%Y-%m'), DATE_FORMAT(date_admitted, '%b %Y')
        ORDER BY DATE_FORMAT(date_admitted, '%Y-%m') ASC
      `, [tenantSlug]),

      // 4. Gender distribution
      safeTenantQuery(dbName, `
        SELECT 
          COALESCE(gender, 'Unknown') as gender,
          COUNT(*) as count
        FROM deceased
        WHERE tenant_slug = ? AND is_deleted = FALSE ${dateFilter}
        GROUP BY gender
        ORDER BY count DESC
      `, [tenantSlug]),

      // 5. Postmortem tracking (if postmortem table exists)
      safeTenantQuery(dbName, `
        SELECT 
          COUNT(CASE WHEN postmortem_requested = 1 AND postmortem_completed = 0 THEN 1 END) as pending,
          COUNT(CASE WHEN postmortem_completed = 1 THEN 1 END) as completed,
          COUNT(CASE WHEN postmortem_requested = 0 OR postmortem_requested IS NULL THEN 1 END) as not_requested
        FROM deceased
        WHERE tenant_slug = ? AND is_deleted = FALSE ${dateFilter}
      `, [tenantSlug]).catch(() => ({ pending: 0, completed: 0, not_requested: 0 })),

      // 6. Stay duration (for bodies currently in morgue)
      safeTenantQuery(dbName, `
        SELECT 
          CASE 
            WHEN DATEDIFF(NOW(), date_admitted) <= 1 THEN '0-1 day'
            WHEN DATEDIFF(NOW(), date_admitted) <= 3 THEN '2-3 days'
            WHEN DATEDIFF(NOW(), date_admitted) <= 7 THEN '4-7 days'
            WHEN DATEDIFF(NOW(), date_admitted) <= 14 THEN '8-14 days'
            ELSE '15+ days'
          END as duration_range,
          COUNT(*) as count
        FROM deceased
        WHERE tenant_slug = ? AND is_deleted = FALSE 
          AND admission_status IN ('admitted', 'embalmed')
        GROUP BY duration_range
        ORDER BY 
          CASE duration_range
            WHEN '0-1 day' THEN 1
            WHEN '2-3 days' THEN 2
            WHEN '4-7 days' THEN 3
            WHEN '8-14 days' THEN 4
            WHEN '15+ days' THEN 5
          END
      `, [tenantSlug]),

      // 7. Calendar data (last 3 months)
      safeTenantQuery(dbName, `
        SELECT 
          date_admitted,
          COUNT(*) as total,
          MAX(CASE WHEN postmortem_requested = 1 AND postmortem_completed = 0 THEN 1 ELSE 0 END) as has_pm,
          MAX(CASE WHEN admission_status IN ('released', 'buried') THEN 1 ELSE 0 END) as has_release
        FROM deceased
        WHERE date_admitted >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
          AND tenant_slug = ? AND is_deleted = FALSE
        GROUP BY date_admitted
        ORDER BY date_admitted DESC
      `, [tenantSlug]),

      // 8. Awaiting autopsy (pending postmortem)
      safeTenantQuery(dbName, `
        SELECT 
          id, full_name, admission_number, gender, age, date_admitted,
          time_received, received_from, postmortem_requested, postmortem_completed
        FROM deceased
        WHERE tenant_slug = ? AND is_deleted = FALSE
          AND postmortem_requested = 1 AND postmortem_completed = 0
        ORDER BY date_admitted DESC
        LIMIT 20
      `, [tenantSlug]).catch(() => []),

      // 9. Awaiting dispatch (in morgue, cleared)
      safeTenantQuery(dbName, `
        SELECT 
          id, full_name, admission_number, date_admitted,
          contact_person, tel_number, admission_status as body_status
        FROM deceased
        WHERE tenant_slug = ? AND is_deleted = FALSE
          AND admission_status IN ('admitted', 'embalmed')
          AND (postmortem_completed = 1 OR postmortem_requested = 0)
        ORDER BY date_admitted DESC
        LIMIT 20
      `, [tenantSlug]).catch(() => []),

      // 10. Recently dispatched
      safeTenantQuery(dbName, `
        SELECT 
          id, full_name, admission_number, admission_status as body_status,
          dispatch_date, dispatched_to
        FROM deceased
        WHERE tenant_slug = ? AND is_deleted = FALSE
          AND admission_status IN ('released', 'buried')
          AND dispatch_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY dispatch_date DESC
        LIMIT 20
      `, [tenantSlug]).catch(() => []),

      // 11. ALL records - full list for the analytics tables, calendar & charts
      fetchAllRecords()
    ]);

    // Extract results
    const stats = statsResult.status === 'fulfilled' ? statsResult.value[0] : {};
    const statusData = statusResult.status === 'fulfilled' ? statusResult.value : [];
    const monthlyData = monthlyTrendsResult.status === 'fulfilled' ? monthlyTrendsResult.value : [];
    const genderData = genderResult.status === 'fulfilled' ? genderResult.value : [];
    const pmTracking = pmTrackingResult.status === 'fulfilled' ? (pmTrackingResult.value as any) : { pending: 0, completed: 0, not_requested: 0 };
    const stayData = stayDurationResult.status === 'fulfilled' ? stayDurationResult.value : [];
    const calendarData = calendarResult.status === 'fulfilled' ? calendarResult.value : [];
    const awaitingAutopsy = awaitingAutopsyResult.status === 'fulfilled' ? awaitingAutopsyResult.value : [];
    const awaitingDispatch = awaitingDispatchResult.status === 'fulfilled' ? awaitingDispatchResult.value : [];
    const dispatched = dispatchedResult.status === 'fulfilled' ? dispatchedResult.value : [];
    const records = recordsResult.status === 'fulfilled' ? recordsResult.value : [];

    // Transform data to match frontend expectations
    const transformedData: DeceasedAnalyticsData = {
      // Stats
      total: parseInt(stats.total) || 0,
      thisMonth: parseInt(stats.this_month) || 0,
      thisWeek: parseInt(stats.this_week) || 0,
      today: parseInt(stats.today) || 0,
      active: parseInt(stats.active) || 0,
      released: parseInt(stats.released) || 0,
      inMorgue: parseInt(stats.in_morgue) || 0,
      pmPending: parseInt(pmTracking.pending) || 0,
      pmDone: parseInt(pmTracking.completed) || 0,
      pendingAutopsy: parseInt(stats.pending_autopsy) || 0,
      transferred: 0, // Can be calculated if needed

      // Charts
      monthlyData: Array.isArray(monthlyData) ? monthlyData.map((r: any) => ({
        month: r.month || 'Unknown',
        count: parseInt(r.count) || 0
      })) : [],

      statusData: Array.isArray(statusData) ? statusData.map((r: any) => ({
        status: r.status || 'Unknown',
        count: parseInt(r.count) || 0
      })) : [],

      genderData: Array.isArray(genderData) ? genderData.map((r: any) => ({
        gender: r.gender || 'Unknown',
        count: parseInt(r.count) || 0
      })) : [],

      pmData: {
        pending: parseInt((pmTracking as any).pending) || 0,
        completed: parseInt((pmTracking as any).completed) || 0,
        notRequested: parseInt((pmTracking as any).not_requested) || 0
      },

      stayData: Array.isArray(stayData) ? stayData.map((r: any) => ({
        label: r.duration_range || 'Unknown',
        min: 0,
        max: 999,
        count: parseInt(r.count) || 0,
        color: '' // Will be assigned by frontend
      })) : [],

      // Calendar
      calendarDays: Array.isArray(calendarData) ? calendarData.map((r: any) => ({
        date: r.date_admitted,
        total: parseInt(r.total) || 0,
        hasPM: r.has_pm === 1,
        hasRelease: r.has_release === 1
      })) : [],

      // Action queues
      awaitingAutopsy: Array.isArray(awaitingAutopsy) ? awaitingAutopsy.map((r: any) => ({
        id: r.id,
        full_name: r.full_name,
        admission_number: r.admission_number,
        gender: r.gender,
        age: r.age != null && !isNaN(Number(r.age)) ? Number(r.age) : 0,
        date_admitted: r.date_admitted,
        time_received: r.time_received || '',
        received_from: r.received_from || '',
        postmortem_requested: r.postmortem_requested === 1,
        postmortem_completed: r.postmortem_completed === 1
      })) : [],

      awaitingDispatch: Array.isArray(awaitingDispatch) ? awaitingDispatch.map((r: any) => ({
        id: r.id,
        full_name: r.full_name,
        admission_number: r.admission_number,
        date_admitted: r.date_admitted,
        contact_person: r.contact_person || '',
        tel_number: r.tel_number || '',
        body_status: r.body_status
      })) : [],

      dispatched: Array.isArray(dispatched) ? dispatched.map((r: any) => ({
        id: r.id,
        full_name: r.full_name,
        admission_number: r.admission_number,
        body_status: r.body_status,
        dispatch_date: r.dispatch_date || '',
        dispatched_to: r.dispatched_to || ''
      })) : [],

      // Full records list — drives the tables, calendar and charts in DeceasedAnalytics
      records: Array.isArray(records) ? records.map(mapRecord) : [],

      // Metadata
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        timeRange: query.timeRange || '3m'
      }
    };

    // Emit real-time update via Socket.IO
    const io = (req as any).app?.get('io');
    if (io) {
      (io as any).to('dashboard').emit('analytics_update', {
        type: 'ANALYTICS_UPDATE',
        data: transformedData,
        timestamp: new Date().toISOString()
      });

      // Also emit to tenant-specific room
      (io as any).to(`tenant_${tenantSlug}`).emit('analytics_update', {
        type: 'ANALYTICS_UPDATE',
        data: transformedData,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: transformedData,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      }
}

  } catch (error: any) {
    (logger as any).error(`[${requestId}] Deceased analytics error:`, error.message || error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: getEmptyAnalyticsData(requestId),
      metadata: { requestId, timestamp: new Date().toISOString(), executionTime: Date.now() - startTime }
}
  }
};

/**
 * Get empty analytics data structure
 */
const getEmptyAnalyticsData = (requestId: string): DeceasedAnalyticsData => ({
  total: 0,
  thisMonth: 0,
  thisWeek: 0,
  today: 0,
  active: 0,
  released: 0,
  inMorgue: 0,
  pmPending: 0,
  pmDone: 0,
  pendingAutopsy: 0,
  transferred: 0,
  monthlyData: [],
  statusData: [],
  genderData: [],
  pmData: { pending: 0, completed: 0, notRequested: 0 },
  stayData: [],
  calendarDays: [],
  awaitingAutopsy: [],
  awaitingDispatch: [],
  dispatched: [],
  records: [],
  metadata: {
    requestId,
    timestamp: new Date().toISOString(),
    executionTime: 0,
    timeRange: '3m'
  }
}

/**
 * Background task: Pre-compute and cache analytics data
 * This runs periodically to keep analytics fresh
 */
export const refreshAnalyticsCache = async (tenantSlug: string, branchId?: string): Promise<void> => {
  const requestId = Math.random().toString(36).substring(7);
  (logger as any).info(`[${requestId}] Refreshing analytics cache for tenant: ${tenantSlug}, branch: ${branchId}`);

  try {
    // This would integrate with Redis caching layer
    // For now, just log the intent
    (logger as any).info(`[${requestId}] Analytics cache refresh triggered`);
  } catch (error: any) {
    (logger as any).error(`[${requestId}] Failed to refresh analytics cache:`, error.message || error);
  }
};

export default {
  getDeceasedAnalytics,
  refreshAnalyticsCache
};