/**
 * Zod validation schemas for OAuth 2.1 requests
 */

import { z } from 'zod'

export const AuthorizeRequestSchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().min(1),
  state: z.string().optional(),
  code_challenge: z.string().min(43).max(128), // Base64url encoded, min 32 bytes
  code_challenge_method: z.literal('S256'), // Only S256 supported for security
})

export const TokenRequestSchema = z.discriminatedUnion('grant_type', [
  // Authorization code grant with PKCE
  z.object({
    grant_type: z.literal('authorization_code'),
    code: z.string().min(1),
    redirect_uri: z.string().url(),
    code_verifier: z.string().min(43).max(128), // PKCE verifier
    client_id: z.string().min(1),
    client_secret: z.string().optional(),
  }),
  // Refresh token grant
  z.object({
    grant_type: z.literal('refresh_token'),
    refresh_token: z.string().min(1),
    client_id: z.string().min(1),
    client_secret: z.string().optional(),
    scope: z.string().optional(),
  }),
  // Client credentials grant (for machine-to-machine)
  z.object({
    grant_type: z.literal('client_credentials'),
    client_id: z.string().min(1),
    client_secret: z.string().min(1),
    scope: z.string().optional(),
  }),
])

export const RevokeTokenRequestSchema = z.object({
  token: z.string().min(1),
  token_type_hint: z.enum(['access_token', 'refresh_token']).optional(),
  client_id: z.string().min(1),
  client_secret: z.string().optional(),
})

export const CreateOAuthClientSchema = z.object({
  client_name: z.string().min(1).max(255),
  redirect_uris: z.array(z.string().url()).min(1).max(10),
  allowed_scopes: z
    .array(z.enum(['mcp:read', 'mcp:tools', 'mcp:resources', 'mcp:prompts', 'mcp:write']))
    .min(1),
  client_type: z.enum(['confidential', 'public']).default('confidential'),
})

export const UpdateOAuthClientSchema = z.object({
  client_name: z.string().min(1).max(255).optional(),
  redirect_uris: z.array(z.string().url()).min(1).max(10).optional(),
  allowed_scopes: z
    .array(z.enum(['mcp:read', 'mcp:tools', 'mcp:resources', 'mcp:prompts', 'mcp:write']))
    .min(1)
    .optional(),
  is_active: z.boolean().optional(),
})

export type AuthorizeRequest = z.infer<typeof AuthorizeRequestSchema>
export type TokenRequest = z.infer<typeof TokenRequestSchema>
export type RevokeTokenRequest = z.infer<typeof RevokeTokenRequestSchema>
export type CreateOAuthClient = z.infer<typeof CreateOAuthClientSchema>
export type UpdateOAuthClient = z.infer<typeof UpdateOAuthClientSchema>
