import { Request, Response } from 'express';
import { safeTenantQuery, resolveDatabase, lookupTenantDatabase } from '../../../shared/dbConfig';
import { logger } from '@montezuma/shared-logger';
import {
  HearseAnalyticsData,
  HearseAnalyticsQuery,
  HearseBooking,
  HearseStats,
  StatusCount,
  BranchPerformance,
  HearseUtilization,
  DailyTrend
} from '../types/hearseAnalytics.types';

// Status configuration matching frontend
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
  pending: { label: 'Pending', color: '#f59e0b', bg: '#fef3c7', dotColor: '#f59e0b' },
  booked: { label: 'Booked', color: '#3b82f6', bg: '#dbeafe', dotColor: '#3b82f6' },
  in_transit: { label: 'In Transit', color: '#ec4899', bg: '#fce7f3', dotColor: '#ec4899' },
  completed: { label: 'Completed', color: '#10b981', bg: '#d1fae5', dotColor: '#10b981' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2', dotColor: '#ef4444' },
  postponed: { label: 'Postponed', color: '#f59e0b', bg: '#fef3c7', dotColor: '#f59e0b' },
  maintenance: { label: 'Maintenance', color: '#8b5cf6', bg: '#f3e8ff', dotColor: '#8b5cf6' },
};

/**
 * Get comprehensive hearse analytics data
 * Matches the frontend HearseBookings component requirements
 */
