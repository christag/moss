/**
 * JAMF Computer Sync Service
 * Syncs computer inventory from JAMF Pro to M.O.S.S. devices
 */

import { query } from '@/lib/db'
import { createJamfClient } from './jamf-client'
import { decryptCredentials } from './encryption'
import type { JamfComputerInventory, JamfConfig, JamfCredentials } from '@/lib/schemas/integrations'

export interface SyncMetrics {
  processed: number
  created: number
  updated: number
  skipped: number
  failed: number
}

export interface SyncResult {
  success: boolean
  metrics: SyncMetrics
  errors: Array<{ computer_id: number; error: string }>
  duration_seconds: number
}

export interface SyncOptions {
  createMissingLocations?: boolean
  updateExisting?: boolean
  progressCallback?: (current: number, total: number) => void
}

/**
 * Sync computers from JAMF Pro to M.O.S.S.
 * @param integrationConfigId - UUID of the integration config
 * @param options - Sync options
 * @returns Sync result with metrics and errors
 */
export async function syncComputersFromJamf(
  integrationConfigId: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now()
  const metrics: SyncMetrics = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  }
  const errors: Array<{ computer_id: number; error: string }> = []

  // Default options
  const { createMissingLocations = true, updateExisting = true, progressCallback } = options

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
    const credentials = decryptCredentials(config.credentials_encrypted) as JamfCredentials | null

    if (!credentials) {
      throw new Error('Failed to decrypt JAMF credentials')
    }

    const jamfConfig = config.config as JamfConfig

    // 3. Create JAMF client
    const jamfClient = createJamfClient({
      config: jamfConfig,
      credentials,
    })

    // 4. Get sync settings
    const syncSettings = config.sync_settings || {}
    const sections = syncSettings.sync_computer_sections || [
      'GENERAL',
      'HARDWARE',
      'SOFTWARE',
      'USER_AND_LOCATION',
      'GROUP_MEMBERSHIPS',
    ]

    // 5. Fetch all computers from JAMF
    console.log('Fetching computers from JAMF...')
    const computers = await jamfClient.getAllComputers(sections, (current, total) => {
      if (progressCallback) {
        progressCallback(current, total)
      }
    })

    console.log(`Found ${computers.length} computers in JAMF`)

    // 6. Process each computer
    for (const computer of computers) {
      metrics.processed++

      try {
        await syncSingleComputer(
          computer,
          integrationConfigId,
          createMissingLocations,
          updateExisting
        )

        // Check if this was a create or update
        const existsResult = await query('SELECT id FROM devices WHERE serial_number = $1', [
          computer.hardware?.serialNumber,
        ])

        if (existsResult.rows.length > 0) {
          metrics.updated++
        } else {
          metrics.created++
        }
      } catch (error) {
        metrics.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({
          computer_id: computer.id,
          error: errorMessage,
        })

        // Log but continue processing
        console.error(`Failed to sync computer ${computer.id}:`, errorMessage)

        // Limit error storage to first 10
        if (errors.length >= 10) {
          errors.push({
            computer_id: -1,
            error: `...and ${metrics.failed - 10} more errors`,
          })
          break
        }
      }
    }

    // 7. Calculate duration
    const duration_seconds = (Date.now() - startTime) / 1000

    // 8. Create sync history record
    await createSyncHistoryRecord(integrationConfigId, metrics, errors, duration_seconds)

    // 9. Return result
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
    await createSyncHistoryRecord(
      integrationConfigId,
      metrics,
      [{ computer_id: -1, error: errorMessage }],
      duration_seconds,
      'failed'
    )

    throw error
  }
}

/**
 * Sync a single computer from JAMF to M.O.S.S.
 */
async function syncSingleComputer(
  computer: JamfComputerInventory,
  integrationConfigId: string,
  createMissingLocations: boolean,
  updateExisting: boolean
): Promise<void> {
  // Extract fields from JAMF computer
  const serialNumber = computer.hardware?.serialNumber
  const hostname = computer.general?.name
  const model = computer.hardware?.model || computer.hardware?.modelIdentifier
  const manufacturer = computer.hardware?.make || 'Apple'
  const assetTag = computer.general?.assetTag
  const macAddress = computer.hardware?.macAddress
  const altMacAddress = computer.hardware?.altMacAddress

  if (!serialNumber) {
    throw new Error('Computer missing serial number')
  }

  // Check if device already exists
  const existingDevice = await query(
    'SELECT id, updated_at FROM devices WHERE serial_number = $1',
    [serialNumber]
  )

  let deviceId: string

  if (existingDevice.rows.length > 0) {
    // Device exists - update it
    deviceId = existingDevice.rows[0].id

    if (!updateExisting) {
      // Skip update if disabled
      return
    }

    // Handle user assignment
    let assignedToPersonId: string | null = null
    if (computer.userAndLocation?.email) {
      assignedToPersonId = await findOrCreatePerson(computer.userAndLocation)
    }

    // Handle location
    let locationId: string | null = null
    let roomId: string | null = null
    if (computer.userAndLocation?.buildingId || computer.userAndLocation?.room) {
      const locationInfo = await findOrCreateLocation(
        computer.userAndLocation.buildingId,
        computer.userAndLocation.room,
        createMissingLocations
      )
      locationId = locationInfo.locationId
      roomId = locationInfo.roomId
    }

    // Update device
    await query(
      `UPDATE devices
       SET hostname = $1,
           model = $2,
           manufacturer = $3,
           asset_tag = $4,
           assigned_to_person_id = $5,
           location_id = $6,
           room_id = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [hostname, model, manufacturer, assetTag, assignedToPersonId, locationId, roomId, deviceId]
    )
  } else {
    // Device doesn't exist - create it
    const assignedToPersonId = computer.userAndLocation?.email
      ? await findOrCreatePerson(computer.userAndLocation)
      : null

    const locationInfo = await findOrCreateLocation(
      computer.userAndLocation?.buildingId,
      computer.userAndLocation?.room,
      createMissingLocations
    )

    // Determine device type (Laptop vs Workstation based on model)
    const deviceType = model?.toLowerCase().includes('macbook') ? 'Laptop' : 'Workstation'

    const insertResult = await query(
      `INSERT INTO devices (
        hostname,
        serial_number,
        model,
        manufacturer,
        device_type,
        asset_tag,
        assigned_to_person_id,
        location_id,
        room_id,
        status,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        hostname,
        serialNumber,
        model,
        manufacturer,
        deviceType,
        assetTag,
        assignedToPersonId,
        locationInfo.locationId,
        locationInfo.roomId,
        'Active',
        'Synced from JAMF Pro',
      ]
    )

    deviceId = insertResult.rows[0].id
  }

  // Create/update MAC address IO objects
  if (macAddress) {
    await createOrUpdateIOForDevice(deviceId, macAddress, 'ethernet', 'Primary Ethernet')
  }
  if (altMacAddress && altMacAddress !== macAddress) {
    await createOrUpdateIOForDevice(deviceId, altMacAddress, 'wifi', 'WiFi/Bluetooth')
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
      computer.id.toString(),
      'computer',
      deviceId,
      'device',
      JSON.stringify(computer),
    ]
  )
}

