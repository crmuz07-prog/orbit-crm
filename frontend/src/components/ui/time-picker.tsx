import { useCallback, useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { controlClass } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCloseOnScroll } from '@/hooks/useCloseOnScroll'
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

/** "HH:mm" read defensively: a malformed value must not blank the field (erp1). */
function parseTime(value: string): { hour: string; minute: string } {
  const [h = '', m = ''] = (value ?? '').split(':')
  return {
    hour: /^\d{1,2}$/.test(h) && Number(h) < 24 ? h.padStart(2, '0') : '00',
    minute: /^\d{1,2}$/.test(m) && Number(m) < 60 ? m.padStart(2, '0') : '00',
  }
}

/** Scrolls the selected hour and minute into view when the lists open. */
function useScrollToSelected(open: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    // Deferred: the popover content mounts after this effect.
    const timer = setTimeout(() => ref.current?.querySelectorAll('[data-selected="true"]').forEach((el) => el.scrollIntoView({ block: 'center' })), 0)
    return () => clearTimeout(timer)
  }, [open])
  return ref
}

function Column({ label, items, selected, onPick }: { label: string; items: string[]; selected: string; onPick: (v: string) => void }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="max-h-48 overflow-y-auto pr-1">
        {items.map((item) => (
          <button key={item} type="button" data-selected={item === selected} onClick={() => onPick(item)}
            className={cn('w-full rounded-md px-2 py-1.5 text-center text-sm tabular-nums transition-colors',
              item === selected ? 'bg-primary font-semibold text-primary-foreground' : 'hover:bg-foreground/5')}>
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Time field from the erp1 template: hour and minute lists instead of the browser's own `<input type="time">`. */
export function TimePicker({ value, onChange, minuteStep = 5, disabled, className }: { value: string; onChange: (v: string) => void; minuteStep?: number; disabled?: boolean; className?: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { hour, minute } = parseTime(value)
  const close = useCallback(() => setOpen(false), [])
  useCloseOnScroll(open, close)
  const listRef = useScrollToSelected(open)
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => String(i * minuteStep).padStart(2, '0'))
  // A stored value off the grid (08:07 with step 5) stays selectable, so opening the picker never changes the time.
  if (!minutes.includes(minute)) {
    minutes.push(minute)
    minutes.sort()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button type="button" aria-label={t('datePicker.time')} className={cn(controlClass, 'flex h-9 items-center gap-2 px-3', open && 'ring-2 ring-ring/20', className)}>
          <Clock className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left tabular-nums">{hour}:{minute}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-2">
        <div ref={listRef} className="flex gap-1">
          <Column label={t('datePicker.hour')} items={HOURS} selected={hour} onPick={(h) => onChange(`${h}:${minute}`)} />
          <div className="w-px shrink-0 bg-foreground/10" />
          <Column label={t('datePicker.minute')} items={minutes} selected={minute} onPick={(m) => onChange(`${hour}:${m}`)} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
