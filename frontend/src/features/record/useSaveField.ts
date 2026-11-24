import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { TABLE_MODULE, useAccess } from '@/hooks/useAccess'
import { useUpdateRow } from '@/hooks/useData'
import type { TableMap, TableName } from '@/lib/types'

type Kind = 'text' | 'number'

/** Saves one property of a record from an inline field ("" clears it); also says whether the caller may edit. */
export function useSaveField<K extends TableName>(table: K, id: string) {
  const { t } = useTranslation()
  const update = useUpdateRow(table)
  const { can } = useAccess()
  const save = (field: keyof TableMap[K], kind: Kind = 'text') => (value: string) => {
    const parsed = value === '' ? null : kind === 'number' ? Number(value) : value
    if (kind === 'number' && parsed !== null && Number.isNaN(parsed)) return
    update.mutate({ id, patch: { [field]: parsed } as Partial<TableMap[K]> }, { onSuccess: () => toast.success(t('card.saved')) })
  }
  return { save, readOnly: !can(TABLE_MODULE[table], 'edit') }
}
