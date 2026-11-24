/**
 * Subscription arithmetic for previews in the UI — the same rules as backend services/billing.py (and erp1):
 * plain YYYY-MM-DD calendar dates, month ends clamp (31 Jan + 1 month = 28/29 Feb), the end date is inclusive.
 */
import { SUBSCRIPTION_WARNING_DAYS, type CompanyStatus } from './platform-types'

const pad = (n: number) => String(n).padStart(2, '0')

export function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function addMonths(iso: string, months: number): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  const total = year * 12 + (month - 1) + months
  const y = Math.floor(total / 12)
  const m = (total % 12) + 1
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${y}-${pad(m)}-${pad(Math.min(day, lastDay))}`
}

/** Where the next payment starts: the current end date while it is running, otherwise today (payments stack). */
export function nextPeriodStart(endsAt: string | null): string {
  const today = todayIso()
  return endsAt && endsAt >= today ? endsAt : today
}

export type DisplayStatus = CompanyStatus | 'expiring'

/** Adds "ending soon" (within the warning window) to the server's status. */
export function displayStatus(status: CompanyStatus, daysLeft: number | null): DisplayStatus {
  return status === 'active' && daysLeft !== null && daysLeft <= SUBSCRIPTION_WARNING_DAYS ? 'expiring' : status
}

export const STATUS_TONE: Record<DisplayStatus, 'green' | 'amber' | 'red' | 'gray'> = {
  active: 'green', expiring: 'amber', expired: 'red', blocked: 'red',
}
