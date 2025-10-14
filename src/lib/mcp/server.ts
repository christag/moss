// @ts-nocheck
/**
 * MCP (Model Context Protocol) Server Implementation
 * Provides tools, resources, and prompts for LLM interaction with M.O.S.S.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import type { MCPAuthContext } from './auth'

// Import tool implementations
import { registerDeviceTools } from './tools/devices'
import { registerPeopleTools } from './tools/people'
import { registerNetworkTools } from './tools/networks'
import { registerLicenseTools } from './tools/licenses'

// Import resource implementations
import { registerSchemaResources } from './resources/schemas'
import { registerTopologyResources } from './resources/topology'

// Import prompt implementations
import { registerTroubleshootingPrompts } from './prompts/troubleshooting'
import { registerAuditPrompts } from './prompts/audits'

/**
 * Create and configure MCP server instance
 */
export function createMCPServer() {
  const server = new Server(
    {
      name: 'moss-mcp-server',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  )

  return server
}

/**
 * Register all MCP tools with the server
 */
export async function registerAllTools(server: Server, authContext: MCPAuthContext) {
  await registerDeviceTools(server, authContext)
  await registerPeopleTools(server, authContext)
  await registerNetworkTools(server, authContext)
  await registerLicenseTools(server, authContext)
}

/**
 * Register all MCP resources with the server
 */
export async function registerAllResources(server: Server, authContext: MCPAuthContext) {
  await registerSchemaResources(server, authContext)
  await registerTopologyResources(server, authContext)
}

/**
 * Register all MCP prompts with the server
 */
export async function registerAllPrompts(server: Server, authContext: MCPAuthContext) {
  await registerTroubleshootingPrompts(server, authContext)
  await registerAuditPrompts(server, authContext)
}

/**
 * Initialize complete MCP server with all capabilities
 */
export async function initializeMCPServer(authContext: MCPAuthContext): Promise<Server> {
  const server = createMCPServer()

  // Register all capabilities based on user's scopes
  if (authContext.scopes.includes('mcp:tools') || authContext.scopes.includes('mcp:write')) {
    await registerAllTools(server, authContext)
  }

  if (authContext.scopes.includes('mcp:resources') || authContext.scopes.includes('mcp:read')) {
    await registerAllResources(server, authContext)
  }

  if (authContext.scopes.includes('mcp:prompts')) {
    await registerAllPrompts(server, authContext)
  }

  return server
}
