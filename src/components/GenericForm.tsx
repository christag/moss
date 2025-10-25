/**
 * GenericForm Component
 *
 * A reusable form component that handles:
 * - Create and edit modes
 * - Zod schema validation
 * - Various field types (text, select, textarea, checkbox, etc.)
 * - API integration
 * - Loading and error states
 * - Success notifications
 */
'use client'

import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button, Input, Select, Textarea, Checkbox } from '@/components/ui'

export type FieldType =
  | 'text'
  | 'email'
  | 'url'
  | 'tel'
  | 'number'
  | 'select'
  | 'textarea'
  | 'checkbox'
  | 'date'
  | 'datetime-local'

export interface SelectOption {
  value: string
  label: string
}

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  helpText?: string
  required?: boolean
  options?: SelectOption[] // For select fields
  rows?: number // For textarea fields
  defaultValue?: string | number | boolean | null
  disabled?: boolean
  hidden?: boolean // Conditionally hide fields
  width?: 'full' | 'half' | 'third' // Column width for multi-column layouts
  group?: string // Optional group name for field grouping
}

interface GenericFormProps<T extends z.ZodType> {
  /** Form title */
  title: string
  /** Field configuration array */
  fields: FieldConfig[]
  /** Zod validation schema */
  schema: T
  /** API endpoint for form submission */
  apiEndpoint: string
  /** HTTP method (POST for create, PATCH for update) */
  method?: 'POST' | 'PATCH'
  /** Initial form values (for edit mode) */
  initialValues?: Partial<z.infer<T>>
  /** Callback after successful submission */
  onSuccess?: (data: z.infer<T>) => void
  /** Callback after error */
  onError?: (error: Error) => void
  /** Callback on cancel */
  onCancel?: () => void
  /** Submit button text */
  submitText?: string
  /** Show cancel button */
  showCancel?: boolean
  /** Enable compact mode with reduced spacing */
  compact?: boolean
}

