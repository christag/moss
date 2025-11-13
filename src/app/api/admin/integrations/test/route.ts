/**
 * API Route: Test Integration Connection
 * POST - Test connection to integration provider before saving
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasRole } from '@/lib/auth'
import { logAdminAction, getIPAddress, getUserAgent } from '@/lib/adminAuth'
import { parseRequestBody } from '@/lib/api'
import { z } from 'zod'
import { OktaClient } from '@/lib/integrations/okta-client'
import { JamfClient } from '@/lib/integrations/jamf-client'
import type { OktaConfig, JamfConfig } from '@/types/integrations'

const TestIntegrationSchema = z.object({
  integration_type: z.enum(['okta', 'jamf']),
  config: z.record(z.unknown()),
  credentials: z.record(z.unknown()),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = hasRole(session.user.role, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const validationResult = TestIntegrationSchema.safeParse(parseResult.data)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { integration_type, config, credentials } = validationResult.data

    // Test connection based on integration type
    let testResult: { success: boolean; message: string; details?: unknown }

    if (integration_type === 'okta') {
      // Validate Okta config structure
      if (!config.domain || !config.auth_method) {
        return NextResponse.json(
          { error: 'Invalid Okta config: missing domain or auth_method' },
          { status: 400 }
        )
      }
      testResult = await testOktaConnection(config as unknown as OktaConfig, credentials)
    } else if (integration_type === 'jamf') {
      // Validate Jamf config structure
      if (!config.base_url) {
        return NextResponse.json(
          { error: 'Invalid Jamf config: missing base_url' },
          { status: 400 }
        )
      }
      testResult = await testJamfConnection(config as unknown as JamfConfig, credentials)
    } else {
      return NextResponse.json({ error: 'Unsupported integration type' }, { status: 400 })
    }

    // Log the test attempt
    await logAdminAction({
      user_id: session.user.id,
      action: 'test_integration',
      category: 'integrations',
      target_type: 'integration',
      target_id: undefined,
      details: {
        integration_type,
        success: testResult.success,
        message: testResult.message,
      },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    })

    return NextResponse.json(testResult)
  } catch (error) {
    console.error('Error testing integration:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test integration connection',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * Test Okta connection
 */
async function testOktaConnection(
  config: OktaConfig,
  credentials: Record<string, unknown>
): Promise<{ success: boolean; message: string; details?: unknown }> {
  try {
    // Validate required config fields
    if (!config.domain) {
      return {
        success: false,
        message: 'Okta domain is required',
      }
    }

    // Validate credentials based on auth method
    if (config.auth_method === 'oauth') {
      if (!credentials.okta_client_id || !credentials.okta_client_secret) {
        return {
          success: false,
          message: 'OAuth Client ID and Client Secret are required for OAuth authentication',
        }
      }
    } else if (config.auth_method === 'api_token') {
      if (!credentials.okta_api_token) {
        return {
          success: false,
          message: 'API Token is required for API Token authentication',
        }
      }
    } else {
      return {
        success: false,
        message: 'Invalid authentication method',
      }
    }

    // Create Okta client (pass config and credentials separately)
    const client = new OktaClient(config, {
      okta_api_token: credentials.okta_api_token as string | undefined,
      okta_client_id: credentials.okta_client_id as string | undefined,
      okta_client_secret: credentials.okta_client_secret as string | undefined,
    })

    // Test connection
    const result = await client.testConnection()

    if (result.success) {
      return {
        success: true,
        message: `Successfully connected to Okta at ${config.domain}`,
        details: {
          auth_method: config.auth_method,
          api_version: config.api_version || 'v1',
        },
      }
    } else {
      return {
        success: false,
        message: result.message || 'Failed to connect to Okta',
      }
    }
  } catch (error) {
    console.error('Okta connection test error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Test Jamf connection
 */
async function testJamfConnection(
  config: JamfConfig,
  credentials: Record<string, unknown>
): Promise<{ success: boolean; message: string; details?: unknown }> {
  try {
    // Validate required config fields
    if (!config.base_url) {
      return {
        success: false,
        message: 'Jamf base URL is required',
      }
    }

    // Validate credentials
    if (!credentials.jamf_client_id || !credentials.jamf_client_secret) {
      return {
        success: false,
        message: 'Jamf Client ID and Client Secret are required',
      }
    }

    // Create Jamf client (pass config and credentials separately)
    const client = new JamfClient({
      config: {
        base_url: config.base_url,
        api_version: config.api_version || 'v1',
        timeout_seconds: (config.timeout_ms || 30000) / 1000, // Convert ms to seconds
      },
      credentials: {
        username: credentials.jamf_client_id as string, // OAuth client ID as username
        password: credentials.jamf_client_secret as string, // OAuth client secret as password
      },
    })

    // Test connection
    const result = await client.testConnection()

    if (result.success) {
      return {
        success: true,
        message: `Successfully connected to Jamf at ${config.base_url}`,
        details: {
          api_version: config.api_version || 'v1',
        },
      }
    } else {
      return {
        success: false,
        message: result.message || 'Failed to connect to Jamf',
      }
    }
  } catch (error) {
    console.error('Jamf connection test error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
