/**
 * Validation schemas for Installed Applications
 */
import { z } from 'zod'

export const DeploymentStatusSchema = z.enum(['pilot', 'production', 'deprecated', 'retired'])

export const CreateInstalledApplicationSchema = z.object({
  software_id: z.string().uuid().optional(),
  application_name: z.string().min(1).max(255),
  version: z.string().max(100).optional(),
  install_method: z.string().max(50).optional(),
  deployment_platform: z.string().max(50).optional(),
  package_id: z.string().max(255).optional(),
  deployment_status: DeploymentStatusSchema.optional(),
  install_date: z.string().optional(),
  auto_update_enabled: z.boolean().optional(),
  notes: z.string().optional(),
})

export const UpdateInstalledApplicationSchema = z.object({
  software_id: z.string().uuid().optional(),
  application_name: z.string().min(1).max(255).optional(),
  version: z.string().max(100).optional(),
  install_method: z.string().max(50).optional(),
  deployment_platform: z.string().max(50).optional(),
  package_id: z.string().max(255).optional(),
  deployment_status: DeploymentStatusSchema.optional(),
  install_date: z.string().optional(),
  auto_update_enabled: z.boolean().optional(),
  notes: z.string().optional(),
})

export const InstalledApplicationQuerySchema = z.object({
  search: z.string().optional(),
  software_id: z.string().uuid().optional(),
  deployment_status: DeploymentStatusSchema.optional(),
  deployment_platform: z.string().optional(),
  auto_update_enabled: z.enum(['true', 'false']).optional(),
  device_id: z.string().uuid().optional(), // filter by devices with this application installed
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  sort_by: z
    .enum([
      'application_name',
      'version',
      'deployment_status',
      'install_date',
      'created_at',
      'updated_at',
    ])
    .default('application_name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
})
