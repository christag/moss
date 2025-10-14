/**
 * Collapsible Endpoint Section for API Documentation
 * Client component with expand/collapse functionality
 */
'use client'

import { useState } from 'react'
import type { ApiEndpoint } from '@/lib/apiDocs'
import { CodeBlock } from '@/components/CodeBlock'
import { SchemaViewer, type Schema } from '@/components/SchemaViewer'
import { MethodBadge, StatusBadge } from '@/components/ApiDocSection'

interface CollapsibleEndpointProps {
  endpoint: ApiEndpoint
  defaultExpanded?: boolean
}

export function CollapsibleEndpoint({
  endpoint,
  defaultExpanded = false,
}: CollapsibleEndpointProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div
      style={{
        marginBottom: 'var(--spacing-3xl)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Endpoint Header - Clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--color-black)',
          color: 'var(--color-off-white)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-brew-black)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-black)'
        }}
      >
        {/* Expand/Collapse Icon */}
        <span
          style={{
            fontSize: '1.2em',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ▶
        </span>

        <MethodBadge method={endpoint.method} size="md" />
        <code
          style={{
            fontSize: 'var(--font-size-lg)',
            fontFamily: "'Fira Code', monospace",
            flex: 1,
          }}
        >
          {endpoint.path}
        </code>
        {endpoint.authentication === 'required' && (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              backgroundColor: 'var(--color-tangerine)',
              color: 'var(--color-black)',
              borderRadius: '4px',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            🔒 Auth Required
          </span>
        )}
      </button>

      {/* Endpoint Body - Collapsible */}
      {isExpanded && (
        <div style={{ padding: 'var(--spacing-lg)' }}>
          {/* Description */}
          <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-lg)' }}>
            {endpoint.description}
          </p>

          {/* Role Requirement */}
          {endpoint.roleRequired && (
            <div
              className="card"
              style={{
                marginBottom: 'var(--spacing-lg)',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-tangerine-10)',
                border: '1px solid var(--color-tangerine)',
              }}
            >
              <strong>Required Role:</strong> <code>{endpoint.roleRequired}</code>
            </div>
          )}

          {/* Parameters */}
          {endpoint.parameters && endpoint.parameters.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Parameters</h3>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid var(--color-border)',
                      backgroundColor: 'var(--color-off-white)',
                    }}
                  >
                    <th
                      style={{
                        padding: 'var(--spacing-sm)',
                        textAlign: 'left',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: 'var(--spacing-sm)',
                        textAlign: 'left',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      In
                    </th>
                    <th
                      style={{
                        padding: 'var(--spacing-sm)',
                        textAlign: 'left',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        padding: 'var(--spacing-sm)',
                        textAlign: 'left',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      Required
                    </th>
                    <th
                      style={{
                        padding: 'var(--spacing-sm)',
                        textAlign: 'left',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.parameters.map((param, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <td style={{ padding: 'var(--spacing-sm)', verticalAlign: 'top' }}>
                        <code
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                          }}
                        >
                          {param.name}
                        </code>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-brew-black-60)',
                          }}
                        >
                          {param.in}
                        </span>
                      </td>
                      <td>
                        <code
                          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-green)' }}
                        >
                          {param.type}
                        </code>
                      </td>
                      <td>
                        {param.required ? (
                          <span
                            style={{
                              color: 'var(--color-orange)',
                              fontWeight: 'var(--font-weight-bold)',
                            }}
                          >
                            Yes
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-brew-black-60)' }}>No</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 'var(--font-size-sm)' }}>
                          {param.description}
                          {param.default !== undefined && (
                            <div style={{ marginTop: '4px', color: 'var(--color-brew-black-60)' }}>
                              Default: <code>{String(param.default)}</code>
                            </div>
                          )}
                          {param.validation && (
                            <div
                              style={{
                                marginTop: '4px',
                                color: 'var(--color-brew-black-60)',
                                fontFamily: "'Fira Code', monospace",
                              }}
                            >
                              {param.validation}
                            </div>
                          )}
                          {param.example !== undefined && (
                            <div style={{ marginTop: '4px', color: 'var(--color-blue)' }}>
                              Example: <code>{String(param.example)}</code>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Request Body */}
          {endpoint.requestBody && (
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Request Body</h3>
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-off-white)',
                  borderRadius: '4px',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)' }}>
                  <strong>Content-Type:</strong> <code>{endpoint.requestBody.contentType}</code>
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)' }}>
                  {endpoint.requestBody.description}
                </p>
              </div>
              {endpoint.requestBody.schema &&
                'type' in endpoint.requestBody.schema &&
                typeof endpoint.requestBody.schema.type === 'string' && (
                  <SchemaViewer schema={endpoint.requestBody.schema as Schema} />
                )}
            </div>
          )}

          {/* Responses */}
          {endpoint.responses && endpoint.responses.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Responses</h3>
              {endpoint.responses.map((response, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: 'var(--spacing-lg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      backgroundColor: 'var(--color-off-white)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-md)',
                    }}
                  >
                    <StatusBadge status={response.status} />
                    <span style={{ fontSize: 'var(--font-size-sm)' }}>{response.description}</span>
                  </div>
                  {response.example && (
                    <div style={{ padding: 'var(--spacing-md)' }}>
                      <CodeBlock language="json" code={JSON.stringify(response.example, null, 2)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Examples */}
          {endpoint.examples && endpoint.examples.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Examples</h3>
              {endpoint.examples.map((example, index) => (
                <div key={index} style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <h4 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-blue)' }}>
                    {example.title}
                  </h4>
                  {example.description && (
                    <p
                      style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}
                    >
                      {example.description}
                    </p>
                  )}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--spacing-md)',
                    }}
                  >
                    <div>
                      <CodeBlock
                        language="bash"
                        title="Request"
                        code={`curl -X ${example.request.method} "${example.request.url}" \\
${Object.entries(example.request.headers || {})
  .map(([key, value]) => `  -H "${key}: ${value}"`)
  .join(
    ' \\\n'
  )}${example.request.body ? ` \\\n  -d '${JSON.stringify(example.request.body)}'` : ''}`}
                      />
                    </div>
                    <div>
                      <CodeBlock
                        language="json"
                        title={`Response (${example.response.status})`}
                        code={JSON.stringify(example.response.body, null, 2)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Related Endpoints */}
          {endpoint.relatedEndpoints && endpoint.relatedEndpoints.length > 0 && (
            <div>
              <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Related Endpoints</h4>
              <ul style={{ fontSize: 'var(--font-size-sm)' }}>
                {endpoint.relatedEndpoints.map((path) => (
                  <li key={path}>
                    <code style={{ color: 'var(--color-blue)' }}>{path}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
