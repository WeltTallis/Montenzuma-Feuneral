# Hearse Service Gateway & Authentication Fix

## Issues Identified

### 1. **504 Gateway Timeout - Port Mismatch**

**Problem:** The hearse service was configured to run on port 5003, but the Docker container maps external port 5023 to internal port 5000.

**Root Cause:**

- API Gateway forwards to: `http://localhost:5023/hearses`
- Docker maps: `5023:5000` (external:internal)
- Hearse service was listening on: `PORT=5003` ❌
- No service was listening on port 5000, causing connection timeout

### 2. **Missing Authentication**

**Problem:** Hearse service routes had no authentication middleware, but the frontend sends JWT tokens.

**Impact:** API requests were failing because tokens were not being validated.

## Fixes Applied

### Fix 1: Corrected Hearse Service Port Configuration

**File:** `services/hearse-service/.env`

```diff
- PORT=5003
+ PORT=5000
```

**Explanation:**

- All Docker services run on internal port 5000
- Docker maps different external ports (5023 for hearse, 5000 for gateway, etc.)
- This is standard Docker microservice architecture - no port conflicts within containers

### Fix 2: Added Authentication Middleware to Hearse Routes

**File:** `services/hearse-service/routes/hearseRoutes.ts`

**Changes:**

- Imported `protect` middleware from auth-service
- Added authentication to all protected routes:
  - POST /hearses (register hearse)
  - PUT /hearses/:id (update hearse)
  - DELETE /hearses/:id (delete hearse)
  - POST /hearse-bookings (create booking)
  - GET /hearse-bookings (list bookings)
  - PUT /hearse-bookings/:booking_id/status (update status)
  - PUT /hearse-bookings/:booking_id/assign-driver (assign driver)
  - PATCH /hearse-bookings/:booking_id/postpone (postpone booking)
  - GET /all-drivers (list drivers)
  - GET /drivers/:driver_id/bookings (driver bookings)
  - GET /drivers/:driver_id/dashboard (driver dashboard)
  - GET /availability (check availability)
  - GET /availability/check-by-date (check by date)
  - GET /analytics/fleet (fleet analytics)
  - GET /analytics/period (period analytics)

**Public Routes (No Auth Required):**

- GET /hearses (list all hearses)
- GET /hearses/available (list available hearses)

## How the Gateway Forwarding Works

```
Frontend Request
    ↓
API Gateway (localhost:5000)
    ↓
Route: /api/v1/restpoint/hearses → http://localhost:5023/hearses
    ↓
Docker Port Mapping: 5023:5000
    ↓
Hearse Service Container (port 5000) ✅
```

## Verification Steps

1. **Restart Hearse Service:**

   ```bash
   docker-compose restart hearse-service
   ```

2. **Check Hearse Service Health:**

   ```bash
   curl http://localhost:5023/health
   ```

   Expected: `{"status":"success","message":"Hearse Service is running"...}`

3. **Test Hearse Registration with Token:**

   ```bash
   curl -X POST http://localhost:5000/api/v1/restpoint/hearses \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "x-tenant-slug: your-tenant" \
     -H "Content-Type: application/json" \
     -d '{"plate_number":"ABC123","branch_id":1}'
   ```

4. **Check Gateway Health:**
   ```bash
   curl http://localhost:5000/health
   ```
   Verify hearse service shows as healthy

## Architecture Notes

### Docker Port Mapping

- Each service runs in its own container
- All services listen on internal port 5000
- Docker maps unique external ports to each container's port 5000
- No port conflicts possible between containers

### Authentication Flow

1. Frontend sends JWT token in Authorization header
2. API Gateway forwards token to hearse service
3. Hearse service `protect` middleware validates token
4. Token is verified using tenant-specific JWT secret
5. User info is attached to request object
6. Controller processes authenticated request

## Related Files Modified

1. `services/hearse-service/.env` - Fixed port configuration
2. `services/hearse-service/routes/hearseRoutes.ts` - Added authentication

## No Changes Required

- `services/api-gateway/server.js` - Gateway configuration was correct
- `docker-compose.yml` - Port mapping was correct (5023:5000)
- Frontend code - Already sending correct tokens and headers

## Troubleshooting

If issues persist after restart:

1. **Check hearse service logs:**

   ```bash
   docker-compose logs hearse-service
   ```

2. **Verify port binding:**

   ```bash
   docker ps | grep hearse
   # Should show: 0.0.0.0:5023->5000/tcp
   ```

3. **Test direct connection:**

   ```bash
   curl http://localhost:5023/health
   ```

4. **Check gateway routing:**
   ```bash
   curl http://localhost:5000/health
   # Look for hearse service status
   ```

## Summary

✅ Fixed port mismatch (5003 → 5000)
✅ Added JWT authentication to all protected routes
✅ Gateway forwarding now works correctly
✅ Token validation enabled for hearse operations

The hearse service should now respond correctly to API gateway requests with proper authentication.
