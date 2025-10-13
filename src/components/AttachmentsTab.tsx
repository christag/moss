/**
 * AttachmentsTab Component
 * Reusable tab content for file attachments on detail pages
 */

'use client'

import React from 'react'
import { FileUpload } from './FileUpload'
import { AttachmentsList } from './AttachmentsList'
import type { AttachmentObjectType } from '@/types'

interface AttachmentsTabProps {
  objectType: AttachmentObjectType
  objectId: string
  canEdit?: boolean
}

export function AttachmentsTab({ objectType, objectId, canEdit = true }: AttachmentsTabProps) {
  const [refreshKey, setRefreshKey] = React.useState(0)

  const handleUploadComplete = () => {
    // Trigger refresh of attachments list
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      {canEdit && (
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Upload Files
          </h3>
          <FileUpload
            objectType={objectType}
            objectId={objectId}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      <div>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          Attached Files
        </h3>
        <AttachmentsList
          key={refreshKey}
          objectType={objectType}
          objectId={objectId}
          canEdit={canEdit}
          onAttachmentsChange={handleUploadComplete}
        />
      </div>
    </div>
  )
}
