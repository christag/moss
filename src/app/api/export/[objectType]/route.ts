/**
 * Export API Route
 * Handles CSV export for any object type with query filtering
 * GET /api/export/[objectType]?[filters]
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { exportToCSV, ExportColumn, formatDate, formatDateTime } from '@/lib/bulk/csvExport'
import { errorResponse } from '@/lib/api'

/**
 * Object type configuration for exports
 * Defines table names, columns, and formatters
 */
const EXPORT_CONFIGS: Record<
  string,
  {
    table: string
    columns: ExportColumn[]
    defaultFilename: string
  }
> = {
  devices: {
    table: 'devices',
    defaultFilename: 'devices-export',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'hostname', label: 'Hostname' },
      { key: 'device_type', label: 'Device Type' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'model', label: 'Model' },
      { key: 'serial_number', label: 'Serial Number' },
      { key: 'asset_tag', label: 'Asset Tag' },
      { key: 'status', label: 'Status' },
      { key: 'operating_system', label: 'Operating System' },
      { key: 'os_version', label: 'OS Version' },
      { key: 'purchase_date', label: 'Purchase Date', format: formatDate },
      { key: 'warranty_expiration', label: 'Warranty Expiration', format: formatDate },
      { key: 'install_date', label: 'Install Date', format: formatDate },
      { key: 'last_audit_date', label: 'Last Audit', format: formatDate },
      { key: 'location_id', label: 'Location ID' },
      { key: 'room_id', label: 'Room ID' },
      { key: 'company_id', label: 'Company ID' },
      { key: 'assigned_to_id', label: 'Assigned To ID' },
      { key: 'parent_device_id', label: 'Parent Device ID' },
      { key: 'notes', label: 'Notes' },
      { key: 'created_at', label: 'Created At', format: formatDateTime },
      { key: 'updated_at', label: 'Updated At', format: formatDateTime },
    ],
  },
  people: {
    table: 'people',
    defaultFilename: 'people-export',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'person_type', label: 'Type' },
      { key: 'title', label: 'Title' },
      { key: 'department', label: 'Department' },
      { key: 'location_id', label: 'Location ID' },
      { key: 'room_id', label: 'Room ID' },
      { key: 'manager_id', label: 'Manager ID' },
      { key: 'company_id', label: 'Company ID' },
      { key: 'start_date', label: 'Start Date', format: formatDate },
      { key: 'end_date', label: 'End Date', format: formatDate },
      { key: 'notes', label: 'Notes' },
      { key: 'created_at', label: 'Created At', format: formatDateTime },
      { key: 'updated_at', label: 'Updated At', format: formatDateTime },
    ],
  },
  locations: {
    table: 'locations',
    defaultFilename: 'locations-export',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'location_name', label: 'Location Name' },
      { key: 'location_type', label: 'Type' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'state_province', label: 'State/Province' },
      { key: 'postal_code', label: 'Postal Code' },
      { key: 'country', label: 'Country' },
      { key: 'latitude', label: 'Latitude' },
      { key: 'longitude', label: 'Longitude' },
      { key: 'notes', label: 'Notes' },
      { key: 'created_at', label: 'Created At', format: formatDateTime },
      { key: 'updated_at', label: 'Updated At', format: formatDateTime },
    ],
  },
  rooms: {
    table: 'rooms',
    defaultFilename: 'rooms-export',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'location_id', label: 'Location ID' },
      { key: 'room_name', label: 'Room Name' },
      { key: 'room_number', label: 'Room Number' },
      { key: 'room_type', label: 'Type' },
      { key: 'floor', label: 'Floor' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'notes', label: 'Notes' },
      { key: 'created_at', label: 'Created At', format: formatDateTime },
      { key: 'updated_at', label: 'Updated At', format: formatDateTime },
    ],
  },
  companies: {
    table: 'companies',
    defaultFilename: 'companies-export',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'company_name', label: 'Company Name' },
      { key: 'company_type', label: 'Type' },
      { key: 'website', label: 'Website' },
      { key: 'primary_contact_id', label: 'Primary Contact ID' },
      { key: 'notes', label: 'Notes' },
      { key: 'created_at', label: 'Created At', format: formatDateTime },
      { key: 'updated_at', label: 'Updated At', format: formatDateTime },
    ],
  },
  networks: {
    table: 'networks',
    defaultFilename: 'networks-export',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'network_name', label: 'Network Name' },
      { key: 'vlan_id', label: 'VLAN ID' },
      { key: 'subnet', label: 'Subnet' },
      { key: 'gateway', label: 'Gateway' },
      { key: 'dns_servers', label: 'DNS Servers' },
      { key: 'dhcp_enabled', label: 'DHCP Enabled' },
      { key: 'network_type', label: 'Type' },
      { key: 'location_id', label: 'Location ID' },
      { key: 'notes', label: 'Notes' },
      { key: 'created_at', label: 'Created At', format: formatDateTime },
      { key: 'updated_at', label: 'Updated At', format: formatDateTime },
    ],
  },
}

/**
 * GET /api/export/[objectType]
 * Export object data to CSV with optional filtering
 *
 * Query params: Same as list endpoints (search, filters, etc.)
 * Response: CSV file download
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ objectType: string }> }
) {
  try {
    const { objectType } = await params

    // 1. Validate object type
    const config = EXPORT_CONFIGS[objectType]
    if (!config) {
      return errorResponse(
        `Invalid object type: ${objectType}. Supported types: ${Object.keys(EXPORT_CONFIGS).join(', ')}`,
        null,
        400
      )
    }

    // 2. Build query with filters from URL params
    const searchParams = request.nextUrl.searchParams
    const whereConditions: string[] = []
    const queryParams: unknown[] = []
    let paramIndex = 1

    // Extract all query params and build WHERE clause
    // This is a simplified version - in production, you'd want more robust filtering
    for (const [key, value] of searchParams.entries()) {
      if (key === 'limit' || key === 'page' || key === 'sort_by' || key === 'sort_order') {
        continue // Skip pagination/sorting params
      }

      if (key === 'search') {
        // Generic search across text fields
        const searchableColumns = config.columns
          .filter((col) => !col.key.includes('_id') && !col.key.includes('_at'))
          .map((col) => col.key)

        if (searchableColumns.length > 0) {
          const searchConditions = searchableColumns.map((col) => {
            const condition = `${col}::text ILIKE $${paramIndex}`
            queryParams.push(`%${value}%`)
            paramIndex++
            return condition
          })
          whereConditions.push(`(${searchConditions.join(' OR ')})`)
        }
      } else {
        // Exact match filter
        whereConditions.push(`${key} = $${paramIndex}`)
        queryParams.push(value)
        paramIndex++
      }
    }

    // 3. Execute query
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    const sql = `SELECT * FROM ${config.table} ${whereClause} ORDER BY created_at DESC`

    const result = await query(sql, queryParams)

    // 4. Convert to CSV
    const csv = exportToCSV(result.rows, {
      columns: config.columns,
      filename: config.defaultFilename,
    })

    // 5. Return CSV as downloadable file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="${config.defaultFilename}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return errorResponse('Failed to export data', error, 500)
  }
}
