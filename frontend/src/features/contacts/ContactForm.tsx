import { useTranslation } from 'react-i18next'
import { FormLayout, SelectField, TextField } from '@/components/common/form-fields'
import { useCrm } from '@/hooks/useData'
import { isNew, OwnerField, useMyId } from '@/features/team/OwnerField'
import { useEntityForm } from '@/hooks/useEntityForm'
import type { Contact } from '@/lib/types'
import { blankToNull } from '@/lib/utils'

type Props = { initial?: Partial<Contact>; onDone: (row?: Contact) => void }

const EMAIL = /^\S+@\S+\.\S+$/

export function ContactForm({ initial, onDone }: Props) {
  const { companies } = useCrm()
  const { t } = useTranslation()
  const myId = useMyId()
  const { form, set, submit, isEdit, busy } = useEntityForm({
    table: 'contacts',
    label: t('entity.contact'),
    initial,
    onDone,
    defaults: (c) => ({
      owner_id: c?.owner_id ?? (isNew(c) ? myId : ''),
      first_name: c?.first_name ?? '',
      last_name: c?.last_name ?? '',
      email: c?.email ?? '',
      phone: c?.phone ?? '',
      title: c?.title ?? '',
      company_id: c?.company_id ?? '',
      linkedin_url: c?.linkedin_url ?? '',
    }),
    toPayload: (f) => {
      if (!f.first_name.trim()) return t('validation.firstName')
      if (f.email && !EMAIL.test(f.email)) return t('validation.email')
      return {
        owner_id: f.owner_id || null,
        first_name: f.first_name.trim(),
        last_name: f.last_name.trim(),
        email: blankToNull(f.email),
        phone: blankToNull(f.phone),
        title: blankToNull(f.title),
        company_id: f.company_id || null,
        linkedin_url: blankToNull(f.linkedin_url),
      }
    },
  })

  return (
    <FormLayout onSubmit={submit} onCancel={() => onDone()} submitLabel={isEdit ? t('common.saveChanges') : t('dialog.new.contact')} busy={busy}>
      <TextField autoFocus label={t('fields.firstName')} value={form.first_name} onChange={(v) => set('first_name', v)} />
      <TextField label={t('fields.lastName')} value={form.last_name} onChange={(v) => set('last_name', v)} />
      <TextField label={t('fields.email')} type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="name@company.com" />
      <TextField label={t('fields.phone')} value={form.phone} onChange={(v) => set('phone', v)} />
      <TextField label={t('fields.jobTitle')} value={form.title} onChange={(v) => set('title', v)} placeholder="Head of Procurement" />
      <SelectField label={t('fields.company')} emptyLabel={t('fields.noCompany')} value={form.company_id} onChange={(v) => set('company_id', v)} options={companies.map((c) => ({ value: c.id, label: c.name }))} />
      <TextField wide label={t('fields.linkedin')} value={form.linkedin_url} onChange={(v) => set('linkedin_url', v)} placeholder="https://linkedin.com/in/…" />
      <OwnerField module="contacts" value={form.owner_id} onChange={(v) => set('owner_id', v)} />
    </FormLayout>
  )
}
