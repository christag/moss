/**
 * Admin Audit Logs Page
 * View and filter administrative actions
 */

'use client'

import React, { useState, useEffect } from 'react'
import type { AdminAuditLog } from '@/types'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    category: '',
    action: '',
    limit: 50,
  })

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.action) params.append('action', filters.action)
      params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch audit logs')

      const data = await response.json()
      setLogs(data.logs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: 'var(--color-brew-black)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Audit Logs
        </h1>
        <p style={{ color: 'var(--color-brew-black-60)' }}>
          View all administrative actions and system changes
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#FEE',
            color: 'var(--color-orange)',
            padding: 'var(--spacing-md)',
            borderRadius: '8px',
            marginBottom: 'var(--spacing-lg)',
            border: '1px solid var(--color-orange)',
          }}
        >
          {error}
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          backgroundColor: 'white',
          padding: 'var(--spacing-lg)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          Filters
        </h2>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
              }}
            >
              <option value="">All Categories</option>
              <option value="branding">Branding</option>
              <option value="authentication">Authentication</option>
              <option value="storage">Storage</option>
              <option value="integrations">Integrations</option>
              <option value="fields">Custom Fields</option>
              <option value="rbac">RBAC</option>
              <option value="notifications">Notifications</option>
              <option value="backup">Backup</option>
            </select>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Action
            </label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              placeholder="Filter by action..."
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontWeight: '500',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Results
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
              }}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="250">250</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div
            style={{
              padding: 'var(--spacing-xl)',
              textAlign: 'center',
              color: 'var(--color-brew-black-60)',
            }}
          >
            No audit logs found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead
                style={{
                  backgroundColor: 'var(--color-off-white)',
                  borderBottom: '2px solid var(--color-border)',
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    Timestamp
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    Category
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    Action
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    Target
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    IP Address
                  </th>
                  <th
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom:
                        index < logs.length - 1 ? '1px solid var(--color-border)' : 'none',
                      backgroundColor: index % 2 === 0 ? 'white' : 'var(--color-off-white)',
                    }}
                  >
                    <td
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        fontSize: 'var(--font-size-sm)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: 'var(--font-size-sm)',
                          backgroundColor: getCategoryColor(log.category),
                          color: 'var(--color-brew-black)',
                        }}
                      >
                        {log.category}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {log.action}
                    </td>
                    <td
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {log.target_type ? `${log.target_type}` : '-'}
                    </td>
                    <td
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {log.ip_address || '-'}
                    </td>
                    <td
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        fontSize: 'var(--font-size-sm)',
                        maxWidth: '300px',
                      }}
                    >
                      <details>
                        <summary style={{ cursor: 'pointer', color: 'var(--color-morning-blue)' }}>
                          View
                        </summary>
                        <pre
                          style={{
                            marginTop: 'var(--spacing-xs)',
                            padding: 'var(--spacing-sm)',
                            backgroundColor: 'var(--color-brew-black)',
                            color: 'var(--color-off-white)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxHeight: '200px',
                          }}
                        >
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 'var(--spacing-md)',
          textAlign: 'center',
          color: 'var(--color-brew-black-60)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Showing {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
      </div>
    </div>
  )
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    branding: 'var(--color-morning-blue)',
    authentication: 'var(--color-orange)',
    storage: 'var(--color-tangerine)',
    integrations: 'var(--color-green)',
    fields: 'var(--color-light-blue)',
    rbac: 'var(--color-lime-green)',
    notifications: 'var(--color-light-blue)',
    backup: 'var(--color-lime-green)',
  }
  return colors[category] || 'var(--color-light-blue)'
}
