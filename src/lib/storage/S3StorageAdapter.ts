/**
 * S3-Compatible Storage Adapter
 * Works with AWS S3, Cloudflare R2, MinIO, and other S3-compatible services
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { StorageAdapter, S3StorageConfig } from './StorageAdapter'

export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client
  private bucket: string

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket

    // Configure S3 client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientConfig: any = {
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }

    // Add custom endpoint for S3-compatible services (Cloudflare R2, MinIO)
    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint
      // Force path-style URLs for S3-compatible services
      clientConfig.forcePathStyle = true
    }

    this.client = new S3Client(clientConfig)
  }

  /**
   * Upload a file to S3
   */
  async upload(file: Buffer, storagePath: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
      Body: file,
      ContentType: mimeType,
    })

    await this.client.send(command)

    return storagePath
  }

  /**
   * Download a file from S3
   */
  async download(storagePath: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    })

    try {
      const response = await this.client.send(command)

      if (!response.Body) {
        throw new Error('Empty response body from S3')
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const chunk of response.Body as any) {
        chunks.push(chunk)
      }

      return Buffer.concat(chunks)
    } catch (error: unknown) {
      const err = error as { name?: string }
      if (err.name === 'NoSuchKey') {
        throw new Error(`File not found: ${storagePath}`)
      }
      throw error
    }
  }

  /**
   * Delete a file from S3
   */
  async delete(storagePath: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    })

    await this.client.send(command)
  }

  /**
   * Check if a file exists in S3
   */
  async exists(storagePath: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    })

    try {
      await this.client.send(command)
      return true
    } catch (error: unknown) {
      const err = error as { name?: string }
      if (err.name === 'NotFound' || err.name === 'NoSuchKey') {
        return false
      }
      throw error
    }
  }

  /**
   * Get presigned URL for S3 object
   * @param storagePath - S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   */
  async getUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    })

    // Generate presigned URL
    const url = await getSignedUrl(this.client, command, { expiresIn })

    return url
  }
}