export const getHearseAnalytics = async (req: any, res: any): Promise<void> => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  // Extract query parameters
  const query: HearseAnalyticsQuery = {
    timeRange: ((req as any).query.timeRange as 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'nextMonth' | 'all') || 'all',
    startDate: (req as any).query.startDate as string | undefined,
    endDate: (req as any).query.endDate as string | undefined,
    branchId: (req as any).query.branchId ? parseInt((req as any).query.branchId as string) : undefined,
    status: (req as any).query.status as string | undefined,
    searchQuery: (req as any).query.searchQuery as string | undefined
  };

  const tenantSlug = (req as any).headers['x-tenant-slug'] as string || (req as any).headers['x-tenant-id'] as string || 'system_shared';
  const branchId = (req as any).headers['x-branch-id'] as string || (req as any).query.branchId as string || null;
  
  // Resolve database
  const resolveSlug = branchId ? `${tenantSlug}-${branchId}` : tenantSlug;
  const dbName = await resolveDatabase(resolveSlug) || await lookupTenantDatabase(tenantSlug);

  if (!dbName) {
    res.status(200).json({
      success: true,
      data: getEmptyAnalyticsData(requestId, tenantSlug),
      metadata: { requestId, timestamp: new Date().toISOString(), executionTime: Date.now() - startTime, tenantSlug }
    });
    return;
  }

  try {
    (logger as any).info(`[${requestId}] Fetching hearse analytics for tenant: ${tenantSlug}, branch: ${branchId}`);

    // Build date filter
    const dateFilter = buildDateFilter(query);
    const branchFilter = query.branchId ? `AND hb.branch_id = ${query.branchId}` : '';
    const statusFilter = query.status ? `AND hb.status = '${query.status}'` : '';
    const searchFilter = query.searchQuery ? `AND (hb.client_name LIKE '%${query.searchQuery}%' OR hb.booking_code LIKE '%${query.searchQuery}%' OR h.destination LIKE '%${query.searchQuery}%')` : '';

    // Fetch all data in parallel
    const [
      statsResult,
      statusDistributionResult,
      todayCountResult,
      weekCountResult,
      monthCountResult,
      branchPerformanceResult,
      hearseUtilizationResult,
      dailyTrendsResult,
      recentBookingsResult
    ] = await Promise.allSettled([
      // 1. Overall statistics
      safeTenantQuery(dbName, `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status IN ('pending', 'booked') THEN 1 END) as active,
          COUNT(CASE WHEN status IN ('pending', 'booked') THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM hearse_bookings hb
        WHERE hb.tenant_slug = ? ${dateFilter} ${statusFilter} ${searchFilter}
      `, [tenantSlug]),

      // 2. Status distribution
      safeTenantQuery(dbName, `
        SELECT 
          hb.status,
          COUNT(*) as count
        FROM hearse_bookings hb
        WHERE hb.tenant_slug = ? ${dateFilter} ${statusFilter} ${searchFilter}
        GROUP BY hb.status
        ORDER BY count DESC
      `, [tenantSlug]),

      // 3. Today's count
      safeTenantQuery(dbName, `
        SELECT COUNT(*) as count
        FROM hearse_bookings hb
        WHERE hb.tenant_slug = ? 
          AND DATE(hb.booking_date) = CURDATE()
          ${branchFilter} ${statusFilter} ${searchFilter}
      `, [tenantSlug]),

      // 4. This week's count
      safeTenantQuery(dbName, `
        SELECT COUNT(*) as count
        FROM hearse_bookings hb
        WHERE hb.tenant_slug = ? 
          AND YEARWEEK(hb.booking_date) = YEARWEEK(NOW())
          ${branchFilter} ${statusFilter} ${searchFilter}
      `, [tenantSlug]),

      // 5. This month's count
      safeTenantQuery(dbName, `
        SELECT COUNT(*) as count
        FROM hearse_bookings hb
        WHERE hb.tenant_slug = ? 
          AND MONTH(hb.booking_date) = MONTH(NOW())
          AND YEAR(hb.booking_date) = YEAR(NOW())
          ${branchFilter} ${statusFilter} ${searchFilter}
      `, [tenantSlug]),

      // 6. Branch performance
      safeTenantQuery(dbName, `
        SELECT 
          b.branch_id,
          b.branch_name,
          b.branch_code,
          COUNT(hb.booking_id) as total_bookings,
          COUNT(CASE WHEN hb.status IN ('pending', 'booked', 'in_transit') THEN 1 END) as active_bookings,
          COUNT(CASE WHEN hb.status = 'completed' THEN 1 END) as completed_bookings,
          COUNT(CASE WHEN hb.status = 'cancelled' THEN 1 END) as cancelled_bookings
        FROM branches b
        LEFT JOIN hearse_bookings hb ON b.branch_id = hb.branch_id AND hb.tenant_slug = ? ${dateFilter}
        WHERE b.tenant_slug = ?
        GROUP BY b.branch_id, b.branch_name, b.branch_code
        ORDER BY total_bookings DESC
      `, [tenantSlug, tenantSlug]),

      // 7. Hearse utilization
      safeTenantQuery(dbName, `
        SELECT 
          h.id as hearse_id,
          h.hearse_name,
          h.plate_number,
          h.status as hearse_status,
          COUNT(hb.booking_id) as total_bookings,
          COUNT(CASE WHEN hb.status = 'completed' THEN 1 END) as completed_trips,
          COUNT(CASE WHEN hb.status = 'cancelled' THEN 1 END) as cancelled_trips
        FROM hearses h
        LEFT JOIN hearse_bookings hb ON h.id = hb.hearse_id AND hb.tenant_slug = ? ${dateFilter}
        WHERE h.tenant_slug = ?
        GROUP BY h.id, h.hearse_name, h.plate_number, h.status
        ORDER BY total_bookings DESC
        LIMIT 20
      `, [tenantSlug, tenantSlug]),

      // 8. Daily trends (last 30 days)
      safeTenantQuery(dbName, `
        SELECT 
          DATE(hb.booking_date) as date,
          COUNT(*) as bookings,
          COUNT(CASE WHEN hb.status = 'completed' THEN 1 END) as completions,
          COUNT(CASE WHEN hb.status = 'cancelled' THEN 1 END) as cancellations
        FROM hearse_bookings hb
        WHERE hb.tenant_slug = ? 
          AND hb.booking_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(hb.booking_date)
        ORDER BY DATE(hb.booking_date) ASC
      `, [tenantSlug]),

      // 9. Recent bookings
      safeTenantQuery(dbName, `
        SELECT 
          hb.booking_id,
          hb.booking_code,
          hb.hearse_id,
          hb.client_name,
          hb.client_phone,
          hb.from_location,
          hb.to_location,
          hb.destination,
          hb.booking_date,
          hb.estimated_departure_time,
          hb.end_date,
          hb.delivery_time,
          hb.status,
          hb.branch_id,
          b.branch_name,
          b.branch_code,
          h.hearse_name,
          h.plate_number,
          h.number_plate,
          h.model,
          hb.booked_by,
          hb.created_at,
          hb.updated_at
        FROM hearse_bookings hb
        LEFT JOIN branches b ON hb.branch_id = b.branch_id
        LEFT JOIN hearses h ON hb.hearse_id = h.id
        WHERE hb.tenant_slug = ? ${dateFilter} ${branchFilter} ${statusFilter} ${searchFilter}
        ORDER BY hb.created_at DESC
        LIMIT 20
      `, [tenantSlug])
    ]);

    // Extract results
    const stats = statsResult.status === 'fulfilled' ? statsResult.value[0] : {};
    const statusDistribution = statusDistributionResult.status === 'fulfilled' ? statusDistributionResult.value : [];
    const todayCount = todayCountResult.status === 'fulfilled' ? todayCountResult.value[0]?.count || 0 : 0;
    const weekCount = weekCountResult.status === 'fulfilled' ? weekCountResult.value[0]?.count || 0 : 0;
    const monthCount = monthCountResult.status === 'fulfilled' ? monthCountResult.value[0]?.count || 0 : 0;
    const branchPerformance = branchPerformanceResult.status === 'fulfilled' ? branchPerformanceResult.value : [];
    const hearseUtilization = hearseUtilizationResult.status === 'fulfilled' ? hearseUtilizationResult.value : [];
    const dailyTrends = dailyTrendsResult.status === 'fulfilled' ? dailyTrendsResult.value : [];
    const recentBookings = recentBookingsResult.status === 'fulfilled' ? recentBookingsResult.value : [];

    // Transform data
    const transformedData: HearseAnalyticsData = {
      stats: {
        total: parseInt(stats.total) || 0,
        active: parseInt(stats.active) || 0,
        pending: parseInt(stats.pending) || 0,
        inProgress: parseInt(stats.in_progress) || 0,
        completed: parseInt(stats.completed) || 0
      },

      statusDistribution: Array.isArray(statusDistribution) ? statusDistribution.map((r: any) => {
        const cfg = STATUS_CONFIG[r.status] || { label: r.status, color: '#6b7280', bg: '#f3f4f6', dotColor: '#6b7280' };
        return {
          status: r.status,
          count: parseInt(r.count) || 0,
          label: cfg.label,
          color: cfg.color,
          bg: cfg.bg,
          dotColor: cfg.dotColor
        };
      }) : [],

      todayCount,
      thisWeekCount: weekCount,
      thisMonthCount: monthCount,

      branchPerformance: Array.isArray(branchPerformance) ? branchPerformance.map((b: any) => ({
        branchId: parseInt(b.branch_id),
        branchName: b.branch_name || 'Unknown',
        branchCode: b.branch_code || '',
        totalBookings: parseInt(b.total_bookings) || 0,
        activeBookings: parseInt(b.active_bookings) || 0,
        completedBookings: parseInt(b.completed_bookings) || 0,
        cancelledBookings: parseInt(b.cancelled_bookings) || 0,
        utilizationRate: parseInt(b.total_bookings) > 0 
          ? Math.round((parseInt(b.active_bookings) / parseInt(b.total_bookings)) * 100) 
          : 0
      })) : [],

      hearseUtilization: Array.isArray(hearseUtilization) ? hearseUtilization.map((h: any) => ({
        hearseId: parseInt(h.hearse_id),
        hearseName: h.hearse_name || 'Unknown',
        plateNumber: h.plate_number || 'N/A',
        totalBookings: parseInt(h.total_bookings) || 0,
        completedTrips: parseInt(h.completed_trips) || 0,
        cancelledTrips: parseInt(h.cancelled_trips) || 0,
        utilizationRate: parseInt(h.total_bookings) > 0 
          ? Math.round((parseInt(h.completed_trips) / parseInt(h.total_bookings)) * 100) 
          : 0,
        status: h.hearse_status || 'unknown'
      })) : [],

      dailyTrends: Array.isArray(dailyTrends) ? dailyTrends.map((d: any) => ({
        date: d.date,
        bookings: parseInt(d.bookings) || 0,
        completions: parseInt(d.completions) || 0,
        cancellations: parseInt(d.cancellations) || 0
      })) : [],

      recentBookings: Array.isArray(recentBookings) ? recentBookings.map((b: any) => ({
        booking_id: b.booking_id,
        booking_code: b.booking_code,
        hearse_id: b.hearse_id,
        client_name: b.client_name,
        client_phone: b.client_phone,
        from_location: b.from_location,
        to_location: b.to_location,
        destination: b.destination,
        booking_date: b.booking_date,
        estimated_departure_time: b.estimated_departure_time,
        end_date: b.end_date,
        delivery_time: b.delivery_time,
        status: b.status,
        branch_id: b.branch_id,
        branch_name: b.branch_name,
        branch_code: b.branch_code,
        hearse_name: b.hearse_name,
        plate_number: b.plate_number,
        number_plate: b.number_plate,
        model: b.model,
        booked_by: b.booked_by,
        created_at: b.created_at,
        updated_at: b.updated_at
      })) : [],

      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        tenantSlug,
        branchId: query.branchId
      }
    };

    // Emit real-time update via Socket.IO
    const io = (req as any).app?.get('io');
    if (io) {
      (io as any).to('dashboard').emit('hearse_analytics_update', {
        type: 'ANALYTICS_UPDATE',
        data: transformedData,
        timestamp: new Date().toISOString()
      });
      
      // Also emit to tenant-specific room
      (io as any).to(`tenant_${tenantSlug}`).emit('hearse_analytics_update', {
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
    });

  } catch (error: any) {
    (logger as any).error(`[${requestId}] Hearse analytics error:`, error.message || error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: getEmptyAnalyticsData(requestId, tenantSlug),
      metadata: { requestId, timestamp: new Date().toISOString(), executionTime: Date.now() - startTime }
    });
  }
};

