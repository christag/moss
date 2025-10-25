/**
 * QuickCreateSection Component
 *
 * Collapsible section for bulk creation of child objects.
 * Allows users to quickly generate multiple items with sequential naming.
 *
 * Use cases:
 * - Creating 24/48 interfaces for a switch
 * - Creating 48 patch panel ports
 * - Creating multiple child devices (e.g., line cards)
 *
 * Pattern inspired by network equipment configuration wizards.
 */
'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export interface QuickCreateField {
  /** Field key */
  key: string
  /** Field label */
  label: string
  /** Field type */
  type: 'text' | 'select' | 'number'
  /** Options for select type */
  options?: Array<{ value: string; label: string }>
  /** Default value */
  defaultValue?: string | number
  /** Placeholder text */
  placeholder?: string
}

export interface QuickCreateSectionProps<T = Record<string, unknown>> {
  /** Section title */
  title: string
  /** Description of what will be created */
  description?: string
  /** Template fields (common to all items) */
  templateFields: QuickCreateField[]
  /** Callback when items are generated */
  onGenerate: (items: T[]) => void
  /** Example patterns to display */
  examples?: string[]
  /** Default quantity */
  defaultQuantity?: number
  /** Max quantity allowed */
  maxQuantity?: number
  /** Default name pattern */
  defaultPattern?: string
  /** Custom CSS class */
  className?: string
}

