/**
 * AttachmentsList Component
 * Display and manage file attachments for an object
 */

'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { FileAttachment, AttachmentObjectType } from '@/types'

interface AttachmentsListProps {
  objectType: AttachmentObjectType
  objectId: string
  canEdit?: boolean // Show delete button
  onAttachmentsChange?: () => void
}

export function AttachmentsList({
  objectType,
  objectId,
  canEdit = false,
  onAttachmentsChange,
}: AttachmentsListProps) {
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch attachments
  useEffect(() => {
    fetchAttachments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectType, objectId])

  const fetchAttachments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/attachments?object_type=${objectType}&object_id=${objectId}&limit=100`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch attachments')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setAttachments(result.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attachments')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (attachmentId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return
    }

    try {
      setDeletingId(attachmentId)

      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete attachment')
      }

      toast.success(`${filename} deleted successfully`)

      // Remove from list
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))

      // Notify parent
      if (onAttachmentsChange) {
        onAttachmentsChange()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete attachment')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = (attachmentId: string, _filename: string) => {
    // Open download in new window
    const downloadUrl = `/api/attachments/${attachmentId}/download`
    window.open(downloadUrl, '_blank')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType === 'application/pdf') return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️'
    if (mimeType.startsWith('text/')) return '📃'
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️'
    return '📎'
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-brew-black-60)' }}>Loading attachments...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: 'var(--spacing-lg)',
          backgroundColor: '#FEE',
          color: 'var(--color-orange)',
          borderRadius: '8px',
          border: '1px solid var(--color-orange)',
        }}
      >
        {error}
      </div>
    )
  }

  if (attachments.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          color: 'var(--color-brew-black-60)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📎</div>
        <p>No attachments yet</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            style={{
              backgroundColor: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: 'var(--spacing-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
            }}
          >
            {/* File icon */}
            <div style={{ fontSize: '2rem', flexShrink: 0 }}>
              {getFileIcon(attachment.mime_type)}
            </div>

            {/* File info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: '500',
                  marginBottom: 'var(--spacing-xs)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {attachment.original_filename}
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-brew-black-60)',
                  display: 'flex',
                  gap: 'var(--spacing-md)',
                  flexWrap: 'wrap',
                }}
              >
                <span>{formatFileSize(attachment.file_size)}</span>
                <span>•</span>
                <span>
                  Uploaded by {attachment.uploader?.full_name || 'Unknown'} on{' '}
                  {formatDate(attachment.uploaded_at)}
                </span>
                {attachment.download_count > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      {attachment.download_count} download
                      {attachment.download_count !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexShrink: 0 }}>
              <button
                onClick={() => handleDownload(attachment.id, attachment.original_filename)}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  backgroundColor: 'var(--color-morning-blue)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Download
              </button>

              {canEdit && (
                <button
                  onClick={() => handleDelete(attachment.id, attachment.original_filename)}
                  disabled={deletingId === attachment.id}
                  style={{
                    padding: 'var(--spacing-xs) var(--spacing-md)',
                    backgroundColor:
                      deletingId === attachment.id ? 'var(--color-brew-black-20)' : 'white',
                    color: 'var(--color-orange)',
                    border: '1px solid var(--color-orange)',
                    borderRadius: '4px',
                    cursor: deletingId === attachment.id ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {deletingId === attachment.id ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
