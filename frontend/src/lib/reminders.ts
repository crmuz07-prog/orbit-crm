import { addDays, addMinutes, setHours, startOfDay } from 'date-fns'
import { REMINDER_OPTIONS } from './constants'

export type ReminderKey = (typeof REMINDER_OPTIONS)[number]['key']

/** remind_at for a due date and a "minutes before" option; null when there is no reminder. */
export function remindAt(dueIso: string | null, key: ReminderKey): string | null {
  const minutes = REMINDER_OPTIONS.find((o) => o.key === key)?.minutes
  if (!dueIso || minutes === null || minutes === undefined) return null
  return addMinutes(new Date(dueIso), -minutes).toISOString()
}

/** Inverse of `remindAt`, used to pre-select the option when editing. */
export function reminderKeyFor(dueIso: string | null, remindIso: string | null): ReminderKey {
  if (!dueIso || !remindIso) return 'none'
  const minutes = Math.round((new Date(dueIso).getTime() - new Date(remindIso).getTime()) / 60000)
  return REMINDER_OPTIONS.find((o) => o.minutes === minutes)?.key ?? 'atTime'
}

export const SNOOZE_OPTIONS = [
  { key: 'snooze10', until: () => addMinutes(new Date(), 10) },
  { key: 'snooze60', until: () => addMinutes(new Date(), 60) },
  { key: 'tomorrow', until: () => setHours(startOfDay(addDays(new Date(), 1)), 9) },
] as const

export const isDue = (remindIso: string | null) => !!remindIso && new Date(remindIso) <= new Date()
