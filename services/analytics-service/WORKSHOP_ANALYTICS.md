# Workshop Analytics Endpoint - Implementation Summary

## Overview

A comprehensive workshop analytics endpoint has been created to support the `WorkshopDashboard` frontend component with real-time Socket.IO updates, TypeScript type safety, and advanced filtering capabilities.

## New Endpoint

**Primary Endpoint**: `GET /analytics/workshop/overview`

**Alternative Endpoints**:

- `GET /analytics/workshop/orders` - Orders with filtering
- `GET /analytics/workshop/workers` - Worker performance data
- `GET /analytics/workshop/materials` - Materials inventory
- `GET /analytics/workshop/search` - Search across all data
- `GET /analytics/workshop/stage/:stage` - Filter by production stage
- `GET /analytics/workshop/priority/:priority` - Filter by priority
- `GET /analytics/workshop/worker/:workerId` - Filter by worker

## Query Parameters

| Parameter     | Type    | Description                                                 | Example                                                                                                            |
| ------------- | ------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `startDate`   | string  | Start date (YYYY-MM-DD, optional, defaults to last 30 days) | `2024-01-01`                                                                                                       |
| `endDate`     | string  | End date (YYYY-MM-DD, optional)                             | `2024-12-31`                                                                                                       |
| `status`      | string  | Filter by order status                                      | `pending`, `active`, `completed`                                                                                   |
| `stage`       | string  | Filter by production stage                                  | `cutting`, `assembly`, `sanding`, `finishing`, `upholstery`, `hardware`, `quality_check`, `packaging`, `completed` |
| `priority`    | string  | Filter by priority                                          | `low`, `normal`, `high`, `urgent`                                                                                  |
| `workerId`    | number  | Filter by assigned worker ID                                | `1`, `2`, `3`                                                                                                      |
| `lowStock`    | boolean | Show only low stock materials                               | `true`                                                                                                             |
| `searchQuery` | string  | Search in customer_name, deceased_name, order_number        | `John Doe`                                                                                                         |

## Response Structure

```typescript
{
  success: true,
  data: {
    // Overview statistics
    stats: {
      totalOrders: number,           // Total orders in system
      activeOrders: number,          // Orders not yet completed
      completedToday: number,        // Completed today
      lowStockItems: number,         // Materials below minimum stock
      totalWorkers: number,          // Number of workers
      totalMaterials: number,        // Number of materials
      avgCompletionTime: number,     // Average hours per order
      onTimeDeliveryRate: number     // Percentage on-time delivery
    },

    // Orders with stages
    orders: [
      {
        id: 1,
        order_number: "WO-001",
        customer_name: "Wanjiru K.",
        deceased_name: "Stephen K.",
        coffin_type: "Standard",
        color: "Walnut",
        interior_fabric: "Satin Gold",
        current_stage: "assembly",
        priority: "normal",
        selling_price: 15000,
        order_date: "2024-12-01",
        due_date: "2024-12-06",
        assigned_worker: 1,
        status: "active",
        created_at: "2024-12-01T08:00:00Z",
        updated_at: "2024-12-02T10:00:00Z"
      }
    ],

    // Workers performance
    workers: [
      {
        id: 1,
        name: "James Mwangi",
        role: "Master Carpenter",
        initials: "JM",
        color: "#2563EB",
        speed: 0.9,
        reliability: 0.95,
        todayCount: 3,
        weekCount: 14,
        monthCount: 52,
        allTime: 384,
        avgHours: 4.2,
        trend: "up"
      }
    ],

    // Materials inventory
    materials: [
      {
        id: 1,
        name: "Pine Wood",
        category: "Wood",
        quantity: 150,
        unit: "pcs",
        minLevel: 50,
        costPerUnit: 500,
        supplier: "Timber Suppliers Ltd"
      }
    ],

    // Recent activity
    activity: [
      {
        id: 1,
        worker: { /* Worker object */ },
        action: "completed Cutting stage for",
        coffin: { /* Order object */ },
        time: "2024-12-15T10:30:00Z",
        type: "success"
      }
    ],

    // Stage distribution
    stageDistribution: [
      {
        stage: "assembly",
        label: "Assembly",
        count: 15,
        color: "#F97316"
      }
    ],

    // Worker performance metrics
    workerMetrics: {
      totalCompleted: 156,
      avgSpeed: 0.82,
      avgReliability: 0.88,
      topPerformer: { /* Worker object */ },
      needsAttention: { /* Worker object */ }
    },

    // Metadata
    metadata: {
      requestId: string,
      timestamp: string,
      executionTime: number,
      tenantSlug: string
    }
  }
}
```

