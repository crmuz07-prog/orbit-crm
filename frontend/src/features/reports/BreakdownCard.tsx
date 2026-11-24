import { useTranslation } from 'react-i18next'
import { Card, CardHeader } from '@/components/ui/card'
import { useLabels } from '@/hooks/useLabels'
import type { Breakdown } from '@/lib/types'

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
  const lostOnly = breakdown.key === 'lost_reason'
  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} />
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="text-[11px] text-muted-foreground">
            <tr>
              <th className="px-4 py-1.5 text-left font-medium">{t('reports.label')}</th>
              <th className="px-2 py-1.5 text-right font-medium">{t('reports.total')}</th>
              {!lostOnly && <th className="px-2 py-1.5 text-right font-medium">{t('reports.open')}</th>}
              {!lostOnly && <th className="px-2 py-1.5 text-right font-medium">{t('reports.won')}</th>}
              {!lostOnly && <th className="px-2 py-1.5 text-right font-medium">{t('reports.lost')}</th>}
              {!lostOnly && <th className="px-4 py-1.5 text-right font-medium">{t('reports.conversion')}</th>}
            </tr>
          </thead>
          <tbody>
            {breakdown.rows.map((r) => (
              <tr key={r.label ?? '∅'} className="border-t border-foreground/[0.05]">
                <td className="max-w-[220px] truncate px-4 py-1.5" title={r.label ?? undefined}>{label(r.label)}</td>
                <td className="px-2 py-1.5 text-right font-medium tabular-nums">{r.total}</td>
                {!lostOnly && <td className="px-2 py-1.5 text-right tabular-nums">{r.open}</td>}
                {!lostOnly && <td className="px-2 py-1.5 text-right tabular-nums text-emerald-700 dark:text-emerald-400">{r.won || '—'}</td>}
                {!lostOnly && <td className="px-2 py-1.5 text-right tabular-nums text-rose-600 dark:text-rose-400">{r.lost || '—'}</td>}
                {!lostOnly && <td className="px-4 py-1.5 text-right tabular-nums text-muted-foreground">{r.total ? Math.round((r.won / r.total) * 100) : 0}%</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
