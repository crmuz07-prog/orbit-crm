import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { Handshake, Pencil, RotateCcw, ThumbsDown, Trophy } from 'lucide-react'
import { CompanyLogo } from '@/components/common/avatars'
import { BackLink, PropertyList, RecordHeader, RecordLayout } from '@/components/common/record'
import { DeleteRecordButton, RecordNotFound } from '@/components/common/record-actions'
import { PageSkeleton } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Composer } from '@/features/activities/Composer'
import { Timeline } from '@/features/activities/Timeline'
import { AssociationCards } from '@/features/deals/AssociationCards'
import { PriorityFlag, StatusBadge } from '@/features/deals/bits'
import { LostReasonDialog } from '@/features/deals/LostReasonDialog'
import { StagePath } from '@/features/deals/StagePath'
import { useMoveDeal } from '@/features/deals/useMoveDeal'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useCrm } from '@/hooks/useData'
import { daysSince, dealStatus, isStale, weightedValue } from '@/lib/metrics'
import type { Deal } from '@/lib/types'
import { money, shortDate, timeAgo } from '@/lib/utils'

function DealActions({ deal, onLost }: { deal: Deal; onLost: () => void }) {
  const { stages, stageById } = useCrm()
  const moveDeal = useMoveDeal()
  const openModal = useEntityModal()
  const { t } = useTranslation()
  const won = stages.find((s) => s.is_won)
  const firstOpen = stages.find((s) => !s.is_won && !s.is_lost)
  const isOpen = dealStatus(deal, stageById) === 'open'

  return (
    <>
      {isOpen && won && <Button variant="success" onClick={() => moveDeal(deal, won)}><Trophy /> {t('deals.won')}</Button>}
      {isOpen && <Button variant="outline" onClick={onLost}><ThumbsDown /> {t('deals.lost')}</Button>}
      {!isOpen && firstOpen && <Button variant="outline" onClick={() => moveDeal(deal, firstOpen)}><RotateCcw /> {t('deals.reopen')}</Button>}
      <Button variant="outline" onClick={() => openModal({ kind: 'deal', initial: deal })}><Pencil /> {t('common.edit')}</Button>
      <DeleteRecordButton table="deals" id={deal.id} title={t('deals.deleteTitle')} description={t('deals.deleteDesc', { title: deal.title })} redirectTo="/deals" />
    </>
  )
}

export default function DealDetailPage() {
  const { id = '' } = useParams()
  const { isLoading, dealById, stages, stageById, companyById, activities } = useCrm()
  const moveDeal = useMoveDeal()
  const [askLost, setAskLost] = useState(false)
  const { t } = useTranslation()

  if (isLoading) return <PageSkeleton />
  const deal = dealById.get(id)
  if (!deal) return <RecordNotFound icon={Handshake} label={t('entity.deal')} backTo="/deals" />

  const stage = stageById.get(deal.stage_id)
  const company = deal.company_id ? companyById.get(deal.company_id) : undefined
  const lostStage = stages.find((s) => s.is_lost)

  return (
    <>
      <BackLink to="/deals" label={t('nav.deals')} />
      <RecordHeader
        media={<CompanyLogo name={company?.name ?? deal.title} size="lg" className="rounded-xl" />}
        title={deal.title}
        badge={<StatusBadge status={dealStatus(deal, stageById)} />}
        subtitle={
          <>
            <span className="text-lg font-semibold tabular-nums text-foreground">{money(deal.amount, deal.currency)}</span>
            {company && <Link to={`/companies/${company.id}`} className="hover:text-foreground hover:underline">· {company.name}</Link>}
            {isStale(deal, stageById) && <span className="font-medium text-rose-600 dark:text-rose-400">· {t('deals.idleDays', { days: daysSince(deal.updated_at) })}</span>}
          </>
        }
        actions={<DealActions deal={deal} onLost={() => setAskLost(true)} />}
      />
      <Card className="mb-5 p-2">
        <StagePath deal={deal} stages={stages} onSelect={(s) => (s.is_lost ? setAskLost(true) : moveDeal(deal, s))} />
        {stage?.is_lost && deal.lost_reason && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"><b className="font-medium">{t('deals.lostReason')}</b> {deal.lost_reason}</p>
        )}
      </Card>
      <RecordLayout
        side={
          <>
            <PropertyList
              title={t('deals.about')}
              items={[
                [t('deals.colAmount'), money(deal.amount, deal.currency)],
                [t('deals.weighted'), `${money(weightedValue(deal, stageById), deal.currency)} (${stage?.probability ?? 0}%)`],
                [t('deals.colStage'), stage?.name],
                [t('deals.colClose'), shortDate(deal.expected_close_date)],
                [t('deals.colPriority'), <PriorityFlag key="p" priority={deal.priority} withLabel />],
                [t('deals.colSource'), deal.source],
                [t('deals.created'), shortDate(deal.created_at)],
                [t('deals.lastUpdate'), timeAgo(deal.updated_at)],
                [t('deals.closed'), deal.closed_at && shortDate(deal.closed_at)],
              ]}
            />
            <AssociationCards deal={deal} />
          </>
        }
        main={
          <>
            <Composer links={{ deal_id: deal.id, company_id: deal.company_id, contact_id: deal.contact_id }} />
            <Timeline activities={activities.filter((a) => a.deal_id === deal.id)} />
          </>
        }
      />
      <LostReasonDialog open={askLost} onOpenChange={setAskLost} onConfirm={(reason) => { if (lostStage) moveDeal(deal, lostStage, reason); setAskLost(false) }} />
    </>
  )
}