## Production Stages

The endpoint uses the same stage flow as the frontend:

| Stage ID        | Label         | Color   | Description                  |
| --------------- | ------------- | ------- | ---------------------------- |
| `cutting`       | Cutting       | #EF4444 | Initial cutting of materials |
| `assembly`      | Assembly      | #F97316 | Assembling coffin structure  |
| `sanding`       | Sanding       | #EAB308 | Smoothing surfaces           |
| `finishing`     | Finishing     | #22C55E | Applying finish/paint        |
| `upholstery`    | Upholstery    | #14B8A6 | Interior fitting             |
| `hardware`      | Hardware      | #3B82F6 | Installing hardware          |
| `quality_check` | Quality Check | #8B5CF6 | Final inspection             |
| `packaging`     | Packaging     | #EC4899 | Packaging for delivery       |
| `completed`     | Completed     | #10B981 | Order completed              |

## Priority Levels

| Priority | Description                           |
| -------- | ------------------------------------- |
| `low`    | Low priority                          |
| `normal` | Standard priority                     |
| `high`   | High priority                         |
| `urgent` | Urgent - requires immediate attention |

## Worker Trends

| Trend    | Description            |
| -------- | ---------------------- |
| `up`     | Performance improving  |
| `stable` | Performance consistent |
| `down`   | Performance declining  |

## Example Usage

### Basic Request (Last 30 Days)

```bash
curl -H "x-tenant-slug: your-tenant" \
  http://localhost:5012/analytics/workshop/overview
```

### Filter by Stage

```bash
curl -H "x-tenant-slug: your-tenant" \
  "http://localhost:5012/analytics/workshop/orders?stage=assembly"
```

### Filter by Priority

```bash
curl -H "x-tenant-slug: your-tenant" \
  "http://localhost:5012/analytics/workshop/orders?priority=high"
```

### Filter by Worker

```bash
curl -H "x-tenant-slug: your-tenant" \
  "http://localhost:5012/analytics/workshop/worker/1"
```

### Low Stock Materials

```bash
curl -H "x-tenant-slug: your-tenant" \
  "http://localhost:5012/analytics/workshop/materials?lowStock=true"
```

### Search Orders

```bash
curl -H "x-tenant-slug: your-tenant" \
  "http://localhost:5012/analytics/workshop/search?searchQuery=John"
```

### Date Range

```bash
curl -H "x-tenant-slug: your-tenant" \
  "http://localhost:5012/analytics/workshop/overview?startDate=2024-01-01&endDate=2024-12-31"
```

### Combined Filters

```bash
curl -H "x-tenant-slug: your-tenant" \
  "http://localhost:5012/analytics/workshop/orders?stage=assembly&priority=high&workerId=1"
```

## Socket.IO Integration

The workshop analytics endpoint emits real-time updates via Socket.IO:

### Events Emitted

1. **`workshop_analytics_update`** - Emitted when analytics data is updated
   ```javascript
   {
     type: 'ANALYTICS_UPDATE',
     data: { /* partial WorkshopAnalytics */ },
     timestamp: '2024-12-15T10:30:00.000Z'
   }
   ```

### Rooms

- **`dashboard`** - All connected dashboard clients receive updates
- **`tenant_{slug}`** - Tenant-specific updates

### Client Integration

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5012');

// Join tenant room
socket.emit('join_tenant', 'your-tenant-slug');

// Join dashboard room
socket.emit('join_dashboard');

