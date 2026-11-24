import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/AuthProvider'
import { PersonAvatar } from '@/components/common/avatars'
import type { Column } from '@/components/common/data-table'
import { SelectField } from '@/components/common/form-fields'
import type { Module } from '@/lib/types'
import { useAssignableOwners, useMembers } from './useMembers'

/** Record owner picker for entity forms; `""` means unassigned. */
export function OwnerField({ module, value, onChange }: { module: Module; value: string; onChange: (id: string) => void }) {
  const { t } = useTranslation()
  const { owners, allowUnassigned } = useAssignableOwners(module)
  const { memberById } = useMembers()
  // Keep the current owner selectable even when the caller couldn't pick them (e.g. a teammate's record).
  const current = value && !owners.some((o) => o.user_id === value) ? memberById.get(value) : undefined
  const options = [...owners, ...(current ? [current] : [])].map((m) => ({ value: m.user_id, label: m.full_name }))
  return <SelectField label={t('owner.label')} value={value} onChange={onChange} options={options} emptyLabel={allowUnassigned ? t('owner.unassigned') : undefined} />
}

/** Owner avatar + name for tables and record headers. */
export function OwnerCell({ ownerId }: { ownerId: string | null }) {
  const { t } = useTranslation()
  const { memberById } = useMembers()
  const owner = ownerId ? memberById.get(ownerId) : undefined
  if (!owner) return <span className="text-muted-foreground">{t('owner.unassigned')}</span>
  return (
    <span className="flex items-center gap-2">
      <PersonAvatar name={owner.full_name} size="xs" />
      <span className="truncate">{owner.full_name}</span>
    </span>
  )
}

export const useMyId = () => useAuth().session?.user.id ?? ''

/** A form opened without an existing record id is a create form (new records default to their creator). */
export const isNew = (row?: { id?: string }) => !row?.id

/** The same "Owner" column for every record table (sortable by name). */
export function useOwnerColumn<T extends { owner_id: string | null }>(): Column<T> {
  const { t } = useTranslation()
  const { memberById } = useMembers()
  return {
    key: 'owner', header: t('owner.label'),
    sortValue: (row) => (row.owner_id && memberById.get(row.owner_id)?.full_name) || '',
    cell: (row) => <OwnerCell ownerId={row.owner_id} />,
  }
}
