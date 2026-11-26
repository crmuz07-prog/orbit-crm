import { addDays } from 'date-fns'
import { ArrowRight, Pencil, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { IconButton } from '@/components/common/icon-button'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ActivityIcon } from '@/features/activities/ActivityIcon'
import { ActivityMeta } from '@/features/activities/ActivityLinks'
import { useActivityActions } from '@/features/activities/useActivityActions'
import { useSubject } from '@/features/activities/useSubject'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useMembers } from '@/features/team/useMembers'
import { useCrm, useUpdateRow } from '@/hooks/useData'
import { bucketOf } from '@/lib/tasks'
import type { Activity } from '@/lib/types'
import { cn, shortDate, timeOf, timeSince, toDate } from '@/lib/utils'

/** The deadline in the fewest words: "2 days late" (red), "10:00" today, "Tomorrow 10:00", otherwise the date. */
function Due({ task }: { task: Activity }) {
  const { t } = useTranslation()
  if (!task.due_at) return null
  const due = toDate(task.due_at)
  const bucket = bucketOf(task)
  const text = bucket === 'overdue' ? t('tasks.row.late', { when: timeSince(task.due_at) })
    : bucket === 'today' ? timeOf(due)
      : bucket === 'tomorrow' ? t('tasks.row.tomorrow', { time: timeOf(due) })
        : `${shortDate(task.due_at)} ${timeOf(due)}`
  return <span className={cn('whitespace-nowrap text-xs tabular-nums', bucket === 'overdue' ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>{text}</span>
}

/** Same time tomorrow (an overdue 10:00 call becomes tomorrow 10:00); the reminder moves with it. */
function useMoveToTomorrow() {
  const update = useUpdateRow('activities')
  const { t } = useTranslation()
  return (task: Activity) => {
    if (!task.due_at) return
    const before = { due_at: task.due_at, remind_at: task.remind_at }
    const due = toDate(task.due_at)
    const next = addDays(new Date(), 1)
    next.setHours(due.getHours(), due.getMinutes(), 0, 0)
    const shift = next.getTime() - due.getTime()
    const remind = task.remind_at ? new Date(toDate(task.remind_at).getTime() + shift).toISOString() : null
    update.mutate({ id: task.id, patch: { due_at: next.toISOString(), remind_at: remind } }, {
      // Long enough to reach "Undo" (the default few seconds are not).
      onSuccess: () => toast.success(t('tasks.row.moved'), { duration: 8000, action: { label: t('tasks.row.undo'), onClick: () => update.mutate({ id: task.id, patch: before }) } }),
    })
  }
}

/**
 * One task on one line (amoCRM task list): done box, subject with its deal / client and owner, the deadline, and the
 * two actions most tasks need — call the client, move to tomorrow — plus edit.
 */
export function TaskRow({ task }: { task: Activity }) {
  const { t } = useTranslation()
  const subject = useSubject()
  const actions = useActivityActions()
  const openModal = useEntityModal()
  const moveToTomorrow = useMoveToTomorrow()
  const { contactById } = useCrm()
  const { memberById } = useMembers()
  const contact = task.contact_id ? contactById.get(task.contact_id) : undefined
  const owner = task.owner_id ? memberById.get(task.owner_id)?.full_name : undefined
  const call = () => openModal({ kind: 'call', initial: { contact_id: task.contact_id, deal_id: task.deal_id, company_id: task.company_id } })

  return (
    <div className="group flex items-center gap-3 px-4 py-2">
      <Checkbox checked={task.done} onCheckedChange={() => actions.toggleDone(task)} aria-label={t('activities.markDone')} />
      <ActivityIcon type={task.type} className="hidden size-6 sm:flex" />
      <button type="button" onClick={() => actions.edit(task)} className="min-w-0 flex-1 text-left focus-visible:outline-none">
        <span className={cn('block truncate text-sm font-medium', task.done && 'text-muted-foreground line-through')}>{subject(task)}</span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <ActivityMeta activity={task} hideTime />
          {owner && <span className="truncate">{owner}</span>}
          <span className="sm:hidden"><Due task={task} /></span>
        </span>
      </button>
      <span className="hidden w-32 shrink-0 text-right sm:block"><Due task={task} /></span>
      <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        {contact?.phone && !task.done && <IconButton label={t('tasks.row.call')} className="size-8 text-emerald-600" onClick={call}><Phone /></IconButton>}
        {!task.done && task.due_at && (
          <Button variant="ghost" size="sm" className="hidden h-8 px-2 text-xs md:inline-flex" title={t('tasks.row.toTomorrowHint')} onClick={() => moveToTomorrow(task)}>
            <ArrowRight /> {t('tasks.row.toTomorrow')}
          </Button>
        )}
        <IconButton label={t('common.edit')} className="size-8" onClick={() => actions.edit(task)}><Pencil /></IconButton>
      </div>
    </div>
  )
}
