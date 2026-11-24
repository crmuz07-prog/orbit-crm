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
import { useCrm } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import { LIFECYCLES } from '@/lib/constants'

export default function CompaniesPage() {
  const { isLoading, companies } = useCrm()
  const openModal = useEntityModal()
  const { t } = useTranslation()
  const labels = useLabels()
  const [query, setQuery] = useState('')
  const [lifecycle, setLifecycle] = useState('')
  const [industry, setIndustry] = useState('')

  const industries = [...new Set(companies.map((c) => c.industry).filter((i): i is string => !!i))].sort()
  const filtered = companies.filter(
    (c) => (!lifecycle || c.lifecycle === lifecycle) && (!industry || c.industry === industry) && matches(query, c.name, c.domain, c.country),
  )
  const newCompany = <CreateButton module="companies" onClick={() => openModal({ kind: 'company' })}><Plus /> {t('companies.newCompany')}</CreateButton>

  if (isLoading) return <PageLoading title={t('companies.title')} />

  return (
    <Page
      title={t('companies.title')}
      description={t('companies.summary', { count: companies.length, customers: companies.filter((c) => c.lifecycle === 'customer').length })}
      actions={<><ExportButton table="companies" />{newCompany}</>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder={t('companies.search')} />
        <SelectBox value={lifecycle} onChange={setLifecycle} emptyLabel={t('companies.allLifecycle')} options={LIFECYCLES.map((l) => ({ value: l.value, label: t(`enums.lifecycle.${l.value}`) }))} className="w-48" />
        <SelectBox value={industry} onChange={setIndustry} emptyLabel={t('companies.allIndustries')} options={industries.map((i) => ({ value: i, label: labels.industry(i) }))} className="w-44" />
      </div>
      {companies.length === 0 ? (
        <Card><EmptyState icon={Building2} title={t('companies.empty')} description={t('companies.emptyDesc')} action={newCompany} /></Card>
      ) : <CompaniesTable companies={filtered} />}
    </Page>
  )
}
