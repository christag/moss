/**
 * New Device Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DeviceForm } from '@/components/DeviceForm'

export default function NewDevicePage() {
  const router = useRouter()

  const handleSuccess = (device: unknown) => {
    // Navigate to the newly created device's detail page
    const deviceData = device as { id: string }
    router.push(`/devices/${deviceData.id}`)
  }

  const handleCancel = () => {
    // Navigate back to devices list
    router.push('/devices')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <nav
          className="mb-md"
          style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-black)', opacity: 0.6 }}
        >
          <Link href="/devices" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
            Devices
          </Link>
          <span style={{ margin: '0 var(--spacing-xs)' }}>/</span>
          <span>New</span>
        </nav>

        <DeviceForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
