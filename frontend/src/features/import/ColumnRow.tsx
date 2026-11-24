import { useTranslation } from 'react-i18next'
import { SelectBox } from '@/components/common/form-fields'
import { Input } from '@/components/ui/input'
import type { ColumnMap, CustomField, FieldType, ImportTarget } from '@/lib/types'
import { cn } from '@/lib/utils'

export const TARGETS: ImportTarget[] = [
  'ignore', 'contact_name', 'phone', 'email', 'company', 'title', 'stage', 'owner', 'amount', 'source', 'created_at', 'next_contact', 'note', 'lost_reason',
  'platform', 'campaign', 'adset', 'ad_name', 'form_name', 'ad_id', 'form_id', 'external_id', 'custom', 'new_custom',
]
const TYPES: FieldType[] = ['select', 'multiselect', 'text', 'number', 'date']

/** One sheet column: its header and samples, and where its values go. */
export function ColumnRow({ column, fields, onChange }: { column: ColumnMap; fields: CustomField[]; onChange: (c: ColumnMap) => void }) {
  const { t } = useTranslation()
  const set = (patch: Partial<ColumnMap>) => onChange({ ...column, ...patch })
  const pickTarget = (target: string) => {
    const next = target as ImportTarget
    set({ target: next, field_key: next === 'custom' ? column.field_key ?? fields[0]?.key ?? null : null,
      new_label: next === 'new_custom' ? column.new_label ?? column.header : null, new_type: next === 'new_custom' ? column.new_type ?? 'text' : null })
  }
  const targets = TARGETS.filter((x) => x !== 'custom' || fields.length > 0)
  return (
    <tr className={cn('border-t border-foreground/[0.06] align-top', column.target === 'ignore' && 'opacity-60')}>
      <td className="py-1.5 pr-2 text-[12px] font-medium">{column.header}</td>
      <td className="max-w-[220px] py-1.5 pr-2 text-[11px] text-muted-foreground"><span className="line-clamp-2 break-words">{column.samples.join(' · ') || '—'}</span></td>
      <td className="w-[300px] py-1.5">
        <div className="flex flex-wrap gap-1.5">
          <SelectBox value={column.target} onChange={pickTarget} options={targets.map((x) => ({ value: x, label: t(`importer.targets.${x}`) }))} className="h-8 w-[150px] text-xs" />
          {column.target === 'custom' && (
            <SelectBox value={column.field_key ?? ''} onChange={(v) => set({ field_key: v })} options={fields.map((f) => ({ value: f.key, label: f.label }))} className="h-8 w-[140px] text-xs" />
          )}
          {column.target === 'new_custom' && (
            <>
              <Input value={column.new_label ?? ''} onChange={(e) => set({ new_label: e.target.value })} aria-label={t('importer.newField')} maxLength={80} className="h-8 w-[140px] text-xs" />
              <SelectBox value={column.new_type ?? 'text'} onChange={(v) => set({ new_type: v as FieldType })} options={TYPES.map((x) => ({ value: x, label: t(`customFields.types.${x}`) }))} className="h-8 w-[120px] text-xs" />
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
