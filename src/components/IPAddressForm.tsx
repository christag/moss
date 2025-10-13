/**
 * IP Address Form Component
 */
'use client'

import React, { useState, useEffect } from 'react'
import type { IPAddress, IO, Network, IPVersion, IPAddressType } from '@/types'

interface IPAddressFormProps {
  ipAddress?: IPAddress
  onSuccess: (ipAddress: IPAddress) => void
  onCancel: () => void
}

// IPv4 regex: validates 0-255 for each octet
const IPV4_REGEX =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

// IPv6 regex: handles full and compressed notation
const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|::)$/

export function IPAddressForm({ ipAddress, onSuccess, onCancel }: IPAddressFormProps) {
  const isEdit = !!ipAddress

  const [formData, setFormData] = useState({
    io_id: ipAddress?.io_id || '',
    network_id: ipAddress?.network_id || '',
    ip_address: ipAddress?.ip_address || '',
    ip_version: (ipAddress?.ip_version || 'v4') as IPVersion,
    type: (ipAddress?.type || 'static') as IPAddressType,
    dns_name: ipAddress?.dns_name || '',
    assignment_date: ipAddress?.assignment_date
      ? new Date(ipAddress.assignment_date).toISOString().split('T')[0]
      : '',
    notes: ipAddress?.notes || '',
  })

  const [ios, setIos] = useState<IO[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ipValidationError, setIpValidationError] = useState<string | null>(null)

  // Validate IP address format
  const validateIPAddress = (ip: string, version: IPVersion): boolean => {
    if (!ip) return false
    if (version === 'v4') {
      return IPV4_REGEX.test(ip)
    } else {
      return IPV6_REGEX.test(ip)
    }
  }

  // Update validation error when IP address or version changes
  useEffect(() => {
    if (formData.ip_address) {
      const isValid = validateIPAddress(formData.ip_address, formData.ip_version)
      if (!isValid) {
        setIpValidationError(
          `Invalid ${formData.ip_version === 'v4' ? 'IPv4' : 'IPv6'} address format. Example: ${formData.ip_version === 'v4' ? '192.168.1.1' : '2001:0db8:85a3::8a2e:0370:7334'}`
        )
      } else {
        setIpValidationError(null)
      }
    } else {
      setIpValidationError(null)
    }
  }, [formData.ip_address, formData.ip_version])

  useEffect(() => {
    // Fetch IOs
    fetch('/api/ios?limit=100&sort_by=interface_name&sort_order=asc')
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setIos(result.data)
        } else {
          setIos([])
        }
      })
      .catch(() => setIos([]))

    // Fetch Networks
    fetch('/api/networks?limit=100&sort_by=network_name&sort_order=asc')
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setNetworks(result.data)
        } else {
          setNetworks([])
        }
      })
      .catch(() => setNetworks([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit ? `/api/ip-addresses/${ipAddress.id}` : '/api/ip-addresses'
      const method = isEdit ? 'PATCH' : 'POST'

      // Build request body dynamically, only including fields with values
      const requestBody: Record<string, unknown> = {
        ip_address: formData.ip_address,
        ip_version: formData.ip_version,
        type: formData.type,
      }

      // Only include optional fields if they have values
      if (formData.io_id) requestBody.io_id = formData.io_id
      if (formData.network_id) requestBody.network_id = formData.network_id
      if (formData.dns_name) requestBody.dns_name = formData.dns_name
      if (formData.assignment_date) requestBody.assignment_date = formData.assignment_date
      if (formData.notes) requestBody.notes = formData.notes

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save IP address')
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
        {/* IP Address */}
        <div>
          <label htmlFor="ip_address" className="block mb-2 font-bold">
            IP Address <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="ip_address"
            value={formData.ip_address}
            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
            required
            className={`w-full p-2 border rounded ${ipValidationError ? 'border-red-600' : ''}`}
            placeholder={
              formData.ip_version === 'v4' ? '192.168.1.10' : '2001:0db8:85a3::8a2e:0370:7334'
            }
          />
          {ipValidationError && <p className="text-red-600 text-sm mt-1">{ipValidationError}</p>}
        </div>

        {/* IP Version */}
        <div>
          <label htmlFor="ip_version" className="block mb-2 font-bold">
            IP Version
          </label>
          <select
            id="ip_version"
            value={formData.ip_version}
            onChange={(e) => setFormData({ ...formData, ip_version: e.target.value as IPVersion })}
            className="w-full p-2 border rounded"
          >
            <option value="v4">IPv4</option>
            <option value="v6">IPv6</option>
          </select>
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block mb-2 font-bold">
            Type
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as IPAddressType })}
            className="w-full p-2 border rounded"
          >
            <option value="static">Static</option>
            <option value="dhcp">DHCP</option>
            <option value="reserved">Reserved</option>
            <option value="floating">Floating</option>
          </select>
        </div>

        {/* DNS Name */}
        <div>
          <label htmlFor="dns_name" className="block mb-2 font-bold">
            DNS Name
          </label>
          <input
            type="text"
            id="dns_name"
            value={formData.dns_name}
            onChange={(e) => setFormData({ ...formData, dns_name: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="server01.example.com"
          />
        </div>

        {/* IO */}
        <div>
          <label htmlFor="io_id" className="block mb-2 font-bold">
            Interface/Port
          </label>
          <select
            id="io_id"
            value={formData.io_id}
            onChange={(e) => setFormData({ ...formData, io_id: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Interface</option>
            {ios &&
              ios.map((io) => (
                <option key={io.id} value={io.id}>
                  {io.interface_name} ({io.interface_type})
                </option>
              ))}
          </select>
        </div>

        {/* Network */}
        <div>
          <label htmlFor="network_id" className="block mb-2 font-bold">
            Network
          </label>
          <select
            id="network_id"
            value={formData.network_id}
            onChange={(e) => setFormData({ ...formData, network_id: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Network</option>
            {networks &&
              networks.map((network) => (
                <option key={network.id} value={network.id}>
                  {network.network_name} ({network.network_address})
                </option>
              ))}
          </select>
        </div>

        {/* Assignment Date */}
        <div>
          <label htmlFor="assignment_date" className="block mb-2 font-bold">
            Assignment Date
          </label>
          <input
            type="date"
            id="assignment_date"
            value={formData.assignment_date}
            onChange={(e) => setFormData({ ...formData, assignment_date: e.target.value })}
            className="w-full p-2 border rounded"
          />
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
        <button type="submit" className="btn btn-primary" disabled={loading || !!ipValidationError}>
          {loading ? 'Saving...' : isEdit ? 'Update IP Address' : 'Create IP Address'}
        </button>
      </div>
    </form>
  )
}
