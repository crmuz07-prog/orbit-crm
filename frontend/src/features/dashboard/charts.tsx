import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useLabels } from '@/hooks/useLabels'
import { Card, CardHeader } from '@/components/ui/card'
import { STAGE_COLORS } from '@/lib/constants'
import type { Dashboard } from '@/lib/types'
import { compactNumber, money, monthLabel } from '@/lib/utils'

export const axis = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
// Long stage names would overlap under the bars; the full name is in the chart tooltip.
const short = (name: string) => (name.length > 11 ? `${name.slice(0, 10)}…` : name)

function ChartTooltip({ active, payload, label, format = money }: TooltipProps<number, string> & { format?: (n: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color ?? (p.payload as { fill?: string }).fill }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums text-foreground">{format(p.value ?? 0)}</span>
        </p>
      ))}
    </div>
  )
}

/** Card + responsive chart frame with shared grid/axes, so each chart only declares its series. */
export function ChartCard({ title, description, className, children }: { title: string; description: string; className?: string; children: ReactElement }) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} />
      <div className="h-72 p-4 text-foreground/[0.07]">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </Card>
  )
}

export const grid = <CartesianGrid vertical={false} stroke="currentColor" />
// Axis ticks without the currency word: the chart title says it is money, and "1,5 mln so'm" would not fit.
const yAxis = <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={compactNumber} width={60} />

const asCount = (n: number) => String(Math.round(n))
const countAxis = <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} width={32} />

/** Open deals per stage: their amount when deals carry amounts, otherwise how many there are. */
export function PipelineChart({ data, byValue, className }: { data: Dashboard['by_stage']; byValue: boolean; className?: string }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const rows = data.map((s) => ({ ...s, name: labels.stage(s.name) }))
  return (
    <ChartCard className={className}
      title={byValue ? t('overview.stagesValue') : t('overview.stagesCount')} description={byValue ? t('overview.stagesValueDesc') : t('overview.stagesCountDesc')}>
      <BarChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
        {grid}
        <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} interval={0} tickFormatter={short} />
        {byValue ? yAxis : countAxis}
        <Tooltip content={<ChartTooltip format={byValue ? money : asCount} />} cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }} />
        <Bar dataKey={byValue ? 'value' : 'count'} name={byValue ? t('dashboard.value') : t('overview.count')} radius={[6, 6, 0, 0]} maxBarSize={56} animationDuration={700}>
          {rows.map((s) => <Cell key={s.id} fill={STAGE_COLORS[s.color].hex} />)}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

/** Sold and lost per month, last six months: an amount trend when deals carry amounts, side-by-side counts otherwise. */
export function RevenueChart({ data, byValue, className }: { data: Dashboard['monthly']; byValue: boolean; className?: string }) {
  const { t } = useTranslation()
  const rows = data.map((m) => ({ ...m, label: monthLabel(new Date(`${m.month}-01T00:00:00`)) }))
  const head = { title: byValue ? t('overview.closedValue') : t('overview.closedCount'), description: byValue ? t('overview.closedValueDesc') : t('overview.closedCountDesc') }
  if (!byValue) {
    // Counts are separate events per month — bars, not a curve that would suggest a gradual rise.
    return (
      <ChartCard {...head} className={className}>
        <BarChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
          {grid}
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
          {countAxis}
          <Tooltip content={<ChartTooltip format={asCount} />} cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }} />
          <Bar dataKey="won_count" name={t('overview.won')} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={700} />
          <Bar dataKey="lost_count" name={t('overview.lost')} fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={700} />
        </BarChart>
      </ChartCard>
    )
  }
  return (
    <ChartCard {...head} className={className}>
      <AreaChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="won-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        {grid}
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
        {yAxis}
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="won" name={t('overview.won')} stroke="#10b981" strokeWidth={2} fill="url(#won-fill)" animationDuration={900} />
        <Area type="monotone" dataKey="lost" name={t('overview.lost')} stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" animationDuration={900} />
      </AreaChart>
    </ChartCard>
  )
}
