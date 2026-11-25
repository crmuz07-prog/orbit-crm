import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CallNotesFields, Section, useCallNotes } from '@/features/calls/CallNotesFields'
import { useSubject } from '@/features/activities/useSubject'
import { CallDetails } from '@/features/calls/CallDetails'
import { OutcomePicker } from '@/features/calls/CallPickers'
import { useCreateRow, useCrm, useUpdateRow } from '@/hooks/useData'
import type { Activity, CallOutcome } from '@/lib/types'
import { fullName } from '@/lib/utils'

type Props = { initial: Activity; onDone: () => void }

/** After an automatically captured call: record what was discussed on the same call activity. */
export function CallWrapUpForm({ initial: call, onDone }: Props) {
  const { t } = useTranslation()
  const subject = useSubject()
  const { contactById } = useCrm()
  const update = useUpdateRow('activities')
  const create = useCreateRow('activities')
  const { notes, patch, followUpTask } = useCallNotes({ summary: call.body ?? '', nextSteps: call.next_steps ?? '' })
  const [outcome, setOutcome] = useState<CallOutcome>(call.call_outcome ?? 'connected')
  const contact = call.contact_id ? contactById.get(call.contact_id) : undefined
  const name = contact ? fullName(contact) : call.phone ?? ''

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await update.mutateAsync({ id: call.id, patch: { body: notes.summary.trim() || null, next_steps: notes.nextSteps.trim() || null, call_outcome: outcome } })
    const task = followUpTask(name)
    if (task) {
      await create.mutateAsync({ type: 'task', subject: task.subject, due_at: task.due_at, remind_at: task.remind_at, contact_id: call.contact_id, company_id: call.company_id, deal_id: call.deal_id })
    }
    toast.success(t('telephony.wrapUpSaved'))
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="glass-subtle rounded-2xl p-4">
        <p className="font-medium">{subject(call)}</p>
        <CallDetails activity={call} showWrapUp={false} />
      </div>
      <Section label={t('calls.outcome')}><OutcomePicker value={outcome} onChange={setOutcome} /></Section>
      <CallNotesFields notes={notes} patch={patch} />
      <div className="flex justify-end gap-2 border-t border-foreground/[0.06] pt-3">
        <Button variant="outline" onClick={onDone}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={update.isPending || create.isPending}>{t('common.save')}</Button>
      </div>
    </form>
  )
}
