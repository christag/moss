/**
 * Edit IP Address Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { IPAddressForm } from '@/components/IPAddressForm'
import type { IPAddress } from '@/types'

export default function EditIPAddressPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [ipAddress, setIPAddress] = useState<IPAddress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchIPAddress = async () => {
      try {
        const response = await fetch(`/api/ip-addresses/${id}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch IP address')
        }

        setIPAddress(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchIPAddress()
  }, [id])

  const handleSuccess = (ipAddress: IPAddress) => {
    router.push(`/ip-addresses/${ipAddress.id}`)
  }

  const handleCancel = () => {
    router.push(`/ip-addresses/${id}`)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !ipAddress) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'IP address not found'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="p-lg">
        <h1 className="text-h1 mb-6">Edit IP Address</h1>
        <div className="card">
          <IPAddressForm ipAddress={ipAddress} onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  )
}
