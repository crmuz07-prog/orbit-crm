import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Page } from '@/components/common/page'
import { EmptyState, PageLoading } from '@/components/common/states'
import { Card } from '@/components/ui/card'
import { KpiCards, type Kpi } from '@/features/dashboard/KpiGrid'
import { PipelineSwitcher } from '@/features/deals/PipelineSwitcher'
import { FunnelCard } from '@/features/reports/FunnelCard'
import { LostReasonsCard } from '@/features/reports/LostReasonsCard'
import { distinctBreakdowns, SlicesCard } from '@/features/reports/SlicesCard'
import { PeriodBar } from '@/features/reports/PeriodBar'
import { usePeriod } from '@/features/reports/usePeriod'
import { useCurrentPipeline } from '@/hooks/usePipelines'
import { reportsApi } from '@/lib/api'
import type { ReportTotals } from '@/lib/types'
import { money, percent } from '@/lib/utils'

const count = (n: number) => String(Math.round(n))

/** Five figures, none repeated: leads, sold (with conversion), lost (with its share), follow-ups due, flagged fields. */
function useKpis(s: ReportTotals): Kpi[] {
  const { t } = useTranslation()
  const conversion = percent(s.conversion)
  return [
    { label: t('reports.total'), value: s.total, format: count, sub: t('reports.insight.openSub', { count: s.open }), to: '/deals' },
    { label: t('reports.insight.sold'), value: s.won, format: count, sub: s.won_value > 0 ? t('reports.insight.soldSum', { p: conversion, sum: money(s.won_value, undefined, true) }) : t('reports.insight.soldSub', { p: conversion }) },
    { label: t('reports.lost'), value: s.lost, format: count, sub: t('reports.insight.lostSub', { p: s.total ? percent((s.lost / s.total) * 100) : '0%' }) },
    { label: t('reports.insight.followUp'), value: s.tasks_overdue, format: count, sub: t('reports.insight.followUpSub', { none: s.no_task, today: s.tasks_today }), to: '/tasks', alert: s.tasks_overdue > 0 },
    { label: t('reports.warnings'), value: s.warnings, format: count, sub: t('reports.insight.warningsSub'), alert: s.warnings > 0 },
  ]
}

function Body({ pipelineId, from, to }: { pipelineId: string; from: string; to: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({ queryKey: ['reports', 'leads', pipelineId, from, to], queryFn: () => reportsApi.leads(pipelineId, from, to), placeholderData: (prev) => prev })
  const kpis = useKpis(data?.totals ?? ({} as ReportTotals))
  if (isLoading || !data) return <div className="h-64 animate-pulse rounded-2xl bg-foreground/[0.04]" />
  if (data.totals.total === 0) return <Card><EmptyState icon={BarChart3} title={t('reports.empty')} description={t('reports.emptyDesc')} /></Card>
  const reasons = data.breakdowns.find((b) => b.key === 'lost_reason')
  const slices = distinctBreakdowns(data.breakdowns.filter((b) => b.key !== 'lost_reason'))
  return (
    <div className="space-y-3">
      <KpiCards items={kpis} className="xl:grid-cols-5" />
      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-5">
        <FunnelCard report={data} className="xl:col-span-3" />
        <LostReasonsCard breakdown={reasons} className="xl:col-span-2" />
      </div>
      <SlicesCard breakdowns={slices} withSales={data.totals.won > 0} />
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
    <Page title={t('reports.title')} description={t('reports.insight.description')}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <PipelineSwitcher pipelines={pipelines} current={pipeline} onChange={setPipeline} />
        <PeriodBar period={period} />
      </div>
      <Body pipelineId={pipeline.id} from={period.from} to={period.to} />
    </Page>
  )
}
