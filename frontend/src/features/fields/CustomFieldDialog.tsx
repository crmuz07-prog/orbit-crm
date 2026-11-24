import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { SelectField, TextField } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GuardedDialog } from '@/components/common/guarded-dialog'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateRow, useUpdateRow } from '@/hooks/useData'
import type { CustomField, FieldType } from '@/lib/types'
import { cn } from '@/lib/utils'

const TYPES: FieldType[] = ['select', 'multiselect', 'text', 'number', 'date']
const lines = (text: string) => [...new Set(text.split('\n').map((l) => l.trim()).filter(Boolean))]

/** Create or edit a deal field: name, type, list options and which options are flagged in red. */
export function CustomFieldDialog({ field, open, onOpenChange, position }: { field: CustomField | null; open: boolean; onOpenChange: (o: boolean) => void; position: number }) {
  const { t } = useTranslation()
  const create = useCreateRow('custom_fields')
  const update = useUpdateRow('custom_fields')
  const [label, setLabel] = useState('')
  const [type, setType] = useState<FieldType>('select')
  const [options, setOptions] = useState('')
  const [warn, setWarn] = useState<string[]>([])
  useEffect(() => {
    if (!open) return
    setLabel(field?.label ?? '')
    setType(field?.type ?? 'select')
    setOptions((field?.options ?? []).join('\n'))
    setWarn(field?.warn_options ?? [])
  }, [open, field])
  const isList = type === 'select' || type === 'multiselect'
  const dirty = open && (label !== (field?.label ?? '') || type !== (field?.type ?? 'select') || options !== (field?.options ?? []).join('\n')
    || warn.join() !== (field?.warn_options ?? []).join())
  const list = lines(options)
  const submit = () => {
    if (!label.trim()) return
    const draft = { label: label.trim(), type, options: isList ? list : [], warn_options: isList ? warn.filter((w) => list.includes(w)) : [] }
    // Saved: close without the unsaved-changes prompt.
    const done = { onSuccess: () => { toast.success(t('customFields.saved')); onOpenChange(false) } }
    if (field) update.mutate({ id: field.id, patch: draft }, done)
    else create.mutate({ ...draft, position }, done)
  }

  return (
    <GuardedDialog open={open} onOpenChange={onOpenChange} dirty={dirty}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{field ? field.label : t('customFields.add')}</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <TextField label={t('customFields.label')} value={label} onChange={setLabel} autoFocus maxLength={80} />
          {/* The type of an existing field is fixed: changing it would silently reinterpret stored values. */}
          {!field && <SelectField label={t('customFields.type')} value={type} onChange={(v) => setType(v as FieldType)} options={TYPES.map((v) => ({ value: v, label: t(`customFields.types.${v}`) }))} />}
          {isList && (
            <div className="space-y-1.5">
              <Label>{t('customFields.options')} <span className="font-normal text-muted-foreground">· {t('customFields.optionsHint')}</span></Label>
              <Textarea value={options} onChange={(e) => setOptions(e.target.value)} rows={5} />
            </div>
          )}
          {isList && list.length > 0 && (
            <div className="space-y-1.5">
              <Label>{t('customFields.warn')}</Label>
              <p className="text-[11px] text-muted-foreground">{t('customFields.warnHint')}</p>
              <div className="flex flex-wrap gap-1">
                {list.map((o) => (
                  <button key={o} type="button" aria-pressed={warn.includes(o)} onClick={() => setWarn((w) => (w.includes(o) ? w.filter((x) => x !== o) : [...w, o]))}
                    className={cn('rounded-md px-1.5 py-0.5 text-xs', warn.includes(o) ? 'bg-rose-500/15 font-medium text-rose-700 dark:text-rose-300' : 'bg-foreground/[0.05] text-muted-foreground')}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={!label.trim() || create.isPending || update.isPending}>{t('common.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </GuardedDialog>
  )
}
