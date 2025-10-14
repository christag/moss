/**
 * SchemaViewer Component
 * Interactive schema explorer with expandable/collapsible properties
 */
'use client'

import { useState } from 'react'

export interface SchemaProperty {
  type: string
  description?: string
  required?: boolean
  enum?: string[]
  format?: string
  nullable?: boolean
  maxLength?: number
  minLength?: number
  minimum?: number
  maximum?: number
  default?: unknown
  properties?: Record<string, SchemaProperty>
  items?: SchemaProperty
}

export interface Schema {
  type: string
  required?: string[]
  properties?: Record<string, SchemaProperty>
}

interface SchemaViewerProps {
  schema: {
    type: string
    required?: string[]
    properties?: Record<string, SchemaProperty>
  }
  title?: string
}

function PropertyRow({
  name,
  property,
  isRequired,
  depth = 0,
}: {
  name: string
  property: SchemaProperty
  isRequired?: boolean
  depth?: number
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasNested = property.properties || property.items

  const getTypeDisplay = (prop: SchemaProperty): string => {
    if (prop.enum) return `enum: ${prop.enum.join(' | ')}`
    if (prop.format) return `${prop.type} (${prop.format})`
    if (prop.items) return `array<${prop.items.type}>`
    return prop.type
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 'var(--spacing-lg)' : 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: 'var(--spacing-sm)',
          borderBottom: '1px solid var(--color-border)',
          cursor: hasNested ? 'pointer' : 'default',
        }}
        onClick={() => hasNested && setExpanded(!expanded)}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {hasNested && (
            <span
              style={{
                fontSize: '12px',
                transition: 'transform 0.2s',
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              ▶
            </span>
          )}
          <span
            style={{
              fontWeight: 'var(--font-weight-medium)',
              fontFamily: "'Fira Code', monospace",
              color: 'var(--color-blue)',
            }}
          >
            {name}
          </span>
          {isRequired && (
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-orange)',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              required
            </span>
          )}
          {property.nullable && (
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-brew-black-60)',
                fontStyle: 'italic',
              }}
            >
              nullable
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-green)',
            fontFamily: "'Fira Code', monospace",
          }}
        >
          {getTypeDisplay(property)}
        </div>
      </div>

      {property.description && (
        <div
          style={{
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-brew-black-60)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {property.description}
        </div>
      )}

      {(property.maxLength ||
        property.minLength ||
        property.minimum ||
        property.maximum ||
        property.default !== undefined) && (
        <div
          style={{
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-brew-black-60)',
            fontFamily: "'Fira Code', monospace",
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            gap: 'var(--spacing-md)',
          }}
        >
          {property.maxLength && <span>maxLength: {property.maxLength}</span>}
          {property.minLength && <span>minLength: {property.minLength}</span>}
          {property.minimum !== undefined && <span>min: {property.minimum}</span>}
          {property.maximum !== undefined && <span>max: {property.maximum}</span>}
          {property.default !== undefined && (
            <span>default: {JSON.stringify(property.default)}</span>
          )}
        </div>
      )}

      {hasNested && expanded && property.properties && (
        <div
          style={{
            borderLeft: '2px solid var(--color-light-blue)',
            marginLeft: 'var(--spacing-sm)',
          }}
        >
          {Object.entries(property.properties).map(([propName, propValue]) => (
            <PropertyRow key={propName} name={propName} property={propValue} depth={depth + 1} />
          ))}
        </div>
      )}

      {hasNested && expanded && property.items && (
        <div
          style={{
            borderLeft: '2px solid var(--color-light-blue)',
            marginLeft: 'var(--spacing-sm)',
          }}
        >
          <PropertyRow name="[item]" property={property.items} depth={depth + 1} />
        </div>
      )}
    </div>
  )
}

export function SchemaViewer({ schema, title = 'Schema' }: SchemaViewerProps) {
  if (!schema.properties) {
    return (
      <div className="card" style={{ padding: 'var(--spacing-md)' }}>
        <p style={{ color: 'var(--color-brew-black-60)' }}>No schema properties defined</p>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: 'var(--spacing-md)',
          borderBottom: '2px solid var(--color-border)',
          backgroundColor: 'rgba(28, 127, 242, 0.05)',
        }}
      >
        <h4 style={{ margin: 0, color: 'var(--color-black)' }}>{title}</h4>
      </div>
      <div>
        {Object.entries(schema.properties).map(([name, property]) => (
          <PropertyRow
            key={name}
            name={name}
            property={property}
            isRequired={schema.required?.includes(name)}
          />
        ))}
      </div>
    </div>
  )
}
