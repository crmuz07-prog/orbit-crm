import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { CompanyLogo, PersonAvatar } from '@/components/common/avatars'
import { DataTable, type Column, type Selection } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { DealsCell, EmailCell, LastActivityCell, PhoneCell, TaskCell } from '@/features/people/cells'
import type { Rollup } from '@/features/people/useDealRollups'
import { useOwnerColumn } from '@/features/team/OwnerField'
import { useCrm } from '@/hooks/useData'
import { useLastActivity, type NextTask } from '@/hooks/useNextTasks'
import type { Contact } from '@/lib/types'
import { fullName, shortDate } from '@/lib/utils'

interface Props {
  contacts: Contact[]
  rollup: (id: string) => Rollup
  nextTask: (id: string) => NextTask
  selection: Selection
}

function useContactColumns({ rollup, nextTask }: Pick<Props, 'rollup' | 'nextTask'>): Column<Contact>[] {
  const owner = useOwnerColumn<Contact>()
  const { companyById } = useCrm()
  const last = useLastActivity('contact_id')
  const { t } = useTranslation()
  const company = (c: Contact) => (c.company_id ? companyById.get(c.company_id) : undefined)
  return [
    {
      key: 'name', header: t('contacts.colName'), sortValue: (c) => fullName(c),
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={fullName(c)} size="xs" />
          <div className="min-w-0">
            <p className="max-w-[220px] truncate font-medium">{fullName(c)}</p>
            {c.title && <p className="max-w-[220px] truncate text-[11px] text-muted-foreground">{c.title}</p>}
          </div>
        </div>
      ),
    },
    { key: 'phone', header: t('contacts.colPhone'), sortValue: (c) => c.phone ?? '', cell: (c) => <PhoneCell phone={c.phone} links={{ contact_id: c.id, ...(c.company_id ? { company_id: c.company_id } : {}) }} /> },
    { key: 'email', header: t('fields.email'), sortValue: (c) => c.email ?? '', cell: (c) => <EmailCell email={c.email} /> },
    {
      key: 'company', header: t('contacts.colCompany'), sortValue: (c) => company(c)?.name ?? '',
      cell: (c) => { const co = company(c); return co ? <span className="inline-flex items-center gap-1.5"><CompanyLogo name={co.name} size="xs" /> {co.name}</span> : '—' },
    },
    { key: 'deals', header: t('contacts.colOpen'), align: 'right', sortValue: (c) => rollup(c.id).openAmount, cell: (c) => <DealsCell count={rollup(c.id).open} amount={rollup(c.id).openAmount} /> },
    { key: 'task', header: t('deals.colTask'), sortValue: (c) => nextTask(c.id).task?.due_at ?? '9999', cell: (c) => <TaskCell next={nextTask(c.id)} /> },
    { key: 'last', header: t('people.colLast'), sortValue: (c) => last.get(c.id) ?? '', cell: (c) => <LastActivityCell at={last.get(c.id)} /> },
    owner,
    { key: 'created', header: t('contacts.colCreated'), sortValue: (c) => c.created_at, cell: (c) => <span className="text-muted-foreground">{shortDate(c.created_at)}</span> },
  ]
}

export function ContactsTable({ contacts, rollup, nextTask, selection }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <Card>
      <DataTable rows={contacts} columns={useContactColumns({ rollup, nextTask })} selection={selection} minWidth={980}
        onRowClick={(c) => navigate(`/contacts/${c.id}`)} empty={<EmptyState icon={Search} title={t('contacts.noMatch')} />} />
    </Card>
  )
}
