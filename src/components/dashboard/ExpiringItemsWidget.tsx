/**
 * ExpiringItemsWidget Component
 * Widget for displaying expiring items (warranties, licenses, contracts)
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ExpiringItem {
  id: string
  name?: string
  device_name?: string
  license_name?: string
  contract_title?: string
  days_until_expiration: number
  [key: string]: unknown
}

interface ExpiringItemsWidgetProps {
  title: string
  apiEndpoint: string
  columns: Array<{
    key: string
    label: string
    render?: (item: ExpiringItem) => React.ReactNode
  }>
  linkPattern: string
  emptyMessage?: string
  days?: number
  limit?: number
}

export default function ExpiringItemsWidget({
  title,
  apiEndpoint,
  columns,
  linkPattern,
  emptyMessage = 'No items expiring soon',
  days = 90,
  limit = 5,
}: ExpiringItemsWidgetProps) {
  const [items, setItems] = useState<ExpiringItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [days, limit])

  async function fetchItems() {
    try {
      setLoading(true)
      const response = await fetch(`${apiEndpoint}?days=${days}&limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch items')
      const data = await response.json()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  function getDaysColor(days: number): string {
    if (days <= 30) return 'var(--color-orange)'
    if (days <= 60) return 'var(--color-tangerine)'
    return 'var(--color-light-blue)'
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: 'var(--spacing-lg)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
      }}
    >
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
        {title}
      </h2>

      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-lg)',
            color: 'var(--color-brew-black-60)',
          }}
        >
          Loading...
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--color-orange)', padding: 'var(--spacing-md)' }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-lg)',
            color: 'var(--color-brew-black-60)',
          }}
        >
          {emptyMessage}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={{
                      padding: 'var(--spacing-sm)',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'var(--color-brew-black-60)',
                    }}
                  >
                    {column.label}
                  </th>
                ))}
                <th
                  style={{
                    padding: 'var(--spacing-sm)',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--color-brew-black-60)',
                  }}
                >
                  Days Left
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={{
                        padding: 'var(--spacing-sm)',
                        fontSize: '0.875rem',
                      }}
                    >
                      {column.render ? (
                        column.render(item)
                      ) : column.key === 'name' ? (
                        <Link
                          href={linkPattern.replace(':id', item.id)}
                          style={{ color: 'var(--color-morning-blue)', textDecoration: 'none' }}
                        >
                          {item[column.key] as string}
                        </Link>
                      ) : (
                        String(item[column.key] ?? '')
                      )}
                    </td>
                  ))}
                  <td
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: getDaysColor(item.days_until_expiration),
                    }}
                  >
                    {item.days_until_expiration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
