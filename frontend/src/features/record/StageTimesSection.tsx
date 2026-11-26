import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useDealStages } from '@/hooks/usePipelines'
import { useLabels } from '@/hooks/useLabels'
import { historyApi } from '@/lib/api'
import { STAGE_COLORS } from '@/lib/constants'
import type { Deal } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatDuration } from './duration'
import { SectionHeading } from './RecordCard'

/** Time the deal spent in each stage it visited, as a section of its info panel (amoCRM "time in stages"). */
export function StageTimesSection({ deal }: { deal: Deal }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const stages = useDealStages(deal.stage_id)
  const { data = [] } = useQuery({ queryKey: ['stage-times', deal.id], queryFn: () => historyApi.stageTimes(deal.id) })
  const seconds = new Map(data.map((s) => [s.stage_id, s.seconds]))
  const longest = Math.max(1, ...data.map((s) => s.seconds))
  const visited = stages.filter((s) => seconds.has(s.id))
  if (visited.length === 0) return null

  return (
    <section className="border-t border-foreground/[0.06] px-4 py-2.5">
      <SectionHeading title={t('card.stageTimes')} />
      <ul className="space-y-2">
        {visited.map((s) => (
          <li key={s.id}>
            <div className="flex items-baseline justify-between gap-2 text-[13px]">
              <span className={cn('truncate', s.id === deal.stage_id && 'font-semibold')}>{labels.stage(s.name)}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{formatDuration(seconds.get(s.id) ?? 0, t)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
              <div className={cn('h-full rounded-full', STAGE_COLORS[s.color].dot)} style={{ width: `${((seconds.get(s.id) ?? 0) / longest) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
