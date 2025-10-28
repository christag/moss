/**
 * Authentication & Security Middleware
 * - Protects routes that require authentication
 * - Handles first-run setup wizard
 * - Applies rate limiting to API endpoints
 *
 * Note: Middleware runs on Edge Runtime, so we can't use database connections.
 * We check for the presence of the session token cookie instead.
 * Setup check is done via a cookie set by the setup API.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, getClientIP } from './lib/rateLimitMiddleware'

// Routes that require authentication
const protectedRoutes = [
  '/',
  '/companies',
  '/locations',
  '/rooms',
  '/people',
  '/devices',
  '/networks',
  '/ios',
  '/ip-addresses',
  '/software',
  '/installed-applications',
  '/saas-services',
  '/software-licenses',
  '/documents',
  '/groups',
  '/contracts',
  '/external-documents',
  '/import',
  '/reports',
  '/dashboards',
]

// Routes that require admin role (admin or super_admin)
const adminRoutes = ['/admin']

// Routes that should redirect to home if already authenticated
const authRoutes = ['/login']

// Routes that should always be accessible (even during setup)
const publicRoutes = ['/setup', '/api/setup', '/api/health', '/login', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ============================================================================
  // 1. Rate Limiting (for API routes)
  // ============================================================================
  if (pathname.startsWith('/api/')) {
    // Exempt health checks and auth from rate limiting (auth has its own)
    const rateLimitExempt = ['/api/health', '/api/auth']
    const isExempt = rateLimitExempt.some((route) => pathname.startsWith(route))

    if (!isExempt) {
      const clientIP = getClientIP(request.headers)
      const rateLimitId = `api:${clientIP}:${pathname}`

      // Different limits for different types of requests
      const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
      const maxAttempts = isWriteOperation ? 50 : 200 // Stricter limits for write operations
      const windowMs = 60 * 1000 // 1 minute window

      const rateLimit = checkRateLimit({
        identifier: rateLimitId,
        maxAttempts,
        windowMs,
      })

      if (!rateLimit.allowed) {
        console.warn(
          `[API RATE LIMIT] Exceeded for ${request.method} ${pathname} from ${clientIP}. ` +
            `Attempts: ${rateLimit.attempts}/${rateLimit.limit}`
        )

        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
            details: {
              limit: rateLimit.limit,
              retryAfter: rateLimit.retryAfter,
              resetAt: new Date(rateLimit.resetAt).toISOString(),
            },
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimit.retryAfter || 0) / 1000).toString(),
              'X-RateLimit-Limit': rateLimit.limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimit.resetAt.toString(),
            },
          }
        )
      }

      // Add rate limit headers to response
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toString())

      // Continue processing other middleware checks
      // We'll handle the rest of the logic below
    }
  }

  // ============================================================================
  // 2. Public Routes
  // ============================================================================
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // ============================================================================
  // 3. Setup Wizard Check
  // ============================================================================
  // Check for setup bypass (for testing/development environments)
  // Can be set via environment variable or query parameter
  const skipSetup =
    process.env.SKIP_SETUP_WIZARD === 'true' || request.nextUrl.searchParams.has('skip_setup')

  // Check if setup is completed (via cookie or header)
  // The /api/setup endpoint sets a cookie when setup is complete
  const setupCompleted = request.cookies.get('moss-setup-completed')?.value === 'true'

  // If setup is not completed and not bypassed, redirect to setup wizard
  // Exception: allow API routes to work (they'll handle setup check internally if needed)
  if (!setupCompleted && !skipSetup && !pathname.startsWith('/api/')) {
    // Don't redirect if already on setup page
    if (!pathname.startsWith('/setup')) {
      return NextResponse.redirect(new URL('/setup', request.url))
    }
  }

  // Check if user has session token (NextAuth.js JWT)
  // NextAuth v5 uses either next-auth.session-token or __Secure-next-auth.session-token
  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value

  const isLoggedIn = !!sessionToken

  const isProtectedRoute = protectedRoutes.some((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  )
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.includes(pathname)

  // Redirect to login if accessing protected route while not logged in
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to login if accessing admin route while not logged in
  // Note: Role checking happens in the page component via auth() helper
  // because middleware runs on Edge Runtime and can't decode JWT easily
  if (isAdminRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to home if accessing login page while already logged in
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
