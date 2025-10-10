/**
 * IO Form Component
 * Handles creating and editing IOs (Interfaces/Ports) with conditional fields
 */
'use client'

import React, { useState, useEffect } from 'react'
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
  io?: IO
  onSuccess: (io: IO) => void
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

export function IOForm({ io, onSuccess, onCancel }: IOFormProps) {
  const isEditMode = !!io
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dropdown data
  const [devices, setDevices] = useState<Device[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [ios, setIos] = useState<IO[]>([])

  // Form state
  const [formData, setFormData] = useState<CreateIOInput>({
    device_id: io?.device_id || undefined,
    room_id: io?.room_id || undefined,
    native_network_id: io?.native_network_id || undefined,
    connected_to_io_id: io?.connected_to_io_id || undefined,
    interface_name: io?.interface_name || '',
    interface_type: io?.interface_type || 'ethernet',
    media_type: io?.media_type || undefined,
    status: io?.status || 'active',
    speed: io?.speed || '',
    duplex: io?.duplex || undefined,
    trunk_mode: io?.trunk_mode || undefined,
    port_number: io?.port_number || '',
    mac_address: io?.mac_address || '',
    voltage: io?.voltage || '',
    amperage: io?.amperage || '',
    wattage: io?.wattage || '',
    power_connector_type: io?.power_connector_type || '',
    description: io?.description || '',
    notes: io?.notes || '',
  })

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
        const devicesRes = await fetch('/api/devices?limit=100&sort_by=hostname&sort_order=asc')
        const devicesData = await devicesRes.json()
        if (devicesData.success && Array.isArray(devicesData.data)) {
          setDevices(devicesData.data)
        }

        // Fetch rooms
        const roomsRes = await fetch('/api/rooms?limit=100&sort_by=room_name&sort_order=asc')
        const roomsData = await roomsRes.json()
        if (roomsData.success && Array.isArray(roomsData.data)) {
          setRooms(roomsData.data)
        }

        // Fetch networks
        const networksRes = await fetch(
          '/api/networks?limit=100&sort_by=network_name&sort_order=asc'
        )
        const networksData = await networksRes.json()
        if (networksData.success && Array.isArray(networksData.data)) {
          setNetworks(networksData.data)
        }

        // Fetch IOs (for connected_to_io_id)
        const iosRes = await fetch('/api/ios?limit=100&sort_by=interface_name&sort_order=asc')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <h2 className="text-h3 mb-4">{isEditMode ? 'Edit IO' : 'Create New IO'}</h2>

        {error && (
          <div className="bg-orange text-black p-4 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-2 gap-4">
          {/* Interface Name */}
          <div>
            <label htmlFor="interface_name" className="block mb-2 font-bold">
              Interface Name *
            </label>
            <input
              type="text"
              id="interface_name"
              value={formData.interface_name}
              onChange={(e) => handleChange('interface_name', e.target.value)}
              required
              className="w-full p-2 border rounded"
              placeholder="e.g., eth0, GigabitEthernet1/0/1"
            />
          </div>

          {/* Interface Type */}
          <div>
            <label htmlFor="interface_type" className="block mb-2 font-bold">
              Interface Type *
            </label>
            <select
              id="interface_type"
              value={formData.interface_type}
              onChange={(e) => handleChange('interface_type', e.target.value as InterfaceType)}
              required
              className="w-full p-2 border rounded"
            >
              {INTERFACE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Device */}
          <div>
            <label htmlFor="device_id" className="block mb-2 font-bold">
              Device
            </label>
            <select
              id="device_id"
              value={formData.device_id || ''}
              onChange={(e) => handleChange('device_id', e.target.value || undefined)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Device --</option>
              {devices &&
                devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.hostname ||
                      device.model ||
                      `${device.manufacturer} ${device.device_type}`}
                  </option>
                ))}
            </select>
          </div>

          {/* Room */}
          <div>
            <label htmlFor="room_id" className="block mb-2 font-bold">
              Room
            </label>
            <select
              id="room_id"
              value={formData.room_id || ''}
              onChange={(e) => handleChange('room_id', e.target.value || undefined)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Room --</option>
              {rooms &&
                rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_name}
                  </option>
                ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block mb-2 font-bold">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as IOStatus)}
              className="w-full p-2 border rounded"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Port Number */}
          <div>
            <label htmlFor="port_number" className="block mb-2 font-bold">
              Port Number
            </label>
            <input
              type="text"
              id="port_number"
              value={formData.port_number}
              onChange={(e) => handleChange('port_number', e.target.value || undefined)}
              className="w-full p-2 border rounded"
              placeholder="e.g., 1, 24, 1/0/1"
            />
          </div>
        </div>

        {/* Network-specific fields */}
        {isNetworkInterface && (
          <>
            <h3 className="text-h4 mt-6 mb-4">Network Configuration</h3>
            <div className="grid grid-2 gap-4">
              {/* Media Type */}
              <div>
                <label htmlFor="media_type" className="block mb-2 font-bold">
                  Media Type
                </label>
                <select
                  id="media_type"
                  value={formData.media_type || ''}
                  onChange={(e) =>
                    handleChange('media_type', (e.target.value as MediaType) || undefined)
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Media Type --</option>
                  {MEDIA_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed */}
              <div>
                <label htmlFor="speed" className="block mb-2 font-bold">
                  Speed
                </label>
                <input
                  type="text"
                  id="speed"
                  value={formData.speed}
                  onChange={(e) => handleChange('speed', e.target.value || undefined)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., 1Gbps, 10Gbps, 100Mbps"
                />
              </div>

              {/* Duplex */}
              <div>
                <label htmlFor="duplex" className="block mb-2 font-bold">
                  Duplex
                </label>
                <select
                  id="duplex"
                  value={formData.duplex || ''}
                  onChange={(e) => handleChange('duplex', (e.target.value as Duplex) || undefined)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Duplex --</option>
                  {DUPLEX_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trunk Mode */}
              <div>
                <label htmlFor="trunk_mode" className="block mb-2 font-bold">
                  Trunk Mode
                </label>
                <select
                  id="trunk_mode"
                  value={formData.trunk_mode || ''}
                  onChange={(e) =>
                    handleChange('trunk_mode', (e.target.value as TrunkMode) || undefined)
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Trunk Mode --</option>
                  {TRUNK_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* MAC Address */}
              <div>
                <label htmlFor="mac_address" className="block mb-2 font-bold">
                  MAC Address
                </label>
                <input
                  type="text"
                  id="mac_address"
                  value={formData.mac_address}
                  onChange={(e) => handleChange('mac_address', e.target.value || undefined)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., 00:1A:2B:3C:4D:5E"
                  maxLength={17}
                />
              </div>

              {/* Native Network (VLAN) */}
              <div>
                <label htmlFor="native_network_id" className="block mb-2 font-bold">
                  Native Network (VLAN)
                </label>
                <select
                  id="native_network_id"
                  value={formData.native_network_id || ''}
                  onChange={(e) => handleChange('native_network_id', e.target.value || undefined)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Network --</option>
                  {networks &&
                    networks.map((network) => (
                      <option key={network.id} value={network.id}>
                        {network.network_name} {network.vlan_id && `(VLAN ${network.vlan_id})`}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Power-specific fields */}
        {isPowerInterface && (
          <>
            <h3 className="text-h4 mt-6 mb-4">Power Configuration</h3>
            <div className="grid grid-2 gap-4">
              {/* Voltage */}
              <div>
                <label htmlFor="voltage" className="block mb-2 font-bold">
                  Voltage
                </label>
                <input
                  type="text"
                  id="voltage"
                  value={formData.voltage}
                  onChange={(e) => handleChange('voltage', e.target.value || undefined)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., 120V, 240V"
                />
              </div>

              {/* Amperage */}
              <div>
                <label htmlFor="amperage" className="block mb-2 font-bold">
                  Amperage
                </label>
                <input
                  type="text"
                  id="amperage"
                  value={formData.amperage}
                  onChange={(e) => handleChange('amperage', e.target.value || undefined)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., 15A, 20A"
                />
              </div>

              {/* Wattage */}
              <div>
                <label htmlFor="wattage" className="block mb-2 font-bold">
                  Wattage
                </label>
                <input
                  type="text"
                  id="wattage"
                  value={formData.wattage}
                  onChange={(e) => handleChange('wattage', e.target.value || undefined)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., 1000W, 1500W"
                />
              </div>

              {/* Power Connector Type */}
              <div>
                <label htmlFor="power_connector_type" className="block mb-2 font-bold">
                  Power Connector Type
                </label>
                <input
                  type="text"
                  id="power_connector_type"
                  value={formData.power_connector_type}
                  onChange={(e) =>
                    handleChange('power_connector_type', e.target.value || undefined)
                  }
                  className="w-full p-2 border rounded"
                  placeholder="e.g., IEC C13, NEMA 5-15"
                />
              </div>
            </div>
          </>
        )}

        {/* Connectivity */}
        <h3 className="text-h4 mt-6 mb-4">Connectivity</h3>
        <div className="grid grid-2 gap-4">
          {/* Connected to IO */}
          <div>
            <label htmlFor="connected_to_io_id" className="block mb-2 font-bold">
              Connected to IO
            </label>
            <select
              id="connected_to_io_id"
              value={formData.connected_to_io_id || ''}
              onChange={(e) => handleChange('connected_to_io_id', e.target.value || undefined)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select IO --</option>
              {ios &&
                ios.map((io) => (
                  <option key={io.id} value={io.id}>
                    {io.interface_name} ({io.interface_type})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label htmlFor="description" className="block mb-2 font-bold">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value || undefined)}
            rows={3}
            className="w-full p-2 border rounded"
            placeholder="Interface description and purpose"
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
            onChange={(e) => handleChange('notes', e.target.value || undefined)}
            rows={4}
            className="w-full p-2 border rounded"
            placeholder="Additional notes and technical information"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update IO' : 'Create IO'}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
