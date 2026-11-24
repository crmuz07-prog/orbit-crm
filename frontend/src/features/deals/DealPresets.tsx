import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { FilterChips } from '@/components/common/filter-chips'
import type { NextTask } from '@/hooks/useNextTasks'
import { dealStatus } from '@/lib/metrics'
import type { Deal, Stage } from '@/lib/types'

export const PRESETS = ['all', 'mine', 'noTask', 'overdue', 'today', 'won', 'lost'] as const
export type Preset = (typeof PRESETS)[number]

/** amoCRM's saved filters as one-click chips: my deals, deals without a task, late / today's tasks, won, lost. */
export function usePresetFilter(stageById: Map<string, Stage>, nextTask: (id: string) => NextTask) {
  const me = useAuth().session?.user.id
  return (preset: Preset) => (d: Deal) => {
    const status = dealStatus(d, stageById)
    switch (preset) {
      case 'mine': return d.owner_id === me
      case 'noTask': return status === 'open' && nextTask(d.id).state === 'none'
      case 'overdue': return status === 'open' && nextTask(d.id).state === 'overdue'
      case 'today': return status === 'open' && nextTask(d.id).state === 'today'
      case 'won': return status === 'won'
      case 'lost': return status === 'lost'
      default: return true
    }
  }
}

export function PresetChips({ value, onChange, counts }: { value: Preset; onChange: (p: Preset) => void; counts: Record<Preset, number> }) {
  const { t } = useTranslation()
  return <FilterChips options={PRESETS} value={value} onChange={onChange} counts={counts} label={(p) => t(`deals.presets.${p}`)} alert="overdue" />
}
