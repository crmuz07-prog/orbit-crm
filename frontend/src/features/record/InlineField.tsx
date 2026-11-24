import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SaveBar } from '@/components/common/save-bar'
import { SelectBox, type Option } from '@/components/common/form-fields'
import { DatePicker } from '@/components/ui/date-picker'
import { Input, Textarea } from '@/components/ui/input'
import { MultiPicker } from '@/features/fields/MultiPicker'
import { useBeforeUnload } from '@/hooks/useUnsaved'
import { cn } from '@/lib/utils'

export type Editor = { kind: 'text' | 'number' | 'date' | 'email' | 'tel' | 'textarea' } | { kind: 'select'; options: Option[]; emptyLabel?: string }
  | { kind: 'multiselect'; options: string[] }

/** Multi-list values travel through the string-based editor joined by newlines (values may contain commas). */
export const MULTI_SEPARATOR = '\n'

interface Props {
  label: string
  /** The current value as stored ("" when empty); what the editor starts from. */
  raw: string
  /** How the value is shown; defaults to `raw`. */
  display?: ReactNode
  editor: Editor
  onSave: (value: string) => void
  readOnly?: boolean
}

/**
 * amoCRM-style property row: click the value to edit in place. A change is never saved silently —
 * ✓ / Enter saves, ✕ / Esc cancels; leaving a changed field keeps it open and marked "not saved".
 */
export function InlineField({ label, raw, display, editor, onSave, readOnly }: Props) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(raw)
  const box = useRef<HTMLDivElement>(null)
  const dirty = editing && draft.trim() !== raw
  useBeforeUnload(dirty)

  const start = () => { if (!readOnly) { setDraft(raw); setEditing(true) } }
  const cancel = () => { setDraft(raw); setEditing(false) }
  const save = () => {
    setEditing(false)
    if (draft.trim() !== raw) onSave(draft.trim())
  }
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') cancel()
    if (e.key === 'Enter' && editor.kind !== 'textarea' && editor.kind !== 'multiselect') { e.preventDefault(); save() }
  }
  // Leaving an untouched field just closes it; a changed one waits for an explicit choice.
  const leave = (e: React.FocusEvent) => {
    const next = e.relatedTarget as HTMLElement | null
    // Select lists and the calendar open in portals; moving focus there is still editing this field.
    const inside = box.current?.contains(next) || !!next?.closest('[data-radix-popper-content-wrapper], [role="listbox"], [role="dialog"]')
    if (!dirty && next && !inside) setEditing(false)
  }

  const control = editor.kind === 'multiselect'
    ? <MultiPicker options={editor.options} value={draft ? draft.split(MULTI_SEPARATOR) : []} onChange={(v) => setDraft(v.join(MULTI_SEPARATOR))} />
    : editor.kind === 'select'
      ? <SelectBox value={draft} onChange={setDraft} options={editor.options} emptyLabel={editor.emptyLabel} className="h-8" />
      : editor.kind === 'date'
        ? <DatePicker autoFocus value={draft} onChange={setDraft} onDismiss={() => !dirty && setEditing(false)} aria-label={label} />
        : editor.kind === 'textarea'
          ? <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[72px] text-sm" />
          : <Input autoFocus type={editor.kind} value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8" />

  return (
    <div className="grid grid-cols-[minmax(96px,40%)_1fr] items-start gap-2 py-1 text-[13px]">
      <span className="pt-1 text-muted-foreground">{label}</span>
      {editing ? (
        <div ref={box} onKeyDown={keys} onBlur={leave} className={cn('space-y-1 rounded-md', dirty && 'ring-1 ring-amber-400/60 ring-offset-2 ring-offset-transparent')}>
          {control}
          <SaveBar dirty={dirty} onSave={save} onCancel={cancel} />
        </div>
      ) : (
        <button type="button" onClick={start} disabled={readOnly}
          className={cn('min-h-7 rounded-md px-1.5 py-1 text-left -mx-1.5 transition-colors', !readOnly && 'hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05] focus-visible:outline-none')}>
          {raw || display ? (display ?? raw) : <span className="text-muted-foreground/70">{t('card.none')}</span>}
        </button>
      )}
    </div>
  )
}
