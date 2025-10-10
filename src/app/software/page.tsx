/**
 * Software List Page
 */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Software } from '@/types'

export default function SoftwarePage() {
  const [software, setSoftware] = useState<Software[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const fetchSoftware = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        sort_by: 'product_name',
        sort_order: 'asc',
      })
      if (search) params.append('search', search)
      if (categoryFilter) params.append('software_category', categoryFilter)

      const response = await fetch(`/api/software?${params}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Failed to fetch software')
      setSoftware(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter])

  useEffect(() => {
    fetchSoftware()
  }, [fetchSoftware])

  const formatCategory = (category: string | null) => {
    if (!category) return '-'
    return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
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
          <h1 className="text-h1">Software Catalog</h1>
          <Link href="/software/new" className="btn btn-primary">
            Add Software
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
                placeholder="Search software..."
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="category" className="block mb-2 font-bold">
                Category
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Categories</option>
                <option value="productivity">Productivity</option>
                <option value="security">Security</option>
                <option value="development">Development</option>
                <option value="communication">Communication</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="collaboration">Collaboration</option>
                <option value="broadcast">Broadcast</option>
                <option value="media">Media</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Software Table */}
        <div className="card">
          {software.length === 0 ? (
            <p className="text-center py-8">No software found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Product Name</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Website</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {software.map((sw) => (
                  <tr key={sw.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <Link href={`/software/${sw.id}`} className="text-blue hover:underline">
                        {sw.product_name}
                      </Link>
                    </td>
                    <td className="p-2">{formatCategory(sw.software_category)}</td>
                    <td className="p-2">
                      {sw.website ? (
                        <a
                          href={sw.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue hover:underline"
                        >
                          Link
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-2">{new Date(sw.created_at).toLocaleDateString()}</td>
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
