import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { CompanyLogo } from '@/components/common/avatars'
import { DataTable, type Column, type Selection } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { DealsCell, LastActivityCell, TaskCell } from '@/features/people/cells'
import type { Rollup } from '@/features/people/useDealRollups'
import { useOwnerColumn } from '@/features/team/OwnerField'
import { useLabels } from '@/hooks/useLabels'
import { useLastActivity, type NextTask } from '@/hooks/useNextTasks'
import { LIFECYCLES } from '@/lib/constants'
import type { Company } from '@/lib/types'
import { money } from '@/lib/utils'
import { LifecycleBadge } from './LifecycleBadge'

interface Props {
  companies: Company[]
  rollup: (id: string) => Rollup
  nextTask: (id: string) => NextTask
  selection: Selection
}

function useCompanyColumns({ rollup, nextTask }: Pick<Props, 'rollup' | 'nextTask'>): Column<Company>[] {
  const owner = useOwnerColumn<Company>()
  const last = useLastActivity('company_id')
  const { t } = useTranslation()
  const labels = useLabels()
  return [
    {
      key: 'name', header: t('companies.colCompany'), sortValue: (c) => c.name,
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <CompanyLogo name={c.name} size="xs" />
          <div className="min-w-0">
            <p className="max-w-[220px] truncate font-medium">{c.name}</p>
            {(c.domain || c.city) && <p className="max-w-[220px] truncate text-[11px] text-muted-foreground">{[c.domain, c.city].filter(Boolean).join(' · ')}</p>}
          </div>
        </div>
      ),
    },
    { key: 'lifecycle', header: t('fields.lifecycle'), sortValue: (c) => LIFECYCLES.findIndex((l) => l.value === c.lifecycle), cell: (c) => <LifecycleBadge value={c.lifecycle} /> },
    { key: 'industry', header: t('fields.industry'), sortValue: (c) => c.industry ?? '', cell: (c) => labels.industry(c.industry) || '—' },
    { key: 'contacts', header: t('companies.colContacts'), align: 'right', sortValue: (c) => rollup(c.id).contacts, cell: (c) => rollup(c.id).contacts || '—' },
    { key: 'deals', header: t('companies.colOpen'), align: 'right', sortValue: (c) => rollup(c.id).openAmount, cell: (c) => <DealsCell count={rollup(c.id).open} amount={rollup(c.id).openAmount} /> },
    { key: 'won', header: t('companies.colWon'), align: 'right', sortValue: (c) => rollup(c.id).won,
      cell: (c) => (rollup(c.id).won ? <span className="text-emerald-600 dark:text-emerald-400">{money(rollup(c.id).won, undefined, true)}</span> : <span className="text-muted-foreground">—</span>) },
    { key: 'task', header: t('deals.colTask'), sortValue: (c) => nextTask(c.id).task?.due_at ?? '9999', cell: (c) => <TaskCell next={nextTask(c.id)} /> },
    { key: 'last', header: t('people.colLast'), sortValue: (c) => last.get(c.id) ?? '', cell: (c) => <LastActivityCell at={last.get(c.id)} /> },
    owner,
  ]
}

export function CompaniesTable({ companies, rollup, nextTask, selection }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <Card>
      <DataTable rows={companies} columns={useCompanyColumns({ rollup, nextTask })} selection={selection} minWidth={980}
        onRowClick={(c) => navigate(`/companies/${c.id}`)} empty={<EmptyState icon={Search} title={t('companies.noMatch')} />} />
    </Card>
  )
}
