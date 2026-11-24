import { MULTI_SEPARATOR, InlineField, type Editor } from '@/features/record/InlineField'
import { TABLE_MODULE, useAccess } from '@/hooks/useAccess'
import type { CustomField, CustomValue, Deal } from '@/lib/types'
import { ValueChip } from './FieldChips'
import { displayValue, isWarning, useCustomFields, valueList } from './useFields'

function editorFor(field: CustomField): Editor {
  if (field.type === 'select') return { kind: 'select', options: field.options.map((o) => ({ value: o, label: o })), emptyLabel: '—' }
  if (field.type === 'multiselect') return { kind: 'multiselect', options: field.options }
  if (field.type === 'date') return { kind: 'date' }
  return { kind: field.type === 'number' ? 'number' : 'text' }
}

function parse(field: CustomField, raw: string): CustomValue {
  if (!raw) return null
  if (field.type === 'multiselect') return raw.split(MULTI_SEPARATOR).filter(Boolean)
  return field.type === 'number' ? Number(raw) : raw
}

/** The workspace's custom fields of a deal, editable in place like the built-in ones. */
export function CustomFieldRows({ deal }: { deal: Deal }) {
  const fields = useCustomFields()
  const { can } = useAccess()
  const readOnly = !can(TABLE_MODULE.deals, 'edit')
  // Only this field's value: the card's draft merges it over the deal's other custom values when saving.
  const toPatch = (field: CustomField) => (raw: string) => {
    const value = parse(field, raw)
    if (field.type === 'number' && typeof value === 'number' && Number.isNaN(value)) return null
    return { custom: { [field.key]: value } }
  }

  return fields.map((f) => {
    const value = deal.custom?.[f.key]
    const list = valueList(value)
    const chips = (f.type === 'select' || f.type === 'multiselect') && list.length > 0
    return (
      <InlineField key={f.id} name={`custom.${f.key}`} label={f.label} raw={f.type === 'multiselect' ? list.join(MULTI_SEPARATOR) : list[0] ?? ''} readOnly={readOnly}
        display={chips ? <span className="flex flex-wrap gap-1">{list.map((v) => <ValueChip key={v} value={v} warn={isWarning(f, v)} />)}</span> : displayValue(f, value)}
        editor={editorFor(f)} toPatch={toPatch(f)} />
    )
  })
}
