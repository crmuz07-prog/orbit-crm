import { useTranslation } from 'react-i18next'
import { Card, CardHeader } from '@/components/ui/card'
import { usePersistentState } from '@/hooks/usePersistentState'
import type { Breakdown } from '@/lib/types'
import { cn } from '@/lib/utils'
import { BreakdownTable, useBreakdownTitle } from './BreakdownTable'

/**
 * Two groupings with the very same rows (platform "instagram" and source "Instagram" for Meta-only leads) — the second
 * says nothing new. Labels are compared without case.
 */
const signature = (b: Breakdown) => JSON.stringify(b.rows.map((r) => [r.label?.toLocaleLowerCase() ?? null, r.total, r.won, r.lost]))

export function distinctBreakdowns(list: Breakdown[]): Breakdown[] {
  const seen = new Set<string>()
  return list.filter((b) => {
    if (b.rows.length === 0 || seen.has(signature(b))) return false
    seen.add(signature(b))
    return true
  })
}

/**
 * Every grouping of the report in one card: pick managers, platforms, campaigns, a custom field… with the chips and
 * read one table — instead of a wall of fifteen identical tables. The choice is remembered on this device.
 */
export function SlicesCard({ breakdowns, withSales }: { breakdowns: Breakdown[]; withSales: boolean }) {
  const { t } = useTranslation()
  const titleOf = useBreakdownTitle()
  const keys = breakdowns.map((b) => b.key)
  const [chosen, setChosen] = usePersistentState('orbit:report-slice', keys[0] ?? 'owner', keys)
  const current = breakdowns.find((b) => b.key === chosen) ?? breakdowns[0]
  if (!current) return null
  return (
    <Card className="overflow-hidden">
      <CardHeader title={t('reports.insight.slices')} description={withSales ? t('reports.insight.slicesDesc') : t('reports.insight.noSalesHint')} />
      <div role="tablist" aria-label={t('reports.insight.slices')} className="flex gap-1.5 overflow-x-auto border-b border-foreground/[0.06] px-4 py-2">
        {breakdowns.map((b) => (
          <button key={b.key} type="button" role="tab" aria-selected={b.key === current.key} onClick={() => setChosen(b.key)}
            className={cn('h-7 shrink-0 rounded-lg px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              b.key === current.key ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground')}>
            <span className="block max-w-[200px] truncate">{titleOf(b)}</span>
          </button>
        ))}
      </div>
      <BreakdownTable breakdown={current} withSales={withSales} />
    </Card>
  )
}
