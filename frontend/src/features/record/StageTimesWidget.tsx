import { useQuery } from '@tanstack/react-query'
import { Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader } from '@/components/ui/card'
import { useDealStages } from '@/hooks/usePipelines'
import { useLabels } from '@/hooks/useLabels'
import { historyApi } from '@/lib/api'
import { STAGE_COLORS } from '@/lib/constants'
import type { Deal } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatDuration } from './duration'

/** amoCRM widget "time of the deal in stages": one bar per stage of the deal's pipeline. */
export function StageTimesWidget({ deal }: { deal: Deal }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const stages = useDealStages(deal.stage_id)
  const { data = [] } = useQuery({ queryKey: ['stage-times', deal.id], queryFn: () => historyApi.stageTimes(deal.id) })
  const seconds = new Map(data.map((s) => [s.stage_id, s.seconds]))
  const longest = Math.max(1, ...data.map((s) => s.seconds))
  const visited = stages.filter((s) => seconds.has(s.id))

  return (
    <Card>
      <CardHeader title={<span className="inline-flex items-center gap-2"><Timer className="size-4 text-primary" /> {t('card.stageTimes')}</span>} />
      <ul className="space-y-3 px-5 py-4">
        {visited.map((s) => (
          <li key={s.id}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className={cn('truncate', s.id === deal.stage_id && 'font-semibold')}>{labels.stage(s.name)}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{formatDuration(seconds.get(s.id) ?? 0, t)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
              <div className={cn('h-full rounded-full', STAGE_COLORS[s.color].dot)} style={{ width: `${((seconds.get(s.id) ?? 0) / longest) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
