import { Request, Response } from 'express';
import { safeTenantQuery, resolveDatabase, lookupTenantDatabase } from '../../../shared/dbConfig';
import { logger } from '@montezuma/shared-logger';
import {
  FlowerBookingAnalytics,
  FlowerBookingQuery,
  FlowerBooking,
  Product,
  CalendarDay
} from '../types/flowerBookingAnalytics.types';

// Status configuration matching frontend
const STATUS_CONFIG = {
  pending: { label: 'Order Placed', color: '#64748b', bg: '#f1f5f9' },
  sourced: { label: 'Flowers Sourced', color: '#2F4F3E', bg: '#f0f7f4' },
  transit: { label: 'Out for Delivery', color: '#B08D57', bg: '#fef3c7' },
  completed: { label: 'Delivered', color: '#10B981', bg: '#d1fae5' }
};

// Products catalog (can be moved to database later)
const PRODUCTS: Product[] = [
  { id: 1, name: 'Peaceful White Lilies', price: 120, images: ['https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80'], category: 'Sympathy Arrangement' },
  { id: 2, name: 'Garden of Serenity', price: 180, images: ['https://images.unsplash.com/photo-1591886960571-74d43a9d4164?auto=format&fit=crop&w=800&q=80'], category: 'Funeral Wreath' },
  { id: 3, name: 'Custom Sympathy Wreath', price: 150, images: [], category: 'Custom Wreath' },
  { id: 4, name: 'Voodoo Rose', price: 220, images: ['https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80'], category: 'Tea-hybrid Rose' },
  { id: 5, name: 'Everlasting Green Plant', price: 85, images: [], category: 'Potted Plant' }
];

/**
 * Get comprehensive flower booking analytics data
 * Matches the frontend FlowerBookingsNew component requirements
 */
export const getFlowerBookingAnalytics = async (req: any, res: any): Promise<void> => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  // Extract query parameters
  const query: FlowerBookingQuery = {
    startDate: (req as any).query.startDate as string | undefined,
    endDate: (req as any).query.endDate as string | undefined,
    status: (req as any).query.status as string | undefined,
    priority: (req as any).query.priority as string | undefined,
    searchQuery: (req as any).query.searchQuery as string | undefined,
    month: (req as any).query.month ? parseInt((req as any).query.month as string) : undefined,
    year: (req as any).query.year ? parseInt((req as any).query.year as string) : undefined
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
}
    return;
  }

  try {
    (logger as any).info(`[${requestId}] Fetching flower booking analytics for tenant: ${tenantSlug}`);

    // Build date filter
    const dateFilter = buildDateFilter(query);
    const statusFilter = query.status ? `AND fb.status = '${query.status}'` : '';
    const priorityFilter = query.priority ? `AND fb.priority = '${query.priority}'` : '';
    const searchFilter = query.searchQuery ? `AND (fb.deceased_name LIKE '%${query.searchQuery}%' OR fb.funeral_home LIKE '%${query.searchQuery}%' OR fb.arrangement_name LIKE '%${query.searchQuery}%')` : '';

    // Fetch all data in parallel
    const [
      statsResult,
      bookingsResult,
      productsResult
    ] = await Promise.allSettled([
      // 1. Overall statistics
      safeTenantQuery(dbName, `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'sourced' THEN 1 END) as sourced,
          COUNT(CASE WHEN status = 'transit' THEN 1 END) as in_transit,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_priority,
          SUM(amount) as total_revenue
        FROM flower_bookings fb
        WHERE fb.tenant_slug = ? ${dateSql} ${filters.sql} ${priorityFilter} ${filters.sql}
      `, [tenantSlug]),

      // 2. All bookings
      safeTenantQuery(dbName, `
        SELECT 
          fb.id,
          fb.booking_id,
          fb.arrangement_name,
          fb.arrangement_price,
          fb.deceased_name,
          fb.booked_by,
          fb.funeral_home,
          fb.delivery_date,
          fb.delivery_time,
          fb.status,
          fb.priority,
          fb.amount,
          fb.flower_type,
          fb.product_id,
          fb.created_at,
          fb.updated_at
        FROM flower_bookings fb
        WHERE fb.tenant_slug = ? ${dateSql} ${filters.sql} ${priorityFilter} ${filters.sql}
        ORDER BY fb.delivery_date ASC, fb.delivery_time ASC
      `, [tenantSlug]),

      // 3. Products catalog
      safeTenantQuery(dbName, `
        SELECT 
          p.id,
          p.name,
          p.price,
          p.images,
          p.category
        FROM products p
        WHERE p.tenant_slug = ?
        ORDER BY p.name ASC
      `, [tenantSlug])
    ]);

    // Extract results
    const stats = statsResult.status === 'fulfilled' ? statsResult.value[0] : {};
    const bookings = bookingsResult.status === 'fulfilled' ? bookingsResult.value : [];
    const products = productsResult.status === 'fulfilled' ? productsResult.value : PRODUCTS;

    // Transform bookings
    const transformedBookings: FlowerBooking[] = Array.isArray(bookings) ? bookings.map((b: any) => ({
      id: parseInt(b.id),
      booking_id: b.booking_id,
      arrangement_name: b.arrangement_name,
      arrangement_price: parseFloat(b.arrangement_price) || 0,
      deceased_name: b.deceased_name,
      booked_by: b.booked_by,
      funeral_home: b.funeral_home,
      delivery_date: b.delivery_date,
      delivery_time: b.delivery_time,
      status: b.status || 'pending',
      priority: b.priority || 'Normal',
      amount: parseFloat(b.amount) || 0,
      flower_type: b.flower_type ? parseInt(b.flower_type) : null,
      product_id: b.product_id ? parseInt(b.product_id) : null,
      created_at: b.created_at,
      updated_at: b.updated_at
    })) : [];

    // Group bookings by date
    const bookingsByDate: Record<string, FlowerBooking[]> = {};
    transformedBookings.forEach(booking => {
      if (!bookingsByDate[booking.delivery_date]) {
        bookingsByDate[booking.delivery_date] = [];
      }
      bookingsByDate[booking.delivery_date].push(booking);
    });

    // Generate calendar data (42 days for 6-week view)
    const calendarDays = generateCalendarData(query, transformedBookings);

    // Transform products
    const transformedProducts: Product[] = Array.isArray(products) ? products.map((p: any) => ({
      id: parseInt(p.id),
      name: p.name,
      price: parseFloat(p.price) || 0,
      images: Array.isArray(p.images) ? p.images : [],
      category: p.category || 'General'
    })) : PRODUCTS;

    // Build response
    const analyticsData: FlowerBookingAnalytics = {
      stats: {
        total: parseInt(stats.total) || 0,
        pending: parseInt(stats.pending) || 0,
        sourced: parseInt(stats.sourced) || 0,
        inTransit: parseInt(stats.in_transit) || 0,
        completed: parseInt(stats.completed) || 0,
        highPriority: parseInt(stats.high_priority) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0
      },

      bookingsByDate,
      calendarDays,
      allBookings: transformedBookings,
      products: transformedProducts,

      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        tenantSlug,
        currentMonth: query.month || new Date().getMonth() + 1,
        currentYear: query.year || new Date().getFullYear()
      }
    };

    // Emit real-time update via Socket.IO
    const io = (req as any).app?.get('io');
    if (io) {
      (io as any).to('dashboard').emit('flower_booking_analytics_update', {
        type: 'ANALYTICS_UPDATE',
        data: analyticsData,
        timestamp: new Date().toISOString()
      });
      
      // Also emit to tenant-specific room
      (io as any).to(`tenant_${tenantSlug}`).emit('flower_booking_analytics_update', {
        type: 'ANALYTICS_UPDATE',
        data: analyticsData,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: analyticsData,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      }
}

  } catch (error: any) {
    (logger as any).error(`[${requestId}] Flower booking analytics error:`, error.message || error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: getEmptyAnalyticsData(requestId, tenantSlug),
      metadata: { requestId, timestamp: new Date().toISOString(), executionTime: Date.now() - startTime }
}
  }
};

