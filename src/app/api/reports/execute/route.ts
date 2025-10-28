/**
 * Report Execution API Route
 * POST /api/reports/execute
 * Executes a report configuration and returns results with pagination
 */
import { NextRequest, NextResponse } from 'next/server'
import { executeReport } from '@/lib/reports/queryBuilder'
import { successResponse, errorResponse, parseRequestBody } from '@/lib/api'
import { ExecuteReportSchema } from '@/lib/schemas/reports'
import { applyRateLimit } from '@/lib/rateLimitMiddleware'
import { requireApiScope } from '@/lib/apiAuth'

/**
 * POST /api/reports/execute
 * Execute a report configuration and return results
 * Requires: 'read' scope
 *
 * Request body:
 * {
 *   reportConfig: {
 *     report_name: string
 *     object_type: string
 *     fields: string[]
 *     filters?: FilterCondition
 *     grouping?: string[]
 *     aggregations?: AggregationConfig[]
 *     sorting?: SortConfig[]
 *   },
 *   pagination?: {
 *     page: number (default: 1)
 *     pageSize: number (default: 100, max: 1000)
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     results: any[]
 *     pagination: {
 *       page: number
 *       pageSize: number
 *       total: number
 *       totalPages: number
 *     },
 *     executionTime: number (ms)
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, 'api')
  if (rateLimitResult) return rateLimitResult

  // Require authentication with 'read' scope
  const authResult = await requireApiScope(request, ['read'])
  if (authResult instanceof NextResponse) return authResult

  try {
    // Parse request body
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate request body
    const validated = ExecuteReportSchema.parse(body)
    const { reportConfig, pagination } = validated

    // Execute report with query builder
    const result = await executeReport(reportConfig, pagination)

    // Calculate pagination metadata
    const page = pagination?.page || 1
    const pageSize = pagination?.pageSize || 100
    const totalPages = Math.ceil(result.total / pageSize)

    // Return results
    return successResponse(
      {
        results: result.data,
        pagination: {
          page,
          pageSize,
          total: result.total,
          totalPages,
        },
        executionTime: result.executionTime,
      },
      'Report executed successfully'
    )
  } catch (error) {
    console.error('Error executing report:', error)

    // Handle validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return errorResponse('Validation error', 'issues' in error ? error.issues : undefined, 400)
    }

    // Handle query builder errors (field validation, SQL generation)
    if (error instanceof Error) {
      if (
        error.message.includes('Invalid field') ||
        error.message.includes('Invalid object type')
      ) {
        return errorResponse(error.message, undefined, 400)
      }

      if (error.message.includes('Failed to execute report')) {
        return errorResponse(
          'Report execution failed. Please check your query configuration.',
          undefined,
          500
        )
      }
    }

    return errorResponse('Failed to execute report', undefined, 500)
  }
}
