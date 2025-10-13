/**
 * API Route: Single Attachment Operations
 * GET /api/attachments/:id - Get attachment details
 * DELETE /api/attachments/:id - Delete attachment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { auth } from '@/lib/auth'
import type { FileAttachment } from '@/types'

/**
 * GET /api/attachments/:id
 * Get attachment details
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachmentId = id
    const pool = getPool()

    // Get attachment with uploader details
    const result = await pool.query(
      `SELECT
        fa.*,
        u.full_name as uploader_name,
        u.email as uploader_email
       FROM file_attachments fa
       LEFT JOIN users u ON fa.uploaded_by = u.id
       WHERE fa.id = $1`,
      [attachmentId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Attachment not found' }, { status: 404 })
    }

    const row = result.rows[0]

    const attachment: FileAttachment = {
      id: row.id,
      filename: row.filename,
      original_filename: row.original_filename,
      file_size: parseInt(row.file_size, 10),
      mime_type: row.mime_type,
      storage_path: row.storage_path,
      storage_backend: row.storage_backend,
      metadata: row.metadata,
      uploaded_by: row.uploaded_by,
      uploaded_at: new Date(row.uploaded_at),
      download_count: row.download_count,
      status: row.status,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      uploader: {
        id: row.uploaded_by,
        full_name: row.uploader_name,
        email: row.uploader_email,
      },
    }

    // TODO: Check user permissions on parent object

    return NextResponse.json({ success: true, data: attachment })
  } catch (error) {
    console.error('Error fetching attachment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attachment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/attachments/:id
 * Delete attachment (soft delete)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachmentId = id
    const pool = getPool()

    // Get attachment details
    const attachmentResult = await pool.query(`SELECT * FROM file_attachments WHERE id = $1`, [
      attachmentId,
    ])

    if (attachmentResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Attachment not found' }, { status: 404 })
    }

    // TODO: Check user permissions on parent object (requires edit permission)
    // await checkPermission(session.user.id, 'edit', objectType, objectId)

    // Soft delete: Set status to 'deleted'
    await pool.query(
      `UPDATE file_attachments SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [attachmentId]
    )

    // Optionally: Delete from storage backend
    // For now, keep files in storage but mark as deleted in database
    // This allows for recovery if needed

    // If you want to delete from storage immediately:
    /*
    try {
      const adapter = await getStorageAdapter()
      await adapter.delete(attachment.storage_path)
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Continue even if storage deletion fails
    }
    */

    return NextResponse.json({
      success: true,
      message: 'Attachment deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete attachment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
