# Excel Export with BullMQ Background Processing

## Overview

This document describes the Excel export functionality with background job processing using BullMQ and Redis.

## Architecture

### Components

1. **Queue** (`queues/excelExportQueue.ts`) - BullMQ queue for managing export jobs
2. **Worker** (`workers/excelExportWorker.ts`) - Background worker that processes export jobs
3. **Controller** (`controllers/exportExcelController.ts`) - API endpoints for export operations
4. **Routes** (`routes/exportExel.ts`) - Route definitions
5. **Frontend** (`listDeceased.jsx`) - UI component with export modal

## API Endpoints

### 1. POST /api/deceased/export-excel

Queues a new Excel export job.

**Request Body:**

```json
{
  "startDate": "2025-01-01", // Optional
  "endDate": "2025-12-31" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Export job queued successfully",
  "jobId": "excel-export-tenant-1234567890",
  "status": "processing",
  "estimatedTime": "30-60 seconds",
  "checkStatusUrl": "/api/deceased/export-status/excel-export-tenant-1234567890"
}
```

### 2. GET /api/deceased/export-status/:jobId

Checks the status of an export job. When completed, downloads the file.

**Response (Processing):**

```json
{
  "success": true,
  "status": "active",
  "progress": 50,
  "message": "Export in progress..."
}
```

**Response (Completed):**
Returns the Excel file as a binary stream with headers:

- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename=Deceased_Records_tenant_2025-01-01.xlsx`

### 3. GET /api/deceased/export-history

Retrieves export history for the current tenant.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "jobId": "excel-export-tenant-1234567890",
      "date": "Jan 1, 2025, 10:00 AM",
      "range": "2025-01-01 to 2025-12-31",
      "format": "XLSX",
      "status": "Completed",
      "recordCount": 150,
      "requestedBy": "admin@example.com"
    }
  ]
}
```

## Frontend Integration

### Export Modal

The export modal in `listDeceased.jsx` provides:

1. Date range selection (start and end dates)
2. Export history table
3. Real-time progress tracking
4. Automatic file download when complete

### Export Flow

1. User clicks "Export Data to Excel" button
2. Modal opens with date range picker
3. User selects dates (optional) and clicks "Generate Export"
4. Frontend calls POST /api/deceased/export-excel
5. Backend queues job and returns jobId
6. Frontend polls GET /api/deceased/export-status/:jobId every 2 seconds
7. When job completes, file is automatically downloaded
8. Toast notification shows success/error message

## Excel File Features

### Styling

The exported Excel file includes:

- **Title Row**: Dark background (#1F2937) with white text
- **Subtitle Row**: Green background (#475A43) with generation timestamp
- **Header Row**: Brown background (#8B7355) with white text
- **Alternating Rows**: Light beige (#F9F7F4) for even rows
- **Status Colors**:
  - Released: Green background (#D5E5D0)
  - Admitted/Active: Brown background (#E8E0D5)
  - Pending: Red background (#F8D7DA)

### Columns

1. File ID (styled with brown bold text)
2. Full Name
3. Date of Birth (gray text)
4. Date of Death (gray text)
5. Next of Kin
6. Service Type
7. Status (color-coded)
8. Release Date (gray text)
9. Admission Date (gray text)

## BullMQ Configuration

### Queue Settings

- **Queue Name**: `excel-export`
- **Max Attempts**: 3
- **Backoff Strategy**: Exponential (2s, 4s, 8s)
- **Job Retention**:
  - Completed: 24 hours (max 100 jobs)
  - Failed: 7 days

### Worker Settings

- **Concurrency**: 2 jobs simultaneously
- **Progress Updates**: 10%, 30%, 50%, 70%, 90%, 100%

## Redis Configuration

The queue requires Redis connection. Configure via environment variables:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password
```

## Environment Variables

### Required

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=restpoint_user
DB_PASSWORD=your_password
DB_NAME=restpoint_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=5003
```

## Installation

### 1. Install Dependencies

```bash
cd services/deceased-service
npm install
```

Dependencies already included in package.json:

- `bullmq: ^5.77.6`
- `ioredis: ^5.11.0`
- `exceljs: ^4.4.0`

### 2. Start Redis

Ensure Redis is running on the configured host/port.

### 3. Start the Service

```bash
npm run dev
```

The worker will automatically start when the server initializes.

## Testing

### Manual Testing

1. Navigate to Deceased Records page
2. Click "Export Data to Excel" button
3. Select date range (optional)
4. Click "Generate Export"
5. Wait for progress to reach 100%
6. File will automatically download

### API Testing with curl

```bash
# Queue export job
curl -X POST http://localhost:5003/api/deceased/export-excel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-slug: your-tenant" \
  -H "Content-Type: application/json" \
  -d '{"startDate": "2025-01-01", "endDate": "2025-12-31"}'

# Check status (replace JOB_ID with actual job ID)
curl http://localhost:5003/api/deceased/export-status/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-slug: your-tenant"

# Get export history
curl http://localhost:5003/api/deceased/export-history \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-slug: your-tenant"
```

## Troubleshooting

### Jobs Not Processing

- Verify Redis is running: `redis-cli ping`
- Check worker logs for errors
- Ensure BullMQ connection is established

### File Not Downloading

- Check /tmp directory has write permissions
- Verify file was created by worker
- Check browser console for CORS errors

### TypeScript Errors

- Ensure tsconfig.json includes queues and workers directories
- Run `npm run build` to compile TypeScript

## Performance Considerations

- Large exports (10,000+ records) may take 30-60 seconds
- Worker concurrency is limited to 2 to prevent memory issues
- Jobs are retried up to 3 times with exponential backoff
- Old jobs are automatically cleaned up to save Redis memory

## Future Enhancements

1. **Chart Support**: Add QuickChart integration for visual analytics
2. **Email Notifications**: Send email when export completes
3. **Scheduled Exports**: Allow users to schedule recurring exports
4. **WebSocket Updates**: Real-time progress via Socket.IO instead of polling
5. **File Storage**: Store exports in S3 or similar for large files