export function GenericForm<T extends z.ZodType>({
  title,
  fields,
  schema,
  apiEndpoint,
  method = 'POST',
  initialValues = {},
  onSuccess,
  onError,
  onCancel,
  submitText = 'Save',
  showCancel = true,
  compact = false,
}: GenericFormProps<T>) {
  const [formData, setFormData] = useState<Record<string, string | number | boolean | null>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize form data with default values and initial values
  useEffect(() => {
    const initialData: Record<string, string | number | boolean | null> = {}
    fields.forEach((field) => {
      if (initialValues[field.name] !== undefined) {
        initialData[field.name] = initialValues[field.name] as string | number | boolean | null
      } else if (field.defaultValue !== undefined) {
        initialData[field.name] = field.defaultValue
      } else if (field.type === 'checkbox') {
        initialData[field.name] = false
      } else {
        initialData[field.name] = ''
      }
    })
    setFormData(initialData)
  }, [fields, initialValues])

  // Handle field change
  const handleFieldChange = (fieldName: string, value: string | number | boolean | null) => {
    // Convert string to number for number fields
    const field = fields.find((f) => f.name === fieldName)
    let processedValue = value
    if (field?.type === 'number' && value !== '' && value !== null && value !== undefined) {
      const numValue = Number(value)
      processedValue = isNaN(numValue) ? value : numValue
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: processedValue,
    }))
    setHasChanges(true)

    // Clear error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  // Validate field on blur
  const handleFieldBlur = (fieldName: string) => {
    try {
      // Validate the entire form to check this field
      schema.parse(formData)
      // If validation passes, clear any error for this field
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find((err) => err.path[0] === fieldName)
        if (fieldError) {
          setErrors((prev) => ({
            ...prev,
            [fieldName]: fieldError.message,
          }))
        }
      }
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Clean up form data - convert empty strings to undefined for optional fields
    const cleanedData: Record<string, string | number | boolean | null | undefined> = {
      ...formData,
    }
    fields.forEach((field) => {
      const value = cleanedData[field.name]

      // Handle number fields
      if (field.type === 'number') {
        if (value === '' || value === null) {
          cleanedData[field.name] = undefined
        } else if (typeof value === 'string') {
          // Convert string to number
          const numValue = Number(value)
          cleanedData[field.name] = isNaN(numValue) ? undefined : numValue
        }
      }
      // Remove empty strings for optional fields
      else if (!field.required && value === '') {
        cleanedData[field.name] = undefined
      }
    })

    // Validate form data
    try {
      schema.parse(cleanedData)
      setErrors({})
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const fieldName = err.path[0] as string
          validationErrors[fieldName] = err.message
        })
        setErrors(validationErrors)
        return
      }
    }

    // Submit to API
    setIsSubmitting(true)
    try {
      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit form')
      }

      const result = await response.json()
      setHasChanges(false)

      // Show success toast
      toast.success(method === 'POST' ? 'Created successfully!' : 'Updated successfully!')

      if (onSuccess) {
        onSuccess(result.data)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setSubmitError(errorMessage)

      // Show error toast
      toast.error(errorMessage)

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?')
      if (!confirmed) return
    }

    if (onCancel) {
      onCancel()
    }
  }

  // Render field based on type
  const renderField = (field: FieldConfig) => {
    if (field.hidden) return null

    const fieldValue = formData[field.name]
    const stringValue = fieldValue === null || fieldValue === undefined ? '' : String(fieldValue)
    const commonProps = {
      id: field.name,
      name: field.name,
      value: field.type === 'checkbox' ? fieldValue : stringValue,
      disabled: field.disabled || isSubmitting,
      error: errors[field.name],
      helperText: field.helpText,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
      ) => {
        handleFieldChange(field.name, e.target.value)
      },
      onBlur: () => handleFieldBlur(field.name),
    }

    switch (field.type) {
      case 'select':
        return (
          <Select
            id={commonProps.id}
            name={commonProps.name}
            value={stringValue}
            disabled={commonProps.disabled}
            error={commonProps.error}
            helperText={commonProps.helperText}
            onChange={commonProps.onChange}
            onBlur={commonProps.onBlur}
            label={field.label}
            required={field.required}
            options={field.options || []}
          />
        )

      case 'textarea':
        return (
          <Textarea
            id={commonProps.id}
            name={commonProps.name}
            value={stringValue}
            disabled={commonProps.disabled}
            error={commonProps.error}
            helperText={commonProps.helperText}
            onChange={commonProps.onChange}
            onBlur={commonProps.onBlur}
            label={field.label}
            required={field.required}
            placeholder={field.placeholder}
            rows={field.rows || 4}
          />
        )

      case 'checkbox':
        return (
          <Checkbox
            id={commonProps.id}
            name={commonProps.name}
            disabled={commonProps.disabled}
            error={commonProps.error}
            onBlur={commonProps.onBlur}
            label={field.label}
            checked={!!formData[field.name]}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleFieldChange(field.name, e.target.checked)
            }}
          />
        )

      case 'text':
      case 'email':
      case 'url':
      case 'tel':
      case 'number':
      case 'date':
      case 'datetime-local':
        return (
          <Input
            id={commonProps.id}
            name={commonProps.name}
            value={stringValue}
            disabled={commonProps.disabled}
            error={commonProps.error}
            helperText={commonProps.helperText}
            onChange={commonProps.onChange}
            onBlur={commonProps.onBlur}
            type={field.type}
            label={field.label}
            required={field.required}
            placeholder={field.placeholder}
            showValidState={true}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="generic-form">
      <h2 className="form-title" id="form-title">
        {title}
      </h2>

      <form onSubmit={handleSubmit} className="form-content" aria-labelledby="form-title">
        {submitError && (
          <div className="form-error" role="alert" aria-live="assertive">
            <strong>Error:</strong> {submitError}
          </div>
        )}

        <div className="form-fields">
          {fields.map((field) => (
            <div
              key={field.name}
              className={`form-field ${field.width ? `field-width-${field.width}` : 'field-width-full'}`}
            >
              {renderField(field)}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !hasChanges}
            isLoading={isSubmitting}
            aria-label={isSubmitting ? `${submitText}...` : submitText}
          >
            {submitText}
          </Button>

          {showCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              aria-label="Cancel and return without saving"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <style jsx>{`
        .generic-form {
          background: var(--color-off-white);
          border-radius: 8px;
          padding: ${compact ? '1rem' : '1.5rem'};
          max-width: 900px;
          margin: 0 auto;
        }

        .form-title {
          font-size: ${compact ? '1.5rem' : '1.8rem'};
          font-weight: 600;
          color: var(--color-brew-black);
          margin-bottom: ${compact ? '0.75rem' : '1rem'};
        }

        .form-content {
          display: flex;
          flex-direction: column;
          gap: ${compact ? '0.75rem' : '1rem'};
        }

        .form-error {
          background: var(--color-orange);
          color: var(--color-brew-black);
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .form-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: ${compact ? 'var(--spacing-sm)' : 'var(--spacing-md)'};
          column-gap: var(--spacing-lg);
        }

        .form-field {
          width: 100%;
        }

        /* Multi-column layout support */
        .field-width-full {
          grid-column: 1 / -1;
        }

        .field-width-half {
          grid-column: span 1;
        }

        .field-width-third {
          grid-column: span 1;
          min-width: 200px;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: ${compact ? '0.5rem' : '1rem'};
          padding-top: ${compact ? '0.75rem' : '1rem'};
          border-top: 1px solid rgba(var(--color-black-rgb), 0.1);
          grid-column: 1 / -1;
        }

        @media (max-width: 768px) {
          .generic-form {
            padding: 1rem;
          }

          .form-title {
            font-size: 1.5rem;
          }

          .form-fields {
            grid-template-columns: 1fr;
          }

          .field-width-half,
          .field-width-third {
            grid-column: 1 / -1;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
