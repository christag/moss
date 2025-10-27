/**
 * JAMF Pro API Client
 * Handles authentication and API requests to JAMF Pro servers
 */

import {
  jamfAuthTokenSchema,
  jamfComputersInventoryResponseSchema,
  jamfComputerGroupsResponseSchema,
  type JamfConfig,
  type JamfCredentials,
  type JamfComputerInventory,
  type JamfComputerGroup,
  type JamfUser,
} from '@/lib/schemas/integrations'

export interface JamfClientOptions {
  config: JamfConfig
  credentials: JamfCredentials
}

export class JamfClient {
  private baseUrl: string
  private credentials: JamfCredentials
  private token: string | null = null
  private tokenExpiry: Date | null = null
  private timeoutMs: number

  constructor(options: JamfClientOptions) {
    this.baseUrl = options.config.base_url.replace(/\/$/, '') // Remove trailing slash
    this.credentials = options.credentials
    this.timeoutMs = (options.config.timeout_seconds || 30) * 1000
  }

  // ==========================================================================
  // Authentication
  // ==========================================================================

  /**
   * Authenticate and get a bearer token
   * Tokens expire after 20 minutes by default
   */
  private async authenticate(): Promise<void> {
    const url = `${this.baseUrl}/api/v1/auth/token`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${this.credentials.username}:${this.credentials.password}`
        ).toString('base64')}`,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `JAMF authentication failed: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    const data = await response.json()
    const tokenData = jamfAuthTokenSchema.parse(data)

    this.token = tokenData.token
    this.tokenExpiry = new Date(tokenData.expires)
  }

  /**
   * Ensure we have a valid token, refreshing if necessary
   */
  private async ensureValidToken(): Promise<void> {
    const now = new Date()

    // If no token or token expired, authenticate
    if (!this.token || !this.tokenExpiry || this.tokenExpiry <= now) {
      await this.authenticate()
      return
    }

    // If token expires in less than 2 minutes, refresh it
    const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000)
    if (this.tokenExpiry <= twoMinutesFromNow) {
      await this.refreshToken()
    }
  }

  /**
   * Refresh the current token to extend its validity by 20 minutes
   */
  private async refreshToken(): Promise<void> {
    if (!this.token) {
      await this.authenticate()
      return
    }

    const url = `${this.baseUrl}/api/v1/auth/keep-alive`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    })

    if (!response.ok) {
      // If refresh fails, re-authenticate
      await this.authenticate()
      return
    }

    const data = await response.json()
    const tokenData = jamfAuthTokenSchema.parse(data)

    this.token = tokenData.token
    this.tokenExpiry = new Date(tokenData.expires)
  }

  /**
   * Invalidate the current token
   */
  public async logout(): Promise<void> {
    if (!this.token) return

    const url = `${this.baseUrl}/api/v1/auth/invalidate-token`

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (error) {
      console.error('Failed to invalidate JAMF token:', error)
    } finally {
      this.token = null
      this.tokenExpiry = null
    }
  }

  // ==========================================================================
  // API Request Helper
  // ==========================================================================

  /**
   * Make an authenticated API request
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.ensureValidToken()

    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `JAMF API request failed: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response.json()
  }

  // ==========================================================================
  // Computer Inventory Endpoints
  // ==========================================================================

  /**
   * Get paginated list of computers with specified sections
   * @param page - Page number (0-indexed)
   * @param pageSize - Number of results per page (max 2000)
   * @param sections - Array of section names to include
   */
  public async getComputersInventory(
    page: number = 0,
    pageSize: number = 100,
    sections: string[] = [
      'GENERAL',
      'HARDWARE',
      'SOFTWARE',
      'USER_AND_LOCATION',
      'GROUP_MEMBERSHIPS',
    ]
  ): Promise<{ totalCount: number; results: JamfComputerInventory[] }> {
    const sectionParams = sections.map((s) => `section=${s}`).join('&')
    const endpoint = `/api/v1/computers-inventory?page=${page}&page-size=${pageSize}&${sectionParams}`

    const data = await this.request<unknown>(endpoint)
    const parsed = jamfComputersInventoryResponseSchema.parse(data)

    return {
      totalCount: parsed.totalCount,
      results: parsed.results,
    }
  }

  /**
   * Get detailed inventory for a specific computer by ID
   */
  public async getComputerInventoryById(
    id: number,
    sections: string[] = [
      'GENERAL',
      'HARDWARE',
      'SOFTWARE',
      'USER_AND_LOCATION',
      'GROUP_MEMBERSHIPS',
    ]
  ): Promise<JamfComputerInventory> {
    const sectionParams = sections.map((s) => `section=${s}`).join('&')
    const endpoint = `/api/v1/computers-inventory-detail/${id}?${sectionParams}`

    const data = await this.request<unknown>(endpoint)
    return data as JamfComputerInventory
  }

