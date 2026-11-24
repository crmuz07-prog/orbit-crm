import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useAccess } from '@/hooks/useAccess'
import { STAGE_COLORS } from '@/lib/constants'
import { sumAmount } from '@/lib/metrics'
import type { Deal, Stage } from '@/lib/types'
import { cn, money } from '@/lib/utils'
import { DealCard } from './DealCard'
import { QuickAdd } from './QuickAdd'

/** amoCRM column head: NAME, "N deals: sum", a coloured rule, then the stage's own rule text. */
function ColumnHeader({ stage, deals }: { stage: Stage; deals: Deal[] }) {
  const { t } = useTranslation()
  return (
    <div className="mb-2 px-1 text-center">
      <h3 className="truncate text-[12px] font-bold uppercase tracking-wider">{stage.name}</h3>
      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
        {t('board.header', { count: deals.length, sum: money(sumAmount(deals), 'USD', true) })}
        {!stage.is_won && !stage.is_lost && <span className="opacity-70"> · {stage.probability}%</span>}
      </p>
      <div className={cn('mt-2 h-[3px] rounded-full', STAGE_COLORS[stage.color].dot)} />
      {stage.description && <p className="mt-2 text-left text-[11px] leading-snug text-muted-foreground">{stage.description}</p>}
    </div>
  )
}

export function StageColumn({ stage, deals, first }: { stage: Stage; deals: Deal[]; first?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const openModal = useEntityModal()
  const { t } = useTranslation()
  const closed = stage.is_won || stage.is_lost
  const { can } = useAccess()

  return (
    <div className="flex w-[272px] shrink-0 flex-col">
      <ColumnHeader stage={stage} deals={deals} />
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[120px] flex-1 flex-col gap-2 rounded-xl border border-dashed p-1.5 transition-colors duration-200',
          isOver ? 'border-primary/60 bg-primary/10' : 'glass-subtle border-solid',
        )}
      >
        {first && can('deals', 'create') && <QuickAdd stage={stage} />}
        {deals.map((d) => <DealCard key={d.id} deal={d} />)}
        {!closed && can('deals', 'create') && (
          <button
            onClick={() => openModal({ kind: 'deal', initial: { stage_id: stage.id } })}
            className="flex h-8 items-center justify-center gap-1 rounded-lg text-xs font-medium text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
          >
            <Plus className="size-3.5" /> {t('deals.addDeal')}
          </button>
        )}
      </div>
    </div>
  )
}
