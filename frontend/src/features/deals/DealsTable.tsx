import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { CompanyLogo } from '@/components/common/avatars'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { useCrm } from '@/hooks/useData'
import { PRIORITIES } from '@/lib/constants'
import { isCloseOverdue, weightedValue } from '@/lib/metrics'
import type { Deal } from '@/lib/types'
import { cn, money, shortDate, timeAgo } from '@/lib/utils'
import { PriorityFlag, StageBadge } from './bits'

function useDealColumns(): Column<Deal>[] {
  const { stageById, companyById } = useCrm()
  const { t } = useTranslation()
  const companyName = (d: Deal) => (d.company_id ? companyById.get(d.company_id)?.name : undefined)
  return [
    {
      key: 'title',
      header: t('deals.colDeal'),
      sortValue: (d) => d.title,
      cell: (d) => (
        <div className="flex items-center gap-3">
          <CompanyLogo name={companyName(d) ?? d.title} />
          <div className="min-w-0">
            <p className="max-w-[320px] truncate font-medium">{d.title}</p>
            <p className="text-xs text-muted-foreground">{companyName(d) ?? t('deals.noCompany')}</p>
          </div>
        </div>
      ),
    },
    { key: 'stage', header: t('deals.colStage'), sortValue: (d) => stageById.get(d.stage_id)?.position ?? 0, cell: (d) => <StageBadge stage={stageById.get(d.stage_id)} /> },
    { key: 'amount', header: t('deals.colAmount'), align: 'right', sortValue: (d) => d.amount, cell: (d) => <span className="font-medium">{money(d.amount, d.currency)}</span> },
    { key: 'weighted', header: t('deals.colWeighted'), align: 'right', sortValue: (d) => weightedValue(d, stageById), cell: (d) => money(weightedValue(d, stageById), d.currency) },
    {
      key: 'close',
      header: t('deals.colClose'),
      sortValue: (d) => d.expected_close_date ?? '9999',
      cell: (d) => <span className={cn(isCloseOverdue(d, stageById) && 'font-medium text-rose-600 dark:text-rose-400')}>{shortDate(d.expected_close_date)}</span>,
    },
    { key: 'priority', header: t('deals.colPriority'), sortValue: (d) => PRIORITIES.findIndex((p) => p.value === d.priority), cell: (d) => <PriorityFlag priority={d.priority} withLabel /> },
    { key: 'source', header: t('deals.colSource'), sortValue: (d) => d.source ?? '', cell: (d) => d.source ?? '—' },
    { key: 'updated', header: t('deals.colUpdated'), sortValue: (d) => d.updated_at, cell: (d) => <span className="text-muted-foreground">{timeAgo(d.updated_at)}</span> },
  ]
}

export function DealsTable({ deals }: { deals: Deal[] }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <Card>
      <DataTable
        rows={deals}
        columns={useDealColumns()}
        onRowClick={(d) => navigate(`/deals/${d.id}`)}
        initialSort={{ key: 'amount', dir: 'desc' }}
        empty={<EmptyState icon={Search} title={t('deals.noMatch')} description={t('deals.noMatchDesc')} />}
      />
    </Card>
  )
}
