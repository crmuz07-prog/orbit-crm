import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { CallLog } from '@/lib/types'
import { errorMessage } from '@/lib/utils'

export const CALL_QUERIES = { stats: ['calls', 'stats'], reminders: ['reminders'] } as const

export function useLogCall() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (call: CallLog) => api.logCall(call),
    onSuccess: () => {
      toast.success(t('calls.saved'))
      for (const key of [['activities'], ['dashboard'], CALL_QUERIES.stats, CALL_QUERIES.reminders]) qc.invalidateQueries({ queryKey: key })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
}
