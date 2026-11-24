import { useTranslation } from 'react-i18next'
import { LifecycleBadge } from '@/features/companies/LifecycleBadge'
import { useCrm } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import { EMPLOYEE_RANGES, LIFECYCLES } from '@/lib/constants'
import type { Company, Contact } from '@/lib/types'
import { money, shortDate } from '@/lib/utils'
import { InlineField } from './InlineField'
import { OwnerRow } from './OwnerRow'
import { InfoSection } from './RecordCard'
import { RecordDraftProvider } from './RecordDraft'
import { useSaveField } from './useSaveField'

const list = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }))

export function CompanyInfo({ company }: { company: Company }) {
  const { t } = useTranslation()
  const { save, readOnly } = useSaveField('companies')
  const labels = useLabels()
  const text = (field: 'domain' | 'country' | 'city', label: string) => (
    <InlineField label={label} raw={company[field] ?? ''} editor={{ kind: 'text' }} readOnly={readOnly} toPatch={save(field)} />
  )
  return (
    <RecordDraftProvider table="companies" record={company}>
    <InfoSection title={t('card.main')}>
      <OwnerRow module="companies" ownerId={company.owner_id} readOnly={readOnly} toPatch={save('owner_id')} />
      <InlineField label={t('feedFields.lifecycle')} raw={company.lifecycle} display={<LifecycleBadge value={company.lifecycle} />} readOnly={readOnly}
        editor={{ kind: 'select', options: LIFECYCLES.map((l) => ({ value: l.value, label: t(`enums.lifecycle.${l.value}`) })) }} toPatch={save('lifecycle')} />
      {text('domain', t('feedFields.domain'))}
      <InlineField label={t('feedFields.industry')} raw={company.industry ?? ''} display={labels.industry(company.industry)} editor={{ kind: 'select', options: labels.industryOptions, emptyLabel: '—' }} readOnly={readOnly} toPatch={save('industry')} />
      <InlineField label={t('feedFields.employees')} raw={company.employees ?? ''} editor={{ kind: 'select', options: list(EMPLOYEE_RANGES), emptyLabel: '—' }} readOnly={readOnly} toPatch={save('employees')} />
      {text('country', t('feedFields.country'))}
      {text('city', t('feedFields.city'))}
      <InlineField label={t('feedFields.annual_revenue')} raw={company.annual_revenue?.toString() ?? ''} display={company.annual_revenue != null && money(company.annual_revenue, undefined, true)}
        editor={{ kind: 'number' }} readOnly={readOnly} toPatch={save('annual_revenue', 'number')} />
      <InlineField label={t('feedFields.description')} raw={company.description ?? ''} editor={{ kind: 'textarea' }} readOnly={readOnly} toPatch={save('description')} />
      <p className="mt-3 text-xs text-muted-foreground">{t('companies.created')}: {shortDate(company.created_at)}</p>
    </InfoSection>
    </RecordDraftProvider>
  )
}

export function ContactInfo({ contact }: { contact: Contact }) {
  const { t } = useTranslation()
  const { companies, companyById } = useCrm()
  const { save, readOnly } = useSaveField('contacts')
  const row = (field: 'first_name' | 'last_name' | 'title' | 'email' | 'phone' | 'linkedin_url', label: string, kind: 'text' | 'email' | 'tel' = 'text') => (
    <InlineField label={label} raw={contact[field] ?? ''} editor={{ kind }} readOnly={readOnly} toPatch={save(field)} />
  )
  return (
    <RecordDraftProvider table="contacts" record={contact}>
    <InfoSection title={t('card.main')}>
      <OwnerRow module="contacts" ownerId={contact.owner_id} readOnly={readOnly} toPatch={save('owner_id')} />
      {row('phone', t('feedFields.phone'), 'tel')}
      {row('email', t('feedFields.email'), 'email')}
      <InlineField label={t('feedFields.company_id')} raw={contact.company_id ?? ''} display={contact.company_id && companyById.get(contact.company_id)?.name} readOnly={readOnly}
        editor={{ kind: 'select', options: companies.map((c) => ({ value: c.id, label: c.name })), emptyLabel: '—' }} toPatch={save('company_id')} />
      {row('title', t('feedFields.title_job'))}
      {row('first_name', t('feedFields.first_name'))}
      {row('last_name', t('feedFields.last_name'))}
      {row('linkedin_url', t('feedFields.linkedin_url'))}
      <p className="mt-3 text-xs text-muted-foreground">{t('contacts.colCreated')}: {shortDate(contact.created_at)}</p>
    </InfoSection>
    </RecordDraftProvider>
  )
}
