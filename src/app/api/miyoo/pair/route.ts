/**
 * Miyoo Device Pairing API
 * POST /api/miyoo/pair
 *
 * Exchanges a 6-digit pairing code for an API token
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { generateApiToken } from '@/lib/apiAuth'
import { z } from 'zod'

// Validation schema for pairing request
const pairSchema = z.object({
  code: z
    .string()
    .length(6, 'Pairing code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be numeric'),
  deviceName: z
    .string()
    .min(1, 'Device name is required')
    .max(255, 'Device name too long')
    .optional(),
})

interface PairingCodeRecord {
  id: string
  user_id: string
  code: string
  expires_at: string
  used_at: string | null
}

interface MiyooDevice {
  id: string
  device_name: string
  api_token_id: string
}

/**
 * POST /api/miyoo/pair
 * Pair a Miyoo device using a 6-digit code
 *
 * Body:
 * {
 *   "code": "123456",
 *   "deviceName": "Living Room Miyoo" // optional, defaults to "Miyoo Device"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "apiToken": "moss_abc123...",  // ONLY SHOWN ONCE!
 *   "deviceId": "uuid",
 *   "deviceName": "Living Room Miyoo",
 *   "scopes": ["read"]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = pairSchema.safeParse(body)

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

    const { code, deviceName = 'Miyoo Device' } = validation.data

    // Find the pairing code
    const codeResult = await query<PairingCodeRecord>(
      `SELECT id, user_id, code, expires_at, used_at
       FROM miyoo_pairing_codes
       WHERE code = $1`,
      [code]
    )

    if (codeResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid pairing code',
        },
        { status: 404 }
      )
    }

    const pairingCode = codeResult.rows[0]

    // Check if code has already been used
    if (pairingCode.used_at) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pairing code has already been used',
        },
        { status: 400 }
      )
    }

    // Check if code has expired
    if (new Date(pairingCode.expires_at) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pairing code has expired',
        },
        { status: 400 }
      )
    }

    // Generate API token for the device (read-only scope)
    const tokenName = `Miyoo: ${deviceName}`
    const scopes = ['read']
    const apiTokenResult = await generateApiToken(
      pairingCode.user_id,
      tokenName,
      scopes,
      null // No expiration
    )

    // Create Miyoo device record
    const deviceResult = await query<MiyooDevice>(
      `INSERT INTO miyoo_devices (user_id, device_name, api_token_id, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, device_name, api_token_id`,
      [pairingCode.user_id, deviceName, apiTokenResult.tokenId]
    )

    const device = deviceResult.rows[0]

    // Mark pairing code as used
    await query(
      `UPDATE miyoo_pairing_codes
       SET used_at = NOW(), used_by_device_id = $1
       WHERE id = $2`,
      [device.id, pairingCode.id]
    )

    return NextResponse.json({
      success: true,
      message: 'Device paired successfully',
      apiToken: apiTokenResult.token, // IMPORTANT: Only returned once!
      deviceId: device.id,
      deviceName: device.device_name,
      scopes,
      warning: 'This API token will only be shown once. Please save it securely on your device.',
    })
  } catch (error) {
    console.error('Error pairing Miyoo device:', error)

    // Check for duplicate device name
    if (error instanceof Error && error.message.includes('unique_user_device_name')) {
      return NextResponse.json(
        {
          success: false,
          message: 'You already have a device with this name',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to pair device',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
