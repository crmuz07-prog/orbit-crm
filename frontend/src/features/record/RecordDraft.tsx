import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useUpdateRow } from '@/hooks/useData'
import { useBeforeUnload } from '@/hooks/useUnsaved'
import type { TableMap, TableName } from '@/lib/types'

export type Patch = Record<string, unknown>
type Staged = { value: string; patch: Patch }

interface Draft {
  staged: (key: string) => Staged | undefined
  stage: (key: string, change: Staged | null) => void
}

const DraftContext = createContext<Draft | null>(null)

export function useRecordDraft() {
  const draft = useContext(DraftContext)
  if (!draft) throw new Error('InlineField must be inside <RecordDraftProvider>')
  return draft
}

/** Field patches combined; custom-field values are merged over the record's current ones, not replaced. */
function combine(changes: Staged[], current: Patch): Patch {
  const patch: Patch = {}
  for (const { patch: p } of changes) {
    for (const [key, value] of Object.entries(p)) {
      patch[key] = key === 'custom' ? { ...((patch.custom ?? current.custom ?? {}) as object), ...(value as object) } : value
    }
  }
  return patch
}

/**
 * One confirmation for every change on a record card (amoCRM): edited fields are only staged and marked; a single bar
 * saves them all in one request, or cancels them all.
 */
export function RecordDraftProvider<K extends TableName>({ table, record, children }: { table: K; record: TableMap[K]; children: ReactNode }) {
  const { t } = useTranslation()
  const update = useUpdateRow(table)
  const [changes, setChanges] = useState<Record<string, Staged>>({})
  const count = Object.keys(changes).length
  useBeforeUnload(count > 0)

  const stage = useCallback((key: string, change: Staged | null) => setChanges((all) => {
    const { [key]: _old, ...rest } = all
    return change ? { ...rest, [key]: change } : rest
  }), [])
  const draft = useMemo<Draft>(() => ({ staged: (key) => changes[key], stage }), [changes, stage])

  const save = () => {
    const patch = combine(Object.values(changes), record as unknown as Patch)
    update.mutate({ id: record.id, patch: patch as Partial<TableMap[K]> }, {
      onSuccess: () => {
        setChanges({})
        toast.success(t('card.saved'))
      },
    })
  }

  return (
    <DraftContext.Provider value={draft}>
      {children}
      {count > 0 && (
        <div className="sticky bottom-0 z-10 -mx-px mt-2 flex items-center gap-2 border-t border-amber-400/40 bg-background/95 px-4 py-2 backdrop-blur-sm">
          <span className="min-w-0 flex-1 text-[12px] font-medium text-amber-700 dark:text-amber-400">{t('unsaved.changes', { count })}</span>
          <Button size="sm" variant="outline" onClick={() => setChanges({})}>{t('unsaved.cancel')}</Button>
          <Button size="sm" onClick={save} disabled={update.isPending}>{t('unsaved.save')}</Button>
        </div>
      )}
    </DraftContext.Provider>
  )
}
