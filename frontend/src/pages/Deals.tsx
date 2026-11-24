import { useMemo, useState } from 'react'
import { Handshake, KanbanSquare, List, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import { Page } from '@/components/common/page'
import { CreateButton, ExportButton } from '@/components/common/record-actions'
import { matches, SearchInput } from '@/components/common/search-input'
import { EmptyState, PageSkeleton } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DealBoard } from '@/features/deals/DealBoard'
import { DealsTable } from '@/features/deals/DealsTable'
import { MovementReport } from '@/features/deals/MovementReport'
import { PipelineSwitcher } from '@/features/deals/PipelineSwitcher'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useCrm } from '@/hooks/useData'
import { usePersistentState } from '@/hooks/usePersistentState'
import { useCurrentPipeline } from '@/hooks/usePipelines'
import { PRIORITIES } from '@/lib/constants'
import { dealStatus, sumAmount, weightedValue } from '@/lib/metrics'
import { money } from '@/lib/utils'

const VIEWS = ['board', 'list'] as const
const STATUSES = ['open', 'won', 'lost'] as const

export default function DealsPage() {
  const { isLoading, deals: allDeals, stageById, companyById } = useCrm()
  const { pipeline, pipelines, setPipeline, stages } = useCurrentPipeline()
  // The board and the list show the chosen pipeline only (amoCRM: one voronka at a time).
  const deals = useMemo(() => allDeals.filter((d) => stageById.get(d.stage_id)?.pipeline_id === pipeline?.id), [allDeals, stageById, pipeline])
  const openModal = useEntityModal()
  const { t } = useTranslation()
  const [view, setView] = usePersistentState('orbit:deals-view', 'board', VIEWS)
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('')

  const filtered = useMemo(
    () =>
      deals.filter((d) =>
        (!priority || d.priority === priority) &&
        (view === 'board' || !status || dealStatus(d, stageById) === status) &&
        matches(query, d.title, d.company_id && companyById.get(d.company_id)?.name),
      ),
    [deals, query, priority, status, view, stageById, companyById],
  )
  const open = filtered.filter((d) => dealStatus(d, stageById) === 'open')
  const weighted = open.reduce((total, d) => total + weightedValue(d, stageById), 0)
  const newDeal = <CreateButton module="deals" onClick={() => openModal({ kind: 'deal', initial: stages[0] ? { stage_id: stages[0].id } : undefined })}><Plus /> {t('deals.newDeal')}</CreateButton>

  if (isLoading) return <PageSkeleton />

  return (
    <Page
      title={t('deals.title')}
      description={t('deals.summary', { open: money(sumAmount(open)), weighted: money(weighted), count: open.length })}
      actions={<><MovementReport pipeline={pipeline} stages={stages} /><ExportButton table="deals" />{newDeal}</>}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <PipelineSwitcher pipelines={pipelines} current={pipeline} onChange={setPipeline} />
        <SearchInput value={query} onChange={setQuery} placeholder={t('deals.search')} />
        <SelectBox value={priority} onChange={setPriority} emptyLabel={t('deals.allPriorities')} options={PRIORITIES.map((p) => ({ value: p.value, label: t('enums.priorityFilter', { label: t(`enums.priority.${p.value}`) }) }))} className="w-40" />
        {view === 'list' && <SelectBox value={status} onChange={setStatus} emptyLabel={t('deals.allStatuses')} options={STATUSES.map((s) => ({ value: s, label: t(`enums.status.${s}`) }))} className="w-36" />}
        <Tabs value={view} onValueChange={(v) => setView(v as (typeof VIEWS)[number])} className="ml-auto">
          <TabsList>
            <TabsTrigger value="board"><KanbanSquare /> {t('deals.board')}</TabsTrigger>
            <TabsTrigger value="list"><List /> {t('deals.list')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {deals.length === 0 ? (
        <Card><EmptyState icon={Handshake} title={t('deals.empty')} description={t('deals.emptyDesc')} action={newDeal} /></Card>
      ) : view === 'board' ? <DealBoard deals={filtered} stages={stages} /> : <DealsTable deals={filtered} />}
    </Page>
  )
}
