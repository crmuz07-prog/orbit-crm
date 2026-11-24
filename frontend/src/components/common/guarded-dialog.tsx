import { useCallback, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@/components/ui/dialog'
import { UnsavedContext } from '@/hooks/useUnsaved'
import { ConfirmDialog } from './confirm-dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Unsaved changes known by the caller; forms inside can also report theirs (useReportUnsaved). */
  dirty?: boolean
  children: ReactNode
}

/**
 * A dialog that never loses typed work silently: closing it (Esc, ✕, outside click) with unsaved changes asks first.
 * Saving closes it through `onOpenChange(false)` from the caller's own success handler, so no prompt then.
 */
export function GuardedDialog({ open, onOpenChange, dirty = false, children }: Props) {
  const { t } = useTranslation()
  const [reported, setReported] = useState(false)
  const [asking, setAsking] = useState(false)
  const report = useCallback((d: boolean) => setReported(d), [])
  const unsaved = dirty || reported

  const change = (next: boolean) => {
    if (!next && unsaved) return setAsking(true)
    onOpenChange(next)
  }
  const discard = () => {
    setAsking(false)
    setReported(false)
    onOpenChange(false)
  }

  return (
    <UnsavedContext.Provider value={report}>
      <Dialog open={open} onOpenChange={change}>{children}</Dialog>
      <ConfirmDialog open={asking} onOpenChange={setAsking} title={t('unsaved.title')} description={t('unsaved.description')}
        confirmLabel={t('unsaved.discard')} cancelLabel={t('unsaved.keep')} onConfirm={discard} />
    </UnsavedContext.Provider>
  )
}
