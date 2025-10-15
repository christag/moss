/**
 * Device Matching Service
 *
 * Finds potential duplicate devices based on various identifiers
 * with confidence scoring for data integration/deduplication.
 */

import { query } from './db'

interface DeviceRow {
  id: string
  hostname: string | null
  manufacturer: string | null
  model: string | null
  serial_number: string | null
  asset_tag: string | null
  device_type?: string | null
  ip_address?: string | null
  mac_address?: string | null
}

export interface DeviceMatch {
  device_id: string
  hostname: string | null
  manufacturer: string | null
  model: string | null
  serial_number: string | null
  asset_tag: string | null
  confidence: number
  confidence_level: 'definite' | 'high' | 'medium' | 'low'
  matching_fields: string[]
  match_reason: string
}

export interface MatchResult {
  device_id: string
  matches: DeviceMatch[]
  has_matches: boolean
  highest_confidence: number | null
}

/**
 * Find potential duplicate devices for a given device
 */
export async function findPotentialDuplicates(deviceId: string): Promise<MatchResult> {
  // Get the source device
  const deviceResult = await query<DeviceRow>(
    `SELECT 
      id, hostname, manufacturer, model, serial_number, asset_tag,
      device_type, ip_address, mac_address
    FROM devices 
    WHERE id = $1`,
    [deviceId]
  )

  if (deviceResult.rows.length === 0) {
    return {
      device_id: deviceId,
      matches: [],
      has_matches: false,
      highest_confidence: null,
    }
  }

  const device = deviceResult.rows[0]
  const matches: DeviceMatch[] = []

  // ============================================================================
  // 1. DEFINITE MATCHES: Serial Number or Asset Tag
  // ============================================================================
  if (device.serial_number) {
    const serialMatches = await query<DeviceRow>(
      `SELECT 
        id, hostname, manufacturer, model, serial_number, asset_tag
      FROM devices 
      WHERE serial_number = $1 
        AND id != $2
        AND serial_number IS NOT NULL
        AND serial_number != ''`,
      [device.serial_number, deviceId]
    )

    for (const match of serialMatches.rows) {
      matches.push({
        device_id: match.id,
        hostname: match.hostname,
        manufacturer: match.manufacturer,
        model: match.model,
        serial_number: match.serial_number,
        asset_tag: match.asset_tag,
        confidence: 100,
        confidence_level: 'definite',
        matching_fields: ['serial_number'],
        match_reason: `Serial number matches: ${device.serial_number}`,
      })
    }
  }

  if (device.asset_tag) {
    const assetMatches = await query<DeviceRow>(
      `SELECT 
        id, hostname, manufacturer, model, serial_number, asset_tag
      FROM devices 
      WHERE asset_tag = $1 
        AND id != $2
        AND asset_tag IS NOT NULL
        AND asset_tag != ''
        AND id NOT IN (${matches.map((m) => `'${m.device_id}'`).join(',') || "''"})`,
      [device.asset_tag, deviceId]
    )

    for (const match of assetMatches.rows) {
      matches.push({
        device_id: match.id,
        hostname: match.hostname,
        manufacturer: match.manufacturer,
        model: match.model,
        serial_number: match.serial_number,
        asset_tag: match.asset_tag,
        confidence: 100,
        confidence_level: 'definite',
        matching_fields: ['asset_tag'],
        match_reason: `Asset tag matches: ${device.asset_tag}`,
      })
    }
  }

  // ============================================================================
  // 2. HIGH CONFIDENCE: MAC Address Match (via device_interfaces table)
  // ============================================================================
  // Note: Checking if device_interfaces table exists first
  try {
    const macMatches = await query<DeviceRow & { mac_address: string }>(
      `SELECT DISTINCT
        d.id, d.hostname, d.manufacturer, d.model, d.serial_number, d.asset_tag,
        di.mac_address
      FROM devices d
      INNER JOIN device_interfaces di ON d.id = di.device_id
      WHERE di.mac_address = $1
        AND d.id != $2
        AND di.mac_address IS NOT NULL
        AND di.mac_address != ''`,
      [device.mac_address, deviceId]
    )

    const existingIds = new Set(matches.map((m) => m.device_id))
    for (const match of macMatches.rows) {
      if (!existingIds.has(match.id)) {
        matches.push({
          device_id: match.id,
          hostname: match.hostname,
          manufacturer: match.manufacturer,
          model: match.model,
          serial_number: match.serial_number,
          asset_tag: match.asset_tag,
          confidence: 90,
          confidence_level: 'high',
          matching_fields: ['mac_address'],
          match_reason: `MAC address matches: ${match.mac_address}`,
        })
      }
    }
  } catch {
    // device_interfaces table might not exist yet, skip MAC matching
    console.log('[DeviceMatching] Skipping MAC address matching - table may not exist')
  }

  // Also check the devices.mac_address field directly (legacy)
  if (device.mac_address) {
    const directMacMatches = await query<DeviceRow>(
      `SELECT 
        id, hostname, manufacturer, model, serial_number, asset_tag, mac_address
      FROM devices 
      WHERE mac_address = $1 
        AND id != $2
        AND mac_address IS NOT NULL
        AND mac_address != ''`,
      [device.mac_address, deviceId]
    )

    const existingIds = new Set(matches.map((m) => m.device_id))
    for (const match of directMacMatches.rows) {
      if (!existingIds.has(match.id)) {
        matches.push({
          device_id: match.id,
          hostname: match.hostname,
          manufacturer: match.manufacturer,
          model: match.model,
          serial_number: match.serial_number,
          asset_tag: match.asset_tag,
          confidence: 90,
          confidence_level: 'high',
          matching_fields: ['mac_address'],
          match_reason: `MAC address matches: ${match.mac_address}`,
        })
      }
    }
  }

  // ============================================================================
  // 3. MEDIUM CONFIDENCE: Hostname + (Manufacturer OR Model)
  // ============================================================================
  if (device.hostname && (device.manufacturer || device.model)) {
    let whereConditions = ['hostname = $1', 'id != $2']
    const params: (string | null)[] = [device.hostname, deviceId]
    let paramCount = 3

    if (device.manufacturer) {
      whereConditions.push(`manufacturer = $${paramCount}`)
      params.push(device.manufacturer)
      paramCount++
    }

    if (device.model) {
      whereConditions.push(`model = $${paramCount}`)
      params.push(device.model)
    }

    const hostnameMatches = await query<DeviceRow>(
      `SELECT 
        id, hostname, manufacturer, model, serial_number, asset_tag
      FROM devices 
      WHERE ${whereConditions.join(' AND ')}
        AND hostname IS NOT NULL
        AND hostname != ''`,
      params
    )

    const existingIds = new Set(matches.map((m) => m.device_id))
    for (const match of hostnameMatches.rows) {
      if (!existingIds.has(match.id)) {
        const matchingFields = ['hostname']
        if (device.manufacturer === match.manufacturer) matchingFields.push('manufacturer')
        if (device.model === match.model) matchingFields.push('model')

        const confidence = matchingFields.length === 3 ? 75 : 65

        matches.push({
          device_id: match.id,
          hostname: match.hostname,
          manufacturer: match.manufacturer,
          model: match.model,
          serial_number: match.serial_number,
          asset_tag: match.asset_tag,
          confidence,
          confidence_level: 'medium',
          matching_fields: matchingFields,
          match_reason: `Matching ${matchingFields.join(', ')}`,
        })
      }
    }
  }

  // ============================================================================
  // 4. LOW CONFIDENCE: Same Model + Manufacturer (potential duplicates)
  // ============================================================================
  if (device.manufacturer && device.model) {
    const modelMatches = await query<DeviceRow>(
      `SELECT 
        id, hostname, manufacturer, model, serial_number, asset_tag
      FROM devices 
      WHERE manufacturer = $1
        AND model = $2
        AND id != $3
        AND manufacturer IS NOT NULL
        AND model IS NOT NULL`,
      [device.manufacturer, device.model, deviceId]
    )

    const existingIds = new Set(matches.map((m) => m.device_id))
    for (const match of modelMatches.rows) {
      if (!existingIds.has(match.id)) {
        // Lower confidence if they have different hostnames
        const confidence =
          device.hostname && match.hostname && device.hostname !== match.hostname ? 45 : 55

        matches.push({
          device_id: match.id,
          hostname: match.hostname,
          manufacturer: match.manufacturer,
          model: match.model,
          serial_number: match.serial_number,
          asset_tag: match.asset_tag,
          confidence,
          confidence_level: 'low',
          matching_fields: ['manufacturer', 'model'],
          match_reason: `Same model (${device.manufacturer} ${device.model}) - no unique identifiers`,
        })
      }
    }
  }

  // Sort by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence)

  return {
    device_id: deviceId,
    matches,
    has_matches: matches.length > 0,
    highest_confidence: matches.length > 0 ? matches[0].confidence : null,
  }
}

/**
 * Find all devices with potential duplicates in the system
 */
export async function findAllDevicesWithDuplicates(): Promise<
  Array<{
    device_id: string
    hostname: string | null
    match_count: number
    highest_confidence: number
  }>
> {
  const devicesResult = await query<{ id: string; hostname: string | null }>(
    `SELECT id, hostname FROM devices ORDER BY hostname`
  )

  const devicesWithMatches = []

  for (const device of devicesResult.rows) {
    const result = await findPotentialDuplicates(device.id)
    if (result.has_matches && result.highest_confidence && result.highest_confidence >= 60) {
      devicesWithMatches.push({
        device_id: device.id,
        hostname: device.hostname,
        match_count: result.matches.length,
        highest_confidence: result.highest_confidence,
      })
    }
  }

  return devicesWithMatches
}
