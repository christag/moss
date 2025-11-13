/**
 * Miyoo Pairing Code Generation API
 * POST /api/miyoo/generate-pairing-code
 *
 * Generates a 6-digit pairing code for connecting a Miyoo Mini Plus device
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

interface PairingCode {
  id: string
  code: string
  expires_at: string
}

/**
 * POST /api/miyoo/generate-pairing-code
 * Generate a new 6-digit pairing code
 *
 * Response:
 * {
 *   "success": true,
 *   "code": "123456",
 *   "expiresAt": "2025-11-13T12:10:00Z",
 *   "expiresIn": 600
 * }
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Generate pairing code (10 minute expiration)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    // Call database function to generate unique code
    const result = await query<{ code: string }>(`SELECT generate_miyoo_pairing_code() as code`)

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to generate pairing code',
        },
        { status: 500 }
      )
    }

    const code = result.rows[0].code

    // Insert pairing code into database
    const insertResult = await query<PairingCode>(
      `INSERT INTO miyoo_pairing_codes (user_id, code, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, code, expires_at`,
      [session.user.id, code, expiresAt]
    )

    const pairingCode = insertResult.rows[0]

    return NextResponse.json({
      success: true,
      code: pairingCode.code,
      expiresAt: pairingCode.expires_at,
      expiresIn: 600, // 10 minutes in seconds
      message: 'Pairing code generated successfully',
    })
  } catch (error) {
    console.error('Error generating pairing code:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate pairing code',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
