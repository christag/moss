/**
 * Miyoo Devices Management API
 * GET /api/miyoo/devices - List user's paired Miyoo devices
 * DELETE /api/miyoo/devices - Revoke a device (via query param)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

interface MiyooDeviceListItem {
  id: string
  device_name: string
  device_serial: string | null
  token_prefix: string
  last_sync_at: string | null
  last_sync_ip: string | null
  sync_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * GET /api/miyoo/devices
 * List user's paired Miyoo devices
 *
 * Response:
 * {
 *   "success": true,
 *   "devices": [
 *     {
 *       "id": "uuid",
 *       "device_name": "Living Room Miyoo",
 *       "token_prefix": "moss_abc12",
 *       "last_sync_at": "2025-11-13T12:00:00Z",
 *       "sync_count": 42,
 *       "is_active": true,
 *       "created_at": "2025-11-01T10:00:00Z"
 *     }
 *   ],
 *   "count": 1
 * }
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Miyoo devices using the view
    const result = await query<MiyooDeviceListItem>(
      `SELECT
        id,
        device_name,
        device_serial,
        token_prefix,
        last_sync_at,
        last_sync_ip,
        sync_count,
        is_active,
        created_at,
        updated_at
       FROM miyoo_devices_list
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [session.user.id]
    )

    return NextResponse.json({
      success: true,
      devices: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error('Error listing Miyoo devices:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to list devices',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/miyoo/devices?id=uuid
 * Revoke a Miyoo device (deactivates it and its API token)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Device revoked successfully"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('id')

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Device ID is required',
        },
        { status: 400 }
      )
    }

    // Verify device belongs to user
    const deviceCheck = await query(
      `SELECT id, api_token_id FROM miyoo_devices
       WHERE id = $1 AND user_id = $2`,
      [deviceId, session.user.id]
    )

    if (deviceCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Device not found',
        },
        { status: 404 }
      )
    }

    const device = deviceCheck.rows[0]

    // Deactivate the device
    await query(
      `UPDATE miyoo_devices
       SET is_active = false
       WHERE id = $1`,
      [deviceId]
    )

    // Deactivate the associated API token
    await query(
      `UPDATE api_tokens
       SET is_active = false
       WHERE id = $1`,
      [device.api_token_id]
    )

    return NextResponse.json({
      success: true,
      message: 'Device revoked successfully',
    })
  } catch (error) {
    console.error('Error revoking Miyoo device:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to revoke device',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
