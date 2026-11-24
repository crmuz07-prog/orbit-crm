import { useTranslation } from 'react-i18next'
import { PriorityFlag } from '@/features/deals/bits'
import { useAssignableOwners, useMembers } from '@/features/team/useMembers'
import { useCrm } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import { PRIORITIES } from '@/lib/constants'
import type { Deal } from '@/lib/types'
import { fullName, money, shortDate, timeAgo } from '@/lib/utils'
import { InfoSection } from './RecordCard'
import { InlineField } from './InlineField'
import { useSaveField } from './useSaveField'

/** The "Main" properties of a deal, each editable in place (amoCRM deal card). */
export function DealInfo({ deal, lost }: { deal: Deal; lost: boolean }) {
  const { t } = useTranslation()
  const { companies, contacts, companyById, contactById } = useCrm()
  const { owners, allowUnassigned } = useAssignableOwners('deals')
  const { memberById } = useMembers()
  const { save, readOnly } = useSaveField('deals', deal.id)
  const labels = useLabels()
  const company = deal.company_id ? companyById.get(deal.company_id) : undefined
  const contact = deal.contact_id ? contactById.get(deal.contact_id) : undefined
  const people = deal.company_id ? contacts.filter((c) => c.company_id === deal.company_id) : contacts

  return (
    <InfoSection title={t('card.main')}>
      <InlineField label={t('feedFields.owner_id')} raw={deal.owner_id ?? ''} display={deal.owner_id && memberById.get(deal.owner_id)?.full_name} readOnly={readOnly}
        editor={{ kind: 'select', options: owners.map((m) => ({ value: m.user_id, label: m.full_name })), emptyLabel: allowUnassigned ? t('owner.unassigned') : undefined }}
        onSave={save('owner_id')} />
      <InlineField label={t('feedFields.amount')} raw={String(deal.amount || '')} display={money(deal.amount, deal.currency)} editor={{ kind: 'number' }} readOnly={readOnly} onSave={save('amount', 'number')} />
      <InlineField label={t('feedFields.company_id')} raw={deal.company_id ?? ''} display={company?.name} readOnly={readOnly}
        editor={{ kind: 'select', options: companies.map((c) => ({ value: c.id, label: c.name })), emptyLabel: '—' }} onSave={save('company_id')} />
      <InlineField label={t('feedFields.contact_id')} raw={deal.contact_id ?? ''} display={contact && fullName(contact)} readOnly={readOnly}
        editor={{ kind: 'select', options: people.map((c) => ({ value: c.id, label: fullName(c) })), emptyLabel: '—' }} onSave={save('contact_id')} />
      <InlineField label={t('feedFields.priority')} raw={deal.priority} display={<PriorityFlag priority={deal.priority} withLabel />} readOnly={readOnly}
        editor={{ kind: 'select', options: PRIORITIES.map((p) => ({ value: p.value, label: t(`enums.priority.${p.value}`) })) }} onSave={save('priority')} />
      <InlineField label={t('feedFields.source')} raw={deal.source ?? ''} display={labels.source(deal.source)} readOnly={readOnly}
        editor={{ kind: 'select', options: labels.sourceOptions, emptyLabel: '—' }} onSave={save('source')} />
      <InlineField label={t('feedFields.expected_close_date')} raw={deal.expected_close_date ?? ''} display={deal.expected_close_date && shortDate(deal.expected_close_date)}
        editor={{ kind: 'date' }} readOnly={readOnly} onSave={save('expected_close_date')} />
      {lost && <InlineField label={t('feedFields.lost_reason')} raw={deal.lost_reason ?? ''} editor={{ kind: 'textarea' }} readOnly={readOnly} onSave={save('lost_reason')} />}
      <p className="mt-3 text-xs text-muted-foreground">{t('deals.created')}: {shortDate(deal.created_at)} · {t('deals.lastUpdate')}: {timeAgo(deal.updated_at)}</p>
    </InfoSection>
  )
}
