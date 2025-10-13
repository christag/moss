/**
 * Create IO Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/ios" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            IOs
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>New</span>
        </nav>

        <IOForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
