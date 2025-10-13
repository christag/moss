# API Documentation Guide

## Overview

M.O.S.S. includes a comprehensive, interactive API documentation site located at `/api-docs`. This documentation is built using the M.O.S.S. design system and provides complete reference for all REST API endpoints.

**Access URL**: `http://your-moss-instance.com/api-docs` (hidden from main navigation)

## Features

### 1. Interactive Components
- **Copy-to-Clipboard**: All code examples include one-click copying
- **Schema Explorer**: Expandable/collapsible request body schemas
- **Code Highlighting**: Syntax-highlighted JSON, JavaScript, Bash, and TypeScript
- **Responsive Design**: Works on desktop and mobile devices

### 2. Comprehensive Documentation
Each endpoint includes:
- HTTP method and path
- Authentication requirements
- Query parameters with types, defaults, and validation rules
- Request body schemas with interactive exploration
- Response examples for success and error cases
- Real-world usage examples (curl and JavaScript)
- Related endpoints

### 3. Design System Integration
- Colors: Morning Blue (#1C7FF2), Brew Black (#231F20), Off White (#FAF9F5)
- Typography: Inter font family, 18px base, 1.25 ratio
- Semantic colors for HTTP methods and status codes
- Consistent spacing using 8px grid

## Architecture

### Files Structure

```
src/
├── lib/
│   └── apiDocs.ts                    # API metadata definitions
├── components/
│   ├── CodeBlock.tsx                 # Syntax-highlighted code with copy
│   ├── SchemaViewer.tsx              # Interactive schema explorer
│   ├── ApiDocSection.tsx             # Doc sections + badges
│   ├── ResourceCard.tsx              # Interactive resource cards
│   └── SidebarLink.tsx               # Navigation links
└── app/
    └── api-docs/
        ├── layout.tsx                # Sidebar navigation layout
        ├── page.tsx                  # Overview/landing page
        └── [resource]/
            └── page.tsx              # Dynamic resource pages
```

### Key Components

#### CodeBlock
```tsx
<CodeBlock
  language="json"
  title="Example Response"
  code={JSON.stringify(data, null, 2)}
/>
```

#### SchemaViewer
```tsx
<SchemaViewer
  schema={requestBodySchema}
  title="Request Schema"
/>
```

#### ApiDocSection
```tsx
<ApiDocSection
  id="authentication"
  title="Authentication"
  variant="warning"
>
  {/* Content */}
</ApiDocSection>
```

## Adding New Endpoints

To document a new endpoint, add it to `src/lib/apiDocs.ts`:

```typescript
{
  name: 'Resource Name',
  slug: 'resource-slug',
  description: 'Brief description',
  endpoints: [
    {
      path: '/api/resource',
      method: 'GET',
      description: 'Detailed description',
      authentication: 'required',
      roleRequired: 'user', // optional
      parameters: [
        {
          name: 'param_name',
          in: 'query',
          type: 'string',
          required: false,
          default: 'value',
          description: 'What this parameter does',
          validation: 'validation rules',
          example: 'example value',
        },
      ],
      requestBody: {
        contentType: 'application/json',
        schema: { /* JSON schema */ },
        example: { /* Example object */ },
        description: 'Optional description',
      },
      responses: [
        {
          status: 200,
          description: 'Success response',
          example: { /* Response object */ },
        },
      ],
      examples: [
        {
          title: 'Example Title',
          description: 'Optional description',
          request: {
            method: 'GET',
            url: '/api/resource?param=value',
            headers: {
              'Authorization': 'Bearer TOKEN',
            },
          },
          response: {
            status: 200,
            body: { /* Response */ },
          },
        },
      ],
      relatedEndpoints: ['/api/resource/[id]'],
    },
  ],
}
```

## Design Guidelines

### Colors

**HTTP Methods**:
- GET: Morning Blue (#1C7FF2)
- POST: Green (#28C077)
- PUT: Tangerine (#FFBB5C)
- DELETE: Orange (#FD6A3D)
- PATCH: Lime Green (#BCF46E)

**HTTP Status Codes**:
- 2xx Success: Green (#28C077)
- 3xx Redirect: Light Blue (#ACD7FF)
- 4xx Client Error: Tangerine (#FFBB5C)
- 5xx Server Error: Orange (#FD6A3D)

**Sections**:
- Info: Light Blue (#ACD7FF) background
- Success: Green (#28C077) background
- Warning: Tangerine (#FFBB5C) background
- Error: Orange (#FD6A3D) background

### Typography

- **Headings**: Inter, Bold (700)
- **Body**: Inter, Regular (400)
- **Code**: Fira Code, Monaco, Courier New
- **Base Size**: 18px
- **Scale**: 1.25 ratio

### Spacing

Use design system spacing variables:
- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 16px
- `--spacing-lg`: 24px
- `--spacing-xl`: 32px
- `--spacing-2xl`: 48px
- `--spacing-3xl`: 64px

## Security

The API documentation site includes security measures:

1. **No Search Indexing**: `<meta name="robots" content="noindex, nofollow">`
2. **Hidden URL**: Not linked from main navigation
3. **No Sitemap Entry**: Excluded from search engine sitemaps
4. **Token Masking**: Example tokens are clearly marked as placeholders
5. **Security Warnings**: Prominent warnings about token security

## Testing

Test the documentation site using Playwright:

```bash
npm run dev
```

Then navigate to `http://localhost:3001/api-docs` and verify:

- [ ] Overview page loads with all sections
- [ ] Sidebar navigation works (click each resource)
- [ ] Code blocks display correctly
- [ ] Copy buttons work
- [ ] Schema viewer expands/collapses
- [ ] Examples show side-by-side
- [ ] Colors match design system
- [ ] Mobile responsive (sidebar toggles)
- [ ] Active states highlight correctly

## Maintenance

### Keeping Documentation Current

1. **Update apiDocs.ts** when API changes:
   - Add new endpoints
   - Update parameter types
   - Modify response schemas
   - Add new examples

2. **Sync with Zod Schemas**: Request body schemas should match Zod validation schemas in `src/lib/schemas/`

3. **Update Examples**: Keep code examples current with actual API behavior

4. **Version Notes**: Document API version changes in overview page

### Common Tasks

**Add a new resource**:
1. Add resource object to API_RESOURCES array
2. Define all endpoints with parameters, requests, responses
3. Add examples for common use cases
4. Test navigation and display

**Update an endpoint**:
1. Find endpoint in apiDocs.ts
2. Modify parameters, request body, or responses
3. Update examples if needed
4. Verify changes render correctly

**Add code examples**:
1. Add to `examples` array in endpoint definition
2. Include both curl and JavaScript where applicable
3. Use realistic data in examples
4. Show success and error cases

## Future Enhancements

Potential improvements to consider:

1. **Try It Out**: Interactive API caller with authentication
2. **Postman Collection**: Auto-generate Postman collection from metadata
3. **OpenAPI Spec**: Generate OpenAPI 3.0 spec from metadata
4. **Changelog**: Document API changes by version
5. **SDK Examples**: Python, Ruby, Go code examples
6. **GraphQL Docs**: If GraphQL endpoint added
7. **Webhooks**: Document webhook payloads and signatures
8. **Rate Limiting**: Real-time rate limit status
9. **Search**: Full-text search across all documentation
10. **Versioning**: Support for multiple API versions

## Resources

- [M.O.S.S. Design System](../src/styles/design-system.css)
- [API Routes](../src/app/api/)
- [Zod Schemas](../src/lib/schemas/)
- [TypeScript Types](../src/types/index.ts)
