/**
 * IP Address Zod Validation Schemas
 */
import { z } from 'zod'

export const IPVersionSchema = z.enum(['v4', 'v6'])

export const IPAddressTypeSchema = z.enum(['static', 'dhcp', 'reserved', 'floating'])

// IPv4 regex: validates 0-255 for each octet
const IPV4_REGEX =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

// IPv6 regex: handles full and compressed notation
const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|::)$/

export const CreateIPAddressSchema = z
  .object({
    io_id: z.string().uuid().nullable().optional(),
    network_id: z.string().uuid().nullable().optional(),
    ip_address: z.string().min(1).max(50),
    ip_version: IPVersionSchema.nullable().optional(),
    type: IPAddressTypeSchema.nullable().optional(),
    dns_name: z.string().max(255).nullable().optional(),
    assignment_date: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // If ip_version is not specified, try to auto-detect
      const version = data.ip_version || (data.ip_address.includes(':') ? 'v6' : 'v4')

      if (version === 'v4') {
        return IPV4_REGEX.test(data.ip_address)
      } else {
        return IPV6_REGEX.test(data.ip_address)
      }
    },
    {
      message:
        'Invalid IP address format. Must be a valid IPv4 (e.g., 192.168.1.1) or IPv6 address.',
      path: ['ip_address'],
    }
  )

export const UpdateIPAddressSchema = z
  .object({
    io_id: z.string().uuid().nullable().optional(),
    network_id: z.string().uuid().nullable().optional(),
    ip_address: z.string().min(1).max(50).optional(),
    ip_version: IPVersionSchema.nullable().optional(),
    type: IPAddressTypeSchema.nullable().optional(),
    dns_name: z.string().max(255).nullable().optional(),
    assignment_date: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // Only validate if ip_address is provided
      if (!data.ip_address) return true

      // If ip_version is not specified, try to auto-detect
      const version = data.ip_version || (data.ip_address.includes(':') ? 'v6' : 'v4')

      if (version === 'v4') {
        return IPV4_REGEX.test(data.ip_address)
      } else {
        return IPV6_REGEX.test(data.ip_address)
      }
    },
    {
      message:
        'Invalid IP address format. Must be a valid IPv4 (e.g., 192.168.1.1) or IPv6 address.',
      path: ['ip_address'],
    }
  )

export const IPAddressQuerySchema = z.object({
  search: z.string().optional(),
  ip_version: IPVersionSchema.optional(),
  type: IPAddressTypeSchema.optional(),
  io_id: z.string().uuid().optional(),
  network_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z
    .enum(['ip_address', 'dns_name', 'assignment_date', 'created_at'])
    .default('ip_address'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})
