import { Building2, ExternalLink, Pencil, Phone, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { CompanyLogo, PersonAvatar } from '@/components/common/avatars'
import { BackLink, ListCard, PropertyList, RecordHeader, RecordLayout, RowLink, StatStrip } from '@/components/common/record'
import { DeleteRecordButton, RecordNotFound } from '@/components/common/record-actions'
import { PageSkeleton } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { Composer } from '@/features/activities/Composer'
import { Timeline } from '@/features/activities/Timeline'
import { LifecycleBadge } from '@/features/companies/LifecycleBadge'
import { DealsListCard } from '@/features/deals/DealsListCard'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useCrm } from '@/hooks/useData'
import { dealStatus, sumAmount } from '@/lib/metrics'
import { fullName, money, shortDate, timeAgo } from '@/lib/utils'

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

  if (isLoading) return <PageSkeleton />
  const company = companyById.get(id)
  if (!company) return <RecordNotFound icon={Building2} label={t('entity.company')} backTo="/companies" />

  const location = [company.city, company.country].filter(Boolean).join(', ')
  const addDeal = () => openModal({ kind: 'deal', initial: { company_id: id } })
  const addContact = () => openModal({ kind: 'contact', initial: { company_id: id } })

  return (
    <>
      <BackLink to="/companies" label={t('nav.companies')} />
      <RecordHeader
        media={<CompanyLogo name={company.name} size="lg" className="rounded-xl" />}
        title={company.name}
        badge={<LifecycleBadge value={company.lifecycle} />}
        subtitle={
          <>
            {company.domain && <a href={`https://${company.domain}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">{company.domain} <ExternalLink className="size-3" /></a>}
            {[company.industry, location].filter(Boolean).map((t) => <span key={t}>· {t}</span>)}
          </>
        }
        actions={
          <>
            <Button onClick={addDeal}><Plus /> {t('entity.deal')}</Button>
            <Button variant="outline" onClick={addContact}><Plus /> {t('entity.contact')}</Button>
            <Button variant="outline" onClick={() => openModal({ kind: 'call', initial: { company_id: id } })}><Phone /> {t('calls.logCall')}</Button>
            <Button variant="outline" onClick={() => openModal({ kind: 'company', initial: company })}><Pencil /> {t('common.edit')}</Button>
            <DeleteRecordButton table="companies" id={id} title={t('companies.deleteTitle', { name: company.name })} description={t('companies.deleteDesc')} redirectTo="/companies" />
          </>
        }
      />
      <StatStrip stats={[[t('companies.openPipeline'), money(openValue)], [t('companies.wonRevenue'), money(wonValue)], [t('companies.contacts'), people.length], [t('companies.lastActivity'), related[0] ? timeAgo(related[0].created_at) : '—']]} />
      <RecordLayout
        side={
          <>
            <PropertyList
              title={t('companies.about')}
              items={[
                [t('fields.industry'), company.industry],
                [t('fields.employees'), company.employees],
                [t('fields.revenue'), company.annual_revenue && money(company.annual_revenue, 'USD', true)],
                [t('companies.location'), location],
                [t('companies.created'), shortDate(company.created_at)],
                [t('fields.description'), company.description],
              ]}
            />
            <ListCard
              title={t('companies.people', { count: people.length })}
              action={<Button size="sm" variant="ghost" onClick={addContact}><Plus /> {t('common.add')}</Button>}
              items={people}
              empty={<p className="px-5 py-4 text-sm text-muted-foreground">{t('companies.noPeople')}</p>}
              render={(c) => (
                <RowLink to={`/contacts/${c.id}`}>
                  <PersonAvatar name={fullName(c)} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{fullName(c)}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.title ?? c.email}</p>
                  </div>
                </RowLink>
              )}
            />
          </>
        }
        main={
          <>
            <DealsListCard deals={companyDeals} onAdd={addDeal} />
            <Composer links={{ company_id: id }} />
            <Timeline activities={related} showDeal />
          </>
        }
      />
    </>
  )
}
