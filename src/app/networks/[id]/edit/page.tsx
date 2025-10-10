/**
 * Edit Network Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { NetworkForm } from '@/components/NetworkForm'
import type { Network } from '@/types'

export default function EditNetworkPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [network, setNetwork] = useState<Network | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchNetwork = async () => {
      try {
        const response = await fetch(`/api/networks/${id}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch network')
        }

        setNetwork(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchNetwork()
  }, [id])

  const handleSuccess = (network: Network) => {
    router.push(`/networks/${network.id}`)
  }

  const handleCancel = () => {
    router.push(`/networks/${id}`)
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

  if (error || !network) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'Network not found'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="p-lg">
        <NetworkForm network={network} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
