import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DatePicker, DateTimePicker } from '@/components/ui/date-picker'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Radix Select cannot use "" as an item value, so "no selection" maps to a sentinel.
const NONE = '__none__'

export type Option = { value: string; label: ReactNode }

export const toOptions = (values: readonly string[]): Option[] => values.map((v) => ({ value: v, label: v }))

export function Field({ label, wide, error, errorId, children }: { label?: string; wide?: boolean; error?: string; errorId?: string; children: ReactNode }) {
  return (
    <div className={cn('space-y-1.5', wide && 'sm:col-span-2')}>
      {label && <Label>{label}</Label>}
      {children}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return <p id={id} role="alert" className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{children}</p>
}

/** Props that tie an input to its error message for assistive tech and the red outline. */
export const errorProps = (id: string, error?: string) =>
  error ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-error`, className: 'border-rose-500/70 focus-visible:ring-rose-500/30' } : {}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: string
  value: string
  onChange: (value: string) => void
  wide?: boolean
  /** Inline error under the input (translated). */
  error?: string
}

export function TextField({ label, value, onChange, wide, error, className, ...props }: TextFieldProps) {
  const id = useId()
  const invalid = errorProps(id, error)
  return (
    <Field label={label} wide={wide} error={error} errorId={`${id}-error`}>
      <Input value={value} onChange={(e) => onChange(e.target.value)} {...props} {...invalid} className={cn(className, invalid.className)} />
    </Field>
  )
}

/** Calendar date field (erp1 template); "" = no date. */
export function DateField({ label, value, onChange, wide, clearable = true, disabled }: { label: string; value: string; onChange: (v: string) => void; wide?: boolean; clearable?: boolean; disabled?: boolean }) {
  return (
    <Field label={label} wide={wide}>
      <DatePicker value={value} onChange={onChange} clearable={clearable} disabled={disabled} aria-label={label} />
    </Field>
  )
}

/** Date + time field ("YYYY-MM-DDTHH:mm"). */
export function DateTimeField({ label, value, onChange, wide, disabled }: { label: string; value: string; onChange: (v: string) => void; wide?: boolean; disabled?: boolean }) {
  return (
    <Field label={label} wide={wide}>
      <DateTimePicker value={value} onChange={onChange} disabled={disabled} />
    </Field>
  )
}

export function TextareaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Field label={label} wide>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </Field>
  )
}

interface SelectBoxProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  emptyLabel?: string
  className?: string
}

/** Select whose empty value is `""`; pass `emptyLabel` to make "nothing selected" a choice. */
export function SelectBox({ value, onChange, options, emptyLabel, className }: SelectBoxProps) {
  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? '' : v)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={emptyLabel ?? '—'} />
      </SelectTrigger>
      <SelectContent>
        {emptyLabel && <SelectItem value={NONE}>{emptyLabel}</SelectItem>}
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function SelectField({ label, wide, ...props }: SelectBoxProps & { label: string; wide?: boolean }) {
  return (
    <Field label={label} wide={wide}>
      <SelectBox {...props} />
    </Field>
  )
}

/** Two-column responsive form body with a sticky action footer. */
export function FormLayout({ onSubmit, onCancel, submitLabel, busy, children }: { onSubmit: () => void; onCancel: () => void; submitLabel: string; busy: boolean; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
      <div className="flex justify-end gap-2 border-t border-foreground/[0.06] pt-4">
        <Button variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={busy}>{submitLabel}</Button>
      </div>
    </form>
  )
}
