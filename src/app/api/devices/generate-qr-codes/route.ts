/**
 * Bulk QR Code Generation API
 * POST /api/devices/generate-qr-codes
 *
 * Generates QR codes for multiple devices
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPool } from '@/lib/db'
import { generateDeviceQRCode } from '@/lib/qrcode-utils'

const BulkQRRequestSchema = z.object({
  device_ids: z.array(z.string().uuid()).min(1).max(100), // Max 100 devices at once
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { device_ids } = BulkQRRequestSchema.parse(body)

    // Fetch device information
    const result = await getPool().query(
      `
      SELECT
        id,
        hostname,
        asset_tag,
        model,
        manufacturer
      FROM devices
      WHERE id = ANY($1)
      ORDER BY asset_tag ASC
    `,
      [device_ids]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No devices found with the provided IDs',
        },
        { status: 404 }
      )
    }

    // Generate QR codes for each device
    const qrCodes = await Promise.all(
      result.rows.map(async (device) => {
        // Generate asset tag if missing
        const assetTag = device.asset_tag || `DEVICE-${device.id.substring(0, 8)}`

        const qrCodeDataUrl = await generateDeviceQRCode(device.id, assetTag)

        return {
          deviceId: device.id,
          hostname: device.hostname,
          assetTag,
          model: device.model,
          manufacturer: device.manufacturer,
          qrCodeDataUrl,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        qrCodes,
        count: qrCodes.length,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Error generating QR codes:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate QR codes',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
