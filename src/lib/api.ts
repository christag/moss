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
