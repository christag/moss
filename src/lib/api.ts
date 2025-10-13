/**
 * API Response Utilities
 * Standard response formatting and error handling
 */

import { NextResponse } from 'next/server'

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  details?: unknown
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  )
}

/**
 * Create an error API response
 */
export function errorResponse(
  error: string,
  details?: unknown,
  status: number = 500
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
    },
    { status }
  )
}

/**
 * Create a validation error response (400)
 */
export function validationError(
  message: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, details, 400)
}

/**
 * Create a not found error response (404)
 */
export function notFoundError(resource: string): NextResponse<ApiErrorResponse> {
  return errorResponse(`${resource} not found`, undefined, 404)
}

/**
 * Create an unauthorized error response (401)
 */
export function unauthorizedError(): NextResponse<ApiErrorResponse> {
  return errorResponse('Unauthorized', undefined, 401)
}

/**
 * Create a forbidden error response (403)
 */
export function forbiddenError(): NextResponse<ApiErrorResponse> {
  return errorResponse('Forbidden', undefined, 403)
}

/**
 * Handle unknown errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error)

  if (error instanceof Error) {
    return errorResponse(error.message, error.stack)
  }

  return errorResponse('An unexpected error occurred')
}

/**
 * Safely parse JSON from request body with XSS protection
 * Returns { success: true, data } or { success: false, response }
 */
export async function parseRequestBody(
  request: Request,
  options: {
    sanitize?: boolean
    allowHTML?: boolean
    allowLinks?: boolean
    richTextFields?: string[]
  } = {}
): Promise<
  { success: true; data: unknown } | { success: false; response: NextResponse<ApiErrorResponse> }
> {
  const { sanitize = true, allowHTML = false, allowLinks = false, richTextFields } = options

  try {
    const data = await request.json()

    // Apply XSS sanitization if enabled
    if (sanitize && typeof data === 'object' && data !== null) {
      const { sanitizeRequestBody, detectXSSPatterns, logXSSAttempt } = await import('./sanitize')

      // Check for XSS patterns before sanitization
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const checkForXSS = (obj: any, path = ''): void => {
        if (typeof obj === 'string') {
          const patterns = detectXSSPatterns(obj)
          if (patterns.length > 0) {
            logXSSAttempt(request.url, path, obj, patterns)
          }
        } else if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            checkForXSS(value, path ? `${path}.${key}` : key)
          }
        }
      }

      checkForXSS(data)

      // Sanitize the data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sanitizedData = sanitizeRequestBody(data as Record<string, any>, {
        allowHTML,
        allowLinks,
        richTextFields,
      })

      return { success: true, data: sanitizedData }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          details: error instanceof Error ? error.message : 'Failed to parse JSON',
        },
        { status: 400 }
      ),
    }
  }
}
