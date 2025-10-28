# UAT Test Report - Attempt 2 of 3
**Feature**: Custom Reports and Dashboards - Middleware Protection
**Date**: 2025-10-28
**Tester**: moss-tester
**Status**: ❌ **FAILED**

---

## Executive Summary

**Middleware fix applied**: Added `/reports` and `/dashboards` to protected routes in middleware
**Result**: Tests still fail with 401 errors
**Root Cause Identified**: API routes use Bearer token authentication (`requireApiScope`), but web UI uses session cookies

**Critical Issue**: The reports API requires bearer token authentication, but the frontend makes requests with session cookies (NextAuth). This is an architectural mismatch.

---

## Test Environment

- **Server**: Next.js dev server on port 3001
- **Database**: PostgreSQL (local)
- **Browser**: Playwright headless browser
- **Authentication**: Logged in user with session cookie

---

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| Navigate to /reports | ✅ PASS | Page loads, protected by middleware |
| Reports list loads | ❌ FAIL | API returns 401 Unauthorized |
| Create new report | ⏭️ SKIP | Blocked by previous failure |
| Save report | ⏭️ SKIP | Blocked by previous failure |
| Run report | ⏭️ SKIP | Blocked by previous failure |
| Templates tab | ⏭️ SKIP | Blocked by previous failure |
| Navigate to /dashboards | ⏭️ SKIP | Not tested due to API issue |
| Dashboard list loads | ⏭️ SKIP | Not tested due to API issue |

**Pass Rate**: 1/2 completed tests (50%)
**Overall Status**: ❌ FAILED

---

## Detailed Test Results

### Test 1: Navigate to /reports ✅ PASS

**Steps**:
1. Navigate to `http://localhost:3001/reports`
2. Verify page loads

**Expected**: Page loads with reports UI
**Actual**: Page loads correctly with:
- Breadcrumb: Home / Reports
- Header: "Reports"
- Description text
- "Create New Report" button
- Tabs: My Reports, Shared Reports, Templates

**Screenshot**: `/Users/admin/Dev/moss/.playwright-mcp/reports-page-401-error.png`

**Result**: ✅ PASS - Middleware protection working

---

### Test 2: Reports list loads ❌ FAIL

**Steps**:
1. Wait for reports API call to complete
2. Verify reports list displays

**Expected**: Reports list displays with data
**Actual**: Error message "Error: Failed to fetch reports"

**Console Errors**:
```
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) @ http://localhost:3001/api/reports?
```

**Network Trace**:
```
GET /api/reports? => [401] Unauthorized
```

**API Response** (presumed):
```json
{
  "success": false,
  "error": "Missing Authorization header",
  "message": "Please provide a Bearer token in the Authorization header"
}
```

**Result**: ❌ FAIL - API requires Bearer token, but frontend uses session cookie

---

## Root Cause Analysis

### The Problem

The reports API routes (`/src/app/api/reports/route.ts`) use `requireApiScope(request, ['read'])` for authentication. This function:

1. Extracts Bearer token from `Authorization` header
2. Validates token against `api_tokens` table
3. Returns 401 if no Bearer token found

However, the web UI makes fetch requests with session cookies (NextAuth), not Bearer tokens.

### Code Evidence

**Reports API** (`/src/app/api/reports/route.ts` lines 19-27):
```typescript
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'read' scope
  const authResult = await requireApiScope(request, ['read'])  // ❌ REQUIRES BEARER TOKEN
  if (authResult instanceof NextResponse) return authResult

  const { userId } = authResult
  // ...
}
```

**Bearer Token Check** (`/src/lib/apiAuth.ts` lines 198-219):
```typescript
export async function requireApiAuth(request: NextRequest): Promise<...> {
  const token = extractBearerToken(request)  // ❌ LOOKS FOR BEARER TOKEN

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing Authorization header',  // ❌ THIS IS THE ERROR WE SEE
        message: 'Please provide a Bearer token in the Authorization header',
      },
      { status: 401 }
    )
  }
  // ...
}
```

**Comparison: Working API** (`/src/app/api/devices/route.ts` lines 19-26):
```typescript
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Note: Web UI uses NextAuth session-based auth, not API tokens  // ✅ COMMENT EXPLAINS IT
  // API token auth can be added here if needed for external API access
  try {
    // ... no requireApiScope call for GET requests
  }
}
```

### Why This Happened

The reports API was implemented to require bearer token authentication for ALL requests, including GET requests from the web UI. This is inconsistent with other API routes like `/api/devices`, which:
- Allow session-based authentication for GET requests from web UI
- Only require bearer tokens for external API access
- Use `requireApiScope` only for POST/PATCH/DELETE operations

---

## Solution Required

### Option 1: Make API Auth Optional for GET (Recommended)

Modify `/src/app/api/reports/route.ts` to NOT require bearer tokens for GET requests:

