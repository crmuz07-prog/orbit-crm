import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useRemoveRow, useUpdateRow } from '@/hooks/useData'
import type { Activity } from '@/lib/types'

/** Complete / pin / edit / delete — shared by the timeline, the activities page, calls and the dashboard. */
export function useActivityActions() {
  const update = useUpdateRow('activities')
  const remove = useRemoveRow('activities')
  const openModal = useEntityModal()
  const { t } = useTranslation()

  return {
    toggleDone: (a: Activity) => {
      update.mutate({ id: a.id, patch: { done: !a.done } })
      if (!a.done) toast.success(t('activities.markedDone'))
    },
    togglePin: (a: Activity) => update.mutate({ id: a.id, patch: { pinned: !a.pinned } }),
    edit: (a: Activity) => openModal({ kind: 'activity', initial: a }),
    remove: (a: Activity) => remove.mutate(a.id, { onSuccess: () => toast(t('activities.deleted')) }),
  }
}
