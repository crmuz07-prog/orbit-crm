import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateRow, useUpdateRow } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import { STAGE_COLORS } from '@/lib/constants'
import type { Stage, StageColor } from '@/lib/types'
import { cn } from '@/lib/utils'

/** A labelled field with one line saying what it does — every setting explains itself. */
function Field({ id, label, help, children }: { id?: string; label: string; help?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  )
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The stage to edit; without it a new working stage is added to `pipelineId` at `position`. */
  stage?: Stage
  pipelineId: string
  position: number
  onCreated?: (stage: Stage) => void
}

/** Add or edit a stage in one place: name, colour, chance to win, the board note and the day limit, each explained. */
export function StageDialog({ open, onOpenChange, stage, pipelineId, position, onCreated }: Props) {
  const { t } = useTranslation()
  const create = useCreateRow('pipeline_stages')
  const update = useUpdateRow('pipeline_stages')
  // Built-in names are shown (and edited) in the user's language; an untouched name is never written back.
  const shown = useLabels().stage(stage?.name ?? '')
  const closed = !!stage && (stage.is_won || stage.is_lost)
  const [name, setName] = useState(stage ? shown : '')
  const [color, setColor] = useState<StageColor>(stage?.color ?? 'blue')
  const [chance, setChance] = useState(String(stage?.probability ?? 50))
  const [rule, setRule] = useState(stage?.description ?? '')
  const [maxDays, setMaxDays] = useState(stage?.max_days?.toString() ?? '')

  const probability = Math.max(0, Math.min(100, Math.round(Number(chance) || 0)))
  const days = maxDays ? Math.max(1, Math.min(365, Math.round(Number(maxDays) || 1))) : null
  const busy = create.isPending || update.isPending

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const fields = { color, description: rule.trim() || null, max_days: closed ? null : days, ...(closed ? {} : { probability }) }
    if (stage) {
      const renamed = name.trim() !== shown
      update.mutate({ id: stage.id, patch: { ...fields, ...(renamed ? { name: name.trim() } : {}) } }, { onSuccess: () => { toast.success(t('settings.stageSaved')); onOpenChange(false) } })
      return
    }
    create.mutate({ ...fields, name: name.trim(), pipeline_id: pipelineId, position, probability }, {
      onSuccess: (created) => { toast.success(t('setup.stage.created')); onCreated?.(created); onOpenChange(false) },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{stage ? t('setup.stage.editTitle') : t('setup.stage.newTitle')}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field id="stage-name" label={t('setup.stage.name')}>
            <Input id="stage-name" autoFocus value={name} maxLength={120} placeholder={t('setup.stage.namePh')} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t('setup.stage.color')}>
            <div role="radiogroup" aria-label={t('setup.stage.color')} className="flex flex-wrap gap-2">
              {(Object.keys(STAGE_COLORS) as StageColor[]).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)}
                  className={cn('size-7 rounded-full transition', STAGE_COLORS[c].dot, color === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : 'opacity-50 hover:opacity-100')} />
              ))}
            </div>
          </Field>
          {closed ? <p className="rounded-lg bg-foreground/[0.04] px-3 py-2 text-xs text-muted-foreground">{t('setup.stage.closedChance')}</p> : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="stage-chance" label={t('setup.stage.chance')} help={t('setup.stage.chanceHelp')}>
                <div className="flex items-center gap-2">
                  <Input id="stage-chance" type="number" min={0} max={100} value={chance} onChange={(e) => setChance(e.target.value)} className="w-24 text-right" />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </Field>
              <Field id="stage-days" label={t('setup.stage.maxDays')} help={t('setup.stage.maxDaysHelp')}>
                <div className="flex items-center gap-2">
                  <Input id="stage-days" type="number" min={1} max={365} value={maxDays} placeholder="—" onChange={(e) => setMaxDays(e.target.value)} className="w-24 text-right" />
                  <span className="text-sm text-muted-foreground">{t('setup.stage.days')}</span>
                </div>
              </Field>
            </div>
          )}
          <Field id="stage-rule" label={t('setup.stage.rule')} help={t('setup.stage.ruleHelp')}>
            <Input id="stage-rule" value={rule} maxLength={300} placeholder={t('setup.stage.rulePh')} onChange={(e) => setRule(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={busy || !name.trim()}>{stage ? t('common.save') : t('setup.stage.add')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
