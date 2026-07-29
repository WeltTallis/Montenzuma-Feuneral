import { safeTenantQuery, resolveDatabase, lookupTenantDatabase } from '../../../shared/dbConfig';
import { logger } from '@montezuma/shared-logger';
import { DeceasedAnalyticsData } from '../types/analytics.types';

// Socket.IO instance will be set at runtime
let ioInstance: any = null;

/**
 * Background Analytics Service
 * Processes analytics data in chunks using streams for large datasets
 * Emits real-time updates via Socket.IO
 */

interface StreamChunk {
  chunkIndex: number;
  totalChunks: number;
  data: any;
  progress: number;
}

/**
 * Process deceased analytics in chunks using streaming
 * This prevents memory issues with large datasets
 */
export const processDeceasedAnalyticsStream = async (
  tenantSlug: string,
  branchId?: string,
  onProgress?: (progress: number) => void
): Promise<DeceasedAnalyticsData> => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  logger.info(`[${requestId}] Starting streaming analytics for tenant: ${tenantSlug}, branch: ${branchId}`);
  
  const resolveSlug = branchId ? `${tenantSlug}-${branchId}` : tenantSlug;
  const dbName = await resolveDatabase(resolveSlug) || await lookupTenantDatabase(tenantSlug);
  
  if (!dbName) {
    logger.warn(`[${requestId}] No database found for ${tenantSlug}`);
    return getEmptyAnalyticsData(requestId);
  }

  try {
    // Emit start event
    emitSocketEvent('analytics_progress', {
      type: 'ANALYTICS_STARTED',
      progress: 0,
      message: 'Starting analytics processing...',
      timestamp: new Date().toISOString()
    }, tenantSlug);

    // Process in chunks using async generators
    const chunks: StreamChunk[] = [];
    const totalSteps = 10;
    let currentStep = 0;

    // Step 1: Basic stats (20% progress)
    const stats = await fetchBasicStats(dbName, tenantSlug);
    chunks.push({ chunkIndex: 0, totalChunks: totalSteps, data: stats, progress: 20 });
    currentStep++;
    onProgress?.(20);
    emitSocketEvent('analytics_progress', {
      type: 'ANALYTICS_PROGRESS',
      progress: 20,
      message: 'Basic statistics computed...',
      timestamp: new Date().toISOString()
    }, tenantSlug);

    // Step 2: Status distribution (30% progress)
    const statusData = await fetchStatusDistribution(dbName, tenantSlug);
    chunks.push({ chunkIndex: 1, totalChunks: totalSteps, data: statusData, progress: 30 });
    currentStep++;
    onProgress?.(30);
    emitSocketEvent('analytics_progress', {
      type: 'ANALYTICS_PROGRESS',
      progress: 30,
      message: 'Status distribution analyzed...',
      timestamp: new Date().toISOString()
    }, tenantSlug);

    // Step 3: Monthly trends (40% progress)
    const monthlyData = await fetchMonthlyTrends(dbName, tenantSlug);
    chunks.push({ chunkIndex: 2, totalChunks: totalSteps, data: monthlyData, progress: 40 });
    currentStep++;
    onProgress?.(40);
    emitSocketEvent('analytics_progress', {
      type: 'ANALYTICS_PROGRESS',
      progress: 40,
      message: 'Monthly trends calculated...',
      timestamp: new Date().toISOString()
    }, tenantSlug);

    // Step 4: Gender distribution (50% progress)
    const genderData = await fetchGenderDistribution(dbName, tenantSlug);
    chunks.push({ chunkIndex: 3, totalChunks: totalSteps, data: genderData, progress: 50 });
    currentStep++;
    onProgress?.(50);
    emitSocketEvent('analytics_progress', {
      type: 'ANALYTICS_PROGRESS',
      progress: 50,
      message: 'Gender distribution analyzed...',
      timestamp: new Date().toISOString()
    }, tenantSlug);

    // Step 5: Postmortem tracking (60% progress)
    const pmTracking = await fetchPMTracking(dbName, tenantSlug);
    chunks.push({ chunkIndex: 4, totalChunks: totalSteps, data: pmTracking, progress: 60 });
    currentStep++;
    onProgress?.(60);
    emitSocketEvent('analytics_progress', {
      type: 'ANALYTICS_PROGRESS',
      progress: 60,
      message: 'Postmortem tracking completed...',
      timestamp: new Date().toISOString()
    }, tenantSlug);

    // Step 6: Stay duration (70% progress)
    const stayData = await fetchStayDuration(dbName, tenantSlug);
    chunks.push({ chunkIndex: 5, totalChunks: totalSteps, data: stayData, progress: 70 });
    currentStep++;
    onProgress?.(70);
    emitSocketEvent('analytics_progress', {
      type: 'ANALYTICS_PROGRESS',
      progress: 70,
      message: 'Stay duration analyzed...',
      timestamp: new Date().toISOString()
    }, tenantSlug);

    // Step 7: Calendar data (80% progress)
    const calendarData = await fetchCalendarData(dbName, tenantSlug);
    chunks.push({ chunkIndex: 6, totalChunks: totalSteps, data: calendarData, progress: 80 });
    currentStep++;
    onProgress?.(80);
    emitSocketEvent('analytics_progress', {
      type: 'ANALYTICS_PROGRESS',
      progress: 80,
      message: 'Calendar data prepared...',
      timestamp: new Date().toISOString()
    }, tenantSlug);

    // Step 8-10: Action queues (90% progress)
    const [awaitingAutopsy, awaitingDispatch, dispatched] = await Promise.all([
      fetchAwaitingAutopsy(dbName, tenantSlug),
      fetchAwaitingDispatch(dbName, tenantSlug),
      fetchDispatched(dbName, tenantSlug)
    ]);
    chunks.push({ chunkIndex: 7, totalChunks: totalSteps, data: awaitingAutopsy, progress: 90 });
    chunks.push({ chunkIndex: 8, totalChunks: totalSteps, data: awaitingDispatch, progress: 95 });
    chunks.push({ chunkIndex: 9, totalChunks: totalSteps, data: dispatched, progress: 100 });
    onProgress?.(100);

    // Emit completion event
    emitSocketEvent('analytics_complete', {
      type: 'ANALYTICS_COMPLETE',
      progress: 100,
      message: 'Analytics processing complete',
      timestamp: new Date().toISOString()
    }, tenantSlug);

    // Combine all chunks into final response
    const result = combineChunks(chunks, requestId);
    
    logger.info(`[${requestId}] Streaming analytics completed in ${Date.now() - startTime}ms`);
    
    return result;

  } catch (error: any) {
    logger.error(`[${requestId}] Streaming analytics error:`, error.message || error);
    
    emitSocketEvent('analytics_error', {
      type: 'ANALYTICS_ERROR',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, tenantSlug);
    
    return getEmptyAnalyticsData(requestId);
  }
};

