import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BellRing, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { IconButton } from '@/components/common/icon-button'
import { Checkbox } from '@/components/ui/checkbox'
import { CallDetails } from '@/features/calls/CallDetails'
import type { Activity } from '@/lib/types'
import { cn, relativeDay } from '@/lib/utils'
import { ActivityIcon } from './ActivityIcon'
import { useSubject } from './useSubject'
import { useActivityActions } from './useActivityActions'

interface Props {
  activity: Activity
  meta: ReactNode
  compact?: boolean
}

function RowActions({ activity: a }: { activity: Activity }) {
  const { t } = useTranslation()
  const actions = useActivityActions()
  const subject = useSubject()
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      {a.type === 'note' && (
        <IconButton label={t('activities.pin')} onClick={() => actions.togglePin(a)}>{a.pinned ? <PinOff /> : <Pin />}</IconButton>
      )}
      <IconButton label={t('common.edit')} onClick={() => actions.edit(a)}><Pencil /></IconButton>
      <IconButton label={t('common.delete')} onClick={() => setConfirm(true)}><Trash2 /></IconButton>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={t('activities.deleteTitle')} description={subject(a)} onConfirm={() => actions.remove(a)} />
    </div>
  )
}

/** One activity line: complete checkbox, type icon, subject, details, call info, hover actions. */
export function ActivityRow({ activity: a, meta, compact }: Props) {
  const { t } = useTranslation()
  const subject = useSubject()
  const actions = useActivityActions()
  const schedulable = a.type !== 'note' && a.type !== 'call'

  return (
    <div className={cn('group flex items-start gap-3 px-5', compact ? 'py-3' : 'py-3.5')}>
      <div className="w-[18px] pt-1.5">
        {schedulable && <Checkbox checked={a.done} onCheckedChange={() => actions.toggleDone(a)} aria-label={t('activities.markDone')} />}
        {a.pinned && <Pin className="mt-0.5 size-3.5 text-primary" />}
      </div>
      <ActivityIcon type={a.type} className={compact ? 'size-6' : undefined} />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium transition-colors', a.done && schedulable && 'text-muted-foreground line-through')}>{subject(a)}</p>
        {a.type === 'call' && <CallDetails activity={a} />}
        {!compact && a.body && <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>}
        {a.done && a.result && <p className="mt-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[12px] text-emerald-800 dark:text-emerald-300"><b className="font-medium">{t('tasks.complete.result')}:</b> {a.result}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {meta}
          {a.remind_at && !a.done && (
            <span className="inline-flex items-center gap-1 text-primary"><BellRing className="size-3" /> {relativeDay(a.remind_at)}</span>
          )}
        </div>
      </div>
      {!compact && <RowActions activity={a} />}
    </div>
  )
}
