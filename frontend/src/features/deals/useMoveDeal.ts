import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useUpdateRow } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import type { Deal, Stage } from '@/lib/types'
import { money } from '@/lib/utils'

/** Moves a deal to a stage. The API derives closed_at / lost_reason from the stage type. */
export function useMoveDeal() {
  const update = useUpdateRow('deals')
  const { t } = useTranslation()
  const labels = useLabels()

  const announce = (deal: Deal, stage: Stage, lostReason?: string) => {
    if (stage.is_won) return toast.success(t('deals.wonToast', { amount: money(deal.amount, deal.currency) }), { description: deal.title })
    if (stage.is_lost) return toast(t('deals.lostToast'), { description: lostReason })
    toast.success(t('deals.movedTo', { stage: labels.stage(stage.name) }))
  }

  return (deal: Deal, stage: Stage, lostReason?: string) => {
    if (deal.stage_id === stage.id && !lostReason) return
    update.mutate({ id: deal.id, patch: { stage_id: stage.id, ...(stage.is_lost ? { lost_reason: lostReason ?? null } : {}) } })
    announce(deal, stage, lostReason)
  }
}
