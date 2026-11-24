import { Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { useLabels } from '@/hooks/useLabels'
import { PRIORITIES, STAGE_COLORS } from '@/lib/constants'
import type { DealStatus, Priority, Stage } from '@/lib/types'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function StageBadge({ stage }: { stage?: Stage }) {
  const labels = useLabels()
  if (!stage) return <span className="text-muted-foreground">—</span>
  const color = STAGE_COLORS[stage.color]
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium', color.soft)}>
      <span className={cn('size-1.5 rounded-full', color.dot)} />
      {labels.stage(stage.name)}
    </span>
  )
}

export function PriorityFlag({ priority, withLabel }: { priority: Priority; withLabel?: boolean }) {
  const { t } = useTranslation()
  const p = PRIORITIES.find((x) => x.value === priority) ?? PRIORITIES[1]
  const label = t(`enums.priority.${priority}`)
  return (
    <Tooltip content={t('enums.priorityFilter', { label })}>
      <span className={cn('inline-flex items-center gap-1 text-xs', p.className)} aria-label={withLabel ? undefined : label}>
        <Flag className="size-3.5" fill={priority === 'low' ? 'none' : 'currentColor'} />
        {withLabel && <span className="text-muted-foreground">{label}</span>}
      </span>
    </Tooltip>
  )
}

const STATUS_TONE: Record<DealStatus, 'green' | 'red' | 'blue'> = { open: 'blue', won: 'green', lost: 'red' }

export function StatusBadge({ status }: { status: DealStatus }) {
  const { t } = useTranslation()
  return <Badge tone={STATUS_TONE[status]}>{t(`enums.status.${status}`)}</Badge>
}
