/**
 * RoomForm Component
 *
 * Specialized form for creating and editing rooms using GenericForm
 */
'use client'

import React, { useState, useEffect } from 'react'
import { GenericForm, FieldConfig } from '@/components/GenericForm'
import { QuickCreateSection, QuickCreateField } from '@/components/QuickCreateSection'
import { CreateRoomSchema, UpdateRoomSchema } from '@/lib/schemas/room'
import { toast } from 'sonner'
import type { Room, RoomType, Location } from '@/types'

interface RoomFormProps {
  /** Edit mode: provide existing room data */
  room?: Room
  /** Initial values for create mode (e.g., from query params) */
  initialValues?: Record<string, unknown>
  /** Callback after successful create/update */
  onSuccess?: (room: unknown) => void
  /** Callback on cancel */
  onCancel?: () => void
}

const ROOM_TYPE_OPTIONS = [
  { value: '', label: 'Select room type' },
  { value: 'server_room', label: 'Server Room' },
  { value: 'office', label: 'Office' },
  { value: 'conference_room', label: 'Conference Room' },
  { value: 'storage', label: 'Storage' },
  { value: 'studio', label: 'Studio' },
  { value: 'control_room', label: 'Control Room' },
  { value: 'other', label: 'Other' },
]

export function RoomForm({
  room,
  initialValues: passedInitialValues,
  onSuccess,
  onCancel,
}: RoomFormProps) {
  const isEditMode = !!room
  const [locations, setLocations] = useState<Location[]>([])
  const [generatedPorts, setGeneratedPorts] = useState<Array<Record<string, unknown>>>([])

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

  // Field configuration for room form
  const fields: FieldConfig[] = [
    {
      name: 'room_name',
      label: 'Room Name',
      type: 'text',
      placeholder: 'Enter room name',
      required: true,
      helpText: 'The name or identifier of this room',
    },
    {
      name: 'room_number',
      label: 'Room Number',
      type: 'text',
      placeholder: 'e.g., 101, DC-01, B1-05',
      helpText: 'Room number or code (optional)',
    },
    {
      name: 'location_id',
      label: 'Location',
      type: 'select',
      required: true,
      options: [
        { value: '', label: 'Select a location' },
        ...locations.map((location) => ({
          value: location.id,
          label: location.location_name,
        })),
      ],
      helpText: 'The location where this room is located',
    },
    {
      name: 'room_type',
      label: 'Room Type',
      type: 'select',
      options: ROOM_TYPE_OPTIONS,
      helpText: 'The type or purpose of this room',
    },
    {
      name: 'floor',
      label: 'Floor',
      type: 'text',
      placeholder: 'e.g., 1, 2, B1, M',
      helpText: 'Floor number or identifier (e.g., 1, 2, B1 for basement, M for mezzanine)',
    },
    {
      name: 'capacity',
      label: 'Capacity',
      type: 'number',
      placeholder: 'Number of people',
      helpText:
        'Maximum number of people this room can accommodate (for conference rooms, offices)',
    },
    {
      name: 'access_requirements',
      label: 'Access Requirements',
      type: 'textarea',
      placeholder: 'Describe access requirements...',
      helpText: 'Special access requirements, badge levels, or security notes',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Additional notes about this room...',
      helpText: 'Any additional information or notes',
    },
  ]

  // Patch panel port template fields for QuickCreateSection
  const patchPanelTemplateFields: QuickCreateField[] = [
    {
      key: 'interface_type',
      label: 'Port Type',
      type: 'select',
      defaultValue: 'patch_panel_port',
      options: [
        { value: 'patch_panel_port', label: 'Patch Panel Port' },
        { value: 'ethernet', label: 'Ethernet' },
        { value: 'fiber_optic', label: 'Fiber' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'inactive',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
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
  const apiEndpoint = isEditMode ? `/api/rooms/${room.id}` : '/api/rooms'
  const method = isEditMode ? 'PATCH' : 'POST'
  const schema = isEditMode ? UpdateRoomSchema : CreateRoomSchema

  // Prepare initial values: merge passed values with edit mode values
  const initialValues = isEditMode
    ? {
        room_name: room.room_name,
        room_number: room.room_number || '',
        location_id: room.location_id,
        room_type: (room.room_type || null) as RoomType | null,
        floor: room.floor || '',
        capacity: room.capacity ?? undefined,
        access_requirements: room.access_requirements || '',
        notes: room.notes || '',
      }
    : passedInitialValues || {}

  // Custom success handler to create patch panel ports if generated
  const handleSuccess = async (createdRoom: unknown) => {
    const roomData = createdRoom as { id: string }

    // If ports were generated, create them
    if (generatedPorts.length > 0 && !isEditMode) {
      try {
        const portsWithRoomId = generatedPorts.map((port) => ({
          ...port,
          interface_name: port.name as string,
          room_id: roomData.id,
        }))

        const response = await fetch('/api/ios/bulk-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: portsWithRoomId }),
        })

        if (!response.ok) {
          throw new Error('Failed to create patch panel ports')
        }

        const result = await response.json()
        toast.success(
          `Room created successfully with ${result.data.created_count} patch panel port(s)`
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Room created but ports failed to create')
      }
    }

    // Call original onSuccess handler
    if (onSuccess) {
      onSuccess(createdRoom)
    }
  }

  // Handle port generation
  const handleGeneratePorts = (items: Array<Record<string, unknown>>) => {
    setGeneratedPorts(items)
    toast.success(`${items.length} patch panel port(s) staged for creation`)
  }

  return (
    <>
      <GenericForm
        title={isEditMode ? 'Edit Room' : 'Create New Room'}
        fields={fields}
        schema={schema}
        apiEndpoint={apiEndpoint}
        method={method}
        initialValues={initialValues}
        onSuccess={handleSuccess}
        onCancel={onCancel}
        submitText={isEditMode ? 'Update Room' : 'Create Room'}
        showCancel={true}
      />

      {!isEditMode && (
        <QuickCreateSection
          title="Quick Create Patch Panel Ports"
          description="Quickly generate multiple patch panel ports for this room (e.g., 48 ports for a server room patch panel)"
          templateFields={patchPanelTemplateFields}
          onGenerate={handleGeneratePorts}
          examples={[
            'Create 48 ports: PP-A-{n} where n = 1-48',
            'Create 24 ports: Patch Port {n}',
            'Create 96 ports: Port-{n} (for two 48-port panels)',
          ]}
          defaultQuantity={48}
          maxQuantity={192}
          defaultPattern="PP-{n}"
        />
      )}

      {generatedPorts.length > 0 && (
        <div
          style={{ marginTop: '1rem', padding: '1rem', background: '#e6f4ea', borderRadius: '4px' }}
        >
          <strong>✓ {generatedPorts.length} patch panel port(s) ready to create</strong>
          <p
            style={{
              margin: '0.5rem 0 0',
              fontSize: '0.9rem',
              color: 'var(--color-brew-black-60)',
            }}
          >
            These patch panel ports will be created automatically when you save the room.
          </p>
        </div>
      )}
    </>
  )
}
