import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLabels } from '@/hooks/useLabels'
import type { Deal, Stage } from '@/lib/types'
import { cn } from '@/lib/utils'

const CHEVRON = 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)'
const CHEVRON_FIRST = 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'

type StepState = 'done' | 'active' | 'todo' | 'won' | 'lost' | 'lost-past'

const STEP_CLASS: Record<StepState, string> = {
  done: 'glass-glow text-primary-foreground',
  active: 'bg-primary/15 font-semibold text-primary',
  todo: 'bg-foreground/[0.05] text-muted-foreground hover:bg-foreground/[0.08]',
  won: 'bg-emerald-500 text-white',
  lost: 'bg-rose-500 text-white',
  'lost-past': 'bg-foreground/[0.05] text-muted-foreground',
}

function stepState(index: number, current: number, stage?: Stage): StepState {
  if (stage?.is_won) return 'won'
  if (stage?.is_lost) return index === current ? 'lost' : 'lost-past'
  return index < current ? 'done' : index === current ? 'active' : 'todo'
}

/** Salesforce "Path": open stages as chevrons plus a final "Closed" step. */
export function StagePath({ deal, stages, onSelect }: { deal: Deal; stages: Stage[]; onSelect: (stage: Stage) => void }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const open = stages.filter((s) => !s.is_won && !s.is_lost)
  const stage = stages.find((s) => s.id === deal.stage_id)
  const closed = stage?.is_won || stage?.is_lost
  const current = closed ? open.length : open.findIndex((s) => s.id === deal.stage_id)
  const steps = [...open, { id: 'closed', name: closed ? stage!.name : t('deals.closedStep') } as Stage]

  return (
    <div className="flex gap-0.5 overflow-x-auto">
      {steps.map((step, i) => {
        const state = stepState(i, current, stage)
        const selectable = step.id !== 'closed'
        return (
          <motion.button
            key={step.id}
            type="button"
            layout
            disabled={!selectable}
            whileTap={selectable ? { scale: 0.97 } : undefined}
            onClick={() => selectable && onSelect(step)}
            style={{ clipPath: i === 0 ? CHEVRON_FIRST : CHEVRON }}
            className={cn('flex h-9 min-w-[120px] flex-1 items-center justify-center gap-1.5 px-4 text-xs font-medium transition-colors duration-300', i === 0 && 'rounded-l-lg', STEP_CLASS[state])}
          >
            {(state === 'done' || state === 'won') && <Check className="size-3.5" />}
            <span className="truncate">{step.id === 'closed' && !closed ? step.name : labels.stage(step.name)}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
