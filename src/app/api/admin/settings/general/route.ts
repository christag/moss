/**
 * API Route: Admin General Settings
 * GET - Retrieve current general settings
 * PUT - Update general settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasRole } from '@/lib/auth'
import { logAdminAction, getIPAddress, getUserAgent } from '@/lib/adminAuth'
import { parseRequestBody } from '@/lib/api'
import { clearSiteUrlCache } from '@/lib/siteConfig'
import { z } from 'zod'
import type { SystemSetting } from '@/types'

// Validation schema for general settings
const GeneralSettingsSchema = z.object({
  site_url: z.string().url().optional(),
  timezone: z.string().optional(),
  date_format: z.string().optional(),
  items_per_page: z.number().int().min(10).max(200).optional(),
  backup_enabled: z.boolean().optional(),
  backup_frequency: z.enum(['daily', 'weekly']).optional(),
  backup_retention_days: z.number().int().min(1).max(365).optional(),
})

/**
 * GET /api/admin/settings/general
 * Retrieve current general settings
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

    // Fetch all general-related settings
    const result = await pool.query<SystemSetting>(
      `SELECT key, value, category, description, updated_by, created_at, updated_at
       FROM system_settings
       WHERE category = 'general'
       ORDER BY key`
    )

    // Transform database rows into GeneralSettings object
    const generalSettings: Record<string, unknown> = {}

    for (const row of result.rows) {
      const key = row.key.replace('general.', '')
      const value = row.value

      // Handle different value types
      if (key === 'items_per_page' || key === 'backup_retention_days') {
        generalSettings[key] = Number(value)
      } else if (key === 'backup_enabled') {
        generalSettings[key] = value === true || value === 'true'
      } else {
        generalSettings[key] = value as string
      }
    }

    return NextResponse.json(generalSettings)
  } catch (error) {
    console.error('Error fetching general settings:', error)
    return NextResponse.json({ error: 'Failed to fetch general settings' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/settings/general
 * Update general settings
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

    const validationResult = GeneralSettingsSchema.safeParse(parseResult.data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const generalSettings = validationResult.data
    const pool = getPool()

    // Track if site_url was updated (need to clear cache)
    let siteUrlUpdated = false

    // Update each general setting
    const updatePromises = Object.entries(generalSettings).map(([key, value]) => {
      if (key === 'site_url') {
        siteUrlUpdated = true
      }

      // Ensure backup_enabled is stored properly (insert if doesn't exist)
      return pool.query(
        `INSERT INTO system_settings (key, value, category, description, updated_by)
         VALUES ($1, $2, 'general', $3, $4)
         ON CONFLICT (key)
         DO UPDATE SET
           value = EXCLUDED.value,
           updated_by = EXCLUDED.updated_by,
           updated_at = CURRENT_TIMESTAMP`,
        [`general.${key}`, JSON.stringify(value), `General setting: ${key}`, session.user.id]
      )
    })

    await Promise.all(updatePromises)

    // Clear site URL cache if it was updated
    if (siteUrlUpdated) {
      clearSiteUrlCache()
    }

    // Log admin action
    await logAdminAction({
      user_id: session.user.id,
      action: 'update_general_settings',
      category: 'general',
      details: { updated_settings: generalSettings },
      ip_address: getIPAddress(request.headers),
      user_agent: getUserAgent(request.headers),
    })

    return NextResponse.json({
      message: 'General settings updated successfully',
      settings: generalSettings,
    })
  } catch (error) {
    console.error('Error updating general settings:', error)
    return NextResponse.json({ error: 'Failed to update general settings' }, { status: 500 })
  }
}
