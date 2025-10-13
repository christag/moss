/**
 * OAuth 2.0 Authorization Server Metadata Endpoint
 * GET /.well-known/oauth-authorization-server
 *
 * RFC 8414: OAuth 2.0 Authorization Server Metadata
 */

import { NextRequest, NextResponse } from 'next/server'
import { withCORS, getProductionCORSConfig } from '@/lib/cors'
import type { AuthorizationServerMetadata } from '@/types/oauth'

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return withCORS(
    request,
    async () => new NextResponse(null, { status: 204 }),
    getProductionCORSConfig()
  )
}

export async function GET(request: NextRequest) {
  return withCORS(request, async () => handleMetadataRequest(), getProductionCORSConfig())
}

async function handleMetadataRequest() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

  const metadata: AuthorizationServerMetadata = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,
    revocation_endpoint: `${baseUrl}/api/oauth/revoke`,
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token', 'client_credentials'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['mcp:read', 'mcp:tools', 'mcp:resources', 'mcp:prompts', 'mcp:write'],
    service_documentation: `${baseUrl}/docs/mcp`,
  }

  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}
