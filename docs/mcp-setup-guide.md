# M.O.S.S. MCP Server Setup Guide

## Overview

The M.O.S.S. MCP (Model Context Protocol) server enables LLMs like Claude to interact with your IT asset management system through a secure, standardized interface.

## Features

- **OAuth 2.1 Authentication**: Secure token-based authentication with PKCE
- **8 MCP Tools**: Search devices, people, networks, licenses, and more
- **2 Resource Types**: Database schemas and network topology
- **2 Prompt Templates**: Network troubleshooting and license auditing
- **Audit Logging**: Track all MCP operations for compliance

## Prerequisites

- M.O.S.S. installed and running
- Admin access to M.O.S.S.
- Claude Desktop (or another MCP-compatible client)

## Step 1: Create an OAuth Client

1. Log in to M.O.S.S. as an admin
2. Navigate to **Admin → MCP**
3. Click **Create OAuth Client**
4. Fill in the form:
   - **Client Name**: `Claude Desktop` (or your client name)
   - **Redirect URIs**: `http://localhost:3000/callback` (adjust for your setup)
   - **Allowed Scopes**: Select all scopes you want to grant
   - **Client Type**: Choose `confidential` for secure clients

5. Click **Create Client**
6. **IMPORTANT**: Copy the `client_secret` immediately - it won't be shown again!

## Step 2: Configure Claude Desktop

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "moss": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/cli",
        "connect",
        "http://localhost:3001/api/mcp"
      ],
      "env": {
        "MOSS_CLIENT_ID": "mcp_xxxxxxxxxxxx",
        "MOSS_CLIENT_SECRET": "your-client-secret-here",
        "MOSS_BASE_URL": "http://localhost:3001"
      }
    }
  }
}
```

Replace:
- `MOSS_CLIENT_ID`: Your OAuth client ID from Step 1
- `MOSS_CLIENT_SECRET`: Your OAuth client secret from Step 1
- `MOSS_BASE_URL`: Your M.O.S.S. installation URL

## Step 3: Authenticate

When you first connect, Claude will initiate the OAuth flow:

1. Claude will redirect you to M.O.S.S. login
2. Log in with your M.O.S.S. credentials
3. Authorize Claude to access M.O.S.S.
4. You'll be redirected back to Claude

The access token is valid for 5 minutes, but Claude will automatically refresh it using the refresh token (valid for 30 days).

## Available Tools

### Device Management
- `search_devices`: Search for devices with filters (name, type, status, location)
- `get_device_details`: Get full device information including interfaces
- `create_device`: Add new devices (requires `mcp:write` scope)

### People Management
- `search_people`: Find people by name, email, type, or status

### Network Management
- `get_network_topology`: Retrieve IO connectivity chains for topology mapping

### License Management
- `search_licenses`: Query licenses with filters and expiration checks
- `get_warranty_status`: Find devices with expiring warranties

## Available Resources

### Schemas
- `resource://moss/schemas/device`: Device data model
- `resource://moss/schemas/person`: Person data model
- `resource://moss/schemas/network`: Network data model

### Topology
- `resource://moss/network/topology`: Full network connectivity graph

## Available Prompts

### Network Troubleshooting
- `network_troubleshooting`: Guided workflow for diagnosing connectivity issues

### Auditing
- `license_audit`: Comprehensive license compliance review

## Example Queries

Try asking Claude:

- "Show me all active servers in the New York office"
- "What devices are connected to switch-core-01?"
- "Which software licenses are expiring in the next 30 days?"
- "Who is assigned to device server-web-01?"
- "Help me troubleshoot why device-123 can't reach the internet"

## OAuth Scopes

| Scope | Description |
|-------|-------------|
| `mcp:read` | Read-only access to resources |
| `mcp:tools` | Execute MCP tools (read operations) |
| `mcp:resources` | Access MCP resources (schemas, topology) |
| `mcp:prompts` | Use MCP prompt templates |
| `mcp:write` | Create/modify data (e.g., create devices) |

## Security Best Practices

1. **Protect Client Secrets**: Store client secrets securely (e.g., in environment variables)
2. **Use HTTPS**: Always use HTTPS in production
3. **Rotate Secrets**: Periodically rotate client secrets
4. **Monitor Audit Logs**: Review MCP audit logs regularly
5. **Scope Minimization**: Only grant necessary scopes to each client
6. **Revoke Unused Clients**: Delete OAuth clients that are no longer needed

## Troubleshooting

### "unauthorized" Error
- Check that your client ID and secret are correct
- Verify the OAuth client is active in M.O.S.S.
- Ensure your access token hasn't expired (should auto-refresh)

### "Missing required scope" Error
- The operation requires a scope your client doesn't have
- Edit the OAuth client in M.O.S.S. to add the required scope

### Connection Timeout
- Verify M.O.S.S. is running and accessible
- Check firewall rules if M.O.S.S. is on a different network
- Ensure the `MOSS_BASE_URL` is correct

### Tools Not Appearing
- Check that your OAuth client has the `mcp:tools` scope
- Restart Claude Desktop after configuration changes
- Verify the MCP server endpoint is reachable

## Advanced: Custom MCP Clients

If you're building a custom MCP client (not Claude Desktop):

### 1. Authorization Endpoint

```
POST https://your-moss-url.com/api/oauth/authorize

{
  "response_type": "code",
  "client_id": "mcp_xxxxxxxxxxxx",
  "redirect_uri": "http://localhost:8080/callback",
  "scope": "mcp:read mcp:tools",
  "code_challenge": "BASE64URL(SHA256(code_verifier))",
  "code_challenge_method": "S256",
  "state": "random-state-value"
}
```

### 2. Token Endpoint

```
POST https://your-moss-url.com/api/oauth/token

{
  "grant_type": "authorization_code",
  "code": "authorization_code_from_step_1",
  "redirect_uri": "http://localhost:8080/callback",
  "code_verifier": "code_verifier_from_step_1",
  "client_id": "mcp_xxxxxxxxxxxx",
  "client_secret": "your_secret_here"
}
```

### 3. MCP Request

```
POST https://your-moss-url.com/api/mcp
Authorization: Bearer <access_token>

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_devices",
    "arguments": {
      "search": "server",
      "limit": 10
    }
  }
}
```

## API Documentation

Full API documentation is available at:
- Authorization Server Metadata: `/.well-known/oauth-authorization-server`
- Resource Server Metadata: `/.well-known/oauth-protected-resource`

## Support

For issues or questions:
- Check the audit logs: **Admin → MCP → Logs** (coming soon)
- Review M.O.S.S. server logs for errors
- GitHub Issues: https://github.com/yourusername/moss/issues
