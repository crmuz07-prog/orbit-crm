import { useCallback, useState } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { enUS, ru, uz } from 'react-day-picker/locale'
import { Calendar } from '@/components/ui/calendar'
import { controlClass } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TimePicker } from '@/components/ui/time-picker'
import { useCloseOnScroll } from '@/hooks/useCloseOnScroll'
import { cn, shortDate } from '@/lib/utils'

const LOCALES = { uz, ru, en: enUS }

export const dayPickerLocale = (language: string) => LOCALES[language as keyof typeof LOCALES] ?? enUS

/** "YYYY-MM-DD" as a local calendar date (no UTC shift). */
export function parseIsoDate(value: string | undefined | null): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

interface DatePickerProps {
  /** "YYYY-MM-DD" or "". */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Shows a clear button when a date is set (optional dates). */
  clearable?: boolean
  disabled?: boolean
  /** Starts with the calendar open (inline editing). */
  autoFocus?: boolean
  /** Called when the calendar closes without a pick. */
  onDismiss?: () => void
  className?: string
  'aria-label'?: string
}

/** Date field from the erp1 template: an input-looking trigger opening a localised calendar (Popover + Calendar). */
export function DatePicker({ value, onChange, placeholder, clearable, disabled, autoFocus, onDismiss, className, ...aria }: DatePickerProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(autoFocus ?? false)
  const selected = parseIsoDate(value)
  const close = useCallback(() => setOpen(false), [])
  useCloseOnScroll(open, close)
  const toggle = (next: boolean) => {
    setOpen(next)
    if (!next) onDismiss?.()
  }

  return (
    <Popover open={open} onOpenChange={toggle}>
      <div className={cn('relative', className)}>
        <PopoverTrigger asChild disabled={disabled}>
          <button type="button" aria-label={aria['aria-label']}
            className={cn(controlClass, 'flex h-9 items-center gap-2 px-3 text-left', open && 'ring-2 ring-ring/20', !selected && 'text-muted-foreground', clearable && selected && 'pr-8')}>
            <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{selected ? shortDate(value) : placeholder ?? t('datePicker.placeholder')}</span>
          </button>
        </PopoverTrigger>
        {clearable && selected && !disabled && (
          <button type="button" onClick={() => onChange('')} aria-label={t('datePicker.clear')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-foreground/5 hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          // Open on the month being edited, not today (erp1).
          defaultMonth={selected}
          onSelect={(date) => {
            if (date) {
              onChange(toIsoDate(date))
              setOpen(false)
            }
          }}
          locale={dayPickerLocale(i18n.language)}
          autoFocus
          captionLayout="dropdown"
          startMonth={new Date(1920, 0)}
          endMonth={new Date(new Date().getFullYear() + 10, 11)}
        />
      </PopoverContent>
    </Popover>
  )
}

/** Date + time in the `<input type="datetime-local">` format ("YYYY-MM-DDTHH:mm"), so existing values keep working. */
export function DateTimePicker({ value, onChange, disabled, className }: { value: string; onChange: (v: string) => void; disabled?: boolean; className?: string }) {
  const [date = '', time = '09:00'] = value.split('T')
  return (
    <div className={cn('flex gap-2', className)}>
      <DatePicker value={date} disabled={disabled} className="min-w-0 flex-1" onChange={(d) => onChange(d ? `${d}T${time.slice(0, 5)}` : '')} />
      <TimePicker value={time.slice(0, 5)} disabled={disabled || !date} onChange={(tm) => onChange(`${date}T${tm}`)} className="w-28 shrink-0" />
    </div>
  )
}
