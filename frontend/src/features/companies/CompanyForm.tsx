import { useTranslation } from 'react-i18next'
import { FormLayout, SelectField, TextareaField, TextField, toOptions } from '@/components/common/form-fields'
import { isNew, OwnerField, useMyId } from '@/features/team/OwnerField'
import { useEntityForm } from '@/hooks/useEntityForm'
import { EMPLOYEE_RANGES, INDUSTRIES, LIFECYCLES } from '@/lib/constants'
import type { Company, Lifecycle } from '@/lib/types'
import { blankToNull } from '@/lib/utils'

type Props = { initial?: Partial<Company>; onDone: (row?: Company) => void }

export function CompanyForm({ initial, onDone }: Props) {
  const { t } = useTranslation()
  const myId = useMyId()
  const { form, set, submit, isEdit, busy } = useEntityForm({
    table: 'companies',
    label: t('entity.company'),
    initial,
    onDone,
    defaults: (c) => ({
      owner_id: c?.owner_id ?? (isNew(c) ? myId : ''),
      name: c?.name ?? '',
      domain: c?.domain ?? '',
      industry: c?.industry ?? '',
      employees: c?.employees ?? '',
      country: c?.country ?? '',
      city: c?.city ?? '',
      annual_revenue: c?.annual_revenue?.toString() ?? '',
      lifecycle: c?.lifecycle ?? ('lead' as Lifecycle),
      description: c?.description ?? '',
    }),
    toPayload: (f) => {
      if (!f.name.trim()) return t('validation.companyName')
      return {
        owner_id: f.owner_id || null,
        name: f.name.trim(),
        domain: blankToNull(f.domain.replace(/^https?:\/\//, '')),
        industry: blankToNull(f.industry),
        employees: blankToNull(f.employees),
        country: blankToNull(f.country),
        city: blankToNull(f.city),
        annual_revenue: f.annual_revenue ? Number(f.annual_revenue) : null,
        lifecycle: f.lifecycle,
        description: blankToNull(f.description),
      }
    },
  })

  return (
    <FormLayout onSubmit={submit} onCancel={() => onDone()} submitLabel={isEdit ? t('common.saveChanges') : t('dialog.new.company')} busy={busy}>
      <TextField wide autoFocus label={t('fields.companyName')} value={form.name} onChange={(v) => set('name', v)} placeholder="Acme Inc." />
      <TextField label={t('fields.domain')} value={form.domain} onChange={(v) => set('domain', v)} placeholder="acme.com" />
      <SelectField label={t('fields.lifecycle')} value={form.lifecycle} onChange={(v) => set('lifecycle', v as Lifecycle)} options={LIFECYCLES.map((l) => ({ value: l.value, label: t(`enums.lifecycle.${l.value}`) }))} />
      <SelectField label={t('fields.industry')} emptyLabel="—" value={form.industry} onChange={(v) => set('industry', v)} options={toOptions(INDUSTRIES)} />
      <SelectField label={t('fields.employees')} emptyLabel="—" value={form.employees} onChange={(v) => set('employees', v)} options={toOptions(EMPLOYEE_RANGES)} />
      <TextField label={t('fields.country')} value={form.country} onChange={(v) => set('country', v)} placeholder="Germany" />
      <TextField label={t('fields.city')} value={form.city} onChange={(v) => set('city', v)} placeholder="Berlin" />
      <TextField wide label={t('fields.revenue')} type="number" min={0} value={form.annual_revenue} onChange={(v) => set('annual_revenue', v)} />
      <TextareaField label={t('fields.description')} value={form.description} onChange={(v) => set('description', v)} />
      <OwnerField module="companies" value={form.owner_id} onChange={(v) => set('owner_id', v)} />
    </FormLayout>
  )
}
