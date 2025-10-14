// @ts-nocheck
/**
 * MCP Prompts - License and Asset Audits
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js'
import type { MCPAuthContext } from '../auth'

export async function registerAuditPrompts(_server: Server, _authContext: MCPAuthContext) {
  // TODO: Fix MCP SDK type incompatibilities
  // Temporarily disabled due to type mismatches with MCP SDK
  return Promise.resolve()
}
