import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { MULTI_SEPARATOR, InlineField, type Editor } from '@/features/record/InlineField'
import { TABLE_MODULE, useAccess } from '@/hooks/useAccess'
import { useUpdateRow } from '@/hooks/useData'
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
  const { t } = useTranslation()
  const fields = useCustomFields()
  const update = useUpdateRow('deals')
  const { can } = useAccess()
  const readOnly = !can(TABLE_MODULE.deals, 'edit')
  const save = (field: CustomField) => (raw: string) => {
    const value = parse(field, raw)
    if (field.type === 'number' && typeof value === 'number' && Number.isNaN(value)) return
    const custom = { ...(deal.custom ?? {}), [field.key]: value }
    update.mutate({ id: deal.id, patch: { custom } }, { onSuccess: () => toast.success(t('card.saved')) })
  }

  return fields.map((f) => {
    const value = deal.custom?.[f.key]
    const list = valueList(value)
    const chips = (f.type === 'select' || f.type === 'multiselect') && list.length > 0
    return (
      <InlineField key={f.id} label={f.label} raw={f.type === 'multiselect' ? list.join(MULTI_SEPARATOR) : list[0] ?? ''} readOnly={readOnly}
        display={chips ? <span className="flex flex-wrap gap-1">{list.map((v) => <ValueChip key={v} value={v} warn={isWarning(f, v)} />)}</span> : displayValue(f, value)}
        editor={editorFor(f)} onSave={save(f)} />
    )
  })
}
