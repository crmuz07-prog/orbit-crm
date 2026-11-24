import { useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import { Page } from '@/components/common/page'
import { CreateButton, ExportButton } from '@/components/common/record-actions'
import { matches, SearchInput } from '@/components/common/search-input'
import { EmptyState, PageLoading } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { CompaniesTable } from '@/features/companies/CompaniesTable'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { BulkBar } from '@/features/people/BulkBar'
import { PeopleTabs } from '@/features/people/PeopleTabs'
import { useDealRollups } from '@/features/people/useDealRollups'
import { usePeopleFilters } from '@/features/people/usePeopleFilters'
import { useCrm } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import { LIFECYCLES } from '@/lib/constants'
import type { Company } from '@/lib/types'

export default function CompaniesPage() {
  const { isLoading, companies } = useCrm()
  const openModal = useEntityModal()
  const { t } = useTranslation()
  const labels = useLabels()
  const [query, setQuery] = useState('')
  const [lifecycle, setLifecycle] = useState('')
  const [industry, setIndustry] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const rollup = useDealRollups('company_id')
  const filters = usePeopleFilters<Company>('company_id', (c) => rollup(c.id).open, lifecycle || industry ? 1 : 0)

  const industries = [...new Set(companies.map((c) => c.industry).filter((i): i is string => !!i))].sort()
  const filtered = companies.filter(
    (c) => (!lifecycle || c.lifecycle === lifecycle) && (!industry || c.industry === industry) && filters.apply(c) && matches(query, c.name, c.domain, c.city, c.country),
  )
  const newCompany = <CreateButton module="companies" onClick={() => openModal({ kind: 'company' })}><Plus /> {t('companies.newCompany')}</CreateButton>

  if (isLoading) return <PageLoading title={t('companies.title')} />

  return (
    <Page title={t('people.section')} description={t('people.shown', { shown: filtered.length, total: companies.length })} actions={<><ExportButton table="companies" />{newCompany}</>}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <PeopleTabs />
        <SearchInput value={query} onChange={setQuery} placeholder={t('companies.search')} />
        <SelectBox value={lifecycle} onChange={setLifecycle} emptyLabel={t('companies.allLifecycle')} options={LIFECYCLES.map((l) => ({ value: l.value, label: t(`enums.lifecycle.${l.value}`) }))} className="w-36" />
        <SelectBox value={industry} onChange={setIndustry} emptyLabel={t('companies.allIndustries')} options={industries.map((i) => ({ value: i, label: labels.industry(i) }))} className="w-36" />
        {filters.controls(() => { setLifecycle(''); setIndustry('') })}
      </div>
      <BulkBar table="companies" selected={selected} onClear={() => setSelected(new Set())} />
      {companies.length === 0 ? (
        <Card><EmptyState icon={Building2} title={t('companies.empty')} description={t('companies.emptyDesc')} action={newCompany} /></Card>
      ) : <CompaniesTable companies={filtered} rollup={rollup} nextTask={filters.nextTask} selection={{ selected, onChange: setSelected }} />}
    </Page>
  )
}
