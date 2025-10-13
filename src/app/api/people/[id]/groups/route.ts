/**
 * Person Groups API Routes
 * Handles getting groups that a person belongs to
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { Group } from '@/types'

/**
 * GET /api/people/:id/groups
 * Get all groups that a person belongs to
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verify person exists
    const personCheck = await query('SELECT id FROM people WHERE id = $1', [id])
    if (personCheck.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Person not found' }, { status: 404 })
    }

    // Get all groups for this person
    const sql = `
      SELECT g.*
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.person_id = $1
      ORDER BY g.group_name
    `

    const result = await query<Group>(sql, [id])

    return NextResponse.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('Error fetching person groups:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch person groups' },
      { status: 500 }
    )
  }
}
