import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { CompanyLogo } from '@/components/common/avatars'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { useOwnerColumn } from '@/features/team/OwnerField'
import { FieldChips } from '@/features/fields/FieldChips'
import { chipFields, displayValue, useCustomFields } from '@/features/fields/useFields'
import { useCrm } from '@/hooks/useData'
import { useNextTasks } from '@/hooks/useNextTasks'
import { useLabels } from '@/hooks/useLabels'
import { PRIORITIES } from '@/lib/constants'
import { isCloseOverdue, weightedValue } from '@/lib/metrics'
import type { Deal } from '@/lib/types'
import { cn, money, shortDate, timeAgo } from '@/lib/utils'
import { PriorityFlag, StageBadge } from './bits'
import { NextTaskBadge } from './NextTaskBadge'

function useDealColumns(): Column<Deal>[] {
  const owner = useOwnerColumn<Deal>()
  const { stageById, companyById } = useCrm()
  const { t } = useTranslation()
  const labels = useLabels()
  const fields = useCustomFields()
  const nextTask = useNextTasks()
  const companyName = (d: Deal) => (d.company_id ? companyById.get(d.company_id)?.name : undefined)
  const isOpen = (d: Deal) => !stageById.get(d.stage_id)?.is_won && !stageById.get(d.stage_id)?.is_lost
  // List fields as one chips column (warnings in red); other fields get a column each.
  const custom: Column<Deal>[] = [
    ...(chipFields(fields).length ? [{ key: 'fields', header: chipFields(fields).map((f) => f.label).join(' · ').slice(0, 40), cell: (d: Deal) => <FieldChips deal={d} fields={fields} limit={4} className="max-w-[260px]" /> }] : []),
    ...fields.filter((f) => !chipFields([f]).length).map((f) => ({ key: `custom:${f.key}`, header: f.label, sortValue: (d: Deal) => displayValue(f, d.custom?.[f.key]), cell: (d: Deal) => displayValue(f, d.custom?.[f.key]) || '—' })),
  ]
  return [
    {
      key: 'title',
      header: t('deals.colDeal'),
      sortValue: (d) => d.title,
      cell: (d) => (
        <div className="flex items-center gap-3">
          {companyName(d) && <CompanyLogo name={companyName(d)!} />}
          <div className="min-w-0">
            <p className="max-w-[320px] truncate font-medium">{d.title}</p>
            {companyName(d) && <p className="text-xs text-muted-foreground">{companyName(d)}</p>}
          </div>
        </div>
      ),
    },
    { key: 'task', header: t('deals.colTask'), sortValue: (d) => nextTask(d.id).task?.due_at ?? '9999', cell: (d) => (isOpen(d) ? <NextTaskBadge next={nextTask(d.id)} /> : '—') },
    { key: 'stage', header: t('deals.colStage'), sortValue: (d) => stageById.get(d.stage_id)?.position ?? 0, cell: (d) => <StageBadge stage={stageById.get(d.stage_id)} /> },
    { key: 'amount', header: t('deals.colAmount'), align: 'right', sortValue: (d) => d.amount, cell: (d) => <span className="font-medium">{money(d.amount, d.currency)}</span> },
    { key: 'weighted', header: t('deals.colWeighted'), align: 'right', sortValue: (d) => weightedValue(d, stageById), cell: (d) => money(weightedValue(d, stageById), d.currency) },
    {
      key: 'close',
      header: t('deals.colClose'),
      sortValue: (d) => d.expected_close_date ?? '9999',
      cell: (d) => <span className={cn(isCloseOverdue(d, stageById) && 'font-medium text-rose-600 dark:text-rose-400')}>{shortDate(d.expected_close_date)}</span>,
    },
    { key: 'priority', header: t('deals.colPriority'), sortValue: (d) => PRIORITIES.findIndex((p) => p.value === d.priority), cell: (d) => <PriorityFlag priority={d.priority} /> },
    { key: 'source', header: t('deals.colSource'), sortValue: (d) => d.source ?? '', cell: (d) => labels.source(d.source) || '—' },
    ...custom,
    owner,
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
