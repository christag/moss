/**
 * Create Network Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { NetworkForm } from '@/components/NetworkForm'
import type { Network } from '@/types'

export default function NewNetworkPage() {
  const router = useRouter()

  const handleSuccess = (network: Network) => {
    router.push(`/networks/${network.id}`)
  }

  const handleCancel = () => {
    router.push('/networks')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <NetworkForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
