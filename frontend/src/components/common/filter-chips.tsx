import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface Props<T extends string> {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  counts: Record<T, number>
  label: (value: T) => string
  /** Shown in red while it has items (e.g. overdue). */
  alert?: T
}

/** One-click saved filters with live counts (amoCRM's filter presets), shared by deals and tasks. */
export function FilterChips<T extends string>({ options, value, onChange, counts, label, alert }: Props<T>) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label={t('deals.presetsLabel')}>
      {options.map((p) => (
        <button key={p} type="button" role="tab" aria-selected={value === p} onClick={() => onChange(p)}
          className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors',
            value === p ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
            p === alert && counts[p] > 0 && value !== p && 'text-rose-600 dark:text-rose-400')}>
          {label(p)} <span className="tabular-nums opacity-70">{counts[p]}</span>
        </button>
      ))}
    </div>
  )
}
