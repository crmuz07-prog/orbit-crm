import { useTranslation } from 'react-i18next'
import { RowLink } from '@/components/common/record'
import { LinkedSection } from '@/features/record/LinkedSection'
import { useCrm } from '@/hooks/useData'
import type { Deal } from '@/lib/types'
import { money } from '@/lib/utils'
import { StageBadge } from './bits'

/** Deals of a company / contact in its info panel: one line per deal (title, stage, amount). */
export function LinkedDeals({ deals, onAdd }: { deals: Deal[]; onAdd: () => void }) {
  const { stageById } = useCrm()
  const { t } = useTranslation()
  return (
    <LinkedSection
      title={t('deals.count', { count: deals.length })}
      addLabel={t('common.add')}
      onAdd={onAdd}
      items={deals}
      empty={t('deals.none')}
      render={(d) => (
        <RowLink dense to={`/deals/${d.id}`}>
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium" title={d.title}>{d.title}</span>
          <StageBadge stage={stageById.get(d.stage_id)} className="max-w-[45%]" />
          <span className="shrink-0 text-[13px] font-semibold tabular-nums">{money(d.amount, d.currency, true)}</span>
        </RowLink>
      )}
    />
  )
}
