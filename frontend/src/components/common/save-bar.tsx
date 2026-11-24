import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { IconButton } from './icon-button'

/** ✓ save / ✕ cancel and a "not saved" mark: how every in-place edit asks before keeping a change. */
export function SaveBar({ dirty, onSave, onCancel, className }: { dirty: boolean; onSave: () => void; onCancel: () => void; className?: string }) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <IconButton label={t('unsaved.save')} className="size-7 text-emerald-600" disabled={!dirty} onClick={onSave}><Check /></IconButton>
      <IconButton label={t('unsaved.cancel')} className="size-7" onClick={onCancel}><X /></IconButton>
      {dirty && <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">{t('unsaved.badge')}</span>}
    </div>
  )
}
