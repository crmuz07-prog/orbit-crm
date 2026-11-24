import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useLabels } from '@/hooks/useLabels'
import { Card, CardHeader } from '@/components/ui/card'
import { STAGE_COLORS } from '@/lib/constants'
import type { Dashboard } from '@/lib/types'
import { money, monthLabel } from '@/lib/utils'

export const axis = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
const compact = (v: number) => money(v, 'USD', true)

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color ?? (p.payload as { fill?: string }).fill }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums text-foreground">{money(p.value)}</span>
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
const yAxis = <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={compact} width={56} />

export function PipelineChart({ data, className }: { data: Dashboard['by_stage']; className?: string }) {
  const { t } = useTranslation()
  const labels = useLabels()
  const rows = data.map((s) => ({ ...s, name: labels.stage(s.name) }))
  return (
    <ChartCard title={t('dashboard.pipelineTitle')} description={t('dashboard.pipelineDesc')} className={className}>
      <BarChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
        {grid}
        <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} interval={0} />
        {yAxis}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }} />
        <Bar dataKey="value" name={t('dashboard.value')} radius={[6, 6, 0, 0]} maxBarSize={56} animationDuration={700}>
          {rows.map((s) => <Cell key={s.id} fill={STAGE_COLORS[s.color].hex} />)}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

export function RevenueChart({ data, className }: { data: Dashboard['monthly']; className?: string }) {
  const { t } = useTranslation()
  const rows = data.map((m) => ({ ...m, label: monthLabel(new Date(`${m.month}-01T00:00:00`)) }))
  return (
    <ChartCard title={t('dashboard.revenueTitle')} description={t('dashboard.revenueDesc')} className={className}>
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
        <Area type="monotone" dataKey="won" name={t('dashboard.won')} stroke="#10b981" strokeWidth={2} fill="url(#won-fill)" animationDuration={900} />
        <Area type="monotone" dataKey="lost" name={t('dashboard.lost')} stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" animationDuration={900} />
      </AreaChart>
    </ChartCard>
  )
}
