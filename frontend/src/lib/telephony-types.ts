/** Calls: manual call logs, call analytics, the PBX integration and its live events. */
import type { Activity, CallDirection, CallOutcome } from './types'

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
