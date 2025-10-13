/**
 * Import Page
 * Handles CSV file upload and bulk import with field mapping
 */
'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button, Icon } from '@/components/ui'
import { parseCSV } from '@/lib/bulk/csvImport'
import {
  getObjectTypeDef,
  getAvailableObjectTypes,
  generateTemplateCSV,
} from '@/lib/bulk/objectTypeRegistry'
import type { ParseResult } from '@/lib/bulk/csvImport'

export default function ImportPage() {
  const router = useRouter()
  const [selectedObjectType, setSelectedObjectType] = useState<string>('devices')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [isParsing, setIsParsing] = useState(false)

  // File drop handler
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      setUploadedFile(file)
      setIsParsing(true)

      try {
        const objectTypeDef = getObjectTypeDef(selectedObjectType)
        if (!objectTypeDef) {
          throw new Error(`Invalid object type: ${selectedObjectType}`)
        }

        const result = await parseCSV(file, {
          maxRows: 1000,
          skipEmptyLines: true,
        })

        setParseResult(result)
      } catch (error) {
        console.error('Error parsing CSV:', error)
        alert(`Failed to parse CSV: ${error}`)
      } finally {
        setIsParsing(false)
      }
    },
    [selectedObjectType]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    multiple: false,
  })

  // Download template CSV
  const handleDownloadTemplate = () => {
    try {
      const csv = generateTemplateCSV(selectedObjectType)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedObjectType}-import-template.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating template:', error)
      alert(`Failed to generate template: ${error}`)
    }
  }

  const handleNext = () => {
    if (!parseResult || !uploadedFile) return

    // Store data in session storage and navigate to field mapping
    sessionStorage.setItem('import_file_name', uploadedFile.name)
    sessionStorage.setItem('import_object_type', selectedObjectType)
    sessionStorage.setItem('import_parse_result', JSON.stringify(parseResult))

    router.push('/import/mapping')
  }

  const handleReset = () => {
    setUploadedFile(null)
    setParseResult(null)
  }

  const objectTypeDef = getObjectTypeDef(selectedObjectType)
  const availableTypes = getAvailableObjectTypes()

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
          <h1 style={{ fontSize: 'var(--font-size-h1)', fontWeight: '700', margin: '0' }}>
            Import Data
          </h1>
          <p
            style={{
              marginTop: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-base)',
              opacity: 0.9,
            }}
          >
            Upload a CSV file to bulk import records into M.O.S.S.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{ padding: 'var(--spacing-lg)' }}>
        {/* Step 1: Select Object Type */}
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
            Step 1: Select Object Type
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <label htmlFor="objectType" style={{ fontWeight: '600', minWidth: '150px' }}>
              What are you importing?
            </label>
            <select
              id="objectType"
              value={selectedObjectType}
              onChange={(e) => {
                setSelectedObjectType(e.target.value)
                handleReset()
              }}
              disabled={!!uploadedFile}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                fontSize: 'var(--font-size-base)',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                minWidth: '200px',
              }}
            >
              {availableTypes.map((type) => {
                const def = getObjectTypeDef(type)
                return (
                  <option key={type} value={type}>
                    {def?.namePlural || type}
                  </option>
                )
              })}
            </select>

            <Button
              variant="secondary"
              onClick={handleDownloadTemplate}
              style={{ marginLeft: 'auto' }}
            >
              <Icon name="download" size={16} />
              Download Template
            </Button>
          </div>

          {objectTypeDef && (
            <div
              style={{
                marginTop: 'var(--spacing-md)',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-off-white)',
                borderRadius: '4px',
              }}
            >
              <p
                style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-brew-black-60)' }}
              >
                <strong>Required fields:</strong>{' '}
                {objectTypeDef.fields
                  .filter((f) => f.required)
                  .map((f) => f.label)
                  .join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Upload File */}
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
            Step 2: Upload CSV File
          </h2>

          {!uploadedFile ? (
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? 'var(--color-blue)' : 'rgba(0, 0, 0, 0.2)'}`,
                borderRadius: '8px',
                padding: 'var(--spacing-xl)',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive
                  ? 'var(--color-light-blue-20)'
                  : 'var(--color-off-white)',
                transition: 'all 0.2s',
              }}
            >
              <input {...getInputProps()} />
              <Icon
                name="upload"
                size={48}
                style={{ color: 'var(--color-blue)', marginBottom: 'var(--spacing-md)' }}
              />
              <p
                style={{
                  fontSize: 'var(--font-size-h4)',
                  fontWeight: '600',
                  marginBottom: 'var(--spacing-xs)',
                }}
              >
                {isDragActive ? 'Drop CSV file here' : 'Drag & drop CSV file here'}
              </p>
              <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-brew-black-60)' }}>
                or click to browse files
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-small)',
                  color: 'var(--color-brew-black-60)',
                  marginTop: 'var(--spacing-sm)',
                }}
              >
                Maximum 1,000 rows per import
              </p>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-off-white)',
                  borderRadius: '4px',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <Icon name="description" size={24} style={{ color: 'var(--color-blue)' }} />
                  <div>
                    <p style={{ fontWeight: '600', fontSize: 'var(--font-size-base)' }}>
                      {uploadedFile.name}
                    </p>
                    <p
                      style={{
                        fontSize: 'var(--font-size-small)',
                        color: 'var(--color-brew-black-60)',
                      }}
                    >
                      {(uploadedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  Remove
                </Button>
              </div>

              {isParsing && (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                  <p>Parsing CSV file...</p>
                </div>
              )}

              {parseResult && (
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 'var(--spacing-md)',
                      marginBottom: 'var(--spacing-md)',
                    }}
                  >
                    <div
                      style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--color-green-20)',
                        borderRadius: '4px',
                        textAlign: 'center',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 'var(--font-size-h2)',
                          fontWeight: '700',
                          color: 'var(--color-green)',
                        }}
                      >
                        {parseResult.totalRows}
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-brew-black-60)',
                        }}
                      >
                        Rows Found
                      </p>
                    </div>
                    <div
                      style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--color-blue-20)',
                        borderRadius: '4px',
                        textAlign: 'center',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 'var(--font-size-h2)',
                          fontWeight: '700',
                          color: 'var(--color-blue)',
                        }}
                      >
                        {parseResult.headers.length}
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-brew-black-60)',
                        }}
                      >
                        Columns Found
                      </p>
                    </div>
                    <div
                      style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor:
                          parseResult.errors.length > 0
                            ? 'var(--color-orange-20)'
                            : 'var(--color-green-20)',
                        borderRadius: '4px',
                        textAlign: 'center',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 'var(--font-size-h2)',
                          fontWeight: '700',
                          color:
                            parseResult.errors.length > 0
                              ? 'var(--color-orange)'
                              : 'var(--color-green)',
                        }}
                      >
                        {parseResult.errors.length}
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-brew-black-60)',
                        }}
                      >
                        Parsing Errors
                      </p>
                    </div>
                  </div>

                  {parseResult.errors.length > 0 && (
                    <div
                      style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--color-orange-20)',
                        borderRadius: '4px',
                        marginBottom: 'var(--spacing-md)',
                      }}
                    >
                      <p style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                        <Icon name="warning" size={16} /> Parsing Errors:
                      </p>
                      <ul
                        style={{
                          marginLeft: 'var(--spacing-lg)',
                          fontSize: 'var(--font-size-small)',
                        }}
                      >
                        {parseResult.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>
                            Row {error.row}: {error.message}
                          </li>
                        ))}
                        {parseResult.errors.length > 5 && (
                          <li>...and {parseResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 'var(--spacing-sm)',
                    }}
                  >
                    <Button variant="outline" onClick={handleReset}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleNext}
                      disabled={parseResult.totalRows === 0 || parseResult.errors.length > 0}
                    >
                      Next: Map Fields
                      <Icon name="arrow_forward" size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
