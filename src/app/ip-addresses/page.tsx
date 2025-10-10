/**
 * IP Addresses List Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { IPAddress } from '@/types'

export default function IPAddressesPage() {
  const [ipAddresses, setIPAddresses] = useState<IPAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [ipVersionFilter, setIPVersionFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const fetchIPAddresses = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        sort_by: 'ip_address',
        sort_order: 'asc',
      })

      if (search) params.append('search', search)
      if (ipVersionFilter) params.append('ip_version', ipVersionFilter)
      if (typeFilter) params.append('type', typeFilter)

      const response = await fetch(`/api/ip-addresses?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch IP addresses')
      }

      setIPAddresses(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [search, ipVersionFilter, typeFilter])

  useEffect(() => {
    fetchIPAddresses()
  }, [fetchIPAddresses])

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
          <h1 className="text-h1">IP Addresses</h1>
          <Link href="/ip-addresses/new" className="btn btn-primary">
            Add IP Address
          </Link>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-3 gap-4">
            <div>
              <label htmlFor="search" className="block mb-2 font-bold">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search IP addresses..."
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="ip_version" className="block mb-2 font-bold">
                IP Version
              </label>
              <select
                id="ip_version"
                value={ipVersionFilter}
                onChange={(e) => setIPVersionFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Versions</option>
                <option value="v4">IPv4</option>
                <option value="v6">IPv6</option>
              </select>
            </div>
            <div>
              <label htmlFor="type" className="block mb-2 font-bold">
                Type
              </label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Types</option>
                <option value="static">Static</option>
                <option value="dhcp">DHCP</option>
                <option value="reserved">Reserved</option>
                <option value="floating">Floating</option>
              </select>
            </div>
          </div>
        </div>

        {/* IP Addresses Table */}
        <div className="card">
          {ipAddresses.length === 0 ? (
            <p className="text-center py-8">No IP addresses found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">IP Address</th>
                  <th className="text-left p-2">Version</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">DNS Name</th>
                  <th className="text-left p-2">Assignment Date</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {ipAddresses.map((ip) => (
                  <tr key={ip.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <Link href={`/ip-addresses/${ip.id}`} className="text-blue hover:underline">
                        {ip.ip_address}
                      </Link>
                    </td>
                    <td className="p-2">{ip.ip_version?.toUpperCase() || '-'}</td>
                    <td className="p-2">
                      {ip.type ? ip.type.charAt(0).toUpperCase() + ip.type.slice(1) : '-'}
                    </td>
                    <td className="p-2">{ip.dns_name || '-'}</td>
                    <td className="p-2">
                      {ip.assignment_date ? new Date(ip.assignment_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-2">{new Date(ip.created_at).toLocaleDateString()}</td>
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
