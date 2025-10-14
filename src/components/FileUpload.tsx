/**
 * FileUpload Component
 * Drag-and-drop file upload with progress tracking
 */

'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import type { FileAttachment, AttachmentObjectType } from '@/types'

interface FileUploadProps {
  objectType: AttachmentObjectType
  objectId: string
  onUploadComplete?: (attachment: FileAttachment) => void
  maxFiles?: number
  maxSizeMB?: number
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
  success?: boolean
}

export function FileUpload({
  objectType,
  objectId,
  onUploadComplete,
  maxFiles = 10,
  maxSizeMB = 50,
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map())

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Check file count limit
      if (acceptedFiles.length + uploadingFiles.size > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`)
        return
      }

      // Upload each file
      for (const file of acceptedFiles) {
        const fileId = `${file.name}-${file.size}-${Date.now()}`

        // Add to uploading files
        setUploadingFiles((prev) => {
          const next = new Map(prev)
          next.set(fileId, { file, progress: 0 })
          return next
        })

        try {
          await uploadFile(file, fileId)
        } catch (error) {
          console.error('Upload error:', error)
          setUploadingFiles((prev) => {
            const next = new Map(prev)
            const uploadingFile = next.get(fileId)
            if (uploadingFile) {
              uploadingFile.error = error instanceof Error ? error.message : 'Upload failed'
              uploadingFile.progress = 0
            }
            return next
          })
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadingFiles, maxFiles, objectType, objectId, onUploadComplete]
  )

  const uploadFile = async (file: File, fileId: string) => {
    // Create form data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('object_type', objectType)
    formData.append('object_id', objectId)

    // Upload with progress tracking
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100)
        setUploadingFiles((prev) => {
          const next = new Map(prev)
          const uploadingFile = next.get(fileId)
          if (uploadingFile) {
            uploadingFile.progress = progress
          }
          return next
        })
      }
    })

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status === 201) {
        const response = JSON.parse(xhr.responseText)
        setUploadingFiles((prev) => {
          const next = new Map(prev)
          const uploadingFile = next.get(fileId)
          if (uploadingFile) {
            uploadingFile.success = true
            uploadingFile.progress = 100
          }
          return next
        })

        toast.success(`${file.name} uploaded successfully`)

        // Call completion callback
        if (onUploadComplete && response.data) {
          // Fetch the full attachment details
          fetch(`/api/attachments/${response.data.attachment_id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.data) {
                onUploadComplete(data.data)
              }
            })
        }

        // Remove from uploading list after 2 seconds
        setTimeout(() => {
          setUploadingFiles((prev) => {
            const next = new Map(prev)
            next.delete(fileId)
            return next
          })
        }, 2000)
      } else {
        const response = JSON.parse(xhr.responseText)
        throw new Error(response.error || 'Upload failed')
      }
    })

    // Handle error
    xhr.addEventListener('error', () => {
      throw new Error('Network error during upload')
    })

    // Send request
    xhr.open('POST', '/api/attachments/upload')
    xhr.send(formData)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxSizeMB * 1024 * 1024,
  })

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--color-morning-blue)' : 'var(--color-border)'}`,
          borderRadius: '8px',
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'var(--color-off-white)' : 'white',
          transition: 'all 0.2s ease',
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>📁</div>
        {isDragActive ? (
          <p style={{ color: 'var(--color-morning-blue)', fontWeight: '500' }}>
            Drop files here...
          </p>
        ) : (
          <>
            <p style={{ fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}>
              Drag and drop files here, or click to browse
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-brew-black-60)',
              }}
            >
              Maximum file size: {maxSizeMB} MB | Maximum {maxFiles} files
            </p>
          </>
        )}
      </div>

      {/* Uploading files list */}
      {uploadingFiles.size > 0 && (
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <h3
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: '600',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Uploading {uploadingFiles.size} file{uploadingFiles.size > 1 ? 's' : ''}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {Array.from(uploadingFiles.entries()).map(
              ([fileId, { file, progress, error, success }]) => (
                <div
                  key={fileId}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: 'var(--spacing-md)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: 'var(--spacing-sm)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}>
                        {file.name}
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-brew-black-60)',
                        }}
                      >
                        {formatFileSize(file.size)}
                      </div>
                    </div>

                    {/* Status indicator */}
                    {success && (
                      <div
                        style={{
                          color: 'var(--color-green)',
                          fontWeight: '500',
                          fontSize: 'var(--font-size-sm)',
                        }}
                      >
                        ✓ Complete
                      </div>
                    )}
                    {error && (
                      <div
                        style={{
                          color: 'var(--color-orange)',
                          fontWeight: '500',
                          fontSize: 'var(--font-size-sm)',
                        }}
                      >
                        ✗ Error
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {!error && !success && (
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'var(--color-off-white)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: '100%',
                          backgroundColor: 'var(--color-morning-blue)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  )}

                  {/* Success bar */}
                  {success && (
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'var(--color-green)',
                        borderRadius: '4px',
                      }}
                    />
                  )}

                  {/* Error message */}
                  {error && (
                    <div
                      style={{
                        marginTop: 'var(--spacing-xs)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-orange)',
                      }}
                    >
                      {error}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