export function QuickCreateSection<T = Record<string, unknown>>({
  title,
  description,
  templateFields,
  onGenerate,
  examples = [],
  defaultQuantity = 24,
  maxQuantity = 100,
  defaultPattern = 'port-{n}',
  className = '',
}: QuickCreateSectionProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [quantity, setQuantity] = useState(defaultQuantity)
  const [namePattern, setNamePattern] = useState(defaultPattern)
  const [startNumber, setStartNumber] = useState(1)
  const [templateValues, setTemplateValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    templateFields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initial[field.key] = field.defaultValue
      }
    })
    return initial
  })
  const [showPreview, setShowPreview] = useState(false)

  // Generate preview of items
  const previewItems = useMemo(() => {
    const items: Array<{ name: string; [key: string]: unknown }> = []

    for (let i = 0; i < Math.min(quantity, 10); i++) {
      const itemNumber = startNumber + i
      const name = namePattern.replace(/\{n\}/g, String(itemNumber))

      items.push({
        name,
        ...templateValues,
      })
    }

    return items
  }, [quantity, namePattern, startNumber, templateValues])

  // Handle template field change
  const handleTemplateChange = (key: string, value: unknown) => {
    setTemplateValues((prev) => ({ ...prev, [key]: value }))
  }

  // Handle generate
  const handleGenerate = () => {
    const items: T[] = []

    for (let i = 0; i < quantity; i++) {
      const itemNumber = startNumber + i
      const name = namePattern.replace(/\{n\}/g, String(itemNumber))

      items.push({
        name,
        ...templateValues,
      } as T)
    }

    onGenerate(items)
    setIsExpanded(false)
  }

  return (
    <div className={`quick-create-section ${className}`}>
      <div className="quick-create-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="quick-create-title">
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
          <h3>{title}</h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
        >
          {isExpanded ? 'Cancel' : 'Quick Create'}
        </Button>
      </div>

      {isExpanded && (
        <div className="quick-create-body">
          {description && <p className="description">{description}</p>}

          {examples.length > 0 && (
            <div className="examples">
              <strong>Examples:</strong>
              <ul>
                {examples.map((example, idx) => (
                  <li key={idx}>{example}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="quick-create-form">
            {/* Quantity */}
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="quantity">
                  Quantity <span className="required">*</span>
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
                <span className="field-hint">Max {maxQuantity} items</span>
              </div>

              <div className="form-field">
                <label htmlFor="startNumber">Start Number</label>
                <Input
                  id="startNumber"
                  type="number"
                  min={0}
                  value={startNumber}
                  onChange={(e) => setStartNumber(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Name Pattern */}
            <div className="form-field">
              <label htmlFor="namePattern">
                Name Pattern <span className="required">*</span>
              </label>
              <Input
                id="namePattern"
                type="text"
                value={namePattern}
                onChange={(e) => setNamePattern(e.target.value)}
                placeholder="Use {n} for sequential numbers"
              />
              <span className="field-hint">Use {'{n}'} as placeholder for sequential numbers</span>
            </div>

            {/* Template Fields */}
            {templateFields.length > 0 && (
              <div className="template-fields">
                <h4>Common Properties (applied to all items)</h4>
                <div className="form-grid">
                  {templateFields.map((field) => (
                    <div key={field.key} className="form-field">
                      <label htmlFor={field.key}>{field.label}</label>
                      {field.type === 'select' ? (
                        <Select
                          id={field.key}
                          value={String(templateValues[field.key] || '')}
                          onChange={(e) => handleTemplateChange(field.key, e.target.value)}
                          options={field.options || []}
                          placeholder="— Select —"
                        />
                      ) : (
                        <Input
                          id={field.key}
                          type={field.type}
                          value={String(templateValues[field.key] || '')}
                          onChange={(e) =>
                            handleTemplateChange(
                              field.key,
                              field.type === 'number' ? Number(e.target.value) : e.target.value
                            )
                          }
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Toggle */}
            <div className="preview-section">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>

              {showPreview && (
                <div className="preview-list">
                  <p className="preview-header">
                    Preview (showing first {Math.min(quantity, 10)} of {quantity} items):
                  </p>
                  <ul>
                    {previewItems.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.name}</strong>
                        {Object.entries(item)
                          .filter(([key]) => key !== 'name')
                          .map(([key, value]) => (
                            <span key={key} className="preview-field">
                              {key}: {String(value || '—')}
                            </span>
                          ))}
                      </li>
                    ))}
                    {quantity > 10 && (
                      <li className="preview-more">... and {quantity - 10} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="actions">
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={quantity < 1 || !namePattern}
              >
                Generate {quantity} Item{quantity !== 1 ? 's' : ''}
              </Button>
              <Button variant="secondary" onClick={() => setIsExpanded(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .quick-create-section {
          background: var(--color-off-white);
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }

        .quick-create-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          cursor: pointer;
          user-select: none;
        }

        .quick-create-header:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .quick-create-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .expand-icon {
          font-size: 0.75rem;
          color: var(--color-brew-black-60);
        }

        .quick-create-title h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .quick-create-body {
          padding: 0 1.5rem 1.5rem;
          border-top: 1px solid var(--color-border-default);
        }

        .description {
          margin: 1rem 0;
          color: var(--color-brew-black-60);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .examples {
          margin: 1rem 0;
          padding: 1rem;
          background: rgba(28, 127, 242, 0.05);
          border-left: 3px solid var(--color-morning-blue);
          border-radius: 4px;
        }

        .examples strong {
          color: var(--color-brew-black);
          display: block;
          margin-bottom: 0.5rem;
        }

        .examples ul {
          margin: 0;
          padding-left: 1.5rem;
          color: var(--color-brew-black-60);
        }

        .examples li {
          margin: 0.25rem 0;
        }

        .quick-create-form {
          margin-top: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-field label {
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--color-brew-black);
        }

        .required {
          color: var(--color-error-border);
        }

        .field-hint {
          font-size: 0.85rem;
          color: var(--color-brew-black-60);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .template-fields {
          margin: 1.5rem 0;
          padding: 1rem;
          background: var(--color-off-white);
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
        }

        .template-fields h4 {
          margin: 0 0 1rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .preview-section {
          margin: 1.5rem 0;
        }

        .preview-list {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--color-off-white);
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
        }

        .preview-header {
          margin: 0 0 0.75rem;
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--color-brew-black);
        }

        .preview-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .preview-list li {
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          background: white;
          border: 1px solid var(--color-border-default);
          border-radius: 3px;
          font-size: 0.9rem;
        }

        .preview-list li strong {
          color: var(--color-brew-black);
          display: block;
          margin-bottom: 0.25rem;
        }

        .preview-field {
          display: inline-block;
          margin-right: 1rem;
          color: var(--color-brew-black-60);
          font-size: 0.85rem;
        }

        .preview-more {
          padding: 0.5rem;
          text-align: center;
          color: var(--color-brew-black-60);
          font-style: italic;
          background: transparent !important;
          border: none !important;
        }

        .actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--color-border-default);
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
