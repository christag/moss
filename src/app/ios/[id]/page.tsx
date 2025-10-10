/**
 * IO Detail Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { IO } from '@/types'

export default function IODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [io, setIo] = useState<IO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchIO = async () => {
      try {
        const response = await fetch(`/api/ios/${id}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch IO')
        }

        setIo(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchIO()
  }, [id])

  const handleDelete = async () => {
    if (!io || !confirm(`Are you sure you want to delete "${io.interface_name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/ios/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete IO')
      }

      router.push('/ios')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete IO')
    }
  }

  const formatInterfaceType = (type: string) => {
    const typeMap: Record<string, string> = {
      ethernet: 'Ethernet',
      wifi: 'WiFi',
      virtual: 'Virtual',
      fiber_optic: 'Fiber Optic',
      sdi: 'SDI',
      hdmi: 'HDMI',
      xlr: 'XLR',
      usb: 'USB',
      thunderbolt: 'Thunderbolt',
      displayport: 'DisplayPort',
      coax: 'Coax',
      serial: 'Serial',
      patch_panel_port: 'Patch Panel Port',
      power_input: 'Power Input',
      power_output: 'Power Output',
      other: 'Other',
    }
    return typeMap[type] || type
  }

  const formatMediaType = (type: string | null) => {
    if (!type) return '-'
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      active: 'Active',
      inactive: 'Inactive',
      monitoring: 'Monitoring',
      reserved: 'Reserved',
    }
    return statusMap[status] || status
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

  if (error || !io) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'IO not found'}</div>
          <Link href="/ios" className="btn btn-secondary mt-4">
            Back to IOs
          </Link>
        </div>
      </div>
    )
  }

  const isNetworkInterface = ['ethernet', 'wifi', 'virtual', 'fiber_optic'].includes(
    io.interface_type
  )
  const isPowerInterface = ['power_input', 'power_output'].includes(io.interface_type)

  return (
    <div className="container">
      <div className="p-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-h1">{io.interface_name}</h1>
            <p className="text-gray-600">{formatInterfaceType(io.interface_type)}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/ios/${id}/edit`} className="btn btn-primary">
              Edit
            </Link>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="card mb-6">
          <h2 className="text-h3 mb-4">Basic Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Interface Name</p>
              <p>{io.interface_name}</p>
            </div>
            <div>
              <p className="font-bold">Interface Type</p>
              <p>{formatInterfaceType(io.interface_type)}</p>
            </div>
            <div>
              <p className="font-bold">Port Number</p>
              <p>{io.port_number || '-'}</p>
            </div>
            <div>
              <p className="font-bold">Status</p>
              <p>
                {io.status === 'active' ? (
                  <span className="badge badge-success">{formatStatus(io.status)}</span>
                ) : io.status === 'inactive' ? (
                  <span className="badge badge-default">{formatStatus(io.status)}</span>
                ) : io.status === 'monitoring' ? (
                  <span className="badge badge-info">{formatStatus(io.status)}</span>
                ) : (
                  <span className="badge badge-default">{formatStatus(io.status)}</span>
                )}
              </p>
            </div>
          </div>

          {io.description && (
            <div className="mt-4">
              <p className="font-bold">Description</p>
              <p>{io.description}</p>
            </div>
          )}
        </div>

        {/* Network Configuration */}
        {isNetworkInterface && (
          <div className="card mb-6">
            <h2 className="text-h3 mb-4">Network Configuration</h2>
            <div className="grid grid-2 gap-4">
              <div>
                <p className="font-bold">Media Type</p>
                <p>{formatMediaType(io.media_type)}</p>
              </div>
              <div>
                <p className="font-bold">Speed</p>
                <p>{io.speed || '-'}</p>
              </div>
              <div>
                <p className="font-bold">Duplex</p>
                <p>{io.duplex || '-'}</p>
              </div>
              <div>
                <p className="font-bold">Trunk Mode</p>
                <p>{io.trunk_mode || '-'}</p>
              </div>
              <div>
                <p className="font-bold">MAC Address</p>
                <p className="font-mono">{io.mac_address || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Power Configuration */}
        {isPowerInterface && (
          <div className="card mb-6">
            <h2 className="text-h3 mb-4">Power Configuration</h2>
            <div className="grid grid-2 gap-4">
              <div>
                <p className="font-bold">Voltage</p>
                <p>{io.voltage || '-'}</p>
              </div>
              <div>
                <p className="font-bold">Amperage</p>
                <p>{io.amperage || '-'}</p>
              </div>
              <div>
                <p className="font-bold">Wattage</p>
                <p>{io.wattage || '-'}</p>
              </div>
              <div>
                <p className="font-bold">Power Connector Type</p>
                <p>{io.power_connector_type || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {io.notes && (
          <div className="card mb-6">
            <h2 className="text-h3 mb-4">Notes</h2>
            <p className="whitespace-pre-wrap">{io.notes}</p>
          </div>
        )}

        {/* System Info */}
        <div className="card">
          <h2 className="text-h3 mb-4">System Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Created</p>
              <p>{new Date(io.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-bold">Last Updated</p>
              <p>{new Date(io.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
