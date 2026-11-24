import * as React from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, getDefaultClassNames, type DayButton, type DropdownProps } from 'react-day-picker'
import { Button, buttonVariants } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * Calendar ported from the erp1 project (shadcn/ui's react-day-picker calendar), adapted to Tailwind 3 and the glass
 * design: it sits transparently on the popover's `glass-strong` surface.
 */
export function Calendar({ className, classNames, showOutsideDays = true, captionLayout = 'label', formatters, components, locale, ...props }: React.ComponentProps<typeof DayPicker>) {
  const d = getDefaultClassNames()
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('group/calendar p-3 [--cell-size:2rem]', className)}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        // Month names from the same locale as the weekday headers (the stock formatter uses the browser's locale,
        // which put an English "Sep" above Uzbek "Du Se Cho" — erp1 fix). Full names: this list is read and picked from.
        formatMonthDropdown: (date: Date) => locale?.localize?.month(date.getMonth() as never, { width: 'wide' }) ?? date.toLocaleString('default', { month: 'long' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', d.root),
        months: cn('relative flex flex-col gap-4 md:flex-row', d.months),
        month: cn('flex w-full flex-col gap-4', d.month),
        // pointer-events-none: the bar spans the caption and would otherwise swallow clicks on the month/year dropdowns.
        nav: cn('pointer-events-none absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1', d.nav),
        button_previous: cn(buttonVariants({ variant: 'ghost' }), 'pointer-events-auto size-[--cell-size] select-none p-0 aria-disabled:opacity-50', d.button_previous),
        button_next: cn(buttonVariants({ variant: 'ghost' }), 'pointer-events-auto size-[--cell-size] select-none p-0 aria-disabled:opacity-50', d.button_next),
        month_caption: cn('flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]', d.month_caption),
        dropdowns: cn('flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium', d.dropdowns),
        dropdown_root: cn('relative rounded-md', d.dropdown_root),
        dropdown: cn('absolute inset-0 opacity-0', d.dropdown),
        caption_label: cn('select-none text-sm font-medium', d.caption_label),
        month_grid: cn('w-full border-collapse', d.month_grid),
        weekdays: cn('flex', d.weekdays),
        weekday: cn('flex-1 select-none rounded-md text-[0.8rem] font-normal text-muted-foreground', d.weekday),
        week: cn('mt-2 flex w-full', d.week),
        day: cn('group/day relative aspect-square h-full w-full select-none p-0 text-center', d.day),
        today: cn('rounded-md bg-primary/10 text-primary data-[selected=true]:rounded-none', d.today),
        outside: cn('text-muted-foreground opacity-60', d.outside),
        disabled: cn('text-muted-foreground opacity-50', d.disabled),
        hidden: cn('invisible', d.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ className: c, orientation, ...rest }) => {
          const Icon = orientation === 'left' ? ChevronLeft : orientation === 'right' ? ChevronRight : ChevronDown
          return <Icon className={cn('size-4', c)} {...rest} />
        },
        DayButton: CalendarDayButton,
        Dropdown: CalendarDropdown,
        ...components,
      }}
      {...props}
    />
  )
}

/** Month / year picker as the app's own Select instead of a native <select>. */
function CalendarDropdown({ value, onChange, options, className }: DropdownProps) {
  const selected = options?.find((o) => o.value === value)
  const change = (next: string) => onChange?.({ target: { value: next } } as React.ChangeEvent<HTMLSelectElement>)
  return (
    <Select value={value?.toString()} onValueChange={change}>
      <SelectTrigger className={cn('h-7 w-fit gap-1 border-none bg-transparent px-2 py-0 font-medium shadow-none hover:bg-foreground/5', className)}>
        <SelectValue>{selected?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options?.map((o) => <SelectItem key={o.value} value={o.value.toString()} disabled={o.disabled}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={modifiers.selected}
      className={cn(
        'flex aspect-square size-auto w-full min-w-[--cell-size] font-normal leading-none',
        'group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-ring/40',
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:hover:bg-primary',
        getDefaultClassNames().day,
        className,
      )}
      {...props}
    />
  )
}
