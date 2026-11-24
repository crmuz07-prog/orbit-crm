import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { CompanyLogo } from '@/components/common/avatars'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { useOwnerColumn } from '@/features/team/OwnerField'
import { useCrm } from '@/hooks/useData'
import { LIFECYCLES } from '@/lib/constants'
import { dealStatus } from '@/lib/metrics'
import type { Company } from '@/lib/types'
import { money, shortDate } from '@/lib/utils'
import { LifecycleBadge } from './LifecycleBadge'

type Rollup = { contacts: number; open: number; won: number }

/** Per-company roll-ups of contacts and pipeline (HubSpot association metrics). */
function useCompanyRollups() {
  const { contacts, deals, stageById } = useCrm()
  return useMemo(() => {
    const map = new Map<string, Rollup>()
    const get = (id: string) => map.get(id) ?? map.set(id, { contacts: 0, open: 0, won: 0 }).get(id)!
    contacts.forEach((c) => c.company_id && get(c.company_id).contacts++)
    deals.forEach((d) => {
      const status = d.company_id && dealStatus(d, stageById)
      if (status === 'open') get(d.company_id!).open += d.amount
      if (status === 'won') get(d.company_id!).won += d.amount
    })
    return map
  }, [contacts, deals, stageById])
}

function useCompanyColumns(): Column<Company>[] {
  const owner = useOwnerColumn<Company>()
  const rollups = useCompanyRollups()
  const { t } = useTranslation()
  const stat = (c: Company, key: keyof Rollup) => rollups.get(c.id)?.[key] ?? 0
  return [
    {
      key: 'name',
      header: t('companies.colCompany'),
      sortValue: (c) => c.name,
      cell: (c) => (
        <div className="flex items-center gap-3">
          <CompanyLogo name={c.name} />
          <div>
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.domain ?? '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'lifecycle', header: t('fields.lifecycle'), sortValue: (c) => LIFECYCLES.findIndex((l) => l.value === c.lifecycle), cell: (c) => <LifecycleBadge value={c.lifecycle} /> },
    { key: 'industry', header: t('fields.industry'), sortValue: (c) => c.industry ?? '', cell: (c) => c.industry ?? '—' },
    { key: 'location', header: t('companies.colLocation'), sortValue: (c) => c.country ?? '', cell: (c) => [c.city, c.country].filter(Boolean).join(', ') || '—' },
    { key: 'employees', header: t('fields.employees'), cell: (c) => c.employees ?? '—' },
    { key: 'contacts', header: t('companies.colContacts'), align: 'right', sortValue: (c) => stat(c, 'contacts'), cell: (c) => stat(c, 'contacts') },
    { key: 'open', header: t('companies.colOpen'), align: 'right', sortValue: (c) => stat(c, 'open'), cell: (c) => money(stat(c, 'open')) },
    { key: 'won', header: t('companies.colWon'), align: 'right', sortValue: (c) => stat(c, 'won'), cell: (c) => <span className="text-emerald-600 dark:text-emerald-400">{money(stat(c, 'won'))}</span> },
    owner,
    { key: 'created', header: t('companies.colCreated'), sortValue: (c) => c.created_at, cell: (c) => <span className="text-muted-foreground">{shortDate(c.created_at)}</span> },
  ]
}

export function CompaniesTable({ companies }: { companies: Company[] }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <Card>
      <DataTable rows={companies} columns={useCompanyColumns()} onRowClick={(c) => navigate(`/companies/${c.id}`)} empty={<EmptyState icon={Search} title={t('companies.noMatch')} />} />
    </Card>
  )
}
