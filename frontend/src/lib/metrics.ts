import { differenceInCalendarDays } from 'date-fns'
import { STALE_AFTER_DAYS } from './constants'
import type { Activity, Deal, DealStatus, Stage } from './types'
import { toDate } from './utils'

type Stages = Map<string, Stage>

export function dealStatus(deal: Deal, stageById: Stages): DealStatus {
  const stage = stageById.get(deal.stage_id)
  if (stage?.is_won) return 'won'
  if (stage?.is_lost) return 'lost'
  return 'open'
}

export const weightedValue = (deal: Deal, stageById: Stages) => (deal.amount * (stageById.get(deal.stage_id)?.probability ?? 0)) / 100

export const daysSince = (iso: string) => differenceInCalendarDays(new Date(), toDate(iso))

export const isStale = (deal: Deal, stageById: Stages) =>
  dealStatus(deal, stageById) === 'open' && daysSince(deal.updated_at) >= STALE_AFTER_DAYS

export const isCloseOverdue = (deal: Deal, stageById: Stages) =>
  dealStatus(deal, stageById) === 'open' && !!deal.expected_close_date && daysSince(deal.expected_close_date) > 0

export const sumAmount = (deals: Deal[]) => deals.reduce((total, d) => total + d.amount, 0)

export type DueBucket = 'overdue' | 'today' | 'upcoming' | 'none'

export function dueBucket(activity: Activity): DueBucket {
  if (!activity.due_at || activity.done) return 'none'
  const diff = -daysSince(activity.due_at)
  if (diff < 0) return 'overdue'
  return diff === 0 ? 'today' : 'upcoming'
}
