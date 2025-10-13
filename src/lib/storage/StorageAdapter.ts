/**
 * Storage Adapter Interface
 * Defines the contract for all storage backend implementations
 */

export interface StorageAdapter {
  /**
   * Upload a file to storage
   * @param file - File buffer to upload
   * @param path - Storage path/key (should be unique)
   * @param mimeType - MIME type of the file
   * @returns Storage path/key where file was stored
   */
  upload(file: Buffer, path: string, mimeType: string): Promise<string>

  /**
   * Download a file from storage
   * @param path - Storage path/key
   * @returns File buffer
   */
  download(path: string): Promise<Buffer>

  /**
   * Delete a file from storage
   * @param path - Storage path/key
   */
  delete(path: string): Promise<void>

  /**
   * Check if a file exists in storage
   * @param path - Storage path/key
   * @returns True if file exists
   */
  exists(path: string): Promise<boolean>

  /**
   * Get a URL for accessing the file
   * For local storage: returns API endpoint URL
   * For S3: returns presigned URL
   * @param path - Storage path/key
   * @param expiresIn - URL expiration time in seconds (for presigned URLs)
   * @returns URL to access the file
   */
  getUrl(path: string, expiresIn?: number): Promise<string>
}

/**
 * Storage configuration types
 */
export interface LocalStorageConfig {
  basePath: string // Base directory for file storage
}

export interface S3StorageConfig {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string // For S3-compatible services (Cloudflare R2, MinIO)
}

export interface NFSStorageConfig {
  host: string
  path: string
  options?: string
}

export interface SMBStorageConfig {
  host: string
  share: string
  username?: string
  password?: string
}

export type StorageConfig =
  | { backend: 'local'; config: LocalStorageConfig }
  | { backend: 's3'; config: S3StorageConfig }
  | { backend: 'nfs'; config: NFSStorageConfig }
  | { backend: 'smb'; config: SMBStorageConfig }
