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

export type RecordLink = 'deal_id' | 'contact_id' | 'company_id'

// One index per activities snapshot and link, shared by every card / row instead of rebuilt per item.
const indexes = new WeakMap<Activity[], Partial<Record<RecordLink, Map<string, Activity>>>>()

function nextBy(activities: Activity[], link: RecordLink) {
  const cache = indexes.get(activities) ?? {}
  if (cache[link]) return cache[link]!
  const next = new Map<string, Activity>()
  for (const a of activities) {
    const id = a[link]
    if (a.done || !a.due_at || !id) continue
    const current = next.get(id)
    if (!current || a.due_at < (current.due_at ?? '')) next.set(id, a)
  }
  indexes.set(activities, { ...cache, [link]: next })
  return next
}

/** Each record's earliest open task (amoCRM: every open lead has a next step; red when late, yellow today). */
export function useNextTasks(link: RecordLink = 'deal_id') {
  const { activities } = useCrm()
  return useMemo(() => {
    const next = nextBy(activities, link)
    const now = Date.now()
    return (dealId: string): NextTask => {
      const task = next.get(dealId) ?? null
      return { task, state: taskState(task, now) }
    }
  }, [activities, link])
}

/** When something last happened with each record (newest activity), for "last contact" columns. */
export function useLastActivity(link: RecordLink) {
  const { activities } = useCrm()
  return useMemo(() => {
    const last = new Map<string, string>()
    for (const a of activities) {
      const id = a[link]
      if (id && a.created_at > (last.get(id) ?? '')) last.set(id, a.created_at)
    }
    return last
  }, [activities, link])
}
