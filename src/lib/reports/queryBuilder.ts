/**
 * Report Query Builder
 * Dynamically generates SQL queries from report configurations
 * with security safeguards against SQL injection
 */

import { Pool } from 'pg'
import type {
  CustomReport,
  FilterCondition,
  AggregationConfig,
  SortConfig,
} from '@/lib/schemas/reports'

// Database connection (uses environment variables)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

/**
 * Field whitelist per object type
 * Only these fields can be queried - prevents SQL injection
 */
const FIELD_WHITELIST: Record<string, string[]> = {
  device: [
    'id',
    'hostname',
    'device_type',
    'manufacturer',
    'model',
    'serial_number',
    'asset_tag',
    'purchase_date',
    'warranty_expiration',
    'install_date',
    'status',
    'operating_system',
    'os_version',
    'last_audit_date',
    'notes',
    'location_id',
    'room_id',
    'assigned_to_id',
    'parent_device_id',
    'created_at',
    'updated_at',
  ],
  person: [
    'id',
    'full_name',
    'email',
    'username',
    'employee_id',
    'person_type',
    'department',
    'job_title',
    'phone',
    'mobile',
    'start_date',
    'status',
    'location_id',
    'company_id',
    'manager_id',
    'created_at',
    'updated_at',
  ],
  location: [
    'id',
    'location_name',
    'address',
    'city',
    'state',
    'zip',
    'country',
    'location_type',
    'timezone',
    'contact_phone',
    'access_instructions',
    'notes',
    'company_id',
    'created_at',
    'updated_at',
  ],
  room: [
    'id',
    'room_name',
    'room_number',
    'room_type',
    'floor',
    'capacity',
    'access_requirements',
    'notes',
    'location_id',
    'created_at',
    'updated_at',
  ],
  company: [
    'id',
    'company_name',
    'company_type',
    'website',
    'phone',
    'email',
    'address',
    'city',
    'state',
    'zip',
    'country',
    'account_number',
    'support_url',
    'support_phone',
    'support_email',
    'tax_id',
    'notes',
    'created_at',
    'updated_at',
  ],
  network: [
    'id',
    'network_name',
    'network_address',
    'vlan_id',
    'network_type',
    'gateway',
    'dns_servers',
    'dhcp_enabled',
    'dhcp_range_start',
    'dhcp_range_end',
    'description',
    'notes',
    'location_id',
    'parent_network_id',
    'created_at',
    'updated_at',
  ],
  io: [
    'id',
    'interface_name',
    'interface_type',
    'media_type',
    'status',
    'speed',
    'duplex',
    'trunk_mode',
    'port_number',
    'mac_address',
    'voltage',
    'amperage',
    'wattage',
    'power_connector_type',
    'description',
    'notes',
    'device_id',
    'room_id',
    'native_network_id',
    'connected_to_io_id',
    'created_at',
    'updated_at',
  ],
  ip_address: [
    'id',
    'ip_address',
    'ip_version',
    'type',
    'dns_name',
    'assignment_date',
    'notes',
    'io_id',
    'network_id',
    'created_at',
    'updated_at',
  ],
  software: [
    'id',
    'product_name',
    'description',
    'website',
    'software_category',
    'notes',
    'company_id',
    'created_at',
    'updated_at',
  ],
  saas_service: [
    'id',
    'service_name',
    'service_url',
    'account_id',
    'environment',
    'status',
    'subscription_start',
    'subscription_end',
    'seat_count',
    'cost',
    'billing_frequency',
    'criticality',
    'sso_provider',
    'sso_protocol',
    'scim_enabled',
    'provisioning_type',
    'api_access_enabled',
    'api_documentation_url',
    'notes',
    'software_id',
    'company_id',
    'business_owner_id',
    'technical_contact_id',
    'created_at',
    'updated_at',
  ],
  installed_application: [
    'id',
    'application_name',
    'version',
    'install_method',
    'deployment_platform',
    'package_id',
    'deployment_status',
    'install_date',
    'auto_update_enabled',
    'notes',
    'software_id',
    'created_at',
    'updated_at',
  ],
  software_license: [
    'id',
    'license_key',
    'license_type',
    'purchase_date',
    'expiration_date',
    'seat_count',
    'seats_used',
    'cost',
    'renewal_date',
    'auto_renew',
    'notes',
    'software_id',
    'purchased_from_id',
    'created_at',
    'updated_at',
  ],
  document: [
    'id',
    'title',
    'document_type',
    'content',
    'version',
    'status',
    'created_date',
    'updated_date',
    'notes',
    'author_id',
    'created_at',
    'updated_at',
  ],
  external_document: [
    'id',
    'title',
    'document_type',
    'url',
    'description',
    'notes',
    'created_date',
    'updated_date',
    'created_at',
    'updated_at',
  ],
  contract: [
    'id',
    'contract_name',
    'contract_number',
    'contract_type',
    'start_date',
    'end_date',
    'cost',
    'billing_frequency',
    'auto_renew',
    'renewal_notice_days',
    'terms',
    'notes',
    'company_id',
    'created_at',
    'updated_at',
  ],
  group: [
    'id',
    'group_name',
    'group_type',
    'description',
    'group_id_external',
    'created_date',
    'notes',
    'created_at',
    'updated_at',
  ],
}