/**
 * Build date filter SQL based on query parameters
 */
const buildDateFilter = (query: FlowerBookingQuery): string => {
  if (query.startDate && query.endDate) {
    return `AND DATE(fb.delivery_date) BETWEEN '${query.startDate}' AND '${query.endDate}'`;
  }

  if (query.month && query.year) {
    return `AND MONTH(fb.delivery_date) = ${query.month} AND YEAR(fb.delivery_date) = ${query.year}`;
  }

  // Default: current month
  const now = new Date();
  return `AND MONTH(fb.delivery_date) = ${now.getMonth() + 1} AND YEAR(fb.delivery_date) = ${now.getFullYear()}`;
};

/**
 * Generate calendar data for 6-week view (42 days)
 */
const generateCalendarData = (query: FlowerBookingQuery, bookings: FlowerBooking[]): CalendarDay[] => {
  const today = new Date();
  const todayStr = formatDateStr(today);
  
  // Determine the calendar month to display
  let calYear: number, calMonth: number;
  if (query.month && query.year) {
    calYear = query.year;
    calMonth = query.month - 1; // JavaScript months are 0-indexed
  } else {
    calYear = today.getFullYear();
    calMonth = today.getMonth();
  }

  // Get the first day of the month
  const firstDay = new Date(calYear, calMonth, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-based week
  
  // Calculate grid start (42 days = 6 weeks)
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - startOffset);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(gridStart);
    currentDate.setDate(gridStart.getDate() + i);
    
    const dateStr = formatDateStr(currentDate);
    const isOutsideMonth = currentDate.getMonth() !== calMonth;
    
    // Find bookings for this date
    const dayBookings = bookings.filter(b => b.delivery_date === dateStr);

    days.push({
      date: dateStr,
      day: currentDate.getDate(),
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      isToday: dateStr === todayStr,
      isSelected: false, // Will be set by frontend
      isOutsideMonth,
      events: dayBookings
    });
  }

  return days;
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get empty analytics data structure
 */
const getEmptyAnalyticsData = (requestId: string, tenantSlug: string): FlowerBookingAnalytics => ({
  stats: {
    total: 0,
    pending: 0,
    sourced: 0,
    inTransit: 0,
    completed: 0,
    highPriority: 0,
    totalRevenue: 0
  },
  bookingsByDate: {},
  calendarDays: [],
  allBookings: [],
  products: PRODUCTS,
  metadata: {
    requestId,
    timestamp: new Date().toISOString(),
    executionTime: 0,
    tenantSlug,
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear()
  }
}

export default {
  getFlowerBookingAnalytics
};