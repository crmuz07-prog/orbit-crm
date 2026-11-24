import { useState } from 'react'
import { Plus, Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PipelineSwitcher } from '@/features/deals/PipelineSwitcher'
import { useCreateRow, useCrm, useUpdateRow } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import { stagesOf, useCurrentPipeline, usePipelines } from '@/hooks/usePipelines'
import type { Pipeline, Stage } from '@/lib/types'
import { StageRow } from './StageRow'
import { IconButton } from '@/components/common/icon-button'

/** Name, default flag and delete of the selected pipeline. */
function PipelineToolbar({ pipeline, onDeleted }: { pipeline: Pipeline; onDeleted: () => void }) {
  const { t } = useTranslation()
  const actions = usePipelines()
  const shown = useLabels().pipeline(pipeline.name)
  const [name, setName] = useState(shown)
  const [confirm, setConfirm] = useState(false)
  const rename = () => name.trim() && name.trim() !== shown && actions.update.mutate({ id: pipeline.id, patch: { name: name.trim() } })
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-foreground/[0.06] px-5 py-3">
      <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={rename} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label={t('pipelines.name')} className="h-8 max-w-xs flex-1" />
      {pipeline.is_default ? <Badge tone="violet">{t('pipelines.default')}</Badge> : (
        <>
          <IconButton label={t('pipelines.makeDefault')} onClick={() => actions.update.mutate({ id: pipeline.id, patch: { is_default: true } })}><Star /></IconButton>
          <IconButton label={t('common.delete')} onClick={() => setConfirm(true)}><Trash2 /></IconButton>
        </>
      )}
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={t('pipelines.deleteConfirm', { name: pipeline.name })} description={t('pipelines.deleteDesc')}
        confirmLabel={t('common.delete')} onConfirm={() => actions.remove.mutate(pipeline.id, { onSuccess: onDeleted })} />
    </div>
  )
}

/** Settings → Pipelines: several pipelines, each with reorderable open stages; won/lost stay at the end (amoCRM / Pipedrive). */
export function StageEditor() {
  const { stages, deals } = useCrm()
  const { pipeline, pipelines, setPipeline } = useCurrentPipeline()
  const { create: createPipeline } = usePipelines()
  const create = useCreateRow('pipeline_stages')
  const update = useUpdateRow('pipeline_stages')
  const { t } = useTranslation()
  const ordered = stagesOf(stages, pipeline?.id)
  const open = ordered.filter((s) => !s.is_won && !s.is_lost)
  const closed = ordered.filter((s) => s.is_won || s.is_lost)
  const dealCount = (s: Stage) => deals.filter((d) => d.stage_id === s.id).length

  // Positions are rewritten as a dense sequence: open stages first, closed stages last.
  const persistOrder = (list: Stage[]) => list.forEach((s, position) => s.position !== position && update.mutate({ id: s.id, patch: { position } }))
  const move = (index: number, dir: -1 | 1) => {
    const next = [...open]
    ;[next[index], next[index + dir]] = [next[index + dir], next[index]]
    persistOrder([...next, ...closed])
  }
  const addStage = async () => {
    if (!pipeline) return
    const created = await create.mutateAsync({ pipeline_id: pipeline.id, name: t('settings.newStage'), position: open.length, probability: 50, color: 'blue' })
    persistOrder([...open, created, ...closed])
  }
  const addPipeline = () => createPipeline.mutate(t('pipelines.newName'), { onSuccess: (p) => setPipeline(p.id) })

  return (
    <Card>
      <CardHeader title={t('pipelines.title')} description={t('pipelines.description')}
        action={<Button size="sm" variant="outline" onClick={addPipeline}><Plus /> {t('pipelines.add')}</Button>} />
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-3">
        <PipelineSwitcher pipelines={pipelines} current={pipeline} onChange={setPipeline} />
        <Button size="sm" variant="outline" onClick={addStage}><Plus /> {t('settings.addStage')}</Button>
      </div>
      {pipeline && <PipelineToolbar key={pipeline.id} pipeline={pipeline} onDeleted={() => setPipeline(pipelines.find((p) => p.is_default)?.id ?? '')} />}
      <ul className="divide-y divide-foreground/[0.06]">
        {open.map((s, i) => (
          <StageRow key={s.id} stage={s} dealCount={dealCount(s)} canUp={i > 0} canDown={i < open.length - 1} onMove={(dir) => move(i, dir)} />
        ))}
        {closed.map((s) => <StageRow key={s.id} stage={s} dealCount={dealCount(s)} />)}
      </ul>
    </Card>
  )
}
