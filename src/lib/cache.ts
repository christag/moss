/**
 * Simple in-memory cache for API responses
 *
 * This provides basic caching to reduce database load for frequently
 * accessed data that doesn't change often. Uses LRU (Least Recently Used)
 * eviction when cache is full.
 *
 * Usage:
 * ```typescript
 * const cached = cache.get('companies:list:page=1');
 * if (cached) return cached;
 *
 * const data = await fetchFromDatabase();
 * cache.set('companies:list:page=1', data, 60); // Cache for 60 seconds
 * ```
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
  lastAccessed: number
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>>
  private maxSize: number
  private defaultTTL: number // seconds

  constructor(maxSize = 1000, defaultTTL = 60) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  /**
   * Get a value from the cache
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // Update last accessed time for LRU
    entry.lastAccessed = Date.now()
    return entry.value
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Enforce max size with LRU eviction
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    const expiresAt = Date.now() + (ttl || this.defaultTTL) * 1000

    this.cache.set(key, {
      value,
      expiresAt,
      lastAccessed: Date.now(),
    })
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Invalidate all keys matching a pattern
   * Pattern can use wildcards: 'companies:*' or '*:list'
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  /**
   * Get cache statistics
   */
  stats(): {
    size: number
    maxSize: number
    hitRate: number
    keys: string[]
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need hit/miss tracking for this
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Remove expired entries (can be run periodically)
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key))
  }
}

// Create singleton instance
// In production, this would be replaced with Redis or similar
export const cache = new MemoryCache(1000, 60)

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  // Only on server-side
  setInterval(
    () => {
      cache.cleanup()
    },
    5 * 60 * 1000
  )
}

/**
 * Helper to generate cache keys for list endpoints
 */
export function generateListCacheKey(
  resource: string,
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const sortedParams = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  return `${resource}:list:${sortedParams}`
}

/**
 * Helper to generate cache keys for detail endpoints
 */
export function generateDetailCacheKey(resource: string, id: string): string {
  return `${resource}:detail:${id}`
}

/**
 * Wrapper function to cache async function results
 */
export async function withCache<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
  // Check cache first
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute function and cache result
  const result = await fn()
  cache.set(key, result, ttl)
  return result
}