  /**
   * Get computer inventory by serial number
   */
  public async getComputerBySerialNumber(
    serialNumber: string,
    sections: string[] = [
      'GENERAL',
      'HARDWARE',
      'SOFTWARE',
      'USER_AND_LOCATION',
      'GROUP_MEMBERSHIPS',
    ]
  ): Promise<JamfComputerInventory | null> {
    // Use filter to find by serial number
    const sectionParams = sections.map((s) => `section=${s}`).join('&')
    const endpoint = `/api/v1/computers-inventory?page=0&page-size=1&filter=hardware.serialNumber=="${serialNumber}"&${sectionParams}`

    const data = await this.request<unknown>(endpoint)
    const parsed = jamfComputersInventoryResponseSchema.parse(data)

    return parsed.results.length > 0 ? parsed.results[0] : null
  }

  /**
   * Get all computers (handles pagination automatically)
   */
  public async getAllComputers(
    sections: string[] = [
      'GENERAL',
      'HARDWARE',
      'SOFTWARE',
      'USER_AND_LOCATION',
      'GROUP_MEMBERSHIPS',
    ],
    onProgress?: (current: number, total: number) => void
  ): Promise<JamfComputerInventory[]> {
    const pageSize = 100
    let page = 0
    let allComputers: JamfComputerInventory[] = []
    let totalCount = 0

    do {
      const response = await this.getComputersInventory(page, pageSize, sections)
      allComputers = allComputers.concat(response.results)
      totalCount = response.totalCount

      if (onProgress) {
        onProgress(allComputers.length, totalCount)
      }

      page++
    } while (allComputers.length < totalCount)

    return allComputers
  }

  // ==========================================================================
  // Computer Groups Endpoints
  // ==========================================================================

  /**
   * Get paginated list of computer groups
   */
  public async getComputerGroups(
    page: number = 0,
    pageSize: number = 100
  ): Promise<{ totalCount: number; results: JamfComputerGroup[] }> {
    const endpoint = `/api/v1/computer-groups?page=${page}&page-size=${pageSize}`

    const data = await this.request<unknown>(endpoint)
    const parsed = jamfComputerGroupsResponseSchema.parse(data)

    return {
      totalCount: parsed.totalCount,
      results: parsed.results,
    }
  }

  /**
   * Get all computer groups (handles pagination automatically)
   */
  public async getAllComputerGroups(): Promise<JamfComputerGroup[]> {
    const pageSize = 100
    let page = 0
    let allGroups: JamfComputerGroup[] = []
    let totalCount = 0

    do {
      const response = await this.getComputerGroups(page, pageSize)
      allGroups = allGroups.concat(response.results)
      totalCount = response.totalCount
      page++
    } while (allGroups.length < totalCount)

    return allGroups
  }

  /**
   * Get members of a specific computer group
   */
  public async getComputerGroupMembers(groupId: number): Promise<number[]> {
    // Use Classic API for group membership
    const endpoint = `/JSSResource/computergroups/id/${groupId}`

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    })

    if (!response.ok) {
      throw new Error(`Failed to get group members: ${response.status}`)
    }

    const data = await response.json()

    // Extract computer IDs from the group
    const groupData = data as {
      computer_group?: {
        computers?: Array<{ id: number }>
      }
    }
    const computerIds: number[] = groupData?.computer_group?.computers?.map((c) => c.id) || []

    return computerIds
  }

  // ==========================================================================
  // Users Endpoints (Classic API)
  // ==========================================================================

  /**
   * Get all users from JAMF (uses Classic API)
   */
  public async getAllUsers(): Promise<JamfUser[]> {
    const endpoint = '/JSSResource/users'

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    })

    if (!response.ok) {
      throw new Error(`Failed to get users: ${response.status}`)
    }

    const data = await response.json()
    const users = (data as { users?: JamfUser[] })?.users || []
    return users
  }

  /**
   * Get detailed user information by ID
   */
  public async getUserById(userId: number): Promise<JamfUser | null> {
    const endpoint = `/JSSResource/users/id/${userId}`

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    })

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Failed to get user: ${response.status}`)
    }

    const data = await response.json()
    return data?.user || null
  }

  // ==========================================================================
  // Health Check
  // ==========================================================================

  /**
   * Test connection to JAMF Pro server
   */
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.authenticate()
      return {
        success: true,
        message: 'Successfully connected to JAMF Pro',
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

/**
 * Create a JAMF client instance
 */
export function createJamfClient(options: JamfClientOptions): JamfClient {
  return new JamfClient(options)
}
