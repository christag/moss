/**
 * Okta API Client
 *
 * Provides methods for interacting with Okta's Management API:
 * - OAuth 2.0 authentication with automatic token refresh
 * - Groups API (list, get members)
 * - Users API (list, get, search)
 * - Pagination handling
 * - Rate limit management
 */

import { BaseIntegrationClient, PaginatedResponse } from './base-client'
import type {
  OktaConfig,
  OktaGroup,
  OktaUser,
  OktaTokenResponse,
  OktaErrorResponse,
  IntegrationCredentials,
  PaginationOptions,
} from '@/types/integrations'

export interface OktaAuthConfig {
  // Method 1: API Token (SSWS) - Simple but less secure
  apiToken?: string

  // Method 2: OAuth 2.0 Client Credentials - Recommended
  clientId?: string
  clientSecret?: string
  scopes?: string[] // e.g., ['okta.groups.read', 'okta.users.read']
}

export class OktaClient extends BaseIntegrationClient {
  private domain: string
  private authConfig: OktaAuthConfig
  private accessToken?: string
  private tokenExpiry: number = 0

  constructor(config: OktaConfig, credentials: IntegrationCredentials) {
    // Validate config
    if (!config.domain) {
      throw new Error('Okta domain is required')
    }

    // Initialize base client
    super(`https://${config.domain}/api/v1`, {
      timeout: config.timeout_ms || 30000,
    })

    this.domain = config.domain

    // Set up authentication
    if (credentials.okta_api_token) {
      this.authConfig = { apiToken: credentials.okta_api_token }
    } else if (credentials.okta_client_id && credentials.okta_client_secret) {
      this.authConfig = {
        clientId: credentials.okta_client_id,
        clientSecret: credentials.okta_client_secret,
        scopes: ['okta.groups.read', 'okta.users.read'],
      }
    } else {
      throw new Error(
        'Either okta_api_token or (okta_client_id + okta_client_secret) must be provided'
      )
    }
  }

  // ===========================================================================
  // Authentication
  // ===========================================================================

  /**
   * Get authorization header (handles both API token and OAuth)
   */
  private async getAuthHeader(): Promise<{ Authorization: string }> {
    // Method 1: API Token (SSWS)
    if (this.authConfig.apiToken) {
      return { Authorization: `SSWS ${this.authConfig.apiToken}` }
    }

    // Method 2: OAuth 2.0 (with automatic refresh)
    const accessToken = await this.getAccessToken()
    return { Authorization: `Bearer ${accessToken}` }
  }

  /**
   * Get OAuth access token (with automatic refresh)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken
    }

    // Request new token
    const { clientId, clientSecret, scopes } = this.authConfig

    if (!clientId || !clientSecret) {
      throw this.createError('OAuth client credentials not configured', 'AUTH_CONFIG_ERROR')
    }

    const tokenUrl = `https://${this.domain}/oauth2/v1/token`
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authHeader}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: (scopes || []).join(' '),
        }),
      })

      if (!response.ok) {
        const error: OktaErrorResponse = await response.json()
        throw this.createError(
          error.errorSummary || 'OAuth token request failed',
          error.errorCode,
          response.status,
          false
        )
      }

      const tokenData: OktaTokenResponse = await response.json()

      this.accessToken = tokenData.access_token
      this.tokenExpiry = Date.now() + tokenData.expires_in * 1000

      console.log(`[Okta] OAuth token acquired, expires in ${tokenData.expires_in}s`)

      return this.accessToken
    } catch (error) {
      if (this.isIntegrationError(error)) {
        throw error
      }
      throw this.createError(
        `Failed to obtain OAuth token: ${error instanceof Error ? error.message : String(error)}`,
        'OAUTH_TOKEN_ERROR',
        undefined,
        true
      )
    }
  }

  /**
   * Test connection to Okta
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: string }> {
    try {
      // Try to list groups (minimal API call)
      await this.listGroups({ limit: 1 })
      return { success: true, message: 'Successfully connected to Okta' }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        details: error instanceof Error ? error.stack : String(error),
      }
    }
  }

  // ===========================================================================
  // Groups API
  // ===========================================================================

  /**
   * List all groups (with pagination)
   */
  async listGroups(options: PaginationOptions = {}): Promise<PaginatedResponse<OktaGroup>> {
    const authHeader = await this.getAuthHeader()
    const limit = options.limit || 200

    const endpoint = `/groups?limit=${limit}`
    const response = await this.get<OktaGroup[]>(endpoint, authHeader)

    // TODO: Get Link header for pagination (requires access to response headers)
    // For now, return basic response
    return new PaginatedResponse(response, response.length, response.length === limit, undefined)
  }

  /**
   * List all groups with automatic pagination
   */
  async listAllGroups(): Promise<OktaGroup[]> {
    const authHeader = await this.getAuthHeader()
    const allGroups: OktaGroup[] = []
    let nextUrl: string | undefined = `/groups?limit=200`

    while (nextUrl) {
      // Need to handle response headers for pagination
      // This is a simplified version - production should use parseLinkHeader()
      const groups = await this.get<OktaGroup[]>(nextUrl, authHeader)
      allGroups.push(...groups)

      // For now, break if we got fewer than 200 (no more pages)
      if (groups.length < 200) {
        break
      }

      // TODO: Parse Link header to get next URL
      nextUrl = undefined
    }

    return allGroups
  }

