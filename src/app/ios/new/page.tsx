/**
 * Create IO Page
 */
'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Breadcrumb } from '@/components/ui'
import { IOForm } from '@/components/IOForm'
import type { IO } from '@/types'

export default function NewIOPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Extract parent device_id from query params if provided
  const device_id = searchParams.get('device_id')
  const initialValues = device_id ? { device_id } : {}

  const handleSuccess = (io: IO) => {
    router.push(`/ios/${io.id}`)
  }

  const handleCancel = () => {
    router.push('/ios')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <Breadcrumb items={[{ label: 'IOs', href: '/ios' }, { label: 'New' }]} />

        <IOForm initialValues={initialValues} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
