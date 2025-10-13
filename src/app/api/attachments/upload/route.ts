/**
 * API Route: File Upload
 * POST /api/attachments/upload - Upload a file and attach to an object
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { auth } from '@/lib/auth'
import { UploadRequestSchema, validateFileSize } from '@/lib/schemas/attachment'
import { getStorageAdapter, generateStoragePath } from '@/lib/storage/StorageFactory'
import type { UploadResponse, AttachmentObjectType } from '@/types'

/**
 * POST /api/attachments/upload
 * Upload a file and create attachment record
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const objectType = formData.get('object_type') as string
    const objectId = formData.get('object_id') as string

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Validate upload request metadata
    const validationResult = UploadRequestSchema.safeParse({
      object_type: objectType,
      object_id: objectId,
      filename: file.name,
      file_size: file.size,
      mime_type: file.type,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.format(),
        },
        { status: 400 }
      )
    }

    // Get max file size from system settings
    const pool = getPool()
    const settingsResult = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'storage.max_file_size_mb'`
    )
    const maxSizeMB = settingsResult.rows[0]
      ? parseInt(JSON.parse(settingsResult.rows[0].value), 10)
      : 50

    // Validate file size
    if (!validateFileSize(file.size, maxSizeMB)) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds maximum allowed size of ${maxSizeMB} MB`,
        },
        { status: 400 }
      )
    }

    // Verify the object exists
    const tableName = getTableName(objectType as AttachmentObjectType)
    const objectExists = await pool.query(`SELECT id FROM ${tableName} WHERE id = $1`, [objectId])

    if (objectExists.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `${objectType} not found` },
        { status: 404 }
      )
    }

    // TODO: Check user permissions on parent object
    // await checkPermission(session.user.id, 'edit', objectType, objectId)

    // Generate storage path
    const storagePath = generateStoragePath(file.name, session.user.id)

    // Get storage adapter
    const adapter = await getStorageAdapter()

    // Read file data
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to storage backend
    await adapter.upload(buffer, storagePath, file.type)

    // Get storage backend from settings
    const backendResult = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'storage.backend'`
    )
    const storageBackend = backendResult.rows[0] ? JSON.parse(backendResult.rows[0].value) : 'local'

    // Create attachment record in database
    const attachmentResult = await pool.query(
      `INSERT INTO file_attachments (
        filename,
        original_filename,
        file_size,
        mime_type,
        storage_path,
        storage_backend,
        uploaded_by,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, storage_path`,
      [
        storagePath.split('/').pop(), // Just the filename
        file.name,
        file.size,
        file.type,
        storagePath,
        storageBackend,
        session.user.id,
        'active',
      ]
    )

    const attachmentId = attachmentResult.rows[0].id

    // Link attachment to object via junction table
    const junctionTable = getJunctionTableName(objectType as AttachmentObjectType)
    await pool.query(
      `INSERT INTO ${junctionTable} (attachment_id, ${objectType}_id, attached_by)
       VALUES ($1, $2, $3)`,
      [attachmentId, objectId, session.user.id]
    )

    const response: UploadResponse = {
      success: true,
      data: {
        attachment_id: attachmentId,
        storage_path: storagePath,
      },
      message: 'File uploaded successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Get database table name for object type
 */
function getTableName(objectType: AttachmentObjectType): string {
  const tableMap: Record<AttachmentObjectType, string> = {
    device: 'devices',
    person: 'people',
    location: 'locations',
    room: 'rooms',
    network: 'networks',
    document: 'documents',
    contract: 'contracts',
    company: 'companies',
    software: 'software',
    saas_service: 'saas_services',
  }

  return tableMap[objectType]
}

/**
 * Get junction table name for object type
 */
function getJunctionTableName(objectType: AttachmentObjectType): string {
  return `${objectType}_attachments`
}
