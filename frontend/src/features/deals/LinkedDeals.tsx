import { useTranslation } from 'react-i18next'
import { RowLink } from '@/components/common/record'
import { LinkedSection } from '@/features/record/LinkedSection'
import { useCrm } from '@/hooks/useData'
import type { Deal } from '@/lib/types'
import { dealStatus, sumAmount } from '@/lib/metrics'
import { money } from '@/lib/utils'
import { StageBadge } from './bits'

/** Money still in play and money won, in one muted line — only what is non-zero (it replaced two stat tiles). */
function DealTotals({ deals }: { deals: Deal[] }) {
  const { stageById } = useCrm()
  const { t } = useTranslation()
  const sum = (status: string) => sumAmount(deals.filter((d) => dealStatus(d, stageById) === status))
  const open = sum('open')
  const won = sum('won')
  if (!open && !won) return null
  return (
    <p className="truncate px-4 pb-1 text-xs text-muted-foreground">
      {open > 0 && <span title={t('companies.inProgressHint')}>{t('companies.inProgress')}: <b className="font-semibold tabular-nums text-foreground">{money(open)}</b></span>}
      {open > 0 && won > 0 && ' · '}
      {won > 0 && <span title={t('companies.soldHint')}>{t('companies.sold')}: <b className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{money(won)}</b></span>}
    </p>
  )
}

/** Deals of a company / contact in its info panel: totals, then one line per deal (title, stage, amount). */
export function LinkedDeals({ deals, onAdd }: { deals: Deal[]; onAdd: () => void }) {
  const { stageById } = useCrm()
  const { t } = useTranslation()
  return (
    <LinkedSection
      summary={<DealTotals deals={deals} />}
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
