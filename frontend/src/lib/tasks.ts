import { addDays, differenceInCalendarDays, isPast, set, startOfDay } from 'date-fns'
import type { Activity } from './types'
import { toDate } from './utils'

export const BUCKETS = ['overdue', 'today', 'tomorrow', 'week', 'later', 'undated'] as const
export type Bucket = (typeof BUCKETS)[number]

/**
 * Something to do (amoCRM "tasks"): a task or meeting, or any other activity with a deadline that is not done yet.
 * Notes, logged calls and Direct messages are history, not tasks.
 */
export function isTask(a: Activity) {
  if (a.type === 'note' || a.type === 'message') return false
  if (a.type === 'task' || a.type === 'meeting') return true
  return !!a.due_at && !a.done
}

/** Deadline group, as amoCRM's task list and board split them. */
export function bucketOf(a: Activity, now = new Date()): Bucket {
  if (!a.due_at) return 'undated'
  const due = toDate(a.due_at)
  if (!a.done && due < now) return 'overdue'
  const days = differenceInCalendarDays(due, now)
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  return days < 7 ? 'week' : 'later'
}

/** Days from today a task lands on when dropped on a group (overdue and "no date" are not targets). */
const SHIFT: Partial<Record<Bucket, number>> = { today: 0, tomorrow: 1, week: 2, later: 7 }

export const isDropTarget = (b: Bucket) => b in SHIFT

/** New deadline for a task dropped on a group: that day, at the task's own time (10:00 without one); never in the past. */
export function rescheduled(a: Activity, target: Bucket, now = new Date()): Date | null {
  const shift = SHIFT[target]
  if (shift === undefined) return null
  const time = a.due_at ? toDate(a.due_at) : set(now, { hours: 10, minutes: 0 })
  let next = set(addDays(startOfDay(now), shift), { hours: time.getHours(), minutes: time.getMinutes(), seconds: 0, milliseconds: 0 })
  // "Today" at a time already gone means the next full hour.
  if (isPast(next)) next = set(addDays(now, 0), { minutes: 0, seconds: 0, milliseconds: 0, hours: now.getHours() + 1 })
  return next
}
