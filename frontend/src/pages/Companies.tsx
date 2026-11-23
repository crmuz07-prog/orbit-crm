import { useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SelectBox, toOptions } from '@/components/common/form-fields'
import { Page } from '@/components/common/page'
import { matches, SearchInput } from '@/components/common/search-input'
import { EmptyState, PageSkeleton } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CompaniesTable } from '@/features/companies/CompaniesTable'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useCrm } from '@/hooks/useData'
import { LIFECYCLES } from '@/lib/constants'

export default function CompaniesPage() {
  const { isLoading, companies } = useCrm()
  const openModal = useEntityModal()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [lifecycle, setLifecycle] = useState('')
  const [industry, setIndustry] = useState('')

  const industries = [...new Set(companies.map((c) => c.industry).filter((i): i is string => !!i))].sort()
  const filtered = companies.filter(
    (c) => (!lifecycle || c.lifecycle === lifecycle) && (!industry || c.industry === industry) && matches(query, c.name, c.domain, c.country),
  )
  const newCompany = <Button onClick={() => openModal({ kind: 'company' })}><Plus /> {t('companies.newCompany')}</Button>

  if (isLoading) return <PageSkeleton />

  return (
    <Page
      title={t('companies.title')}
      description={t('companies.summary', { count: companies.length, customers: companies.filter((c) => c.lifecycle === 'customer').length })}
      actions={newCompany}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder={t('companies.search')} />
        <SelectBox value={lifecycle} onChange={setLifecycle} emptyLabel={t('companies.allLifecycle')} options={LIFECYCLES.map((l) => ({ value: l.value, label: t(`enums.lifecycle.${l.value}`) }))} className="w-48" />
        <SelectBox value={industry} onChange={setIndustry} emptyLabel={t('companies.allIndustries')} options={toOptions(industries)} className="w-44" />
      </div>
      {companies.length === 0 ? (
        <Card><EmptyState icon={Building2} title={t('companies.empty')} description={t('companies.emptyDesc')} action={newCompany} /></Card>
      ) : <CompaniesTable companies={filtered} />}
    </Page>
  )
}
