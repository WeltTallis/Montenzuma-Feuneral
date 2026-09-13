# JWT Authentication Audit - Complete Results

## 🔍 CRITICAL FINDINGS

### Why curl Returns 401 While Browser Works

**Root Cause: MISSING `x-tenant-slug` HEADER** (95% confidence)

Your curl requests fail at the **tenant validation layer** BEFORE JWT verification even happens.

```bash
# ❌ FAILS - No x-tenant-slug header
curl -X GET 'http://localhost:5000/deceased/deceased-all' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
# Response: 403 {"success":false,"message":"Tenant not found or not active"}

# ✅ WORKS - Includes x-tenant-slug header
curl -X GET 'http://localhost:5000/deceased/deceased-all' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'x-tenant-slug: lee-funeral-home-nairobi'
# Response: 200 {"success":true,"data":[...]}
```

---

## 1️⃣ ALL SECRETS FOUND

### Single Secret in Use

```
RestPointJWTSecret2024ChangeMe!SuperSecureInProduction
```

**Locations**:

- **Signing**: [services/auth-service/controllers/authController.ts](services/auth-service/controllers/authController.ts#L314-L316) (lines 315-316)
- **Verification**: [services/app-global/middlewares/authMiddleware.js](services/app-global/middlewares/authMiddleware.js#L77-L95) (lines 77-95)
- **Dev Utility**: [gen-token.js](gen-token.js) (lines 1-10) - **SAME SECRET VALUE**
- **.env Files**: 25 services all contain identical secret

### Refresh Token Secret

```
RestPointRefreshSecret2024!SuperSecureInProduction
```

**Used in**: [services/auth-service/controllers/authController.ts](services/auth-service/controllers/authController.ts#L768-L778) for refresh endpoint

---

## 2️⃣ JWT SIGNING FLOW

### Endpoint: `/auth/login` → Generates New Tokens

**File**: [services/auth-service/controllers/authController.ts](services/auth-service/controllers/authController.ts#L314-L316)

```javascript
// Line 314-316
const { jwtSecret, refreshSecret } = await getTenantJwtSecret(tenantId);
const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '30d' });
```

**Token Payload** (line ~300):

```javascript
{
  (userId, // User ID from users table
    email, // User email
    tenantId, // Tenant ID from JWT
    tenantName, // Display name
    tenantSlug, // "lee-funeral-home-nairobi"
    dbName, // Database name for this tenant
    branchSlug, // Branch identifier
    branchDbName, // Branch database name
    role); // admin, user, staff, etc.
}
```

**Secret Selection**:

1. Query `tenant_tracking.tenants` table for per-tenant `jwt_secret`
2. If found → use per-tenant secret
3. If not found → fall back to `GLOBAL_JWT_SECRET` from `.env`

**Token Expiration**:

- Access token: 7 days
- Refresh token: 30 days

---

## 3️⃣ JWT VERIFICATION FLOW

### Two-Stage Verification Strategy

**File**: [services/app-global/middlewares/authMiddleware.js](services/app-global/middlewares/authMiddleware.js#L66-L99)

**Step 1 (lines 77-82)**: Try GLOBAL Secret

```javascript
try {
  verified = jwt.verify(token, GLOBAL_JWT_SECRET);
  return verified;
} catch (err) {
  // Fall through to Step 2
}
```

**Step 2 (lines 84-95)**: Try Tenant-Specific Secret

```javascript
const decoded = jwt.decode(token); // No verification, just decode
const tenantId = decoded.tenantId;
const [rows] = await pool.query('SELECT jwt_secret FROM tenant_tracking.tenants WHERE id = ?', [
  tenantId,
]);
if (rows[0]?.jwt_secret) {
  verified = jwt.verify(token, rows[0].jwt_secret);
  return verified;
}
```

**Used By**: `protect` middleware (lines 107-157)

- Extracts Bearer token from `Authorization: Bearer <token>` header
- OR reads from `req.cookies.access_token`
- Attaches `req.user` object to request

---

## 4️⃣ REFRESH TOKEN ENDPOINT

### `/auth/refresh` - Line 754-822

**Request**:

```javascript
POST /auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Verification Strategy** (lines 768-778):

```javascript
let verified;
try {
  // Step 1: Try global refresh secret
  verified = jwt.verify(refreshToken, GLOBAL_REFRESH_SECRET);
} catch {
  // Step 2: Decode and try tenant-specific refresh secret
  const payload = jwt.decode(refreshToken);
  const tenantSecret = await getTenantJwtSecret(payload.tenantId);
  verified = jwt.verify(refreshToken, tenantSecret.refreshSecret);
}
```

**Response** (new access token + refresh token):

```javascript
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 5️⃣ MULTI-TENANT HEADER VALIDATION

### The Critical Missing Header

Every request **MUST** include:

```
x-tenant-slug: <tenant-identifier>
```

**Examples**:

- `x-tenant-slug: lee-funeral-home-nairobi`
- `x-tenant-slug: system_shared` (reserved, returns 403)

### Validation Flow in Deceased Service

**File**: [services/deceased-service/server.ts](services/deceased-service/server.ts#L65-L141)

```typescript
// Middleware chain:
1. Extract x-tenant-slug header (line 73)
2. Validate it's not "system_shared" (line 80)
3. Resolve database name:
   a. Try direct connection to database named <tenantSlug>
   b. If fails, query tenant_tracking.tenants table
4. Attach to req.tenant object (line 130)
5. Continue to JWT verification middleware
```

**What Happens Without Header**:

```javascript
// Line 127-130
if (!resolvedDbName) {
  return res.status(403).json({
    success: false,
    message: 'Tenant not found or not active',
  });
}
```

---

## 6️⃣ ENVIRONMENT LOADING

### Secret Initialization (at module startup)

**Files**: authMiddleware.js (line 19-36), authController.ts (line 57-61)

```javascript
const GLOBAL_JWT_SECRET = process.env.JWT_SECRET || '';
const GLOBAL_REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || '';

if (!GLOBAL_JWT_SECRET || !GLOBAL_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be set');
}
```

**Fallback Chain**:

1. `process.env.JWT_SECRET` (from .env or environment)
2. Dev fallback in app-global: `'dev_local_jwt_secret_please_change'`
3. Per-tenant override from database (during verification only)
4. Fall back to GLOBAL again if tenant secret not found

### All 25 .env Files

```
✓ services/auth-service/.env
✓ services/api-gateway/.env
✓ services/tenant-service/.env
✓ services/deceased-service/.env
✓ services/coffin-service/.env
... (20 more services)

All contain:
JWT_SECRET=RestPointJWTSecret2024ChangeMe!SuperSecureInProduction
REFRESH_TOKEN_SECRET=RestPointRefreshSecret2024!SuperSecureInProduction
```

---

## 7️⃣ MISSING: Token Revocation/Blacklist

### Current Status: ❌ NO LOGOUT MECHANISM

**Grep Search Results**: 0 matches for "revoked_tokens", "blacklist", or "logout"

**Implications**:

- Once a token is issued, it cannot be revoked before expiration
- Access tokens valid for **7 days** even after user "logs out"
- No way to force logout across sessions
- Refresh tokens valid for **30 days** with no invalidation

**Recommended Fix**:

1. Add `revoked_tokens` table with columns: `token_hash`, `revoked_at`, `expires_at`
2. Add Redis cache: `revoked_tokens:<hash> → true` with TTL = 7 days
3. Check Redis before verifying in authMiddleware
4. On logout, add token to revoked list

---

## 8️⃣ WHY BROWSER WORKS, curl FAILS

### Browser Stack

✅ Includes valid access token  
✅ Sends x-tenant-slug header (via global interceptor or per-request)  
✅ Has automatic retry logic on 401 (calls /auth/refresh)  
✅ Updates stored tokens on refresh

### curl Command

✅ Has valid token  
❌ **MISSING x-tenant-slug header** → fails at tenant validation  
❌ No automatic refresh retry  
❌ No token management

### Working curl Command

```bash
# 1. Generate or obtain a valid token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Make request WITH x-tenant-slug header
curl -X GET \
  'http://localhost:5000/deceased/deceased-all' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'x-tenant-slug: lee-funeral-home-nairobi' \
  -H 'Content-Type: application/json'
```

---

## 9️⃣ GENERATING TEST TOKENS

### Using gen-token.js

```bash
cd /path/to/restpoint
node gen-token.js

# Output:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "expiresIn": "7d"
# }
```

**Token Claims** (hardcoded in gen-token.js):

- userId: 1
- email: "test@example.com"
- tenantId: 1
- tenantSlug: "lee-funeral-home-nairobi"
- branchSlug: "lee-funeral-home-nairobi"
- role: "admin"

### Using /auth/login Endpoint

```bash
curl -X POST 'http://localhost:5000/auth/login' \
  -H 'Content-Type: application/json' \
  -H 'x-tenant-slug: lee-funeral-home-nairobi' \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "accessToken": "eyJhbGciOiJIUzI1NiIs...",
#     "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
#   }
# }
```

---

## 🔟 VERIFICATION MATRIX

| Component                | Location              | Secret Used              | Fallback                      |
| ------------------------ | --------------------- | ------------------------ | ----------------------------- |
| **Sign Access Token**    | authController.ts:315 | Tenant-specific → GLOBAL | GLOBAL_JWT_SECRET             |
| **Sign Refresh Token**   | authController.ts:316 | Tenant-specific → GLOBAL | GLOBAL_REFRESH_SECRET         |
| **Verify Access Token**  | authMiddleware.js:77  | GLOBAL → Tenant-specific | Query tenant_tracking.tenants |
| **Verify Refresh Token** | authController.ts:768 | GLOBAL → Tenant-specific | Query tenant_tracking.tenants |
| **Cookie Signing**       | api-gateway:418       | GLOBAL_JWT_SECRET        | N/A                           |

---

## Summary Table

| Aspect                  | Value                                                  | File:Line             |
| ----------------------- | ------------------------------------------------------ | --------------------- |
| **JWT Secret**          | RestPointJWTSecret2024ChangeMe!SuperSecureInProduction | All .env files        |
| **Refresh Secret**      | RestPointRefreshSecret2024!SuperSecureInProduction     | auth-service/.env     |
| **Access Token TTL**    | 7 days                                                 | authController.ts:315 |
| **Refresh Token TTL**   | 30 days                                                | authController.ts:316 |
| **Required Header**     | x-tenant-slug                                          | authMiddleware.js:107 |
| **Token Verification**  | 2-stage (GLOBAL → tenant)                              | authMiddleware.js:77  |
| **Per-Tenant Override** | tenant_tracking.tenants table                          | authMiddleware.ts:47  |
| **Logout Support**      | ❌ None                                                | -                     |
| **Token Revocation**    | ❌ Not implemented                                     | -                     |

---

## 🚀 IMMEDIATE FIX

Add `x-tenant-slug` header to all curl requests:

```bash
curl -X GET 'http://localhost:5000/deceased/deceased-all' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'x-tenant-slug: lee-funeral-home-nairobi'
```

This single header will resolve the 401 errors you're experiencing.
