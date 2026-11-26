import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SaveBar } from '@/components/common/save-bar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useBeforeUnload } from '@/hooks/useUnsaved'
import { useUpdateRow } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import { spring } from '@/lib/motion'
import type { Stage } from '@/lib/types'
import { IconButton } from '@/components/common/icon-button'
import { StageColorPicker } from './StageColorPicker'
import { StageDeleteDialog } from './StageDeleteDialog'

/** Shared column widths of the stage list, so the header and every row line up. */
export const STAGE_GRID = 'grid grid-cols-[20px_minmax(0,1fr)_88px] items-center gap-2 sm:grid-cols-[20px_minmax(0,1fr)_88px_72px_96px]'

interface Props {
  stage: Stage
  /** All stages of the pipeline (for the delete dialog). */
  siblings: Stage[]
  dealCount: number
  onMove?: (dir: -1 | 1) => void
  canUp?: boolean
  canDown?: boolean
}

/** One stage: colour · name · chance · deals · move/delete; working stages also carry their board rule and day limit. */
export function StageRow({ stage, siblings, dealCount, onMove, canUp, canDown }: Props) {
  const update = useUpdateRow('pipeline_stages')
  const { t } = useTranslation()
  // Built-in names are edited in the user's language; an untouched name is never written back.
  const shown = useLabels().stage(stage.name)
  const [name, setName] = useState(shown)
  const [probability, setProbability] = useState(String(stage.probability))
  const [rule, setRule] = useState(stage.description ?? '')
  const [maxDays, setMaxDays] = useState(stage.max_days?.toString() ?? '')
  const [deleting, setDeleting] = useState(false)
  const closed = stage.is_won || stage.is_lost

  const days = maxDays ? Math.max(1, Math.min(365, Number(maxDays) || 1)) : null
  const percent = Math.max(0, Math.min(100, Number(probability) || 0))
  const renamed = !!name.trim() && name.trim() !== shown
  const dirty = renamed || percent !== stage.probability || (rule.trim() || null) !== stage.description || days !== stage.max_days
  useBeforeUnload(dirty)

  const cancel = () => {
    setName(shown)
    setProbability(String(stage.probability))
    setRule(stage.description ?? '')
    setMaxDays(stage.max_days?.toString() ?? '')
  }
  // One explicit save for the row: name, probability, the column rule and the day limit (board note + overdue flag).
  const save = () => {
    if (!dirty) return
    update.mutate(
      { id: stage.id, patch: { ...(renamed ? { name: name.trim() } : {}), probability: percent, description: rule.trim() || null, max_days: days } },
      { onSuccess: () => toast.success(t('settings.stageSaved')) },
    )
    setProbability(String(percent))
    setMaxDays(days?.toString() ?? '')
  }
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') cancel()
  }

  return (
    <motion.li layout transition={spring} className="space-y-1.5 px-4 py-2">
      <div className={STAGE_GRID}>
        <StageColorPicker stage={stage} />
        <div className="flex min-w-0 items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={keys} aria-label={t('setup.stageCols.name')} className="h-8 min-w-0 flex-1" />
          {closed && <Badge tone={stage.is_won ? 'green' : 'red'} className="shrink-0">{stage.is_won ? t('settings.wonStage') : t('settings.lostStage')}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Input type="number" min={0} max={100} value={probability} disabled={closed} onChange={(e) => setProbability(e.target.value)} onKeyDown={keys}
            aria-label={t('setup.stageCols.chance')} className="h-8 w-16 text-right" />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
        <span className="hidden text-right text-xs tabular-nums text-muted-foreground sm:block">{t('settings.dealCount', { count: dealCount })}</span>
        <div className="col-span-3 flex justify-end gap-0.5 sm:col-span-1">
          <span className="mr-auto self-center text-xs text-muted-foreground sm:hidden">{t('settings.dealCount', { count: dealCount })}</span>
          {!closed && <IconButton label={t('settings.moveUp')} disabled={!canUp} onClick={() => onMove?.(-1)}><ArrowUp /></IconButton>}
          {!closed && <IconButton label={t('settings.moveDown')} disabled={!canDown} onClick={() => onMove?.(1)}><ArrowDown /></IconButton>}
          <IconButton label={t('settings.deleteStage')} onClick={() => setDeleting(true)}><Trash2 /></IconButton>
        </div>
      </div>
      {!closed && (
        <div className="flex flex-wrap items-center gap-2 sm:pl-7">
          <Input value={rule} onChange={(e) => setRule(e.target.value)} onKeyDown={keys}
            placeholder={t('setup.rule')} aria-label={t('setup.rule')} className="h-8 min-w-[180px] flex-1 text-xs" />
          <Input type="number" min={1} max={365} value={maxDays} onChange={(e) => setMaxDays(e.target.value)} onKeyDown={keys}
            placeholder={t('setup.maxDays')} aria-label={t('setup.maxDays')} title={t('setup.maxDays')} className="h-8 w-40 text-xs" />
        </div>
      )}
      {dirty && <SaveBar dirty onSave={save} onCancel={cancel} className="sm:pl-7" />}
      {deleting && <StageDeleteDialog stage={stage} siblings={siblings} dealCount={dealCount} open={deleting} onOpenChange={setDeleting} />}
    </motion.li>
  )
}
