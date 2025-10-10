/**
 * Create Software License Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { SoftwareLicenseForm } from '@/components/SoftwareLicenseForm'
import type { SoftwareLicense } from '@/types'

export default function NewSoftwareLicensePage() {
  const router = useRouter()

  return (
    <div className="container">
      <div className="p-lg">
        <h1 className="text-h1 mb-6">Add Software License</h1>
        <div className="card">
          <SoftwareLicenseForm
            onSuccess={(license: SoftwareLicense) =>
              router.push(`/software-licenses/${license.id}`)
            }
            onCancel={() => router.push('/software-licenses')}
          />
        </div>
      </div>
    </div>
  )
}
