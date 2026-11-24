/** Platform administration (superadmin): companies with their subscription, and recorded payments. */

/** `expired` and `blocked` companies are closed for their members (erp1 lazy enforcement). */
export type CompanyStatus = 'active' | 'expired' | 'blocked'

export interface PlatformCompany {
  id: string
  name: string
  is_demo: boolean
  created_at: string
  member_count: number
  owners: string[]
  status: CompanyStatus
  /** Inclusive end date (YYYY-MM-DD); null = no end. */
  subscription_ends_at: string | null
  days_left: number | null
  seat_limit: number | null
  seats_used: number
  license_months: number
  price_paid: number
}

export interface CompanyPatch {
  name?: string
  status?: 'active' | 'blocked'
  seat_limit?: number | null
  subscription_ends_at?: string | null
  license_months?: number
}

export interface Payment {
  id: string
  workspace_id: string
  workspace_name: string
  amount: number
  months: number
  seats: number | null
  period_start: string
  period_end: string
  note: string | null
  created_at: string
}

export interface PaymentDraft {
  amount: number
  months?: number
  seats?: number
  note?: string
}

/** Days before the end date when owners and admins are warned. */
export const SUBSCRIPTION_WARNING_DAYS = 7