  /**
   * Get group by ID
   */
  async getGroup(groupId: string): Promise<OktaGroup> {
    const authHeader = await this.getAuthHeader()
    return this.get<OktaGroup>(`/groups/${groupId}`, authHeader)
  }

  /**
   * Search groups by name
   */
  async searchGroups(query: string, options: PaginationOptions = {}): Promise<OktaGroup[]> {
    const authHeader = await this.getAuthHeader()
    const limit = options.limit || 200

    const endpoint = `/groups?q=${encodeURIComponent(query)}&limit=${limit}`
    return this.get<OktaGroup[]>(endpoint, authHeader)
  }

  /**
   * Filter groups by type
   */
  async filterGroups(filter: string, options: PaginationOptions = {}): Promise<OktaGroup[]> {
    const authHeader = await this.getAuthHeader()
    const limit = options.limit || 200

    // Example filter: type eq "OKTA_GROUP"
    const endpoint = `/groups?filter=${encodeURIComponent(filter)}&limit=${limit}`
    return this.get<OktaGroup[]>(endpoint, authHeader)
  }

  /**
   * List group members
   */
  async listGroupMembers(groupId: string, options: PaginationOptions = {}): Promise<OktaUser[]> {
    const authHeader = await this.getAuthHeader()
    const limit = options.limit || 200

    const endpoint = `/groups/${groupId}/users?limit=${limit}`
    return this.get<OktaUser[]>(endpoint, authHeader)
  }

  /**
   * List all group members with pagination
   */
  async listAllGroupMembers(groupId: string): Promise<OktaUser[]> {
    const authHeader = await this.getAuthHeader()
    const allMembers: OktaUser[] = []
    let nextUrl: string | undefined = `/groups/${groupId}/users?limit=200`

    while (nextUrl) {
      const members = await this.get<OktaUser[]>(nextUrl, authHeader)
      allMembers.push(...members)

      // Break if fewer than 200 (no more pages)
      if (members.length < 200) {
        break
      }

      nextUrl = undefined // TODO: Parse Link header
    }

    return allMembers
  }

  // ===========================================================================
  // Users API
  // ===========================================================================

  /**
   * List all users
   */
  async listUsers(options: PaginationOptions = {}): Promise<PaginatedResponse<OktaUser>> {
    const authHeader = await this.getAuthHeader()
    const limit = options.limit || 200

    const endpoint = `/users?limit=${limit}`
    const response = await this.get<OktaUser[]>(endpoint, authHeader)

    return new PaginatedResponse(response, response.length, response.length === limit, undefined)
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<OktaUser> {
    const authHeader = await this.getAuthHeader()
    return this.get<OktaUser>(`/users/${userId}`, authHeader)
  }

  /**
   * Get user by login (email)
   */
  async getUserByLogin(login: string): Promise<OktaUser> {
    const authHeader = await this.getAuthHeader()
    return this.get<OktaUser>(`/users/${encodeURIComponent(login)}`, authHeader)
  }

  /**
   * Search users
   */
  async searchUsers(query: string, options: PaginationOptions = {}): Promise<OktaUser[]> {
    const authHeader = await this.getAuthHeader()
    const limit = options.limit || 200

    const endpoint = `/users?q=${encodeURIComponent(query)}&limit=${limit}`
    return this.get<OktaUser[]>(endpoint, authHeader)
  }

  /**
   * Filter users
   */
  async filterUsers(filter: string, options: PaginationOptions = {}): Promise<OktaUser[]> {
    const authHeader = await this.getAuthHeader()
    const limit = options.limit || 200

    // Example filter: status eq "ACTIVE"
    const endpoint = `/users?filter=${encodeURIComponent(filter)}&limit=${limit}`
    return this.get<OktaUser[]>(endpoint, authHeader)
  }

  /**
   * Get user's groups
   */
  async getUserGroups(userId: string): Promise<OktaGroup[]> {
    const authHeader = await this.getAuthHeader()
    return this.get<OktaGroup[]>(`/users/${userId}/groups`, authHeader)
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Get current rate limit info (requires making a request first)
   */
  async getRateLimitInfo(): Promise<{ limit: number; remaining: number; reset: Date } | null> {
    // This is placeholder - actual implementation would need to store
    // rate limit headers from previous requests
    return null
  }

  /**
   * Clear cached OAuth token (force refresh on next request)
   */
  clearTokenCache(): void {
    this.accessToken = undefined
    this.tokenExpiry = 0
  }
}

/**
 * Factory for creating Okta clients from integration configs
 */
export function createOktaClient(
  config: OktaConfig,
  credentials: IntegrationCredentials
): OktaClient {
  return new OktaClient(config, credentials)
}
