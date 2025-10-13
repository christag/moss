/**
 * Create Network Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

        <NetworkForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
