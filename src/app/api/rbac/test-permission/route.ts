/**
 * Permission Testing API
 * Debugging tool for testing permission checks
 */
import { NextRequest, NextResponse } from 'next/server'
import { checkPermission } from '@/lib/rbac'
import { requireRole } from '@/lib/auth'
import { parseRequestBody } from '@/lib/api'
import { z } from 'zod'

// Request schema
const TestPermissionSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  action: z.enum(['view', 'edit', 'delete', 'manage_permissions']),
  object_type: z.enum([
    'company',
    'location',
    'room',
    'person',
    'device',
    'io',
    'ip_address',
    'network',
    'software',
    'saas_service',
    'installed_application',
    'software_license',
    'document',
    'external_document',
    'contract',
    'group',
  ]),
  object_id: z.string().uuid('Invalid object ID').nullable().optional(),
})

/**
 * POST /api/rbac/test-permission
 * Test if a user has a specific permission
 * Returns detailed information about the permission check for debugging
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role to use this testing tool
    await requireRole('admin')

    // Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = TestPermissionSchema.parse(body)

    // Perform permission check
    const result = await checkPermission(
      validated.user_id,
      validated.action,
      validated.object_type,
      validated.object_id || undefined
    )

    // Return detailed results
    return NextResponse.json({
      success: true,
      data: {
        granted: result.granted,
        reason: result.reason,
        path: result.path,
        test_parameters: {
          user_id: validated.user_id,
          action: validated.action,
          object_type: validated.object_type,
          object_id: validated.object_id || null,
        },
      },
    })
  } catch (error) {
    console.error('Error testing permission:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to test permission' },
      { status: 500 }
    )
  }
}
