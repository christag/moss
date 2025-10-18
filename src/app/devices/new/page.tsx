/**
 * New Device Page
 */
'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DeviceForm } from '@/components/DeviceForm'

export default function NewDevicePage() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <div className="p-lg">Loading...</div>
        </div>
      }
    >
      <NewDevicePageContent />
    </Suspense>
  )
}

function NewDevicePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Extract parent fields from query params if provided
  const room_id = searchParams.get('room_id')
  const location_id = searchParams.get('location_id')
  const parent_device_id = searchParams.get('parent_device_id')

  const initialValues: Record<string, string> = {}
  if (room_id) initialValues.room_id = room_id
  if (location_id) initialValues.location_id = location_id
  if (parent_device_id) initialValues.parent_device_id = parent_device_id

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

        <DeviceForm
          initialValues={initialValues}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
