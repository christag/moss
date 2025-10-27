/**
 * JAMF Group Sync Service
 * Syncs computer groups from JAMF Pro to M.O.S.S. groups
 */

import { query } from '@/lib/db'
import { createJamfClient } from './jamf-client'
import { decryptCredentials } from './encryption'
import type { JamfComputerGroup, JamfConfig, JamfCredentials } from '@/lib/schemas/integrations'

export interface GroupSyncMetrics {
  processed: number
  created: number
  updated: number
  skipped: number
  failed: number
  membershipsProcessed: number
  membershipsCreated: number
  membershipsRemoved: number
}

export interface GroupSyncResult {
  success: boolean
  metrics: GroupSyncMetrics
  errors: Array<{ group_id: number; error: string }>
  duration_seconds: number
}

export interface GroupSyncOptions {
  updateExisting?: boolean
  syncMembership?: boolean
  progressCallback?: (current: number, total: number) => void
}

/**
 * Sync computer groups from JAMF Pro to M.O.S.S.
 * @param integrationConfigId - UUID of the integration config
 * @param options - Sync options
 * @returns Sync result with metrics and errors
 */
export async function syncGroupsFromJamf(
  integrationConfigId: string,
  options: GroupSyncOptions = {}
): Promise<GroupSyncResult> {
  const startTime = Date.now()
  const metrics: GroupSyncMetrics = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    membershipsProcessed: 0,
    membershipsCreated: 0,
    membershipsRemoved: 0,
  }
  const errors: Array<{ group_id: number; error: string }> = []

  // Default options
  const { updateExisting = true, syncMembership = true, progressCallback } = options

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

    // 4. Fetch all computer groups from JAMF
    console.log('Fetching computer groups from JAMF...')
    const groups = await jamfClient.getAllComputerGroups()

    console.log(`Found ${groups.length} computer groups in JAMF`)

    // 5. Process each group
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]
      metrics.processed++

      if (progressCallback) {
        progressCallback(i + 1, groups.length)
      }

      try {
        const isNew = await syncSingleGroup(group, integrationConfigId, updateExisting)

        if (isNew === null) {
          metrics.skipped++
        } else if (isNew) {
          metrics.created++
        } else {
          metrics.updated++
        }

        // Sync group membership if enabled
        if (syncMembership) {
          const membershipMetrics = await syncGroupMembership(
            group.id,
            integrationConfigId,
            jamfClient
          )
          metrics.membershipsProcessed += membershipMetrics.processed
          metrics.membershipsCreated += membershipMetrics.created
          metrics.membershipsRemoved += membershipMetrics.removed
        }
      } catch (error) {
        metrics.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({
          group_id: group.id,
          error: errorMessage,
        })

        // Log but continue processing
        console.error(`Failed to sync group ${group.id}:`, errorMessage)

        // Limit error storage to first 10
        if (errors.length >= 10) {
          errors.push({
            group_id: -1,
            error: `...and ${metrics.failed - 10} more errors`,
          })
          break
        }
      }
    }

    // 6. Calculate duration
    const duration_seconds = (Date.now() - startTime) / 1000

    // 7. Create sync history record
    await createGroupSyncHistoryRecord(integrationConfigId, metrics, errors, duration_seconds)

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
    await createGroupSyncHistoryRecord(
      integrationConfigId,
      metrics,
      [{ group_id: -1, error: errorMessage }],
      duration_seconds,
      'failed'
    )

    throw error
  }
}

/**
 * Sync a single group from JAMF to M.O.S.S.
 * @returns true if created, false if updated, null if skipped
 */
