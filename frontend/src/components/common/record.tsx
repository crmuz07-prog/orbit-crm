import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import { IconButton } from '@/components/common/icon-button'
import { Card, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground">
      <ChevronLeft className="size-4" /> {label}
    </Link>
  )
}

/**
 * Card with a titled list of clickable rows — used for associations (deals, people, tasks). `dense`: the side widgets
 * of a record card — a lower header and a list that scrolls inside the card past a few rows instead of growing the page.
 */
export function ListCard<T extends { id: string }>({ title, description, action, items, empty, render, dense }: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  items: T[]
  empty: ReactNode
  render: (item: T) => ReactNode
  dense?: boolean
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} action={action} className={cn(dense && 'py-1')} />
      {items.length === 0 ? empty : (
        <ul className={cn('divide-y divide-foreground/[0.06]', dense && 'max-h-64 overflow-y-auto')}>{items.map((item) => <li key={item.id}>{render(item)}</li>)}</ul>
      )}
    </Card>
  )
}

export function RowLink({ to, className, dense, children }: { to: string; className?: string; dense?: boolean; children: ReactNode }) {
  return (
    <Link to={to} className={cn('group flex items-center px-4 transition-colors hover:bg-foreground/[0.03]', dense ? 'gap-2 py-1.5' : 'gap-3 py-2', className)}>
      {children}
    </Link>
  )
}

/** The "+" of a dense card header: icon only, its name in the tooltip. */
export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <IconButton label={label} className="size-7" onClick={onClick}><Plus /></IconButton>
}

/** "Nothing linked yet" inside a dense card. */
export function DenseEmpty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-2 text-xs text-muted-foreground">{children}</p>
}
