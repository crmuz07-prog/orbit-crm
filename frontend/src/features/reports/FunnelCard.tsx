import { useTranslation } from 'react-i18next'
import { DataTable, type Column } from '@/components/common/data-table'
import { Card, CardHeader } from '@/components/ui/card'
import { useLabels } from '@/hooks/useLabels'
import { STAGE_COLORS } from '@/lib/constants'
import type { LeadReport, ReportStage, StageColor } from '@/lib/types'
import { cn } from '@/lib/utils'

type Row = ReportStage & { id: string }
const dot = (s: ReportStage) => STAGE_COLORS[s.color as StageColor]?.dot ?? 'bg-slate-400'

/** Leads by current stage with share bars (the sheet's "Sotuv voronkasi" block). */
export function FunnelCard({ report, className }: { report: LeadReport; className?: string }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const max = Math.max(1, ...report.stages.map((s) => s.count))
  const columns: Column<Row>[] = [
    {
      key: 'stage', header: t('reports.stage'), cell: (s) => (
        <div className="flex items-center gap-2">
          <span className={cn('size-2 shrink-0 rounded-full', dot(s))} />
          <span className="min-w-0 flex-1 truncate">{labels.stage(s.name)}</span>
          <span className="hidden h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-foreground/[0.06] sm:block">
            <span className={cn('block h-full rounded-full', dot(s))} style={{ width: `${(s.count / max) * 100}%` }} />
          </span>
        </div>
      ),
    },
    { key: 'count', header: t('reports.count'), align: 'right', sortValue: (s) => s.count, cell: (s) => <span className="font-medium">{s.count}</span> },
    { key: 'share', header: t('reports.insight.share'), align: 'right', sortValue: (s) => s.share, cell: (s) => <span className="text-muted-foreground">{s.share.toFixed(1)}%</span> },
    { key: 'warn', header: t('reports.warnCol'), align: 'right', sortValue: (s) => s.warnings,
      cell: (s) => <span className={s.warnings ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted-foreground'}>{s.warnings || '—'}</span> },
  ]
  const rows = report.stages.filter((s) => s.count > 0).map((s) => ({ ...s, id: s.stage_id }))
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader title={t('reports.funnel')} description={t('reports.funnelDesc')}
        action={<span className="text-xs text-muted-foreground">{t('reports.totalRow')}: <b className="text-foreground">{report.totals.total}</b></span>} />
      <DataTable rows={rows} columns={columns} minWidth={0} />
    </Card>
  )
}