async function syncSingleGroup(
  group: JamfComputerGroup,
  integrationConfigId: string,
  updateExisting: boolean
): Promise<boolean | null> {
  // Extract fields from JAMF group
  const name = group.name
  const isSmart = group.isSmart

  if (!name) {
    throw new Error('Group must have a name')
  }

  // Check if group already exists (by external mapping)
  const existingMapping = await query(
    `SELECT internal_id FROM integration_object_mappings
     WHERE integration_config_id = $1
     AND external_type = $2
     AND external_id = $3`,
    [integrationConfigId, 'computer_group', group.id.toString()]
  )

  let groupId: string
  let isNew: boolean

  if (existingMapping.rows.length > 0) {
    // Group mapping exists - update the group
    groupId = existingMapping.rows[0].internal_id as string

    if (!updateExisting) {
      // Skip update if disabled
      return null
    }

    // Update group
    await query(
      `UPDATE groups
       SET name = $1,
           description = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [
        name,
        isSmart ? `JAMF Smart Group: ${group.name}` : `JAMF Static Group: ${group.name}`,
        groupId,
      ]
    )

    isNew = false
  } else {
    // Group doesn't exist - create it
    const insertResult = await query(
      `INSERT INTO groups (
        name,
        description,
        group_type,
        is_active,
        notes
      ) VALUES ($1, $2, $3, true, $4)
      RETURNING id`,
      [
        name,
        isSmart ? `JAMF Smart Group: ${group.name}` : `JAMF Static Group: ${group.name}`,
        'jamf_computer_group',
        `Synced from JAMF Pro. ${isSmart ? 'Smart group membership is managed by JAMF rules.' : 'Static group membership is managed in JAMF.'}`,
      ]
    )

    groupId = insertResult.rows[0].id as string
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
    [
      integrationConfigId,
      group.id.toString(),
      'computer_group',
      groupId,
      'group',
      JSON.stringify(group),
    ]
  )

  return isNew
}

/**
 * Sync group membership (computers in the group)
 */
async function syncGroupMembership(
  jamfGroupId: number,
  integrationConfigId: string,
  jamfClient: ReturnType<typeof createJamfClient>
): Promise<{ processed: number; created: number; removed: number }> {
  const metrics = {
    processed: 0,
    created: 0,
    removed: 0,
  }

  // Get M.O.S.S. group ID from mapping
  const groupMapping = await query(
    `SELECT internal_id FROM integration_object_mappings
     WHERE integration_config_id = $1
     AND external_type = $2
     AND external_id = $3`,
    [integrationConfigId, 'computer_group', jamfGroupId.toString()]
  )

  if (groupMapping.rows.length === 0) {
    throw new Error(`Group mapping not found for JAMF group ${jamfGroupId}`)
  }

  const mossGroupId = groupMapping.rows[0].internal_id

  // Get current members from JAMF
  const jamfComputerIds = await jamfClient.getComputerGroupMembers(jamfGroupId)
  metrics.processed = jamfComputerIds.length

  // Get M.O.S.S. device IDs for these JAMF computers
  const deviceIds: string[] = []

  for (const jamfComputerId of jamfComputerIds) {
    const deviceMapping = await query(
      `SELECT internal_id FROM integration_object_mappings
       WHERE integration_config_id = $1
       AND external_type = $2
       AND external_id = $3`,
      [integrationConfigId, 'computer', jamfComputerId.toString()]
    )

    if (deviceMapping.rows.length > 0) {
      deviceIds.push(deviceMapping.rows[0].internal_id as string)
    }
  }

  // Get current M.O.S.S. group members (devices only)
  const currentMembers = await query(
    `SELECT device_id FROM group_members
     WHERE group_id = $1
     AND device_id IS NOT NULL`,
    [mossGroupId]
  )

  const currentDeviceIds = new Set(currentMembers.rows.map((row) => row.device_id))
  const newDeviceIds = new Set(deviceIds)

  // Add new members
  for (const deviceId of deviceIds) {
    if (!currentDeviceIds.has(deviceId)) {
      await query(
        `INSERT INTO group_members (group_id, device_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [mossGroupId, deviceId]
      )
      metrics.created++
    }
  }

  // Remove members no longer in JAMF group
  for (const currentDeviceId of currentDeviceIds) {
    if (!newDeviceIds.has(currentDeviceId)) {
      await query(
        `DELETE FROM group_members
         WHERE group_id = $1
         AND device_id = $2`,
        [mossGroupId, currentDeviceId]
      )
      metrics.removed++
    }
  }

  return metrics
}

/**
 * Create group sync history record
 */
async function createGroupSyncHistoryRecord(
  integrationConfigId: string,
  metrics: GroupSyncMetrics,
  errors: Array<{ group_id: number; error: string }>,
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
