import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Page } from '@/components/common/page'
import { EmptyState, PageLoading } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { KpiCards } from '@/features/dashboard/KpiGrid'
import { PipelineSwitcher } from '@/features/deals/PipelineSwitcher'
import { BreakdownCard } from '@/features/reports/BreakdownCard'
import { FunnelCard } from '@/features/reports/FunnelCard'
import { PeriodBar } from '@/features/reports/PeriodBar'
import { usePeriod } from '@/features/reports/usePeriod'
import { useCurrentPipeline } from '@/hooks/usePipelines'
import { reportsApi } from '@/lib/api'
import type { ReportTotals } from '@/lib/types'
import { percent } from '@/lib/utils'

const count = (n: number) => String(Math.round(n))

function useKpis(s: ReportTotals) {
  const { t } = useTranslation()
  return [
    { label: t('reports.total'), value: s.total, format: count, sub: `${t('reports.open')}: ${s.open}` },
    { label: t('reports.won'), value: s.won, format: count, sub: `${t('reports.conversion')}: ${percent(s.conversion)}` },
    { label: t('reports.lost'), value: s.lost, format: count, sub: s.total ? percent((s.lost / s.total) * 100) : '—' },
    { label: t('reports.conversion'), value: s.conversion, format: percent, sub: `${t('reports.won')}: ${s.won} / ${s.total}` },
    { label: t('reports.overdue'), value: s.tasks_overdue, format: count, sub: `${t('reports.today')}: ${s.tasks_today}` },
    { label: t('reports.noTask'), value: s.no_task, format: count, sub: t('reports.open') },
    { label: t('reports.warnings'), value: s.warnings, format: count, sub: t('customFields.warn') },
  ]
}

function Body({ pipelineId, from, to }: { pipelineId: string; from: string; to: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({ queryKey: ['reports', 'leads', pipelineId, from, to], queryFn: () => reportsApi.leads(pipelineId, from, to), placeholderData: (prev) => prev })
  const kpis = useKpis(data?.totals ?? ({} as ReportTotals))
  if (isLoading || !data) return <div className="h-64 animate-pulse rounded-2xl bg-foreground/[0.04]" />
  if (data.totals.total === 0) return <Card><EmptyState icon={BarChart3} title={t('reports.empty')} description={t('reports.emptyDesc')} /></Card>
  return (
    <div className="space-y-3">
      <KpiCards items={kpis} className="lg:grid-cols-4 xl:grid-cols-7" />
      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-2">
        <FunnelCard report={data} />
        {data.breakdowns.map((b) => <BreakdownCard key={b.key} breakdown={b} />)}
      </div>
    </div>
  )
}

/** Lead report: the client's spreadsheet report (funnel, sources, campaigns, fields, loss reasons, managers), live. */
export default function ReportsPage() {
  const { t } = useTranslation()
  const { pipeline, pipelines, setPipeline } = useCurrentPipeline()
  const period = usePeriod()
  if (!pipeline) return <PageLoading title={t('reports.title')} />
  return (
    <Page title={t('reports.title')} description={t('reports.description')}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <PipelineSwitcher pipelines={pipelines} current={pipeline} onChange={setPipeline} />
        <PeriodBar period={period} />
      </div>
      <Body pipelineId={pipeline.id} from={period.from} to={period.to} />
    </Page>
  )
}
