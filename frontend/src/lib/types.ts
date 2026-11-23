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

export interface Stage extends Row {
  name: string
  position: number
  probability: number
  is_won: boolean
  is_lost: boolean
  color: StageColor
}

export interface Company extends Row {
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

export interface Contact extends Row {
  company_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  title: string | null
  linkedin_url: string | null
}

export interface Deal extends Row {
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
}

export interface Activity extends Row {
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
}

export interface Workspace {
  id: string
  name: string
  is_demo: boolean
}

export interface Session {
  user: User
  workspace: Workspace
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
