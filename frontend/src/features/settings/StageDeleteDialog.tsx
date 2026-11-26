import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { SelectBox } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useLabels } from '@/hooks/useLabels'
import { pipelinesApi } from '@/lib/api'
import type { Stage } from '@/lib/types'
import { errorMessage } from '@/lib/utils'

const kindOf = (s: Stage) => (s.is_won ? 'won' : s.is_lost ? 'lost' : 'open')

interface Props {
  stage: Stage
  /** All stages of the same pipeline (the target list and the "last of its kind" check). */
  siblings: Stage[]
  dealCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Delete a stage the way amoCRM does: a stage with deals asks where they go (same kind of stage first, preselected),
 * and the only won or lost stage of a pipeline cannot go at all.
 */
export function StageDeleteDialog({ stage, siblings, dealCount, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const labels = useLabels()
  const qc = useQueryClient()
  const name = labels.stage(stage.name)
  const others = siblings.filter((s) => s.id !== stage.id)
  const sameKind = others.filter((s) => kindOf(s) === kindOf(stage))
  const last = stage.is_won || stage.is_lost ? sameKind.length === 0 : false
  // Merging duplicates is the common case: a lost stage's deals go to the other lost stage by default.
  const [target, setTarget] = useState(sameKind[0]?.id ?? '')
  const ordered = [...sameKind, ...others.filter((s) => kindOf(s) !== kindOf(stage))]

  const remove = useMutation({
    mutationFn: () => pipelinesApi.removeStage(stage.id, dealCount ? target : undefined),
    onSuccess: async () => {
      await Promise.all([['pipeline_stages'], ['deals'], ['dashboard'], ['events'], ['stage-times']].map((queryKey) => qc.invalidateQueries({ queryKey })))
      toast.success(t('setup.stageDelete.done'))
      onOpenChange(false)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const kind = t(stage.is_won ? 'settings.wonStage' : 'settings.lostStage').toLocaleLowerCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('setup.stageDelete.title', { name })}</DialogTitle>
          <DialogDescription>
            {last ? t('setup.stageDelete.last', { kind }) : dealCount ? t('setup.stageDelete.hasDeals', { count: dealCount }) : t('setup.stageDelete.empty')}
          </DialogDescription>
        </DialogHeader>
        {!last && dealCount > 0 && (
          <div className="space-y-1.5">
            <Label>{t('setup.stageDelete.moveTo')}</Label>
            <SelectBox value={target} onChange={setTarget} emptyLabel={t('setup.stageDelete.pick')}
              options={ordered.map((s) => ({ value: s.id, label: labels.stage(s.name) }))} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          {!last && (
            <Button variant="destructive" disabled={remove.isPending || (dealCount > 0 && !target)} onClick={() => remove.mutate()}>
              {dealCount ? t('setup.stageDelete.action') : t('common.delete')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
