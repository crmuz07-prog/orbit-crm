import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { STAGE_COLORS } from '@/lib/constants'
import { sumAmount } from '@/lib/metrics'
import type { Deal, Stage } from '@/lib/types'
import { cn, money } from '@/lib/utils'
import { DealCard } from './DealCard'

function ColumnHeader({ stage, deals }: { stage: Stage; deals: Deal[] }) {
  return (
    <div className="mb-2 px-1">
      <div className={cn('mb-2 h-1 rounded-full', STAGE_COLORS[stage.color].dot)} />
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-[13px] font-semibold">{stage.name}</h3>
        <span className="glass-subtle rounded-md px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">{deals.length}</span>
      </div>
      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
        {money(sumAmount(deals), 'USD', true)}
        {!stage.is_won && !stage.is_lost && <span className="opacity-70"> · {stage.probability}%</span>}
      </p>
    </div>
  )
}

export function StageColumn({ stage, deals }: { stage: Stage; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const openModal = useEntityModal()
  const { t } = useTranslation()
  const closed = stage.is_won || stage.is_lost

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
        {deals.map((d) => <DealCard key={d.id} deal={d} />)}
        {!closed && (
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
