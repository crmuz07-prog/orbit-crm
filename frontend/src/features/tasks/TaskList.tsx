import { useTranslation } from 'react-i18next'
import { MotionList } from '@/components/common/motion-list'
import { BUCKETS, bucketOf } from '@/lib/tasks'
import type { Activity } from '@/lib/types'
import { cn, toDate } from '@/lib/utils'
import { TaskRow } from './TaskRow'

const dueTime = (a: Activity) => (a.due_at ? toDate(a.due_at).getTime() : Number.MAX_SAFE_INTEGER)

/** Tasks grouped by deadline (amoCRM): Overdue, Today, Tomorrow, This week, Later, No date — soonest first. */
export function TaskList({ tasks, grouped = true }: { tasks: Activity[]; grouped?: boolean }) {
  const { t } = useTranslation()
  const sorted = [...tasks].sort((a, b) => dueTime(a) - dueTime(b))
  const groups = grouped ? BUCKETS.map((b) => ({ b, rows: sorted.filter((a) => bucketOf(a) === b) })).filter((g) => g.rows.length) : [{ b: null, rows: sorted }]
  return groups.map((g) => (
    <section key={g.b ?? 'all'}>
      {g.b && (
        <h3 className={cn('border-b border-foreground/[0.06] bg-foreground/[0.02] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider',
          g.b === 'overdue' ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>
          {t(`tasks.buckets.${g.b}`)} · {g.rows.length}
        </h3>
      )}
      <MotionList items={g.rows} className="divide-y divide-foreground/[0.06]" render={(a) => <TaskRow task={a} />} />
    </section>
  ))
}
