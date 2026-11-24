import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import { Page } from '@/components/common/page'
import { CreateButton, ExportButton } from '@/components/common/record-actions'
import { matches, SearchInput } from '@/components/common/search-input'
import { EmptyState, PageLoading } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { ContactsTable } from '@/features/contacts/ContactsTable'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { BulkBar } from '@/features/people/BulkBar'
import { PeopleTabs } from '@/features/people/PeopleTabs'
import { useDealRollups } from '@/features/people/useDealRollups'
import { usePeopleFilters } from '@/features/people/usePeopleFilters'
import { useCrm } from '@/hooks/useData'
import type { Contact } from '@/lib/types'
import { fullName } from '@/lib/utils'

export default function ContactsPage() {
  const { isLoading, contacts, companies } = useCrm()
  const openModal = useEntityModal()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const rollup = useDealRollups('contact_id')
  const filters = usePeopleFilters<Contact>('contact_id', (c) => rollup(c.id).open, companyId ? 1 : 0)

  const filtered = contacts.filter((c) => (!companyId || c.company_id === companyId) && filters.apply(c) && matches(query, fullName(c), c.email, c.phone, c.title))
  const newContact = <CreateButton module="contacts" onClick={() => openModal({ kind: 'contact' })}><Plus /> {t('contacts.newContact')}</CreateButton>

  if (isLoading) return <PageLoading title={t('contacts.title')} />

  return (
    <Page title={t('people.section')} description={t('people.shown', { shown: filtered.length, total: contacts.length })} actions={<><ExportButton table="contacts" />{newContact}</>}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <PeopleTabs />
        <SearchInput value={query} onChange={setQuery} placeholder={t('contacts.search')} />
        <SelectBox value={companyId} onChange={setCompanyId} emptyLabel={t('contacts.allCompanies')} options={companies.map((c) => ({ value: c.id, label: c.name }))} className="w-48" />
        {filters.controls(() => setCompanyId(''))}
      </div>
      <BulkBar table="contacts" selected={selected} onClear={() => setSelected(new Set())} />
      {contacts.length === 0 ? (
        <Card><EmptyState icon={Users} title={t('contacts.empty')} description={t('contacts.emptyDesc')} action={newContact} /></Card>
      ) : <ContactsTable contacts={filtered} rollup={rollup} nextTask={filters.nextTask} selection={{ selected, onChange: setSelected }} />}
    </Page>
  )
}
