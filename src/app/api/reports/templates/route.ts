/**
 * Report Templates API Route
 * GET /api/reports/templates - Get pre-built report templates
 */
import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api'
import { applyRateLimit } from '@/lib/rateLimitMiddleware'
import { requireApiScope } from '@/lib/apiAuth'
import type { CustomReport } from '@/lib/schemas/reports'

/**
 * Pre-built report templates
 * These are starter templates users can use to create custom reports
 */
const REPORT_TEMPLATES: Partial<CustomReport>[] = [
  {
    report_name: 'Active Devices by Location',
    description: 'List all active devices grouped by location',
    object_type: 'device',
    fields: ['hostname', 'device_type', 'manufacturer', 'model', 'status'],
    filters: {
      type: 'condition',
      field: 'status',
      operator: 'equals',
      value: 'active',
    },
    sorting: [{ field: 'hostname', direction: 'ASC' }],
  },
  {
    report_name: 'Devices with Expiring Warranties',
    description: 'Devices with warranties expiring in the next 90 days',
    object_type: 'device',
    fields: ['hostname', 'manufacturer', 'model', 'warranty_expiration'],
    filters: {
      type: 'group',
      logicalOperator: 'AND',
      conditions: [
        {
          type: 'condition',
          field: 'warranty_expiration',
          operator: 'is_not_null',
        },
        {
          type: 'condition',
          field: 'warranty_expiration',
          operator: 'less_than_or_equal',
          value: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ],
    },
    sorting: [{ field: 'warranty_expiration', direction: 'ASC' }],
  },
  {
    report_name: 'Employee Directory',
    description: 'Active employees with contact information',
    object_type: 'person',
    fields: ['full_name', 'email', 'phone', 'department', 'job_title'],
    filters: {
      type: 'group',
      logicalOperator: 'AND',
      conditions: [
        {
          type: 'condition',
          field: 'person_type',
          operator: 'equals',
          value: 'employee',
        },
        {
          type: 'condition',
          field: 'status',
          operator: 'equals',
          value: 'active',
        },
      ],
    },
    sorting: [{ field: 'full_name', direction: 'ASC' }],
  },
  {
    report_name: 'Network Inventory',
    description: 'All networks with VLAN and subnet information',
    object_type: 'network',
    fields: ['network_name', 'vlan_id', 'network_address', 'network_type', 'dhcp_enabled'],
    sorting: [{ field: 'vlan_id', direction: 'ASC' }],
  },
  {
    report_name: 'SaaS Services by Cost',
    description: 'SaaS services sorted by monthly cost',
    object_type: 'saas_service',
    fields: ['service_name', 'status', 'seat_count', 'cost', 'billing_frequency'],
    filters: {
      type: 'condition',
      field: 'status',
      operator: 'equals',
      value: 'active',
    },
    sorting: [{ field: 'cost', direction: 'DESC' }],
  },
  {
    report_name: 'Software License Utilization',
    description: 'Software licenses with seat usage statistics',
    object_type: 'software_license',
    fields: ['license_type', 'seat_count', 'seats_used', 'expiration_date'],
    sorting: [{ field: 'expiration_date', direction: 'ASC' }],
  },
  {
    report_name: 'IP Address Allocation',
    description: 'IP addresses by network and type',
    object_type: 'ip_address',
    fields: ['ip_address', 'ip_version', 'type', 'dns_name'],
    sorting: [{ field: 'ip_address', direction: 'ASC' }],
  },
  {
    report_name: 'Devices by Type Count',
    description: 'Count of devices grouped by device type',
    object_type: 'device',
    fields: ['device_type'],
    grouping: ['device_type'],
    aggregations: [
      {
        type: 'COUNT',
        field: '*',
        alias: 'device_count',
      },
    ],
    sorting: [{ field: 'device_count', direction: 'DESC' }],
  },
  {
    report_name: 'Contracts by Vendor',
    description: 'Active contracts grouped by company',
    object_type: 'contract',
    fields: ['contract_name', 'contract_type', 'start_date', 'end_date', 'cost'],
    sorting: [{ field: 'end_date', direction: 'ASC' }],
  },
  {
    report_name: 'Room Inventory by Location',
    description: 'Rooms grouped by location with capacity',
    object_type: 'room',
    fields: ['room_name', 'room_type', 'floor', 'capacity'],
    sorting: [{ field: 'room_name', direction: 'ASC' }],
  },
]

/**
 * GET /api/reports/templates
 * Get pre-built report templates
 * Requires: 'read' scope
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'read' scope
  const authResult = await requireApiScope(request, ['read'])
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const objectType = searchParams.get('object_type')

    // Filter templates by object type if specified
    let templates = REPORT_TEMPLATES
    if (objectType) {
      templates = templates.filter((t) => t.object_type === objectType)
    }

    return successResponse(
      {
        templates,
        count: templates.length,
      },
      'Report templates retrieved successfully'
    )
  } catch (error) {
    console.error('Error fetching report templates:', error)
    return errorResponse('Failed to fetch report templates', undefined, 500)
  }
}
