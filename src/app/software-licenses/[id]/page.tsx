/**
 * Software License Detail Page
 */
'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SoftwareLicense } from '@/types'

export default function SoftwareLicenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [license, setLicense] = useState<SoftwareLicense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/software-licenses/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) throw new Error(result.message || 'Failed to fetch license')
        setLicense(result.data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!license || !confirm(`Are you sure you want to delete this software license?`)) return
    try {
      const response = await fetch(`/api/software-licenses/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Failed to delete license')
      }
      router.push('/software-licenses')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete license')
    }
  }

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

  if (loading)
    return (
      <div className="container">
        <div className="p-lg">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    )

  if (error || !license)
    return (
      <div className="container">
        <div className="p-lg">
          <div className="error-message">{error || 'License not found'}</div>
          <Link href="/software-licenses" className="btn btn-secondary mt-4">
            Back to Licenses
          </Link>
        </div>
      </div>
    )

  return (
    <div className="container">
      <div className="p-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-h1">{formatType(license.license_type)} License</h1>
            <p className="text-gray-600">
              {license.expiration_date && (
                <>
                  Expires: {new Date(license.expiration_date).toLocaleDateString()}
                  {isExpired(license.expiration_date) ? (
                    <span className="badge badge-danger ml-2">Expired</span>
                  ) : isExpiringSoon(license.expiration_date) ? (
                    <span className="badge badge-warning ml-2">Expiring Soon</span>
                  ) : null}
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/software-licenses/${id}/edit`} className="btn btn-primary">
              Edit
            </Link>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-h3 mb-4">License Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">License Type</p>
              <p>{formatType(license.license_type)}</p>
            </div>
            <div>
              <p className="font-bold">Purchase Date</p>
              <p>
                {license.purchase_date ? new Date(license.purchase_date).toLocaleDateString() : '-'}
              </p>
            </div>
            <div>
              <p className="font-bold">Expiration Date</p>
              <p>
                {license.expiration_date
                  ? new Date(license.expiration_date).toLocaleDateString()
                  : '-'}
              </p>
            </div>
            <div>
              <p className="font-bold">Renewal Date</p>
              <p>
                {license.renewal_date ? new Date(license.renewal_date).toLocaleDateString() : '-'}
              </p>
            </div>
            <div>
              <p className="font-bold">Auto Renew</p>
              <p>{license.auto_renew ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="font-bold">Cost</p>
              <p>{license.cost ? `$${license.cost}` : '-'}</p>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-h3 mb-4">Seat Usage</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Total Seats</p>
              <p>{license.seat_count || '-'}</p>
            </div>
            <div>
              <p className="font-bold">Seats Used</p>
              <p>{license.seats_used || 0}</p>
            </div>
            <div>
              <p className="font-bold">Available Seats</p>
              <p>{license.seat_count ? license.seat_count - (license.seats_used || 0) : '-'}</p>
            </div>
            <div>
              <p className="font-bold">Utilization</p>
              <p>
                {license.seat_count && license.seat_count > 0
                  ? `${Math.round(((license.seats_used || 0) / license.seat_count) * 100)}%`
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {license.license_key && (
          <div className="card mb-6">
            <h2 className="text-h3 mb-4">License Key</h2>
            <pre className="p-4 bg-gray-100 rounded font-mono text-sm overflow-x-auto">
              {license.license_key}
            </pre>
          </div>
        )}

        {license.notes && (
          <div className="card mb-6">
            <h2 className="text-h3 mb-4">Notes</h2>
            <p className="whitespace-pre-wrap">{license.notes}</p>
          </div>
        )}

        <div className="card">
          <h2 className="text-h3 mb-4">System Information</h2>
          <div className="grid grid-2 gap-4">
            <div>
              <p className="font-bold">Created</p>
              <p>{new Date(license.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-bold">Last Updated</p>
              <p>{new Date(license.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
