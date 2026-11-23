import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { useCreateRow, useCrm, useUpdateRow } from '@/hooks/useData'
import type { Stage } from '@/lib/types'
import { StageRow } from './StageRow'

/** Pipeline editor: open stages are reorderable; won/lost stay at the end (Pipedrive settings). */
export function StageEditor() {
  const { stages, deals } = useCrm()
  const create = useCreateRow('pipeline_stages')
  const update = useUpdateRow('pipeline_stages')
  const { t } = useTranslation()
  const open = stages.filter((s) => !s.is_won && !s.is_lost)
  const closed = stages.filter((s) => s.is_won || s.is_lost)
  const dealCount = (s: Stage) => deals.filter((d) => d.stage_id === s.id).length

  // Positions are rewritten as a dense sequence: open stages first, closed stages last.
  const persistOrder = (ordered: Stage[]) =>
    ordered.forEach((s, position) => s.position !== position && update.mutate({ id: s.id, patch: { position } }))

  const move = (index: number, dir: -1 | 1) => {
    const next = [...open]
    ;[next[index], next[index + dir]] = [next[index + dir], next[index]]
    persistOrder([...next, ...closed])
  }

  const addStage = async () => {
    const created = await create.mutateAsync({ name: t('settings.newStage'), position: open.length, probability: 50, color: 'blue' })
    persistOrder([...open, created, ...closed])
  }

  return (
    <Card>
      <CardHeader
        title={t('settings.pipeline')}
        description={t('settings.pipelineDesc')}
        action={<Button size="sm" variant="outline" onClick={addStage}><Plus /> {t('settings.addStage')}</Button>}
      />
      <ul className="divide-y divide-foreground/[0.06]">
        {open.map((s, i) => (
          <StageRow key={s.id} stage={s} dealCount={dealCount(s)} canUp={i > 0} canDown={i < open.length - 1} onMove={(dir) => move(i, dir)} />
        ))}
        {closed.map((s) => <StageRow key={s.id} stage={s} dealCount={dealCount(s)} />)}
      </ul>
    </Card>
  )
}
