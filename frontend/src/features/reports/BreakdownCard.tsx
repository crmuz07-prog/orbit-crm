import { useTranslation } from 'react-i18next'
import { DataTable, type Column } from '@/components/common/data-table'
import { Card, CardHeader } from '@/components/ui/card'
import { useLabels } from '@/hooks/useLabels'
import type { Breakdown, GroupRow } from '@/lib/types'

type Row = GroupRow & { id: string }
const conversion = (r: GroupRow) => (r.total ? Math.round((r.won / r.total) * 100) : 0)
const dash = (n: number) => n || '—'

/** One grouping of the period's leads (managers, campaigns, a list field…): total, in progress, won, lost, conversion. */
export function BreakdownCard({ breakdown }: { breakdown: Breakdown }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const title = breakdown.label ?? t(`reports.groups.${breakdown.key as 'owner'}`)
  const label = (value: string | null) => {
    if (value === null) return t('reports.unset')
    if (breakdown.key === 'platform') return t(`leadSource.platforms.${value as 'instagram'}`, { defaultValue: value })
    return breakdown.key === 'source' ? labels.source(value) || value : value
  }
  const columns: Column<Row>[] = [
    { key: 'label', header: t('reports.label'), sortValue: (r) => r.label ?? '', cell: (r) => <span className="block max-w-[220px] truncate" title={r.label ?? undefined}>{label(r.label)}</span> },
    { key: 'total', header: t('reports.total'), align: 'right', sortValue: (r) => r.total, cell: (r) => <span className="font-medium">{r.total}</span> },
  ]
  // Loss reasons only ever count lost deals; the status columns would repeat the total.
  if (breakdown.key !== 'lost_reason') {
    columns.push(
      { key: 'open', header: t('reports.open'), align: 'right', sortValue: (r) => r.open, cell: (r) => r.open },
      { key: 'won', header: t('reports.won'), align: 'right', sortValue: (r) => r.won, cell: (r) => <span className="text-emerald-700 dark:text-emerald-400">{dash(r.won)}</span> },
      { key: 'lost', header: t('reports.lost'), align: 'right', sortValue: (r) => r.lost, cell: (r) => <span className="text-rose-600 dark:text-rose-400">{dash(r.lost)}</span> },
      { key: 'conversion', header: t('reports.conversion'), align: 'right', sortValue: conversion, cell: (r) => <span className="text-muted-foreground">{conversion(r)}%</span> },
    )
  }
  const rows = breakdown.rows.map((r) => ({ ...r, id: r.label ?? '∅' }))
  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} />
      <DataTable rows={rows} columns={columns} minWidth={0} />
    </Card>
  )
}
