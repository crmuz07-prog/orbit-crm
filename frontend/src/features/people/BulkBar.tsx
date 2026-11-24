import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Trash2, UserCog, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfirm } from '@/components/common/confirm-provider'
import { IconButton } from '@/components/common/icon-button'
import { SelectBox } from '@/components/common/form-fields'
import { Button } from '@/components/ui/button'
import { useAssignableOwners } from '@/features/team/useMembers'
import { TABLE_MODULE, useAccess } from '@/hooks/useAccess'
import { api } from '@/lib/api'
import { useLabels } from '@/hooks/useLabels'
import type { Stage, TableName } from '@/lib/types'
import { errorMessage } from '@/lib/utils'

interface Props {
  table: Extract<TableName, 'contacts' | 'companies' | 'deals'>
  selected: Set<string>
  onClear: () => void
  /** Deals only: the pipeline's stages, to move the checked deals in one step. */
  stages?: Stage[]
}

/** amoCRM bulk actions on checked rows: hand them to another manager or delete them — each confirmed first. */
export function BulkBar({ table, selected, onClear, stages }: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const confirm = useConfirm()
  const { can } = useAccess()
  const module = TABLE_MODULE[table]!
  const { owners } = useAssignableOwners(module)
  const [owner, setOwner] = useState('')
  const [stage, setStage] = useState('')
  const labels = useLabels()
  const [busy, setBusy] = useState(false)
  const count = selected.size
  if (count === 0) return null

  const run = async (work: (id: string) => Promise<unknown>, done: string) => {
    setBusy(true)
    try {
      await Promise.all([...selected].map(work))
      toast.success(done)
      onClear()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
      void qc.invalidateQueries()
    }
  }
  const assign = async (id: string) => {
    setOwner(id)
    const name = owners.find((o) => o.user_id === id)?.full_name ?? t('owner.unassigned')
    const ok = await confirm({ title: t('people.assignTitle', { count, name }), description: t('people.assignDesc'), confirmLabel: t('people.assign'), tone: 'default' })
    if (ok) await run((rowId) => api.update(table, rowId, { owner_id: id || null }), t('people.assigned', { count }))
    setOwner('')
  }
  const move = async (id: string) => {
    setStage(id)
    const name = labels.stage(stages?.find((s) => s.id === id)?.name ?? '')
    const ok = await confirm({ title: t('people.moveTitle', { count, name }), description: t('people.moveDesc'), confirmLabel: t('people.moveAction'), tone: 'default' })
    if (ok) await run((rowId) => api.update('deals', rowId, { stage_id: id }), t('people.moved', { count }))
    setStage('')
  }
  const remove = async () => {
    const ok = await confirm({ title: t('people.deleteTitle', { count }), description: t(`people.deleteDesc.${table}`), confirmLabel: t('common.delete'), irreversible: true })
    if (ok) await run((rowId) => api.remove(table, rowId), t('people.deleted', { count }))
  }

  return (
    // Floats over the page bottom (Linear / Gmail): appearing must not push the table and move rows under the cursor.
    <div role="toolbar" aria-label={t('people.selected', { count })}
      className="glass-strong fixed bottom-4 left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center gap-2 rounded-xl px-3 py-2 shadow-xl animate-in fade-in-0 slide-in-from-bottom-2">
      <span className="text-[13px] font-medium">{t('people.selected', { count })}</span>
      {stages && can(module, 'edit') && (
        <SelectBox value={stage} onChange={move} emptyLabel={t('people.moveTo')} className="h-8 w-48"
          options={stages.map((s) => ({ value: s.id, label: labels.stage(s.name) }))} />
      )}
      {can(module, 'edit') && (
        <span className="flex items-center gap-1.5">
          <UserCog className="size-4 text-muted-foreground" />
          <SelectBox value={owner} onChange={assign} emptyLabel={t('people.assignTo')} className="h-8 w-44"
            options={owners.map((o) => ({ value: o.user_id, label: o.full_name }))} />
        </span>
      )}
      {can(module, 'delete') && <Button size="sm" variant="ghost" className="text-rose-600" disabled={busy} onClick={remove}><Trash2 /> {t('common.delete')}</Button>}
      <IconButton label={t('people.clear')} className="size-7" onClick={onClear}><X /></IconButton>
    </div>
  )
}
