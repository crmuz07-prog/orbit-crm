import { useMemo } from 'react'
import { isToday } from 'date-fns'
import type { Activity } from '@/lib/types'
import { useCrm } from './useData'

export type TaskState = 'overdue' | 'today' | 'planned' | 'none'

export interface NextTask {
  task: Activity | null
  state: TaskState
}

export function taskState(task: Activity | null | undefined, now = Date.now()): TaskState {
  if (!task?.due_at) return 'none'
  const due = new Date(task.due_at)
  if (due.getTime() < now) return 'overdue'
  return isToday(due) ? 'today' : 'planned'
}

// One index per activities snapshot, shared by every board card instead of rebuilt per card.
const indexes = new WeakMap<Activity[], Map<string, Activity>>()

function nextByDeal(activities: Activity[]) {
  let next = indexes.get(activities)
  if (next) return next
  next = new Map<string, Activity>()
  for (const a of activities) {
    if (a.done || !a.due_at || !a.deal_id) continue
    const current = next.get(a.deal_id)
    if (!current || a.due_at < (current.due_at ?? '')) next.set(a.deal_id, a)
  }
  indexes.set(activities, next)
  return next
}

/** Each deal's earliest open task (amoCRM: every open lead has a next step; red when late, yellow today). */
export function useNextTasks() {
  const { activities } = useCrm()
  return useMemo(() => {
    const next = nextByDeal(activities)
    const now = Date.now()
    return (dealId: string): NextTask => {
      const task = next.get(dealId) ?? null
      return { task, state: taskState(task, now) }
    }
  }, [activities])
}