/**
 * Find or create a person from JAMF user location data
 */
async function findOrCreatePerson(userLocation: {
  email?: string
  username?: string
  realname?: string
  phone?: string
  position?: string
}): Promise<string> {
  const email = userLocation.email
  const username = userLocation.username
  const fullName = userLocation.realname
  const phone = userLocation.phone
  const jobTitle = userLocation.position

  if (!email && !username) {
    throw new Error('User must have email or username')
  }

  // Try to find existing person
  const existing = await query('SELECT id FROM people WHERE email_address = $1 OR username = $2', [
    email,
    username,
  ])

  if (existing.rows.length > 0) {
    // Person exists - optionally update contact info
    const personId = existing.rows[0].id

    await query(
      `UPDATE people
       SET email_address = COALESCE($1, email_address),
           phone_number = COALESCE($2, phone_number),
           job_title = COALESCE($3, job_title),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [email, phone, jobTitle, personId]
    )

    return personId
  }

  // Create new person
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
    [username || email, fullName, email, phone, jobTitle, 'Imported from JAMF Pro']
  )

  return insertResult.rows[0].id
}

/**
 * Find or create location and room
 */
async function findOrCreateLocation(
  buildingId: string | undefined,
  roomName: string | undefined,
  createMissing: boolean
): Promise<{ locationId: string | null; roomId: string | null }> {
  if (!buildingId && !roomName) {
    return { locationId: null, roomId: null }
  }

  let locationId: string | null = null
  let roomId: string | null = null

  // Find or create location
  if (buildingId) {
    const existingLocation = await query('SELECT id FROM locations WHERE name = $1', [buildingId])

    if (existingLocation.rows.length > 0) {
      locationId = existingLocation.rows[0].id
    } else if (createMissing) {
      const insertResult = await query(
        'INSERT INTO locations (name, notes) VALUES ($1, $2) RETURNING id',
        [buildingId, 'Auto-created from JAMF sync']
      )
      locationId = insertResult.rows[0].id
    }
  }

  // Find or create room
  if (roomName && locationId) {
    const existingRoom = await query('SELECT id FROM rooms WHERE name = $1 AND location_id = $2', [
      roomName,
      locationId,
    ])

    if (existingRoom.rows.length > 0) {
      roomId = existingRoom.rows[0].id
    } else if (createMissing) {
      const insertResult = await query(
        'INSERT INTO rooms (name, location_id, notes) VALUES ($1, $2, $3) RETURNING id',
        [roomName, locationId, 'Auto-created from JAMF sync']
      )
      roomId = insertResult.rows[0].id
    }
  }

  return { locationId, roomId }
}

/**
 * Create or update IO object for device MAC address
 */
async function createOrUpdateIOForDevice(
  deviceId: string,
  macAddress: string,
  interfaceType: string,
  label: string
): Promise<void> {
  // Check if IO already exists for this device and MAC
  const existing = await query(
    `SELECT id FROM ios
     WHERE device_id = $1
     AND mac_address = $2`,
    [deviceId, macAddress]
  )

  if (existing.rows.length > 0) {
    // Update existing IO
    await query(
      `UPDATE ios
       SET interface_type = $1,
           label = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [interfaceType, label, existing.rows[0].id]
    )
  } else {
    // Create new IO
    await query(
      `INSERT INTO ios (
        device_id,
        interface_type,
        label,
        mac_address,
        status
      ) VALUES ($1, $2, $3, $4, $5)`,
      [deviceId, interfaceType, label, macAddress, 'Active']
    )
  }
}

/**
 * Create sync history record
 */
async function createSyncHistoryRecord(
  integrationConfigId: string,
  metrics: SyncMetrics,
  errors: Array<{ computer_id: number; error: string }>,
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
