import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { FilterChips } from '@/components/common/filter-chips'
import { bucketOf } from '@/lib/tasks'
import type { Activity } from '@/lib/types'

export const TASK_PRESETS = ['open', 'mine', 'overdue', 'today', 'tomorrow', 'done'] as const
export type TaskPreset = (typeof TASK_PRESETS)[number]

/** amoCRM's task filters as chips: all open, mine, overdue, today, tomorrow, completed. */
export function useTaskPreset() {
  const me = useAuth().session?.user.id
  return (preset: TaskPreset) => (a: Activity) => {
    if (preset === 'done') return a.done
    if (a.done) return false
    if (preset === 'mine') return a.owner_id === me
    if (preset === 'overdue' || preset === 'today' || preset === 'tomorrow') return bucketOf(a) === preset
    return true
  }
}

export function TaskPresetChips({ value, onChange, counts }: { value: TaskPreset; onChange: (p: TaskPreset) => void; counts: Record<TaskPreset, number> }) {
  const { t } = useTranslation()
  return <FilterChips options={TASK_PRESETS} value={value} onChange={onChange} counts={counts} label={(p) => t(`tasks.presets.${p}`)} alert="overdue" />
}
