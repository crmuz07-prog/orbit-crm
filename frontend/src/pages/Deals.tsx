import { useMemo, useState } from 'react'
import { Handshake, KanbanSquare, List, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Page } from '@/components/common/page'
import { CreateButton, ExportButton } from '@/components/common/record-actions'
import { matches, SearchInput } from '@/components/common/search-input'
import { EmptyState, PageLoading } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { DealBoard } from '@/features/deals/DealBoard'
import { useDealFilters } from '@/features/deals/DealFilters'
import { PresetChips, PRESETS, usePresetFilter, type Preset } from '@/features/deals/DealPresets'
import { DealsTable } from '@/features/deals/DealsTable'
import { MovementReport } from '@/features/deals/MovementReport'
import { PipelineSwitcher } from '@/features/deals/PipelineSwitcher'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { ImportButton } from '@/features/import/ImportButton'
import { BulkBar } from '@/features/people/BulkBar'
import { useCrm } from '@/hooks/useData'
import { useNextTasks } from '@/hooks/useNextTasks'
import { usePersistentState } from '@/hooks/usePersistentState'
import { useCurrentPipeline } from '@/hooks/usePipelines'
import { dealStatus, sumAmount, weightedValue } from '@/lib/metrics'
import { fullName, money } from '@/lib/utils'

const VIEWS = ['board', 'list'] as const

export default function DealsPage() {
  const { isLoading, deals: allDeals, stageById, companyById, contactById } = useCrm()
  const { pipeline, pipelines, setPipeline, stages } = useCurrentPipeline()
  // The board and the list show the chosen pipeline only (amoCRM: one voronka at a time).
  const deals = useMemo(() => allDeals.filter((d) => stageById.get(d.stage_id)?.pipeline_id === pipeline?.id), [allDeals, stageById, pipeline])
  const openModal = useEntityModal()
  const { t } = useTranslation()
  const [view, setView] = usePersistentState('orbit:deals-view', 'board', VIEWS)
  const [preset, setPreset] = usePersistentState<Preset>('orbit:deals-preset', 'all', PRESETS)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const filters = useDealFilters()
  const byPreset = usePresetFilter(stageById, useNextTasks())
  const presetFilters = Object.fromEntries(PRESETS.map((p) => [p, byPreset(p)])) as Record<Preset, (d: (typeof deals)[number]) => boolean>

  // Search covers what a manager remembers about a deal: its name, the company, the person and their phone.
  const searchable = (d: (typeof deals)[number]) => {
    const contact = d.contact_id ? contactById.get(d.contact_id) : undefined
    return [d.title, d.company_id && companyById.get(d.company_id)?.name, contact && fullName(contact), contact?.phone]
  }
  const base = deals.filter((d) => filters.apply(d) && matches(query, ...searchable(d)))
  const counts = Object.fromEntries(PRESETS.map((p) => [p, base.filter(presetFilters[p]).length])) as Record<Preset, number>
  const filtered = base.filter(presetFilters[preset])
  const open = filtered.filter((d) => dealStatus(d, stageById) === 'open')
  const weighted = open.reduce((total, d) => total + weightedValue(d, stageById), 0)
  const newDeal = <CreateButton module="deals" onClick={() => openModal({ kind: 'deal', initial: stages[0] ? { stage_id: stages[0].id } : undefined })}><Plus /> {t('deals.newDeal')}</CreateButton>

  if (isLoading) return <PageLoading title={t('deals.title')} />

  return (
    <Page
      title={t('deals.title')}
      description={t('deals.summary', { open: money(sumAmount(open)), weighted: money(weighted), count: open.length })}
      actions={<><MovementReport pipeline={pipeline} stages={stages} /><ImportButton /><ExportButton table="deals" />{newDeal}</>}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <PipelineSwitcher pipelines={pipelines} current={pipeline} onChange={setPipeline} />
        <SearchInput value={query} onChange={setQuery} placeholder={t('deals.search')} />
        {filters.controls}
        <Tabs value={view} onValueChange={(v) => setView(v as (typeof VIEWS)[number])} className="ml-auto">
          <TabsList>
            <Tooltip content={t('deals.board')}><TabsTrigger value="board" aria-label={t('deals.board')}><KanbanSquare /></TabsTrigger></Tooltip>
            <Tooltip content={t('deals.list')}><TabsTrigger value="list" aria-label={t('deals.list')}><List /></TabsTrigger></Tooltip>
          </TabsList>
        </Tabs>
      </div>
      <div className="mb-3"><PresetChips value={preset} onChange={setPreset} counts={counts} /></div>
      {deals.length === 0 ? (
        <Card><EmptyState icon={Handshake} title={t('deals.empty')} description={t('deals.emptyDesc')} action={newDeal} /></Card>
      ) : view === 'board' ? <DealBoard deals={filtered} stages={stages} /> : (
        <>
          <DealsTable deals={filtered} selection={{ selected, onChange: setSelected }} />
          <BulkBar table="deals" selected={selected} onClear={() => setSelected(new Set())} stages={stages} />
        </>
      )}
    </Page>
  )
}
