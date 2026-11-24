export type Lifecycle = 'lead' | 'prospect' | 'customer' | 'churned'
export type Priority = 'low' | 'medium' | 'high'
export type ActivityType = 'note' | 'call' | 'email' | 'meeting' | 'task'
export type StageColor = 'slate' | 'blue' | 'violet' | 'amber' | 'orange' | 'emerald' | 'rose'
export type DealStatus = 'open' | 'won' | 'lost'
export type CallDirection = 'outbound' | 'inbound'
export type CallOutcome = 'connected' | 'no_answer' | 'voicemail' | 'busy' | 'wrong_number'

interface Row {
  id: string
  created_at: string
  updated_at: string
}

/** Sales records have an owner (drives own/team/all visibility). */
interface Owned {
  owner_id: string | null
}

export interface Stage extends Row {
  pipeline_id: string
  name: string
  position: number
  probability: number
  is_won: boolean
  is_lost: boolean
  color: StageColor
  /** Rule shown under the board column. */
  description: string | null
  /** Days a deal may stay before it is flagged. */
  max_days: number | null
}

export interface Company extends Row, Owned {
  name: string
  domain: string | null
  industry: string | null
  employees: string | null
  country: string | null
  city: string | null
  annual_revenue: number | null
  lifecycle: Lifecycle
  description: string | null
}

export interface Contact extends Row, Owned {
  company_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  title: string | null
  linkedin_url: string | null
}

export interface Deal extends Row, Owned {
  title: string
  company_id: string | null
  contact_id: string | null
  stage_id: string
  amount: number
  currency: string
  expected_close_date: string | null
  priority: Priority
  source: string | null
  lost_reason: string | null
  closed_at: string | null
  stage_entered_at: string | null
}

export interface Activity extends Row, Owned {
  type: ActivityType
  subject: string
  body: string | null
  due_at: string | null
  done: boolean
  pinned: boolean
  remind_at: string | null
  call_direction: CallDirection | null
  call_outcome: CallOutcome | null
  duration_seconds: number | null
  phone: string | null
  next_steps: string | null
  external_id: string | null
  recording_url: string | null
  auto_logged: boolean
  deal_id: string | null
  company_id: string | null
  contact_id: string | null
}

export interface TableMap {
  pipeline_stages: Stage
  companies: Company
  contacts: Contact
  deals: Deal
  activities: Activity
}
export type TableName = keyof TableMap

export interface User {
  id: string
  email: string
  full_name: string
  email_verified: boolean
  has_password: boolean
  is_superadmin: boolean
  must_change_password: boolean
}

export type Role = 'owner' | 'admin' | 'member'

export interface Workspace {
  id: string
  name: string
  is_demo: boolean
  status: CompanyStatus
  subscription_ends_at: string | null
  days_left: number | null
  seat_limit: number | null
  seats_used: number | null
}

export interface Session {
  user: User
  /** Null for a platform superadmin who does not belong to any company. */
  workspace: Workspace | null
  role: Role | null
  /** Effective permissions in the active workspace (the API enforces them; the UI mirrors them). */
  permissions: Permissions | null
}

export interface WorkspaceChoice extends Workspace {
  role: Role
}

export interface AuthConfig {
  demo_enabled: boolean
  email_enabled: boolean
  registration_enabled: boolean
}

export interface TeamMember {
  user_id: string
  full_name: string
  email: string
  role: Role
  is_active: boolean
  must_change_password: boolean
  joined_at: string
  access_role_id: string | null
  team_id: string | null
}


export interface Team {
  members: TeamMember[]
  can_manage: boolean
}


export interface Token extends Session {
  access_token: string
}

export interface Dashboard {
  open_count: number
  open_value: number
  weighted_value: number
  won_this_quarter_value: number
  won_this_quarter_count: number
  win_rate: number
  avg_deal_size: number
  avg_cycle_days: number
  by_stage: { id: string; name: string; color: StageColor; count: number; value: number }[]
  monthly: { month: string; won: number; lost: number }[]
  stale: Deal[]
  top_open: Deal[]
}

export interface CallLog {
  subject: string
  direction: CallDirection
  outcome: CallOutcome
  duration_seconds: number
  phone: string | null
  summary: string | null
  next_steps: string | null
  deal_id: string | null
  company_id: string | null
  contact_id: string | null
  follow_up: { subject: string; due_at: string; remind_at: string | null } | null
}

export interface CallStats {
  today: number
  this_week: number
  connect_rate: number
  avg_duration_seconds: number
  talk_time_seconds: number
  by_outcome: { outcome: CallOutcome; count: number }[]
}

export interface TelephonySettings {
  webhook_path: string
  signing_secret: string
  create_unknown_contacts: boolean
  callback_task_on_missed: boolean
}

/** Real-time call event pushed by the API over SSE. */
export interface CallEvent {
  type: 'ringing' | 'answered' | 'ended'
  call: Activity
  contact_name: string | null
  company_name: string | null
  deal_title: string | null
}

export type ProviderStatus = 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'failed'

export interface AdminUser {
  id: string
  full_name: string
  email: string
  is_active: boolean
  is_superadmin: boolean
  must_change_password: boolean
  created_at: string
  memberships: { workspace_id: string; workspace_name: string; role: Role }[]
}

export interface NewLogin {
  full_name: string
  email: string
  password: string
}


export * from './access-types'
export * from './platform-types'
export * from './pipeline-types'
import type { CompanyStatus } from './platform-types'
import type { Permissions } from './access-types'

export type MemberPatch = Partial<Pick<TeamMember, 'role' | 'access_role_id' | 'team_id'>>
