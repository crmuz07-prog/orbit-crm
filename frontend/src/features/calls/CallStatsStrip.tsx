import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AnimatedNumber } from '@/components/common/animated-number'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { duration, percent } from '@/lib/utils'
import { useAccess } from '@/hooks/useAccess'
import { CALL_QUERIES } from './useLogCall'

const count = (n: number) => String(Math.round(n))

export function CallStatsStrip() {
  const { t } = useTranslation()
  const { can } = useAccess()
  const allowed = can('reports', 'view')
  const { data } = useQuery({ queryKey: CALL_QUERIES.stats, queryFn: api.callStats, enabled: allowed })
  if (!allowed) return null
  if (!data) return <Skeleton className="mb-5 h-[76px] rounded-2xl" />

  const stats: [string, number, (n: number) => string][] = [
    [t('calls.today'), data.today, count],
    [t('calls.week'), data.this_week, count],
    [t('calls.connectRate'), data.connect_rate, percent],
    [t('calls.avgDuration'), data.avg_duration_seconds, (n) => duration(Math.round(n))],
    [t('calls.talkTime'), data.talk_time_seconds, (n) => duration(Math.round(n))],
  ]

  return (
    <Card className="mb-5 grid grid-cols-2 sm:grid-cols-5 sm:divide-x sm:divide-foreground/[0.06]">
      {stats.map(([label, value, format]) => (
        <div key={label} className="px-5 py-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-lg font-semibold"><AnimatedNumber value={value} format={format} /></p>
        </div>
      ))}
    </Card>
  )
}
