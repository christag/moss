import { z } from 'zod'

// =============================================================================
// Enum Schemas
// =============================================================================

export const CheckoutStatusSchema = z.enum(['checked_out', 'returned', 'overdue', 'lost'])

export const ReservationStatusSchema = z.enum([
  'pending',
  'approved',
  'active',
  'completed',
  'cancelled',
])

export const EquipmentConditionSchema = z.enum(['excellent', 'good', 'fair', 'damaged', 'broken'])

// =============================================================================
// Equipment Checkout Schemas
// =============================================================================

export const CreateCheckoutSchema = z.object({
  device_id: z.string().uuid(),
  checked_out_by: z.string().uuid(),
  expected_return_date: z.string().datetime(),
  condition_on_checkout: z.string().optional(),
  notes: z.string().optional(),
  signature_data: z.string().optional(), // Base64 data URL
})

export const UpdateCheckoutSchema = z.object({
  expected_return_date: z.string().datetime().optional(),
  actual_return_date: z.string().datetime().optional(),
  status: CheckoutStatusSchema.optional(),
  condition_on_return: z.string().optional(),
  late_fee_amount: z.number().min(0).optional(),
  notes: z.string().optional(),
})

// =============================================================================
// Equipment Reservation Schemas
// =============================================================================

export const CreateReservationSchema = z
  .object({
    device_id: z.string().uuid(),
    reserved_by: z.string().uuid(),
    reservation_start: z.string().datetime(),
    reservation_end: z.string().datetime(),
    purpose: z.string().optional(),
    approval_required: z.boolean().optional().default(false),
    notes: z.string().optional(),
  })
  .refine((data) => new Date(data.reservation_end) > new Date(data.reservation_start), {
    message: 'Reservation end date must be after start date',
    path: ['reservation_end'],
  })

export const UpdateReservationSchema = z.object({
  status: ReservationStatusSchema.optional(),
  reservation_start: z.string().datetime().optional(),
  reservation_end: z.string().datetime().optional(),
  purpose: z.string().optional(),
  approved_by: z.string().uuid().optional(),
  approved_at: z.string().datetime().optional(),
  notes: z.string().optional(),
})

// =============================================================================
// Agreement Template Schemas
// =============================================================================

export const CreateAgreementTemplateSchema = z.object({
  template_name: z.string().min(1).max(255),
  template_text: z.string().min(1).max(10000), // 10k char limit
  is_default: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
})

export const UpdateAgreementTemplateSchema = z.object({
  template_name: z.string().min(1).max(255).optional(),
  template_text: z.string().min(1).max(10000).optional(),
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

// =============================================================================
// Condition Log Schemas
// =============================================================================

export const CreateConditionLogSchema = z.object({
  device_id: z.string().uuid(),
  checkout_id: z.string().uuid().optional(),
  condition: EquipmentConditionSchema,
  damage_description: z.string().optional(),
  requires_repair: z.boolean().optional().default(false),
  photo_ids: z.array(z.string().uuid()).optional(), // Array of file_attachment IDs
})

export const UpdateConditionLogSchema = z.object({
  condition: EquipmentConditionSchema.optional(),
  damage_description: z.string().optional(),
  requires_repair: z.boolean().optional(),
})

// =============================================================================
// Conflict Check Schema
// =============================================================================

export const CheckConflictSchema = z
  .object({
    device_id: z.string().uuid(),
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
    exclude_reservation_id: z.string().uuid().optional(), // For update operations
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  })

// =============================================================================
// Check-In Schema
// =============================================================================

export const CheckInSchema = z.object({
  condition_on_return: EquipmentConditionSchema,
  damage_description: z.string().optional(),
  photo_ids: z.array(z.string().uuid()).optional(),
  notes: z.string().optional(),
})

// =============================================================================
// Type exports
// =============================================================================

export type CreateCheckoutInput = z.infer<typeof CreateCheckoutSchema>
export type UpdateCheckoutInput = z.infer<typeof UpdateCheckoutSchema>
export type CreateReservationInput = z.infer<typeof CreateReservationSchema>
export type UpdateReservationInput = z.infer<typeof UpdateReservationSchema>
export type CreateAgreementTemplateInput = z.infer<typeof CreateAgreementTemplateSchema>
export type UpdateAgreementTemplateInput = z.infer<typeof UpdateAgreementTemplateSchema>
export type CreateConditionLogInput = z.infer<typeof CreateConditionLogSchema>
export type UpdateConditionLogInput = z.infer<typeof UpdateConditionLogSchema>
export type CheckConflictInput = z.infer<typeof CheckConflictSchema>
export type CheckInInput = z.infer<typeof CheckInSchema>
