import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatedNumber } from '@/components/common/animated-number'
import { Card } from '@/components/ui/card'
import { useCrm } from '@/hooks/useData'
import { dueBucket } from '@/lib/metrics'
import { fadeUp, stagger } from '@/lib/motion'
import type { Dashboard } from '@/lib/types'
import { cn, money, percent } from '@/lib/utils'

export interface Kpi {
  label: string
  value: number
  format: (n: number) => string
  sub: string
  /** Where the figure comes from — the card opens it. */
  to?: string
  /** Something needs doing (e.g. overdue tasks): the number turns red. */
  alert?: boolean
}

const count = (n: number) => String(Math.round(n))

/** Row of KPI cards (dashboard, reports, Instagram leads). */
export function KpiCards({ items, className = 'xl:grid-cols-4' }: { items: Kpi[]; className?: string }) {
  return (
    <motion.div initial="hidden" animate="show" variants={stagger(0.06)} className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${className}`}>
      {items.map(({ label, value, format, sub, to, alert }) => {
        const body = (
          <Card className={cn('h-full p-3.5 transition-transform duration-300', to && 'hover:-translate-y-0.5')}>
            <p className="truncate text-xs font-medium text-muted-foreground" title={label}>{label}</p>
            <p className={cn('mt-1 text-xl font-semibold tracking-tight', alert && 'text-rose-600 dark:text-rose-400')}><AnimatedNumber value={value} format={format} /></p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground" title={sub}>{sub}</p>
          </Card>
        )
        return (
          <motion.div key={label} variants={fadeUp}>
            {to ? <Link to={to} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{body}</Link> : body}
          </motion.div>
        )
      })}
    </motion.div>
  )
}

/**
 * The four figures a manager checks first. Money when deals carry amounts; counts when they do not (lead-driven teams
 * such as Paket Makon), so no card is a row of zeros.
 */
export function KpiGrid({ data, withMoney }: { data: Dashboard; withMoney: boolean }) {
  const { t } = useTranslation()
  const { activities } = useCrm()
  const buckets = activities.map(dueBucket)
  const overdue = buckets.filter((b) => b === 'overdue').length
  const today = buckets.filter((b) => b === 'today').length
  const items: Kpi[] = [
    withMoney
      ? { label: t('overview.open'), value: data.open_value, format: (n) => money(n, undefined, true), sub: t('dashboard.openDeals', { count: data.open_count }), to: '/deals' }
      : { label: t('overview.open'), value: data.open_count, format: count, sub: t('overview.openNone'), to: '/deals' },
    { label: t('overview.newLeads'), value: data.new_week, format: count, sub: t('overview.newSub', { count: data.new_today }), to: '/deals' },
    { label: t('overview.tasks'), value: overdue, format: count, sub: t('overview.tasksSub', { count: today }), to: '/tasks', alert: overdue > 0 },
    { label: t('overview.winRate'), value: data.win_rate, format: percent, sub: t('overview.winSub', { won: data.won_count, lost: data.lost_count }) },
  ]
  return <KpiCards items={items} />
}
