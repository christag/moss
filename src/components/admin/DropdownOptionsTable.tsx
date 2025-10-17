'use client'

/**
 * DropdownOptionsTable Component
 * Displays dropdown options in a responsive table with edit/archive actions
 */

import { useState } from 'react'
import type { DropdownFieldOption } from '@/types'

interface DropdownOptionsTableProps {
  options: DropdownFieldOption[]
  onEdit: (option: DropdownFieldOption) => void
  onArchive: (option: DropdownFieldOption) => void
  onRefresh: () => void
}

export default function DropdownOptionsTable({
  options,
  onEdit,
  onArchive,
}: DropdownOptionsTableProps) {
  const [sortField, setSortField] = useState<keyof DropdownFieldOption>('display_order')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: keyof DropdownFieldOption) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedOptions = [...options].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]

    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    }

    return 0
  })

  const SortIcon = ({ field }: { field: keyof DropdownFieldOption }) => {
    if (sortField !== field) {
      return <span style={{ color: 'var(--color-brew-black-40)' }}>↕</span>
    }
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
  }

  return (
    <>
      {/* Add responsive CSS for the table */}
      <style jsx>{`
        @media (max-width: 768px) {
          .hide-on-mobile {
            display: none !important;
          }
          .compact-on-mobile {
            font-size: 13px !important;
            padding: 8px !important;
          }
        }
        @media (max-width: 1024px) {
          .hide-on-tablet {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead style={{ backgroundColor: 'var(--color-off-white)' }}>
              <tr>
                <th
                  onClick={() => handleSort('object_type')}
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    textAlign: 'left',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Object <SortIcon field="object_type" />
                </th>
                <th
                  onClick={() => handleSort('field_name')}
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    textAlign: 'left',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Field <SortIcon field="field_name" />
                </th>
                <th
                  onClick={() => handleSort('option_value')}
                  className="hide-on-mobile"
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    textAlign: 'left',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Value <SortIcon field="option_value" />
                </th>
                <th
                  onClick={() => handleSort('option_label')}
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    textAlign: 'left',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Label <SortIcon field="option_label" />
                </th>
                <th
                  onClick={() => handleSort('display_order')}
                  className="hide-on-tablet"
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    textAlign: 'center',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Order <SortIcon field="display_order" />
                </th>
                <th
                  className="hide-on-tablet"
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    textAlign: 'center',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Color
                </th>
                <th
                  onClick={() => handleSort('usage_count')}
                  className="hide-on-mobile"
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    textAlign: 'center',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Usage <SortIcon field="usage_count" />
                </th>
                <th
                  onClick={() => handleSort('is_active')}
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    textAlign: 'center',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Status <SortIcon field="is_active" />
                </th>
                <th
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    textAlign: 'right',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: 'var(--color-brew-black-60)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'white' }}>
              {sortedOptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: 'var(--spacing-2xl) var(--spacing-lg)',
                      textAlign: 'center',
                      color: 'var(--color-brew-black-60)',
                      fontSize: 'var(--font-size-base)',
                    }}
                  >
                    No dropdown options found. Add your first option to get started.
                  </td>
                </tr>
              ) : (
                sortedOptions.map((option) => (
                  <tr
                    key={option.id}
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      backgroundColor: !option.is_active ? 'var(--color-off-white)' : 'white',
                      opacity: !option.is_active ? 0.6 : 1,
                    }}
                  >
                    <td
                      style={{
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        color: 'var(--color-brew-black)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.object_type}
                    </td>
                    <td
                      style={{
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-brew-black)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.field_name}
                    </td>
                    <td
                      className="hide-on-mobile"
                      style={{
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'monospace',
                        color: 'var(--color-brew-black-60)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.option_value}
                    </td>
                    <td
                      style={{
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-brew-black)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-sm)',
                          flexWrap: 'wrap',
                        }}
                      >
                        {option.option_label}
                        {option.is_system && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500',
                              backgroundColor: '#E3F2FD',
                              color: 'var(--color-morning-blue)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            System
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className="hide-on-tablet"
                      style={{
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-brew-black)',
                        textAlign: 'center',
                      }}
                    >
                      {option.display_order}
                    </td>
                    <td
                      className="hide-on-tablet"
                      style={{
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        fontSize: 'var(--font-size-sm)',
                        textAlign: 'center',
                      }}
                    >
                      {option.color ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--spacing-xs)',
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              border: '1px solid var(--color-border)',
                              backgroundColor: option.color,
                              flexShrink: 0,
                            }}
                            title={option.color}
                          />
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--color-brew-black-60)',
                              fontFamily: 'monospace',
                              display: 'none',
                            }}
                          >
                            {option.color}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-brew-black-40)' }}>—</span>
                      )}
                    </td>
                    <td
                      className="hide-on-mobile"
                      style={{
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        fontSize: 'var(--font-size-sm)',
                        textAlign: 'center',
                      }}
                    >
                      {option.usage_count > 0 ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: '#E8F5E9',
                            color: 'var(--color-green)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {option.usage_count}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-brew-black-40)' }}>0</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        textAlign: 'center',
                      }}
                    >
                      {option.is_active ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: '#E8F5E9',
                            color: 'var(--color-green)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Active
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: 'var(--color-disabled)',
                            color: 'var(--color-brew-black-60)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Archived
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        textAlign: 'right',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 'var(--spacing-md)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          onClick={() => onEdit(option)}
                          style={{
                            color: 'var(--color-morning-blue)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                          }}
                          title="Edit option"
                        >
                          Edit
                        </button>
                        {!option.is_system && option.is_active && (
                          <button
                            onClick={() => onArchive(option)}
                            style={{
                              color: 'var(--color-orange)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: '500',
                              whiteSpace: 'nowrap',
                            }}
                            title="Archive option"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile scrolling hint */}
        {sortedOptions.length > 0 && (
          <div
            style={{
              padding: 'var(--spacing-sm)',
              textAlign: 'center',
              fontSize: '11px',
              color: 'var(--color-brew-black-60)',
              borderTop: '1px solid var(--color-border)',
              display: 'none',
            }}
            className="show-on-mobile-only"
          >
            ← Swipe to see more columns →
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .show-on-mobile-only {
            display: block !important;
          }
        }
      `}</style>
    </>
  )
}
