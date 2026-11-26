import { useState } from 'react'
import { Plus, Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { SaveBar } from '@/components/common/save-bar'
import { useBeforeUnload } from '@/hooks/useUnsaved'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PipelineSwitcher } from '@/features/deals/PipelineSwitcher'
import { useCreateRow, useCrm, useUpdateRow } from '@/hooks/useData'
import { useLabels } from '@/hooks/useLabels'
import { stagesOf, useCurrentPipeline, usePipelines } from '@/hooks/usePipelines'
import type { Pipeline, Stage } from '@/lib/types'
import { STAGE_GRID, StageRow } from './StageRow'
import { IconButton } from '@/components/common/icon-button'
import { useConfirm } from '@/components/common/confirm-provider'
import { cn } from '@/lib/utils'

/** Header of the stage list: what each column is. */
function StageColumns() {
  const { t } = useTranslation()
  return (
    <div className={cn(STAGE_GRID, 'border-b border-foreground/[0.06] px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground')}>
      <span />
      <span>{t('setup.stageCols.name')}</span>
      <span>{t('setup.stageCols.chance')}</span>
      <span className="hidden text-right sm:block">{t('setup.stageCols.deals')}</span>
      <span className="hidden sm:block" />
    </div>
  )
}

function GroupTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <li className="bg-foreground/[0.02] px-4 py-1.5">
      <p className="text-xs font-semibold">{title}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </li>
  )
}

/** Name, default flag and delete of the selected pipeline. */
function PipelineToolbar({ pipeline, onDeleted }: { pipeline: Pipeline; onDeleted: () => void }) {
  const { t } = useTranslation()
  const actions = usePipelines()
  const shown = useLabels().pipeline(pipeline.name)
  const [name, setName] = useState(shown)
  const [confirm, setConfirm] = useState(false)
  const ask = useConfirm()
  const dirty = !!name.trim() && name.trim() !== shown
  useBeforeUnload(dirty)
  const rename = () => dirty && actions.update.mutate({ id: pipeline.id, patch: { name: name.trim() } })
  const makeDefault = async () => {
    const options = { title: t('confirm.defaultPipeline.title', { name: shown }), description: t('confirm.defaultPipeline.desc'), confirmLabel: t('confirm.defaultPipeline.action'), tone: 'default' as const }
    if (await ask(options)) actions.update.mutate({ id: pipeline.id, patch: { is_default: true } })
  }
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') rename(); if (e.key === 'Escape') setName(shown) }}
        aria-label={t('pipelines.name')} className="h-8 max-w-xs flex-1" />
      {dirty && <SaveBar dirty onSave={rename} onCancel={() => setName(shown)} />}
      {pipeline.is_default ? <Badge tone="violet">{t('pipelines.default')}</Badge> : (
        <>
          <IconButton label={t('pipelines.makeDefault')} onClick={makeDefault}><Star /></IconButton>
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
      {/* One row for the pipeline itself: which one, its name, default, delete; stages come below. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-foreground/[0.06] px-4 py-2">
        {pipelines.length > 1 && <PipelineSwitcher pipelines={pipelines} current={pipeline} onChange={setPipeline} />}
        {pipeline && <PipelineToolbar key={pipeline.id} pipeline={pipeline} onDeleted={() => setPipeline(pipelines.find((p) => p.is_default)?.id ?? '')} />}
        <Button size="sm" variant="outline" onClick={addStage} className="ml-auto"><Plus /> {t('settings.addStage')}</Button>
      </div>
      <StageColumns />
      <ul className="divide-y divide-foreground/[0.06]">
        <GroupTitle title={t('setup.openStages')} />
        {open.map((s, i) => (
          <StageRow key={s.id} stage={s} siblings={ordered} dealCount={dealCount(s)} canUp={i > 0} canDown={i < open.length - 1} onMove={(dir) => move(i, dir)} />
        ))}
        <GroupTitle title={t('setup.closedStages')} hint={t('setup.closedHint')} />
        {closed.map((s) => <StageRow key={s.id} stage={s} siblings={ordered} dealCount={dealCount(s)} />)}
      </ul>
    </Card>
  )
}
