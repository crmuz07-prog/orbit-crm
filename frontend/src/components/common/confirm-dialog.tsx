import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** "danger" (red, default) for destructive steps, "default" for consequential but safe ones (sign out, mark won). */
  tone?: 'danger' | 'default'
  /** Adds "This cannot be undone" — off for steps that can be reversed. */
  irreversible?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, cancelLabel, tone = 'danger', irreversible = true, onConfirm }: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="space-y-1.5">
          <AlertDialogTitle className="text-base font-semibold">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}{irreversible && <> {t('common.cannotUndo')}</>}</AlertDialogDescription>
        </div>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel>{cancelLabel ?? t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant={tone === 'default' ? 'default' : 'destructive'}>{confirmLabel ?? t('common.delete')}</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
