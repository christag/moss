/**
 * Rate Limiting Utilities
 * Protects authentication endpoints from brute force attacks
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store for rate limiting
// Note: In production with multiple instances, consider Redis
const store = new Map<string, RateLimitEntry>()

// Cleanup interval - remove expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) {
        store.delete(key)
      }
    }
  },
  5 * 60 * 1000
)

export interface RateLimitConfig {
  /**
   * Maximum number of attempts allowed
   * @default 5
   */
  maxAttempts?: number

  /**
   * Time window in milliseconds
   * @default 900000 (15 minutes)
   */
  windowMs?: number

  /**
   * Unique identifier for this request (typically IP address or email)
   */
  identifier: string
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean

  /**
   * Number of attempts made in current window
   */
  attempts: number

  /**
   * Maximum attempts allowed
   */
  limit: number

  /**
   * Remaining attempts
   */
  remaining: number

  /**
   * Unix timestamp (ms) when the rate limit resets
   */
  resetAt: number

  /**
   * Milliseconds until reset
   */
  retryAfter?: number
}

/**
 * Check rate limit for an identifier
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const maxAttempts = config.maxAttempts || 5
  const windowMs = config.windowMs || 15 * 60 * 1000 // 15 minutes
  const now = Date.now()

  let entry = store.get(config.identifier)

  // Create new entry if doesn't exist or has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    }
    store.set(config.identifier, entry)
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

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier)
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(identifier: string): RateLimitResult | null {
  const entry = store.get(identifier)
  if (!entry) {
    return null
  }

  const now = Date.now()
  if (entry.resetAt < now) {
    store.delete(identifier)
    return null
  }

  const maxAttempts = 5 // Default
  const remaining = Math.max(0, maxAttempts - entry.count)

  return {
    allowed: entry.count <= maxAttempts,
    attempts: entry.count,
    limit: maxAttempts,
    remaining,
    resetAt: entry.resetAt,
    retryAfter: entry.count > maxAttempts ? entry.resetAt - now : undefined,
  }
}

/**
 * Extract IP address from request headers
 */
export function getClientIP(headers: Headers): string {
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

  // Fallback - in development this might not be available
  return 'unknown'
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
