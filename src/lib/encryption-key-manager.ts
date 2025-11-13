/**
 * Encryption Key Manager
 *
 * Manages automatic generation and retrieval of encryption keys for
 * securing integration credentials. Uses a hybrid approach:
 *
 * Priority Order:
 * 1. ENCRYPTION_KEY environment variable (user override)
 * 2. Active key from encryption_keys database table
 * 3. Auto-generate new key and store in database
 *
 * Features:
 * - Zero-configuration: Auto-generates key on first use
 * - ENV override: Advanced users can provide their own key
 * - In-memory cache: Avoids database queries on every encryption
 * - Thread-safe: Uses singleton pattern with async initialization
 */

import { randomBytes } from 'crypto'
import { query } from './db'

const KEY_LENGTH = 32 // 256 bits for AES-256

// In-memory cache (cleared on app restart)
let cachedKey: string | null = null
let initializationPromise: Promise<string> | null = null

/**
 * Get or create encryption key with caching and auto-generation
 *
 * This function is called by the encryption library on every encrypt/decrypt.
 * It ensures a key is always available, generating one if necessary.
 *
 * @returns Base64-encoded 256-bit encryption key
 * @throws Error if key generation or database operations fail
 */
export async function getOrCreateEncryptionKey(): Promise<string> {
  // Priority 1: Check environment variable (user override)
  if (process.env.ENCRYPTION_KEY) {
    // Validate ENV key format
    try {
      const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
      if (keyBuffer.length !== KEY_LENGTH) {
        console.error(
          `Invalid ENCRYPTION_KEY length: expected ${KEY_LENGTH} bytes, got ${keyBuffer.length} bytes`
        )
        // Fall through to database key instead of crashing
      } else {
        return process.env.ENCRYPTION_KEY
      }
    } catch (error) {
      console.error('Invalid ENCRYPTION_KEY format (not valid base64):', error)
      // Fall through to database key
    }
  }

  // Priority 2: Check in-memory cache
  if (cachedKey) {
    return cachedKey
  }

  // Priority 3: Initialize from database (with deduplication)
  // If multiple requests come in simultaneously, only one initialization happens
  if (!initializationPromise) {
    initializationPromise = initializeKeyFromDatabase()
  }

  const key = await initializationPromise
  cachedKey = key
  initializationPromise = null

  return key
}

/**
 * Initialize encryption key from database or generate new one
 * @internal
 */
async function initializeKeyFromDatabase(): Promise<string> {
  try {
    // Query for active encryption key
    const result = await query<{ encryption_key: string }>(
      'SELECT encryption_key FROM encryption_keys WHERE is_active = true LIMIT 1'
    )

    // If key exists in database, use it
    if (result.rows.length > 0) {
      const key = result.rows[0].encryption_key
      console.log('[Encryption] Loaded encryption key from database')
      return key
    }

    // No key exists - generate new one
    const newKey = generateEncryptionKey()

    await query(
      `INSERT INTO encryption_keys (encryption_key, description, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [newKey, 'Auto-generated encryption key on first boot']
    )

    console.log('[Encryption] Generated and stored new encryption key in database')
    return newKey
  } catch (error) {
    console.error('[Encryption] Failed to initialize encryption key:', error)
    throw new Error(
      `Failed to initialize encryption key: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Generate a new 256-bit encryption key
 * @returns Base64-encoded 32-byte key
 */
function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString('base64')
}

/**
 * Clear the in-memory key cache
 * Useful for testing or after key rotation
 */
export function clearKeyCache(): void {
  cachedKey = null
  initializationPromise = null
  console.log('[Encryption] Key cache cleared')
}

/**
 * Rotate encryption key (future feature)
 *
 * This function will:
 * 1. Generate new encryption key
 * 2. Mark old key as inactive
 * 3. Re-encrypt all credentials with new key
 * 4. Clear cache to force reload
 *
 * @throws Error - Not yet implemented
 */
export async function rotateEncryptionKey(): Promise<void> {
  throw new Error(
    'Key rotation not yet implemented. ' +
      'To manually rotate: (1) Set ENCRYPTION_KEY env var with new key, ' +
      '(2) Re-encrypt all credentials, (3) Update database keys table'
  )
}
