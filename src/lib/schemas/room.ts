/**
 * Zod validation schemas for Room API
 */
import { z } from 'zod'

// UUID validation schema
export const UUIDSchema = z.string().uuid('Invalid UUID format')

// Room type enum (matches database CHECK constraint)
export const RoomTypeSchema = z.enum([
  'office',
  'conference_room',
  'server_room',
  'closet',
  'studio',
  'control_room',
  'edit_bay',
  'storage',
  'other',
])

// Create Room schema
export const CreateRoomSchema = z.object({
  location_id: UUIDSchema,
  room_name: z.string().min(1, 'Room name is required').max(255, 'Room name too long'),
  room_number: z.string().max(50, 'Room number too long').optional(),
  room_type: RoomTypeSchema.optional(),
  floor: z.string().max(50, 'Floor too long').optional(),
  capacity: z.number().int().min(0, 'Capacity must be non-negative').optional(),
  access_requirements: z.string().optional(),
  notes: z.string().optional(),
})

// Update Room schema (all fields optional)
export const UpdateRoomSchema = z.object({
  location_id: UUIDSchema.optional(),
  room_name: z.string().min(1, 'Room name is required').max(255, 'Room name too long').optional(),
  room_number: z.string().max(50, 'Room number too long').optional().nullable(),
  room_type: RoomTypeSchema.optional().nullable(),
  floor: z.string().max(50, 'Floor too long').optional().nullable(),
  capacity: z.number().int().min(0, 'Capacity must be non-negative').optional().nullable(),
  access_requirements: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// Query parameters schema for listing rooms
export const ListRoomsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  location_id: UUIDSchema.optional(),
  room_type: RoomTypeSchema.optional(),
  floor: z.string().optional(),
  search: z.string().optional(),
  sort_by: z
    .enum(['room_name', 'room_type', 'floor', 'capacity', 'created_at', 'updated_at'])
    .optional(),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
})

// Types inferred from schemas
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>
export type UpdateRoomInput = z.infer<typeof UpdateRoomSchema>
export type ListRoomsQuery = z.infer<typeof ListRoomsQuerySchema>
