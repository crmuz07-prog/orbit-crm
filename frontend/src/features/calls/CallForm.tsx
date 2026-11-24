import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { useCrm } from '@/hooks/useData'
import type { Activity, CallDirection, CallOutcome } from '@/lib/types'
import { fullName } from '@/lib/utils'
import { CallHeader } from './CallHeader'
import { CallNotesFields, Section, useCallNotes } from './CallNotesFields'
import { DirectionPicker, OutcomePicker } from './CallPickers'
import { useCallTimer } from './useCallTimer'
import { useLogCall } from './useLogCall'

type Links = Partial<Pick<Activity, 'deal_id' | 'company_id' | 'contact_id'>>
type Props = { initial?: Links; onDone: () => void }

/** Manual call workspace (calls made outside the connected PBX): dial, time, notes, follow-up. */
export function CallForm({ initial, onDone }: Props) {
  const { t } = useTranslation()
  const { contacts, contactById, companyById } = useCrm()
  const timer = useCallTimer()
  const logCall = useLogCall()
  const { notes, patch, followUpTask } = useCallNotes()
  const [contactId, setContactId] = useState(initial?.contact_id ?? '')
  const [direction, setDirection] = useState<CallDirection>('outbound')
  const [outcome, setOutcome] = useState<CallOutcome>('connected')

  const contact = contactId ? contactById.get(contactId) : undefined
  const name = contact ? fullName(contact) : ''
  const companyId = initial?.company_id ?? contact?.company_id ?? null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    timer.stop()
    await logCall.mutateAsync({
      subject: name ? t('calls.subject', { name }) : t('entity.call'),
      direction, outcome, duration_seconds: timer.seconds, phone: contact?.phone ?? null,
      summary: notes.summary.trim() || null, next_steps: notes.nextSteps.trim() || null,
      deal_id: initial?.deal_id ?? null, company_id: companyId, contact_id: contactId || null,
      follow_up: followUpTask(name),
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <CallHeader contact={contact} companyName={companyId ? companyById.get(companyId)?.name : undefined} timer={timer} />
      {!initial?.contact_id && (
        <SelectField label={t('calls.contact')} emptyLabel="—" value={contactId} onChange={setContactId} options={contacts.map((c) => ({ value: c.id, label: fullName(c) }))} />
      )}
      <div className="flex flex-wrap items-end gap-4">
        <Section label={t('calls.direction')}><DirectionPicker value={direction} onChange={setDirection} /></Section>
        <Section label={t('calls.outcome')}><OutcomePicker value={outcome} onChange={setOutcome} /></Section>
      </div>
      <CallNotesFields notes={notes} patch={patch} />
      <div className="flex justify-end gap-2 border-t border-foreground/[0.06] pt-4">
        <Button variant="outline" onClick={onDone}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={logCall.isPending}>{t('calls.save')}</Button>
      </div>
    </form>
  )
}
