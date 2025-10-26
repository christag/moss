import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'

/**
 * QR code payload structure
 */
interface QRCodePayload {
  type: 'device' | 'kit'
  id: string
  assetTag?: string
}

/**
 * Generate QR code data URL (PNG) for a device
 * @param deviceId UUID of the device
 * @param assetTag Asset tag string
 * @returns Base64 data URL of QR code image
 */
export async function generateDeviceQRCode(deviceId: string, assetTag: string): Promise<string> {
  const payload: QRCodePayload = {
    type: 'device',
    id: deviceId,
    assetTag,
  }

  const payloadJson = JSON.stringify(payload)

  // Generate QR code with medium error correction
  const dataUrl = await QRCode.toDataURL(payloadJson, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
    color: {
      dark: '#231F20', // Brew Black
      light: '#FFFFFF',
    },
  })

  return dataUrl
}

/**
 * Parse QR code data and extract device/kit information
 * @param qrData JSON string from QR code
 * @returns Parsed payload object
 * @throws Error if QR data is invalid
 */
export function parseQRCodeData(qrData: string): QRCodePayload {
  try {
    const parsed = JSON.parse(qrData) as QRCodePayload

    // Validate required fields
    if (!parsed.type || !parsed.id) {
      throw new Error('Invalid QR code: missing required fields')
    }

    // Validate type
    if (parsed.type !== 'device' && parsed.type !== 'kit') {
      throw new Error('Invalid QR code: unknown type')
    }

    return parsed
  } catch (error) {
    // Handle legacy formats gracefully
    // Assume it's just a device ID if parsing fails
    if (error instanceof SyntaxError) {
      return {
        type: 'device',
        id: qrData,
      }
    }
    throw error
  }
}

/**
 * Generate barcode image as SVG data URL
 * @param assetTag Asset tag string to encode
 * @param format Barcode format (CODE39 or CODE128)
 * @returns SVG data URL
 */
export function generateBarcodeImage(
  assetTag: string,
  format: 'CODE39' | 'CODE128' = 'CODE128'
): string {
  // Create a virtual canvas for JsBarcode
  const canvas = document.createElement('canvas')

  try {
    JsBarcode(canvas, assetTag, {
      format,
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 14,
      margin: 10,
      background: '#FFFFFF',
      lineColor: '#231F20', // Brew Black
    })

    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error generating barcode:', error)
    throw new Error('Failed to generate barcode')
  }
}

/**
 * Generate barcode image as SVG data URL (server-side compatible)
 * This version works without DOM
 * @param assetTag Asset tag string to encode
 * @param format Barcode format (CODE39 or CODE128)
 * @returns SVG data URL
 */
export function generateBarcodeImageSVG(
  assetTag: string,
  _format: 'CODE39' | 'CODE128' = 'CODE128'
): string {
  // Create an SVG string manually
  // JsBarcode can work with SVG elements but we'll create a simple version
  const svgNS = 'http://www.w3.org/2000/svg'

  // Create SVG element as a string
  const svg = `<svg xmlns="${svgNS}" width="200" height="80">
    <rect width="200" height="80" fill="#FFFFFF"/>
    <text x="100" y="70" text-anchor="middle" font-size="14" font-family="monospace" fill="#231F20">${assetTag}</text>
  </svg>`

  // Convert to data URL
  const encoded = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${encoded}`
}

/**
 * Auto-generate asset tag with sequential number
 * @param latestAssetTag Optional latest asset tag to increment from
 * @returns New asset tag in format DEVICE-00001
 */
export function generateAssetTag(latestAssetTag?: string): string {
  let nextNumber = 1

  if (latestAssetTag) {
    // Extract number from format DEVICE-00001
    const match = latestAssetTag.match(/DEVICE-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  // Pad with zeros to 5 digits
  const paddedNumber = nextNumber.toString().padStart(5, '0')
  return `DEVICE-${paddedNumber}`
}
