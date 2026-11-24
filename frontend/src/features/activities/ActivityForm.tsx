import { useTranslation } from 'react-i18next'
import { DateTimeField, FormLayout, SelectField, TextField, TextareaField } from '@/components/common/form-fields'
import { useCrm } from '@/hooks/useData'
import { useEntityForm } from '@/hooks/useEntityForm'
import { ACTIVITY_TYPES } from '@/lib/constants'
import { remindAt, reminderKeyFor } from '@/lib/reminders'
import type { Activity, ActivityType } from '@/lib/types'
import { blankToNull, fromLocalInput, fullName, toLocalInput } from '@/lib/utils'
import { ReminderSelect } from './ReminderSelect'

type Props = { initial?: Partial<Activity>; onDone: (row?: Activity) => void }

export function ActivityForm({ initial, onDone }: Props) {
  const { t } = useTranslation()
  const { deals, companies, contacts } = useCrm()
  const { form, set, setForm, submit, isEdit, busy } = useEntityForm({
    table: 'activities',
    label: t('entity.activity'),
    initial,
    onDone,
    defaults: (a) => ({
      type: a?.type ?? ('task' as ActivityType),
      subject: a?.subject ?? '',
      body: a?.body ?? '',
      due_at: toLocalInput(a?.due_at),
      reminder: reminderKeyFor(a?.due_at ?? null, a?.remind_at ?? null),
      deal_id: a?.deal_id ?? '',
      company_id: a?.company_id ?? '',
      contact_id: a?.contact_id ?? '',
    }),
    toPayload: (f) => {
      if (!f.subject.trim()) return t('validation.subject')
      const dueAt = f.type === 'note' ? null : fromLocalInput(f.due_at)
      return {
        type: f.type,
        subject: f.subject.trim(),
        body: blankToNull(f.body),
        due_at: dueAt,
        remind_at: remindAt(dueAt, f.reminder),
        deal_id: f.deal_id || null,
        company_id: f.company_id || null,
        contact_id: f.contact_id || null,
      }
    },
  })

  // Picking a deal fills in its company and contact, like HubSpot associations.
  const pickDeal = (id: string) => {
    const deal = deals.find((d) => d.id === id)
    setForm((f) => ({ ...f, deal_id: id, company_id: deal?.company_id ?? f.company_id, contact_id: deal?.contact_id ?? f.contact_id }))
  }

  return (
    <FormLayout onSubmit={submit} onCancel={() => onDone()} submitLabel={isEdit ? t('common.saveChanges') : t('dialog.new.activity')} busy={busy}>
      <SelectField label={t('activities.type')} value={form.type} onChange={(v) => set('type', v as ActivityType)} options={ACTIVITY_TYPES.map((v) => ({ value: v, label: t(`enums.activity.${v}`) }))} />
      <DateTimeField label={t('activities.due')} disabled={form.type === 'note'} value={form.due_at} onChange={(v) => set('due_at', v)} />
      <TextField wide autoFocus label={t('activities.subjectRequired')} value={form.subject} onChange={(v) => set('subject', v)} placeholder={t('activities.subjectPlaceholder')} />
      <TextareaField label={t('activities.details')} value={form.body} onChange={(v) => set('body', v)} />
      {form.type !== 'note' && <ReminderSelect label={t('activities.remind')} value={form.reminder} onChange={(v) => set('reminder', v)} />}
      <SelectField label={t('activities.deal')} emptyLabel="—" value={form.deal_id} onChange={pickDeal} options={deals.map((d) => ({ value: d.id, label: d.title }))} />
      <SelectField label={t('activities.company')} emptyLabel="—" value={form.company_id} onChange={(v) => set('company_id', v)} options={companies.map((c) => ({ value: c.id, label: c.name }))} />
      <SelectField label={t('activities.contact')} emptyLabel="—" value={form.contact_id} onChange={(v) => set('contact_id', v)} options={contacts.map((c) => ({ value: c.id, label: fullName(c) }))} />
    </FormLayout>
  )
}
