import { useState } from 'react'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Toggle chips for a multi-list value; Save commits, Esc cancels. */
export function MultiPicker({ options, value, onSave, onCancel }: { options: string[]; value: string[]; onSave: (v: string[]) => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const [picked, setPicked] = useState(value)
  const toggle = (o: string) => setPicked((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]))
  return (
    <div className="space-y-1.5" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => toggle(o)} aria-pressed={picked.includes(o)}
            className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-colors',
              picked.includes(o) ? 'bg-primary/15 font-medium text-primary' : 'bg-foreground/[0.05] text-muted-foreground hover:text-foreground')}>
            {picked.includes(o) && <Check className="size-3" />} {o}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" className="h-7" onClick={() => onSave(picked)}>{t('common.save')}</Button>
        <Button size="sm" variant="ghost" className="h-7" onClick={onCancel}>{t('common.cancel')}</Button>
      </div>
    </div>
  )
}
