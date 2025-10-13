/**
 * Role Hierarchy API Route
 * Handles retrieving the role hierarchy tree
 */
import { NextRequest, NextResponse } from 'next/server'
import { getRoleHierarchy } from '@/lib/rbac'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/roles/:id/hierarchy
 * Get the complete role hierarchy tree starting from this role
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    const hierarchy = await getRoleHierarchy(id)

    if (hierarchy.length === 0) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        role_id: id,
        hierarchy,
        depth: hierarchy.length - 1, // Subtract 1 because first item is the role itself
      },
    })
  } catch (error) {
    console.error('Error fetching role hierarchy:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, message: 'Failed to fetch role hierarchy' },
      { status: 500 }
    )
  }
}
