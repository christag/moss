# CORS Configuration for M.O.S.S. MCP Server

**Date**: October 13, 2025
**Status**: ✅ Implemented and Tested

## Overview

Cross-Origin Resource Sharing (CORS) has been configured on all OAuth 2.1 and MCP endpoints to enable secure cross-origin requests from MCP clients like Claude Desktop.

## Configured Endpoints

### OAuth 2.1 Endpoints
- `POST /api/oauth/authorize` - Authorization code flow
- `POST /api/oauth/token` - Token exchange
- `POST /api/oauth/revoke` - Token revocation

### MCP Protocol Endpoint
- `POST /api/mcp` - MCP protocol communication

### Discovery Endpoints (RFC 8414 & RFC 9728)
- `GET /.well-known/oauth-authorization-server` - Authorization server metadata
- `GET /.well-known/oauth-protected-resource` - Resource server metadata

## CORS Headers

All endpoints include the following CORS headers:

```
Access-Control-Allow-Origin: <requesting-origin>
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin
Access-Control-Allow-Credentials: true
Access-Control-Expose-Headers: Content-Length, Content-Type
Access-Control-Max-Age: 86400
```

### Header Explanations

- **Allow-Origin**: Reflects the requesting origin (or `*` in development)
- **Allow-Methods**: HTTP methods supported by the endpoints
- **Allow-Headers**: Headers that clients can send
- **Allow-Credentials**: Enables cookies and authentication headers
- **Expose-Headers**: Headers clients can read from responses
- **Max-Age**: Preflight cache duration (24 hours)

## Configuration

### Development Mode

In development, CORS is configured to allow all origins (`*`):

```typescript
const DEFAULT_CORS_CONFIG = {
  allowedOrigins: '*',
  credentials: true,
  // ... other settings
}
```

### Production Mode

For production, set the `ALLOWED_ORIGINS` environment variable with a comma-separated list of allowed origins:

```bash
# .env.production
ALLOWED_ORIGINS=https://app.example.com,https://claude.ai,https://desktop.claude.ai
```

The production CORS configuration automatically reads this environment variable:

```typescript
export function getProductionCORSConfig(): CORSConfig {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS

  let allowedOrigins: string[] | '*' = '*'
  if (allowedOriginsEnv) {
    allowedOrigins = allowedOriginsEnv.split(',').map((origin) => origin.trim())
  }

  return {
    allowedOrigins,
    credentials: true,
    // ... other settings
  }
}
```

## Testing CORS

### Test Preflight Request

```bash
curl -i -X OPTIONS http://localhost:3001/api/oauth/token \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

Expected response: `204 No Content` with CORS headers.

### Test Actual Request

```bash
curl -i http://localhost:3001/.well-known/oauth-authorization-server \
  -H "Origin: https://example.com"
```

Expected response: `200 OK` with CORS headers + JSON body.

## Implementation Details

### CORS Utility (`src/lib/cors.ts`)

The `withCORS` helper function wraps API handlers and automatically applies CORS headers:

```typescript
export async function POST(request: NextRequest) {
  return withCORS(request, async () => handleTokenRequest(request), getProductionCORSConfig())
}

export async function OPTIONS(request: NextRequest) {
  return withCORS(request, async () => new NextResponse(null, { status: 204 }), getProductionCORSConfig())
}
```

### Key Features

1. **Automatic Preflight Handling**: All endpoints have `OPTIONS` handlers
2. **Origin Validation**: Only whitelisted origins receive CORS headers in production
3. **Credential Support**: `credentials: true` enables OAuth cookies/tokens
4. **Configurable**: Easy to customize per-endpoint if needed

## Security Considerations

### Production Checklist

- ✅ Set `ALLOWED_ORIGINS` to specific domains (never use `*` in production)
- ✅ Use HTTPS for all origins (required for `credentials: true`)
- ✅ Keep origin list minimal (only trusted MCP clients)
- ✅ Monitor CORS errors in logs
- ✅ Update allowed origins when adding new MCP client integrations

### Common Issues

**Issue**: CORS error "Origin not allowed"
**Solution**: Add the origin to `ALLOWED_ORIGINS` environment variable

**Issue**: Credentials not sent
**Solution**: Ensure `credentials: true` in CORS config and client sends `credentials: 'include'`

**Issue**: Preflight failing
**Solution**: Verify `OPTIONS` handler exists and returns 204 with CORS headers

## Integration with MCP Clients

### Claude Desktop Configuration

When configuring Claude Desktop to use the M.O.S.S. MCP server, CORS is handled automatically. No client-side configuration needed.

Example `claude_desktop_config.json`:

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
        "MOSS_CLIENT_SECRET": "your-client-secret",
        "MOSS_BASE_URL": "http://localhost:3001"
      }
    }
  }
}
```

### Custom MCP Clients

For custom MCP clients making browser-based requests:

```typescript
fetch('http://localhost:3001/api/oauth/token', {
  method: 'POST',
  credentials: 'include', // Required for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    grant_type: 'client_credentials',
    client_id: 'mcp_xxxxxxxxxxxx',
    client_secret: 'your-secret',
  }),
})
```

## Testing Results (2025-10-13)

✅ All OAuth endpoints support CORS preflight (OPTIONS)
✅ All endpoints return correct CORS headers
✅ Origin reflection working correctly
✅ Credentials support enabled
✅ Max-Age set to 24 hours for performance

### Test Output

```bash
$ curl -i -X OPTIONS http://localhost:3001/.well-known/oauth-authorization-server -H "Origin: https://example.com"

HTTP/1.1 204 No Content
access-control-allow-credentials: true
access-control-allow-headers: Content-Type, Authorization, X-Requested-With, Accept, Origin
access-control-allow-methods: GET, POST, PATCH, DELETE, OPTIONS
access-control-allow-origin: https://example.com
access-control-expose-headers: Content-Length, Content-Type
access-control-max-age: 86400
```

## Future Enhancements

- [ ] Add per-client CORS configuration in OAuth client settings
- [ ] Implement CORS error rate monitoring
- [ ] Add admin UI for managing allowed origins
- [ ] Support dynamic origin validation based on OAuth client redirect URIs

## References

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [RFC 6454: The Web Origin Concept](https://datatracker.ietf.org/doc/html/rfc6454)
- [OWASP: Cross-Origin Resource Sharing (CORS)](https://owasp.org/www-community/attacks/CORS_Misconfiguration)
- [OAuth 2.1 Security BCP](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
