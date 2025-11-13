/**
 * Encryption Library for Sensitive Credential Storage
 *
 * Implements AES-256-GCM encryption for secure storage of API keys, OAuth tokens,
 * and other sensitive credentials in the database.
 *
 * Security Features:
 * - AES-256-GCM (Galois/Counter Mode) for authenticated encryption
 * - Unique IV (Initialization Vector) per encryption using CSPRNG
 * - Authentication tag for integrity verification (tamper detection)
 * - Encryption key stored in environment variable (never in code/database)
 *
 * Usage:
 * ```typescript
 * import { encrypt, decrypt } from '@/lib/encryption'
 *
 * // Encrypt before storing in database
 * const encrypted = encrypt(apiKey)
 * await db.query('INSERT INTO integrations (credentials_encrypted) VALUES ($1)', [encrypted])
 *
 * // Decrypt when needed for API calls
 * const apiKey = decrypt(encrypted)
 * ```
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { getOrCreateEncryptionKey } from './encryption-key-manager'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits for AES-GCM
const AUTH_TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits

/**
 * Get encryption key using key manager (auto-generates if needed)
 * Priority: ENV var > Database > Auto-generate
 * @throws Error if key format is invalid
 */
async function getEncryptionKey(): Promise<Buffer> {
  const key = await getOrCreateEncryptionKey()

  // Convert base64 key to Buffer
  const keyBuffer = Buffer.from(key, 'base64')

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `Invalid encryption key length. Expected ${KEY_LENGTH} bytes (256 bits), ` +
        `got ${keyBuffer.length} bytes.`
    )
  }

  return keyBuffer
}

/**
 * Encrypt plaintext using AES-256-GCM
 *
 * @param plaintext - The sensitive data to encrypt (API key, password, etc.)
 * @returns Base64-encoded string in format: iv:authTag:encryptedData
 * @throws Error if encryption fails or ENCRYPTION_KEY is invalid
 *
 * @example
 * const encrypted = await encrypt('my-secret-api-key')
 * // Returns: "base64(iv):base64(authTag):base64(encryptedData)"
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string')
  }

  try {
    const key = await getEncryptionKey()

    // Generate unique IV for this encryption (CRITICAL: Never reuse IVs)
    const iv = randomBytes(IV_LENGTH)

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv)

    // Encrypt the plaintext
    let encrypted = cipher.update(plaintext, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    // Get authentication tag for tamper detection
    const authTag = cipher.getAuthTag()

    // Return format: iv:authTag:encryptedData (all base64 encoded)
    return [iv.toString('base64'), authTag.toString('base64'), encrypted].join(':')
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Decrypt ciphertext encrypted with AES-256-GCM
 *
 * @param ciphertext - Base64-encoded string in format: iv:authTag:encryptedData
 * @returns Decrypted plaintext
 * @throws Error if decryption fails, auth tag invalid, or format is wrong
 *
 * @example
 * const decrypted = await decrypt('base64(iv):base64(authTag):base64(encryptedData)')
 * // Returns: "my-secret-api-key"
 */
export async function decrypt(ciphertext: string): Promise<string> {
  if (!ciphertext) {
    throw new Error('Cannot decrypt empty string')
  }

  try {
    const key = await getEncryptionKey()

    // Parse the encrypted string format: iv:authTag:encryptedData
    const parts = ciphertext.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format. Expected format: iv:authTag:encryptedData')
    }

    const [ivBase64, authTagBase64, encryptedData] = parts

    // Convert from base64
    const iv = Buffer.from(ivBase64, 'base64')
    const authTag = Buffer.from(authTagBase64, 'base64')

    // Validate IV and auth tag lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH} bytes, got ${iv.length}`)
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(
        `Invalid auth tag length: expected ${AUTH_TAG_LENGTH} bytes, got ${authTag.length}`
      )
    }

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv)

    // Set auth tag for verification
    decipher.setAuthTag(authTag)

    // Decrypt
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    // Auth tag verification failure indicates tampering
    if (
      error instanceof Error &&
      error.message.includes('Unsupported state or unable to authenticate data')
    ) {
      throw new Error(
        'Decryption failed: Data may have been tampered with (auth tag verification failed)'
      )
    }
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Mask sensitive string for logging/display
 * Shows only last 4 characters
 *
 * @param value - Sensitive string to mask
 * @param visibleChars - Number of characters to show at end (default: 4)
 * @returns Masked string like "****5678"
 *
 * @example
 * maskCredential('my-secret-api-key-12345678')
 * // Returns: "****5678"
 */
export function maskCredential(value: string, visibleChars: number = 4): string {
  if (!value) {
    return ''
  }

  if (value.length <= visibleChars) {
    return '*'.repeat(value.length)
  }

  const masked = '*'.repeat(Math.max(4, value.length - visibleChars))
  const visible = value.slice(-visibleChars)

  return masked + visible
}

/**
 * Check if a string appears to be encrypted (matches our format)
 *
 * @param value - String to check
 * @returns true if value matches encrypted format (iv:authTag:encryptedData)
 */
export function isEncrypted(value: string): boolean {
  if (!value) {
    return false
  }

  const parts = value.split(':')
  if (parts.length !== 3) {
    return false
  }

  // Basic validation: all parts should be valid base64
  const base64Regex = /^[A-Za-z0-9+/]+=*$/
  return parts.every((part) => base64Regex.test(part))
}

/**
 * Generate a new encryption key suitable for ENCRYPTION_KEY env var
 * For development/testing only - use secure key management in production
 *
 * @returns Base64-encoded 256-bit key
 * @example
 * const key = generateEncryptionKey()
 * console.log(`ENCRYPTION_KEY=${key}`)
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString('base64')
}
