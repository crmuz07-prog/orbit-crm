import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectBox, type Option } from '@/components/common/form-fields'
import { DatePicker } from '@/components/ui/date-picker'
import { Input, Textarea } from '@/components/ui/input'
import { MultiPicker } from '@/features/fields/MultiPicker'
import { cn, shortDate } from '@/lib/utils'
import { useRecordDraft, type Patch } from './RecordDraft'

export type Editor = { kind: 'text' | 'number' | 'date' | 'email' | 'tel' | 'textarea' } | { kind: 'select'; options: Option[]; emptyLabel?: string }
  | { kind: 'multiselect'; options: string[] }

/** One property row (label | value), shared by editable and read-only rows so they line up. */
export const FIELD_ROW = 'grid grid-cols-[minmax(96px,40%)_1fr] items-start gap-2 text-[13px]'

/** Multi-list values travel through the string-based editor joined by newlines (values may contain commas). */
export const MULTI_SEPARATOR = '\n'

interface Props {
  label: string
  /** Unique within the card; defaults to the label. */
  name?: string
  /** The current value as stored ("" when empty); what the editor starts from. */
  raw: string
  /** How the stored value is shown; defaults to `raw`. */
  display?: ReactNode
  editor: Editor
  /** The record change for a new value (null when the value is invalid). Saving is the card's single bar. */
  toPatch: (value: string) => Patch | null
  readOnly?: boolean
}

/** How a staged (not yet saved) value reads, from the editor's own options. */
function stagedText(editor: Editor, value: string): ReactNode {
  if (!value) return ''
  if (editor.kind === 'select') return editor.options.find((o) => o.value === value)?.label ?? value
  if (editor.kind === 'multiselect') return value.split(MULTI_SEPARATOR).join(', ')
  return editor.kind === 'date' ? shortDate(value) : value
}

/**
 * amoCRM-style property row: click the value to edit in place. A change is staged and marked, never saved alone —
 * the card's bar saves (or cancels) every staged change at once. Esc restores this field.
 */
export function InlineField({ label, name, raw, display, editor, toPatch, readOnly }: Props) {
  const { t } = useTranslation()
  const draft = useRecordDraft()
  const key = name ?? label
  const staged = draft.staged(key)
  const current = staged?.value ?? raw
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(current)
  const box = useRef<HTMLDivElement>(null)

  const start = () => { if (!readOnly) { setValue(current); setEditing(true) } }
  const change = (next: string) => {
    setValue(next)
    const patch = next.trim() === raw ? null : toPatch(next.trim())
    draft.stage(key, patch ? { value: next.trim(), patch } : null)
  }
  const restore = () => { draft.stage(key, null); setEditing(false) }
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') restore()
    if (e.key === 'Enter' && editor.kind !== 'textarea' && editor.kind !== 'multiselect') { e.preventDefault(); setEditing(false) }
  }
  const leave = (e: React.FocusEvent) => {
    const next = e.relatedTarget as HTMLElement | null
    // Select lists and the calendar open in portals; moving focus there is still editing this field.
    const inside = box.current?.contains(next) || !!next?.closest('[data-radix-popper-content-wrapper], [role="listbox"], [role="dialog"]')
    if (next && !inside) setEditing(false)
  }

  const control = editor.kind === 'multiselect'
    ? <MultiPicker options={editor.options} value={value ? value.split(MULTI_SEPARATOR) : []} onChange={(v) => change(v.join(MULTI_SEPARATOR))} />
    : editor.kind === 'select'
      ? <SelectBox value={value} onChange={(v) => { change(v); setEditing(false) }} options={editor.options} emptyLabel={editor.emptyLabel} className="h-8" />
      : editor.kind === 'date'
        ? <DatePicker autoFocus value={value} onChange={(v) => { change(v); setEditing(false) }} onDismiss={() => setEditing(false)} aria-label={label} />
        : editor.kind === 'textarea'
          ? <Textarea autoFocus value={value} onChange={(e) => change(e.target.value)} className="min-h-[72px] text-sm" />
          : <Input autoFocus type={editor.kind} value={value} onChange={(e) => change(e.target.value)} className="h-8" />

  const shown = staged ? stagedText(editor, staged.value) : raw || display ? (display ?? raw) : ''
  return (
    <div className={cn(FIELD_ROW, 'rounded-md py-0.5', staged && 'bg-amber-400/[0.07] shadow-[inset_2px_0_0] shadow-amber-400')}>
      <span className="line-clamp-2 break-words pt-1 text-muted-foreground" title={label}>{label}</span>
      {editing ? (
        <div ref={box} onKeyDown={keys} onBlur={leave}>{control}</div>
      ) : (
        <button type="button" onClick={start} disabled={readOnly}
          className={cn('min-h-6 rounded-md px-1.5 py-1 text-left -mx-1.5 transition-colors', !readOnly && 'hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05] focus-visible:outline-none')}>
          {shown || <span className="text-muted-foreground/70">{t('card.none')}</span>}
        </button>
      )}
    </div>
  )
}
