import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRemoveRow, useUpdateRow } from '@/hooks/useData'
import { STAGE_COLORS } from '@/lib/constants'
import { spring } from '@/lib/motion'
import type { Stage, StageColor } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  stage: Stage
  dealCount: number
  onMove?: (dir: -1 | 1) => void
  canUp?: boolean
  canDown?: boolean
}

function ColorPicker({ stage }: { stage: Stage }) {
  const update = useUpdateRow('pipeline_stages')
  return (
    <div className="flex gap-1">
      {(Object.keys(STAGE_COLORS) as StageColor[]).map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          onClick={() => update.mutate({ id: stage.id, patch: { color: c } })}
          className={cn('size-4 rounded-full transition', STAGE_COLORS[c].dot, stage.color === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : 'opacity-40 hover:opacity-100')}
        />
      ))}
    </div>
  )
}

export function StageRow({ stage, dealCount, onMove, canUp, canDown }: Props) {
  const update = useUpdateRow('pipeline_stages')
  const remove = useRemoveRow('pipeline_stages')
  const { t } = useTranslation()
  const [name, setName] = useState(stage.name)
  const [probability, setProbability] = useState(String(stage.probability))
  const [rule, setRule] = useState(stage.description ?? '')
  const [maxDays, setMaxDays] = useState(stage.max_days?.toString() ?? '')
  const closed = stage.is_won || stage.is_lost

  const save = () => {
    const p = Math.max(0, Math.min(100, Number(probability) || 0))
    if (!name.trim()) return setName(stage.name)
    if (name.trim() === stage.name && p === stage.probability) return
    update.mutate({ id: stage.id, patch: { name: name.trim(), probability: p } })
    setProbability(String(p))
    toast.success(t('settings.stageSaved'))
  }

  // The rule text and the day limit drive the board column note and the overdue flag on cards.
  const saveRule = () => {
    const days = maxDays ? Math.max(1, Math.min(365, Number(maxDays) || 1)) : null
    if ((rule.trim() || null) === stage.description && days === stage.max_days) return
    update.mutate({ id: stage.id, patch: { description: rule.trim() || null, max_days: days } })
    setMaxDays(days?.toString() ?? '')
    toast.success(t('settings.stageSaved'))
  }

  return (
    <motion.li layout transition={spring} className="space-y-2 px-5 py-3">
      <div className="flex flex-wrap items-center gap-3">
      <ColorPicker stage={stage} />
      <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} className="h-8 min-w-[160px] flex-1" />
      <div className="flex items-center gap-1.5">
        <Input type="number" min={0} max={100} value={probability} disabled={closed} onChange={(e) => setProbability(e.target.value)} onBlur={save} className="h-8 w-20 text-right" />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
      <span className="w-20 text-right text-xs text-muted-foreground">{t('settings.dealCount', { count: dealCount })}</span>
      {closed ? (
        <Badge tone={stage.is_won ? 'green' : 'red'} className="w-[100px] justify-center">{stage.is_won ? t('settings.wonStage') : t('settings.lostStage')}</Badge>
      ) : (
        <div className="flex w-[100px] justify-end gap-0.5">
          <Button variant="ghost" size="icon" disabled={!canUp} onClick={() => onMove?.(-1)} aria-label={t('settings.moveUp')}><ArrowUp /></Button>
          <Button variant="ghost" size="icon" disabled={!canDown} onClick={() => onMove?.(1)} aria-label={t('settings.moveDown')}><ArrowDown /></Button>
          <Button variant="ghost" size="icon" onClick={() => remove.mutate(stage.id)} aria-label={t('settings.deleteStage')}><Trash2 /></Button>
        </div>
      )}
      </div>
      {!closed && (
        <div className="flex flex-wrap items-center gap-2 pl-[116px] max-sm:pl-0">
          <Input value={rule} onChange={(e) => setRule(e.target.value)} onBlur={saveRule} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder={t('pipelines.rulePlaceholder')} aria-label={t('pipelines.rule')} className="h-8 min-w-[200px] flex-1 text-xs" />
          <Input type="number" min={1} max={365} value={maxDays} onChange={(e) => setMaxDays(e.target.value)} onBlur={saveRule}
            placeholder={t('pipelines.maxDays')} aria-label={t('pipelines.maxDays')} className="h-8 w-28 text-xs" />
        </div>
      )}
    </motion.li>
  )
}
