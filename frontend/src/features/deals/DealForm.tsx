import { useTranslation } from 'react-i18next'
import { FormLayout, SelectField, TextField, toOptions } from '@/components/common/form-fields'
import { useCrm } from '@/hooks/useData'
import { isNew, OwnerField, useMyId } from '@/features/team/OwnerField'
import { useEntityForm } from '@/hooks/useEntityForm'
import { CURRENCIES, DEAL_SOURCES, PRIORITIES } from '@/lib/constants'
import type { Deal, Priority } from '@/lib/types'
import { fullName } from '@/lib/utils'

type Props = { initial?: Partial<Deal>; onDone: (row?: Deal) => void }

export function DealForm({ initial, onDone }: Props) {
  const { companies, contacts, stages } = useCrm()
  const { t } = useTranslation()
  const myId = useMyId()
  const firstOpen = stages.find((s) => !s.is_won && !s.is_lost)
  const { form, set, setForm, submit, isEdit, busy } = useEntityForm({
    table: 'deals',
    label: t('entity.deal'),
    initial,
    onDone,
    defaults: (d) => ({
      owner_id: d?.owner_id ?? (isNew(d) ? myId : ''),
      title: d?.title ?? '',
      amount: d?.amount?.toString() ?? '',
      currency: d?.currency ?? 'USD',
      company_id: d?.company_id ?? '',
      contact_id: d?.contact_id ?? '',
      stage_id: d?.stage_id ?? firstOpen?.id ?? '',
      expected_close_date: d?.expected_close_date ?? '',
      priority: d?.priority ?? ('medium' as Priority),
      source: d?.source ?? '',
    }),
    toPayload: (f) => {
      if (!f.title.trim()) return t('validation.dealName')
      if (!f.stage_id) return t('validation.stage')
      return {
        ...f,
        owner_id: f.owner_id || null,
        title: f.title.trim(),
        amount: Number(f.amount) || 0,
        company_id: f.company_id || null,
        contact_id: f.contact_id || null,
        expected_close_date: f.expected_close_date || null,
        source: f.source || null,
      }
    },
  })

  const people = form.company_id ? contacts.filter((c) => c.company_id === form.company_id) : contacts

  return (
    <FormLayout onSubmit={submit} onCancel={() => onDone()} submitLabel={isEdit ? t('common.saveChanges') : t('dialog.new.deal')} busy={busy}>
      <TextField wide autoFocus label={t('fields.dealName')} value={form.title} onChange={(v) => set('title', v)} placeholder="Acme — Enterprise License" />
      <TextField label={t('fields.amount')} type="number" min={0} step={100} value={form.amount} onChange={(v) => set('amount', v)} placeholder="50000" />
      <SelectField label={t('fields.currency')} value={form.currency} onChange={(v) => set('currency', v)} options={toOptions(CURRENCIES)} />
      <SelectField
        label={t('fields.stage')}
        value={form.stage_id}
        onChange={(v) => set('stage_id', v)}
        options={stages.map((s) => ({ value: s.id, label: `${s.name} · ${s.probability}%` }))}
      />
      <SelectField label={t('fields.priority')} value={form.priority} onChange={(v) => set('priority', v as Priority)} options={PRIORITIES.map((p) => ({ value: p.value, label: t(`enums.priority.${p.value}`) }))} />
      <SelectField
        label={t('fields.company')}
        emptyLabel={t('fields.noCompany')}
        value={form.company_id}
        onChange={(v) => setForm((f) => ({ ...f, company_id: v, contact_id: '' }))}
        options={companies.map((c) => ({ value: c.id, label: c.name }))}
      />
      <SelectField label={t('fields.primaryContact')} emptyLabel={t('fields.noContact')} value={form.contact_id} onChange={(v) => set('contact_id', v)} options={people.map((c) => ({ value: c.id, label: fullName(c) }))} />
      <TextField label={t('fields.closeDate')} type="date" value={form.expected_close_date} onChange={(v) => set('expected_close_date', v)} />
      <SelectField label={t('fields.source')} emptyLabel="—" value={form.source} onChange={(v) => set('source', v)} options={toOptions(DEAL_SOURCES)} />
      <OwnerField module="deals" value={form.owner_id} onChange={(v) => set('owner_id', v)} />
    </FormLayout>
  )
}
