/**
 * Installed Application Form Component
 */
'use client'

import React, { useState, useEffect } from 'react'
import type { InstalledApplication, Software, DeploymentStatus } from '@/types'

interface InstalledApplicationFormProps {
  application?: InstalledApplication
  onSuccess: (application: InstalledApplication) => void
  onCancel: () => void
}

export function InstalledApplicationForm({
  application,
  onSuccess,
  onCancel,
}: InstalledApplicationFormProps) {
  const isEdit = !!application

  const [formData, setFormData] = useState({
    application_name: application?.application_name || '',
    software_id: application?.software_id || '',
    version: application?.version || '',
    install_method: application?.install_method || '',
    deployment_platform: application?.deployment_platform || '',
    package_id: application?.package_id || '',
    deployment_status: (application?.deployment_status || '') as DeploymentStatus | '',
    install_date: application?.install_date
      ? new Date(application.install_date).toISOString().split('T')[0]
      : '',
    auto_update_enabled: application?.auto_update_enabled ?? false,
    notes: application?.notes || '',
  })

  const [software, setSoftware] = useState<Software[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch software catalog
    fetch('/api/software?limit=100&sort_by=product_name&sort_order=asc')
      .then((r) => r.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) setSoftware(result.data)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit
        ? `/api/installed-applications/${application.id}`
        : '/api/installed-applications'
      const method = isEdit ? 'PATCH' : 'POST'

      // Build request body - only include fields with values (omit null/empty)
      const requestBody: Record<string, string | boolean> = {
        application_name: formData.application_name,
        auto_update_enabled: formData.auto_update_enabled,
      }

      // Add optional fields only if they have values
      if (formData.software_id) requestBody.software_id = formData.software_id
      if (formData.version) requestBody.version = formData.version
      if (formData.install_method) requestBody.install_method = formData.install_method
      if (formData.deployment_platform)
        requestBody.deployment_platform = formData.deployment_platform
      if (formData.package_id) requestBody.package_id = formData.package_id
      if (formData.deployment_status) requestBody.deployment_status = formData.deployment_status
      if (formData.install_date) requestBody.install_date = formData.install_date
      if (formData.notes) requestBody.notes = formData.notes

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save installed application')
      }

      onSuccess(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="error-message">{error}</div>}

      <div className="grid grid-2 gap-4">
        {/* Application Name */}
        <div>
          <label htmlFor="application_name" className="block mb-2 font-bold">
            Application Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="application_name"
            value={formData.application_name}
            onChange={(e) => setFormData({ ...formData, application_name: e.target.value })}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Software */}
        <div>
          <label htmlFor="software_id" className="block mb-2 font-bold">
            Software Product
          </label>
          <select
            id="software_id"
            value={formData.software_id}
            onChange={(e) => setFormData({ ...formData, software_id: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Software</option>
            {software &&
              software.map((sw) => (
                <option key={sw.id} value={sw.id}>
                  {sw.product_name}
                </option>
              ))}
          </select>
        </div>

        {/* Version */}
        <div>
          <label htmlFor="version" className="block mb-2 font-bold">
            Version
          </label>
          <input
            type="text"
            id="version"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Deployment Status */}
        <div>
          <label htmlFor="deployment_status" className="block mb-2 font-bold">
            Deployment Status
          </label>
          <select
            id="deployment_status"
            value={formData.deployment_status}
            onChange={(e) =>
              setFormData({ ...formData, deployment_status: e.target.value as DeploymentStatus })
            }
            className="w-full p-2 border rounded"
          >
            <option value="">Select Status</option>
            <option value="pilot">Pilot</option>
            <option value="production">Production</option>
            <option value="deprecated">Deprecated</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        {/* Install Method */}
        <div>
          <label htmlFor="install_method" className="block mb-2 font-bold">
            Install Method
          </label>
          <input
            type="text"
            id="install_method"
            value={formData.install_method}
            onChange={(e) => setFormData({ ...formData, install_method: e.target.value })}
            placeholder="e.g., MSI, PKG, DMG, App Store"
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Deployment Platform */}
        <div>
          <label htmlFor="deployment_platform" className="block mb-2 font-bold">
            Deployment Platform
          </label>
          <input
            type="text"
            id="deployment_platform"
            value={formData.deployment_platform}
            onChange={(e) => setFormData({ ...formData, deployment_platform: e.target.value })}
            placeholder="e.g., Jamf, Intune, SCCM"
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Package ID */}
        <div>
          <label htmlFor="package_id" className="block mb-2 font-bold">
            Package ID
          </label>
          <input
            type="text"
            id="package_id"
            value={formData.package_id}
            onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
            placeholder="e.g., com.company.app"
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Install Date */}
        <div>
          <label htmlFor="install_date" className="block mb-2 font-bold">
            Install Date
          </label>
          <input
            type="date"
            id="install_date"
            value={formData.install_date}
            onChange={(e) => setFormData({ ...formData, install_date: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Auto Update Enabled */}
        <div className="flex items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.auto_update_enabled}
              onChange={(e) => setFormData({ ...formData, auto_update_enabled: e.target.checked })}
            />
            <span className="font-bold">Auto Update Enabled</span>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block mb-2 font-bold">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Application' : 'Create Application'}
        </button>
      </div>
    </form>
  )
}
