export interface FlowerBooking {
  id: number;
  booking_id: string;
  arrangement_name: string;
  arrangement_price: number;
  deceased_name: string;
  booked_by: string;
  funeral_home: string;
  delivery_date: string;
  delivery_time: string;
  status: 'pending' | 'sourced' | 'transit' | 'completed';
  priority: 'High' | 'Normal' | 'Low';
  amount: number;
  flower_type: number | null;
  product_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  category: string;
}

export interface CalendarDay {
  date: string;
  day: number;
  month: number;
  year: number;
  isToday: boolean;
  isSelected: boolean;
  isOutsideMonth: boolean;
  events: FlowerBooking[];
}

export interface FlowerBookingAnalytics {
  // Overview stats
  stats: {
    total: number;
    pending: number;
    sourced: number;
    inTransit: number;
    completed: number;
    highPriority: number;
    totalRevenue: number;
  };

  // Bookings grouped by date
  bookingsByDate: Record<string, FlowerBooking[]>;

  // Calendar data (42 days for 6-week view)
  calendarDays: CalendarDay[];

  // All bookings sorted by date
  allBookings: FlowerBooking[];

  // Products catalog
  products: Product[];

  // Metadata
  metadata: {
    requestId: string;
    timestamp: string;
    executionTime: number;
    tenantSlug: string;
    currentMonth: number;
    currentYear: number;
  };
}

export interface FlowerBookingQuery {
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: string;
  searchQuery?: string;
  month?: number;
  year?: number;
}