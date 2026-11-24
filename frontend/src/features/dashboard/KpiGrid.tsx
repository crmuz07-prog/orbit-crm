import { motion } from 'framer-motion'
import { CircleDollarSign, Gauge, Target, Trophy, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { AnimatedNumber } from '@/components/common/animated-number'
import { Card } from '@/components/ui/card'
import { fadeUp, stagger } from '@/lib/motion'
import type { Dashboard } from '@/lib/types'
import { money, percent } from '@/lib/utils'

export interface Kpi {
  label: string
  value: number
  format: (n: number) => string
  sub: string
  icon: LucideIcon
}

const compact = (n: number) => money(n, 'USD', true)

function kpis(d: Dashboard, t: TFunction): Kpi[] {
  return [
    { label: t('dashboard.openPipeline'), value: d.open_value, format: compact, sub: t('dashboard.openDeals', { count: d.open_count }), icon: CircleDollarSign },
    { label: t('dashboard.weighted'), value: d.weighted_value, format: compact, sub: t('dashboard.weightedSub'), icon: Target },
    { label: t('dashboard.wonQuarter'), value: d.won_this_quarter_value, format: compact, sub: t('dashboard.dealsClosed', { count: d.won_this_quarter_count }), icon: Trophy },
    { label: t('dashboard.winRate'), value: d.win_rate, format: percent, sub: t('dashboard.winRateSub', { amount: compact(d.avg_deal_size), days: d.avg_cycle_days }), icon: Gauge },
  ]
}

/** Row of KPI cards (dashboard, Instagram leads). */
export function KpiCards({ items, className = 'xl:grid-cols-4' }: { items: Kpi[]; className?: string }) {
  return (
    <motion.div initial="hidden" animate="show" variants={stagger(0.06)} className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${className}`}>
      {items.map(({ label, value, format, sub, icon: Icon }) => (
        <motion.div key={label} variants={fadeUp}>
          <Card className="p-5 transition-transform duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <span className="glass-glow flex size-8 items-center justify-center rounded-lg text-white"><Icon className="size-4" /></span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight"><AnimatedNumber value={value} format={format} /></p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

export function KpiGrid({ data }: { data: Dashboard }) {
  const { t } = useTranslation()
  return <KpiCards items={kpis(data, t)} />
}
