import { useTranslation } from 'react-i18next'
import { DataTable, type Column } from '@/components/common/data-table'
import { useLabels } from '@/hooks/useLabels'
import type { Breakdown, GroupRow } from '@/lib/types'

type Row = GroupRow & { id: string }
const conversion = (r: GroupRow) => (r.total ? Math.round((r.won / r.total) * 100) : 0)
const dash = (n: number) => n || '—'

/** The title of a breakdown: a custom field's own label, or the grouping's name. */
export function useBreakdownTitle() {
  const { t } = useTranslation()
  return (b: Breakdown) => b.label ?? t(`reports.groups.${b.key as 'owner'}`)
}

/**
 * One grouping of the period's leads: value (named after the grouping, not "Value"), leads with their share, in
 * progress, sold, lost, conversion. Without sales in the period the sold / conversion columns are hidden (all "—").
 */
export function BreakdownTable({ breakdown, withSales }: { breakdown: Breakdown; withSales: boolean }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const title = useBreakdownTitle()(breakdown)
  const total = breakdown.rows.reduce((sum, r) => sum + r.total, 0) || 1
  const label = (value: string | null) => {
    if (value === null) return t('reports.unset')
    if (breakdown.key === 'platform') return t(`leadSource.platforms.${value as 'instagram'}`, { defaultValue: value })
    return breakdown.key === 'source' ? labels.source(value) || value : value
  }
  const columns: Column<Row>[] = [
    { key: 'label', header: title, sortValue: (r) => r.label ?? '', cell: (r) => <span className="block max-w-[260px] truncate" title={r.label ?? undefined}>{label(r.label)}</span> },
    {
      key: 'total', header: t('reports.count'), align: 'right', sortValue: (r) => r.total, cell: (r) => (
        <span className="inline-flex items-center justify-end gap-2">
          <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-foreground/[0.06] sm:block">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${(r.total / total) * 100}%` }} />
          </span>
          <span className="font-medium tabular-nums">{r.total}</span>
          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{Math.round((r.total / total) * 100)}%</span>
        </span>
      ),
    },
    { key: 'open', header: t('reports.open'), align: 'right', sortValue: (r) => r.open, cell: (r) => r.open },
  ]
  if (withSales) columns.push({ key: 'won', header: t('reports.insight.sold'), align: 'right', sortValue: (r) => r.won, cell: (r) => <span className="text-emerald-700 dark:text-emerald-400">{dash(r.won)}</span> })
  columns.push({ key: 'lost', header: t('reports.lost'), align: 'right', sortValue: (r) => r.lost, cell: (r) => <span className="text-rose-600 dark:text-rose-400">{dash(r.lost)}</span> })
  if (withSales) columns.push({ key: 'conversion', header: t('reports.conversion'), align: 'right', sortValue: conversion, cell: (r) => <span className="text-muted-foreground">{conversion(r)}%</span> })
  return <DataTable rows={breakdown.rows.map((r) => ({ ...r, id: r.label ?? '∅' }))} columns={columns} minWidth={0} />
}
