import { AlarmClock, CalendarClock, CalendarX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { NextTask } from '@/hooks/useNextTasks'
import { Tooltip } from '@/components/ui/tooltip'
import { useSubject } from '@/features/activities/useSubject'
import { cn, relativeDay } from '@/lib/utils'

const STYLE = {
  overdue: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  today: 'bg-amber-400/20 text-amber-800 dark:text-amber-300',
  planned: 'text-muted-foreground',
  none: 'bg-amber-400/15 text-amber-800 dark:text-amber-300',
} as const

/** The deal's next step at a glance: overdue (red), today (yellow), planned, or a missing task (amoCRM "no tasks"). */
export function NextTaskBadge({ next, className }: { next: NextTask; className?: string }) {
  const { t } = useTranslation()
  const subject = useSubject()
  const Icon = next.state === 'none' ? CalendarX : next.state === 'overdue' ? AlarmClock : CalendarClock
  const label = next.state === 'none' || !next.task?.due_at ? t('tasks.none') : next.state === 'overdue'
    ? t('tasks.overdueSince', { when: relativeDay(next.task.due_at) }) : relativeDay(next.task.due_at)
  const badge = (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight', STYLE[next.state], className)}>
      <Icon className="size-3 shrink-0" /> <span className="truncate">{label}</span>
    </span>
  )
  return next.task ? <Tooltip content={subject(next.task)}>{badge}</Tooltip> : badge
}
