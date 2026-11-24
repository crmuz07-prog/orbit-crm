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
