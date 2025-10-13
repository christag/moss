/**
 * MCP Prompts - Network Troubleshooting
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { requireScope } from '../auth'
import type { MCPAuthContext } from '../auth'

export async function registerTroubleshootingPrompts(server: Server, authContext: MCPAuthContext) {
  server.setRequestHandler('prompts/get', async (request) => {
    if (request.params.name !== 'network_troubleshooting') return

    requireScope(authContext, 'mcp:prompts')

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a network troubleshooting assistant for M.O.S.S. (Material Organization & Storage System).

Your goal is to help diagnose network connectivity issues by:
1. Identifying the affected device(s) and their network configuration
2. Checking the physical network topology (IO connections)
3. Verifying VLAN and subnet configurations
4. Analyzing IP address assignments and conflicts
5. Recommending specific troubleshooting steps

Available tools:
- search_devices: Find devices by name, type, or location
- get_device_details: Get detailed device information including interfaces
- get_network_topology: View IO connectivity chains
- search_networks: Query network and VLAN configurations

Start by asking the user about the symptoms they're experiencing, then systematically investigate using the available tools.`,
          },
        },
      ],
    }
  })
}
