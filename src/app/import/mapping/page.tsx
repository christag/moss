/**
 * Import Field Mapping Page
 * Maps CSV columns to database fields and validates data
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Icon } from '@/components/ui'
import { mapFields, validateImportData, chunkArray } from '@/lib/bulk/csvImport'
import { getObjectTypeDef } from '@/lib/bulk/objectTypeRegistry'
import type { ParseResult } from '@/lib/bulk/csvImport'
import type { FieldMapping, ValidationError } from '@/types/bulk-operations'

// Helper function to map ObjectFieldDef types to FieldMapping dataTypes
function mapFieldTypeToDataType(
  fieldType: 'string' | 'number' | 'boolean' | 'date' | 'uuid' | 'enum'
): FieldMapping['dataType'] {
  switch (fieldType) {
    case 'string':
    case 'enum':
      return 'text'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'date':
      return 'date'
    case 'uuid':
      return 'uuid'
    default:
      return 'text'
  }
}

export default function ImportMappingPage() {
  const router = useRouter()
  const [fileName, setFileName] = useState<string>('')
  const [objectType, setObjectType] = useState<string>('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })

  // Load data from session storage
  useEffect(() => {
    const storedFileName = sessionStorage.getItem('import_file_name')
    const storedObjectType = sessionStorage.getItem('import_object_type')
    const storedParseResult = sessionStorage.getItem('import_parse_result')

    if (!storedFileName || !storedObjectType || !storedParseResult) {
      router.push('/import')
      return
    }

    setFileName(storedFileName)
    setObjectType(storedObjectType)
    const parsed = JSON.parse(storedParseResult) as ParseResult
    setParseResult(parsed)

    // Initialize field mappings with auto-detection
    const objectTypeDef = getObjectTypeDef(storedObjectType)
    if (objectTypeDef && parsed.headers) {
      const initialMappings: FieldMapping[] = parsed.headers.map((header) => {
        // Try to find matching database field
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_')
        let mossField = ''
        let required = false
        let dataType: FieldMapping['dataType'] = 'text'

        // Exact match
        const exactMatch = objectTypeDef.fields.find((f) => f.name === normalizedHeader)
        if (exactMatch) {
          mossField = exactMatch.name
          required = exactMatch.required
          dataType = mapFieldTypeToDataType(exactMatch.type)
        } else {
          // Fuzzy match
          const fuzzyMatch = objectTypeDef.fields.find((f) => {
            const fieldNormalized = f.name.replace(/[^a-z0-9]/g, '_')
            return (
              fieldNormalized.includes(normalizedHeader) ||
              normalizedHeader.includes(fieldNormalized)
            )
          })
          if (fuzzyMatch) {
            mossField = fuzzyMatch.name
            required = fuzzyMatch.required
            dataType = mapFieldTypeToDataType(fuzzyMatch.type)
          }
        }

        return {
          csvColumn: header,
          mossField,
          dataType,
          required,
        }
      })

      setFieldMappings(initialMappings)
    }
  }, [router])

  const objectTypeDef = getObjectTypeDef(objectType)

  const handleMappingChange = (csvColumn: string, mossField: string) => {
    setFieldMappings((prev) =>
      prev.map((mapping) => {
        if (mapping.csvColumn === csvColumn) {
          const field = objectTypeDef?.fields.find((f) => f.name === mossField)
          return {
            ...mapping,
            mossField,
            required: field?.required || false,
          }
        }
        return mapping
      })
    )
  }

  const handleValidate = async () => {
    if (!parseResult || !objectTypeDef) return

    setIsValidating(true)
    setValidationErrors([])

    try {
      // Map CSV data to database fields
      const mappedData = mapFields(parseResult.data, fieldMappings)

      // Validate against schema
      const errors = validateImportData(mappedData, objectTypeDef.schema)

      // Check for required fields
      const mappedDbFields = new Set(
        fieldMappings.filter((m) => m.mossField).map((m) => m.mossField)
      )
      const requiredFields = objectTypeDef.fields.filter((f) => f.required)
      const missingRequired = requiredFields.filter((f) => !mappedDbFields.has(f.name))

      if (missingRequired.length > 0) {
        missingRequired.forEach((field) => {
          errors.push({
            row: 0,
            field: field.name,
            error: `Required field "${field.label}" is not mapped`,
            value: null,
          })
        })
      }

      setValidationErrors(errors)
    } catch (error) {
      console.error('Validation error:', error)
      alert(`Validation failed: ${error}`)
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (!parseResult || !objectTypeDef || validationErrors.length > 0) return

    setIsImporting(true)

    try {
      // Map CSV data to database fields
      const mappedData = mapFields(parseResult.data, fieldMappings)

      // Split into chunks of 100 (bulk API limit)
      const chunks = chunkArray(mappedData, 100)
      setImportProgress({ current: 0, total: chunks.length })

      let totalCreated = 0
      const errors: string[] = []

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]

        try {
          const response = await fetch(objectTypeDef.bulkEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chunk),
          })

          if (!response.ok) {
            const errorData = await response.json()
            errors.push(`Chunk ${i + 1}: ${errorData.message || 'Import failed'}`)
          } else {
            const result = await response.json()
            totalCreated += result.data.created || 0
          }
        } catch (error) {
          errors.push(`Chunk ${i + 1}: ${error}`)
        }

        setImportProgress({ current: i + 1, total: chunks.length })
      }

      // Clear session storage
      sessionStorage.removeItem('import_file_name')
      sessionStorage.removeItem('import_object_type')
      sessionStorage.removeItem('import_parse_result')

      // Show results
      if (errors.length === 0) {
        alert(`Successfully imported ${totalCreated} ${objectTypeDef.namePlural.toLowerCase()}!`)
        router.push(`/${objectType}`)
      } else {
        alert(
          `Import completed with errors:\n- ${totalCreated} records created\n- ${errors.length} chunk(s) failed\n\nErrors:\n${errors.join('\n')}`
        )
      }
    } catch (error) {
      console.error('Import error:', error)
      alert(`Import failed: ${error}`)
    } finally {
      setIsImporting(false)
    }
  }

  const handleBack = () => {
    router.push('/import')
  }

  if (!parseResult || !objectTypeDef) {
    return <div>Loading...</div>
  }

  const unmappedColumns = fieldMappings.filter((m) => !m.mossField).length
  const requiredFields = objectTypeDef.fields.filter((f) => f.required)
  const mappedRequiredFields = requiredFields.filter((f) =>
    fieldMappings.some((m) => m.mossField === f.name)
  )
  const canValidate = unmappedColumns === 0 && mappedRequiredFields.length === requiredFields.length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-off-white)' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--color-blue)',
          color: 'var(--color-off-white)',
          padding: 'var(--spacing-lg)',
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <Button
              variant="outline"
              onClick={handleBack}
              style={{ color: 'white', borderColor: 'white' }}
            >
              <Icon name="arrow_back" size={16} />
              Back
            </Button>
            <div>
              <h1 style={{ fontSize: 'var(--font-size-h1)', fontWeight: '700', margin: '0' }}>
                Map Fields
              </h1>
              <p
                style={{
                  marginTop: 'var(--spacing-xs)',
                  fontSize: 'var(--font-size-base)',
                  opacity: 0.9,
                }}
              >
                {fileName} → {objectTypeDef.namePlural}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{ padding: 'var(--spacing-lg)' }}>
        {/* Status Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'white',
              borderRadius: '4px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: '700',
                color: 'var(--color-blue)',
              }}
            >
              {parseResult.totalRows}
            </p>
            <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-brew-black-60)' }}>
              Rows to Import
            </p>
          </div>

          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'white',
              borderRadius: '4px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: '700',
                color:
                  fieldMappings.length - unmappedColumns === fieldMappings.length
                    ? 'var(--color-green)'
                    : 'var(--color-orange)',
              }}
            >
              {fieldMappings.length - unmappedColumns}/{fieldMappings.length}
            </p>
            <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-brew-black-60)' }}>
              Columns Mapped
            </p>
          </div>

          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'white',
              borderRadius: '4px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: '700',
                color:
                  mappedRequiredFields.length === requiredFields.length
                    ? 'var(--color-green)'
                    : 'var(--color-orange)',
              }}
            >
              {mappedRequiredFields.length}/{requiredFields.length}
            </p>
            <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-brew-black-60)' }}>
              Required Fields
            </p>
          </div>

          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'white',
              borderRadius: '4px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: '700',
                color: validationErrors.length === 0 ? 'var(--color-green)' : 'var(--color-orange)',
              }}
            >
              {validationErrors.length}
            </p>
            <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-brew-black-60)' }}>
              Validation Errors
            </p>
          </div>
        </div>

        {/* Field Mapping Table */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-lg)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-h3)',
              fontWeight: '600',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Column Mapping
          </h2>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-brew-black-20)' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: 'var(--spacing-sm)',
                    fontWeight: '600',
                    width: '35%',
                  }}
                >
                  CSV Column
                </th>
                <th
                  style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-sm)',
                    fontWeight: '600',
                    width: '10%',
                  }}
                >
                  →
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: 'var(--spacing-sm)',
                    fontWeight: '600',
                    width: '45%',
                  }}
                >
                  Database Field
                </th>
                <th
                  style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-sm)',
                    fontWeight: '600',
                    width: '10%',
                  }}
                >
                  Required
                </th>
              </tr>
            </thead>
            <tbody>
              {fieldMappings.map((mapping, index) => {
                const mossFieldDef = objectTypeDef.fields.find((f) => f.name === mapping.mossField)
                return (
                  <tr key={index} style={{ borderBottom: '1px solid var(--color-brew-black-10)' }}>
                    <td style={{ padding: 'var(--spacing-sm)' }}>
                      <strong>{mapping.csvColumn}</strong>
                      {parseResult.data[0] && (
                        <div
                          style={{
                            fontSize: 'var(--font-size-small)',
                            color: 'var(--color-brew-black-60)',
                            marginTop: '4px',
                          }}
                        >
                          Example:{' '}
                          {String(parseResult.data[0][mapping.csvColumn] || '—').substring(0, 50)}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>
                      <Icon name="arrow_forward" size={20} />
                    </td>
                    <td style={{ padding: 'var(--spacing-sm)' }}>
                      <select
                        value={mapping.mossField}
                        onChange={(e) => handleMappingChange(mapping.csvColumn, e.target.value)}
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-sm)',
                          fontSize: 'var(--font-size-base)',
                          border: '1px solid rgba(0, 0, 0, 0.2)',
                          borderRadius: '4px',
                        }}
                      >
                        <option value="">-- Skip this column --</option>
                        {objectTypeDef.fields.map((field) => (
                          <option key={field.name} value={field.name}>
                            {field.label} {field.required ? '(required)' : ''}
                          </option>
                        ))}
                      </select>
                      {mossFieldDef && (
                        <div
                          style={{
                            fontSize: 'var(--font-size-small)',
                            color: 'var(--color-brew-black-60)',
                            marginTop: '4px',
                          }}
                        >
                          Type: {mossFieldDef.type}
                          {mossFieldDef.example && ` • Example: ${mossFieldDef.example}`}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)' }}>
                      {mapping.required && (
                        <span
                          style={{
                            backgroundColor: 'var(--color-orange)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: 'var(--font-size-small)',
                            fontWeight: '600',
                          }}
                        >
                          Required
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '2px solid var(--color-orange)',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--font-size-h3)',
                fontWeight: '600',
                marginBottom: 'var(--spacing-md)',
                color: 'var(--color-orange)',
              }}
            >
              <Icon name="warning" size={24} /> Validation Errors ({validationErrors.length})
            </h2>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-brew-black-20)' }}>
                    <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', width: '10%' }}>
                      Row
                    </th>
                    <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', width: '20%' }}>
                      Field
                    </th>
                    <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', width: '50%' }}>
                      Error
                    </th>
                    <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', width: '20%' }}>
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {validationErrors.slice(0, 50).map((error, index) => (
                    <tr
                      key={index}
                      style={{ borderBottom: '1px solid var(--color-brew-black-10)' }}
                    >
                      <td style={{ padding: 'var(--spacing-sm)' }}>{error.row}</td>
                      <td style={{ padding: 'var(--spacing-sm)' }}>
                        <code>{error.field}</code>
                      </td>
                      <td style={{ padding: 'var(--spacing-sm)' }}>{error.error}</td>
                      <td style={{ padding: 'var(--spacing-sm)' }}>
                        {error.value !== null ? String(error.value).substring(0, 30) : '—'}
                      </td>
                    </tr>
                  ))}
                  {validationErrors.length > 50 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 'var(--spacing-sm)', textAlign: 'center' }}>
                        ...and {validationErrors.length - 50} more errors
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Progress */}
        {isImporting && (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--font-size-h3)',
                fontWeight: '600',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              Importing...
            </h2>
            <div
              style={{
                width: '100%',
                height: '24px',
                backgroundColor: 'var(--color-brew-black-10)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(importProgress.current / importProgress.total) * 100}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-green)',
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <p style={{ marginTop: 'var(--spacing-sm)', textAlign: 'center' }}>
              Processing chunk {importProgress.current} of {importProgress.total}
            </p>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--spacing-sm)',
          }}
        >
          <Button variant="outline" onClick={handleBack} disabled={isValidating || isImporting}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleValidate}
            disabled={!canValidate || isValidating || isImporting}
          >
            {isValidating ? 'Validating...' : 'Validate Data'}
            <Icon name="check_circle" size={16} />
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={validationErrors.length > 0 || isValidating || isImporting || !canValidate}
          >
            {isImporting ? 'Importing...' : `Import ${parseResult.totalRows} Records`}
            <Icon name="upload" size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
