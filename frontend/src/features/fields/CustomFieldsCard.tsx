import { useState } from 'react'
import { ListPlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { useRemoveRow } from '@/hooks/useData'
import type { CustomField } from '@/lib/types'
import { CustomFieldDialog } from './CustomFieldDialog'
import { ValueChip } from './FieldChips'
import { useCustomFields } from './useFields'

/** Settings: the workspace's deal fields (amoCRM "Поля"). */
export function CustomFieldsCard() {
  const { t } = useTranslation()
  const fields = useCustomFields()
  const remove = useRemoveRow('custom_fields')
  const [editing, setEditing] = useState<CustomField | null>(null)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<CustomField | null>(null)
  const edit = (f: CustomField | null) => { setEditing(f); setOpen(true) }

  return (
    <Card>
      <CardHeader title={t('customFields.title')} description={t('customFields.description')}
        action={<Button size="sm" variant="outline" onClick={() => edit(null)}><Plus /> {t('customFields.add')}</Button>} />
      {fields.length === 0 ? (
        <p className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground"><ListPlus className="size-4" /> {t('customFields.empty')}</p>
      ) : (
        <ul className="divide-y divide-foreground/[0.06]">
          {fields.map((f) => (
            <li key={f.id} className="flex items-start gap-3 px-4 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{f.label} <span className="text-[11px] font-normal text-muted-foreground">· {t(`customFields.types.${f.type}`)}</span></p>
                {f.options.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">{f.options.slice(0, 12).map((o) => <ValueChip key={o} value={o} warn={f.warn_options.includes(o)} />)}</div>
                )}
              </div>
              <Button size="icon" variant="ghost" aria-label={t('common.edit')} onClick={() => edit(f)}><Pencil /></Button>
              <Button size="icon" variant="ghost" aria-label={t('common.delete')} onClick={() => setDeleting(f)}><Trash2 /></Button>
            </li>
          ))}
        </ul>
      )}
      <CustomFieldDialog field={editing} open={open} onOpenChange={setOpen} position={fields.length} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={t('customFields.deleteTitle', { name: deleting?.label ?? '' })}
        description={t('customFields.deleteDesc')}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => { toast.success(t('customFields.deleted')); setDeleting(null) } })} />
    </Card>
  )
}
