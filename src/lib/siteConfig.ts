/**
 * Site Configuration Helper
 * Provides centralized access to site URL configuration
 * Priority: Environment variable > Database setting > Fallback
 */

import { getPool } from './db'

let cachedSiteUrl: string | null = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get the configured site URL (FQDN with protocol)
 * Priority:
 * 1. NEXTAUTH_URL environment variable (for NextAuth compatibility)
 * 2. NEXT_PUBLIC_SITE_URL environment variable
 * 3. Database system_settings (general.site_url)
 * 4. Fallback to localhost:3000
 */
export async function getSiteUrl(): Promise<string> {
  // Check environment variables first (highest priority)
  const envUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl) {
    return envUrl
  }

  // Check cache
  const now = Date.now()
  if (cachedSiteUrl && now - cacheTime < CACHE_TTL) {
    return cachedSiteUrl
  }

  // Fetch from database
  try {
    const pool = getPool()
    const result = await pool.query(
      "SELECT value FROM system_settings WHERE key = 'general.site_url'"
    )

    if (result.rows.length > 0) {
      // Parse JSONB value (stored as string with quotes)
      const siteUrl = JSON.parse(result.rows[0].value)
      cachedSiteUrl = siteUrl
      cacheTime = now
      return siteUrl
    }
  } catch (error) {
    console.warn('[SITE_CONFIG] Failed to fetch site URL from database:', error)
  }

  // Fallback to localhost
  return 'http://localhost:3000'
}

/**
 * Get site URL synchronously from environment variables only
 * Use this in client-side code or when you can't await
 */
export function getSiteUrlSync(): string {
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

/**
 * Clear the site URL cache (call after updating database setting)
 */
export function clearSiteUrlCache(): void {
  cachedSiteUrl = null
  cacheTime = 0
}
