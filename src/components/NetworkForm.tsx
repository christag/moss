/**
 * Network Form Component
 * Handles creating and editing networks
 */
'use client'

import React, { useState, useEffect } from 'react'
import type {
  Network,
  CreateNetworkInput,
  UpdateNetworkInput,
  NetworkType,
  Location,
} from '@/types'
import { CIDRCalculator } from '@/components/CIDRCalculator'
import type { CIDRCalculation } from '@/lib/cidr-utils'

interface NetworkFormProps {
  /** Edit mode: provide existing network data */
  network?: Network
  /** Initial values for create mode (e.g., from query params) */
  initialValues?: Record<string, unknown>
  /** Callback after successful create/update */
  onSuccess: (network: Network) => void
  /** Callback on cancel */
  onCancel: () => void
}

const NETWORK_TYPE_OPTIONS: { value: NetworkType; label: string }[] = [
  { value: 'lan', label: 'LAN' },
  { value: 'wan', label: 'WAN' },
  { value: 'dmz', label: 'DMZ' },
  { value: 'guest', label: 'Guest' },
  { value: 'management', label: 'Management' },
  { value: 'storage', label: 'Storage' },
  { value: 'production', label: 'Production' },
  { value: 'broadcast', label: 'Broadcast' },
]

export function NetworkForm({
  network,
  initialValues: passedInitialValues,
  onSuccess,
  onCancel,
}: NetworkFormProps) {
  const isEditMode = !!network
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [showCIDRCalculator, setShowCIDRCalculator] = useState(false)

  // Prepare initial form data: merge passed values with existing network data
  const initialFormData: CreateNetworkInput = isEditMode
    ? {
        network_name: network.network_name || '',
        location_id: network.location_id || undefined,
        network_address: network.network_address || '',
        vlan_id: network.vlan_id || undefined,
        network_type: network.network_type || undefined,
        gateway: network.gateway || '',
        dns_servers: network.dns_servers || '',
        dhcp_enabled: network.dhcp_enabled || false,
        dhcp_range_start: network.dhcp_range_start || '',
        dhcp_range_end: network.dhcp_range_end || '',
        description: network.description || '',
        notes: network.notes || '',
      }
    : {
        network_name: (passedInitialValues?.network_name as string) || '',
        location_id: (passedInitialValues?.location_id as string) || undefined,
        network_address: (passedInitialValues?.network_address as string) || '',
        vlan_id: (passedInitialValues?.vlan_id as number) || undefined,
        network_type: (passedInitialValues?.network_type as NetworkType) || undefined,
        gateway: (passedInitialValues?.gateway as string) || '',
        dns_servers: (passedInitialValues?.dns_servers as string) || '',
        dhcp_enabled: (passedInitialValues?.dhcp_enabled as boolean) || false,
        dhcp_range_start: (passedInitialValues?.dhcp_range_start as string) || '',
        dhcp_range_end: (passedInitialValues?.dhcp_range_end as string) || '',
        description: (passedInitialValues?.description as string) || '',
        notes: (passedInitialValues?.notes as string) || '',
      }

  // Form state
  const [formData, setFormData] = useState<CreateNetworkInput>(initialFormData)

  // Load locations for dropdown
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations?sort_by=location_name&sort_order=asc')
        const result = await response.json()
        if (result.success && Array.isArray(result.data)) {
          setLocations(result.data)
        } else {
          console.error('Invalid locations response:', result)
          setLocations([])
        }
      } catch (err) {
        console.error('Error fetching locations:', err)
        setLocations([])
      }
    }
    fetchLocations()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const url = isEditMode ? `/api/networks/${network.id}` : '/api/networks'
      const method = isEditMode ? 'PATCH' : 'POST'

      // Build request body
      const body: CreateNetworkInput | UpdateNetworkInput = {
        network_name: formData.network_name,
        location_id: formData.location_id || undefined,
        network_address: formData.network_address || undefined,
        vlan_id: formData.vlan_id || undefined,
        network_type: formData.network_type || undefined,
        gateway: formData.gateway || undefined,
        dns_servers: formData.dns_servers || undefined,
        dhcp_enabled: formData.dhcp_enabled,
        dhcp_range_start: formData.dhcp_range_start || undefined,
        dhcp_range_end: formData.dhcp_range_end || undefined,
        description: formData.description || undefined,
        notes: formData.notes || undefined,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save network')
      }

      onSuccess(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof CreateNetworkInput, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyCIDR = (calculation: CIDRCalculation) => {
    // Apply calculated network address to form
    setFormData((prev) => ({
      ...prev,
      network_address: `${calculation.networkAddress}/${calculation.cidrNotation}`,
      gateway: calculation.firstUsableIP, // Suggest first usable IP as gateway
    }))
    // Optionally collapse the calculator after applying
    setShowCIDRCalculator(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <h2 className="text-h3 mb-4">{isEditMode ? 'Edit Network' : 'Create New Network'}</h2>

        {error && (
          <div className="bg-orange text-black p-4 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-2 gap-4">
          {/* Network Name */}
          <div>
            <label htmlFor="network_name" className="block mb-2 font-bold">
              Network Name *
            </label>
            <input
              type="text"
              id="network_name"
              value={formData.network_name}
              onChange={(e) => handleChange('network_name', e.target.value)}
              required
              className="w-full p-2 border rounded"
              placeholder="e.g., Production VLAN, Guest WiFi"
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location_id" className="block mb-2 font-bold">
              Location
            </label>
            <select
              id="location_id"
              value={formData.location_id || ''}
              onChange={(e) => handleChange('location_id', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Location --</option>
              {locations &&
                locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.location_name}
                  </option>
                ))}
            </select>
          </div>

          {/* Network Address */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="network_address" className="block mb-2 font-bold">
              Network Address (CIDR)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                id="network_address"
                value={formData.network_address}
                onChange={(e) => handleChange('network_address', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="e.g., 192.168.1.0/24"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setShowCIDRCalculator(!showCIDRCalculator)}
                className="btn-outline"
                style={{
                  padding: '0.5rem 1rem',
                  whiteSpace: 'nowrap',
                  backgroundColor: showCIDRCalculator ? 'var(--color-light-blue)' : 'transparent',
                }}
              >
                {showCIDRCalculator ? 'Hide' : 'Show'} Calculator
              </button>
            </div>

            {/* CIDR Calculator - Collapsible */}
            {showCIDRCalculator && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1.5rem',
                  border: '2px solid var(--color-morning-blue)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-off-white)',
                }}
              >
                <CIDRCalculator
                  initialValue={formData.network_address}
                  onApply={handleApplyCIDR}
                  showApplyButton={true}
                  compact={false}
                />
              </div>
            )}
          </div>

          {/* VLAN ID */}
          <div>
            <label htmlFor="vlan_id" className="block mb-2 font-bold">
              VLAN ID
            </label>
            <input
              type="number"
              id="vlan_id"
              value={formData.vlan_id || ''}
              onChange={(e) =>
                handleChange('vlan_id', e.target.value ? parseInt(e.target.value) : '')
              }
              min="1"
              max="4094"
              className="w-full p-2 border rounded"
              placeholder="1-4094"
            />
          </div>

          {/* Network Type */}
          <div>
            <label htmlFor="network_type" className="block mb-2 font-bold">
              Network Type
            </label>
            <select
              id="network_type"
              value={formData.network_type || ''}
              onChange={(e) => handleChange('network_type', e.target.value as NetworkType)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Type --</option>
              {NETWORK_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Gateway */}
          <div>
            <label htmlFor="gateway" className="block mb-2 font-bold">
              Gateway
            </label>
            <input
              type="text"
              id="gateway"
              value={formData.gateway}
              onChange={(e) => handleChange('gateway', e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., 192.168.1.1"
            />
          </div>

          {/* DNS Servers */}
          <div>
            <label htmlFor="dns_servers" className="block mb-2 font-bold">
              DNS Servers
            </label>
            <input
              type="text"
              id="dns_servers"
              value={formData.dns_servers}
              onChange={(e) => handleChange('dns_servers', e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Comma-separated list"
            />
          </div>

          {/* DHCP Enabled */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="dhcp_enabled"
                checked={formData.dhcp_enabled}
                onChange={(e) => handleChange('dhcp_enabled', e.target.checked)}
                className="w-5 h-5"
              />
              <span className="font-bold">DHCP Enabled</span>
            </label>
          </div>
        </div>

        {/* DHCP Range (conditional on dhcp_enabled) */}
        {formData.dhcp_enabled && (
          <div className="grid grid-2 gap-4 mt-4">
            <div>
              <label htmlFor="dhcp_range_start" className="block mb-2 font-bold">
                DHCP Range Start
              </label>
              <input
                type="text"
                id="dhcp_range_start"
                value={formData.dhcp_range_start}
                onChange={(e) => handleChange('dhcp_range_start', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="e.g., 192.168.1.100"
              />
            </div>

            <div>
              <label htmlFor="dhcp_range_end" className="block mb-2 font-bold">
                DHCP Range End
              </label>
              <input
                type="text"
                id="dhcp_range_end"
                value={formData.dhcp_range_end}
                onChange={(e) => handleChange('dhcp_range_end', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="e.g., 192.168.1.200"
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mt-4">
          <label htmlFor="description" className="block mb-2 font-bold">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full p-2 border rounded"
            placeholder="Network description and purpose"
          />
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label htmlFor="notes" className="block mb-2 font-bold">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            className="w-full p-2 border rounded"
            placeholder="Additional notes and technical information"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Network' : 'Create Network'}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
