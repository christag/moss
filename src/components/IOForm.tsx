/**
 * IO Form Component
 * Handles creating and editing IOs (Interfaces/Ports) with conditional fields
 */
'use client'

import React, { useState, useEffect } from 'react'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { JunctionTableManager } from './JunctionTableManager'
import type {
  IO,
  CreateIOInput,
  InterfaceType,
  MediaType,
  IOStatus,
  Duplex,
  TrunkMode,
  Device,
  Room,
  Network,
} from '@/types'

interface IOFormProps {
  /** Edit mode: provide existing IO data */
  io?: IO
  /** Initial values for create mode (e.g., from query params) */
  initialValues?: Record<string, unknown>
  /** Callback after successful create/update */
  onSuccess: (io: IO) => void
  /** Callback on cancel */
  onCancel: () => void
}

const INTERFACE_TYPE_OPTIONS: { value: InterfaceType; label: string }[] = [
  { value: 'ethernet', label: 'Ethernet' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'fiber_optic', label: 'Fiber Optic' },
  { value: 'sdi', label: 'SDI (Broadcast)' },
  { value: 'hdmi', label: 'HDMI' },
  { value: 'xlr', label: 'XLR (Audio)' },
  { value: 'usb', label: 'USB' },
  { value: 'thunderbolt', label: 'Thunderbolt' },
  { value: 'displayport', label: 'DisplayPort' },
  { value: 'coax', label: 'Coax' },
  { value: 'serial', label: 'Serial' },
  { value: 'patch_panel_port', label: 'Patch Panel Port' },
  { value: 'power_input', label: 'Power Input' },
  { value: 'power_output', label: 'Power Output' },
  { value: 'other', label: 'Other' },
]

const MEDIA_TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: 'single_mode_fiber', label: 'Single Mode Fiber' },
  { value: 'multi_mode_fiber', label: 'Multi Mode Fiber' },
  { value: 'cat5e', label: 'Cat5e' },
  { value: 'cat6', label: 'Cat6' },
  { value: 'cat6a', label: 'Cat6a' },
  { value: 'coax', label: 'Coax' },
  { value: 'wireless', label: 'Wireless' },
  { value: 'ac_power', label: 'AC Power' },
  { value: 'dc_power', label: 'DC Power' },
  { value: 'poe', label: 'PoE' },
  { value: 'other', label: 'Other' },
]

const STATUS_OPTIONS: { value: IOStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'reserved', label: 'Reserved' },
]

const DUPLEX_OPTIONS: { value: Duplex; label: string }[] = [
  { value: 'full', label: 'Full' },
  { value: 'half', label: 'Half' },
  { value: 'auto', label: 'Auto' },
  { value: 'n/a', label: 'N/A' },
]

const TRUNK_MODE_OPTIONS: { value: TrunkMode; label: string }[] = [
  { value: 'access', label: 'Access' },
  { value: 'trunk', label: 'Trunk' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'n/a', label: 'N/A' },
]

