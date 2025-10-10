/**
 * Network Detail Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Network } from '@/types'

export default function NetworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const handleDelete = async () => {
    if (!network || !confirm(`Are you sure you want to delete "${network.network_name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/networks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete network')
      }

      router.push('/networks')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete network')
    }
  }

  const formatNetworkType = (type: string | null) => {
    if (!type) return '-'
    const typeMap: Record<string, string> = {
      lan: 'LAN',
      wan: 'WAN',
      dmz: 'DMZ',
      guest: 'Guest',
      management: 'Management',
      storage: 'Storage',
      production: 'Production',
      broadcast: 'Broadcast',
    }
    return typeMap[type] || type
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
          <Link href="/networks" className="btn btn-secondary mt-4">
            Back to Networks
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
            <h1 className="text-h1">{network.network_name}</h1>
            <p className="text-gray-600">{formatNetworkType(network.network_type)}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/networks/${id}/edit`} className="btn btn-primary">
              Edit
            </Link>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>

        {/* Network Configuration */}
        <div className="card mb-6">
          <h2 className="text-h3 mb-4">Network Configuration</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Network Name</p>
              <p>{network.network_name}</p>
            </div>
            <div>
              <p className="font-bold">Network Type</p>
              <p>{formatNetworkType(network.network_type)}</p>
            </div>
            <div>
              <p className="font-bold">Network Address</p>
              <p className="font-mono">{network.network_address || '-'}</p>
            </div>
            <div>
              <p className="font-bold">VLAN ID</p>
              <p>{network.vlan_id || '-'}</p>
            </div>
            <div>
              <p className="font-bold">Gateway</p>
              <p className="font-mono">{network.gateway || '-'}</p>
            </div>
            <div>
              <p className="font-bold">DNS Servers</p>
              <p className="font-mono">{network.dns_servers || '-'}</p>
            </div>
          </div>

          {network.description && (
            <div className="mt-4">
              <p className="font-bold">Description</p>
              <p>{network.description}</p>
            </div>
          )}
        </div>

        {/* DHCP Configuration */}
        <div className="card mb-6">
          <h2 className="text-h3 mb-4">DHCP Configuration</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">DHCP Enabled</p>
              <p>
                {network.dhcp_enabled ? (
                  <span className="badge badge-success">Yes</span>
                ) : (
                  <span className="badge badge-default">No</span>
                )}
              </p>
            </div>
            {network.dhcp_enabled && (
              <>
                <div />
                <div>
                  <p className="font-bold">DHCP Range Start</p>
                  <p className="font-mono">{network.dhcp_range_start || '-'}</p>
                </div>
                <div>
                  <p className="font-bold">DHCP Range End</p>
                  <p className="font-mono">{network.dhcp_range_end || '-'}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {network.notes && (
          <div className="card mb-6">
            <h2 className="text-h3 mb-4">Notes</h2>
            <p className="whitespace-pre-wrap">{network.notes}</p>
          </div>
        )}

        {/* System Info */}
        <div className="card">
          <h2 className="text-h3 mb-4">System Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Created</p>
              <p>{new Date(network.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-bold">Last Updated</p>
              <p>{new Date(network.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
