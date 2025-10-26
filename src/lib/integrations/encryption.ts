/**
 * Credential Encryption Utilities
 * Encrypts/decrypts integration credentials for secure storage
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const ITERATIONS = 100000

/**
 * Get encryption key from environment variable
 * Falls back to a warning if not set (for development only)
 */
function getEncryptionKey(): Buffer | null {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY

  if (!key) {
    console.warn(
      'WARNING: INTEGRATION_ENCRYPTION_KEY not set. Credentials will not be encrypted. This is insecure for production!'
    )
    return null
  }

  // Key should be 32 bytes (64 hex characters)
  if (key.length !== 64) {
    console.error(
      `INTEGRATION_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Current length: ${key.length}`
    )
    return null
  }

  return Buffer.from(key, 'hex')
}

/**
 * Encrypt credentials object to a base64 string
 * @param credentials - Object containing credentials (e.g., { username, password })
 * @returns Encrypted string or null if encryption failed
 */
export function encryptCredentials(credentials: Record<string, string>): string | null {
  const key = getEncryptionKey()

  if (!key) {
    // Return unencrypted JSON as fallback (dev only!)
    return JSON.stringify(credentials)
  }

  try {
    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH)
    const salt = crypto.randomBytes(SALT_LENGTH)

    // Derive key from password using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, 32, 'sha512')

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)

    // Encrypt the JSON string
    const jsonString = JSON.stringify(credentials)
    let encrypted = cipher.update(jsonString, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get authentication tag
    const tag = cipher.getAuthTag()

    // Combine salt + iv + tag + encrypted data
    const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')])

    return result.toString('base64')
  } catch (error) {
    console.error('Failed to encrypt credentials:', error)
    return null
  }
}

/**
 * Decrypt credentials string back to object
 * @param encrypted - Base64 encrypted string
 * @returns Decrypted credentials object or null if decryption failed
 */
export function decryptCredentials(encrypted: string): Record<string, string> | null {
  const key = getEncryptionKey()

  if (!key) {
    // Try to parse as unencrypted JSON (dev fallback)
    try {
      return JSON.parse(encrypted)
    } catch {
      console.error('Failed to parse credentials and no encryption key available')
      return null
    }
  }

  try {
    // Decode base64
    const buffer = Buffer.from(encrypted, 'base64')

    // Extract components
    const salt = buffer.subarray(0, SALT_LENGTH)
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encryptedData = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

    // Derive key
    const derivedKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, 32, 'sha512')

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAuthTag(tag)

    // Decrypt
    let decrypted = decipher.update(encryptedData.toString('hex'), 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    // Parse JSON
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('Failed to decrypt credentials:', error)
    return null
  }
}

/**
 * Generate a random encryption key
 * Use this to create a new INTEGRATION_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Test encryption/decryption with sample data
 */
export function testEncryption(): boolean {
  const testData = {
    username: 'test_user',
    password: 'test_password_123',
    api_key: 'abc123xyz',
  }

  console.log('Testing encryption...')
  console.log('Original:', testData)

  const encrypted = encryptCredentials(testData)
  if (!encrypted) {
    console.error('Encryption failed')
    return false
  }

  console.log('Encrypted:', encrypted.substring(0, 50) + '...')

  const decrypted = decryptCredentials(encrypted)
  if (!decrypted) {
    console.error('Decryption failed')
    return false
  }

  console.log('Decrypted:', decrypted)

  // Verify data matches
  const matches = JSON.stringify(testData) === JSON.stringify(decrypted)

  if (matches) {
    console.log('✓ Encryption test passed!')
  } else {
    console.error('✗ Encryption test failed - data mismatch')
  }

  return matches
}
