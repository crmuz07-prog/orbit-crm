import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground">
      <ChevronLeft className="size-4" /> {label}
    </Link>
  )
}

/** Record header: avatar/logo, title, badges, subtitle and actions (HubSpot / Attio record page). */
export function RecordHeader({ media, title, badge, subtitle, actions }: { media: ReactNode; title: string; badge?: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        {media}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {badge}
          </div>
          {subtitle && <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

/** Record layout: About sidebar on the left, activity on the right. */
export function RecordLayout({ side, main }: { side: ReactNode; main: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
      <div className="space-y-5">{side}</div>
      <div className="min-w-0 space-y-5">{main}</div>
    </div>
  )
}

export function PropertyList({ title, items }: { title: string; items: [label: string, value: ReactNode][] }) {
  return (
    <Card>
      <CardHeader title={title} />
      <dl className="divide-y divide-foreground/[0.06]">
        {items.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[120px_1fr] gap-3 px-5 py-2.5 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

export function StatStrip({ stats }: { stats: [label: string, value: ReactNode][] }) {
  return (
    <Card className="mb-5 grid grid-cols-2 sm:grid-cols-4 sm:divide-x sm:divide-foreground/[0.06]">
      {stats.map(([label, value]) => (
        <div key={label} className="px-5 py-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
        </div>
      ))}
    </Card>
  )
}

/** Card with a titled list of clickable rows — used for associations (deals, people, tasks). */
export function ListCard<T extends { id: string }>({ title, description, action, items, empty, render }: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  items: T[]
  empty: ReactNode
  render: (item: T) => ReactNode
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} action={action} />
      {items.length === 0 ? empty : <ul className="divide-y divide-foreground/[0.06]">{items.map((item) => <li key={item.id}>{render(item)}</li>)}</ul>}
    </Card>
  )
}

export function RowLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={cn('group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-foreground/[0.03]', className)}>
      {children}
    </Link>
  )
}
