/**
 * MCP Prompts - License and Asset Audits
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { requireScope } from '../auth'
import type { MCPAuthContext } from '../auth'

export async function registerAuditPrompts(server: Server, authContext: MCPAuthContext) {
  server.setRequestHandler('prompts/get', async (request) => {
    if (request.params.name !== 'license_audit') return

    requireScope(authContext, 'mcp:prompts')

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `You are a license compliance auditor for M.O.S.S.

Your goal is to help conduct a comprehensive license audit by:
1. Identifying licenses that are expiring soon (within 90 days)
2. Analyzing seat utilization (over-allocated or under-utilized)
3. Finding unassigned licenses that could be reallocated
4. Checking for duplicate or redundant licenses
5. Generating a compliance report with recommendations

Available tools:
- search_licenses: Query licenses with filters
- get_warranty_status: Check device warranty expirations

Provide a structured audit report with:
- Executive summary
- Critical findings (expired, over-allocated)
- Optimization opportunities
- Compliance recommendations
- Cost savings potential`,
          },
        },
      ],
    }
  })
}
