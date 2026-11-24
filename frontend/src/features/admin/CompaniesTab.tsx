import { useState } from 'react'
import { Building2, Pencil, Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CompanyLogo } from '@/components/common/avatars'
import { DataTable, type Column } from '@/components/common/data-table'
import { matches, SearchInput } from '@/components/common/search-input'
import { EmptyState } from '@/components/common/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Company } from '@/lib/types'
import { shortDate } from '@/lib/utils'
import { CreateCompanyDialog, RenameCompanyDialog } from './CompanyDialogs'
import type { AdminActions } from './useAdmin'

function useColumns(onRename: (c: Company) => void): Column<Company>[] {
  const { t } = useTranslation()
  return [
    {
      key: 'name', header: t('admin.company'), sortValue: (c) => c.name,
      cell: (c) => (
        <div className="flex items-center gap-3">
          <CompanyLogo name={c.name} />
          <span className="font-medium">{c.name}</span>
          {c.is_demo && <Badge tone="amber">Demo</Badge>}
        </div>
      ),
    },
    { key: 'owners', header: t('admin.owner'), cell: (c) => <span className="text-muted-foreground">{c.owners.join(', ') || '—'}</span> },
    { key: 'members', header: t('team.title'), align: 'right', sortValue: (c) => c.member_count, cell: (c) => t('admin.members', { count: c.member_count }) },
    { key: 'created', header: t('admin.created'), sortValue: (c) => c.created_at, cell: (c) => <span className="text-muted-foreground">{shortDate(c.created_at)}</span> },
    { key: 'actions', header: '', align: 'right', cell: (c) => <Button variant="ghost" size="icon" onClick={() => onRename(c)} aria-label={t('admin.rename')}><Pencil /></Button> },
  ]
}

export function CompaniesTab({ actions }: { actions: AdminActions }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<Company | null>(null)
  const columns = useColumns(setRenaming)
  const companies = (actions.companies.data ?? []).filter((c) => matches(query, c.name, ...c.owners))

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder={t('admin.search')} />
        <Button className="ml-auto" onClick={() => setCreating(true)}><Plus /> {t('admin.newCompany')}</Button>
      </div>
      <Card>
        {actions.companies.data?.length === 0 ? (
          <EmptyState icon={Building2} title={t('admin.emptyCompanies')} action={<Button onClick={() => setCreating(true)}><Plus /> {t('admin.newCompany')}</Button>} />
        ) : (
          <DataTable rows={companies} columns={columns} empty={<EmptyState icon={Search} title={t('common.noResults')} />} />
        )}
      </Card>
      <CreateCompanyDialog open={creating} onOpenChange={setCreating} create={actions.createCompany} />
      <RenameCompanyDialog company={renaming} onClose={() => setRenaming(null)} rename={actions.renameCompany} />
    </>
  )
}
