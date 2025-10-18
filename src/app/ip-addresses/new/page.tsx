/**
 * Create IP Address Page
 */
'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { IPAddressForm } from '@/components/IPAddressForm'
import type { IPAddress } from '@/types'

export default function NewIPAddressPage() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className="p-lg">Loading...</div>
        </div>
      }
    >
      <NewIPAddressPageContent />
    </Suspense>
  )
}

function NewIPAddressPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Extract parent fields from query params if provided
  const io_id = searchParams.get('io_id')
  const network_id = searchParams.get('network_id')

  const initialValues: Record<string, string> = {}
  if (io_id) initialValues.io_id = io_id
  if (network_id) initialValues.network_id = network_id

  const handleSuccess = (ipAddress: IPAddress) => {
    router.push(`/ip-addresses/${ipAddress.id}`)
  }

  const handleCancel = () => {
    router.push('/ip-addresses')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/ip-addresses" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            IP Addresses
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>New</span>
        </nav>

        <h1 className="text-h1 mb-6">Add IP Address</h1>
        <div className="card">
          <IPAddressForm
            initialValues={initialValues}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}
