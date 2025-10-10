/**
 * IOs List Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { IO } from '@/types'

export default function IOsPage() {
  const [ios, setIos] = useState<IO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [interfaceTypeFilter, setInterfaceTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchIOs = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        sort_by: 'interface_name',
        sort_order: 'asc',
      })

      if (search) params.append('search', search)
      if (interfaceTypeFilter) params.append('interface_type', interfaceTypeFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/ios?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch IOs')
      }

      setIos(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [search, interfaceTypeFilter, statusFilter])

  useEffect(() => {
    fetchIOs()
  }, [fetchIOs])

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
      patch_panel_port: 'Patch Panel',
      power_input: 'Power Input',
      power_output: 'Power Output',
      other: 'Other',
    }
    return typeMap[type] || type
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
          <h1 className="text-h1">Interfaces & Ports</h1>
          <Link href="/ios/new" className="btn btn-primary">
            Add Interface
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
                placeholder="Search IOs..."
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="interface_type" className="block mb-2 font-bold">
                Interface Type
              </label>
              <select
                id="interface_type"
                value={interfaceTypeFilter}
                onChange={(e) => setInterfaceTypeFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Types</option>
                <option value="ethernet">Ethernet</option>
                <option value="wifi">WiFi</option>
                <option value="virtual">Virtual</option>
                <option value="fiber_optic">Fiber Optic</option>
                <option value="sdi">SDI</option>
                <option value="hdmi">HDMI</option>
                <option value="xlr">XLR</option>
                <option value="usb">USB</option>
                <option value="thunderbolt">Thunderbolt</option>
                <option value="displayport">DisplayPort</option>
                <option value="coax">Coax</option>
                <option value="serial">Serial</option>
                <option value="patch_panel_port">Patch Panel</option>
                <option value="power_input">Power Input</option>
                <option value="power_output">Power Output</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block mb-2 font-bold">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="monitoring">Monitoring</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          </div>
        </div>

        {/* IOs Table */}
        <div className="card">
          {ios.length === 0 ? (
            <p className="text-center py-8">No interfaces found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Interface Name</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Port</th>
                  <th className="text-left p-2">Media</th>
                  <th className="text-left p-2">Speed</th>
                  <th className="text-left p-2">MAC Address</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {ios.map((io) => (
                  <tr key={io.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <Link href={`/ios/${io.id}`} className="text-blue hover:underline">
                        {io.interface_name}
                      </Link>
                    </td>
                    <td className="p-2">{formatInterfaceType(io.interface_type)}</td>
                    <td className="p-2">{io.port_number || '-'}</td>
                    <td className="p-2">
                      {io.media_type ? io.media_type.replace(/_/g, ' ') : '-'}
                    </td>
                    <td className="p-2">{io.speed || '-'}</td>
                    <td className="p-2 font-mono text-sm">{io.mac_address || '-'}</td>
                    <td className="p-2">
                      {io.status === 'active' ? (
                        <span className="badge badge-success">{formatStatus(io.status)}</span>
                      ) : io.status === 'inactive' ? (
                        <span className="badge badge-default">{formatStatus(io.status)}</span>
                      ) : io.status === 'monitoring' ? (
                        <span className="badge badge-info">{formatStatus(io.status)}</span>
                      ) : (
                        <span className="badge badge-default">{formatStatus(io.status)}</span>
                      )}
                    </td>
                    <td className="p-2">{new Date(io.created_at).toLocaleDateString()}</td>
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
