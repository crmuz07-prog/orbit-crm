import { useState, type ReactNode } from 'react'
import { addDays, format, setHours, startOfHour } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/common/form-fields'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ReminderSelect } from '@/features/activities/ReminderSelect'
import { remindAt, type ReminderKey } from '@/lib/reminders'
import type { CallLog } from '@/lib/types'
import { fromLocalInput } from '@/lib/utils'

export interface CallNotes {
  summary: string
  nextSteps: string
  followUp: boolean
  followUpDue: string
  reminder: ReminderKey
}

const tomorrowAt10 = () => format(startOfHour(setHours(addDays(new Date(), 1), 10)), "yyyy-MM-dd'T'HH:mm")

/** State for "what was discussed" + follow-up, shared by manual logging and post-call wrap-up. */
export function useCallNotes(initial?: Partial<CallNotes>) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState<CallNotes>({ summary: '', nextSteps: '', followUp: true, followUpDue: tomorrowAt10(), reminder: 'min15', ...initial })
  const patch = (p: Partial<CallNotes>) => setNotes((n) => ({ ...n, ...p }))

  const followUpTask = (name: string): CallLog['follow_up'] => {
    const due = fromLocalInput(notes.followUpDue)
    if (!notes.followUp || !due) return null
    return { subject: notes.nextSteps.trim() || t('calls.followUpDefault', { name: name || '…' }), due_at: due, remind_at: remindAt(due, notes.reminder) }
  }

  return { notes, patch, followUpTask }
}

export function Section({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>
}

export function CallNotesFields({ notes, patch }: Pick<ReturnType<typeof useCallNotes>, 'notes' | 'patch'>) {
  const { t } = useTranslation()
  return (
    <>
      <Section label={t('calls.discussed')}>
        <Textarea autoFocus value={notes.summary} onChange={(e) => patch({ summary: e.target.value })} placeholder={t('calls.discussedPlaceholder')} className="min-h-[110px]" />
      </Section>
      <TextField label={t('calls.nextSteps')} value={notes.nextSteps} onChange={(v) => patch({ nextSteps: v })} placeholder={t('calls.nextStepsPlaceholder')} />
      <div className="glass-subtle space-y-3 rounded-xl p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <Checkbox checked={notes.followUp} onCheckedChange={(v) => patch({ followUp: v === true })} className="rounded-md" />
          {t('calls.followUp')}
        </label>
        <AnimatePresence initial={false}>
          {notes.followUp && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid gap-3 overflow-hidden sm:grid-cols-2">
              <TextField label={t('calls.followUpDue')} type="datetime-local" value={notes.followUpDue} onChange={(v) => patch({ followUpDue: v })} />
              <ReminderSelect label={t('activities.remind')} value={notes.reminder} onChange={(reminder) => patch({ reminder })} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
