import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { dueBucket } from '@/lib/metrics'
import type { Activity } from '@/lib/types'
import { cn, relativeDay } from '@/lib/utils'

const TONE = {
  overdue: 'font-medium text-rose-600 dark:text-rose-400',
  today: 'font-medium text-amber-600 dark:text-amber-400',
  upcoming: 'text-muted-foreground',
  none: 'text-muted-foreground',
}

export function DueLabel({ activity }: { activity: Activity }) {
  const { t } = useTranslation()
  if (!activity.due_at) return null
  const bucket = dueBucket(activity)
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', TONE[bucket])}>
      <Clock className="size-3" />
      {bucket === 'overdue' && `${t('common.overdue')} · `}
      {relativeDay(activity.due_at)}
    </span>
  )
}
