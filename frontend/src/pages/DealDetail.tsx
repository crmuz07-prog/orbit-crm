import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Handshake, Pencil, RotateCcw, ThumbsDown, Trophy } from 'lucide-react'
import { BackLink } from '@/components/common/record'
import { DeleteRecordButton, RecordNotFound } from '@/components/common/record-actions'
import { RecordSkeleton } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { AssociationCards } from '@/features/deals/AssociationCards'
import { LostReasonDialog } from '@/features/deals/LostReasonDialog'
import { useMoveDeal } from '@/features/deals/useMoveDeal'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { DealInfo } from '@/features/record/DealInfo'
import { LeadSource } from '@/features/record/LeadSource'
import { InfoHeader, RecordCard } from '@/features/record/RecordCard'
import { StageSelector } from '@/features/record/StageSelector'
import { StageTimesWidget } from '@/features/record/StageTimesWidget'
import { useAccess } from '@/hooks/useAccess'
import { useCrm } from '@/hooks/useData'
import { useDealStages } from '@/hooks/usePipelines'
import type { Deal, Stage } from '@/lib/types'

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <Tooltip content={label}><Button variant="ghost" size="icon" onClick={onClick} aria-label={label}>{children}</Button></Tooltip>
}

/** Won / lost / reopen within the deal's own pipeline, plus edit and delete. */
function DealActions({ deal, onLost }: { deal: Deal; onLost: () => void }) {
  const { t } = useTranslation()
  const stages = useDealStages(deal.stage_id)
  const moveDeal = useMoveDeal()
  const openModal = useEntityModal()
  const { can } = useAccess()
  const current = stages.find((s) => s.id === deal.stage_id)
  const won = stages.find((s) => s.is_won)
  const firstOpen = stages.find((s) => !s.is_won && !s.is_lost)
  const isOpen = !!current && !current.is_won && !current.is_lost
  if (!can('deals', 'edit')) return null
  return (
    <>
      {isOpen && won && <IconAction label={t('deals.won')} onClick={() => moveDeal(deal, won)}><Trophy className="text-emerald-500" /></IconAction>}
      {isOpen && <IconAction label={t('deals.lost')} onClick={onLost}><ThumbsDown className="text-rose-500" /></IconAction>}
      {!isOpen && firstOpen && <IconAction label={t('deals.reopen')} onClick={() => moveDeal(deal, firstOpen)}><RotateCcw /></IconAction>}
      <IconAction label={t('common.edit')} onClick={() => openModal({ kind: 'deal', initial: deal })}><Pencil /></IconAction>
      <DeleteRecordButton table="deals" id={deal.id} title={t('deals.deleteTitle')} description={t('deals.deleteDesc', { title: deal.title })} redirectTo="/deals" />
    </>
  )
}

export default function DealDetailPage() {
  const { id = '' } = useParams()
  const { isLoading, dealById, stageById, activities } = useCrm()
  const moveDeal = useMoveDeal()
  const { can } = useAccess()
  const { t } = useTranslation()
  // The lost stage to move to once a reason is given (from the stage selector or the thumbs-down action).
  const [lostTarget, setLostTarget] = useState<Stage | null>(null)
  const stages = useDealStages(dealById.get(id)?.stage_id)

  if (isLoading) return <RecordSkeleton />
  const deal = dealById.get(id)
  if (!deal) return <RecordNotFound icon={Handshake} label={t('entity.deal')} backTo="/deals" />

  const stage = stageById.get(deal.stage_id)
  const pick = (target: Stage) => (target.is_lost ? setLostTarget(target) : moveDeal(deal, target))
  const links = { deal_id: deal.id, company_id: deal.company_id, contact_id: deal.contact_id }

  return (
    <>
      <RecordCard
        link="deal_id"
        recordId={deal.id}
        activities={activities.filter((a) => a.deal_id === deal.id)}
        links={links}
        info={
          <>
            <InfoHeader back={<BackLink to="/deals" label={t('nav.deals')} />} title={deal.title} shortId={deal.id.slice(0, 8).toUpperCase()}
              actions={<DealActions deal={deal} onLost={() => setLostTarget(stages.find((s) => s.is_lost) ?? null)} />}>
              <StageSelector deal={deal} onPick={pick} readOnly={!can('deals', 'edit')} />
            </InfoHeader>
            <DealInfo deal={deal} lost={!!stage?.is_lost} />
            <LeadSource dealId={deal.id} />
          </>
        }
        widgets={<><StageTimesWidget deal={deal} /><AssociationCards deal={deal} /></>}
      />
      <LostReasonDialog open={!!lostTarget} onOpenChange={(open) => !open && setLostTarget(null)}
        onConfirm={(reason) => { if (lostTarget) moveDeal(deal, lostTarget, reason); setLostTarget(null) }} />
    </>
  )
}
