import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Toggle chips for a multi-list value (saving is up to the surrounding editor). */
export function MultiPicker({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => toggle(o)} aria-pressed={value.includes(o)}
          className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-colors',
            value.includes(o) ? 'bg-primary/15 font-medium text-primary' : 'bg-foreground/[0.05] text-muted-foreground hover:text-foreground')}>
          {value.includes(o) && <Check className="size-3" />} {o}
        </button>
      ))}
    </div>
  )
}
