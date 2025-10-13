/**
 * Zod validation schemas for RBAC (Roles, Permissions, Assignments)
 */
import { z } from 'zod'

// ============================================================================
// Enums
// ============================================================================

export const PermissionActionSchema = z.enum(['view', 'edit', 'delete', 'manage_permissions'])

export const ObjectTypeSchema = z.enum([
  'company',
  'location',
  'room',
  'person',
  'device',
  'io',
  'ip_address',
  'network',
  'software',
  'saas_service',
  'installed_application',
  'software_license',
  'document',
  'external_document',
  'contract',
  'group',
])

export const RoleScopeSchema = z.enum(['global', 'location', 'specific_objects'])

// ============================================================================
// Role Schemas
// ============================================================================

export const CreateRoleSchema = z.object({
  role_name: z.string().min(1, 'Role name is required').max(100),
  description: z.string().nullable().optional(),
  is_system_role: z.boolean().default(false),
  parent_role_id: z.string().uuid('Invalid parent role ID').nullable().optional(),
  created_date: z.coerce.date().nullable().optional(),
})

export const UpdateRoleSchema = z.object({
  role_name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  parent_role_id: z.string().uuid('Invalid parent role ID').nullable().optional(),
  created_date: z.coerce.date().nullable().optional(),
})

// ============================================================================
// Permission Schemas
// ============================================================================

export const CreatePermissionSchema = z.object({
  permission_name: z.string().min(1, 'Permission name is required').max(100),
  object_type: ObjectTypeSchema,
  action: PermissionActionSchema,
  description: z.string().nullable().optional(),
})

export const UpdatePermissionSchema = z.object({
  permission_name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
})

// ============================================================================
// Role-Permission Association Schemas
// ============================================================================

export const AssignPermissionsToRoleSchema = z.object({
  permission_ids: z.array(z.string().uuid('Invalid permission ID')),
})

// ============================================================================
// Role Assignment Schemas
// ============================================================================

export const CreateRoleAssignmentSchema = z
  .object({
    role_id: z.string().uuid('Invalid role ID'),
    person_id: z.string().uuid('Invalid person ID').nullable().optional(),
    group_id: z.string().uuid('Invalid group ID').nullable().optional(),
    scope: RoleScopeSchema,
    location_ids: z.array(z.string().uuid('Invalid location ID')).optional(),
    assigned_date: z.coerce.date().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .refine((data) => data.person_id || data.group_id, {
    message: 'Either person_id or group_id must be provided',
  })
  .refine((data) => !(data.person_id && data.group_id), {
    message: 'Cannot assign to both person and group simultaneously',
  })
  .refine(
    (data) => {
      if (data.scope === 'location') {
        return data.location_ids && data.location_ids.length > 0
      }
      return true
    },
    {
      message: 'location_ids required when scope is "location"',
    }
  )

export const UpdateRoleAssignmentSchema = z.object({
  scope: RoleScopeSchema.optional(),
  location_ids: z.array(z.string().uuid('Invalid location ID')).optional(),
  assigned_date: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
})

// ============================================================================
// Object Permission Schemas
// ============================================================================

export const CreateObjectPermissionSchema = z
  .object({
    person_id: z.string().uuid('Invalid person ID').nullable().optional(),
    group_id: z.string().uuid('Invalid group ID').nullable().optional(),
    object_type: ObjectTypeSchema,
    object_id: z.string().uuid('Invalid object ID'),
    permission_type: PermissionActionSchema,
    granted_date: z.coerce.date().nullable().optional(),
  })
  .refine((data) => data.person_id || data.group_id, {
    message: 'Either person_id or group_id must be provided',
  })
  .refine((data) => !(data.person_id && data.group_id), {
    message: 'Cannot grant to both person and group simultaneously',
  })

// ============================================================================
// Group Member Schemas
// ============================================================================

export const AddGroupMemberSchema = z.object({
  person_id: z.string().uuid('Invalid person ID'),
})

export const RemoveGroupMemberSchema = z.object({
  person_id: z.string().uuid('Invalid person ID'),
})
