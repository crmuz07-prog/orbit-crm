import { useState } from 'react'
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { LayoutGroup } from 'framer-motion'
import { useCrm } from '@/hooks/useData'
import type { Deal, Stage } from '@/lib/types'
import { DealCardBody } from './DealCard'
import { LostReasonDialog } from './LostReasonDialog'
import { StageColumn } from './StageColumn'
import { useMoveDeal } from './useMoveDeal'

/** Pipedrive-style board: drag a card between columns to change its stage. */
export function DealBoard({ deals }: { deals: Deal[] }) {
  const { stages, stageById } = useCrm()
  const moveDeal = useMoveDeal()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pendingLost, setPendingLost] = useState<{ deal: Deal; stage: Stage } | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor))
  const activeDeal = deals.find((d) => d.id === activeId)

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    const deal = deals.find((d) => d.id === active.id)
    const stage = over ? stageById.get(String(over.id)) : undefined
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
      <DndContext sensors={sensors} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <LayoutGroup>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {stages.map((stage) => <StageColumn key={stage.id} stage={stage} deals={deals.filter((d) => d.stage_id === stage.id)} />)}
          </div>
        </LayoutGroup>
        {/* No drop animation: framer's layout animation moves the card into its new column. */}
        <DragOverlay dropAnimation={null}>{activeDeal && <DealCardBody deal={activeDeal} overlay />}</DragOverlay>
      </DndContext>
      <LostReasonDialog open={!!pendingLost} onOpenChange={(open) => !open && setPendingLost(null)} onConfirm={confirmLost} />
    </>
  )
}
