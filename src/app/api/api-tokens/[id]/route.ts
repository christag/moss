/**
 * API Token Management - Individual Token Routes
 *
 * DELETE /api/api-tokens/[id] - Revoke an API token
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revokeApiToken, revokeApiTokenAdmin } from '@/lib/apiAuth'

/**
 * DELETE /api/api-tokens/[id]
 * Revoke (deactivate) an API token
 *
 * Users can only revoke their own tokens.
 * Admins can revoke any token.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const tokenId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(tokenId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid token ID format' },
        { status: 400 }
      )
    }

    // Admins can revoke any token
    const isAdmin = ['admin', 'super_admin'].includes(session.user.role)

    let success: boolean
    if (isAdmin) {
      success = await revokeApiTokenAdmin(tokenId)
    } else {
      success = await revokeApiToken(tokenId, session.user.id)
    }

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: isAdmin
            ? 'Token not found'
            : 'Token not found or you do not have permission to revoke it',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API token revoked successfully',
    })
  } catch (error) {
    console.error('Error revoking API token:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to revoke API token',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
