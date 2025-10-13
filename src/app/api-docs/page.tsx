/**
 * API Documentation - Main Overview Page
 * Landing page for the M.O.S.S. API documentation
 */
import { Metadata } from 'next'
import { API_RESOURCES } from '@/lib/apiDocs'
import { CodeBlock } from '@/components/CodeBlock'
import { ApiDocSection } from '@/components/ApiDocSection'
import { ResourceCard } from '@/components/ResourceCard'

export const metadata: Metadata = {
  title: 'M.O.S.S. API Documentation',
  description: 'Complete API documentation for the M.O.S.S. IT asset management platform',
  robots: 'noindex, nofollow',
}

export default function ApiDocsPage() {
  return (
    <div>
      {/* Header */}
      <header style={{ marginBottom: 'var(--spacing-3xl)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-4xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-black)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          M.O.S.S. API Documentation
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-brew-black-60)',
            maxWidth: '800px',
          }}
        >
          Complete reference for the M.O.S.S. REST API. Learn how to integrate with our IT asset
          management platform, manage devices, people, networks, and more.
        </p>
      </header>

      {/* Security Warning - API is currently public */}
      <ApiDocSection id="security-notice" title="⚠️ Security Notice" variant="warning">
        <div
          style={{
            padding: 'var(--spacing-md)',
            backgroundColor: 'rgba(253, 106, 61, 0.1)',
            border: '2px solid var(--color-orange)',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <p style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-md)' }}>
            <strong style={{ color: 'var(--color-orange)' }}>
              The M.O.S.S. API is currently publicly accessible without authentication.
            </strong>
          </p>
          <p style={{ marginBottom: 'var(--spacing-md)' }}>
            This configuration is suitable for <strong>development and internal use only</strong>.
            All API routes are excluded from the authentication middleware and do not require bearer
            tokens or other authentication headers.
          </p>
          <p style={{ marginBottom: 'var(--spacing-sm)' }}>
            <strong>Important considerations:</strong>
          </p>
          <ul style={{ marginBottom: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
            <li>
              Do not expose this API to the public internet without implementing authentication
            </li>
            <li>For production deployments, configure API authentication via the Admin panel</li>
            <li>
              See the{' '}
              <a
                href="/docs/API-AUTHENTICATION-POLICY.md"
                style={{
                  color: 'var(--color-morning-blue)',
                  textDecoration: 'underline',
                }}
              >
                Authentication Policy
              </a>{' '}
              for production deployment recommendations
            </li>
          </ul>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-brew-black-60)',
              margin: 0,
            }}
          >
            The example code shown in this documentation includes authentication headers for
            demonstration purposes, but they are not currently enforced by the API.
          </p>
        </div>
      </ApiDocSection>

      {/* Quick Start */}
      <ApiDocSection id="quick-start" title="Quick Start" variant="info">
        <p style={{ marginBottom: 'var(--spacing-md)' }}>
          All API requests require authentication. Here&apos;s a simple example to get started:
        </p>
        <CodeBlock
          language="javascript"
          title="Example: Fetch Devices"
          code={`// Using fetch API
const response = await fetch('https://your-moss-instance.com/api/devices', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data.devices);`}
        />
        <CodeBlock
          language="bash"
          title="Example: Using cURL"
          code={`curl -X GET "https://your-moss-instance.com/api/devices?page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json"`}
        />
      </ApiDocSection>

      {/* Authentication */}
      <ApiDocSection id="authentication" title="Authentication" variant="warning">
        <p style={{ marginBottom: 'var(--spacing-md)' }}>
          The M.O.S.S. API uses bearer token authentication. Include your API token in the{' '}
          <code>Authorization</code> header:
        </p>
        <CodeBlock language="bash" code={`Authorization: Bearer YOUR_ACCESS_TOKEN`} />
        <div
          className="card"
          style={{
            marginTop: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            backgroundColor: 'rgba(255, 187, 92, 0.1)',
            border: '1px solid var(--color-tangerine)',
          }}
        >
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
            <strong>⚠️ Security Note:</strong> Never expose your API tokens in client-side code or
            public repositories. Tokens grant full access to your M.O.S.S. instance.
          </p>
        </div>
      </ApiDocSection>

      {/* Response Format */}
      <ApiDocSection id="response-format" title="Response Format">
        <p style={{ marginBottom: 'var(--spacing-md)' }}>
          All API responses follow a consistent JSON format with a <code>success</code> field,
          optional <code>message</code>, and <code>data</code> or <code>error</code> fields:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
          <div>
            <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Success Response</h4>
            <CodeBlock
              language="json"
              code={JSON.stringify(
                {
                  success: true,
                  message: 'Devices retrieved successfully',
                  data: {
                    devices: [],
                    pagination: {
                      page: 1,
                      limit: 50,
                      total: 100,
                      total_pages: 2,
                    },
                  },
                },
                null,
                2
              )}
            />
          </div>
          <div>
            <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Error Response</h4>
            <CodeBlock
              language="json"
              code={JSON.stringify(
                {
                  success: false,
                  error: 'Validation failed',
                  details: {
                    errors: [
                      {
                        path: ['device_type'],
                        message: 'Required',
                      },
                    ],
                  },
                },
                null,
                2
              )}
            />
          </div>
        </div>
      </ApiDocSection>

      {/* Pagination */}
      <ApiDocSection id="pagination" title="Pagination">
        <p style={{ marginBottom: 'var(--spacing-md)' }}>
          List endpoints support pagination using <code>page</code> and <code>limit</code> query
          parameters:
        </p>
        <ul style={{ marginBottom: 'var(--spacing-md)' }}>
          <li>
            <strong>page</strong>: Page number (default: 1, minimum: 1)
          </li>
          <li>
            <strong>limit</strong>: Items per page (default: 50, maximum: 100)
          </li>
        </ul>
        <CodeBlock
          language="bash"
          code={`curl -X GET "https://your-moss-instance.com/api/devices?page=2&limit=25" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
        />
        <p style={{ marginTop: 'var(--spacing-md)' }}>
          All paginated responses include a <code>pagination</code> object with total counts and
          page information.
        </p>
      </ApiDocSection>

      {/* Filtering & Sorting */}
      <ApiDocSection id="filtering-sorting" title="Filtering & Sorting">
        <p style={{ marginBottom: 'var(--spacing-md)' }}>
          Most list endpoints support filtering by specific fields and sorting results:
        </p>
        <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Search</h4>
        <p style={{ marginBottom: 'var(--spacing-sm)' }}>
          Use the <code>search</code> parameter to perform full-text search across multiple fields:
        </p>
        <CodeBlock language="bash" code={`/api/devices?search=macbook`} />
        <h4 style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)' }}>
          Filters
        </h4>
        <p style={{ marginBottom: 'var(--spacing-sm)' }}>
          Filter by specific field values using query parameters:
        </p>
        <CodeBlock
          language="bash"
          code={`/api/devices?device_type=computer&status=active&manufacturer=Apple`}
        />
        <h4 style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)' }}>
          Sorting
        </h4>
        <p style={{ marginBottom: 'var(--spacing-sm)' }}>
          Control sort order with <code>sort_by</code> and <code>sort_order</code> parameters:
        </p>
        <CodeBlock language="bash" code={`/api/devices?sort_by=hostname&sort_order=asc`} />
      </ApiDocSection>

      {/* HTTP Status Codes */}
      <ApiDocSection id="status-codes" title="HTTP Status Codes">
        <p style={{ marginBottom: 'var(--spacing-md)' }}>
          The API uses standard HTTP status codes to indicate success or failure:
        </p>
        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Meaning</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="badge-success" style={{ padding: '4px 8px', borderRadius: '4px' }}>
                  200
                </span>
              </td>
              <td>OK</td>
              <td>Request succeeded</td>
            </tr>
            <tr>
              <td>
                <span className="badge-success" style={{ padding: '4px 8px', borderRadius: '4px' }}>
                  201
                </span>
              </td>
              <td>Created</td>
              <td>Resource created successfully</td>
            </tr>
            <tr>
              <td>
                <span className="badge-warning" style={{ padding: '4px 8px', borderRadius: '4px' }}>
                  400
                </span>
              </td>
              <td>Bad Request</td>
              <td>Invalid request parameters or body</td>
            </tr>
            <tr>
              <td>
                <span className="badge-warning" style={{ padding: '4px 8px', borderRadius: '4px' }}>
                  401
                </span>
              </td>
              <td>Unauthorized</td>
              <td>Missing or invalid authentication</td>
            </tr>
            <tr>
              <td>
                <span className="badge-warning" style={{ padding: '4px 8px', borderRadius: '4px' }}>
                  403
                </span>
              </td>
              <td>Forbidden</td>
              <td>Insufficient permissions</td>
            </tr>
            <tr>
              <td>
                <span className="badge-warning" style={{ padding: '4px 8px', borderRadius: '4px' }}>
                  404
                </span>
              </td>
              <td>Not Found</td>
              <td>Resource does not exist</td>
            </tr>
            <tr>
              <td>
                <span className="badge-error" style={{ padding: '4px 8px', borderRadius: '4px' }}>
                  500
                </span>
              </td>
              <td>Server Error</td>
              <td>Internal server error</td>
            </tr>
          </tbody>
        </table>
      </ApiDocSection>

      {/* Rate Limiting */}
      <ApiDocSection id="rate-limiting" title="Rate Limiting" variant="info">
        <p style={{ marginBottom: 'var(--spacing-md)' }}>
          The M.O.S.S. API implements rate limiting to ensure fair usage. Current limits:
        </p>
        <ul>
          <li>
            <strong>60 requests per minute</strong> per API token
          </li>
          <li>
            <strong>1000 requests per hour</strong> per API token
          </li>
        </ul>
        <p style={{ marginTop: 'var(--spacing-md)' }}>
          When rate limits are exceeded, the API returns a <code>429 Too Many Requests</code> status
          with a <code>Retry-After</code> header indicating when to retry.
        </p>
      </ApiDocSection>

      {/* Available Resources */}
      <ApiDocSection id="resources" title="Available Resources">
        <p style={{ marginBottom: 'var(--spacing-lg)' }}>
          Explore detailed documentation for each resource type:
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          {API_RESOURCES.map((resource) => (
            <ResourceCard
              key={resource.slug}
              href={`/api-docs/${resource.slug}`}
              name={resource.name}
              description={resource.description}
            />
          ))}
        </div>
      </ApiDocSection>

      {/* Support */}
      <ApiDocSection id="support" title="Need Help?" variant="info">
        <p style={{ marginBottom: 'var(--spacing-md)' }}>
          If you have questions or need assistance with the M.O.S.S. API:
        </p>
        <ul>
          <li>Check the detailed endpoint documentation in the sidebar</li>
          <li>Review the examples provided for each endpoint</li>
          <li>Contact your system administrator for API token access</li>
        </ul>
      </ApiDocSection>
    </div>
  )
}
