import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useRemoveRow, useUpdateRow } from '@/hooks/useData'
import { useTaskResult } from '@/features/tasks/TaskResultProvider'
import { isTask } from '@/lib/tasks'
import type { Activity } from '@/lib/types'
import { useSubject } from './useSubject'

/** Complete / pin / edit / delete — shared by the timeline, the activities page, calls and the dashboard. */
export function useActivityActions() {
  const update = useUpdateRow('activities')
  const remove = useRemoveRow('activities')
  const openModal = useEntityModal()
  const { t } = useTranslation()
  const askResult = useTaskResult()
  const subject = useSubject()

  return {
    /** Completing a task asks for its result (Enter alone completes without one); reopening clears it. */
    toggleDone: async (a: Activity) => {
      if (a.done) return update.mutate({ id: a.id, patch: { done: false, result: null } })
      const result = isTask(a) ? await askResult(subject(a)) : ''
      if (result === null) return
      update.mutate({ id: a.id, patch: { done: true, result: result || null } }, { onSuccess: () => toast.success(t('activities.markedDone')) })
    },
    togglePin: (a: Activity) => update.mutate({ id: a.id, patch: { pinned: !a.pinned } }),
    edit: (a: Activity) => openModal({ kind: 'activity', initial: a }),
    remove: (a: Activity) => remove.mutate(a.id, { onSuccess: () => toast(t('activities.deleted')) }),
  }
}
