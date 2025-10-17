/**
 * API Route: Admin Branding Settings
 * GET - Retrieve current branding settings
 * PUT - Update branding settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasRole } from '@/lib/auth'
import { BrandingSettingsSchema } from '@/lib/schemas/admin'
import { logAdminAction, getIPAddress, getUserAgent } from '@/lib/adminAuth'
import { parseRequestBody } from '@/lib/api'
import { invalidateConfigCache } from '@/lib/config'
import type { BrandingSettings, SystemSetting } from '@/types'

/**
 * GET /api/admin/settings/branding
 * Retrieve current branding settings
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = hasRole(session.user.role, 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const pool = getPool()

    // Fetch all branding-related settings
    const result = await pool.query<SystemSetting>(
      `SELECT key, value, category, description, updated_by, created_at, updated_at
       FROM system_settings
       WHERE category = 'branding'
       ORDER BY key`
    )

    // Transform database rows into BrandingSettings object
    const brandingSettings: Partial<BrandingSettings> = {}

    for (const row of result.rows) {
      const key = row.key.replace('branding.', '')
      brandingSettings[key as keyof BrandingSettings] = row.value as string
    }

    return NextResponse.json(brandingSettings)
  } catch (error) {
    console.error('Error fetching branding settings:', error)
    return NextResponse.json({ error: 'Failed to fetch branding settings' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/settings/branding
 * Update branding settings
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication and admin role
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

    const validationResult = BrandingSettingsSchema.safeParse(parseResult.data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const brandingSettings = validationResult.data
    const pool = getPool()

    // Update each branding setting
    const updatePromises = Object.entries(brandingSettings).map(([key, value]) => {
      return pool.query(
        `UPDATE system_settings
         SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
         WHERE key = $3`,
        [JSON.stringify(value), session.user.id, `branding.${key}`]
      )
    })

    await Promise.all(updatePromises)

    // Invalidate config cache so next request loads fresh settings
    invalidateConfigCache()

    // Log admin action
    await logAdminAction({
      user_id: session.user.id,
      action: 'update_branding_settings',
      category: 'branding',
      details: { updated_settings: brandingSettings },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    })

    return NextResponse.json({
      message: 'Branding settings updated successfully',
      settings: brandingSettings,
    })
  } catch (error) {
    console.error('Error updating branding settings:', error)
    return NextResponse.json({ error: 'Failed to update branding settings' }, { status: 500 })
  }
}
