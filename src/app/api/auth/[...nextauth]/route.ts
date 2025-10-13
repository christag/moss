/**
 * NextAuth.js API Route Handler with Rate Limiting
 * Handles all authentication requests with brute force protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { handlers } from '@/lib/auth'
import {
  checkRateLimit,
  resetRateLimit,
  getClientIP,
  createRateLimitIdentifier,
} from '@/lib/rateLimit'

// GET requests (session checks, etc.) don't need rate limiting
export const GET = handlers.GET

// Wrap POST handler with rate limiting for login attempts
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const params = await context.params
  const action = params.nextauth?.[0]
  const provider = params.nextauth?.[1]

  // Only apply rate limiting to credentials sign-in attempts
  if (action === 'callback' && provider === 'credentials') {
    const clientIP = getClientIP(request.headers)

    // Try to extract email from request body for more targeted rate limiting
    let email: string | undefined
    try {
      const body = await request.clone().json()
      email = body.email || body.username
    } catch {
      // If we can't parse body, just use IP-based rate limiting
    }

    const rateLimitId = createRateLimitIdentifier(clientIP, email)
    const rateLimit = checkRateLimit({
      identifier: rateLimitId,
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    })

    if (!rateLimit.allowed) {
      console.warn(
        `[AUTH] Rate limit exceeded${email ? ` for ${email}` : ''} from ${clientIP}. ` +
          `Attempts: ${rateLimit.attempts}/${rateLimit.limit}. ` +
          `Retry after: ${Math.ceil((rateLimit.retryAfter || 0) / 1000)}s`
      )

      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          details: {
            attempts: rateLimit.attempts,
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

    // Add rate limit headers to successful response
    const response = await handlers.POST(request)

    // Check if login was successful (2xx status) to reset rate limit
    if (response.status >= 200 && response.status < 300) {
      resetRateLimit(rateLimitId)
      console.log(
        `[AUTH] Successful login${email ? ` for ${email}` : ''} from ${clientIP}, rate limit reset`
      )
    }

    // Add rate limit headers to response
    const headers = new Headers(response.headers)
    headers.set('X-RateLimit-Limit', rateLimit.limit.toString())
    headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    headers.set('X-RateLimit-Reset', rateLimit.resetAt.toString())

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }

  // For all other requests (non-login), pass through without rate limiting
  return handlers.POST(request)
}
