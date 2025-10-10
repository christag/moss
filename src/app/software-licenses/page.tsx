/**
 * Software Licenses List Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { SoftwareLicense } from '@/types'

export default function SoftwareLicensesPage() {
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [licenseTypeFilter, setLicenseTypeFilter] = useState('')

  const fetchLicenses = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        sort_by: 'expiration_date',
        sort_order: 'asc',
      })
      if (search) params.append('search', search)
      if (licenseTypeFilter) params.append('license_type', licenseTypeFilter)

      const response = await fetch(`/api/software-licenses?${params}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Failed to fetch licenses')
      setLicenses(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [search, licenseTypeFilter])

  useEffect(() => {
    fetchLicenses()
  }, [fetchLicenses])

  const formatType = (type: string | null) => {
    if (!type) return '-'
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const isExpired = (expirationDate: Date | null) => {
    if (!expirationDate) return false
    return new Date(expirationDate) < new Date()
  }

  const isExpiringSoon = (expirationDate: Date | null) => {
    if (!expirationDate) return false
    const today = new Date()
    const expiry = new Date(expirationDate)
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 90
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
          <h1 className="text-h1">Software Licenses</h1>
          <Link href="/software-licenses/new" className="btn btn-primary">
            Add License
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
                placeholder="Search license keys..."
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="license_type" className="block mb-2 font-bold">
                License Type
              </label>
              <select
                id="license_type"
                value={licenseTypeFilter}
                onChange={(e) => setLicenseTypeFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Types</option>
                <option value="perpetual">Perpetual</option>
                <option value="subscription">Subscription</option>
                <option value="free">Free</option>
                <option value="volume">Volume</option>
                <option value="site">Site</option>
                <option value="concurrent">Concurrent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Licenses Table */}
        <div className="card">
          {licenses.length === 0 ? (
            <p className="text-center py-8">No software licenses found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">License Type</th>
                  <th className="text-left p-2">Expiration Date</th>
                  <th className="text-left p-2">Seats</th>
                  <th className="text-left p-2">Cost</th>
                  <th className="text-left p-2">Auto Renew</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license) => (
                  <tr key={license.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <Link
                        href={`/software-licenses/${license.id}`}
                        className="text-blue hover:underline"
                      >
                        {formatType(license.license_type)}
                      </Link>
                    </td>
                    <td className="p-2">
                      {license.expiration_date ? (
                        <>
                          {new Date(license.expiration_date).toLocaleDateString()}
                          {isExpired(license.expiration_date) ? (
                            <span className="badge badge-danger ml-2">Expired</span>
                          ) : isExpiringSoon(license.expiration_date) ? (
                            <span className="badge badge-warning ml-2">Expiring Soon</span>
                          ) : null}
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-2">
                      {license.seat_count
                        ? `${license.seats_used || 0} / ${license.seat_count}`
                        : '-'}
                    </td>
                    <td className="p-2">{license.cost ? `$${license.cost}` : '-'}</td>
                    <td className="p-2">{license.auto_renew ? 'Yes' : 'No'}</td>
                    <td className="p-2">{new Date(license.created_at).toLocaleDateString()}</td>
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
