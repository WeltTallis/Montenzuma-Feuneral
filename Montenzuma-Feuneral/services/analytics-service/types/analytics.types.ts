/**
 * Deceased Analytics Types
 * Matches the frontend DeceasedAnalytics component data requirements
 */

// Core deceased record from database
export interface DeceasedRecord {
  id: number;
  deceased_id: string;
  tenant_slug: string;
  admission_number: string;
  cause_of_death: string | null;
  date_admitted: string;
  date_of_birth: string;
  date_of_death: string;
  date_registered: string;
  full_name: string;
  gender: 'Male' | 'Female' | 'Other';
  place_of_death: string;
  county: string;
  national_id: string;
  location: string | null;
  portal_slug: string | null;
  admission_status: 'admitted' | 'embalmed' | 'released' | 'buried';
  release_status: 'pending' | 'approved' | 'released';
  chamber_assigned: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

// Postmortem fields (if table exists)
export interface DeceasedRecordWithPM extends DeceasedRecord {
  postmortem_requested?: boolean;
  postmortem_completed?: boolean;
  postmortem_report?: string;
  contact_person?: string;
  id_number?: string;
  tel_number?: string;
  received_from?: string;
  dispatch_date?: string;
  dispatch_time?: string;
  dispatched_to?: string;
  time_received?: string;
}

// Status counts
export interface StatusCount {
  status: string;
  count: number;
}

// Monthly trend data
export interface MonthlyTrend {
  month: string;
  count: number;
}

// Gender distribution
export interface GenderCount {
  gender: string;
  count: number;
}

// Postmortem tracking
export interface PMTracking {
  pending: number;
  completed: number;
  notRequested: number;
}

// Stay duration ranges
export interface StayDuration {
  label: string;
  min: number;
  max: number;
  count: number;
}

// Calendar day data
export interface CalendarDayData {
  date: string;
  total: number;
  hasPM: boolean;
  hasRelease: boolean;
}

// Action queue items
export interface AwaitingAutopsyItem {
  id: number;
  full_name: string;
  admission_number: string;
  gender: string;
  age: number;
  date_admitted: string;
  time_received: string;
  received_from: string;
  postmortem_requested: boolean;
  postmortem_completed: boolean;
}

export interface AwaitingDispatchItem {
  id: number;
  full_name: string;
  admission_number: string;
  date_admitted: string;
  contact_person: string;
  tel_number: string;
  body_status: string;
}

export interface DispatchedItem {
  id: number;
  full_name: string;
  admission_number: string;
  body_status: string;
  dispatch_date: string;
  dispatched_to: string;
}

// Main analytics response
export interface DeceasedAnalyticsData {
  // Stats cards
  total: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
  active: number;
  released: number;
  inMorgue: number;
  pmPending: number;
  pmDone: number;
  pendingAutopsy: number;
  transferred: number;

  // Charts data
  monthlyData: MonthlyTrend[];
  statusData: StatusCount[];
  genderData: GenderCount[];
  pmData: PMTracking;
  stayData: StayDuration[];

  // Calendar
  calendarDays: CalendarDayData[];

  // Action queues
  awaitingAutopsy: AwaitingAutopsyItem[];
  awaitingDispatch: AwaitingDispatchItem[];
  dispatched: DispatchedItem[];

  // Full records list (frontend DeceasedAnalytics component records state)
  records: DeceasedRecordWithPM[];

  // Metadata
  metadata: {
    requestId: string;
    timestamp: string;
    executionTime: number;
    timeRange: string;
  };
}

// Query parameters
export interface DeceasedAnalyticsQuery {
  timeRange?: '3m' | '6m' | '12m';
  startDate?: string;
  endDate?: string;
  status?: string;
  pmFilter?: string;
  searchQuery?: string;
  selectedDate?: string;
}

// Socket.io event types
export interface AnalyticsSocketEvents {
  'dashboard_update': {
    type: 'DASHBOARD_UPDATE' | 'ANALYTICS_UPDATE';
    data: Partial<DeceasedAnalyticsData>;
    timestamp: string;
  };
  'analytics_refresh': {
    type: 'REFRESH';
    timestamp: string;
  };
  'join_tenant': string;
  'join_dashboard': void;
}

// Background job types
export interface AnalyticsJobData {
  tenantId: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  type: 'deceased' | 'comprehensive' | 'all';
}

export interface AnalyticsJobResult {
  jobId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  data: Partial<DeceasedAnalyticsData>;
}