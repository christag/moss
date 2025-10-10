/**
 * IP Address Detail Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { IPAddress } from '@/types'

export default function IPAddressDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const handleDelete = async () => {
    if (
      !ipAddress ||
      !confirm(`Are you sure you want to delete IP address "${ipAddress.ip_address}"?`)
    ) {
      return
    }

    try {
      const response = await fetch(`/api/ip-addresses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete IP address')
      }

      router.push('/ip-addresses')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete IP address')
    }
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
          <Link href="/ip-addresses" className="btn btn-secondary mt-4">
            Back to IP Addresses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="p-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-h1">{ipAddress.ip_address}</h1>
            <p className="text-gray-600">
              {ipAddress.ip_version?.toUpperCase() || 'IPv4'} •{' '}
              {ipAddress.type
                ? ipAddress.type.charAt(0).toUpperCase() + ipAddress.type.slice(1)
                : 'Static'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/ip-addresses/${id}/edit`} className="btn btn-primary">
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
              <p className="font-bold">IP Address</p>
              <p className="font-mono">{ipAddress.ip_address}</p>
            </div>
            <div>
              <p className="font-bold">IP Version</p>
              <p>{ipAddress.ip_version?.toUpperCase() || 'IPv4'}</p>
            </div>
            <div>
              <p className="font-bold">Type</p>
              <p>
                {ipAddress.type
                  ? ipAddress.type.charAt(0).toUpperCase() + ipAddress.type.slice(1)
                  : 'Static'}
              </p>
            </div>
            <div>
              <p className="font-bold">DNS Name</p>
              <p>{ipAddress.dns_name || '-'}</p>
            </div>
            <div>
              <p className="font-bold">Assignment Date</p>
              <p>
                {ipAddress.assignment_date
                  ? new Date(ipAddress.assignment_date).toLocaleDateString()
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {ipAddress.notes && (
          <div className="card mb-6">
            <h2 className="text-h3 mb-4">Notes</h2>
            <p className="whitespace-pre-wrap">{ipAddress.notes}</p>
          </div>
        )}

        {/* System Info */}
        <div className="card">
          <h2 className="text-h3 mb-4">System Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Created</p>
              <p>{new Date(ipAddress.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-bold">Last Updated</p>
              <p>{new Date(ipAddress.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
