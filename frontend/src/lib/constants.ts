import type { ActivityType, CallDirection, CallOutcome, Lifecycle, Priority, StageColor } from './types'

export const STAGE_COLORS: Record<StageColor, { dot: string; hex: string; soft: string }> = {
  slate: { dot: 'bg-slate-400', hex: '#94a3b8', soft: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' },
  blue: { dot: 'bg-blue-500', hex: '#3b82f6', soft: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  violet: { dot: 'bg-violet-500', hex: '#8b5cf6', soft: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  amber: { dot: 'bg-amber-500', hex: '#f59e0b', soft: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  orange: { dot: 'bg-orange-500', hex: '#f97316', soft: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' },
  emerald: { dot: 'bg-emerald-500', hex: '#10b981', soft: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  rose: { dot: 'bg-rose-500', hex: '#f43f5e', soft: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
}

// Labels for every enum live in the i18n dictionaries (`enums.*`); these lists only fix order and style.
export const LIFECYCLES: { value: Lifecycle; tone: 'gray' | 'blue' | 'green' | 'red' }[] = [
  { value: 'lead', tone: 'gray' },
  { value: 'prospect', tone: 'blue' },
  { value: 'customer', tone: 'green' },
  { value: 'churned', tone: 'red' },
]

export const PRIORITIES: { value: Priority; className: string }[] = [
  { value: 'low', className: 'text-zinc-400' },
  { value: 'medium', className: 'text-amber-500' },
  { value: 'high', className: 'text-rose-500' },
]

export const ACTIVITY_TYPES: ActivityType[] = ['note', 'call', 'email', 'meeting', 'task']

export const CALL_OUTCOMES: { value: CallOutcome; tone: 'green' | 'gray' | 'amber' | 'red' | 'violet' }[] = [
  { value: 'connected', tone: 'green' },
  { value: 'no_answer', tone: 'gray' },
  { value: 'voicemail', tone: 'violet' },
  { value: 'busy', tone: 'amber' },
  { value: 'wrong_number', tone: 'red' },
]

export const CALL_DIRECTIONS: CallDirection[] = ['outbound', 'inbound']

export const LOST_REASONS = ['price', 'competitor', 'budget', 'stalled', 'features', 'timing'] as const

/** Minutes before the due time; null = no reminder. */
export const REMINDER_OPTIONS = [
  { key: 'none', minutes: null },
  { key: 'atTime', minutes: 0 },
  { key: 'min15', minutes: 15 },
  { key: 'hour1', minutes: 60 },
  { key: 'day1', minutes: 1440 },
] as const

export const INDUSTRIES = [
  'SaaS', 'Fintech', 'Logistics', 'Manufacturing', 'Healthcare', 'Energy',
  'Retail', 'Telecom', 'Education', 'Aerospace', 'Food & Beverage', 'Mining', 'Cybersecurity', 'Other',
]
export const EMPLOYEE_RANGES = ['1–10', '11–50', '51–200', '201–500', '501–1,000', '1,001–5,000', '5,000+']
export const DEAL_SOURCES = ['Inbound', 'Outbound', 'Referral', 'Partner', 'Event', 'Website']
export const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB', 'GBP', 'AED']

/** Pipedrive-style "rotting": an open deal with no update for this many days is at risk. */
export const STALE_AFTER_DAYS = 14
