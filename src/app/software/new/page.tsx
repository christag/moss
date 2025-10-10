/**
 * Create Software Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { SoftwareForm } from '@/components/SoftwareForm'
import type { Software } from '@/types'

export default function NewSoftwarePage() {
  const router = useRouter()

  return (
    <div className="container">
      <div className="p-lg">
        <h1 className="text-h1 mb-6">Add Software</h1>
        <div className="card">
          <SoftwareForm
            onSuccess={(software: Software) => router.push(`/software/${software.id}`)}
            onCancel={() => router.push('/software')}
          />
        </div>
      </div>
    </div>
  )
}
