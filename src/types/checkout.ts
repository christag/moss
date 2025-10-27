// Enums
export type CheckoutStatus = 'checked_out' | 'returned' | 'overdue' | 'lost'
export type ReservationStatus = 'pending' | 'approved' | 'active' | 'completed' | 'cancelled'
export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'damaged' | 'broken'

// Interfaces
export interface EquipmentCheckout {
  id: string
  device_id: string
  checked_out_by: string
  checked_out_at: string
  expected_return_date: string
  actual_return_date: string | null
  status: CheckoutStatus
  agreement_signed_at: string | null
  signature_data: string | null
  late_fee_amount: number
  condition_on_checkout: string | null
  condition_on_return: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface EquipmentReservation {
  id: string
  device_id: string
  reserved_by: string
  reservation_start: string
  reservation_end: string
  status: ReservationStatus
  purpose: string | null
  approval_required: boolean
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AgreementTemplate {
  id: string
  template_name: string
  template_text: string
  is_default: boolean
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CheckoutAgreement {
  id: string
  checkout_id: string
  agreement_template_id: string | null
  agreement_text: string
  signature_image_url: string | null
  signed_at: string
  signer_ip_address: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
}

export interface EquipmentConditionLog {
  id: string
  device_id: string
  checkout_id: string | null
  logged_by: string
  condition: EquipmentCondition
  damage_description: string | null
  requires_repair: boolean
  logged_at: string
  created_at: string
  updated_at: string
}

// Input schemas for API
export interface CreateCheckoutInput {
  device_id: string
  checked_out_by: string
  expected_return_date: string
  condition_on_checkout?: string
  notes?: string
}

export interface CreateReservationInput {
  device_id: string
  reserved_by: string
  reservation_start: string
  reservation_end: string
  purpose?: string
  approval_required?: boolean
  notes?: string
}
