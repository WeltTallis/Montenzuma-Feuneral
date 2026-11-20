/**
 * Hearse Analytics Types
 * Matches the frontend HearseBookings component data requirements
 */

// Core hearse booking record
export interface HearseBooking {
  booking_id: number;
  booking_code?: string;
  hearse_id: number;
  client_name: string;
  client_phone?: string;
  from_location: string;
  to_location: string;
  destination?: string;
  booking_date: string;
  estimated_departure_time?: string;
  end_date?: string;
  delivery_time?: string;
  status: 'pending' | 'booked' | 'in_transit' | 'completed' | 'cancelled' | 'postponed' | 'maintenance';
  branch_id: number;
  branch_name?: string;
  branch_code?: string;
  hearse_name?: string;
  plate_number?: string;
  number_plate?: string;
  model?: string;
  booked_by?: string;
  booked_by_name?: string;
  created_at: string;
  updated_at?: string;
}

// Hearse vehicle
export interface Hearse {
  id: number;
  hearse_name: string;
  plate_number: string;
  number_plate?: string;
  model?: string;
  capacity: number;
  status: 'available' | 'booked' | 'maintenance';
  branch_id: number;
  branch_name?: string;
  branch_code?: string;
}

// Branch
export interface Branch {
  branch_id: number;
  branch_name: string;
  branch_code: string;
  branch_location?: string;
  branch_phone?: string;
}

// Statistics
export interface HearseStats {
  total: number;
  active: number;
  pending: number;
  inProgress: number;
  completed: number;
}

// Status distribution
export interface StatusCount {
  status: string;
  count: number;
  label: string;
  color: string;
  bg: string;
  dotColor: string;
}

// Time-based analytics
export interface TimeRangeAnalytics {
  range: string;
  startDate: string;
  endDate: string;
  count: number;
}

// Branch performance
export interface BranchPerformance {
  branchId: number;
  branchName: string;
  branchCode: string;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  utilizationRate: number;
}

// Hearse utilization
export interface HearseUtilization {
  hearseId: number;
  hearseName: string;
  plateNumber: string;
  totalBookings: number;
  completedTrips: number;
  cancelledTrips: number;
  utilizationRate: number;
  status: string;
}

// Daily trends
export interface DailyTrend {
  date: string;
  bookings: number;
  completions: number;
  cancellations: number;
}

// Main analytics response
export interface HearseAnalyticsData {
  // Stats cards
  stats: HearseStats;
  
  // Status distribution for badges
  statusDistribution: StatusCount[];
  
  // Time range analytics
  todayCount: number;
  thisWeekCount: number;
  thisMonthCount: number;
  
  // Branch performance
  branchPerformance: BranchPerformance[];
  
  // Hearse utilization
  hearseUtilization: HearseUtilization[];
  
  // Daily trends (last 30 days)
  dailyTrends: DailyTrend[];
  
  // Recent bookings
  recentBookings: HearseBooking[];
  
  // Metadata
  metadata: {
    requestId: string;
    timestamp: string;
    executionTime: number;
    tenantSlug: string;
    branchId?: number;
  };
}

// Query parameters
export interface HearseAnalyticsQuery {
  timeRange?: 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'thisMonth' | 'nextMonth' | 'all';
  startDate?: string;
  endDate?: string;
  branchId?: number;
  status?: string;
  searchQuery?: string;
}

// Socket.IO events
export interface HearseSocketEvents {
  'new_booking': {
    booking: HearseBooking;
  };
  'booking_status_updated': {
    booking_id: number;
    status: string;
    booking: Partial<HearseBooking>;
  };
  'booking_postponed': void;
  'hearse_analytics_update': {
    type: 'ANALYTICS_UPDATE';
    data: Partial<HearseAnalyticsData>;
    timestamp: string;
  };
  'join_tenant': string;
  'join_dashboard': void;
}