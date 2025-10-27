/**
 * Zod validation schemas for Network Topology model
 */
import { z } from 'zod'
import { InterfaceTypeSchema, TrunkModeSchema } from './io'

// Device status for topology nodes
export const TopologyNodeStatusSchema = z.enum(['active', 'inactive', 'unknown'])

// Topology node represents a device in the graph
export const TopologyNodeSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  device_type: z.string(),
  location_id: z.string().uuid().nullable(),
  location_name: z.string().nullable(),
  io_count: z.number().int().nonnegative(),
  status: TopologyNodeStatusSchema,
  connection_count: z.number().int().nonnegative(),
})

// Topology edge represents a connection between devices
export const TopologyEdgeSchema = z.object({
  id: z.string().uuid(),
  source: z.string().uuid(),
  target: z.string().uuid(),
  label: z.string(),
  interface_type: InterfaceTypeSchema,
  speed: z.string().nullable(),
  source_io_id: z.string().uuid(),
  target_io_id: z.string().uuid(),
  trunk_mode: TrunkModeSchema.nullable(),
  native_network_id: z.string().uuid().nullable(),
  network_name: z.string().nullable(),
})

// Metadata about the topology graph
export const TopologyMetadataSchema = z.object({
  total_devices: z.number().int().nonnegative(),
  total_connections: z.number().int().nonnegative(),
  location_id: z.string().uuid().nullable(),
  generated_at: z.string().datetime(),
})

// Complete topology graph response
export const TopologyGraphSchema = z.object({
  nodes: z.array(TopologyNodeSchema),
  edges: z.array(TopologyEdgeSchema),
  metadata: TopologyMetadataSchema,
})

// Query parameters for filtering topology
export const TopologyFilterSchema = z.object({
  location_id: z.string().uuid().optional(),
  device_id: z.string().uuid().optional(),
  network_id: z.string().uuid().optional(),
  depth: z.coerce.number().int().min(1).max(3).optional(),
})

// Export TypeScript types
export type TopologyNodeStatus = z.infer<typeof TopologyNodeStatusSchema>
export type TopologyNode = z.infer<typeof TopologyNodeSchema>
export type TopologyEdge = z.infer<typeof TopologyEdgeSchema>
export type TopologyMetadata = z.infer<typeof TopologyMetadataSchema>
export type TopologyGraph = z.infer<typeof TopologyGraphSchema>
export type TopologyFilter = z.infer<typeof TopologyFilterSchema>
