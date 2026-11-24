import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { Page } from '@/components/common/page'
import { PageLoading } from '@/components/common/states'
import { PipelineChart, RevenueChart } from '@/features/dashboard/charts'
import { KpiGrid } from '@/features/dashboard/KpiGrid'
import { AtRiskCard, TasksCard, TopDealsCard } from '@/features/dashboard/lists'
import { useCrm, useDashboard } from '@/hooks/useData'

function greetingKey() {
  const hour = new Date().getHours()
  return hour < 12 ? 'dashboard.morning' : hour < 18 ? 'dashboard.afternoon' : 'dashboard.evening'
}

export default function DashboardPage() {
  const { session } = useAuth()
  const { data } = useDashboard()
  const { isLoading } = useCrm()
  const { t } = useTranslation()
  const title = t(greetingKey(), { name: session?.user.full_name.split(' ')[0] })
  if (!data || isLoading) return <PageLoading title={title} description={t('dashboard.subtitle')} />

  return (
    <Page title={title} description={t('dashboard.subtitle')}>
      <KpiGrid data={data} />
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-5">
        <PipelineChart data={data.by_stage} className="xl:col-span-3" />
        <RevenueChart data={data.monthly} className="xl:col-span-2" />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <TasksCard />
        <TopDealsCard deals={data.top_open} />
        <AtRiskCard deals={data.stale} />
      </div>
    </Page>
  )
}
