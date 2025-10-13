/**
 * API Route: Admin Storage Settings
 * GET - Retrieve current storage settings
 * PUT - Update storage settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { auth, hasRole } from '@/lib/auth'
import { StorageSettingsSchema } from '@/lib/schemas/admin'
import { logAdminAction, getIPAddress, getUserAgent } from '@/lib/adminAuth'
import { parseRequestBody } from '@/lib/api'
import type { StorageSettings, SystemSetting } from '@/types'

/**
 * GET /api/admin/settings/storage
 * Retrieve current storage settings
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = hasRole(session.user.role, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const pool = getPool()

    const result = await pool.query<SystemSetting>(
      `SELECT key, value, category, description
       FROM system_settings
       WHERE category = 'storage'
       ORDER BY key`
    )

    const storageSettings: Partial<StorageSettings> = {}

    for (const row of result.rows) {
      const key = row.key.replace('storage.', '')
      storageSettings[key as keyof StorageSettings] = row.value as string
    }

    return NextResponse.json(storageSettings)
  } catch (error) {
    console.error('Error fetching storage settings:', error)
    return NextResponse.json({ error: 'Failed to fetch storage settings' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/settings/storage
 * Update storage settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = hasRole(session.user.role, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const validationResult = StorageSettingsSchema.safeParse(parseResult.data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const storageSettings = validationResult.data
    const pool = getPool()

    const updatePromises = Object.entries(storageSettings).map(([key, value]) => {
      return pool.query(
        `UPDATE system_settings
         SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
         WHERE key = $3`,
        [JSON.stringify(value), session.user.id, `storage.${key}`]
      )
    })

    await Promise.all(updatePromises)

    await logAdminAction({
      user_id: session.user.id,
      action: 'update_storage_settings',
      category: 'storage',
      details: { updated_settings: storageSettings },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    })

    return NextResponse.json({
      message: 'Storage settings updated successfully',
      settings: storageSettings,
    })
  } catch (error) {
    console.error('Error updating storage settings:', error)
    return NextResponse.json({ error: 'Failed to update storage settings' }, { status: 500 })
  }
}
