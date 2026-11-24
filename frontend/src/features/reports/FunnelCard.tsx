import { useTranslation } from 'react-i18next'
import { Card, CardHeader } from '@/components/ui/card'
import { useLabels } from '@/hooks/useLabels'
import { STAGE_COLORS } from '@/lib/constants'
import type { LeadReport, StageColor } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Leads by current stage with share bars (the sheet's "Sotuv voronkasi" block). */
export function FunnelCard({ report }: { report: LeadReport }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const max = Math.max(1, ...report.stages.map((s) => s.count))
  return (
    <Card>
      <CardHeader title={t('reports.funnel')} description={t('reports.funnelDesc')} />
      <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-[13px]">
        <thead className="text-[11px] text-muted-foreground">
          <tr>
            <th className="px-4 py-1.5 text-left font-medium">{t('reports.stage')}</th>
            <th className="px-2 py-1.5 text-right font-medium">{t('reports.count')}</th>
            <th className="px-2 py-1.5 text-right font-medium">{t('reports.share')}</th>
            <th className="px-4 py-1.5 text-right font-medium">{t('reports.warnCol')}</th>
          </tr>
        </thead>
        <tbody>
          {report.stages.filter((s) => s.count > 0).map((s) => (
            <tr key={s.stage_id} className="border-t border-foreground/[0.05]">
              <td className="px-4 py-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn('size-2 shrink-0 rounded-full', STAGE_COLORS[s.color as StageColor]?.dot ?? 'bg-slate-400')} />
                  <span className="min-w-0 flex-1 truncate">{labels.stage(s.name)}</span>
                  <span className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-foreground/[0.06] sm:block">
                    <span className={cn('block h-full rounded-full', STAGE_COLORS[s.color as StageColor]?.dot)} style={{ width: `${(s.count / max) * 100}%` }} />
                  </span>
                </div>
              </td>
              <td className="px-2 py-1.5 text-right font-medium tabular-nums">{s.count}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">{s.share.toFixed(1)}%</td>
              <td className={cn('px-4 py-1.5 text-right tabular-nums', s.warnings ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>{s.warnings || '—'}</td>
            </tr>
          ))}
          <tr className="border-t border-foreground/10 font-semibold">
            <td className="px-4 py-1.5">{t('reports.totalRow')}</td>
            <td className="px-2 py-1.5 text-right tabular-nums">{report.totals.total}</td>
            <td className="px-2 py-1.5 text-right tabular-nums">100%</td>
            <td className="px-4 py-1.5 text-right tabular-nums">{report.totals.warnings || '—'}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </Card>
  )
}
