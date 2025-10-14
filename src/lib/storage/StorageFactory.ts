/**
 * Storage Factory
 * Creates and returns the appropriate storage adapter based on system settings
 */

import { getPool } from '@/lib/db'
import { StorageAdapter } from './StorageAdapter'
import { LocalStorageAdapter } from './LocalStorageAdapter'
import { S3StorageAdapter } from './S3StorageAdapter'
import type { StorageSettings } from '@/types'

// Singleton instance cache
let cachedAdapter: StorageAdapter | null = null
let cachedBackend: string | null = null

/**
 * Get storage settings from database
 */
async function getStorageSettings(): Promise<StorageSettings> {
  const pool = getPool()

  const result = await pool.query(
    `SELECT key, value FROM system_settings WHERE category = 'storage'`
  )

  const settings: Record<string, unknown> = {}

  for (const row of result.rows) {
    const key = row.key.replace('storage.', '')
    // Parse JSON values
    try {
      settings[key] = JSON.parse(row.value as string)
    } catch {
      settings[key] = row.value as string
    }
  }

  // Set defaults if not configured
  return {
    backend: (settings.backend as 'local' | 's3' | 'nfs' | 'smb') || 'local',
    local: {
      path: (settings.local_path as string) || '/var/moss/uploads',
    },
    s3: {
      bucket: (settings.s3_bucket as string) || null,
      region: (settings.s3_region as string) || '',
      access_key: (settings.s3_access_key as string) || null,
      secret_key: (settings.s3_secret_key as string) || null,
      endpoint: (settings.s3_endpoint as string) || null,
    },
    nfs: {
      server: (settings.nfs_host as string) || null,
      path: (settings.nfs_path as string) || null,
    },
    smb: {
      server: (settings.smb_host as string) || null,
      share: (settings.smb_share as string) || null,
      username: (settings.smb_username as string) || null,
      password: (settings.smb_password as string) || null,
    },
  }
}

/**
 * Get storage adapter instance
 * Returns cached instance if backend hasn't changed
 */
export async function getStorageAdapter(): Promise<StorageAdapter> {
  const settings = await getStorageSettings()

  // Return cached adapter if backend hasn't changed
  if (cachedAdapter && cachedBackend === settings.backend) {
    return cachedAdapter
  }

  // Create new adapter based on backend type
  switch (settings.backend) {
    case 'local': {
      cachedAdapter = new LocalStorageAdapter({
        basePath: settings.local?.path || '/var/moss/uploads',
      })
      break
    }

    case 's3': {
      if (
        !settings.s3?.bucket ||
        !settings.s3?.region ||
        !settings.s3?.access_key ||
        !settings.s3?.secret_key
      ) {
        throw new Error('S3 storage is not properly configured')
      }

      cachedAdapter = new S3StorageAdapter({
        bucket: settings.s3.bucket,
        region: settings.s3.region,
        accessKeyId: settings.s3.access_key,
        secretAccessKey: settings.s3.secret_key,
        endpoint: settings.s3.endpoint || undefined,
      })
      break
    }

    case 'nfs':
    case 'smb':
      // NFS/SMB adapters not yet implemented
      throw new Error(`${settings.backend.toUpperCase()} storage adapter not yet implemented`)

    default:
      throw new Error(`Unknown storage backend: ${settings.backend}`)
  }

  cachedBackend = settings.backend

  return cachedAdapter
}

/**
 * Clear cached adapter (useful for testing or when settings change)
 */
export function clearAdapterCache(): void {
  cachedAdapter = null
  cachedBackend = null
}

/**
 * Generate a safe storage path for a file
 * @param originalFilename - Original user-provided filename
 * @param uploaderId - User ID of uploader
 * @returns Safe storage path (UUID-based with extension)
 */
export function generateStoragePath(originalFilename: string, _uploaderId: string): string {
  // Extract file extension
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'bin'

  // Generate UUID for filename
  const uuid = crypto.randomUUID()

  // Create date-based directory structure (YYYY/MM)
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  // Return path: YYYY/MM/uuid.ext
  return `${year}/${month}/${uuid}.${ext}`
}
