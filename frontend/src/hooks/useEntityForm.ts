import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Draft } from '@/lib/api'
import type { TableMap, TableName } from '@/lib/types'
import { useCreateRow, useUpdateRow } from './useData'

interface Options<K extends TableName, F> {
  table: K
  label: string
  initial?: Partial<TableMap[K]>
  defaults: (initial?: Partial<TableMap[K]>) => F
  toPayload: (form: F) => Draft<K> | string
  onDone: (row?: TableMap[K]) => void
}

/**
 * Shared state + submit logic for every create/edit form.
 * `toPayload` returns either the payload or a validation message to show.
 */
export function useEntityForm<K extends TableName, F extends object>({ table, label, initial, defaults, toPayload, onDone }: Options<K, F>) {
  const { t } = useTranslation()
  const [form, setForm] = useState<F>(() => defaults(initial))
  const create = useCreateRow(table)
  const update = useUpdateRow(table)
  const isEdit = !!initial?.id

  const set = <Key extends keyof F>(key: Key, value: F[Key]) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const payload = toPayload(form)
    if (typeof payload === 'string') return toast.error(payload)
    if (isEdit) {
      await update.mutateAsync({ id: initial!.id!, patch: payload })
      toast.success(t('common.updated', { entity: label }))
      return onDone()
    }
    const row = await create.mutateAsync(payload)
    toast.success(t('common.created', { entity: label }))
    onDone(row)
  }

  return { form, set, setForm, submit, isEdit, busy: create.isPending || update.isPending }
}
