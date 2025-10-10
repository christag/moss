/**
 * Create IP Address Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { IPAddressForm } from '@/components/IPAddressForm'
import type { IPAddress } from '@/types'

export default function NewIPAddressPage() {
  const router = useRouter()

  const handleSuccess = (ipAddress: IPAddress) => {
    router.push(`/ip-addresses/${ipAddress.id}`)
  }

  const handleCancel = () => {
    router.push('/ip-addresses')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <h1 className="text-h1 mb-6">Add IP Address</h1>
        <div className="card">
          <IPAddressForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  )
}
