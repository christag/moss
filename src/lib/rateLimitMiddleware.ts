/**
 * Consolidated Rate Limiting Library
 * Provides rate limiting for both middleware and API routes
 * Supports flexible identifier-based limiting and pre-configured endpoint types
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate limit configuration for different endpoint types
 */
export const RATE_LIMITS = {
  // Authentication endpoints - very strict to prevent brute force
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },

  // API endpoints - moderate limits for normal API usage
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many API requests. Please try again after 15 minutes.',
  },

  // Public endpoints - higher limits for general access
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: 'Too many requests. Please try again after 15 minutes.',
  },

  // Admin endpoints - strict limits for sensitive operations
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per window
    message: 'Too many admin requests. Please try again after 15 minutes.',
  },
} as const

/**
 * In-memory store for rate limiting
 * Note: In production with multiple instances, use Redis store:
 * import RedisStore from 'rate-limit-redis'
 * import { createClient } from 'redis'
 *
 * const client = createClient({ url: process.env.REDIS_URL })
 * const store = new RedisStore({ client })
 */
interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    Object.keys(store).forEach((key) => {
      if (store[key].resetAt < now) {
        delete store[key]
      }
    })
  },
  5 * 60 * 1000
)

/**
 * Custom rate limiter for Next.js API routes
 * Compatible with Next.js 15 and App Router
 */
export function createRateLimiter(config: { windowMs: number; max: number; message: string }) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Extract client identifier (IP address)
    const ip = getClientIP(request)
    const key = `${ip}:${request.nextUrl.pathname}`

    const now = Date.now()

    // Initialize or reset if expired
    if (!store[key] || store[key].resetAt < now) {
      store[key] = {
        count: 0,
        resetAt: now + config.windowMs,
      }
    }

    // Increment request count
    store[key].count++

    // Calculate remaining requests
    const remaining = Math.max(0, config.max - store[key].count)
    const resetAt = store[key].resetAt
    const retryAfter = Math.ceil((resetAt - now) / 1000) // seconds

    // Check if limit exceeded
    if (store[key].count > config.max) {
      return NextResponse.json(
        {
          success: false,
          message: config.message,
          error: 'Rate limit exceeded',
          retryAfter: retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetAt.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }

    // Add rate limit headers to response (will be added by middleware)
    // Store these in request for later use
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(request as any).rateLimitHeaders = {
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetAt.toString(),
    }

    return null // Allow request to proceed
  }
}

/**
 * Extract client IP address from request
 * Works with NextRequest or Headers object
 */
export function getClientIP(requestOrHeaders: NextRequest | Headers): string {
  const headers = requestOrHeaders instanceof Headers ? requestOrHeaders : requestOrHeaders.headers

  // Check common headers set by proxies/load balancers
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can be comma-separated list, take the first IP
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Cloudflare
  const cfConnectingIP = headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback - use a consistent identifier for development
  return 'dev-client'
}

/**
 * Pre-configured rate limiters for different endpoint types
 */
export const rateLimiters = {
  auth: createRateLimiter(RATE_LIMITS.auth),
  api: createRateLimiter(RATE_LIMITS.api),
  public: createRateLimiter(RATE_LIMITS.public),
  admin: createRateLimiter(RATE_LIMITS.admin),
}

/**
 * Helper to apply rate limiter in API route
 * Usage in API route:
 *
 * export async function GET(request: NextRequest) {
 *   const rateLimitResult = await applyRateLimit(request, 'api')
 *   if (rateLimitResult) return rateLimitResult
 *
 *   // ... rest of your handler
 *   // Then add rate limit headers to your response:
 *   return addRateLimitHeaders(yourResponse, request)
 * }
 */
export async function applyRateLimit(
  request: NextRequest,
  type: 'auth' | 'api' | 'public' | 'admin'
): Promise<NextResponse | null> {
  return rateLimiters[type](request)
}

/**
 * Add rate limit headers to a response
 * Call this helper to attach rate limit headers stored in the request
 */
export function addRateLimitHeaders(response: NextResponse, request: NextRequest): NextResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headers = (request as any).rateLimitHeaders
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value as string)
    })
  }
  return response
}

/**
 * Reset rate limit for a specific identifier or IP+path combination
 * @param ipOrIdentifier - Either a composite identifier (e.g., "ip:email") or just an IP address
 * @param path - Optional path when using separate IP and path parameters
 */
export function resetRateLimit(ipOrIdentifier: string, path?: string): void {
  const key = path ? `${ipOrIdentifier}:${path}` : ipOrIdentifier
  delete store[key]
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  ip: string,
  path: string,
  config: { windowMs: number; max: number }
): {
  remaining: number
  resetAt: number
  blocked: boolean
} | null {
  const key = `${ip}:${path}`
  const entry = store[key]

  if (!entry) {
    return {
      remaining: config.max,
      resetAt: Date.now() + config.windowMs,
      blocked: false,
    }
  }

  const now = Date.now()
  if (entry.resetAt < now) {
    delete store[key]
    return {
      remaining: config.max,
      resetAt: now + config.windowMs,
      blocked: false,
    }
  }

  const remaining = Math.max(0, config.max - entry.count)
  const blocked = entry.count >= config.max

  return {
    remaining,
    resetAt: entry.resetAt,
    blocked,
  }
}

/**
 * Create a rate limit identifier combining IP and email
 * This prevents both IP-based and email-based brute force attacks
 */
export function createRateLimitIdentifier(ip: string, email?: string): string {
  if (email) {
    return `${ip}:${email.toLowerCase()}`
  }
  return ip
}

/**
 * Flexible rate limit checking (useful for middleware and custom scenarios)
 * Returns detailed rate limit status
 */
export interface RateLimitConfig {
  identifier: string
  maxAttempts?: number
  windowMs?: number
}

export interface RateLimitResult {
  allowed: boolean
  attempts: number
  limit: number
  remaining: number
  resetAt: number
  retryAfter?: number
}

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const maxAttempts = config.maxAttempts || 5
  const windowMs = config.windowMs || 15 * 60 * 1000 // 15 minutes
  const now = Date.now()

  let entry = store[config.identifier]

  // Create new entry if doesn't exist or has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    }
    store[config.identifier] = entry
  }

  // Increment attempt count
  entry.count++

  const remaining = Math.max(0, maxAttempts - entry.count)
  const allowed = entry.count <= maxAttempts

  return {
    allowed,
    attempts: entry.count,
    limit: maxAttempts,
    remaining,
    resetAt: entry.resetAt,
    retryAfter: allowed ? undefined : entry.resetAt - now,
  }
}