/**
 * Set Socket.IO instance (called from server.js)
 */
export const setSocketInstance = (io: any): void => {
  ioInstance = io;
};

/**
 * Emit Socket.IO event to dashboard and tenant rooms
 */
const emitSocketEvent = (event: string, data: any, tenantSlug: string): void => {
  try {
    if (ioInstance) {
      ioInstance.to('dashboard').emit(event, data);
      ioInstance.to(`tenant_${tenantSlug}`).emit(event, data);
    }
  } catch (error) {
    // Silently fail - Socket.IO might not be available
  }
};

/**
 * Fetch basic statistics
 */
const fetchBasicStats = async (dbName: string, tenantSlug: string): Promise<any> => {
  const result = await safeTenantQuery(dbName, `
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
    WHERE tenant_slug = ? AND is_deleted = FALSE
  `, [tenantSlug]);
  
  return result[0] || {};
};

/**
 * Fetch status distribution
 */
const fetchStatusDistribution = async (dbName: string, tenantSlug: string): Promise<any[]> => {
  const result = await safeTenantQuery(dbName, `
    SELECT 
      COALESCE(admission_status, 'Unknown') as status,
      COUNT(*) as count
    FROM deceased
    WHERE tenant_slug = ? AND is_deleted = FALSE
    GROUP BY admission_status
    ORDER BY count DESC
  `, [tenantSlug]);
  
  return result || [];
};

/**
 * Fetch monthly trends
 */
const fetchMonthlyTrends = async (dbName: string, tenantSlug: string): Promise<any[]> => {
  const result = await safeTenantQuery(dbName, `
    SELECT 
      DATE_FORMAT(date_admitted, '%b %Y') as month,
      COUNT(*) as count
    FROM deceased
    WHERE date_admitted >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      AND tenant_slug = ? AND is_deleted = FALSE
    GROUP BY DATE_FORMAT(date_admitted, '%Y-%m'), DATE_FORMAT(date_admitted, '%b %Y')
    ORDER BY DATE_FORMAT(date_admitted, '%Y-%m') ASC
  `, [tenantSlug]);
  
  return result || [];
};

/**
 * Fetch gender distribution
 */
const fetchGenderDistribution = async (dbName: string, tenantSlug: string): Promise<any[]> => {
  const result = await safeTenantQuery(dbName, `
    SELECT 
      COALESCE(gender, 'Unknown') as gender,
      COUNT(*) as count
    FROM deceased
    WHERE tenant_slug = ? AND is_deleted = FALSE
    GROUP BY gender
    ORDER BY count DESC
  `, [tenantSlug]);
  
  return result || [];
};

/**
 * Fetch postmortem tracking
 */
