import { TABLE_MODULE, useAccess } from '@/hooks/useAccess'
import type { TableMap, TableName } from '@/lib/types'
import type { Patch } from './RecordDraft'

type Kind = 'text' | 'number'

/** Builds the patch for one property from an inline field's value ("" clears it); also says whether the caller may edit. */
export function useSaveField<K extends TableName>(table: K) {
  const { can } = useAccess()
  const save = (field: keyof TableMap[K] & string, kind: Kind = 'text') => (value: string): Patch | null => {
    const parsed = value === '' ? null : kind === 'number' ? Number(value) : value
    if (kind === 'number' && parsed !== null && Number.isNaN(parsed)) return null
    return { [field]: parsed }
  }
  return { save, readOnly: !can(TABLE_MODULE[table], 'edit') }
}
