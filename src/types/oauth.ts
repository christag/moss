/**
 * OAuth 2.1 Types for MCP Server Authentication
 * Implements OAuth 2.1 with PKCE as required by MCP spec
 */

export type OAuthClientType = 'confidential' | 'public'

export type OAuthScope =
  | 'mcp:read' // Read-only access to resources
  | 'mcp:tools' // Access to call MCP tools
  | 'mcp:resources' // Access to read MCP resources
  | 'mcp:prompts' // Access to retrieve MCP prompts
  | 'mcp:write' // Write access (for create/update tools)

export interface OAuthClient {
  id: string
  client_id: string
  client_secret: string // Hashed with bcrypt
  client_name: string
  redirect_uris: string[]
  allowed_scopes: OAuthScope[]
  client_type: OAuthClientType
  is_active: boolean
  created_by: string | null
  created_at: Date
  updated_at: Date
}

export interface OAuthAuthorizationCode {
  id: string
  code: string
  client_id: string
  user_id: string
  redirect_uri: string
  scopes: OAuthScope[]
  code_challenge: string
  code_challenge_method: 'S256' | 'plain'
  expires_at: Date
  used: boolean
  created_at: Date
}

export interface OAuthToken {
  id: string
  access_token: string // JWT
  refresh_token: string | null // JWT
  client_id: string
  user_id: string | null
  scopes: OAuthScope[]
  access_token_expires_at: Date
  refresh_token_expires_at: Date | null
  revoked: boolean
  created_at: Date
  updated_at: Date
}

// Request/Response types for OAuth endpoints

export interface TokenRequest {
  grant_type: 'authorization_code' | 'refresh_token' | 'client_credentials'
  code?: string
  redirect_uri?: string
  code_verifier?: string // PKCE
  refresh_token?: string
  client_id: string
  client_secret?: string
  scope?: string
}

export interface TokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number // seconds
  refresh_token?: string
  scope: string
}

export interface AuthorizeRequest {
  response_type: 'code'
  client_id: string
  redirect_uri: string
  scope: string
  state?: string
  code_challenge: string // PKCE
  code_challenge_method: 'S256' // Only S256 supported for security
}

export interface AuthorizeResponse {
  code: string
  state?: string
}

// JWT Payload types

export interface AccessTokenPayload {
  sub: string // user_id
  client_id: string
  scopes: OAuthScope[]
  iat: number
  exp: number
  iss: string
  aud: string
}

export interface RefreshTokenPayload {
  sub: string // user_id
  client_id: string
  iat: number
  exp: number
  iss: string
  aud: string
  jti: string // Token ID for revocation
}

// OAuth 2.0 Server Metadata (RFC 8414)
export interface AuthorizationServerMetadata {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  revocation_endpoint?: string
  token_endpoint_auth_methods_supported: string[]
  response_types_supported: string[]
  grant_types_supported: string[]
  code_challenge_methods_supported: string[]
  scopes_supported: string[]
  service_documentation?: string
}

// OAuth 2.0 Resource Server Metadata (RFC 9728)
export interface ResourceServerMetadata {
  resource: string // Resource identifier (e.g., "https://moss.example.com")
  authorization_servers: string[] // Array of authorization server URLs
  scopes_supported: string[]
  bearer_methods_supported: string[]
  resource_documentation?: string
}
