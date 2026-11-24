import { useTranslation } from 'react-i18next'
import { useAssignableOwners, useMembers } from '@/features/team/useMembers'
import type { Module } from '@/lib/types'
import { InlineField } from './InlineField'
import type { Patch } from './RecordDraft'

/** "Responsible" row, shared by every record card; choices follow the caller's own/team/all scope. */
export function OwnerRow({ module, ownerId, readOnly, toPatch }: { module: Module; ownerId: string | null; readOnly: boolean; toPatch: (v: string) => Patch | null }) {
  const { t } = useTranslation()
  const { owners, allowUnassigned } = useAssignableOwners(module)
  const { memberById } = useMembers()
  return (
    <InlineField label={t('feedFields.owner_id')} raw={ownerId ?? ''} display={ownerId && memberById.get(ownerId)?.full_name} readOnly={readOnly}
      editor={{ kind: 'select', options: owners.map((m) => ({ value: m.user_id, label: m.full_name })), emptyLabel: allowUnassigned ? t('owner.unassigned') : undefined }}
      toPatch={toPatch} />
  )
}
