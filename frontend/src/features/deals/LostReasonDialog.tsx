import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { useRows } from '@/hooks/useData'
import { LOST_REASONS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
}

/** Pipedrive asks "why was it lost?" — capturing it keeps win/loss analysis honest. */
export function LostReasonDialog({ open, onOpenChange, onConfirm }: Props) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const { data: custom } = useRows('lost_reasons')
  // The workspace's own list (Settings) replaces the built-in reasons, so reports group by the same names.
  const reasons = custom?.length ? custom.map((r) => r.name) : LOST_REASONS.map((key) => t(`enums.lostReason.${key}`))

  const confirm = () => {
    onConfirm([reason, notes.trim()].filter(Boolean).join(' — ') || t('deals.notSpecified'))
    setReason('')
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('deals.lostTitle')}</DialogTitle>
          <DialogDescription>{t('deals.lostDesc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-1.5">
          {reasons.map((label) => {
            return (
              <motion.button
                key={label}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setReason(label)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  reason === label ? 'border-rose-300 bg-rose-500/10 text-rose-700 dark:border-rose-500/40 dark:text-rose-300' : 'glass-subtle text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </motion.button>
            )
          })}
        </div>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('deals.lostNotes')} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button variant="destructive" onClick={confirm}>{t('deals.lostConfirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
