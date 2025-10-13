/**
 * OAuth 2.0 Resource Server Metadata Endpoint
 * GET /.well-known/oauth-protected-resource
 *
 * RFC 9728: OAuth 2.0 Resource Server Metadata
 */

import { NextRequest, NextResponse } from 'next/server'
import { withCORS, getProductionCORSConfig } from '@/lib/cors'
import type { ResourceServerMetadata } from '@/types/oauth'

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return withCORS(
    request,
    async () => new NextResponse(null, { status: 204 }),
    getProductionCORSConfig()
  )
}

export async function GET(request: NextRequest) {
  return withCORS(request, async () => handleResourceMetadataRequest(), getProductionCORSConfig())
}

async function handleResourceMetadataRequest() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

  const metadata: ResourceServerMetadata = {
    resource: baseUrl,
    authorization_servers: [baseUrl], // Same server acts as both authorization and resource server
    scopes_supported: ['mcp:read', 'mcp:tools', 'mcp:resources', 'mcp:prompts', 'mcp:write'],
    bearer_methods_supported: ['header'], // Authorization: Bearer <token>
    resource_documentation: `${baseUrl}/docs/mcp`,
  }

  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}
