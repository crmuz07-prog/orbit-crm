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
import { useCrm } from '@/hooks/useData'
import { fullName } from '@/lib/utils'

export default function ContactsPage() {
  const { isLoading, contacts, companies } = useCrm()
  const openModal = useEntityModal()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [companyId, setCompanyId] = useState('')

  const filtered = contacts.filter((c) => (!companyId || c.company_id === companyId) && matches(query, fullName(c), c.email, c.title))
  const newContact = <CreateButton module="contacts" onClick={() => openModal({ kind: 'contact' })}><Plus /> {t('contacts.newContact')}</CreateButton>

  if (isLoading) return <PageLoading title={t('contacts.title')} />

  return (
    <Page title={t('contacts.title')} description={t('contacts.summary', { people: contacts.length, companies: companies.length })} actions={<><ExportButton table="contacts" />{newContact}</>}>
      <div className="mb-3 flex flex-wrap gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder={t('contacts.search')} />
        <SelectBox value={companyId} onChange={setCompanyId} emptyLabel={t('contacts.allCompanies')} options={companies.map((c) => ({ value: c.id, label: c.name }))} className="w-48" />
      </div>
      {contacts.length === 0 ? (
        <Card><EmptyState icon={Users} title={t('contacts.empty')} description={t('contacts.emptyDesc')} action={newContact} /></Card>
      ) : <ContactsTable contacts={filtered} />}
    </Page>
  )
}
