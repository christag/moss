/**
 * Document-SaaS Service Association API Routes
 * Handles associating documents with SaaS services
 */
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { parseRequestBody } from '@/lib/api'
import type { SaaSService } from '@/types'

/**
 * GET /api/documents/[id]/saas-services
 * Get all SaaS services associated with a document
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    // Verify document exists
    const docCheck = await query('SELECT id FROM documents WHERE id = $1', [id])
    if (docCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document not found',
        },
        { status: 404 }
      )
    }

    // Fetch associated SaaS services
    const result = await query<SaaSService>(
      `
      SELECT s.*
      FROM saas_services s
      INNER JOIN document_saas_services ds ON ds.service_id = s.id
      WHERE ds.document_id = $1
      ORDER BY s.service_name ASC
    `,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
      message: 'Associated SaaS services retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching associated SaaS services:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch associated SaaS services',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents/[id]/saas-services
 * Associate a SaaS service with a document
 * Body: { saas_service_id: string }
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: document_id } = await context.params

    // Parse request body with JSON error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }
    const body = parseResult.data as Record<string, unknown>

    if (!body.saas_service_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'saas_service_id is required',
        },
        { status: 400 }
      )
    }

    const saas_service_id = body.saas_service_id

    // Verify document exists
    const docCheck = await query('SELECT id FROM documents WHERE id = $1', [document_id])
    if (docCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document not found',
        },
        { status: 404 }
      )
    }

    // Verify SaaS service exists
    const serviceCheck = await query('SELECT id FROM saas_services WHERE id = $1', [
      saas_service_id,
    ])
    if (serviceCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'SaaS service not found',
        },
        { status: 404 }
      )
    }

    // Check if already associated
    const existingCheck = await query(
      'SELECT 1 FROM document_saas_services WHERE document_id = $1 AND service_id = $2',
      [document_id, saas_service_id]
    )

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'SaaS service is already associated with this document',
        },
        { status: 409 }
      )
    }

    // Create association
    await query('INSERT INTO document_saas_services (document_id, service_id) VALUES ($1, $2)', [
      document_id,
      saas_service_id,
    ])

    // Return the service details
    const serviceResult = await query<SaaSService>('SELECT * FROM saas_services WHERE id = $1', [
      saas_service_id,
    ])

    return NextResponse.json({
      success: true,
      data: serviceResult.rows[0],
      message: 'SaaS service associated with document successfully',
    })
  } catch (error) {
    console.error('Error associating SaaS service:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to associate SaaS service',
      },
      { status: 500 }
    )
  }
}
