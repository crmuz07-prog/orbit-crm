import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Instagram, MessageCircle, Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SelectBox } from '@/components/common/form-fields'
import { Page } from '@/components/common/page'
import { EmptyState, PageLoading } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { KpiCards } from '@/features/dashboard/KpiGrid'
import { LeadsPerDayChart, TopAdsCard } from '@/features/instagram/InstagramCharts'
import { LatestLeads } from '@/features/instagram/LatestLeads'
import { useInstagramSettings } from '@/features/instagram/useInstagram'
import { formatDuration } from '@/features/record/duration'
import { useAccess } from '@/hooks/useAccess'
import { instagramApi } from '@/lib/api'
import type { InstagramStats } from '@/lib/types'
import { percent } from '@/lib/utils'

const PERIODS = ['7', '30', '90'] as const
const count = (n: number) => String(Math.round(n))

function useKpis(s: InstagramStats) {
  const { t } = useTranslation()
  return [
    { label: t('instagram.leads'), value: s.leads, format: count, sub: `${t('instagram.messages')}: ${s.messages} · ${t('instagram.leadForms')}: ${s.lead_forms}` },
    { label: t('instagram.conversion'), value: s.conversion, format: percent, sub: `${t('instagram.won')}: ${s.won}` },
    { label: t('instagram.avgResponse'), value: s.avg_first_response_seconds ?? 0, format: (n: number) => (s.avg_first_response_seconds == null ? '—' : formatDuration(n, t)), sub: t('igReply.window') },
    { label: t('instagram.unanswered'), value: s.unanswered, format: count, sub: t('instagram.messages') },
  ]
}

/** Admins can try the flow before Meta is connected; everyone else is pointed at the settings. */
function NoLeads() {
  const { t } = useTranslation()
  const { isAdmin } = useAccess()
  const { simulate } = useInstagramSettings()
  return (
    <Card>
      <EmptyState icon={Instagram} title={t('instagram.empty')} description={t('instagram.emptyDesc')} action={isAdmin && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => simulate.mutate('message')} disabled={simulate.isPending}><MessageCircle /> {t('instagram.simulateMessage')}</Button>
          <Button variant="outline" asChild><Link to="/settings"><Settings2 /> {t('instagram.openSettings')}</Link></Button>
        </div>
      )} />
    </Card>
  )
}

function StatsView({ stats }: { stats: InstagramStats }) {
  return (
    <div className="space-y-3">
      <KpiCards items={useKpis(stats)} />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <LeadsPerDayChart data={stats.per_day} className="xl:col-span-2" />
        <TopAdsCard ads={stats.top_ads} />
      </div>
      <LatestLeads />
    </div>
  )
}

/** Instagram leads: volume, conversion, reply speed and the ads behind them (amoCRM / Kommo channel analytics). */
export default function InstagramPage() {
  const { t } = useTranslation()
  const [days, setDays] = useState<string>('30')
  const { data } = useQuery({ queryKey: ['instagram-stats', days], queryFn: () => instagramApi.stats(Number(days)), refetchInterval: 30_000 })
  if (!data) return <PageLoading title={t('instagram.title')} description={t('instagram.description')} />
  return (
    <Page title={t('instagram.title')} description={t('instagram.description')}
      actions={<SelectBox value={days} onChange={setDays} options={PERIODS.map((d) => ({ value: d, label: t('report.days', { count: Number(d) }) }))} className="w-44" />}>
      {data.leads === 0 ? <NoLeads /> : <StatsView stats={data} />}
    </Page>
  )
}
