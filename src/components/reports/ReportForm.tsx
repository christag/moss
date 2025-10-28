/**
 * Report Form Component
 *
 * Form for creating and editing custom reports.
 * Follows M.O.S.S. design system standards.
 */
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CreateCustomReportSchema, type CreateCustomReport } from '@/lib/schemas/reports'

interface ReportFormProps {
  initialData?: Partial<CreateCustomReport>
  onSubmit: (data: CreateCustomReport) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

export function ReportForm({
  initialData = {},
  onSubmit,
  onCancel,
  isEditing = false,
}: ReportFormProps) {
  const [formData, setFormData] = useState<Partial<CreateCustomReport>>({
    report_name: initialData.report_name || '',
    description: initialData.description || '',
    object_type: initialData.object_type || 'device',
    fields: initialData.fields || ['id'],
    filters: initialData.filters || null,
    grouping: initialData.grouping || null,
    aggregations: initialData.aggregations || null,
    sorting: initialData.sorting || null,
    is_public: initialData.is_public || false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle input change
  const handleChange = (
    field: keyof CreateCustomReport,
    value: string | boolean | string[] | unknown
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsSubmitting(true)

    try {
      // Validate form data
      const validated = CreateCustomReportSchema.parse(formData)

      // Submit
      await onSubmit(validated)
    } catch (error) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodErrors = error.errors as Array<{ path: string[]; message: string }>
        const errorMap: Record<string, string> = {}
        zodErrors.forEach((err) => {
          if (err.path.length > 0) {
            errorMap[err.path[0]] = err.message
          }
        })
        setErrors(errorMap)
      } else {
        alert('Failed to save report. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="report-form">
      {/* Basic Information */}
      <div className="form-section">
        <h3>Basic Information</h3>

        <div className="form-field">
          <label htmlFor="report_name">
            Report Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="report_name"
            value={formData.report_name}
            onChange={(e) => handleChange('report_name', e.target.value)}
            className={errors.report_name ? 'error' : ''}
            required
          />
          {errors.report_name && <span className="error-message">{errors.report_name}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-field">
          <label htmlFor="object_type">
            Object Type <span className="required">*</span>
          </label>
          <select
            id="object_type"
            value={formData.object_type}
            onChange={(e) =>
              handleChange('object_type', e.target.value as CreateCustomReport['object_type'])
            }
            required
          >
            <option value="device">Device</option>
            <option value="person">Person</option>
            <option value="location">Location</option>
            <option value="room">Room</option>
            <option value="company">Company</option>
            <option value="network">Network</option>
            <option value="io">Interface/Port</option>
            <option value="ip_address">IP Address</option>
            <option value="software">Software</option>
            <option value="saas_service">SaaS Service</option>
            <option value="installed_application">Installed Application</option>
            <option value="software_license">Software License</option>
            <option value="document">Document</option>
            <option value="external_document">External Document</option>
            <option value="contract">Contract</option>
            <option value="group">Group</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="fields">
            Fields to Display <span className="required">*</span>
          </label>
          <textarea
            id="fields"
            value={formData.fields?.join(', ') || ''}
            onChange={(e) =>
              handleChange(
                'fields',
                e.target.value.split(',').map((f) => f.trim())
              )
            }
            placeholder="e.g., id, device_name, serial_number"
            rows={2}
          />
          <small className="help-text">
            Comma-separated list of field names from the selected object type
          </small>
          {errors.fields && <span className="error-message">{errors.fields}</span>}
        </div>
      </div>

      {/* Advanced Configuration (JSON) */}
      <div className="form-section">
        <h3>Advanced Configuration (Optional)</h3>

        <div className="form-field">
          <label htmlFor="filters">Filters (JSON)</label>
          <textarea
            id="filters"
            value={formData.filters ? JSON.stringify(formData.filters, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = e.target.value ? JSON.parse(e.target.value) : null
                handleChange('filters', parsed)
              } catch {
                // Invalid JSON, ignore
              }
            }}
            placeholder='{"type":"condition","field":"status","operator":"equals","value":"active"}'
            rows={4}
            className="monospace"
          />
          <small className="help-text">
            Optional: JSON filter configuration (see documentation)
          </small>
        </div>

        <div className="form-field">
          <label htmlFor="sorting">Sorting (JSON)</label>
          <textarea
            id="sorting"
            value={formData.sorting ? JSON.stringify(formData.sorting, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = e.target.value ? JSON.parse(e.target.value) : null
                handleChange('sorting', parsed)
              } catch {
                // Invalid JSON, ignore
              }
            }}
            placeholder='[{"field":"device_name","direction":"ASC"}]'
            rows={3}
            className="monospace"
          />
          <small className="help-text">Optional: JSON sorting configuration</small>
        </div>
      </div>

      {/* Sharing */}
      <div className="form-section">
        <h3>Sharing</h3>

        <div className="form-field-checkbox">
          <input
            type="checkbox"
            id="is_public"
            checked={formData.is_public || false}
            onChange={(e) => handleChange('is_public', e.target.checked)}
          />
          <label htmlFor="is_public">Make this report public (visible to all users)</label>
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Report' : 'Create Report'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>

      <style jsx>{`
        .report-form {
          max-width: 800px;
          margin: 0 auto;
        }

        .form-section {
          background-color: white;
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .form-section h3 {
          margin: 0 0 var(--spacing-lg) 0;
          font-size: 20px;
          font-weight: 600;
          color: var(--color-black);
        }

        .form-field {
          margin-bottom: var(--spacing-lg);
        }

        .form-field label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-weight: 600;
          color: var(--color-black);
        }

        .required {
          color: var(--color-error-border);
        }

        .form-field input,
        .form-field select,
        .form-field textarea {
          width: 100%;
          min-height: 44px;
          padding: 0 var(--spacing-md);
          border: 1px solid var(--color-border-default);
          border-radius: 4px;
          font-size: 16px;
          background-color: white;
          font-family: Inter, sans-serif;
        }

        .form-field textarea {
          padding: var(--spacing-sm) var(--spacing-md);
          min-height: auto;
          resize: vertical;
        }

        .form-field textarea.monospace {
          font-family: 'Courier New', monospace;
          font-size: 14px;
        }

        .form-field input.error,
        .form-field select.error,
        .form-field textarea.error {
          border-color: var(--color-error-border);
        }

        .error-message {
          display: block;
          margin-top: var(--spacing-xs);
          color: var(--color-error-border);
          font-size: 14px;
        }

        .help-text {
          display: block;
          margin-top: var(--spacing-xs);
          color: var(--color-border-default);
          font-size: 14px;
        }

        .form-field-checkbox {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .form-field-checkbox input[type='checkbox'] {
          width: 19px;
          height: 19px;
          cursor: pointer;
        }

        .form-field-checkbox label {
          margin: 0;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--color-separator);
        }
      `}</style>
    </form>
  )
}