// Listen for analytics updates
socket.on('workshop_analytics_update', (data) => {
  console.log('Workshop analytics updated:', data);
  // Update your component state
  setAnalyticsData(data.data);
});
```

## Database Schema Requirements

The workshop analytics controller queries the following tables:

### `workshop_orders` table

**Required Fields**:

- `id` (Primary Key)
- `order_number` (Unique order identifier)
- `customer_name` (Customer name)
- `deceased_name` (Deceased name)
- `coffin_type` (Type of coffin)
- `color` (Coffin color)
- `interior_fabric` (Interior fabric type)
- `current_stage` (Current production stage)
- `priority` (low, normal, high, urgent)
- `selling_price` (Order price)
- `order_date` (Date order was placed)
- `due_date` (Expected completion date)
- `assigned_worker` (Worker ID)
- `status` (Order status)
- `tenant_slug` (Tenant identifier)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### `workers` table

**Required Fields**:

- `id` (Primary Key)
- `first_name` (Worker first name)
- `last_name` (Worker last name)
- `role` (Job role)
- `color` (Display color)
- `speed` (Performance metric 0-1)
- `reliability` (Reliability metric 0-1)
- `avg_hours` (Average hours per order)
- `trend` (up, stable, down)
- `tenant_slug` (Tenant identifier)

### `workshop_materials` table

**Required Fields**:

- `id` (Primary Key)
- `name` (Material name)
- `category` (Material category)
- `quantity` (Current stock level)
- `unit` (Unit of measurement)
- `min_stock_level` (Minimum stock threshold)
- `unit_price` (Price per unit)
- `supplier` (Supplier name)
- `tenant_slug` (Tenant identifier)

## Frontend Integration

### Updating the WorkshopDashboard Component

Replace existing API calls with the new analytics endpoint:

```javascript
// Old approach - multiple API calls
const [ordersRes, materialsRes, workersRes] = await Promise.all([
  workshopService.getOrders(),
  workshopService.getMaterials(),
  workshopService.getWorkers(),
]);

// New approach - single analytics call
const response = await fetch(`${API_BASE_URL}/analytics/workshop/overview`, {
  headers: getAuthHeaders(),
});
const { data } = await response.json();

// Use the analytics data
setOrders(data.orders);
setWorkers(data.workers);
setMaterials(data.materials);
setStats(data.stats);
setActivity(data.activity);
```

### Socket.IO Integration

```javascript
import { useSocket } from '../../../utils/context/socketContext';

const WorkshopDashboard = () => {
  const { socket } = useSocket();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for analytics updates
    socket.on('workshop_analytics_update', (update) => {
      if (update.type === 'ANALYTICS_UPDATE') {
        setAnalytics(update.data);
        // Refresh data when analytics update
        loadInitialData();
      }
    });

    return () => {
      socket.off('workshop_analytics_update');
    };
  }, [socket]);

  // Rest of component...
};
```

### Using Analytics Data

```javascript
// Overview stats
const { stats } = analytics;
console.log(`Total Orders: ${stats.totalOrders}`);
console.log(`Active Orders: ${stats.activeOrders}`);
console.log(`Completed Today: ${stats.completedToday}`);
console.log(`Low Stock Items: ${stats.lowStockItems}`);

// Orders with stages
const orders = analytics.orders.map((order) => ({
  ...order,
  stages: STAGES.map((stage) => ({
    ...stage,
    status: getStageStatus(order.current_stage, stage.id),
  })),
}));

// Workers performance
const workers = analytics.workers.map((worker) => ({
  ...worker,
  trendIcon: worker.trend === 'up' ? '↑' : worker.trend === 'down' ? '↓' : '→',
}));

// Materials inventory
const materials = analytics.materials.map((material) => ({
  ...material,
  isLowStock: material.quantity <= material.minLevel,
}));

// Stage distribution for charts
const stageData = analytics.stageDistribution.map((s) => ({
  label: s.label,
  count: s.count,
  color: s.color,
}));
```

## Performance Features

1. **Parallel Queries**: All database queries run in parallel using `Promise.allSettled`
2. **Error Resilience**: Failed queries don't block the entire response
3. **Indexed Queries**: Uses indexed fields (tenant_slug, created_at, current_stage)
4. **Real-time Updates**: Socket.IO pushes updates to connected clients
5. **Efficient Filtering**: SQL-level filtering reduces data transfer
6. **Activity Generation**: Smart activity feed generation from order data
7. **Worker Metrics**: Pre-calculated performance metrics

## Worker Performance Metrics

The endpoint calculates comprehensive worker metrics:

- **Speed**: Efficiency metric (0-1 scale)
- **Reliability**: Consistency metric (0-1 scale)
- **Today Count**: Orders completed today
- **Week Count**: Orders completed this week
- **Month Count**: Orders completed this month
- **All Time**: Total orders completed
- **Average Hours**: Average time per order
- **Trend**: Performance trend (up/stable/down)

## Materials Inventory Management

The endpoint provides inventory insights:

- **Current Quantity**: Stock level
- **Minimum Level**: Reorder threshold
- **Low Stock Alert**: Items below minimum
- **Cost Per Unit**: Material cost
- **Supplier**: Source information
- **Category**: Material classification

## Activity Feed

The endpoint generates an activity feed from recent orders:

- **Worker**: Who performed the action
- **Action**: What was done
- **Coffin**: Which order was affected
- **Time**: When it happened
- **Type**: Success/info/warning/error

## Testing

### Test the Endpoint

```bash
# Start the analytics service
cd services/analytics-service
npm start

