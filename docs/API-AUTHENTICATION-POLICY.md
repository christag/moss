# M.O.S.S. API Authentication Policy

## Overview

This document defines the authentication architecture for M.O.S.S. API endpoints and explains the design decisions behind the current implementation.

## Current Architecture

### UI Routes

**Protected**: YES
**Authentication Method**: NextAuth.js v5 session-based authentication
**Middleware**: `/src/middleware.ts`

All UI routes (pages) require an active session. Unauthenticated users are redirected to `/login` with a callback URL.

**Example**:
```
GET /devices → Redirect to /login?callbackUrl=/devices (if not authenticated)
GET /people → Render page (if authenticated)
```

### API Routes

**Protected**: NO (intentional design decision)
**Authentication Method**: None required (public endpoints)
**Middleware**: API routes bypass middleware authentication checks

API endpoints are publicly accessible without authentication. This is a deliberate architectural choice.

**Example**:
```
GET /api/devices → Returns device list (no auth required)
POST /api/companies → Creates company (no auth required)
```

## Design Rationale

### Why API Routes Are Public

1. **API-First Architecture**
   - M.O.S.S. is designed as an API-first platform
   - Frontend is a consumer of the API, not the API itself
   - This enables external integrations, mobile apps, and scripts

2. **Flexible Authentication**
   - Different clients may use different auth methods
   - Web app uses session cookies
   - CLI tools may use API tokens (future)
   - Integrations may use OAuth2 (future)

3. **Separation of Concerns**
   - UI authentication (NextAuth sessions) is separate from API authentication
   - API can be consumed independently of the web interface
   - Enables headless deployments

4. **Development Flexibility**
   - Easier testing and debugging during development
   - Scripts and automation tools can interact with API directly
   - No CORS complications for local development

## Security Considerations

### Current State (Development/MVP)

⚠️ **Security Warning**: The current implementation is suitable for:
- Development environments
- Internal networks (behind firewall)
- Single-user deployments
- Trusted user bases

❌ **NOT suitable for**:
- Public internet exposure
- Multi-tenant deployments
- Untrusted networks
- Production environments with sensitive data

### Implemented Security Measures

1. **Rate Limiting on Authentication**
   - Login endpoints have rate limiting (5 attempts per 15 minutes)
   - Prevents brute force attacks on user accounts
   - File: `/src/app/api/auth/[...nextauth]/route.ts`

2. **Input Validation**
   - All API endpoints validate input with Zod schemas
   - SQL injection prevention via parameterized queries
   - XSS protection via React's built-in escaping

3. **CSRF Protection**
   - NextAuth handles CSRF tokens for session-based requests
   - POST/PUT/DELETE operations from UI are CSRF-protected

## Production Deployment Options

For production deployments, consider implementing one of these authentication strategies:

### Option A: API Token Authentication (Recommended)

**Implementation**:
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  // Check for API token in header
  const apiToken = request.headers.get('X-API-Token')

  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!apiToken || !isValidToken(apiToken)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  // Continue with existing session check for UI routes
  // ...
}
```

**Pros**:
- Simple to implement
- Works with any HTTP client
- Can scope tokens to specific permissions
- Easy to revoke compromised tokens

**Cons**:
- Token management overhead
- Need secure token storage on clients
- Tokens can be leaked if not properly secured

### Option B: Session-Based API Authentication

**Implementation**:
```typescript
// Require session for all API routes
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }
  // ...
}
```

**Pros**:
- Reuses existing NextAuth infrastructure
- No additional token management
- Familiar cookie-based auth

**Cons**:
- Harder to use from non-browser clients
- CORS complications for external integrations
- Session cookies don't work well for CLI tools

### Option C: OAuth2 / JWT

**Implementation**: Use NextAuth with JWT strategy + API route middleware

**Pros**:
- Industry standard
- Works with external identity providers
- Stateless (no session store needed)

**Cons**:
- More complex implementation
- Token refresh logic needed
- Larger tokens (more bandwidth)

### Option D: Hybrid Approach (Recommended for Production)

Combine session auth for UI and API tokens for programmatic access:

```typescript
// Check for API token OR session
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const apiToken = request.headers.get('X-API-Token')
    const session = await auth()

    if (!apiToken && !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (apiToken && !isValidToken(apiToken)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  }
  // ...
}
```

## Migration Path

### Phase 1: Development (Current)
- ✅ Public API endpoints
- ✅ Rate-limited authentication
- ✅ Input validation

### Phase 2: Internal Deployment
- ⚠️ Add network-level protection (firewall/VPN)
- ⚠️ Consider basic API key authentication
- ⚠️ Implement audit logging

### Phase 3: Production
- ✅ Implement API token authentication (Option A or D)
- ✅ Add role-based access control (RBAC)
- ✅ Enable HTTPS/TLS
- ✅ Implement token rotation
- ✅ Add API rate limiting per token/user

## Admin Configuration

Future versions will include admin panel settings for:
- Toggle between public/protected API mode
- Configure API token requirements
- Set token expiration policies
- Define rate limits per endpoint

## Testing Authentication

### Testing UI Routes
```bash
# Without session → redirect to login
curl -i http://localhost:3001/devices
# Expected: 307 redirect to /login

# With session → renders page
# (Use browser or set cookies manually)
```

### Testing API Routes
```bash
# Current behavior → works without auth
curl -i http://localhost:3001/api/devices
# Expected: 200 OK with device list

# Future with auth → requires token
curl -H "X-API-Token: your-token-here" http://localhost:3001/api/devices
# Expected: 200 OK with device list
```

## Frequently Asked Questions

**Q: Is it safe to deploy M.O.S.S. to the internet without API authentication?**
A: No. The current implementation is for development/internal use only. Implement API token authentication before internet exposure.

**Q: Can I use M.O.S.S. on an internal network without API auth?**
A: Yes, if the network is trusted and access is restricted (e.g., corporate VPN, internal VLAN).

**Q: Will adding API authentication break existing integrations?**
A: Yes. Any scripts or tools using the API will need to be updated to include authentication tokens.

**Q: How do I add a new API token for a user?**
A: This feature is not yet implemented. See "Option A" above for implementation guidance.

**Q: Can I use SAML/LDAP/AD for API authentication?**
A: Yes, via NextAuth providers. However, API tokens are recommended for programmatic access rather than interactive login.

## References

- NextAuth.js documentation: https://next-auth.js.org
- OWASP API Security: https://owasp.org/www-project-api-security/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- M.O.S.S. Rate Limiting: `/src/lib/rateLimit.ts`
- M.O.S.S. Authentication: `/src/lib/auth.ts`
