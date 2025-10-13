/**
 * MCP (Model Context Protocol) API Endpoint
 * POST /api/mcp
 *
 * Handles all MCP protocol messages with OAuth 2.1 authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { validateMCPAuth } from '@/lib/mcp/auth'
import { initializeMCPServer } from '@/lib/mcp/server'
import { getPool } from '@/lib/db'
import { withCORS, getProductionCORSConfig } from '@/lib/cors'

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return withCORS(
    request,
    async () => new NextResponse(null, { status: 204 }),
    getProductionCORSConfig()
  )
}

export async function POST(request: NextRequest) {
  return withCORS(request, async () => handleMCPRequest(request), getProductionCORSConfig())
}

async function handleMCPRequest(request: NextRequest) {
  const startTime = Date.now()
  const pool = getPool()

  try {
    // Validate OAuth token
    const authHeader = request.headers.get('authorization')
    let authContext

    try {
      authContext = await validateMCPAuth(authHeader)
    } catch (error) {
      const err = error as Error
      return NextResponse.json(
        {
          error: 'unauthorized',
          error_description: err.message,
        },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="MCP Server", error="invalid_token"',
          },
        }
      )
    }

    // Initialize MCP server with user's auth context
    const server = await initializeMCPServer(authContext)

    // Get request body
    const body = await request.json()

    // Extract operation details for audit logging
    const operationType = body.method?.includes('tools/')
      ? 'tool_call'
      : body.method?.includes('resources/')
        ? 'resource_read'
        : body.method?.includes('prompts/')
          ? 'prompt_get'
          : 'other'
    const operationName = body.params?.name || body.params?.uri || body.method || 'unknown'

    // Create transport and handle request
    const transport = new StreamableHTTPServerTransport('/api/mcp', async () => {
      // Handle close
    })

    // Connect server to transport
    await server.connect(transport)

    let result
    let success = true
    let errorMessage: string | null = null

    try {
      // Process MCP request
      result = await transport.handleRequest(body)
    } catch (error) {
      success = false
      errorMessage = (error as Error).message
      throw error
    } finally {
      // Log to audit table
      const executionTime = Date.now() - startTime

      await pool.query(
        `INSERT INTO mcp_audit_log
         (client_id, user_id, operation_type, operation_name, input_params, success, error_message, execution_time_ms, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          await getClientIdFromAuth(authContext.clientId),
          authContext.userId,
          operationType,
          operationName,
          body.params || {},
          success,
          errorMessage,
          executionTime,
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          request.headers.get('user-agent') || 'unknown',
        ]
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[MCP API] Error:', error)

    return NextResponse.json(
      {
        error: 'server_error',
        error_description: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * Get OAuth client database ID from client_id string
 */
async function getClientIdFromAuth(clientId: string): Promise<string> {
  const pool = getPool()
  const result = await pool.query('SELECT id FROM oauth_clients WHERE client_id = $1', [clientId])
  return result.rows[0]?.id || ''
}
