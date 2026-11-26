import { useTranslation } from 'react-i18next'
import { Ban } from 'lucide-react'
import { EmptyState } from '@/components/common/states'
import { Card, CardHeader } from '@/components/ui/card'
import type { Breakdown } from '@/lib/types'

/** Why leads were lost, biggest reason first, each with its share — the most actionable block of the report. */
export function LostReasonsCard({ breakdown, className }: { breakdown?: Breakdown; className?: string }) {
  const { t } = useTranslation()
  const rows = breakdown?.rows ?? []
  const total = rows.reduce((sum, r) => sum + r.total, 0)
  return (
    <Card className={className}>
      <CardHeader title={t('reports.insight.reasons')} description={t('reports.insight.reasonsDesc')}
        action={total > 0 && <span className="text-xs text-muted-foreground">{t('reports.totalRow')}: <b className="text-foreground">{total}</b></span>} />
      {total === 0 ? <EmptyState icon={Ban} title={t('reports.insight.reasonsEmpty')} compact /> : (
        <ul className="space-y-2 px-4 py-3">
          {rows.map((r) => (
            <li key={r.label ?? '∅'}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 truncate" title={r.label ?? undefined}>{r.label ?? t('reports.unset')}</span>
                <span className="shrink-0 tabular-nums"><b className="font-medium">{r.total}</b> <span className="text-xs text-muted-foreground">· {Math.round((r.total / total) * 100)}%</span></span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                <div className="h-full rounded-full bg-rose-500/80" style={{ width: `${(r.total / total) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
