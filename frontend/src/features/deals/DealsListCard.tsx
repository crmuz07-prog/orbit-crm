import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ListCard, RowLink } from '@/components/common/record'
import { Button } from '@/components/ui/button'
import { useCrm } from '@/hooks/useData'
import type { Deal } from '@/lib/types'
import { money, shortDate } from '@/lib/utils'
import { StageBadge } from './bits'

/** Associated deals on company / contact records. */
export function DealsListCard({ deals, onAdd }: { deals: Deal[]; onAdd: () => void }) {
  const { stageById } = useCrm()
  const { t } = useTranslation()
  return (
    <ListCard
      title={t('deals.count', { count: deals.length })}
      action={<Button size="sm" variant="ghost" onClick={onAdd}><Plus /> {t('common.add')}</Button>}
      items={deals}
      empty={<p className="px-4 py-3 text-sm text-muted-foreground">{t('deals.none')}</p>}
      render={(d) => (
        <RowLink to={`/deals/${d.id}`}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{d.title}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <StageBadge stage={stageById.get(d.stage_id)} /> {t('deals.closes', { date: shortDate(d.expected_close_date) })}
            </div>
          </div>
          <span className="text-sm font-semibold tabular-nums">{money(d.amount, d.currency, true)}</span>
        </RowLink>
      )}
    />
  )
}
