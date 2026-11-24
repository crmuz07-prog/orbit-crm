import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type Draft } from '@/lib/api'
import type { TableMap, TableName } from '@/lib/types'
import { byId, errorMessage } from '@/lib/utils'
import { TABLE_MODULE, useAccess } from './useAccess'

const DASHBOARD = ['dashboard'] as const

// Derived server views that depend on a table and must be refetched with it.
const DEPENDENTS: Partial<Record<TableName, string[][]>> = { activities: [['reminders'], ['calls', 'stats']] }

const refresh = (qc: QueryClient, table: TableName) =>
  Promise.all([[table], [...DASHBOARD], ...(DEPENDENTS[table] ?? [])].map((queryKey) => qc.invalidateQueries({ queryKey })))

const notifyError = (e: unknown) => toast.error(errorMessage(e))

/** Tables the caller may not view are not requested at all (they read as empty). */
export function useRows<K extends TableName>(table: K) {
  const { can } = useAccess()
  return useQuery({ queryKey: [table], queryFn: () => api.list(table), enabled: can(TABLE_MODULE[table], 'view') })
}

export function useDashboard() {
  const { can } = useAccess()
  return useQuery({ queryKey: DASHBOARD, queryFn: api.dashboard, enabled: can('reports', 'view') })
}

export function useCreateRow<K extends TableName>(table: K) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (draft: Draft<K>) => api.create(table, draft),
    onSuccess: () => refresh(qc, table),
    onError: notifyError,
  })
}

/** Optimistic: the cache is patched immediately so drags and toggles feel instant. */
export function useUpdateRow<K extends TableName>(table: K) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Draft<K> }) => api.update(table, id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: [table] })
      const previous = qc.getQueryData<TableMap[K][]>([table])
      const now = new Date().toISOString()
      qc.setQueryData<TableMap[K][]>([table], (rows) => rows?.map((r) => (r.id === id ? { ...r, ...patch, updated_at: now } : r)))
      return { previous }
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData([table], ctx.previous)
      notifyError(e)
    },
    onSettled: () => refresh(qc, table),
  })
}

export function useRemoveRow(table: TableName) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.remove(table, id),
    // Deletes unlink references (ON DELETE SET NULL), so every table may have changed.
    onSuccess: () => qc.invalidateQueries(),
    onError: notifyError,
  })
}

/** All CRM tables plus id lookups. Workspace datasets are small enough to join on the client. */
export function useCrm() {
  const stages = useRows('pipeline_stages')
  const companies = useRows('companies')
  const contacts = useRows('contacts')
  const deals = useRows('deals')
  const activities = useRows('activities')
  const isLoading = [stages, companies, contacts, deals, activities].some((q) => q.isLoading)

  return useMemo(
    () => ({
      isLoading,
      stages: stages.data ?? [],
      companies: companies.data ?? [],
      contacts: contacts.data ?? [],
      deals: deals.data ?? [],
      activities: activities.data ?? [],
      stageById: byId(stages.data),
      companyById: byId(companies.data),
      contactById: byId(contacts.data),
      dealById: byId(deals.data),
    }),
    [isLoading, stages.data, companies.data, contacts.data, deals.data, activities.data],
  )
}
