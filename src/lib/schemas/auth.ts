/**
 * Authentication Validation Schemas
 * Zod schemas for user management and authentication
 */

import { z } from 'zod'

// ============================================================================
// User Role Schema
// ============================================================================

export const UserRoleSchema = z.enum(['user', 'admin', 'super_admin'], {
  errorMap: () => ({ message: 'Role must be user, admin, or super_admin' }),
})

// ============================================================================
// User Schemas
// ============================================================================

/**
 * Create User Schema
 * For creating new user accounts
 */
export const CreateUserSchema = z.object({
  person_id: z.string().uuid('Person ID must be a valid UUID'),
  email: z.string().email('Must be a valid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: UserRoleSchema.optional().default('user'),
  is_active: z.boolean().optional().default(true),
})

/**
 * Update User Schema
 * For updating existing user accounts
 */
export const UpdateUserSchema = z.object({
  email: z.string().email('Must be a valid email address').max(255).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .optional(),
  role: UserRoleSchema.optional(),
  is_active: z.boolean().optional(),
})

// ============================================================================
// Authentication Schemas
// ============================================================================

/**
 * Login Credentials Schema
 * For email/password authentication
 */
export const LoginCredentialsSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * Change Password Schema
 * For password changes (requires current password)
 */
export const ChangePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirm_password: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

/**
 * Reset Password Request Schema
 * For requesting a password reset
 */
export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('Must be a valid email address'),
})

/**
 * Reset Password Schema
 * For completing a password reset with token
 */
export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not exceed 100 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirm_password: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

// ============================================================================
// Type Exports
// ============================================================================

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
export type ResetPasswordRequestInput = z.infer<typeof ResetPasswordRequestSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
