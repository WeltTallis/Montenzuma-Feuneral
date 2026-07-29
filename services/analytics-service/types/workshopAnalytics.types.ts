export interface WorkshopOrder {
  id: number;
  order_number: string;
  customer_name: string;
  deceased_name: string;
  coffin_type: string;
  color: string;
  interior_fabric: string;
  current_stage: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  selling_price: number;
  order_date: string;
  due_date: string;
  assigned_worker: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderStage {
  id: string;
  label: string;
  icon: string;
  color: string;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
}

export interface Worker {
  id: number;
  name: string;
  role: string;
  initials: string;
  color: string;
  speed: number;
  reliability: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  allTime: number;
  avgHours: number;
  trend: 'up' | 'stable' | 'down';
}

export interface Material {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minLevel: number;
  costPerUnit: number;
  supplier: string;
}

export interface Activity {
  id: number;
  worker: Worker;
  action: string;
  coffin: WorkshopOrder;
  time: Date;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface WorkshopAnalytics {
  // Overview stats
  stats: {
    totalOrders: number;
    activeOrders: number;
    completedToday: number;
    lowStockItems: number;
    totalWorkers: number;
    totalMaterials: number;
    avgCompletionTime: number;
    onTimeDeliveryRate: number;
  };

  // Orders with stages
  orders: WorkshopOrder[];

  // Workers performance
  workers: Worker[];

  // Materials inventory
  materials: Material[];

  // Recent activity
  activity: Activity[];

  // Stage distribution
  stageDistribution: {
    stage: string;
    label: string;
    count: number;
    color: string;
  }[];

  // Worker performance metrics
  workerMetrics: {
    totalCompleted: number;
    avgSpeed: number;
    avgReliability: number;
    topPerformer: Worker | null;
    needsAttention: Worker | null;
  };

  // Metadata
  metadata: {
    requestId: string;
    timestamp: string;
    executionTime: number;
    tenantSlug: string;
  };
}

export interface WorkshopAnalyticsQuery {
  startDate?: string;
  endDate?: string;
  status?: string;
  stage?: string;
  priority?: string;
  workerId?: number;
  lowStock?: boolean;
  searchQuery?: string;
}