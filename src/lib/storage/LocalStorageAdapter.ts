/**
 * Local Filesystem Storage Adapter
 * Stores files on the local filesystem
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { StorageAdapter, LocalStorageConfig } from './StorageAdapter'

export class LocalStorageAdapter implements StorageAdapter {
  private basePath: string

  constructor(config: LocalStorageConfig) {
    this.basePath = config.basePath
  }

  /**
   * Initialize storage (create base directory if it doesn't exist)
   */
  private async ensureBaseDirectory(): Promise<void> {
    try {
      await fs.access(this.basePath)
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(this.basePath, { recursive: true })
    }
  }

  /**
   * Get full filesystem path from storage path
   */
  private getFullPath(storagePath: string): string {
    return path.join(this.basePath, storagePath)
  }

  /**
   * Upload a file to local storage
   */
  async upload(file: Buffer, storagePath: string, _mimeType: string): Promise<string> {
    await this.ensureBaseDirectory()

    const fullPath = this.getFullPath(storagePath)
    const directory = path.dirname(fullPath)

    // Create directory if it doesn't exist
    await fs.mkdir(directory, { recursive: true })

    // Write file
    await fs.writeFile(fullPath, file)

    return storagePath
  }

  /**
   * Download a file from local storage
   */
  async download(storagePath: string): Promise<Buffer> {
    const fullPath = this.getFullPath(storagePath)

    try {
      return await fs.readFile(fullPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${storagePath}`)
      }
      throw error
    }
  }

  /**
   * Delete a file from local storage
   */
  async delete(storagePath: string): Promise<void> {
    const fullPath = this.getFullPath(storagePath)

    try {
      await fs.unlink(fullPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, consider it deleted
        return
      }
      throw error
    }
  }

  /**
   * Check if a file exists in local storage
   */
  async exists(storagePath: string): Promise<boolean> {
    const fullPath = this.getFullPath(storagePath)

    try {
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get API endpoint URL for local storage
   * Local storage files are served via API endpoint
   */
  async getUrl(storagePath: string, _expiresIn?: number): Promise<string> {
    // For local storage, return API endpoint URL
    // The actual file serving is handled by the API route
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    return `${baseUrl}/api/attachments/serve/${encodeURIComponent(storagePath)}`
  }
}
