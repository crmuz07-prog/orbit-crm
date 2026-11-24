import { AlertTriangle } from 'lucide-react'
import type { CustomField, Deal } from '@/lib/types'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { chipFields, isWarning, valueList } from './useFields'

/** A value chip; red when the value is one of the field's warning values. */
export function ValueChip({ value, warn, title }: { value: string; warn?: boolean; title?: string }) {
  const chip = (
    <span className={cn('inline-flex max-w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight',
      warn ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300' : 'bg-foreground/[0.06] text-muted-foreground')}>
      {warn && <AlertTriangle className="size-3 shrink-0" />}
      <span className="truncate">{value}</span>
    </span>
  )
  // The field name on hover (board cards show values only).
  return title ? <Tooltip content={title}>{chip}</Tooltip> : chip
}

/** The deal's list-field values as chips (board cards, tables); `limit` keeps cards short. */
export function FieldChips({ deal, fields, limit = 3, className }: { deal: Deal; fields: CustomField[]; limit?: number; className?: string }) {
  const chips = chipFields(fields).flatMap((f) => valueList(deal.custom?.[f.key]).map((v) => ({ key: `${f.key}:${v}`, v, field: f })))
  if (!chips.length) return null
  // Warnings first: they are what the manager must see.
  const ordered = [...chips].sort((a, b) => Number(isWarning(b.field, b.v)) - Number(isWarning(a.field, a.v))).slice(0, limit)
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {ordered.map((c) => <ValueChip key={c.key} value={c.v} warn={isWarning(c.field, c.v)} title={c.field.label} />)}
    </div>
  )
}
