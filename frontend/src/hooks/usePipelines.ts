import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { pipelinesApi } from '@/lib/api'
import type { Pipeline, Stage } from '@/lib/types'
import { useCrm } from './useData'
import { useToastMutation } from './useToastMutation'

const KEY = ['pipelines']
// Stages are created and deleted together with pipelines.
const AFFECTED = [KEY, ['pipeline_stages'], ['deals']]

export function usePipelines() {
  const { t } = useTranslation()
  const query = useQuery({ queryKey: KEY, queryFn: pipelinesApi.list })
  return {
    pipelines: query.data ?? [],
    isLoading: query.isLoading,
    create: useToastMutation((name: string) => pipelinesApi.create(name), t('pipelines.created'), AFFECTED),
    update: useToastMutation((v: { id: string; patch: Partial<Pick<Pipeline, 'name' | 'position' | 'is_default'>> }) => pipelinesApi.update(v.id, v.patch), t('pipelines.saved'), AFFECTED),
    remove: useToastMutation((id: string) => pipelinesApi.remove(id), t('pipelines.deleted'), AFFECTED),
  }
}

export type PipelineActions = ReturnType<typeof usePipelines>

/** Stages of one pipeline in board order (open stages first, then won, then lost). */
export function stagesOf(stages: Stage[], pipelineId: string | undefined): Stage[] {
  const rank = (s: Stage) => (s.is_won ? 1 : s.is_lost ? 2 : 0)
  return stages.filter((s) => s.pipeline_id === pipelineId).sort((a, b) => rank(a) - rank(b) || a.position - b.position)
}

const PIPELINE_KEY = 'orbit:pipeline'

function storedPipeline(): string | null {
  try {
    return localStorage.getItem(PIPELINE_KEY)
  } catch {
    return null
  }
}

/**
 * The pipeline shown on the board, remembered per browser. The stored id is checked against the list only once it
 * has loaded (a check before that would throw the choice away); a deleted pipeline falls back to the default one.
 */
export function useCurrentPipeline() {
  const { pipelines } = usePipelines()
  const { stages } = useCrm()
  const [chosen, setChosen] = useState<string | null>(storedPipeline)
  const pipeline = useMemo(
    () => pipelines.find((p) => p.id === chosen) ?? pipelines.find((p) => p.is_default) ?? pipelines[0],
    [pipelines, chosen],
  )
  const setPipeline = (id: string) => {
    setChosen(id)
    try {
      localStorage.setItem(PIPELINE_KEY, id)
    } catch { /* storage unavailable: the choice lasts for this visit */ }
  }
  return { pipeline, pipelines, setPipeline, stages: stagesOf(stages, pipeline?.id) }
}

/** The stages of the pipeline a deal is in. */
export function useDealStages(stageId: string | undefined): Stage[] {
  const { stages, stageById } = useCrm()
  return stagesOf(stages, stageId ? stageById.get(stageId)?.pipeline_id : undefined)
}
