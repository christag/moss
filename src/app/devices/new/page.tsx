/**
 * New Device Page
 */
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { DeviceForm } from '@/components/DeviceForm'
import type { Device } from '@/types'

export default function NewDevicePage() {
  const router = useRouter()

  const handleSuccess = (device: Device) => {
    // Navigate to the newly created device's detail page
    router.push(`/devices/${device.id}`)
  }

  const handleCancel = () => {
    // Navigate back to devices list
    router.push('/devices')
  }

  return (
    <div className="container">
      <div className="p-lg">
        <DeviceForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
