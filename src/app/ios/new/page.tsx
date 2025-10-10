/**
 * Create IO Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { IOForm } from '@/components/IOForm'
import type { IO } from '@/types'

export default function NewIOPage() {
  const router = useRouter()

  const handleSuccess = (io: IO) => {
    router.push(`/ios/${io.id}`)
  }

  const handleCancel = () => {
    router.push('/ios')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <IOForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
