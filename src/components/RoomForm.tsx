/**
 * RoomForm Component
 *
 * Specialized form for creating and editing rooms using GenericForm
 */
'use client'

import React, { useState, useEffect } from 'react'
import { GenericForm, FieldConfig } from '@/components/GenericForm'
import { CreateRoomSchema, UpdateRoomSchema } from '@/lib/schemas/room'
import type { Room, Location } from '@/types'

interface RoomFormProps {
  /** Edit mode: provide existing room data */
  room?: Room
  /** Callback after successful create/update */
  onSuccess?: (room: Room) => void
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

export function RoomForm({ room, onSuccess, onCancel }: RoomFormProps) {
  const isEditMode = !!room
  const [locations, setLocations] = useState<Location[]>([])

  // Fetch locations for the dropdown
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations?limit=200&sort_by=name&sort_order=asc')
        if (response.ok) {
          const result = await response.json()
          setLocations(result.data?.locations || [])
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
      name: 'name',
      label: 'Room Name',
      type: 'text',
      placeholder: 'Enter room name',
      required: true,
      helpText: 'The name or identifier of this room',
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
  ]

  // Determine API endpoint and method based on mode
  const apiEndpoint = isEditMode ? `/api/rooms/${room.id}` : '/api/rooms'
  const method = isEditMode ? 'PATCH' : 'POST'
  const schema = isEditMode ? UpdateRoomSchema : CreateRoomSchema

  // Prepare initial values for edit mode
  const initialValues = isEditMode
    ? {
        room_name: room.room_name,
        location_id: room.location_id,
        room_type: room.room_type || '',
        floor: room.floor || '',
        capacity: room.capacity ?? undefined,
        access_requirements: room.access_requirements || '',
      }
    : {}

  return (
    <GenericForm
      title={isEditMode ? 'Edit Room' : 'Create New Room'}
      fields={fields}
      schema={schema}
      apiEndpoint={apiEndpoint}
      method={method}
      initialValues={initialValues}
      onSuccess={onSuccess}
      onCancel={onCancel}
      submitText={isEditMode ? 'Update Room' : 'Create Room'}
      showCancel={true}
    />
  )
}