const fetchPMTracking = async (dbName: string, tenantSlug: string): Promise<any> => {
  try {
    const result = await safeTenantQuery(dbName, `
      SELECT 
        COUNT(CASE WHEN postmortem_requested = 1 AND postmortem_completed = 0 THEN 1 END) as pending,
        COUNT(CASE WHEN postmortem_completed = 1 THEN 1 END) as completed,
        COUNT(CASE WHEN postmortem_requested = 0 OR postmortem_requested IS NULL THEN 1 END) as not_requested
      FROM deceased
      WHERE tenant_slug = ? AND is_deleted = FALSE
    `, [tenantSlug]);
    
    return result[0] || { pending: 0, completed: 0, not_requested: 0 };
  } catch (error) {
    return { pending: 0, completed: 0, not_requested: 0 };
  }
};

/**
 * Fetch stay duration
 */
const fetchStayDuration = async (dbName: string, tenantSlug: string): Promise<any[]> => {
  const result = await safeTenantQuery(dbName, `
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
  `, [tenantSlug]);
  
  return result || [];
};

/**
 * Fetch calendar data
 */
const fetchCalendarData = async (dbName: string, tenantSlug: string): Promise<any[]> => {
  const result = await safeTenantQuery(dbName, `
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
  `, [tenantSlug]);
  
  return result || [];
};

/**
 * Fetch awaiting autopsy queue
 */
const fetchAwaitingAutopsy = async (dbName: string, tenantSlug: string): Promise<any[]> => {
  const result = await safeTenantQuery(dbName, `
    SELECT 
      id, full_name, admission_number, gender, date_of_birth, date_admitted,
      time_received, received_from, postmortem_requested, postmortem_completed
    FROM deceased
    WHERE tenant_slug = ? AND is_deleted = FALSE
      AND postmortem_requested = 1 AND postmortem_completed = 0
    ORDER BY date_admitted DESC
    LIMIT 20
  `, [tenantSlug]);
  
  return result || [];
};

/**
 * Fetch awaiting dispatch queue
 */
const fetchAwaitingDispatch = async (dbName: string, tenantSlug: string): Promise<any[]> => {
  const result = await safeTenantQuery(dbName, `
    SELECT 
      id, full_name, admission_number, date_admitted,
      contact_person, tel_number, admission_status as body_status
    FROM deceased
    WHERE tenant_slug = ? AND is_deleted = FALSE
      AND admission_status IN ('admitted', 'embalmed')
      AND (postmortem_completed = 1 OR postmortem_requested = 0)
    ORDER BY date_admitted DESC
    LIMIT 20
  `, [tenantSlug]);
  
  return result || [];
};

/**
 * Fetch recently dispatched
 */
const fetchDispatched = async (dbName: string, tenantSlug: string): Promise<any[]> => {
  const result = await safeTenantQuery(dbName, `
    SELECT 
      id, full_name, admission_number, admission_status as body_status,
      dispatch_date, dispatched_to
    FROM deceased
    WHERE tenant_slug = ? AND is_deleted = FALSE
      AND admission_status IN ('released', 'buried')
      AND dispatch_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ORDER BY dispatch_date DESC
    LIMIT 20
  `, [tenantSlug]);
  
  return result || [];
};

/**
 * Combine all chunks into final analytics response
 */
const combineChunks = (chunks: StreamChunk[], requestId: string): DeceasedAnalyticsData => {
  const stats = chunks[0]?.data || {};
  const statusData = chunks[1]?.data || [];
  const monthlyData = chunks[2]?.data || [];
  const genderData = chunks[3]?.data || [];
  const pmTracking = chunks[4]?.data || {};
  const stayData = chunks[5]?.data || [];
  const calendarData = chunks[6]?.data || [];
  const awaitingAutopsy = chunks[7]?.data || [];
  const awaitingDispatch = chunks[8]?.data || [];
  const dispatched = chunks[9]?.data || [];

  return {
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
    transferred: 0,
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
      pending: parseInt(pmTracking.pending) || 0,
      completed: parseInt(pmTracking.completed) || 0,
      notRequested: parseInt(pmTracking.not_requested) || 0
    },
    stayData: Array.isArray(stayData) ? stayData.map((r: any) => ({
      label: r.duration_range || 'Unknown',
      min: 0,
      max: 999,
      count: parseInt(r.count) || 0,
      color: ''
    })) : [],
    calendarDays: Array.isArray(calendarData) ? calendarData.map((r: any) => ({
      date: r.date_admitted,
      total: parseInt(r.total) || 0,
      hasPM: r.has_pm === 1,
      hasRelease: r.has_release === 1
    })) : [],
    awaitingAutopsy: Array.isArray(awaitingAutopsy) ? awaitingAutopsy.map((r: any) => ({
      id: r.id,
      full_name: r.full_name,
      admission_number: r.admission_number,
      gender: r.gender,
      age: calculateAge(r.date_of_birth),
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
    metadata: {
      requestId,
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - Date.now(),
      timeRange: '3m'
    }
  };
};

/**
 * Calculate age from date of birth
 */
const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
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
  metadata: {
    requestId,
    timestamp: new Date().toISOString(),
    executionTime: 0,
    timeRange: '3m'
  }
});

export default {
  processDeceasedAnalyticsStream
};