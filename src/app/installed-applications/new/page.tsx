/**
 * Create Installed Application Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { InstalledApplicationForm } from '@/components/InstalledApplicationForm'
import type { InstalledApplication } from '@/types'

export default function NewInstalledApplicationPage() {
  const router = useRouter()

  return (
    <div className="container">
      <div className="p-lg">
        <h1 className="text-h1 mb-6">Add Installed Application</h1>
        <div className="card">
          <InstalledApplicationForm
            onSuccess={(application: InstalledApplication) =>
              router.push(`/installed-applications/${application.id}`)
            }
            onCancel={() => router.push('/installed-applications')}
          />
        </div>
      </div>
    </div>
  )
}
