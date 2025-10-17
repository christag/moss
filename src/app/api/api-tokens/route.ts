/**
 * API Token Management Routes
 *
 * GET /api/api-tokens - List user's API tokens
 * POST /api/api-tokens - Create new API token
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateApiToken, listUserApiTokens, listAllApiTokens } from '@/lib/apiAuth'
import { z } from 'zod'

// Validation schema for creating tokens
const createTokenSchema = z.object({
  tokenName: z.string().min(1, 'Token name is required').max(255, 'Token name too long'),
  scopes: z
    .array(z.enum(['read', 'write', 'admin']))
    .min(1, 'At least one scope required')
    .default(['read']),
  expiresInDays: z.number().int().positive().optional(),
})

/**
 * GET /api/api-tokens
 * List user's API tokens (or all tokens if admin)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    // Admins can view all tokens with ?all=true
    if (showAll && ['admin', 'super_admin'].includes(session.user.role)) {
      const isActive = searchParams.get('active')
      const userId = searchParams.get('userId')

      const tokens = await listAllApiTokens({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        userId: userId || undefined,
      })

      return NextResponse.json({
        success: true,
        tokens,
        count: tokens.length,
      })
    }

    // Regular users see only their own tokens
    const tokens = await listUserApiTokens(session.user.id)

    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length,
    })
  } catch (error) {
    console.error('Error listing API tokens:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to list API tokens',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/api-tokens
 * Create a new API token
 *
 * Body:
 * {
 *   "tokenName": "Production Server",
 *   "scopes": ["read", "write"],
 *   "expiresInDays": 90  // optional
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "token": "moss_abc123...",  // ONLY SHOWN ONCE!
 *   "tokenId": "uuid",
 *   "tokenPrefix": "moss_abc12",
 *   "createdAt": "2025-10-16T..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validation = createTokenSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { tokenName, scopes, expiresInDays } = validation.data

    // Only admins can create tokens with 'admin' scope
    if (scopes.includes('admin') && !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only admins can create tokens with admin scope',
        },
        { status: 403 }
      )
    }

    // Calculate expiration date if provided
    let expiresAt: Date | null = null
    if (expiresInDays) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    }

    // Generate the token
    const result = await generateApiToken(session.user.id, tokenName, scopes, expiresAt)

    return NextResponse.json({
      success: true,
      message: 'API token created successfully',
      token: result.token, // IMPORTANT: Only returned once!
      tokenId: result.tokenId,
      tokenPrefix: result.tokenPrefix,
      createdAt: result.createdAt,
      expiresAt,
      scopes,
      warning: 'This token will only be shown once. Please copy it to a secure location.',
    })
  } catch (error) {
    console.error('Error creating API token:', error)

    // Check for duplicate token name
    if (error instanceof Error && error.message.includes('unique_user_token_name')) {
      return NextResponse.json(
        {
          success: false,
          message: 'You already have a token with this name',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create API token',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
