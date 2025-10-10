/**
 * Networks List Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Network } from '@/types'

export default function NetworksPage() {
  const [networks, setNetworks] = useState<Network[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [networkTypeFilter, setNetworkTypeFilter] = useState('')

  const fetchNetworks = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        sort_by: 'network_name',
        sort_order: 'asc',
      })

      if (search) params.append('search', search)
      if (networkTypeFilter) params.append('network_type', networkTypeFilter)

      const response = await fetch(`/api/networks?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch networks')
      }

      setNetworks(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [search, networkTypeFilter])

  useEffect(() => {
    fetchNetworks()
  }, [fetchNetworks])

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

  if (error) {
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="p-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-h1">Networks</h1>
          <Link href="/networks/new" className="btn btn-primary">
            Add Network
          </Link>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-2 gap-4">
            <div>
              <label htmlFor="search" className="block mb-2 font-bold">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search networks..."
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="network_type" className="block mb-2 font-bold">
                Network Type
              </label>
              <select
                id="network_type"
                value={networkTypeFilter}
                onChange={(e) => setNetworkTypeFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Types</option>
                <option value="lan">LAN</option>
                <option value="wan">WAN</option>
                <option value="dmz">DMZ</option>
                <option value="guest">Guest</option>
                <option value="management">Management</option>
                <option value="storage">Storage</option>
                <option value="production">Production</option>
                <option value="broadcast">Broadcast</option>
              </select>
            </div>
          </div>
        </div>

        {/* Networks Table */}
        <div className="card">
          {networks.length === 0 ? (
            <p className="text-center py-8">No networks found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Network Name</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Network Address</th>
                  <th className="text-left p-2">VLAN ID</th>
                  <th className="text-left p-2">Gateway</th>
                  <th className="text-left p-2">DHCP</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {networks.map((network) => (
                  <tr key={network.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <Link href={`/networks/${network.id}`} className="text-blue hover:underline">
                        {network.network_name}
                      </Link>
                    </td>
                    <td className="p-2">{formatNetworkType(network.network_type)}</td>
                    <td className="p-2 font-mono text-sm">{network.network_address || '-'}</td>
                    <td className="p-2">{network.vlan_id || '-'}</td>
                    <td className="p-2 font-mono text-sm">{network.gateway || '-'}</td>
                    <td className="p-2">
                      {network.dhcp_enabled ? (
                        <span className="badge badge-success">Enabled</span>
                      ) : (
                        <span className="badge badge-default">Disabled</span>
                      )}
                    </td>
                    <td className="p-2">{new Date(network.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
