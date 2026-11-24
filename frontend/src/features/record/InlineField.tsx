import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectBox, type Option } from '@/components/common/form-fields'
import { DatePicker } from '@/components/ui/date-picker'
import { Input, Textarea } from '@/components/ui/input'
import { MultiPicker } from '@/features/fields/MultiPicker'
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

/** amoCRM-style property row: click the value to edit in place; Enter or leaving the field saves, Esc cancels. */
export function InlineField({ label, raw, display, editor, onSave, readOnly }: Props) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(raw)
  const start = () => { if (!readOnly) { setDraft(raw); setEditing(true) } }
  const commit = (value = draft) => {
    setEditing(false)
    if (value.trim() !== raw) onSave(value.trim())
  }
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setEditing(false)
    if (e.key === 'Enter' && editor.kind !== 'textarea') commit()
  }

  const control = editor.kind === 'multiselect'
    ? <MultiPicker options={editor.options} value={draft ? draft.split(MULTI_SEPARATOR) : []} onSave={(v) => commit(v.join(MULTI_SEPARATOR))} onCancel={() => setEditing(false)} />
    : editor.kind === 'select'
    ? <SelectBox value={draft} onChange={(v) => commit(v)} options={editor.options} emptyLabel={editor.emptyLabel} className="h-8" />
    : editor.kind === 'date'
      ? <DatePicker autoFocus value={draft} onChange={(v) => commit(v)} onDismiss={() => setEditing(false)} aria-label={label} />
      : editor.kind === 'textarea'
      ? <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => commit()} onKeyDown={keys} className="min-h-[72px] text-sm" />
      : <Input autoFocus type={editor.kind} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => commit()} onKeyDown={keys} className="h-8" />

  return (
    <div className="grid grid-cols-[minmax(96px,40%)_1fr] items-start gap-2 py-1 text-[13px]">
      <span className="pt-1 text-muted-foreground">{label}</span>
      {editing ? control : (
        <button type="button" onClick={start} disabled={readOnly} title={readOnly ? undefined : t('card.edit')}
          className={cn('min-h-7 rounded-md px-1.5 py-1 text-left -mx-1.5 transition-colors', !readOnly && 'hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05] focus-visible:outline-none')}>
          {raw || display ? (display ?? raw) : <span className="text-muted-foreground/70">{t('card.none')}</span>}
        </button>
      )}
    </div>
  )
}
