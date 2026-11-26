import { useTranslation } from 'react-i18next'
import { AddButton, DenseEmpty, ListCard, RowLink } from '@/components/common/record'
import { useCrm } from '@/hooks/useData'
import type { Deal } from '@/lib/types'
import { money } from '@/lib/utils'
import { StageBadge } from './bits'

/** Associated deals on company / contact records: one line per deal (title, stage, amount). */
export function DealsListCard({ deals, onAdd }: { deals: Deal[]; onAdd: () => void }) {
  const { stageById } = useCrm()
  const { t } = useTranslation()
  return (
    <ListCard
      dense
      title={t('deals.count', { count: deals.length })}
      action={<AddButton label={t('common.add')} onClick={onAdd} />}
      items={deals}
      empty={<DenseEmpty>{t('deals.none')}</DenseEmpty>}
      render={(d) => (
        <RowLink dense to={`/deals/${d.id}`}>
          <span className="min-w-0 flex-1 truncate text-sm font-medium" title={d.title}>{d.title}</span>
          <StageBadge stage={stageById.get(d.stage_id)} className="max-w-[45%]" />
          <span className="shrink-0 text-sm font-semibold tabular-nums">{money(d.amount, d.currency, true)}</span>
        </RowLink>
      )}
    />
  )
}
