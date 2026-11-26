import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { useCrm, useUpdateRow } from '@/hooks/useData'
import { stagesOf, useCurrentPipeline, usePipelines } from '@/hooks/usePipelines'
import type { Stage } from '@/lib/types'
import { PipelineTabs } from './PipelineTabs'
import { StageDialog } from './StageDialog'
import { StageList } from './StageList'

/**
 * Settings → Pipelines and stages (Pipedrive / amoCRM): pipelines as tabs, the chosen pipeline's stages as a readable
 * list — drag to reorder, click to edit in a dialog that explains every field; won / lost stay at the end.
 */
export function StageEditor() {
  const { t } = useTranslation()
  const { stages, deals, stageById } = useCrm()
  const { pipeline, pipelines, setPipeline } = useCurrentPipeline()
  const actions = usePipelines()
  const update = useUpdateRow('pipeline_stages')
  const [adding, setAdding] = useState(false)
  const ordered = stagesOf(stages, pipeline?.id)
  const open = ordered.filter((s) => !s.is_won && !s.is_lost)
  const closed = ordered.filter((s) => s.is_won || s.is_lost)
  const dealCount = (s: Stage) => deals.filter((d) => d.stage_id === s.id).length
  const pipelineDeals = (id: string) => deals.filter((d) => stageById.get(d.stage_id)?.pipeline_id === id).length

  // Positions are rewritten as a dense sequence: working stages first, final stages last.
  const persistOrder = (list: Stage[]) => list.forEach((s, position) => s.position !== position && update.mutate({ id: s.id, patch: { position } }))

  return (
    <Card>
      <CardHeader title={t('setup.nav.pipelines')} description={t('setup.pipe.desc')}
        action={pipeline && <Button size="sm" onClick={() => setAdding(true)}><Plus /> {t('setup.stage.add')}</Button>} />
      <PipelineTabs pipelines={pipelines} current={pipeline} dealCount={pipelineDeals} onSelect={setPipeline} actions={actions} />
      <StageList open={open} closed={closed} dealCount={dealCount} onReorder={(list) => persistOrder([...list, ...closed])} />
      {adding && pipeline && (
        <StageDialog open onOpenChange={setAdding} pipelineId={pipeline.id} position={open.length}
          onCreated={(created) => persistOrder([...open, created, ...closed])} />
      )}
    </Card>
  )
}
