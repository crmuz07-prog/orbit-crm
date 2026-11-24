import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import type { NextTask } from '@/hooks/useNextTasks'
import { dealStatus } from '@/lib/metrics'
import type { Deal, Stage } from '@/lib/types'
import { cn } from '@/lib/utils'

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
  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label={t('deals.presetsLabel')}>
      {PRESETS.map((p) => (
        <button key={p} type="button" role="tab" aria-selected={value === p} onClick={() => onChange(p)}
          className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors',
            value === p ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
            p === 'overdue' && counts.overdue > 0 && value !== p && 'text-rose-600 dark:text-rose-400')}>
          {t(`deals.presets.${p}`)} <span className="tabular-nums opacity-70">{counts[p]}</span>
        </button>
      ))}
    </div>
  )
}
