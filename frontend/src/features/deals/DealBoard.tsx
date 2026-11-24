import { useState } from 'react'
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, pointerWithin, rectIntersection, useSensor, useSensors, type CollisionDetection, type DragEndEvent } from '@dnd-kit/core'
import { LayoutGroup } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfirm } from '@/components/common/confirm-provider'
import { useAccess } from '@/hooks/useAccess'
import { useCrm, useRemoveRow } from '@/hooks/useData'
import type { Deal, Stage } from '@/lib/types'
import { DealCardBody } from './DealCard'
import { DropZones, ZONE_PREFIX, type Zone } from './DropZones'
import { LostReasonDialog } from './LostReasonDialog'
import { StageColumn } from './StageColumn'
import { useMoveDeal } from './useMoveDeal'

// The target is what the pointer is over, not what the dragged card overlaps most: with won / lost / delete side by side,
// overlap could pick "delete" while the pointer is on "lost". Keyboard drags (no pointer) fall back to overlap.
const underPointer: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length ? hits : rectIntersection(args)
}

/** Board of one pipeline: drag a card between columns to change its stage. */
export function DealBoard({ deals, stages }: { deals: Deal[]; stages: Stage[] }) {
  const { stageById } = useCrm()
  const moveDeal = useMoveDeal()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pendingLost, setPendingLost] = useState<{ deal: Deal; stage: Stage } | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor))
  const activeDeal = deals.find((d) => d.id === activeId)

  const remove = useRemoveRow('deals')
  const confirm = useConfirm()
  const { can } = useAccess()
  const { t } = useTranslation()
  const won = stages.find((s) => s.is_won)
  const lost = stages.find((s) => s.is_lost)
  const zones: Zone[] = [...(won ? ['won' as const] : []), ...(lost ? ['lost' as const] : []), ...(can('deals', 'delete') ? ['delete' as const] : [])]

  const deleteDeal = async (deal: Deal) => {
    const ok = await confirm({ title: t('deals.deleteTitle'), description: deal.title, confirmLabel: t('common.delete'), irreversible: true })
    if (ok) remove.mutate(deal.id, { onSuccess: () => toast.success(t('common.deleted')) })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    const deal = deals.find((d) => d.id === active.id)
    const target = over ? String(over.id) : ''
    if (deal && target === `${ZONE_PREFIX}delete`) return void deleteDeal(deal)
    const zoneStage = target === `${ZONE_PREFIX}won` ? won : target === `${ZONE_PREFIX}lost` ? lost : undefined
    const stage = zoneStage ?? (over ? stageById.get(target) : undefined)
    if (!deal || !stage || deal.stage_id === stage.id) return
    if (stage.is_lost) setPendingLost({ deal, stage })
    else moveDeal(deal, stage)
  }

  const confirmLost = (reason: string) => {
    if (pendingLost) moveDeal(pendingLost.deal, pendingLost.stage, reason)
    setPendingLost(null)
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={underPointer} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <LayoutGroup>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {stages.map((stage, i) => <StageColumn key={stage.id} stage={stage} first={i === 0} deals={deals.filter((d) => d.stage_id === stage.id)} />)}
          </div>
        </LayoutGroup>
        {/* No drop animation: framer's layout animation moves the card into its new column. */}
        <DragOverlay dropAnimation={null}>{activeDeal && <DealCardBody deal={activeDeal} overlay />}</DragOverlay>
        {activeDeal && zones.length > 0 && <DropZones zones={zones} />}
      </DndContext>
      <LostReasonDialog open={!!pendingLost} onOpenChange={(open) => !open && setPendingLost(null)} onConfirm={confirmLost} />
    </>
  )
}
