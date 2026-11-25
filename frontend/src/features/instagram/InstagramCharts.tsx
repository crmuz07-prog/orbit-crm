import { Bar, BarChart, Tooltip, XAxis, YAxis } from 'recharts'
import { Megaphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/common/states'
import { Card, CardHeader } from '@/components/ui/card'
import { axis, ChartCard, grid } from '@/features/dashboard/charts'
import type { InstagramStats } from '@/lib/types'
import { shortDate } from '@/lib/utils'

/** Stacked bars: Direct conversations and lead forms per day. */
export function LeadsPerDayChart({ data, className }: { data: InstagramStats['per_day']; className?: string }) {
  const { t } = useTranslation()
  const rows = data.map((d) => ({ ...d, label: shortDate(d.date).replace(/\s\d{4}$/, '') }))
  return (
    <ChartCard title={t('instagram.perDay')} description={t('instagram.perDayDesc')} className={className}>
      <BarChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
        {grid}
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
        <Tooltip cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Bar dataKey="messages" name={t('instagram.messages')} stackId="leads" fill="#ec4899" radius={[0, 0, 0, 0]} maxBarSize={36} />
        <Bar dataKey="lead_forms" name={t('instagram.leadForms')} stackId="leads" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ChartCard>
  )
}

/** Ads ranked by leads, with how many of them were won. */
export function TopAdsCard({ ads, className }: { ads: InstagramStats['top_ads']; className?: string }) {
  const { t } = useTranslation()
  const most = Math.max(1, ...ads.map((a) => a.leads))
  return (
    <Card className={className}>
      <CardHeader title={t('instagram.topAds')} description={t('instagram.topAdsDesc')} />
      {ads.length === 0 ? <EmptyState icon={Megaphone} title={t('instagram.noAds')} compact /> : (
        <ul className="space-y-3 px-4 py-3">
          {ads.map((ad) => (
            <li key={ad.ad_id}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-mono text-xs">{t('instagram.ad')} {ad.ad_id}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{ad.leads} · <span className="text-emerald-600 dark:text-emerald-400">{ad.won}</span></span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                <div className="h-full rounded-full bg-pink-500" style={{ width: `${(ad.leads / most) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
