/**
 * API Route: Download Attachment
 * GET /api/attachments/:id/download - Get download URL or stream file
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getStorageAdapter } from '@/lib/storage/StorageFactory'
import type { DownloadUrlResponse } from '@/types'

/**
 * GET /api/attachments/:id/download
 * Download an attachment or get presigned URL
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachmentId = params.id
    const pool = getPool()

    // Get attachment details
    const attachmentResult = await pool.query(
      `SELECT * FROM file_attachments WHERE id = $1 AND status = 'active'`,
      [attachmentId]
    )

    if (attachmentResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Attachment not found' }, { status: 404 })
    }

    const attachment = attachmentResult.rows[0]

    // TODO: Check user permissions on parent object
    // Find parent object via junction tables and check permissions

    // Increment download count
    await pool.query(
      `UPDATE file_attachments SET download_count = download_count + 1 WHERE id = $1`,
      [attachmentId]
    )

    // Get storage adapter
    const adapter = await getStorageAdapter()

    // For S3, return presigned URL
    if (attachment.storage_backend === 's3') {
      const url = await adapter.getUrl(attachment.storage_path, 3600) // 1 hour expiry

      const response: DownloadUrlResponse = {
        success: true,
        data: {
          url,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
      }

      return NextResponse.json(response)
    }

    // For local storage, stream the file directly
    const fileBuffer = await adapter.download(attachment.storage_path)

    // Return file as response
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': attachment.mime_type,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.original_filename)}"`,
        'Content-Length': attachment.file_size.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading attachment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to download attachment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
