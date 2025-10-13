/**
 * CORS Utility for MCP and OAuth Endpoints
 *
 * Handles Cross-Origin Resource Sharing for:
 * - OAuth 2.1 endpoints (authorize, token, revoke)
 * - MCP endpoint (protocol communication)
 * - OAuth discovery endpoints (RFC 8414, RFC 9728)
 */

import { NextRequest, NextResponse } from 'next/server'

export interface CORSConfig {
  allowedOrigins?: string[] | '*'
  allowedMethods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  maxAge?: number
  credentials?: boolean
}

const DEFAULT_CORS_CONFIG: CORSConfig = {
  allowedOrigins: '*', // In production, specify exact origins
  allowedMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400, // 24 hours
  credentials: true,
}

/**
 * Apply CORS headers to a NextResponse
 */
export function applyCORSHeaders(
  response: NextResponse,
  request: NextRequest,
  config: CORSConfig = {}
): NextResponse {
  const mergedConfig = { ...DEFAULT_CORS_CONFIG, ...config }
  const origin = request.headers.get('origin')

  // Determine allowed origin
  let allowedOrigin = '*'
  if (mergedConfig.allowedOrigins !== '*' && origin) {
    if (mergedConfig.allowedOrigins?.includes(origin)) {
      allowedOrigin = origin
    } else {
      // Origin not allowed, but still set some headers for transparency
      allowedOrigin = mergedConfig.allowedOrigins?.[0] || '*'
    }
  } else if (origin) {
    allowedOrigin = origin
  }

  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)

  if (mergedConfig.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  if (mergedConfig.allowedMethods) {
    response.headers.set('Access-Control-Allow-Methods', mergedConfig.allowedMethods.join(', '))
  }

  if (mergedConfig.allowedHeaders) {
    response.headers.set('Access-Control-Allow-Headers', mergedConfig.allowedHeaders.join(', '))
  }

  if (mergedConfig.exposedHeaders) {
    response.headers.set('Access-Control-Expose-Headers', mergedConfig.exposedHeaders.join(', '))
  }

  if (mergedConfig.maxAge) {
    response.headers.set('Access-Control-Max-Age', mergedConfig.maxAge.toString())
  }

  return response
}

/**
 * Handle CORS preflight (OPTIONS) requests
 */
export function handleCORSPreflight(request: NextRequest, config: CORSConfig = {}): NextResponse {
  const response = new NextResponse(null, { status: 204 })
  return applyCORSHeaders(response, request, config)
}

/**
 * Wrapper for API routes to handle CORS automatically
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withCORS(request, async () => {
 *     // Your API logic here
 *     return NextResponse.json({ data: 'example' })
 *   })
 * }
 * ```
 */
export async function withCORS(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  config: CORSConfig = {}
): Promise<NextResponse> {
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return handleCORSPreflight(request, config)
  }

  // Execute handler and apply CORS headers
  const response = await handler()
  return applyCORSHeaders(response, request, config)
}

/**
 * Production CORS config for OAuth/MCP endpoints
 *
 * In production, set ALLOWED_ORIGINS environment variable:
 * ALLOWED_ORIGINS=https://app.example.com,https://claude.ai
 */
export function getProductionCORSConfig(): CORSConfig {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS

  let allowedOrigins: string[] | '*' = '*'
  if (allowedOriginsEnv) {
    allowedOrigins = allowedOriginsEnv.split(',').map((origin) => origin.trim())
  }

  return {
    ...DEFAULT_CORS_CONFIG,
    allowedOrigins,
    credentials: true, // Required for OAuth with cookies
  }
}