# Test in another terminal
curl -H "x-tenant-slug: system_shared" \
  http://localhost:5012/analytics/workshop/overview

# Test with filters
curl -H "x-tenant-slug: system_shared" \
  "http://localhost:5012/analytics/workshop/orders?stage=assembly&priority=high"

# Test worker filter
curl -H "x-tenant-slug: system_shared" \
  "http://localhost:5012/analytics/workshop/worker/1"

# Test low stock
curl -H "x-tenant-slug: system_shared" \
  "http://localhost:5012/analytics/workshop/materials?lowStock=true"

# Test search
curl -H "x-tenant-slug: system_shared" \
  "http://localhost:5012/analytics/workshop/search?searchQuery=John"
```

### Test Socket.IO Connection

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:5012');

socket.on('connect', () => {
  console.log('Connected:', socket.id);

  // Join tenant
  socket.emit('join_tenant', 'your-tenant');

  // Join dashboard
  socket.emit('join_dashboard');
});

socket.on('workshop_analytics_update', (data) => {
  console.log('Analytics update:', data);
});
```

## Migration Guide

### Step 1: Update Frontend API Calls

Replace existing API calls in `WorkshopDashboard.jsx`:

```javascript
// Old approach - multiple API calls
const [ordersRes, materialsRes, workersRes] = await Promise.all([
  workshopService.getOrders(),
  workshopService.getMaterials(),
  workshopService.getWorkers(),
]);

// New approach - single analytics call
const response = await fetch(`${API_BASE_URL}/analytics/workshop/overview`, {
  headers: getAuthHeaders(),
});
const { data } = await response.json();

// Use the analytics data
setOrders(data.orders);
setMaterials(data.materials);
setWorkers(data.workers);
setStats(data.stats);
setActivity(data.activity);
```

### Step 2: Add Socket.IO Listeners

```javascript
useEffect(() => {
  if (!socket) return;

  socket.on('workshop_analytics_update', (update) => {
    if (update.type === 'ANALYTICS_UPDATE') {
      // Refresh data
      loadInitialData();
    }
  });

  return () => socket.off('workshop_analytics_update');
}, [socket]);
```

### Step 3: Update Component to Use Analytics Data

```javascript
// Use pre-calculated stats
const { stats } = analytics;
const totalOrders = stats.totalOrders;
const activeOrders = stats.activeOrders;

// Use workers with metrics
const workers = analytics.workers;
const topPerformer = analytics.workerMetrics.topPerformer;

// Use materials with low stock alerts
const materials = analytics.materials;
const lowStockItems = materials.filter((m) => m.quantity <= m.minLevel);

// Use activity feed
const activity = analytics.activity;
```

## Troubleshooting

### TypeScript Compilation Errors

The TypeScript files are compiled at runtime. If you see errors:

1. Ensure TypeScript is installed: `npm install typescript --save-dev`
2. Check tsconfig.json settings
3. The service runs on JavaScript (server.js), TypeScript is for type safety during development

### Socket.IO Connection Issues

- Verify Socket.IO client version matches server version (v4.8.0)
- Check CORS settings in server.js
- Ensure firewall allows port 5012
- Verify tenant slug is correct

### Database Query Errors

- Verify `workshop_orders`, `workers`, and `workshop_materials` tables exist
- Check tenant database connection
- Ensure tables have `tenant_slug` column for multi-tenancy
- Verify all required fields are present in tables

## Files Created

1. **`types/workshopAnalytics.types.ts`** - TypeScript interfaces
2. **`controllers/workshopAnalytics.controller.ts`** - Main controller
3. **`routes/workshopAnalytics.routes.ts`** - Route definitions
4. **`server.js`** (updated) - Mounted new routes

## Backward Compatibility

All existing routes continue to work:

- `/analytics/workshop/overview` - New comprehensive analytics endpoint
- All other existing endpoints remain unchanged

## Next Steps

1. **Update Frontend**: Modify `WorkshopDashboard.jsx` to use the new endpoint
2. **Add Socket.IO Context**: Ensure Socket.IO is available in the workshop dashboard component
3. **Test Integration**: Verify real-time updates work correctly
4. **Performance Testing**: Test with large datasets (1000+ orders)
5. **Add Caching**: Implement Redis caching for frequently requested data
6. **Add Charts**: Integrate Chart.js for stage distribution and worker performance visualization

## Support

For issues or questions:

- Check logs: `services/analytics-service/logs/combined.log`
- Review this documentation
- Contact the development team
