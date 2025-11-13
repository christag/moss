/**
 * Base Integration Client
 *
 * Provides common functionality for external API integrations:
 * - HTTP request handling with retries
 * - Error parsing and standardization
 * - Rate limit detection and backoff
 * - Timeout management
 * - Request/response logging (with credential masking)
 */

import { maskCredential } from '@/lib/encryption'
import type { APIClientOptions, RateLimitInfo } from '@/types/integrations'

export interface IntegrationError {
  message: string
  code?: string
  statusCode?: number
  originalError?: unknown
  retryable: boolean
}

export class BaseIntegrationClient {
  protected baseUrl: string
  protected timeout: number
  protected retries: number
  protected retryDelay: number
  protected headers: Record<string, string>

  constructor(baseUrl: string, options: APIClientOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.timeout = options.timeout || 30000 // 30 seconds default
    this.retries = options.retries || 3
    this.retryDelay = options.retryDelay || 1000 // 1 second base delay
    this.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    }
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`

    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      // Merge headers
      const requestHeaders = {
        ...this.headers,
        ...options.headers,
      }

      // Log request (mask authorization headers)
      this.logRequest(options.method || 'GET', url, requestHeaders)

      // Make request
      const response = await fetch(url, {
        ...options,
        headers: requestHeaders,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle rate limiting (429)
      if (response.status === 429) {
        const rateLimitInfo = this.parseRateLimitHeaders(response.headers)
        throw this.createError(
          `Rate limit exceeded. Resets at ${new Date(rateLimitInfo.reset * 1000).toISOString()}`,
          'RATE_LIMIT_EXCEEDED',
          response.status,
          true // retryable
        )
      }

      // Handle authentication errors (401, 403)
      if (response.status === 401 || response.status === 403) {
        const errorBody = (await this.safeParseJSON(response)) as Record<string, unknown> | null
        throw this.createError(
          (errorBody?.message as string) ||
            (errorBody?.errorSummary as string) ||
            'Authentication failed',
          'AUTH_ERROR',
          response.status,
          false // not retryable
        )
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorBody = (await this.safeParseJSON(response)) as Record<string, unknown> | null
        throw this.createError(
          (errorBody?.message as string) ||
            (errorBody?.errorSummary as string) ||
            (errorBody?.detail as string) ||
            `HTTP ${response.status}: ${response.statusText}`,
          (errorBody?.errorCode as string) || (errorBody?.code as string) || 'HTTP_ERROR',
          response.status,
          response.status >= 500 // 5xx errors are retryable
        )
      }

      // Parse successful response
      const data = await response.json()
      this.logResponse(response.status, data)

      return data as T
    } catch (error) {
      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError(
          `Request timeout after ${this.timeout}ms`,
          'TIMEOUT',
          undefined,
          true // retryable
        )
      }

      // If error is already an IntegrationError, check if we should retry
      if (this.isIntegrationError(error)) {
        if (error.retryable && attempt < this.retries) {
          const delay = this.calculateBackoff(attempt)
          console.warn(
            `[Integration] Retry ${attempt}/${this.retries} after ${delay}ms: ${error.message}`
          )
          await this.sleep(delay)
          return this.request<T>(endpoint, options, attempt + 1)
        }
        throw error
      }

      // Network or other unexpected errors
      if (error instanceof Error) {
        throw this.createError(
          error.message,
          'NETWORK_ERROR',
          undefined,
          true // retryable
        )
      }

      throw this.createError('Unknown error occurred', 'UNKNOWN_ERROR', undefined, false)
    }
  }

  /**
   * GET request
   */
  protected async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    })
  }

  /**
   * POST request
   */
  protected async post<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PUT request
   */
  protected async put<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PATCH request
   */
  protected async patch<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * DELETE request
   */
  protected async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    })
  }

  /**
   * Parse rate limit headers
   */
  protected parseRateLimitHeaders(headers: Headers): RateLimitInfo {
    return {
      limit: parseInt(headers.get('X-Rate-Limit-Limit') || '0', 10),
      remaining: parseInt(headers.get('X-Rate-Limit-Remaining') || '0', 10),
      reset: parseInt(headers.get('X-Rate-Limit-Reset') || '0', 10),
    }
  }

  /**
   * Parse pagination from Link header (RFC 5988)
   */
  protected parseLinkHeader(linkHeader: string | null): {
    next?: string
    prev?: string
    first?: string
    last?: string
  } {
    if (!linkHeader) return {}

    const links: Record<string, string> = {}
    const parts = linkHeader.split(',')

    for (const part of parts) {
      const section = part.split(';')
      if (section.length !== 2) continue

      const url = section[0].replace(/<(.*)>/, '$1').trim()
      const rel = section[1].replace(/rel="(.*)"/, '$1').trim()

      links[rel] = url
    }

    return links
  }

  /**
   * Calculate exponential backoff delay
   */
  protected calculateBackoff(attempt: number): number {
    // Exponential backoff: baseDelay * 2^attempt + random jitter
    const exponentialDelay = this.retryDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 1000 // 0-1000ms random jitter
    return Math.min(exponentialDelay + jitter, 30000) // Cap at 30 seconds
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Safely parse JSON (returns null if invalid)
   */
  protected async safeParseJSON(response: Response): Promise<unknown> {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  /**
   * Create standardized error
   */
  protected createError(
    message: string,
    code?: string,
    statusCode?: number,
    retryable: boolean = false
  ): IntegrationError {
    return {
      message,
      code,
      statusCode,
      retryable,
    }
  }

  /**
   * Type guard for IntegrationError
   */
  protected isIntegrationError(error: unknown): error is IntegrationError {
    return typeof error === 'object' && error !== null && 'message' in error && 'retryable' in error
  }

  /**
   * Log HTTP request (with credential masking)
   */
  protected logRequest(method: string, url: string, headers: Record<string, string>): void {
    const maskedHeaders = { ...headers }

    // Mask authorization headers
    if (maskedHeaders['Authorization']) {
      const [scheme, token] = maskedHeaders['Authorization'].split(' ')
      maskedHeaders['Authorization'] = token
        ? `${scheme} ${maskCredential(token, 4)}`
        : maskCredential(maskedHeaders['Authorization'], 4)
    }

    console.log(`[Integration] ${method} ${url}`, {
      headers: maskedHeaders,
    })
  }

  /**
   * Log HTTP response
   */
  protected logResponse(status: number, data: unknown): void {
    console.log(`[Integration] Response ${status}`, {
      dataSize: JSON.stringify(data).length,
    })
  }

  /**
   * Validate required fields in config
   */
  protected validateConfig(config: Record<string, unknown>, requiredFields: string[]): void {
    const missingFields = requiredFields.filter((field) => !config[field])

    if (missingFields.length > 0) {
      throw this.createError(
        `Missing required configuration fields: ${missingFields.join(', ')}`,
        'CONFIG_ERROR',
        undefined,
        false
      )
    }
  }
}

/**
 * Paginated response helper
 */
export class PaginatedResponse<T> {
  constructor(
    public items: T[],
    public totalCount: number,
    public hasMore: boolean,
    public nextUrl?: string
  ) {}

  static empty<T>(): PaginatedResponse<T> {
    return new PaginatedResponse<T>([], 0, false)
  }
}

/**
 * API Client Factory
 *
 * Used to create API clients from integration configs stored in database
 */
export interface APIClientFactory<T> {
  create(config: unknown, credentials: unknown): T
}
