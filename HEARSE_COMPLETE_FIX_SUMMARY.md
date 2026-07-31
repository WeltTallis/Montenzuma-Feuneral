# Complete Hearse Service Fix - Gateway, Authentication & Branch Selection

## Issues Fixed

### 1. ✅ 504 Gateway Timeout - Port Mismatch

**Problem:** Hearse service was listening on port 5003, but Docker maps external port 5023 to internal port 5000.

**Solution:** Changed `services/hearse-service/.env`

```diff
- PORT=5003
+ PORT=5000
```

**Result:** Gateway can now successfully forward requests to hearse service.

### 2. ✅ Missing JWT Authentication

**Problem:** Hearse routes had no authentication, but frontend sends JWT tokens.

**Solution:** Added `protect` middleware to all protected routes in `services/hearse-service/routes/hearseRoutes.ts`

**Protected Routes:**

- POST /hearses (register)
- PUT /hearses/:id (update)
- DELETE /hearses/:id (delete)
- POST /hearse-bookings (create booking)
- GET /hearse-bookings (list bookings)
- PUT /hearse-bookings/:booking_id/status (update status)
- PUT /hearse-bookings/:booking_id/assign-driver (assign driver)
- PATCH /hearse-bookings/:booking_id/postpone (postpone)
- GET /all-drivers (list drivers)
- GET /drivers/:driver_id/bookings (driver bookings)
- GET /drivers/:driver_id/dashboard (driver dashboard)
- GET /availability (check availability)
- GET /availability/check-by-date (check by date)
- GET /analytics/fleet (fleet analytics)
- GET /analytics/period (period analytics)

**Public Routes (No Auth):**

- GET /hearses (list all hearses)
- GET /hearses/available (list available hearses)

### 3. ✅ Branch Selection - Use branch_code Instead of branch_id

**Problem:** Frontend was sending `branch_id` which was required, causing error:

```json
{
  "success": false,
  "message": "Branch selection is required. Please select a branch."
}
```

**Solution:** Updated `services/hearse-service/controllers/registerHearse.ts` to support `branch_code`

**New Behavior:**

- Accepts either `branch_code` OR `branch_id`
- If `branch_code` is provided (e.g., "Nairobi"), looks up `branch_id` from database
- If `branch_id` is provided, looks up `branch_code` from database
- Only requires one form of identification

**Example Request (Using branch_code):**

```javascript
{
    "plate_number": "KCA 234 K",
    "hearse_name": "Mercedes benz",
    "model": "benz",
    "capacity": "8",
    "status": "available",
    "branch_code": "Nairobi"  // ✅ No branch_id required!
}
```

**Example Request (Using branch_id - still supported):**

```javascript
{
    "plate_number": "KCA 234 K",
    "hearse_name": "Mercedes benz",
    "model": "benz",
    "capacity": "8",
    "status": "available",
    "branch_id": 1  // ✅ Still works
}
```

## How It Works

### Gateway Flow

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
    ↓
Authentication Middleware (protect)
    ↓
Controller (registerHearse)
    ↓
Branch Code Lookup (if needed)
    ↓
Database Insert
```

### Branch Resolution Logic

```typescript
// Priority 1: If branch_code provided, look up branch_id
if (branch_code && !branch_id) {
  branch_id = lookupBranchId(branch_code);
}

// Priority 2: If branch_id provided, look up branch_code
else if (branch_id) {
  branch_code = lookupBranchCode(branch_id);
}

// Error: Neither provided
else {
  return error('Branch identification required');
}
```

## Files Modified

1. **services/hearse-service/.env**
   - Fixed port: 5003 → 5000

2. **services/hearse-service/routes/hearseRoutes.ts**
   - Added authentication middleware to all protected routes
   - Imported `protect` from auth-service

3. **services/hearse-service/controllers/registerHearse.ts**
   - Made `branch_id` optional
   - Added `branch_code` lookup logic
   - Updated `registerHearse` function
   - Updated `updateHearse` function

## Testing

### 1. Restart Services

```bash
docker-compose restart hearse-service
```

### 2. Test Health Check

```bash
curl http://localhost:5023/health
```

Expected: `{"status":"success","message":"Hearse Service is running"...}`

### 3. Test Hearse Registration with branch_code

```bash
curl -X POST http://localhost:5000/api/v1/restpoint/hearses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-slug: montenzuma-monalisa-feuneral-home-nairobi" \
  -H "Content-Type: application/json" \
  -d '{
    "plate_number": "KCA 234 K",
    "hearse_name": "Mercedes benz",
    "model": "benz",
    "capacity": "8",
    "status": "available",
    "branch_code": "Nairobi"
  }'
```

Expected Response:

```json
{
  "success": true,
  "message": "Hearse registered successfully.",
  "data": {
    "id": 1,
    "hearse_code": "HRS-001",
    "hearse_name": "Mercedes benz",
    "plate_number": "KCA 234 K",
    "branch_id": 1,
    "status": "available"
  }
}
```

### 4. Test Without Branch Info (Should Fail)

```bash
curl -X POST http://localhost:5000/api/v1/restpoint/hearses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-slug: montenzuma-monalisa-feuneral-home-nairobi" \
  -H "Content-Type: application/json" \
  -d '{
    "plate_number": "KCA 234 K",
    "hearse_name": "Mercedes benz"
  }'
```

Expected Response:

```json
{
  "success": false,
  "message": "Branch identification is required. Please provide branch_code or branch_id."
}
```

## Summary

✅ **Gateway forwarding fixed** - Port mismatch resolved (5003 → 5000)
✅ **Authentication enabled** - JWT validation on all protected routes
✅ **Branch selection simplified** - Can now use `branch_code` instead of `branch_id`
✅ **Backward compatible** - Still supports `branch_id` if provided
✅ **User-friendly** - Frontend can send human-readable branch codes like "Nairobi"

The hearse service is now fully functional with proper gateway routing, authentication, and flexible branch identification.
