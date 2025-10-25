/**
 * EditableCell Component
 *
 * Individual cell component with inline editing support.
 * Supports text, number, select (dropdown), and toggle types.
 */
'use client'

import React, { useState, useRef, useEffect } from 'react'

export type CellType = 'text' | 'number' | 'select' | 'toggle' | 'readonly'

export interface SelectOption {
  value: string
  label: string
}

export interface EditableCellProps {
  /** Current value */
  value: string | number | boolean | null
  /** Cell type */
  type: CellType
  /** Options for select type */
  options?: SelectOption[]
  /** Callback when value changes */
  onChange: (newValue: string | number | boolean | null) => void
  /** Callback when edit is saved (optional, for async validation) */
  onSave?: (newValue: string | number | boolean | null) => Promise<boolean>
  /** Is cell disabled */
  disabled?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Custom CSS class */
  className?: string
}

export function EditableCell({
  value,
  type,
  options = [],
  onChange,
  onSave,
  disabled = false,
  placeholder = '',
  className = '',
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string | number | boolean | null>(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value)
  }, [value])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && type === 'text' && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    } else if (isEditing && type === 'select' && selectRef.current) {
      selectRef.current.focus()
    }
  }, [isEditing, type])

  const handleStartEdit = () => {
    if (!disabled && type !== 'readonly' && type !== 'toggle') {
      setIsEditing(true)
      setError(null)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
    setError(null)
  }

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setError(null)
    setIsSaving(true)

    try {
      if (onSave) {
        const success = await onSave(editValue)
        if (!success) {
          setError('Failed to save')
          setIsSaving(false)
          return
        }
      }

      onChange(editValue)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleToggle = () => {
    if (!disabled) {
      const newValue = !value
      onChange(newValue)
      if (onSave) {
        onSave(newValue)
      }
    }
  }

  // Render based on type and state
  if (type === 'toggle') {
    return (
      <div className={`editable-cell cell-toggle ${className}`}>
        <button
          type="button"
          className={`toggle-switch ${value ? 'active' : 'inactive'} ${disabled ? 'disabled' : ''}`}
          onClick={handleToggle}
          disabled={disabled}
          aria-label={value ? 'Enabled' : 'Disabled'}
          aria-pressed={!!value}
        >
          <span className="toggle-slider" />
        </button>

        <style jsx>{`
          .cell-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .toggle-switch {
            position: relative;
            width: 44px;
            height: 24px;
            background: var(--color-disabled);
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: background-color 0.2s ease;
            padding: 0;
          }

          .toggle-switch.active {
            background: var(--color-green);
          }

          .toggle-switch.disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }

          .toggle-switch:hover:not(.disabled) {
            opacity: 0.9;
          }

          .toggle-slider {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: transform 0.2s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }

          .toggle-switch.active .toggle-slider {
            transform: translateX(20px);
          }
        `}</style>
      </div>
    )
  }

  if (type === 'readonly') {
    return (
      <div className={`editable-cell cell-readonly ${className}`}>
        <span className="cell-value">{value?.toString() || '—'}</span>

        <style jsx>{`
          .cell-readonly {
            padding: 0.5rem;
            color: var(--color-brew-black-60);
          }

          .cell-value {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        `}</style>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className={`editable-cell cell-editing ${className}`}>
        {type === 'select' ? (
          <select
            ref={selectRef}
            value={editValue?.toString() || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="cell-select"
          >
            <option value="">Select...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef}
            type={type}
            value={editValue?.toString() || ''}
            onChange={(e) =>
              setEditValue(type === 'number' ? Number(e.target.value) : e.target.value)
            }
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving || disabled}
            placeholder={placeholder}
            className="cell-input"
          />
        )}

        {error && <span className="cell-error">{error}</span>}

        <style jsx>{`
          .cell-editing {
            position: relative;
          }

          .cell-input,
          .cell-select {
            width: 100%;
            height: 32px;
            padding: 0 0.5rem;
            border: 2px solid var(--color-blue);
            border-radius: 4px;
            font-size: 0.9rem;
            background: white;
            outline: none;
          }

          .cell-input:focus,
          .cell-select:focus {
            border-color: var(--color-blue);
            box-shadow: 0 0 0 3px rgba(var(--color-blue-rgb), 0.1);
          }

          .cell-error {
            position: absolute;
            bottom: -18px;
            left: 0;
            font-size: 0.75rem;
            color: var(--color-orange);
            white-space: nowrap;
          }
        `}</style>
      </div>
    )
  }

  // Display mode
  return (
    <div
      className={`editable-cell cell-display ${disabled ? 'disabled' : ''} ${className}`}
      onClick={handleStartEdit}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleStartEdit()
        }
      }}
    >
      <span className="cell-value">
        {type === 'select'
          ? options.find((opt) => opt.value === value?.toString())?.label ||
            value?.toString() ||
            '—'
          : value?.toString() || placeholder || '—'}
      </span>

      <style jsx>{`
        .cell-display {
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.15s ease;
          min-height: 32px;
          display: flex;
          align-items: center;
        }

        .cell-display:hover:not(.disabled) {
          background: rgba(var(--color-blue-rgb), 0.05);
        }

        .cell-display:focus:not(.disabled) {
          outline: 2px solid var(--color-blue);
          outline-offset: -2px;
        }

        .cell-display.disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .cell-value {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
        }
      `}</style>
    </div>
  )
}
