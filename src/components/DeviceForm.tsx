/**
 * DeviceForm Component
 *
 * Specialized form for creating and editing devices using GenericForm
 */
'use client'

import React, { useState, useEffect } from 'react'
import { GenericForm, FieldConfig } from '@/components/GenericForm'
import { QuickCreateSection, QuickCreateField } from '@/components/QuickCreateSection'
import { CreateDeviceSchema, UpdateDeviceSchema } from '@/lib/schemas/device'
import { toast } from 'sonner'
import type { Device, DeviceStatus, Company, Location, Room, Person } from '@/types'

interface DeviceFormProps {
  /** Edit mode: provide existing device data */
  device?: Device
  /** Initial values for create mode (e.g., from query params) */
  initialValues?: Record<string, unknown>
  /** Callback after successful create/update */
  onSuccess?: (device: unknown) => void
  /** Callback on cancel */
  onCancel?: () => void
}

const DEVICE_TYPE_OPTIONS = [
  { value: 'computer', label: 'Computer' },
  { value: 'server', label: 'Server' },
  { value: 'switch', label: 'Switch' },
  { value: 'router', label: 'Router' },
  { value: 'firewall', label: 'Firewall' },
  { value: 'printer', label: 'Printer' },
  { value: 'mobile', label: 'Mobile Device' },
  { value: 'iot', label: 'IoT Device' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'av_equipment', label: 'AV Equipment' },
  { value: 'broadcast_equipment', label: 'Broadcast Equipment' },
  { value: 'patch_panel', label: 'Patch Panel' },
  { value: 'ups', label: 'UPS' },
  { value: 'pdu', label: 'PDU' },
  { value: 'chassis', label: 'Chassis' },
  { value: 'module', label: 'Module' },
  { value: 'blade', label: 'Blade' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
  { value: 'repair', label: 'Repair' },
  { value: 'storage', label: 'Storage' },
]

export function DeviceForm({
  device,
  initialValues: passedInitialValues,
  onSuccess,
  onCancel,
}: DeviceFormProps) {
  const isEditMode = !!device
  const [companies, setCompanies] = useState<Company[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [parentDevices, setParentDevices] = useState<Device[]>([])
  const [generatedInterfaces, setGeneratedInterfaces] = useState<Array<Record<string, unknown>>>([])

  // Fetch companies for the dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies?sort_by=company_name&sort_order=asc')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.companies) {
            setCompanies(result.data.companies)
          }
        }
      } catch (error) {
        console.error('Error fetching companies:', error)
      }
    }
    fetchCompanies()
  }, [])

  // Fetch locations for the dropdown
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations?sort_by=location_name&sort_order=asc')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.locations) {
            setLocations(result.data.locations)
          }
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
      }
    }
    fetchLocations()
  }, [])

  // Fetch rooms for the dropdown
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms?sort_by=room_name&sort_order=asc')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.rooms) {
            setRooms(result.data.rooms)
          }
        }
      } catch (error) {
        console.error('Error fetching rooms:', error)
      }
    }
    fetchRooms()
  }, [])

  // Fetch people for assignment dropdown
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await fetch('/api/people?sort_by=full_name&sort_order=asc')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.people) {
            setPeople(result.data.people)
          }
        }
      } catch (error) {
        console.error('Error fetching people:', error)
      }
    }
    fetchPeople()
  }, [])

  // Fetch potential parent devices (chassis, servers for modules)
  useEffect(() => {
    const fetchParentDevices = async () => {
      try {
        const response = await fetch(
          '/api/devices?device_type=chassis&sort_by=hostname&sort_order=asc'
        )
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.devices) {
            setParentDevices(result.data.devices)
          }
        }
      } catch (error) {
        console.error('Error fetching parent devices:', error)
      }
    }
    fetchParentDevices()
  }, [])

  // Field configuration for device form
  const fields: FieldConfig[] = [
    {
      name: 'hostname',
      label: 'Hostname',
      type: 'text',
      placeholder: 'server01.example.com',
      helpText: 'Fully qualified domain name or hostname',
    },
    {
      name: 'device_type',
      label: 'Device Type',
      type: 'select',
      required: true,
      options: DEVICE_TYPE_OPTIONS,
      helpText: 'The type of device',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: STATUS_OPTIONS,
      helpText: 'Current status of the device',
    },
    {
      name: 'manufacturer',
      label: 'Manufacturer',
      type: 'text',
      placeholder: 'Dell, Cisco, HP, etc.',
      helpText: 'Device manufacturer',
    },
    {
      name: 'model',
      label: 'Model',
      type: 'text',
      placeholder: 'PowerEdge R750',
      helpText: 'Device model number',
    },
    {
      name: 'serial_number',
      label: 'Serial Number',
      type: 'text',
      placeholder: 'ABC123XYZ',
      helpText: 'Manufacturer serial number',
    },
    {
      name: 'asset_tag',
      label: 'Asset Tag',
      type: 'text',
      placeholder: 'ASSET-001',
      helpText: 'Internal asset tracking number',
    },
    {
      name: 'company_id',
      label: 'Company',
      type: 'select',
      options: [
        { value: '', label: 'None' },
        ...companies.map((company) => ({
          value: company.id,
          label: company.company_name,
        })),
      ],
      helpText: 'The company that owns this device',
    },
    {
      name: 'location_id',
      label: 'Location',
      type: 'select',
      options: [
        { value: '', label: 'None' },
        ...locations.map((location) => ({
          value: location.id,
          label: location.location_name,
        })),
      ],
      helpText: 'Physical location of the device',
    },
    {
      name: 'room_id',
      label: 'Room',
      type: 'select',
      options: [
        { value: '', label: 'None' },
        ...rooms.map((room) => ({
          value: room.id,
          label: room.room_name,
        })),
      ],
      helpText: 'Specific room where device is located',
    },
    {
      name: 'assigned_to_id',
      label: 'Assigned To',
      type: 'select',
      options: [
        { value: '', label: 'None' },
        ...people.map((person) => ({
          value: person.id,
          label: person.full_name,
        })),
      ],
      helpText: 'Person this device is assigned to',
    },
    {
      name: 'parent_device_id',
      label: 'Parent Device',
      type: 'select',
      options: [
        { value: '', label: 'None' },
        ...parentDevices.map((device) => ({
          value: device.id,
          label: device.hostname || device.serial_number || device.id,
        })),
      ],
      helpText: 'For modules/blades: the chassis they belong to',
    },
    {
      name: 'operating_system',
      label: 'Operating System',
      type: 'text',
      placeholder: 'Ubuntu Server, Windows Server, etc.',
      helpText: 'Operating system name',
    },
    {
      name: 'os_version',
      label: 'OS Version',
      type: 'text',
      placeholder: '22.04 LTS, 2022, etc.',
      helpText: 'Operating system version',
    },
    {
      name: 'purchase_date',
      label: 'Purchase Date',
      type: 'date',
      helpText: 'Date the device was purchased',
    },
    {
      name: 'warranty_expiration',
      label: 'Warranty Expiration',
      type: 'date',
      helpText: 'Date the warranty expires',
    },
    {
      name: 'install_date',
      label: 'Install Date',
      type: 'date',
      helpText: 'Date the device was installed/deployed',
    },
    {
      name: 'last_audit_date',
      label: 'Last Audit Date',
      type: 'date',
      helpText: 'Date of last physical audit',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Additional notes about this device...',
      rows: 4,
      helpText: 'Any additional information',
    },
  ]

  // Interface template fields for QuickCreateSection
  const interfaceTemplateFields: QuickCreateField[] = [
    {
      key: 'interface_type',
      label: 'Interface Type',
      type: 'select',
      defaultValue: 'ethernet',
      options: [
        { value: 'ethernet', label: 'Ethernet' },
        { value: 'fiber_optic', label: 'Fiber' },
        { value: 'wifi', label: 'WiFi' },
        { value: 'sdi', label: 'SDI' },
        { value: 'hdmi', label: 'HDMI' },
        { value: 'patch_panel_port', label: 'Patch Panel' },
        { value: 'power_input', label: 'Power In' },
        { value: 'power_output', label: 'Power Out' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'monitoring', label: 'Monitoring' },
        { value: 'reserved', label: 'Reserved' },
      ],
    },
    {
      key: 'speed',
      label: 'Speed',
      type: 'text',
      defaultValue: '1G',
      placeholder: '1G, 10G, 100M',
    },
  ]

  // Determine API endpoint and method based on mode
  const apiEndpoint = isEditMode ? `/api/devices/${device.id}` : '/api/devices'
  const method = isEditMode ? 'PATCH' : 'POST'
  const schema = isEditMode ? UpdateDeviceSchema : CreateDeviceSchema

  // Prepare initial values: merge passed values with edit mode values
  const initialValues = isEditMode
    ? {
        hostname: device.hostname || '',
        device_type: device.device_type || '',
        status: (device.status || 'active') as DeviceStatus,
        manufacturer: device.manufacturer || '',
        model: device.model || '',
        serial_number: device.serial_number || '',
        asset_tag: device.asset_tag || '',
        company_id: device.company_id || '',
        location_id: device.location_id || '',
        room_id: device.room_id || '',
        assigned_to_id: device.assigned_to_id || '',
        parent_device_id: device.parent_device_id || '',
        operating_system: device.operating_system || '',
        os_version: device.os_version || '',
        purchase_date: device.purchase_date
          ? new Date(device.purchase_date).toISOString().split('T')[0]
          : '',
        warranty_expiration: device.warranty_expiration
          ? new Date(device.warranty_expiration).toISOString().split('T')[0]
          : '',
        install_date: device.install_date
          ? new Date(device.install_date).toISOString().split('T')[0]
          : '',
        last_audit_date: device.last_audit_date
          ? new Date(device.last_audit_date).toISOString().split('T')[0]
          : '',
        notes: device.notes || '',
      }
    : passedInitialValues || { status: 'active' as DeviceStatus }

  // Custom success handler to create interfaces if generated
  const handleSuccess = async (createdDevice: unknown) => {
    const deviceData = createdDevice as { id: string }

    // If interfaces were generated, create them
    if (generatedInterfaces.length > 0 && !isEditMode) {
      try {
        const interfacesWithDeviceId = generatedInterfaces.map((iface) => ({
          ...iface,
          interface_name: iface.name as string,
          device_id: deviceData.id,
        }))

        const response = await fetch('/api/ios/bulk-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: interfacesWithDeviceId }),
        })

        if (!response.ok) {
          throw new Error('Failed to create interfaces')
        }

        const result = await response.json()
        toast.success(`Device created successfully with ${result.data.created_count} interface(s)`)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Device created but interfaces failed to create'
        )
      }
    }

    // Call original onSuccess handler
    if (onSuccess) {
      onSuccess(createdDevice)
    }
  }

  // Handle interface generation
  const handleGenerateInterfaces = (items: Array<Record<string, unknown>>) => {
    setGeneratedInterfaces(items)
    toast.success(`${items.length} interface(s) staged for creation`)
  }

  return (
    <>
      <GenericForm
        title={isEditMode ? 'Edit Device' : 'Create New Device'}
        fields={fields}
        schema={schema}
        apiEndpoint={apiEndpoint}
        method={method}
        initialValues={initialValues}
        onSuccess={handleSuccess}
        onCancel={onCancel}
        submitText={isEditMode ? 'Update Device' : 'Create Device'}
        showCancel={true}
      />

      {!isEditMode && (
        <QuickCreateSection
          title="Quick Create Interfaces/Ports"
          description="Quickly generate multiple interfaces for this device (e.g., 24 or 48 ports for a switch)"
          templateFields={interfaceTemplateFields}
          onGenerate={handleGenerateInterfaces}
          examples={[
            'Create 24 ports: gi0/1 - gi0/24',
            'Create 48 ports: Ethernet {n} where n = 1-48',
            'Create 4 10G ports: TenGigE0/{n} where n = 1-4',
          ]}
          defaultQuantity={24}
          maxQuantity={96}
          defaultPattern="gi0/{n}"
        />
      )}

      {generatedInterfaces.length > 0 && (
        <div
          style={{ marginTop: '1rem', padding: '1rem', background: '#e6f4ea', borderRadius: '4px' }}
        >
          <strong>✓ {generatedInterfaces.length} interface(s) ready to create</strong>
          <p
            style={{
              margin: '0.5rem 0 0',
              fontSize: '0.9rem',
              color: 'var(--color-brew-black-60)',
            }}
          >
            These interfaces will be created automatically when you save the device.
          </p>
        </div>
      )}
    </>
  )
}
