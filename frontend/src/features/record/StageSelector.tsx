import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { stagesOf, usePipelines } from '@/hooks/usePipelines'
import { useCrm } from '@/hooks/useData'
import { STAGE_COLORS } from '@/lib/constants'
import { daysInStage } from '@/lib/metrics'
import type { Deal, Stage } from '@/lib/types'
import { cn } from '@/lib/utils'

/** How far along the pipeline the deal is: open stages fill the bar, won is full, lost is red. */
function progress(stage: Stage | undefined, stages: Stage[]): { percent: number; tone: string } {
  if (!stage) return { percent: 0, tone: 'bg-primary' }
  if (stage.is_won) return { percent: 100, tone: 'bg-emerald-500' }
  if (stage.is_lost) return { percent: 100, tone: 'bg-rose-500' }
  const open = stages.filter((s) => !s.is_won && !s.is_lost)
  return { percent: ((open.findIndex((s) => s.id === stage.id) + 1) / (open.length + 1)) * 100, tone: 'bg-primary' }
}

/** amoCRM header control: "Pipeline / Stage (n days)" with a progress bar; any stage of any pipeline can be picked. */
export function StageSelector({ deal, onPick, readOnly }: { deal: Deal; onPick: (stage: Stage) => void; readOnly?: boolean }) {
  const { t } = useTranslation()
  const { stages, stageById } = useCrm()
  const { pipelines } = usePipelines()
  const stage = stageById.get(deal.stage_id)
  const pipelineStages = stagesOf(stages, stage?.pipeline_id)
  const pipeline = pipelines.find((p) => p.id === stage?.pipeline_id)
  const bar = progress(stage, pipelineStages)

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger disabled={readOnly} className="group flex w-full items-center justify-between gap-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="min-w-0">
            <span className="block truncate text-xs text-muted-foreground">{pipeline?.name}</span>
            <span className="block truncate text-sm font-semibold">
              {stage?.name} <span className="font-normal text-muted-foreground">({t('board.inStage', { count: daysInStage(deal) })})</span>
            </span>
          </span>
          {!readOnly && <ChevronDown className="size-4 shrink-0 text-muted-foreground transition group-data-[state=open]:rotate-180" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[60vh] w-72 overflow-y-auto">
          {pipelines.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel>{p.name}</DropdownMenuLabel>
              {stagesOf(stages, p.id).map((s) => (
                <DropdownMenuItem key={s.id} onSelect={() => s.id !== deal.stage_id && onPick(s)} className={cn(s.id === deal.stage_id && 'font-semibold')}>
                  <span className={cn('size-2 rounded-full', STAGE_COLORS[s.color].dot)} /> {s.name}
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
        <motion.div className={cn('h-full rounded-full', bar.tone)} initial={false} animate={{ width: `${bar.percent}%` }} transition={{ duration: 0.25 }} />
      </div>
    </div>
  )
}