export function IOForm({
  io,
  initialValues: passedInitialValues,
  onSuccess,
  onCancel,
}: IOFormProps) {
  const isEditMode = !!io
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dropdown data
  const [devices, setDevices] = useState<Device[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [ios, setIos] = useState<IO[]>([])

  // Tagged networks for trunk/hybrid ports
  const [taggedNetworks, setTaggedNetworks] = useState<Network[]>([])

  // Prepare initial form data: merge passed values with existing IO data
  const initialFormData: CreateIOInput = isEditMode
    ? {
        device_id: io.device_id || undefined,
        room_id: io.room_id || undefined,
        native_network_id: io.native_network_id || undefined,
        connected_to_io_id: io.connected_to_io_id || undefined,
        interface_name: io.interface_name || '',
        interface_type: io.interface_type || 'ethernet',
        media_type: io.media_type || undefined,
        status: io.status || 'active',
        speed: io.speed || '',
        duplex: io.duplex || undefined,
        trunk_mode: io.trunk_mode || undefined,
        port_number: io.port_number || '',
        mac_address: io.mac_address || '',
        voltage: io.voltage || '',
        amperage: io.amperage || '',
        wattage: io.wattage || '',
        power_connector_type: io.power_connector_type || '',
        description: io.description || '',
        notes: io.notes || '',
      }
    : {
        ...(passedInitialValues || {}),
        interface_name: (passedInitialValues?.interface_name as string) || '',
        interface_type: (passedInitialValues?.interface_type as InterfaceType) || 'ethernet',
        status: (passedInitialValues?.status as IOStatus) || 'active',
        speed: (passedInitialValues?.speed as string) || '',
        port_number: (passedInitialValues?.port_number as string) || '',
        mac_address: (passedInitialValues?.mac_address as string) || '',
        voltage: (passedInitialValues?.voltage as string) || '',
        amperage: (passedInitialValues?.amperage as string) || '',
        wattage: (passedInitialValues?.wattage as string) || '',
        power_connector_type: (passedInitialValues?.power_connector_type as string) || '',
        description: (passedInitialValues?.description as string) || '',
        notes: (passedInitialValues?.notes as string) || '',
      }

  // Form state
  const [formData, setFormData] = useState<CreateIOInput>(initialFormData)

  // Determine which field groups to show based on interface_type
  const isNetworkInterface = ['ethernet', 'wifi', 'virtual', 'fiber_optic'].includes(
    formData.interface_type
  )
  const isPowerInterface = ['power_input', 'power_output'].includes(formData.interface_type)

  // Load dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch devices
        const devicesRes = await fetch('/api/devices?sort_by=hostname&sort_order=asc')
        const devicesData = await devicesRes.json()
        if (devicesData.success && devicesData.data?.devices) {
          setDevices(devicesData.data.devices)
        }

        // Fetch rooms
        const roomsRes = await fetch('/api/rooms?sort_by=room_name&sort_order=asc')
        const roomsData = await roomsRes.json()
        if (roomsData.success && roomsData.data?.rooms) {
          setRooms(roomsData.data.rooms)
        }

        // Fetch networks
        const networksRes = await fetch('/api/networks?sort_by=network_name&sort_order=asc')
        const networksData = await networksRes.json()
        if (networksData.success && Array.isArray(networksData.data)) {
          setNetworks(networksData.data)
        }

        // Fetch IOs (for connected_to_io_id)
        const iosRes = await fetch('/api/ios?sort_by=interface_name&sort_order=asc')
        const iosData = await iosRes.json()
        if (iosData.success && Array.isArray(iosData.data)) {
          // Filter out current IO if editing
          setIos(iosData.data.filter((i: IO) => i.id !== io?.id))
        }
      } catch (err) {
        console.error('Error fetching dropdown data:', err)
      }
    }
    fetchDropdownData()
  }, [io?.id])

  // Fetch tagged networks for edit mode
  useEffect(() => {
    const fetchTaggedNetworks = async () => {
      if (!io?.id) return

      try {
        const response = await fetch(`/api/ios/${io.id}/tagged-networks`)
        const result = await response.json()
        if (result.success && Array.isArray(result.data)) {
          setTaggedNetworks(result.data)
        }
      } catch (err) {
        console.error('Error fetching tagged networks:', err)
      }
    }

    fetchTaggedNetworks()
  }, [io?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const url = isEditMode ? `/api/ios/${io.id}` : '/api/ios'
      const method = isEditMode ? 'PATCH' : 'POST'

      // Build request body - only include fields that have values
      const body: CreateIOInput = {
        device_id: formData.device_id || undefined,
        room_id: formData.room_id || undefined,
        native_network_id: formData.native_network_id || undefined,
        connected_to_io_id: formData.connected_to_io_id || undefined,
        interface_name: formData.interface_name,
        interface_type: formData.interface_type,
        media_type: formData.media_type || undefined,
        status: formData.status,
        speed: formData.speed || undefined,
        duplex: formData.duplex || undefined,
        trunk_mode: formData.trunk_mode || undefined,
        port_number: formData.port_number || undefined,
        mac_address: formData.mac_address || undefined,
        voltage: formData.voltage || undefined,
        amperage: formData.amperage || undefined,
        wattage: formData.wattage || undefined,
        power_connector_type: formData.power_connector_type || undefined,
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
        throw new Error(result.message || 'Failed to save IO')
      }

      onSuccess(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof CreateIOInput, value: string | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handlers for tagged networks (VLAN tagging)
  const handleAddTaggedNetwork = async (network: Network) => {
    if (!io?.id) return

    const response = await fetch(`/api/ios/${io.id}/tagged-networks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ network_id: network.id }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to tag network')
    }

    // Update local state
    setTaggedNetworks((prev) => [...prev, network])
  }

  const handleRemoveTaggedNetwork = async (networkId: string) => {
    if (!io?.id) return

    const response = await fetch(`/api/ios/${io.id}/tagged-networks/${networkId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to remove network tag')
    }

    // Update local state
    setTaggedNetworks((prev) => prev.filter((n) => n.id !== networkId))
  }

  return (
    <div className="generic-form">
      <h2 className="form-title">{isEditMode ? 'Edit IO' : 'Create New IO'}</h2>

      <form onSubmit={handleSubmit} className="form-content">
        {error && (
          <div className="form-error" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="form-fields">
          {/* Interface Name */}
          <Input
            type="text"
            id="interface_name"
            label="Interface Name"
            value={formData.interface_name}
            onChange={(e) => handleChange('interface_name', e.target.value)}
            required
            placeholder="e.g., eth0, GigabitEthernet1/0/1"
          />

          {/* Interface Type */}
          <Select
            id="interface_type"
            label="Interface Type"
            value={formData.interface_type}
            onChange={(e) => handleChange('interface_type', e.target.value as InterfaceType)}
            required
            options={INTERFACE_TYPE_OPTIONS}
          />

          {/* Device */}
          <Select
            id="device_id"
            label="Device"
            value={formData.device_id || ''}
            onChange={(e) => handleChange('device_id', e.target.value || undefined)}
            options={[
              { value: '', label: '-- Select Device --' },
              ...devices.map((device) => ({
                value: device.id,
                label:
                  device.hostname || device.model || `${device.manufacturer} ${device.device_type}`,
              })),
            ]}
          />

          {/* Room */}
          <Select
            id="room_id"
            label="Room"
            value={formData.room_id || ''}
            onChange={(e) => handleChange('room_id', e.target.value || undefined)}
            options={[
              { value: '', label: '-- Select Room --' },
              ...rooms.map((room) => ({
                value: room.id,
                label: room.room_name,
              })),
            ]}
          />

          {/* Status */}
          <Select
            id="status"
            label="Status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as IOStatus)}
            options={STATUS_OPTIONS}
          />

          {/* Port Number */}
          <Input
            type="text"
            id="port_number"
            label="Port Number"
            value={formData.port_number}
            onChange={(e) => handleChange('port_number', e.target.value || undefined)}
            placeholder="e.g., 1, 24, 1/0/1"
          />
        </div>

        {/* Network-specific fields */}
        {isNetworkInterface && (
          <>
            <h3 className="section-title">Network Configuration</h3>
            <div className="form-fields">
              {/* Media Type */}
              <Select
                id="media_type"
                label="Media Type"
                value={formData.media_type || ''}
                onChange={(e) =>
                  handleChange('media_type', (e.target.value as MediaType) || undefined)
                }
                options={[{ value: '', label: '-- Select Media Type --' }, ...MEDIA_TYPE_OPTIONS]}
              />

              {/* Speed */}
              <Input
                type="text"
                id="speed"
                label="Speed"
                value={formData.speed}
                onChange={(e) => handleChange('speed', e.target.value || undefined)}
                placeholder="e.g., 1Gbps, 10Gbps, 100Mbps"
              />

              {/* Duplex */}
              <Select
                id="duplex"
                label="Duplex"
                value={formData.duplex || ''}
                onChange={(e) => handleChange('duplex', (e.target.value as Duplex) || undefined)}
                options={[{ value: '', label: '-- Select Duplex --' }, ...DUPLEX_OPTIONS]}
              />

              {/* Trunk Mode */}
              <Select
                id="trunk_mode"
                label="Trunk Mode"
                value={formData.trunk_mode || ''}
                onChange={(e) =>
                  handleChange('trunk_mode', (e.target.value as TrunkMode) || undefined)
                }
                options={[{ value: '', label: '-- Select Trunk Mode --' }, ...TRUNK_MODE_OPTIONS]}
              />

              {/* MAC Address */}
              <Input
                type="text"
                id="mac_address"
                label="MAC Address"
                value={formData.mac_address}
                onChange={(e) => handleChange('mac_address', e.target.value || undefined)}
                placeholder="e.g., 00:1A:2B:3C:4D:5E"
                maxLength={17}
              />

              {/* Native Network (VLAN) */}
              <Select
                id="native_network_id"
                label="Native Network (VLAN)"
                value={formData.native_network_id || ''}
                onChange={(e) => handleChange('native_network_id', e.target.value || undefined)}
                options={[
                  { value: '', label: '-- Select Network --' },
                  ...networks.map((network) => ({
                    value: network.id,
                    label: `${network.network_name}${network.vlan_id ? ` (VLAN ${network.vlan_id})` : ''}`,
                  })),
                ]}
              />
            </div>

            {/* Tagged Networks (VLAN Tagging) - only for trunk/hybrid ports in edit mode */}
            {isEditMode &&
              (formData.trunk_mode === 'trunk' || formData.trunk_mode === 'hybrid') && (
                <div className="mt-6">
                  <h4 className="text-h5 mb-3">Tagged VLANs (Trunk Configuration)</h4>
                  <JunctionTableManager<Network>
                    currentItems={taggedNetworks}
                    availableItemsEndpoint="/api/networks?sort_by=network_name&sort_order=asc"
                    getItemLabel={(network) =>
                      `${network.network_name}${network.vlan_id ? ` (VLAN ${network.vlan_id})` : ''}`
                    }
                    onAdd={handleAddTaggedNetwork}
                    onRemove={handleRemoveTaggedNetwork}
                    placeholder="Search networks to tag..."
                    emptyMessage="No VLANs tagged on this trunk port"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Tagged VLANs allow multiple networks to traverse this trunk port. The native
                    VLAN (above) passes untagged traffic.
                  </p>
                </div>
              )}
          </>
        )}

        {/* Power-specific fields */}
        {isPowerInterface && (
          <>
            <h3 className="section-title">Power Configuration</h3>
            <div className="form-fields">
              {/* Voltage */}
              <Input
                type="text"
                id="voltage"
                label="Voltage"
                value={formData.voltage}
                onChange={(e) => handleChange('voltage', e.target.value || undefined)}
                placeholder="e.g., 120V, 240V"
              />

              {/* Amperage */}
              <Input
                type="text"
                id="amperage"
                label="Amperage"
                value={formData.amperage}
                onChange={(e) => handleChange('amperage', e.target.value || undefined)}
                placeholder="e.g., 15A, 20A"
              />

              {/* Wattage */}
              <Input
                type="text"
                id="wattage"
                label="Wattage"
                value={formData.wattage}
                onChange={(e) => handleChange('wattage', e.target.value || undefined)}
                placeholder="e.g., 1000W, 1500W"
              />

              {/* Power Connector Type */}
              <Input
                type="text"
                id="power_connector_type"
                label="Power Connector Type"
                value={formData.power_connector_type}
                onChange={(e) => handleChange('power_connector_type', e.target.value || undefined)}
                placeholder="e.g., IEC C13, NEMA 5-15"
              />
            </div>
          </>
        )}

        {/* Connectivity */}
        <h3 className="section-title">Connectivity</h3>
        <div className="form-fields">
          {/* Connected to IO */}
          <Select
            id="connected_to_io_id"
            label="Connected to IO"
            value={formData.connected_to_io_id || ''}
            onChange={(e) => handleChange('connected_to_io_id', e.target.value || undefined)}
            options={[
              { value: '', label: '-- Select IO --' },
              ...ios.map((io) => ({
                value: io.id,
                label: `${io.interface_name} (${io.interface_type})`,
              })),
            ]}
          />
        </div>

        {/* Description */}
        <Textarea
          id="description"
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value || undefined)}
          rows={3}
          placeholder="Interface description and purpose"
        />

        {/* Notes */}
        <Textarea
          id="notes"
          label="Notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value || undefined)}
          rows={4}
          placeholder="Additional notes and technical information"
        />

        {/* Actions */}
        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={isSubmitting} isLoading={isSubmitting}>
            {isEditMode ? 'Update IO' : 'Create IO'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>

      <style jsx>{`
        .generic-form {
          background: var(--color-off-white);
          border-radius: 8px;
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .form-title {
          font-size: 1.8rem;
          font-weight: 600;
          color: var(--color-brew-black);
          margin-bottom: 1.5rem;
        }

        .form-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-error {
          background: var(--color-orange);
          color: var(--color-brew-black);
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .section-title {
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--color-brew-black);
          margin: 1.5rem 0 1rem 0;
          padding-top: 1.5rem;
          border-top: 1px solid var(--color-brew-black-10);
        }

        .section-title:first-of-type {
          border-top: none;
          padding-top: 0;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--color-brew-black-10);
        }

        @media (max-width: 768px) {
          .generic-form {
            padding: 1rem;
          }

          .form-title {
            font-size: 1.5rem;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
