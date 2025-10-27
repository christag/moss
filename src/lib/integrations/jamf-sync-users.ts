/**
 * JAMF User Sync Service
 * Syncs users from JAMF Pro to M.O.S.S. people
 */

import { query } from '@/lib/db'
import { createJamfClient } from './jamf-client'
import { decryptCredentials } from './encryption'
import type { JamfUser, JamfConfig, JamfCredentials } from '@/lib/schemas/integrations'

export interface UserSyncMetrics {
  processed: number
  created: number
  updated: number
  skipped: number
  failed: number
}

export interface UserSyncResult {
  success: boolean
  metrics: UserSyncMetrics
  errors: Array<{ user_id: number; error: string }>
  duration_seconds: number
}

export interface UserSyncOptions {
  updateExisting?: boolean
  progressCallback?: (current: number, total: number) => void
}

/**
 * Sync users from JAMF Pro to M.O.S.S.
 * @param integrationConfigId - UUID of the integration config
 * @param options - Sync options
 * @returns Sync result with metrics and errors
 */
export async function syncUsersFromJamf(
  integrationConfigId: string,
  options: UserSyncOptions = {}
): Promise<UserSyncResult> {
  const startTime = Date.now()
  const metrics: UserSyncMetrics = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  }
  const errors: Array<{ user_id: number; error: string }> = []

  // Default options
  const { updateExisting = true, progressCallback } = options

  try {
    // 1. Fetch integration config from database
    const configResult = await query('SELECT * FROM integration_configs WHERE id = $1', [
      integrationConfigId,
    ])

    if (configResult.rows.length === 0) {
      throw new Error(`Integration config ${integrationConfigId} not found`)
    }

    const config = configResult.rows[0]

    // 2. Decrypt credentials and parse config
    const credentials = decryptCredentials(
      config.credentials_encrypted as string
    ) as JamfCredentials | null

    if (!credentials) {
      throw new Error('Failed to decrypt JAMF credentials')
    }

    const jamfConfig = config.config as JamfConfig

    // 3. Create JAMF client
    const jamfClient = createJamfClient({
      config: jamfConfig,
      credentials,
    })

    // 4. Fetch all users from JAMF
    console.log('Fetching users from JAMF...')
    const users = await jamfClient.getAllUsers()

    console.log(`Found ${users.length} users in JAMF`)

    // 5. Process each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      metrics.processed++

      if (progressCallback) {
        progressCallback(i + 1, users.length)
      }

      try {
        const isNew = await syncSingleUser(user, integrationConfigId, updateExisting)

        if (isNew === null) {
          metrics.skipped++
        } else if (isNew) {
          metrics.created++
        } else {
          metrics.updated++
        }
      } catch (error) {
        metrics.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({
          user_id: user.id,
          error: errorMessage,
        })

        // Log but continue processing
        console.error(`Failed to sync user ${user.id}:`, errorMessage)

        // Limit error storage to first 10
        if (errors.length >= 10) {
          errors.push({
            user_id: -1,
            error: `...and ${metrics.failed - 10} more errors`,
          })
          break
        }
      }
    }

    // 6. Calculate duration
    const duration_seconds = (Date.now() - startTime) / 1000

    // 7. Create sync history record
    await createUserSyncHistoryRecord(integrationConfigId, metrics, errors, duration_seconds)

    // 8. Return result
    return {
      success: metrics.failed === 0,
      metrics,
      errors,
      duration_seconds,
    }
  } catch (error) {
    const duration_seconds = (Date.now() - startTime) / 1000
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Create failed sync history
    await createUserSyncHistoryRecord(
      integrationConfigId,
      metrics,
      [{ user_id: -1, error: errorMessage }],
      duration_seconds,
      'failed'
    )

    throw error
  }
}

/**
 * Sync a single user from JAMF to M.O.S.S.
 * @returns true if created, false if updated, null if skipped
 */
async function syncSingleUser(
  user: JamfUser,
  integrationConfigId: string,
  updateExisting: boolean
): Promise<boolean | null> {
  // Extract fields from JAMF user
  const username = user.name
  const fullName = user.full_name
  const email = user.email
  const phoneNumber = user.phone_number
  const position = user.position

  if (!username && !email) {
    throw new Error('User must have username or email')
  }

  // Check if person already exists
  const existingPerson = await query(
    'SELECT id, updated_at FROM people WHERE username = $1 OR email_address = $2',
    [username, email]
  )

  let personId: string
  let isNew: boolean

  if (existingPerson.rows.length > 0) {
    // Person exists - update it
    personId = existingPerson.rows[0].id as string

    if (!updateExisting) {
      // Skip update if disabled
      return null
    }

    // Update person
    await query(
      `UPDATE people
       SET full_name = COALESCE($1, full_name),
           email_address = COALESCE($2, email_address),
           phone_number = COALESCE($3, phone_number),
           job_title = COALESCE($4, job_title),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [fullName, email, phoneNumber, position, personId]
    )

    isNew = false
  } else {
    // Person doesn't exist - create it
    const insertResult = await query(
      `INSERT INTO people (
        username,
        full_name,
        email_address,
        phone_number,
        job_title,
        is_active,
        notes
      ) VALUES ($1, $2, $3, $4, $5, true, $6)
      RETURNING id`,
      [username || email, fullName, email, phoneNumber, position, 'Imported from JAMF Pro']
    )

    personId = insertResult.rows[0].id as string
    isNew = true
  }

  // Create/update object mapping
  await query(
    `INSERT INTO integration_object_mappings (
      integration_config_id,
      external_id,
      external_type,
      internal_id,
      internal_type,
      external_data,
      last_synced_at
    ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    ON CONFLICT (integration_config_id, external_type, external_id)
    DO UPDATE SET
      internal_id = $4,
      external_data = $6,
      last_synced_at = CURRENT_TIMESTAMP`,
    [integrationConfigId, user.id.toString(), 'user', personId, 'person', JSON.stringify(user)]
  )

  return isNew
}

/**
 * Create user sync history record
 */
async function createUserSyncHistoryRecord(
  integrationConfigId: string,
  metrics: UserSyncMetrics,
  errors: Array<{ user_id: number; error: string }>,
  duration_seconds: number,
  status: string = 'success'
): Promise<void> {
  const finalStatus = status === 'failed' ? 'failed' : metrics.failed > 0 ? 'partial' : 'success'

  await query(
    `INSERT INTO integration_sync_history (
      integration_config_id,
      sync_started_at,
      sync_completed_at,
      status,
      items_processed,
      items_created,
      items_updated,
      items_skipped,
      items_failed,
      error_message,
      error_details,
      sync_type,
      duration_seconds
    ) VALUES ($1, NOW() - INTERVAL '1 second' * $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      integrationConfigId,
      duration_seconds,
      finalStatus,
      metrics.processed,
      metrics.created,
      metrics.updated,
      metrics.skipped,
      metrics.failed,
      errors.length > 0 ? errors[0].error : null,
      errors.length > 0 ? JSON.stringify(errors) : null,
      'manual', // Will be 'scheduled' when cron implemented
      duration_seconds,
    ]
  )
}
