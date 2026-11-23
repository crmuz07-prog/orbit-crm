import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { CompanyLogo, PersonAvatar } from '@/components/common/avatars'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { useCrm } from '@/hooks/useData'
import { dealStatus } from '@/lib/metrics'
import type { Contact } from '@/lib/types'
import { fullName, money, shortDate } from '@/lib/utils'

function useOpenPipelineByContact() {
  const { deals, stageById } = useCrm()
  return useMemo(() => {
    const map = new Map<string, number>()
    for (const d of deals) {
      if (d.contact_id && dealStatus(d, stageById) === 'open') map.set(d.contact_id, (map.get(d.contact_id) ?? 0) + d.amount)
    }
    return map
  }, [deals, stageById])
}

function useContactColumns(): Column<Contact>[] {
  const { companyById } = useCrm()
  const open = useOpenPipelineByContact()
  const { t } = useTranslation()
  const company = (c: Contact) => (c.company_id ? companyById.get(c.company_id) : undefined)
  return [
    {
      key: 'name',
      header: t('contacts.colName'),
      sortValue: (c) => fullName(c),
      cell: (c) => (
        <div className="flex items-center gap-3">
          <PersonAvatar name={fullName(c)} />
          <div>
            <p className="font-medium">{fullName(c)}</p>
            <p className="text-xs text-muted-foreground">{c.email ?? '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'title', header: t('contacts.colTitle'), sortValue: (c) => c.title ?? '', cell: (c) => c.title ?? '—' },
    {
      key: 'company',
      header: t('contacts.colCompany'),
      sortValue: (c) => company(c)?.name ?? '',
      cell: (c) => {
        const co = company(c)
        return co ? <span className="inline-flex items-center gap-2"><CompanyLogo name={co.name} size="xs" className="rounded" /> {co.name}</span> : '—'
      },
    },
    { key: 'phone', header: t('contacts.colPhone'), cell: (c) => c.phone ?? '—' },
    { key: 'open', header: t('contacts.colOpen'), align: 'right', sortValue: (c) => open.get(c.id) ?? 0, cell: (c) => money(open.get(c.id) ?? 0) },
    { key: 'created', header: t('contacts.colCreated'), sortValue: (c) => c.created_at, cell: (c) => <span className="text-muted-foreground">{shortDate(c.created_at)}</span> },
  ]
}

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <Card>
      <DataTable rows={contacts} columns={useContactColumns()} onRowClick={(c) => navigate(`/contacts/${c.id}`)} empty={<EmptyState icon={Search} title={t('contacts.noMatch')} />} />
    </Card>
  )
}