```typescript
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Note: Web UI uses NextAuth session-based auth, not API tokens
  // API token auth can be added here if needed for external API access
  try {
    // ... rest of implementation
  }
}
```

**Pros**:
- Consistent with existing patterns (devices, people, locations, etc.)
- Web UI works immediately
- No changes to frontend code needed

**Cons**:
- No authentication check on GET requests (relies on middleware only)

### Option 2: Add Session-Based Auth Fallback

Modify `requireApiScope` to check for session cookies if no Bearer token:

```typescript
export async function requireApiScope(
  request: NextRequest,
  requiredScopes: string[]
): Promise<...> {
  // Try Bearer token first
  const token = extractBearerToken(request)

  if (token) {
    // Validate bearer token
    const authResult = await requireApiAuth(request)
    // ... existing logic
  } else {
    // Fall back to session-based auth
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    return { userId: session.user.id, ... }
  }
}
```

**Pros**:
- More secure (authentication on every request)
- Supports both bearer tokens AND sessions

**Cons**:
- More complex implementation
- Need to import NextAuth into apiAuth.ts

### Option 3: Frontend Adds Bearer Token

Modify frontend to fetch API token and use it:

**Pros**:
- API code unchanged
- Consistent authentication model

**Cons**:
- Major frontend refactor required
- All fetch calls need Authorization header
- Need to manage token lifecycle
- Inconsistent with rest of M.O.S.S. (all other pages use session cookies)

---

## Recommendation

**Implement Option 1**: Remove `requireApiScope` from GET requests in reports API.

**Rationale**:
1. Consistent with existing M.O.S.S. patterns (devices, people, locations)
2. Fastest implementation (5 minutes)
3. Middleware already protects the routes
4. No breaking changes to frontend
5. Bearer tokens still required for POST/PATCH/DELETE (write operations)

**Files to modify**:
- `/src/app/api/reports/route.ts` - Remove `requireApiScope` from GET handler
- `/src/app/api/reports/[id]/route.ts` - Remove `requireApiScope` from GET handler
- `/src/app/api/dashboards/route.ts` - Remove `requireApiScope` from GET handler
- `/src/app/api/dashboards/[id]/route.ts` - Remove `requireApiScope` from GET handler

Keep `requireApiScope` for:
- POST /api/reports (creating reports)
- PATCH /api/reports/[id] (updating reports)
- DELETE /api/reports/[id] (deleting reports)
- POST /api/reports/execute (executing reports)
- Same for dashboards

---

## Next Steps for moss-engineer

1. **Remove `requireApiScope` from GET handlers** in:
   - `/src/app/api/reports/route.ts`
   - `/src/app/api/reports/[id]/route.ts`
   - `/src/app/api/dashboards/route.ts`
   - `/src/app/api/dashboards/[id]/route.ts`

2. **Add comment explaining web UI auth** (like devices API):
   ```typescript
   // Note: Web UI uses NextAuth session-based auth, not API tokens
   // API token auth can be added here if needed for external API access
   ```

3. **Keep `requireApiScope` for write operations**:
   - POST /api/reports
   - PATCH /api/reports/[id]
   - DELETE /api/reports/[id]
   - POST /api/reports/execute
   - Same for dashboards

4. **Test the fix**:
   - Start dev server
   - Navigate to /reports
   - Verify reports list loads
   - Verify no 401 errors

5. **Call moss-tester again** for Attempt 3 of 3

---

## Supporting Evidence

### Screenshot 1: Reports Page with Error
![Reports Error](/Users/admin/Dev/moss/.playwright-mcp/reports-page-401-error.png)

**Visible elements**:
- Page loads correctly (middleware working)
- Error message: "Error: Failed to fetch reports"
- Retry button visible
- No reports list displayed

### Network Request Log
```
[GET] http://localhost:3001/reports => [200] OK
[GET] http://localhost:3001/api/reports? => [401] Unauthorized  ❌ THIS IS THE PROBLEM
[GET] http://localhost:3001/api/auth/session => [200] OK  ✅ SESSION VALID
```

### Console Messages
```
[LOG] %c%s%c [DB] Creating new pool with DATABASE_URL: background: #e6e6e6;...
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) @ http://localhost:3001/api/reports?
[LOG] [Fast Refresh] rebuilding @ webpack-internal:///...
[LOG] [Fast Refresh] done in 198ms @ webpack-internal:///...
```

---

## Conclusion

**Test Attempt 2: FAILED**

The middleware fix successfully protects the pages, but the API authentication mismatch prevents the feature from working. The reports API requires bearer token authentication, but the web UI uses session cookies.

**Critical blocker identified**: API authentication architecture needs to be fixed before UAT can proceed.

**Recommended fix**: Remove `requireApiScope` from GET handlers (5 min implementation, consistent with existing patterns).

**Ready for**: moss-engineer to implement fix, then moss-tester Attempt 3.
