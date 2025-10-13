/**
 * IP Allocation Wizard Page
 *
 * Interactive wizard for allocating IP addresses
 */
'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { IPAllocationWizard } from '@/components/IPAllocationWizard'
import { toast } from 'sonner'

function IPAllocationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const networkId = searchParams.get('network_id')

  const handleComplete = () => {
    toast.success('IP address allocated successfully!')
    router.push('/ip-addresses')
  }

  const handleCancel = () => {
    router.push('/ip-addresses')
  }

  return (
    <div className="allocation-page">
      <div className="page-header">
        <h1>Allocate IP Address</h1>
        <p>
          Follow the steps below to allocate an IP address to a device or reserve it for future use
        </p>
      </div>

      <IPAllocationWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
        preselectedNetworkId={networkId || undefined}
      />

      <style jsx>{`
        .allocation-page {
          min-height: 100vh;
          padding: 2rem;
        }

        .page-header {
          text-align: center;
          margin-bottom: 3rem;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .page-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 600;
          color: var(--color-brew-black);
        }

        .page-header p {
          margin: 0;
          font-size: 1rem;
          color: var(--color-brew-black-60);
        }
      `}</style>
    </div>
  )
}

export default function IPAllocationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IPAllocationContent />
    </Suspense>
  )
}