/**
 * Table name mapping (singular to plural)
 */
const TABLE_NAMES: Record<string, string> = {
  device: 'devices',
  person: 'people',
  location: 'locations',
  room: 'rooms',
  company: 'companies',
  network: 'networks',
  io: 'ios',
  ip_address: 'ip_addresses',
  software: 'software',
  saas_service: 'saas_services',
  installed_application: 'installed_applications',
  software_license: 'software_licenses',
  document: 'documents',
  external_document: 'external_documents',
  contract: 'contracts',
  group: 'groups',
}

/**
 * Validate field against whitelist
 */
function validateField(objectType: string, fieldName: string): boolean {
  const allowedFields = FIELD_WHITELIST[objectType]
  if (!allowedFields) {
    throw new Error(`Invalid object type: ${objectType}`)
  }
  return allowedFields.includes(fieldName)
}

/**
 * Build WHERE clause from filter conditions
 */
function buildWhereClause(
  filter: FilterCondition | null | undefined,
  objectType: string,
  params: unknown[]
): string {
  if (!filter) {
    return ''
  }

  if (filter.type === 'condition') {
    // Single condition
    if (!filter.field || !filter.operator) {
      return ''
    }

    // Validate field
    if (!validateField(objectType, filter.field)) {
      throw new Error(`Invalid field: ${filter.field}`)
    }

    const paramIndex = params.length + 1

    switch (filter.operator) {
      case 'equals':
        params.push(filter.value)
        return `${filter.field} = $${paramIndex}`

      case 'not_equals':
        params.push(filter.value)
        return `${filter.field} != $${paramIndex}`

      case 'contains':
        params.push(`%${filter.value}%`)
        return `${filter.field}::text ILIKE $${paramIndex}`

      case 'not_contains':
        params.push(`%${filter.value}%`)
        return `${filter.field}::text NOT ILIKE $${paramIndex}`

      case 'starts_with':
        params.push(`${filter.value}%`)
        return `${filter.field}::text ILIKE $${paramIndex}`

      case 'ends_with':
        params.push(`%${filter.value}`)
        return `${filter.field}::text ILIKE $${paramIndex}`

      case 'greater_than':
        params.push(filter.value)
        return `${filter.field} > $${paramIndex}`

      case 'less_than':
        params.push(filter.value)
        return `${filter.field} < $${paramIndex}`

      case 'greater_than_or_equal':
        params.push(filter.value)
        return `${filter.field} >= $${paramIndex}`

      case 'less_than_or_equal':
        params.push(filter.value)
        return `${filter.field} <= $${paramIndex}`

      case 'between':
        if (Array.isArray(filter.value) && filter.value.length === 2) {
          params.push(filter.value[0], filter.value[1])
          return `${filter.field} BETWEEN $${paramIndex} AND $${paramIndex + 1}`
        }
        return ''

      case 'in_list':
        if (Array.isArray(filter.value) && filter.value.length > 0) {
          params.push(filter.value)
          return `${filter.field} = ANY($${paramIndex})`
        }
        return ''

      case 'not_in_list':
        if (Array.isArray(filter.value) && filter.value.length > 0) {
          params.push(filter.value)
          return `${filter.field} != ALL($${paramIndex})`
        }
        return ''

      case 'is_null':
        return `${filter.field} IS NULL`

      case 'is_not_null':
        return `${filter.field} IS NOT NULL`

      default:
        return ''
    }
  } else if (filter.type === 'group') {
    // Group of conditions
    if (!filter.conditions || filter.conditions.length === 0) {
      return ''
    }

    const clauses = filter.conditions
      .map((condition) => buildWhereClause(condition, objectType, params))
      .filter((clause) => clause.length > 0)

    if (clauses.length === 0) {
      return ''
    }

    const operator = filter.logicalOperator || 'AND'
    return `(${clauses.join(` ${operator} `)})`
  }

  return ''
}

