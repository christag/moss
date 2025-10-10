/**
 * SaaS Services List Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { SaaSService } from '@/types'

export default function SaaSServicesPage() {
  const [services, setServices] = useState<SaaSService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchServices = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        sort_by: 'service_name',
        sort_order: 'asc',
      })
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/saas-services?${params}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Failed to fetch services')
      setServices(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatCriticality = (criticality: string | null) => {
    if (!criticality) return '-'
    return criticality.charAt(0).toUpperCase() + criticality.slice(1)
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
          <h1 className="text-h1">SaaS Services</h1>
          <Link href="/saas-services/new" className="btn btn-primary">
            Add Service
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
                placeholder="Search services..."
                className="w-full p-2 border rounded"
              />
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
                <option value="trial">Trial</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="card">
          {services.length === 0 ? (
            <p className="text-center py-8">No services found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Service Name</th>
                  <th className="text-left p-2">Environment</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Criticality</th>
                  <th className="text-left p-2">Seats</th>
                  <th className="text-left p-2">Cost</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <Link
                        href={`/saas-services/${service.id}`}
                        className="text-blue hover:underline"
                      >
                        {service.service_name}
                      </Link>
                    </td>
                    <td className="p-2">{service.environment || '-'}</td>
                    <td className="p-2">
                      {service.status === 'active' ? (
                        <span className="badge badge-success">{formatStatus(service.status)}</span>
                      ) : service.status === 'trial' ? (
                        <span className="badge badge-info">{formatStatus(service.status)}</span>
                      ) : (
                        <span className="badge badge-default">{formatStatus(service.status)}</span>
                      )}
                    </td>
                    <td className="p-2">{formatCriticality(service.criticality)}</td>
                    <td className="p-2">{service.seat_count || '-'}</td>
                    <td className="p-2">{service.cost ? `$${service.cost}` : '-'}</td>
                    <td className="p-2">{new Date(service.created_at).toLocaleDateString()}</td>
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
