/**
 * Edit Device Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DeviceForm } from '@/components/DeviceForm'
import type { Device } from '@/types'

export default function EditDevicePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchDevice = async () => {
      try {
        const response = await fetch(`/api/devices/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch device')
        }
        const result = await response.json()
        setDevice(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDevice()
  }, [id])

  const handleSuccess = (updatedDevice: Device) => {
    // Navigate back to the device detail page
    router.push(`/devices/${updatedDevice.id}`)
  }

  const handleCancel = () => {
    // Navigate back to the device detail page
    router.push(`/devices/${id}`)
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

  if (error || !device) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'Device not found'}</div>
          <button onClick={() => router.push('/devices')}>Back to Devices</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="p-lg">
        <DeviceForm device={device} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
