import type { ReactNode } from 'react'
import { AddButton } from '@/components/common/record'
import { SectionHeading } from './RecordCard'

interface Props<T> {
  title: string
  /** Label of the "+" button (tooltip and accessible name); no button without `onAdd`. */
  addLabel: string
  onAdd?: () => void
  items: T[]
  empty: string
  render: (item: T) => ReactNode
}

/**
 * Linked records inside the info panel (amoCRM keeps a company's people and deals in the card itself): a heading with
 * "+", one line per record, scrolling inside the panel past a handful of rows.
 */
export function LinkedSection<T extends { id: string }>({ title, addLabel, onAdd, items, empty, render }: Props<T>) {
  return (
    // Rows run edge to edge (their own px-4) so the hover fills the panel; heading and empty text keep the inset.
    <section className="border-t border-foreground/[0.06] py-2.5">
      <SectionHeading title={title} action={onAdd && <AddButton label={addLabel} onClick={onAdd} />} className="px-4" />
      {items.length === 0
        ? <p className="px-4 py-1 text-xs text-muted-foreground">{empty}</p>
        : <ul className="max-h-60 overflow-y-auto">{items.map((item) => <li key={item.id}>{render(item)}</li>)}</ul>}
    </section>
  )
}