/**
 * Build SELECT clause from fields and aggregations
 */
function buildSelectClause(
  fields: string[],
  objectType: string,
  aggregations?: AggregationConfig[] | null,
  grouping?: string[] | null
): string {
  // Validate all fields
  for (const field of fields) {
    if (!validateField(objectType, field)) {
      throw new Error(`Invalid field: ${field}`)
    }
  }

  if (aggregations && aggregations.length > 0) {
    // Aggregation query
    const selectParts: string[] = []

    // Add grouping fields
    if (grouping && grouping.length > 0) {
      for (const field of grouping) {
        if (!validateField(objectType, field)) {
          throw new Error(`Invalid grouping field: ${field}`)
        }
        selectParts.push(field)
      }
    }

    // Add aggregations
    for (const agg of aggregations) {
      if (agg.field !== '*' && !validateField(objectType, agg.field)) {
        throw new Error(`Invalid aggregation field: ${agg.field}`)
      }
      const alias = agg.alias || `${agg.type.toLowerCase()}_${agg.field}`
      selectParts.push(`${agg.type}(${agg.field}) AS ${alias}`)
    }

    return selectParts.join(', ')
  } else {
    // Regular query - just select fields
    return fields.join(', ')
  }
}

/**
 * Build ORDER BY clause
 */
function buildOrderByClause(sorting: SortConfig[] | null | undefined, objectType: string): string {
  if (!sorting || sorting.length === 0) {
    return ''
  }

  const sortParts = sorting
    .map((sort) => {
      if (!validateField(objectType, sort.field)) {
        throw new Error(`Invalid sort field: ${sort.field}`)
      }
      return `${sort.field} ${sort.direction}`
    })
    .filter((part) => part.length > 0)

  return sortParts.length > 0 ? `ORDER BY ${sortParts.join(', ')}` : ''
}

/**
 * Execute report query
 */
export async function executeReport(
  reportConfig: Omit<
    CustomReport,
    'id' | 'created_by' | 'created_at' | 'updated_at' | 'last_run_at'
  >,
  pagination?: { page: number; pageSize: number }
): Promise<{ data: unknown[]; total: number; executionTime: number }> {
  const startTime = Date.now()
  const tableName = TABLE_NAMES[reportConfig.object_type]
  const params: unknown[] = []

  // Build SELECT clause
  const selectClause = buildSelectClause(
    reportConfig.fields,
    reportConfig.object_type,
    reportConfig.aggregations,
    reportConfig.grouping
  )

  // Build WHERE clause
  const whereClause = buildWhereClause(reportConfig.filters, reportConfig.object_type, params)

  // Build GROUP BY clause
  let groupByClause = ''
  if (reportConfig.grouping && reportConfig.grouping.length > 0) {
    groupByClause = `GROUP BY ${reportConfig.grouping.join(', ')}`
  }

  // Build ORDER BY clause
  const orderByClause = buildOrderByClause(reportConfig.sorting, reportConfig.object_type)

  // Build pagination
  let paginationClause = ''
  if (pagination) {
    const offset = (pagination.page - 1) * pagination.pageSize
    params.push(pagination.pageSize, offset)
    paginationClause = `LIMIT $${params.length - 1} OFFSET $${params.length}`
  }

  // Construct final query
  const query = `
    SELECT ${selectClause}
    FROM ${tableName}
    ${whereClause ? `WHERE ${whereClause}` : ''}
    ${groupByClause}
    ${orderByClause}
    ${paginationClause}
  `.trim()

  // Get total count (without pagination)
  const countQuery = `
    SELECT COUNT(*) as total
    FROM ${tableName}
    ${whereClause ? `WHERE ${whereClause}` : ''}
  `.trim()

  try {
    // Execute both queries in parallel
    const [dataResult, countResult] = await Promise.all([
      pool.query(query, params.slice(0, params.length - (pagination ? 2 : 0))),
      pool.query(countQuery, params.slice(0, params.length - (pagination ? 2 : 0))),
    ])

    const executionTime = Date.now() - startTime

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
      executionTime,
    }
  } catch (error) {
    console.error('Report execution error:', error)
    throw new Error(
      `Failed to execute report: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1')
    return result.rowCount === 1
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

/**
 * Close database pool (for cleanup)
 */
export async function closePool(): Promise<void> {
  await pool.end()
}
