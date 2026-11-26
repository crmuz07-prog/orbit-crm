import { Building2, Pencil, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { PersonAvatar } from '@/components/common/avatars'
import { BackLink, RowLink } from '@/components/common/record'
import { DeleteRecordButton, RecordNotFound } from '@/components/common/record-actions'
import { RecordSkeleton } from '@/components/common/states'
import { LinkedDeals } from '@/features/deals/LinkedDeals'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { CompanyInfo } from '@/features/record/ClientInfo'
import { LinkedSection } from '@/features/record/LinkedSection'
import { InfoHeader, RecordCard } from '@/features/record/RecordCard'
import { useCrm } from '@/hooks/useData'
import { dealStatus, sumAmount } from '@/lib/metrics'
import { fullName, money } from '@/lib/utils'
import { IconButton } from '@/components/common/icon-button'

/** Everything associated with a company: its people, deals and their activity roll-up. */
function useCompanyRecord(id: string) {
  const { contacts, deals, activities, stageById } = useCrm()
  const people = contacts.filter((c) => c.company_id === id)
  const companyDeals = deals.filter((d) => d.company_id === id)
  const dealIds = new Set(companyDeals.map((d) => d.id))
  const peopleIds = new Set(people.map((c) => c.id))
  const related = activities.filter((a) => a.company_id === id || (a.deal_id && dealIds.has(a.deal_id)) || (a.contact_id && peopleIds.has(a.contact_id)))
  const valueOf = (status: string) => sumAmount(companyDeals.filter((d) => dealStatus(d, stageById) === status))
  return { people, companyDeals, related, openValue: valueOf('open'), wonValue: valueOf('won') }
}

export default function CompanyDetailPage() {
  const { id = '' } = useParams()
  const { isLoading, companyById } = useCrm()
  const openModal = useEntityModal()
  const { people, companyDeals, related, openValue, wonValue } = useCompanyRecord(id)
  const { t } = useTranslation()

  if (isLoading) return <RecordSkeleton />
  const company = companyById.get(id)
  if (!company) return <RecordNotFound icon={Building2} label={t('entity.company')} backTo="/companies" />

  const addDeal = () => openModal({ kind: 'deal', initial: { company_id: id } })
  const addContact = () => openModal({ kind: 'contact', initial: { company_id: id } })

  return (
    <RecordCard
      link="company_id"
      recordId={id}
      activities={related}
      links={{ company_id: id }}
      info={
        <>
          <InfoHeader back={<BackLink to="/companies" label={t('nav.companies')} />} title={company.name} shortId={id.slice(0, 8).toUpperCase()}
            actions={
              <>
                <IconButton label={t('calls.logCall')} onClick={() => openModal({ kind: 'call', initial: { company_id: id } })}><Phone className="text-emerald-500" /></IconButton>
                <IconButton label={t('common.edit')} onClick={() => openModal({ kind: 'company', initial: company })}><Pencil /></IconButton>
                <DeleteRecordButton table="companies" id={id} title={t('companies.deleteTitle', { name: company.name })} description={t('companies.deleteDesc')} redirectTo="/companies" />
              </>
            }>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="glass-subtle rounded-lg px-3 py-2"><p className="text-xs text-muted-foreground">{t('companies.openPipeline')}</p><p className="font-semibold tabular-nums">{money(openValue)}</p></div>
              <div className="glass-subtle rounded-lg px-3 py-2"><p className="text-xs text-muted-foreground">{t('companies.wonRevenue')}</p><p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{money(wonValue)}</p></div>
            </div>
          </InfoHeader>
          <CompanyInfo company={company} />
          <LinkedDeals deals={companyDeals} onAdd={addDeal} />
          <LinkedSection
            title={t('companies.people', { count: people.length })}
            addLabel={t('common.add')}
            onAdd={addContact}
            items={people}
            empty={t('companies.noPeople')}
            render={(c) => (
              <RowLink dense to={`/contacts/${c.id}`}>
                <PersonAvatar name={fullName(c)} size="xs" />
                <span className="min-w-0 flex-1 truncate text-[13px]">
                  <span className="font-medium">{fullName(c)}</span>
                  {(c.title ?? c.phone ?? c.email) && <span className="text-muted-foreground"> · {c.title ?? c.phone ?? c.email}</span>}
                </span>
              </RowLink>
            )}
          />
        </>
      }
    />
  )
}