/**
 * Build date filter SQL based on time range
 */
const buildDateFilter = (query: HearseAnalyticsQuery): string => {
  if (query.startDate && query.endDate) {
    return `AND DATE(hb.booking_date) BETWEEN '${query.startDate}' AND '${query.endDate}'`;
  }

  switch (query.timeRange) {
    case 'today':
      return `AND DATE(hb.booking_date) = CURDATE()`;
    case 'tomorrow': {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      return `AND DATE(hb.booking_date) = '${tomorrowStr}'`;
    }
    case 'thisWeek':
      return `AND YEARWEEK(hb.booking_date) = YEARWEEK(NOW())`;
    case 'nextWeek': {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return `AND YEARWEEK(hb.booking_date) = YEARWEEK('${nextWeek.toISOString().split('T')[0]}')`;
    }
    case 'thisMonth':
      return `AND MONTH(hb.booking_date) = MONTH(NOW()) AND YEAR(hb.booking_date) = YEAR(NOW())`;
    case 'nextMonth': {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return `AND MONTH(hb.booking_date) = MONTH('${nextMonth.toISOString().split('T')[0]}') AND YEAR(hb.booking_date) = YEAR('${nextMonth.toISOString().split('T')[0]}')`;
    }
    default:
      return `AND hb.booking_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)`;
  }
};

/**
 * Get empty analytics data structure
 */
const getEmptyAnalyticsData = (requestId: string, tenantSlug: string): HearseAnalyticsData => ({
  stats: {
    total: 0,
    active: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  },
  statusDistribution: [],
  todayCount: 0,
  weekCount: 0,
  monthCount: 0,
  branchPerformance: [],
  hearseUtilization: [],
  dailyTrends: [],
  recentBookings: [],
  metadata: {
    requestId,
    timestamp: new Date().toISOString(),
    executionTime: 0,
    tenantSlug
  }
});

export default {
  getHearseAnalytics
};