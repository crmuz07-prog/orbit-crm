import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfirm } from '@/components/common/confirm-provider'
import { useCrm, useUpdateRow } from '@/hooks/useData'
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

  const confirm = useConfirm()
  const { stageById } = useCrm()

  /** A win counts as a sale and a reopen undoes a result, so both ask first (a loss asks for its reason instead). */
  const confirmed = async (deal: Deal, stage: Stage) => {
    const from = stageById.get(deal.stage_id)
    const kind = stage.is_won ? 'won' : from && (from.is_won || from.is_lost) && !stage.is_lost ? 'reopen' : null
    if (!kind) return true
    return confirm({ title: t(`confirm.${kind}.title`, { name: deal.title }), description: t(`confirm.${kind}.desc`, { stage: labels.stage(stage.name) }),
      confirmLabel: t(`confirm.${kind}.action`), tone: 'default', irreversible: false })
  }

  return async (deal: Deal, stage: Stage, lostReason?: string) => {
    if (deal.stage_id === stage.id && !lostReason) return
    if (!(await confirmed(deal, stage))) return
    update.mutate({ id: deal.id, patch: { stage_id: stage.id, ...(stage.is_lost ? { lost_reason: lostReason ?? null } : {}) } })
    announce(deal, stage, lostReason)
  }
}
