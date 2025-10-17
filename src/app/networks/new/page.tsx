/**
 * Create Network Page
 */
'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { NetworkForm } from '@/components/NetworkForm'
import type { Network } from '@/types'

export default function NewNetworkPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Extract parent location_id from query params if provided
  const location_id = searchParams.get('location_id')
  const initialValues = location_id ? { location_id } : {}

  const handleSuccess = (network: Network) => {
    router.push(`/networks/${network.id}`)
  }

  const handleCancel = () => {
    router.push('/networks')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/networks" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Networks
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>New</span>
        </nav>

        <NetworkForm
          initialValues={initialValues}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
